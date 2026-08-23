"use server";

import { db } from "@/lib/db";
import { invitations, memberships, userPermissions, roles, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requirePermission, recordAuditLog } from "@/lib/permissions/server-guards";
import { revalidatePath } from "next/cache";

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

  const token = crypto.randomUUID().replace(/-/g, "");
  const invitationId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

  await db.insert(invitations).values({
    id: invitationId,
    workspaceId: ctx.workspaceId,
    email: email.trim().toLowerCase(),
    roleId,
    token,
    status: "pending",
    invitedById: ctx.userId,
    expiresAt,
  });

  await recordAuditLog({
    workspaceId: ctx.workspaceId,
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: "user.invited",
    entityType: "INVITATION",
    entityId: invitationId,
    afterData: { email, roleId },
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
