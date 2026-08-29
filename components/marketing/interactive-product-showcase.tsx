"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Building2,
  GitPullRequest,
  Search,
  Shield,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Star,
  Flame,
  Globe,
  MapPin,
  Phone,
  Mail,
  Sliders,
  Lock,
  ChevronRight,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function InteractiveProductShowcase() {
  const [activeTab, setActiveTab] = useState<"pipeline" | "scoring" | "rbac" | "research">("pipeline");

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-left">
      {/* Interactive Module Switcher Tabs */}
      <div className="flex items-center justify-center gap-2 p-1.5 rounded-2xl sm:rounded-full bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 backdrop-blur-xl max-w-2xl mx-auto shadow-inner">
        {[
          { id: "pipeline" as const, label: "Visual Pipeline", icon: GitPullRequest, badge: "13 Stages" },
          { id: "scoring" as const, label: "4-Pillar Scorer", icon: Zap, badge: "0–100 ICP" },
          { id: "rbac" as const, label: "RBAC Security", icon: ShieldCheck, badge: "Zero-Loss" },
          { id: "research" as const, label: "Keyword Engine", icon: Search, badge: "Maps Link" },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-white dark:bg-zinc-800 text-foreground shadow-md shadow-slate-900/5 dark:shadow-black/50 scale-100 ring-1 ring-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-zinc-800/50"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-primary" : "opacity-70"}`} />
              <span>{tab.label}</span>
              <span
                className={`hidden sm:inline-block text-[9px] font-mono uppercase px-1.5 py-0.2 rounded-full ${
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

      {/* Main Glassmorphic Window Container */}
      <div className="relative group">
        {/* Ambient Backlight Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500 rounded-3xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-700 -z-10" />

        <div className="rounded-3xl border border-slate-200/90 dark:border-zinc-800 bg-white/95 dark:bg-[#111116]/95 shadow-2xl overflow-hidden backdrop-blur-2xl">
          {/* Top Browser Header */}
          <div className="h-11 px-4 sm:px-5 bg-slate-50 dark:bg-zinc-950 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-rose-500/80 shadow-xs" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80 shadow-xs" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80 shadow-xs" />
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-200/60 dark:bg-zinc-900 border border-slate-300/60 dark:border-zinc-800 text-[11px] font-mono text-foreground font-semibold">
              <span className="text-emerald-500">https://</span>
              <span>app.revlocrm.com/{activeTab === "pipeline" ? "pipeline" : activeTab === "scoring" ? "prospects" : activeTab === "rbac" ? "team" : "research"}</span>
            </div>

            <Badge variant="purple" className="text-[10px] font-mono hidden sm:inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>Live Engine Simulation</span>
            </Badge>
          </div>

          {/* Module 1: Kanban Sales Pipeline */}
          {activeTab === "pipeline" && (
            <div className="p-4 sm:p-6 space-y-5 animate-in fade-in duration-200">
              {/* Top Stats Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/70 dark:border-zinc-800">
                  <span className="text-[11px] text-muted-foreground block font-medium">Active Pipeline Value</span>
                  <span className="text-lg sm:text-2xl font-extrabold text-foreground font-mono">$184,500</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-medium">Hot ICP Leads</span>
                  <span className="text-lg sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">18 Ready</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/70 dark:border-zinc-800">
                  <span className="text-[11px] text-muted-foreground block font-medium">Avg Deal Size</span>
                  <span className="text-lg sm:text-2xl font-extrabold text-foreground font-mono">$16,200</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25">
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 block font-medium">Lead Quality Score</span>
                  <span className="text-lg sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">92.4 / 100</span>
                </div>
              </div>

              {/* Kanban Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Column 1: Discovery */}
                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/50 border border-slate-200/70 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      Discovery Booked (3)
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">$52,000</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-2 hover:border-indigo-500/50 transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-foreground">Apex HVAC Systems</span>
                      <Badge variant="success" className="text-[9px] px-1.5 py-0 font-mono">91 (A+)</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Commercial chiller maintenance retainer</p>
                    <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground border-t border-border/40">
                      <span>Denver, CO</span>
                      <span className="font-bold text-foreground font-mono text-xs">$24,000</span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Proposal Sent */}
                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/50 border border-slate-200/70 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-sky-500" />
                      Proposal Delivered (2)
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">$46,500</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-2 hover:border-sky-500/50 transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-foreground">Northstar Roofing & Solar</span>
                      <Badge variant="success" className="text-[9px] px-1.5 py-0 font-mono">94 (A+)</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Instant solar estimator & localized ads</p>
                    <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground border-t border-border/40">
                      <span>Austin, TX</span>
                      <span className="font-bold text-foreground font-mono text-xs">$18,500</span>
                    </div>
                  </div>
                </div>

                {/* Column 3: Closed Won */}
                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/50 border border-slate-200/70 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Closed Won (4)
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">$86,000</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-500/30 shadow-xs space-y-2 hover:border-emerald-500 transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-foreground">Vanguard Security</span>
                      <Badge variant="success" className="text-[9px] px-1.5 py-0 font-mono">95 (A+)</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">12-Month enterprise growth retainer</p>
                    <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground border-t border-border/40">
                      <span>Chicago, IL</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-xs">$45,000</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Module 2: 4-Pillar ICP Scoring Breakdown */}
          {activeTab === "scoring" && (
            <div className="p-4 sm:p-6 space-y-5 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-base text-foreground">Northstar Roofing & Solar</h4>
                    <Badge variant="success" className="text-[10px] font-mono font-bold">Grade A+ (94 / 100)</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    Hot ICP Lead &bull; Highest conversion target with verified C-level decision maker and high ability to pay.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">94</span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
              </div>

              {/* 4 Pillars Interactive Progress Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between font-bold text-foreground">
                    <span className="flex items-center gap-1.5">💼 Commercial Fit</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">35 / 35 pts</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full w-full" />
                  </div>
                  <span className="text-[11px] text-muted-foreground block">ICP Fit: High &bull; Ability to Pay: High &bull; Urgency: High</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between font-bold text-foreground">
                    <span className="flex items-center gap-1.5">🌐 Digital & Mobile UX</span>
                    <span className="font-mono text-sky-600 dark:text-sky-400">26 / 30 pts</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-sky-500 to-blue-500 rounded-full w-[86%]" />
                  </div>
                  <span className="text-[11px] text-muted-foreground block">Active Domain: Yes &bull; Mobile UX: Good &bull; Quote Flow: Active</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between font-bold text-foreground">
                    <span className="flex items-center gap-1.5">⭐ Google Maps Reputation</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400">18 / 20 pts</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full w-[90%]" />
                  </div>
                  <span className="text-[11px] text-muted-foreground block">Google Rating: 4.8★ &bull; 94 Verified Customer Reviews</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between font-bold text-foreground">
                    <span className="flex items-center gap-1.5">🎯 Outreach Readiness</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">15 / 15 pts</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full w-full" />
                  </div>
                  <span className="text-[11px] text-muted-foreground block">Decision Maker: Marcus Vance (CEO) &bull; Phone + Email Verified</span>
                </div>
              </div>
            </div>
          )}

          {/* Module 3: RBAC & Step-Up Security */}
          {activeTab === "rbac" && (
            <div className="p-4 sm:p-6 space-y-5 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/70 dark:border-zinc-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-foreground block">Workspace Capability Matrix & Safeguards</span>
                  <span className="text-[11px] text-muted-foreground">Admin master authority with granular per-user overrides</span>
                </div>
                <Badge variant="purple" className="text-[10px] font-mono">Zero Data Loss</Badge>
              </div>

              <div className="space-y-2.5 text-xs">
                {[
                  { name: "Sarah Connor (Admin)", role: "ADMIN", status: "Active", perms: "Full Delete, Manage Roles, Export CSV", canDeactivate: false },
                  { name: "Alex Miller (Researcher)", role: "RESEARCHER", status: "Active", perms: "Create, Edit, Research (Delete Strictly Denied)", canDeactivate: true },
                  { name: "Jordan Lee (Sales)", role: "SALES", status: "Active", perms: "Pipelines, Activities, Tasks (Restricted Fields)", canDeactivate: true },
                ].map((m) => (
                  <div key={m.name} className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-foreground block">{m.name}</span>
                        <span className="text-[11px] text-muted-foreground">{m.perms}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={m.role === "ADMIN" ? "purple" : "info"} className="text-[10px] font-mono">
                        {m.role}
                      </Badge>
                      <Badge variant="success" className="text-[10px]">
                        {m.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Module 4: Market Research Engine */}
          {activeTab === "research" && (
            <div className="p-4 sm:p-6 space-y-4 animate-in fade-in duration-200 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/70 dark:border-zinc-800 flex items-center justify-between">
                <span className="font-bold text-foreground">Target Keyword Campaign Tracker</span>
                <Badge variant="info" className="text-[10px] font-mono">Google Maps Connected</Badge>
              </div>

              <div className="space-y-2.5">
                {[
                  { kw: "commercial roofing austin", loc: "Austin, TX", count: 12, vol: "1,800/mo", status: "COMPLETED" },
                  { kw: "commercial hvac denver", loc: "Denver, CO", count: 9, vol: "1,200/mo", status: "COMPLETED" },
                  { kw: "cosmetic dentistry seattle", loc: "Seattle, WA", count: 15, vol: "2,400/mo", status: "IN_PROGRESS" },
                  { kw: "solar installation phoenix", loc: "Phoenix, AZ", count: 18, vol: "3,100/mo", status: "COMPLETED" },
                ].map((k) => (
                  <div key={k.kw} className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-2xs">
                    <div>
                      <span className="font-bold text-foreground text-xs block">&quot;{k.kw}&quot;</span>
                      <span className="text-[11px] text-muted-foreground">{k.loc} &bull; Est. Search Volume: {k.vol}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {k.count} Leads Associated
                      </Badge>
                      <Badge variant={k.status === "COMPLETED" ? "success" : "warning"} className="text-[10px]">
                        {k.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
