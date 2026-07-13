import type { Metadata } from "next";

import { UploadForm } from "@/components/app/upload-form";
import { getCurrentUsage } from "@/server/queries/usage";

export const metadata: Metadata = { title: "Upload · InvoiceIQ" };

export default async function UploadPage() {
  const usage = await getCurrentUsage();
  return <UploadForm usage={usage} />;
}
