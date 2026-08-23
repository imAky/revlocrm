"use server";

import { db } from "@/lib/db";
import { customFields, customFieldOptions, customFieldValues } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requirePermission, recordAuditLog } from "@/lib/permissions/server-guards";
import { revalidatePath } from "next/cache";

export interface CreateCustomFieldInput {
  name: string;
  key: string;
  description?: string;
  fieldType: string; // 'TEXT' | 'LONG_TEXT' | 'NUMBER' | 'CURRENCY' | 'DATE' | 'DATETIME' | 'BOOLEAN' | 'SELECT' | 'MULTI_SELECT' | 'URL' | 'EMAIL' | 'PHONE'
  section?: string;
  isRequired?: boolean;
  isFilterable?: boolean;
  options?: { label: string; value: string }[];
}

export async function createCustomFieldAction(input: CreateCustomFieldInput) {
  const ctx = await requirePermission("custom_fields.manage");

  if (!input.name || !input.key || !input.fieldType) {
    return { error: "Name, key, and field type are required" };
  }

  const cleanKey = input.key.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const fieldId = crypto.randomUUID();

  await db.insert(customFields).values({
    id: fieldId,
    workspaceId: ctx.workspaceId,
    name: input.name,
    key: cleanKey,
    description: input.description,
    fieldType: input.fieldType,
    section: input.section || "Custom Attributes",
    isRequired: !!input.isRequired,
    isFilterable: input.isFilterable !== false,
    createdById: ctx.userId,
  });

  if (input.options && input.options.length > 0) {
    for (let i = 0; i < input.options.length; i++) {
      const opt = input.options[i];
      await db.insert(customFieldOptions).values({
        id: crypto.randomUUID(),
        customFieldId: fieldId,
        label: opt.label,
        value: opt.value,
        displayOrder: i,
      });
    }
  }

  await recordAuditLog({
    workspaceId: ctx.workspaceId,
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: "custom_field.created",
    entityType: "CUSTOM_FIELD",
    entityId: fieldId,
    afterData: { name: input.name, key: cleanKey, fieldType: input.fieldType },
  });

  revalidatePath("/custom-fields");
  revalidatePath("/prospects");

  return { success: true, fieldId };
}

export async function saveCustomFieldValueAction({
  entityId,
  entityType = "PROSPECT",
  customFieldId,
  valueText,
  valueNumber,
  valueBoolean,
  valueDate,
  valueJson,
}: {
  entityId: string;
  entityType?: string;
  customFieldId: string;
  valueText?: string;
  valueNumber?: string;
  valueBoolean?: boolean;
  valueDate?: Date;
  valueJson?: string;
}) {
  const ctx = await requirePermission("prospects.edit");

  const existing = await db
    .select()
    .from(customFieldValues)
    .where(
      and(
        eq(customFieldValues.workspaceId, ctx.workspaceId),
        eq(customFieldValues.entityId, entityId),
        eq(customFieldValues.customFieldId, customFieldId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(customFieldValues)
      .set({
        valueText: valueText !== undefined ? valueText : existing[0].valueText,
        valueNumber: valueNumber !== undefined ? valueNumber : existing[0].valueNumber,
        valueBoolean: valueBoolean !== undefined ? valueBoolean : existing[0].valueBoolean,
        valueDate: valueDate !== undefined ? valueDate : existing[0].valueDate,
        valueJson: valueJson !== undefined ? valueJson : existing[0].valueJson,
        updatedAt: new Date(),
      })
      .where(eq(customFieldValues.id, existing[0].id));
  } else {
    await db.insert(customFieldValues).values({
      id: crypto.randomUUID(),
      workspaceId: ctx.workspaceId,
      entityType,
      entityId,
      customFieldId,
      valueText,
      valueNumber,
      valueBoolean,
      valueDate,
      valueJson,
    });
  }

  revalidatePath(`/prospects/${entityId}`);

  return { success: true };
}
