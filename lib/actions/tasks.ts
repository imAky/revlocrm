"use server";

import { db } from "@/lib/db";
import { tasks, taskLogs, users, prospects } from "@/lib/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { requirePermission, requireAuth, recordAuditLog } from "@/lib/permissions/server-guards";
import { revalidatePath } from "next/cache";
import { uploadTaskScreenshot } from "@/lib/storage/cloudinary";

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

  // Record initial task creation log in task_logs table
  await db.insert(taskLogs).values({
    id: crypto.randomUUID(),
    taskId: taskId,
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    action: "CREATED",
    note: input.prospectId ? "Created prospect outreach task" : "Created personal task",
    attachmentUrl: null,
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

export interface AttachmentInput {
  base64: string;
  fileName: string;
  contentType?: string;
}

export interface CompleteTaskInput {
  taskId: string;
  note?: string;
  attachments?: AttachmentInput[];
  attachmentBase64?: string;
  attachmentFileName?: string;
  attachmentContentType?: string;
}

/**
 * Complete a task with activity log and optional multiple reference screenshots
 * - Personal tasks (prospectId === null) can ONLY be completed by the creator / assignee
 * - Prospect tasks (prospectId !== null) can be completed by ANY user in the workspace
 */
export async function completeTaskWithLogAction(input: CompleteTaskInput) {
  const ctx = await requireAuth();

  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, input.taskId), eq(tasks.workspaceId, ctx.workspaceId)))
    .limit(1);

  if (!task) {
    return { error: "Task not found" };
  }

  // Authorization Check: Personal tasks can only be completed by owner
  const isPersonal = !task.prospectId;
  if (isPersonal) {
    const isOwner = task.createdById === ctx.userId || task.assignedToId === ctx.userId;
    if (!isOwner) {
      return { error: "Personal tasks can only be completed by the user who created them." };
    }
  }

  // Collect and upload multiple attachments if provided
  const uploadedUrls: string[] = [];
  const itemsToUpload: AttachmentInput[] = [];

  if (input.attachments && input.attachments.length > 0) {
    itemsToUpload.push(...input.attachments);
  } else if (input.attachmentBase64 && input.attachmentFileName) {
    itemsToUpload.push({
      base64: input.attachmentBase64,
      fileName: input.attachmentFileName,
      contentType: input.attachmentContentType,
    });
  }

  for (const item of itemsToUpload) {
    try {
      const buffer = Buffer.from(item.base64, "base64");
      const uploadRes = await uploadTaskScreenshot(
        buffer,
        item.fileName,
        item.contentType || "image/png"
      );
      if (uploadRes?.url) {
        uploadedUrls.push(uploadRes.url);
      }
    } catch (err) {
      console.error("Failed to upload screenshot to Cloudinary:", err);
    }
  }

  const finalAttachmentUrl =
    uploadedUrls.length > 1
      ? JSON.stringify(uploadedUrls)
      : uploadedUrls.length === 1
      ? uploadedUrls[0]
      : null;

  // Mark task completed
  await db
    .update(tasks)
    .set({
      status: "COMPLETED",
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, input.taskId), eq(tasks.workspaceId, ctx.workspaceId)));

  // Record completion log with user attribution and screenshots
  await db.insert(taskLogs).values({
    id: crypto.randomUUID(),
    taskId: input.taskId,
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    action: "COMPLETED",
    note: input.note?.trim() || "Marked task as completed",
    attachmentUrl: finalAttachmentUrl,
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (task.prospectId) {
    revalidatePath(`/prospects/${task.prospectId}`);
  }

  return { success: true, attachmentUrl: finalAttachmentUrl };
}

/**
 * Reopen a completed task
 */
export async function reopenTaskAction(taskId: string) {
  const ctx = await requireAuth();

  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, ctx.workspaceId)))
    .limit(1);

  if (!task) {
    return { error: "Task not found" };
  }

  // Check personal task permissions
  if (!task.prospectId) {
    const isOwner = task.createdById === ctx.userId || task.assignedToId === ctx.userId;
    if (!isOwner) {
      return { error: "Personal tasks can only be updated by the owner." };
    }
  }

  await db
    .update(tasks)
    .set({
      status: "TODO",
      completedAt: null,
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, ctx.workspaceId)));

  // Record reopen log
  await db.insert(taskLogs).values({
    id: crypto.randomUUID(),
    taskId: taskId,
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    action: "REOPENED",
    note: "Reopened task",
    attachmentUrl: null,
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (task.prospectId) {
    revalidatePath(`/prospects/${task.prospectId}`);
  }

  return { success: true };
}

export async function updateTaskStatusAction(
  taskId: string,
  status: "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
) {
  if (status === "COMPLETED") {
    return completeTaskWithLogAction({ taskId });
  } else {
    return reopenTaskAction(taskId);
  }
}

export interface AddTaskLogInput {
  taskId: string;
  note: string;
  attachments?: AttachmentInput[];
  attachmentBase64?: string;
  attachmentFileName?: string;
  attachmentContentType?: string;
}

/**
 * Add a collaborative handover note / update log to any task with optional multiple screenshots
 */
export async function addTaskLogAction(input: AddTaskLogInput) {
  const ctx = await requireAuth();

  if (!input.note || input.note.trim().length === 0) {
    return { error: "Note message is required" };
  }

  const uploadedUrls: string[] = [];
  const itemsToUpload: AttachmentInput[] = [];

  if (input.attachments && input.attachments.length > 0) {
    itemsToUpload.push(...input.attachments);
  } else if (input.attachmentBase64 && input.attachmentFileName) {
    itemsToUpload.push({
      base64: input.attachmentBase64,
      fileName: input.attachmentFileName,
      contentType: input.attachmentContentType,
    });
  }

  for (const item of itemsToUpload) {
    try {
      const buffer = Buffer.from(item.base64, "base64");
      const uploadRes = await uploadTaskScreenshot(
        buffer,
        item.fileName,
        item.contentType || "image/png"
      );
      if (uploadRes?.url) {
        uploadedUrls.push(uploadRes.url);
      }
    } catch (err) {
      console.error("Failed to upload screenshot attachment to Cloudinary:", err);
    }
  }

  const finalAttachmentUrl =
    uploadedUrls.length > 1
      ? JSON.stringify(uploadedUrls)
      : uploadedUrls.length === 1
      ? uploadedUrls[0]
      : null;

  const logId = crypto.randomUUID();
  await db.insert(taskLogs).values({
    id: logId,
    taskId: input.taskId,
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    action: "COMMENT",
    note: input.note.trim(),
    attachmentUrl: finalAttachmentUrl,
  });

  revalidatePath("/tasks");
  return { success: true, logId, attachmentUrl: finalAttachmentUrl };
}

export interface TaskLogItem {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userEmail?: string | null;
  action: string;
  note?: string | null;
  attachmentUrl?: string | null;
  createdAt: string | Date;
}

/**
 * Fetch chronological activity logs for a task
 */
export async function getTaskLogsAction(taskId: string): Promise<TaskLogItem[]> {
  const ctx = await requireAuth();

  const logs = await db
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
    .where(and(eq(taskLogs.taskId, taskId), eq(taskLogs.workspaceId, ctx.workspaceId)))
    .orderBy(asc(taskLogs.createdAt));

  return logs as TaskLogItem[];
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
