"use client";

import { useState, useMemo, useEffect } from "react";
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
  UserX,
  UserCheck,
  ShieldAlert,
  Clock,
  Trash2,
  KeyRound,
  RotateCw,
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
  requestAdminSecurityOtpAction,
  toggleMemberStatusWithOtpAction,
  cancelInvitationAction,
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
  currentUserId,
  members,
  invitationsList,
  rolesList,
  rolePermissionsList = [],
  userPermissionsList = [],
  canInvite = false,
  canManageRoles = false,
}: {
  currentUserId?: string;
  members: WorkspaceMember[];
  invitationsList: InvitationItem[];
  rolesList: RoleItem[];
  rolePermissionsList?: RolePermissionItem[];
  userPermissionsList?: UserPermissionItem[];
  canInvite?: boolean;
  canManageRoles?: boolean;
}) {
  const [membersList, setMembersList] = useState<WorkspaceMember[]>(members);
  const [invites, setInvites] = useState<InvitationItem[]>(invitationsList);
  const [userPermsState, setUserPermsState] = useState<UserPermissionItem[]>(userPermissionsList);

  // Invite Dialog State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState(rolesList[0]?.id || "role_researcher");
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Capability Matrix Dialog State
  const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(null);
  const [isPermsOpen, setIsPermsOpen] = useState(false);

  // Step-Up Admin Security OTP Dialog State (Suspend / Reactivate)
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [securityTargetMember, setSecurityTargetMember] = useState<WorkspaceMember | null>(null);
  const [securityActionType, setSecurityActionType] = useState<"suspend" | "activate">("suspend");
  const [securityOtpStep, setSecurityOtpStep] = useState<"CONFIRM_REQUEST" | "ENTER_OTP">("CONFIRM_REQUEST");
  const [securityOtpCode, setSecurityOtpCode] = useState("");
  const [devSecurityOtp, setDevSecurityOtp] = useState<string | null>(null);
  const [securityAdminEmail, setSecurityAdminEmail] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityCountdown, setSecurityCountdown] = useState(600);

  useEffect(() => {
    let timer: any;
    if (isSecurityModalOpen && securityOtpStep === "ENTER_OTP" && securityCountdown > 0) {
      timer = setInterval(() => setSecurityCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isSecurityModalOpen, securityOtpStep, securityCountdown]);

  const formatCountdown = () => {
    const mins = Math.floor(securityCountdown / 60);
    const secs = securityCountdown % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Open Step-Up Modal for Suspend or Reactivate
  const openSecurityActionModal = (member: WorkspaceMember, action: "suspend" | "activate") => {
    setSecurityTargetMember(member);
    setSecurityActionType(action);
    setSecurityOtpStep("CONFIRM_REQUEST");
    setSecurityOtpCode("");
    setDevSecurityOtp(null);
    setSecurityError(null);
    setSecuritySuccess(null);
    setSecurityLoading(false);
    setIsSecurityModalOpen(true);
  };

  // Request Security OTP to Admin Email
  const handleRequestSecurityOtp = async () => {
    if (!securityTargetMember) return;
    setSecurityLoading(true);
    setSecurityError(null);

    const res = await requestAdminSecurityOtpAction({
      targetMembershipId: securityTargetMember.membershipId,
      actionType: securityActionType,
    });

    if (res.error) {
      setSecurityError(res.error);
      setSecurityLoading(false);
      return;
    }

    if (res.success) {
      setSecurityAdminEmail(res.adminEmail);
      setSecurityOtpStep("ENTER_OTP");
      setSecurityCountdown(600);
      if (res.devOtp) {
        setDevSecurityOtp(res.devOtp);
      }
    }
    setSecurityLoading(false);
  };

  // Verify Security OTP and Execute Action
  const handleExecuteSecurityAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityTargetMember || !securityOtpCode) return;

    setSecurityLoading(true);
    setSecurityError(null);

    const newStatus = securityActionType === "suspend" ? "suspended" : "active";
    const res = await toggleMemberStatusWithOtpAction({
      membershipId: securityTargetMember.membershipId,
      newStatus,
      otp: securityOtpCode,
    });

    if (res.error) {
      setSecurityError(res.error);
      setSecurityLoading(false);
      return;
    }

    if (res.success) {
      setSecuritySuccess(res.message);
      // Update local state
      setMembersList((prev) =>
        prev.map((m) =>
          m.membershipId === securityTargetMember.membershipId
            ? { ...m, status: newStatus }
            : m
        )
      );
      setTimeout(() => {
        setIsSecurityModalOpen(false);
      }, 1800);
    }
    setSecurityLoading(false);
  };

  // Cancel / Revoke Invitation
  const handleCancelInvite = async (invitationId: string) => {
    if (!confirm("Are you sure you want to cancel and revoke this invitation?")) return;
    const res = await cancelInvitationAction({ invitationId });
    if (res.success) {
      setInvites((prev) => prev.filter((i) => i.id !== invitationId));
    }
  };

  // Send Invitation
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setIsSubmitting(true);

    const res = await inviteMemberAction({
      email: inviteEmail,
      roleId: inviteRoleId,
    });

    if (res.error) {
      setInviteError(res.error);
      setIsSubmitting(false);
      return;
    }

    if (res.success && res.inviteLink) {
      const fullUrl = `${window.location.origin}${res.inviteLink}`;
      setLastInviteLink(fullUrl);
      setInvites((prev) => [
        {
          id: res.invitationId || crypto.randomUUID(),
          email: inviteEmail.trim().toLowerCase(),
          roleName: rolesList.find((r) => r.id === inviteRoleId)?.name || "Member",
          status: "pending",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        ...prev,
      ]);
    }
    setIsSubmitting(false);
  };

  const copyToClipboard = () => {
    if (!lastInviteLink) return;
    navigator.clipboard.writeText(lastInviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Role Change
  const handleRoleChange = async (membershipId: string, newRoleId: string) => {
    const roleObj = rolesList.find((r) => r.id === newRoleId);
    if (!roleObj) return;

    setMembersList((prev) =>
      prev.map((m) =>
        m.membershipId === membershipId
          ? { ...m, roleId: newRoleId, roleName: roleObj.name }
          : m
      )
    );

    await updateMemberRoleAction({ membershipId, roleId: newRoleId });
  };

  // Granular Permission Override Toggle
  const handleTogglePerm = async (membershipId: string, permissionId: string, granted: boolean) => {
    setUserPermsState((prev) => {
      const filtered = prev.filter(
        (up) => !(up.membershipId === membershipId && up.permissionId === permissionId)
      );
      return [...filtered, { membershipId, permissionId, granted }];
    });

    await toggleMemberCapabilityAction({ membershipId, permissionId, granted });
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
      <div className="rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white/90 dark:bg-[#121218]/90 p-5 sm:p-6 backdrop-blur-xl space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>Team & Capability-Based Access Control</span>
                <Badge variant="secondary" className="text-xs font-mono">
                  {membersList.length} Total Members
                </Badge>
              </h1>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Manage member roles, active states, step-up security deactivation, and per-user capability overrides
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
              className="text-xs gap-1.5 shadow-xs font-bold rounded-2xl h-10 px-4 self-start sm:self-auto cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>Invite Member</span>
            </Button>
          )}
        </div>
      </div>

      {/* Members List Table (Spreadsheet on Desktop, Cards on Mobile) */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white/90 dark:bg-[#121218]/90 backdrop-blur-xl overflow-hidden shadow-xs">
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 dark:bg-zinc-950/60 border-b border-slate-200/80 dark:border-zinc-800">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-xs">Team Member</TableHead>
                <TableHead className="font-bold text-xs">Role Preset</TableHead>
                <TableHead className="font-bold text-xs">Access Status</TableHead>
                <TableHead className="font-bold text-xs">Joined Date</TableHead>
                <TableHead className="text-right font-bold text-xs">Administrative Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {membersList.map((m) => {
                const isSelf = currentUserId === m.userId;
                const isSuspended = m.status === "suspended" || m.status === "inactive";

                return (
                  <TableRow
                    key={m.membershipId}
                    className={`transition-colors ${
                      isSuspended ? "bg-rose-500/5 opacity-75 hover:bg-rose-500/10" : "hover:bg-muted/30"
                    }`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 rounded-2xl text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 ${
                            isSuspended
                              ? "bg-slate-400 dark:bg-zinc-700"
                              : "bg-gradient-to-tr from-violet-600 to-indigo-600"
                          }`}
                        >
                          {m.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-foreground flex items-center gap-2">
                            <span className="truncate">{m.userName}</span>
                            {isSelf && (
                              <Badge variant="outline" className="text-[9px] font-mono uppercase px-1.5 py-0">
                                You
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {m.userEmail}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {canManageRoles && !isSuspended ? (
                        <select
                          value={m.roleId}
                          onChange={(e) => handleRoleChange(m.membershipId, e.target.value)}
                          disabled={isSelf}
                          className="h-8 px-2.5 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
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
                      {isSuspended ? (
                        <Badge variant="destructive" className="text-[10px] uppercase font-bold flex items-center gap-1 w-fit">
                          <UserX className="h-3 w-3" />
                          <span>Suspended</span>
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-[10px] uppercase font-bold flex items-center gap-1 w-fit">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Active</span>
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Security Matrix Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedMember(m);
                            setIsPermsOpen(true);
                          }}
                          disabled={isSuspended}
                          className="h-8 text-xs gap-1.5 font-semibold rounded-xl border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer shadow-2xs disabled:opacity-40"
                        >
                          <Shield className="h-3.5 w-3.5" />
                          <span>Permissions</span>
                        </Button>

                        {/* Step-Up Protected Deactivate / Reactivate Button */}
                        {canManageRoles && !isSelf && (
                          isSuspended ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openSecurityActionModal(m, "activate")}
                              className="h-8 text-xs gap-1.5 font-semibold rounded-xl border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer shadow-2xs"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              <span>Reactivate</span>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openSecurityActionModal(m, "suspend")}
                              className="h-8 text-xs gap-1.5 font-semibold rounded-xl border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer shadow-2xs"
                            >
                              <UserX className="h-3.5 w-3.5" />
                              <span>Suspend Access</span>
                            </Button>
                          )
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View: Cards */}
        <div className="md:hidden divide-y divide-border/60">
          {membersList.map((m) => {
            const isSelf = currentUserId === m.userId;
            const isSuspended = m.status === "suspended" || m.status === "inactive";

            return (
              <div key={m.membershipId} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`h-9 w-9 rounded-2xl text-white font-bold text-xs flex items-center justify-center shrink-0 ${
                        isSuspended
                          ? "bg-slate-400 dark:bg-zinc-700"
                          : "bg-gradient-to-tr from-violet-600 to-indigo-600"
                      }`}
                    >
                      {m.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-foreground truncate flex items-center gap-1.5">
                        <span>{m.userName}</span>
                        {isSelf && <Badge variant="outline" className="text-[9px]">You</Badge>}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">{m.userEmail}</div>
                    </div>
                  </div>

                  {isSuspended ? (
                    <Badge variant="destructive" className="text-[10px] uppercase shrink-0 font-bold">
                      Suspended
                    </Badge>
                  ) : (
                    <Badge variant="success" className="text-[10px] uppercase shrink-0 font-bold">
                      Active
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                  <Badge variant={m.roleName === "admin" ? "purple" : "info"} className="text-[10px] uppercase font-mono">
                    {m.roleName}
                  </Badge>

                  <div className="flex items-center gap-2 ml-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedMember(m);
                        setIsPermsOpen(true);
                      }}
                      disabled={isSuspended}
                      className="h-8 text-xs gap-1 font-semibold rounded-xl border-primary/30 text-primary"
                    >
                      <Shield className="h-3.5 w-3.5" />
                      <span>Matrix</span>
                    </Button>

                    {canManageRoles && !isSelf && (
                      isSuspended ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openSecurityActionModal(m, "activate")}
                          className="h-8 text-xs gap-1 font-semibold rounded-xl border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>Reactivate</span>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openSecurityActionModal(m, "suspend")}
                          className="h-8 text-xs gap-1 font-semibold rounded-xl border-rose-500/30 text-rose-600 dark:text-rose-400"
                        >
                          <UserX className="h-3.5 w-3.5" />
                          <span>Suspend</span>
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Invitations Section */}
      {invites.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">Pending Invitations</h3>
            <Badge variant="secondary" className="font-mono text-[10px]">
              {invites.length}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="p-4 rounded-3xl bg-white/90 dark:bg-[#121218]/90 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-foreground truncate">{inv.email}</span>
                  <Badge variant="warning" className="text-[9px] capitalize shrink-0">
                    {inv.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-muted-foreground text-[11px] pt-1.5 border-t border-border/40">
                  <span className="font-semibold text-foreground">Role: {inv.roleName?.toUpperCase()}</span>
                  <button
                    type="button"
                    onClick={() => handleCancelInvite(inv.id)}
                    className="text-rose-500 hover:text-rose-600 hover:underline text-[11px] font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Cancel Invite</span>
                  </button>
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
                  Send a personalized email invitation with 1-click Google or OTP onboarding
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {lastInviteLink ? (
            <div className="space-y-4 pt-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Invitation Email Dispatched!</span>
                </div>
                <p className="text-[11px] opacity-90">
                  An email has been dispatched via Resend to <strong>{inviteEmail}</strong>. You can also copy the direct link below:
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">Direct Join Link</label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={lastInviteLink}
                    className="bg-muted/40 font-mono text-[11px] h-10 rounded-xl"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="gradient"
                    onClick={copyToClipboard}
                    className="shrink-0 rounded-xl h-10 px-3 font-semibold text-xs gap-1 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsInviteOpen(false);
                    setLastInviteLink(null);
                    setInviteEmail("");
                  }}
                  className="w-full rounded-xl text-xs cursor-pointer"
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleInviteSubmit} className="space-y-4 pt-2 text-xs">
              {inviteError && (
                <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive font-medium">
                  {inviteError}
                </div>
              )}

              <div>
                <label className="block mb-1.5 font-semibold text-foreground">Colleague Email</label>
                <Input
                  type="email"
                  required
                  placeholder="alex@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl font-medium h-10"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-semibold text-foreground">Role Preset</label>
                <select
                  value={inviteRoleId}
                  onChange={(e) => setInviteRoleId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-semibold"
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
                  className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{isSubmitting ? "Dispatching..." : "Send Invite Email"}</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 2. ADMIN STEP-UP SECURITY OTP MODAL (SUSPEND / REACTIVATE MEMBER)        */}
      {/* ========================================================================= */}
      {securityTargetMember && (
        <Dialog open={isSecurityModalOpen} onOpenChange={setIsSecurityModalOpen}>
          <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121218] text-foreground dark:text-zinc-100 border border-slate-200/90 dark:border-zinc-800 shadow-2xl">
            <DialogHeader>
              <div className="flex items-center gap-3 pb-2 border-b border-border/60">
                <div
                  className={`h-10 w-10 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 ${
                    securityActionType === "suspend"
                      ? "bg-gradient-to-tr from-rose-600 to-red-600 shadow-rose-500/20"
                      : "bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-emerald-500/20"
                  }`}
                >
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    {securityActionType === "suspend" ? "Suspend Member Access" : "Reactivate Member Access"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Step-Up Security Authorization Required
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              {/* Member Details Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/90 border border-slate-200/70 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-foreground block">{securityTargetMember.userName}</span>
                  <span className="text-[11px] text-muted-foreground">{securityTargetMember.userEmail}</span>
                </div>
                <Badge variant={securityTargetMember.roleName === "admin" ? "purple" : "info"} className="text-[10px] uppercase font-mono">
                  {securityTargetMember.roleName}
                </Badge>
              </div>

              {/* Data Integrity Explanation Callout */}
              <div
                className={`p-3.5 rounded-2xl border text-[11px] leading-relaxed ${
                  securityActionType === "suspend"
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                }`}
              >
                {securityActionType === "suspend" ? (
                  <>
                    🛡️ <strong>Zero Data Loss:</strong> All historic records created or owned by this user (leads, notes, activities, tasks) will remain safe and referenced. However, the user will be <strong>immediately blocked from logging in</strong> or performing any actions in this workspace.
                  </>
                ) : (
                  <>
                    ✅ <strong>Access Restoration:</strong> Reactivating will allow this team member to log in again and resume workspace collaboration immediately.
                  </>
                )}
              </div>

              {securityError && (
                <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive font-medium">
                  {securityError}
                </div>
              )}

              {securitySuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{securitySuccess}</span>
                </div>
              )}

              {/* STEP 1: CONFIRM & REQUEST ADMIN SECURITY CODE */}
              {securityOtpStep === "CONFIRM_REQUEST" ? (
                <div className="space-y-4 pt-1">
                  <p className="text-muted-foreground text-[11px]">
                    To authorize this administrative action, a 6-digit confirmation code will be sent to your admin email address.
                  </p>

                  <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/60">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsSecurityModalOpen(false)}
                      className="rounded-xl text-xs cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant={securityActionType === "suspend" ? "destructive" : "gradient"}
                      onClick={handleRequestSecurityOtp}
                      disabled={securityLoading}
                      className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer shadow-md"
                    >
                      <KeyRound className="h-4 w-4" />
                      <span>{securityLoading ? "Sending Code..." : "Send Security Code to Admin"}</span>
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                /* STEP 2: ENTER 6-DIGIT OTP & EXECUTE */
                <form onSubmit={handleExecuteSecurityAction} className="space-y-4 pt-1">
                  <div className="flex items-center justify-between pb-1">
                    <div>
                      <span className="font-bold text-foreground block">Enter Security Confirmation Code</span>
                      <span className="text-[11px] text-muted-foreground">
                        Sent to Admin: <strong className="text-foreground">{securityAdminEmail}</strong>
                      </span>
                    </div>
                    <Badge variant="purple" className="text-[10px] font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatCountdown()}</span>
                    </Badge>
                  </div>

                  <div>
                    <Input
                      required
                      type="text"
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={securityOtpCode}
                      onChange={(e) => setSecurityOtpCode(e.target.value.replace(/\D/g, ""))}
                      className="text-center font-mono text-2xl font-black tracking-[0.4em] h-12 rounded-2xl bg-slate-50/90 dark:bg-zinc-950/90 border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-primary"
                      autoFocus
                    />
                  </div>

                  {devSecurityOtp && (
                    <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-center justify-between">
                      <span>Dev Admin Code: <strong className="font-mono">{devSecurityOtp}</strong></span>
                      <button
                        type="button"
                        onClick={() => setSecurityOtpCode(devSecurityOtp)}
                        className="underline text-[11px] font-bold cursor-pointer"
                      >
                        Auto-fill
                      </button>
                    </div>
                  )}

                  <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/60">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsSecurityModalOpen(false)}
                      className="rounded-xl text-xs cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant={securityActionType === "suspend" ? "destructive" : "gradient"}
                      disabled={securityLoading || securityOtpCode.length < 6}
                      className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer shadow-md"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        {securityLoading
                          ? "Executing..."
                          : securityActionType === "suspend"
                          ? "Confirm & Suspend Member"
                          : "Confirm & Reactivate Member"}
                      </span>
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ========================================================================= */}
      {/* 3. CAPABILITY PERMISSIONS MATRIX MODAL                                    */}
      {/* ========================================================================= */}
      {selectedMember && (
        <Dialog open={isPermsOpen} onOpenChange={setIsPermsOpen}>
          <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121218] text-foreground dark:text-zinc-100 border border-slate-200/90 dark:border-zinc-800 shadow-2xl">
            <DialogHeader>
              <div className="flex items-center gap-3 pb-2 border-b border-border/60">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
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

              {/* Matrix List */}
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
