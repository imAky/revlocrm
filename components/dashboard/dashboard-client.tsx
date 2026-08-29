"use client";

import { useState, useMemo } from "react";
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
  Phone,
  Mail,
  ExternalLink,
  Plus,
  Flame,
  Star,
  CheckCircle2,
  Clock,
  Send,
  Users2,
  Sliders,
  Layers,
  BarChart3,
  Calendar,
  Search,
  Filter,
  FileSpreadsheet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface DashboardProspect {
  id: string;
  name: string;
  niche: string | null;
  city: string | null;
  state: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  leadScore: number;
  leadGrade: string;
  dealValue: string | null;
  stageId: string | null;
  assignedToId?: string | null;
  assignedToName?: string | null;
  createdAt: string | Date;
  nextFollowUpDate?: string | Date | null;
  googleRating?: string | null;
  reviewCount?: number | null;
  outreachStatus?: string | null;
}

export interface DashboardStage {
  id: string;
  key: string;
  name: string;
  color?: string | null;
  isClosedWon: boolean;
  isClosedLost: boolean;
  orderIndex: number;
  count: number;
  value: number;
}

export interface DashboardTask {
  id: string;
  title: string;
  dueDate?: string | Date | null;
  priority: string;
  status: string;
  prospectId?: string | null;
  prospectName?: string | null;
}

export interface DashboardActivity {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  outcome?: string | null;
  performedAt: string | Date;
  prospectId: string;
  prospectName: string;
  userName?: string | null;
}

export interface NicheMetric {
  niche: string;
  count: number;
  value: number;
}

