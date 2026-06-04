import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// DATABASE_URL is required at runtime. During `next build` without .env.local,
// we provide a stub so imports don't crash — the actual DB calls only happen at runtime.
const connectionString =
  process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@placeholder/placeholder";

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
