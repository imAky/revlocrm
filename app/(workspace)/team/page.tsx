import { requireAuth } from "@/lib/permissions/server-guards";
import { db } from "@/lib/db";
import { memberships, users, roles, invitations, rolePermissions, userPermissions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { TeamClient } from "@/components/team/team-client";

export default async function TeamPage() {
  const ctx = await requireAuth();

  // 1. Fetch workspace members with roles, invitations, and permissions in parallel
  const [members, invitationsList, rolesList, allRolePerms, allUserPerms] = await Promise.all([
    db
      .select({
        membershipId: memberships.id,
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        roleId: memberships.roleId,
        roleName: roles.name,
        status: memberships.status,
        createdAt: memberships.createdAt,
      })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .innerJoin(roles, eq(memberships.roleId, roles.id))
      .where(eq(memberships.workspaceId, ctx.workspaceId)),

    db
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
      ),

    db.select().from(roles),
    db.select().from(rolePermissions),
    db.select().from(userPermissions),
  ]);

  const canInvite = ctx.permissions.has("users.invite");
  const canManageRoles = ctx.permissions.has("roles.manage");

  return (
    <TeamClient
      currentUserId={ctx.userId}
      members={members}
      invitationsList={invitationsList}
      rolesList={rolesList}
      rolePermissionsList={allRolePerms}
      userPermissionsList={allUserPerms}
      canInvite={canInvite}
      canManageRoles={canManageRoles}
    />
  );
}
