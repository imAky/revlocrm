"use server";

import { db } from "@/lib/db";
import { researchKeywords, users, prospects } from "@/lib/db/schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { requireAuth, recordAuditLog } from "@/lib/permissions/server-guards";
import { revalidatePath } from "next/cache";
import { normalizeKeywordString } from "@/lib/utils/research";

export interface ResearchKeywordItem {
  id: string;
  workspaceId: string;
  userId?: string | null;
  userName?: string | null;
  keyword: string;
  normalizedKeyword: string;
  niche?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  status: string; // 'PENDING' | 'SEARCHED' | 'IN_PROGRESS' | 'FAVORITE' | 'ARCHIVED'
  searchEngine: string; // 'GOOGLE_MAPS' | 'GOOGLE_SEARCH' | 'YELP' | 'LINKEDIN'
  prospectsFoundCount: number;
  notes?: string | null;
  lastSearchedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateKeywordInput {
  keyword: string;
  niche?: string;
  city?: string;
  state?: string;
  country?: string;
  searchEngine?: string;
  notes?: string;
  status?: string;
}

/**
 * Create a single keyword with duplicate prevention
 */
export async function createKeywordAction(input: CreateKeywordInput) {
  const ctx = await requireAuth();

  const trimmed = input.keyword?.trim();
  if (!trimmed) {
    return { error: "Keyword cannot be empty" };
  }

  const normalized = normalizeKeywordString(trimmed);

  // Check for duplicate in workspace
  const existing = await db
    .select({ id: researchKeywords.id, keyword: researchKeywords.keyword })
    .from(researchKeywords)
    .where(
      and(
        eq(researchKeywords.workspaceId, ctx.workspaceId),
        eq(researchKeywords.normalizedKeyword, normalized)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return {
      error: `Duplicate keyword: "${existing[0].keyword}" is already in your research database.`,
      isDuplicate: true,
    };
  }

  const id = crypto.randomUUID();
  const searchEngine = input.searchEngine || "GOOGLE_MAPS";
  const status = input.status || "PENDING";

  await db.insert(researchKeywords).values({
    id,
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    keyword: trimmed,
    normalizedKeyword: normalized,
    niche: input.niche?.trim() || null,
    city: input.city?.trim() || null,
    state: input.state?.trim() || null,
    country: input.country?.trim() || "US",
    status,
    searchEngine,
    notes: input.notes?.trim() || null,
  });

  await recordAuditLog({
    workspaceId: ctx.workspaceId,
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: "research.keyword_created",
    entityType: "RESEARCH_KEYWORD",
    entityId: id,
    afterData: { keyword: trimmed, niche: input.niche, city: input.city },
  });

  revalidatePath("/research");
  return { success: true, id };
}

export interface BulkCreateKeywordsInput {
  keywords: string[];
  niche?: string;
  city?: string;
  state?: string;
  country?: string;
  searchEngine?: string;
  status?: string;
}

/**
 * Bulk create keywords from matrix generator or multi-line/comma paste
 * Automatically deduplicates within input list and against existing database keywords.
 */
export async function bulkCreateKeywordsAction(input: BulkCreateKeywordsInput) {
  const ctx = await requireAuth();

  if (!input.keywords || input.keywords.length === 0) {
    return { error: "No keywords provided" };
  }

  // 1. Clean and deduplicate within batch
  const cleanedList: { raw: string; norm: string }[] = [];
  const seenInBatch = new Set<string>();

  for (const raw of input.keywords) {
    const trimmed = raw?.trim();
    if (!trimmed) continue;
    const norm = normalizeKeywordString(trimmed);
    if (!norm) continue;

    if (!seenInBatch.has(norm)) {
      seenInBatch.add(norm);
      cleanedList.push({ raw: trimmed, norm });
    }
  }

  if (cleanedList.length === 0) {
    return { error: "No valid non-empty keywords found" };
  }

  // 2. Fetch existing normalized keywords from workspace
  const normList = cleanedList.map((c) => c.norm);
  const existingRecords = await db
    .select({ normalizedKeyword: researchKeywords.normalizedKeyword, keyword: researchKeywords.keyword })
    .from(researchKeywords)
    .where(
      and(
        eq(researchKeywords.workspaceId, ctx.workspaceId),
        inArray(researchKeywords.normalizedKeyword, normList)
      )
    );

  const existingSet = new Set(existingRecords.map((r) => r.normalizedKeyword));

  // 3. Separate new items from duplicates
  const toInsert: typeof researchKeywords.$inferInsert[] = [];
  const duplicatesFound: string[] = [];

  const defaultSearchEngine = input.searchEngine || "GOOGLE_MAPS";
  const defaultStatus = input.status || "PENDING";

  for (const item of cleanedList) {
    if (existingSet.has(item.norm)) {
      duplicatesFound.push(item.raw);
    } else {
      toInsert.push({
        id: crypto.randomUUID(),
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        keyword: item.raw,
        normalizedKeyword: item.norm,
        niche: input.niche?.trim() || null,
        city: input.city?.trim() || null,
        state: input.state?.trim() || null,
        country: input.country?.trim() || "US",
        status: defaultStatus,
        searchEngine: defaultSearchEngine,
      });
    }
  }

  // 4. Insert unique new records in batch
  if (toInsert.length > 0) {
    // Insert in chunks of 50 for safety
    const chunkSize = 50;
    for (let i = 0; i < toInsert.length; i += chunkSize) {
      const chunk = toInsert.slice(i, i + chunkSize);
      await db.insert(researchKeywords).values(chunk);
    }

    await recordAuditLog({
      workspaceId: ctx.workspaceId,
      actorId: ctx.userId,
      actorEmail: ctx.email,
      action: "research.bulk_keywords_created",
      entityType: "RESEARCH_KEYWORD",
      entityId: ctx.workspaceId,
      afterData: {
        addedCount: toInsert.length,
        duplicateCount: duplicatesFound.length,
      },
    });
  }

  revalidatePath("/research");
  return {
    success: true,
    addedCount: toInsert.length,
    duplicateCount: duplicatesFound.length,
    duplicates: duplicatesFound,
  };
}

/**
 * Toggle or update status of keyword
 */
export async function updateKeywordStatusAction(id: string, status: string) {
  const ctx = await requireAuth();

  const updateData: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };

  if (status === "SEARCHED") {
    updateData.lastSearchedAt = new Date();
  }

  await db
    .update(researchKeywords)
    .set(updateData)
    .where(
      and(
        eq(researchKeywords.id, id),
        eq(researchKeywords.workspaceId, ctx.workspaceId)
      )
    );

  revalidatePath("/research");
  return { success: true };
}

/**
 * Record that keyword was launched / searched on Google Maps or Google Search
 */
export async function recordKeywordSearchAction(id: string) {
  const ctx = await requireAuth();

  await db
    .update(researchKeywords)
    .set({
      status: "SEARCHED",
      lastSearchedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(researchKeywords.id, id),
        eq(researchKeywords.workspaceId, ctx.workspaceId)
      )
    );

  revalidatePath("/research");
  return { success: true };
}

export interface UpdateKeywordInput {
  id: string;
  keyword?: string;
  niche?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  status?: string;
  searchEngine?: string;
  prospectsFoundCount?: number;
  notes?: string | null;
}

/**
 * Update full keyword metadata
 */
export async function updateKeywordAction(input: UpdateKeywordInput) {
  const ctx = await requireAuth();

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.keyword !== undefined) {
    const trimmed = input.keyword.trim();
    if (trimmed) {
      updateData.keyword = trimmed;
      updateData.normalizedKeyword = normalizeKeywordString(trimmed);
    }
  }
  if (input.niche !== undefined) updateData.niche = input.niche?.trim() || null;
  if (input.city !== undefined) updateData.city = input.city?.trim() || null;
  if (input.state !== undefined) updateData.state = input.state?.trim() || null;
  if (input.country !== undefined) updateData.country = input.country?.trim() || "US";
  if (input.status !== undefined) updateData.status = input.status;
  if (input.searchEngine !== undefined) updateData.searchEngine = input.searchEngine;
  if (input.prospectsFoundCount !== undefined) updateData.prospectsFoundCount = input.prospectsFoundCount;
  if (input.notes !== undefined) updateData.notes = input.notes?.trim() || null;

