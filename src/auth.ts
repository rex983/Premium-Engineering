import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  verifyLauncherSsoToken,
  type LauncherSsoActor,
} from "@/lib/sso/verifier";
import { checkLauncherAccess } from "@/lib/launcher/access";
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
      // per-person grants).
      const access = await checkLauncherAccess(profile.id);
      if (access === "deny") return NO_APP_ACCESS;
      if (access !== "allow") return LAUNCHER_UNAVAILABLE;

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
        const extra = user as typeof user & SignInUser;
        let profile = extra.profile ?? null;
        if (!profile) {
          try {
            profile = await loadProfileByEmail(user.email);
          } catch {
            profile = null;
          }
        }
        // signIn already required an active profile; never invent a role.
        if (!profile) return null;
        applyProfile(token, profile);
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
function applyProfile(token: JWT, profile: ProfileRow) {
  token.role = profile.role as UserRole;
  token.profileId = profile.id;
  token.office = (profile.office ?? undefined) as Office | undefined;
  token.department = (profile.department ?? null) as Department | null;
  token.isIt = profile.is_it === true;
  if (profile.full_name) token.name = profile.full_name;
}

/**
 * Session revocation: at most once a minute, re-read the caller's profile and
 * launcher app access (in parallel) and drop the session if the profile is
 * gone, deactivated, force-signed-out (launcher sets profiles.signed_out_at)
 * after this session started, or no longer has launcher access to this app.
 * A View-as session also needs its admin to still be an active admin, and
 * ends 60 minutes after it started. Role / office / department / is_it /
 * name are refreshed from the same row. Transient DB errors keep the session
 * and leave checkedAt untouched so the next request retries.
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
  const profileId = typeof token.profileId === "string" ? token.profileId : null;

  try {
    const [profile, access, actor] = await Promise.all([
      loadProfileByEmail(token.email),
      profileId ? checkLauncherAccess(profileId) : Promise.resolve(null),
      viewAs ? loadProfileById(viewAs.actorProfileId) : Promise.resolve(null),
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
      console.warn("[auth] launcher access recheck failed; keeping session");
      return token;
    }

    applyProfile(token, profile);
    token.checkedAt = now;
    return token;
  } catch (err) {
    console.warn("[auth] profile revalidation threw; keeping session", err);
    return token;
  }
}
