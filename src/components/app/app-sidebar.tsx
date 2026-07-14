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
    <div className="flex h-full flex-col bg-white text-slate-900">
      <div className="flex h-14 items-center border-b border-slate-100 px-5">
        <Link href="/app" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-sm shadow-indigo-500/30">
            <ScanLine className="size-4" />
          </span>
          <span className="text-[15px] font-bold tracking-tight">InvoiceIQ</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        <SidebarNav />
      </div>

      <div className="border-t border-slate-100 p-3.5">
        <UsageMeter usage={usage} />
      </div>
    </div>
  );
}
