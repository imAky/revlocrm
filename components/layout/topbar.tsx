"use client";

import { useState } from "react";
import { Search, Plus, Sparkles, User, LogOut, Check, Menu, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { logoutAction, demoLoginAction } from "@/lib/actions/auth";
import { ProspectCreateModal } from "@/components/prospects/prospect-create-modal";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppTopbar({
  userName = "Sarah Connor",
  userEmail = "admin@revlo.demo",
  roleName = "admin",
  stages = [],
  workspaceUsers = [],
  customFields = [],
  onToggleMobileMenu,
}: {
  userName?: string;
  userEmail?: string;
  roleName?: string;
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
              <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-xs shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
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
                {/* User Info Header */}
                <div className="p-3 border-b border-border/60 bg-muted/30 rounded-xl mb-1">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{userName}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant={roleName === "admin" ? "purple" : "info"} className="text-[9px] font-mono uppercase font-bold">
                      {roleName} Master
                    </Badge>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">● Online</span>
                  </div>
                </div>

                {/* Switch Demo Persona */}
                <div className="py-1.5">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Switch Active Persona
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsUserMenuOpen(false);
                      await demoLoginAction("admin");
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-foreground hover:bg-muted/80 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-purple-500" />
                      <span className="font-semibold">Sarah Connor (Admin)</span>
                    </div>
                    {roleName === "admin" && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setIsUserMenuOpen(false);
                      await demoLoginAction("researcher");
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-foreground hover:bg-muted/80 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span className="font-semibold">Alex Miller (Researcher)</span>
                    </div>
                    {roleName === "researcher" && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                </div>

                {/* Sign Out */}
                <div className="pt-1 border-t border-border/60">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsUserMenuOpen(false);
                      await logoutAction();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors text-left cursor-pointer font-semibold"
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
