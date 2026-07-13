import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/app/page-placeholder";

export const metadata: Metadata = { title: "Billing · InvoiceIQ" };

export default function BillingPage() {
  return (
    <PagePlaceholder
      title="Billing"
      description="Your plan, usage meter, and upgrade / manage-subscription actions will live here."
    />
  );
}
