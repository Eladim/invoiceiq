import type { Metadata } from "next";
import { currentUser } from "@clerk/nextjs/server";

import { DEMO_EMAIL } from "@/lib/demo";
import { SettingsTabs } from "@/components/app/settings/settings-tabs";

export const metadata: Metadata = { title: "Settings · InvoiceIQ" };

export default async function SettingsPage() {
  const user = await currentUser();

  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
      <p className="mt-1 text-sm text-slate-500">Manage your profile and account.</p>

      <SettingsTabs
        firstName={user?.firstName ?? ""}
        lastName={user?.lastName ?? ""}
        email={email}
        imageUrl={user?.hasImage ? user.imageUrl : ""}
        isDemo={email === DEMO_EMAIL}
      />
    </div>
  );
}
