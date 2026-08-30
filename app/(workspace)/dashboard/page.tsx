import { requireAuth } from "@/lib/permissions/server-guards";
import { db } from "@/lib/db";
import {
  prospects,
  tasks,
  activities,
  pipelineStages,
  users,
} from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getOrSeedWorkspaceStages } from "@/lib/db/stages";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const ctx = await requireAuth();

  // 1. Fetch all active prospects for workspace
  const [allProspects, rawStages, myTasks, recentActivities] = await Promise.all([
    db
      .select({
        id: prospects.id,
        name: prospects.name,
        niche: prospects.niche,
        city: prospects.city,
        state: prospects.state,
        country: prospects.country,
        leadScore: prospects.leadScore,
        leadGrade: prospects.leadGrade,
        dealValue: prospects.dealValue,
        stageId: prospects.stageId,
        assignedToId: prospects.assignedToId,
        website: prospects.website,
        phone: prospects.phone,
        googleRating: prospects.googleRating,
        reviewCount: prospects.reviewCount,
        businessStatus: prospects.businessStatus,
        createdAt: prospects.createdAt,
      })
      .from(prospects)
      .where(
        and(
          eq(prospects.workspaceId, ctx.workspaceId),
          eq(prospects.isArchived, false)
        )
      )
      .orderBy(desc(prospects.leadScore)),

    // 2. Fetch pipeline stages (Guaranteed 13 stages)
    getOrSeedWorkspaceStages(ctx.workspaceId),

    // 3. Fetch user tasks
    db
      .select({
        id: tasks.id,
        title: tasks.title,
        dueDate: tasks.dueDate,
        priority: tasks.priority,
        status: tasks.status,
        prospectId: tasks.prospectId,
        prospectName: prospects.name,
      })
      .from(tasks)
      .leftJoin(prospects, eq(tasks.prospectId, prospects.id))
      .where(
        and(
          eq(tasks.workspaceId, ctx.workspaceId),
          sql`${tasks.status} != 'DONE' AND ${tasks.status} != 'COMPLETED'`
        )
      )
      .orderBy(tasks.dueDate)
      .limit(6),

    // 4. Fetch recent workspace activities
    db
      .select({
        id: activities.id,
        type: activities.type,
        title: activities.title,
        description: activities.description,
        outcome: activities.outcome,
        performedAt: activities.performedAt,
        prospectId: activities.prospectId,
        prospectName: prospects.name,
        userName: users.name,
      })
      .from(activities)
      .innerJoin(prospects, eq(activities.prospectId, prospects.id))
      .innerJoin(users, eq(activities.userId, users.id))
      .where(eq(activities.workspaceId, ctx.workspaceId))
      .orderBy(desc(activities.performedAt))
      .limit(8),
  ]);

  // Aggregate stage metrics
  const stagesWithMetrics = rawStages.map((s) => {
    const stageProspects = allProspects.filter((p) => p.stageId === s.id);
    return {
      id: s.id,
      key: s.key,
      name: s.name,
      color: s.color,
      isClosedWon: s.isClosedWon,
      isClosedLost: s.isClosedLost,
      orderIndex: s.orderIndex,
      count: stageProspects.length,
      value: stageProspects.reduce((acc, p) => acc + (Number(p.dealValue) || 0), 0),
    };
  });

  // Aggregate niche metrics
  const nicheMap: Record<string, { count: number; value: number }> = {};
  for (const p of allProspects) {
    const n = p.niche || "General / Uncategorized";
    if (!nicheMap[n]) {
      nicheMap[n] = { count: 0, value: 0 };
    }
    nicheMap[n].count += 1;
    nicheMap[n].value += Number(p.dealValue) || 0;
  }

  const nicheMetrics = Object.entries(nicheMap)
    .map(([niche, stat]) => ({ niche, count: stat.count, value: stat.value }))
    .sort((a, b) => b.value - a.value || b.count - a.count);

  return (
    <DashboardClient
      allProspects={allProspects}
      stages={stagesWithMetrics}
      myTasks={myTasks}
      recentActivities={recentActivities}
      nicheMetrics={nicheMetrics}
      currentUserName={ctx.name || ctx.email.split("@")[0]}
    />
  );
}
