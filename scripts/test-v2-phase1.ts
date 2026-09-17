import { generateHighTicketKeywords } from "../lib/services/ai-keyword-generator";
import { searchGoogleMapsProspects } from "../lib/services/discovery-service";
import { scoutDecisionMaker } from "../lib/services/dm-scout-service";
import { calculateLeadScore } from "../lib/scoring/lead-scorer";

async function main() {
  console.log("=================================================");
  console.log("  REVLOCRM V2 PHASE 1 AUTOMATION VERIFICATION   ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      failed++;
    }
  }

  // TEST 1: High-ticket keyword generator for Tier-1 countries
  console.log("--- 1. Testing AI Tier-1 Keyword Generation ---");
  try {
    const usKeywords = await generateHighTicketKeywords({
      country: "US",
      count: 5,
    });
    assert(usKeywords.length > 0, `Generated ${usKeywords.length} US keywords`);
    assert(
      usKeywords.every((k) => k.country === "US" && k.city && k.niche),
      "All US keywords contain country=US, city, and high-ticket niche"
    );

    const ukKeywords = await generateHighTicketKeywords({
      country: "GB",
      count: 3,
    });
    assert(ukKeywords.length > 0, `Generated ${ukKeywords.length} UK keywords`);
    assert(
      ukKeywords.every((k) => k.country === "GB"),
      "All UK keywords tagged with GB"
    );
  } catch (err: any) {
    assert(false, `Keyword generator threw: ${err.message}`);
  }

  // TEST 2: Google Maps discovery & Website Presence detection
  console.log("\n--- 2. Testing Google Maps Discovery & No-Website Detection ---");
  try {
    const discoveryRes = await searchGoogleMapsProspects({
      keyword: "Roofing Contractor Austin TX",
      country: "US",
      maxResults: 6,
    });

    assert(discoveryRes.prospects.length > 0, `Discovered ${discoveryRes.prospects.length} prospects`);
    assert(discoveryRes.totalFound >= discoveryRes.prospects.length, "Total discovered count is valid");

    // Check for website detection
    const withWeb = discoveryRes.prospects.filter((p) => p.websiteExists);
    const withoutWeb = discoveryRes.prospects.filter((p) => !p.websiteExists);

    console.log(`  Discovered with website: ${withWeb.length}, without website: ${withoutWeb.length}`);
    assert(
      withoutWeb.some((p) => p.hasNoWebsiteOpportunity === true),
      "Correctly flagged hasNoWebsiteOpportunity=true for businesses lacking website"
    );

    // Verify rating & reviews
    const first = discoveryRes.prospects[0];
    assert(first.googleRating !== undefined && first.reviewCount !== undefined, "Google rating & review count extracted");
  } catch (err: any) {
    assert(false, `Discovery service threw: ${err.message}`);
  }

  // TEST 3: Decision-Maker Scouting & Verification Status
  console.log("\n--- 3. Testing Decision-Maker Scouting ---");
  try {
    const dmResult = await scoutDecisionMaker({
      companyName: "Lone Star Premier Roofing",
      city: "Austin",
      state: "TX",
      website: "https://lonestarpremierroofing.com",
    });

    assert(dmResult.found === true, "Decision maker found for company");
    assert(
      dmResult.verificationStatus === "VERIFIED" || dmResult.verificationStatus === "NEEDS_REVIEW",
      `Verification status properly assigned: ${dmResult.verificationStatus}`
    );
    assert(
      !dmResult.email || typeof dmResult.email === "string",
      "Email is valid string or left undefined (no guesswork)"
    );
    console.log(`  Identified: ${dmResult.fullName} (${dmResult.jobTitle}) - Verification: ${dmResult.verificationStatus}`);
  } catch (err: any) {
    assert(false, `DM Scout threw: ${err.message}`);
  }

  // TEST 4: Lead Scoring with No-Website Opportunity
  console.log("\n--- 4. Testing Lead Scoring for No-Website Prospects ---");
  try {
    const scoreNoWeb = calculateLeadScore({
      googleRating: "4.9",
      reviewCount: 88,
      websiteExists: false,
      website: "",
      websiteQuality: "MISSING",
      mobileUx: "POOR",
      ctaQuality: "POOR",
      quoteBookingFlow: "MISSING",
      icpFit: "HIGH",
      abilityToPay: "HIGH",
      urgency: "HIGH",
      recurringPotential: "MEDIUM",
      hasDecisionMaker: true,
      phone: "+1 512 555 0192",
    });

    console.log(`  Score for 4.9⭐ with NO website: ${scoreNoWeb.score}/100 (${scoreNoWeb.grade})`);
    assert(
      scoreNoWeb.score >= 50,
      "High rating + no website receives strong priority score due to digital need + ability to pay"
    );
  } catch (err: any) {
    assert(false, `Lead scorer threw: ${err.message}`);
  }

  console.log("\n=================================================");
  console.log(`TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
