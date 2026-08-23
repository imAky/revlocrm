export const CAPABILITIES = {
  // Workspace management
  WORKSPACE_VIEW: "workspace.view",
  WORKSPACE_MANAGE: "workspace.manage",

  // User & role management
  USERS_VIEW: "users.view",
  USERS_INVITE: "users.invite",
  USERS_MANAGE: "users.manage",
  ROLES_MANAGE: "roles.manage",

  // Prospects management
  PROSPECTS_VIEW: "prospects.view",
  PROSPECTS_CREATE: "prospects.create",
  PROSPECTS_EDIT: "prospects.edit",
  PROSPECTS_DELETE: "prospects.delete",
  PROSPECTS_ASSIGN: "prospects.assign",
  PROSPECTS_EXPORT: "prospects.export",

  // Contacts management
  CONTACTS_VIEW: "contacts.view",
  CONTACTS_CREATE: "contacts.create",
  CONTACTS_EDIT: "contacts.edit",
  CONTACTS_DELETE: "contacts.delete",

  // Activities & Tasks
  ACTIVITIES_VIEW: "activities.view",
  ACTIVITIES_CREATE: "activities.create",
  ACTIVITIES_EDIT: "activities.edit",
  ACTIVITIES_DELETE: "activities.delete",

  TASKS_VIEW: "tasks.view",
  TASKS_CREATE: "tasks.create",
  TASKS_EDIT: "tasks.edit",
  TASKS_DELETE: "tasks.delete",

  // Pipeline management
  PIPELINE_VIEW: "pipeline.view",
  PIPELINE_MANAGE: "pipeline.manage",

  // Custom fields
  CUSTOM_FIELDS_VIEW: "custom_fields.view",
  CUSTOM_FIELDS_MANAGE: "custom_fields.manage",

  // Import / Export
  IMPORTS_CREATE: "imports.create",
  EXPORTS_CREATE: "exports.create",

  // Dashboard & Audit
  DASHBOARD_VIEW: "dashboard.view",
  AUDIT_VIEW: "audit.view",
} as const;

export type CapabilityId = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: Object.values(CAPABILITIES),
  sales: [
    CAPABILITIES.WORKSPACE_VIEW,
    CAPABILITIES.PROSPECTS_VIEW,
    CAPABILITIES.PROSPECTS_CREATE,
    CAPABILITIES.PROSPECTS_EDIT,
    CAPABILITIES.PROSPECTS_ASSIGN,
    CAPABILITIES.CONTACTS_VIEW,
    CAPABILITIES.CONTACTS_CREATE,
    CAPABILITIES.CONTACTS_EDIT,
    CAPABILITIES.ACTIVITIES_VIEW,
    CAPABILITIES.ACTIVITIES_CREATE,
    CAPABILITIES.ACTIVITIES_EDIT,
    CAPABILITIES.TASKS_VIEW,
    CAPABILITIES.TASKS_CREATE,
    CAPABILITIES.TASKS_EDIT,
    CAPABILITIES.PIPELINE_VIEW,
    CAPABILITIES.DASHBOARD_VIEW,
    CAPABILITIES.CUSTOM_FIELDS_VIEW,
  ],
  researcher: [
    CAPABILITIES.WORKSPACE_VIEW,
    CAPABILITIES.PROSPECTS_VIEW,
    CAPABILITIES.PROSPECTS_CREATE,
    CAPABILITIES.PROSPECTS_EDIT,
    CAPABILITIES.CONTACTS_VIEW,
    CAPABILITIES.CONTACTS_CREATE,
    CAPABILITIES.CONTACTS_EDIT,
    CAPABILITIES.ACTIVITIES_VIEW,
    CAPABILITIES.ACTIVITIES_CREATE,
    CAPABILITIES.TASKS_VIEW,
    CAPABILITIES.TASKS_CREATE,
    CAPABILITIES.PIPELINE_VIEW,
    CAPABILITIES.DASHBOARD_VIEW,
    CAPABILITIES.CUSTOM_FIELDS_VIEW,
    // Note: PROSPECTS_DELETE is explicitly NOT in researcher default capabilities!
  ],
};
