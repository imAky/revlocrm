import { db } from "@/lib/db";
import { invitations, workspaces, roles } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InviteAcceptanceClient } from "@/components/auth/invite-acceptance-client";

export default async function InviteAcceptancePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invList = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      workspaceId: invitations.workspaceId,
      workspaceName: workspaces.name,
      roleId: invitations.roleId,
      roleName: roles.name,
      status: invitations.status,
      expiresAt: invitations.expiresAt,
      token: invitations.token,
    })
    .from(invitations)
    .innerJoin(workspaces, eq(invitations.workspaceId, workspaces.id))
    .innerJoin(roles, eq(invitations.roleId, roles.id))
    .where(
      and(
        eq(invitations.token, token),
        eq(invitations.status, "pending"),
        gt(invitations.expiresAt, new Date())
      )
    )
    .limit(1);

  if (invList.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-destructive/30 bg-card p-8 text-center space-y-4 shadow-xl">
          <div className="h-12 w-12 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center mx-auto text-xl font-bold">
            ✕
          </div>
          <h2 className="text-lg font-bold text-foreground">Invalid or Expired Invitation</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This invitation link has expired or has already been accepted. Please contact your workspace administrator for a new invite.
          </p>
          <div className="pt-2">
            <Link href="/login">
              <Button variant="outline" size="sm" className="rounded-xl text-xs">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const invitation = invList[0];

  return <InviteAcceptanceClient invite={invitation} />;
}
