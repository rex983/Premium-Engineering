import { redirect } from "next/navigation";
import { getEffectiveIdentity } from "@/lib/view-as";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await getEffectiveIdentity();
  if (!me) redirect("/login");
  if (me.effectiveRole !== "admin") redirect("/calculator");
  return <>{children}</>;
}
