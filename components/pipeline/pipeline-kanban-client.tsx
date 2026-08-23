"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  leadScore: number;
  leadGrade: string;
  dealValue: string | null;
  stageId: string | null;
  assignedToName?: string;
  googleRating: string | null;
  reviewCount: number | null;
}

export function PipelineKanbanClient({
  stages,
  initialProspects,
}: {
  stages: KanbanStage[];
  initialProspects: KanbanProspect[];
}) {
  const [prospectList, setProspectList] = useState<KanbanProspect[]>(initialProspects);

  const handleMoveStage = async (prospectId: string, nextStageId: string) => {
    // Optimistic UI update
    setProspectList((prev) =>
      prev.map((p) => (p.id === prospectId ? { ...p, stageId: nextStageId } : p))
    );
    await updateProspectAction(prospectId, { stageId: nextStageId });
  };

  // Compute total pipeline stats
  const totalValue = prospectList.reduce((acc, p) => acc + (Number(p.dealValue) || 0), 0);
  const wonValue = prospectList
    .filter((p) => {
      const st = stages.find((s) => s.id === p.stageId);
      return st?.isClosedWon;
    })
    .reduce((acc, p) => acc + (Number(p.dealValue) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Pipeline Summary Bar */}
      <div className="rounded-2xl border border-border/60 bg-card/70 p-4 sm:p-5 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Sales Pipeline Kanban
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              {stages.length} Configured Stages
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Advance or roll back stages with 1 click, or jump to any stage directly.
          </p>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 text-xs">
          <div className="p-2 sm:p-2.5 rounded-xl bg-background/50 border border-border/40">
            <span className="text-muted-foreground block text-[10px] sm:text-[11px]">Total Pipeline:</span>
            <span className="font-bold text-foreground text-xs sm:text-sm">
              ${totalValue.toLocaleString()}
            </span>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-emerald-400 block text-[10px] sm:text-[11px]">Closed Won:</span>
            <span className="font-bold text-emerald-400 text-xs sm:text-sm">
              ${wonValue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 min-h-[calc(100vh-260px)]">
        {stages.map((stage, index) => {
          const stageProspects = prospectList.filter((p) => p.stageId === stage.id);
          const stageValue = stageProspects.reduce(
            (acc, p) => acc + (Number(p.dealValue) || 0),
            0
          );
          const previousStage = stages[index - 1];
          const nextStage = stages[index + 1];

          return (
            <div
              key={stage.id}
              className="w-72 shrink-0 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-md p-3 flex flex-col justify-between space-y-3"
            >
              {/* Column Header */}
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
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
                    <h3 className="font-semibold text-xs text-foreground truncate max-w-[130px]">
                      {stage.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      #{index + 1}
                    </span>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {stageProspects.length}
                    </Badge>
                  </div>
                </div>

                <div className="pt-1.5 pb-2 text-[11px] text-muted-foreground flex justify-between">
                  <span>Volume</span>
                  <span className="font-semibold text-foreground">
                    ${stageValue.toLocaleString()}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-2.5 mt-1 overflow-y-auto max-h-[calc(100vh-380px)] pr-1">
                  {stageProspects.length === 0 ? (
                    <div className="text-center py-8 text-[11px] text-muted-foreground/60 border border-dashed border-border/40 rounded-xl">
                      Empty stage
                    </div>
                  ) : (
                    stageProspects.map((p) => (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-xl bg-card border border-border/50 shadow-sm hover:border-indigo-500/50 hover:shadow-indigo-500/10 transition-all space-y-2 group"
                      >
                        <div className="flex items-start justify-between">
                          <Link href={`/prospects/${p.id}`} className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors block">
                            {p.name}
                          </Link>
                          <Badge
                            variant={
                              p.leadGrade === "A+" || p.leadGrade === "A"
                                ? "success"
                                : "info"
                            }
                            className="text-[9px] px-1 py-0 font-mono"
                          >
                            {p.leadScore} ({p.leadGrade})
                          </Badge>
                        </div>

                        <div className="text-[11px] text-muted-foreground">
                          {p.niche && <span className="block truncate">{p.niche}</span>}
                          {p.city && <span>{p.city}, {p.state}</span>}
                        </div>

                        {p.googleRating && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-400">
                            <Star className="h-3 w-3 fill-amber-400" />
                            <span>{p.googleRating} ({p.reviewCount || 0})</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-border/30 text-xs">
                          <span className="font-bold text-foreground">
                            {p.dealValue ? `$${Number(p.dealValue).toLocaleString()}` : "—"}
                          </span>

                          {/* Direct Stage Jump Selector */}
                          <select
                            value={p.stageId || stage.id}
                            onChange={(e) => handleMoveStage(p.id, e.target.value)}
                            className="h-6 text-[10px] bg-background/80 border border-border/60 rounded px-1 text-muted-foreground hover:text-foreground"
                          >
                            {stages.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Bidirectional Transition Controls (Back & Next) */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-border/20 text-[10px]">
                          {previousStage ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMoveStage(p.id, previousStage.id)}
                              className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground gap-1 hover:bg-muted"
                              title={`Roll back to ${previousStage.name}`}
                            >
                              <MoveLeft className="h-2.5 w-2.5" />
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
                              className="h-6 px-1.5 text-[10px] text-primary gap-1 hover:bg-primary/10 font-medium"
                              title={`Advance to ${nextStage.name}`}
                            >
                              <span>Next</span>
                              <MoveRight className="h-2.5 w-2.5" />
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
