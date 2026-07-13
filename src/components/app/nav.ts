import {
  CreditCard,
  FileText,
  LayoutDashboard,
  Settings,
  Upload,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/app", icon: LayoutDashboard },
  { title: "Invoices", href: "/app/invoices", icon: FileText },
  { title: "Upload", href: "/app/upload", icon: Upload },
  { title: "Billing", href: "/app/billing", icon: CreditCard },
  { title: "Settings", href: "/app/settings", icon: Settings },
];

/** True when `pathname` should mark `href` as the active nav item. */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Page title for the top bar, derived from the current route. */
export function titleForPath(pathname: string): string {
  const match = [...NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => isActivePath(pathname, item.href));
  return match?.title ?? "InvoiceIQ";
}
