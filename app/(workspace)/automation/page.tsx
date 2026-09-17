import { requireAuth } from "@/lib/permissions/server-guards";
import { db } from "@/lib/db";
import { researchKeywords, prospects } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { AutomationClient } from "@/components/automation/automation-client";

export default async function AutomationPage() {
  const ctx = await requireAuth();

  // 1. Fetch pending research keywords
  const pendingKeywords = await db
    .select()
    .from(researchKeywords)
    .where(
      and(
        eq(researchKeywords.workspaceId, ctx.workspaceId),
        eq(researchKeywords.status, "PENDING")
      )
    )
    .orderBy(researchKeywords.createdAt)
    .limit(20);

  // 2. Fetch completed/searched keywords with attribution
  const searchedKeywords = await db
    .select()
    .from(researchKeywords)
    .where(
      and(
        eq(researchKeywords.workspaceId, ctx.workspaceId),
        eq(researchKeywords.status, "SEARCHED")
      )
    )
    .orderBy(desc(researchKeywords.lastSearchedAt))
    .limit(10);

  // 3. Fetch recent prospects discovered by the AI Agent
  const aiDiscoveredProspects = await db
    .select()
    .from(prospects)
    .where(
      and(
        eq(prospects.workspaceId, ctx.workspaceId),
        eq(prospects.leadSource, "Revlo AI Agent (Google Maps)")
      )
    )
    .orderBy(desc(prospects.createdAt))
    .limit(25);

  // 4. Counts
  const [totalKeywordsRes, noWebsiteCountRes] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(researchKeywords)
      .where(eq(researchKeywords.workspaceId, ctx.workspaceId)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(prospects)
      .where(
        and(
          eq(prospects.workspaceId, ctx.workspaceId),
          eq(prospects.hasNoWebsiteOpportunity, true)
        )
      ),
  ]);

  return (
    <AutomationClient
      workspaceId={ctx.workspaceId}
      initialPendingKeywords={pendingKeywords}
      initialSearchedKeywords={searchedKeywords}
      initialAiProspects={aiDiscoveredProspects}
      totalKeywordsCount={Number(totalKeywordsRes[0]?.count || 0)}
      noWebsiteCount={Number(noWebsiteCountRes[0]?.count || 0)}
    />
  );
}
