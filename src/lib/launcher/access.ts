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
