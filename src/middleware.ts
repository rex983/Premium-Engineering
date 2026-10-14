import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const publicPaths = ["/login", "/api/auth", "/sso/callback"];

// Methods that never change state. Everything else is a write.
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
// Writes allowed while viewing as someone: sign-in / sign-out only.
// (No read-only POST endpoints exist in this app.)
const VIEW_AS_WRITE_ALLOWLIST = ["/api/auth/"];

const SECURE_COOKIE = "__Secure-authjs.session-token";
const PLAIN_COOKIE = "authjs.session-token";

function hasSessionCookie(req: NextRequest, name: string): boolean {
  // Large sessions are chunked into name.0, name.1, ...
  return req.cookies.getAll().some((c) => c.name === name || c.name.startsWith(`${name}.`));
}

/**
 * Admin "View as" sessions are read-only. Block every write here — this
 * matcher covers /api route handlers and server-action POSTs (Next-Action
 * header) alike. Route handlers re-check via viewAsReadOnlyResponse().
 */
async function viewAsBlock(req: NextRequest): Promise<NextResponse | null> {
  if (SAFE_METHODS.has(req.method)) return null;
  const { pathname } = req.nextUrl;
  if (VIEW_AS_WRITE_ALLOWLIST.some((p) => pathname.startsWith(p))) return null;

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) return null;
  const secureCookie = hasSessionCookie(req, SECURE_COOKIE);
  if (!secureCookie && !hasSessionCookie(req, PLAIN_COOKIE)) return null;
  const token = await getToken({
    req,
    secret,
    secureCookie,
    cookieName: secureCookie ? SECURE_COOKIE : PLAIN_COOKIE,
  });
  if (!token?.viewAs) return null;
  const name =
    (typeof token.name === "string" && token.name) ||
    (typeof token.email === "string" && token.email) ||
    "another user";
  return NextResponse.json(
    { error: `Read-only: viewing as ${name}` },
    { status: 403 },
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const blocked = await viewAsBlock(req);
  if (blocked) return blocked;

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check for NextAuth session token cookie
  const token =
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("authjs.session-token")?.value;

  if (!token) {
    const callback = pathname === "/" ? "/calculator" : pathname;
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", callback);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
