"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  GitPullRequest,
  Users2,
  CalendarCheck2,
  History,
  Sliders,
  FileSpreadsheet,
  ShieldAlert,
  Settings,
  Sparkles,
  ChevronRight,
  X,
  Layers,
  Flame,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Prospects", href: "/prospects", icon: Building2 },
  { title: "Pipeline", href: "/pipeline", icon: GitPullRequest },
  { title: "Contacts", href: "/contacts", icon: Users2 },
  { title: "Tasks & Queue", href: "/tasks", icon: CalendarCheck2 },
  { title: "Market Research", href: "/research", icon: Compass },
  { title: "Activities", href: "/activities", icon: History },
];

const managementNavItems: NavItem[] = [
  { title: "Dynamic Fields", href: "/custom-fields", icon: Sliders },
  { title: "Import / Export", href: "/import-export", icon: FileSpreadsheet },
  { title: "Team & RBAC", href: "/team", icon: Users2 },
  { title: "Audit Trail", href: "/audit-logs", icon: ShieldAlert },
  { title: "Settings", href: "/settings", icon: Settings },
];

export function SidebarContent({
  roleName = "admin",
  workspaceName = "Revlo Growth Lab",
  onItemClick,
}: {
  roleName?: string;
  workspaceName?: string;
  onItemClick?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col justify-between h-full bg-white dark:bg-[#121218] text-foreground dark:text-zinc-100 select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200/90 dark:border-zinc-800/80">
          <Link href="/dashboard" onClick={onItemClick} className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-tight text-foreground flex items-center gap-1.5">
                Revlo
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 font-bold">
                  CRM
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 truncate max-w-[130px]">
                {workspaceName}
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-none">
          {/* Main Prospecting Hub */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Prospecting & Outreach
            </div>
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onItemClick}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all group",
                      isActive
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25 font-extrabold"
                        : "text-slate-800 dark:text-zinc-200 hover:text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800/80"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          "h-4 w-4 transition-colors shrink-0",
                          isActive
                            ? "text-white"
                            : "text-slate-600 dark:text-zinc-300 group-hover:text-primary"
                        )}
                      />
                      <span className="tracking-tight">{item.title}</span>
                    </div>
                    {item.badge && (
                      <Badge
                        variant={isActive ? "secondary" : "default"}
                        className="text-[10px] px-1.5 py-0 font-mono"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Workspace Management */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Workspace & Security
            </div>
            <nav className="space-y-1">
              {managementNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onItemClick}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all group",
                      isActive
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25 font-extrabold"
                        : "text-slate-800 dark:text-zinc-200 hover:text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800/80"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          "h-4 w-4 transition-colors shrink-0",
                          isActive
                            ? "text-white"
                            : "text-slate-600 dark:text-zinc-300 group-hover:text-primary"
                        )}
                      />
                      <span className="tracking-tight">{item.title}</span>
                    </div>
                    <ChevronRight
                      className={cn(
                        "h-3 w-3 transition-opacity",
                        isActive ? "text-white opacity-90" : "opacity-0 group-hover:opacity-100 text-slate-400"
                      )}
                    />
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Role & Theme Footer */}
      <div className="p-3 border-t border-slate-200/90 dark:border-zinc-800/80 space-y-2 bg-slate-50/70 dark:bg-zinc-950/60">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 shrink-0" />
            <span className="text-[11px] font-bold text-foreground capitalize truncate">
              {roleName} Session
            </span>
          </div>
          <Badge
            variant={roleName === "admin" ? "purple" : "info"}
            className="text-[9px] px-1.5 py-0 uppercase font-mono font-bold shrink-0"
          >
            {roleName}
          </Badge>
        </div>
      </div>
    </div>
  );
}

// Desktop Sidebar (Sticky, hidden on mobile/tablet < 1024px)
export function AppSidebar({
  roleName = "admin",
  workspaceName = "Revlo Growth Lab",
}: {
  roleName?: string;
  workspaceName?: string;
}) {
  return (
    <aside className="hidden lg:flex w-64 border-r border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-[#121218] flex-col justify-between shrink-0 h-screen sticky top-0 shadow-2xs z-20">
      <SidebarContent roleName={roleName} workspaceName={workspaceName} />
    </aside>
  );
}

// Mobile Slide-over Drawer
export function MobileSidebar({
  open,
  onClose,
  roleName = "admin",
  workspaceName = "Revlo Growth Lab",
}: {
  open: boolean;
  onClose: () => void;
  roleName?: string;
  workspaceName?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Dark Dimmer Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      {/* Slide Drawer */}
      <div className="relative z-50 w-72 h-full bg-white dark:bg-[#121218] text-foreground dark:text-zinc-100 border-r border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-4 p-1.5 rounded-xl text-slate-600 dark:text-zinc-300 hover:text-foreground hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer border border-slate-200 dark:border-zinc-800 z-10"
          title="Close Navigation"
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarContent
          roleName={roleName}
          workspaceName={workspaceName}
          onItemClick={onClose}
        />
      </div>
    </div>
  );
}
