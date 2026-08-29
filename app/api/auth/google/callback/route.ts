import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeGoogleCode, getGoogleUserInfo } from "@/lib/auth/google";
import { setSessionCookie } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users, workspaces, memberships, roles, invitations } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { recordAuditLog } from "@/lib/permissions/server-guards";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error || !code) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(`${appUrl}/login?error=google_cancelled`);
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("google_oauth_state")?.value;
  const returnUrl = cookieStore.get("google_oauth_return")?.value || "/dashboard";

  cookieStore.delete("google_oauth_state");
  cookieStore.delete("google_oauth_return");

  if (!savedState || savedState !== state) {
    console.error("Invalid Google OAuth state token");
    return NextResponse.redirect(`${appUrl}/login?error=invalid_state`);
  }

  // 1. Exchange authorization code with Google
  const tokens = await exchangeGoogleCode(code);
  if (!tokens?.access_token) {
    return NextResponse.redirect(`${appUrl}/login?error=token_exchange_failed`);
  }

  // 2. Fetch Google profile
  const profile = await getGoogleUserInfo(tokens.access_token);
  if (!profile || !profile.email) {
    return NextResponse.redirect(`${appUrl}/login?error=profile_fetch_failed`);
  }

  const email = profile.email.toLowerCase().trim();
  const name = profile.name || email.split("@")[0];
  const avatarUrl = profile.picture || null;

  // 3. Find or create user in database
  let userList = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let userId: string;

  if (userList.length > 0) {
    userId = userList[0].id;
    // Update avatar and name if changed
    await db
      .update(users)
      .set({
        name,
        avatarUrl: avatarUrl || userList[0].avatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  } else {
    userId = crypto.randomUUID();
    await db.insert(users).values({
      id: userId,
      email,
      name,
      avatarUrl,
    });
  }

  // 4. Check for pending workspace invitations for this email
  const pendingInvites = await db
    .select({
      id: invitations.id,
      workspaceId: invitations.workspaceId,
      roleId: invitations.roleId,
      roleName: roles.name,
    })
    .from(invitations)
    .innerJoin(roles, eq(invitations.roleId, roles.id))
    .where(
      and(
        eq(invitations.email, email),
        eq(invitations.status, "pending"),
        gt(invitations.expiresAt, new Date())
      )
    );

  for (const inv of pendingInvites) {
    // Add active membership
    await db.insert(memberships).values({
      id: crypto.randomUUID(),
      workspaceId: inv.workspaceId,
      userId,
      roleId: inv.roleId,
      status: "active",
    });

    // Mark invitation as accepted
    await db
      .update(invitations)
      .set({ status: "accepted" })
      .where(eq(invitations.id, inv.id));
  }

  // 5. Get active workspace membership
  let memberList = await db
    .select({
      workspaceId: memberships.workspaceId,
      roleName: roles.name,
    })
    .from(memberships)
    .innerJoin(roles, eq(memberships.roleId, roles.id))
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.status, "active")
      )
    )
    .limit(1);

  // If no workspace membership exists yet (new direct user sign up)
  if (memberList.length === 0) {
    const workspaceId = crypto.randomUUID();
    const workspaceName = `${name}'s Workspace`;
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Math.floor(1000 + Math.random() * 9000)}`;

    await db.insert(workspaces).values({
      id: workspaceId,
      name: workspaceName,
      slug,
    });

    await db.insert(memberships).values({
      id: crypto.randomUUID(),
      workspaceId,
      userId,
      roleId: "role_admin",
      status: "active",
    });

    memberList = [{ workspaceId, roleName: "admin" }];
  }

  const activeMember = memberList[0];

  // 6. Issue encrypted JWT session cookie
  await setSessionCookie({
    userId,
    email,
    name,
    workspaceId: activeMember.workspaceId,
    role: activeMember.roleName,
    avatarUrl,
  });

  await recordAuditLog({
    workspaceId: activeMember.workspaceId,
    actorId: userId,
    actorEmail: email,
    action: "user.google_login",
    entityType: "USER",
    entityId: userId,
    afterData: { name, email, avatarUrl },
  });

  return NextResponse.redirect(`${appUrl}${returnUrl}`);
}
