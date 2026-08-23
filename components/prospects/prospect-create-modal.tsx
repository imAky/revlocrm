"use client";

import { useState } from "react";
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
import { createProspectAction } from "@/lib/actions/prospects";

export function ProspectCreateModal({
  open,
  onOpenChange,
  stages,
  workspaceUsers,
  customFields = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stages: { id: string; name: string; color?: string }[];
  workspaceUsers: { id: string; name: string }[];
  customFields?: any[];
}) {
  const [creationMode, setCreationMode] = useState<"quick" | "full">("quick");
  const [activeTab, setActiveTab] = useState("business");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Complete Spec Form State
  const [formData, setFormData] = useState({
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
    contactRole: "Owner",
    contactEmail: "",
    contactPhone: "",
    contactLinkedIn: "",
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
  });

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
        category: formData.category.trim() || undefined,
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
        reviewCount: formData.reviewCount ? Number(formData.reviewCount) : 0,
        googleProfileUrl: formData.googleProfileUrl.trim() || undefined,
        websiteExists: formData.websiteExists,
        websiteQuality: formData.websiteQuality || undefined,
        mobileUx: formData.mobileUx || undefined,
        ctaQuality: formData.ctaQuality || undefined,
        quoteBookingFlow: formData.quoteBookingFlow || undefined,
        trustSignals: formData.trustSignals || undefined,
        seoVisibility: formData.seoVisibility || undefined,
        speedScore: formData.speedScore ? Number(formData.speedScore) : undefined,
        facebookUrl: formData.facebookUrl.trim() || undefined,
        instagramUrl: formData.instagramUrl.trim() || undefined,
        linkedInUrl: formData.linkedInUrl.trim() || undefined,

        icpFit: formData.icpFit || "HIGH",
        abilityToPay: formData.abilityToPay || "HIGH",
        urgency: formData.urgency || "HIGH",
        recurringPotential: formData.recurringPotential || "MEDIUM",
        buyingSignals: formData.buyingSignals || undefined,
        mainOpportunity: formData.mainOpportunity || undefined,
        leadSource: formData.leadSource || "Direct Research",
        dealValue: formData.dealValue ? formData.dealValue : "0",

        stageId: formData.stageId || stages[0]?.id,
        outreachStatus: formData.outreachStatus || "READY",
        assignedToId: formData.assignedToId || undefined,
        notes: formData.notes.trim() || undefined,
        researchNotes: formData.researchNotes.trim() || undefined,

        contactFirstName: formData.contactFirstName.trim() || undefined,
        contactLastName: formData.contactLastName.trim() || undefined,
        contactTitle: formData.contactTitle.trim() || undefined,
        contactEmail: formData.contactEmail.trim() || undefined,
        contactPhone: formData.contactPhone.trim() || undefined,
        contactLinkedIn: formData.contactLinkedIn.trim() || undefined,
        contactPreferredChannel: formData.contactPreferredChannel || "EMAIL",
        contactIsDecisionMaker: formData.contactIsDecisionMaker,
      });

      onOpenChange(false);
      // Reset form
      setFormData({
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
        contactFirstName: "",
        contactLastName: "",
        contactTitle: "Founder & Managing Partner",
        contactRole: "Owner",
        contactEmail: "",
        contactPhone: "",
        contactLinkedIn: "",
        contactPreferredChannel: "EMAIL",
        contactIsDecisionMaker: true,
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
        stageId: stages[0]?.id || "stage_researching",
        outreachStatus: "READY",
        assignedToId: workspaceUsers[0]?.id || "",
        notes: "",
        researchNotes: "",
      });
      setActiveTab("business");
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to create prospect");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl bg-card text-card-foreground border border-border shadow-2xl">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold">
                  {creationMode === "quick" ? "Quick Add Prospect" : "Full Prospect Qualification"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {creationMode === "quick"
                    ? "Add a company in 5 seconds with essential location & contact data."
                    : "Comprehensive 5-step digital audit, ICP commercial fit, and decision maker."}
                </DialogDescription>
              </div>
            </div>

            {/* Mode Switcher Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border/40 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setCreationMode("quick")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  creationMode === "quick"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Zap className="h-3 w-3 text-amber-500" />
                <span>Quick Add</span>
              </button>
              <button
                type="button"
                onClick={() => setCreationMode("full")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  creationMode === "full"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="h-3 w-3 text-indigo-500" />
                <span>Full Audit (5-Step)</span>
              </button>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ========================================================= */}
          {/* QUICK ADD MODE (Fast 5-second workflow)                    */}
          {/* ========================================================= */}
          {creationMode === "quick" ? (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="sm:col-span-2">
                  <label className="block mb-1.5 font-semibold text-foreground">
                    Company Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    required
                    placeholder="e.g. Apex Roofing & Solar Austin"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="font-medium"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-medium text-foreground">
                    Industry / Niche <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={formData.niche}
                    onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-background border border-border/80 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Roofing & Construction">Roofing & Construction</option>
                    <option value="HVAC & Climate Control">HVAC & Climate Control</option>
                    <option value="Plumbing & Water Systems">Plumbing & Water Systems</option>
                    <option value="Electrical & Solar">Electrical & Solar</option>
                    <option value="General Contractors & Remodeling">General Contractors & Remodeling</option>
                    <option value="Pest Control & Exterminators">Pest Control & Exterminators</option>
                    <option value="Landscaping & Tree Services">Landscaping & Tree Services</option>
                    <option value="Auto Repair & Detailing">Auto Repair & Detailing</option>
                    <option value="Professional Services">Professional Services (Legal, Accounting)</option>
                    <option value="Healthcare & Dental">Healthcare & Dental</option>
                    <option value="Ecommerce & Retail">Ecommerce & Retail</option>
                    <option value="B2B SaaS / Tech">B2B SaaS / Tech</option>
                    <option value="Other">Other Vertical</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1.5 font-medium text-foreground">
                    Country <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-background border border-border/80 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="International">Other International</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1.5 font-medium text-foreground">City</label>
                  <Input
                    placeholder="e.g. Austin"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-medium text-foreground">State / Province</label>
                  <Input
                    placeholder="e.g. Texas"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-medium text-foreground">Website URL</label>
                  <Input
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-medium text-foreground">Google Maps URL</label>
                  <Input
                    placeholder="https://maps.google.com/..."
                    value={formData.googleMapsUrl}
                    onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-medium text-foreground">Main Business Phone</label>
                  <Input
                    placeholder="+1 (512) 555-0199"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-medium text-foreground">Public Email</label>
                  <Input
                    type="email"
                    placeholder="contact@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-medium text-foreground">Initial Pipeline Stage</label>
                  <select
                    value={formData.stageId}
                    onChange={(e) => setFormData({ ...formData, stageId: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-background border border-border/80 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1.5 font-medium text-foreground">Estimated Deal Value ($)</label>
                  <Input
                    type="number"
                    placeholder="15000"
                    value={formData.dealValue}
                    onChange={(e) => setFormData({ ...formData, dealValue: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter className="pt-3 border-t border-border/30">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  disabled={isSubmitting}
                  className="text-xs font-semibold gap-1.5 shadow-md shadow-indigo-500/20"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>{isSubmitting ? "Creating..." : "⚡ Quick Save Prospect"}</span>
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* ========================================================= */
            /* FULL 5-STEP QUALIFICATION WIZARD                           */
            /* ========================================================= */
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* Responsive Tab Bar */}
              <div className="overflow-x-auto pb-1">
                <TabsList className="flex w-max min-w-full sm:grid sm:grid-cols-5 text-xs bg-muted/60 p-1 border-0">
                  <TabsTrigger value="business" className="text-xs whitespace-nowrap">
                    1. Business Identity
                  </TabsTrigger>
                  <TabsTrigger value="digital" className="text-xs whitespace-nowrap">
                    2. Digital Audit
                  </TabsTrigger>
                  <TabsTrigger value="qualification" className="text-xs whitespace-nowrap">
                    3. Commercial & ICP
                  </TabsTrigger>
                  <TabsTrigger value="contact" className="text-xs whitespace-nowrap">
                    4. Decision Maker
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="text-xs whitespace-nowrap">
                    5. Notes & Research
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* TAB 1: Business Identity & Location */}
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
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Legal / Entity Name</label>
                    <Input
                      placeholder="e.g. Northstar Construction Group LLC"
                      value={formData.legalName}
                      onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Industry / Niche</label>
                    <select
                      value={formData.niche}
                      onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-background border border-border/80 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="Roofing & Construction">Roofing & Construction</option>
                      <option value="HVAC & Climate Control">HVAC & Climate Control</option>
                      <option value="Plumbing & Water Systems">Plumbing & Water Systems</option>
                      <option value="Electrical & Solar">Electrical & Solar</option>
                      <option value="General Contractors & Remodeling">General Contractors & Remodeling</option>
                      <option value="Pest Control & Exterminators">Pest Control & Exterminators</option>
                      <option value="Landscaping & Tree Services">Landscaping & Tree Services</option>
                      <option value="Auto Repair & Detailing">Auto Repair & Detailing</option>
                      <option value="Professional Services">Professional Services</option>
                      <option value="Healthcare & Dental">Healthcare & Dental</option>
                      <option value="Ecommerce & Retail">Ecommerce & Retail</option>
                      <option value="B2B SaaS / Tech">B2B SaaS / Tech</option>
                      <option value="Other">Other Vertical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Country</label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-background border border-border/80 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="International">Other International</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">City</label>
                    <Input
                      placeholder="e.g. Austin"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">State / Province</label>
                    <Input
                      placeholder="e.g. Texas"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Street Address</label>
                    <Input
                      placeholder="e.g. 7800 Shoal Creek Blvd #120"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Postal / ZIP Code</label>
                    <Input
                      placeholder="78757"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Main Business Phone</label>
                    <Input
                      placeholder="+1 (512) 555-0199"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Public Email</label>
                    <Input
                      type="email"
                      placeholder="info@northstar.demo"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Business Status</label>
                    <select
                      value={formData.businessStatus}
                      onChange={(e) => setFormData({ ...formData, businessStatus: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-background border border-border/80 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="OPERATIONAL">Active / Operational</option>
                      <option value="TEMPORARILY_CLOSED">Temporarily Closed</option>
                      <option value="PERMANENTLY_CLOSED">Permanently Closed</option>
                      <option value="UNKNOWN">Unknown</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Website URL</label>
                    <Input
                      placeholder="https://northstarroofing.demo"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Google Maps URL</label>
                    <Input
                      placeholder="https://maps.google.com/..."
                      value={formData.googleMapsUrl}
                      onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab("digital")}
                    className="gap-1.5 text-xs font-medium"
                  >
                    <span>Next: Digital Audit</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TabsContent>

              {/* TAB 2: Digital Audit & Local Footprint */}
              <TabsContent value="digital" className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Google Rating (0-5)</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      placeholder="4.8"
                      value={formData.googleRating}
                      onChange={(e) => setFormData({ ...formData, googleRating: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Google Review Count</label>
                    <Input
                      type="number"
                      placeholder="45"
                      value={formData.reviewCount}
                      onChange={(e) => setFormData({ ...formData, reviewCount: Number(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Speed Score (0-100)</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="65"
                      value={formData.speedScore}
                      onChange={(e) => setFormData({ ...formData, speedScore: Number(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Website Quality</label>
                    <select
                      value={formData.websiteQuality}
                      onChange={(e) => setFormData({ ...formData, websiteQuality: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-background border border-border/80 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="EXCELLENT">Excellent (Modern & Fast)</option>
                      <option value="GOOD">Good (Functional)</option>
                      <option value="FAIR">Fair (Dated Design)</option>
                      <option value="POOR">Poor (Broken / Slow)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Mobile UX Audit</label>
                    <select
                      value={formData.mobileUx}
                      onChange={(e) => setFormData({ ...formData, mobileUx: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-background border border-border/80 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="EXCELLENT">Excellent Mobile Flow</option>
                      <option value="GOOD">Good</option>
                      <option value="FAIR">Fair</option>
                      <option value="POOR">Poor (Non-responsive/Cut off)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">CTA / Conversion Flow</label>
                    <select
                      value={formData.ctaQuality}
                      onChange={(e) => setFormData({ ...formData, ctaQuality: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-background border border-border/80 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="STRONG">Strong Sticky CTA</option>
                      <option value="GOOD">Good</option>
                      <option value="AVERAGE">Average</option>
                      <option value="POOR">Poor / Missing Phone Header</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Quote / Booking System</label>
                    <select
                      value={formData.quoteBookingFlow}
                      onChange={(e) => setFormData({ ...formData, quoteBookingFlow: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-background border border-border/80 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="EXCELLENT">Interactive Multi-step Funnel</option>
                      <option value="GOOD">Standard Contact Form</option>
                      <option value="MISSING">Missing / Mailto Link Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Trust Signals & Badges</label>
                    <select
                      value={formData.trustSignals}
                      onChange={(e) => setFormData({ ...formData, trustSignals: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-background border border-border/80 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="STRONG">Strong (BBB, GAF Master, 100+ Reviews)</option>
                      <option value="AVERAGE">Average Badges</option>
                      <option value="WEAK">Weak / No Badges</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Local Search Presence</label>
                    <select
                      value={formData.seoVisibility}
                      onChange={(e) => setFormData({ ...formData, seoVisibility: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-background border border-border/80 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="STRONG">Top 3 Map Pack</option>
                      <option value="AVERAGE">First Page Organic</option>
                      <option value="WEAK">Page 2+ or Low Visibility</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between pt-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab("business")}
                    className="text-xs font-medium"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab("qualification")}
                    className="gap-1.5 text-xs font-medium"
                  >
                    <span>Next: Commercial & ICP</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TabsContent>

              {/* TAB 3: Commercial Qualification & ICP */}
              <TabsContent value="qualification" className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">ICP Fit</label>
                    <select
                      value={formData.icpFit}
                      onChange={(e) => setFormData({ ...formData, icpFit: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-background border border-border/80 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="HIGH">High Fit (Ideal Client)</option>
                      <option value="MEDIUM">Medium Fit</option>
                      <option value="LOW">Low Fit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Ability to Pay</label>
                    <select
                      value={formData.abilityToPay}
                      onChange={(e) => setFormData({ ...formData, abilityToPay: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-background border border-border/80 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="HIGH">High (Strong Revenue / Ad Budget)</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low / Bootstrapped</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Sales Urgency</label>
                    <select
                      value={formData.urgency}
                      onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-background border border-border/80 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="HIGH">High (Immediate Need / Hiring)</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low (Passive)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Recurring Revenue Potential</label>
                    <select
                      value={formData.recurringPotential}
                      onChange={(e) => setFormData({ ...formData, recurringPotential: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-background border border-border/80 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="HIGH">High (Monthly Retainer)</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low (One-off)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Target Deal Value ($)</label>
                    <Input
                      type="number"
                      placeholder="15000"
                      value={formData.dealValue}
                      onChange={(e) => setFormData({ ...formData, dealValue: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Initial Pipeline Stage</label>
                    <select
                      value={formData.stageId}
                      onChange={(e) => setFormData({ ...formData, stageId: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-background border border-border/80 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {stages.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1.5 font-medium text-foreground">Main Commercial Opportunity</label>
                    <Input
                      placeholder="e.g. Modern booking funnel + Local Services ads to double commercial leads"
                      value={formData.mainOpportunity}
                      onChange={(e) => setFormData({ ...formData, mainOpportunity: e.target.value })}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1.5 font-medium text-foreground">Observed Buying Signals</label>
                    <Input
                      placeholder="e.g. Recently opened 2nd warehouse; hiring for 4 commercial sales reps"
                      value={formData.buyingSignals}
                      onChange={(e) => setFormData({ ...formData, buyingSignals: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab("digital")}
                    className="text-xs font-medium"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab("contact")}
                    className="gap-1.5 text-xs font-medium"
                  >
                    <span>Next: Decision Maker</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TabsContent>

              {/* TAB 4: Primary Decision Maker */}
              <TabsContent value="contact" className="space-y-4 pt-2">
                <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40 text-muted-foreground text-xs">
                  Optional: Add key stakeholder or decision maker to automatically establish outreach readiness.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">First Name</label>
                    <Input
                      placeholder="e.g. Marcus"
                      value={formData.contactFirstName}
                      onChange={(e) => setFormData({ ...formData, contactFirstName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Last Name</label>
                    <Input
                      placeholder="e.g. Vance"
                      value={formData.contactLastName}
                      onChange={(e) => setFormData({ ...formData, contactLastName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Job Title / Role</label>
                    <Input
                      placeholder="e.g. Founder & Managing Partner"
                      value={formData.contactTitle}
                      onChange={(e) => setFormData({ ...formData, contactTitle: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Direct Email</label>
                    <Input
                      type="email"
                      placeholder="marcus@company.com"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Direct Phone</label>
                    <Input
                      placeholder="+1 (512) 555-0143"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">LinkedIn Profile URL</label>
                    <Input
                      placeholder="https://linkedin.com/in/..."
                      value={formData.contactLinkedIn}
                      onChange={(e) => setFormData({ ...formData, contactLinkedIn: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab("qualification")}
                    className="text-xs font-medium"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab("notes")}
                    className="gap-1.5 text-xs font-medium"
                  >
                    <span>Next: Notes & Research</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TabsContent>

              {/* TAB 5: Notes & Research */}
              <TabsContent value="notes" className="space-y-4 pt-2">
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Assigned Researcher / Sales Rep</label>
                    <select
                      value={formData.assignedToId}
                      onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-background border border-border/80 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Unassigned</option>
                      {workspaceUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Business & Opportunity Notes</label>
                    <Textarea
                      rows={3}
                      placeholder="Context on current marketing tech stack, owner background, or recent achievements..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-medium text-foreground">Research & Strategic Insights</label>
                    <Textarea
                      rows={3}
                      placeholder="Strategic talking points, competitors in the area, custom pitch angles..."
                      value={formData.researchNotes}
                      onChange={(e) => setFormData({ ...formData, researchNotes: e.target.value })}
                    />
                  </div>
                </div>

                <DialogFooter className="pt-3 border-t border-border/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("contact")}
                    className="text-xs"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="gradient"
                    disabled={isSubmitting}
                    className="text-xs font-semibold gap-1.5 shadow-md shadow-indigo-500/20"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{isSubmitting ? "Saving Prospect..." : "Save & Qualify Prospect"}</span>
                  </Button>
                </DialogFooter>
              </TabsContent>
            </Tabs>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
