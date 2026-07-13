import { AppSidebar } from "@/components/app/app-sidebar";
import { AppTopbar } from "@/components/app/app-topbar";
import { getCurrentUsage } from "@/server/queries/usage";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usage = await getCurrentUsage();
  const sidebar = <AppSidebar usage={usage} />;

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      {/* Desktop rail */}
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border md:block">
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar sidebar={sidebar} />
        <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
      </div>
    </div>
  );
}
