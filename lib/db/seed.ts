import { db } from "./index";
import {
  workspaces,
  users,
  roles,
  permissions,
  rolePermissions,
  userPermissions,
  memberships,
  pipelineStages,
  prospects,
  contacts,
  activities,
  tasks,
  taskLogs,
  auditLogs,
  customFields,
  customFieldOptions,
  customFieldValues,
  researchKeywords,
  authOtps,
  invitations,
} from "./schema";
import { hashPassword } from "../auth/password";
import { CAPABILITIES, DEFAULT_ROLE_PERMISSIONS } from "../permissions/capabilities";
import { calculateLeadScore } from "../scoring/lead-scorer";
import { sql } from "drizzle-orm";

export async function seedDatabase(cleanFirst: boolean = true) {
  console.log("🌱 Starting Comprehensive Revlo CRM Reset & Seed...");

  if (cleanFirst) {
    console.log("🧹 Cleaning up existing database tables...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "prospect_media" (
        "id" text PRIMARY KEY,
        "workspace_id" text NOT NULL,
        "prospect_id" text NOT NULL,
        "user_id" text,
        "title" text NOT NULL,
        "description" text,
        "type" text NOT NULL,
        "url" text NOT NULL,
        "file_size" integer,
        "mime_type" text,
        "thumbnail_url" text,
        "category" text NOT NULL DEFAULT 'GENERAL',
        "is_pinned" boolean NOT NULL DEFAULT false,
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "research_keywords" (
        "id" text PRIMARY KEY,
        "workspace_id" text NOT NULL,
        "user_id" text,
        "keyword" text NOT NULL,
        "normalized_keyword" text NOT NULL,
        "niche" text,
        "city" text,
        "state" text,
        "country" text DEFAULT 'US',
        "status" text NOT NULL DEFAULT 'PENDING',
        "search_engine" text NOT NULL DEFAULT 'GOOGLE_MAPS',
        "prospects_found_count" integer NOT NULL DEFAULT 0,
        "notes" text,
        "last_searched_at" timestamp with time zone,
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      DELETE FROM custom_field_values;
      DELETE FROM custom_field_options;
      DELETE FROM custom_fields;
      DELETE FROM task_logs;
      DELETE FROM tasks;
      DELETE FROM activities;
      DELETE FROM prospect_media;
      DELETE FROM contacts;
      DELETE FROM prospects;
      DELETE FROM research_keywords;
      DELETE FROM audit_logs;
      DELETE FROM invitations;
      DELETE FROM user_permissions;
      DELETE FROM memberships;
      DELETE FROM pipeline_stages;
      DELETE FROM role_permissions;
      DELETE FROM roles;
      DELETE FROM permissions;
      DELETE FROM auth_otps;
      DELETE FROM users;
      DELETE FROM workspaces;
    `);
    console.log("✨ All previous data cleared cleanly.");
  }

  // 1. Seed Permissions
  console.log("1️⃣ Inserting core capability permissions...");
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
  console.log("2️⃣ Inserting system roles...");
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
  console.log("3️⃣ Linking role permissions...");
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
  console.log("4️⃣ Inserting default workspace...");
  await db
    .insert(workspaces)
    .values({
      id: workspaceId,
      name: "Revlo Growth Lab",
      slug: "revlo",
    })
    .onConflictDoNothing();

  // 5. Create 13 Pipeline Stages
  console.log("5️⃣ Inserting 13 pipeline stages...");
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

  // 6. Create Seed Users & Active Memberships
  console.log("6️⃣ Inserting Sample Admin & Researcher demo accounts...");
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
  console.log("7️⃣ Inserting dynamic custom fields...");
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

  // 8. Seed 16 Rich Realistic B2B Prospects Across Varied Niches & Grades
  console.log("8️⃣ Inserting 16 comprehensive sample prospects with contacts, activities, and tasks...");
  const sampleProspectsData = [
    {
      id: "prospect_northstar_roofing",
      name: "Northstar Roofing & Solar",
      niche: "Roofing & Construction",
      website: "https://northstar-roofing.com",
      googleMapsUrl: "https://maps.google.com/?q=Northstar+Roofing+Austin",
      city: "Austin",
      state: "TX",
      country: "USA",
      phone: "+1 (512) 555-0142",
      email: "info@northstar-roofing.com",
      googleRating: "4.80",
      reviewCount: 94,
      websiteExists: true,
      websiteQuality: "FAIR",
      mobileUx: "POOR",
      ctaQuality: "POOR",
      quoteBookingFlow: "No instant estimation tool; slow email form only",
      trustSignals: "BBB A+ rating badge, GAF Master Elite certified",
      seoVisibility: "Ranking #8 locally for 'commercial roofing Austin'",
      icpFit: "HIGH",
      abilityToPay: "HIGH",
      urgency: "HIGH",
      recurringPotential: "MEDIUM",
      buyingSignals: "Recently raised hiring budget for marketing; slow lead response time",
      mainOpportunity: "High-converting funnel overhaul + Google Local Services Ads optimization",
      dealValue: "18500.00",
      stageKey: "qualified",
      assignedToId: adminId,
      createdById: researcherId,
      notes: "Met owner briefly at Austin Home Expo. High desire to double commercial inbound leads.",
      researchNotes: "Site takes 4.2s to load on mobile. Missing clear phone click-to-call in hero banner.",
      contacts: [
        {
          id: "cnt_ns_1",
          firstName: "Marcus",
          lastName: "Vance",
          fullName: "Marcus Vance",
          jobTitle: "Founder & Managing Director",
          role: "Executive Decision Maker",
          email: "marcus@northstar-roofing.com",
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
      name: "Apex Commercial HVAC Systems",
      niche: "HVAC & Mechanical",
      website: "https://apex-hvac-systems.com",
      googleMapsUrl: "https://maps.google.com/?q=Apex+HVAC+Denver",
      city: "Denver",
      state: "CO",
      country: "USA",
      phone: "+1 (303) 555-0199",
      email: "sales@apex-hvac-systems.com",
      googleRating: "4.90",
      reviewCount: 142,
      websiteExists: true,
      websiteQuality: "GOOD",
      mobileUx: "GOOD",
      ctaQuality: "FAIR",
      quoteBookingFlow: "Basic contact form, no emergency dispatch booking",
      trustSignals: "NATE certified technicians, 25 years in Colorado",
      seoVisibility: "Top 3 for Denver commercial HVAC maintenance",
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
          email: "elena@apex-hvac-systems.com",
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
      name: "Summit Premium Dental Specialists",
      niche: "Healthcare & Dental",
      website: "https://summit-dental-care.com",
      googleMapsUrl: "https://maps.google.com/?q=Summit+Dental+Seattle",
      city: "Seattle",
      state: "WA",
      country: "USA",
      phone: "+1 (206) 555-0177",
      email: "care@summit-dental-care.com",
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
          email: "julian.chen@summit-dental-care.com",
          phone: "+1 (206) 555-0176",
          preferredChannel: "EMAIL",
          isDecisionMaker: true,
        },
      ],
    },
    {
      id: "prospect_horizon_solar",
      name: "Horizon Clean Solar Energy",
      niche: "Clean Energy & Solar",
      website: "https://horizon-solar-energy.com",
      googleMapsUrl: "https://maps.google.com/?q=Horizon+Solar+Phoenix",
      city: "Phoenix",
      state: "AZ",
      country: "USA",
      phone: "+1 (602) 555-0123",
      email: "hello@horizon-solar-energy.com",
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
          email: "david@horizon-solar-energy.com",
          phone: "+1 (602) 555-0124",
          linkedInUrl: "https://linkedin.com/in/demo-david-kowalski",
          preferredChannel: "LINKEDIN",
          isDecisionMaker: true,
        },
      ],
    },
    {
      id: "prospect_coastal_logistics",
      name: "Coastal Freight & Logistics",
      niche: "Transportation & Supply Chain",
      website: "https://coastal-freight.com",
      googleMapsUrl: "https://maps.google.com/?q=Coastal+Freight+Savannah",
      city: "Savannah",
      state: "GA",
      country: "USA",
      phone: "+1 (912) 555-0188",
      email: "dispatch@coastal-freight.com",
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
          email: "rsterling@coastal-freight.com",
          phone: "+1 (912) 555-0189",
          preferredChannel: "PHONE",
          isDecisionMaker: true,
        },
      ],
    },
    {
      id: "prospect_vanguard_security",
      name: "Vanguard Integrated Security",
      niche: "Commercial Security & Surveillance",
      website: "https://vanguard-security.com",
      googleMapsUrl: "https://maps.google.com/?q=Vanguard+Security+Chicago",
      city: "Chicago",
      state: "IL",
      country: "USA",
      phone: "+1 (312) 555-0155",
      email: "info@vanguard-security.com",
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
          email: "rachel.novak@vanguard-security.com",
          phone: "+1 (312) 555-0156",
          preferredChannel: "EMAIL",
          isDecisionMaker: true,
        },
      ],
    },
    {
      id: "prospect_elevate_medspa",
      name: "Elevate Aesthetics & MedSpa",
      niche: "Aesthetics & MedSpa",
      website: "https://elevate-medspa-miami.com",
      googleMapsUrl: "https://maps.google.com/?q=Elevate+MedSpa+Miami",
      city: "Miami",
      state: "FL",
      country: "USA",
      phone: "+1 (305) 555-0133",
      email: "concierge@elevate-medspa-miami.com",
      googleRating: "4.85",
      reviewCount: 175,
      websiteExists: true,
      websiteQuality: "EXCELLENT",
      mobileUx: "EXCELLENT",
      ctaQuality: "GOOD",
      quoteBookingFlow: "Direct Mindbody booking link",
      trustSignals: "Allergan Top 50 Injector, Board Certified Medical Director",
      seoVisibility: "Dominates South Beach aesthetic searches",
      icpFit: "HIGH",
      abilityToPay: "HIGH",
      urgency: "HIGH",
      recurringPotential: "HIGH",
      buyingSignals: "Launching high-ticket body contouring suites next quarter",
      mainOpportunity: "VIP Membership recurring revenue funnel + high-roller campaign",
      dealValue: "28000.00",
      stageKey: "engaged",
      assignedToId: researcherId,
      createdById: researcherId,
      notes: "Lead injector is enthusiastic about VIP membership program.",
      researchNotes: "Instagram has 45k followers but zero lead capture mechanism.",
      contacts: [
        {
          id: "cnt_elevate_1",
          firstName: "Dr. Sofia",
          lastName: "Navarro",
          fullName: "Dr. Sofia Navarro",
          jobTitle: "Medical Director & Co-Founder",
          role: "Owner",
          email: "sofia@elevate-medspa-miami.com",
          phone: "+1 (305) 555-0134",
          preferredChannel: "PHONE",
          isDecisionMaker: true,
        },
      ],
    },
    {
      id: "prospect_sterling_law",
      name: "Sterling & Sterling Corporate Law",
      niche: "Legal Services & Corporate Law",
      website: "https://sterling-law-ny.com",
      googleMapsUrl: "https://maps.google.com/?q=Sterling+Law+New+York",
      city: "New York",
      state: "NY",
      country: "USA",
      phone: "+1 (212) 555-0166",
      email: "contact@sterling-law-ny.com",
      googleRating: "4.75",
      reviewCount: 52,
      websiteExists: true,
      websiteQuality: "GOOD",
      mobileUx: "FAIR",
      ctaQuality: "FAIR",
      quoteBookingFlow: "Schedule confidential consultation form",
      trustSignals: "Super Lawyers 2024, Chambers USA ranked",
      seoVisibility: "Strong organic authority in M&A advisory",
      icpFit: "HIGH",
      abilityToPay: "HIGH",
      urgency: "MEDIUM",
      recurringPotential: "HIGH",
      buyingSignals: "Expanding practice group into venture financing",
      mainOpportunity: "B2B client acquisition engine for emerging tech founders",
      dealValue: "35000.00",
      stageKey: "discovery_scheduled",
      assignedToId: adminId,
      createdById: researcherId,
      notes: "Managing partner agreed to a 20-minute Zoom briefing.",
      researchNotes: "Site lacks case studies and clear venture practice page.",
      contacts: [
        {
          id: "cnt_sterling_1",
          firstName: "Arthur",
          lastName: "Sterling",
          fullName: "Arthur Sterling",
          jobTitle: "Senior Managing Partner",
          role: "Key Decision Maker",
          email: "arthur@sterling-law-ny.com",
          phone: "+1 (212) 555-0167",
          preferredChannel: "EMAIL",
          isDecisionMaker: true,
        },
      ],
    },
    {
      id: "prospect_nexus_fintech",
      name: "Nexus FinTech Cloud Solutions",
      niche: "B2B SaaS & FinTech",
      website: "https://nexus-fintech.io",
      googleMapsUrl: "https://maps.google.com/?q=Nexus+Fintech+San+Francisco",
      city: "San Francisco",
      state: "CA",
      country: "USA",
      phone: "+1 (415) 555-0111",
      email: "growth@nexus-fintech.io",
      googleRating: "4.90",
      reviewCount: 45,
      websiteExists: true,
      websiteQuality: "EXCELLENT",
      mobileUx: "EXCELLENT",
      ctaQuality: "EXCELLENT",
      quoteBookingFlow: "Interactive API sandbox and enterprise demo flow",
      trustSignals: "SOC 2 Type II Certified, ISO 27001",
      seoVisibility: "Ranked for modern treasury automation",
      icpFit: "HIGH",
      abilityToPay: "HIGH",
      urgency: "HIGH",
      recurringPotential: "HIGH",
      buyingSignals: "Closed Series A funding; scaling commercial outbound team",
      mainOpportunity: "Custom enterprise lead enrichment and outbound orchestration",
      dealValue: "50000.00",
      stageKey: "contacted",
      assignedToId: adminId,
      createdById: adminId,
      notes: "Met VP Growth on Twitter/X. Shared initial intelligence breakdown.",
      researchNotes: "Rapidly expanding product line into European currencies.",
      contacts: [
        {
          id: "cnt_nexus_1",
          firstName: "Samantha",
          lastName: "Wu",
          fullName: "Samantha Wu",
          jobTitle: "VP of Commercial Growth",
          role: "Decision Maker",
          email: "sam@nexus-fintech.io",
          phone: "+1 (415) 555-0112",
          linkedInUrl: "https://linkedin.com/in/demo-samantha-wu",
          preferredChannel: "LINKEDIN",
          isDecisionMaker: true,
        },
      ],
    },
    {
      id: "prospect_bluepeak_plumbing",
      name: "BluePeak Industrial Plumbing",
      niche: "Commercial Plumbing",
      website: "https://bluepeak-plumbing.com",
      googleMapsUrl: "https://maps.google.com/?q=BluePeak+Plumbing+Dallas",
      city: "Dallas",
      state: "TX",
      country: "USA",
      phone: "+1 (214) 555-0182",
      email: "dispatch@bluepeak-plumbing.com",
      googleRating: "4.50",
      reviewCount: 42,
      websiteExists: true,
      websiteQuality: "FAIR",
      mobileUx: "FAIR",
      ctaQuality: "POOR",
      quoteBookingFlow: "Call-in only",
      trustSignals: "Licensed Master Plumbers, 15+ years in DFW",
      seoVisibility: "Moderate visibility on Google Maps",
      icpFit: "MEDIUM",
      abilityToPay: "MEDIUM",
      urgency: "MEDIUM",
      recurringPotential: "HIGH",
      buyingSignals: "Targeting commercial multi-family property managers",
      mainOpportunity: "Automated emergency dispatch lead capture and multi-unit retainer sales",
      dealValue: "16000.00",
      stageKey: "researching",
      assignedToId: researcherId,
      createdById: researcherId,
      notes: "Researching owner contact information. Good potential for recurring service contracts.",
      researchNotes: "Website was built in 2018 on Wix. Needs modern revamp.",
      contacts: [
        {
          id: "cnt_bluepeak_1",
          firstName: "Travis",
          lastName: "Holloway",
          fullName: "Travis Holloway",
          jobTitle: "General Manager",
          role: "Operations Lead",
          email: "travis@bluepeak-plumbing.com",
          phone: "+1 (214) 555-0183",
          preferredChannel: "PHONE",
          isDecisionMaker: true,
        },
      ],
    },
    {
      id: "prospect_paramount_motors",
      name: "Paramount Luxury Motors",
      niche: "Automotive Dealership",
      website: "https://paramount-motors-atl.com",
      googleMapsUrl: "https://maps.google.com/?q=Paramount+Motors+Atlanta",
      city: "Atlanta",
      state: "GA",
      country: "USA",
      phone: "+1 (404) 555-0194",
      email: "concierge@paramount-motors-atl.com",
      googleRating: "4.65",
      reviewCount: 128,
      websiteExists: true,
      websiteQuality: "GOOD",
      mobileUx: "GOOD",
      ctaQuality: "FAIR",
      quoteBookingFlow: "Test drive booking widget",
      trustSignals: "Verified Dealer, 5-Star DealerRater Award",
      seoVisibility: "Top 5 for Atlanta luxury pre-owned cars",
      icpFit: "HIGH",
      abilityToPay: "HIGH",
      urgency: "LOW",
      recurringPotential: "MEDIUM",
      buyingSignals: "Expanding consignment inventory for exotic sports cars",
      mainOpportunity: "High-net-worth digital retargeting & VIP test-drive acquisition funnel",
      dealValue: "20000.00",
      stageKey: "qualified",
      assignedToId: researcherId,
      createdById: researcherId,
      notes: "Sales Director is open to exploring dedicated VIP lead capture landing pages.",
      researchNotes: "Current site inventory filters are clunky on smartphone screens.",
      contacts: [
        {
          id: "cnt_paramount_1",
          firstName: "Derrick",
          lastName: "Boudreaux",
          fullName: "Derrick Boudreaux",
          jobTitle: "Director of Sales",
          role: "Decision Maker",
          email: "derrick@paramount-motors-atl.com",
          phone: "+1 (404) 555-0195",
          preferredChannel: "PHONE",
          isDecisionMaker: true,
        },
      ],
    },
    {
      id: "prospect_greenfield_landscaping",
      name: "GreenField Landscaping & Hardscapes",
      niche: "Landscape Architecture",
      website: "https://greenfield-landscaping-clt.com",
      googleMapsUrl: "https://maps.google.com/?q=GreenField+Landscaping+Charlotte",
      city: "Charlotte",
      state: "NC",
      country: "USA",
      phone: "+1 (704) 555-0139",
      email: "quotes@greenfield-landscaping-clt.com",
      googleRating: "4.55",
      reviewCount: 31,
      websiteExists: true,
      websiteQuality: "FAIR",
      mobileUx: "FAIR",
      ctaQuality: "POOR",
      quoteBookingFlow: "Request quote webform",
      trustSignals: "NC Licensed Landscape Contractors",
      seoVisibility: "Page 2 for Charlotte patio installation",
      icpFit: "MEDIUM",
      abilityToPay: "MEDIUM",
      urgency: "LOW",
      recurringPotential: "HIGH",
      buyingSignals: "Shifting focus from residential mowing to $50k+ commercial outdoor living",
      mainOpportunity: "Visual 3D design quote estimator + commercial portfolio gallery",
      dealValue: "12500.00",
      stageKey: "nurture",
      assignedToId: researcherId,
      createdById: researcherId,
      notes: "Follow up in Q1 before spring construction season starts.",
      researchNotes: "Great project photos on Facebook, but not uploaded to website.",
      contacts: [
        {
          id: "cnt_greenfield_1",
          firstName: "Luke",
          lastName: "Harrison",
          fullName: "Luke Harrison",
          jobTitle: "Owner & Lead Designer",
          role: "Sole Owner",
          email: "luke@greenfield-landscaping-clt.com",
          phone: "+1 (704) 555-0140",
          preferredChannel: "PHONE",
          isDecisionMaker: true,
        },
      ],
    },
    {
      id: "prospect_omnicare_pt",
      name: "OmniCare Physical Therapy Network",
      niche: "Physical Therapy & Rehabilitation",
      website: "https://omnicare-pt-boston.com",
      googleMapsUrl: "https://maps.google.com/?q=OmniCare+PT+Boston",
      city: "Boston",
      state: "MA",
      country: "USA",
      phone: "+1 (617) 555-0185",
      email: "appointments@omnicare-pt-boston.com",
      googleRating: "4.30",
      reviewCount: 22,
      websiteExists: true,
      websiteQuality: "POOR",
      mobileUx: "POOR",
      ctaQuality: "POOR",
      quoteBookingFlow: "Download PDF registration form",
      trustSignals: "APTA Member Clinics",
      seoVisibility: "Low local search footprint",
      icpFit: "MEDIUM",
      abilityToPay: "MEDIUM",
      urgency: "MEDIUM",
      recurringPotential: "HIGH",
      buyingSignals: "Acquired 2 new clinic locations in Cambridge and Brookline",
      mainOpportunity: "Digital intake forms + patient acquisition Google Ads campaign",
      dealValue: "14000.00",
      stageKey: "researching",
      assignedToId: researcherId,
      createdById: researcherId,
      notes: "Initial research completed. Need to verify direct email of Clinical Director.",
      researchNotes: "Slow load times and PDF downloads hurting mobile conversions.",
      contacts: [
        {
          id: "cnt_omnicare_1",
          firstName: "Dr. Karen",
          lastName: "O'Connor",
          fullName: "Dr. Karen O'Connor",
          jobTitle: "Clinical Director",
          role: "Partner",
          email: "karen@omnicare-pt-boston.com",
          phone: "+1 (617) 555-0186",
          preferredChannel: "EMAIL",
          isDecisionMaker: true,
        },
      ],
    },
    {
      id: "prospect_swiftclean_janitorial",
      name: "SwiftClean Commercial Janitorial",
      niche: "Facility Services",
      website: "https://swiftclean-nashville.com",
      googleMapsUrl: "https://maps.google.com/?q=SwiftClean+Nashville",
      city: "Nashville",
      state: "TN",
      country: "USA",
      phone: "+1 (615) 555-0129",
      email: "service@swiftclean-nashville.com",
      googleRating: "4.20",
      reviewCount: 15,
      websiteExists: true,
      websiteQuality: "POOR",
      mobileUx: "POOR",
      ctaQuality: "FAIR",
      quoteBookingFlow: "Basic email contact form",
      trustSignals: "BSCAI Member, Insured & Bonded",
      seoVisibility: "Low local search ranking",
      icpFit: "LOW",
      abilityToPay: "LOW",
      urgency: "MEDIUM",
      recurringPotential: "MEDIUM",
      buyingSignals: "Trying to acquire medical office cleaning contracts",
      mainOpportunity: "Medical facility compliance landing page + direct email sequence",
      dealValue: "9500.00",
      stageKey: "contacted",
      assignedToId: researcherId,
      createdById: researcherId,
      notes: "Sent introductory cold email to general manager.",
      researchNotes: "Small family business with 8 cleaners. Budget might be tight.",
      contacts: [
        {
          id: "cnt_swiftclean_1",
          firstName: "Brian",
          lastName: "Miller",
          fullName: "Brian Miller",
          jobTitle: "Operations Manager",
          role: "Co-Owner",
          email: "brian@swiftclean-nashville.com",
          phone: "+1 (615) 555-0130",
          preferredChannel: "PHONE",
          isDecisionMaker: true,
        },
      ],
    },
    {
      id: "prospect_zenith_cyberdefense",
      name: "Zenith Cloud CyberDefense",
      niche: "CyberSecurity & Compliance",
      website: "https://zenith-cyberdefense.com",
      googleMapsUrl: "https://maps.google.com/?q=Zenith+CyberDefense+Reston",
      city: "Reston",
      state: "VA",
      country: "USA",
      phone: "+1 (703) 555-0171",
      email: "security@zenith-cyberdefense.com",
      googleRating: "4.95",
      reviewCount: 68,
      websiteExists: true,
      websiteQuality: "EXCELLENT",
      mobileUx: "EXCELLENT",
      ctaQuality: "EXCELLENT",
      quoteBookingFlow: "Free 24-hr vulnerability scan scheduler",
      trustSignals: "CMMC Registered Practitioner Organization, CISSP Certified",
      seoVisibility: "Dominates government contractor security keywords in NoVA",
      icpFit: "HIGH",
      abilityToPay: "HIGH",
      urgency: "HIGH",
      recurringPotential: "HIGH",
      buyingSignals: "New federal defense mandate driving massive demand for CMMC Level 2 audits",
      mainOpportunity: "High-ticket webinar funnel + account-based defense contractor outreach",
      dealValue: "60000.00",
      stageKey: "qualified",
      assignedToId: adminId,
      createdById: adminId,
      notes: "High value deal. CEO agreed to review full strategic growth roadmap.",
      researchNotes: "Very strong technical expertise. Needs help scaling enterprise sales team.",
      contacts: [
        {
          id: "cnt_zenith_1",
          firstName: "Gregory",
          lastName: "Holt",
          fullName: "Gregory Holt",
          jobTitle: "Chief Executive Officer & Founder",
          role: "Executive Decision Maker",
          email: "greg@zenith-cyberdefense.com",
          phone: "+1 (703) 555-0172",
          linkedInUrl: "https://linkedin.com/in/demo-greg-holt",
          preferredChannel: "EMAIL",
          isDecisionMaker: true,
        },
      ],
    },
    {
      id: "prospect_redline_detailing",
      name: "Redline Auto Detailing Hub",
      niche: "Auto Detailing & Ceramic Coating",
      website: "https://redline-detailing-vegas.com",
      googleMapsUrl: "https://maps.google.com/?q=Redline+Detailing+Las+Vegas",
      city: "Las Vegas",
      state: "NV",
      country: "USA",
      phone: "+1 (702) 555-0147",
      email: "info@redline-detailing-vegas.com",
      googleRating: "3.80",
      reviewCount: 8,
      websiteExists: false,
      websiteQuality: "POOR",
      mobileUx: "POOR",
      ctaQuality: "POOR",
      quoteBookingFlow: "None",
      trustSignals: "None listed",
      seoVisibility: "Not ranked",
      icpFit: "LOW",
      abilityToPay: "LOW",
      urgency: "LOW",
      recurringPotential: "LOW",
      buyingSignals: "None",
      mainOpportunity: "Basic digital setup and Google Business Profile optimization",
      dealValue: "4500.00",
      stageKey: "disqualified",
      assignedToId: researcherId,
      createdById: researcherId,
      notes: "Lead does not meet minimum revenue threshold. Disqualified for current quarter.",
      researchNotes: "One-man mobile operation with no physical shop.",
      contacts: [
        {
          id: "cnt_redline_1",
          firstName: "Tony",
          lastName: "Garza",
          fullName: "Tony Garza",
          jobTitle: "Operator",
          role: "Owner",
          email: "tony@redline-detailing-vegas.com",
          phone: "+1 (702) 555-0148",
          preferredChannel: "PHONE",
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

    // Insert sample activities
    await db
      .insert(activities)
      .values([
        {
          id: `act_${p.id}_1`,
          workspaceId,
          prospectId: p.id,
          userId: p.assignedToId || adminId,
          type: "RESEARCH",
          title: "Initial Digital Footprint & Competitor Audit",
          description: `Conducted in-depth website speed audit, local SEO analysis, and verified Google reviews. Identified key opportunity: ${p.mainOpportunity}`,
          outcome: `Calculated Lead Score: ${scoreResult.score} (Grade ${scoreResult.grade})`,
          nextAction: "Execute initial decision-maker outreach via preferred communication channel.",
          performedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
        },
        {
          id: `act_${p.id}_2`,
          workspaceId,
          prospectId: p.id,
          userId: p.assignedToId || adminId,
          type: "PHONE",
          title: "Discovery & Qualification Touchpoint",
          description: `Connected with key stakeholder regarding current lead acquisition challenges and growth goals for upcoming quarter.`,
          outcome: `Confirmed budget authority and active interest in proposal presentation.`,
          nextAction: "Deliver customized strategic proposal.",
          performedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // 1 day ago
        },
      ])
      .onConflictDoNothing();

    // Insert sample tasks
    await db
      .insert(tasks)
      .values([
        {
          id: `task_${p.id}_1`,
          workspaceId,
          prospectId: p.id,
          assignedToId: p.assignedToId || researcherId,
          createdById: adminId,
          title: `Follow up with ${p.contacts[0]?.fullName || "decision maker"} on commercial proposal`,
          description: `Review customized quote breakdown and schedule 15-minute alignment call.`,
          priority: p.urgency === "HIGH" ? "HIGH" : "MEDIUM",
          status: p.stageKey === "closed_won" ? "COMPLETED" : "TODO",
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // in 2 days
        },
        {
          id: `task_${p.id}_2`,
          workspaceId,
          prospectId: p.id,
          assignedToId: p.assignedToId || researcherId,
          createdById: adminId,
          title: `Enrich secondary operational contacts for ${p.name}`,
          description: `Identify VP of Marketing or Operations Director on LinkedIn Sales Navigator.`,
          priority: "NORMAL",
          status: "TODO",
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // in 5 days
        },
      ])
      .onConflictDoNothing();

    // Insert custom field values
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

  // 9. Seed Market Research Keywords
  console.log("9️⃣ Inserting Market Research Keywords...");
  const sampleKeywords = [
    {
      keyword: "commercial roofing austin",
      location: "Austin, TX",
      city: "Austin",
      state: "TX",
      niche: "Roofing & Construction",
      status: "COMPLETED",
      companyCount: 12,
    },
    {
      keyword: "commercial hvac denver",
      location: "Denver, CO",
      city: "Denver",
      state: "CO",
      niche: "HVAC & Mechanical",
      status: "COMPLETED",
      companyCount: 9,
    },
    {
      keyword: "cosmetic dentistry seattle",
      location: "Seattle, WA",
      city: "Seattle",
      state: "WA",
      niche: "Healthcare & Dental",
      status: "IN_PROGRESS",
      companyCount: 15,
    },
    {
      keyword: "solar installation phoenix",
      location: "Phoenix, AZ",
      city: "Phoenix",
      state: "AZ",
      niche: "Clean Energy & Solar",
      status: "COMPLETED",
      companyCount: 18,
    },
    {
      keyword: "medspa miami",
      location: "Miami, FL",
      city: "Miami",
      state: "FL",
      niche: "Aesthetics & MedSpa",
      status: "COMPLETED",
      companyCount: 14,
    },
  ];

  for (const kw of sampleKeywords) {
    await db
      .insert(researchKeywords)
      .values({
        id: `rk_${kw.keyword.replace(/[^a-z0-9]/g, "_")}`,
        workspaceId,
        keyword: kw.keyword,
        normalizedKeyword: kw.keyword.trim().toLowerCase(),
        niche: kw.niche,
        city: kw.city,
        state: kw.state,
        status: kw.status,
        prospectsFoundCount: kw.companyCount,
        userId: researcherId,
      })
      .onConflictDoNothing();
  }

  console.log("===============================================================");
  console.log("🎉 REVLO CRM DATABASE RESET & SEEDED WITH PRISTINE DATA (100%)");
  console.log("===============================================================");
  console.log(`👤 Admin Account:      admin@revlo.demo (Password: admin123)`);
  console.log(`👤 Researcher Account: researcher@revlo.demo (Password: researcher123)`);
  console.log(`🏢 Workspace:          Revlo Growth Lab (16 Prospects, 13 Stages, Tasks & Activities)`);
  console.log("===============================================================");
}
