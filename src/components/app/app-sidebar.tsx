import Link from "next/link";
import { ScanLine } from "lucide-react";

import type { UsageSummary } from "@/server/queries/usage";
import { SidebarNav } from "./sidebar-nav";
import { UsageMeter } from "./usage-meter";

/**
 * Presentational sidebar: brand, nav, and a usage meter pinned at the bottom.
 * Rendered both in the desktop rail and inside the mobile sheet.
 */
export function AppSidebar({ usage }: { usage: UsageSummary }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-5">
        <Link href="/app" className="flex items-center gap-2 font-semibold">
          <ScanLine className="size-5 text-sidebar-primary" />
          <span>InvoiceIQ</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        <SidebarNav />
      </div>

      <div className="border-t border-sidebar-border p-3">
        <UsageMeter usage={usage} />
      </div>
    </div>
  );
}
