import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  memberships,
  roles,
  rolePermissions,
  userPermissions,
  prospects,
  auditLogs,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { CapabilityId } from "./capabilities";
import { redirect } from "next/navigation";

export interface AuthenticatedContext {
  userId: string;
  email: string;
  name: string;
  workspaceId: string;
  roleName: string;
  membershipId: string;
  permissions: Set<string>;
}

export async function requireAuth(): Promise<AuthenticatedContext> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Fetch membership & role to get live permissions
  const memberList = await db
    .select({
      membershipId: memberships.id,
      roleId: memberships.roleId,
      status: memberships.status,
      roleName: roles.name,
    })
    .from(memberships)
    .innerJoin(roles, eq(memberships.roleId, roles.id))
    .where(
      and(
        eq(memberships.workspaceId, session.workspaceId),
        eq(memberships.userId, session.userId),
        eq(memberships.status, "active")
      )
    )
    .limit(1);

  if (memberList.length === 0) {
    redirect("/login?error=membership_inactive");
  }

  const member = memberList[0];

  // Fetch role-based permissions
  const rolePerms = await db
    .select({ permissionId: rolePermissions.permissionId })
    .from(rolePermissions)
    .where(eq(rolePermissions.roleId, member.roleId));

  const permSet = new Set<string>(rolePerms.map((p) => p.permissionId));

  // Fetch explicit user overrides (grants or denys)
  const userPerms = await db
    .select({
      permissionId: userPermissions.permissionId,
      granted: userPermissions.granted,
    })
    .from(userPermissions)
    .where(eq(userPermissions.membershipId, member.membershipId));

  for (const up of userPerms) {
    if (up.granted) {
      permSet.add(up.permissionId);
    } else {
      permSet.delete(up.permissionId);
    }
  }

  // Admin automatically has full authority
  if (member.roleName.toLowerCase() === "admin") {
    // Add all standard permissions
    permSet.add("prospects.view");
    permSet.add("prospects.create");
    permSet.add("prospects.edit");
    permSet.add("prospects.delete");
    permSet.add("prospects.assign");
    permSet.add("prospects.export");
    permSet.add("contacts.view");
    permSet.add("contacts.create");
    permSet.add("contacts.edit");
    permSet.add("contacts.delete");
    permSet.add("activities.view");
    permSet.add("activities.create");
    permSet.add("activities.edit");
    permSet.add("activities.delete");
    permSet.add("tasks.view");
    permSet.add("tasks.create");
    permSet.add("tasks.edit");
    permSet.add("tasks.delete");
    permSet.add("pipeline.view");
    permSet.add("pipeline.manage");
    permSet.add("custom_fields.view");
    permSet.add("custom_fields.manage");
    permSet.add("users.view");
    permSet.add("users.invite");
    permSet.add("users.manage");
    permSet.add("roles.manage");
    permSet.add("workspace.view");
    permSet.add("workspace.manage");
    permSet.add("audit.view");
    permSet.add("imports.create");
    permSet.add("exports.create");
    permSet.add("dashboard.view");
  }

  return {
    userId: session.userId,
    email: session.email,
    name: session.name,
    workspaceId: session.workspaceId,
    roleName: member.roleName,
    membershipId: member.membershipId,
    permissions: permSet,
  };
}

export async function requirePermission(capability: CapabilityId): Promise<AuthenticatedContext> {
  const ctx = await requireAuth();
  if (!ctx.permissions.has(capability)) {
    throw new Error(`Unauthorized: Missing required capability '${capability}'`);
  }
  return ctx;
}

export async function canAccessProspect(
  prospectId: string,
  capability: CapabilityId
): Promise<{ ctx: AuthenticatedContext; prospect: typeof prospects.$inferSelect }> {
  const ctx = await requirePermission(capability);

  const prospectList = await db
    .select()
    .from(prospects)
    .where(
      and(
        eq(prospects.id, prospectId),
        eq(prospects.workspaceId, ctx.workspaceId)
      )
    )
    .limit(1);

  if (prospectList.length === 0) {
    throw new Error("Prospect not found or does not belong to current workspace");
  }

  const prospect = prospectList[0];

  // Specific check for editing: if researcher has edit permission, check assignment if restricted
  if (capability === "prospects.edit") {
    // If not admin and researcher only allowed to edit assigned prospects
    if (
      ctx.roleName === "researcher" &&
      !ctx.permissions.has("prospects.edit_all") &&
      prospect.assignedToId &&
      prospect.assignedToId !== ctx.userId &&
      prospect.createdById !== ctx.userId
    ) {
      // Allowed if assigned or created, or if they have workspace-wide edit
      // For V1 default, researchers can view and edit workspace prospects unless restricted
    }
  }

  return { ctx, prospect };
}

export async function recordAuditLog({
  workspaceId,
  actorId,
  actorEmail,
  action,
  entityType,
  entityId,
  beforeData,
  afterData,
  metadata,
}: {
  workspaceId: string;
  actorId?: string;
  actorEmail?: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeData?: unknown;
  afterData?: unknown;
  metadata?: unknown;
}) {
  try {
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      workspaceId,
      actorId: actorId ?? null,
      actorEmail: actorEmail ?? null,
      action,
      entityType,
      entityId,
      beforeData: beforeData ? JSON.stringify(beforeData) : null,
      afterData: afterData ? JSON.stringify(afterData) : null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
  } catch (err) {
    console.error("Failed to record audit log:", err);
  }
}
