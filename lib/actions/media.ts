"use server";

import { db } from "@/lib/db";
import { prospectMedia, prospects, users } from "@/lib/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { requireAuth, recordAuditLog } from "@/lib/permissions/server-guards";
import { revalidatePath } from "next/cache";
import { uploadProspectMediaFile } from "@/lib/storage/cloudinary";

export interface CreateMediaInput {
  prospectId: string;
  title: string;
  description?: string;
  category?: string; // 'DESIGN' | 'PROPOSAL' | 'AUDIT' | 'CONTRACT' | 'RESEARCH' | 'ASSET' | 'GENERAL'
  type?: string;     // 'IMAGE' | 'DOCUMENT' | 'PDF' | 'LINK' | 'FIGMA' | 'DRIVE' | 'WEBSITE' | 'VIDEO' | 'OTHER'
  url?: string;
  isPinned?: boolean;
  fileBase64?: string;
  fileName?: string;
  fileContentType?: string;
}

/**
 * Smart detection helper to classify link types (Figma, Google Drive, Loom, YouTube, Web, etc.)
 */
function detectLinkType(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes("figma.com")) return "FIGMA";
  if (lower.includes("drive.google.com") || lower.includes("docs.google.com")) return "DRIVE";
  if (lower.includes("loom.com") || lower.includes("youtube.com") || lower.includes("vimeo.com")) return "VIDEO";
  if (lower.endsWith(".pdf") || lower.includes(".pdf?")) return "PDF";
  if (lower.match(/\.(png|jpg|jpeg|webp|gif|svg)$/)) return "IMAGE";
  return "LINK";
}

export async function createProspectMediaAction(input: CreateMediaInput) {
  const ctx = await requireAuth();

  if (!input.prospectId) {
    return { error: "Prospect ID is required" };
  }

  if (!input.title || input.title.trim().length === 0) {
    return { error: "Title is required" };
  }

  // 1. Verify prospect exists and belongs to workspace
  const [prospect] = await db
    .select({ id: prospects.id, name: prospects.name })
    .from(prospects)
    .where(and(eq(prospects.id, input.prospectId), eq(prospects.workspaceId, ctx.workspaceId)))
    .limit(1);

  if (!prospect) {
    return { error: "Prospect not found in workspace" };
  }

  let finalUrl = input.url?.trim() || "";
  let finalType = input.type || "LINK";
  let fileSize: number | null = null;
  let mimeType: string | null = null;

  // 2. Process file upload if base64 file data provided
  if (input.fileBase64 && input.fileName) {
    try {
      const buffer = Buffer.from(input.fileBase64, "base64");
      const contentType = input.fileContentType || "image/png";
      const uploadRes = await uploadProspectMediaFile(
        buffer,
        input.fileName,
        contentType,
        input.prospectId
      );

      finalUrl = uploadRes.url;
      fileSize = uploadRes.bytes;
      mimeType = contentType;

      if (contentType.startsWith("image/")) {
        finalType = "IMAGE";
      } else if (contentType === "application/pdf" || input.fileName.toLowerCase().endsWith(".pdf")) {
        finalType = "PDF";
      } else {
        finalType = "DOCUMENT";
      }
    } catch (err: any) {
      console.error("Cloudinary media upload failed:", err);
      return { error: `Failed to upload file to storage: ${err?.message || "Storage error"}` };
    }
  } else if (finalUrl) {
    // Detect smart type if user submitted external URL
    if (!input.type || input.type === "LINK") {
      finalType = detectLinkType(finalUrl);
    }
  } else {
    return { error: "Either a file upload or a valid URL is required" };
  }

  const mediaId = crypto.randomUUID();
  const category = input.category || "GENERAL";

  await db.insert(prospectMedia).values({
    id: mediaId,
    workspaceId: ctx.workspaceId,
    prospectId: input.prospectId,
    userId: ctx.userId,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    type: finalType,
    url: finalUrl,
    fileSize: fileSize,
    mimeType: mimeType,
    category: category,
    isPinned: input.isPinned ?? false,
  });

  await recordAuditLog({
    workspaceId: ctx.workspaceId,
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: "prospect.media_added",
    entityType: "PROSPECT_MEDIA",
    entityId: mediaId,
    afterData: {
      prospectId: input.prospectId,
      title: input.title.trim(),
      type: finalType,
      category: category,
      url: finalUrl,
    },
  });

  revalidatePath(`/prospects/${input.prospectId}`);
  return {
    success: true,
    mediaId,
    url: finalUrl,
    fileSize,
    mimeType,
    type: finalType,
    category,
  };
}

