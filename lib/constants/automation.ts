export interface GeneratedKeywordItem {
  keyword: string;
  niche: string;
  city: string;
  state: string;
  country: string;
  notes: string;
}

export interface CountryConfig {
  code: "US" | "GB" | "CA" | "AU";
  name: string;
  flag: string;
  currency: string;
  targetLocations: { city: string; state: string }[];
}

export const TIER1_COUNTRIES: Record<string, CountryConfig> = {
  US: {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    currency: "USD ($)",
    targetLocations: [
      { city: "Katy", state: "TX" },
      { city: "Scottsdale", state: "AZ" },
      { city: "Boca Raton", state: "FL" },
      { city: "The Woodlands", state: "TX" },
      { city: "Plano", state: "TX" },
      { city: "Bellevue", state: "WA" },
      { city: "Alpharetta", state: "GA" },
      { city: "Franklin", state: "TN" },
      { city: "Naples", state: "FL" },
      { city: "Irvine", state: "CA" },
      { city: "Cary", state: "NC" },
      { city: "Austin", state: "TX" },
      { city: "Denver", state: "CO" },
      { city: "Miami", state: "FL" },
    ],
  },
  GB: {
    code: "GB",
    name: "United Kingdom",
    flag: "🇬🇧",
    currency: "GBP (£)",
    targetLocations: [
      { city: "Richmond", state: "London" },
      { city: "Kensington", state: "London" },
      { city: "Guildford", state: "Surrey" },
      { city: "Harrogate", state: "North Yorkshire" },
      { city: "Bath", state: "Somerset" },
      { city: "Oxford", state: "Oxfordshire" },
      { city: "Cambridge", state: "Cambridgeshire" },
      { city: "Edinburgh", state: "Midlothian" },
      { city: "Alderley Edge", state: "Cheshire" },
      { city: "Bristol", state: "Bristol" },
    ],
  },
  CA: {
    code: "CA",
    name: "Canada",
    flag: "🇨🇦",
    currency: "CAD ($)",
    targetLocations: [
      { city: "Oakville", state: "ON" },
      { city: "West Vancouver", state: "BC" },
      { city: "Calgary", state: "AB" },
      { city: "Markham", state: "ON" },
      { city: "Burlington", state: "ON" },
      { city: "Richmond Hill", state: "ON" },
      { city: "Kelowna", state: "BC" },
      { city: "Vaughan", state: "ON" },
    ],
  },
  AU: {
    code: "AU",
    name: "Australia",
    flag: "🇦🇺",
    currency: "AUD ($)",
    targetLocations: [
      { city: "Brighton", state: "VIC" },
      { city: "Toorak", state: "VIC" },
      { city: "Mosman", state: "NSW" },
      { city: "Double Bay", state: "NSW" },
      { city: "Cottesloe", state: "WA" },
      { city: "Subiaco", state: "WA" },
      { city: "Paddington", state: "QLD" },
      { city: "Ascot", state: "QLD" },
    ],
  },
};

export const HIGH_TICKET_NICHES = [
  { name: "Commercial Roofing & Restoration", defaultSearch: "Commercial Roofing" },
  { name: "Luxury Custom Home Builders", defaultSearch: "Custom Home Builders" },
  { name: "Cosmetic & Orthodontic Dental Clinics", defaultSearch: "Cosmetic Dentistry" },
  { name: "Commercial HVAC & Refrigeration", defaultSearch: "Commercial HVAC Systems" },
  { name: "Medical Spas & Cosmetic Dermatology", defaultSearch: "Medical Spa & Aesthetics" },
  { name: "High-Volume Emergency Plumbing", defaultSearch: "Emergency Plumbing & Sewer" },
  { name: "Industrial Logistics & Freight Warehousing", defaultSearch: "Freight & Logistics Services" },
  { name: "Boutique Corporate & Estate Law", defaultSearch: "Corporate Law Firms" },
  { name: "High-End Architectural & Landscape Design", defaultSearch: "Landscape Architecture & Pools" },
];

export interface AiModelOption {
  id: string;
  name: string;
  provider: "google" | "groq";
  badge: string;
  description: string;
  isDefault?: boolean;
  freeTierLimit: string;
  modelCode: string;
}

export const AVAILABLE_AI_MODELS: AiModelOption[] = [
  {
    id: "gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash-Lite",
    provider: "google",
    badge: "Primary Default (500 RPD)",
    description: "Top recommended: 500 requests/day, 15 RPM, 250K TPM + 500 Map Grounding quota",
    isDefault: true,
    freeTierLimit: "500 req/day + 500 Map Grounding",
    modelCode: "gemini-3.5-flash-lite",
  },
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash-Lite",
    provider: "google",
    badge: "High Volume (500 RPD)",
    description: "Secondary powerhouse: 500 requests/day, 15 RPM, 250K TPM + 500 Map Grounding",
    freeTierLimit: "500 req/day + 500 Map Grounding",
    modelCode: "gemini-3.1-flash-lite",
  },
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    provider: "google",
    badge: "Advanced Reasoning",
    description: "Highest cognitive reasoning for intricate corporate ownership and executive discovery",
    freeTierLimit: "20 req/day • 250K TPM",
    modelCode: "gemini-3.8-flash",
  },
  {
    id: "gemini-3.7-flash",
    name: "Gemini 3.7 Flash",
    provider: "google",
    badge: "Next-Gen 3.7",
    description: "Next-gen multimodal reasoning model with 250K TPM throughput",
    freeTierLimit: "20 req/day • 250K TPM",
    modelCode: "gemini-3.7-flash",
  },
  {
    id: "gemini-flash-lite-latest",
    name: "Gemini Flash-Lite Latest",
    provider: "google",
    badge: "Auto-Updated",
    description: "Always targets Google's latest production Flash-Lite endpoint",
    freeTierLimit: "500 req/day",
    modelCode: "gemini-flash-lite-latest",
  },
  {
    id: "qwen-3.8-27b-groq",
    name: "Qwen 3.8 27B (via Groq)",
    provider: "groq",
    badge: "Ultra-Fast Groq LPU",
    description: "Blazing fast 400+ tokens/sec on Groq LPU hardware for instant batch generation",
    freeTierLimit: "Free API on console.groq.com",
    modelCode: "qwen/qwen3.8-27b",
  },
  {
    id: "compound-mini-groq",
    name: "Groq Compound Mini",
    provider: "groq",
    badge: "Groq LPU Engine",
    description: "Groq compound reasoning model for structured intelligence",
    freeTierLimit: "Free API on console.groq.com",
    modelCode: "groq/compound-mini",
  },
];

