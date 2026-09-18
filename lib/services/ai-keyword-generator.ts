import { db } from "@/lib/db";
import { researchKeywords } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { normalizeKeywordString } from "@/lib/utils/research";
import {
  GeneratedKeywordItem,
  CountryConfig,
  TIER1_COUNTRIES,
  ALL_TARGET_COUNTRIES,
  HIGH_TICKET_NICHES,
  HighTicketNicheOption,
} from "@/lib/constants/automation";

export type { GeneratedKeywordItem, CountryConfig };
export { TIER1_COUNTRIES, ALL_TARGET_COUNTRIES, HIGH_TICKET_NICHES };

/**
 * Generates high-ticket, lucrative keywords for a specific country, state, city, and niche.
 * Uses Google Gemini API (Free Tier) with automated cascade to Groq and deterministic fallback.
 */
export async function generateHighTicketKeywords({
  country = "US",
  state,
  city,
  niche,
  count = 12,
  modelId = "gemini-3.5-flash-lite",
  customCountryName,
  workspaceId,
}: {
  country?: string;
  state?: string;
  city?: string;
  niche?: string;
  count?: number;
  modelId?: string;
  customCountryName?: string;
  workspaceId?: string;
}): Promise<GeneratedKeywordItem[]> {
  // Resolve country config
  const countryCode = country.toUpperCase();
  const countryConfig: CountryConfig =
    ALL_TARGET_COUNTRIES[countryCode] || {
      code: countryCode || "US",
      name: customCountryName || country || "United States",
      flag: "🌍",
      currency: "USD ($)",
      states: state ? [{ code: state, name: state, cities: city ? [{ name: city }] : [] }] : [],
      targetLocations: [{ city: city || "Metro Commercial Hub", state: state || "" }],
    };

  // Resolve default state if not provided
  const targetState =
    state ||
    countryConfig.states.find((s) => s.isTopDefault)?.name ||
    countryConfig.states[0]?.name ||
    "";

  // Resolve default niche if not provided or ALL
  const targetNiche =
    niche && niche !== "ALL"
      ? niche
      : HIGH_TICKET_NICHES[0].name; // Default: Commercial Roofing & Industrial Restoration

  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;

  // Retrieve already existing keywords in this workspace for 100% deduplication
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
  const isGroq = modelId.includes("groq") || modelId.includes("qwen") || modelId.includes("compound");

  if (isGroq && groqApiKey) {
    try {
      candidateKeywords = await callGroqKeywordGenerator({
        countryConfig,
        state: targetState,
        city,
        niche: targetNiche,
        count: count + 8,
        modelId,
        apiKey: groqApiKey,
      });
    } catch (err) {
      console.warn("Groq API keyword call failed, cascading to Gemini:", err);
      if (geminiApiKey) {
        candidateKeywords = await callGeminiWithCascade({
          countryConfig,
          state: targetState,
          city,
          niche: targetNiche,
          count: count + 8,
          preferredModel: "gemini-3.5-flash-lite",
          apiKey: geminiApiKey,
        });
      } else {
        candidateKeywords = generateFallbackKeywords({
          countryConfig,
          state: targetState,
          city,
          targetNiche,
          count: count + 12,
        });
      }
    }
  } else if (geminiApiKey) {
    candidateKeywords = await callGeminiWithCascade({
      countryConfig,
      state: targetState,
      city,
      niche: targetNiche,
      count: count + 8,
      preferredModel: modelId,
      apiKey: geminiApiKey,
    });
  } else {
    candidateKeywords = generateFallbackKeywords({
      countryConfig,
      state: targetState,
      city,
      targetNiche,
      count: count + 12,
    });
  }

  // Filter out any duplicates
  const freshKeywords = candidateKeywords.filter(
    (item) => !existingSet.has(normalizeKeywordString(item.keyword))
  );

  return freshKeywords.slice(0, count);
}

/**
 * Executes Gemini generation with automatic multi-tier fallback
 */
async function callGeminiWithCascade({
  countryConfig,
  state,
  city,
  niche,
  count,
  preferredModel = "gemini-3.5-flash-lite",
  apiKey,
}: {
  countryConfig: CountryConfig;
  state?: string;
  city?: string;
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
        state,
        city,
        niche,
        count,
        modelId: model,
        apiKey,
      });
    } catch (err) {
      console.warn(`Gemini model ${model} attempt failed, trying next cascade:`, err);
    }
  }

  // Fallback to deterministic matrix engine
  return generateFallbackKeywords({
    countryConfig,
    state,
    city,
    targetNiche: niche,
    count: count + 10,
  });
}

/**
 * Builds the structured B2B territory search prompt
 */
