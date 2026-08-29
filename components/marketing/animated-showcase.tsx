"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  BarChart3,
  Building2,
  GitPullRequest,
  Search,
  Activity,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Check,
  Globe,
  Sliders,
  Play,
  Pause,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SLIDE_DURATION_MS = 6000; // 6 seconds per slide

export function AnimatedShowcase() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "prospects" | "pipeline" | "research" | "activities"
  >("dashboard");
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const tabs = [
    {
      id: "dashboard" as const,
      label: "Executive Dashboard",
      icon: BarChart3,
      badge: "KPIs & Funnel",
      img: "/uploads/dashboard.png",
      title: "Real-time pipeline intelligence & priority lead queue",
      desc: "Live visibility into deal volume, win rates, 13-stage conversion velocity, and top ICP-rated opportunities.",
      highlights: ["Aggregated deal values", "Priority outreach queue", "Conversion velocity metrics"],
    },
    {
      id: "prospects" as const,
      label: "Prospect Directory",
      icon: Building2,
      badge: "0-100 ICP",
      img: "/uploads/prospects.png",
      title: "Granular research directory with 4-pillar ICP scoring",
      desc: "11-facet multi-filter engine, interactive 0–100 heuristic scoring popovers, and verified decision-maker dossiers.",
      highlights: ["4-pillar deterministic score", "Verified decision-makers", "Duplicate detection engine"],
    },
    {
      id: "pipeline" as const,
      label: "Visual Pipeline",
      icon: GitPullRequest,
      badge: "13 Stages",
      img: "/uploads/pipeline.png",
      title: "13-Stage bidirectional Kanban sales board",
      desc: "Drag-and-drop opportunity progression from raw research through discovery, proposal sent, and closed won.",
      highlights: ["Bidirectional stage transitions", "Real-time deal totals", "Stage duration tracking"],
    },
    {
      id: "research" as const,
      label: "Market Research",
      icon: Search,
      badge: "Keyword Engine",
      img: "/uploads/reseearch.png",
      title: "Automated keyword research & prospect association",
      desc: "Track localized industry search volumes, CPC benchmarks, and associate leads with target keywords in 1 click.",
      highlights: ["Google Maps integration", "Search volume analysis", "Lead count tracking"],
    },
    {
      id: "activities" as const,
      label: "Activities & Tasks",
      icon: Activity,
      badge: "Omnichannel",
      img: "/uploads/activities.png",
      title: "Complete timeline audit trail & follow-up scheduler",
      desc: "Log calls, meetings, notes, and emails with outcomes, and automate overdue touchpoint alerts for the entire team.",
      highlights: ["Immutable audit trail", "Priority-based due dates", "Multi-channel touchpoints"],
    },
  ];

  const currentTab = tabs.find((t) => t.id === activeTab)!;
  const currentIndex = tabs.findIndex((t) => t.id === activeTab);

  // Auto-advance timer with progress bar
  useEffect(() => {
    if (isPaused) return;

    const intervalMs = 50;
    const step = (intervalMs / SLIDE_DURATION_MS) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          const nextIndex = (currentIndex + 1) % tabs.length;
          setActiveTab(tabs[nextIndex].id);
          return 0;
        }
        return prev + step;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, tabs]);

  const handleSelectTab = (tabId: typeof activeTab) => {
    setActiveTab(tabId);
    setProgress(0);
  };

  return (
    <div
      className="space-y-6 max-w-6xl mx-auto text-left"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Interactive Tabs Bar */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-2xl sm:rounded-full bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 backdrop-blur-xl max-w-4xl mx-auto shadow-inner">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSelectTab(tab.id)}
              className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 overflow-hidden ${
                isActive
                  ? "bg-white dark:bg-zinc-800 text-foreground shadow-md shadow-slate-900/5 dark:shadow-black/60 scale-100 ring-1 ring-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/40 dark:hover:bg-zinc-800/40"
              }`}
            >
              {/* Active Tab Progress Indicator Fill */}
              {isActive && !isPaused && (
                <div
                  className="absolute bottom-0 left-0 h-[2.5px] bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-75"
                  style={{ width: `${progress}%` }}
                />
              )}

              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-primary" : "opacity-70"}`} />
              <span>{tab.label}</span>
              <span
                className={`hidden md:inline-block text-[9px] font-mono uppercase px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? "bg-primary/10 text-primary font-bold"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Browser Showcase Container with Moving Gradient Border */}
      <div className="relative group">
        {/* Moving Ambient Backlight Glow */}
        <div className="absolute -inset-2 bg-gradient-to-r from-violet-600 via-indigo-600 via-sky-500 via-emerald-400 to-violet-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-45 transition-opacity duration-700 animate-gradient-border -z-10" />

        {/* Outer Frame with Animated Moving Gradient Border */}
        <div className="p-[2px] rounded-2xl sm:rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-500 via-sky-500 via-purple-600 to-violet-600 animate-gradient-border shadow-2xl">
          <div className="rounded-[calc(1rem-1px)] sm:rounded-[calc(1.5rem-1px)] bg-[#0b0b10] overflow-hidden backdrop-blur-2xl">
            {/* Mock Browser Header Bar */}
            <div className="h-11 px-4 sm:px-5 bg-[#12121a] border-b border-white/10 flex items-center justify-between text-xs text-zinc-400 relative">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500/80 shadow-xs" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80 shadow-xs" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80 shadow-xs" />
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-900 border border-white/10 text-[11px] font-mono text-zinc-200 font-semibold">
                <span className="text-emerald-400 font-bold">https://</span>
                <span>app.revlocrm.com/{activeTab}</span>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="purple"
                  className="text-[10px] font-mono hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 border-white/10"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Auto-Advancing Demo</span>
                </Badge>
              </div>

              {/* Top Linear Progress Bar */}
              <div
                className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-violet-500 via-indigo-500 via-sky-400 to-purple-500 transition-all duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Screenshot Display (100% visible, no cutoffs, wrapped in 360-degree saturated gradient border ring) */}
            <div
              key={activeTab}
              className="animate-3d-in relative w-full bg-[#07070b] overflow-hidden flex items-center justify-center p-2 sm:p-3.5"
            >
              {/* Inner Glowing Gradient Border Ring (Uniform 360-degree vivid gradient) */}
              <div className="w-full rounded-xl sm:rounded-2xl p-[2px] bg-gradient-to-tr from-violet-600 via-indigo-500 via-purple-500 to-sky-500 shadow-2xl overflow-hidden">
                <img
                  src={currentTab.img}
                  alt={currentTab.title}
                  className="w-full h-auto max-h-[640px] object-contain sm:object-cover sm:object-top rounded-[calc(0.75rem-1px)] sm:rounded-[calc(1rem-1px)] block shadow-2xl bg-zinc-950"
                  loading="eager"
                />
              </div>
            </div>

            {/* Bottom Structured Feature Bar */}
            <div className="p-4 sm:p-6 bg-[#0e0e16] border-t border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-white">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <h3 className="font-bold text-sm text-white">
                    {currentTab.title}
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
                  {currentTab.desc}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {currentTab.highlights.map((h, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-[10px] font-medium text-zinc-200 bg-white/5 border-white/10 px-2.5 py-1 rounded-lg"
                  >
                    <Check className="h-3 w-3 text-emerald-400 mr-1 inline" />
                    {h}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
