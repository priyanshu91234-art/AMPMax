import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// DATABASE_URL is required at runtime. During `next build` without .env.local,
// we provide a stub so imports don't crash — the actual DB calls only happen at runtime.
const connectionString =
  process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@placeholder/placeholder";

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });

let validationStarted = false;

/**
 * Validates that the database connection is working and required tables exist.
 */
export async function validateSchema() {
  if (validationStarted) return;
  validationStarted = true;
  try {
    // Check main users table
    await db.select({ id: schema.users.id }).from(schema.users).limit(1);
    console.log("[DB] Schema validation successful.");
  } catch (error: any) {
    if (error.message.includes("relation \"users\" does not exist")) {
      console.error("[DB] CRITICAL: 'users' table missing. Run migrations.");
      throw new Error("DATABASE_ERROR: 'users' table is missing. Run 'npx drizzle-kit push'.");
    }
    console.error("[DB] Validation error:", error.message);
  }
}

// Fire off validation
validateSchema();

