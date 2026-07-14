"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

/**
 * Signs into the seeded public demo account in one step: mint a Clerk sign-in
 * token server-side (`/api/demo-login`), consume it as a ticket, activate the
 * session, and land on the dashboard. Shared by the sign-in page button and the
 * auto-running `/demo` route.
 */
export function useDemoLogin() {
  const clerk = useClerk();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  const startDemo = useCallback(async () => {
    if (pending) return;
    setPending(true);
    setError(false);
    try {
      const res = await fetch("/api/demo-login", { method: "POST" });
      if (!res.ok) throw new Error("token request failed");
      const { ticket } = (await res.json()) as { ticket: string };

      const attempt = await clerk.client.signIn.create({ strategy: "ticket", ticket });
      if (attempt.status === "complete" && attempt.createdSessionId) {
        await clerk.setActive({ session: attempt.createdSessionId });
        router.push("/app");
        return;
      }
      throw new Error("sign-in incomplete");
    } catch {
      setError(true);
      setPending(false);
    }
  }, [clerk, router, pending]);

  return { startDemo, pending, error };
}
