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
