"use server";

import { db } from "@/lib/db";
import { users, memberships, roles, workspaces } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/permissions/server-guards";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const userList = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (userList.length === 0) {
    return { error: "Invalid credentials" };
  }

  const user = userList[0];
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { error: "Invalid credentials" };
  }

  // Get user's primary active membership
  const memberList = await db
    .select({
      workspaceId: memberships.workspaceId,
      roleName: roles.name,
      status: memberships.status,
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
    return { error: "No active workspace membership found for this user." };
  }

  const member = memberList[0];

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    workspaceId: member.workspaceId,
    role: member.roleName,
  });

  await recordAuditLog({
    workspaceId: member.workspaceId,
    actorId: user.id,
    actorEmail: user.email,
    action: "user.login",
    entityType: "USER",
    entityId: user.id,
  });

  redirect("/dashboard");
}

export async function demoLoginAction(roleType: "admin" | "researcher") {
  const email =
    roleType === "admin"
      ? "admin@prospectforge.demo"
      : "researcher@prospectforge.demo";

  const userList = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

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
  });

  redirect("/dashboard");
}

export async function signupAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const workspaceName = (formData.get("workspaceName") as string)?.trim() || "My Workspace";

  if (!name || !email || !password) {
    return { error: "All fields are required" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    return { error: "User already exists with this email" };
  }

  const userId = crypto.randomUUID();
  const workspaceId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  const slug = workspaceName.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.floor(1000 + Math.random() * 9000);

  // 1. Create workspace
  await db.insert(workspaces).values({
    id: workspaceId,
    name: workspaceName,
    slug,
  });

  // 2. Create user
  await db.insert(users).values({
    id: userId,
    email,
    name,
    passwordHash,
  });

  // 3. Link Admin role
  await db.insert(memberships).values({
    id: crypto.randomUUID(),
    workspaceId,
    userId,
    roleId: "role_admin",
    status: "active",
  });

  await setSessionCookie({
    userId,
    email,
    name,
    workspaceId,
    role: "admin",
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
