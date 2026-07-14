import { DEMO_EMAIL } from "@/lib/demo";
import { env } from "@/lib/env";

const CLERK_API = "https://api.clerk.com/v1";

/**
 * Mint a Clerk sign-in token for the fixed public demo account. The sign-in
 * page's "Use demo account" button exchanges it for a session client-side.
 * Only ever issues tokens for the demo user — never an arbitrary account.
 */
export async function POST() {
  const headers = {
    Authorization: `Bearer ${env.CLERK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };

  const found = await fetch(`${CLERK_API}/users?email_address=${encodeURIComponent(DEMO_EMAIL)}`, {
    headers,
  });
  const users = found.ok ? await found.json() : null;
  const userId = Array.isArray(users) && users[0]?.id;
  if (!userId) {
    return new Response("Demo account is not set up. Run `pnpm demo:setup`.", { status: 503 });
  }

  const res = await fetch(`${CLERK_API}/sign_in_tokens`, {
    method: "POST",
    headers,
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) {
    console.error("demo sign-in token failed:", res.status, await res.text());
    return new Response("Could not start the demo.", { status: 500 });
  }

  const data = await res.json();
  return Response.json({ ticket: data.token as string });
}
