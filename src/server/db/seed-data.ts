import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";
import { invoices, lineItems, subscriptions, usageCounters, users } from "./schema";

const VENDORS = [
  { name: "Vercel Inc.", category: "software", address: "440 N Barranca Ave, Covina, CA" },
  { name: "Figma", category: "software", address: "760 Market St, San Francisco, CA" },
  { name: "WeWork", category: "office", address: "115 W 18th St, New York, NY" },
  { name: "Deutsche Bahn", category: "travel", address: "Potsdamer Platz 2, Berlin" },
  { name: "British Gas", category: "utilities", address: "Millstream, Maidenhead" },
  { name: "Google Ads", category: "marketing", address: "1600 Amphitheatre Pkwy, Mountain View" },
  { name: "Staples", category: "office", address: "500 Staples Dr, Framingham, MA" },
  { name: "AWS", category: "software", address: "410 Terry Ave N, Seattle, WA" },
] as const;

const LINE_LABELS: Record<string, string[]> = {
  software: ["Pro plan (monthly)", "Seat license", "Usage overage", "Support add-on"],
  office: ["Desk rental", "Printer paper A4", "Ergonomic chair", "Whiteboard markers"],
  travel: ["Rail fare", "Seat reservation", "City transfer", "Baggage fee"],
  utilities: ["Electricity", "Gas", "Standing charge", "VAT adjustment"],
  marketing: ["Search campaign", "Display ads", "Retargeting", "Management fee"],
  other: ["Miscellaneous", "Service fee", "Adjustment", "Credit"],
};

const money = (n: number) => n.toFixed(2);
const iso = (d: Date) => d.toISOString().slice(0, 10);

export function getSeedDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  return drizzle(neon(url), { schema });
}

/**
 * Seed ~30 realistic invoices for a user (idempotent — wipes the user's data
 * first). Used by `pnpm db:seed` and `pnpm demo:setup`.
 */
export async function seedDemoData(
  userId: string,
  opts: { email?: string; name?: string; usageThisMonth?: number } = {},
): Promise<{ invoices: number; usage: number }> {
  const db = getSeedDb();
  const email = opts.email ?? "demo@invoiceiq.app";
  const name = opts.name ?? "Demo User";

  // Idempotent: wipe the user (cascades to invoices, line items, sub, usage).
  await db.delete(users).where(eq(users.id, userId));
  await db.insert(users).values({ id: userId, email, name });
  await db.insert(subscriptions).values({ userId, plan: "free", status: "active" });

  const now = new Date();
  const currentPeriod = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  const INVOICE_COUNT = 30;
  let usedThisMonth = 0;

  for (let i = 0; i < INVOICE_COUNT; i++) {
    const vendor = VENDORS[i % VENDORS.length];
    const currency =
      vendor.name === "Deutsche Bahn" || vendor.name === "British Gas" ? "EUR" : "USD";

    const issued = new Date(now);
    issued.setUTCMonth(issued.getUTCMonth() - (i % 6));
    issued.setUTCDate(1 + ((i * 7) % 26));
    const due = new Date(issued);
    due.setUTCDate(due.getUTCDate() + 30);

    const period = `${issued.getUTCFullYear()}-${String(issued.getUTCMonth() + 1).padStart(2, "0")}`;
    if (period === currentPeriod) usedThisMonth++;

    // Two failed + one processing for realistic states; the rest completed.
    const status = i === 0 ? "processing" : i === 1 || i === 2 ? "failed" : "completed";

    const labels = LINE_LABELS[vendor.category] ?? LINE_LABELS.other;
    const itemCount = 1 + (i % 3);
    const items = Array.from({ length: itemCount }, (_, j) => {
      const quantity = 1 + ((i + j) % 3);
      const unitPrice = 25 + ((i * 13 + j * 7) % 400) + 0.99;
      return {
        description: labels[j % labels.length],
        quantity: String(quantity),
        unitPrice: money(unitPrice),
        amount: money(quantity * unitPrice),
      };
    });

    const subtotal = items.reduce((sum, it) => sum + Number(it.amount), 0);
    const tax = currency === "EUR" ? subtotal * 0.19 : subtotal * 0.0725;
    const total = subtotal + tax;

    const isCompleted = status === "completed";
    // Flag exactly 3 completed invoices as low-confidence.
    const lowConfidence = isCompleted && (i === 4 || i === 9 || i === 14);

    const [invoice] = await db
      .insert(invoices)
      .values({
        userId,
        blobUrl: `https://example.blob.vercel-storage.com/demo/${vendor.name.replace(/\W+/g, "-").toLowerCase()}-${i}.pdf`,
        originalFilename: `${vendor.name.replace(/\W+/g, "_").toLowerCase()}_${period}.pdf`,
        status,
        failureReason: status === "failed" ? "This doesn't appear to be an invoice" : null,
        vendorName: isCompleted || status === "failed" ? vendor.name : null,
        vendorAddress: isCompleted ? vendor.address : null,
        invoiceNumber: isCompleted ? `INV-2026-${String(1000 + i)}` : null,
        invoiceDate: isCompleted ? iso(issued) : null,
        dueDate: isCompleted ? iso(due) : null,
        currency: isCompleted ? currency : null,
        subtotal: isCompleted ? money(subtotal) : null,
        tax: isCompleted ? money(tax) : null,
        total: isCompleted ? money(total) : null,
        category: isCompleted ? vendor.category : null,
        confidence: isCompleted
          ? {
              vendor_name: "high",
              total: "high",
              due_date: lowConfidence ? "low" : "medium",
              tax: lowConfidence ? "low" : "high",
            }
          : null,
        rawExtraction: null,
        createdAt: issued,
      })
      .returning();

    if (isCompleted) {
      await db.insert(lineItems).values(
        items.map((it) => ({
          invoiceId: invoice.id,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          amount: it.amount,
        })),
      );
    }
  }

  const usage = opts.usageThisMonth ?? usedThisMonth;
  await db.insert(usageCounters).values({ userId, period: currentPeriod, documentsUsed: usage });

  return { invoices: INVOICE_COUNT, usage };
}
