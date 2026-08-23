import { requireAuth } from "@/lib/permissions/server-guards";
import { db } from "@/lib/db";
import { workspaces, pipelineStages, users, customFields } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { WorkspaceShell } from "@/components/layout/workspace-shell";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireAuth();

  const ws = await db
    .select({ name: workspaces.name })
    .from(workspaces)
    .where(eq(workspaces.id, ctx.workspaceId))
    .limit(1);

  const workspaceName = ws[0]?.name || "Revlo Growth Lab";

  const stagesList = await db
    .select({ id: pipelineStages.id, name: pipelineStages.name })
    .from(pipelineStages)
    .where(eq(pipelineStages.workspaceId, ctx.workspaceId))
    .orderBy(pipelineStages.orderIndex);

  const usersList = await db
    .select({ id: users.id, name: users.name })
    .from(users);

  const fieldsList = await db
    .select()
    .from(customFields)
    .where(
      and(
        eq(customFields.workspaceId, ctx.workspaceId),
        eq(customFields.isActive, true)
      )
    );

  return (
    <WorkspaceShell
      userName={ctx.name}
      userEmail={ctx.email}
      roleName={ctx.roleName}
      workspaceName={workspaceName}
      stages={stagesList}
      workspaceUsers={usersList}
      customFields={fieldsList}
    >
      {children}
    </WorkspaceShell>
  );
}
