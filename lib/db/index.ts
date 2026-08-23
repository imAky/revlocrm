import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL || "";

// Configure postgres-js client for server actions and queries
const client = postgres(connectionString, {
  prepare: false,
  max: process.env.NODE_ENV === "production" ? 10 : 1,
});

export const db = drizzle(client, { schema });
export type Database = typeof db;
