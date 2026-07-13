import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/app/page-placeholder";

export const metadata: Metadata = { title: "Settings · InvoiceIQ" };

export default function SettingsPage() {
  return (
    <PagePlaceholder
      title="Settings"
      description="Profile management and account deletion will live here."
    />
  );
}
