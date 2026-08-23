"use server";

import { db } from "@/lib/db";
import { prospects, activities, contacts } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import {
  requirePermission,
  canAccessProspect,
  recordAuditLog,
} from "@/lib/permissions/server-guards";
import { calculateLeadScore } from "@/lib/scoring/lead-scorer";
import { revalidatePath } from "next/cache";

export interface CreateProspectInput {
  name: string;
  legalName?: string;
  category?: string;
  niche?: string;
  website?: string;
  googleMapsUrl?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  businessStatus?: string;
  googleRating?: string;
  reviewCount?: number;
  googleProfileUrl?: string;
  websiteExists?: boolean;
  websiteQuality?: string;
  mobileUx?: string;
  ctaQuality?: string;
  quoteBookingFlow?: string;
  trustSignals?: string;
  seoVisibility?: string;
  speedScore?: number;
  facebookUrl?: string;
  instagramUrl?: string;
  linkedInUrl?: string;
  icpFit?: string;
  abilityToPay?: string;
  urgency?: string;
  recurringPotential?: string;
  buyingSignals?: string;
  mainOpportunity?: string;
  leadSource?: string;
  dealValue?: string;
  stageId?: string;
  outreachStatus?: string;
  firstContactDate?: Date;
  lastContactDate?: Date;
  nextFollowUpDate?: Date;
  responseStatus?: string;
  assignedToId?: string;
  notes?: string;
  researchNotes?: string;
  // Support both flat contact inputs and nested object
  contactFirstName?: string;
  contactLastName?: string;
  contactTitle?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactLinkedIn?: string;
  contactPreferredChannel?: string;
  contactIsDecisionMaker?: boolean;
  primaryContact?: {
    firstName: string;
    lastName?: string;
    jobTitle?: string;
    email?: string;
    phone?: string;
    linkedInUrl?: string;
    preferredChannel?: string;
    isDecisionMaker?: boolean;
  };
  customFieldValues?: Record<string, string>;
}

