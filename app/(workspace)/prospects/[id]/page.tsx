import { requireAuth } from "@/lib/permissions/server-guards";
import { db } from "@/lib/db";
import {
  prospects,
  contacts,
  activities,
  tasks,
  pipelineStages,
  users,
  customFields,
  customFieldValues,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { ProspectDetailClient } from "@/components/prospects/prospect-detail-client";
import { notFound } from "next/navigation";

export default async function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireAuth();

  // 1. Fetch prospect
  const prospectList = await db
    .select()
    .from(prospects)
    .where(
      and(
        eq(prospects.id, id),
        eq(prospects.workspaceId, ctx.workspaceId),
        eq(prospects.isArchived, false)
      )
    )
    .limit(1);

  if (prospectList.length === 0) {
    notFound();
  }

  const prospect = prospectList[0];

  // 2. Fetch contacts
  const contactsList = await db
    .select()
    .from(contacts)
    .where(
      and(
        eq(contacts.prospectId, id),
        eq(contacts.workspaceId, ctx.workspaceId)
      )
    )
    .orderBy(desc(contacts.isDecisionMaker));

  // 3. Fetch activities
  const activitiesList = await db
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.prospectId, id),
        eq(activities.workspaceId, ctx.workspaceId)
      )
    )
    .orderBy(desc(activities.performedAt));

  // 4. Fetch tasks
  const tasksList = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.prospectId, id),
        eq(tasks.workspaceId, ctx.workspaceId)
      )
    )
    .orderBy(tasks.dueDate);

  // 5. Fetch stages & users
  const stages = await db
    .select()
    .from(pipelineStages)
    .where(eq(pipelineStages.workspaceId, ctx.workspaceId))
    .orderBy(pipelineStages.orderIndex);

  const workspaceUsers = await db.select({ id: users.id, name: users.name }).from(users);

  // 6. Fetch custom fields & values
  const customFieldsList = await db
    .select()
    .from(customFields)
    .where(
      and(
        eq(customFields.workspaceId, ctx.workspaceId),
        eq(customFields.isActive, true)
      )
    )
    .orderBy(customFields.displayOrder);

  const valuesList = await db
    .select()
    .from(customFieldValues)
    .where(
      and(
        eq(customFieldValues.workspaceId, ctx.workspaceId),
        eq(customFieldValues.entityId, id)
      )
    );

  const customFieldValuesMap: Record<string, string> = {};
  for (const v of valuesList) {
    customFieldValuesMap[v.customFieldId] =
      v.valueText ||
      (v.valueNumber !== null ? String(v.valueNumber) : "") ||
      (v.valueBoolean !== null ? (v.valueBoolean ? "Yes" : "No") : "") ||
      "";
  }

  const canDelete = ctx.permissions.has("prospects.delete");

  return (
    <ProspectDetailClient
      prospect={prospect}
      contactsList={contactsList}
      activitiesList={activitiesList}
      tasksList={tasksList}
      customFieldsList={customFieldsList}
      customFieldValuesMap={customFieldValuesMap}
      stages={stages}
      workspaceUsers={workspaceUsers}
      canDelete={canDelete}
    />
  );
}
