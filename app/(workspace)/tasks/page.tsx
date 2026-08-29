import { requireAuth } from "@/lib/permissions/server-guards";
import { db } from "@/lib/db";
import { tasks, prospects, users, taskLogs } from "@/lib/db/schema";
import { eq, and, desc, or, isNotNull, inArray } from "drizzle-orm";
import { TasksClientList } from "@/components/tasks/tasks-client-list";

export default async function TasksPage() {
  const ctx = await requireAuth();

  // 1. Fetch only company tasks (shared workspace) AND personal tasks belonging to current user (private)
  const allTasks = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      dueDate: tasks.dueDate,
      priority: tasks.priority,
      status: tasks.status,
      prospectId: tasks.prospectId,
      prospectName: prospects.name,
      assignedToId: tasks.assignedToId,
      assignedToName: users.name,
      createdById: tasks.createdById,
      createdAt: tasks.createdAt,
      completedAt: tasks.completedAt,
    })
    .from(tasks)
    .leftJoin(prospects, eq(tasks.prospectId, prospects.id))
    .leftJoin(users, eq(tasks.assignedToId, users.id))
    .where(
      and(
        eq(tasks.workspaceId, ctx.workspaceId),
        or(
          isNotNull(tasks.prospectId), // Workspace company tasks (shared with team)
          eq(tasks.createdById, ctx.userId), // Personal tasks created by current user
          eq(tasks.assignedToId, ctx.userId) // Personal tasks assigned to current user
        )
      )
    )
    .orderBy(desc(tasks.createdAt));

  const visibleTaskIds = allTasks.map((t) => t.id);

  // 2. Fetch logs only for visible tasks
  const allTaskLogs =
    visibleTaskIds.length > 0
      ? await db
          .select({
            id: taskLogs.id,
            taskId: taskLogs.taskId,
            userId: taskLogs.userId,
            userName: users.name,
            userEmail: users.email,
            action: taskLogs.action,
            note: taskLogs.note,
            attachmentUrl: taskLogs.attachmentUrl,
            createdAt: taskLogs.createdAt,
          })
          .from(taskLogs)
          .leftJoin(users, eq(taskLogs.userId, users.id))
          .where(
            and(
              eq(taskLogs.workspaceId, ctx.workspaceId),
              inArray(taskLogs.taskId, visibleTaskIds)
            )
          )
          .orderBy(desc(taskLogs.createdAt))
      : [];

  const [workspaceProspects, workspaceUsers] = await Promise.all([
    db
      .select({
        id: prospects.id,
        name: prospects.name,
        category: prospects.category,
        city: prospects.city,
      })
      .from(prospects)
      .where(
        and(
          eq(prospects.workspaceId, ctx.workspaceId),
          eq(prospects.isArchived, false)
        )
      )
      .orderBy(prospects.name),

    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .orderBy(users.name),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Tasks & Follow-up Queue
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your personal daily agenda, company action items, handover notes, and reference screenshots.
          </p>
        </div>
      </div>

      <TasksClientList
        initialTasks={allTasks as any[]}
        initialLogs={allTaskLogs as any[]}
        prospects={workspaceProspects}
        users={workspaceUsers}
        currentUserId={ctx.userId}
      />
    </div>
  );
}
