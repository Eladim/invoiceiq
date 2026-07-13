import type { Metadata } from "next";

import { UploadForm } from "@/components/app/upload-form";

export const metadata: Metadata = { title: "Upload · InvoiceIQ" };

export default function UploadPage() {
  return <UploadForm />;
}
