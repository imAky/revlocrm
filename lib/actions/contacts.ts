"use server";

import { db } from "@/lib/db";
import { contacts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requirePermission, recordAuditLog } from "@/lib/permissions/server-guards";
import { revalidatePath } from "next/cache";

export interface ContactInput {
  prospectId: string;
  firstName: string;
  lastName?: string;
  jobTitle?: string;
  role?: string;
  email?: string;
  phone?: string;
  linkedInUrl?: string;
  facebookUrl?: string;
  preferredChannel?: string;
  isDecisionMaker?: boolean;
  notes?: string;
}

export async function createContactAction(input: ContactInput) {
  const ctx = await requirePermission("contacts.create");

  if (!input.firstName || !input.prospectId) {
    return { error: "First name and prospect ID are required" };
  }

  const fullName = `${input.firstName} ${input.lastName || ""}`.trim();
  const contactId = crypto.randomUUID();

  await db.insert(contacts).values({
    id: contactId,
    workspaceId: ctx.workspaceId,
    prospectId: input.prospectId,
    firstName: input.firstName,
    lastName: input.lastName,
    fullName,
    jobTitle: input.jobTitle,
    role: input.role,
    email: input.email,
    phone: input.phone,
    linkedInUrl: input.linkedInUrl,
    facebookUrl: input.facebookUrl,
    preferredChannel: input.preferredChannel || "EMAIL",
    isDecisionMaker: !!input.isDecisionMaker,
    notes: input.notes,
  });

  await recordAuditLog({
    workspaceId: ctx.workspaceId,
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: "contact.created",
    entityType: "CONTACT",
    entityId: contactId,
    afterData: { fullName, prospectId: input.prospectId },
  });

  revalidatePath(`/prospects/${input.prospectId}`);
  revalidatePath("/contacts");

  return { success: true, contactId };
}

export async function updateContactAction(
  contactId: string,
  input: Partial<ContactInput>
) {
  const ctx = await requirePermission("contacts.edit");

  const existing = await db
    .select()
    .from(contacts)
    .where(
      and(
        eq(contacts.id, contactId),
        eq(contacts.workspaceId, ctx.workspaceId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    return { error: "Contact not found" };
  }

  const firstName = input.firstName ?? existing[0].firstName;
  const lastName = input.lastName ?? existing[0].lastName;
  const fullName = `${firstName} ${lastName || ""}`.trim();

  await db
    .update(contacts)
    .set({
      ...input,
      fullName,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(contacts.id, contactId),
        eq(contacts.workspaceId, ctx.workspaceId)
      )
    );

  revalidatePath(`/prospects/${existing[0].prospectId}`);
  revalidatePath("/contacts");

  return { success: true };
}

export async function deleteContactAction(contactId: string) {
  const ctx = await requirePermission("contacts.delete");

  const existing = await db
    .select()
    .from(contacts)
    .where(
      and(
        eq(contacts.id, contactId),
        eq(contacts.workspaceId, ctx.workspaceId)
      )
    )
    .limit(1);

  if (existing.length === 0) return { error: "Contact not found" };

  await db
    .delete(contacts)
    .where(
      and(
        eq(contacts.id, contactId),
        eq(contacts.workspaceId, ctx.workspaceId)
      )
    );

  await recordAuditLog({
    workspaceId: ctx.workspaceId,
    actorId: ctx.userId,
    actorEmail: ctx.email,
    action: "contact.deleted",
    entityType: "CONTACT",
    entityId: contactId,
  });

  revalidatePath(`/prospects/${existing[0].prospectId}`);
  revalidatePath("/contacts");

  return { success: true };
}
