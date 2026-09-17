import { db } from "@/lib/db";
import { researchKeywords } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { normalizeKeywordString } from "@/lib/utils/research";
import {
  GeneratedKeywordItem,
  CountryConfig,
  TIER1_COUNTRIES,
  HIGH_TICKET_NICHES,
} from "@/lib/constants/automation";

export type { GeneratedKeywordItem, CountryConfig };
export { TIER1_COUNTRIES, HIGH_TICKET_NICHES };

/**
 * Generates high-ticket, lucrative keywords for a specific country and niche.
 * Uses Google Gemini API (Free Tier) when GEMINI_API_KEY is present,
 * with an intelligent location-aware deterministic fallback engine.
 */
export async function generateHighTicketKeywords({
  country = "US",
  niche,
  count = 12,
  workspaceId,
}: {
  country?: "US" | "GB" | "CA" | "AU";
  niche?: string;
  count?: number;
  workspaceId?: string;
}): Promise<GeneratedKeywordItem[]> {
  const countryConfig = TIER1_COUNTRIES[country] || TIER1_COUNTRIES.US;
  const apiKey = process.env.GEMINI_API_KEY;

  // Retrieve already existing keywords in this workspace to guarantee 100% freshness/deduplication
  const existingSet = new Set<string>();
  if (workspaceId) {
    const existingRecords = await db
      .select({ normalized: researchKeywords.normalizedKeyword })
      .from(researchKeywords)
      .where(eq(researchKeywords.workspaceId, workspaceId));

    for (const r of existingRecords) {
      existingSet.add(r.normalized);
    }
  }

  let candidateKeywords: GeneratedKeywordItem[] = [];

  if (apiKey) {
    try {
      candidateKeywords = await callGeminiKeywordGenerator({
        countryConfig,
        niche,
        count: count + 10,
        apiKey,
      });
    } catch (err) {
      console.warn("Gemini API keyword call failed, using intelligent fallback engine:", err);
      candidateKeywords = generateFallbackKeywords(countryConfig, niche, count + 15);
    }
  } else {
    candidateKeywords = generateFallbackKeywords(countryConfig, niche, count + 15);
  }

  // Filter out any candidates that already exist in workspace
  const freshKeywords = candidateKeywords.filter(
    (item) => !existingSet.has(normalizeKeywordString(item.keyword))
  );

  return freshKeywords.slice(0, count);
}

/**
 * Calls Google Gemini (Free Tier) with structured JSON generation
 */
async function callGeminiKeywordGenerator({
  countryConfig,
  niche,
  count,
  apiKey,
}: {
  countryConfig: CountryConfig;
  niche?: string;
  count: number;
  apiKey: string;
}): Promise<GeneratedKeywordItem[]> {
  const prompt = `You are an elite B2B sales development strategist for RevloCRM.
Generate ${count} high-ticket, lucrative Google Maps search queries targeting affluent, high-growth commercial markets in ${countryConfig.name} (${countryConfig.flag}).
${niche ? `Target Niche: "${niche}"` : "Target high-ticket services like Commercial Roofing, Luxury Remodeling, Cosmetic Dentistry, Commercial HVAC, Medical Spas, High-End Plumbing."}

Return a valid JSON array of objects with the exact structure:
[
  {
    "keyword": "Commercial Roofing in Katy, Texas",
    "niche": "Commercial Roofing & Restoration",
    "city": "Katy",
    "state": "TX",
    "country": "${countryConfig.code}",
    "notes": "High-revenue suburb with frequent storm damage demand. Prime modernization target."
  }
]
Only return raw JSON without markdown code fences.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) throw new Error("Empty response from Gemini API");

  const parsed = JSON.parse(textOutput);
  if (!Array.isArray(parsed)) throw new Error("Expected array from Gemini API");

  return parsed.map((item: any) => ({
    keyword: String(item.keyword || "").trim(),
    niche: String(item.niche || niche || "High-Ticket Commercial Services"),
    city: String(item.city || countryConfig.targetLocations[0].city),
    state: String(item.state || countryConfig.targetLocations[0].state),
    country: countryConfig.code,
    notes: String(item.notes || `Tier-1 ${countryConfig.name} target for Revlo Lead Scout`),
  }));
}

/**
 * Intelligent location-aware fallback generator (guarantees 100% operation without API key)
 */
function generateFallbackKeywords(
  countryConfig: CountryConfig,
  targetNiche?: string,
  count: number = 15
): GeneratedKeywordItem[] {
  const niches = targetNiche
    ? [{ name: targetNiche, defaultSearch: targetNiche }]
    : HIGH_TICKET_NICHES;

  const results: GeneratedKeywordItem[] = [];

  for (let i = 0; i < count; i++) {
    const loc = countryConfig.targetLocations[i % countryConfig.targetLocations.length];
    const n = niches[i % niches.length];

    const stateStr = loc.state ? `, ${loc.state}` : "";
    const keyword = `${n.defaultSearch} in ${loc.city}${stateStr}`;

    results.push({
      keyword,
      niche: n.name,
      city: loc.city,
      state: loc.state,
      country: countryConfig.code,
      notes: `Targeting affluent commercial clients in ${loc.city}${stateStr}, ${countryConfig.name}. High average contract values.`,
    });
  }

  return results;
}
