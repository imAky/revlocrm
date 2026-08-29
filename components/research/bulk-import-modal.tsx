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
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Search,
  Tag,
  Copy,
} from "lucide-react";
import { bulkCreateKeywordsAction } from "@/lib/actions/research";
import { normalizeKeywordString } from "@/lib/utils/research";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (addedCount: number, duplicateCount: number) => void;
}

export function BulkImportModal({
  isOpen,
  onClose,
  onSuccess,
}: BulkImportModalProps) {
  const [rawText, setRawText] = useState("");
  const [niche, setNiche] = useState("");
  const [searchEngine, setSearchEngine] = useState("GOOGLE_MAPS");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse raw text: handles commas, newlines, markdown bullet points ("- ", "* ", "1. ")
  const parsedKeywords = useMemo(() => {
    if (!rawText.trim()) return [];

    // Remove markdown list bullets
    const cleaned = rawText
      .replace(/^[\s*\-•\d.]+/gm, "")
      .replace(/\r\n/g, "\n");

    const tokens = cleaned
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Deduplicate within the entered batch
    const unique: string[] = [];
    const seenNorms = new Set<string>();

    for (const t of tokens) {
      const norm = normalizeKeywordString(t);
      if (norm && !seenNorms.has(norm)) {
        seenNorms.add(norm);
        unique.push(t);
      }
    }

    return unique;
  }, [rawText]);

  const handleImport = async () => {
    if (parsedKeywords.length === 0) return;

    setIsSubmitting(true);
    try {
      const res = await bulkCreateKeywordsAction({
        keywords: parsedKeywords,
        niche: niche.trim() || undefined,
        searchEngine,
        status: "PENDING",
      });

      if (res.success) {
        onSuccess(res.addedCount || 0, res.duplicateCount || 0);
        onClose();
        setRawText("");
      } else {
        alert(res.error || "Failed to import keywords");
      }
    } catch (err: any) {
      alert(`Error: ${err?.message || "Something went wrong"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const samplePromptText = `roofing contractor Dallas TX, roofing company Dallas TX, roof repair Dallas TX, roof replacement Dallas TX, commercial roofing Dallas TX, emergency roof repair Dallas TX, metal roofing contractor Dallas TX, residential roofer Dallas TX`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121218] text-foreground dark:text-zinc-100 border border-slate-200/90 dark:border-zinc-800 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 pb-2 border-b border-border/60">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground dark:text-zinc-100 flex items-center gap-2">
                <span>Fast AI & Comma-Separated Importer</span>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  Smart Parser
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Paste comma-separated, newline-separated, or markdown lists copied from ChatGPT, Claude, or spreadsheets.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1 text-xs">
          {/* Helper Button */}
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">
              Paste Target Keyword List:
            </span>
            <button
              type="button"
              onClick={() => {
                setRawText(samplePromptText);
                setNiche("Roofing");
              }}
              className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
            >
              Insert Sample Comma List
            </button>
          </div>

          <Textarea
            rows={7}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste keywords separated by commas, newlines, or bullets:&#10;&#10;roofing contractor Dallas TX,&#10;roof repair Dallas TX,&#10;commercial roofing Dallas TX..."
            className="font-mono text-xs bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
          />

          {/* Configuration Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-muted/40 dark:bg-zinc-900/40 border border-border/60">
            <div>
              <label className="block mb-1 font-semibold text-foreground">
                Tag Niche / Industry (Optional)
              </label>
              <Input
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
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

          {/* Live Parser Preview */}
          {parsedKeywords.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Detected {parsedKeywords.length} Valid Keywords</span>
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Duplicates against existing database are automatically filtered
                </span>
              </div>

              <div className="max-h-36 overflow-y-auto p-2.5 rounded-2xl bg-muted/30 dark:bg-zinc-950/80 border border-border/80 flex flex-wrap gap-1.5">
                {parsedKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-lg bg-card dark:bg-zinc-900 border border-border text-[11px] font-medium text-foreground"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
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
            disabled={isSubmitting || parsedKeywords.length === 0}
            onClick={handleImport}
            className="gap-1.5 rounded-xl cursor-pointer shadow-md"
          >
            <UploadCloud className="h-4 w-4" />
            <span>
              {isSubmitting
                ? "Importing..."
                : `Import ${parsedKeywords.length} Keywords`}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
