import { requireAuth } from "@/lib/permissions/server-guards";
import { db } from "@/lib/db";
import {
  prospects,
  contacts,
  activities,
  tasks,
  taskLogs,
  pipelineStages,
  users,
  customFields,
  customFieldValues,
  prospectMedia,
} from "@/lib/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { getOrSeedWorkspaceStages } from "@/lib/db/stages";
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

  // 2. Fetch all related entities in parallel
  const [
    contactsList,
    rawActivitiesList,
    tasksList,
    rawTaskLogsList,
    stages,
    workspaceUsers,
    customFieldsList,
    valuesList,
    rawMediaList,
  ] = await Promise.all([
    // Contacts
    db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.prospectId, id),
          eq(contacts.workspaceId, ctx.workspaceId)
        )
      )
      .orderBy(desc(contacts.isDecisionMaker)),

    // Activities with user attribution
    db
      .select({
        id: activities.id,
        workspaceId: activities.workspaceId,
        prospectId: activities.prospectId,
        contactId: activities.contactId,
        userId: activities.userId,
        userName: users.name,
        type: activities.type,
        title: activities.title,
        description: activities.description,
        outcome: activities.outcome,
        nextAction: activities.nextAction,
        attachmentUrl: activities.attachmentUrl,
        performedAt: activities.performedAt,
        createdAt: activities.createdAt,
      })
      .from(activities)
      .leftJoin(users, eq(activities.userId, users.id))
      .where(
        and(
          eq(activities.prospectId, id),
          eq(activities.workspaceId, ctx.workspaceId)
        )
      )
      .orderBy(desc(activities.performedAt)),

    // Tasks with assignees
    db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        dueDate: tasks.dueDate,
        priority: tasks.priority,
        status: tasks.status,
        prospectId: tasks.prospectId,
        prospectName: prospects.name,
        assignedToId: tasks.assignedToId,
        assignedToName: users.name,
        createdById: tasks.createdById,
        createdAt: tasks.createdAt,
        completedAt: tasks.completedAt,
      })
      .from(tasks)
      .leftJoin(prospects, eq(tasks.prospectId, prospects.id))
      .leftJoin(users, eq(tasks.assignedToId, users.id))
      .where(
        and(
          eq(tasks.prospectId, id),
          eq(tasks.workspaceId, ctx.workspaceId)
        )
      )
      .orderBy(desc(tasks.createdAt)),

    // Task Logs
    db
      .select({
        id: taskLogs.id,
        taskId: taskLogs.taskId,
        userId: taskLogs.userId,
        userName: users.name,
        userEmail: users.email,
        action: taskLogs.action,
        note: taskLogs.note,
        attachmentUrl: taskLogs.attachmentUrl,
        createdAt: taskLogs.createdAt,
      })
      .from(taskLogs)
      .leftJoin(users, eq(taskLogs.userId, users.id))
      .where(eq(taskLogs.workspaceId, ctx.workspaceId))
      .orderBy(desc(taskLogs.createdAt)),

    // Pipeline Stages (Guaranteed 13 stages)
    getOrSeedWorkspaceStages(ctx.workspaceId),

    // Users
    db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .orderBy(users.name),

    // Custom Fields
    db
      .select()
      .from(customFields)
      .where(
        and(
          eq(customFields.workspaceId, ctx.workspaceId),
          eq(customFields.isActive, true)
        )
      )
      .orderBy(customFields.displayOrder),

    // Custom Field Values
    db
      .select()
      .from(customFieldValues)
      .where(
        and(
          eq(customFieldValues.workspaceId, ctx.workspaceId),
          eq(customFieldValues.entityId, id)
        )
      ),

    // Prospect Media & Cloud Resources
    db
      .select({
        id: prospectMedia.id,
        workspaceId: prospectMedia.workspaceId,
        prospectId: prospectMedia.prospectId,
        userId: prospectMedia.userId,
        userName: users.name,
        title: prospectMedia.title,
        description: prospectMedia.description,
        type: prospectMedia.type,
        url: prospectMedia.url,
        fileSize: prospectMedia.fileSize,
        mimeType: prospectMedia.mimeType,
        thumbnailUrl: prospectMedia.thumbnailUrl,
        category: prospectMedia.category,
        isPinned: prospectMedia.isPinned,
        createdAt: prospectMedia.createdAt,
        updatedAt: prospectMedia.updatedAt,
      })
      .from(prospectMedia)
      .leftJoin(users, eq(prospectMedia.userId, users.id))
      .where(
        and(
          eq(prospectMedia.prospectId, id),
          eq(prospectMedia.workspaceId, ctx.workspaceId)
        )
      )
      .orderBy(desc(prospectMedia.isPinned), desc(prospectMedia.createdAt)),
  ]);

  const activitiesList = rawActivitiesList.map((a) => ({
    ...a,
    userName: a.userName || "Team Member",
  }));

  const taskLogsList = rawTaskLogsList.map((l) => ({
    ...l,
    userName: l.userName || "Team Member",
  }));

  const mediaList = rawMediaList.map((m) => ({
    ...m,
    userName: m.userName || "Team Member",
  }));

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
      taskLogsList={taskLogsList}
      mediaList={mediaList}
      customFieldsList={customFieldsList}
      customFieldValuesMap={customFieldValuesMap}
      stages={stages}
      workspaceUsers={workspaceUsers}
      currentUserId={ctx.userId}
      canDelete={canDelete}
    />
  );
}
