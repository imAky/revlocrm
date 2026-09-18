"use server";

import { db } from "@/lib/db";
import { prospects, contacts, researchKeywords, activities, workspaces, users } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireAuth, recordAuditLog } from "@/lib/permissions/server-guards";
import { revalidatePath } from "next/cache";
import {
  generateHighTicketKeywords,
  CountryConfig,
  TIER1_COUNTRIES,
} from "@/lib/services/ai-keyword-generator";
import {
  searchGoogleMapsProspects,
  DiscoveredProspect,
  DiscoveryResult,
} from "@/lib/services/discovery-service";
import { scoutDecisionMaker } from "@/lib/services/dm-scout-service";
import { calculateLeadScore } from "@/lib/scoring/lead-scorer";
import { normalizeKeywordString } from "@/lib/utils/research";

/**
 * Safely revalidates Next.js router cache without crashing in headless / CLI environments.
 */
function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Graceful no-op when running outside Next.js request store
  }
}

/**
 * Resolves authentication context from active browser session or falls back
 * to specified workspaceId (for headless API routes & automated cron agents).
 */
async function getAuthOrFallback(options?: { workspaceId?: string; userId?: string }) {
  try {
    return await requireAuth();
  } catch (err) {
    const [firstUser] = await db.select().from(users).limit(1);
    const userId = options?.userId || firstUser?.id;
    const email = firstUser?.email || "agent@revlocrm.local";

    if (options?.workspaceId) {
      return {
        workspaceId: options.workspaceId,
        userId,
        email,
        role: "admin",
      };
    }
    const [ws] = await db.select().from(workspaces).limit(1);
    if (ws) {
      return {
        workspaceId: ws.id,
        userId,
        email,
        role: "admin",
      };
    }
    throw err;
  }
}

/**
 * Retrieves the next unsearched keyword from the workspace queue
 */
export async function fetchNextPendingKeywordAction(options?: { workspaceId?: string }) {
  const ctx = await getAuthOrFallback(options);

  const [keyword] = await db
    .select()
    .from(researchKeywords)
    .where(
      and(
        eq(researchKeywords.workspaceId, ctx.workspaceId),
        eq(researchKeywords.status, "PENDING")
      )
    )
    .orderBy(researchKeywords.createdAt)
    .limit(1);

  const pendingCountRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(researchKeywords)
    .where(
      and(
        eq(researchKeywords.workspaceId, ctx.workspaceId),
        eq(researchKeywords.status, "PENDING")
      )
    );

  const totalKeywordsRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(researchKeywords)
    .where(eq(researchKeywords.workspaceId, ctx.workspaceId));

  return {
    hasPending: !!keyword,
    keyword: keyword || null,
    pendingCount: Number(pendingCountRes[0]?.count || 0),
    totalCount: Number(totalKeywordsRes[0]?.count || 0),
  };
}

/**
 * Fetches all pending keywords in the workspace for sequential processing.
 */
export async function fetchPendingKeywordsAction(options?: { workspaceId?: string }) {
  const ctx = await getAuthOrFallback(options);

  const keywords = await db
    .select()
    .from(researchKeywords)
    .where(
      and(
        eq(researchKeywords.workspaceId, ctx.workspaceId),
        eq(researchKeywords.status, "PENDING")
      )
    )
    .orderBy(desc(researchKeywords.createdAt))
    .limit(250);

  return {
    success: true,
    keywords,
  };
}

/**
 * AI Generation of High-Ticket Keywords for Tier-1 Countries & Territories
 */
export async function generateKeywordsAction(options: {
  country?: string;
  state?: string;
  city?: string;
  niche?: string;
  count?: number;
  modelId?: string;
  customCountryName?: string;
  workspaceId?: string;
  userId?: string;
} = {}) {
  const {
    country = "US",
    state,
    city,
    niche,
    count = 10,
    modelId = "gemini-3.5-flash-lite",
    customCountryName,
  } = options;
  const ctx = await getAuthOrFallback(options);

  const generatedItems = await generateHighTicketKeywords({
    country,
    state,
    city,
    niche,
    count,
    modelId,
    customCountryName,
    workspaceId: ctx.workspaceId,
  });

  if (generatedItems.length === 0) {
    return {
      success: true,
      addedCount: 0,
      message: "All suggested keywords already exist in your research database.",
    };
  }

  // Insert generated keywords into database
  const insertValues = generatedItems.map((item) => ({
    id: crypto.randomUUID(),
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    keyword: item.keyword,
    normalizedKeyword: normalizeKeywordString(item.keyword),
    niche: item.niche,
    city: item.city,
    state: item.state,
    country: item.country,
    status: "PENDING" as const,
    searchEngine: "GOOGLE_MAPS",
    searchedBy: "AI_AGENT" as const,
    notes: item.notes,
  }));

  await db.insert(researchKeywords).values(insertValues);

  await recordAuditLog({
    workspaceId: ctx.workspaceId,
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: "automation.ai_keywords_generated",
    entityType: "RESEARCH_KEYWORD",
    entityId: insertValues[0].id,
    metadata: { country, state, city, count: insertValues.length, niche },
  });

  safeRevalidatePath("/research");
  safeRevalidatePath("/automation");

  return {
    success: true,
    addedCount: insertValues.length,
    keywords: insertValues,
  };
}

