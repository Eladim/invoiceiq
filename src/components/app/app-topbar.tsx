"use client";

import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { titleForPath } from "./nav";

export function AppTopbar({ sidebar }: { sidebar: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur">
      {/* Keyed by pathname so navigating (incl. from a link inside) remounts it closed. */}
      <Sheet key={pathname}>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
              <Menu className="size-5" />
            </Button>
          }
        />
        <SheetContent side="left" className="p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          {sidebar}
        </SheetContent>
      </Sheet>

      <h1 className="text-sm font-semibold">{titleForPath(pathname)}</h1>

      <div className="ml-auto flex items-center gap-2">
        <UserButton />
      </div>
    </header>
  );
}
