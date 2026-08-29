import { requireAuth } from "@/lib/permissions/server-guards";
import { db } from "@/lib/db";
import { tasks, prospects, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import Link from "next/link";
import { CalendarCheck2, Building2, User, AlertCircle, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TasksClientList } from "@/components/tasks/tasks-client-list";

export default async function TasksPage() {
  const ctx = await requireAuth();

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
      createdAt: tasks.createdAt,
      completedAt: tasks.completedAt,
    })
    .from(tasks)
    .leftJoin(prospects, eq(tasks.prospectId, prospects.id))
    .leftJoin(users, eq(tasks.assignedToId, users.id))
    .where(eq(tasks.workspaceId, ctx.workspaceId))
    .orderBy(desc(tasks.createdAt));

  const workspaceProspects = await db
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
    .orderBy(prospects.name);

  const workspaceUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .orderBy(users.name);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Tasks & Follow-up Queue
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Organize action items, outreach schedules, and urgent deadlines.
          </p>
        </div>
      </div>

      <TasksClientList
        initialTasks={allTasks as any[]}
        prospects={workspaceProspects}
        users={workspaceUsers}
        currentUserId={ctx.userId}
      />
    </div>
  );
}