export const generateTier1KeywordsAction = generateKeywordsAction;

/**
 * Fully Autonomous Prospecting Agent Pipeline Execution
 * - Checks pending queue; if empty, automatically replenishes with top territory keywords.
 * - Queries Google Places API (New) for local businesses.
 * - Detects missing websites (flags hot web build opportunities).
 * - Scouts verified executive decision-makers.
 * - Ingests qualified prospects directly into CRM.
 */
export async function runAutonomousAgentCycleAction(options?: {
  country?: string;
  state?: string;
  city?: string;
  niche?: string;
  modelId?: string;
  workspaceId?: string;
  userId?: string;
}) {
  const ctx = await getAuthOrFallback(options);

  let autoGeneratedCount = 0;
  let targetKeyword: any = null;

  // 1. Fetch next pending keyword from queue
  const [pending] = await db
    .select()
    .from(researchKeywords)
    .where(
      and(
        eq(researchKeywords.workspaceId, ctx.workspaceId),
        eq(researchKeywords.status, "PENDING")
      )
    )
    .orderBy(researchKeywords.createdAt)
    .limit(1);

  if (pending) {
    targetKeyword = pending;
  } else {
    // Autonomous replenishment: generate 5 high-ticket territory keywords
    const generated = await generateHighTicketKeywords({
      country: options?.country || "US",
      state: options?.state || "TX",
      city: options?.city || "Katy",
      niche: options?.niche || "Commercial Roofing & Industrial Restoration",
      count: 5,
      modelId: options?.modelId || "gemini-3.5-flash-lite",
      workspaceId: ctx.workspaceId,
    });

    if (generated.length > 0) {
      const inserts = generated.map((item) => ({
        id: crypto.randomUUID(),
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        keyword: item.keyword,
        normalizedKeyword: normalizeKeywordString(item.keyword),
        niche: item.niche,
        city: item.city,
        state: item.state,
        country: item.country,
        status: "PENDING" as const,
        searchEngine: "GOOGLE_MAPS",
        searchedBy: "AI_AGENT" as const,
        notes: item.notes,
      }));

      await db.insert(researchKeywords).values(inserts);
      autoGeneratedCount = inserts.length;
      targetKeyword = inserts[0];
    }
  }

  if (!targetKeyword) {
    return {
      success: false,
      message: "No search queries available in queue.",
    };
  }

  // 2. Run Google Maps discovery
  const scoutRes = await runGoogleMapsScoutAction({
    keywordId: targetKeyword.id,
    country: targetKeyword.country || "US",
    maxResults: 10,
    modelId: options?.modelId || "gemini-3.5-flash-lite",
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
  });

  if (!scoutRes.success || !scoutRes.result) {
    return {
      success: false,
      message: scoutRes.error || "Failed to execute Google Maps scout",
    };
  }

  // 3. Auto-ingest discovered prospects into CRM
  const discovered = scoutRes.result.prospects;
  let ingestedCount = 0;
  if (discovered.length > 0) {
    const importRes = await bulkImportDiscoveredProspectsAction(discovered, {
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
    });
    if (importRes.success) {
      ingestedCount = importRes.importedCount;
    }
  }

  safeRevalidatePath("/automation");
  safeRevalidatePath("/research");
  safeRevalidatePath("/prospects");

  return {
    success: true,
    cycleId: crypto.randomUUID(),
    keyword: targetKeyword.keyword,
    autoGeneratedKeywords: autoGeneratedCount,
    prospectsDiscovered: discovered.length,
    noWebsiteCount: discovered.filter((p) => p.hasNoWebsiteOpportunity).length,
    prospectsIngested: ingestedCount,
    decisionMakersFound: discovered.filter((p) => p.founder?.fullName).length,
    summary: `Autonomous Lead Scout mined "${targetKeyword.keyword}". Found ${discovered.length} businesses (${discovered.filter((p) => p.hasNoWebsiteOpportunity).length} without websites), and synced to CRM.`,
  };
}

/**
 * Executes the Google Maps Scout Agent on a keyword
 */
