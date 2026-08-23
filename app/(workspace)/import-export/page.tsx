import { requireAuth } from "@/lib/permissions/server-guards";
import { db } from "@/lib/db";
import { prospects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { ImportExportClient } from "@/components/import-export/import-export-client";

export default async function ImportExportPage() {
  const ctx = await requireAuth();

  const existingProspects = await db
    .select()
    .from(prospects)
    .where(
      and(
        eq(prospects.workspaceId, ctx.workspaceId),
        eq(prospects.isArchived, false)
      )
    );

  const canExport = ctx.permissions.has("prospects.export");

  return (
    <ImportExportClient
      existingProspects={existingProspects}
      canExport={canExport}
    />
  );
}
