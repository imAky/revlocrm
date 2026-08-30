import { requireAuth } from "@/lib/permissions/server-guards";
import { db } from "@/lib/db";
import { researchKeywords, users, prospects, memberships } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { ResearchClient } from "@/components/research/research-client";

export default async function ResearchPage() {
  const ctx = await requireAuth();

  const [rawKeywords, rawProspects, workspaceUsers] = await Promise.all([
    db
      .select({
        id: researchKeywords.id,
        workspaceId: researchKeywords.workspaceId,
        userId: researchKeywords.userId,
        userName: users.name,
        userEmail: users.email,
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

    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .leftJoin(memberships, eq(users.id, memberships.userId))
      .where(eq(memberships.workspaceId, ctx.workspaceId)),
  ]);

  const initialKeywords = rawKeywords.map((k) => ({
    ...k,
    userName: k.userName || (k.userId === ctx.userId ? "You" : "Team Member"),
  }));

  // Fallback to all users if memberships query is empty for local dev/demo
  const allWorkspaceUsers =
    workspaceUsers && workspaceUsers.length > 0
      ? workspaceUsers
      : await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
          })
          .from(users);

  return (
    <ResearchClient
      initialKeywords={initialKeywords}
      existingProspects={rawProspects}
      workspaceUsers={allWorkspaceUsers}
      workspaceId={ctx.workspaceId}
      currentUserId={ctx.userId}
      currentUserName={ctx.name || "You"}
    />
  );
}
