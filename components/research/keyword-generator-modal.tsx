"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Layers,
  MapPin,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Compass,
  ArrowRight,
  RefreshCw,
  Search,
} from "lucide-react";
import { bulkCreateKeywordsAction } from "@/lib/actions/research";

interface KeywordGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (addedCount: number, duplicateCount: number) => void;
}

const SAMPLE_NICHES = [
  "roofing contractor\nroof repair\nroof replacement\ncommercial roofing\nresidential roofer",
  "hvac repair\nair conditioning installation\nheating contractor\nemergency hvac service",
  "solar panel installation\ncommercial solar\nresidential solar company\nsolar maintenance",
  "plumber\nemergency plumbing\nwater heater repair\ncommercial plumbing contractor",
  "cosmetic dentist\ndental implants clinic\nteeth whitening\nfamily dentistry",
];

const SAMPLE_LOCATIONS = [
  "Dallas TX\nFort Worth TX\nArlington TX\nPlano TX\nFrisco TX",
  "Austin TX\nRound Rock TX\nCedar Park TX\nSan Marcos TX",
  "Houston TX\nThe Woodlands TX\nSugar Land TX\nKaty TX",
  "Phoenix AZ\nScottsdale AZ\nTempe AZ\nChandler AZ",
  "Miami FL\nFort Lauderdale FL\nBoca Raton FL\nWest Palm Beach FL",
];

