"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  DollarSign,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Star,
  ExternalLink,
  Plus,
  MoveRight,
  MoveLeft,
  SlidersHorizontal,
  Search,
  Filter,
  TrendingUp,
  Award,
  CheckCircle2,
  Phone,
  Mail,
  X,
  Target,
  BarChart3,
  Flame,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProspectAction } from "@/lib/actions/prospects";

export interface KanbanStage {
  id: string;
  key: string;
  name: string;
  color: string;
  isClosedWon: boolean;
  isClosedLost: boolean;
}

export interface KanbanProspect {
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
  assignedToName?: string;
  googleRating: string | null;
  reviewCount: number | null;
}

// Confetti Particle Physics Interface
interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  alpha: number;
  shape: "rect" | "circle";
}

export function PipelineKanbanClient({
  stages,
  initialProspects,
}: {
  stages: KanbanStage[];
  initialProspects: KanbanProspect[];
}) {
  const [prospectList, setProspectList] = useState<KanbanProspect[]>(initialProspects);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("ALL");
  const [selectedGrade, setSelectedGrade] = useState("ALL");
  const [minValue, setMinValue] = useState("0");

  // Confetti Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Trigger Confetti Celebration Physics
  const triggerConfetti = useCallback((isWon = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = isWon
      ? ["#10B981", "#34D399", "#F59E0B", "#FCD34D", "#6366F1", "#EC4899"]
      : ["#6366F1", "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EC4899"];

    const particleCount = isWon ? 90 : 50;
    const particles: ConfettiParticle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 400,
        y: canvas.height * 0.35 + (Math.random() - 0.5) * 150,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.8) * 12 - 4,
        size: Math.random() * 8 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        alpha: 1,
        shape: Math.random() > 0.4 ? "rect" : "circle",
      });
    }

    let start = performance.now();
    const duration = isWon ? 2800 : 2000;

    const render = (time: number) => {
      const elapsed = time - start;
      if (elapsed > duration) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.28; // Gravity
        p.vx *= 0.98; // Friction
        p.rotation += p.rotationSpeed;
        p.alpha = Math.max(0, 1 - elapsed / duration);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(render);
  }, []);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Handle Moving Stage with Optimistic UI & Confetti
  const handleMoveStage = async (prospectId: string, nextStageId: string) => {
    const targetStage = stages.find((s) => s.id === nextStageId);
    const isClosedWon = targetStage?.isClosedWon || false;

    // Trigger celebratory confetti effect
    triggerConfetti(isClosedWon);

    // Optimistic UI update
    setProspectList((prev) =>
      prev.map((p) => (p.id === prospectId ? { ...p, stageId: nextStageId } : p))
    );

    await updateProspectAction(prospectId, { stageId: nextStageId });
  };

  // Compute Unique Niches
  const uniqueNiches = useMemo(() => {
    const set = new Set<string>();
    prospectList.forEach((p) => {
      if (p.niche) set.add(p.niche);
    });
    return Array.from(set).sort();
  }, [prospectList]);

  // Filtered Prospects
  const filteredProspects = useMemo(() => {
    return prospectList.filter((p) => {
      if (selectedNiche !== "ALL" && p.niche !== selectedNiche) {
        return false;
      }
      if (selectedGrade === "TIER_A" && p.leadGrade !== "A+" && p.leadGrade !== "A") {
        return false;
      }
      if (selectedGrade === "TIER_B" && p.leadGrade !== "B") {
        return false;
      }
      if (selectedGrade === "TIER_CD" && p.leadGrade !== "C" && p.leadGrade !== "D") {
        return false;
      }
      if (minValue !== "0") {
        const val = Number(p.dealValue) || 0;
        if (val < Number(minValue)) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchNiche = p.niche?.toLowerCase().includes(q) || false;
        const matchCity = p.city?.toLowerCase().includes(q) || false;
        if (!matchName && !matchNiche && !matchCity) return false;
      }
      return true;
    });
  }, [prospectList, selectedNiche, selectedGrade, minValue, searchQuery]);

  // Compute Pipeline Analytics
  const totalValue = filteredProspects.reduce((acc, p) => acc + (Number(p.dealValue) || 0), 0);
  const wonProspects = filteredProspects.filter((p) => {
    const st = stages.find((s) => s.id === p.stageId);
    return st?.isClosedWon;
  });
  const wonValue = wonProspects.reduce((acc, p) => acc + (Number(p.dealValue) || 0), 0);
  const winRate =
    filteredProspects.length > 0
      ? Math.round((wonProspects.length / filteredProspects.length) * 100)
      : 0;
  const avgDeal =
    filteredProspects.length > 0 ? Math.round(totalValue / filteredProspects.length) : 0;

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedNiche !== "ALL" ||
    selectedGrade !== "ALL" ||
    minValue !== "0";

  return (
    <div className="space-y-6 relative">
      {/* Confetti Physics Overlay Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[999999]"
      />

      {/* Top Pipeline Analytics Summary Card */}
      <div className="rounded-2xl border border-border/60 bg-card/70 p-4 sm:p-6 backdrop-blur-md space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>Sales Pipeline Kanban</span>
                <Badge variant="secondary" className="text-xs font-mono">
                  {stages.length} Stages
                </Badge>
              </h1>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Visual deal flow with 1-click stage progression, live deal valuation, and conversion metrics
            </p>
          </div>

          {/* Key Metrics Chips Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            {/* Total Pipeline */}
            <div className="p-3 rounded-2xl bg-muted/40 dark:bg-zinc-900/60 border border-border/60 space-y-0.5">
              <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                <span>Total Pipeline</span>
                <DollarSign className="h-3 w-3 text-primary" />
              </div>
              <p className="text-sm sm:text-base font-bold text-foreground font-mono">
                ${totalValue.toLocaleString()}
              </p>
            </div>

            {/* Closed Won */}
            <div className="p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 space-y-0.5">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-[11px]">
                <span>Closed Won</span>
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              </div>
              <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                ${wonValue.toLocaleString()}
              </p>
            </div>

            {/* Win Rate */}
            <div className="p-3 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/30 space-y-0.5">
              <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 text-[11px]">
                <span>Win Rate</span>
                <TrendingUp className="h-3 w-3 text-indigo-500" />
              </div>
              <p className="text-sm sm:text-base font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                {winRate}% ({wonProspects.length} won)
              </p>
            </div>

            {/* Avg Deal */}
            <div className="p-3 rounded-2xl bg-muted/40 dark:bg-zinc-900/60 border border-border/60 space-y-0.5">
              <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                <span>Avg Deal Size</span>
                <BarChart3 className="h-3 w-3 text-primary" />
              </div>
              <p className="text-sm sm:text-base font-bold text-foreground font-mono">
                ${avgDeal.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/40 text-xs">
          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search company, niche, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 pr-3 text-xs bg-background/90 dark:bg-zinc-950/90 rounded-xl"
            />
          </div>

          {/* Filter Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Niche Filter */}
            {uniqueNiches.length > 0 && (
              <select
                value={selectedNiche}
                onChange={(e) => setSelectedNiche(e.target.value)}
                className="h-8 px-2.5 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="ALL" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                  All Niches ({uniqueNiches.length})
                </option>
                {uniqueNiches.map((n) => (
                  <option key={n} value={n} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                    {n}
                  </option>
                ))}
              </select>
            )}

            {/* Lead Grade Filter */}
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="h-8 px-2.5 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="ALL" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">All ICP Grades</option>
              <option value="TIER_A" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Grade A+ & A Only</option>
              <option value="TIER_B" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Grade B Leads</option>
              <option value="TIER_CD" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Grade C & D Leads</option>
            </select>

            {/* Minimum Deal Value Filter */}
            <select
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              className="h-8 px-2.5 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="0" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Any Deal Value</option>
              <option value="5000" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">$5k+ Deals</option>
              <option value="10000" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">$10k+ High Ticket</option>
              <option value="25000" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">$25k+ Enterprise</option>
            </select>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedNiche("ALL");
                  setSelectedGrade("ALL");
                  setMinValue("0");
                }}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1 rounded-xl cursor-pointer"
              >
                <X className="h-3 w-3" />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-8 pt-1 min-h-[calc(100vh-280px)] scrollbar-thin">
        {stages.map((stage, index) => {
          const stageProspects = filteredProspects.filter((p) => p.stageId === stage.id);
          const stageValue = stageProspects.reduce(
            (acc, p) => acc + (Number(p.dealValue) || 0),
            0
          );
          const previousStage = stages[index - 1];
          const nextStage = stages[index + 1];

          return (
            <div
              key={stage.id}
              className="w-80 shrink-0 rounded-3xl border border-border/70 bg-card/60 dark:bg-[#121218]/90 backdrop-blur-xl p-3.5 flex flex-col justify-between space-y-3 shadow-xs"
            >
              {/* Column Header */}
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-3 w-3 rounded-full shrink-0 shadow-sm ${
                        stage.isClosedWon
                          ? "bg-emerald-500 shadow-emerald-500/50 ring-2 ring-emerald-500/20"
                          : stage.isClosedLost
                          ? "bg-rose-500 shadow-rose-500/50"
                          : "bg-indigo-500 shadow-indigo-500/50"
                      }`}
                    />
                    <h3 className="font-bold text-xs text-foreground truncate max-w-[140px]">
                      {stage.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      #{index + 1}
                    </span>
                    <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">
                      {stageProspects.length}
                    </Badge>
                  </div>
                </div>

                {/* Stage Value Metric */}
                <div className="pt-2 pb-2 text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>Stage Deal Volume</span>
                  <span className="font-bold text-foreground font-mono">
                    ${stageValue.toLocaleString()}
                  </span>
                </div>

                {/* Cards Container (Scrollable) */}
                <div className="space-y-3 mt-1 overflow-y-auto max-h-[calc(100vh-420px)] pr-1 scrollbar-none">
                  {stageProspects.length === 0 ? (
                    <div className="text-center py-10 text-xs text-muted-foreground/60 border border-dashed border-border/50 rounded-2xl bg-card/30">
                      No deals in stage
                    </div>
                  ) : (
                    stageProspects.map((p) => (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-2xl bg-card dark:bg-zinc-900 border border-border/80 shadow-sm hover:border-primary/50 hover:shadow-primary/10 transition-all space-y-2.5 group"
                      >
                        {/* Card Header: Company Name & ICP Score */}
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/prospects/${p.id}`}
                            className="font-bold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-1 flex-1"
                          >
                            {p.name}
                          </Link>

                          <Badge
                            variant={
                              p.leadGrade === "A+" || p.leadGrade === "A"
                                ? "success"
                                : "info"
                            }
                            className="text-[9px] px-1.5 py-0 font-mono shrink-0"
                          >
                            {p.leadScore} ({p.leadGrade})
                          </Badge>
                        </div>

                        {/* Subtitle / Niche & Location */}
                        <div className="text-[11px] text-muted-foreground space-y-0.5">
                          {p.niche && (
                            <span className="block truncate font-medium text-foreground/80">
                              {p.niche}
                            </span>
                          )}
                          {(p.city || p.state) && (
                            <span className="block truncate">
                              {[p.city, p.state].filter(Boolean).join(", ")}
                            </span>
                          )}
                        </div>

                        {/* Quick Reputation & Dial / Email Bar */}
                        <div className="flex items-center justify-between text-[11px] pt-0.5">
                          {p.googleRating ? (
                            <div className="flex items-center gap-1 text-amber-500 font-semibold">
                              <Star className="h-3 w-3 fill-amber-400" />
                              <span>{p.googleRating}</span>
                              <span className="text-muted-foreground font-normal">
                                ({p.reviewCount || 0})
                              </span>
                            </div>
                          ) : (
                            <span />
                          )}

                          {/* Quick Dial & Email Icons */}
                          <div className="flex items-center gap-1.5">
                            {p.phone && (
                              <a
                                href={`tel:${p.phone}`}
                                className="p-1 rounded-md text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                                title={`Call ${p.phone}`}
                              >
                                <Phone className="h-3 w-3" />
                              </a>
                            )}
                            {p.email && (
                              <a
                                href={`mailto:${p.email}`}
                                className="p-1 rounded-md text-indigo-500 hover:bg-indigo-500/10 transition-colors"
                                title={`Email ${p.email}`}
                              >
                                <Mail className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Deal Value & Luxury Stage Dropdown */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                          <span className="font-bold text-foreground font-mono">
                            {p.dealValue ? `$${Number(p.dealValue).toLocaleString()}` : "—"}
                          </span>

                          {/* Fixed Theme-Matching Stage Jump Selector */}
                          <select
                            value={p.stageId || stage.id}
                            onChange={(e) => handleMoveStage(p.id, e.target.value)}
                            className="h-7 text-[11px] font-medium bg-card dark:bg-zinc-900 border border-border/80 rounded-xl px-2 text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer hover:border-primary/50 transition-colors"
                          >
                            {stages.map((s) => (
                              <option
                                key={s.id}
                                value={s.id}
                                className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100 py-1"
                              >
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Bidirectional Step Controls (Back & Next) */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-border/30 text-[10px]">
                          {previousStage ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMoveStage(p.id, previousStage.id)}
                              className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground gap-1 hover:bg-muted rounded-lg cursor-pointer"
                              title={`Roll back to ${previousStage.name}`}
                            >
                              <MoveLeft className="h-3 w-3" />
                              <span>Back</span>
                            </Button>
                          ) : (
                            <span />
                          )}

                          {nextStage ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMoveStage(p.id, nextStage.id)}
                              className="h-6 px-2 text-[10px] text-primary gap-1 hover:bg-primary/10 font-semibold rounded-lg cursor-pointer"
                              title={`Advance to ${nextStage.name}`}
                            >
                              <span>Next</span>
                              <MoveRight className="h-3 w-3" />
                            </Button>
                          ) : (
                            <span />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
