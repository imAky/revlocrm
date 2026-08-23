import { requireAuth } from "@/lib/permissions/server-guards";
import { db } from "@/lib/db";
import { memberships, users, roles, invitations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { TeamClient } from "@/components/team/team-client";

export default async function TeamPage() {
  const ctx = await requireAuth();

  // 1. Fetch workspace members with roles
  const members = await db
    .select({
      membershipId: memberships.id,
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      roleName: roles.name,
      status: memberships.status,
      createdAt: memberships.createdAt,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .innerJoin(roles, eq(memberships.roleId, roles.id))
    .where(eq(memberships.workspaceId, ctx.workspaceId));

  // 2. Fetch invitations
  const invitationsList = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      roleName: roles.name,
      status: invitations.status,
      expiresAt: invitations.expiresAt,
    })
    .from(invitations)
    .innerJoin(roles, eq(invitations.roleId, roles.id))
    .where(
      and(
        eq(invitations.workspaceId, ctx.workspaceId),
        eq(invitations.status, "pending")
      )
    );

  // 3. Fetch system roles
  const rolesList = await db.select().from(roles);

  const canInvite = ctx.permissions.has("users.invite");
  const canManageRoles = ctx.permissions.has("roles.manage");

  return (
    <TeamClient
      members={members}
      invitationsList={invitationsList}
      rolesList={rolesList}
      canInvite={canInvite}
      canManageRoles={canManageRoles}
    />
  );
}
