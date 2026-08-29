import { requireAuth } from "@/lib/permissions/server-guards";
import { db } from "@/lib/db";
import { contacts, prospects } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { ContactsClient } from "@/components/contacts/contacts-client";

export default async function ContactsPage() {
  const ctx = await requireAuth();

  const [rawContacts, workspaceProspects] = await Promise.all([
    db
      .select({
        id: contacts.id,
        fullName: contacts.fullName,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        jobTitle: contacts.jobTitle,
        role: contacts.role,
        email: contacts.email,
        phone: contacts.phone,
        linkedInUrl: contacts.linkedInUrl,
        facebookUrl: contacts.facebookUrl,
        preferredChannel: contacts.preferredChannel,
        isDecisionMaker: contacts.isDecisionMaker,
        notes: contacts.notes,
        prospectId: contacts.prospectId,
        prospectName: prospects.name,
        prospectNiche: prospects.niche,
      })
      .from(contacts)
      .leftJoin(prospects, eq(contacts.prospectId, prospects.id))
      .where(eq(contacts.workspaceId, ctx.workspaceId))
      .orderBy(desc(contacts.isDecisionMaker), contacts.fullName),

    db
      .select({
        id: prospects.id,
        name: prospects.name,
        niche: prospects.niche,
      })
      .from(prospects)
      .where(eq(prospects.workspaceId, ctx.workspaceId))
      .orderBy(prospects.name),
  ]);

  const canDelete = ctx.permissions.has("contacts.delete");

  return (
    <ContactsClient
      initialContacts={rawContacts}
      prospectsList={workspaceProspects}
      canDelete={canDelete}
    />
  );
}
