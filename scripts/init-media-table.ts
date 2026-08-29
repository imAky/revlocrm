import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Checking and initializing prospect_media table...");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "prospect_media" (
      "id" text PRIMARY KEY,
      "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
      "prospect_id" text NOT NULL REFERENCES "prospects"("id") ON DELETE CASCADE,
      "user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
      "title" text NOT NULL,
      "description" text,
      "type" text NOT NULL,
      "url" text NOT NULL,
      "file_size" integer,
      "mime_type" text,
      "thumbnail_url" text,
      "category" text NOT NULL DEFAULT 'GENERAL',
      "is_pinned" boolean NOT NULL DEFAULT false,
      "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS "pm_workspace_idx" ON "prospect_media" ("workspace_id");
    CREATE INDEX IF NOT EXISTS "pm_prospect_idx" ON "prospect_media" ("prospect_id");
    CREATE INDEX IF NOT EXISTS "pm_type_idx" ON "prospect_media" ("type");
    CREATE INDEX IF NOT EXISTS "pm_category_idx" ON "prospect_media" ("category");
    CREATE INDEX IF NOT EXISTS "pm_pinned_idx" ON "prospect_media" ("is_pinned");
  `);

  console.log("✅ prospect_media table created and verified successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
