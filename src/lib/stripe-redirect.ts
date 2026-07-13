/**
 * Client helper: POST to a Stripe route that returns { url }, then redirect the
 * browser there (Checkout or Billing Portal). Throws on failure.
 */
export async function startStripeFlow(path: string, body?: unknown): Promise<void> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Stripe request failed (${res.status})`);
  const { url } = (await res.json()) as { url: string };
  window.location.href = url;
}
