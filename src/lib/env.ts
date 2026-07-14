import { z } from "zod";

/**
 * Server-side environment variables, validated once at boot.
 * Import this module only from server code (Server Components, Server Actions,
 * route handlers, db client). Secrets must never reach the client bundle.
 *
 * Vars provisioned in later milestones (Stripe, the Clerk webhook secret) are
 * optional here so the app boots during earlier milestones; the code paths that
 * need them fail loudly at call time instead.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Clerk
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  // Signing secret from the Clerk Dashboard webhook endpoint. Added once the
  // endpoint is created; verifyWebhook() reads it from process.env directly.
  CLERK_WEBHOOK_SIGNING_SECRET: z.string().optional(),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().min(1).default("gpt-5.6-luna"),

  // Vercel Blob (file storage). Provisioned via `vercel blob` / dashboard.
  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  // Upstash Redis — backs the upload rate limiter (SPEC §9). Optional: when
  // unset the limiter is skipped (dev convenience) and uploads aren't throttled.
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Resend — transactional email (welcome + quota-warning). Optional: without a
  // key, sends are skipped. RESEND_FROM must be a verified sender in production;
  // defaults to Resend's test address (only delivers to the account owner).
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().default("InvoiceIQ <onboarding@resend.dev>"),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),

  // Stripe (wired up in the billing milestone)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_MONTHLY: z.string().optional(),
  STRIPE_PRICE_YEARLY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  CLERK_WEBHOOK_SIGNING_SECRET: process.env.CLERK_WEBHOOK_SIGNING_SECRET,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM: process.env.RESEND_FROM,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PRICE_MONTHLY: process.env.STRIPE_PRICE_MONTHLY,
  STRIPE_PRICE_YEARLY: process.env.STRIPE_PRICE_YEARLY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
});

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  • ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${details}`);
}

export const env = parsed.data;
