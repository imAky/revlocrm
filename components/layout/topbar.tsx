"use client";

import { useState } from "react";
import { Search, Plus, Sparkles, User, LogOut, Menu, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { logoutAction } from "@/lib/actions/auth";
import { ProspectCreateModal } from "@/components/prospects/prospect-create-modal";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppTopbar({
  userName = "Sarah Connor",
  userEmail = "admin@revlo.demo",
  roleName = "admin",
  userAvatar = null,
  stages = [],
  workspaceUsers = [],
  customFields = [],
  onToggleMobileMenu,
}: {
  userName?: string;
  userEmail?: string;
  roleName?: string;
  userAvatar?: string | null;
  stages?: { id: string; name: string }[];
  workspaceUsers?: { id: string; name: string }[];
  customFields?: any[];
  onToggleMobileMenu?: () => void;
}) {
  const [isAddProspectOpen, setIsAddProspectOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <>
      <header className="h-14 sm:h-16 border-b border-border/70 bg-card/90 dark:bg-[#121218]/90 backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        {/* Left: Mobile Hamburger & Search Input */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-md">
          {/* Hamburger button for mobile & tablet (< 1024px) */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-foreground/80 hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer shrink-0 border border-border/60"
            aria-label="Open Navigation Menu"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>

          {/* Search Field with High Contrast in Light & Dark Mode */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
            <input
              type="text"
              placeholder="Search prospects, companies, contacts... (⌘K)"
              className="w-full bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200/90 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-500 dark:placeholder:text-zinc-400 font-medium focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Right: Theme Toggle, Quick Add & User Profile Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
          {/* Light / Dark Mode Toggle */}
          <ThemeToggle />

          {/* Quick Add Prospect Button */}
          <Button
            onClick={() => setIsAddProspectOpen(true)}
            size="sm"
            variant="gradient"
            className="gap-1.5 text-xs font-semibold shadow-xs px-3 sm:px-4 h-8 sm:h-9 rounded-xl cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Add Prospect</span>
            <span className="sm:hidden">Add</span>
          </Button>

          {/* User Menu Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted/80 transition-all border border-border/70 bg-card/80 dark:bg-zinc-900/80 cursor-pointer shadow-2xs"
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="h-7 w-7 rounded-lg object-cover shadow-xs shrink-0 border border-border/80"
                />
              ) : (
                <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-foreground leading-tight truncate max-w-[110px]">
                  {userName}
                </div>
                <div className="text-[10px] text-muted-foreground leading-none uppercase font-mono font-medium pt-0.5">
                  {roleName}
                </div>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:inline" />
            </button>

            {/* Dropdown Menu (Solid Luxury Card with Zero Bleed) */}
            {isUserMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#16161f] p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150 z-50 text-foreground dark:text-zinc-100"
                onClick={(e) => e.stopPropagation()}
              >
                {/* User Identity Details Card */}
                <div className="p-3 mb-2 rounded-xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/70 dark:border-zinc-800 flex items-center gap-3">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="h-10 w-10 rounded-xl object-cover shadow-xs shrink-0 border border-border/80"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-xs shrink-0">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">{userName}</p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">{userEmail}</p>
                  </div>
                </div>

                {/* Role & Session Status Info */}
                <div className="px-3 py-2 mb-2 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-muted-foreground font-medium">Assigned Role</span>
                  <Badge variant={roleName === "admin" ? "purple" : "info"} className="text-[10px] font-mono uppercase font-bold px-2 py-0.5">
                    {roleName}
                  </Badge>
                </div>

                {/* Quick Navigation Links */}
                <div className="py-1 space-y-0.5 text-xs">
                  <a
                    href="/team"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-foreground/80 hover:text-foreground hover:bg-muted/80 rounded-xl transition-colors text-left"
                  >
                    <User className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Team & Permissions</span>
                  </a>

                  <a
                    href="/audit-logs"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-foreground/80 hover:text-foreground hover:bg-muted/80 rounded-xl transition-colors text-left"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-sky-500" />
                    <span>Security & Audit Logs</span>
                  </a>
                </div>

                {/* Sign Out */}
                <div className="pt-1.5 mt-1 border-t border-border/60">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsUserMenuOpen(false);
                      await logoutAction();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors text-left cursor-pointer font-semibold"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out Session</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Complete Comprehensive Prospect Creation Wizard */}
      <ProspectCreateModal
        open={isAddProspectOpen}
        onOpenChange={setIsAddProspectOpen}
        stages={stages}
        workspaceUsers={workspaceUsers}
        customFields={customFields}
      />
    </>
  );
}
