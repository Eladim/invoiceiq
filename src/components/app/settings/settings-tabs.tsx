"use client";

import { useState, useTransition } from "react";
import { useClerk } from "@clerk/nextjs";
import { Check, Loader2, TriangleAlert, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { deleteAccount, updateProfile } from "@/server/actions/account";

type Props = {
  firstName: string;
  lastName: string;
  email: string;
  imageUrl: string;
  isDemo: boolean;
};

type Tab = "profile" | "danger";

export function SettingsTabs({ isDemo, ...profile }: Props) {
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <div className="mt-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        <TabButton active={tab === "profile"} onClick={() => setTab("profile")}>
          Profile
        </TabButton>
        <TabButton active={tab === "danger"} onClick={() => setTab("danger")}>
          Danger zone
        </TabButton>
      </div>

      {isDemo && (
        <p className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700">
          You&rsquo;re signed into the shared demo account, so profile edits and account deletion are
          disabled here.
        </p>
      )}

      <div className="mt-6">
        {tab === "profile" ? (
          <ProfilePanel {...profile} isDemo={isDemo} />
        ) : (
          <DangerPanel isDemo={isDemo} />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "-mb-px border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors",
        active
          ? "border-indigo-600 text-indigo-700"
          : "border-transparent text-slate-500 hover:text-slate-800",
      )}
    >
      {children}
    </button>
  );
}

function ProfilePanel({ firstName, lastName, email, imageUrl, isDemo }: Props) {
  const [first, setFirst] = useState(firstName);
  const [last, setLast] = useState(lastName);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const dirty = first !== firstName || last !== lastName;

  function save() {
    setStatus("idle");
    setError(null);
    startTransition(async () => {
      const res = await updateProfile({ firstName: first, lastName: last });
      if (res.ok) setStatus("saved");
      else {
        setStatus("error");
        setError(res.error);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="size-16 rounded-full border border-slate-200 object-cover"
          />
        ) : (
          <div className="flex size-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
            <User className="size-7" />
          </div>
        )}
        <div>
          <div className="text-sm font-semibold text-slate-900">
            {[first, last].filter(Boolean).join(" ") || "Your account"}
          </div>
          <div className="text-sm text-slate-500">{email}</div>
        </div>
      </div>

      {/* Fields */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="First name">
          <input
            value={first}
            onChange={(e) => setFirst(e.target.value)}
            disabled={isDemo}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
          />
        </Field>
        <Field label="Last name">
          <input
            value={last}
            onChange={(e) => setLast(e.target.value)}
            disabled={isDemo}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
          />
        </Field>
        <Field label="Email">
          <input
            value={email}
            readOnly
            className="h-10 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"
          />
          <p className="mt-1 text-xs text-slate-400">Managed by your sign-in provider.</p>
        </Field>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={save}
          disabled={pending || !dirty || isDemo}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          Save changes
        </button>
        {status === "saved" && !dirty && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <Check className="size-4" /> Saved
          </span>
        )}
        {status === "error" && error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

function DangerPanel({ isDemo }: { isDemo: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
            <TriangleAlert className="size-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-red-900">Delete account and all data</h2>
            <p className="mt-1 text-sm text-red-700/90">
              Permanently remove your account, every uploaded invoice and file, and cancel your
              subscription. This cannot be undone.
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          disabled={isDemo}
          className="mt-5 inline-flex h-10 items-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Delete account
        </button>
      </div>

      {open && !isDemo && <DeleteDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function DeleteDialog({ onClose }: { onClose: () => void }) {
  const clerk = useClerk();
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const armed = confirm.trim() === "DELETE";

  function onDelete() {
    if (!armed || pending) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteAccount();
      if (res.ok) {
        // The Clerk user is already deleted, so signOut may stall talking to a
        // dead session — cap it and hard-navigate away regardless.
        await Promise.race([
          clerk.signOut().catch(() => {}),
          new Promise((r) => setTimeout(r, 2500)),
        ]);
        window.location.href = "/";
        return;
      }
      setError(res.error);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
            <TriangleAlert className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Delete your account?</h3>
            <p className="mt-1 text-sm text-slate-500">
              This permanently deletes your invoices, files and subscription. There is no way to
              recover them.
            </p>
          </div>
        </div>

        <label className="mt-5 block">
          <span className="text-sm text-slate-600">
            Type <span className="font-semibold text-slate-900">DELETE</span> to confirm
          </span>
          <input
            autoFocus
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onDelete()}
            placeholder="DELETE"
            className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
        </label>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={pending}
            className="inline-flex h-10 items-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onDelete}
            disabled={!armed || pending}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
}
