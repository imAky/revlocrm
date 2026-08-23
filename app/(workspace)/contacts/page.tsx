import { requireAuth } from "@/lib/permissions/server-guards";
import { db } from "@/lib/db";
import { contacts, prospects } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import Link from "next/link";
import { Users2, Mail, Phone, ExternalLink, Building2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";

export default async function ContactsPage() {
  const ctx = await requireAuth();

  const allContacts = await db
    .select({
      id: contacts.id,
      fullName: contacts.fullName,
      jobTitle: contacts.jobTitle,
      email: contacts.email,
      phone: contacts.phone,
      linkedInUrl: contacts.linkedInUrl,
      preferredChannel: contacts.preferredChannel,
      isDecisionMaker: contacts.isDecisionMaker,
      prospectId: contacts.prospectId,
      prospectName: prospects.name,
      prospectNiche: prospects.niche,
    })
    .from(contacts)
    .innerJoin(prospects, eq(contacts.prospectId, prospects.id))
    .where(eq(contacts.workspaceId, ctx.workspaceId))
    .orderBy(desc(contacts.isDecisionMaker), contacts.fullName);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Contacts & Decision Makers
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Directory of key executive stakeholders, founders, and department leads.
          </p>
        </div>
        <Badge variant="secondary" className="text-xs font-mono">
          {allContacts.length} Total Contacts
        </Badge>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact Name</TableHead>
              <TableHead>Role / Title</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Preferred Channel</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {allContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-xs text-muted-foreground">
                  No contacts found in workspace.
                </TableCell>
              </TableRow>
            ) : (
              allContacts.map((cnt) => (
                <TableRow key={cnt.id}>
                  <TableCell>
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      <span>{cnt.fullName}</span>
                      {cnt.isDecisionMaker && (
                        <Badge variant="purple" className="text-[9px] px-1.5 py-0">
                          DM
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {cnt.jobTitle || "—"}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Link
                      href={`/prospects/${cnt.prospectId}`}
                      className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                    >
                      <Building2 className="h-3 w-3" />
                      {cnt.prospectName}
                    </Link>
                  </TableCell>

                  <TableCell>
                    {cnt.email ? (
                      <a href={`mailto:${cnt.email}`} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3 text-indigo-400" />
                        {cnt.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>

                  <TableCell>
                    {cnt.phone ? (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3 text-emerald-400" />
                        {cnt.phone}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">
                      {cnt.preferredChannel || "EMAIL"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <Link
                      href={`/prospects/${cnt.prospectId}`}
                      className="text-xs text-primary font-medium hover:underline"
                    >
                      View Company
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