const ACTIVITY_ICONS: Record<string, { icon: any; color: string }> = {
  EMAIL: { icon: Mail, color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" },
  PHONE: { icon: Phone, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  MEETING: { icon: Calendar, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
  LINKEDIN: { icon: Send, color: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
  RESEARCH: { icon: Search, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  NOTE: { icon: ActivityIcon, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
};

import { LeadScoreBreakdownPopover } from "@/components/scoring/lead-score-breakdown-popover";
import { ScoringMethodologyModal } from "@/components/scoring/scoring-methodology-modal";

export function DashboardClient({
  allProspects,
  stages,
  myTasks,
  recentActivities,
  nicheMetrics,
  currentUserName,
}: {
  allProspects: DashboardProspect[];
  stages: DashboardStage[];
  myTasks: DashboardTask[];
  recentActivities: DashboardActivity[];
  nicheMetrics: NicheMetric[];
  currentUserName: string;
}) {
  const [activeTab, setActiveTab] = useState<"ALL" | "HOT_LEADS" | "MY_QUEUE">("ALL");
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // Core Calculations
  const totalProspects = allProspects.length;

  const totalPipelineValue = useMemo(() => {
    return allProspects.reduce((acc, p) => acc + (Number(p.dealValue) || 0), 0);
  }, [allProspects]);

  const wonProspects = useMemo(() => {
    return allProspects.filter((p) => {
      const st = stages.find((s) => s.id === p.stageId);
      return st?.isClosedWon;
    });
  }, [allProspects, stages]);

  const wonValue = useMemo(() => {
    return wonProspects.reduce((acc, p) => acc + (Number(p.dealValue) || 0), 0);
  }, [wonProspects]);

  const winRate = totalProspects > 0 ? Math.round((wonProspects.length / totalProspects) * 100) : 0;

  const hotLeads = useMemo(() => {
    return allProspects
      .filter((p) => p.leadGrade === "A+" || p.leadGrade === "A" || p.leadScore >= 70)
      .sort((a, b) => b.leadScore - a.leadScore);
  }, [allProspects]);

  const avgLeadScore = useMemo(() => {
    if (allProspects.length === 0) return 0;
    const total = allProspects.reduce((acc, p) => acc + (p.leadScore || 0), 0);
    return Math.round(total / allProspects.length);
  }, [allProspects]);

  const now = new Date();
  const overdueTasksCount = myTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE" && t.status !== "COMPLETED"
  ).length;

  // Grade Breakdown
  const gradeBreakdown = useMemo(() => {
    const counts = { aPlus: 0, a: 0, b: 0, cd: 0 };
    allProspects.forEach((p) => {
      if (p.leadGrade === "A+") counts.aPlus++;
      else if (p.leadGrade === "A") counts.a++;
      else if (p.leadGrade === "B") counts.b++;
      else counts.cd++;
    });
    return counts;
  }, [allProspects]);

  return (
    <div className="space-y-6">
      {/* Top Welcome Command Banner */}
      <div className="rounded-3xl border border-border/70 bg-card/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                <span>Executive Command Center</span>
                <Badge variant="secondary" className="text-[11px] font-mono">
                  LIVE WORKSPACE
                </Badge>
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Welcome back, <strong className="text-foreground">{currentUserName}</strong>. Here is your real-time sales pipeline valuation, ICP distribution, and priority outreach queue.
            </p>
          </div>

          {/* Quick Shortcuts Bar */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            <Link href="/prospects">
              <Button
                size="sm"
                variant="gradient"
                className="gap-1.5 text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Prospect</span>
              </Button>
            </Link>

            <Link href="/pipeline">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs font-semibold rounded-xl border-border/80 cursor-pointer shadow-2xs"
              >
                <Layers className="h-3.5 w-3.5 text-indigo-500" />
                <span>Pipeline Kanban</span>
              </Button>
            </Link>

            <Link href="/contacts">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs font-semibold rounded-xl border-border/80 cursor-pointer shadow-2xs"
              >
                <Users2 className="h-3.5 w-3.5 text-primary" />
                <span>Contacts</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Core Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pipeline Valuation */}
        <div className="rounded-3xl border border-border/70 bg-card/90 dark:bg-zinc-900/90 p-5 shadow-xs space-y-3 relative overflow-hidden group hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Pipeline Value
            </span>
            <div className="h-9 w-9 rounded-2xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-2xs">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
              ${totalPipelineValue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>${wonValue.toLocaleString()} Closed Won ({winRate}%)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Verified Prospects */}
        <div className="rounded-3xl border border-border/70 bg-card/90 dark:bg-zinc-900/90 p-5 shadow-xs space-y-3 relative overflow-hidden group hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Active Prospects
            </span>
            <div className="h-9 w-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-2xs">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
              {totalProspects}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>Across {stages.length} pipeline stages</span>
            </div>
          </div>
        </div>

        {/* Card 3: Hot Tier-A Leads */}
        <div className="rounded-3xl border border-border/70 bg-card/90 dark:bg-zinc-900/90 p-5 shadow-xs space-y-3 relative overflow-hidden group hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span>Hot ICP Leads (A+ / A)</span>
            </span>
            <button
              type="button"
              onClick={() => setIsMethodologyOpen(true)}
              className="h-8 px-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center gap-1 text-[11px] font-bold border border-amber-500/20 shadow-2xs transition-colors cursor-pointer"
              title="Click to view full ICP Scoring Formula & Methodology"
            >
              <Flame className="h-3.5 w-3.5" />
              <span>Formula</span>
            </button>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
              {hotLeads.length}
            </div>
            <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
              <Star className="h-3.5 w-3.5 fill-amber-400" />
              <span>Avg ICP Lead Score: {avgLeadScore} / 100</span>
            </div>
          </div>
        </div>

        {/* Card 4: Follow-up Tasks */}
        <div className="rounded-3xl border border-border/70 bg-card/90 dark:bg-zinc-900/90 p-5 shadow-xs space-y-3 relative overflow-hidden group hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Follow-Up Tasks
            </span>
            <div className="h-9 w-9 rounded-2xl bg-purple-500/10 text-purple-500 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shadow-2xs">
              <CalendarCheck2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
              {myTasks.length}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-rose-500 dark:text-rose-400 mt-1 font-medium">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{overdueTasksCount} overdue touchpoints</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Pipeline Funnel & Priority Queue vs Activity Stream & Niche Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Pipeline Stage Distribution + Priority Outreach Queue */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Pipeline Stage Distribution Funnel Widget */}
          <div className="rounded-3xl border border-border/70 bg-card/90 dark:bg-zinc-900/90 backdrop-blur-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span>Pipeline Stage Distribution & Deal Volume</span>
                </h3>
                <p className="text-xs text-muted-foreground pt-0.5">
                  Active deal progression across configured conversion stages
                </p>
              </div>
              <Link
                href="/pipeline"
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <span>Kanban Board</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-3.5 pt-1">
              {stages
                .filter((s) => s.count > 0 || ["qualified", "proposal_sent", "closed_won"].includes(s.key))
                .map((stage) => {
                  const percent = totalProspects ? Math.round((stage.count / totalProspects) * 100) : 0;
                  return (
                    <div key={stage.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2.5 w-2.5 rounded-full ${
                              stage.isClosedWon
                                ? "bg-emerald-500"
                                : stage.isClosedLost
                                ? "bg-rose-500"
                                : "bg-indigo-500"
                            }`}
                          />
                          <span className="font-bold text-foreground truncate max-w-[180px]">
                            {stage.name}
                          </span>
                          <span className="text-muted-foreground text-[11px]">
                            ({stage.count} {stage.count === 1 ? "deal" : "deals"} • {percent}%)
                          </span>
                        </div>
                        <span className="font-bold text-foreground font-mono">
                          ${stage.value.toLocaleString()}
                        </span>
                      </div>

                      {/* Progress Track */}
                      <div className="h-2.5 w-full bg-muted/60 dark:bg-zinc-950 rounded-full overflow-hidden border border-border/40">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            stage.isClosedWon
                              ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                              : stage.isClosedLost
                              ? "bg-gradient-to-r from-rose-500 to-red-400"
                              : "bg-gradient-to-r from-violet-500 to-indigo-500"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* 2. Priority Outreach & Hot ICP Leads Queue */}
          <div className="rounded-3xl border border-border/70 bg-card/90 dark:bg-zinc-900/90 backdrop-blur-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Flame className="h-4 w-4 text-amber-500" />
                  <span>Priority Outreach & High-Grade Leads Queue</span>
                </h3>
                <p className="text-xs text-muted-foreground pt-0.5">
                  Top ICP-rated companies requiring immediate sales touchpoints
                </p>
              </div>

              <Link
                href="/prospects"
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                <span>View All ({allProspects.length})</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {hotLeads.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-card/80 dark:bg-zinc-950/70 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/50 transition-all shadow-2xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/prospects/${p.id}`}
                        className="font-bold text-xs text-foreground hover:text-primary transition-colors truncate"
                      >
                        {p.name}
                      </Link>
                      <LeadScoreBreakdownPopover
                        score={p.leadScore}
                        grade={p.leadGrade}
                        prospectName={p.name}
                        size="sm"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      {p.niche && <span className="font-medium text-foreground/80">{p.niche}</span>}
                      {(p.city || p.state) && (
                        <span>• {[p.city, p.state].filter(Boolean).join(", ")}</span>
                      )}
                      {p.dealValue && (
                        <span className="font-mono text-primary font-semibold">
                          • ${Number(p.dealValue).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 1-Click Quick Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                    {p.phone && (
                      <a
                        href={`tel:${p.phone}`}
                        className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                        title={`Dial ${p.phone}`}
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {p.email && (
                      <a
                        href={`mailto:${p.email}`}
                        className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
                        title={`Email ${p.email}`}
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <Link href={`/prospects/${p.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2.5 text-xs font-semibold rounded-xl border-border/80 hover:bg-muted"
                      >
                        <span>Profile</span>
                        <ChevronRight className="h-3 w-3 ml-0.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: ICP Quality Matrix + Live Activity Feed + Niche Ranking */}
        <div className="space-y-6">
          {/* 1. ICP Quality Tier Matrix */}
          <div className="rounded-3xl border border-border/70 bg-card/90 dark:bg-zinc-900/90 backdrop-blur-xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b border-border/40 pb-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <span>ICP Lead Tier Distribution</span>
            </h3>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 space-y-0.5">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                  Tier A+ (Score 80-100)
                </span>
                <p className="text-lg font-extrabold text-foreground font-mono">
                  {gradeBreakdown.aPlus}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/25 space-y-0.5">
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase">
                  Tier A (Score 70-79)
                </span>
                <p className="text-lg font-extrabold text-foreground font-mono">
                  {gradeBreakdown.a}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-muted/40 dark:bg-zinc-950/60 border border-border/60 space-y-0.5">
                <span className="text-[10px] text-muted-foreground font-bold uppercase">
                  Tier B (Score 50-69)
                </span>
                <p className="text-lg font-extrabold text-foreground font-mono">
                  {gradeBreakdown.b}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-muted/40 dark:bg-zinc-950/60 border border-border/60 space-y-0.5">
                <span className="text-[10px] text-muted-foreground font-bold uppercase">
                  Tier C / D (&lt;50)
                </span>
                <p className="text-lg font-extrabold text-foreground font-mono">
                  {gradeBreakdown.cd}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Live Activity Feed (Fixed Dark Mode Theme) */}
          <div className="rounded-3xl border border-border/70 bg-card/90 dark:bg-zinc-900/90 backdrop-blur-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ActivityIcon className="h-4 w-4 text-indigo-400" />
                <span>Live Outreach Activity Feed</span>
              </h3>
              <Badge variant="secondary" className="text-[10px] font-mono">
                Recent
              </Badge>
            </div>

            <div className="space-y-3">
              {recentActivities.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border/50 rounded-2xl bg-card/30">
                  No outreach activity recorded yet.
                </div>
              ) : (
                recentActivities.map((act) => {
                  const cfg = ACTIVITY_ICONS[act.type.toUpperCase()] || ACTIVITY_ICONS.NOTE;
                  const Icon = cfg.icon;

                  return (
                    <div
                      key={act.id}
                      className="p-3 rounded-2xl bg-card/80 dark:bg-zinc-950/70 border border-border/60 space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <Link
                          href={`/prospects/${act.prospectId}`}
                          className="font-bold text-foreground hover:text-primary transition-colors truncate"
                        >
                          {act.prospectName}
                        </Link>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {new Date(act.performedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-foreground/90 line-clamp-2 leading-relaxed">
                        {act.title}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground border-t border-border/30">
                        <span>By {act.userName || "Team Member"}</span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] uppercase font-mono px-1.5 py-0 border ${cfg.color}`}
                        >
                          {act.type}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 3. Top Industry Niches Ranking */}
          <div className="rounded-3xl border border-border/70 bg-card/90 dark:bg-zinc-900/90 backdrop-blur-xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b border-border/40 pb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Top Industry Niches</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              {nicheMetrics.slice(0, 5).map((item, idx) => (
                <div
                  key={item.niche}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-card/60 dark:bg-zinc-950/50 border border-border/50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[11px] text-muted-foreground font-bold">
                      #{idx + 1}
                    </span>
                    <span className="font-medium text-foreground truncate max-w-[140px]">
                      {item.niche}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {item.count} {item.count === 1 ? "lead" : "leads"}
                    </Badge>
                    <span className="font-bold text-foreground font-mono text-[11px]">
                      ${item.value.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Full Methodology Explainer Modal */}
      <ScoringMethodologyModal
        open={isMethodologyOpen}
        onOpenChange={setIsMethodologyOpen}
      />
    </div>
  );
}
