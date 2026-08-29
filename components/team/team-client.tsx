"use client";

import { useState, useMemo } from "react";
import {
  Users2,
  Mail,
  UserPlus,
  Shield,
  CheckCircle2,
  Lock,
  Copy,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
  X,
  Sparkles,
  User,
  Crown,
  AlertCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  inviteMemberAction,
  updateMemberRoleAction,
  toggleMemberCapabilityAction,
} from "@/lib/actions/team";
import { CAPABILITIES } from "@/lib/permissions/capabilities";

export interface WorkspaceMember {
  membershipId: string;
  userId: string;
  userName: string;
  userEmail: string;
  roleId: string;
  roleName: string;
  status: string;
  createdAt: string | Date;
}

export interface InvitationItem {
  id: string;
  email: string;
  roleName?: string;
  status: string;
  expiresAt: string | Date;
}

export interface RoleItem {
  id: string;
  key?: string;
  name: string;
  description?: string | null;
}

export interface RolePermissionItem {
  roleId: string;
  permissionId: string;
}

export interface UserPermissionItem {
  membershipId: string;
  permissionId: string;
  granted: boolean;
}

export function TeamClient({
  members,
  invitationsList,
  rolesList,
  rolePermissionsList = [],
  userPermissionsList = [],
  canInvite = false,
  canManageRoles = false,
}: {
  members: WorkspaceMember[];
  invitationsList: InvitationItem[];
  rolesList: RoleItem[];
  rolePermissionsList?: RolePermissionItem[];
  userPermissionsList?: UserPermissionItem[];
  canInvite?: boolean;
  canManageRoles?: boolean;
}) {
  const [membersList, setMembersList] = useState<WorkspaceMember[]>(members);
  const [userPermsState, setUserPermsState] = useState<UserPermissionItem[]>(userPermissionsList);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isPermsOpen, setIsPermsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState(rolesList[0]?.id || "role_researcher");
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Send Invitation
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsSubmitting(true);
    const res = await inviteMemberAction({
      email: inviteEmail,
      roleId: inviteRoleId,
    });
    if (res?.inviteLink) {
      setLastInviteLink(window.location.origin + res.inviteLink);
    }
    setInviteEmail("");
    setIsSubmitting(false);
  };

  // Change Role Preset
  const handleRoleChange = async (membershipId: string, newRoleId: string) => {
    const foundRole = rolesList.find((r) => r.id === newRoleId);
    setMembersList((prev) =>
      prev.map((m) =>
        m.membershipId === membershipId
          ? { ...m, roleId: newRoleId, roleName: foundRole?.name || m.roleName }
          : m
      )
    );
    await updateMemberRoleAction({
      membershipId,
      roleId: newRoleId,
    });
  };

  // Toggle Capability Permission Override
  const handleTogglePerm = async (
    membershipId: string,
    permId: string,
    nextGranted: boolean
  ) => {
    // Optimistically update local state
    setUserPermsState((prev) => {
      const idx = prev.findIndex(
        (up) => up.membershipId === membershipId && up.permissionId === permId
      );
      if (idx >= 0) {
        return prev.map((up, i) => (i === idx ? { ...up, granted: nextGranted } : up));
      }
      return [...prev, { membershipId, permissionId: permId, granted: nextGranted }];
    });

    await toggleMemberCapabilityAction({
      membershipId,
      permissionId: permId,
      granted: nextGranted,
    });
  };

  // Compute live effective permission state for a member
  const getPermissionStatus = (member: WorkspaceMember, permKey: string) => {
    const isAdmin = member.roleName.toLowerCase() === "admin" || member.roleName.toLowerCase() === "owner";
    if (isAdmin) {
      return {
        isActive: true,
        source: "ADMIN_DEFAULT",
        label: "Granted (Admin Master)",
        badgeVariant: "success" as const,
      };
    }

    const explicitOverride = userPermsState.find(
      (up) => up.membershipId === member.membershipId && up.permissionId === permKey
    );

    if (explicitOverride !== undefined) {
      if (explicitOverride.granted) {
        return {
          isActive: true,
          source: "USER_OVERRIDE_GRANTED",
          label: "Active (Custom Override)",
          badgeVariant: "purple" as const,
        };
      } else {
        return {
          isActive: false,
          source: "USER_OVERRIDE_DENIED",
          label: "Denied (Explicitly Revoked)",
          badgeVariant: "destructive" as const,
        };
      }
    }

    const inRolePreset = rolePermissionsList.some(
      (rp) => rp.roleId === member.roleId && rp.permissionId === permKey
    );

    if (inRolePreset) {
      return {
        isActive: true,
        source: "ROLE_PRESET",
        label: "Granted (Role Preset)",
        badgeVariant: "success" as const,
      };
    }

    return {
      isActive: false,
      source: "DEFAULT_RESTRICTED",
      label: "Restricted (Default Deny)",
      badgeVariant: "secondary" as const,
    };
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-border/60 bg-card/70 p-4 sm:p-6 backdrop-blur-md space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>Team & Capability-Based RBAC</span>
                <Badge variant="secondary" className="text-xs font-mono">
                  {membersList.length} Active Members
                </Badge>
              </h1>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Granular security access control, role presets, and per-user permission overrides
            </p>
          </div>

          {canInvite && (
            <Button
              size="sm"
              variant="gradient"
              onClick={() => {
                setLastInviteLink(null);
                setCopied(false);
                setIsInviteOpen(true);
              }}
              className="text-xs gap-1.5 shadow-xs font-semibold rounded-xl self-start sm:self-auto cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>Invite Member</span>
            </Button>
          )}
        </div>
      </div>

      {/* Members List Table (Spreadsheet on Desktop, Cards on Mobile) */}
      <div className="rounded-2xl border border-border/70 bg-card/90 dark:bg-zinc-900/90 backdrop-blur-md overflow-hidden shadow-xs">
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40 dark:bg-zinc-950/60 border-b border-border/60">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-xs">Team Member</TableHead>
                <TableHead className="font-bold text-xs">Role Preset</TableHead>
                <TableHead className="font-bold text-xs">Status</TableHead>
                <TableHead className="font-bold text-xs">Joined Date</TableHead>
                <TableHead className="text-right font-bold text-xs">Security Matrix</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {membersList.map((m) => (
                <TableRow key={m.membershipId} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                        {m.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-foreground truncate">
                          {m.userName}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {m.userEmail}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {canManageRoles ? (
                      <select
                        value={m.roleId}
                        onChange={(e) => handleRoleChange(m.membershipId, e.target.value)}
                        className="h-8 px-2.5 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-semibold"
                      >
                        {rolesList.map((r) => (
                          <option
                            key={r.id}
                            value={r.id}
                            className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100 py-1"
                          >
                            {r.name.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Badge
                        variant={m.roleName === "admin" ? "purple" : "info"}
                        className="text-[10px] uppercase font-mono font-bold"
                      >
                        {m.roleName}
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    <Badge variant="success" className="text-[10px] capitalize font-medium">
                      {m.status}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedMember(m);
                        setIsPermsOpen(true);
                      }}
                      className="h-8 text-xs gap-1.5 font-semibold rounded-xl border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer shadow-2xs"
                    >
                      <Shield className="h-3.5 w-3.5" />
                      <span>Permission Matrix</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View: Cards */}
        <div className="md:hidden divide-y divide-border/60">
          {membersList.map((m) => (
            <div key={m.membershipId} className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {m.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-foreground truncate">{m.userName}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{m.userEmail}</div>
                  </div>
                </div>

                <Badge variant="success" className="text-[10px] capitalize shrink-0">
                  {m.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                {canManageRoles ? (
                  <select
                    value={m.roleId}
                    onChange={(e) => handleRoleChange(m.membershipId, e.target.value)}
                    className="h-8 px-2 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs font-semibold"
                  >
                    {rolesList.map((r) => (
                      <option key={r.id} value={r.id} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                        {r.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Badge variant={m.roleName === "admin" ? "purple" : "info"} className="text-[10px] uppercase">
                    {m.roleName}
                  </Badge>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedMember(m);
                    setIsPermsOpen(true);
                  }}
                  className="h-8 text-xs gap-1 font-semibold rounded-xl border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span>Matrix</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invitations Section */}
      {invitationsList.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">Pending Invitations</h3>
            <Badge variant="secondary" className="font-mono text-[10px]">
              {invitationsList.length}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {invitationsList.map((inv) => (
              <div
                key={inv.id}
                className="p-4 rounded-2xl bg-card/90 dark:bg-zinc-900/90 border border-border/70 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-foreground truncate">{inv.email}</span>
                  <Badge variant="warning" className="text-[9px] capitalize shrink-0">
                    {inv.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-muted-foreground text-[11px] pt-1 border-t border-border/40">
                  <span>Role: {inv.roleName?.toUpperCase()}</span>
                  <span>Expires in 7 days</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. INVITE MEMBER MODAL                                                    */}
      {/* ========================================================================= */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121218] text-foreground dark:text-zinc-100 border border-slate-200/90 dark:border-zinc-800 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Invite Team Colleague
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Generate a secure, single-use invitation link for a new researcher or sales rep
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {lastInviteLink ? (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium">
                ✅ Invitation token generated successfully! Share this link with your colleague:
              </div>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={lastInviteLink}
                  className="text-xs font-mono bg-background/90 dark:bg-zinc-950/90 rounded-xl"
                />
                <Button
                  size="sm"
                  variant="gradient"
                  onClick={() => {
                    navigator.clipboard.writeText(lastInviteLink);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="gap-1.5 font-semibold rounded-xl shrink-0 cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </Button>
              </div>
              <DialogFooter className="pt-2">
                <Button variant="outline" onClick={() => setIsInviteOpen(false)} className="rounded-xl text-xs">
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleInvite} className="space-y-3.5 pt-1 text-xs">
              <div>
                <label className="block mb-1.5 font-semibold text-foreground">
                  Colleague's Email Address <span className="text-destructive">*</span>
                </label>
                <Input
                  type="email"
                  required
                  placeholder="alex@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-semibold text-foreground">Role Preset</label>
                <select
                  value={inviteRoleId}
                  onChange={(e) => setInviteRoleId(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
                >
                  {rolesList.map((r) => (
                    <option
                      key={r.id}
                      value={r.id}
                      className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100 py-1"
                    >
                      {r.name.toUpperCase()} — {r.description}
                    </option>
                  ))}
                </select>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsInviteOpen(false)}
                  className="rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  disabled={isSubmitting}
                  className="rounded-xl text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{isSubmitting ? "Generating..." : "Generate Secure Invite Link"}</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 2. CAPABILITY PERMISSIONS MATRIX MODAL (WITH LIVE STATUS INDICATORS)     */}
      {/* ========================================================================= */}
      {selectedMember && (
        <Dialog open={isPermsOpen} onOpenChange={setIsPermsOpen}>
          <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121218] text-foreground dark:text-zinc-100 border border-slate-200/90 dark:border-zinc-800 shadow-2xl">
            <DialogHeader>
              <div className="flex items-center gap-3 pb-2 border-b border-border/60">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    Capability Permissions Matrix
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Granular security controls for <strong>{selectedMember.userName}</strong> ({selectedMember.roleName.toUpperCase()})
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 text-xs pt-1">
              <div className="p-3.5 rounded-2xl bg-muted/40 dark:bg-zinc-950/60 border border-border/60 text-muted-foreground text-[11px] leading-relaxed">
                💡 <strong>RBAC Policy:</strong> Researchers are restricted from deleting records or managing dynamic fields by default unless granted an explicit override below.
              </div>

              {/* Matrix List with Live Status Badges & Action Buttons */}
              <div className="space-y-3">
                {[
                  {
                    key: "prospects.delete",
                    title: "Delete & Archive Prospects",
                    desc: "Allow permanently deleting or archiving companies and audit logs",
                  },
                  {
                    key: "prospects.export",
                    title: "Export CSV Datasets",
                    desc: "Allow downloading complete prospect intelligence to CSV",
                  },
                  {
                    key: "custom_fields.manage",
                    title: "Manage Dynamic Fields",
                    desc: "Allow creating, modifying, and deleting workspace custom attributes",
                  },
                  {
                    key: "users.invite",
                    title: "Invite Team Members",
                    desc: "Allow generating invitation tokens for new colleagues",
                  },
                  {
                    key: "roles.manage",
                    title: "Manage Roles & Permissions",
                    desc: "Allow reassigning roles and changing security matrix rules",
                  },
                ].map((cap) => {
                  const permStatus = getPermissionStatus(selectedMember, cap.key);
                  const isCurrentlyActive = permStatus.isActive;

                  return (
                    <div
                      key={cap.key}
                      className="p-4 rounded-2xl bg-card/80 dark:bg-zinc-900/80 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-foreground">{cap.title}</span>
                          <Badge
                            variant={permStatus.badgeVariant}
                            className="text-[10px] font-mono uppercase"
                          >
                            {permStatus.label}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{cap.desc}</p>
                      </div>

                      <div className="shrink-0 self-end sm:self-auto">
                        {selectedMember.roleName.toLowerCase() === "admin" ? (
                          <Badge variant="purple" className="text-[10px] font-mono">
                            Admin Master (Always Active)
                          </Badge>
                        ) : isCurrentlyActive ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleTogglePerm(selectedMember.membershipId, cap.key, false)
                            }
                            className="text-xs h-8 px-3 font-semibold rounded-xl text-rose-500 hover:text-rose-600 border-rose-500/30 hover:bg-rose-500/10 cursor-pointer shadow-2xs"
                          >
                            <span>Revoke Access</span>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="gradient"
                            onClick={() =>
                              handleTogglePerm(selectedMember.membershipId, cap.key, true)
                            }
                            className="text-xs h-8 px-3 font-semibold rounded-xl cursor-pointer shadow-2xs"
                          >
                            <span>Grant Permission</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-border/60">
              <Button
                variant="outline"
                onClick={() => setIsPermsOpen(false)}
                className="rounded-xl text-xs cursor-pointer"
              >
                Close Matrix
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
