"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users2,
  Mail,
  Phone,
  Building2,
  ExternalLink,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  ChevronRight,
  UserCheck,
  CheckCircle2,
  X,
  Pencil,
  Trash2,
  Share2,
  Check,
  Crown,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createContactAction,
  updateContactAction,
  deleteContactAction,
} from "@/lib/actions/contacts";

export interface ContactListItem {
  id: string;
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  jobTitle?: string | null;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedInUrl?: string | null;
  facebookUrl?: string | null;
  preferredChannel?: string | null;
  isDecisionMaker: boolean;
  notes?: string | null;
  prospectId?: string | null;
  prospectName?: string | null;
  prospectNiche?: string | null;
}

export interface ProspectOption {
  id: string;
  name: string;
  niche?: string | null;
}

export function ContactsClient({
  initialContacts,
  prospectsList = [],
  canDelete = false,
}: {
  initialContacts: ContactListItem[];
  prospectsList?: ProspectOption[];
  canDelete?: boolean;
}) {
  const [contactsList, setContactsList] = useState<ContactListItem[]>(initialContacts);
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState("ALL");
  const [dmOnly, setDmOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"TABLE" | "GRID">("TABLE");

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactListItem | null>(null);

  // Form State (Add)
  const [addForm, setAddForm] = useState({
    prospectId: "",
    firstName: "",
    lastName: "",
    jobTitle: "",
    email: "",
    phone: "",
    linkedInUrl: "",
    preferredChannel: "EMAIL",
    isDecisionMaker: true,
    notes: "",
  });

  // Form State (Edit)
  const [editForm, setEditForm] = useState({
    prospectId: "",
    firstName: "",
    lastName: "",
    jobTitle: "",
    email: "",
    phone: "",
    linkedInUrl: "",
    preferredChannel: "EMAIL",
    isDecisionMaker: false,
    notes: "",
  });

  // Filtered Contacts
  const filteredContacts = useMemo(() => {
    return contactsList.filter((c) => {
      if (dmOnly && !c.isDecisionMaker) return false;
      if (
        channelFilter !== "ALL" &&
        (c.preferredChannel || "EMAIL").toUpperCase() !== channelFilter.toUpperCase()
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.fullName.toLowerCase().includes(q);
        const matchesCompany = c.prospectName?.toLowerCase().includes(q) || false;
        const matchesTitle = c.jobTitle?.toLowerCase().includes(q) || false;
        const matchesEmail = c.email?.toLowerCase().includes(q) || false;
        const matchesPhone = c.phone?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesCompany && !matchesTitle && !matchesEmail && !matchesPhone) {
          return false;
        }
      }

      return true;
    });
  }, [contactsList, searchQuery, channelFilter, dmOnly]);

  // Handle Add Contact Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.firstName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await createContactAction({
        prospectId: addForm.prospectId || undefined,
        firstName: addForm.firstName.trim(),
        lastName: addForm.lastName.trim() || undefined,
        jobTitle: addForm.jobTitle.trim() || undefined,
        email: addForm.email.trim() || undefined,
        phone: addForm.phone.trim() || undefined,
        linkedInUrl: addForm.linkedInUrl.trim() || undefined,
        preferredChannel: addForm.preferredChannel,
        isDecisionMaker: addForm.isDecisionMaker,
        notes: addForm.notes.trim() || undefined,
      });

      if (res.success) {
        const selectedProspect = prospectsList.find((p) => p.id === addForm.prospectId);
        const newContact: ContactListItem = {
          id: res.contactId || crypto.randomUUID(),
          fullName: `${addForm.firstName.trim()} ${addForm.lastName.trim()}`.trim(),
          firstName: addForm.firstName.trim(),
          lastName: addForm.lastName.trim() || null,
          jobTitle: addForm.jobTitle.trim() || null,
          role: null,
          email: addForm.email.trim() || null,
          phone: addForm.phone.trim() || null,
          linkedInUrl: addForm.linkedInUrl.trim() || null,
          facebookUrl: null,
          preferredChannel: addForm.preferredChannel,
          isDecisionMaker: addForm.isDecisionMaker,
          notes: addForm.notes.trim() || null,
          prospectId: addForm.prospectId || null,
          prospectName: selectedProspect?.name || null,
          prospectNiche: selectedProspect?.niche || null,
        };

        setContactsList((prev) => [newContact, ...prev]);
        setAddForm({
          prospectId: "",
          firstName: "",
          lastName: "",
          jobTitle: "",
          email: "",
          phone: "",
          linkedInUrl: "",
          preferredChannel: "EMAIL",
          isDecisionMaker: true,
          notes: "",
        });
        setIsAddOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (c: ContactListItem) => {
    setEditingContact(c);
    setEditForm({
      prospectId: c.prospectId || "",
      firstName: c.firstName || c.fullName.split(" ")[0] || "",
      lastName: c.lastName || c.fullName.split(" ").slice(1).join(" ") || "",
      jobTitle: c.jobTitle || "",
      email: c.email || "",
      phone: c.phone || "",
      linkedInUrl: c.linkedInUrl || "",
      preferredChannel: c.preferredChannel || "EMAIL",
      isDecisionMaker: c.isDecisionMaker,
      notes: c.notes || "",
    });
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact || !editForm.firstName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await updateContactAction(editingContact.id, {
        prospectId: editForm.prospectId || undefined,
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim() || undefined,
        jobTitle: editForm.jobTitle.trim() || undefined,
        email: editForm.email.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        linkedInUrl: editForm.linkedInUrl.trim() || undefined,
        preferredChannel: editForm.preferredChannel,
        isDecisionMaker: editForm.isDecisionMaker,
        notes: editForm.notes.trim() || undefined,
      });

      if (res.success) {
        const selectedProspect = prospectsList.find((p) => p.id === editForm.prospectId);
        setContactsList((prev) =>
          prev.map((c) => {
            if (c.id === editingContact.id) {
              return {
                ...c,
                fullName: `${editForm.firstName.trim()} ${editForm.lastName.trim()}`.trim(),
                firstName: editForm.firstName.trim(),
                lastName: editForm.lastName.trim() || null,
                jobTitle: editForm.jobTitle.trim() || null,
                email: editForm.email.trim() || null,
                phone: editForm.phone.trim() || null,
                linkedInUrl: editForm.linkedInUrl.trim() || null,
                preferredChannel: editForm.preferredChannel,
                isDecisionMaker: editForm.isDecisionMaker,
                notes: editForm.notes.trim() || null,
                prospectId: editForm.prospectId || null,
                prospectName: selectedProspect?.name || c.prospectName,
                prospectNiche: selectedProspect?.niche || c.prospectNiche,
              };
            }
            return c;
          })
        );
        setEditingContact(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete contact "${name}"?`)) return;
    setContactsList((prev) => prev.filter((c) => c.id !== id));
    await deleteContactAction(id);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-border/60 bg-card/70 p-4 sm:p-6 backdrop-blur-md space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Contacts & Decision Makers
              </h1>
              <Badge variant="secondary" className="text-xs font-mono">
                {contactsList.length} Total
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Verified executive directory, founders, department leads, and outreach channels
            </p>
          </div>

          {/* Add Contact Button & View Mode */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => setViewMode("TABLE")}
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  viewMode === "TABLE"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Spreadsheet Table View"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("GRID")}
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  viewMode === "GRID"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>

            <Button
              size="sm"
              variant="gradient"
              onClick={() => setIsAddOpen(true)}
              className="gap-1.5 text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Contact</span>
            </Button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/40">
          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search name, company, email, title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 pr-3 text-xs bg-background/90 dark:bg-zinc-950/90 rounded-xl"
            />
          </div>

          {/* Filter Chips / Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Decision Maker Filter Button */}
            <button
              type="button"
              onClick={() => setDmOnly(!dmOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer border ${
                dmOnly
                  ? "bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/40 shadow-2xs font-semibold"
                  : "bg-muted/50 dark:bg-zinc-900/80 hover:bg-muted text-muted-foreground hover:text-foreground border-border/70"
              }`}
            >
              <Crown className="h-3.5 w-3.5 text-purple-500" />
              <span>Decision Makers Only</span>
            </button>

            {/* Preferred Channel Dropdown */}
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="h-8 px-2.5 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="ALL" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">All Channels</option>
              <option value="EMAIL" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Email Preferred</option>
              <option value="PHONE" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Phone Preferred</option>
              <option value="LINKEDIN" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">LinkedIn Preferred</option>
              <option value="WHATSAPP" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">WhatsApp Preferred</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Contacts Content */}
      {viewMode === "GRID" ? (
        /* Responsive Card Grid View (Optimized for Mobile & Tablet) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-border/80 bg-card/40 p-12 text-center space-y-3">
              <Users2 className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">No contacts found</p>
              <p className="text-xs text-muted-foreground">Try clearing search or add your first contact.</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddOpen(true)}
                className="text-xs gap-1.5 rounded-xl cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Contact</span>
              </Button>
            </div>
          ) : (
            filteredContacts.map((cnt) => (
              <div
                key={cnt.id}
                className="rounded-2xl border border-border/70 bg-card/90 dark:bg-zinc-900/90 p-4 sm:p-5 space-y-3.5 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Header: Name & DM Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-foreground truncate">
                          {cnt.fullName}
                        </span>
                        {cnt.isDecisionMaker && (
                          <Badge
                            variant="purple"
                            className="text-[9px] px-1.5 py-0 font-bold shrink-0"
                          >
                            DM
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {cnt.jobTitle || "Executive / Decision Maker"}
                      </p>
                    </div>

                    {/* Quick Edit & Delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(cnt)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg cursor-pointer"
                        title="Edit Contact"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      {canDelete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(cnt.id, cnt.fullName)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                          title="Delete Contact"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Company Info */}
                  {cnt.prospectId && cnt.prospectName ? (
                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-semibold text-foreground truncate">
                          {cnt.prospectName}
                        </span>
                      </div>
                      {cnt.prospectNiche && (
                        <span className="text-[10px] text-muted-foreground shrink-0 truncate max-w-[120px]">
                          {cnt.prospectNiche}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-muted/30 border border-dashed border-border/50 text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <Briefcase className="h-3 w-3" />
                      <span>General Workspace Stakeholder</span>
                    </div>
                  )}

                  {/* Communication Channels with Click-to-Dial & Click-to-Mail */}
                  <div className="space-y-1.5 text-xs">
                    {/* Click to Mail */}
                    {cnt.email ? (
                      <a
                        href={`mailto:${cnt.email}`}
                        className="flex items-center gap-2 p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/25 text-indigo-600 dark:text-indigo-400 hover:underline font-medium transition-colors"
                        title="Click to send email"
                      >
                        <Mail className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{cnt.email}</span>
                      </a>
                    ) : (
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 px-2">
                        <Mail className="h-3 w-3 opacity-40" />
                        <span>No direct email</span>
                      </div>
                    )}

                    {/* Click to Dial */}
                    {cnt.phone ? (
                      <a
                        href={`tel:${cnt.phone}`}
                        className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 hover:underline font-medium transition-colors"
                        title="Click to dial on phone"
                      >
                        <Phone className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{cnt.phone}</span>
                      </a>
                    ) : (
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 px-2">
                        <Phone className="h-3 w-3 opacity-40" />
                        <span>No direct phone</span>
                      </div>
                    )}

                    {/* LinkedIn */}
                    {cnt.linkedInUrl && (
                      <a
                        href={cnt.linkedInUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-2 text-xs text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        <Share2 className="h-3 w-3" />
                        <span>LinkedIn Profile</span>
                        <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Footer Bar: View Company Button */}
                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                  <Badge variant="outline" className="text-[10px] uppercase font-mono">
                    Pref: {cnt.preferredChannel || "EMAIL"}
                  </Badge>

                  {cnt.prospectId ? (
                    <Link href={`/prospects/${cnt.prospectId}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs font-semibold gap-1 rounded-xl border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-2xs cursor-pointer"
                      >
                        <Building2 className="h-3 w-3" />
                        <span>View Company</span>
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  ) : (
                    <span className="text-[11px] text-muted-foreground italic">
                      Standalone
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Luxury Spreadsheet Table View (Responsive Container) */
        <div className="rounded-2xl border border-border/80 bg-card/90 dark:bg-zinc-900/90 overflow-x-auto shadow-xs backdrop-blur-xl">
          <Table>
            <TableHeader className="bg-muted/40 dark:bg-zinc-950/60 border-b border-border/60">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-xs">Contact Name</TableHead>
                <TableHead className="font-bold text-xs">Role / Title</TableHead>
                <TableHead className="font-bold text-xs">Company</TableHead>
                <TableHead className="font-bold text-xs">Direct Email</TableHead>
                <TableHead className="font-bold text-xs">Phone (Dialer)</TableHead>
                <TableHead className="font-bold text-xs">Channel</TableHead>
                <TableHead className="text-right font-bold text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredContacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-xs text-muted-foreground">
                    No matching contacts found in directory.
                  </TableCell>
                </TableRow>
              ) : (
                filteredContacts.map((cnt) => (
                  <TableRow key={cnt.id} className="hover:bg-muted/30 transition-colors">
                    {/* Contact Name & Decision Maker Badge */}
                    <TableCell>
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <span>{cnt.fullName}</span>
                        {cnt.isDecisionMaker && (
                          <Badge variant="purple" className="text-[9px] px-1.5 py-0 font-bold">
                            DM
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Role / Job Title */}
                    <TableCell>
                      <span className="text-xs text-muted-foreground font-medium">
                        {cnt.jobTitle || "—"}
                      </span>
                    </TableCell>

                    {/* Attached Company */}
                    <TableCell>
                      {cnt.prospectId && cnt.prospectName ? (
                        <Link
                          href={`/prospects/${cnt.prospectId}`}
                          className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1.5"
                        >
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          <span>{cnt.prospectName}</span>
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Standalone
                        </span>
                      )}
                    </TableCell>

                    {/* Click-to-Email */}
                    <TableCell>
                      {cnt.email ? (
                        <a
                          href={`mailto:${cnt.email}`}
                          className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline inline-flex items-center gap-1.5"
                          title="Click to send email"
                        >
                          <Mail className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          <span>{cnt.email}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Click-to-Dial Phone */}
                    <TableCell>
                      {cnt.phone ? (
                        <a
                          href={`tel:${cnt.phone}`}
                          className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline inline-flex items-center gap-1.5"
                          title="Click to open phone dialer"
                        >
                          <Phone className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>{cnt.phone}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Preferred Channel */}
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        {cnt.preferredChannel || "EMAIL"}
                      </Badge>
                    </TableCell>

                    {/* Action Buttons: View Company & Edit / Delete */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {cnt.prospectId && (
                          <Link href={`/prospects/${cnt.prospectId}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2.5 text-xs font-semibold gap-1 rounded-xl border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-2xs cursor-pointer"
                            >
                              <Building2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">View Company</span>
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEdit(cnt)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl cursor-pointer"
                          title="Edit Contact"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        {canDelete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(cnt.id, cnt.fullName)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl cursor-pointer"
                            title="Delete Contact"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. ADD CONTACT MODAL                                                      */}
      {/* ========================================================================= */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121218] text-foreground dark:text-zinc-100 border border-slate-200/90 dark:border-zinc-800 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                <Users2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Add Contact Person
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Record an executive stakeholder, founder, or key lead
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-3.5 pt-1 text-xs">
            {/* Associated Company Selector */}
            <div>
              <label className="block mb-1.5 font-semibold text-foreground">
                Associated Company / Prospect
              </label>
              <select
                value={addForm.prospectId}
                onChange={(e) => setAddForm({ ...addForm, prospectId: e.target.value })}
                className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                  General / Standalone Contact (No Company Attached)
                </option>
                {prospectsList.map((p) => (
                  <option key={p.id} value={p.id} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                    {p.name} {p.niche ? `(${p.niche})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1.5 font-semibold text-foreground">
                  First Name <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. John"
                  value={addForm.firstName}
                  onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
                  className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-semibold text-foreground">Last Name</label>
                <Input
                  placeholder="e.g. Doe"
                  value={addForm.lastName}
                  onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })}
                  className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5 font-semibold text-foreground">Job Title / Role</label>
              <Input
                placeholder="e.g. Founder & Managing Director"
                value={addForm.jobTitle}
                onChange={(e) => setAddForm({ ...addForm, jobTitle: e.target.value })}
                className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1.5 font-semibold text-foreground">Direct Email</label>
                <Input
                  type="email"
                  placeholder="john@company.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-semibold text-foreground">Direct Phone</label>
                <Input
                  placeholder="+1 (555) 000-0000"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1.5 font-semibold text-foreground">LinkedIn Profile URL</label>
                <Input
                  placeholder="https://linkedin.com/in/..."
                  value={addForm.linkedInUrl}
                  onChange={(e) => setAddForm({ ...addForm, linkedInUrl: e.target.value })}
                  className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-semibold text-foreground">Preferred Outreach Channel</label>
                <select
                  value={addForm.preferredChannel}
                  onChange={(e) => setAddForm({ ...addForm, preferredChannel: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="EMAIL" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Email</option>
                  <option value="PHONE" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Phone Call</option>
                  <option value="LINKEDIN" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">LinkedIn</option>
                  <option value="WHATSAPP" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">WhatsApp</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="add-dm-flag"
                checked={addForm.isDecisionMaker}
                onChange={(e) => setAddForm({ ...addForm, isDecisionMaker: e.target.checked })}
                className="h-4 w-4 rounded border-border cursor-pointer"
              />
              <label htmlFor="add-dm-flag" className="cursor-pointer font-semibold text-foreground">
                Flag as Primary Decision Maker
              </label>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
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
                <CheckCircle2 className="h-4 w-4" />
                <span>{isSubmitting ? "Saving..." : "Save Contact"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 2. EDIT CONTACT MODAL                                                     */}
      {/* ========================================================================= */}
      <Dialog open={Boolean(editingContact)} onOpenChange={(open) => !open && setEditingContact(null)}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121218] text-foreground dark:text-zinc-100 border border-slate-200/90 dark:border-zinc-800 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                <Pencil className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Edit Contact Person
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Update stakeholder details and communication preferences
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {editingContact && (
            <form onSubmit={handleEditSubmit} className="space-y-3.5 pt-1 text-xs">
              {/* Associated Company Selector */}
              <div>
                <label className="block mb-1.5 font-semibold text-foreground">
                  Associated Company / Prospect
                </label>
                <select
                  value={editForm.prospectId}
                  onChange={(e) => setEditForm({ ...editForm, prospectId: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                    General / Standalone Contact (No Company Attached)
                  </option>
                  {prospectsList.map((p) => (
                    <option key={p.id} value={p.id} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                      {p.name} {p.niche ? `(${p.niche})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5 font-semibold text-foreground">
                    First Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    required
                    placeholder="First Name"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-semibold text-foreground">Last Name</label>
                  <Input
                    placeholder="Last Name"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 font-semibold text-foreground">Job Title / Role</label>
                <Input
                  placeholder="Job Title"
                  value={editForm.jobTitle}
                  onChange={(e) => setEditForm({ ...editForm, jobTitle: e.target.value })}
                  className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5 font-semibold text-foreground">Direct Email</label>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-semibold text-foreground">Direct Phone</label>
                  <Input
                    placeholder="Phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5 font-semibold text-foreground">LinkedIn Profile URL</label>
                  <Input
                    placeholder="https://linkedin.com/in/..."
                    value={editForm.linkedInUrl}
                    onChange={(e) => setEditForm({ ...editForm, linkedInUrl: e.target.value })}
                    className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-semibold text-foreground">Preferred Channel</label>
                  <select
                    value={editForm.preferredChannel}
                    onChange={(e) => setEditForm({ ...editForm, preferredChannel: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="EMAIL" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Email</option>
                    <option value="PHONE" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Phone Call</option>
                    <option value="LINKEDIN" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">LinkedIn</option>
                    <option value="WHATSAPP" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">WhatsApp</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit-dm-flag"
                  checked={editForm.isDecisionMaker}
                  onChange={(e) => setEditForm({ ...editForm, isDecisionMaker: e.target.checked })}
                  className="h-4 w-4 rounded border-border cursor-pointer"
                />
                <label htmlFor="edit-dm-flag" className="cursor-pointer font-semibold text-foreground">
                  Flag as Primary Decision Maker
                </label>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingContact(null)}
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
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
