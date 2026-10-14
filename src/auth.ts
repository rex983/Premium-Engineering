import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  verifyLauncherSsoToken,
  type LauncherSsoActor,
} from "@/lib/sso/verifier";
import {
  checkLauncherAccess,
  resolvePermissionRole,
} from "@/lib/launcher/access";
import { roleLabel } from "@/lib/launcher/org";
import { logAudit } from "@/lib/audit";
import type { UserRole, Office, Department, ViewAs } from "@/types/auth";

const providers = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          hd: "bigbuildingsdirect.com",
          prompt: "select_account",
        },
      },
    })
  );
}

providers.push(
  Credentials({
    id: "sso-jwt",
    name: "Launcher SSO",
    credentials: {
      token: { label: "SSO Token", type: "text" },
    },
    async authorize(credentials) {
      const token = typeof credentials?.token === "string" ? credentials.token : "";
      if (!token) return null;
      try {
        const claims = await verifyLauncherSsoToken(token);
        return {
          id: claims.profile_id || claims.sub,
          email: claims.email,
          name: claims.name || null,
          image: null,
          // Launcher admin "View as": validated in the signIn callback.
          ...(claims.act ? { viewAsActor: claims.act } : {}),
        };
      } catch (err) {
        console.error("[auth] launcher SSO token verification failed", err);
        return null;
      }
    },
  })
);

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  office: string | null;
  department: string | null;
  is_it: boolean | null;
  is_active: boolean | null;
  signed_out_at: string | null;
};

const PROFILE_COLUMNS =
  "id, email, full_name, role, office, department, is_it, is_active, signed_out_at";

/** Extra fields carried from authorize()/signIn() to the first jwt() call. */
type SignInUser = {
  viewAsActor?: LauncherSsoActor;
  profile?: ProfileRow;
  permRole?: string;
  viewAs?: ViewAs;
};

/** Error codes shown on /login and /sso/callback. */
const NO_APP_ACCESS = "/login?error=NoAppAccess";
const LAUNCHER_UNAVAILABLE = "/login?error=LauncherUnavailable";
const VIEW_AS_DENIED = "/login?error=ViewAsDenied";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;
      if (account?.provider === "google") {
        if (!user.email.endsWith("@bigbuildingsdirect.com")) return false;
      }

      // Users come only from the launcher's profiles table, and must be
      // active there.
      let profile: ProfileRow | null;
      try {
        profile = await loadProfileByEmail(user.email);
      } catch (err) {
        console.error("[auth] sign-in profile check failed", err);
        return LAUNCHER_UNAVAILABLE;
      }
      if (!profile || profile.is_active === false) return false;
      const extra = user as typeof user & SignInUser;
      extra.profile = profile;

      // The launcher decides who may open this app (role x office grid +
      // per-person grants). Only an explicit true lets anyone in.
      const [access, permRole] = await Promise.all([
        checkLauncherAccess(profile.id),
        resolvePermissionRole(profile.role),
      ]);
      if (access === "deny") return NO_APP_ACCESS;
      if (access !== "allow") return LAUNCHER_UNAVAILABLE;
      extra.permRole = permRole;

      // Admin "View as": the launcher signed a token for the target user
      // plus an `act` claim naming the admin, who must still be an active
      // admin right now.
      const actorClaim = extra.viewAsActor;
      if (actorClaim) {
        if (account?.provider !== "sso-jwt") return VIEW_AS_DENIED;
        let actor: ProfileRow | null;
        try {
          actor = await loadProfileById(actorClaim.profile_id);
        } catch {
          return LAUNCHER_UNAVAILABLE;
        }
        if (
          !isValidActor(actor) ||
          actor.email.toLowerCase() !== actorClaim.sub.toLowerCase()
        ) {
          return VIEW_AS_DENIED;
        }
        extra.viewAs = {
          actorProfileId: actor.id,
          actorEmail: actor.email,
          actorName: actor.full_name || actorClaim.name || actor.email,
          startedAt: Date.now(),
        };
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.signedInAt = Date.now();
        token.checkedAt = Date.now();
        token.lastVerifiedAt = Date.now();
        const extra = user as typeof user & SignInUser;
        const profile = extra.profile ?? null;
        // signIn always sets this; never invent a role.
        if (!profile) return null;
        await applyProfile(
          token,
          profile,
          extra.permRole ?? (await resolvePermissionRole(profile.role)),
        );
        token.viewAs = extra.viewAs ?? null;
        if (extra.viewAs) {
          // Attribute the impersonation to the admin, never to the target.
          logAudit({
            actorId: extra.viewAs.actorProfileId,
            actorEmail: extra.viewAs.actorEmail,
            action: "view_as_start",
            entity: "user",
            entityId: profile.id,
            diff: { targetEmail: profile.email, targetRole: profile.role },
          });
        }
        return token;
      }
      return revalidateToken(token);
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role as UserRole;
        // Tokens minted before permRole existed fall back to the raw role
        // until the next 60s recheck fills it in.
        session.user.permRole = (token.permRole ?? token.role ?? "") as UserRole;
        session.user.roleLabel =
          (token.roleLabel as string | undefined) || (token.role as string);
        session.user.profileId = token.profileId as string;
        if (token.office) session.user.office = token.office as Office;
        session.user.department = (token.department ?? null) as Department | null;
        session.user.isIt = token.isIt === true;
        if (typeof token.name === "string") session.user.name = token.name;
        session.viewAs = (token.viewAs ?? null) as ViewAs | null;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // must stay <= 12h (audit policy)
  },
});

