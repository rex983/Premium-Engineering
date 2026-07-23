import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SessionProvider } from "@/components/providers/session-provider";
import { ViewAsBanner } from "@/components/layout/view-as-banner";
import { getEffectiveIdentity } from "@/lib/view-as";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await getEffectiveIdentity();
  const realRole = me?.realRole ?? "viewer";
  const effectiveRole = me?.effectiveRole ?? "viewer";
  const isImpersonating = me?.isImpersonating ?? false;

  return (
    <SessionProvider>
      <SidebarProvider>
        <AppSidebar effectiveRole={effectiveRole} realRole={realRole} />
        <SidebarInset>
          {isImpersonating && <ViewAsBanner effectiveRole={effectiveRole} />}
          {children}
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  );
}
