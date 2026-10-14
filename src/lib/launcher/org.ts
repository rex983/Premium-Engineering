import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Launcher-managed org lists (roles, offices, departments). Admins add new
 * values in the BBD Launcher; this app reads them server-side with a 60s
 * module-level cache. If the launcher tables don't exist yet, the built-in
 * lists below are used so deploy order doesn't matter.
 */

export interface LauncherRole {
  name: string;
  display_name: string | null;
  is_admin: boolean | null;
  acts_as: string | null;
}

export interface LauncherOrgValue {
  name: string;
  display_name: string | null;
  sort_order: number | null;
}

export interface LauncherOrg {
  roles: LauncherRole[];
  offices: LauncherOrgValue[];
  departments: LauncherOrgValue[];
}

// Fallbacks only — used when launcher migration 051 isn't applied yet.
const FALLBACK_ROLES: LauncherRole[] = [
  ["admin", "Admin"],
  ["senior_manager", "Senior Manager"],
  ["junior_manager", "Junior Manager"],
  ["team_lead", "Team Lead"],
  ["sales_rep", "Sales Rep"],
  ["bst", "BST"],
  ["rnd", "R&D"],
  ["cancellations_dept", "Cancellations"],
  ["revisions_dept", "Revisions"],
].map(([name, display_name]) => ({
  name,
  display_name,
  is_admin: name === "admin",
  acts_as: null,
}));
const FALLBACK_OFFICES: LauncherOrgValue[] = ["Sales", "BST", "RnD"].map(
  (name, i) => ({ name, display_name: name, sort_order: i }),
);
const FALLBACK_DEPARTMENTS: LauncherOrgValue[] = ["SALES TEAM", "BST", "RnD"].map(
  (name, i) => ({ name, display_name: name, sort_order: i }),
);

const TTL_MS = 60_000;
const MISSING_TABLE = new Set(["PGRST205", "42P01"]);

let cache: { at: number; value: LauncherOrg } | null = null;
let inflight: Promise<LauncherOrg> | null = null;

async function readTable<T>(
  table: string,
  columns: string,
  fallback: T[],
): Promise<T[]> {
  const { data, error } = (await createAdminClient()
    .from(table)
    .select(columns)) as { data: T[] | null; error: { code?: string; message: string } | null };
  if (error) {
    if (!MISSING_TABLE.has(error.code ?? "")) {
      console.error(`[launcher] reading ${table} failed:`, error.message);
    }
    return fallback;
  }
  return data && data.length > 0 ? data : fallback;
}

function bySortOrder(a: LauncherOrgValue, b: LauncherOrgValue) {
  return (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name);
}

async function load(): Promise<LauncherOrg> {
  const [roles, offices, departments] = await Promise.all([
    readTable<LauncherRole>(
      "launcher_roles",
      "name, display_name, is_admin, acts_as",
      FALLBACK_ROLES,
    ),
    readTable<LauncherOrgValue>(
      "launcher_offices",
      "name, display_name, sort_order",
      FALLBACK_OFFICES,
    ),
    readTable<LauncherOrgValue>(
      "launcher_departments",
      "name, display_name, sort_order",
      FALLBACK_DEPARTMENTS,
    ),
  ]);
  return {
    roles,
    offices: [...offices].sort(bySortOrder),
    departments: [...departments].sort(bySortOrder),
  };
}

/** Roles, offices and departments from the launcher (cached for 60s). */
export async function getLauncherOrg(): Promise<LauncherOrg> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  if (!inflight) {
    inflight = load()
      .then((value) => {
        cache = { at: Date.now(), value };
        return value;
      })
      .catch((err) => {
        console.error("[launcher] org lists unavailable:", err);
        return (
          cache?.value ?? {
            roles: FALLBACK_ROLES,
            offices: FALLBACK_OFFICES,
            departments: FALLBACK_DEPARTMENTS,
          }
        );
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Display label for a launcher value; unknown values render as their raw name. */
export function orgLabel(
  list: { name: string; display_name: string | null }[],
  name: string | null | undefined,
): string {
  if (!name) return "";
  return list.find((v) => v.name === name)?.display_name || name;
}

/** Display label for a role (launcher_roles.display_name, else the raw name). */
export async function roleLabel(role: string | null | undefined): Promise<string> {
  if (!role) return "";
  const { roles } = await getLauncherOrg();
  return orgLabel(roles, role);
}
