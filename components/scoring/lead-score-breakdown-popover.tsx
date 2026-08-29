"use client";

import { useState, useMemo } from "react";
import { Sparkles, Flame, Star, Globe, Target, BarChart2, Info, ChevronRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { calculateLeadScore, ProspectScoringInput, ScoreResult } from "@/lib/scoring/lead-scorer";
import { ScoringMethodologyModal } from "./scoring-methodology-modal";

interface LeadScoreBreakdownProps {
  score?: number | null;
  grade?: string | null;
  prospectName?: string;
  scoringInput?: ProspectScoringInput;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function LeadScoreBreakdownPopover({
  score: rawScore,
  grade: rawGrade,
  prospectName,
  scoringInput,
  size = "md",
  showLabel = false,
  className = "",
}: LeadScoreBreakdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // Compute or extrapolate score & breakdown
  const computedResult: ScoreResult = useMemo(() => {
    if (scoringInput) {
      return calculateLeadScore(scoringInput);
    }

    const sc = Number(rawScore) || 0;
    let gr: "A+" | "A" | "B" | "C" | "D" = (rawGrade as any) || "C";
    if (!rawGrade) {
      if (sc >= 85) gr = "A+";
      else if (sc >= 70) gr = "A";
      else if (sc >= 50) gr = "B";
      else if (sc >= 30) gr = "C";
      else gr = "D";
    }

    // Proportionally distribute breakdown for accurate visualization
    const ratio = sc / 100;
    return {
      score: sc,
      grade: gr,
      breakdown: {
        commercialScore: Math.round(35 * ratio),
        digitalScore: Math.round(30 * ratio),
        localReputationScore: Math.round(20 * ratio),
        readinessScore: Math.round(15 * ratio),
      },
    };
  }, [scoringInput, rawScore, rawGrade]);

  const { score, grade, breakdown } = computedResult;

  const gradeConfig = useMemo(() => {
    switch (grade) {
      case "A+":
        return {
          variant: "success" as const,
          label: "Hot ICP Lead",
          desc: "Highest conversion potential with verified decision-maker & strong budget.",
          color: "text-emerald-500",
          bgGlow: "from-emerald-500/20 to-teal-500/20",
          border: "border-emerald-500/30",
        };
      case "A":
        return {
          variant: "purple" as const,
          label: "High Priority Target",
          desc: "Strong commercial fit with high ability to pay and good digital maturity.",
          color: "text-indigo-500",
          bgGlow: "from-violet-500/20 to-indigo-500/20",
          border: "border-indigo-500/30",
        };
      case "B":
        return {
          variant: "info" as const,
          label: "Qualified Mid-Market",
          desc: "Solid opportunity ripe for multi-touch email & LinkedIn sequence.",
          color: "text-sky-500",
          bgGlow: "from-sky-500/20 to-blue-500/20",
          border: "border-sky-500/30",
        };
      case "C":
        return {
          variant: "warning" as const,
          label: "Emerging Opportunity",
          desc: "Moderate fit. Enrich additional key contacts before initiating outreach.",
          color: "text-amber-500",
          bgGlow: "from-amber-500/20 to-orange-500/20",
          border: "border-amber-500/30",
        };
      default:
        return {
          variant: "secondary" as const,
          label: "Low Fit / Needs Data",
          desc: "Missing critical digital or contact data. Requires research enrichment.",
          color: "text-slate-400",
          bgGlow: "from-slate-500/20 to-zinc-500/20",
          border: "border-border/60",
        };
    }
  }, [grade]);

  return (
    <>
      <div
        className={`relative inline-block ${className}`}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {/* Trigger Badge */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 focus:outline-none cursor-pointer group"
          aria-label="View Lead Score Breakdown"
        >
          <Badge
            variant={gradeConfig.variant}
            className={`font-mono transition-all group-hover:scale-105 shadow-2xs ${
              size === "sm"
                ? "text-[10px] px-1.5 py-0"
                : size === "lg"
                ? "text-xs px-3 py-1 font-bold"
                : "text-[11px] px-2 py-0.5"
            }`}
          >
            {showLabel && <span className="font-sans font-semibold mr-1">Score:</span>}
            <span>{score}</span>
            <span className="opacity-80">({grade})</span>
            <Info className="h-3 w-3 ml-0.5 opacity-70 group-hover:opacity-100 transition-opacity" />
          </Badge>
        </button>

        {/* Floating Glassmorphic Breakdown Card Popover */}
        {isOpen && (
          <div
            className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-80 sm:w-88 p-4 rounded-3xl bg-white/95 dark:bg-[#121218]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-zinc-800 shadow-2xl text-foreground dark:text-zinc-100 animate-in fade-in zoom-in-95 duration-150 text-xs space-y-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Score Banner */}
            <div className={`p-3 rounded-2xl bg-gradient-to-tr ${gradeConfig.bgGlow} border ${gradeConfig.border} flex items-center justify-between`}>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-foreground">
                    {prospectName ? `${prospectName}` : "ICP Rating"}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-muted-foreground pt-0.5">
                  {gradeConfig.label}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl font-extrabold font-mono text-foreground leading-none">
                  {score}<span className="text-xs text-muted-foreground font-normal">/100</span>
                </div>
                <Badge variant={gradeConfig.variant} className="text-[9px] font-mono font-bold mt-1">
                  Grade {grade}
                </Badge>
              </div>
            </div>

            {/* Explanatory subtitle */}
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {gradeConfig.desc}
            </p>

            {/* 4 Pillars Progress Tracks */}
            <div className="space-y-2.5 pt-1 border-t border-border/40">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Score Formula Dimensions
              </div>

              {/* 1. Commercial Qualification */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-foreground/90 flex items-center gap-1">
                    <span>💼 Commercial Fit</span>
                  </span>
                  <span className="font-mono text-muted-foreground font-semibold">
                    {breakdown.commercialScore} <span className="text-[9px]">/ 35 pts</span>
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                    style={{ width: `${Math.min(100, (breakdown.commercialScore / 35) * 100)}%` }}
                  />
                </div>
              </div>

              {/* 2. Digital Presence */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-foreground/90 flex items-center gap-1">
                    <span>🌐 Digital & Website UX</span>
                  </span>
                  <span className="font-mono text-muted-foreground font-semibold">
                    {breakdown.digitalScore} <span className="text-[9px]">/ 30 pts</span>
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-blue-500 rounded-full"
                    style={{ width: `${Math.min(100, (breakdown.digitalScore / 30) * 100)}%` }}
                  />
                </div>
              </div>

              {/* 3. Local Reputation */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-foreground/90 flex items-center gap-1">
                    <span>⭐ Google Reputation</span>
                  </span>
                  <span className="font-mono text-muted-foreground font-semibold">
                    {breakdown.localReputationScore} <span className="text-[9px]">/ 20 pts</span>
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                    style={{ width: `${Math.min(100, (breakdown.localReputationScore / 20) * 100)}%` }}
                  />
                </div>
              </div>

              {/* 4. Outreach Readiness */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-foreground/90 flex items-center gap-1">
                    <span>🎯 Decision Maker Ready</span>
                  </span>
                  <span className="font-mono text-muted-foreground font-semibold">
                    {breakdown.readinessScore} <span className="text-[9px]">/ 15 pts</span>
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    style={{ width: `${Math.min(100, (breakdown.readinessScore / 15) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Footer Methodology Link */}
            <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Deterministic Formula</span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsMethodologyOpen(true);
                }}
                className="text-primary hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
              >
                <span>Scoring Rules</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Full Methodology Modal */}
      <ScoringMethodologyModal
        open={isMethodologyOpen}
        onOpenChange={setIsMethodologyOpen}
      />
    </>
  );
}
