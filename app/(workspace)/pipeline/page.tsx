import { requireAuth } from "@/lib/permissions/server-guards";
import { db } from "@/lib/db";
import { prospects, pipelineStages, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { PipelineKanbanClient, KanbanStage, KanbanProspect } from "@/components/pipeline/pipeline-kanban-client";

export default async function PipelinePage() {
  const ctx = await requireAuth();

  // 1. Fetch stages
  const stages = await db
    .select()
    .from(pipelineStages)
    .where(eq(pipelineStages.workspaceId, ctx.workspaceId))
    .orderBy(pipelineStages.orderIndex);

  // 2. Fetch active prospects
  const activeProspects = await db
    .select({
      id: prospects.id,
      name: prospects.name,
      niche: prospects.niche,
      city: prospects.city,
      state: prospects.state,
      leadScore: prospects.leadScore,
      leadGrade: prospects.leadGrade,
      dealValue: prospects.dealValue,
      stageId: prospects.stageId,
      assignedToName: users.name,
      googleRating: prospects.googleRating,
      reviewCount: prospects.reviewCount,
    })
    .from(prospects)
    .leftJoin(users, eq(prospects.assignedToId, users.id))
    .where(
      and(
        eq(prospects.workspaceId, ctx.workspaceId),
        eq(prospects.isArchived, false)
      )
    )
    .orderBy(desc(prospects.leadScore));

  return (
    <PipelineKanbanClient
      stages={stages as unknown as KanbanStage[]}
      initialProspects={activeProspects as unknown as KanbanProspect[]}
    />
  );
}
