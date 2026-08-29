"use client";

import { useState, useMemo } from "react";
import {
  Sparkles,
  Copy,
  Check,
  Download,
  FileText,
  Mail,
  Phone,
  Search,
  BookOpen,
  X,
  Layers,
  Code2,
  Eye,
  Building2,
  Globe,
  MapPin,
  ExternalLink,
  MessageSquare,
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
} from "@/components/ui/dialog";

export interface ProspectDossierProps {
  isOpen: boolean;
  onClose: () => void;
  prospect: any;
  contactsList?: any[];
  activitiesList?: any[];
  tasksList?: any[];
  customFieldsList?: any[];
  customFieldValuesMap?: Record<string, string>;
  stageName?: string;
}

export function generateBaseDossierMarkdown({
  prospect,
  contactsList = [],
  activitiesList = [],
  tasksList = [],
  customFieldsList = [],
  customFieldValuesMap = {},
  stageName,
}: {
  prospect: any;
  contactsList?: any[];
  activitiesList?: any[];
  tasksList?: any[];
  customFieldsList?: any[];
  customFieldValuesMap?: Record<string, string>;
  stageName?: string;
}): string {
  const lines: string[] = [];

  lines.push(`# Complete Intelligence Dossier: ${prospect.name}`);
  if (prospect.legalName) lines.push(`**Legal Registered Entity:** ${prospect.legalName}`);
  lines.push(`**Generated Timestamp:** ${new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}`);
  lines.push("");

  // 1. Commercial & ICP Qualification
  lines.push("## 1. Commercial Profile & ICP Qualification");
  lines.push(`- **Company / Brand Name:** ${prospect.name}`);
  lines.push(`- **Industry / Niche:** ${prospect.niche || "Not Specified"}`);
  if (prospect.category) lines.push(`- **Business Category:** ${prospect.category}`);
  lines.push(`- **ICP Lead Score:** ${prospect.leadScore || 0} / 100 (Grade: ${prospect.leadGrade || "N/A"})`);
  lines.push(`- **ICP Target Fit:** ${prospect.icpFit || "MEDIUM"}`);
  if (prospect.dealValue) lines.push(`- **Estimated Deal Value:** $${Number(prospect.dealValue).toLocaleString()}`);
  if (prospect.abilityToPay) lines.push(`- **Ability to Pay:** ${prospect.abilityToPay}`);
  if (prospect.urgency) lines.push(`- **Urgency Level:** ${prospect.urgency}`);
  if (prospect.recurringPotential) lines.push(`- **Recurring Revenue Potential:** ${prospect.recurringPotential}`);
  if (prospect.leadSource) lines.push(`- **Lead Acquisition Source:** ${prospect.leadSource}`);
  lines.push(`- **Pipeline Stage:** ${stageName || "Lead / Unassigned"}`);
  lines.push(`- **Outreach Workflow Status:** ${prospect.outreachStatus || "READY"}`);
  if (prospect.responseStatus) lines.push(`- **Lead Response Sentiment:** ${prospect.responseStatus}`);
  lines.push(`- **Operational Business Status:** ${prospect.businessStatus || "OPERATIONAL"}`);
  if (prospect.mainOpportunity) lines.push(`- **Primary Sales Opportunity:** ${prospect.mainOpportunity}`);
  if (prospect.buyingSignals) lines.push(`- **Detected Buying Signals:** ${prospect.buyingSignals}`);
  lines.push("");

  // 2. Physical & Digital Contact Information
  lines.push("## 2. Contact Information & Physical Footprint");
  if (prospect.phone) lines.push(`- **Main Business Phone:** ${prospect.phone}`);
  if (prospect.email) lines.push(`- **Public Email Address:** ${prospect.email}`);
  if (prospect.website) lines.push(`- **Official Website:** ${prospect.website}`);
  if (prospect.googleMapsUrl) lines.push(`- **Google Maps Location:** ${prospect.googleMapsUrl}`);
  if (prospect.googleProfileUrl) lines.push(`- **Google Business Profile URL:** ${prospect.googleProfileUrl}`);
  lines.push(`- **Street Address:** ${prospect.address || "N/A"}`);
  lines.push(`- **City / State / Country:** ${[prospect.city, prospect.state, prospect.country].filter(Boolean).join(", ") || "N/A"}`);
  if (prospect.postalCode) lines.push(`- **Postal / Zip Code:** ${prospect.postalCode}`);
  if (prospect.facebookUrl) lines.push(`- **Facebook Page:** ${prospect.facebookUrl}`);
  if (prospect.instagramUrl) lines.push(`- **Instagram Handle:** ${prospect.instagramUrl}`);
  if (prospect.linkedInUrl) lines.push(`- **LinkedIn Company Page:** ${prospect.linkedInUrl}`);
  lines.push("");

  // 3. Digital Audit & Web Intelligence
  lines.push("## 3. Digital Audit & Web Intelligence");
  lines.push(`- **Google Star Rating:** ${prospect.googleRating ? `${prospect.googleRating} ★` : "Not Available"}`);
  lines.push(`- **Google Review Count:** ${prospect.reviewCount ?? 0} reviews`);
  lines.push(`- **Website Live / Active:** ${prospect.websiteExists ? "Yes (Active)" : "No (Missing Website)"}`);
  lines.push(`- **Website Visual Quality:** ${prospect.websiteQuality || "FAIR"}`);
  lines.push(`- **Mobile Experience (UX):** ${prospect.mobileUx || "POOR"}`);
  lines.push(`- **Call-to-Action (CTA) Conversion Quality:** ${prospect.ctaQuality || "FAIR"}`);
  if (prospect.quoteBookingFlow) lines.push(`- **Quote / Booking Flow:** ${prospect.quoteBookingFlow}`);
  if (prospect.trustSignals) lines.push(`- **Trust Signals & Social Proof:** ${prospect.trustSignals}`);
  if (prospect.seoVisibility) lines.push(`- **SEO Local Visibility:** ${prospect.seoVisibility}`);
  if (prospect.speedScore !== null && prospect.speedScore !== undefined) {
    lines.push(`- **PageSpeed Performance Score:** ${prospect.speedScore} / 100`);
  }
  lines.push(`- **SSL Security Protocol:** ${prospect.hasSsl ? "Secure (HTTPS)" : "Unsecured (HTTP)"}`);
  if (prospect.researchNotes) {
    lines.push(`- **Deep Research & Audit Findings:**\n  ${prospect.researchNotes}`);
  }
  if (prospect.notes) {
    lines.push(`- **General Account Notes:**\n  ${prospect.notes}`);
  }
  lines.push("");

  // 4. Decision Makers & Key Contacts
  lines.push("## 4. Key Stakeholders & Decision Makers");
  if (contactsList.length === 0) {
    lines.push("_No individual stakeholder contacts recorded yet._");
  } else {
    contactsList.forEach((c, idx) => {
      const dmTag = c.isDecisionMaker ? " [PRIMARY DECISION MAKER]" : "";
      lines.push(`### Contact ${idx + 1}: ${c.firstName} ${c.lastName}${dmTag}`);
      if (c.jobTitle) lines.push(`- **Role / Title:** ${c.jobTitle}`);
      if (c.email) lines.push(`- **Direct Email:** ${c.email}`);
      if (c.phone) lines.push(`- **Direct Phone:** ${c.phone}`);
      if (c.linkedInUrl) lines.push(`- **LinkedIn Profile:** ${c.linkedInUrl}`);
      if (c.preferredChannel) lines.push(`- **Preferred Channel:** ${c.preferredChannel}`);
      lines.push("");
    });
  }

  // 5. Custom Business Attributes
  if (customFieldsList.length > 0) {
    const filledCustom = customFieldsList
      .map((f) => ({ label: f.label, value: customFieldValuesMap[f.id] }))
      .filter((item) => Boolean(item.value));

    if (filledCustom.length > 0) {
      lines.push("## 5. Custom Business Attributes & Metrics");
      filledCustom.forEach((item) => {
        lines.push(`- **${item.label}:** ${item.value}`);
      });
      lines.push("");
    }
  }

  // 6. Complete Activity & Communication Log
  lines.push("## 6. Complete Outreach History & Activity Logs");
  if (activitiesList.length === 0) {
    lines.push("_No prior activities or outreach recorded._");
  } else {
    activitiesList.forEach((act, idx) => {
      const dateStr = new Date(act.performedAt).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });
      lines.push(`### Activity ${idx + 1}: [${act.type}] ${act.title}`);
      lines.push(`- **Timestamp:** ${dateStr}`);
      if (act.userName) lines.push(`- **Logged By:** ${act.userName}`);
      if (act.description) lines.push(`- **Details & Transcript:**\n  ${act.description}`);
      if (act.outcome) lines.push(`- **Outcome:** ${act.outcome}`);
      if (act.nextAction) lines.push(`- **Next Action / Follow-up:** ${act.nextAction}`);
      if (act.attachmentUrl) lines.push(`- **Attached Screenshots:** Included`);
      lines.push("");
    });
  }

  // 7. Tasks & Follow-up Action Items
  lines.push("## 7. Action Items & Follow-up Tasks");
  if (tasksList.length === 0) {
    lines.push("_No outstanding tasks._");
  } else {
    tasksList.forEach((t, idx) => {
      const statusIcon = t.status === "DONE" ? "✅ [DONE]" : "⏳ [PENDING]";
      const dueStr = t.dueDate
        ? ` (Due: ${new Date(t.dueDate).toLocaleDateString()})`
        : "";
      lines.push(`### Task ${idx + 1}: ${statusIcon} [${t.priority || "MEDIUM"}] ${t.title}${dueStr}`);
      if (t.description) lines.push(`- **Description / Notes:** ${t.description}`);
      if (t.assignedToName) lines.push(`- **Assigned To:** ${t.assignedToName}`);
      if (t.resolutionNotes) lines.push(`- **Resolution / Handover:** ${t.resolutionNotes}`);
      lines.push("");
    });
  }

  return lines.join("\n");
}