export function KeywordGeneratorModal({
  isOpen,
  onClose,
  onSuccess,
}: KeywordGeneratorModalProps) {
  const [serviceTermsText, setServiceTermsText] = useState(
    "roofing contractor\nroof repair\nroof replacement\ncommercial roofing"
  );
  const [locationsText, setLocationsText] = useState("Dallas TX\nFort Worth TX\nPlano TX");
  const [categoryTag, setCategoryTag] = useState("Roofing");
  const [searchEngine, setSearchEngine] = useState("GOOGLE_MAPS");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [excludedIndices, setExcludedIndices] = useState<Set<number>>(new Set());

  // Parse lines/commas
  const serviceTerms = useMemo(() => {
    return serviceTermsText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }, [serviceTermsText]);

  const locations = useMemo(() => {
    return locationsText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }, [locationsText]);

  // Generate Matrix
  const generatedMatrix = useMemo(() => {
    const list: { keyword: string; service: string; location: string }[] = [];
    serviceTerms.forEach((service) => {
      locations.forEach((loc) => {
        list.push({
          keyword: `${service} ${loc}`,
          service,
          location: loc,
        });
      });
    });
    return list;
  }, [serviceTerms, locations]);

  const activeKeywordsToInsert = useMemo(() => {
    return generatedMatrix
      .filter((_, idx) => !excludedIndices.has(idx))
      .map((item) => item.keyword);
  }, [generatedMatrix, excludedIndices]);

  const toggleExclude = (idx: number) => {
    setExcludedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleApplySample = (sampleIdx: number) => {
    setServiceTermsText(SAMPLE_NICHES[sampleIdx] || SAMPLE_NICHES[0]);
    setLocationsText(SAMPLE_LOCATIONS[sampleIdx] || SAMPLE_LOCATIONS[0]);
    const tags = ["Roofing", "HVAC", "Solar", "Plumbing", "Dental"];
    setCategoryTag(tags[sampleIdx] || "General");
    setExcludedIndices(new Set());
  };

  const handleGenerate = async () => {
    if (activeKeywordsToInsert.length === 0) return;

    setIsSubmitting(true);
    try {
      const res = await bulkCreateKeywordsAction({
        keywords: activeKeywordsToInsert,
        niche: categoryTag.trim() || undefined,
        searchEngine,
        status: "PENDING",
      });

      if (res.success) {
        onSuccess(res.addedCount || 0, res.duplicateCount || 0);
        onClose();
      } else {
        alert(res.error || "Failed to generate keywords");
      }
    } catch (err: any) {
      alert(`Error: ${err?.message || "Something went wrong"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121218] text-foreground dark:text-zinc-100 border border-slate-200/90 dark:border-zinc-800 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 pb-2 border-b border-border/60">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground dark:text-zinc-100 flex items-center gap-2">
                <span>Combinatorial Keyword Matrix Generator</span>
                <Badge variant="purple" className="text-[10px] uppercase font-mono">
                  Smart Matrix
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Multiply core service phrases across target cities & states with automatic deduplication.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1 text-xs">
          {/* Preset Quick Starters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">
              Quick Templates:
            </span>
            {["Roofing", "HVAC", "Solar", "Plumbing", "Dental"].map((name, i) => (
              <button
                key={name}
                type="button"
                onClick={() => handleApplySample(i)}
                className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-muted/60 dark:bg-zinc-900 border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer whitespace-nowrap"
              >
                {name} Matrix
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Input 1: Core Service Terms */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-card dark:bg-zinc-900/60 border border-border/80">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-indigo-500" />
                  <span>1. Service / Niche Terms ({serviceTerms.length})</span>
                </label>
                <span className="text-[10px] text-muted-foreground">1 per line or comma</span>
              </div>
              <Textarea
                rows={5}
                value={serviceTermsText}
                onChange={(e) => {
                  setServiceTermsText(e.target.value);
                  setExcludedIndices(new Set());
                }}
                placeholder="e.g. roofing contractor&#10;roof repair&#10;commercial roofing"
                className="font-mono text-xs bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
              />
            </div>

            {/* Input 2: Target Cities & Locations */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-card dark:bg-zinc-900/60 border border-border/80">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-rose-500" />
                  <span>2. Target Cities / Areas ({locations.length})</span>
                </label>
                <span className="text-[10px] text-muted-foreground">1 per line or comma</span>
              </div>
              <Textarea
                rows={5}
                value={locationsText}
                onChange={(e) => {
                  setLocationsText(e.target.value);
                  setExcludedIndices(new Set());
                }}
                placeholder="e.g. Dallas TX&#10;Fort Worth TX&#10;Plano TX"
                className="font-mono text-xs bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
              />
            </div>
          </div>

          {/* Configuration Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-muted/40 dark:bg-zinc-900/40 border border-border/60">
            <div>
              <label className="block mb-1 font-semibold text-foreground">
                Tag Primary Industry / Niche
              </label>
              <Input
                value={categoryTag}
                onChange={(e) => setCategoryTag(e.target.value)}
                placeholder="e.g. Roofing & Solar"
                className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold text-foreground">
                Default Target Engine
              </label>
              <select
                value={searchEngine}
                onChange={(e) => setSearchEngine(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-background/90 dark:bg-zinc-950/90 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="GOOGLE_MAPS">Google Maps (Local Business Radar)</option>
                <option value="GOOGLE_SEARCH">Google Search (Organic & Ads)</option>
                <option value="YELP">Yelp Directory</option>
                <option value="LINKEDIN">LinkedIn Companies</option>
              </select>
            </div>
          </div>

          {/* Live Preview Matrix */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Compass className="h-4 w-4 text-primary" />
                <span>Generated Search Matrix Preview ({activeKeywordsToInsert.length} / {generatedMatrix.length})</span>
              </span>
              <span className="text-[11px] text-muted-foreground">
                Click any variation to toggle exclusion
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto p-2.5 rounded-2xl bg-muted/30 dark:bg-zinc-950/80 border border-border/80 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {generatedMatrix.length === 0 ? (
                <div className="col-span-2 text-center py-6 text-muted-foreground">
                  Enter services and locations above to generate matrix variations.
                </div>
              ) : (
                generatedMatrix.map((item, idx) => {
                  const isExcluded = excludedIndices.has(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleExclude(idx)}
                      className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all cursor-pointer select-none ${
                        isExcluded
                          ? "bg-muted/40 border-border/40 text-muted-foreground line-through opacity-50"
                          : "bg-card dark:bg-zinc-900 border-border hover:border-primary text-foreground shadow-2xs"
                      }`}
                    >
                      <span className="truncate pr-2 font-medium">{item.keyword}</span>
                      <span
                        className={`h-4 w-4 rounded-md flex items-center justify-center shrink-0 text-[10px] ${
                          isExcluded
                            ? "bg-muted text-muted-foreground"
                            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold"
                        }`}
                      >
                        {isExcluded ? "✕" : "✓"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="gradient"
            disabled={isSubmitting || activeKeywordsToInsert.length === 0}
            onClick={handleGenerate}
            className="gap-1.5 rounded-xl cursor-pointer shadow-md"
          >
            <Sparkles className="h-4 w-4" />
            <span>
              {isSubmitting
                ? "Generating..."
                : `Add ${activeKeywordsToInsert.length} Keywords to Queue`}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
