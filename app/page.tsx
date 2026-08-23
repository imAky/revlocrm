import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sliders,
  Users,
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  GitPullRequest,
  BarChart3,
  Star,
  Code2,
  Layers,
  Search,
  Check,
  TrendingUp,
  Database,
  UserCheck,
  SlidersHorizontal,
  ChevronRight,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-indigo-500/20 selection:text-indigo-300 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-indigo-500/20 via-purple-500/15 to-transparent blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[800px] -left-40 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/10 via-sky-500/10 to-transparent blur-[140px] pointer-events-none -z-10" />

      {/* Top Navigation */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-foreground">
                Revlo
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-semibold">
                CRM
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Platform Features
            </a>
            <a href="#workflow" className="hover:text-foreground transition-colors">
              5-Step Workflow
            </a>
            <a href="#comparison" className="hover:text-foreground transition-colors">
              Why Revlo
            </a>
            <a href="#architecture" className="hover:text-foreground transition-colors">
              Security & Stack
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <ThemeToggle />
            <a
              href="https://github.com/imAky/revlocrm"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="GitHub Repository"
            >
              <Code2 className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs font-medium">
                Sign In
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="gradient" size="sm" className="text-xs font-semibold gap-1.5 shadow-md shadow-indigo-500/20">
                <span>Live Demo</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-32 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center space-y-6 sm:space-y-8">
          {/* Release Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 dark:border-indigo-500/30 text-xs text-indigo-700 dark:text-indigo-300 shadow-sm backdrop-blur-md animate-in fade-in slide-in-from-top-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-foreground">Revlo CRM v1.0 Launch</span>
            <span className="text-indigo-400/60">•</span>
            <span className="font-medium">Open Source Outbound Platform</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Turn prospect research into a{" "}
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
              qualified sales pipeline.
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed font-normal">
            A fast, collaborative CRM engineered for outbound research teams. Automatically score leads, track digital footprints, eliminate duplicate records, and manage 13-stage pipelines without spreadsheet chaos.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <Link href="/login">
              <Button size="lg" variant="gradient" className="gap-2 text-sm font-semibold shadow-xl shadow-indigo-500/25 px-7">
                <span>Try Live Demo Free</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="text-sm font-semibold px-6 border-border/80">
                <span>Create Workspace</span>
              </Button>
            </Link>
            <a href="https://github.com/imAky/revlocrm" target="_blank" rel="noreferrer">
              <Button size="lg" variant="outline" className="gap-2 text-sm font-semibold px-5 border-border/80 text-foreground">
                <Code2 className="h-4 w-4 text-indigo-500" />
                <span>Star on GitHub</span>
              </Button>
            </a>
          </div>

          {/* Trust Highlights */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-muted-foreground pt-4">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Granular RBAC Matrix
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Zap className="h-4 w-4 text-amber-500" />
              0–100 Heuristic Scorer
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Sliders className="h-4 w-4 text-indigo-500" />
              Zero-Migration Custom Fields
            </span>
          </div>

          {/* Interactive Hero Preview UI Showcase */}
          <div className="pt-8 sm:pt-12">
            <div className="rounded-2xl sm:rounded-3xl p-2 sm:p-3 bg-gradient-to-b from-slate-200/80 to-slate-200/20 dark:from-white/10 dark:to-white/5 shadow-2xl shadow-indigo-500/10">
              <div className="rounded-xl sm:rounded-2xl bg-card border border-border/40 overflow-hidden shadow-sm">
                {/* Window Header */}
                <div className="h-10 px-4 bg-muted/40 border-b border-border/30 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                    <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="font-mono text-[11px] text-foreground font-medium">
                    app.revlocrm.com/workspace/pipeline
                  </span>
                  <Badge variant="outline" className="text-[10px] hidden sm:inline-block">
                    Live Demo Mode
                  </Badge>
                </div>

                {/* Dashboard / Pipeline Preview Content */}
                <div className="p-4 sm:p-6 space-y-6 text-left">
                  {/* Top Stats Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-muted/30 border border-border/20">
                      <span className="text-[11px] text-muted-foreground block">Active Pipeline</span>
                      <span className="text-base sm:text-xl font-bold text-foreground">$184,500</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-[11px] text-emerald-500 dark:text-emerald-400 block">A-Tier Prospects</span>
                      <span className="text-base sm:text-xl font-bold text-emerald-500 dark:text-emerald-400">18 Ready</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-muted/30 border border-border/20">
                      <span className="text-[11px] text-muted-foreground block">Avg Deal Size</span>
                      <span className="text-base sm:text-xl font-bold text-foreground">$14,200</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                      <span className="text-[11px] text-indigo-500 dark:text-indigo-400 block">Lead Quality Score</span>
                      <span className="text-base sm:text-xl font-bold text-indigo-500 dark:text-indigo-400">89.4 / 100</span>
                    </div>
                  </div>

                  {/* Kanban Pipeline Mock Preview */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Column 1 */}
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/20 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-indigo-500" />
                          Research & Discovery (4)
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">$48,000</span>
                      </div>
                      <div className="p-3 rounded-lg bg-card border border-border/40 shadow-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-foreground">Vanguard Logistics</span>
                          <Badge variant="success" className="text-[9px] px-1 py-0 font-mono">92 (A+)</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">Fleet dispatch automation & custom client portal</p>
                        <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground">
                          <span>Dallas, TX</span>
                          <span className="font-bold text-foreground">$24,000</span>
                        </div>
                      </div>
                    </div>

                    {/* Column 2 */}
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/20 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-sky-500" />
                          Discovery Booked (3)
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">$52,000</span>
                      </div>
                      <div className="p-3 rounded-lg bg-card border border-border/40 shadow-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-foreground">Apex Dental Group</span>
                          <Badge variant="success" className="text-[9px] px-1 py-0 font-mono">88 (A)</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">Patient online scheduling & recall automation</p>
                        <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground">
                          <span>Austin, TX</span>
                          <span className="font-bold text-foreground">$16,500</span>
                        </div>
                      </div>
                    </div>

                    {/* Column 3 */}
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/20 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          Proposal Accepted (2)
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">$36,000</span>
                      </div>
                      <div className="p-3 rounded-lg bg-card border border-border/40 shadow-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-foreground">Northstar Solar & Roof</span>
                          <Badge variant="success" className="text-[9px] px-1 py-0 font-mono">95 (A+)</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">Local services ad capture & quote estimator</p>
                        <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground">
                          <span>Houston, TX</span>
                          <span className="font-bold text-emerald-500 dark:text-emerald-400">$18,000</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Feature Section */}
      <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 border-t border-border/30 bg-muted/20">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <Badge variant="info" className="uppercase font-mono text-[10px]">
              Engineered for Modern Sales Teams
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Everything required to scale outbound prospecting.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              No bloated enterprise configuration. Just razor-sharp qualification tools, rich company records, and fluid pipeline progression.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Card 1: Heuristic Scoring */}
            <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/40 shadow-sm space-y-4 hover:border-indigo-500/40 transition-all group">
              <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Automatic Heuristic Lead Scorer
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Calculates standardized 0–100 scores and tier grades (A+, A, B, C, D) weighing digital presence, mobile UX, Google reputation, and buying signals.
              </p>
            </div>

            {/* Bento Card 2: Dynamic Custom Fields */}
            <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/40 shadow-sm space-y-4 hover:border-indigo-500/40 transition-all group">
              <div className="h-11 w-11 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Sliders className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Zero-Migration Custom Fields
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Define unlimited workspace custom attributes (Currency, Multi-select, URLs, Booleans) stored dynamically without executing database migrations.
              </p>
            </div>

            {/* Bento Card 3: RBAC & Permission Matrix */}
            <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/40 shadow-sm space-y-4 hover:border-indigo-500/40 transition-all group">
              <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Granular Capability-Based RBAC
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Multi-tenant tenant isolation with Admin, Researcher, and Sales roles. Strict server-side safeguards prevent unauthorized record deletions.
              </p>
            </div>

            {/* Bento Card 4: Bidirectional Pipeline */}
            <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/40 shadow-sm space-y-4 hover:border-indigo-500/40 transition-all group">
              <div className="h-11 w-11 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                <GitPullRequest className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                13-Stage Bidirectional Pipeline
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Advance or roll back pipeline stages with 1 click. Real-time deal volume aggregation across research, outreach, discovery, and closed won stages.
              </p>
            </div>

            {/* Bento Card 5: Smart Duplicate Prevention */}
            <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/40 shadow-sm space-y-4 hover:border-indigo-500/40 transition-all group">
              <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                CSV Import & Duplicate Engine
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Import thousands of records with automatic domain, phone, and name normalization to prevent duplicate company collisions.
              </p>
            </div>

            {/* Bento Card 6: Immutable Security Audit Log */}
            <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/40 shadow-sm space-y-4 hover:border-indigo-500/40 transition-all group">
              <div className="h-11 w-11 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Immutable Security Audit Trail
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Append-only logging captures every user login, record creation, deletion, stage change, and permission override for total team accountability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Step Workflow Section */}
      <section id="workflow" className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <Badge variant="purple" className="uppercase font-mono text-[10px]">
              End-to-End Workflow
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              From raw discovery to closed deal.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              A structured 5-stage workflow designed to keep researchers, SDRs, and account executives in sync.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                step: "01",
                title: "Research & Audit",
                desc: "Capture website, mobile UX, reviews, and decision maker contacts.",
              },
              {
                step: "02",
                title: "Score & Qualify",
                desc: "Calculate 0–100 heuristic scores and assign priority tier grades.",
              },
              {
                step: "03",
                title: "Assign & Sequence",
                desc: "Delegate high-value prospects to SDRs with scheduled tasks.",
              },
              {
                step: "04",
                title: "Pipeline Progression",
                desc: "Move prospects through 13 stages from discovery to proposal.",
              },
              {
                step: "05",
                title: "Close & Audit",
                desc: "Track revenue won with immutable audit logging and performance logs.",
              },
            ].map((item, idx) => (
              <div
                key={item.step}
                className="p-6 rounded-2xl bg-card border border-border/40 space-y-3 relative group hover:border-indigo-500/40 transition-all shadow-xs"
              >
                <div className="font-mono text-2xl font-extrabold text-indigo-500 dark:text-indigo-400">
                  {item.step}
                </div>
                <h4 className="font-bold text-sm text-foreground">{item.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Matrix: Why Revlo */}
      <section id="comparison" className="py-20 sm:py-28 px-4 sm:px-6 border-t border-border/30 bg-muted/20">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Why Teams Choose Revlo
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Compare Revlo against messy Google Sheets and bloated enterprise CRMs.
            </p>
          </div>

          <div className="rounded-2xl border border-border/40 bg-card overflow-hidden shadow-sm">
            <div className="grid grid-cols-3 p-4 bg-muted/40 border-b border-border/30 text-xs font-bold text-foreground">
              <div>Capability</div>
              <div className="text-center text-muted-foreground">Spreadsheets</div>
              <div className="text-center text-indigo-500 font-extrabold">Revlo CRM</div>
            </div>

            <div className="divide-y divide-border/20 text-xs">
              {[
                { name: "0-100 Heuristic Lead Scoring", sheets: "Manual formulas", pf: "Built-in automated" },
                { name: "Granular Researcher vs Admin RBAC", sheets: "None (All or nothing)", pf: "Strict capability matrix" },
                { name: "Duplicate Detection on Import", sheets: "Prone to duplicate loss", pf: "Domain & phone matching" },
                { name: "13-Stage Bidirectional Pipeline", sheets: "Difficult to visualize", pf: "Fluid interactive Kanban" },
                { name: "Dynamic Custom Fields", sheets: "Column chaos", pf: "Zero-migration schema" },
                { name: "Append-Only Security Audit Trail", sheets: "Easily wiped", pf: "PostgreSQL immutable log" },
              ].map((row, idx) => (
                <div key={idx} className="grid grid-cols-3 p-4 items-center">
                  <div className="font-semibold text-foreground">{row.name}</div>
                  <div className="text-center text-muted-foreground">{row.sheets}</div>
                  <div className="text-center text-emerald-500 dark:text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{row.pf}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 relative">
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-indigo-700 p-8 sm:p-14 text-center text-white space-y-6 shadow-2xl shadow-indigo-500/30">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Ready to supercharge your prospect pipeline?
          </h2>
          <p className="text-xs sm:text-base text-indigo-100 max-w-xl mx-auto leading-relaxed">
            Experience Revlo in 1 click with pre-loaded demo personas or deploy to your own private infrastructure.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/login">
              <Button size="lg" className="bg-white text-indigo-900 hover:bg-white/90 font-bold px-8 shadow-lg">
                Launch Live Demo
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 font-semibold px-6">
                Create Workspace
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-4 sm:px-6 bg-card/40 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-foreground">Revlo CRM</span>
            <span>• Open Source MIT License</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-foreground transition-colors">
              Admin Login
            </Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">
              New Workspace
            </Link>
            <a href="https://github.com/imAky/revlocrm" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
              GitHub Repo
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
