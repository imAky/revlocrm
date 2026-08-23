"use client";

import { useState } from "react";
import {
  Sparkles,
  Building2,
  Globe,
  MapPin,
  Phone,
  Mail,
  Star,
  Award,
  Users2,
  Layers,
  FileText,
  Sliders,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { createProspectAction } from "@/lib/actions/prospects";

export function ProspectCreateModal({
  open,
  onOpenChange,
  stages = [],
  workspaceUsers = [],
  customFields = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stages?: { id: string; name: string }[];
  workspaceUsers?: { id: string; name: string }[];
  customFields?: any[];
}) {
  const [activeTab, setActiveTab] = useState("business");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Complete state covering 100% of product spec fields
  const [formData, setFormData] = useState({
    // Business Identity
    name: "",
    legalName: "",
    category: "",
    niche: "",
    website: "",
    googleMapsUrl: "",
    country: "USA",
    state: "",
    city: "",
    address: "",
    postalCode: "",
    phone: "",
    email: "",
    businessStatus: "OPERATIONAL",

    // Google / Local Signals
    googleRating: "4.8",
    reviewCount: 45,
    googleProfileUrl: "",

    // Digital Presence Audit
    websiteExists: true,
    websiteQuality: "FAIR",
    mobileUx: "POOR",
    ctaQuality: "POOR",
    quoteBookingFlow: "",
    trustSignals: "",
    seoVisibility: "",
    speedScore: 65,
    facebookUrl: "",
    instagramUrl: "",
    linkedInUrl: "",

    // Decision Maker (Contact)
    contactFirstName: "",
    contactLastName: "",
    contactTitle: "",
    contactEmail: "",
    contactPhone: "",
    contactLinkedIn: "",
    contactPreferredChannel: "EMAIL",
    contactIsDecisionMaker: true,

    // Commercial Qualification
    icpFit: "HIGH",
    abilityToPay: "HIGH",
    urgency: "HIGH",
    recurringPotential: "MEDIUM",
    buyingSignals: "",
    mainOpportunity: "",
    leadSource: "Direct Research",
    dealValue: "15000",
    stageId: stages[0]?.id || "stage_researching",
    assignedToId: workspaceUsers[0]?.id || "",

    // Notes
    notes: "",
    researchNotes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Company Name is required.");
      setActiveTab("business");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const primaryContact = formData.contactFirstName.trim()
        ? {
            firstName: formData.contactFirstName,
            lastName: formData.contactLastName,
            jobTitle: formData.contactTitle,
            email: formData.contactEmail,
            phone: formData.contactPhone,
            linkedInUrl: formData.contactLinkedIn,
            preferredChannel: formData.contactPreferredChannel,
            isDecisionMaker: formData.contactIsDecisionMaker,
          }
        : undefined;

      await createProspectAction({
        name: formData.name,
        legalName: formData.legalName,
        category: formData.category,
        niche: formData.niche,
        website: formData.website,
        googleMapsUrl: formData.googleMapsUrl,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        address: formData.address,
        postalCode: formData.postalCode,
        phone: formData.phone,
        email: formData.email,
        businessStatus: formData.businessStatus,
        googleRating: formData.googleRating,
        reviewCount: Number(formData.reviewCount),
        googleProfileUrl: formData.googleProfileUrl,
        websiteExists: formData.websiteExists,
        websiteQuality: formData.websiteQuality,
        mobileUx: formData.mobileUx,
        ctaQuality: formData.ctaQuality,
        quoteBookingFlow: formData.quoteBookingFlow,
        trustSignals: formData.trustSignals,
        seoVisibility: formData.seoVisibility,
        speedScore: Number(formData.speedScore),
        facebookUrl: formData.facebookUrl,
        instagramUrl: formData.instagramUrl,
        linkedInUrl: formData.linkedInUrl,
        icpFit: formData.icpFit,
        abilityToPay: formData.abilityToPay,
        urgency: formData.urgency,
        recurringPotential: formData.recurringPotential,
        buyingSignals: formData.buyingSignals,
        mainOpportunity: formData.mainOpportunity,
        leadSource: formData.leadSource,
        dealValue: formData.dealValue,
        stageId: formData.stageId,
        assignedToId: formData.assignedToId || undefined,
        notes: formData.notes,
        researchNotes: formData.researchNotes,
        primaryContact,
      });

      onOpenChange(false);
      // Reset form
      setFormData({
        name: "",
        legalName: "",
        category: "",
        niche: "",
        website: "",
        googleMapsUrl: "",
        country: "USA",
        state: "",
        city: "",
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
        quoteBookingFlow: "",
        trustSignals: "",
        seoVisibility: "",
        speedScore: 65,
        facebookUrl: "",
        instagramUrl: "",
        linkedInUrl: "",
        contactFirstName: "",
        contactLastName: "",
        contactTitle: "",
        contactEmail: "",
        contactPhone: "",
        contactLinkedIn: "",
        contactPreferredChannel: "EMAIL",
        contactIsDecisionMaker: true,
        icpFit: "HIGH",
        abilityToPay: "HIGH",
        urgency: "HIGH",
        recurringPotential: "MEDIUM",
        buyingSignals: "",
        mainOpportunity: "",
        leadSource: "Direct Research",
        dealValue: "15000",
        stageId: stages[0]?.id || "stage_researching",
        assignedToId: workspaceUsers[0]?.id || "",
        notes: "",
        researchNotes: "",
      });
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
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold">
                Create & Qualify Prospect Record
              </DialogTitle>
              <DialogDescription className="text-xs">
                Comprehensive company profile, digital audit, decision maker, and commercial scoring.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                    placeholder="e.g. Northstar Enterprises LLC"
                    value={formData.legalName}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-medium text-foreground">Industry / Niche</label>
                  <Input
                    placeholder="e.g. Commercial Roofing"
                    value={formData.niche}
                    onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-medium text-foreground">Website URL</label>
                  <Input
                    type="url"
                    placeholder="https://northstar-roofing.example.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-medium text-foreground">Google Maps URL</label>
                  <Input
                    placeholder="https://maps.google.com/?q=..."
                    value={formData.googleMapsUrl}
                    onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                  />
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
                    placeholder="e.g. TX"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-medium text-foreground">Street Address</label>
                  <Input
                    placeholder="e.g. 1044 Congress Ave"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-medium text-foreground">Postal / ZIP Code</label>
                  <Input
                    placeholder="e.g. 78701"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-medium text-foreground">Main Business Phone</label>
                  <Input
                    placeholder="+1 (512) 555-0142"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-medium text-foreground">Public Business Email</label>
                  <Input
                    type="email"
                    placeholder="info@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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

            {/* TAB 2: Digital Audit & Reputation */}
            <TabsContent value="digital" className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                <div>
                  <label className="block mb-1.5 font-medium text-foreground">Google Star Rating</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    placeholder="4.8"
                    value={formData.googleRating}
                    onChange={(e) => setFormData({ ...formData, googleRating: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-medium text-foreground">Google Review Count</label>
                  <Input
                    type="number"
                    placeholder="85"
                    value={formData.reviewCount}
                    onChange={(e) => setFormData({ ...formData, reviewCount: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-medium text-foreground">Website Quality</label>
                  <select
                    value={formData.websiteQuality}
                    onChange={(e) => setFormData({ ...formData, websiteQuality: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-background border border-border/80 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="EXCELLENT">Excellent (Fast, modern)</option>
                    <option value="GOOD">Good (Average)</option>
                    <option value="FAIR">Fair (Dated)</option>
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
                    <option value="EXCELLENT">Excellent Responsive</option>
                    <option value="GOOD">Good Mobile UX</option>
                    <option value="FAIR">Fair (Awkward layout)</option>
                    <option value="POOR">Poor (Non-responsive)</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1.5 font-medium text-foreground">Call-to-Action (CTA) Quality</label>
                  <select
                    value={formData.ctaQuality}
                    onChange={(e) => setFormData({ ...formData, ctaQuality: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-background border border-border/80 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="EXCELLENT">Strong Clear CTAs</option>
                    <option value="GOOD">Visible Phone / Form</option>
                    <option value="FAIR">Weak / Buried CTAs</option>
                    <option value="POOR">No Clear CTA</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1.5 font-medium text-foreground">Speed Score (0-100)</label>
                  <Input
                    type="number"
                    placeholder="65"
                    value={formData.speedScore}
                    onChange={(e) => setFormData({ ...formData, speedScore: Number(e.target.value) })}
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block mb-1.5 font-medium text-foreground">Quote / Booking Flow Audit</label>
                  <Input
                    placeholder="e.g. Long 7-step PDF form with high dropoff; no instant scheduler"
                    value={formData.quoteBookingFlow}
                    onChange={(e) => setFormData({ ...formData, quoteBookingFlow: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block mb-1.5 font-medium text-foreground">Trust Signals & Certifications</label>
                  <Input
                    placeholder="e.g. BBB A+ Accredited, GAF Master Elite, 20 Years in Business"
                    value={formData.trustSignals}
                    onChange={(e) => setFormData({ ...formData, trustSignals: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block mb-1.5 font-medium text-foreground">Local SEO & Search Footprint</label>
                  <Input
                    placeholder="e.g. Ranking #6 for 'commercial roof repair Austin'; high ad spend"
                    value={formData.seoVisibility}
                    onChange={(e) => setFormData({ ...formData, seoVisibility: e.target.value })}
                  />
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
                  <span>Next: Notes & Save</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </TabsContent>

            {/* TAB 5: Internal Notes & Custom Fields */}
            <TabsContent value="notes" className="space-y-4 pt-2">
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block mb-1.5 font-medium text-foreground">General Notes</label>
                  <Textarea
                    rows={3}
                    placeholder="General briefing, company background, and conversation history..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-medium text-foreground">Technical / Research Notes</label>
                  <Textarea
                    rows={3}
                    placeholder="Competitor analysis, tech stack observations, mobile load time audits..."
                    value={formData.researchNotes}
                    onChange={(e) => setFormData({ ...formData, researchNotes: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" disabled={isSubmitting}>
                  {isSubmitting ? "Creating & Scoring..." : "Complete & Save Prospect"}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  );
}
