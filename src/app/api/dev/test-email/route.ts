import { auth, currentUser } from "@clerk/nextjs/server";

import { sendWelcomeEmail } from "@/lib/email";
import { env } from "@/lib/env";

/**
 * Dev-only helper to test the Resend integration without a full checkout.
 * Visit /api/dev/test-email while signed in — it sends the welcome email to
 * your own account address. Disabled in production.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const { userId } = await auth();
  if (!userId) return new Response("Sign in first", { status: 401 });

  if (!env.RESEND_API_KEY) {
    return Response.json({
      ok: false,
      reason: "RESEND_API_KEY isn't loaded in the running server — restart `pnpm dev`.",
    });
  }

  const user = await currentUser();
  const to =
    user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? "";

  await sendWelcomeEmail({ to, name: user?.firstName ?? null });

  return Response.json({
    ok: true,
    to,
    from: env.RESEND_FROM,
    note: "Sent (best-effort). Check Resend → Emails for delivery status; with onboarding@resend.dev it only reaches your Resend account address.",
  });
}
