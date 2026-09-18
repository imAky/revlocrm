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
  modelId = "gemini-3.5-flash-lite",
  workspaceId,
}: {
  country?: "US" | "GB" | "CA" | "AU";
  niche?: string;
  count?: number;
  modelId?: string;
  workspaceId?: string;
}): Promise<GeneratedKeywordItem[]> {
  const countryConfig = TIER1_COUNTRIES[country] || TIER1_COUNTRIES.US;
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;

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

  // Determine provider based on modelId
  const isGroq = modelId.includes("groq") || modelId.includes("llama") || modelId.includes("deepseek");

  if (isGroq && groqApiKey) {
    try {
      candidateKeywords = await callGroqKeywordGenerator({
        countryConfig,
        niche,
        count: count + 10,
        modelId,
        apiKey: groqApiKey,
      });
    } catch (err) {
      console.warn("Groq API keyword call failed, falling back to Gemini/heuristic:", err);
      if (geminiApiKey) {
        candidateKeywords = await callGeminiWithCascade({
          countryConfig,
          niche,
          count: count + 10,
          preferredModel: "gemini-3.5-flash-lite",
          apiKey: geminiApiKey,
        });
      } else {
        candidateKeywords = generateFallbackKeywords(countryConfig, niche, count + 15);
      }
    }
  } else if (geminiApiKey) {
    candidateKeywords = await callGeminiWithCascade({
      countryConfig,
      niche,
      count: count + 10,
      preferredModel: modelId,
      apiKey: geminiApiKey,
    });
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
 * Executes Gemini generation with automatic multi-tier fallback
 * (gemini-3.5-flash-lite -> gemini-3.1-flash-lite -> gemini-3.8-flash -> gemini-2.5-flash -> gemini-2.0-flash)
 */
async function callGeminiWithCascade({
  countryConfig,
  niche,
  count,
  preferredModel = "gemini-3.5-flash-lite",
  apiKey,
}: {
  countryConfig: CountryConfig;
  niche?: string;
  count: number;
  preferredModel?: string;
  apiKey: string;
}): Promise<GeneratedKeywordItem[]> {
  const cascadeOrder = Array.from(
    new Set([
      preferredModel,
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
      "gemini-3.8-flash",
      "gemini-flash-lite-latest",
      "gemini-3.7-flash",
    ])
  );

  for (const model of cascadeOrder) {
    try {
      return await callGeminiKeywordGenerator({
        countryConfig,
        niche,
        count,
        modelId: model,
        apiKey,
      });
    } catch (err) {
      console.warn(`Gemini model ${model} attempt failed, trying next cascade:`, err);
    }
  }

  // Ultimate fallback to deterministic engine
  return generateFallbackKeywords(countryConfig, niche, count + 15);
}

/**
 * Calls Google Gemini API with structured JSON output
 */
async function callGeminiKeywordGenerator({
  countryConfig,
  niche,
  count,
  modelId = "gemini-2.0-flash",
  apiKey,
}: {
  countryConfig: CountryConfig;
  niche?: string;
  count: number;
  modelId?: string;
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

  // Normalize model code (support gemini-3.5-flash-lite, gemini-3.1-flash-lite, etc.)
  const normalizedModel = modelId.startsWith("gemini-") ? modelId : "gemini-3.5-flash-lite";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${normalizedModel}:generateContent?key=${apiKey}`,
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
 * Calls Groq API (Free Tier for Qwen 3.8 / Compound Mini)
 */
async function callGroqKeywordGenerator({
  countryConfig,
  niche,
  count,
  modelId,
  apiKey,
}: {
  countryConfig: CountryConfig;
  niche?: string;
  count: number;
  modelId: string;
  apiKey: string;
}): Promise<GeneratedKeywordItem[]> {
  const modelCode = modelId.includes("compound")
    ? "groq/compound-mini"
    : "qwen/qwen3.8-27b";

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
Only return raw JSON. No explanation, no markdown.`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelCode,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content;
  if (!rawText) throw new Error("Empty response from Groq API");

  let parsed = JSON.parse(rawText);
  // If wrapped in object like { "keywords": [...] }
  if (!Array.isArray(parsed) && Array.isArray(parsed.keywords)) {
    parsed = parsed.keywords;
  } else if (!Array.isArray(parsed) && typeof parsed === "object") {
    const firstArray = Object.values(parsed).find(Array.isArray);
    if (firstArray) parsed = firstArray;
  }

  if (!Array.isArray(parsed)) throw new Error("Expected array from Groq output");

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
