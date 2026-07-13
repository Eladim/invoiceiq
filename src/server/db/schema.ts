import { relations } from "drizzle-orm";
import {
  char,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// ── Enums ─────────────────────────────────────────────────────────────────────
export const planEnum = pgEnum("plan", ["free", "pro"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "past_due",
  "canceled",
  "trialing",
]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "processing",
  "completed",
  "failed",
]);
export const categoryEnum = pgEnum("category", [
  "software",
  "office",
  "travel",
  "utilities",
  "marketing",
  "other",
]);

// Per-field confidence emitted by the extraction model (SPEC §7).
export type FieldConfidence = Record<string, "low" | "medium" | "high">;

// ── users ─────────────────────────────────────────────────────────────────────
// Synced from Clerk via webhook (SPEC §4). PK is the Clerk user id.
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── subscriptions ─────────────────────────────────────────────────────────────
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id"),
  // Unique so subscription webhooks can upsert idempotently (SPEC §6).
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  plan: planEnum("plan").notNull().default("free"),
  status: subscriptionStatusEnum("status"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// ── invoices ──────────────────────────────────────────────────────────────────
export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    blobUrl: text("blob_url").notNull(),
    originalFilename: text("original_filename").notNull(),
    status: invoiceStatusEnum("status").notNull().default("processing"),
    failureReason: text("failure_reason"),
    vendorName: text("vendor_name"),
    vendorAddress: text("vendor_address"),
    invoiceNumber: text("invoice_number"),
    invoiceDate: date("invoice_date"),
    dueDate: date("due_date"),
    currency: char("currency", { length: 3 }),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }),
    tax: numeric("tax", { precision: 12, scale: 2 }),
    total: numeric("total", { precision: 12, scale: 2 }),
    category: categoryEnum("category"),
    confidence: jsonb("confidence").$type<FieldConfidence>(),
    rawExtraction: jsonb("raw_extraction"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("invoices_user_created_idx").on(t.userId, t.createdAt),
    index("invoices_user_vendor_idx").on(t.userId, t.vendorName),
  ],
);

// ── line_items ────────────────────────────────────────────────────────────────
export const lineItems = pgTable("line_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: numeric("quantity"),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
});

// ── usage_counters ────────────────────────────────────────────────────────────
// Composite PK (user_id, period) → quota check is one indexed read (SPEC §4).
export const usageCounters = pgTable(
  "usage_counters",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    period: char("period", { length: 7 }).notNull(), // 'YYYY-MM'
    documentsUsed: integer("documents_used").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.period] })],
);

// ── Relations ─────────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ one, many }) => ({
  subscription: one(subscriptions),
  invoices: many(invoices),
  usageCounters: many(usageCounters),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  user: one(users, { fields: [invoices.userId], references: [users.id] }),
  lineItems: many(lineItems),
}));

export const lineItemsRelations = relations(lineItems, ({ one }) => ({
  invoice: one(invoices, { fields: [lineItems.invoiceId], references: [invoices.id] }),
}));

export const usageCountersRelations = relations(usageCounters, ({ one }) => ({
  user: one(users, { fields: [usageCounters.userId], references: [users.id] }),
}));

// ── Inferred types ────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type LineItem = typeof lineItems.$inferSelect;
export type NewLineItem = typeof lineItems.$inferInsert;
export type UsageCounter = typeof usageCounters.$inferSelect;
export type NewUsageCounter = typeof usageCounters.$inferInsert;
