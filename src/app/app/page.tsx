import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/app/page-placeholder";

export const metadata: Metadata = { title: "Dashboard · InvoiceIQ" };

export default function DashboardPage() {
  return (
    <PagePlaceholder
      title="Dashboard"
      description="Spend stats, charts, and your most recent invoices will live here."
    />
  );
}
