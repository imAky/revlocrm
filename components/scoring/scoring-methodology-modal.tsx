"use client";

import { useState } from "react";
import { Sparkles, ShieldCheck, Flame, Star, Globe, Target, BarChart2, Info, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ScoringMethodologyModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121218] text-foreground dark:text-zinc-100 border border-slate-200/90 dark:border-zinc-800 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 pb-2 border-b border-border/60">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Revlo ICP Lead Scoring & Grading Methodology
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Deterministic 100-point multi-dimensional algorithmic grading framework
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2 text-xs">
          {/* Overview Callout */}
          <div className="p-3.5 rounded-2xl bg-muted/40 dark:bg-zinc-950/60 border border-border/60 text-muted-foreground text-[11px] leading-relaxed">
            Every prospect is automatically scored from <strong>0 to 100</strong> across four weighted commercial dimensions. The resulting composite score dictates the lead's <strong>ICP Grade (A+, A, B, C, D)</strong> to help sales teams prioritize outreach to high-conversion opportunities.
          </div>

          {/* 4 Pillars Breakdown */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4 text-primary" />
              <span>The 4 Weighted Scoring Pillars (100 Max Points)</span>
            </h4>

            {/* Pillar 1: Commercial Qualification (35 pts) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200/70 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-xs">1. Commercial Qualification</span>
                  <Badge variant="purple" className="text-[10px] font-mono font-bold">
                    Max 35 Pts
                  </Badge>
                </div>
                <span className="text-[10px] font-semibold text-primary">35% Total Weight</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Evaluates business revenue fit, budget capacity, timeline urgency, and active buying intent.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="flex items-center gap-1.5 text-foreground/90">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                  <span>ICP Fit (High: +10, Med: +6, Low: +2)</span>
                </div>
                <div className="flex items-center gap-1.5 text-foreground/90">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                  <span>Ability to Pay / Budget (+4 to +10 pts)</span>
                </div>
                <div className="flex items-center gap-1.5 text-foreground/90">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                  <span>Deal Urgency & Timeline (+3 to +10 pts)</span>
                </div>
                <div className="flex items-center gap-1.5 text-foreground/90">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                  <span>Detected Buying Signals (+5 pts)</span>
                </div>
              </div>
            </div>

            {/* Pillar 2: Digital Presence (30 pts) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200/70 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-xs">2. Digital Presence & Website UX</span>
                  <Badge variant="info" className="text-[10px] font-mono font-bold">
                    Max 30 Pts
                  </Badge>
                </div>
                <span className="text-[10px] font-semibold text-sky-500">30% Total Weight</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Evaluates online maturity, website responsiveness, booking flows, and call-to-action quality.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="flex items-center gap-1.5 text-foreground/90">
                  <CheckCircle2 className="h-3 w-3 text-sky-500 shrink-0" />
                  <span>Active Website / Domain (+5 pts)</span>
                </div>
                <div className="flex items-center gap-1.5 text-foreground/90">
                  <CheckCircle2 className="h-3 w-3 text-sky-500 shrink-0" />
                  <span>Mobile & Desktop UX (+1 to +8 pts)</span>
                </div>
                <div className="flex items-center gap-1.5 text-foreground/90">
                  <CheckCircle2 className="h-3 w-3 text-sky-500 shrink-0" />
                  <span>Call-To-Action Quality (+1 to +8 pts)</span>
                </div>
                <div className="flex items-center gap-1.5 text-foreground/90">
                  <CheckCircle2 className="h-3 w-3 text-sky-500 shrink-0" />
                  <span>Online Quote / Booking Flow (+3 pts)</span>
                </div>
              </div>
            </div>

            {/* Pillar 3: Local Google Reputation (20 pts) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200/70 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-xs">3. Local Google Maps Reputation</span>
                  <Badge variant="warning" className="text-[10px] font-mono font-bold">
                    Max 20 Pts
                  </Badge>
                </div>
                <span className="text-[10px] font-semibold text-amber-500">20% Total Weight</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Measures market proof and public authority using verified Google Maps star ratings & review volume.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="flex items-center gap-1.5 text-foreground/90">
                  <CheckCircle2 className="h-3 w-3 text-amber-500 shrink-0" />
                  <span>Google Star Rating (&ge;4.5★: +10, &ge;4.0★: +7, &ge;3.0★: +4)</span>
                </div>
                <div className="flex items-center gap-1.5 text-foreground/90">
                  <CheckCircle2 className="h-3 w-3 text-amber-500 shrink-0" />
                  <span>Review Volume (&ge;50: +10, &ge;20: +7, &ge;5: +4)</span>
                </div>
              </div>
            </div>

            {/* Pillar 4: Outreach Readiness (15 pts) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200/70 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-xs">4. Outreach Readiness & Key Contact</span>
                  <Badge variant="success" className="text-[10px] font-mono font-bold">
                    Max 15 Pts
                  </Badge>
                </div>
                <span className="text-[10px] font-semibold text-emerald-500">15% Total Weight</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Assesses whether actionable decision-maker contact intelligence and organic visibility exist.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="flex items-center gap-1.5 text-foreground/90">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                  <span>Verified C-Level / Decision Maker on File (+10 pts)</span>
                </div>
                <div className="flex items-center gap-1.5 text-foreground/90">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                  <span>SEO Ranking / Search Visibility (+5 pts)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Grade Tiers Scale */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">
              ICP Grade Scale & Recommended Action
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>Grade A+ (85 – 100 pts)</span>
                  <Badge variant="success" className="text-[9px]">Hot ICP Lead</Badge>
                </div>
                <p className="text-[11px] opacity-90">
                  Highest priority target. Immediate direct outreach via phone & personalized email.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>Grade A (70 – 84 pts)</span>
                  <Badge variant="purple" className="text-[9px]">High Priority</Badge>
                </div>
                <p className="text-[11px] opacity-90">
                  High commercial fit. Schedule follow-up touches and proposal presentation.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-700 dark:text-sky-300 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>Grade B (50 – 69 pts)</span>
                  <Badge variant="info" className="text-[9px]">Mid-Market Fit</Badge>
                </div>
                <p className="text-[11px] opacity-90">
                  Solid opportunity. Run standard multi-touch email & LinkedIn sequence.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>Grade C (30 – 49 pts)</span>
                  <Badge variant="warning" className="text-[9px]">Nurture Target</Badge>
                </div>
                <p className="text-[11px] opacity-90">
                  Moderate fit. Enrich additional decision-maker contacts before calling.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-border/60">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto rounded-xl text-xs cursor-pointer"
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
