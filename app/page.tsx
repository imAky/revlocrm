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
  KeyRound,
  ShieldAlert,
  Flame,
  Globe,
  Award,
  Terminal,
  Clock,
  Mail,
  Phone,
  Workflow,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { AnimatedShowcase } from "@/components/marketing/animated-showcase";

export default function LandingPage() {
  const marqueeItems = [
    { icon: ShieldCheck, text: "Granular RBAC Matrix", color: "text-emerald-500" },
    { icon: Zap, text: "0–100 4-Pillar Heuristic Scorer", color: "text-amber-500" },
    { icon: KeyRound, text: "100% Passwordless Google & OTP", color: "text-indigo-500" },
    { icon: Sliders, text: "Zero-Migration Custom Fields", color: "text-sky-500" },
    { icon: Search, text: "Real-Time Google Maps Research", color: "text-purple-500" },
    { icon: FileSpreadsheet, text: "Smart Duplicate Engine", color: "text-teal-500" },
    { icon: ShieldAlert, text: "Step-Up Admin Security", color: "text-rose-500" },
    { icon: GitPullRequest, text: "13-Stage Bidirectional Kanban", color: "text-blue-500" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-indigo-500/20 selection:text-indigo-300 relative overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-tr from-violet-600/20 via-indigo-600/15 to-transparent blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-[900px] -left-40 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/10 via-sky-500/10 to-transparent blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-[2000px] -right-40 w-[650px] h-[650px] bg-gradient-to-bl from-purple-500/10 via-pink-500/10 to-transparent blur-[150px] pointer-events-none -z-10" />

      {/* Top Navigation */}
      <header className="border-b border-slate-200/60 dark:border-white/5 bg-background/80 backdrop-blur-xl sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-foreground">
                Revlo
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20">
                CRM
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold text-muted-foreground">
            <a href="#showcase" className="hover:text-foreground transition-colors">
              Showcase
            </a>
            <a href="#features" className="hover:text-foreground transition-colors">
              Platform Features
            </a>
            <a href="#workflow" className="hover:text-foreground transition-colors">
              5-Step Workflow
            </a>
            <a href="#security" className="hover:text-foreground transition-colors">
              Security & Stack
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <ThemeToggle />
            <a
              href="https://github.com/imAky/revlocrm"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors hidden sm:flex items-center gap-1.5 text-xs font-semibold"
              title="GitHub Repository"
            >
              <Code2 className="h-4 w-4 text-indigo-500" />
              <span className="hidden md:inline">GitHub</span>
            </a>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs font-semibold rounded-xl px-2.5 sm:px-3">
                Sign In
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="gradient"
                size="sm"
                className="text-xs font-bold gap-1 sm:gap-1.5 shadow-md shadow-indigo-500/20 rounded-xl px-3 sm:px-4 cursor-pointer"
              >
                <span>Live Demo</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-16 sm:pt-24 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center space-y-6 sm:space-y-8">
          {/* Release Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 dark:border-indigo-500/30 text-xs text-indigo-700 dark:text-indigo-300 shadow-sm backdrop-blur-md animate-in fade-in slide-in-from-top-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-foreground">Revlo CRM Production Release</span>
            <span className="text-indigo-400/60">•</span>
            <span className="font-medium">Passwordless Auth & 4-Pillar Scorer</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1] max-w-4xl mx-auto">
            Turn prospect research into a{" "}
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
              high-conversion sales pipeline.
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed font-normal">
            A fast, collaborative outbound CRM engineered for growth teams. Automatically score leads with 4-pillar heuristics, track digital footprints, eliminate duplicate records, and manage 13-stage pipelines without spreadsheet chaos.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <Link href="/login">
              <Button size="lg" variant="gradient" className="gap-2 text-sm font-bold shadow-xl shadow-indigo-500/25 px-7 rounded-2xl cursor-pointer">
                <Sparkles className="h-4 w-4" />
                <span>Try Live Demo Free</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="text-sm font-semibold px-6 border-slate-200/80 dark:border-zinc-800 rounded-2xl cursor-pointer">
                <span>Create Workspace</span>
              </Button>
            </Link>
            <a href="https://github.com/imAky/revlocrm" target="_blank" rel="noreferrer">
              <Button size="lg" variant="outline" className="gap-2 text-sm font-semibold px-5 border-slate-200/80 dark:border-zinc-800 text-foreground rounded-2xl cursor-pointer hidden sm:inline-flex">
                <Code2 className="h-4 w-4 text-indigo-500" />
                <span>Star on GitHub</span>
              </Button>
            </a>
          </div>

          {/* Infinite Horizontal Marquee Ticker */}
          <div className="py-8 sm:py-10 max-w-5xl mx-auto overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_64px,_black_calc(100%-64px),transparent_100%)]">
            <div className="animate-marquee flex items-center gap-4">
              {[...marqueeItems, ...marqueeItems].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100/80 dark:bg-zinc-900/80 border border-slate-200/70 dark:border-white/10 text-xs font-semibold text-foreground backdrop-blur-md shrink-0 shadow-2xs hover:border-primary/40 transition-colors"
                  >
                    <Icon className={`h-4 w-4 ${item.color}`} />
                    <span>{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Animated 3D Screenshot Showcase */}
          <div id="showcase" className="pt-2 sm:pt-4">
            <AnimatedShowcase />
          </div>
        </div>
      </section>

      {/* Section 2: Bento Grid Feature Showcase (Fluid & Borderless) */}
      <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 bg-slate-50/50 dark:bg-zinc-950/40">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <Badge variant="purple" className="uppercase font-mono text-[10px] px-3 py-1">
              Engineered for Modern Sales Teams
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Everything required to scale outbound prospecting.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              No bloated enterprise configuration. Just razor-sharp qualification tools, rich company records, and fluid pipeline progression.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Card 1: 100% Passwordless Auth */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/70 dark:border-white/10 shadow-sm space-y-4 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 group">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <KeyRound className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                100% Passwordless Authentication
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Zero passwords to store or leak. Pure Google 1-Click SSO and Resend 6-digit email OTP verification with encrypted HS256 JWT sessions.
              </p>
            </div>

            {/* Bento Card 2: 4-Pillar Heuristic Scorer */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/70 dark:border-white/10 shadow-sm space-y-4 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1 transition-all duration-300 group">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                0–100 4-Pillar Lead Scorer
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Evaluates Commercial Fit (35%), Digital Presence (30%), Google Maps Reputation (20%), and Outreach Readiness (15%) with instant hover breakdowns.
              </p>
            </div>

            {/* Bento Card 3: Step-Up Admin Security */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/70 dark:border-white/10 shadow-sm space-y-4 hover:border-rose-500/50 hover:shadow-2xl hover:shadow-rose-500/10 hover:-translate-y-1 transition-all duration-300 group">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Zero Data Loss Member Suspension
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Soft-deactivate members with Step-Up Admin Email OTP confirmation. Immediate session lockout while preserving all historic leads and activity logs.
              </p>
            </div>

            {/* Bento Card 4: Bidirectional 13-Stage Pipeline */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/70 dark:border-white/10 shadow-sm space-y-4 hover:border-sky-500/50 hover:shadow-2xl hover:shadow-sky-500/10 hover:-translate-y-1 transition-all duration-300 group">
              <div className="h-12 w-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <GitPullRequest className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                13-Stage Bidirectional Kanban
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Advance or roll back pipeline stages with 1 click. Real-time deal volume aggregation across research, outreach, discovery, and closed won stages.
              </p>
            </div>

            {/* Bento Card 5: Smart Duplicate Prevention */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/70 dark:border-white/10 shadow-sm space-y-4 hover:border-teal-500/50 hover:shadow-2xl hover:shadow-teal-500/10 hover:-translate-y-1 transition-all duration-300 group">
              <div className="h-12 w-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                CSV Import & Duplicate Engine
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Import thousands of records with automatic domain, phone, and name normalization to prevent duplicate company collisions.
              </p>
            </div>

            {/* Bento Card 6: Zero-Migration Custom Fields */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/70 dark:border-white/10 shadow-sm space-y-4 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 group">
              <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sliders className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Zero-Migration Custom Fields
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Define unlimited workspace custom attributes (Currency, Multi-select, URLs, Booleans) stored dynamically without executing database migrations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: 5-Step Outbound Workflow (Fluid & Borderless) */}
      <section id="workflow" className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <Badge variant="info" className="uppercase font-mono text-[10px] px-3 py-1">
              End-to-End Execution
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              From raw discovery to closed won partnership.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              A structured 5-stage workflow designed to keep researchers, SDRs, and account executives in sync.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                step: "01",
                title: "Research & Audit",
                desc: "Capture website, mobile UX, Google ratings, and verified decision-maker contacts.",
              },
              {
                step: "02",
                title: "Score & Qualify",
                desc: "Calculate 0–100 heuristic scores and assign priority tier grades (A+, A, B, C, D).",
              },
              {
                step: "03",
                title: "Assign & Sequence",
                desc: "Delegate high-value prospects to SDRs with scheduled tasks and reminder dates.",
              },
              {
                step: "04",
                title: "Outreach & Pitch",
                desc: "Log calls, meetings, notes, and emails directly into the immutable timeline.",
              },
              {
                step: "05",
                title: "Progress & Close",
                desc: "Advance through 13 bidirectional Kanban stages to Closed Won partnership.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="p-6 rounded-3xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/70 dark:border-white/10 shadow-sm space-y-2 relative group hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <span className="font-mono text-2xl font-black text-indigo-500/40 group-hover:text-primary transition-colors">
                  {s.step}
                </span>
                <h3 className="text-sm font-bold text-foreground pt-1">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Security & Open Source Architecture (Fluid & Borderless) */}
      <section id="security" className="py-20 sm:py-28 px-4 sm:px-6 bg-slate-50/50 dark:bg-zinc-950/40">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <Badge variant="success" className="uppercase font-mono text-[10px] px-3 py-1">
              Production Architecture
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Enterprise security with modern web speed.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Built on Next.js 15, Drizzle ORM, Neon PostgreSQL, and Jose HS256 Token Encryption.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
            <div className="p-6 rounded-3xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/70 dark:border-white/10 space-y-2.5 shadow-sm hover:border-emerald-500/40 transition-all">
              <div className="font-bold text-foreground text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Capability-Based RBAC</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Strict server guards verify permissions before executing deletions, role changes, or dataset exports.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/70 dark:border-white/10 space-y-2.5 shadow-sm hover:border-indigo-500/40 transition-all">
              <div className="font-bold text-foreground text-sm flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-indigo-500" />
                <span>Single-Use 6-Digit OTP</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Encrypted single-use codes with 10-minute automated expiry dispatched via Resend transactional email API.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/70 dark:border-white/10 space-y-2.5 shadow-sm hover:border-sky-500/40 transition-all">
              <div className="font-bold text-foreground text-sm flex items-center gap-2">
                <Database className="h-4 w-4 text-sky-500" />
                <span>Neon PostgreSQL DB</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Multi-tenant workspace isolation with foreign key integrity and zero-data-loss member suspension.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/70 dark:border-white/10 space-y-2.5 shadow-sm hover:border-purple-500/40 transition-all">
              <div className="font-bold text-foreground text-sm flex items-center gap-2">
                <Code2 className="h-4 w-4 text-purple-500" />
                <span>100% Open Source MIT</span>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Self-hostable, customizable, and ready for deployment to Vercel, Fly.io, or Railway with 1 command.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Instant Live Demo CTA Banner */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-sky-600 p-8 sm:p-14 text-white text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />

          <Badge variant="outline" className="text-white border-white/30 text-xs px-3 py-1 font-mono uppercase">
            Instant 1-Click Access
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto leading-tight">
            Ready to supercharge your outbound prospecting?
          </h2>

          <p className="text-sm sm:text-base text-white/90 max-w-xl mx-auto leading-relaxed">
            Experience the full Revlo CRM suite with preloaded prospects, contacts, activities, and Kanban pipeline stages.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/login">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-white/90 font-bold text-sm px-8 rounded-2xl shadow-lg cursor-pointer">
                <span>Launch Live Demo Now</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="text-white border-white/40 hover:bg-white/10 font-bold text-sm px-7 rounded-2xl cursor-pointer">
                <span>Create Workspace</span>
              </Button>
            </Link>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-white/80 font-mono">
            <span>Admin Demo: admin@revlo.demo</span>
            <span>•</span>
            <span>Researcher Demo: researcher@revlo.demo</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 bg-slate-50 dark:bg-zinc-950 text-xs text-muted-foreground border-t border-slate-200/60 dark:border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-bold text-foreground text-sm">Revlo CRM</span>
            <span className="text-[11px] text-muted-foreground">
              — Modern B2B Outbound Intelligence Platform
            </span>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">
              Sign Up
            </Link>
            <a
              href="https://github.com/imAky/revlocrm"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
