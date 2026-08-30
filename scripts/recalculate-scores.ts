import { db } from "../lib/db";
import { prospects, contacts } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { calculateLeadScore } from "../lib/scoring/lead-scorer";

async function main() {
  console.log("Recalculating lead scores for all prospects...");
  const allProspects = await db.select().from(prospects);
  const allContacts = await db.select().from(contacts);

  console.log(`Found ${allProspects.length} prospects, ${allContacts.length} contacts.`);

  for (const p of allProspects) {
    const prospectContacts = allContacts.filter((c) => c.prospectId === p.id);
    const hasDM = prospectContacts.some((c) => c.isDecisionMaker) || prospectContacts.length > 0;
    const primaryContact = prospectContacts.find((c) => c.isDecisionMaker) || prospectContacts[0];

    const result = calculateLeadScore({
      googleRating: p.googleRating,
      reviewCount: p.reviewCount,
      websiteExists: p.websiteExists,
      website: p.website,
      websiteQuality: p.websiteQuality,
      mobileUx: p.mobileUx,
      ctaQuality: p.ctaQuality,
      quoteBookingFlow: p.quoteBookingFlow,
      trustSignals: p.trustSignals,
      seoVisibility: p.seoVisibility,
      speedScore: p.speedScore,
      icpFit: p.icpFit,
      abilityToPay: p.abilityToPay,
      urgency: p.urgency,
      recurringPotential: p.recurringPotential,
      buyingSignals: p.buyingSignals,
      phone: p.phone,
      email: p.email,
      linkedInUrl: p.linkedInUrl,
      facebookUrl: p.facebookUrl,
      instagramUrl: p.instagramUrl,
      googleProfileUrl: p.googleProfileUrl,
      hasDecisionMaker: hasDM,
      primaryContact: primaryContact
        ? {
            firstName: primaryContact.firstName,
            isDecisionMaker: primaryContact.isDecisionMaker,
            jobTitle: primaryContact.jobTitle || undefined,
            email: primaryContact.email || undefined,
            phone: primaryContact.phone || undefined,
          }
        : undefined,
      contactsCount: prospectContacts.length,
    });

    console.log(`Prospect "${p.name}": Old ${p.leadScore} (${p.leadGrade}) -> New ${result.score} (${result.grade}) [Breakdown: Com=${result.breakdown.commercialScore}, Dig=${result.breakdown.digitalScore}, Loc=${result.breakdown.localReputationScore}, Read=${result.breakdown.readinessScore}]`);

    await db
      .update(prospects)
      .set({
        leadScore: result.score,
        leadGrade: result.grade,
      })
      .where(eq(prospects.id, p.id));
  }

  console.log("✅ All prospect scores recalculated successfully!");
}

main().catch((err) => {
  console.error("Error refreshing scores:", err);
  process.exit(1);
});
