import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// -----------------------------------------------------------------------------
// WORKSPACES & MULTI-TENANCY
// -----------------------------------------------------------------------------

export const workspaces = pgTable(
  "workspaces",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logoUrl: text("logo_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [index("workspace_slug_idx").on(table.slug)]
);

// -----------------------------------------------------------------------------
// USERS & SESSIONS
// -----------------------------------------------------------------------------

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [index("users_email_idx").on(table.email)]
);

// -----------------------------------------------------------------------------
// ROLES & PERMISSIONS (RBAC + CAPABILITIES)
// -----------------------------------------------------------------------------

export const roles = pgTable("roles", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").references(() => workspaces.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(), // 'admin' | 'researcher' | 'sales' | custom
  description: text("description"),
  isSystem: boolean("is_system").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const permissions = pgTable("permissions", {
  id: text("id").primaryKey(), // e.g. 'prospects.view', 'prospects.delete'
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] }),
  ]
);

export const memberships = pgTable(
  "memberships",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    status: text("status").default("active").notNull(), // 'active' | 'inactive' | 'suspended'
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("membership_workspace_user_idx").on(table.workspaceId, table.userId),
  ]
);

export const userPermissions = pgTable(
  "user_permissions",
  {
    id: text("id").primaryKey(),
    membershipId: text("membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    granted: boolean("granted").default(true).notNull(), // explicit grant or explicit deny
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("user_perm_membership_idx").on(table.membershipId, table.permissionId),
  ]
);

export const invitations = pgTable(
  "invitations",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    status: text("status").default("pending").notNull(), // 'pending' | 'accepted' | 'expired' | 'revoked'
    invitedById: text("invited_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("invitation_token_idx").on(table.token),
    index("invitation_workspace_idx").on(table.workspaceId),
  ]
);

// -----------------------------------------------------------------------------
// PIPELINE STAGES
// -----------------------------------------------------------------------------

export const pipelineStages = pgTable(
  "pipeline_stages",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    key: text("key").notNull(),
    description: text("description"),
    orderIndex: integer("order_index").notNull(),
    color: text("color").default("zinc").notNull(),
    isSystem: boolean("is_system").default(false).notNull(),
    isClosedWon: boolean("is_closed_won").default(false).notNull(),
    isClosedLost: boolean("is_closed_lost").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("pipeline_stage_workspace_order_idx").on(
      table.workspaceId,
      table.orderIndex
    ),
  ]
);

// -----------------------------------------------------------------------------
// PROSPECTS / COMPANIES (CORE RECORD)
// -----------------------------------------------------------------------------

export const prospects = pgTable(
  "prospects",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    // Business identity
    name: text("name").notNull(),
    legalName: text("legal_name"),
    category: text("category"),
    niche: text("niche"),
    website: text("website"),
    googleMapsUrl: text("google_maps_url"),
    country: text("country"),
    state: text("state"),
    city: text("city"),
    address: text("address"),
    postalCode: text("postal_code"),
    phone: text("phone"),
    email: text("email"),
    businessStatus: text("business_status").default("OPERATIONAL").notNull(),

    // Google / Local Signals
    googleRating: numeric("google_rating", { precision: 3, scale: 2 }),
    reviewCount: integer("review_count"),
    googleProfileUrl: text("google_profile_url"),
    lastCheckedDate: timestamp("last_checked_date", { withTimezone: true }),

    // Digital Presence Audit
    websiteExists: boolean("website_exists").default(true).notNull(),
    websiteQuality: text("website_quality"), // 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT'
    mobileUx: text("mobile_ux"), // 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT'
    ctaQuality: text("cta_quality"), // 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT'
    quoteBookingFlow: text("quote_booking_flow"),
    trustSignals: text("trust_signals"),
    seoVisibility: text("seo_visibility"),
    speedScore: integer("speed_score"),
    facebookUrl: text("facebook_url"),
    instagramUrl: text("instagram_url"),
    linkedInUrl: text("linkedin_url"),

    // Qualification & Scoring
    leadScore: integer("lead_score").default(0).notNull(),
    leadGrade: text("lead_grade").default("C").notNull(), // 'A+' | 'A' | 'B' | 'C' | 'D'
    icpFit: text("icp_fit"), // 'HIGH' | 'MEDIUM' | 'LOW'
    abilityToPay: text("ability_to_pay"), // 'HIGH' | 'MEDIUM' | 'LOW'
    urgency: text("urgency"), // 'HIGH' | 'MEDIUM' | 'LOW'
    recurringPotential: text("recurring_potential"), // 'HIGH' | 'MEDIUM' | 'LOW'
    buyingSignals: text("buying_signals"),
    mainOpportunity: text("main_opportunity"),
    leadSource: text("lead_source"),
    dealValue: numeric("deal_value", { precision: 12, scale: 2 }),

    // Pipeline & Outreach Status
    stageId: text("stage_id").references(() => pipelineStages.id, {
      onDelete: "set null",
    }),
    stageChangedAt: timestamp("stage_changed_at", { withTimezone: true }),
    outreachStatus: text("outreach_status"),
    firstContactDate: timestamp("first_contact_date", { withTimezone: true }),
    lastContactDate: timestamp("last_contact_date", { withTimezone: true }),
    nextFollowUpDate: timestamp("next_follow_up_date", { withTimezone: true }),
    responseStatus: text("response_status"),

    // Ownership & Metadata
    assignedToId: text("assigned_to_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    researchNotes: text("research_notes"),
    isArchived: boolean("is_archived").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("prospects_workspace_idx").on(table.workspaceId),
    index("prospects_name_idx").on(table.name),
    index("prospects_stage_idx").on(table.stageId),
    index("prospects_assigned_idx").on(table.assignedToId),
    index("prospects_score_idx").on(table.leadScore),
    index("prospects_niche_idx").on(table.niche),
    index("prospects_follow_up_idx").on(table.nextFollowUpDate),
  ]
);