export async function runGoogleMapsScoutAction({
  keywordId,
  query,
  country = "US",
  maxResults = 10,
  modelId = "gemini-3.5-flash-lite",
  workspaceId,
  userId,
}: {
  keywordId?: string;
  query?: string;
  country?: string;
  maxResults?: number;
  modelId?: string;
  workspaceId?: string;
  userId?: string;
}) {
  const ctx = await getAuthOrFallback({ workspaceId, userId });

  let targetQuery = query?.trim() || "";
  let targetCountry = country;

  // If keywordId provided, fetch keyword from DB
  if (keywordId) {
    const [record] = await db
      .select()
      .from(researchKeywords)
      .where(
        and(
          eq(researchKeywords.id, keywordId),
          eq(researchKeywords.workspaceId, ctx.workspaceId)
        )
      );

    if (record) {
      targetQuery = record.keyword;
      targetCountry = record.country || country;
    }
  }

  if (!targetQuery) {
    return { error: "No query specified for Google Maps discovery" };
  }

  // Run discovery
  const discoveryResult = await searchGoogleMapsProspects({
    keyword: targetQuery,
    country: targetCountry,
    maxResults,
  });

  // Enrich decision makers concurrently (high-speed parallel scout)
  const enrichedProspects: DiscoveredProspect[] = await Promise.all(
    discoveryResult.prospects.map(async (p) => {
      if (p.founder) return p;

      try {
        const dm = await scoutDecisionMaker({
          companyName: p.name,
          city: p.city,
          state: p.state,
          website: p.website,
          modelId,
        });

        return {
          ...p,
          founder: dm.found
            ? {
                fullName: dm.fullName || "Business Owner",
                firstName: dm.firstName || "Principal",
                lastName: dm.lastName || "Owner",
                jobTitle: dm.jobTitle || "Founder & General Manager",
                email: dm.email,
                phone: dm.phone,
                linkedInUrl: dm.linkedInUrl,
                verificationStatus: dm.verificationStatus,
              }
            : undefined,
        };
      } catch {
        return p;
      }
    })
  );

  // If keywordId was provided, mark it as searched by the AI Agent
  if (keywordId) {
    await db
      .update(researchKeywords)
      .set({
        status: "SEARCHED",
        searchedBy: "AI_AGENT",
        prospectsFoundCount: enrichedProspects.length,
        lastSearchedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(researchKeywords.id, keywordId),
          eq(researchKeywords.workspaceId, ctx.workspaceId)
        )
      );

    safeRevalidatePath("/research");
  }

  safeRevalidatePath("/automation");

  return {
    success: true,
    result: {
      ...discoveryResult,
      prospects: enrichedProspects,
    },
  };
}

/**
 * Ingests a single discovered prospect into CRM database
 */