export function ProspectAiDossierModal({
  isOpen,
  onClose,
  prospect,
  contactsList = [],
  activitiesList = [],
  tasksList = [],
  customFieldsList = [],
  customFieldValuesMap = {},
  stageName,
}: ProspectDossierProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<
    "DOSSIER" | "EMAIL_THREAD" | "COLD_EMAIL" | "COLD_CALL" | "AUDIT_PITCH" | "DISCOVERY"
  >("DOSSIER");
  const [viewMode, setViewMode] = useState<"PREVIEW" | "RAW">("PREVIEW");
  const [customInstruction, setCustomInstruction] = useState("");
  const [copied, setCopied] = useState(false);

  // Generate Base Dossier Markdown
  const baseDossier = useMemo(() => {
    if (!prospect) return "";
    return generateBaseDossierMarkdown({
      prospect,
      contactsList,
      activitiesList,
      tasksList,
      customFieldsList,
      customFieldValuesMap,
      stageName,
    });
  }, [
    prospect,
    contactsList,
    activitiesList,
    tasksList,
    customFieldsList,
    customFieldValuesMap,
    stageName,
  ]);

  // Primary Decision Maker
  const primaryContact = useMemo(() => {
    return (
      contactsList.find((c) => c.isDecisionMaker) ||
      contactsList[0] || { firstName: "there", lastName: "", jobTitle: "Owner / Director" }
    );
  }, [contactsList]);

  // Filter only EMAIL activities for Thread Context
  const emailActivities = useMemo(() => {
    return activitiesList.filter((a) => a.type.toUpperCase() === "EMAIL");
  }, [activitiesList]);

  // Full Generated Prompt or Dossier
  const outputText = useMemo(() => {
    if (!prospect) return "";

    const userExtra = customInstruction.trim()
      ? `\n\n### Additional Strategic Directives:\n${customInstruction.trim()}\n`
      : "";

    switch (selectedTemplate) {
      case "EMAIL_THREAD": {
        const threadList =
          emailActivities.length > 0
            ? emailActivities
                .map((act, idx) => {
                  const dateStr = new Date(act.performedAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  });
                  return `---
[Email #${idx + 1}] Sent / Logged on ${dateStr} by ${act.userName || "Team Member"}
Subject: ${act.title}
${act.description ? `Body / Notes:\n${act.description}` : ""}
${act.outcome ? `Outcome: ${act.outcome}` : ""}
${act.nextAction ? `Next Action: ${act.nextAction}` : ""}`;
                })
                .join("\n\n")
            : "_No email communication logs recorded yet for this prospect._";

        return `You are an elite B2B account manager and email outreach specialist.
Below is the full email outreach and communication thread history with ${prospect.name}.

### Objective:
Review the email history below, analyze the stakeholder's engagement level, and compose the next strategic follow-up email for ${primaryContact.firstName} (${primaryContact.jobTitle || "Stakeholder"}).

### Requirements:
1. **Subject Line**: Use a natural, reply-style or punchy subject line (e.g. "Re: " or a direct follow-up hook).
2. **Contextual Continuity**: Seamlessly acknowledge the previous touchpoint without sounding robotic.
3. **Core Value & Solution**: Reiterate our tailored solution for ${prospect.niche || "their business"} in ${prospect.city || "their local market"}.
4. **Frictionless Next Step**: Propose a quick, low-pressure 10-minute discovery call.${userExtra}

---
### PROSPECT PROFILE:
- **Company:** ${prospect.name}
- **Decision Maker:** ${primaryContact.firstName} ${primaryContact.lastName} (${primaryContact.jobTitle || "Business Owner"})
- **Email:** ${primaryContact.email || prospect.email || "N/A"}
- **Phone:** ${primaryContact.phone || prospect.phone || "N/A"}
- **Google Reputation:** ${prospect.googleRating || "4.8"}★ (${prospect.reviewCount || 0} reviews)
- **Website:** ${prospect.website || "N/A"}
- **Audit Findings:** ${prospect.researchNotes || "Website UX improvement and local conversion optimization opportunity"}

---
### EMAIL OUTREACH HISTORY (${emailActivities.length} Emails Recorded):
${threadList}`;
      }

      case "COLD_EMAIL":
        return `You are an elite B2B sales copywriter and outbound conversion specialist.
Your mission is to craft a hyper-personalized, high-converting 3-paragraph cold outreach email for the following prospect.

### Output Guidelines:
1. **Subject Line**: Write 3 punchy, curiosity-inducing subject lines (under 6 words, all lower case / natural casing, avoiding spam trigger words).
2. **Opening Hook**: Compliment a genuine attribute or reference their local reputation (${prospect.googleRating || "4.8"}★ with ${prospect.reviewCount || 40}+ reviews in ${prospect.city || "their area"}).
3. **Core Value Proposition**: Address their digital presence pain points (${prospect.websiteQuality === "POOR" ? "outdated website design" : "untapped mobile lead conversion opportunities"}) and offer a concrete solution.
4. **Soft Call to Action (CTA)**: Low-friction ask (e.g. "Would you be open to a 2-minute video walkthrough this Thursday?").
5. **Tone**: Warm, direct, consultative, and zero fluff. No corporate clichés.${userExtra}

---
### PROSPECT INTELLIGENCE CONTEXT:
${baseDossier}`;

      case "COLD_CALL":
        return `You are a master SDR sales coach and cold call practitioner.
Generate an actionable 60-second cold call script, hook, and objection handling matrix tailored to this prospect.

### Output Structure:
1. **The Pattern Interrupt Opener**: Friendly, authentic opener addressing ${primaryContact.firstName} (${primaryContact.jobTitle || "Business Owner"}).
2. **The 15-Second Value Hook**: Highlighting why you are calling based on their current status (${prospect.niche || "business"} in ${prospect.city || "the local market"}).
3. **The 3 Key Objection Responses**:
   - "We already have someone handling this"
   - "Send me an email / Not interested"
   - "We don't have budget right now"
4. **Low Friction Closing Question**: Secure agreement for a brief 10-minute discovery call.${userExtra}

---
### PROSPECT INTELLIGENCE CONTEXT:
${baseDossier}`;

      case "AUDIT_PITCH":
        return `You are a senior digital strategist and technical audit specialist.
Create a comprehensive, value-first Digital Audit Teardown & Growth Pitch for ${prospect.name}.

### Deliverables:
1. **Executive Audit Teardown**: Detailed breakdown of their digital assets, website speed/UX (${prospect.mobileUx || "POOR"}), Google profile rating (${prospect.googleRating || 4.8}★), and competitive gaps in ${prospect.city || "their service region"}.
2. **Top 3 High-Impact Quick Wins**: Concrete improvements they can make immediately to capture more incoming customer inquiries.
3. **Proposed Redesign / Growth Roadmap**: A phased 30-day implementation plan showcasing how modernizing their digital footprint increases revenue.${userExtra}

---
### PROSPECT INTELLIGENCE CONTEXT:
${baseDossier}`;

      case "DISCOVERY":
        return `You are a strategic B2B account executive preparing for an executive discovery call with ${prospect.name}.
Generate a comprehensive Pre-Call Briefing Memo and tailored discovery agenda.

### Briefing Agenda:
1. **Executive Background & ICP Alignment**: Quick snapshot of why this company matches our ideal client profile.
2. **5 Strategic Probing Questions**: Tailored questions to uncover pain points regarding lead acquisition, conversion rates, and current technology bottlenecks.
3. **Anticipated Commercial Concerns & Landmines**: What hesitations might ${primaryContact.firstName || "the stakeholder"} have?
4. **Recommended Next Steps & Closing Target**: Clear next steps to propose at the end of the meeting.${userExtra}

---
### PROSPECT INTELLIGENCE CONTEXT:
${baseDossier}`;

      case "DOSSIER":
      default:
        return baseDossier;
    }
  }, [
    selectedTemplate,
    baseDossier,
    prospect,
    primaryContact,
    emailActivities,
    customInstruction,
  ]);

  // Copy to Clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Failed to copy to clipboard");
    }
  };

  // Download as File (.md or .txt)
  const handleDownload = (format: "md" | "txt") => {
    const slug = (prospect?.name || "prospect")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    const typeSuffix =
      selectedTemplate === "DOSSIER"
        ? "AI_Intelligence_Dossier"
        : `${selectedTemplate.toLowerCase()}_ai_prompt`;

    const fileName = `${slug}_${typeSuffix}.${format}`;
    const blob = new Blob([outputText], {
      type: format === "md" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[96vw] sm:max-w-4xl max-h-[92vh] flex flex-col p-0 rounded-3xl bg-white dark:bg-[#121218] text-foreground dark:text-zinc-100 border border-slate-200/90 dark:border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <span>AI Prompt Summary & Intelligence Dossier</span>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    .MD / PROMPT
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground pt-0.5">
                  Complete structured company context ready to feed into ChatGPT, Claude, Gemini, or export
                </DialogDescription>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                size="sm"
                variant={copied ? "default" : "gradient"}
                onClick={handleCopy}
                className="gap-1.5 text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Prompt</span>
                  </>
                )}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload("md")}
                className="gap-1.5 text-xs font-medium rounded-xl border-border/80 cursor-pointer"
                title="Download as Markdown file"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Download</span> .MD
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDownload("txt")}
                className="gap-1 text-xs rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
                title="Download as Plain Text file"
              >
                .TXT
              </Button>
            </div>
          </div>

          {/* Template Selector Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-3 max-w-full scrollbar-none">
            {[
              { id: "DOSSIER", label: "Full Company Dossier", icon: BookOpen },
              { id: "EMAIL_THREAD", label: `Email Thread Context (${emailActivities.length})`, icon: MessageSquare },
              { id: "COLD_EMAIL", label: "Cold Email Prompt", icon: Mail },
              { id: "COLD_CALL", label: "Cold Call Script Prompt", icon: Phone },
              { id: "AUDIT_PITCH", label: "Website Audit Pitch Prompt", icon: Search },
              { id: "DISCOVERY", label: "Discovery Prep Brief", icon: Layers },
            ].map((tmpl) => {
              const Icon = tmpl.icon;
              const isActive = selectedTemplate === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setSelectedTemplate(tmpl.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer border ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-background/80 dark:bg-zinc-900/80 hover:bg-muted text-muted-foreground hover:text-foreground border-border/70"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tmpl.label}</span>
                </button>
              );
            })}
          </div>
        </DialogHeader>

        {/* Custom Instruction Box (Optional for AI generation) */}
        {selectedTemplate !== "DOSSIER" && (
          <div className="px-4 sm:px-6 py-2.5 bg-muted/30 border-b border-border/40 flex items-center gap-2 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
            <Input
              placeholder="Add custom prompt instructions (e.g. 'Keep it under 100 words' or 'Emphasize 24/7 emergency service')..."
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              className="h-8 text-xs bg-background/90 dark:bg-zinc-950/90 rounded-lg border-border/70"
            />
            {customInstruction && (
              <button
                type="button"
                onClick={() => setCustomInstruction("")}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                title="Clear instruction"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* View Mode Toggle Bar */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pb-1 border-b border-border/40">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{prospect?.name}</span>
              <span>•</span>
              <span>{outputText.split("\n").length} lines</span>
              <span>•</span>
              <span>~{Math.round(outputText.length / 4)} estimated tokens</span>
            </div>

            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => setViewMode("PREVIEW")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "PREVIEW"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Eye className="h-3 w-3" />
                <span>Formatted Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("RAW")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "RAW"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Code2 className="h-3 w-3" />
                <span>Raw Markdown</span>
              </button>
            </div>
          </div>

          {/* Mode 1: Formatted Preview */}
          {viewMode === "PREVIEW" ? (
            <div className="space-y-4 text-xs leading-relaxed text-foreground/90 select-text">
              {selectedTemplate !== "DOSSIER" && (
                <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-foreground space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-primary text-xs">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>AI System Instructions & Context Ready</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    This prompt is configured with role directives, proven B2B copywriting principles, and the full company intelligence embedded below.
                  </p>
                </div>
              )}

              {/* Company Header Card */}
              <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold text-foreground">{prospect?.name}</span>
                    {prospect?.niche && (
                      <Badge variant="outline" className="text-[10px]">
                        {prospect.niche}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" className="font-mono text-[10px]">
                      ICP Score: {prospect?.leadScore || 0} ({prospect?.leadGrade || "N/A"})
                    </Badge>
                    {prospect?.dealValue && (
                      <Badge variant="info" className="font-mono text-[10px]">
                        ${Number(prospect.dealValue).toLocaleString()}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-muted/40 space-y-0.5">
                    <span className="text-muted-foreground">Location:</span>
                    <p className="font-medium text-foreground">
                      {[prospect?.city, prospect?.state, prospect?.country].filter(Boolean).join(", ") || "N/A"}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 space-y-0.5">
                    <span className="text-muted-foreground">Phone & Email:</span>
                    <p className="font-medium text-foreground">
                      {prospect?.phone || "No phone"} • {prospect?.email || "No email"}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 space-y-0.5">
                    <span className="text-muted-foreground">Google Reputation:</span>
                    <p className="font-medium text-foreground">
                      {prospect?.googleRating ? `${prospect.googleRating} ★` : "N/A"} ({prospect?.reviewCount ?? 0} reviews)
                    </p>
                  </div>
                </div>
              </div>

              {/* Monospace Output Box with full copyable content */}
              <div className="relative group">
                <pre className="p-4 sm:p-5 rounded-2xl bg-zinc-950 text-zinc-100 font-mono text-[11px] sm:text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed border border-zinc-800 shadow-inner">
                  {outputText}
                </pre>
              </div>
            </div>
          ) : (
            /* Mode 2: Raw Monospace Code View */
            <div className="relative">
              <pre className="p-4 sm:p-5 rounded-2xl bg-zinc-950 text-zinc-100 font-mono text-[11px] sm:text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed border border-zinc-800 shadow-inner selection:bg-primary/30">
                {outputText}
              </pre>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border/60 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground text-[11px]">
            💡 Tip: Click <strong>Copy Prompt</strong> then paste directly into ChatGPT or Claude to instantly draft emails.
          </span>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl text-xs cursor-pointer"
            >
              Close
            </Button>

            <Button
              type="button"
              variant="gradient"
              onClick={handleCopy}
              className="gap-1.5 text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-300" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Prompt</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
