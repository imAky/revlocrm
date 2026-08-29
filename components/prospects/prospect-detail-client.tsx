"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Globe,
  MapPin,
  Phone,
  Mail,
  Star,
  Sparkles,
  Award,
  Users2,
  CalendarCheck2,
  History,
  Trash2,
  Archive,
  Edit,
  Plus,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Sliders,
  Clock,
  Save,
  Check,
  TrendingUp,
  FileText,
  Send,
  Zap,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { updateProspectAction, deleteProspectAction, archiveProspectAction } from "@/lib/actions/prospects";
import { createContactAction, deleteContactAction } from "@/lib/actions/contacts";
import { createActivityAction } from "@/lib/actions/activities";
import { createTaskAction, updateTaskStatusAction, TaskLogItem } from "@/lib/actions/tasks";
import { saveCustomFieldValueAction } from "@/lib/actions/custom-fields";
import { ProspectTasksTab } from "./prospect-tasks-tab";
import { ProspectActivitiesTab } from "./prospect-activities-tab";
import { ProspectAiDossierModal } from "./prospect-ai-dossier-modal";
import { ProspectMediaTab } from "./prospect-media-tab";
import { LeadScoreBreakdownPopover } from "@/components/scoring/lead-score-breakdown-popover";
import { ProspectMediaItem } from "@/lib/actions/media";

