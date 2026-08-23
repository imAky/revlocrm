"use client";

import { useState } from "react";
import { AppSidebar, MobileSidebar } from "./sidebar";
import { AppTopbar } from "./topbar";

export function WorkspaceShell({
  userName,
  userEmail,
  roleName,
  workspaceName,
  stages = [],
  workspaceUsers = [],
  customFields = [],
  children,
}: {
  userName: string;
  userEmail: string;
  roleName: string;
  workspaceName: string;
  stages?: { id: string; name: string }[];
  workspaceUsers?: { id: string; name: string }[];
  customFields?: any[];
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar (hidden on mobile/tablet) */}
      <AppSidebar roleName={roleName} workspaceName={workspaceName} />

      {/* Mobile Slide-over Drawer (shown when mobileMenuOpen is true) */}
      <MobileSidebar
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        roleName={roleName}
        workspaceName={workspaceName}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppTopbar
          userName={userName}
          userEmail={userEmail}
          roleName={roleName}
          stages={stages}
          workspaceUsers={workspaceUsers}
          customFields={customFields}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
