import { createRemoteJWKSet, jwtVerify } from "jose";
import { createAdminClient } from "@/lib/supabase/admin";

// Public JWKS endpoint published by the BBD Launcher (its IdP).
// Override via LAUNCHER_JWKS_URL on Vercel if launcher moves.
const JWKS_URL =
  process.env.LAUNCHER_JWKS_URL ||
  "https://bbd-launcher.vercel.app/api/sso/jwks";

const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

// Must match launcher_sso_configs.jwt_audience for this app.
export const SSO_AUDIENCE = "premium-engineering";
const AUDIENCE = SSO_AUDIENCE;

export interface LauncherSsoClaims {
  sub: string;
  email: string;
  name: string;
  role: string;
  profile_id: string;
  /**
   * Present when a launcher admin is previewing the app as this user
   * ("View as"). The rest of the claims describe the target user.
   */
  act?: LauncherSsoActor;
}

export interface LauncherSsoActor {
  sub: string;
  profile_id: string;
  name: string;
}

/** Validate the optional actor claim; reject malformed ones. */
function parseActor(raw: unknown): LauncherSsoActor | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("SSO token has a malformed act claim");
  }
  const act = raw as Record<string, unknown>;
  if (typeof act.sub !== "string" || act.sub.length === 0) {
    throw new Error("SSO token act claim missing sub");
  }
  if (typeof act.profile_id !== "string" || act.profile_id.length === 0) {
    throw new Error("SSO token act claim missing profile_id");
  }
  return {
    sub: act.sub,
    profile_id: act.profile_id,
    name: typeof act.name === "string" ? act.name : "",
  };
}

export async function verifyLauncherSsoToken(
  token: string,
): Promise<LauncherSsoClaims> {
  const { payload } = await jwtVerify(token, JWKS, {
    algorithms: ["ES256"],
    issuer: "bbd-launcher",
    audience: AUDIENCE,
    maxTokenAge: "120s",
    clockTolerance: "10s",
  });

  if (typeof payload.email !== "string") {
    throw new Error("SSO token missing email claim");
  }
  if (typeof payload.jti !== "string" || !payload.jti) {
    throw new Error("SSO token missing jti claim");
  }
  const act = parseActor(payload.act);

  await consumeJti(payload.jti, payload.exp);

  return {
    sub: String(payload.sub ?? payload.email),
    email: payload.email,
    name: typeof payload.name === "string" ? payload.name : "",
    role: typeof payload.role === "string" ? payload.role : "",
    profile_id:
      typeof payload.profile_id === "string"
        ? payload.profile_id
        : String(payload.sub ?? ""),
    ...(act ? { act } : {}),
  };
}

/**
 * Replay protection: each launcher token (jti) may be redeemed once. The
 * `sso_consumed_jti` table is owned by the launcher's migrations; until it
 * exists we log and allow so logins keep working across the deploy window.
 */
async function consumeJti(jti: string, exp: number | undefined): Promise<void> {
  const expiresAt = new Date(
    (typeof exp === "number" ? exp : Math.floor(Date.now() / 1000) + 120) * 1000,
  ).toISOString();

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("sso_consumed_jti")
    .insert({ jti, audience: AUDIENCE, expires_at: expiresAt });

  if (!error) return;
  if (error.code === "23505") {
    throw new Error("SSO token already used");
  }
  if (error.code === "42P01" || error.code === "PGRST205") {
    console.warn("[sso] sso_consumed_jti table missing; replay protection disabled");
    return;
  }
  throw new Error(`SSO jti check failed: ${error.message}`);
}
