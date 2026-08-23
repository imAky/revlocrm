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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

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
  workspaceName = "ProspectForge Growth Lab",
  onItemClick,
}: {
  roleName?: string;
  workspaceName?: string;
  onItemClick?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col justify-between h-full bg-card/90 backdrop-blur-xl">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-border/40">
          <Link href="/dashboard" onClick={onItemClick} className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5">
                ProspectForge
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  v1
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate max-w-[130px]">
                {workspaceName}
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
          {/* Main Prospecting Hub */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Prospecting
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
                      "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                      isActive
                        ? "bg-primary/15 text-primary font-semibold shadow-sm border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          "h-4 w-4 transition-colors",
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      <span>{item.title}</span>
                    </div>
                    {item.badge && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
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
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
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
                      "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                      isActive
                        ? "bg-primary/15 text-primary font-semibold shadow-sm border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          "h-4 w-4 transition-colors",
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      <span>{item.title}</span>
                    </div>
                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Role & Theme Footer */}
      <div className="p-3 border-t border-border/40 space-y-2">
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-card/40 border border-border/30">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-muted-foreground">
              Role:
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
              {roleName}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Badge
              variant={roleName === "admin" ? "purple" : "info"}
              className="text-[10px] px-1.5 py-0 uppercase"
            >
              {roleName === "admin" ? "Admin" : "Researcher"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

// Desktop Sidebar (Sticky, hidden on mobile/tablet < 1024px)
export function AppSidebar({
  roleName = "admin",
  workspaceName = "ProspectForge Growth Lab",
}: {
  roleName?: string;
  workspaceName?: string;
}) {
  return (
    <aside className="hidden lg:flex w-64 border-r border-border/50 bg-card/60 backdrop-blur-xl flex-col justify-between shrink-0 h-screen sticky top-0">
      <SidebarContent roleName={roleName} workspaceName={workspaceName} />
    </aside>
  );
}

// Mobile Slide-over Drawer
export function MobileSidebar({
  open,
  onClose,
  roleName = "admin",
  workspaceName = "ProspectForge Growth Lab",
}: {
  open: boolean;
  onClose: () => void;
  roleName?: string;
  workspaceName?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="relative z-50 w-72 h-full bg-card border-r border-border/60 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
        <button
          onClick={onClose}
          className="absolute right-3 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
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
