export interface ProspectScoringInput {
  // Google / Local
  googleRating?: number | string | null;
  reviewCount?: number | string | null;

  // Digital Presence & Modernization Opportunity
  websiteExists?: boolean | null;
  website?: string | null;
  websiteQuality?: string | null; // 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT' | 'MISSING'
  mobileUx?: string | null; // 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT'
  ctaQuality?: string | null; // 'POOR' | 'FAIR' | 'GOOD' | 'STRONG' | 'EXCELLENT'
  quoteBookingFlow?: string | null; // 'MISSING' | 'BASIC' | 'EXISTS'
  trustSignals?: string | null;
  seoVisibility?: string | null;
  speedScore?: number | string | null;

  // Commercial Qualification
  icpFit?: string | null; // 'HIGH' | 'MEDIUM' | 'LOW'
  abilityToPay?: string | null; // 'HIGH' | 'MEDIUM' | 'LOW'
  urgency?: string | null; // 'HIGH' | 'MEDIUM' | 'LOW'
  recurringPotential?: string | null; // 'HIGH' | 'MEDIUM' | 'LOW'
  buyingSignals?: string | null;

  // Outreach Readiness & Decision Maker Evidence
  hasDecisionMaker?: boolean | null;
  contactFirstName?: string | null;
  contactLastName?: string | null;
  contactTitle?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactLinkedIn?: string | null;
  phone?: string | null;
  email?: string | null;
  linkedInUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  googleProfileUrl?: string | null;
  primaryContact?: {
    firstName?: string;
    isDecisionMaker?: boolean;
    jobTitle?: string;
    email?: string;
    phone?: string;
    linkedInUrl?: string;
  } | null;
  contacts?: any[] | null;
  contactsCount?: number | null;
}

export interface ScoreResult {
  score: number; // 0 - 100
  grade: "A+" | "A" | "B" | "C" | "D";
  breakdown: {
    commercialScore: number; // max 35
    digitalScore: number; // max 30 (Modernization Opportunity Gap)
    localReputationScore: number; // max 20 (Business Legitimacy Proof)
    readinessScore: number; // max 15 (Outreach & Decision Maker)
  };
}

/**
 * Deterministic 100-point B2B ICP scoring formula.
 *
 * Designed for Agency Sales & Modernization Prospecting:
 * - High Commercial Budget + High Local Proof + Poor/Outdated Website = GOLDEN ICP TARGET (High Score)
 * - The bigger the digital gap (poor mobile UX, missing quote flow, bad website), the higher the agency pitch opportunity!
 */