export async function createProspectAction(input: CreateProspectInput) {
  const ctx = await requirePermission("prospects.create");

  if (!input.name || input.name.trim().length === 0) {
    return { error: "Company name is required" };
  }

  // Determine contact data from either flat or nested fields
  const contactFirst = input.contactFirstName || input.primaryContact?.firstName;
  const contactLast = input.contactLastName || input.primaryContact?.lastName;
  const contactTitle = input.contactTitle || input.primaryContact?.jobTitle;
  const contactEmail = input.contactEmail || input.primaryContact?.email;
  const contactPhone = input.contactPhone || input.primaryContact?.phone;
  const contactLinkedIn = input.contactLinkedIn || input.primaryContact?.linkedInUrl;
  const contactPref = input.contactPreferredChannel || input.primaryContact?.preferredChannel || "EMAIL";
  const contactIsDM = input.contactIsDecisionMaker !== undefined 
    ? input.contactIsDecisionMaker 
    : input.primaryContact?.isDecisionMaker !== undefined 
    ? input.primaryContact.isDecisionMaker 
    : true;

  const scoreResult = calculateLeadScore({
    googleRating: input.googleRating,
    reviewCount: input.reviewCount,
    websiteExists: input.websiteExists !== false,
    websiteQuality: input.websiteQuality,
    mobileUx: input.mobileUx,
    ctaQuality: input.ctaQuality,
    quoteBookingFlow: input.quoteBookingFlow,
    trustSignals: input.trustSignals,
    seoVisibility: input.seoVisibility,
    icpFit: input.icpFit,
    abilityToPay: input.abilityToPay,
    urgency: input.urgency,
    recurringPotential: input.recurringPotential,
    buyingSignals: input.buyingSignals,
    hasDecisionMaker: !!contactFirst && contactIsDM,
  });

  const prospectId = crypto.randomUUID();

  await db.insert(prospects).values({
    id: prospectId,
    workspaceId: ctx.workspaceId,
    name: input.name.trim(),
    legalName: input.legalName,
    category: input.category,
    niche: input.niche,
    website: input.website,
    googleMapsUrl: input.googleMapsUrl,
    country: input.country || "United States",
    state: input.state,
    city: input.city,
    address: input.address,
    postalCode: input.postalCode,
    phone: input.phone,
    email: input.email,
    businessStatus: input.businessStatus || "OPERATIONAL",
    googleRating: input.googleRating,
    reviewCount: input.reviewCount ? Number(input.reviewCount) : null,
    googleProfileUrl: input.googleProfileUrl,
    websiteExists: input.websiteExists !== false,
    websiteQuality: input.websiteQuality || "FAIR",
    mobileUx: input.mobileUx || "FAIR",
    ctaQuality: input.ctaQuality || "FAIR",
    quoteBookingFlow: input.quoteBookingFlow,
    trustSignals: input.trustSignals,
    seoVisibility: input.seoVisibility,
    speedScore: input.speedScore,
    facebookUrl: input.facebookUrl,
    instagramUrl: input.instagramUrl,
    linkedInUrl: input.linkedInUrl,
    leadScore: scoreResult.score,
    leadGrade: scoreResult.grade,
    icpFit: input.icpFit || "MEDIUM",
    abilityToPay: input.abilityToPay || "MEDIUM",
    urgency: input.urgency || "MEDIUM",
    recurringPotential: input.recurringPotential || "MEDIUM",
    buyingSignals: input.buyingSignals,
    mainOpportunity: input.mainOpportunity,
    leadSource: input.leadSource || "Direct Research",
    dealValue: input.dealValue,
    stageId: input.stageId || "stage_researching",
    outreachStatus: input.outreachStatus || "READY",
    firstContactDate: input.firstContactDate,
    lastContactDate: input.lastContactDate,
    nextFollowUpDate: input.nextFollowUpDate,
    responseStatus: input.responseStatus,
    assignedToId: input.assignedToId || ctx.userId,
    createdById: ctx.userId,
    notes: input.notes,
    researchNotes: input.researchNotes,
  });

  // Optional: create primary contact if provided
  if (contactFirst && contactFirst.trim().length > 0) {
    const fullName = `${contactFirst.trim()} ${contactLast?.trim() || ""}`.trim();
    await db.insert(contacts).values({
      id: crypto.randomUUID(),
      workspaceId: ctx.workspaceId,
      prospectId,
      firstName: contactFirst.trim(),
      lastName: contactLast?.trim(),
      fullName,
      jobTitle: contactTitle,
      email: contactEmail,
      phone: contactPhone,
      linkedInUrl: contactLinkedIn,
      preferredChannel: contactPref,
      isDecisionMaker: contactIsDM,
    });
  }

  // Record initial research activity
  await db.insert(activities).values({
    id: crypto.randomUUID(),
    workspaceId: ctx.workspaceId,
    prospectId,
    userId: ctx.userId,
    type: "RESEARCH",
    title: "Prospect Created & Initial Audit",
    description: `Created record with initial lead score ${scoreResult.score} (${scoreResult.grade}). Opportunity: ${input.mainOpportunity || "General Sales Inquiry"}`,
    outcome: `Grade: ${scoreResult.grade}`,
  });

  await recordAuditLog({
    workspaceId: ctx.workspaceId,
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: "prospect.created",
    entityType: "PROSPECT",
    entityId: prospectId,
    afterData: { name: input.name, score: scoreResult.score },
  });

  revalidatePath("/prospects");
  revalidatePath("/dashboard");
  revalidatePath("/pipeline");

  return { success: true, prospectId };
}

