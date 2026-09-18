"use client";

import { useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  Sparkles,
  Bot,
  MapPin,
  Globe,
  Flame,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Plus,
  ArrowRight,
  RefreshCw,
  Clock,
  Building2,
  Phone,
  Mail,
  Share2,
  Star,
  Check,
  Compass,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AiKeywordGeneratorModal } from "@/components/research/ai-keyword-generator-modal";
import {
  runGoogleMapsScoutAction,
  importDiscoveredProspectAction,
  bulkImportDiscoveredProspectsAction,
  fetchNextPendingKeywordAction,
  runAutonomousAgentCycleAction,
} from "@/lib/actions/automation";
import { DiscoveredProspect, DiscoveryResult } from "@/lib/services/discovery-service";
import { AVAILABLE_AI_MODELS } from "@/lib/constants/automation";

interface AutomationClientProps {
  workspaceId: string;
  initialPendingKeywords: any[];
  initialSearchedKeywords: any[];
  initialAiProspects: any[];
  totalKeywordsCount: number;
  noWebsiteCount: number;
}

export function AutomationClient({
  workspaceId,
  initialPendingKeywords = [],
  initialSearchedKeywords = [],
  initialAiProspects = [],
  totalKeywordsCount = 0,
  noWebsiteCount = 0,
}: AutomationClientProps) {
  // Modal states
  const [isAiGenOpen, setIsAiGenOpen] = useState(false);

  // Queue & pending state
  const [pendingKeywords, setPendingKeywords] = useState(initialPendingKeywords);
  const [searchedKeywords, setSearchedKeywords] = useState(initialSearchedKeywords);
  const [aiProspects, setAiProspects] = useState(initialAiProspects);

  // Scout Runner State
  const [selectedKeywordId, setSelectedKeywordId] = useState<string>(
    pendingKeywords[0]?.id || ""
  );
  const [customQuery, setCustomQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<"US" | "GB" | "CA" | "AU">("US");
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.5-flash-lite");
  const [isRunningScout, setIsRunningScout] = useState(false);
  const [scoutStep, setScoutStep] = useState<number>(0);
  const [latestDiscovery, setLatestDiscovery] = useState<DiscoveryResult | null>(null);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [isRunningCycle, setIsRunningCycle] = useState(false);
  const [cycleReport, setCycleReport] = useState<any>(null);

  // Active target keyword
  const activePendingKeyword = pendingKeywords.find((k) => k.id === selectedKeywordId);

  // Autonomous Cycle Execution
  const handleRunAutonomousCycle = async () => {
    setIsRunningCycle(true);
    setCycleReport(null);
    try {
      const res = await runAutonomousAgentCycleAction({
        country: selectedCountry,
        modelId: selectedModel,
      });
      if (res.success) {
        confetti({ particleCount: 60, spread: 75, origin: { y: 0.6 } });
        setCycleReport(res);
        const next = await fetchNextPendingKeywordAction();
        if (next.keyword) {
          setSelectedKeywordId(next.keyword.id);
        }
      } else {
        alert("Autonomous agent cycle notice: " + (res.message || "Failed to complete cycle"));
      }
    } catch (err: any) {
      alert("Error running autonomous cycle: " + (err?.message || "Unknown error"));
    } finally {
      setIsRunningCycle(false);
    }
  };

  // Step simulation for rich UX during agent scout
  const runScoutSimulation = async () => {
    setIsRunningScout(true);
    setScoutStep(1);

    const stepTimer1 = setTimeout(() => setScoutStep(2), 700);
    const stepTimer2 = setTimeout(() => setScoutStep(3), 1400);
    const stepTimer3 = setTimeout(() => setScoutStep(4), 2100);

    try {
      const res = await runGoogleMapsScoutAction({
        keywordId: selectedKeywordId || undefined,
        query: selectedKeywordId ? undefined : customQuery.trim(),
        country: selectedCountry,
        maxResults: 10,
        modelId: selectedModel,
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      if (res.success && res.result) {
        setLatestDiscovery(res.result);
        setScoutStep(5);

        // Confetti celebration if high-ticket leads found
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
        });

        // Update local queues
        if (selectedKeywordId) {
          setPendingKeywords((prev) => prev.filter((k) => k.id !== selectedKeywordId));
          // Select next pending if available
          const remaining = pendingKeywords.filter((k) => k.id !== selectedKeywordId);
          setSelectedKeywordId(remaining[0]?.id || "");
        }
      } else {
        alert(res.error || "Scout discovery completed with no results.");
      }
    } catch (err: any) {
      alert("Error running discovery agent: " + (err?.message || "Unknown error"));
    } finally {
      setIsRunningScout(false);
    }
  };

  // Import single prospect
  const handleImportProspect = async (p: DiscoveredProspect) => {
    try {
      const res = await importDiscoveredProspectAction(p);
      if (res.success) {
        setImportedIds((prev) => new Set([...prev, p.name]));
        confetti({ particleCount: 25, spread: 50, origin: { y: 0.7 } });
      } else {
        alert("Failed to import prospect");
      }
    } catch (err: any) {
      alert("Error importing prospect: " + err.message);
    }
  };

  // Bulk import all discovered prospects
  const handleBulkImport = async () => {
    if (!latestDiscovery || latestDiscovery.prospects.length === 0) return;

    setIsBulkImporting(true);
    try {
      const unimported = latestDiscovery.prospects.filter(
        (p) => !importedIds.has(p.name)
      );
      const res = await bulkImportDiscoveredProspectsAction(unimported);
      if (res.success) {
        const allNames = latestDiscovery.prospects.map((p) => p.name);
        setImportedIds(new Set(allNames));
        confetti({ particleCount: 75, spread: 80, origin: { y: 0.5 } });
      }
    } finally {
      setIsBulkImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-full pb-20">
      {/* 1. Header Command Hub */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#121218] p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[480px] h-[480px] bg-gradient-to-bl from-violet-600/15 via-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
                  Revlo Autonomous Lead Agent
                </h1>
                <Badge
                  variant="purple"
                  className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5"
                >
                  Autonomous Engine
                </Badge>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              Autonomous prospecting agent powered by free AI & Google Maps. Mines Tier-1 markets
              for high-value local services, detects zero-website gold targets,
              and identifies verified decision-makers.
            </p>
          </div>

          {/* Action Triggers */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              size="sm"
              variant="outline"
              asChild
              className="gap-2 text-xs font-semibold rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer shadow-2xs"
            >
              <Link href="/research">
                <Compass className="h-4 w-4 text-indigo-500" />
                <span>Market Research Queue</span>
              </Link>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAiGenOpen(true)}
              className="gap-2 text-xs font-bold rounded-xl border-indigo-200 dark:border-indigo-800/40 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/50 cursor-pointer shadow-2xs"
            >
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <span>AI Territory Matrix Scout</span>
            </Button>

            <Button
              size="sm"
              variant="gradient"
              onClick={handleRunAutonomousCycle}
              disabled={isRunningCycle}
              className="gap-2 text-xs font-bold rounded-xl shadow-md cursor-pointer"
            >
              {isRunningCycle ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-amber-300" />
                  <span>Running Autonomous Cycle...</span>
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4 text-amber-300" />
                  <span>Run Autonomous Agent Cycle</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Autonomous Cycle Result Banner */}
        {cycleReport && (
          <div className="mt-5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Autonomous Agent Cycle Completed Successfully</span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/40">
                Live Ingestion
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {cycleReport.summary}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/20 font-semibold">
                Target: {cycleReport.keyword}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/20 font-semibold">
                Discovered: {cycleReport.prospectsDiscovered}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/20 font-semibold text-amber-700 dark:text-amber-300">
                🔥 No Website: {cycleReport.noWebsiteCount}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-500/20 font-semibold text-indigo-700 dark:text-indigo-300">
                Decision Makers: {cycleReport.decisionMakersFound}
              </span>
            </div>
          </div>
        )}

        {/* 2. Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-6 mt-6 border-t border-slate-100 dark:border-zinc-800/80">
          {/* AI Discovered Prospects */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-violet-500/10 dark:from-indigo-950/20 dark:to-violet-950/20 border border-indigo-200/50 dark:border-indigo-800/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="font-semibold text-slate-700 dark:text-zinc-300">
                AI Discovered
              </span>
              <Bot className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-zinc-100">
              {aiProspects.length}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Prospects from Google Maps
            </div>
          </div>

          {/* No Website Targets (Gold Opportunity) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-300/60 dark:border-amber-700/40">
            <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 mb-1">
              <span className="font-bold">No-Website "Gold"</span>
              <Flame className="h-4 w-4 text-amber-500 animate-pulse" />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {noWebsiteCount}
            </div>
            <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
              Top web-build sales targets
            </div>
          </div>

          {/* Pending Research Queue */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="font-semibold text-slate-700 dark:text-zinc-300">
                Pending in Queue
              </span>
              <Clock className="h-4 w-4 text-sky-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-zinc-100">
              {pendingKeywords.length}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              of {totalKeywordsCount} total targets
            </div>
          </div>

          {/* Tier-1 Coverage */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="font-semibold text-slate-700 dark:text-zinc-300">
                Tier-1 Regions
              </span>
              <Globe className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>🇺🇸</span>
              <span>🇬🇧</span>
              <span>🇨🇦</span>
              <span>🇦🇺</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              High-Ticket B2B Markets
            </div>
          </div>
        </div>
      </div>

      {/* 3. Scout Execution Command Bar */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#121218] p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Google Maps Autonomous Scout Agent</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Select an unsearched keyword from your research queue or input a custom local niche query.
            </p>
          </div>

          {/* Selectors Group: Model & Country */}
          <div className="flex flex-wrap items-center gap-3">
            {/* AI Model Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Bot className="h-3.5 w-3.5 text-indigo-500" />
                <span>Model:</span>
              </span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isRunningScout}
                className="h-8 px-2.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {AVAILABLE_AI_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.badge})
                  </option>
                ))}
              </select>
            </div>

            {/* Country Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Country:</span>
              <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-semibold">
                {[
                  { code: "US", flag: "🇺🇸 US" },
                  { code: "GB", flag: "🇬🇧 UK" },
                  { code: "CA", flag: "🇨🇦 CA" },
                  { code: "AU", flag: "🇦🇺 AU" },
                ].map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setSelectedCountry(c.code as any)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      selectedCountry === c.code
                        ? "bg-white dark:bg-zinc-800 text-foreground shadow-2xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c.flag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Input & Launch Trigger */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          {/* Pending Queue Picker */}
          <div className="md:col-span-5">
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
              1. Select From Research Queue ({pendingKeywords.length} pending)
            </label>
            <select
              value={selectedKeywordId}
              onChange={(e) => {
                setSelectedKeywordId(e.target.value);
                setCustomQuery("");
              }}
              disabled={isRunningScout}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900 text-xs font-medium text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {pendingKeywords.length === 0 ? (
                <option value="">No pending keywords (generate some above!)</option>
              ) : (
                pendingKeywords.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.keyword} {k.niche ? `(${k.niche})` : ""}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Or Custom Query Input */}
          <div className="md:col-span-4">
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
              Or Custom Discovery Query
            </label>
            <Input
              placeholder="e.g. Cosmetic Dentist Miami FL"
              value={customQuery}
              onChange={(e) => {
                setCustomQuery(e.target.value);
                if (e.target.value) setSelectedKeywordId("");
              }}
              disabled={isRunningScout}
              className="h-11 text-xs rounded-xl bg-slate-50/50 dark:bg-zinc-900"
            />
          </div>

          {/* Launch Action Button */}
          <div className="md:col-span-3 flex items-end">
            <Button
              onClick={runScoutSimulation}
              disabled={isRunningScout || (!selectedKeywordId && !customQuery.trim())}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 hover:from-violet-700 hover:to-sky-700 text-white font-bold text-xs gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
            >
              {isRunningScout ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Agent Scouting...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Launch Maps Scout</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Live Scout Progress Feed */}
        {isRunningScout && (
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/50 space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                <span>Autonomous Agent Running Live Discovery Pipeline</span>
              </div>
              <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                Step {scoutStep} of 4
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <div
                className={`p-2.5 rounded-xl border transition-all ${
                  scoutStep >= 1
                    ? "bg-white dark:bg-zinc-900 border-indigo-400 text-foreground font-semibold shadow-2xs"
                    : "opacity-40 border-transparent text-muted-foreground"
                }`}
              >
                1. Mining Google Maps
              </div>
              <div
                className={`p-2.5 rounded-xl border transition-all ${
                  scoutStep >= 2
                    ? "bg-white dark:bg-zinc-900 border-indigo-400 text-foreground font-semibold shadow-2xs"
                    : "opacity-40 border-transparent text-muted-foreground"
                }`}
              >
                2. Auditing Websites
              </div>
              <div
                className={`p-2.5 rounded-xl border transition-all ${
                  scoutStep >= 3
                    ? "bg-white dark:bg-zinc-900 border-indigo-400 text-foreground font-semibold shadow-2xs"
                    : "opacity-40 border-transparent text-muted-foreground"
                }`}
              >
                3. Scouting Decision Makers
              </div>
              <div
                className={`p-2.5 rounded-xl border transition-all ${
                  scoutStep >= 4
                    ? "bg-white dark:bg-zinc-900 border-indigo-400 text-foreground font-semibold shadow-2xs"
                    : "opacity-40 border-transparent text-muted-foreground"
                }`}
              >
                4. Scoring Lead Fit
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Live Discovery Results Feed */}
      {latestDiscovery && (
        <div className="rounded-3xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#121218] p-6 shadow-xs space-y-5 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100">
                  Discovered Prospects ({latestDiscovery.totalFound})
                </h3>
                <Badge variant="outline" className="text-[11px] font-mono">
                  Keyword: "{latestDiscovery.query}"
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Found {latestDiscovery.noWebsiteCount} zero-website opportunities &{" "}
                {latestDiscovery.prospects.filter((p) => !!p.founder).length} verified decision-makers.
              </p>
            </div>

            <Button
              size="sm"
              variant="gradient"
              onClick={handleBulkImport}
              disabled={
                isBulkImporting ||
                latestDiscovery.prospects.every((p) => importedIds.has(p.name))
              }
              className="gap-2 text-xs font-bold rounded-xl shadow-md cursor-pointer shrink-0"
            >
              {isBulkImporting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Importing Leads...</span>
                </>
              ) : latestDiscovery.prospects.every((p) => importedIds.has(p.name)) ? (
                <>
                  <Check className="h-4 w-4 text-emerald-300" />
                  <span>All Imported to CRM</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Import All to CRM ({latestDiscovery.prospects.length})</span>
                </>
              )}
            </Button>
          </div>

          {/* Prospects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {latestDiscovery.prospects.map((p, idx) => {
              const isImported = importedIds.has(p.name);

              return (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                    p.hasNoWebsiteOpportunity
                      ? "bg-gradient-to-br from-amber-500/5 via-white to-orange-500/5 dark:from-amber-950/20 dark:via-zinc-900 dark:to-orange-950/15 border-amber-300/80 dark:border-amber-700/50 shadow-xs"
                      : "bg-slate-50/50 dark:bg-zinc-900/50 border-slate-200/80 dark:border-zinc-800"
                  }`}
                >
                  {/* Top Bar: Title & Badges */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-zinc-100 text-sm tracking-tight">
                            {p.name}
                          </h4>
                          {p.hasNoWebsiteOpportunity && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white uppercase tracking-wider shadow-xs animate-pulse">
                              <Flame className="h-3 w-3" />
                              No Website
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{p.category}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {p.city}, {p.state} ({p.country})
                          </span>
                        </div>
                      </div>

                      {/* Google Rating */}
                      <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-xs font-bold text-amber-700 dark:text-amber-400 shrink-0">
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        <span>{p.googleRating}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">
                          ({p.reviewCount})
                        </span>
                      </div>
                    </div>

                    {/* Website Status Row */}
                    <div className="flex items-center gap-2 text-xs">
                      {p.websiteExists && p.website ? (
                        <a
                          href={p.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold hover:underline"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          <span className="truncate max-w-[200px]">{p.website}</span>
                          <ArrowUpRight className="h-3 w-3 opacity-60" />
                        </a>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Zero Website Found (Prime Pitch)</span>
                        </div>
                      )}
                    </div>

                    {/* Founder / Decision Maker Scout Details */}
                    {p.founder ? (
                      <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700/60 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-mono font-bold text-muted-foreground flex items-center gap-1">
                            <UserCheck className="h-3 w-3 text-indigo-500" />
                            Decision Maker Identified
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                              p.founder.verificationStatus === "VERIFIED"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {p.founder.verificationStatus}
                          </span>
                        </div>
                        <div className="font-bold text-slate-800 dark:text-zinc-200">
                          {p.founder.fullName}{" "}
                          <span className="text-muted-foreground font-normal">
                            — {p.founder.jobTitle}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                          {p.founder.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {p.founder.phone}
                            </span>
                          )}
                          {p.founder.linkedInUrl && (
                            <a
                              href={p.founder.linkedInUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <Share2 className="h-3 w-3" />
                              <span>LinkedIn Profile</span>
                            </a>
                          )}
                          {p.founder.email && (
                            <span className="flex items-center gap-1 text-slate-600 dark:text-zinc-300 font-mono">
                              <Mail className="h-3 w-3" />
                              {p.founder.email}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-muted-foreground italic flex items-center gap-1">
                        <span>No public founder profile found (general phone available)</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-4 mt-4 border-t border-slate-200/50 dark:border-zinc-800 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground font-medium">
                      Estimated Deal:{" "}
                      <span className="font-bold text-foreground">
                        {p.hasNoWebsiteOpportunity ? "$18,000" : "$15,000"}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant={isImported ? "outline" : "default"}
                      onClick={() => handleImportProspect(p)}
                      disabled={isImported}
                      className="h-8 text-xs font-semibold gap-1.5 rounded-xl cursor-pointer"
                    >
                      {isImported ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Imported to CRM</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add to CRM</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Recently Discovered Prospects in Workspace */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#121218] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Bot className="h-4 w-4 text-indigo-500" />
              <span>AI-Discovered Prospects in CRM ({aiProspects.length})</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Leads automatically sourced from Google Maps and ingested into your pipeline.
            </p>
          </div>
          <Button size="sm" variant="ghost" asChild className="text-xs font-semibold gap-1">
            <Link href="/prospects">
              <span>View All in Prospects Table</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {aiProspects.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-2xl border-slate-200 dark:border-zinc-800">
            No prospects discovered yet. Run the Maps Scout Agent above to populate your pipeline!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-slate-50/50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">Business</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Google Rating</th>
                  <th className="py-2.5 px-3">Website Status</th>
                  <th className="py-2.5 px-3">Lead Score</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {aiProspects.slice(0, 8).map((prospect) => (
                  <tr
                    key={prospect.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <span>{prospect.name}</span>
                        {prospect.hasNoWebsiteOpportunity && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded">
                            NO WEBSITE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {prospect.city}, {prospect.state}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1 font-semibold text-amber-600">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        <span>{prospect.googleRating || "—"}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">
                          ({prospect.reviewCount || 0})
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      {prospect.website ? (
                        <a
                          href={prospect.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 font-medium"
                        >
                          <Globe className="h-3 w-3" />
                          <span>Website Live</span>
                        </a>
                      ) : (
                        <span className="font-bold text-rose-500">Missing Website</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {prospect.leadScore}/100 ({prospect.leadGrade})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        asChild
                        className="h-7 text-xs font-semibold gap-1 text-primary"
                      >
                        <Link href={`/prospects/${prospect.id}`}>
                          <span>Details</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. AI Keyword Generator Modal */}
      <AiKeywordGeneratorModal
        open={isAiGenOpen}
        onOpenChange={setIsAiGenOpen}
        onKeywordsAdded={() => {
          // Re-fetch pending keywords
          fetchNextPendingKeywordAction().then((res) => {
            if (res.hasPending && res.keyword) {
              setPendingKeywords((prev) => [res.keyword, ...prev]);
              if (!selectedKeywordId) setSelectedKeywordId(res.keyword.id);
            }
          });
        }}
      />
    </div>
  );
}
