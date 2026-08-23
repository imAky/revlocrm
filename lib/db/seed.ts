import { db } from "./index";
import {
  workspaces,
  users,
  roles,
  permissions,
  rolePermissions,
  memberships,
  pipelineStages,
  prospects,
  contacts,
  activities,
  tasks,
  customFields,
  customFieldOptions,
  customFieldValues,
} from "./schema";
import { hashPassword } from "../auth/password";
import { CAPABILITIES, DEFAULT_ROLE_PERMISSIONS } from "../permissions/capabilities";
import { calculateLeadScore } from "../scoring/lead-scorer";

export async function seedDatabase() {
  console.log("🌱 Starting Revlo CRM Seed...");

  // 1. Seed Permissions
  console.log("Inserting permissions...");
  for (const permKey of Object.values(CAPABILITIES)) {
    const parts = permKey.split(".");
    const category = parts[0] || "general";
    const name = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");

    await db
      .insert(permissions)
      .values({
        id: permKey,
        name,
        category,
        description: `Allows user to ${parts[1]} ${parts[0]}`,
      })
      .onConflictDoNothing();
  }

  // 2. Seed System Roles
  console.log("Inserting system roles...");
  const adminRoleId = "role_admin";
  const salesRoleId = "role_sales";
  const researcherRoleId = "role_researcher";

  await db
    .insert(roles)
    .values([
      {
        id: adminRoleId,
        name: "admin",
        description: "Full workspace administrative authority",
        isSystem: true,
      },
      {
        id: salesRoleId,
        name: "sales",
        description: "Sales Representative with outreach, pipeline and prospect management",
        isSystem: true,
      },
      {
        id: researcherRoleId,
        name: "researcher",
        description: "Prospect researcher with create/edit rights. Cannot delete records.",
        isSystem: true,
      },
    ])
    .onConflictDoNothing();

  // 3. Link Role Permissions
  console.log("Linking role permissions...");
  for (const [roleName, permList] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const roleId =
      roleName === "admin"
        ? adminRoleId
        : roleName === "sales"
        ? salesRoleId
        : researcherRoleId;

    for (const permId of permList) {
      await db
        .insert(rolePermissions)
        .values({
          roleId,
          permissionId: permId,
        })
        .onConflictDoNothing();
    }
  }

  // 4. Create Workspace
  const workspaceId = "ws_revlo_default";
  console.log("Inserting workspace...");
  await db
    .insert(workspaces)
    .values({
      id: workspaceId,
      name: "Revlo Growth Lab",
      slug: "revlo",
    })
    .onConflictDoNothing();

  // 5. Create Pipeline Stages
  console.log("Inserting pipeline stages...");
  const stageDefs = [
    { key: "researching", name: "Researching", color: "slate", isWon: false, isLost: false },
    { key: "qualified", name: "Qualified", color: "blue", isWon: false, isLost: false },
    { key: "ready_to_contact", name: "Ready to Contact", color: "cyan", isWon: false, isLost: false },
    { key: "contacted", name: "Contacted", color: "indigo", isWon: false, isLost: false },
    { key: "engaged", name: "Engaged", color: "purple", isWon: false, isLost: false },
    { key: "discovery_scheduled", name: "Discovery Scheduled", color: "amber", isWon: false, isLost: false },
    { key: "discovery_completed", name: "Discovery Completed", color: "yellow", isWon: false, isLost: false },
    { key: "proposal_sent", name: "Proposal Sent", color: "violet", isWon: false, isLost: false },
    { key: "negotiation", name: "Negotiation", color: "orange", isWon: false, isLost: false },
    { key: "closed_won", name: "Closed Won", color: "emerald", isWon: true, isLost: false },
    { key: "closed_lost", name: "Closed Lost", color: "rose", isWon: false, isLost: true },
    { key: "nurture", name: "Nurture", color: "teal", isWon: false, isLost: false },
    { key: "disqualified", name: "Disqualified", color: "zinc", isWon: false, isLost: false },
  ];

  const stageIdMap: Record<string, string> = {};

  for (let i = 0; i < stageDefs.length; i++) {
    const s = stageDefs[i];
    const sId = `stage_${s.key}`;
    stageIdMap[s.key] = sId;

    await db
      .insert(pipelineStages)
      .values({
        id: sId,
        workspaceId,
        name: s.name,
        key: s.key,
        description: `Stage: ${s.name}`,
        orderIndex: i,
        color: s.color,
        isSystem: true,
        isClosedWon: s.isWon,
        isClosedLost: s.isLost,
      })
      .onConflictDoNothing();
  }

  // 6. Create Seed Users & Memberships
  console.log("Inserting demo users...");
  const adminId = "user_admin_demo";
  const researcherId = "user_researcher_demo";

  const adminPassHash = await hashPassword("admin123");
  const researcherPassHash = await hashPassword("researcher123");

  await db
    .insert(users)
    .values([
      {
        id: adminId,
        email: "admin@revlo.demo",
        name: "Sarah Connor (Admin)",
        passwordHash: adminPassHash,
      },
      {
        id: researcherId,
        email: "researcher@revlo.demo",
        name: "Alex Miller (Researcher)",
        passwordHash: researcherPassHash,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(memberships)
    .values([
      {
        id: "mem_admin_demo",
        workspaceId,
        userId: adminId,
        roleId: adminRoleId,
        status: "active",
      },
      {
        id: "mem_researcher_demo",
        workspaceId,
        userId: researcherId,
        roleId: researcherRoleId,
        status: "active",
      },
    ])
    .onConflictDoNothing();

  // 7. Seed Custom Fields
  console.log("Inserting dynamic custom fields...");
  const techStackFieldId = "cf_tech_stack";
  const adSpendFieldId = "cf_ad_spend";
  const hasMarketerFieldId = "cf_has_marketer";

  await db
    .insert(customFields)
    .values([
      {
        id: techStackFieldId,
        workspaceId,
        name: "Website Tech Stack",
        key: "tech_stack",
        fieldType: "SELECT",
        section: "Digital Footprint",
        displayOrder: 1,
        isActive: true,
        isFilterable: true,
      },
      {
        id: adSpendFieldId,
        workspaceId,
        name: "Estimated Monthly Ad Spend",
        key: "ad_spend",
        fieldType: "CURRENCY",
        section: "Commercial Intelligence",
        displayOrder: 2,
        isActive: true,
        isFilterable: true,
      },
      {
        id: hasMarketerFieldId,
        workspaceId,
        name: "Dedicated Marketing Lead",
        key: "has_marketer",
        fieldType: "BOOLEAN",
        section: "Commercial Intelligence",
        displayOrder: 3,
        isActive: true,
        isFilterable: true,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(customFieldOptions)
    .values([
      { id: "cfo_wp", customFieldId: techStackFieldId, label: "WordPress", value: "wordpress", displayOrder: 1 },
      { id: "cfo_next", customFieldId: techStackFieldId, label: "Next.js / React", value: "nextjs", displayOrder: 2 },
      { id: "cfo_shopify", customFieldId: techStackFieldId, label: "Shopify", value: "shopify", displayOrder: 3 },
      { id: "cfo_webflow", customFieldId: techStackFieldId, label: "Webflow", value: "webflow", displayOrder: 4 },
      { id: "cfo_custom", customFieldId: techStackFieldId, label: "Custom Legacy", value: "custom", displayOrder: 5 },
    ])
    .onConflictDoNothing();

  // 8. Seed Sample Realistic Prospects
  console.log("Inserting rich sample prospects...");
  const sampleProspectsData = [
    {
      id: "prospect_northstar_roofing",
      name: "Northstar Roofing & Solar Demo",
      niche: "Roofing & Construction",
      website: "https://northstar-roofing-demo.example.com",
      googleMapsUrl: "https://maps.google.com/?q=Northstar+Roofing+Demo",
      city: "Austin",
      state: "TX",
      country: "USA",
      phone: "+1 (512) 555-0142",
      email: "info@northstar-roofing-demo.example.com",
      googleRating: "4.80",
      reviewCount: 94,
      websiteExists: true,
      websiteQuality: "FAIR",
      mobileUx: "POOR",
      ctaQuality: "POOR",
      quoteBookingFlow: "No instant estimation tool; slow email form only",
      trustSignals: "BBB A+ rating badge, GAF Master Elite badge",
      seoVisibility: "Ranking #8 locally for 'commercial roofing Austin'",
      icpFit: "HIGH",
      abilityToPay: "HIGH",
      urgency: "HIGH",
      recurringPotential: "MEDIUM",
      buyingSignals: "Recently raised hiring budget for marketing; complaints on slow contact form",
      mainOpportunity: "High-converting funnel overhaul + Google Local Services ad optimization",
      dealValue: "18500.00",
      stageKey: "qualified",
      assignedToId: adminId,
      createdById: researcherId,
      notes: "Met owner briefly at Austin Home Expo. High desire to double commercial inbound leads.",
      researchNotes: "Site takes 4.2s to load on mobile. Missing clear phone click-to-call in hero.",
      contacts: [
        {
          id: "cnt_ns_1",
          firstName: "Marcus",
          lastName: "Vance",
          fullName: "Marcus Vance",
          jobTitle: "Founder & Managing Director",
          role: "Executive Decision Maker",
          email: "marcus@northstar-roofing-demo.example.com",
          phone: "+1 (512) 555-0143",
          linkedInUrl: "https://linkedin.com/in/demo-marcus-vance",
          preferredChannel: "PHONE",
          isDecisionMaker: true,
          notes: "Prefers direct phone calls before 9 AM CT.",
        },
      ],
    },
    {
      id: "prospect_apex_hvac",
      name: "Apex Commercial HVAC Systems Demo",
      niche: "HVAC & Mechanical",
      website: "https://apex-hvac-systems-demo.example.com",
      googleMapsUrl: "https://maps.google.com/?q=Apex+HVAC+Demo",
      city: "Denver",
      state: "CO",
      country: "USA",
      phone: "+1 (303) 555-0199",
      email: "sales@apex-hvac-demo.example.com",
      googleRating: "4.90",
      reviewCount: 142,
      websiteExists: true,
      websiteQuality: "GOOD",
      mobileUx: "GOOD",
      ctaQuality: "FAIR",
      quoteBookingFlow: "Basic contact form, no emergency dispatch booking",
      trustSignals: "NATE certified technicians, 25 years in Colorado",
      seoVisibility: "Top 3 for Denver HVAC maintenance",
      icpFit: "HIGH",
      abilityToPay: "HIGH",
      urgency: "MEDIUM",
      recurringPotential: "HIGH",
      buyingSignals: "Expanding fleet with 12 new commercial service vans",
      mainOpportunity: "Annual maintenance contract lead generation and client portal",
      dealValue: "24000.00",
      stageKey: "proposal_sent",
      assignedToId: researcherId,
      createdById: researcherId,
      notes: "Proposal delivered for quarterly prospecting retainer + landing page makeover.",
      researchNotes: "Strong brand reputation, high margins on commercial chillers.",
      contacts: [
        {
          id: "cnt_apex_1",
          firstName: "Elena",
          lastName: "Reyes",
          fullName: "Elena Reyes",
          jobTitle: "VP of Operations",
          role: "Co-Owner",
          email: "elena@apex-hvac-demo.example.com",
          phone: "+1 (303) 555-0198",
          linkedInUrl: "https://linkedin.com/in/demo-elena-reyes",
          preferredChannel: "EMAIL",
          isDecisionMaker: true,
          notes: "Very detail-oriented on ROI calculations.",
        },
      ],
    },
    {
      id: "prospect_summit_dental",
      name: "Summit Premium Dental Specialists Demo",
      niche: "Healthcare & Dental",
      website: "https://summit-dental-demo.example.com",
      googleMapsUrl: "https://maps.google.com/?q=Summit+Dental+Demo",
      city: "Seattle",
      state: "WA",
      country: "USA",
      phone: "+1 (206) 555-0177",
      email: "care@summit-dental-demo.example.com",
      googleRating: "4.70",
      reviewCount: 88,
      websiteExists: true,
      websiteQuality: "POOR",
      mobileUx: "POOR",
      ctaQuality: "POOR",
      quoteBookingFlow: "Broken calendar booking widget",
      trustSignals: "ADA member, Invisalign Diamond Provider",
      seoVisibility: "Page 2 for Seattle cosmetic dentistry",
      icpFit: "HIGH",
      abilityToPay: "HIGH",
      urgency: "HIGH",
      recurringPotential: "HIGH",
      buyingSignals: "New cosmetic practice location opening in Bellevue",
      mainOpportunity: "Online booking integration + localized high-ticket implant campaign",
      dealValue: "15000.00",
      stageKey: "ready_to_contact",
      assignedToId: researcherId,
      createdById: researcherId,
      notes: "Front desk staff is overwhelmed by phone calls; need automated scheduling.",
      researchNotes: "Current WordPress site has security plugin warnings visible in footer.",
      contacts: [
        {
          id: "cnt_summit_1",
          firstName: "Dr. Julian",
          lastName: "Chen",
          fullName: "Dr. Julian Chen",
          jobTitle: "Lead Orthodontist & Practice Owner",
          role: "Owner",
          email: "julian.chen@summit-dental-demo.example.com",
          phone: "+1 (206) 555-0176",
          preferredChannel: "EMAIL",
          isDecisionMaker: true,
        },
      ],
    },
    {
      id: "prospect_horizon_solar",
      name: "Horizon Clean Solar Energy Demo",
      niche: "Clean Energy & Solar",
      website: "https://horizon-solar-demo.example.com",
      googleMapsUrl: "https://maps.google.com/?q=Horizon+Solar+Demo",
      city: "Phoenix",
      state: "AZ",
      country: "USA",
      phone: "+1 (602) 555-0123",
      email: "hello@horizon-solar-demo.example.com",
      googleRating: "4.60",
      reviewCount: 65,
      websiteExists: true,
      websiteQuality: "GOOD",
      mobileUx: "FAIR",
      ctaQuality: "GOOD",
      quoteBookingFlow: "Solar calculator has 7-step long form that drops 80% of users",
      trustSignals: "NABCEP certified installers",
      seoVisibility: "High ad spend on Google search",
      icpFit: "HIGH",
      abilityToPay: "HIGH",
      urgency: "HIGH",
      recurringPotential: "MEDIUM",
      buyingSignals: "Spending $15k/mo on Google Ads with low conversion page",
      mainOpportunity: "Single-page instant solar estimator to 3x lead capture rate",
      dealValue: "22500.00",
      stageKey: "discovery_completed",
      assignedToId: adminId,
      createdById: researcherId,
      notes: "Discovery call went great. Head of Growth wants prototype before Friday.",
      researchNotes: "Using custom PHP backend. Calculator fails on Safari iOS.",
      contacts: [
        {
          id: "cnt_horizon_1",
          firstName: "David",
          lastName: "Kowalski",
          fullName: "David Kowalski",
          jobTitle: "Chief Revenue Officer",
          role: "Decision Maker",
          email: "david@horizon-solar-demo.example.com",
          phone: "+1 (602) 555-0124",
          linkedInUrl: "https://linkedin.com/in/demo-david-kowalski",
          preferredChannel: "LINKEDIN",
          isDecisionMaker: true,
        },
      ],
    },
    {
      id: "prospect_coastal_logistics",
      name: "Coastal Freight & Logistics Demo",
      niche: "Transportation & Supply Chain",
      website: "https://coastal-freight-demo.example.com",
      googleMapsUrl: "https://maps.google.com/?q=Coastal+Freight+Demo",
      city: "Savannah",
      state: "GA",
      country: "USA",
      phone: "+1 (912) 555-0188",
      email: "dispatch@coastal-freight-demo.example.com",
      googleRating: "4.40",
      reviewCount: 38,
      websiteExists: true,
      websiteQuality: "FAIR",
      mobileUx: "POOR",
      ctaQuality: "POOR",
      quoteBookingFlow: "PDF download for rate quotes",
      trustSignals: "SmartWay Transport Partner",
      seoVisibility: "Low local search footprint",
      icpFit: "MEDIUM",
      abilityToPay: "HIGH",
      urgency: "MEDIUM",
      recurringPotential: "HIGH",
      buyingSignals: "New warehouse facility opened near port terminal",
      mainOpportunity: "Real-time quote request portal for B2B shippers",
      dealValue: "32000.00",
      stageKey: "negotiation",
      assignedToId: adminId,
      createdById: researcherId,
      notes: "In final terms review with CFO.",
      researchNotes: "Heavy reliance on fax/email for bills of lading.",
      contacts: [
        {
          id: "cnt_coastal_1",
          firstName: "Robert",
          lastName: "Sterling",
          fullName: "Robert Sterling",
          jobTitle: "VP of Business Development",
          role: "Executive",
          email: "rsterling@coastal-freight-demo.example.com",
          phone: "+1 (912) 555-0189",
          preferredChannel: "PHONE",
          isDecisionMaker: true,
        },
      ],
    },
    {
      id: "prospect_vanguard_security",
      name: "Vanguard Integrated Security Demo",
      niche: "Commercial Security & Surveillance",
      website: "https://vanguard-security-demo.example.com",
      googleMapsUrl: "https://maps.google.com/?q=Vanguard+Security+Demo",
      city: "Chicago",
      state: "IL",
      country: "USA",
      phone: "+1 (312) 555-0155",
      email: "info@vanguard-security-demo.example.com",
      googleRating: "4.95",
      reviewCount: 110,
      websiteExists: true,
      websiteQuality: "EXCELLENT",
      mobileUx: "GOOD",
      ctaQuality: "GOOD",
      quoteBookingFlow: "Interactive security audit booking",
      trustSignals: "UL Listed Central Station, ASIS International Member",
      seoVisibility: "Ranking #1 for 'commercial access control Chicago'",
      icpFit: "HIGH",
      abilityToPay: "HIGH",
      urgency: "LOW",
      recurringPotential: "HIGH",
      buyingSignals: "Acquired a smaller regional surveillance firm",
      mainOpportunity: "Account-based prospecting campaign for logistics hubs",
      dealValue: "45000.00",
      stageKey: "closed_won",
      assignedToId: adminId,
      createdById: adminId,
      notes: "Signed 12-month growth partnership. Great showcase account!",
      researchNotes: "Top tier operation with over 40 technicians.",
      contacts: [
        {
          id: "cnt_vanguard_1",
          firstName: "Rachel",
          lastName: "Novak",
          fullName: "Rachel Novak",
          jobTitle: "Chief Marketing Officer",
          role: "Decision Maker",
          email: "rachel.novak@vanguard-security-demo.example.com",
          phone: "+1 (312) 555-0156",
          preferredChannel: "EMAIL",
          isDecisionMaker: true,
        },
      ],
    },
  ];

  for (const p of sampleProspectsData) {
    const scoreResult = calculateLeadScore({
      googleRating: p.googleRating,
      reviewCount: p.reviewCount,
      websiteExists: p.websiteExists,
      websiteQuality: p.websiteQuality,
      mobileUx: p.mobileUx,
      ctaQuality: p.ctaQuality,
      quoteBookingFlow: p.quoteBookingFlow,
      trustSignals: p.trustSignals,
      seoVisibility: p.seoVisibility,
      icpFit: p.icpFit,
      abilityToPay: p.abilityToPay,
      urgency: p.urgency,
      recurringPotential: p.recurringPotential,
      buyingSignals: p.buyingSignals,
      hasDecisionMaker: p.contacts.some((c) => c.isDecisionMaker),
    });

    const stageId = stageIdMap[p.stageKey] || stageIdMap["researching"];

    await db
      .insert(prospects)
      .values({
        id: p.id,
        workspaceId,
        name: p.name,
        niche: p.niche,
        website: p.website,
        googleMapsUrl: p.googleMapsUrl,
        city: p.city,
        state: p.state,
        country: p.country,
        phone: p.phone,
        email: p.email,
        googleRating: p.googleRating,
        reviewCount: p.reviewCount,
        websiteExists: p.websiteExists,
        websiteQuality: p.websiteQuality,
        mobileUx: p.mobileUx,
        ctaQuality: p.ctaQuality,
        quoteBookingFlow: p.quoteBookingFlow,
        trustSignals: p.trustSignals,
        seoVisibility: p.seoVisibility,
        leadScore: scoreResult.score,
        leadGrade: scoreResult.grade,
        icpFit: p.icpFit,
        abilityToPay: p.abilityToPay,
        urgency: p.urgency,
        recurringPotential: p.recurringPotential,
        buyingSignals: p.buyingSignals,
        mainOpportunity: p.mainOpportunity,
        dealValue: p.dealValue,
        stageId,
        assignedToId: p.assignedToId,
        createdById: p.createdById,
        notes: p.notes,
        researchNotes: p.researchNotes,
      })
      .onConflictDoNothing();

    // Insert contacts
    for (const c of p.contacts as any[]) {
      await db
        .insert(contacts)
        .values({
          id: c.id,
          workspaceId,
          prospectId: p.id,
          firstName: c.firstName,
          lastName: c.lastName,
          fullName: c.fullName,
          jobTitle: c.jobTitle,
          role: c.role,
          email: c.email,
          phone: c.phone,
          linkedInUrl: c.linkedInUrl,
          preferredChannel: c.preferredChannel,
          isDecisionMaker: c.isDecisionMaker,
          notes: c.notes,
        })
        .onConflictDoNothing();
    }

    // Insert sample activity
    await db
      .insert(activities)
      .values({
        id: `act_${p.id}_1`,
        workspaceId,
        prospectId: p.id,
        userId: p.assignedToId || adminId,
        type: "RESEARCH",
        title: "Initial Digital Presence & Competitor Audit",
        description: `Conducted in-depth website speed, local SEO audit and verified Google reviews. Identified opportunity: ${p.mainOpportunity}`,
        outcome: `Calculated Lead Score: ${scoreResult.score} (${scoreResult.grade})`,
        nextAction: "Conduct initial decision-maker outreach via preferred channel.",
      })
      .onConflictDoNothing();

    // Insert sample task
    await db
      .insert(tasks)
      .values({
        id: `task_${p.id}_1`,
        workspaceId,
        prospectId: p.id,
        assignedToId: p.assignedToId || researcherId,
        createdById: adminId,
        title: `Follow up with ${p.contacts[0]?.fullName || "decision maker"} on proposal`,
        description: `Review customized quote breakdown and schedule 15-minute alignment call.`,
        priority: p.urgency === "HIGH" ? "HIGH" : "MEDIUM",
        status: "TODO",
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // in 2 days
      })
      .onConflictDoNothing();

    // Insert custom field value
    await db
      .insert(customFieldValues)
      .values({
        id: `cfv_${p.id}_tech`,
        workspaceId,
        entityType: "PROSPECT",
        entityId: p.id,
        customFieldId: techStackFieldId,
        valueText: "wordpress",
      })
      .onConflictDoNothing();
  }

  console.log("✅ Revlo CRM database seeded successfully!");
}
