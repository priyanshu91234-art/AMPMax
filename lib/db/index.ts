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
 * Now also self-heals by creating missing community tables if they don't exist.
 */
export async function validateSchema() {
  if (validationStarted) return;
  validationStarted = true;
  try {
    // Check main users table
    await db.select({ id: schema.users.id }).from(schema.users).limit(1);
    
    // Check community tables and create if missing
    try {
      await db.select({ id: schema.communityPosts.id }).from(schema.communityPosts).limit(1);
    } catch (e: any) {
      if (e.message.includes("relation \"community_posts\" does not exist")) {
        console.log("[DB] Initializing Community Tables...");
        const sqlClient = neon(connectionString);
        
        await sqlClient`
          CREATE TABLE IF NOT EXISTS "community_posts" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
            "title" text NOT NULL,
            "content" text NOT NULL,
            "upvotes" integer DEFAULT 0 NOT NULL,
            "created_at" timestamp DEFAULT now() NOT NULL
          );
          
          CREATE TABLE IF NOT EXISTS "community_comments" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            "post_id" uuid NOT NULL REFERENCES "community_posts"("id") ON DELETE CASCADE,
            "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
            "content" text NOT NULL,
            "created_at" timestamp DEFAULT now() NOT NULL
          );
          
          CREATE TABLE IF NOT EXISTS "community_votes" (
            "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
            "post_id" uuid NOT NULL REFERENCES "community_posts"("id") ON DELETE CASCADE,
            "value" integer NOT NULL,
            PRIMARY KEY ("user_id", "post_id")
          );
        `;
        console.log("[DB] Community Tables created successfully.");
      }
    }

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

