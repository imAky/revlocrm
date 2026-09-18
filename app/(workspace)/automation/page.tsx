import { Suspense } from "react";
import { requireAuth } from "@/lib/permissions/server-guards";
import { db } from "@/lib/db";
import { researchKeywords, prospects } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { AutomationClient } from "@/components/automation/automation-client";

export default async function AutomationPage() {
  const ctx = await requireAuth();

  // 1. Fetch research target keywords matching research page exactly (ordered by newest first)
  const allResearchKeywords = await db
    .select()
    .from(researchKeywords)
    .where(eq(researchKeywords.workspaceId, ctx.workspaceId))
    .orderBy(desc(researchKeywords.createdAt))
    .limit(250);

  // 2. Derive pending and completed sets
  const pendingKeywords = allResearchKeywords.filter((k) => k.status === "PENDING");
  const searchedKeywords = allResearchKeywords.filter((k) => k.status === "SEARCHED");

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
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-muted-foreground">
          Loading AI Agents Hub...
        </div>
      }
    >
      <AutomationClient
        workspaceId={ctx.workspaceId}
        initialResearchKeywords={allResearchKeywords}
        initialPendingKeywords={pendingKeywords}
        initialSearchedKeywords={searchedKeywords}
        initialAiProspects={aiDiscoveredProspects}
        totalKeywordsCount={Number(totalKeywordsRes[0]?.count || 0)}
        noWebsiteCount={Number(noWebsiteCountRes[0]?.count || 0)}
      />
    </Suspense>
  );
}
