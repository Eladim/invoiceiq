import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/app/page-placeholder";

export const metadata: Metadata = { title: "Upload · InvoiceIQ" };

export default function UploadPage() {
  return (
    <PagePlaceholder
      title="Upload"
      description="Drag-and-drop invoice upload with live extraction progress will live here."
    />
  );
}