export function ProspectDetailClient({
  prospect,
  contactsList,
  activitiesList,
  tasksList,
  taskLogsList = [],
  mediaList = [],
  customFieldsList,
  customFieldValuesMap,
  stages,
  workspaceUsers,
  currentUserId = "",
  canDelete = false,
}: {
  prospect: any;
  contactsList: any[];
  activitiesList: any[];
  tasksList: any[];
  taskLogsList?: TaskLogItem[];
  mediaList?: ProspectMediaItem[];
  customFieldsList: any[];
  customFieldValuesMap: Record<string, string>;
  stages: any[];
  workspaceUsers: any[];
  currentUserId?: string;
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [editTab, setEditTab] = useState("identity");

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom field local values state
  const [customValues, setCustomValues] = useState<Record<string, string>>(customFieldValuesMap);
  const [savingFieldId, setSavingFieldId] = useState<string | null>(null);

  // Comprehensive Edit Form Covering all product spec fields
  const [editForm, setEditForm] = useState({
    name: prospect.name || "",
    legalName: prospect.legalName || "",
    category: prospect.category || "",
    niche: prospect.niche || "Roofing & Construction",
    website: prospect.website || "",
    googleMapsUrl: prospect.googleMapsUrl || "",
    country: prospect.country || "United States",
    state: prospect.state || "",
    city: prospect.city || "",
    address: prospect.address || "",
    postalCode: prospect.postalCode || "",
    phone: prospect.phone || "",
    email: prospect.email || "",
    businessStatus: prospect.businessStatus || "OPERATIONAL",
    googleRating: prospect.googleRating ? String(prospect.googleRating) : "4.8",
    reviewCount: prospect.reviewCount ?? 45,
    googleProfileUrl: prospect.googleProfileUrl || "",
    websiteExists: prospect.websiteExists ?? true,
    websiteQuality: prospect.websiteQuality || "FAIR",
    mobileUx: prospect.mobileUx || "POOR",
    ctaQuality: prospect.ctaQuality || "POOR",
    quoteBookingFlow: prospect.quoteBookingFlow || "MISSING",
    trustSignals: prospect.trustSignals || "AVERAGE",
    seoVisibility: prospect.seoVisibility || "WEAK",
    speedScore: prospect.speedScore ?? 65,
    dealValue: prospect.dealValue ? String(prospect.dealValue) : "15000",
    stageId: prospect.stageId || stages[0]?.id || "",
    assignedToId: prospect.assignedToId || workspaceUsers[0]?.id || "",
    icpFit: prospect.icpFit || "HIGH",
    abilityToPay: prospect.abilityToPay || "HIGH",
    urgency: prospect.urgency || "HIGH",
    recurringPotential: prospect.recurringPotential || "MEDIUM",
    buyingSignals: prospect.buyingSignals || "",
    mainOpportunity: prospect.mainOpportunity || "",
    leadSource: prospect.leadSource || "Google Maps",
    outreachStatus: prospect.outreachStatus || "READY",
    responseStatus: prospect.responseStatus || "",
    notes: prospect.notes || "",
    researchNotes: prospect.researchNotes || "",
    facebookUrl: prospect.facebookUrl || "",
    instagramUrl: prospect.instagramUrl || "",
    linkedInUrl: prospect.linkedInUrl || "",
  });

  const [contactForm, setContactForm] = useState({
    firstName: "",
    lastName: "",
    jobTitle: "",
    email: "",
    phone: "",
    linkedInUrl: "",
    preferredChannel: "EMAIL",
    isDecisionMaker: true,
  });

  const [activityForm, setActivityForm] = useState({
    type: "NOTE",
    title: "",
    description: "",
    outcome: "",
    nextAction: "",
  });

  const [taskForm, setTaskForm] = useState({
    title: "",
    priority: "MEDIUM",
    dueDate: "",
  });

  // Stage change quick handler
  const handleQuickStageChange = async (newStageId: string) => {
    await updateProspectAction(prospect.id, { stageId: newStageId });
  };

  // Edit Prospect Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateProspectAction(prospect.id, {
        ...editForm,
        reviewCount: Number(editForm.reviewCount) || 0,
        speedScore: Number(editForm.speedScore) || 0,
        dealValue: editForm.dealValue ? String(editForm.dealValue) : undefined,
      });
      setIsEditOpen(false);
    } catch (err: unknown) {
      alert((err as Error).message || "Failed to update prospect profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Custom Field Value
  const handleSaveCustomField = async (fieldId: string) => {
    setSavingFieldId(fieldId);
    await saveCustomFieldValueAction({
      entityId: prospect.id,
      entityType: "PROSPECT",
      customFieldId: fieldId,
      valueText: customValues[fieldId] || "",
    });
    setSavingFieldId(null);
  };

  // Add Contact Submit
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await createContactAction({
      prospectId: prospect.id,
      ...contactForm,
    });
    setContactForm({
      firstName: "",
      lastName: "",
      jobTitle: "",
      email: "",
      phone: "",
      linkedInUrl: "",
      preferredChannel: "EMAIL",
      isDecisionMaker: true,
    });
    setIsAddContactOpen(false);
    setIsSubmitting(false);
  };



  // Add Task Submit
  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await createTaskAction({
      prospectId: prospect.id,
      title: taskForm.title,
      priority: taskForm.priority as any,
      dueDate: taskForm.dueDate ? new Date(taskForm.dueDate) : undefined,
    });
    setTaskForm({ title: "", priority: "MEDIUM", dueDate: "" });
    setIsAddTaskOpen(false);
    setIsSubmitting(false);
  };

  // Delete Prospect
  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete "${prospect.name}"?`)) return;
    try {
      await deleteProspectAction(prospect.id);
      router.push("/prospects");
    } catch (err: unknown) {
      alert((err as Error).message || "Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/prospects"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to all prospects</span>
        </Link>
      </div>

      {/* Prospect Header Card */}
      <div className="rounded-2xl border border-border/60 bg-card/70 p-4 sm:p-6 backdrop-blur-md space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Identity & Badges */}
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white font-bold text-base sm:text-lg flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
              {prospect.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {prospect.name}
                </h1>
                <LeadScoreBreakdownPopover
                  score={prospect.leadScore}
                  grade={prospect.leadGrade}
                  prospectName={prospect.name}
                  scoringInput={editForm as any}
                  size="md"
                  showLabel
                />
                {prospect.businessStatus && (
                  <Badge variant="outline" className="text-[10px] uppercase font-mono">
                    {prospect.businessStatus}
                  </Badge>
                )}
                {prospect.legalName && (
                  <span className="text-xs text-muted-foreground italic hidden sm:inline">
                    ({prospect.legalName})
                  </span>
                )}
              </div>

              {/* Quick Contact & Location Bar */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted-foreground pt-1">
                {prospect.niche && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/60 dark:bg-zinc-800/80 border border-border/60 text-foreground font-medium">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    <span>{prospect.niche}</span>
                  </span>
                )}

                {/* Location with Google Maps link */}
                {(prospect.city || prospect.googleMapsUrl || prospect.address) && (
                  <a
                    href={
                      prospect.googleMapsUrl ||
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${prospect.name} ${prospect.address || ""} ${prospect.city || ""} ${prospect.state || ""} ${prospect.country || ""}`
                      )}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 dark:bg-sky-500/15 border border-sky-500/25 text-sky-600 dark:text-sky-400 font-medium hover:underline transition-colors"
                    title="Open in Google Maps"
                  >
                    <MapPin className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                    <span>{prospect.city ? `${prospect.city}, ${prospect.state || prospect.country}` : "View Location on Maps"}</span>
                    <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                  </a>
                )}

                {/* Phone with Click-to-Dial */}
                {prospect.phone && (
                  <a
                    href={`tel:${prospect.phone}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-medium hover:underline transition-colors"
                    title="Click to dial on phone"
                  >
                    <Phone className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>{prospect.phone}</span>
                  </a>
                )}

                {/* Email with Click-to-Mail */}
                {prospect.email && (
                  <a
                    href={`mailto:${prospect.email}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 dark:bg-primary/15 border border-primary/25 text-primary font-medium hover:underline transition-colors"
                    title="Click to send email"
                  >
                    <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{prospect.email}</span>
                  </a>
                )}

                {/* Website */}
                {prospect.website && (
                  <a
                    href={prospect.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 dark:bg-zinc-800/80 border border-border/60 text-primary hover:underline transition-colors"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>{prospect.website.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Header Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={prospect.stageId || ""}
              onChange={(e) => handleQuickStageChange(e.target.value)}
              className="h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                  Stage: {s.name}
                </option>
              ))}
            </select>

            <Button
              size="sm"
              variant="gradient"
              onClick={() => setIsDossierModalOpen(true)}
              className="gap-1.5 text-xs font-semibold rounded-xl shadow-xs"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Prompt Summary (.MD)</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditOpen(true)}
              className="gap-1.5 text-xs font-medium"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Edit Record</span>
            </Button>

            {canDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                className="gap-1.5 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="flex w-max min-w-full sm:grid sm:grid-cols-7 text-xs">
            <TabsTrigger value="overview" className="whitespace-nowrap">1. Overview & ICP</TabsTrigger>
            <TabsTrigger value="identity" className="whitespace-nowrap">2. Business Profile</TabsTrigger>
            <TabsTrigger value="digital" className="whitespace-nowrap">3. Digital Audit</TabsTrigger>
            <TabsTrigger value="contacts" className="whitespace-nowrap">4. Contacts ({contactsList.length})</TabsTrigger>
            <TabsTrigger value="timeline" className="whitespace-nowrap">5. Activities ({activitiesList.length})</TabsTrigger>
            <TabsTrigger value="tasks" className="whitespace-nowrap">6. Tasks ({tasksList.length})</TabsTrigger>
            <TabsTrigger value="media" className="whitespace-nowrap">7. Media & Resources ({mediaList.length})</TabsTrigger>
          </TabsList>
        </div>

        {/* 1. Tab: Overview & Commercial ICP */}
        <TabsContent value="overview" className="space-y-6 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Opportunity Card */}
              <div className="rounded-2xl border border-border/60 bg-card/70 p-5 sm:p-6 backdrop-blur-md space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  Primary Commercial Opportunity
                </h3>
                <p className="text-xs text-foreground/90 bg-muted/30 p-3.5 rounded-xl border border-border/40 leading-relaxed">
                  {prospect.mainOpportunity || "No specific opportunity logged yet."}
                </p>
                {prospect.buyingSignals && (
                  <div className="pt-2">
                    <span className="text-xs font-semibold text-muted-foreground block mb-1">
                      Buying Signals Identified:
                    </span>
                    <p className="text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                      {prospect.buyingSignals}
                    </p>
                  </div>
                )}
              </div>

              {/* Research & Problem Notes */}
              <div className="rounded-2xl border border-border/60 bg-card/70 p-5 sm:p-6 backdrop-blur-md space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Research & Discovery Notes
                </h3>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {prospect.researchNotes || prospect.notes || "No research notes recorded."}
                </p>
              </div>

              {/* Dynamic Custom Fields Section with In-place Editing */}
              <div className="rounded-2xl border border-border/60 bg-card/70 p-5 sm:p-6 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-primary" />
                    Dynamic Custom Attributes
                  </h3>
                  <Link href="/custom-fields" className="text-xs text-primary hover:underline">
                    Manage Schema
                  </Link>
                </div>

                {customFieldsList.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    No custom fields configured for this workspace. Go to Dynamic Fields to add attributes.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {customFieldsList.map((cf) => (
                      <div key={cf.id} className="p-3 rounded-xl bg-background/50 border border-border/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {cf.name}
                          </span>
                          <Badge variant="secondary" className="text-[9px] uppercase font-mono">
                            {cf.fieldType}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder={`Enter ${cf.name}...`}
                            value={customValues[cf.id] || ""}
                            onChange={(e) =>
                              setCustomValues({ ...customValues, [cf.id]: e.target.value })
                            }
                            className="text-xs h-8"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveCustomField(cf.id)}
                            disabled={savingFieldId === cf.id}
                            className="h-8 px-2 text-xs"
                            title="Save Value"
                          >
                            {savingFieldId === cf.id ? "..." : <Save className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Commercial Qualification */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-border/60 bg-card/70 p-5 sm:p-6 backdrop-blur-md space-y-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Commercial Qualification
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-border/30 pb-2">
                    <span className="text-muted-foreground">Estimated Deal Value</span>
                    <span className="font-bold text-foreground">
                      {prospect.dealValue ? `$${Number(prospect.dealValue).toLocaleString()}` : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/30 pb-2">
                    <span className="text-muted-foreground">ICP Fit</span>
                    <Badge variant={prospect.icpFit === "HIGH" ? "success" : "secondary"}>
                      {prospect.icpFit || "MEDIUM"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/30 pb-2">
                    <span className="text-muted-foreground">Ability to Pay</span>
                    <Badge variant={prospect.abilityToPay === "HIGH" ? "success" : "secondary"}>
                      {prospect.abilityToPay || "MEDIUM"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/30 pb-2">
                    <span className="text-muted-foreground">Sales Urgency</span>
                    <Badge variant={prospect.urgency === "HIGH" ? "warning" : "secondary"}>
                      {prospect.urgency || "MEDIUM"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/30 pb-2">
                    <span className="text-muted-foreground">Recurring Potential</span>
                    <Badge variant={prospect.recurringPotential === "HIGH" ? "success" : "secondary"}>
                      {prospect.recurringPotential || "MEDIUM"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/30 pb-2">
                    <span className="text-muted-foreground">Google Reputation</span>
                    <span className="font-semibold text-amber-400">
                      ★ {prospect.googleRating || "N/A"} ({prospect.reviewCount || 0} reviews)
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-muted-foreground">Lead Source</span>
                    <span className="font-medium text-foreground">{prospect.leadSource || "Direct Research"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 2. Tab: Business Profile & Location */}
        <TabsContent value="identity" className="space-y-4 pt-2">
          <div className="rounded-2xl border border-border/60 bg-card/70 p-5 sm:p-6 backdrop-blur-md space-y-6">
            <h3 className="text-sm font-semibold text-foreground">
              Business Identity & Physical Location
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-background/50 border border-border/40 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">Company Name</span>
                <div className="font-bold text-foreground">{prospect.name}</div>
              </div>

              <div className="p-4 rounded-xl bg-background/50 border border-border/40 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">Legal / Entity Name</span>
                <div className="font-bold text-foreground">{prospect.legalName || "—"}</div>
              </div>

              <div className="p-4 rounded-xl bg-background/50 border border-border/40 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">Industry / Niche</span>
                <div className="font-bold text-foreground">{prospect.niche || "—"}</div>
              </div>

              <div className="p-4 rounded-xl bg-background/50 border border-border/40 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">Street Address</span>
                <div className="font-medium text-foreground">{prospect.address || "—"}</div>
              </div>

              <div className="p-4 rounded-xl bg-background/50 border border-border/40 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">City & State</span>
                <div className="font-medium text-foreground">
                  {prospect.city ? `${prospect.city}, ${prospect.state || ""}` : "—"}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-background/50 border border-border/40 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">Postal / ZIP Code</span>
                <div className="font-medium text-foreground">{prospect.postalCode || "—"}</div>
              </div>

              <div className="p-4 rounded-xl bg-background/50 border border-border/40 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">Business Phone</span>
                <div className="font-medium text-foreground">{prospect.phone || "—"}</div>
              </div>

              <div className="p-4 rounded-xl bg-background/50 border border-border/40 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">Public Email</span>
                <div className="font-medium text-primary">{prospect.email || "—"}</div>
              </div>

              <div className="p-4 rounded-xl bg-background/50 border border-border/40 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">Operational Status</span>
                <div className="font-bold text-foreground">{prospect.businessStatus || "OPERATIONAL"}</div>
              </div>
            </div>

            {/* Maps & Links */}
            <div className="flex flex-wrap gap-3 pt-2">
              {prospect.googleMapsUrl && (
                <a
                  href={prospect.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs text-foreground hover:bg-muted/80 transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5 text-sky-400" />
                  View on Google Maps
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {prospect.googleProfileUrl && (
                <a
                  href={prospect.googleProfileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs text-foreground hover:bg-muted/80 transition-colors"
                >
                  <Star className="h-3.5 w-3.5 text-amber-400" />
                  Google Business Profile
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </TabsContent>

        {/* 3. Tab: Digital Audit & Footprint */}
        <TabsContent value="digital" className="space-y-4 pt-2">
          <div className="rounded-2xl border border-border/60 bg-card/70 p-5 sm:p-6 backdrop-blur-md space-y-6">
            <h3 className="text-sm font-semibold text-foreground">
              Digital Footprint & Technical Audit
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-background/50 border border-border/40 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">Website Quality</span>
                <div className="text-sm font-bold text-foreground">
                  {prospect.websiteQuality || "FAIR"}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-background/50 border border-border/40 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">Mobile Experience</span>
                <div className="text-sm font-bold text-foreground">
                  {prospect.mobileUx || "POOR"}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-background/50 border border-border/40 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">CTA Quality</span>
                <div className="text-sm font-bold text-foreground">
                  {prospect.ctaQuality || "POOR"}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-background/50 border border-border/40 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">Speed Audit Score</span>
                <div className="text-sm font-bold text-foreground">
                  {prospect.speedScore ? `${prospect.speedScore}/100` : "65/100"}
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40">
                <span className="font-semibold text-foreground block mb-1">Quote & Booking Flow Audit:</span>
                <p className="text-muted-foreground">{prospect.quoteBookingFlow || "No notes logged."}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40">
                <span className="font-semibold text-foreground block mb-1">Trust Signals & Certifications:</span>
                <p className="text-muted-foreground">{prospect.trustSignals || "None logged."}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40">
                <span className="font-semibold text-foreground block mb-1">Local SEO Visibility:</span>
                <p className="text-muted-foreground">{prospect.seoVisibility || "None logged."}</p>
              </div>
            </div>

            {/* Social Footprint */}
            <div className="pt-2">
              <span className="text-xs font-semibold text-foreground block mb-2">Social Channels:</span>
              <div className="flex flex-wrap gap-3 text-xs">
                {prospect.facebookUrl ? (
                  <a href={prospect.facebookUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    Facebook Profile <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">No Facebook logged</span>
                )}
                {prospect.instagramUrl && (
                  <a href={prospect.instagramUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    Instagram <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {prospect.linkedInUrl && (
                  <a href={prospect.linkedInUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    Company LinkedIn <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 4. Tab: Contacts & Decision Makers */}
        <TabsContent value="contacts" className="space-y-4 pt-2">
          <div className="rounded-2xl border border-border/60 bg-card/70 p-5 sm:p-6 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Decision Makers & Contacts</h3>
                <p className="text-xs text-muted-foreground">People associated with this business</p>
              </div>
              <Button
                size="sm"
                variant="gradient"
                onClick={() => setIsAddContactOpen(true)}
                className="gap-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Contact
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contactsList.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-xs text-muted-foreground">
                  No contacts added yet. Click "Add Contact" to record a decision maker.
                </div>
              ) : (
                contactsList.map((cnt) => (
                  <div
                    key={cnt.id}
                    className="p-4 rounded-xl bg-background/50 border border-border/40 space-y-2 relative"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                          {cnt.fullName}
                          {cnt.isDecisionMaker && (
                            <Badge variant="purple" className="text-[9px] px-1.5 py-0">
                              Decision Maker
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{cnt.jobTitle || cnt.role}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          if (confirm(`Remove ${cnt.fullName}?`)) {
                            await deleteContactAction(cnt.id);
                          }
                        }}
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="text-xs space-y-1 text-muted-foreground pt-1">
                      {cnt.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-indigo-400" />
                          <a href={`mailto:${cnt.email}`} className="text-primary hover:underline">
                            {cnt.email}
                          </a>
                        </div>
                      )}
                      {cnt.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-emerald-400" />
                          <span>{cnt.phone}</span>
                        </div>
                      )}
                      {cnt.linkedInUrl && (
                        <div className="flex items-center gap-1.5">
                          <ExternalLink className="h-3.5 w-3.5 text-sky-400" />
                          <a href={cnt.linkedInUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                            LinkedIn Profile
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* 5. Tab: Activities Feed */}
        <TabsContent value="timeline" className="space-y-4 pt-2">
          <ProspectActivitiesTab
            prospectId={prospect.id}
            prospectName={prospect.name}
            initialActivities={activitiesList}
            contactsList={contactsList}
            currentUserId={currentUserId}
          />
        </TabsContent>

        {/* 6. Tab: Tasks */}
        <TabsContent value="tasks" className="space-y-4 pt-2">
          <ProspectTasksTab
            prospectId={prospect.id}
            prospectName={prospect.name}
            initialTasks={tasksList}
            initialLogs={taskLogsList}
            workspaceUsers={workspaceUsers}
            currentUserId={currentUserId}
          />
        </TabsContent>

        {/* 7. Tab: Media, Documents & Cloud Resources */}
        <TabsContent value="media" className="space-y-4 pt-2">
          <ProspectMediaTab
            prospectId={prospect.id}
            initialMedia={mediaList}
          />
        </TabsContent>
      </Tabs>

      {/* Comprehensive Edit All Fields Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#121218] text-foreground dark:text-zinc-100 border border-slate-200/90 dark:border-zinc-800 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                <Edit className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground dark:text-zinc-100">
                  Edit Full Prospect Profile
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Update business identity, location, digital presence, ICP qualification, and pipeline status.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 pt-1">
            <Tabs value={editTab} onValueChange={setEditTab} className="space-y-4">
              <div className="overflow-x-auto pb-1 scrollbar-none">
                <TabsList className="flex w-max min-w-full sm:grid sm:grid-cols-4 text-xs bg-muted/60 dark:bg-zinc-950/80 p-1 rounded-2xl border border-border/80">
                  <TabsTrigger value="identity" className="text-xs whitespace-nowrap rounded-xl font-semibold">
                    1. Identity & Location
                  </TabsTrigger>
                  <TabsTrigger value="digital" className="text-xs whitespace-nowrap rounded-xl font-semibold">
                    2. Digital Audit
                  </TabsTrigger>
                  <TabsTrigger value="commercial" className="text-xs whitespace-nowrap rounded-xl font-semibold">
                    3. Commercial & ICP
                  </TabsTrigger>
                  <TabsTrigger value="workflow" className="text-xs whitespace-nowrap rounded-xl font-semibold">
                    4. Pipeline & Notes
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* TAB 1: Business Identity & Location */}
              <TabsContent value="identity" className="space-y-4 pt-1 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block mb-1.5 font-semibold text-foreground">
                      Company Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="font-medium bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Legal / Entity Name</label>
                    <Input
                      value={editForm.legalName}
                      onChange={(e) => setEditForm({ ...editForm, legalName: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Industry / Vertical</label>
                    <Input
                      value={editForm.niche}
                      onChange={(e) => setEditForm({ ...editForm, niche: e.target.value, category: e.target.value })}
                      placeholder="e.g. Roofing & Solar, B2B SaaS"
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Business Operating Status</label>
                    <select
                      value={editForm.businessStatus}
                      onChange={(e) => setEditForm({ ...editForm, businessStatus: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="OPERATIONAL" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Operational & Active</option>
                      <option value="TEMPORARILY_CLOSED" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Temporarily Closed</option>
                      <option value="PERMANENTLY_CLOSED" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Permanently Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Country</label>
                    <Input
                      value={editForm.country}
                      onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">City</label>
                    <Input
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">State / Region</label>
                    <Input
                      value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Street Address</label>
                    <Input
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Postal / Zip Code</label>
                    <Input
                      value={editForm.postalCode}
                      onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Main Business Phone</label>
                    <Input
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Public Email</label>
                    <Input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Website URL</label>
                    <Input
                      value={editForm.website}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      placeholder="https://..."
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Google Maps URL</label>
                    <Input
                      value={editForm.googleMapsUrl}
                      onChange={(e) => setEditForm({ ...editForm, googleMapsUrl: e.target.value })}
                      placeholder="https://maps.google.com/..."
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* TAB 2: Digital Presence & Google Audit */}
              <TabsContent value="digital" className="space-y-4 pt-1 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Google Star Rating</label>
                    <Input
                      value={editForm.googleRating}
                      onChange={(e) => setEditForm({ ...editForm, googleRating: e.target.value })}
                      placeholder="e.g. 4.8"
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Review Count</label>
                    <Input
                      type="number"
                      value={editForm.reviewCount}
                      onChange={(e) => setEditForm({ ...editForm, reviewCount: Number(e.target.value) })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1.5 font-semibold text-foreground">Google Business Profile URL</label>
                    <Input
                      value={editForm.googleProfileUrl}
                      onChange={(e) => setEditForm({ ...editForm, googleProfileUrl: e.target.value })}
                      placeholder="https://google.com/maps/place/..."
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Website Quality</label>
                    <select
                      value={editForm.websiteQuality}
                      onChange={(e) => setEditForm({ ...editForm, websiteQuality: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="EXCELLENT" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Excellent (Modern, Fast, High Converting)</option>
                      <option value="GOOD" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Good (Decent Design)</option>
                      <option value="FAIR" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Fair (Outdated, Needs Refresh)</option>
                      <option value="POOR" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Poor (Broken Layouts, Slow)</option>
                      <option value="MISSING" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Missing / No Website</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Mobile Responsiveness / UX</label>
                    <select
                      value={editForm.mobileUx}
                      onChange={(e) => setEditForm({ ...editForm, mobileUx: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="EXCELLENT" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Excellent Mobile UX</option>
                      <option value="AVERAGE" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Average Mobile UX</option>
                      <option value="POOR" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Poor / Hard to Read on Mobile</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Call-to-Action (CTA) Quality</label>
                    <select
                      value={editForm.ctaQuality}
                      onChange={(e) => setEditForm({ ...editForm, ctaQuality: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="STRONG" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Strong (Clear Phone / Form)</option>
                      <option value="AVERAGE" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Average</option>
                      <option value="POOR" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Poor / Hidden CTA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Instant Booking / Quote Flow</label>
                    <select
                      value={editForm.quoteBookingFlow}
                      onChange={(e) => setEditForm({ ...editForm, quoteBookingFlow: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="EXISTS" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Automated Calendar / Instant Flow</option>
                      <option value="BASIC" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Basic Contact Form Only</option>
                      <option value="MISSING" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Missing (Opportunity for Tool)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Trust Signals</label>
                    <select
                      value={editForm.trustSignals}
                      onChange={(e) => setEditForm({ ...editForm, trustSignals: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="STRONG" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Strong (Badges, Reviews, Licensure)</option>
                      <option value="AVERAGE" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Average</option>
                      <option value="WEAK" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Weak / Outdated</option>
                      <option value="MISSING" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Missing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">SEO Visibility</label>
                    <select
                      value={editForm.seoVisibility}
                      onChange={(e) => setEditForm({ ...editForm, seoVisibility: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="STRONG" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Strong (Page 1 Rankings)</option>
                      <option value="AVERAGE" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Average</option>
                      <option value="WEAK" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Weak (Page 2+)</option>
                      <option value="MISSING" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Missing / Unindexed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">PageSpeed Score (0-100)</label>
                    <Input
                      type="number"
                      value={editForm.speedScore}
                      onChange={(e) => setEditForm({ ...editForm, speedScore: Number(e.target.value) })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Facebook Page URL</label>
                    <Input
                      value={editForm.facebookUrl}
                      onChange={(e) => setEditForm({ ...editForm, facebookUrl: e.target.value })}
                      placeholder="https://facebook.com/..."
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Instagram URL</label>
                    <Input
                      value={editForm.instagramUrl}
                      onChange={(e) => setEditForm({ ...editForm, instagramUrl: e.target.value })}
                      placeholder="https://instagram.com/..."
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1.5 font-semibold text-foreground">LinkedIn Company URL</label>
                    <Input
                      value={editForm.linkedInUrl}
                      onChange={(e) => setEditForm({ ...editForm, linkedInUrl: e.target.value })}
                      placeholder="https://linkedin.com/company/..."
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* TAB 3: Commercial Qualification & ICP */}
              <TabsContent value="commercial" className="space-y-4 pt-1 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">ICP Commercial Fit</label>
                    <select
                      value={editForm.icpFit}
                      onChange={(e) => setEditForm({ ...editForm, icpFit: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="HIGH" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">High Fit (Prime Target)</option>
                      <option value="MEDIUM" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Medium Fit</option>
                      <option value="LOW" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Low Fit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Estimated Ability to Pay</label>
                    <select
                      value={editForm.abilityToPay}
                      onChange={(e) => setEditForm({ ...editForm, abilityToPay: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="HIGH" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">High ($1M+ Gross Revenue)</option>
                      <option value="MEDIUM" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Medium ($300k - $1M)</option>
                      <option value="LOW" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Low (&lt; $300k)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Sales Urgency</label>
                    <select
                      value={editForm.urgency}
                      onChange={(e) => setEditForm({ ...editForm, urgency: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="HIGH" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">High Urgency</option>
                      <option value="MEDIUM" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Medium Urgency</option>
                      <option value="LOW" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Low Urgency</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Recurring Revenue Potential</label>
                    <select
                      value={editForm.recurringPotential}
                      onChange={(e) => setEditForm({ ...editForm, recurringPotential: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="HIGH" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">High (Monthly Retainer / SaaS)</option>
                      <option value="MEDIUM" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Medium</option>
                      <option value="LOW" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Low (One-off Only)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Target Deal Value ($)</label>
                    <Input
                      value={editForm.dealValue}
                      onChange={(e) => setEditForm({ ...editForm, dealValue: e.target.value })}
                      placeholder="e.g. 15000"
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Lead Acquisition Source</label>
                    <Input
                      value={editForm.leadSource}
                      onChange={(e) => setEditForm({ ...editForm, leadSource: e.target.value })}
                      placeholder="e.g. Google Maps, Directory, Referral"
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1.5 font-semibold text-foreground">Main Commercial Opportunity</label>
                    <Input
                      value={editForm.mainOpportunity}
                      onChange={(e) => setEditForm({ ...editForm, mainOpportunity: e.target.value })}
                      placeholder="e.g. Website redesign + Google Maps ranking + lead booking widget"
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1.5 font-semibold text-foreground">Buying Signals</label>
                    <Input
                      value={editForm.buyingSignals}
                      onChange={(e) => setEditForm({ ...editForm, buyingSignals: e.target.value })}
                      placeholder="e.g. Rebranding, hiring sales reps, expanding locations"
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* TAB 4: Pipeline, Ownership & Notes */}
              <TabsContent value="workflow" className="space-y-4 pt-1 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Pipeline Stage</label>
                    <select
                      value={editForm.stageId}
                      onChange={(e) => setEditForm({ ...editForm, stageId: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      {stages.map((s) => (
                        <option key={s.id} value={s.id} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Assigned Team Member</label>
                    <select
                      value={editForm.assignedToId}
                      onChange={(e) => setEditForm({ ...editForm, assignedToId: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      {workspaceUsers.map((u) => (
                        <option key={u.id} value={u.id} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Outreach Workflow Status</label>
                    <select
                      value={editForm.outreachStatus}
                      onChange={(e) => setEditForm({ ...editForm, outreachStatus: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="READY" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Ready for Outreach</option>
                      <option value="NOT_CONTACTED" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Not Contacted</option>
                      <option value="IN_PROGRESS" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">In Progress</option>
                      <option value="CONTACTED" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Contacted (First Touch)</option>
                      <option value="FOLLOW_UP_SCHEDULED" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Follow-up Scheduled</option>
                      <option value="REPLIED" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Replied / In Conversation</option>
                      <option value="MEETING_BOOKED" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Meeting Booked</option>
                      <option value="UNRESPONSIVE" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Unresponsive</option>
                      <option value="BOUNCED" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Bounced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Lead Response Sentiment</label>
                    <select
                      value={editForm.responseStatus}
                      onChange={(e) => setEditForm({ ...editForm, responseStatus: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">None / Pending</option>
                      <option value="POSITIVE" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Positive (Eager to Talk)</option>
                      <option value="INTERESTED" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Interested (Wants Info)</option>
                      <option value="NEUTRAL" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Neutral</option>
                      <option value="NOT_NOW" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Not Right Now (Follow Up Later)</option>
                      <option value="NOT_INTERESTED" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Not Interested</option>
                      <option value="DO_NOT_CONTACT" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Do Not Contact</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1.5 font-semibold text-foreground">General Account Notes</label>
                    <Textarea
                      rows={2}
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      placeholder="General notes about the company or relationship..."
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1.5 font-semibold text-foreground">Research & Intelligence Notes</label>
                    <Textarea
                      rows={3}
                      value={editForm.researchNotes}
                      onChange={(e) => setEditForm({ ...editForm, researchNotes: e.target.value })}
                      placeholder="Key audit findings, pain points, or talking points discovered..."
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/60">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={isSubmitting} className="rounded-xl font-semibold gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>{isSubmitting ? "Saving..." : "Save All Changes"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Contact Modal */}
      <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Contact Person</DialogTitle>
            <DialogDescription>Record key stakeholder or decision maker at {prospect.name}.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 font-medium text-foreground">First Name *</label>
                <Input
                  required
                  placeholder="John"
                  value={contactForm.firstName}
                  onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium text-foreground">Last Name</label>
                <Input
                  placeholder="Doe"
                  value={contactForm.lastName}
                  onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 font-medium text-foreground">Job Title / Role</label>
              <Input
                placeholder="e.g. Managing Partner / CEO"
                value={contactForm.jobTitle}
                onChange={(e) => setContactForm({ ...contactForm, jobTitle: e.target.value })}
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-foreground">Email</label>
              <Input
                type="email"
                placeholder="john@company.com"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-foreground">Direct Phone</label>
              <Input
                placeholder="+1 (555) 000-0000"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-foreground">LinkedIn Profile URL</label>
              <Input
                placeholder="https://linkedin.com/in/..."
                value={contactForm.linkedInUrl}
                onChange={(e) => setContactForm({ ...contactForm, linkedInUrl: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="dm"
                checked={contactForm.isDecisionMaker}
                onChange={(e) => setContactForm({ ...contactForm, isDecisionMaker: e.target.checked })}
                className="rounded border-border cursor-pointer"
              />
              <label htmlFor="dm" className="cursor-pointer font-medium text-foreground">
                Flag as Primary Decision Maker
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddContactOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={isSubmitting}>
                Save Contact
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>



      {/* New Task Modal */}
      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>Add a follow-up action for {prospect.name}.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTaskSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block mb-1 font-semibold text-slate-800 dark:text-slate-200">Task Title *</label>
              <Input
                required
                placeholder="e.g. Follow up on proposal via phone"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold text-slate-800 dark:text-slate-200">Priority</label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                className="w-full h-9 px-3 rounded-lg bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-border text-xs text-slate-900 dark:text-foreground shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium text-foreground">Due Date</label>
              <Input
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddTaskOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={isSubmitting}>
                Create Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AI Prompt Summary & Intelligence Dossier Modal */}
      <ProspectAiDossierModal
        isOpen={isDossierModalOpen}
        onClose={() => setIsDossierModalOpen(false)}
        prospect={prospect}
        contactsList={contactsList}
        activitiesList={activitiesList}
        tasksList={tasksList}
        customFieldsList={customFieldsList}
        customFieldValuesMap={customValues}
        stageName={stages.find((s) => s.id === prospect.stageId)?.name}
      />
    </div>
  );
}
