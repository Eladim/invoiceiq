import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/app/page-placeholder";

export const metadata: Metadata = { title: "Invoices · InvoiceIQ" };

export default function InvoicesPage() {
  return (
    <PagePlaceholder
      title="Invoices"
      description="A searchable, filterable, paginated table of your invoices will live here."
    />
  );
}