  await db
    .update(researchKeywords)
    .set(updateData)
    .where(
      and(
        eq(researchKeywords.id, input.id),
        eq(researchKeywords.workspaceId, ctx.workspaceId)
      )
    );

  revalidatePath("/research");
  return { success: true };
}

/**
 * Increment lead / prospect discovery counter for a keyword
 */
export async function incrementKeywordProspectCountAction(id: string) {
  const ctx = await requireAuth();

  await db
    .update(researchKeywords)
    .set({
      prospectsFoundCount: sql`${researchKeywords.prospectsFoundCount} + 1`,
      lastSearchedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(researchKeywords.id, id),
        eq(researchKeywords.workspaceId, ctx.workspaceId)
      )
    );

  revalidatePath("/research");
  return { success: true };
}

/**
 * Delete a single keyword
 */
export async function deleteKeywordAction(id: string) {
  const ctx = await requireAuth();

  await db
    .delete(researchKeywords)
    .where(
      and(
        eq(researchKeywords.id, id),
        eq(researchKeywords.workspaceId, ctx.workspaceId)
      )
    );

  revalidatePath("/research");
  return { success: true };
}

/**
 * Bulk delete keywords
 */
export async function bulkDeleteKeywordsAction(ids: string[]) {
  const ctx = await requireAuth();

  if (ids.length === 0) return { success: true };

  await db
    .delete(researchKeywords)
    .where(
      and(
        eq(researchKeywords.workspaceId, ctx.workspaceId),
        inArray(researchKeywords.id, ids)
      )
    );

  revalidatePath("/research");
  return { success: true };
}

