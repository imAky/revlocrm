import { db } from "@/lib/db";
import { pipelineStages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const DEFAULT_PIPELINE_STAGE_DEFS = [
  { key: "researching", name: "Researching", color: "slate", isWon: false, isLost: false },
  { key: "qualified", name: "Qualified", color: "blue", isWon: false, isLost: false },
  { key: "ready_to_contact", name: "Ready to Contact", color: "cyan", isWon: false, isLost: false },
  { key: "contacted", name: "Contacted", color: "indigo", isWon: false, isLost: false },
  { key: "engaged", name: "Engaged", color: "purple", isWon: false, isLost: false },
  { key: "discovery_scheduled", name: "Discovery Scheduled", color: "amber", isWon: false, isLost: false },
  { key: "discovery_completed", name: "Discovery Completed", color: "yellow", isWon: false, isLost: false },
  { key: "proposal_sent", name: "Proposal Sent", color: "violet", isWon: false, isLost: false },
  { key: "negotiation", name: "Negotiation", color: "orange", isWon: false, isLost: false },
  { key: "closed_won", name: "Closed Won", color: "emerald", isWon: true, isLost: false },
  { key: "closed_lost", name: "Closed Lost", color: "rose", isWon: false, isLost: true },
  { key: "nurture", name: "Nurture", color: "teal", isWon: false, isLost: false },
  { key: "disqualified", name: "Disqualified", color: "zinc", isWon: false, isLost: false },
];

export async function getOrSeedWorkspaceStages(workspaceId: string) {
  if (!workspaceId) return [];

  let stages = await db
    .select()
    .from(pipelineStages)
    .where(eq(pipelineStages.workspaceId, workspaceId))
    .orderBy(pipelineStages.orderIndex);

  if (stages.length === 0) {
    const valuesToInsert = DEFAULT_PIPELINE_STAGE_DEFS.map((s, i) => ({
      id: `stage_${workspaceId.replace(/[^a-zA-Z0-9]/g, "_")}_${s.key}`,
      workspaceId,
      name: s.name,
      key: s.key,
      description: `Stage: ${s.name}`,
      orderIndex: i,
      color: s.color,
      isSystem: true,
      isClosedWon: s.isWon,
      isClosedLost: s.isLost,
    }));

    try {
      await db.insert(pipelineStages).values(valuesToInsert).onConflictDoNothing();
      stages = await db
        .select()
        .from(pipelineStages)
        .where(eq(pipelineStages.workspaceId, workspaceId))
        .orderBy(pipelineStages.orderIndex);
    } catch (e) {
      console.error("Error auto-seeding pipeline stages for workspace", workspaceId, e);
    }
  }

  return stages;
}
