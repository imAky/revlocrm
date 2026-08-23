export interface ProspectScoringInput {
  // Google / Local
  googleRating?: number | string | null;
  reviewCount?: number | null;

  // Digital Presence
  websiteExists?: boolean | null;
  websiteQuality?: string | null; // 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT'
  mobileUx?: string | null; // 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT'
  ctaQuality?: string | null; // 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT'
  quoteBookingFlow?: string | null;
  trustSignals?: string | null;
  seoVisibility?: string | null;

  // Qualification
  icpFit?: string | null; // 'HIGH' | 'MEDIUM' | 'LOW'
  abilityToPay?: string | null; // 'HIGH' | 'MEDIUM' | 'LOW'
  urgency?: string | null; // 'HIGH' | 'MEDIUM' | 'LOW'
  recurringPotential?: string | null; // 'HIGH' | 'MEDIUM' | 'LOW'
  buyingSignals?: string | null;
  hasDecisionMaker?: boolean;
}

export interface ScoreResult {
  score: number; // 0 - 100
  grade: "A+" | "A" | "B" | "C" | "D";
  breakdown: {
    digitalScore: number; // max 30
    commercialScore: number; // max 35
    localReputationScore: number; // max 20
    readinessScore: number; // max 15
  };
}

export function calculateLeadScore(input: ProspectScoringInput): ScoreResult {
  let digitalScore = 0;
  let commercialScore = 0;
  let localReputationScore = 0;
  let readinessScore = 0;

  // 1. Digital Presence (Max 30)
  if (input.websiteExists) {
    digitalScore += 5;

    const qualityMap: Record<string, number> = {
      EXCELLENT: 8,
      GOOD: 6,
      FAIR: 3,
      POOR: 1,
    };
    digitalScore += qualityMap[input.websiteQuality?.toUpperCase() || ""] || 2;
    digitalScore += qualityMap[input.mobileUx?.toUpperCase() || ""] || 2;
    digitalScore += qualityMap[input.ctaQuality?.toUpperCase() || ""] || 1;

    if (input.quoteBookingFlow && input.quoteBookingFlow.trim().length > 0) {
      digitalScore += 3;
    }
    if (input.trustSignals && input.trustSignals.trim().length > 0) {
      digitalScore += 3;
    }
  } else {
    // If no website, big opportunity but low digital baseline
    digitalScore += 4;
  }
  digitalScore = Math.min(30, Math.max(0, digitalScore));

  // 2. Commercial Qualification (Max 35)
  const fitMap: Record<string, number> = {
    HIGH: 10,
    MEDIUM: 6,
    LOW: 2,
  };
  commercialScore += fitMap[input.icpFit?.toUpperCase() || ""] || 4;
  commercialScore += fitMap[input.abilityToPay?.toUpperCase() || ""] || 4;
  commercialScore += fitMap[input.urgency?.toUpperCase() || ""] || 3;
  commercialScore += fitMap[input.recurringPotential?.toUpperCase() || ""] || 3;

  if (input.buyingSignals && input.buyingSignals.trim().length > 3) {
    commercialScore += 5;
  }
  commercialScore = Math.min(35, Math.max(0, commercialScore));

  // 3. Local / Google Reputation (Max 20)
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

  // 4. Outreach Readiness & Decision Maker (Max 15)
  if (input.hasDecisionMaker) {
    readinessScore += 10;
  }
  if (input.seoVisibility && input.seoVisibility.trim().length > 0) {
    readinessScore += 5;
  }
  readinessScore = Math.min(15, Math.max(0, readinessScore));

  const totalScore = digitalScore + commercialScore + localReputationScore + readinessScore;

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
      digitalScore,
      commercialScore,
      localReputationScore,
      readinessScore,
    },
  };
}