export async function importDiscoveredProspectAction(
  p: DiscoveredProspect,
  options?: { workspaceId?: string; userId?: string }
) {
  const ctx = await getAuthOrFallback(options);

  const prospectId = crypto.randomUUID();
  const hasWebsite = p.websiteExists && !!p.website;

  // Calculate score using our tested 4-pillar formula
  const scoreResult = calculateLeadScore({
    googleRating: p.googleRating,
    reviewCount: p.reviewCount,
    websiteExists: hasWebsite,
    website: p.website,
    websiteQuality: hasWebsite ? "FAIR" : "MISSING",
    mobileUx: hasWebsite ? "FAIR" : "POOR",
    ctaQuality: hasWebsite ? "FAIR" : "POOR",
    quoteBookingFlow: hasWebsite ? "BASIC" : "MISSING",
    icpFit: p.hasNoWebsiteOpportunity ? "HIGH" : "MEDIUM",
    abilityToPay: "HIGH",
    urgency: p.hasNoWebsiteOpportunity ? "HIGH" : "MEDIUM",
    recurringPotential: "MEDIUM",
    hasDecisionMaker: !!p.founder,
    phone: p.phone,
    email: p.founder?.email,
    linkedInUrl: p.founder?.linkedInUrl,
  });

  await db.insert(prospects).values({
    id: prospectId,
    workspaceId: ctx.workspaceId,
    name: p.name.trim(),
    category: p.category,
    niche: p.niche,
    website: p.website,
    googleMapsUrl: p.googleMapsUrl,
    address: p.address,
    city: p.city,
    state: p.state,
    country: p.country || "United States",
    postalCode: p.postalCode,
    phone: p.phone,
    email: p.founder?.email || null,
    businessStatus: p.businessStatus || "OPERATIONAL",
    googleRating: p.googleRating,
    reviewCount: p.reviewCount,
    websiteExists: hasWebsite,
    websiteQuality: hasWebsite ? "FAIR" : "MISSING",
    mobileUx: hasWebsite ? "FAIR" : "POOR",
    ctaQuality: hasWebsite ? "FAIR" : "POOR",
    quoteBookingFlow: hasWebsite ? "BASIC" : "MISSING",
    hasNoWebsiteOpportunity: p.hasNoWebsiteOpportunity,
    leadScore: scoreResult.score,
    leadGrade: scoreResult.grade,
    icpFit: p.hasNoWebsiteOpportunity ? "HIGH" : "MEDIUM",
    abilityToPay: "HIGH",
    urgency: p.hasNoWebsiteOpportunity ? "HIGH" : "MEDIUM",
    recurringPotential: "MEDIUM",
    mainOpportunity: p.hasNoWebsiteOpportunity
      ? "Website Build & Instant Lead Funnel"
      : "Website Redesign & Conversion Automation",
    leadSource: "Revlo AI Agent (Google Maps)",
    dealValue: p.hasNoWebsiteOpportunity ? "18000" : "15000",
    stageId: "stage_researching",
    outreachStatus: "READY",
    assignedToId: ctx.userId,
    createdById: ctx.userId,
    notes: `Discovered by Revlo AI Agent via Google Maps. Rating: ${p.googleRating} (${p.reviewCount} reviews). ${
      p.hasNoWebsiteOpportunity
        ? "⭐ HIGH PRIORITY: Established business with verified reviews but NO website presence!"
        : ""
    }`,
  });

  // Link founder contact if discovered
  if (p.founder) {
    await db.insert(contacts).values({
      id: crypto.randomUUID(),
      workspaceId: ctx.workspaceId,
      prospectId,
      firstName: p.founder.firstName,
      lastName: p.founder.lastName,
      fullName: p.founder.fullName,
      jobTitle: p.founder.jobTitle,
      email: p.founder.email || null,
      phone: p.founder.phone || p.phone,
      linkedInUrl: p.founder.linkedInUrl || null,
      preferredChannel: p.founder.email ? "EMAIL" : p.founder.linkedInUrl ? "LINKEDIN" : "PHONE",
      isDecisionMaker: true,
      verificationStatus: p.founder.verificationStatus || "VERIFIED",
      notes: `Discovered via Revlo Decision-Maker Scout (${p.founder.verificationStatus}).`,
    });
  }

  // Record activity
  await db.insert(activities).values({
    id: crypto.randomUUID(),
    workspaceId: ctx.workspaceId,
    prospectId,
    userId: ctx.userId,
    type: "RESEARCH",
    title: "Prospect Discovered by Revlo AI Agent",
    description: `Discovered from Google Maps with score ${scoreResult.score} (${scoreResult.grade}). Opportunity: ${
      p.hasNoWebsiteOpportunity ? "No Website (Gold Opportunity)" : "Modernization Target"
    }`,
  });

  safeRevalidatePath("/prospects");
  safeRevalidatePath("/automation");
  safeRevalidatePath("/dashboard");

  return { success: true, prospectId };
}

/**
 * Bulk ingestion of discovered prospects
 */
export async function bulkImportDiscoveredProspectsAction(
  prospectsList: DiscoveredProspect[],
  options?: { workspaceId?: string; userId?: string }
) {
  const results = [];
  for (const p of prospectsList) {
    try {
      const res = await importDiscoveredProspectAction(p, options);
      results.push(res);
    } catch (err) {
      console.error(`Failed to import prospect ${p.name}:`, err);
    }
  }

  safeRevalidatePath("/prospects");
  safeRevalidatePath("/automation");

  return {
    success: true,
    importedCount: results.length,
  };
}

/**
 * Returns summary stats for the Automation Hub dashboard
 */
export async function getAutomationStatsAction(options?: { workspaceId?: string }) {
  const ctx = await getAuthOrFallback(options);

  const [aiDiscoveredCountRes, noWebCountRes, pendingKwRes, totalKwRes] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(prospects)
      .where(
        and(
          eq(prospects.workspaceId, ctx.workspaceId),
          eq(prospects.leadSource, "Revlo AI Agent (Google Maps)")
        )
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(prospects)
      .where(
        and(
          eq(prospects.workspaceId, ctx.workspaceId),
          eq(prospects.hasNoWebsiteOpportunity, true)
        )
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(researchKeywords)
      .where(
        and(
          eq(researchKeywords.workspaceId, ctx.workspaceId),
          eq(researchKeywords.status, "PENDING")
        )
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(researchKeywords)
      .where(eq(researchKeywords.workspaceId, ctx.workspaceId)),
  ]);

  return {
    aiDiscoveredCount: Number(aiDiscoveredCountRes[0]?.count || 0),
    noWebOpportunityCount: Number(noWebCountRes[0]?.count || 0),
    pendingKeywordsCount: Number(pendingKwRes[0]?.count || 0),
    totalKeywordsCount: Number(totalKwRes[0]?.count || 0),
  };
}
