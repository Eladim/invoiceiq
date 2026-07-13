import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * users — synced from Clerk via webhook (SPEC §4).
 * The primary key is the Clerk user id (string), so app rows reference auth
 * identity directly and no local id mapping is needed.
 */
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
