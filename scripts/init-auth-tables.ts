import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not defined in environment");
  process.exit(1);
}

const sql = neon(databaseUrl);

async function main() {
  console.log("🛠️ Initializing auth tables & schema updates...");

  // 1. Ensure password_hash in users table is nullable
  await sql`
    ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
  `.catch((err) => {
    console.log("Notice on password_hash alter:", err.message);
  });

  // 2. Ensure avatar_url column exists in users
  await sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;
  `.catch((err) => {
    console.log("Notice on avatar_url column:", err.message);
  });

  // 3. Create auth_otps table
  await sql`
    CREATE TABLE IF NOT EXISTS auth_otps (
      id text PRIMARY KEY,
      email text NOT NULL,
      otp text NOT NULL,
      type text NOT NULL DEFAULT 'login',
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // 4. Create indexes
  await sql`
    CREATE INDEX IF NOT EXISTS auth_otps_email_idx ON auth_otps(email);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS auth_otps_created_idx ON auth_otps(created_at);
  `;

  // 5. Ensure instagram_url column exists in contacts
  await sql`
    ALTER TABLE contacts ADD COLUMN IF NOT EXISTS instagram_url text;
  `.catch((err) => {
    console.log("Notice on contacts instagram_url column:", err.message);
  });

  console.log("✅ Auth tables & schema updates successfully applied to PostgreSQL!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
  });
