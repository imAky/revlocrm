"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { inviteMemberAction, updateMemberRoleAction, toggleMemberCapabilityAction } from "@/lib/actions/team";
import { CAPABILITIES } from "@/lib/permissions/capabilities";

export function TeamClient({
  members,
  invitationsList,
  rolesList,
  canInvite = false,
  canManageRoles = false,
}: {
  members: any[];
  invitationsList: any[];
  rolesList: any[];
  canInvite?: boolean;
  canManageRoles?: boolean;
}) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isPermsOpen, setIsPermsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState(rolesList[0]?.id || "role_researcher");
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleTogglePerm = async (membershipId: string, permId: string, currentGranted: boolean) => {
    await toggleMemberCapabilityAction({
      membershipId,
      permissionId: permId,
      granted: !currentGranted,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Team & Capability-Based RBAC
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-medium">
              Granular Security
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage workspace members, assign role presets, and customize explicit security permissions.
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
            className="text-xs gap-1.5 shadow-md shadow-indigo-500/20 font-semibold"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Invite Member</span>
          </Button>
        )}
      </div>

      {/* Members Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-border/40 bg-white dark:bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Member</TableHead>
              <TableHead>Role Preset</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined Date</TableHead>
              <TableHead className="text-right">Permissions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      {m.userName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-foreground">{m.userName}</div>
                      <div className="text-[11px] text-muted-foreground">{m.userEmail}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {canManageRoles ? (
                    <select
                      value={m.roleId}
                      onChange={async (e) => {
                        await updateMemberRoleAction({
                          membershipId: m.id,
                          roleId: e.target.value,
                        });
                      }}
                      className="h-7 px-2 rounded-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-border text-xs text-foreground font-medium shadow-2xs"
                    >
                      {rolesList.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Badge variant={m.roleName === "admin" ? "purple" : "info"} className="text-[10px] uppercase">
                      {m.roleName}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="success" className="text-[10px] capitalize">
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
                    className="h-7 text-xs gap-1 font-medium"
                  >
                    <Shield className="h-3 w-3 text-indigo-500" />
                    <span>Matrix</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Invitations Section */}
      {invitationsList.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-foreground">Pending Invitations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {invitationsList.map((inv) => (
              <div key={inv.id} className="p-4 rounded-2xl bg-white dark:bg-card border border-slate-200 dark:border-border/40 shadow-xs space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground truncate">{inv.email}</span>
                  <Badge variant="warning" className="text-[9px] capitalize">{inv.status}</Badge>
                </div>
                <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                  <span>Role: {inv.roleName?.toUpperCase()}</span>
                  <span>Expires in 7 days</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-[#121218] border border-slate-200/90 dark:border-border/60 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] dark:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.85)]">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Generate a secure, single-use invitation link for a new researcher or sales rep.
            </DialogDescription>
          </DialogHeader>

          {lastInviteLink ? (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium">
                Invitation token generated successfully!
              </div>
              <div className="flex items-center gap-2">
                <Input readOnly value={lastInviteLink} className="text-xs font-mono bg-slate-50 dark:bg-zinc-900" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(lastInviteLink);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="gap-1 font-medium"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </Button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleInvite} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1.5 font-semibold text-slate-800 dark:text-slate-200">Colleague's Email Address *</label>
                <Input
                  type="email"
                  required
                  placeholder="alex@revlo.demo"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-1.5 font-semibold text-slate-800 dark:text-slate-200">Role Preset</label>
                <select
                  value={inviteRoleId}
                  onChange={(e) => setInviteRoleId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-border text-xs text-slate-900 dark:text-foreground shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
                >
                  {rolesList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name.toUpperCase()} — {r.description}
                    </option>
                  ))}
                </select>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" disabled={isSubmitting}>
                  {isSubmitting ? "Generating..." : "Generate Secure Invite Link"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Permissions Matrix Dialog */}
      {selectedMember && (
        <Dialog open={isPermsOpen} onOpenChange={setIsPermsOpen}>
          <DialogContent className="max-w-xl bg-white dark:bg-[#121218] border border-slate-200/90 dark:border-border/60 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] dark:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.85)]">
            <DialogHeader>
              <DialogTitle>Capability Permissions Matrix</DialogTitle>
              <DialogDescription>
                Customize granular security capabilities for {selectedMember.userName} ({selectedMember.roleName}).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs max-h-96 overflow-y-auto pr-1">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-muted/30 border border-slate-200/80 dark:border-border/40 text-slate-600 dark:text-muted-foreground text-[11px]">
                Note: By default, researchers CANNOT delete records unless the explicit{" "}
                <code className="text-primary font-mono font-semibold">prospects.delete</code> capability is granted below.
              </div>

              <div className="space-y-2.5">
                {[
                  { key: "prospects.delete", title: "Delete & Archive Prospects", desc: "Allow permanently removing prospects from database" },
                  { key: "prospects.export", title: "Export CSV Datasets", desc: "Allow downloading prospect records to CSV" },
                  { key: "custom_fields.manage", title: "Manage Dynamic Fields", desc: "Allow creating new custom attributes" },
                  { key: "users.invite", title: "Invite Team Members", desc: "Allow generating invitation links" },
                ].map((cap) => (
                  <div
                    key={cap.key}
                    className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-card border border-slate-200 dark:border-border/40 flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-foreground block">{cap.title}</span>
                      <span className="text-[11px] text-slate-500 dark:text-muted-foreground">{cap.desc}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTogglePerm(selectedMember.membershipId, cap.key, false)}
                      className="text-xs h-7.5 px-3 font-medium shadow-2xs"
                    >
                      Toggle Permission
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPermsOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