/**
 * Bulk update status
 */
export async function bulkUpdateKeywordsStatusAction(ids: string[], status: string) {
  const ctx = await requireAuth();

  if (ids.length === 0) return { success: true };

  const updateData: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };

  if (status === "SEARCHED") {
    updateData.lastSearchedAt = new Date();
  }

  await db
    .update(researchKeywords)
    .set(updateData)
    .where(
      and(
        eq(researchKeywords.workspaceId, ctx.workspaceId),
        inArray(researchKeywords.id, ids)
      )
    );

  revalidatePath("/research");
  return { success: true };
}

/**
 * Link an existing company/prospect from the database to a research keyword target
 */
export async function linkExistingProspectToKeywordAction({
  keywordId,
  prospectId,
}: {
  keywordId: string;
  prospectId: string;
}) {
  const ctx = await requireAuth();

  const [keyword] = await db
    .select()
    .from(researchKeywords)
    .where(
      and(
        eq(researchKeywords.id, keywordId),
        eq(researchKeywords.workspaceId, ctx.workspaceId)
      )
    )
    .limit(1);

  if (!keyword) return { error: "Keyword target not found" };

  const [prospect] = await db
    .select({ id: prospects.id, name: prospects.name, leadSource: prospects.leadSource })
    .from(prospects)
    .where(
      and(
        eq(prospects.id, prospectId),
        eq(prospects.workspaceId, ctx.workspaceId)
      )
    )
    .limit(1);

  if (!prospect) return { error: "Prospect not found in workspace" };

  // Update prospect leadSource
  const newLeadSource = prospect.leadSource
    ? `${prospect.leadSource} | Research: ${keyword.keyword}`
    : `Market Research: ${keyword.keyword}`;

  await db
    .update(prospects)
    .set({
      leadSource: newLeadSource,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(prospects.id, prospectId),
        eq(prospects.workspaceId, ctx.workspaceId)
      )
    );

  // Increment keyword prospectsFoundCount and preserve workflow status
  await db
    .update(researchKeywords)
    .set({
      prospectsFoundCount: sql`${researchKeywords.prospectsFoundCount} + 1`,
      lastSearchedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(researchKeywords.id, keywordId),
        eq(researchKeywords.workspaceId, ctx.workspaceId)
      )
    );

  await recordAuditLog({
    workspaceId: ctx.workspaceId,
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: "research.prospect_linked",
    entityType: "RESEARCH_KEYWORD",
    entityId: keywordId,
    afterData: {
      keyword: keyword.keyword,
      prospectId,
      prospectName: prospect.name,
    },
  });

  revalidatePath("/research");
  revalidatePath(`/prospects/${prospectId}`);
  revalidatePath("/prospects");

  return { success: true, prospectName: prospect.name };
}

