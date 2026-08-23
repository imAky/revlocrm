export function normalizeDomain(url?: string | null): string {
  if (!url) return "";
  let clean = url.trim().toLowerCase();
  clean = clean.replace(/^(https?:\/\/)?(www\.)?/, "");
  clean = clean.replace(/\/.*$/, "");
  return clean;
}

export function normalizePhone(phone?: string | null): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  confidence: "HIGH" | "MEDIUM" | "LOW" | "NONE";
  reason?: string;
  matchedProspectId?: string;
  matchedProspectName?: string;
}

export function detectProspectDuplicate(
  candidate: {
    name: string;
    website?: string | null;
    phone?: string | null;
    city?: string | null;
  },
  existingList: {
    id: string;
    name: string;
    website?: string | null;
    phone?: string | null;
    city?: string | null;
  }[]
): DuplicateCheckResult {
  const candidateDomain = normalizeDomain(candidate.website);
  const candidatePhone = normalizePhone(candidate.phone);
  const candidateName = candidate.name.trim().toLowerCase();

  for (const existing of existingList) {
    const existingDomain = normalizeDomain(existing.website);
    const existingPhone = normalizePhone(existing.phone);
    const existingName = existing.name.trim().toLowerCase();

    // 1. High confidence: exact domain match
    if (candidateDomain && existingDomain && candidateDomain === existingDomain) {
      return {
        isDuplicate: true,
        confidence: "HIGH",
        reason: `Matches existing domain: ${existingDomain}`,
        matchedProspectId: existing.id,
        matchedProspectName: existing.name,
      };
    }

    // 2. High confidence: exact phone match (at least 7 digits)
    if (
      candidatePhone.length >= 7 &&
      existingPhone.length >= 7 &&
      candidatePhone === existingPhone
    ) {
      return {
        isDuplicate: true,
        confidence: "HIGH",
        reason: `Matches existing phone number: ${existing.phone}`,
        matchedProspectId: existing.id,
        matchedProspectName: existing.name,
      };
    }

    // 3. Medium confidence: Exact name and same city
    if (
      candidateName === existingName &&
      candidate.city &&
      existing.city &&
      candidate.city.toLowerCase() === existing.city.toLowerCase()
    ) {
      return {
        isDuplicate: true,
        confidence: "MEDIUM",
        reason: `Exact company name in the same city (${candidate.city})`,
        matchedProspectId: existing.id,
        matchedProspectName: existing.name,
      };
    }

    // 4. Low confidence: Exact name
    if (candidateName === existingName) {
      return {
        isDuplicate: true,
        confidence: "LOW",
        reason: `Identical company name`,
        matchedProspectId: existing.id,
        matchedProspectName: existing.name,
      };
    }
  }

  return {
    isDuplicate: false,
    confidence: "NONE",
  };
}
