import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { UserRole, ViewAs } from "@/types/auth";
import { readOnlyMessage } from "@/lib/view-as";

/**
 * Admin route guard.
 *
 * NextAuth v5's `auth()` has multiple overloads (one for middleware, one for plain
 * RSC/route-handler context). TypeScript can resolve the wrong overload and infer
 * `NextMiddleware` instead of `Session | null`, which breaks `.user` access.
 * Centralising the guard here keeps the cast in one place and stops bleeding into
 * every API route.
 *
 * Pass `{ write: true }` from mutating handlers: while a launcher admin is
 * viewing as someone (session.viewAs) the app is read-only and writes get 403.
 * Middleware enforces the same rule centrally; this is defense in depth.
 */
export async function requireAdmin(opts: { write?: boolean } = {}): Promise<
  | { ok: true; email: string | null | undefined; profileId: string }
  | { ok: false; res: NextResponse }
> {
  const sessionRaw = (await (auth as unknown as () => Promise<unknown>)()) as
    | {
        user?: { email?: string | null; name?: string | null; role?: UserRole; profileId?: string };
        viewAs?: ViewAs | null;
      }
    | null;
  const user = sessionRaw?.user;
  if (!user || user.role !== "admin") {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (opts.write && sessionRaw?.viewAs) {
    return {
      ok: false,
      res: NextResponse.json(
        { error: readOnlyMessage(user.name ?? user.email) },
        { status: 403 },
      ),
    };
  }
  return { ok: true, email: user.email, profileId: user.profileId ?? "" };
}