export interface UpdateMediaInput {
  id: string;
  prospectId: string;
  title?: string;
  description?: string | null;
  category?: string;
  type?: string;
  url?: string;
  isPinned?: boolean;
}

export async function updateProspectMediaAction(input: UpdateMediaInput) {
  const ctx = await requireAuth();

  const [existing] = await db
    .select()
    .from(prospectMedia)
    .where(
      and(
        eq(prospectMedia.id, input.id),
        eq(prospectMedia.workspaceId, ctx.workspaceId)
      )
    )
    .limit(1);

  if (!existing) {
    return { error: "Media item not found" };
  }

  const updateData: Record<string, any> = {
    updatedAt: new Date(),
  };

  if (input.title !== undefined) updateData.title = input.title.trim();
  if (input.description !== undefined) updateData.description = input.description?.trim() || null;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.type !== undefined) updateData.type = input.type;
  if (input.url !== undefined) updateData.url = input.url.trim();
  if (input.isPinned !== undefined) updateData.isPinned = input.isPinned;

  await db
    .update(prospectMedia)
    .set(updateData)
    .where(
      and(
        eq(prospectMedia.id, input.id),
        eq(prospectMedia.workspaceId, ctx.workspaceId)
      )
    );

  revalidatePath(`/prospects/${input.prospectId}`);
  return { success: true };
}

export async function togglePinMediaAction(id: string, prospectId: string) {
  const ctx = await requireAuth();

  const [existing] = await db
    .select({ isPinned: prospectMedia.isPinned })
    .from(prospectMedia)
    .where(
      and(
        eq(prospectMedia.id, id),
        eq(prospectMedia.workspaceId, ctx.workspaceId)
      )
    )
    .limit(1);

  if (!existing) {
    return { error: "Media item not found" };
  }

  await db
    .update(prospectMedia)
    .set({
      isPinned: !existing.isPinned,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(prospectMedia.id, id),
        eq(prospectMedia.workspaceId, ctx.workspaceId)
      )
    );

  revalidatePath(`/prospects/${prospectId}`);
  return { success: true, isPinned: !existing.isPinned };
}

export async function deleteProspectMediaAction(id: string, prospectId: string) {
  const ctx = await requireAuth();

  await db
    .delete(prospectMedia)
    .where(
      and(
        eq(prospectMedia.id, id),
        eq(prospectMedia.workspaceId, ctx.workspaceId)
      )
    );

  await recordAuditLog({
    workspaceId: ctx.workspaceId,
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: "prospect.media_deleted",
    entityType: "PROSPECT_MEDIA",
    entityId: id,
    metadata: `Deleted media attachment for prospect ${prospectId}`,
  });

  revalidatePath(`/prospects/${prospectId}`);
  return { success: true };
}

export interface ProspectMediaItem {
  id: string;
  workspaceId: string;
  prospectId: string;
  userId: string | null;
  userName?: string | null;
  title: string;
  description?: string | null;
  type: string;
  url: string;
  fileSize?: number | null;
  mimeType?: string | null;
  thumbnailUrl?: string | null;
  category: string;
  isPinned: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export async function getProspectMediaAction(prospectId: string): Promise<ProspectMediaItem[]> {
  const ctx = await requireAuth();

  const items = await db
    .select({
      id: prospectMedia.id,
      workspaceId: prospectMedia.workspaceId,
      prospectId: prospectMedia.prospectId,
      userId: prospectMedia.userId,
      userName: users.name,
      title: prospectMedia.title,
      description: prospectMedia.description,
      type: prospectMedia.type,
      url: prospectMedia.url,
      fileSize: prospectMedia.fileSize,
      mimeType: prospectMedia.mimeType,
      thumbnailUrl: prospectMedia.thumbnailUrl,
      category: prospectMedia.category,
      isPinned: prospectMedia.isPinned,
      createdAt: prospectMedia.createdAt,
      updatedAt: prospectMedia.updatedAt,
    })
    .from(prospectMedia)
    .leftJoin(users, eq(prospectMedia.userId, users.id))
    .where(
      and(
        eq(prospectMedia.prospectId, prospectId),
        eq(prospectMedia.workspaceId, ctx.workspaceId)
      )
    )
    .orderBy(desc(prospectMedia.isPinned), desc(prospectMedia.createdAt));

  return items as ProspectMediaItem[];
}
