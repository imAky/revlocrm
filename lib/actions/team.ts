"use server";

import { db } from "@/lib/db";
import { invitations, memberships, userPermissions, roles, users, workspaces, authOtps } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { requirePermission, recordAuditLog } from "@/lib/permissions/server-guards";
import { revalidatePath } from "next/cache";
import { sendWorkspaceInviteEmail, sendAdminSecurityOtpEmail } from "@/lib/email/resend";
import { getAppBaseUrl } from "@/lib/utils/app-url";

/**
 * Invite New Member to Workspace
 */
export async function inviteMemberAction({
  email,
  roleId,
}: {
  email: string;
  roleId: string;
}) {
  const ctx = await requirePermission("users.invite");

  if (!email || !roleId) {
    return { error: "Email and role are required" };
  }

  const cleanEmail = email.trim().toLowerCase();
  const token = crypto.randomUUID().replace(/-/g, "");
  const invitationId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

  await db.insert(invitations).values({
    id: invitationId,
    workspaceId: ctx.workspaceId,
    email: cleanEmail,
    roleId,
    token,
    status: "pending",
    invitedById: ctx.userId,
    expiresAt,
  });

  // Query workspace and role name for email
  const [ws] = await db
    .select({ name: workspaces.name })
    .from(workspaces)
    .where(eq(workspaces.id, ctx.workspaceId))
    .limit(1);

  const [role] = await db
    .select({ name: roles.name })
    .from(roles)
    .where(eq(roles.id, roleId))
    .limit(1);

  const appUrl = await getAppBaseUrl();
  const inviteUrl = `${appUrl}/invite/${token}`;

  await sendWorkspaceInviteEmail({
    email: cleanEmail,
    inviterName: ctx.name,
    workspaceName: ws?.name || "Revlo Growth Lab",
    roleName: role?.name || "Team Member",
    inviteUrl,
  });

  await recordAuditLog({
    workspaceId: ctx.workspaceId,
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: "user.invited",
    entityType: "INVITATION",
    entityId: invitationId,
    afterData: { email: cleanEmail, roleId },
  });

  revalidatePath("/team");

  return {
    success: true,
    invitationId,
    inviteLink: `/invite/${token}`,
  };
}

/**
 * Cancel / Revoke a Pending Invitation
 */
export async function cancelInvitationAction({ invitationId }: { invitationId: string }) {
  const ctx = await requirePermission("users.invite");

  await db
    .update(invitations)
    .set({ status: "revoked" })
    .where(
      and(
        eq(invitations.id, invitationId),
        eq(invitations.workspaceId, ctx.workspaceId)
      )
    );

  await recordAuditLog({
    workspaceId: ctx.workspaceId,
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: "invitation.revoked",
    entityType: "INVITATION",
    entityId: invitationId,
  });

  revalidatePath("/team");
  return { success: true };
}

/**
 * Request Admin Security Confirmation OTP for Destructive Actions
 * (Deactivating, Suspending, or Reactivating Team Members)
 */