function buildTerritoryPrompt({
  countryConfig,
  state,
  city,
  niche,
  count,
}: {
  countryConfig: CountryConfig;
  state?: string;
  city?: string;
  niche?: string;
  count: number;
}): string {
  const targetStateObj = countryConfig.states.find(
    (s) => s.code === state || s.name.toLowerCase() === state?.toLowerCase()
  );
  const stateLabel = targetStateObj?.name || state || countryConfig.name;
  const stateCode = targetStateObj?.code || state || countryConfig.code;

  const topCityList = targetStateObj?.cities.map((c) => c.name).slice(0, 8) || [];
  const cityInstruction =
    city && city !== "ALL"
      ? `Focus specifically on the city of "${city}" (${stateCode}) and its immediate affluent commercial corridor.`
      : topCityList.length > 0
      ? `Distribute the search queries across the highest-income commercial hubs in ${stateLabel}: ${topCityList.join(", ")}.`
      : `Target the top commercial districts and affluent economic centers in ${stateLabel}.`;

  return `You are an elite B2B sales development strategist and Google Maps search matrix architect for RevloCRM.
Generate ${count} high-ticket, high-intent Google Maps search queries targeting lucrative commercial service contractors in ${countryConfig.name} (${countryConfig.flag}).

TARGET PARAMETERS:
- Industry / Niche: "${niche || "Commercial Roofing & Industrial Restoration"}"
- Target State / Region: "${stateLabel}" (${stateCode})
- Geography Strategy: ${cityInstruction}

RULES:
1. Each query must be formulated exactly as commercial property managers, business owners, and corporate clients search on Google Maps.
2. Structure variations like:
   - "[Specific Commercial Service] in [City], [State Code]"
   - "[High-Ticket Niche Contractors] [City] [State Code]"
   - "Commercial [Niche Specialty] [City]"
3. Only choose wealthy, high-economic density commercial cities and suburbs. Never choose low-density or rural areas.
4. Return raw JSON array of objects.

JSON STRUCTURE:
[
  {
    "keyword": "Commercial Roofing in Katy, TX",
    "niche": "${niche || "Commercial Roofing & Industrial Restoration"}",
    "city": "Katy",
    "state": "${stateCode}",
    "country": "${countryConfig.code}",
    "notes": "Affluent Houston-metro commercial hub with high roof asset replacement demand."
  }
]
Only return raw JSON without markdown code fences.`;
}

/**
 * Calls Google Gemini API with structured JSON output
 */
async function callGeminiKeywordGenerator({
  countryConfig,
  state,
  city,
  niche,
  count,
  modelId = "gemini-3.5-flash-lite",
  apiKey,
}: {
  countryConfig: CountryConfig;
  state?: string;
  city?: string;
  niche?: string;
  count: number;
  modelId?: string;
  apiKey: string;
}): Promise<GeneratedKeywordItem[]> {
  const prompt = buildTerritoryPrompt({ countryConfig, state, city, niche, count });
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
    city: String(item.city || city || "Commercial Hub"),
    state: String(item.state || state || countryConfig.code),
    country: countryConfig.code,
    notes: String(item.notes || `Tier-1 ${countryConfig.name} target for Revlo Lead Scout`),
  }));
}

/**
 * Calls Groq API (Free Tier for Qwen 3.8 / Compound Mini)
 */
async function callGroqKeywordGenerator({
  countryConfig,
  state,
  city,
  niche,
  count,
  modelId,
  apiKey,
}: {
  countryConfig: CountryConfig;
  state?: string;
  city?: string;
  niche?: string;
  count: number;
  modelId: string;
  apiKey: string;
}): Promise<GeneratedKeywordItem[]> {
  const modelCode = modelId.includes("compound") ? "groq/compound-mini" : "qwen/qwen3.8-27b";
  const prompt = buildTerritoryPrompt({ countryConfig, state, city, niche, count });

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
    city: String(item.city || city || "Commercial Hub"),
    state: String(item.state || state || countryConfig.code),
    country: countryConfig.code,
    notes: String(item.notes || `Tier-1 ${countryConfig.name} target for Revlo Lead Scout`),
  }));
}

/**
 * Deterministic Combinatorial Matrix Generator (Zero-API Fallback)
 */
function generateFallbackKeywords({
  countryConfig,
  state,
  city,
  targetNiche,
  count = 15,
}: {
  countryConfig: CountryConfig;
  state?: string;
  city?: string;
  targetNiche?: string;
  count?: number;
}): GeneratedKeywordItem[] {
  const nicheObj =
    HIGH_TICKET_NICHES.find((n) => n.name === targetNiche) || HIGH_TICKET_NICHES[0];

  const stateObj =
    countryConfig.states.find(
      (s) => s.code === state || s.name.toLowerCase() === state?.toLowerCase()
    ) || countryConfig.states[0];

  const stateCode = stateObj?.code || state || countryConfig.code;

  // Cities to rotate through
  const cities =
    city && city !== "ALL"
      ? [city]
      : stateObj?.cities?.length > 0
      ? stateObj.cities.map((c) => c.name)
      : countryConfig.targetLocations.map((l) => l.city);

  const variations = [
    `${nicheObj.defaultSearch} in {city}, {state}`,
    `Commercial ${nicheObj.name} in {city} {state}`,
    `${nicheObj.defaultSearch} Contractors {city} {state}`,
    `Top Commercial ${nicheObj.name} {city}`,
    `Industrial ${nicheObj.defaultSearch} {city}, {state}`,
  ];

  const results: GeneratedKeywordItem[] = [];

  for (let i = 0; i < count; i++) {
    const c = cities[i % cities.length];
    const template = variations[i % variations.length];
    const keyword = template.replace("{city}", c).replace("{state}", stateCode);

    results.push({
      keyword,
      niche: nicheObj.name,
      city: c,
      state: stateCode,
      country: countryConfig.code,
      notes: `Targeting affluent commercial clients in ${c}, ${stateCode}. High average contract values.`,
    });
  }

  return results;
}
