"use client";

import { Dialog } from "@base-ui/react/dialog";

import { cn } from "@/lib/utils";

function Sheet(props: React.ComponentProps<typeof Dialog.Root>) {
  return <Dialog.Root {...props} />;
}

const SheetTrigger = Dialog.Trigger;
const SheetClose = Dialog.Close;
const SheetTitle = Dialog.Title;
const SheetDescription = Dialog.Description;

function SheetContent({
  className,
  children,
  side = "left",
  ...props
}: React.ComponentProps<typeof Dialog.Popup> & { side?: "left" | "right" }) {
  return (
    <Dialog.Portal>
      <Dialog.Backdrop
        className={cn(
          "fixed inset-0 z-50 bg-black/50 transition-opacity duration-300",
          "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
        )}
      />
      <Dialog.Popup
        className={cn(
          "fixed inset-y-0 z-50 flex h-full w-72 flex-col bg-sidebar text-sidebar-foreground shadow-lg",
          "transition-transform duration-300 ease-out",
          side === "left"
            ? "left-0 border-r border-sidebar-border data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full"
            : "right-0 border-l border-sidebar-border data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full",
          className,
        )}
        {...props}
      >
        {children}
      </Dialog.Popup>
    </Dialog.Portal>
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetDescription,
};