export function calculateLeadScore(input: ProspectScoringInput): ScoreResult {
  let commercialScore = 0;
  let digitalScore = 0;
  let localReputationScore = 0;
  let readinessScore = 0;

  // ---------------------------------------------------------------------------
  // 1. Commercial Qualification & Budget Capacity (Max 35 Pts)
  // ---------------------------------------------------------------------------
  const fitMap: Record<string, number> = {
    HIGH: 10,
    MEDIUM: 6,
    LOW: 2,
  };
  commercialScore += fitMap[input.icpFit?.toUpperCase() || ""] || 5;

  const abilityMap: Record<string, number> = {
    HIGH: 10,
    MEDIUM: 6,
    LOW: 2,
  };
  commercialScore += abilityMap[input.abilityToPay?.toUpperCase() || ""] || 5;

  const urgencyMap: Record<string, number> = {
    HIGH: 6,
    MEDIUM: 4,
    LOW: 1,
  };
  commercialScore += urgencyMap[input.urgency?.toUpperCase() || ""] || 3;

  const recurringMap: Record<string, number> = {
    HIGH: 4,
    MEDIUM: 3,
    LOW: 1,
  };
  commercialScore += recurringMap[input.recurringPotential?.toUpperCase() || ""] || 2;

  // Active Buying Signals detected (Rebranding, new locations, hiring, expansion)
  if (input.buyingSignals && input.buyingSignals.trim().length >= 3) {
    commercialScore += 5;
  }
  commercialScore = Math.min(35, Math.max(0, commercialScore));

  // ---------------------------------------------------------------------------
  // 2. Digital Gap & Modernization Opportunity (Max 30 Pts)
  // (Worse website / outdated UX / missing booking = Higher Sales Pitch Opportunity!)
  // ---------------------------------------------------------------------------
  const webQual = (input.websiteQuality || "").toUpperCase();
  const mobUx = (input.mobileUx || "").toUpperCase();
  const ctaQual = (input.ctaQuality || "").toUpperCase();
  const bookFlow = (input.quoteBookingFlow || "").toUpperCase();

  // A. Website Quality Gap (Max 10 pts)
  if (input.websiteExists === false || webQual === "MISSING" || webQual === "POOR") {
    // Poor / Broken / Missing website is prime agency overhaul angle
    digitalScore += 10;
  } else if (webQual === "FAIR") {
    digitalScore += 7;
  } else if (webQual === "GOOD") {
    digitalScore += 4;
  } else if (webQual === "EXCELLENT") {
    // Already state-of-the-art, lower revamp opportunity
    digitalScore += 2;
  } else {
    digitalScore += 6; // Default baseline opportunity
  }

  // B. Mobile UX Responsiveness Gap (Max 8 pts)
  if (mobUx === "POOR") {
    digitalScore += 8;
  } else if (mobUx === "FAIR" || mobUx === "AVERAGE") {
    digitalScore += 5;
  } else if (mobUx === "GOOD") {
    digitalScore += 2;
  } else if (mobUx === "EXCELLENT") {
    digitalScore += 1;
  } else {
    digitalScore += 4;
  }

  // C. Booking / Instant Quote Flow Gap (Max 7 pts)
  if (bookFlow === "MISSING" || !bookFlow) {
    digitalScore += 7; // Huge automation & widget upsell angle
  } else if (bookFlow === "BASIC") {
    digitalScore += 4;
  } else if (bookFlow === "EXISTS") {
    digitalScore += 1;
  } else {
    digitalScore += 3;
  }

  // D. Call-To-Action & Trust Signal Gap (Max 5 pts)
  if (ctaQual === "POOR" || ctaQual === "WEAK") {
    digitalScore += 5;
  } else if (ctaQual === "FAIR" || ctaQual === "AVERAGE") {
    digitalScore += 3;
  } else if (ctaQual === "STRONG" || ctaQual === "GOOD" || ctaQual === "EXCELLENT") {
    digitalScore += 1;
  } else {
    digitalScore += 2;
  }

  digitalScore = Math.min(30, Math.max(0, digitalScore));

  // ---------------------------------------------------------------------------
  // 3. Local Google Maps Reputation / Real-World Cashflow Proof (Max 20 Pts)
  // (Verifies business is real, established, and generating revenue)
  // ---------------------------------------------------------------------------
  const rating = Number(input.googleRating) || 0;
  const reviews = Number(input.reviewCount) || 0;

  if (rating >= 4.5) localReputationScore += 10;
  else if (rating >= 4.0) localReputationScore += 7;
  else if (rating >= 3.0) localReputationScore += 4;
  else if (rating > 0) localReputationScore += 2;

  if (reviews >= 50) localReputationScore += 10;
  else if (reviews >= 20) localReputationScore += 7;
  else if (reviews >= 5) localReputationScore += 4;
  else if (reviews > 0) localReputationScore += 2;

  localReputationScore = Math.min(20, Math.max(0, localReputationScore));

  // ---------------------------------------------------------------------------
  // 4. Outreach Readiness & Decision Maker Availability (Max 15 Pts)
  // ---------------------------------------------------------------------------
  // Check whether a decision maker or key contact is identified
  const hasDM =
    input.hasDecisionMaker === true ||
    input.primaryContact?.isDecisionMaker === true ||
    !!input.contactFirstName ||
    !!input.contactTitle ||
    (typeof input.contactsCount === "number" && input.contactsCount > 0) ||
    (Array.isArray(input.contacts) && input.contacts.length > 0);

  if (hasDM) {
    readinessScore += 8;
  }

  // Check direct outreach contact info (phone / email)
  const hasPhone = !!(input.phone || input.contactPhone || input.primaryContact?.phone);
  const hasEmail = !!(input.email || input.contactEmail || input.primaryContact?.email);

  if (hasPhone && hasEmail) {
    readinessScore += 4;
  } else if (hasPhone || hasEmail) {
    readinessScore += 2;
  }

  // Check professional / social footprint
  const hasLinkedIn = !!(
    input.linkedInUrl ||
    input.contactLinkedIn ||
    input.primaryContact?.linkedInUrl
  );
  const hasOtherSocial = !!(
    input.facebookUrl ||
    input.instagramUrl ||
    input.googleProfileUrl ||
    input.seoVisibility
  );

  if (hasLinkedIn) {
    readinessScore += 3;
  } else if (hasOtherSocial) {
    readinessScore += 2;
  }

  readinessScore = Math.min(15, Math.max(0, readinessScore));

  // ---------------------------------------------------------------------------
  // Total Composite Lead Score & Grade Mapping
  // ---------------------------------------------------------------------------
  const totalScore = commercialScore + digitalScore + localReputationScore + readinessScore;

  let grade: "A+" | "A" | "B" | "C" | "D" = "C";
  if (totalScore >= 85) grade = "A+";
  else if (totalScore >= 70) grade = "A";
  else if (totalScore >= 50) grade = "B";
  else if (totalScore >= 30) grade = "C";
  else grade = "D";

  return {
    score: totalScore,
    grade,
    breakdown: {
      commercialScore,
      digitalScore,
      localReputationScore,
      readinessScore,
    },
  };
}
