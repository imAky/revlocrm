"use server";

import { db } from "@/lib/db";
import { invitations, memberships, userPermissions, roles, users, workspaces } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requirePermission, recordAuditLog } from "@/lib/permissions/server-guards";
import { revalidatePath } from "next/cache";
import { sendWorkspaceInviteEmail } from "@/lib/email/resend";
import { getAppBaseUrl } from "@/lib/utils/app-url";

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
