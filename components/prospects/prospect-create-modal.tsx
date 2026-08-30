"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Sparkles,
  Building2,
  Globe,
  MapPin,
  Phone,
  Mail,
  User,
  DollarSign,
  TrendingUp,
  FileText,
  ChevronRight,
  Shield,
  Star,
  CheckCircle2,
  Zap,
  Layers,
  AlertTriangle,
  Plus,
  X,
  Check,
  RotateCcw,
  Share2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { createProspectAction } from "@/lib/actions/prospects";

/**
 * Format string with proper Title Casing while preserving standard business acronyms
 */
export function toProperTitleCase(str: string): string {
  if (!str) return "";
  const specialAcronyms: Record<string, string> = {
    HVAC: "HVAC",
    SAAS: "B2B SaaS",
    "B2B SAAS": "B2B SaaS",
    B2B: "B2B",
    SEO: "SEO",
    USA: "USA",
    UK: "UK",
    UAE: "UAE",
    CRM: "CRM",
    LLC: "LLC",
    INC: "Inc.",
    CORP: "Corp.",
  };

  return str
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (word.length === 0) return "";
      const upper = word.toUpperCase();
      if (specialAcronyms[upper]) {
        return specialAcronyms[upper];
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

const DEFAULT_NICHES = [
  "Roofing & Construction",
  "HVAC & Climate Control",
  "Plumbing & Water Systems",
  "Electrical & Solar",
  "General Contractors & Remodeling",
  "Pest Control & Exterminators",
  "Landscaping & Tree Services",
  "Auto Repair & Detailing",
  "Professional Services (Legal, Accounting)",
  "Healthcare & Dental",
  "Real Estate & Property Management",
  "Hospitality & Restaurants",
  "Ecommerce & Retail",
  "B2B SaaS / Tech",
];

const DEFAULT_COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "United Arab Emirates",
  "India",
  "Singapore",
  "Netherlands",
  "Switzerland",
  "International",
];

const DRAFT_STORAGE_KEY = "revlo_prospect_create_draft";

export function ProspectCreateModal({
  open,
  onOpenChange,
  stages,
  workspaceUsers,
  existingNiches = [],
  existingCountries = [],
  customFields = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stages: { id: string; name: string; color?: string }[];
  workspaceUsers: { id: string; name: string }[];
  existingNiches?: string[];
  existingCountries?: string[];
  customFields?: any[];
}) {
  const [creationMode, setCreationMode] = useState<"quick" | "full">("quick");
  const [activeTab, setActiveTab] = useState("business");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);

  // Dynamic Custom Options stored locally
  const [customNiches, setCustomNiches] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("prospect_custom_niches") || "[]");
    } catch {
      return [];
    }
  });

  const [customCountries, setCustomCountries] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("prospect_custom_countries") || "[]");
    } catch {
      return [];
    }
  });

  const nicheOptions = useMemo(() => {
    return Array.from(new Set([...customNiches, ...(existingNiches || []), ...DEFAULT_NICHES]));
  }, [customNiches, existingNiches]);

  const countryOptions = useMemo(() => {
    return Array.from(new Set([...customCountries, ...(existingCountries || []), ...DEFAULT_COUNTRIES]));
  }, [customCountries, existingCountries]);

  // Inline Custom Add State
  const [isAddingNiche, setIsAddingNiche] = useState(false);
  const [newNicheInput, setNewNicheInput] = useState("");
  const [isAddingCountry, setIsAddingCountry] = useState(false);
  const [newCountryInput, setNewCountryInput] = useState("");

  const initialFormData = useMemo(() => ({
    // 1. Business Identity
    name: "",
    legalName: "",
    category: "",
    niche: "Roofing & Construction",
    website: "",
    googleMapsUrl: "",
    country: "United States",
    state: "Texas",
    city: "Austin",
    address: "",
    postalCode: "",
    phone: "",
    email: "",
    businessStatus: "OPERATIONAL",

    // 2. Google / Digital Presence Audit
    googleRating: "4.8",
    reviewCount: 45,
    googleProfileUrl: "",
    websiteExists: true,
    websiteQuality: "FAIR",
    mobileUx: "POOR",
    ctaQuality: "POOR",
    quoteBookingFlow: "MISSING",
    quoteBookingNotes: "",
    trustSignals: "AVERAGE",
    trustSignalNotes: "",
    seoVisibility: "WEAK",
    seoNotes: "",
    speedScore: 65,
    facebookUrl: "",
    instagramUrl: "",
    linkedInUrl: "",

    // 3. Primary Decision Maker
    contactFirstName: "",
    contactLastName: "",
    contactTitle: "Founder & Managing Partner",
    contactEmail: "",
    contactPhone: "",
    contactLinkedIn: "",
    contactInstagram: "",
    contactFacebook: "",
    contactPreferredChannel: "EMAIL",
    contactIsDecisionMaker: true,

    // 4. Qualification & Commercial ICP
    icpFit: "HIGH",
    abilityToPay: "HIGH",
    urgency: "HIGH",
    recurringPotential: "MEDIUM",
    buyingSignals: "New Location / Rebrand",
    buyingSignalNotes: "",
    mainOpportunity: "Website Redesign + Lead Automation",
    opportunityNotes: "",
    leadSource: "Google Maps",
    dealValue: "15000",

    // 5. Workflow & Ownership
    stageId: stages[0]?.id || "stage_researching",
    outreachStatus: "READY",
    assignedToId: workspaceUsers[0]?.id || "",
    notes: "",
    researchNotes: "",
  }), [stages, workspaceUsers]);

  // Complete Spec Form State
  const [formData, setFormData] = useState(initialFormData);

  // Restore draft on modal open
  useEffect(() => {
    if (open && typeof window !== "undefined") {
      try {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed.formData && parsed.formData.name) {
            setFormData(parsed.formData);
            if (parsed.creationMode) setCreationMode(parsed.creationMode);
            if (parsed.activeTab) setActiveTab(parsed.activeTab);
            setDraftRestored(true);
          }
        }
      } catch (e) {
        console.error("Failed to load prospect draft", e);
      }
    }
  }, [open]);

  // Auto-save form draft to localStorage on change
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (formData.name && formData.name.trim().length > 0) {
      try {
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({
            formData,
            creationMode,
            activeTab,
            timestamp: Date.now(),
          })
        );
      } catch (e) {
        console.error("Failed to save prospect draft", e);
      }
    }
  }, [formData, creationMode, activeTab]);

  // Clear draft action
  const handleClearDraft = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {}
    }
    setFormData(initialFormData);
    setDraftRestored(false);
    setError(null);
  };

  // Handle adding new custom niche with Title Casing
  const handleAddNewNiche = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const formatted = toProperTitleCase(newNicheInput);
    if (!formatted) return;

    setCustomNiches((prev) => {
      const next = Array.from(new Set([formatted, ...prev]));
      try {
        localStorage.setItem("prospect_custom_niches", JSON.stringify(next));
      } catch {}
      return next;
    });

    setFormData((prev) => ({ ...prev, niche: formatted, category: formatted }));
    setNewNicheInput("");
    setIsAddingNiche(false);
  };

  // Handle adding new custom country with Title Casing
  const handleAddNewCountry = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const formatted = toProperTitleCase(newCountryInput);
    if (!formatted) return;

    setCustomCountries((prev) => {
      const next = Array.from(new Set([formatted, ...prev]));
      try {
        localStorage.setItem("prospect_custom_countries", JSON.stringify(next));
      } catch {}
      return next;
    });

    setFormData((prev) => ({ ...prev, country: formatted }));
    setNewCountryInput("");
    setIsAddingCountry(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Company Name is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createProspectAction({
        name: formData.name.trim(),
        legalName: formData.legalName.trim() || undefined,
        category: formData.category.trim() || formData.niche || undefined,
        niche: formData.niche || "General Business",
        website: formData.website.trim() || undefined,
        googleMapsUrl: formData.googleMapsUrl.trim() || undefined,
        country: formData.country || "United States",
        state: formData.state.trim() || undefined,
        city: formData.city.trim() || undefined,
        address: formData.address.trim() || undefined,
        postalCode: formData.postalCode.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        businessStatus: formData.businessStatus || "OPERATIONAL",

        googleRating: formData.googleRating ? formData.googleRating : undefined,
        reviewCount: Number(formData.reviewCount) || 0,
        googleProfileUrl: formData.googleProfileUrl.trim() || undefined,
        websiteQuality: formData.websiteQuality || undefined,
        mobileUx: formData.mobileUx || undefined,
        ctaQuality: formData.ctaQuality || undefined,
        quoteBookingFlow: formData.quoteBookingFlow || undefined,
        trustSignals: formData.trustSignals || undefined,
        seoVisibility: formData.seoVisibility || undefined,
        speedScore: Number(formData.speedScore) || undefined,
        facebookUrl: formData.facebookUrl.trim() || undefined,
        instagramUrl: formData.instagramUrl.trim() || undefined,
        linkedInUrl: formData.linkedInUrl.trim() || undefined,

        contactFirstName: formData.contactFirstName.trim() || undefined,
        contactLastName: formData.contactLastName.trim() || undefined,
        contactTitle: formData.contactTitle.trim() || undefined,
        contactEmail: formData.contactEmail.trim() || undefined,
        contactPhone: formData.contactPhone.trim() || undefined,
        contactLinkedIn: formData.contactLinkedIn.trim() || undefined,
        contactInstagram: formData.contactInstagram.trim() || undefined,
        contactFacebook: formData.contactFacebook.trim() || undefined,
        contactPreferredChannel: formData.contactPreferredChannel || undefined,
        contactIsDecisionMaker: formData.contactIsDecisionMaker,

        icpFit: formData.icpFit || undefined,
        abilityToPay: formData.abilityToPay || undefined,
        urgency: formData.urgency || undefined,
        recurringPotential: formData.recurringPotential || undefined,
        buyingSignals: formData.buyingSignals || undefined,
        mainOpportunity: formData.mainOpportunity.trim() || undefined,
        leadSource: formData.leadSource || undefined,
        dealValue: formData.dealValue ? formData.dealValue : undefined,

        stageId: formData.stageId || undefined,
        outreachStatus: formData.outreachStatus || undefined,
        assignedToId: formData.assignedToId || undefined,
        notes: formData.notes.trim() || undefined,
        researchNotes: formData.researchNotes.trim() || undefined,
      });

      // Clear draft on successful creation
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch {}
      }

      onOpenChange(false);
      setFormData(initialFormData);
      setDraftRestored(false);
      setActiveTab("business");
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to create prospect");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectClassName =
    "w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors cursor-pointer";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#121218] text-foreground dark:text-zinc-100 border border-slate-200/90 dark:border-zinc-800 shadow-2xl">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground dark:text-zinc-100">
                  {creationMode === "quick" ? "Quick Add Prospect" : "Full Prospect Qualification"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {creationMode === "quick"
                    ? "Add a company in seconds with social profiles & decision maker."
                    : "Comprehensive 5-step digital audit, ICP commercial fit, and decision maker."}
                </DialogDescription>
              </div>
            </div>

            {/* Mode Switcher Toggle */}
            <div className="flex items-center p-1 rounded-2xl bg-muted/60 dark:bg-zinc-950/80 border border-border/80 shrink-0 self-start sm:self-auto shadow-2xs">
              <button
                type="button"
                onClick={() => setCreationMode("quick")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  creationMode === "quick"
                    ? "bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100 shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span>Quick Add</span>
              </button>
              <button
                type="button"
                onClick={() => setCreationMode("full")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  creationMode === "full"
                    ? "bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100 shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-indigo-500" />
                <span>Full Audit (5-Step)</span>
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Draft Auto-Restore Notification */}
        {draftRestored && (
          <div className="p-2.5 px-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-medium flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-indigo-500" />
              <span>Draft auto-restored from your previous session.</span>
            </div>
            <button
              type="button"
              onClick={handleClearDraft}
              className="text-[11px] font-semibold text-destructive hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" /> Clear Draft
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* ========================================================= */}
          {/* QUICK ADD MODE (Fast workflow with dynamic custom fields) */}
          {/* ========================================================= */}
          {creationMode === "quick" ? (
            <div className="space-y-4 pt-1">
              {/* Section 1: Business Identity & Location */}
              <div className="p-3.5 rounded-2xl bg-muted/30 dark:bg-zinc-900/40 border border-border/60 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  <span>1. Company Identity & Location</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block mb-1 font-semibold text-foreground">
                      Company Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      required
                      placeholder="e.g. Apex Roofing & Solar Austin"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="font-medium bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  {/* Dynamic Industry / Niche */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-foreground">
                        Industry / Niche <span className="text-destructive">*</span>
                      </label>
                      {!isAddingNiche && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingNiche(true);
                            setNewNicheInput("");
                          }}
                          className="text-[11px] text-primary hover:underline flex items-center gap-0.5 font-medium cursor-pointer"
                        >
                          <Plus className="h-3 w-3" /> Add New
                        </button>
                      )}
                    </div>

                    {isAddingNiche ? (
                      <div className="space-y-1.5 p-2 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 animate-in fade-in">
                        <div className="flex items-center gap-1.5">
                          <Input
                            autoFocus
                            placeholder="Type industry..."
                            value={newNicheInput}
                            onChange={(e) => setNewNicheInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddNewNiche();
                              }
                            }}
                            className="h-8 text-xs bg-background rounded-lg"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="gradient"
                            onClick={() => handleAddNewNiche()}
                            className="h-8 px-2.5 text-xs font-semibold rounded-lg shrink-0"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsAddingNiche(false)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg shrink-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <select
                        value={formData.niche}
                        onChange={(e) => {
                          if (e.target.value === "__ADD_NEW__") {
                            setIsAddingNiche(true);
                            setNewNicheInput("");
                          } else {
                            setFormData({ ...formData, niche: e.target.value, category: e.target.value });
                          }
                        }}
                        className={selectClassName}
                      >
                        {nicheOptions.map((n) => (
                          <option key={n} value={n} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                            {n}
                          </option>
                        ))}
                        <option value="__ADD_NEW__" className="bg-card dark:bg-zinc-900 text-primary font-semibold">
                          ➕ + Add Custom Industry / Niche...
                        </option>
                      </select>
                    )}
                  </div>

                  {/* Dynamic Country */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-foreground">
                        Country <span className="text-destructive">*</span>
                      </label>
                      {!isAddingCountry && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingCountry(true);
                            setNewCountryInput("");
                          }}
                          className="text-[11px] text-primary hover:underline flex items-center gap-0.5 font-medium cursor-pointer"
                        >
                          <Plus className="h-3 w-3" /> Add New
                        </button>
                      )}
                    </div>

                    {isAddingCountry ? (
                      <div className="space-y-1.5 p-2 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 animate-in fade-in">
                        <div className="flex items-center gap-1.5">
                          <Input
                            autoFocus
                            placeholder="Type country name..."
                            value={newCountryInput}
                            onChange={(e) => setNewCountryInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddNewCountry();
                              }
                            }}
                            className="h-8 text-xs bg-background rounded-lg"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="gradient"
                            onClick={() => handleAddNewCountry()}
                            className="h-8 px-2.5 text-xs font-semibold rounded-lg shrink-0"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsAddingCountry(false)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg shrink-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <select
                        value={formData.country}
                        onChange={(e) => {
                          if (e.target.value === "__ADD_NEW__") {
                            setIsAddingCountry(true);
                            setNewCountryInput("");
                          } else {
                            setFormData({ ...formData, country: e.target.value });
                          }
                        }}
                        className={selectClassName}
                      >
                        {countryOptions.map((c) => (
                          <option key={c} value={c} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                            {c}
                          </option>
                        ))}
                        <option value="__ADD_NEW__" className="bg-card dark:bg-zinc-900 text-primary font-semibold">
                          ➕ + Add Custom Country...
                        </option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold text-foreground">City</label>
                    <Input
                      placeholder="e.g. Austin"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold text-foreground">State / Region</label>
                    <Input
                      placeholder="e.g. Texas"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Company Web & Social Footprint */}
              <div className="p-3.5 rounded-2xl bg-muted/30 dark:bg-zinc-900/40 border border-border/60 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Globe className="h-3.5 w-3.5 text-sky-500" />
                  <span>2. Company Web & Social Footprint</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block mb-1 font-semibold text-foreground">Website URL</label>
                    <Input
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold text-foreground">Company Email</label>
                    <Input
                      type="email"
                      placeholder="info@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold text-foreground">Business Phone</label>
                    <Input
                      placeholder="+1 (512) 555-0199"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold text-foreground">Google Maps URL</label>
                    <Input
                      placeholder="https://maps.google.com/..."
                      value={formData.googleMapsUrl}
                      onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold text-foreground">Company Instagram URL</label>
                    <Input
                      placeholder="https://instagram.com/company"
                      value={formData.instagramUrl}
                      onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold text-foreground">Company Facebook URL</label>
                    <Input
                      placeholder="https://facebook.com/company"
                      value={formData.facebookUrl}
                      onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1 font-semibold text-foreground">Company LinkedIn URL</label>
                    <Input
                      placeholder="https://linkedin.com/company/..."
                      value={formData.linkedInUrl}
                      onChange={(e) => setFormData({ ...formData, linkedInUrl: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Founder & Key Stakeholder */}
              <div className="p-3.5 rounded-2xl bg-muted/30 dark:bg-zinc-900/40 border border-border/60 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <User className="h-3.5 w-3.5 text-indigo-500" />
                  <span>3. Founder / Key Decision Maker</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block mb-1 font-semibold text-foreground">First Name</label>
                    <Input
                      placeholder="e.g. John"
                      value={formData.contactFirstName}
                      onChange={(e) => setFormData({ ...formData, contactFirstName: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold text-foreground">Last Name</label>
                    <Input
                      placeholder="e.g. Doe"
                      value={formData.contactLastName}
                      onChange={(e) => setFormData({ ...formData, contactLastName: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold text-foreground">Job Title / Role</label>
                    <Input
                      placeholder="e.g. Founder & Managing Partner"
                      value={formData.contactTitle}
                      onChange={(e) => setFormData({ ...formData, contactTitle: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold text-foreground">Direct Email</label>
                    <Input
                      type="email"
                      placeholder="founder@company.com"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold text-foreground">Founder LinkedIn URL</label>
                    <Input
                      placeholder="https://linkedin.com/in/founder"
                      value={formData.contactLinkedIn}
                      onChange={(e) => setFormData({ ...formData, contactLinkedIn: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold text-foreground">Founder Instagram URL</label>
                    <Input
                      placeholder="https://instagram.com/founder"
                      value={formData.contactInstagram}
                      onChange={(e) => setFormData({ ...formData, contactInstagram: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold text-foreground">Founder Facebook URL</label>
                    <Input
                      placeholder="https://facebook.com/founder"
                      value={formData.contactFacebook}
                      onChange={(e) => setFormData({ ...formData, contactFacebook: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold text-foreground">Preferred Outreach Channel</label>
                    <select
                      value={formData.contactPreferredChannel}
                      onChange={(e) => setFormData({ ...formData, contactPreferredChannel: e.target.value })}
                      className={selectClassName}
                    >
                      <option value="EMAIL" className="bg-card dark:bg-zinc-900">Email</option>
                      <option value="PHONE" className="bg-card dark:bg-zinc-900">Phone</option>
                      <option value="LINKEDIN" className="bg-card dark:bg-zinc-900">LinkedIn</option>
                      <option value="WHATSAPP" className="bg-card dark:bg-zinc-900">WhatsApp</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 4: Pipeline & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block mb-1 font-semibold text-foreground">Initial Stage</label>
                  <select
                    value={formData.stageId}
                    onChange={(e) => setFormData({ ...formData, stageId: e.target.value })}
                    className={selectClassName}
                  >
                    {stages.map((s) => (
                      <option key={s.id} value={s.id} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-semibold text-foreground">Estimated Deal Size ($)</label>
                  <Input
                    type="number"
                    placeholder="15000"
                    value={formData.dealValue}
                    onChange={(e) => setFormData({ ...formData, dealValue: e.target.value })}
                    className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-semibold text-foreground">Assign To Rep</label>
                  <select
                    value={formData.assignedToId}
                    onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                    className={selectClassName}
                  >
                    {workspaceUsers.map((u) => (
                      <option key={u.id} value={u.id} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* FULL 5-STEP AUDIT QUALIFICATION WORKFLOW                  */
            /* ========================================================= */
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 pt-1">
              <div className="overflow-x-auto pb-1 scrollbar-none">
                <TabsList className="flex w-max min-w-full sm:grid sm:grid-cols-5 text-xs bg-muted/60 dark:bg-zinc-950/80 p-1 rounded-2xl border border-border/80">
                  <TabsTrigger value="business" className="text-xs whitespace-nowrap rounded-xl font-semibold">
                    1. Identity & Web
                  </TabsTrigger>
                  <TabsTrigger value="digital" className="text-xs whitespace-nowrap rounded-xl font-semibold">
                    2. Digital Audit
                  </TabsTrigger>
                  <TabsTrigger value="qualification" className="text-xs whitespace-nowrap rounded-xl font-semibold">
                    3. Commercial
                  </TabsTrigger>
                  <TabsTrigger value="contact" className="text-xs whitespace-nowrap rounded-xl font-semibold">
                    4. Founder & Team
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="text-xs whitespace-nowrap rounded-xl font-semibold">
                    5. Workflow
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* TAB 1: Business Identity & Social Links */}
              <TabsContent value="business" className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block mb-1.5 font-semibold text-foreground">
                      Company Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      required
                      placeholder="e.g. Northstar Roofing & Solar Demo"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Legal / Entity Name</label>
                    <Input
                      placeholder="e.g. Northstar Construction Group LLC"
                      value={formData.legalName}
                      onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  {/* Industry with dynamic add */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-semibold text-foreground">Industry / Niche</label>
                      {!isAddingNiche && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingNiche(true);
                            setNewNicheInput("");
                          }}
                          className="text-[11px] text-primary hover:underline flex items-center gap-0.5 font-medium cursor-pointer"
                        >
                          <Plus className="h-3 w-3" /> Add New
                        </button>
                      )}
                    </div>

                    {isAddingNiche ? (
                      <div className="space-y-1.5 p-2 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 animate-in fade-in">
                        <div className="flex items-center gap-1.5">
                          <Input
                            autoFocus
                            placeholder="Type industry..."
                            value={newNicheInput}
                            onChange={(e) => setNewNicheInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddNewNiche();
                              }
                            }}
                            className="h-8 text-xs bg-background rounded-lg"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="gradient"
                            onClick={() => handleAddNewNiche()}
                            className="h-8 px-2.5 text-xs font-semibold rounded-lg shrink-0"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsAddingNiche(false)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg shrink-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <select
                        value={formData.niche}
                        onChange={(e) => {
                          if (e.target.value === "__ADD_NEW__") {
                            setIsAddingNiche(true);
                            setNewNicheInput("");
                          } else {
                            setFormData({ ...formData, niche: e.target.value, category: e.target.value });
                          }
                        }}
                        className={selectClassName}
                      >
                        {nicheOptions.map((n) => (
                          <option key={n} value={n} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                            {n}
                          </option>
                        ))}
                        <option value="__ADD_NEW__" className="bg-card dark:bg-zinc-900 text-primary font-semibold">
                          ➕ + Add Custom Industry / Niche...
                        </option>
                      </select>
                    )}
                  </div>

                  {/* Country with dynamic add */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-semibold text-foreground">Country</label>
                      {!isAddingCountry && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingCountry(true);
                            setNewCountryInput("");
                          }}
                          className="text-[11px] text-primary hover:underline flex items-center gap-0.5 font-medium cursor-pointer"
                        >
                          <Plus className="h-3 w-3" /> Add New
                        </button>
                      )}
                    </div>

                    {isAddingCountry ? (
                      <div className="space-y-1.5 p-2 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 animate-in fade-in">
                        <div className="flex items-center gap-1.5">
                          <Input
                            autoFocus
                            placeholder="Type country name..."
                            value={newCountryInput}
                            onChange={(e) => setNewCountryInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddNewCountry();
                              }
                            }}
                            className="h-8 text-xs bg-background rounded-lg"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="gradient"
                            onClick={() => handleAddNewCountry()}
                            className="h-8 px-2.5 text-xs font-semibold rounded-lg shrink-0"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsAddingCountry(false)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg shrink-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <select
                        value={formData.country}
                        onChange={(e) => {
                          if (e.target.value === "__ADD_NEW__") {
                            setIsAddingCountry(true);
                            setNewCountryInput("");
                          } else {
                            setFormData({ ...formData, country: e.target.value });
                          }
                        }}
                        className={selectClassName}
                      >
                        {countryOptions.map((c) => (
                          <option key={c} value={c} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                            {c}
                          </option>
                        ))}
                        <option value="__ADD_NEW__" className="bg-card dark:bg-zinc-900 text-primary font-semibold">
                          ➕ + Add Custom Country...
                        </option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">City</label>
                    <Input
                      placeholder="e.g. Austin"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">State / Region</label>
                    <Input
                      placeholder="e.g. Texas"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Website URL</label>
                    <Input
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Company Email</label>
                    <Input
                      type="email"
                      placeholder="info@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Business Phone</label>
                    <Input
                      placeholder="+1 (512) 555-0199"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Google Maps URL</label>
                    <Input
                      placeholder="https://maps.google.com/..."
                      value={formData.googleMapsUrl}
                      onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Company Instagram URL</label>
                    <Input
                      placeholder="https://instagram.com/company"
                      value={formData.instagramUrl}
                      onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Company Facebook URL</label>
                    <Input
                      placeholder="https://facebook.com/company"
                      value={formData.facebookUrl}
                      onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1.5 font-semibold text-foreground">Company LinkedIn URL</label>
                    <Input
                      placeholder="https://linkedin.com/company/..."
                      value={formData.linkedInUrl}
                      onChange={(e) => setFormData({ ...formData, linkedInUrl: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* TAB 2: Digital Presence & Google Audit */}
              <TabsContent value="digital" className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Google Star Rating</label>
                    <Input
                      placeholder="e.g. 4.8"
                      value={formData.googleRating}
                      onChange={(e) => setFormData({ ...formData, googleRating: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Review Count</label>
                    <Input
                      type="number"
                      placeholder="45"
                      value={formData.reviewCount}
                      onChange={(e) => setFormData({ ...formData, reviewCount: Number(e.target.value) })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Google Business Profile URL</label>
                    <Input
                      placeholder="https://business.google.com/..."
                      value={formData.googleProfileUrl}
                      onChange={(e) => setFormData({ ...formData, googleProfileUrl: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Website Quality</label>
                    <select
                      value={formData.websiteQuality}
                      onChange={(e) => setFormData({ ...formData, websiteQuality: e.target.value })}
                      className={selectClassName}
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
                      value={formData.mobileUx}
                      onChange={(e) => setFormData({ ...formData, mobileUx: e.target.value })}
                      className={selectClassName}
                    >
                      <option value="EXCELLENT" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Excellent Mobile UX</option>
                      <option value="AVERAGE" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Average Mobile UX</option>
                      <option value="POOR" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Poor / Hard to Read on Mobile</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Call-to-Action Quality</label>
                    <select
                      value={formData.ctaQuality}
                      onChange={(e) => setFormData({ ...formData, ctaQuality: e.target.value })}
                      className={selectClassName}
                    >
                      <option value="STRONG" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Strong (Clear Phone / Form)</option>
                      <option value="AVERAGE" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Average</option>
                      <option value="POOR" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Poor / Hidden CTA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Instant Booking / Quote Flow</label>
                    <select
                      value={formData.quoteBookingFlow}
                      onChange={(e) => setFormData({ ...formData, quoteBookingFlow: e.target.value })}
                      className={selectClassName}
                    >
                      <option value="EXISTS" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Automated Calendar / Instant Flow</option>
                      <option value="BASIC" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Basic Contact Form Only</option>
                      <option value="MISSING" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Missing (Opportunity for SaaS Tool)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Speed Score (0-100)</label>
                    <Input
                      type="number"
                      placeholder="65"
                      value={formData.speedScore}
                      onChange={(e) => setFormData({ ...formData, speedScore: Number(e.target.value) })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* TAB 3: Commercial Qualification & ICP */}
              <TabsContent value="qualification" className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">ICP Commercial Fit</label>
                    <select
                      value={formData.icpFit}
                      onChange={(e) => setFormData({ ...formData, icpFit: e.target.value })}
                      className={selectClassName}
                    >
                      <option value="HIGH" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">High (Prime Target / High Ticket Services)</option>
                      <option value="MEDIUM" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Medium Fit</option>
                      <option value="LOW" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Low Fit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Estimated Deal Size ($)</label>
                    <Input
                      type="number"
                      placeholder="15000"
                      value={formData.dealValue}
                      onChange={(e) => setFormData({ ...formData, dealValue: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Urgency Level</label>
                    <select
                      value={formData.urgency}
                      onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                      className={selectClassName}
                    >
                      <option value="HIGH" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">High Urgency</option>
                      <option value="MEDIUM" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Medium Urgency</option>
                      <option value="LOW" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Low Urgency</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Estimated Ability to Pay</label>
                    <select
                      value={formData.abilityToPay}
                      onChange={(e) => setFormData({ ...formData, abilityToPay: e.target.value })}
                      className={selectClassName}
                    >
                      <option value="HIGH" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">High ($1M+ Gross Revenue)</option>
                      <option value="MEDIUM" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Medium ($300k - $1M)</option>
                      <option value="LOW" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Low (&lt; $300k)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1.5 font-semibold text-foreground">Main Identified Opportunity</label>
                    <Input
                      placeholder="e.g. Website revamp + automated lead scheduling + Google Maps SEO"
                      value={formData.mainOpportunity}
                      onChange={(e) => setFormData({ ...formData, mainOpportunity: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* TAB 4: Primary Decision Maker */}
              <TabsContent value="contact" className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">First Name</label>
                    <Input
                      placeholder="e.g. John"
                      value={formData.contactFirstName}
                      onChange={(e) => setFormData({ ...formData, contactFirstName: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Last Name</label>
                    <Input
                      placeholder="e.g. Northstar"
                      value={formData.contactLastName}
                      onChange={(e) => setFormData({ ...formData, contactLastName: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Job Title / Role</label>
                    <Input
                      placeholder="e.g. Founder & Managing Director"
                      value={formData.contactTitle}
                      onChange={(e) => setFormData({ ...formData, contactTitle: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Direct Email</label>
                    <Input
                      type="email"
                      placeholder="john@northstar.com"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Direct Mobile Phone</label>
                    <Input
                      placeholder="+1 (512) 888-0123"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Founder LinkedIn Profile URL</label>
                    <Input
                      placeholder="https://linkedin.com/in/john-northstar"
                      value={formData.contactLinkedIn}
                      onChange={(e) => setFormData({ ...formData, contactLinkedIn: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Founder Instagram URL</label>
                    <Input
                      placeholder="https://instagram.com/john-northstar"
                      value={formData.contactInstagram}
                      onChange={(e) => setFormData({ ...formData, contactInstagram: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Founder Facebook URL</label>
                    <Input
                      placeholder="https://facebook.com/john-northstar"
                      value={formData.contactFacebook}
                      onChange={(e) => setFormData({ ...formData, contactFacebook: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Preferred Outreach Channel</label>
                    <select
                      value={formData.contactPreferredChannel}
                      onChange={(e) => setFormData({ ...formData, contactPreferredChannel: e.target.value })}
                      className={selectClassName}
                    >
                      <option value="EMAIL" className="bg-card dark:bg-zinc-900">Email</option>
                      <option value="PHONE" className="bg-card dark:bg-zinc-900">Phone</option>
                      <option value="LINKEDIN" className="bg-card dark:bg-zinc-900">LinkedIn</option>
                      <option value="WHATSAPP" className="bg-card dark:bg-zinc-900">WhatsApp</option>
                    </select>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 5: Workflow, Notes & Research */}
              <TabsContent value="notes" className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Initial Pipeline Stage</label>
                    <select
                      value={formData.stageId}
                      onChange={(e) => setFormData({ ...formData, stageId: e.target.value })}
                      className={selectClassName}
                    >
                      {stages.map((s) => (
                        <option key={s.id} value={s.id} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-foreground">Assign To Researcher / Rep</label>
                    <select
                      value={formData.assignedToId}
                      onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                      className={selectClassName}
                    >
                      {workspaceUsers.map((u) => (
                        <option key={u.id} value={u.id} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1.5 font-semibold text-foreground">Internal Research & Outreach Notes</label>
                    <Textarea
                      rows={3}
                      placeholder="Add key insights found during qualification research, pain points, or talking points..."
                      value={formData.researchNotes}
                      onChange={(e) => setFormData({ ...formData, researchNotes: e.target.value })}
                      className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2 pt-3 border-t border-border/60">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="text-xs rounded-xl flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              {formData.name && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClearDraft}
                  className="text-xs text-muted-foreground hover:text-destructive rounded-xl"
                >
                  Clear Draft
                </Button>
              )}
            </div>

            <Button
              type="submit"
              variant="gradient"
              disabled={isSubmitting}
              className="text-xs font-semibold gap-1.5 shadow-md shadow-primary/20 rounded-xl w-full sm:w-auto"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? "Saving Prospect..." : "Save Prospect"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
