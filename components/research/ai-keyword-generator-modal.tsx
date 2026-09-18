"use client";

import { useState } from "react";
import { Sparkles, Globe, MapPin, Check, Plus, Loader2, CheckCircle2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { TIER1_COUNTRIES, HIGH_TICKET_NICHES, AVAILABLE_AI_MODELS } from "@/lib/constants/automation";
import { generateTier1KeywordsAction } from "@/lib/actions/automation";
import confetti from "canvas-confetti";

interface AiKeywordGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onKeywordsAdded?: () => void;
}

export function AiKeywordGeneratorModal({
  open,
  onOpenChange,
  onKeywordsAdded,
}: AiKeywordGeneratorModalProps) {
  const [selectedCountry, setSelectedCountry] = useState<"US" | "GB" | "CA" | "AU">("US");
  const [selectedNiche, setSelectedNiche] = useState<string>("ALL");
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.5-flash-lite");
  const [count, setCount] = useState<number>(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const countryConfig = TIER1_COUNTRIES[selectedCountry];
  const activeModel = AVAILABLE_AI_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_AI_MODELS[0];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setSuccessMessage(null);
    try {
      const res = await generateTier1KeywordsAction({
        country: selectedCountry,
        niche: selectedNiche === "ALL" ? undefined : selectedNiche,
        count,
        modelId: selectedModel,
      });

      if (res.success) {
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
        setSuccessMessage(`Successfully queued ${res.addedCount} high-ticket search queries for ${countryConfig.name}!`);
        setTimeout(() => {
          onOpenChange(false);
          setSuccessMessage(null);
          if (onKeywordsAdded) onKeywordsAdded();
        }, 1500);
      }
    } catch (err: any) {
      alert(err.message || "Failed to generate AI keywords");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-xl p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121218] text-foreground dark:text-zinc-100 border border-slate-200/90 dark:border-zinc-800 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 pb-2 border-b border-border/60">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <span>AI High-Ticket Keyword Generator</span>
                <Badge variant="purple" className="text-[9px] uppercase font-mono">
                  Gemini Free Tier
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Generate high-converting Google Maps prospecting queries across Tier-1 commercial markets.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-xs">
          {/* 1. Select Tier-1 Country */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center justify-between">
              <span>Target Country (Tier-1 High Ticket)</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                Currency: {countryConfig.currency}
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(TIER1_COUNTRIES) as Array<"US" | "GB" | "CA" | "AU">).map((code) => {
                const c = TIER1_COUNTRIES[code];
                const isSelected = selectedCountry === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setSelectedCountry(code)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500/30 text-foreground"
                        : "bg-muted/40 border-border/70 hover:border-border text-muted-foreground"
                    }`}
                  >
                    <span className="text-lg">{c.flag}</span>
                    <div className="truncate">
                      <div className="font-bold text-[11px] leading-none">{c.code}</div>
                      <div className="text-[10px] opacity-70 truncate">{c.name}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Select High-Ticket Industry Niche */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Commercial Industry / Niche</label>
            <select
              value={selectedNiche}
              onChange={(e) => setSelectedNiche(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="ALL">All High-Ticket Niches (Mix of Roofing, Dental, HVAC, Spas, Building)</option>
              {HIGH_TICKET_NICHES.map((n) => (
                <option key={n.name} value={n.name}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. AI Model Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <Bot className="h-3.5 w-3.5 text-indigo-500" />
                <span>AI Model Selection</span>
              </label>
              <span className="text-[10px] text-muted-foreground font-mono">
                {activeModel.freeTierLimit}
              </span>
            </div>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
            >
              {AVAILABLE_AI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.badge} ({m.freeTierLimit})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground">
              {activeModel.description}
            </p>
          </div>

          {/* 4. Batch Size Selector */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center justify-between">
              <span>Number of Search Queries to Generate</span>
              <span className="font-mono text-primary font-bold">{count} keywords</span>
            </label>
            <div className="flex items-center gap-2">
              {[5, 10, 15, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCount(num)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    count === num
                      ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                      : "bg-muted/40 border-border/60 hover:border-border text-muted-foreground"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Target Geography Highlights */}
          <div className="p-3 rounded-2xl bg-muted/40 dark:bg-zinc-950/60 border border-border/60 space-y-1 text-[11px] text-muted-foreground">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-indigo-500" />
              <span>Targeting Top Commercial Hubs in {countryConfig.name}:</span>
            </div>
            <p className="leading-relaxed">
              {countryConfig.targetLocations.map((loc) => `${loc.city} (${loc.state})`).join(" • ")}
            </p>
          </div>

          {/* Success Notification */}
          {successMessage && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t border-border/60 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs cursor-pointer"
            disabled={isGenerating}
          >
            Cancel
          </Button>

          <Button
            variant="gradient"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="gap-2 rounded-xl text-xs font-bold shadow-md cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate & Queue {count} Keywords</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
