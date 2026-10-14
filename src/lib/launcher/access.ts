import { createAdminClient } from "@/lib/supabase/admin";
import { SSO_AUDIENCE } from "@/lib/sso/verifier";

/**
 * Result of asking the launcher whether a profile may open this app.
 *  - "allow" / "deny": the launcher answered.
 *  - "unregistered": no active launcher app has this audience (RPC returned NULL).
 *  - "error": the RPC is missing or the call failed.
 */
export type LauncherAccess = "allow" | "deny" | "unregistered" | "error";

/**
 * launcher_can_open_app(profile, audience): the launcher's role × office grid,
 * per-person grants and legacy launcher_apps.offices, in one call.
 * Service-role only, so this must run server-side.
 */
export async function checkLauncherAccess(
  profileId: string,
): Promise<LauncherAccess> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("launcher_can_open_app", {
      p_profile_id: profileId,
      p_audience: SSO_AUDIENCE,
    });
    if (error) {
      console.error(
        `launcher_can_open_app failed (${error.code ?? "unknown"}):`,
        error.message,
      );
      return "error";
    }
    if (data === null || data === undefined) {
      console.error(
        `launcher_can_open_app: no active launcher app with audience "${SSO_AUDIENCE}"`,
      );
      return "unregistered";
    }
    return data === true ? "allow" : "deny";
  } catch (err) {
    console.error(
      "launcher_can_open_app threw:",
      err instanceof Error ? err.message : err,
    );
    return "error";
  }
}

const MISSING_RPC = new Set(["PGRST202", "42883", "PGRST204"]);

/**
 * The role whose in-app permissions this person gets:
 * launcher_permission_role(role) = coalesce(launcher_roles.acts_as, name).
 * A custom role with no acts_as maps to itself (least privilege here).
 * acts_as can never yield "admin" — only role === "admin" is an admin.
 * Falls back to the raw role if the RPC is missing, errors, or the role isn't
 * in launcher_roles.
 */
export async function resolvePermissionRole(
  role: string | null | undefined,
): Promise<string> {
  const raw = role ?? "";
  if (!raw || raw === "admin") return raw;
  try {
    const { data, error } = await createAdminClient().rpc(
      "launcher_permission_role",
      { p_role: raw },
    );
    if (error) {
      if (!MISSING_RPC.has(error.code ?? "")) {
        console.error("launcher_permission_role failed:", error.message);
      }
      return raw;
    }
    if (typeof data !== "string" || !data || data === "admin") return raw;
    return data;
  } catch (err) {
    console.error(
      "launcher_permission_role threw:",
      err instanceof Error ? err.message : err,
    );
    return raw;
  }
}
