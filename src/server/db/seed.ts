import { seedDemoData } from "./seed-data";

// The demo user's Clerk id. Set SEED_DEMO_USER_ID to attach the seed data to a
// real signed-in account; defaults to the synthetic "user_demo".
const userId = process.env.SEED_DEMO_USER_ID ?? "user_demo";

seedDemoData(userId)
  .then((r) => {
    console.log(`✓ Seeded ${r.invoices} invoices for "${userId}" (${r.usage}/5 used this month).`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