export async function updateProspectAction(
  prospectId: string,
  input: Partial<CreateProspectInput>
) {
  const { ctx, prospect } = await canAccessProspect(prospectId, "prospects.edit");

  const scoreResult = calculateLeadScore({
    googleRating: input.googleRating ?? prospect.googleRating,
    reviewCount: input.reviewCount ?? prospect.reviewCount,
    websiteExists: input.websiteExists ?? prospect.websiteExists,
    websiteQuality: input.websiteQuality ?? prospect.websiteQuality,
    mobileUx: input.mobileUx ?? prospect.mobileUx,
    ctaQuality: input.ctaQuality ?? prospect.ctaQuality,
    quoteBookingFlow: input.quoteBookingFlow ?? prospect.quoteBookingFlow,
    trustSignals: input.trustSignals ?? prospect.trustSignals,
    seoVisibility: input.seoVisibility ?? prospect.seoVisibility,
    icpFit: input.icpFit ?? prospect.icpFit,
    abilityToPay: input.abilityToPay ?? prospect.abilityToPay,
    urgency: input.urgency ?? prospect.urgency,
    recurringPotential: input.recurringPotential ?? prospect.recurringPotential,
    buyingSignals: input.buyingSignals ?? prospect.buyingSignals,
  });

  const updateData: Record<string, unknown> = {
    ...input,
    leadScore: scoreResult.score,
    leadGrade: scoreResult.grade,
    updatedAt: new Date(),
  };

  if (input.stageId && input.stageId !== prospect.stageId) {
    updateData.stageChangedAt = new Date();

    // Log stage change activity
    await db.insert(activities).values({
      id: crypto.randomUUID(),
      workspaceId: ctx.workspaceId,
      prospectId,
      userId: ctx.userId,
      type: "STAGE_CHANGE",
      title: "Pipeline Stage Updated",
      description: `Stage changed from ${prospect.stageId || "None"} to ${input.stageId}`,
    });
  }

  await db
    .update(prospects)
    .set(updateData)
    .where(
      and(
        eq(prospects.id, prospectId),
        eq(prospects.workspaceId, ctx.workspaceId)
      )
    );

  await recordAuditLog({
    workspaceId: ctx.workspaceId,
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: "prospect.updated",
    entityType: "PROSPECT",
    entityId: prospectId,
    beforeData: { name: prospect.name, stage: prospect.stageId },
    afterData: updateData,
  });

  revalidatePath(`/prospects/${prospectId}`);
  revalidatePath("/prospects");
  revalidatePath("/dashboard");
  revalidatePath("/pipeline");

  return { success: true };
}

export async function deleteProspectAction(prospectId: string) {
  // CRITICAL: Server-side check that actor has 'prospects.delete' capability
  const { ctx, prospect } = await canAccessProspect(prospectId, "prospects.delete");

  await db
    .delete(prospects)
    .where(
      and(
        eq(prospects.id, prospectId),
        eq(prospects.workspaceId, ctx.workspaceId)
      )
    );

  await recordAuditLog({
    workspaceId: ctx.workspaceId,
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: "prospect.deleted",
    entityType: "PROSPECT",
    entityId: prospectId,
    beforeData: { name: prospect.name },
  });

  revalidatePath("/prospects");
  revalidatePath("/dashboard");
  revalidatePath("/pipeline");

  return { success: true };
}

export async function archiveProspectAction(prospectId: string) {
  const { ctx } = await canAccessProspect(prospectId, "prospects.edit");

  await db
    .update(prospects)
    .set({ isArchived: true, updatedAt: new Date() })
    .where(
      and(
        eq(prospects.id, prospectId),
        eq(prospects.workspaceId, ctx.workspaceId)
      )
    );

  await recordAuditLog({
    workspaceId: ctx.workspaceId,
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: "prospect.archived",
    entityType: "PROSPECT",
    entityId: prospectId,
  });

  revalidatePath("/prospects");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function bulkUpdateStageAction(prospectIds: string[], stageId: string) {
  const ctx = await requirePermission("prospects.edit");

  if (prospectIds.length === 0) return { success: true };

  await db
    .update(prospects)
    .set({ stageId, stageChangedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        inArray(prospects.id, prospectIds),
        eq(prospects.workspaceId, ctx.workspaceId)
      )
    );

  revalidatePath("/prospects");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");

  return { success: true, count: prospectIds.length };
}

export async function bulkAssignAction(prospectIds: string[], assignedToId: string) {
  const ctx = await requirePermission("prospects.assign");

  if (prospectIds.length === 0) return { success: true };

  await db
    .update(prospects)
    .set({ assignedToId, updatedAt: new Date() })
    .where(
      and(
        inArray(prospects.id, prospectIds),
        eq(prospects.workspaceId, ctx.workspaceId)
      )
    );

  revalidatePath("/prospects");
  revalidatePath("/dashboard");

  return { success: true, count: prospectIds.length };
}