// -----------------------------------------------------------------------------
// CONTACTS
// -----------------------------------------------------------------------------

export const contacts = pgTable(
  "contacts",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    prospectId: text("prospect_id")
      .notNull()
      .references(() => prospects.id, { onDelete: "cascade" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name"),
    fullName: text("full_name").notNull(),
    jobTitle: text("job_title"),
    role: text("role"),
    email: text("email"),
    phone: text("phone"),
    linkedInUrl: text("linkedin_url"),
    facebookUrl: text("facebook_url"),
    preferredChannel: text("preferred_channel"), // 'EMAIL' | 'PHONE' | 'LINKEDIN' | 'WHATSAPP'
    isDecisionMaker: boolean("is_decision_maker").default(false).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("contacts_prospect_idx").on(table.prospectId),
    index("contacts_workspace_idx").on(table.workspaceId),
    index("contacts_email_idx").on(table.email),
  ]
);

// -----------------------------------------------------------------------------
// ACTIVITIES
// -----------------------------------------------------------------------------

export const activities = pgTable(
  "activities",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    prospectId: text("prospect_id")
      .notNull()
      .references(() => prospects.id, { onDelete: "cascade" }),
    contactId: text("contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // 'NOTE' | 'EMAIL' | 'PHONE' | 'LINKEDIN' | 'WHATSAPP' | 'MEETING' | 'RESEARCH' | 'PROPOSAL' | 'FOLLOW_UP' | 'STAGE_CHANGE' | 'OTHER'
    title: text("title").notNull(),
    description: text("description"),
    outcome: text("outcome"),
    nextAction: text("next_action"),
    performedAt: timestamp("performed_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("activities_prospect_idx").on(table.prospectId),
    index("activities_workspace_idx").on(table.workspaceId),
    index("activities_user_idx").on(table.userId),
    index("activities_performed_idx").on(table.performedAt),
  ]
);

// -----------------------------------------------------------------------------
// TASKS & FOLLOW-UPS
// -----------------------------------------------------------------------------

export const tasks = pgTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    prospectId: text("prospect_id").references(() => prospects.id, {
      onDelete: "cascade",
    }),
    contactId: text("contact_id").references(() => contacts.id, {
      onDelete: "set null",
    }),
    assignedToId: text("assigned_to_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdById: text("created_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    priority: text("priority").default("MEDIUM").notNull(), // 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    status: text("status").default("TODO").notNull(), // 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("tasks_workspace_idx").on(table.workspaceId),
    index("tasks_assigned_idx").on(table.assignedToId),
    index("tasks_due_date_idx").on(table.dueDate),
    index("tasks_status_idx").on(table.status),
  ]
);

// -----------------------------------------------------------------------------
// DYNAMIC CUSTOM FIELDS ENGINE
// -----------------------------------------------------------------------------

export const customFields = pgTable(
  "custom_fields",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    entityType: text("entity_type").default("PROSPECT").notNull(), // 'PROSPECT' | 'CONTACT'
    name: text("name").notNull(),
    key: text("key").notNull(),
    description: text("description"),
    fieldType: text("field_type").notNull(), // 'TEXT' | 'LONG_TEXT' | 'NUMBER' | 'CURRENCY' | 'DATE' | 'DATETIME' | 'BOOLEAN' | 'SELECT' | 'MULTI_SELECT' | 'URL' | 'EMAIL' | 'PHONE'
    isRequired: boolean("is_required").default(false).notNull(),
    defaultValue: text("default_value"),
    placeholder: text("placeholder"),
    helpText: text("help_text"),
    section: text("section").default("Custom Attributes").notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    isFilterable: boolean("is_filterable").default(true).notNull(),
    isSearchable: boolean("is_searchable").default(false).notNull(),
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("custom_fields_workspace_key_idx").on(
      table.workspaceId,
      table.key
    ),
  ]
);

export const customFieldOptions = pgTable(
  "custom_field_options",
  {
    id: text("id").primaryKey(),
    customFieldId: text("custom_field_id")
      .notNull()
      .references(() => customFields.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    value: text("value").notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    color: text("color"),
  },
  (table) => [
    index("custom_field_options_field_idx").on(table.customFieldId),
  ]
);

export const customFieldValues = pgTable(
  "custom_field_values",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    customFieldId: text("custom_field_id")
      .notNull()
      .references(() => customFields.id, { onDelete: "cascade" }),
    valueText: text("value_text"),
    valueNumber: numeric("value_number", { precision: 15, scale: 4 }),
    valueBoolean: boolean("value_boolean"),
    valueDate: timestamp("value_date", { withTimezone: true }),
    valueJson: text("value_json"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("cfv_workspace_entity_idx").on(
      table.workspaceId,
      table.entityType,
      table.entityId
    ),
    index("cfv_field_idx").on(table.customFieldId),
  ]
);

// -----------------------------------------------------------------------------
// AUDIT LOGS (SECURITY & TRACEABILITY)
// -----------------------------------------------------------------------------

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    actorId: text("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    actorEmail: text("actor_email"),
    action: text("action").notNull(), // 'prospect.created' | 'prospect.deleted' | 'permission.updated' | etc.
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    beforeData: text("before_data"),
    afterData: text("after_data"),
    metadata: text("metadata"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("audit_logs_workspace_idx").on(table.workspaceId),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ]
);
