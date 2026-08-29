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

  if (!input.title || input.title.trim().length === 0) {
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
    title: input.title.trim(),
    description: input.description?.trim() || null,
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
    afterData: { title: input.title.trim(), priority: input.priority, prospectId: input.prospectId },
  });

  if (input.prospectId) {
    revalidatePath(`/prospects/${input.prospectId}`);
  }
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/prospects");

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
  } else {
    updateData.completedAt = null;
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

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string | null;
  dueDate?: Date | null;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status?: "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  assignedToId?: string | null;
  prospectId?: string | null;
}

export async function updateTaskAction(input: UpdateTaskInput) {
  const ctx = await requirePermission("tasks.edit");

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.title !== undefined) updateData.title = input.title.trim();
  if (input.description !== undefined) updateData.description = input.description?.trim() || null;
  if (input.dueDate !== undefined) updateData.dueDate = input.dueDate;
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.assignedToId !== undefined) updateData.assignedToId = input.assignedToId || null;
  if (input.prospectId !== undefined) updateData.prospectId = input.prospectId || null;
  if (input.status !== undefined) {
    updateData.status = input.status;
    if (input.status === "COMPLETED") {
      updateData.completedAt = new Date();
    } else {
      updateData.completedAt = null;
    }
  }

  await db
    .update(tasks)
    .set(updateData)
    .where(and(eq(tasks.id, input.id), eq(tasks.workspaceId, ctx.workspaceId)));

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (input.prospectId) {
    revalidatePath(`/prospects/${input.prospectId}`);
  }

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
