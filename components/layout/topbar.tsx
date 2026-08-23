"use client";

import { useState } from "react";
import { Search, Plus, Sparkles, User, LogOut, Check, Menu } from "lucide-react";
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
      <header className="h-14 sm:h-16 border-b border-border/50 bg-card/60 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Left: Mobile Hamburger & Search Trigger */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-md">
          {/* Hamburger button for mobile & tablet (< 1024px) */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-1.5 sm:p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer shrink-0"
            aria-label="Open Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative w-full">
            <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search prospects... (⌘K)"
              className="w-full bg-muted/40 border border-border/40 rounded-lg pl-8 sm:pl-9 pr-3 py-1 sm:py-1.5 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Right: Theme Toggle, Quick Add & User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 ml-2">
          {/* Light / Dark Mode Toggle */}
          <ThemeToggle />

          {/* Quick Add Prospect Button */}
          <Button
            onClick={() => setIsAddProspectOpen(true)}
            size="sm"
            variant="gradient"
            className="gap-1 sm:gap-1.5 text-xs font-semibold shadow-md shadow-indigo-500/20 px-2.5 sm:px-4 h-8 sm:h-9"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Add Prospect</span>
            <span className="sm:hidden">Add</span>
          </Button>

          {/* User Menu Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 sm:p-1.5 rounded-lg hover:bg-muted/60 transition-colors border border-border/30 cursor-pointer"
            >
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                {userName.charAt(0)}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-medium text-foreground leading-tight truncate max-w-[100px]">
                  {userName}
                </div>
                <div className="text-[10px] text-muted-foreground leading-none capitalize">
                  {roleName}
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-border/70 bg-card p-2 shadow-xl backdrop-blur-lg animate-in fade-in zoom-in-95 z-50">
                <div className="px-3 py-2 border-b border-border/40">
                  <p className="text-xs font-semibold text-foreground">{userName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
                  <div className="mt-1.5">
                    <Badge variant={roleName === "admin" ? "purple" : "info"} className="text-[10px]">
                      {roleName.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="py-2">
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Switch Demo Persona
                  </div>
                  <button
                    onClick={async () => {
                      setIsUserMenuOpen(false);
                      await demoLoginAction("admin");
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-foreground hover:bg-muted rounded-md transition-colors text-left cursor-pointer"
                  >
                    <span>Sarah Connor (Admin)</span>
                    {roleName === "admin" && <Check className="h-3 w-3 text-primary" />}
                  </button>
                  <button
                    onClick={async () => {
                      setIsUserMenuOpen(false);
                      await demoLoginAction("researcher");
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-foreground hover:bg-muted rounded-md transition-colors text-left cursor-pointer"
                  >
                    <span>Alex Miller (Researcher)</span>
                    {roleName === "researcher" && <Check className="h-3 w-3 text-primary" />}
                  </button>
                </div>

                <div className="pt-2 border-t border-border/40">
                  <button
                    onClick={async () => {
                      setIsUserMenuOpen(false);
                      await logoutAction();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 rounded-md transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
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