export async function requestAdminSecurityOtpAction({
  targetMembershipId,
  actionType,
}: {
  targetMembershipId: string;
  actionType: "suspend" | "activate" | "remove";
}) {
  const ctx = await requirePermission("roles.manage");

  // Fetch target member details
  const targetMember = await db
    .select({
      id: memberships.id,
      userId: memberships.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(
      and(
        eq(memberships.id, targetMembershipId),
        eq(memberships.workspaceId, ctx.workspaceId)
      )
    )
    .limit(1);

  if (targetMember.length === 0) {
    return { error: "Team member not found in this workspace." };
  }

  const member = targetMember[0];

  if (member.userId === ctx.userId) {
    return { error: "Security restriction: You cannot deactivate your own administrative account." };
  }

  // Generate 6-digit Security OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes

  // Clear previous admin security OTPs for this admin
  await db
    .delete(authOtps)
    .where(
      and(
        eq(authOtps.email, ctx.email),
        eq(authOtps.type, "admin_security")
      )
    );

  // Save new security OTP
  await db.insert(authOtps).values({
    id: otpId,
    email: ctx.email,
    otp,
    type: "admin_security",
    expiresAt,
  });

  const actionDescription =
    actionType === "suspend"
      ? "Account Deactivation / Suspension"
      : actionType === "activate"
      ? "Account Reactivation"
      : "Workspace Removal";

  // Dispatch Step-Up Security Email to Admin
  await sendAdminSecurityOtpEmail({
    email: ctx.email,
    adminName: ctx.name,
    actionDescription,
    targetMemberName: `${member.userName} (${member.userEmail})`,
    otp,
  });

  return {
    success: true,
    adminEmail: ctx.email,
    targetName: member.userName,
    devOtp: process.env.NODE_ENV === "development" ? otp : undefined,
  };
}

/**
 * Toggle Member Status (Active <-> Suspended) Protected by Admin OTP Confirmation
 */
export async function toggleMemberStatusWithOtpAction({
  membershipId,
  newStatus,
  otp,
}: {
  membershipId: string;
  newStatus: "active" | "suspended";
  otp: string;
}) {
  const ctx = await requirePermission("roles.manage");
  const cleanOtp = otp.trim();

  if (!cleanOtp) {
    return { error: "6-digit admin security code is required." };
  }

  // Validate Admin OTP
  const validOtp = await db
    .select()
    .from(authOtps)
    .where(
      and(
        eq(authOtps.email, ctx.email),
        eq(authOtps.otp, cleanOtp),
        eq(authOtps.type, "admin_security"),
        gt(authOtps.expiresAt, new Date())
      )
    )
    .limit(1);

  if (validOtp.length === 0) {
    return { error: "Invalid or expired security code. Please request a new confirmation code." };
  }

  // Consume OTP
  await db
    .delete(authOtps)
    .where(eq(authOtps.id, validOtp[0].id));

  // Verify target membership
  const targetMember = await db
    .select({
      id: memberships.id,
      userId: memberships.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(
      and(
        eq(memberships.id, membershipId),
        eq(memberships.workspaceId, ctx.workspaceId)
      )
    )
    .limit(1);

  if (targetMember.length === 0) {
    return { error: "Team member not found in this workspace." };
  }

  if (targetMember[0].userId === ctx.userId) {
    return { error: "You cannot change the status of your own account." };
  }

  // Update membership status (preserve all historic records & data references)
  await db
    .update(memberships)
    .set({
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(memberships.id, membershipId),
        eq(memberships.workspaceId, ctx.workspaceId)
      )
    );

  await recordAuditLog({
    workspaceId: ctx.workspaceId,
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: newStatus === "suspended" ? "membership.suspended" : "membership.reactivated",
    entityType: "MEMBERSHIP",
    entityId: membershipId,
    afterData: {
      targetUserId: targetMember[0].userId,
      targetUserEmail: targetMember[0].userEmail,
      status: newStatus,
    },
  });

  revalidatePath("/team");
  revalidatePath("/dashboard");

  return {
    success: true,
    newStatus,
    message:
      newStatus === "suspended"
        ? `Successfully deactivated ${targetMember[0].userName}. The user is immediately blocked from logging in and accessing workspace data.`
        : `Successfully reactivated ${targetMember[0].userName}. Full workspace access restored.`,
  };
}

/**
 * Update Member Role
 */
export async function updateMemberRoleAction({
  membershipId,
  roleId,
}: {
  membershipId: string;
  roleId: string;
}) {
  const ctx = await requirePermission("roles.manage");

  await db
    .update(memberships)
    .set({ roleId, updatedAt: new Date() })
    .where(
      and(
        eq(memberships.id, membershipId),
        eq(memberships.workspaceId, ctx.workspaceId)
      )
    );

  await recordAuditLog({
    workspaceId: ctx.workspaceId,
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: "membership.role_changed",
    entityType: "MEMBERSHIP",
    entityId: membershipId,
    afterData: { roleId },
  });

  revalidatePath("/team");

  return { success: true };
}

/**
 * Toggle Granular Permission for Member
 */
export async function toggleMemberCapabilityAction({
  membershipId,
  permissionId,
  granted,
}: {
  membershipId: string;
  permissionId: string;
  granted: boolean;
}) {
  const ctx = await requirePermission("roles.manage");

  const existing = await db
    .select()
    .from(userPermissions)
    .where(
      and(
        eq(userPermissions.membershipId, membershipId),
        eq(userPermissions.permissionId, permissionId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(userPermissions)
      .set({ granted })
      .where(eq(userPermissions.id, existing[0].id));
  } else {
    await db.insert(userPermissions).values({
      id: crypto.randomUUID(),
      membershipId,
      permissionId,
      granted,
    });
  }

  await recordAuditLog({
    workspaceId: ctx.workspaceId,
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: "membership.permission_toggled",
    entityType: "USER_PERMISSION",
    entityId: membershipId,
    afterData: { permissionId, granted },
  });

  revalidatePath("/team");

  return { success: true };
}