const REVALIDATE_INTERVAL_MS = 60 * 1000;
// "View as" sessions end this long after they start, no matter what.
const VIEW_AS_MAX_MS = 60 * 60 * 1000;
// If the launcher can't be reached, keep a session at most this long past
// its last successful check.
const MAX_UNVERIFIED_MS = 5 * 60 * 1000;

async function loadProfileByEmail(email: string): Promise<ProfileRow | null> {
  const { data, error } = await createAdminClient()
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("email", email)
    .maybeSingle<ProfileRow>();
  if (error) throw error;
  return data;
}

async function loadProfileById(id: string): Promise<ProfileRow | null> {
  const { data, error } = await createAdminClient()
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", id)
    .maybeSingle<ProfileRow>();
  if (error) throw error;
  return data;
}

/** A "View as" actor must be an active launcher admin. */
function isValidActor(actor: ProfileRow | null): actor is ProfileRow {
  return !!actor && actor.is_active !== false && actor.role === "admin";
}

/** Copy launcher-managed identity fields from the profile row onto the token. */
async function applyProfile(token: JWT, profile: ProfileRow, permRole: string) {
  token.role = profile.role as UserRole;
  token.permRole = permRole as UserRole;
  token.roleLabel = await roleLabel(profile.role);
  token.profileId = profile.id;
  token.office = (profile.office ?? undefined) as Office | undefined;
  token.department = (profile.department ?? null) as Department | null;
  token.isIt = profile.is_it === true;
  if (profile.full_name) token.name = profile.full_name;
}

/**
 * Session revocation: at most once a minute, re-read the caller's profile,
 * launcher app access, permission role and (for View as) the admin, in
 * parallel. The session is dropped if the profile is gone, deactivated,
 * force-signed-out (launcher sets profiles.signed_out_at) after this session
 * started, or the launcher no longer grants this app (false or unregistered).
 * A View-as session also needs its admin to still be an active admin, and
 * ends 60 minutes after it started. Role / permRole / office / department /
 * is_it / name are refreshed from the same row. If the launcher or DB can't
 * answer, the session is kept (retried on the next request) for at most
 * 5 minutes past the last successful check.
 */
async function revalidateToken(token: JWT): Promise<JWT | null> {
  const now = Date.now();
  const viewAs = (token.viewAs ?? null) as ViewAs | null;
  if (viewAs && now - viewAs.startedAt > VIEW_AS_MAX_MS) return null;

  const checkedAt = typeof token.checkedAt === "number" ? token.checkedAt : 0;
  if (now - checkedAt < REVALIDATE_INTERVAL_MS) return token;

  // Sessions minted before this check existed carry no signedInAt; fall back
  // to the JWT iat (seconds) the first time we see them.
  if (typeof token.signedInAt !== "number") {
    token.signedInAt = typeof token.iat === "number" ? token.iat * 1000 : now;
  }

  if (!token.email) return null;

  const unverified = (): JWT | null => {
    const lastVerifiedAt =
      typeof token.lastVerifiedAt === "number" ? token.lastVerifiedAt : checkedAt;
    return now - lastVerifiedAt > MAX_UNVERIFIED_MS ? null : token;
  };

  const profileId = typeof token.profileId === "string" ? token.profileId : null;
  const cachedRole = typeof token.role === "string" ? token.role : "";

  try {
    const [profile, access, actor, guessedPermRole] = await Promise.all([
      loadProfileByEmail(token.email),
      profileId ? checkLauncherAccess(profileId) : Promise.resolve(null),
      viewAs ? loadProfileById(viewAs.actorProfileId) : Promise.resolve(null),
      resolvePermissionRole(cachedRole),
    ]);
    if (!profile || profile.is_active === false) return null;
    if (profile.signed_out_at && new Date(profile.signed_out_at).getTime() > (token.signedInAt as number)) {
      return null;
    }
    if (viewAs && !isValidActor(actor)) return null;

    // Launcher access for the profile we just read (the token may predate
    // profileId being stored).
    const result = access ?? (await checkLauncherAccess(profile.id));
    if (result === "deny" || result === "unregistered") return null;
    if (result === "error") {
      console.warn("[auth] launcher access recheck failed; session unverified");
      return unverified();
    }

    // The role may have changed in the launcher since the last check.
    const permRole =
      profile.role === cachedRole
        ? guessedPermRole
        : await resolvePermissionRole(profile.role);
    await applyProfile(token, profile, permRole);
    token.checkedAt = now;
    token.lastVerifiedAt = now;
    return token;
  } catch (err) {
    console.warn("[auth] profile revalidation threw; session unverified", err);
    return unverified();
  }
}
