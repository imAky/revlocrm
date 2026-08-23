"use server";

import { db } from "@/lib/db";
import { activities } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requirePermission, recordAuditLog } from "@/lib/permissions/server-guards";
import { revalidatePath } from "next/cache";

export interface ActivityInput {
  prospectId: string;
  contactId?: string;
  type: string;
  title: string;
  description?: string;
  outcome?: string;
  nextAction?: string;
  performedAt?: Date;
}

export async function createActivityAction(input: ActivityInput) {
  const ctx = await requirePermission("activities.create");

  if (!input.title || !input.prospectId || !input.type) {
    return { error: "Title, type, and prospect ID are required" };
  }

  const activityId = crypto.randomUUID();

  await db.insert(activities).values({
    id: activityId,
    workspaceId: ctx.workspaceId,
    prospectId: input.prospectId,
    contactId: input.contactId || null,
    userId: ctx.userId,
    type: input.type,
    title: input.title,
    description: input.description,
    outcome: input.outcome,
    nextAction: input.nextAction,
    performedAt: input.performedAt || new Date(),
  });

  await recordAuditLog({
    workspaceId: ctx.workspaceId,
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: "activity.created",
    entityType: "ACTIVITY",
    entityId: activityId,
    afterData: { type: input.type, title: input.title },
  });

  revalidatePath(`/prospects/${input.prospectId}`);
  revalidatePath("/activities");
  revalidatePath("/dashboard");

  return { success: true, activityId };
}

export async function deleteActivityAction(activityId: string) {
  const ctx = await requirePermission("activities.delete");

  const existing = await db
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.id, activityId),
        eq(activities.workspaceId, ctx.workspaceId)
      )
    )
    .limit(1);

  if (existing.length === 0) return { error: "Activity not found" };

  await db
    .delete(activities)
    .where(
      and(
        eq(activities.id, activityId),
        eq(activities.workspaceId, ctx.workspaceId)
      )
    );

  revalidatePath(`/prospects/${existing[0].prospectId}`);
  revalidatePath("/activities");

  return { success: true };
}
