import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SessionProvider } from "@/components/providers/session-provider";
import { ViewAsBanner } from "@/components/layout/view-as-banner";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // permRole comes from the launcher (launcher_permission_role, refreshed
  // every 60s) and drives the admin nav; roleLabel is for display only.
  const session = await auth();
  const permRole = session?.user?.permRole ?? "";
  const roleLabel = session?.user?.roleLabel ?? session?.user?.role ?? "";

  return (
    <SessionProvider>
      <SidebarProvider>
        <AppSidebar permRole={permRole} roleLabel={roleLabel} />
        <SidebarInset>
          <ViewAsBanner />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  );
}
