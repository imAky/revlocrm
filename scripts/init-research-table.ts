import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Checking and initializing research_keywords table...");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "research_keywords" (
      "id" text PRIMARY KEY,
      "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
      "user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
      "keyword" text NOT NULL,
      "normalized_keyword" text NOT NULL,
      "niche" text,
      "city" text,
      "state" text,
      "country" text DEFAULT 'US',
      "status" text NOT NULL DEFAULT 'PENDING',
      "search_engine" text NOT NULL DEFAULT 'GOOGLE_MAPS',
      "prospects_found_count" integer NOT NULL DEFAULT 0,
      "notes" text,
      "last_searched_at" timestamp with time zone,
      "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS "rk_workspace_idx" ON "research_keywords" ("workspace_id");
    CREATE INDEX IF NOT EXISTS "rk_status_idx" ON "research_keywords" ("status");
    CREATE INDEX IF NOT EXISTS "rk_niche_idx" ON "research_keywords" ("niche");
    CREATE INDEX IF NOT EXISTS "rk_norm_kw_idx" ON "research_keywords" ("normalized_keyword");
    CREATE INDEX IF NOT EXISTS "rk_ws_norm_idx" ON "research_keywords" ("workspace_id", "normalized_keyword");
  `);

  console.log("✅ research_keywords table created and verified successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
