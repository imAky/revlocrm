import { requireAuth } from "@/lib/permissions/server-guards";
import { db } from "@/lib/db";
import {
  prospects,
  tasks,
  activities,
  pipelineStages,
  users,
} from "@/lib/db/schema";
import { eq, and, sql, desc, gte, lt } from "drizzle-orm";
import Link from "next/link";
import {
  Building2,
  DollarSign,
  TrendingUp,
  Award,
  AlertCircle,
  CalendarCheck2,
  ArrowUpRight,
  Activity as ActivityIcon,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const ctx = await requireAuth();

  // 1. Fetch total prospects & pipeline value
  const allProspects = await db
    .select({
      id: prospects.id,
      name: prospects.name,
      niche: prospects.niche,
      leadScore: prospects.leadScore,
      leadGrade: prospects.leadGrade,
      dealValue: prospects.dealValue,
      stageId: prospects.stageId,
      assignedToId: prospects.assignedToId,
      createdAt: prospects.createdAt,
      city: prospects.city,
      state: prospects.state,
    })
    .from(prospects)
    .where(
      and(
        eq(prospects.workspaceId, ctx.workspaceId),
        eq(prospects.isArchived, false)
      )
    );

  // 2. Compute metrics
  const totalProspects = allProspects.length;
  const aGradeProspects = allProspects.filter(
    (p) => p.leadGrade === "A+" || p.leadGrade === "A"
  ).length;

  const totalPipelineValue = allProspects.reduce((acc, p) => {
    return acc + (Number(p.dealValue) || 0);
  }, 0);

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newThisWeek = allProspects.filter(
    (p) => new Date(p.createdAt) >= oneWeekAgo
  ).length;

  const myProspects = allProspects.filter((p) => p.assignedToId === ctx.userId);

  // 3. Fetch active pipeline stages with counts
  const stages = await db
    .select()
    .from(pipelineStages)
    .where(eq(pipelineStages.workspaceId, ctx.workspaceId))
    .orderBy(pipelineStages.orderIndex);

  const stageCounts = stages.map((s) => ({
    ...s,
    count: allProspects.filter((p) => p.stageId === s.id).length,
    value: allProspects
      .filter((p) => p.stageId === s.id)
      .reduce((acc, p) => acc + (Number(p.dealValue) || 0), 0),
  }));

  // 4. Fetch overdue and upcoming tasks
  const myTasks = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      dueDate: tasks.dueDate,
      priority: tasks.priority,
      status: tasks.status,
      prospectId: tasks.prospectId,
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.workspaceId, ctx.workspaceId),
        eq(tasks.assignedToId, ctx.userId),
        sql`${tasks.status} != 'COMPLETED'`
      )
    )
    .orderBy(tasks.dueDate)
    .limit(5);

  const now = new Date();
  const overdueTasksCount = myTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now
  ).length;

  // 5. Recent workspace activities
  const recentActivities = await db
    .select({
      id: activities.id,
      type: activities.type,
      title: activities.title,
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
    .limit(6);

  // 6. Prospects by niche
  const nicheMap: Record<string, number> = {};
  for (const p of allProspects) {
    const n = p.niche || "Uncategorized";
    nicheMap[n] = (nicheMap[n] || 0) + 1;
  }
  const nicheEntries = Object.entries(nicheMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Prospecting Overview
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-medium">
              Live Database
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time pipeline metrics, high-scoring leads, and immediate follow-ups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/pipeline">
            <Button size="sm" variant="outline" className="text-xs gap-1.5 font-medium">
              <span>View Pipeline</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Link href="/prospects">
            <Button size="sm" variant="gradient" className="text-xs gap-1.5 shadow-md shadow-indigo-500/20 font-semibold">
              <Building2 className="h-3.5 w-3.5" />
              <span>Browse Prospects</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/30 bg-card p-5 shadow-xs space-y-3 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Prospects
            </span>
            <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground">
              {totalProspects}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-500 dark:text-emerald-400 mt-1 font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+{newThisWeek} new this week</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/30 bg-card p-5 shadow-xs space-y-3 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Pipeline Value
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground">
              ${totalPipelineValue.toLocaleString("en-US", { minimumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Across 13 pipeline stages
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/30 bg-card p-5 shadow-xs space-y-3 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              A-Grade Prospects
            </span>
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground">
              {aGradeProspects}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Score ≥ 70 with verified ICP fit
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/30 bg-card p-5 shadow-xs space-y-3 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              My Pending Tasks
            </span>
            <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-500 dark:text-purple-400 flex items-center justify-center">
              <CalendarCheck2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground">
              {myTasks.length}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 mt-1 font-medium">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{overdueTasksCount} overdue follow-ups</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Pipeline Breakdown + Task Queue + Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pipeline Stage Distribution */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stage Progress Bars */}
          <div className="rounded-2xl border border-border/40 bg-card p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Pipeline Stage Distribution
                </h3>
                <p className="text-xs text-muted-foreground">
                  Active deal distribution by stage and estimated pipeline volume
                </p>
              </div>
              <Link href="/pipeline" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                Kanban View <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {stageCounts
                .filter((s) => s.count > 0 || ["qualified", "proposal_sent", "closed_won"].includes(s.key))
                .map((stage) => (
                  <div key={stage.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="font-medium text-foreground">
                          {stage.name}
                        </span>
                        <span className="text-muted-foreground">
                          ({stage.count} {stage.count === 1 ? "prospect" : "prospects"})
                        </span>
                      </div>
                      <span className="font-semibold text-foreground">
                        ${stage.value.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all"
                        style={{
                          width: `${totalProspects ? (stage.count / totalProspects) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* High Priority Work Queue */}
          <div className="rounded-2xl border border-border/40 bg-card p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  My Priority Work Queue
                </h3>
                <p className="text-xs text-muted-foreground">
                  Follow-ups, research agendas, and scheduled alignment calls
                </p>
              </div>
              <Link href="/tasks" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                All Tasks <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-2">
              {myTasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  🎉 No pending tasks! You're completely caught up.
                </div>
              ) : (
                myTasks.map((t) => {
                  const isOverdue = t.dueDate && new Date(t.dueDate) < now;
                  return (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-muted/20 border border-border/20 flex items-center justify-between hover:border-indigo-500/30 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                          <span>{t.title}</span>
                          <Badge
                            variant={
                              t.priority === "HIGH" || t.priority === "URGENT"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-[9px] px-1.5 py-0"
                          >
                            {t.priority}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {t.dueDate ? (
                            <span className={isOverdue ? "text-rose-500 dark:text-rose-400 font-medium" : ""}>
                              Due: {new Date(t.dueDate).toLocaleDateString()} {isOverdue && "(Overdue)"}
                            </span>
                          ) : (
                            "No due date"
                          )}
                        </div>
                      </div>
                      <Link href={`/tasks`}>
                        <Button size="sm" variant="outline" className="text-[11px] h-7 px-2.5">
                          View
                        </Button>
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Recent Activities & Niche Breakdown */}
        <div className="space-y-6">
          {/* Niche Breakdown */}
          <div className="rounded-2xl border border-border/40 bg-card p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border/30 pb-3">
              Prospects by Industry Niche
            </h3>
            <div className="space-y-2.5">
              {nicheEntries.map(([niche, count]) => (
                <div key={niche} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate max-w-[170px]">
                    {niche}
                  </span>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="rounded-2xl border border-border/40 bg-card p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ActivityIcon className="h-4 w-4 text-indigo-400" />
                Live Activity Feed
              </h3>
              <Link href="/activities" className="text-xs text-primary hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="text-xs space-y-1 p-2.5 rounded-xl bg-slate-50 dark:bg-muted/20 border border-border/20"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-foreground truncate max-w-[140px]">
                      {act.prospectName}
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                      {new Date(act.performedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-[11px] line-clamp-2">
                    {act.title}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground/80">
                    <span>By: {act.userName}</span>
                    <Badge variant="info" className="text-[9px] px-1 py-0 uppercase">
                      {act.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
