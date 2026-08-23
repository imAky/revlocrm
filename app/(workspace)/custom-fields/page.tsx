import { requireAuth } from "@/lib/permissions/server-guards";
import { db } from "@/lib/db";
import { customFields, customFieldOptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CustomFieldsClient } from "@/components/custom-fields/custom-fields-client";

export default async function CustomFieldsPage() {
  const ctx = await requireAuth();

  const allFields = await db
    .select()
    .from(customFields)
    .where(eq(customFields.workspaceId, ctx.workspaceId))
    .orderBy(customFields.displayOrder);

  const canManage = ctx.permissions.has("custom_fields.manage");

  return <CustomFieldsClient initialFields={allFields} canManage={canManage} />;
}
