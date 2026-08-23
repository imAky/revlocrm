import { requireAuth } from "@/lib/permissions/server-guards";
import { db } from "@/lib/db";
import { prospects, pipelineStages, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { ProspectsTableClient, ProspectItem } from "@/components/prospects/prospects-table-client";

export default async function ProspectsPage() {
  const ctx = await requireAuth();

  // 1. Fetch prospects with joins for stage & assigned user
  const rawProspects = await db
    .select({
      id: prospects.id,
      name: prospects.name,
      legalName: prospects.legalName,
      category: prospects.category,
      niche: prospects.niche,
      website: prospects.website,
      city: prospects.city,
      state: prospects.state,
      country: prospects.country,
      phone: prospects.phone,
      email: prospects.email,
      businessStatus: prospects.businessStatus,
      googleRating: prospects.googleRating,
      reviewCount: prospects.reviewCount,
      leadScore: prospects.leadScore,
      leadGrade: prospects.leadGrade,
      icpFit: prospects.icpFit,
      urgency: prospects.urgency,
      dealValue: prospects.dealValue,
      stageId: prospects.stageId,
      stageName: pipelineStages.name,
      stageColor: pipelineStages.color,
      assignedToId: prospects.assignedToId,
      assignedToName: users.name,
      mainOpportunity: prospects.mainOpportunity,
      buyingSignals: prospects.buyingSignals,
      createdAt: prospects.createdAt,
      updatedAt: prospects.updatedAt,
    })
    .from(prospects)
    .leftJoin(pipelineStages, eq(prospects.stageId, pipelineStages.id))
    .leftJoin(users, eq(prospects.assignedToId, users.id))
    .where(
      and(
        eq(prospects.workspaceId, ctx.workspaceId),
        eq(prospects.isArchived, false)
      )
    )
    .orderBy(desc(prospects.leadScore));

  // 2. Fetch stages
  const stages = await db
    .select({ id: pipelineStages.id, name: pipelineStages.name, color: pipelineStages.color })
    .from(pipelineStages)
    .where(eq(pipelineStages.workspaceId, ctx.workspaceId))
    .orderBy(pipelineStages.orderIndex);

  // 3. Fetch workspace users
  const workspaceUsers = await db
    .select({ id: users.id, name: users.name })
    .from(users);

  const canDelete = ctx.roleName === "admin" || ctx.permissions.has("prospects.delete");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Prospect Research Directory
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {rawProspects.length} qualified companies ready for outreach and pipeline progression.
          </p>
        </div>
      </div>

      {/* Main Table / Grid View */}
      <ProspectsTableClient
        initialProspects={rawProspects as ProspectItem[]}
        stages={stages}
        usersList={workspaceUsers}
        canDelete={canDelete}
      />
    </div>
  );
}
