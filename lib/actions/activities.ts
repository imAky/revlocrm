"use server";

import { db } from "@/lib/db";
import { activities } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requirePermission, recordAuditLog } from "@/lib/permissions/server-guards";
import { revalidatePath } from "next/cache";

import { uploadTaskScreenshot } from "@/lib/storage/cloudinary";

export interface ActivityAttachmentInput {
  base64: string;
  fileName: string;
  contentType?: string;
}

export interface ActivityInput {
  prospectId: string;
  contactId?: string;
  type: string;
  title: string;
  description?: string;
  outcome?: string;
  nextAction?: string;
  performedAt?: Date;
  attachments?: ActivityAttachmentInput[];
}

export async function createActivityAction(input: ActivityInput) {
  const ctx = await requirePermission("activities.create");

  if (!input.title || !input.prospectId || !input.type) {
    return { error: "Title, type, and prospect ID are required" };
  }

  const uploadedUrls: string[] = [];

  if (input.attachments && input.attachments.length > 0) {
    for (const item of input.attachments) {
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
        console.error("Failed to upload activity attachment to Cloudinary:", err);
      }
    }
  }

  const finalAttachmentUrl =
    uploadedUrls.length > 1
      ? JSON.stringify(uploadedUrls)
      : uploadedUrls.length === 1
      ? uploadedUrls[0]
      : null;

  const activityId = crypto.randomUUID();

  await db.insert(activities).values({
    id: activityId,
    workspaceId: ctx.workspaceId,
    prospectId: input.prospectId,
    contactId: input.contactId || null,
    userId: ctx.userId,
    type: input.type,
    title: input.title,
    description: input.description,
    outcome: input.outcome,
    nextAction: input.nextAction,
    attachmentUrl: finalAttachmentUrl,
    performedAt: input.performedAt || new Date(),
  });

  await recordAuditLog({
    workspaceId: ctx.workspaceId,
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: "activity.created",
    entityType: "ACTIVITY",
    entityId: activityId,
    afterData: { type: input.type, title: input.title },
  });

  revalidatePath(`/prospects/${input.prospectId}`);
  revalidatePath("/activities");
  revalidatePath("/dashboard");

  return { success: true, activityId, attachmentUrl: finalAttachmentUrl };
}

export async function deleteActivityAction(activityId: string) {
  const ctx = await requirePermission("activities.delete");

  const existing = await db
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.id, activityId),
        eq(activities.workspaceId, ctx.workspaceId)
      )
    )
    .limit(1);

  if (existing.length === 0) return { error: "Activity not found" };

  await db
    .delete(activities)
    .where(
      and(
        eq(activities.id, activityId),
        eq(activities.workspaceId, ctx.workspaceId)
      )
    );

  revalidatePath(`/prospects/${existing[0].prospectId}`);
  revalidatePath("/activities");

  return { success: true };
}

export interface UpdateActivityInput {
  id: string;
  type?: string;
  title?: string;
  description?: string | null;
  outcome?: string | null;
  nextAction?: string | null;
  contactId?: string | null;
  performedAt?: Date;
  existingAttachments?: string[];
  newAttachments?: ActivityAttachmentInput[];
}

export async function updateActivityAction(input: UpdateActivityInput) {
  const ctx = await requirePermission("activities.edit");

  const [existing] = await db
    .select()
    .from(activities)
    .where(and(eq(activities.id, input.id), eq(activities.workspaceId, ctx.workspaceId)))
    .limit(1);

  if (!existing) return { error: "Activity not found" };

  const uploadedUrls: string[] = [...(input.existingAttachments || [])];

  if (input.newAttachments && input.newAttachments.length > 0) {
    for (const item of input.newAttachments) {
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
        console.error("Failed to upload updated activity attachment:", err);
      }
    }
  }

  const finalAttachmentUrl =
    uploadedUrls.length > 1
      ? JSON.stringify(uploadedUrls)
      : uploadedUrls.length === 1
      ? uploadedUrls[0]
      : null;

  const updateData: Record<string, unknown> = {};
  if (input.type !== undefined) updateData.type = input.type;
  if (input.title !== undefined) updateData.title = input.title.trim();
  if (input.description !== undefined) updateData.description = input.description?.trim() || null;
  if (input.outcome !== undefined) updateData.outcome = input.outcome?.trim() || null;
  if (input.nextAction !== undefined) updateData.nextAction = input.nextAction?.trim() || null;
  if (input.contactId !== undefined) updateData.contactId = input.contactId || null;
  if (input.performedAt !== undefined) updateData.performedAt = input.performedAt;
  updateData.attachmentUrl = finalAttachmentUrl;

  await db
    .update(activities)
    .set(updateData)
    .where(and(eq(activities.id, input.id), eq(activities.workspaceId, ctx.workspaceId)));

  revalidatePath(`/prospects/${existing.prospectId}`);
  revalidatePath("/activities");
  revalidatePath("/dashboard");

  return { success: true, attachmentUrl: finalAttachmentUrl };
}

/**
 * Delete a specific screenshot/image attachment from an activity
 */
export async function deleteActivityAttachmentAction({
  activityId,
  attachmentUrlToDelete,
}: {
  activityId: string;
  attachmentUrlToDelete: string;
}) {
  const ctx = await requirePermission("activities.edit");

  const [existing] = await db
    .select({
      id: activities.id,
      attachmentUrl: activities.attachmentUrl,
      prospectId: activities.prospectId,
    })
    .from(activities)
    .where(and(eq(activities.id, activityId), eq(activities.workspaceId, ctx.workspaceId)))
    .limit(1);

  if (!existing || !existing.attachmentUrl) {
    return { error: "Activity attachment not found" };
  }

  let currentUrls: string[] = [];
  try {
    if (existing.attachmentUrl.startsWith("[")) {
      currentUrls = JSON.parse(existing.attachmentUrl);
    } else {
      currentUrls = [existing.attachmentUrl];
    }
  } catch {
    currentUrls = [existing.attachmentUrl];
  }

  const remainingUrls = currentUrls.filter((u) => u !== attachmentUrlToDelete);
  const newAttachmentUrl =
    remainingUrls.length > 1
      ? JSON.stringify(remainingUrls)
      : remainingUrls.length === 1
      ? remainingUrls[0]
      : null;

  await db
    .update(activities)
    .set({ attachmentUrl: newAttachmentUrl })
    .where(and(eq(activities.id, activityId), eq(activities.workspaceId, ctx.workspaceId)));

  revalidatePath(`/prospects/${existing.prospectId}`);
  revalidatePath("/activities");

  return { success: true, remainingUrls, attachmentUrl: newAttachmentUrl };
}

