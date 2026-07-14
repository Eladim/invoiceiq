"use client";

import { ClerkLoaded, ClerkLoading, SignIn, SignUp, useAuth } from "@clerk/nextjs";
import { Loader2, ScanLine } from "lucide-react";

import { AuthLoading } from "./auth-loading";

/**
 * Renders the Clerk sign-in/up widget with two loading states:
 *  - <ClerkLoading>: branded card while the widget initializes (cold loads).
 *  - Success overlay: once Clerk marks the user signed in (credentials accepted),
 *    a full-screen "Signing you in…" spinner covers the gap until Clerk redirects
 *    to the dashboard — matching the one-click demo experience.
 */
export function AuthPanel({ mode }: { mode: "sign-in" | "sign-up" }) {
  const { isSignedIn } = useAuth();

  return (
    <>
      <ClerkLoading>
        <AuthLoading />
      </ClerkLoading>
      <ClerkLoaded>{mode === "sign-in" ? <SignIn /> : <SignUp />}</ClerkLoaded>

      {isSignedIn && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-sm">
            <ScanLine className="size-6" />
          </div>
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Loader2 className="size-4 animate-spin text-indigo-600" />
            {mode === "sign-in" ? "Signing you in…" : "Setting up your account…"}
          </p>
          <p className="max-w-xs text-xs text-slate-500">Taking you to your dashboard.</p>
        </div>
      )}
    </>
  );
}
