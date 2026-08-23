"use server";

import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requirePermission, recordAuditLog } from "@/lib/permissions/server-guards";
import { revalidatePath } from "next/cache";

export interface TaskInput {
  prospectId?: string;
  contactId?: string;
  assignedToId?: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status?: "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
}

export async function createTaskAction(input: TaskInput) {
  const ctx = await requirePermission("tasks.create");

  if (!input.title) {
    return { error: "Task title is required" };
  }

  const taskId = crypto.randomUUID();

  await db.insert(tasks).values({
    id: taskId,
    workspaceId: ctx.workspaceId,
    prospectId: input.prospectId || null,
    contactId: input.contactId || null,
    assignedToId: input.assignedToId || ctx.userId,
    createdById: ctx.userId,
    title: input.title,
    description: input.description,
    dueDate: input.dueDate,
    priority: input.priority || "MEDIUM",
    status: input.status || "TODO",
  });

  await recordAuditLog({
    workspaceId: ctx.workspaceId,
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: "task.created",
    entityType: "TASK",
    entityId: taskId,
    afterData: { title: input.title, priority: input.priority },
  });

  if (input.prospectId) {
    revalidatePath(`/prospects/${input.prospectId}`);
  }
  revalidatePath("/tasks");
  revalidatePath("/dashboard");

  return { success: true, taskId };
}

export async function updateTaskStatusAction(
  taskId: string,
  status: "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
) {
  const ctx = await requirePermission("tasks.edit");

  const updateData: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };

  if (status === "COMPLETED") {
    updateData.completedAt = new Date();
  }

  await db
    .update(tasks)
    .set(updateData)
    .where(
      and(eq(tasks.id, taskId), eq(tasks.workspaceId, ctx.workspaceId))
    );

  revalidatePath("/tasks");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function deleteTaskAction(taskId: string) {
  const ctx = await requirePermission("tasks.delete");

  await db
    .delete(tasks)
    .where(
      and(eq(tasks.id, taskId), eq(tasks.workspaceId, ctx.workspaceId))
    );

  await recordAuditLog({
    workspaceId: ctx.workspaceId,
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: "task.deleted",
    entityType: "TASK",
    entityId: taskId,
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");

  return { success: true };
}
