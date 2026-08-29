"use server";

import { db } from "@/lib/db";
import { users, memberships, roles, workspaces, invitations, authOtps } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/permissions/server-guards";
import { sendOtpEmail } from "@/lib/email/resend";
import { redirect } from "next/navigation";

/**
 * Request 6-Digit Email OTP (Pure Passwordless Sign-In / Sign-Up / Invite)
 */
export async function requestOtpAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const type = ((formData.get("type") as string) || "login").trim();

  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid email address." };
  }

  // Generate 6-digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes

  // Remove existing pending OTPs for this email to prevent collisions
  await db
    .delete(authOtps)
    .where(eq(authOtps.email, email));

  // Insert new OTP record
  await db.insert(authOtps).values({
    id: otpId,
    email,
    otp,
    type,
    expiresAt,
  });

  // Check if user has a name in DB
  const existingUser = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const userName = existingUser[0]?.name;

  // Send via Resend
  await sendOtpEmail(email, otp, userName);

  return {
    success: true,
    email,
    devOtp: process.env.NODE_ENV === "development" ? otp : undefined,
  };
}

/**
 * Verify 6-Digit Email OTP and Complete Login / Signup / Invite Acceptance
 */
export async function verifyOtpAction({
  email,
  otp,
  name,
  workspaceName,
  inviteToken,
  returnUrl = "/dashboard",
}: {
  email: string;
  otp: string;
  name?: string;
  workspaceName?: string;
  inviteToken?: string;
  returnUrl?: string;
}) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = otp.trim();

  if (!cleanEmail || !cleanOtp) {
    return { error: "Email and 6-digit verification code are required." };
  }

  // Validate OTP in database
  const validOtpList = await db
    .select()
    .from(authOtps)
    .where(
      and(
        eq(authOtps.email, cleanEmail),
        eq(authOtps.otp, cleanOtp),
        gt(authOtps.expiresAt, new Date())
      )
    )
    .limit(1);

  if (validOtpList.length === 0) {
    return { error: "Invalid or expired verification code. Please request a new code." };
  }

  // Delete consumed OTP
  await db
    .delete(authOtps)
    .where(eq(authOtps.id, validOtpList[0].id));

  // 1. Find or create user
  let userList = await db
    .select()
    .from(users)
    .where(eq(users.email, cleanEmail))
    .limit(1);

  let userId: string;
  let userName: string;
  let userAvatar: string | null = null;

  if (userList.length > 0) {
    userId = userList[0].id;
    userName = userList[0].name;
    userAvatar = userList[0].avatarUrl;
    if (name && name.trim() && userList[0].name !== name.trim()) {
      userName = name.trim();
      await db.update(users).set({ name: userName }).where(eq(users.id, userId));
    }
  } else {
    userId = crypto.randomUUID();
    userName = name?.trim() || cleanEmail.split("@")[0];
    await db.insert(users).values({
      id: userId,
      email: cleanEmail,
      name: userName,
    });
  }

  // 2. If specific inviteToken provided or pending invites exist, accept them
  let specificInviteWorkspaceId: string | null = null;
  let specificInviteRoleName: string | null = null;

  if (inviteToken) {
    const inv = await db
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
          eq(invitations.token, inviteToken),
          eq(invitations.status, "pending"),
          gt(invitations.expiresAt, new Date())
        )
      )
      .limit(1);

    if (inv.length > 0) {
      await db.insert(memberships).values({
        id: crypto.randomUUID(),
        workspaceId: inv[0].workspaceId,
        userId,
        roleId: inv[0].roleId,
        status: "active",
      });

      await db
        .update(invitations)
        .set({ status: "accepted" })
        .where(eq(invitations.id, inv[0].id));

      specificInviteWorkspaceId = inv[0].workspaceId;
      specificInviteRoleName = inv[0].roleName;
    }
  }

  // Also auto-accept any other pending workspace invitations for this email
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
        eq(invitations.email, cleanEmail),
        eq(invitations.status, "pending"),
        gt(invitations.expiresAt, new Date())
      )
    );

  for (const inv of pendingInvites) {
    await db.insert(memberships).values({
      id: crypto.randomUUID(),
      workspaceId: inv.workspaceId,
      userId,
      roleId: inv.roleId,
      status: "active",
    });

    await db
      .update(invitations)
      .set({ status: "accepted" })
      .where(eq(invitations.id, inv.id));

    if (!specificInviteWorkspaceId) {
      specificInviteWorkspaceId = inv.workspaceId;
      specificInviteRoleName = inv.roleName;
    }
  }

  // 3. Find active membership or create new workspace
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

  if (memberList.length === 0) {
    const wsId = crypto.randomUUID();
    const wsName = workspaceName?.trim() || `${userName}'s Workspace`;
    const slug = `${wsName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Math.floor(1000 + Math.random() * 9000)}`;

    await db.insert(workspaces).values({
      id: wsId,
      name: wsName,
      slug,
    });

    await db.insert(memberships).values({
      id: crypto.randomUUID(),
      workspaceId: wsId,
      userId,
      roleId: "role_admin",
      status: "active",
    });

    memberList = [{ workspaceId: wsId, roleName: "admin" }];
  }

  const activeMember = memberList[0];

  // 4. Issue encrypted session cookie
  await setSessionCookie({
    userId,
    email: cleanEmail,
    name: userName,
    workspaceId: specificInviteWorkspaceId || activeMember.workspaceId,
    role: specificInviteRoleName || activeMember.roleName,
    avatarUrl: userAvatar,
  });

  await recordAuditLog({
    workspaceId: specificInviteWorkspaceId || activeMember.workspaceId,
    actorId: userId,
    actorEmail: cleanEmail,
    action: "user.otp_login",
    entityType: "USER",
    entityId: userId,
  });

  return { success: true, returnUrl: returnUrl || "/dashboard" };
}

/**
 * Demo Login Helper for Rapid Persona Testing
 */
export async function demoLoginAction(roleType: "admin" | "researcher") {
  const primaryEmail =
    roleType === "admin"
      ? "admin@revlo.demo"
      : "researcher@revlo.demo";
  const legacyEmail =
    roleType === "admin"
      ? "admin@prospectforge.demo"
      : "researcher@prospectforge.demo";

  let userList = await db
    .select()
    .from(users)
    .where(eq(users.email, primaryEmail))
    .limit(1);

  if (userList.length === 0) {
    userList = await db
      .select()
      .from(users)
      .where(eq(users.email, legacyEmail))
      .limit(1);
  }

  if (userList.length === 0) {
    return { error: "Demo user not found. Please run seed script." };
  }

  const user = userList[0];

  const memberList = await db
    .select({
      workspaceId: memberships.workspaceId,
      roleName: roles.name,
    })
    .from(memberships)
    .innerJoin(roles, eq(memberships.roleId, roles.id))
    .where(
      and(
        eq(memberships.userId, user.id),
        eq(memberships.status, "active")
      )
    )
    .limit(1);

  if (memberList.length === 0) {
    return { error: "Demo membership not found." };
  }

  const member = memberList[0];

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    workspaceId: member.workspaceId,
    role: member.roleName,
    avatarUrl: user.avatarUrl,
  });

  redirect("/dashboard");
}

/**
 * Logout User & Clear Session
 */
export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
