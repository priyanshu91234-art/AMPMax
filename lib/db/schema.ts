import {
  pgTable,
  text,
  timestamp,
  integer,
  real,
  jsonb,
  primaryKey,
  uuid,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ─── Users ──────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// ─── NextAuth Accounts (OAuth) ──────────────────────────────
export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ]
);

// ─── NextAuth Sessions ───────────────────────────────────────
export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// ─── Verification Tokens ─────────────────────────────────────
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ─── Scan Results ────────────────────────────────────────────
export const scanResults = pgTable("scan_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  frontImageUrl: text("front_image_url"),
  sideImageUrl: text("side_image_url"),
  rating: real("rating").notNull(),
  label: text("label").notNull(),
  analysis: jsonb("analysis").notNull(),
  roadmap: jsonb("roadmap").notNull(),
  products: jsonb("products").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// ─── PVP Sessions ────────────────────────────────────────────
export const pvpSessions = pgTable("pvp_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  challengerId: uuid("challenger_id").references(() => users.id),
  opponentId: uuid("opponent_id").references(() => users.id),
  challengerRating: real("challenger_rating"),
  opponentRating: real("opponent_rating"),
  winnerId: uuid("winner_id").references(() => users.id),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
