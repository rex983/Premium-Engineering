import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { LAUNCHER_USERS_URL } from "@/lib/launcher/urls";
import { getLauncherOrg, orgLabel, type LauncherOrg } from "@/lib/launcher/org";

interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  office: string | null;
  department: string | null;
}

export const dynamic = "force-dynamic";

export default async function UsersAdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.permRole !== "admin") redirect("/calculator");

  const supabase = createAdminClient();
  const [{ data }, org] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, role, office, department")
      .order("full_name", { ascending: true }),
    getLauncherOrg(),
  ]);
  const profiles = (data ?? []) as ProfileRow[];

  const admins = profiles.filter((p) => p.role === "admin");
  const others = profiles.filter((p) => p.role !== "admin");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Identity, role, and office are managed in the{" "}
          <Link
            href={LAUNCHER_USERS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:no-underline"
          >
            BBD Launcher
          </Link>{" "}
          and sync here within a minute.
        </p>
      </div>

      <Section title="Admins" empty="No admins yet." rows={admins} org={org} />
      <Section title="Other users" empty="No other users." rows={others} org={org} />
    </div>
  );
}

function Section({
  title,
  empty,
  rows,
  org,
}: {
  title: string;
  empty: string;
  rows: ProfileRow[];
  org: LauncherOrg;
}) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title} <span className="ml-1 tabular-nums">({rows.length})</span>
      </h2>
      {rows.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          {empty}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Name</th>
                <th className="px-4 py-2.5 text-left font-medium">Email</th>
                <th className="px-4 py-2.5 text-left font-medium">Role</th>
                <th className="px-4 py-2.5 text-left font-medium">Office</th>
                <th className="px-4 py-2.5 text-left font-medium">Department</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t align-middle">
                  <td className="px-4 py-2.5">{p.full_name || "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{p.email}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {orgLabel(org.roles, p.role)}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {orgLabel(org.offices, p.office) || "—"}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {orgLabel(org.departments, p.department) || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
