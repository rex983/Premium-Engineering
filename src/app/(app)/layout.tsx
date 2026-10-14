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
  // Role comes from the launcher's profiles row via the session (refreshed
  // every 60s). Unknown roles get the non-admin view.
  const session = await auth();
  const role = session?.user?.role ?? "";

  return (
    <SessionProvider>
      <SidebarProvider>
        <AppSidebar role={role} />
        <SidebarInset>
          <ViewAsBanner />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  );
}
