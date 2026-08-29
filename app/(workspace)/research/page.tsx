import { requireAuth } from "@/lib/permissions/server-guards";
import { db } from "@/lib/db";
import { researchKeywords, users, prospects } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { ResearchClient } from "@/components/research/research-client";

export default async function ResearchPage() {
  const ctx = await requireAuth();

  const [rawKeywords, rawProspects] = await Promise.all([
    db
      .select({
        id: researchKeywords.id,
        workspaceId: researchKeywords.workspaceId,
        userId: researchKeywords.userId,
        userName: users.name,
        keyword: researchKeywords.keyword,
        normalizedKeyword: researchKeywords.normalizedKeyword,
        niche: researchKeywords.niche,
        city: researchKeywords.city,
        state: researchKeywords.state,
        country: researchKeywords.country,
        status: researchKeywords.status,
        searchEngine: researchKeywords.searchEngine,
        prospectsFoundCount: researchKeywords.prospectsFoundCount,
        notes: researchKeywords.notes,
        lastSearchedAt: researchKeywords.lastSearchedAt,
        createdAt: researchKeywords.createdAt,
        updatedAt: researchKeywords.updatedAt,
      })
      .from(researchKeywords)
      .leftJoin(users, eq(researchKeywords.userId, users.id))
      .where(eq(researchKeywords.workspaceId, ctx.workspaceId))
      .orderBy(desc(researchKeywords.createdAt)),

    db
      .select({
        id: prospects.id,
        name: prospects.name,
        niche: prospects.niche,
        city: prospects.city,
        state: prospects.state,
        phone: prospects.phone,
        website: prospects.website,
        leadSource: prospects.leadSource,
      })
      .from(prospects)
      .where(
        and(
          eq(prospects.workspaceId, ctx.workspaceId),
          eq(prospects.isArchived, false)
        )
      )
      .orderBy(desc(prospects.createdAt)),
  ]);

  const initialKeywords = rawKeywords.map((k) => ({
    ...k,
    userName: k.userName || "Team Member",
  }));

  return (
    <ResearchClient
      initialKeywords={initialKeywords}
      existingProspects={rawProspects}
      workspaceId={ctx.workspaceId}
      currentUserId={ctx.userId}
    />
  );
}
