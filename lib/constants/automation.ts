export interface GeneratedKeywordItem {
  keyword: string;
  niche: string;
  city: string;
  state: string;
  country: string;
  notes: string;
}

export interface CityOption {
  name: string;
  isTopDefault?: boolean;
  type?: "metro" | "affluent_suburb" | "commercial_hub";
}

export interface StateOption {
  code: string;
  name: string;
  isTopDefault?: boolean;
  cities: CityOption[];
}

export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  currency: string;
  isPrimaryTier1?: boolean;
  states: StateOption[];
  targetLocations: { city: string; state: string }[];
}

export const TIER1_COUNTRIES: Record<string, CountryConfig> = {
  US: {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    currency: "USD ($)",
    isPrimaryTier1: true,
    states: [
      {
        code: "TX",
        name: "Texas",
        isTopDefault: true,
        cities: [
          { name: "Katy", isTopDefault: true, type: "affluent_suburb" },
          { name: "The Woodlands", type: "affluent_suburb" },
          { name: "Plano", type: "commercial_hub" },
          { name: "Frisco", type: "affluent_suburb" },
          { name: "Austin", type: "metro" },
          { name: "Round Rock", type: "commercial_hub" },
          { name: "Houston", type: "metro" },
          { name: "Fort Worth", type: "metro" },
          { name: "Arlington", type: "commercial_hub" },
          { name: "Southlake", type: "affluent_suburb" },
          { name: "San Antonio", type: "metro" },
        ],
      },
      {
        code: "FL",
        name: "Florida",
        cities: [
          { name: "Boca Raton", isTopDefault: true, type: "affluent_suburb" },
          { name: "Naples", type: "affluent_suburb" },
          { name: "Miami", type: "metro" },
          { name: "Fort Lauderdale", type: "commercial_hub" },
          { name: "Tampa", type: "metro" },
          { name: "Orlando", type: "metro" },
          { name: "West Palm Beach", type: "commercial_hub" },
          { name: "Coral Gables", type: "affluent_suburb" },
        ],
      },
      {
        code: "CA",
        name: "California",
        cities: [
          { name: "Irvine", isTopDefault: true, type: "commercial_hub" },
          { name: "Newport Beach", type: "affluent_suburb" },
          { name: "Pasadena", type: "affluent_suburb" },
          { name: "San Jose", type: "metro" },
          { name: "San Diego", type: "metro" },
          { name: "Palo Alto", type: "affluent_suburb" },
          { name: "Los Angeles", type: "metro" },
          { name: "Walnut Creek", type: "commercial_hub" },
        ],
      },
      {
        code: "GA",
        name: "Georgia",
        cities: [
          { name: "Alpharetta", isTopDefault: true, type: "commercial_hub" },
          { name: "Sandy Springs", type: "commercial_hub" },
          { name: "Milton", type: "affluent_suburb" },
          { name: "Atlanta", type: "metro" },
          { name: "Johns Creek", type: "affluent_suburb" },
        ],
      },
      {
        code: "NC",
        name: "North Carolina",
        cities: [
          { name: "Cary", isTopDefault: true, type: "affluent_suburb" },
          { name: "Charlotte", type: "metro" },
          { name: "Raleigh", type: "metro" },
          { name: "Huntersville", type: "affluent_suburb" },
        ],
      },
      {
        code: "TN",
        name: "Tennessee",
        cities: [
          { name: "Franklin", isTopDefault: true, type: "affluent_suburb" },
          { name: "Brentwood", type: "affluent_suburb" },
          { name: "Nashville", type: "metro" },
        ],
      },
      {
        code: "AZ",
        name: "Arizona",
        cities: [
          { name: "Scottsdale", isTopDefault: true, type: "affluent_suburb" },
          { name: "Paradise Valley", type: "affluent_suburb" },
          { name: "Phoenix", type: "metro" },
          { name: "Chandler", type: "commercial_hub" },
        ],
      },
      {
        code: "WA",
        name: "Washington",
        cities: [
          { name: "Bellevue", isTopDefault: true, type: "commercial_hub" },
          { name: "Kirkland", type: "affluent_suburb" },
          { name: "Seattle", type: "metro" },
          { name: "Redmond", type: "commercial_hub" },
        ],
      },
      {
        code: "CO",
        name: "Colorado",
        cities: [
          { name: "Denver", isTopDefault: true, type: "metro" },
          { name: "Boulder", type: "affluent_suburb" },
          { name: "Highlands Ranch", type: "affluent_suburb" },
        ],
      },
      {
        code: "NY",
        name: "New York",
        cities: [
          { name: "Manhattan", isTopDefault: true, type: "metro" },
          { name: "White Plains", type: "commercial_hub" },
          { name: "Garden City", type: "affluent_suburb" },
          { name: "Brooklyn", type: "metro" },
        ],
      },
      {
        code: "IL",
        name: "Illinois",
        cities: [
          { name: "Naperville", isTopDefault: true, type: "affluent_suburb" },
          { name: "Chicago", type: "metro" },
          { name: "Schaumburg", type: "commercial_hub" },
        ],
      },
    ],
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
    isPrimaryTier1: true,
    states: [
      {
        code: "London",
        name: "Greater London",
        isTopDefault: true,
        cities: [
          { name: "Richmond", isTopDefault: true, type: "affluent_suburb" },
          { name: "Kensington", type: "affluent_suburb" },
          { name: "Canary Wharf", type: "commercial_hub" },
          { name: "City of London", type: "commercial_hub" },
          { name: "Wimbledon", type: "affluent_suburb" },
        ],
      },
      {
        code: "SouthEast",
        name: "South East (Surrey / Berkshire)",
        cities: [
          { name: "Guildford", isTopDefault: true, type: "affluent_suburb" },
          { name: "Ascot", type: "affluent_suburb" },
          { name: "Windsor", type: "affluent_suburb" },
          { name: "Reading", type: "commercial_hub" },
        ],
      },
      {
        code: "NorthWest",
        name: "North West (Cheshire / Manchester)",
        cities: [
          { name: "Alderley Edge", isTopDefault: true, type: "affluent_suburb" },
          { name: "Manchester", type: "metro" },
          { name: "Altrincham", type: "affluent_suburb" },
          { name: "Wilmslow", type: "affluent_suburb" },
        ],
      },
      {
        code: "Yorkshire",
        name: "Yorkshire (Harrogate / Leeds)",
        cities: [
          { name: "Harrogate", isTopDefault: true, type: "affluent_suburb" },
          { name: "Leeds", type: "metro" },
          { name: "York", type: "commercial_hub" },
        ],
      },
      {
        code: "SouthWest",
        name: "South West (Somerset / Bristol)",
        cities: [
          { name: "Bath", isTopDefault: true, type: "affluent_suburb" },
          { name: "Bristol", type: "metro" },
          { name: "Cheltenham", type: "affluent_suburb" },
        ],
      },
    ],
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
    isPrimaryTier1: true,
    states: [
      {
        code: "ON",
        name: "Ontario (GTA & Golden Horseshoe)",
        isTopDefault: true,
        cities: [
          { name: "Oakville", isTopDefault: true, type: "affluent_suburb" },
          { name: "Burlington", type: "affluent_suburb" },
          { name: "Markham", type: "commercial_hub" },
          { name: "Richmond Hill", type: "affluent_suburb" },
          { name: "Toronto", type: "metro" },
          { name: "Vaughan", type: "commercial_hub" },
          { name: "Mississauga", type: "commercial_hub" },
        ],
      },
      {
        code: "BC",
        name: "British Columbia",
        cities: [
          { name: "West Vancouver", isTopDefault: true, type: "affluent_suburb" },
          { name: "Vancouver", type: "metro" },
          { name: "Richmond", type: "commercial_hub" },
          { name: "Kelowna", type: "affluent_suburb" },
        ],
      },
      {
        code: "AB",
        name: "Alberta",
        cities: [
          { name: "Calgary", isTopDefault: true, type: "metro" },
          { name: "Edmonton", type: "metro" },
        ],
      },
    ],
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
    isPrimaryTier1: true,
    states: [
      {
        code: "NSW",
        name: "New South Wales (Sydney Metro)",
        isTopDefault: true,
        cities: [
          { name: "Mosman", isTopDefault: true, type: "affluent_suburb" },
          { name: "Double Bay", type: "affluent_suburb" },
          { name: "Sydney CBD", type: "commercial_hub" },
          { name: "North Sydney", type: "commercial_hub" },
          { name: "Chatswood", type: "commercial_hub" },
        ],
      },
      {
        code: "VIC",
        name: "Victoria (Melbourne Metro)",
        cities: [
          { name: "Toorak", isTopDefault: true, type: "affluent_suburb" },
          { name: "Brighton", type: "affluent_suburb" },
          { name: "Melbourne CBD", type: "commercial_hub" },
          { name: "South Yarra", type: "affluent_suburb" },
        ],
      },
      {
        code: "QLD",
        name: "Queensland (Brisbane & Gold Coast)",
        cities: [
          { name: "Paddington", isTopDefault: true, type: "affluent_suburb" },
          { name: "Ascot", type: "affluent_suburb" },
          { name: "Brisbane CBD", type: "commercial_hub" },
          { name: "Gold Coast", type: "metro" },
        ],
      },
      {
        code: "WA",
        name: "Western Australia (Perth Metro)",
        cities: [
          { name: "Cottesloe", isTopDefault: true, type: "affluent_suburb" },
          { name: "Subiaco", type: "commercial_hub" },
          { name: "Perth CBD", type: "commercial_hub" },
        ],
      },
    ],
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

export const EXTENDED_TIER1_COUNTRIES: Record<string, CountryConfig> = {
  DE: {
    code: "DE",
    name: "Germany",
    flag: "🇩🇪",
    currency: "EUR (€)",
    states: [
      {
        code: "BY",
        name: "Bavaria (Bayern)",
        isTopDefault: true,
        cities: [
          { name: "Munich", isTopDefault: true, type: "metro" },
          { name: "Nuremberg", type: "commercial_hub" },
          { name: "Starnberg", type: "affluent_suburb" },
        ],
      },
      {
        code: "HE",
        name: "Hesse (Frankfurt)",
        cities: [
          { name: "Frankfurt", isTopDefault: true, type: "commercial_hub" },
          { name: "Wiesbaden", type: "metro" },
          { name: "Bad Homburg", type: "affluent_suburb" },
        ],
      },
      {
        code: "NW",
        name: "North Rhine-Westphalia",
        cities: [
          { name: "Düsseldorf", isTopDefault: true, type: "commercial_hub" },
          { name: "Cologne", type: "metro" },
        ],
      },
    ],
    targetLocations: [
      { city: "Munich", state: "BY" },
      { city: "Frankfurt", state: "HE" },
      { city: "Düsseldorf", state: "NW" },
    ],
  },
  FR: {
    code: "FR",
    name: "France",
    flag: "🇫🇷",
    currency: "EUR (€)",
    states: [
      {
        code: "IDF",
        name: "Île-de-France (Paris Region)",
        isTopDefault: true,
        cities: [
          { name: "Paris", isTopDefault: true, type: "metro" },
          { name: "Neuilly-sur-Seine", type: "affluent_suburb" },
          { name: "Boulogne-Billancourt", type: "commercial_hub" },
        ],
      },
      {
        code: "PACA",
        name: "Provence-Alpes-Côte d'Azur",
        cities: [
          { name: "Cannes", isTopDefault: true, type: "affluent_suburb" },
          { name: "Nice", type: "metro" },
          { name: "Aix-en-Provence", type: "affluent_suburb" },
        ],
      },
    ],
    targetLocations: [
      { city: "Paris", state: "IDF" },
      { city: "Neuilly-sur-Seine", state: "IDF" },
      { city: "Cannes", state: "PACA" },
    ],
  },
  AE: {
    code: "AE",
    name: "United Arab Emirates",
    flag: "🇦🇪",
    currency: "AED (د.إ)",
    states: [
      {
        code: "DXB",
        name: "Dubai",
        isTopDefault: true,
        cities: [
          { name: "Downtown Dubai", isTopDefault: true, type: "commercial_hub" },
          { name: "Business Bay", type: "commercial_hub" },
          { name: "Dubai Marina", type: "affluent_suburb" },
          { name: "Jumeirah", type: "affluent_suburb" },
        ],
      },
      {
        code: "AUH",
        name: "Abu Dhabi",
        cities: [
          { name: "Al Maryah Island", isTopDefault: true, type: "commercial_hub" },
          { name: "Al Reem Island", type: "affluent_suburb" },
        ],
      },
    ],
    targetLocations: [
      { city: "Downtown Dubai", state: "DXB" },
      { city: "Business Bay", state: "DXB" },
      { city: "Al Maryah Island", state: "AUH" },
    ],
  },
  SG: {
    code: "SG",
    name: "Singapore",
    flag: "🇸🇬",
    currency: "SGD ($)",
    states: [
      {
        code: "CR",
        name: "Central Region",
        isTopDefault: true,
        cities: [
          { name: "Raffles Place", isTopDefault: true, type: "commercial_hub" },
          { name: "Marina Bay", type: "commercial_hub" },
          { name: "Orchard", type: "affluent_suburb" },
          { name: "Tanjong Pagar", type: "commercial_hub" },
        ],
      },
    ],
    targetLocations: [
      { city: "Raffles Place", state: "Central" },
      { city: "Marina Bay", state: "Central" },
    ],
  },
  IE: {
    code: "IE",
    name: "Ireland",
    flag: "🇮🇪",
    currency: "EUR (€)",
    states: [
      {
        code: "D",
        name: "County Dublin",
        isTopDefault: true,
        cities: [
          { name: "Dublin 2", isTopDefault: true, type: "commercial_hub" },
          { name: "Ballsbridge", type: "affluent_suburb" },
          { name: "Sandyford", type: "commercial_hub" },
        ],
      },
    ],
    targetLocations: [{ city: "Dublin 2", state: "Dublin" }],
  },
  NZ: {
    code: "NZ",
    name: "New Zealand",
    flag: "🇳🇿",
    currency: "NZD ($)",
    states: [
      {
        code: "AK",
        name: "Auckland Region",
        isTopDefault: true,
        cities: [
          { name: "Auckland CBD", isTopDefault: true, type: "commercial_hub" },
          { name: "Ponsonby", type: "affluent_suburb" },
          { name: "Remuera", type: "affluent_suburb" },
          { name: "Takapuna", type: "commercial_hub" },
        ],
      },
    ],
    targetLocations: [{ city: "Auckland CBD", state: "AK" }],
  },
  CH: {
    code: "CH",
    name: "Switzerland",
    flag: "🇨🇭",
    currency: "CHF (Fr.)",
    states: [
      {
        code: "ZH",
        name: "Canton of Zurich",
        isTopDefault: true,
        cities: [
          { name: "Zurich", isTopDefault: true, type: "commercial_hub" },
          { name: "Winterthur", type: "commercial_hub" },
        ],
      },
      {
        code: "GE",
        name: "Canton of Geneva",
        cities: [{ name: "Geneva", isTopDefault: true, type: "commercial_hub" }],
      },
    ],
    targetLocations: [
      { city: "Zurich", state: "ZH" },
      { city: "Geneva", state: "GE" },
    ],
  },
  NL: {
    code: "NL",
    name: "Netherlands",
    flag: "🇳🇱",
    currency: "EUR (€)",
    states: [
      {
        code: "NH",
        name: "North Holland (Amsterdam)",
        isTopDefault: true,
        cities: [
          { name: "Amsterdam Zuidas", isTopDefault: true, type: "commercial_hub" },
          { name: "Haarlem", type: "affluent_suburb" },
        ],
      },
      {
        code: "ZH",
        name: "South Holland (Rotterdam / The Hague)",
        cities: [
          { name: "Rotterdam", isTopDefault: true, type: "commercial_hub" },
          { name: "The Hague", type: "metro" },
        ],
      },
    ],
    targetLocations: [
      { city: "Amsterdam", state: "NH" },
      { city: "Rotterdam", state: "ZH" },
    ],
  },
};

export const ALL_TARGET_COUNTRIES: Record<string, CountryConfig> = {
  ...TIER1_COUNTRIES,
  ...EXTENDED_TIER1_COUNTRIES,
};

export interface HighTicketNicheOption {
  id: string;
  name: string;
  avgContract: string;
  urgency: "CRITICAL" | "HIGH" | "MEDIUM";
  defaultSearch: string;
  isTopDefault?: boolean;
}

export const HIGH_TICKET_NICHES: HighTicketNicheOption[] = [
  {
    id: "commercial-roofing",
    name: "Commercial Roofing & Industrial Restoration",
    avgContract: "$30k - $250k+",
    urgency: "HIGH",
    defaultSearch: "Commercial Roofing Contractors",
    isTopDefault: true,
  },
  {
    id: "commercial-hvac",
    name: "Commercial HVAC & Industrial Refrigeration",
    avgContract: "$20k - $150k+",
    urgency: "HIGH",
    defaultSearch: "Commercial HVAC Systems",
  },
  {
    id: "luxury-builders",
    name: "Luxury Custom Home Builders & General Contractors",
    avgContract: "$100k - $1M+",
    urgency: "MEDIUM",
    defaultSearch: "Luxury Custom Home Builders",
  },
  {
    id: "emergency-plumbing",
    name: "High-Volume Emergency Plumbing & Trenchless Sewer",
    avgContract: "$10k - $50k+",
    urgency: "CRITICAL",
    defaultSearch: "Commercial Plumbing & Sewer Contractors",
  },
  {
    id: "cosmetic-dental",
    name: "Cosmetic Dentistry, Implants & Orthodontics",
    avgContract: "$5k - $40k+",
    urgency: "MEDIUM",
    defaultSearch: "Cosmetic Dentistry & Dental Implants",
  },
  {
    id: "med-spas",
    name: "Medical Spas, Aesthetics & Plastic Surgery",
    avgContract: "$3k - $25k+",
    urgency: "MEDIUM",
    defaultSearch: "Medical Spa & Plastic Surgery Clinic",
  },
  {
    id: "commercial-solar",
    name: "Commercial Solar & Renewable Energy Systems",
    avgContract: "$50k - $300k+",
    urgency: "MEDIUM",
    defaultSearch: "Commercial Solar Installation",
  },
  {
    id: "corporate-law",
    name: "Boutique Corporate Law & Estate Litigation",
    avgContract: "$10k - $100k+",
    urgency: "HIGH",
    defaultSearch: "Corporate Law Firms",
  },
  {
    id: "luxury-pools",
    name: "High-End Architectural Landscaping & Custom Pools",
    avgContract: "$40k - $200k+",
    urgency: "MEDIUM",
    defaultSearch: "Landscape Architecture & Pools",
  },
  {
    id: "industrial-logistics",
    name: "Industrial Logistics, Freight & Warehousing",
    avgContract: "$25k - $500k+",
    urgency: "HIGH",
    defaultSearch: "Freight & Logistics Services",
  },
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

