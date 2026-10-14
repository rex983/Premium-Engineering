import { NextResponse } from "next/server";
import type { Session } from "next-auth";

/**
 * While a launcher admin is "viewing as" another user, the app is read-only.
 * Middleware blocks every non-GET request centrally; route handlers call this
 * too as defense in depth (e.g. if middleware can't decode the session).
 */
export function readOnlyMessage(name: string | null | undefined): string {
  return `Read-only: viewing as ${name || "another user"}`;
}

/** Returns a 403 response when the session is a View-as session, else null. */
export function viewAsReadOnlyResponse(
  session: Session | null,
): NextResponse | null {
  if (!session?.viewAs) return null;
  return NextResponse.json(
    { error: readOnlyMessage(session.user?.name ?? session.user?.email) },
    { status: 403 },
  );
}

/** Throwing variant for server actions / code paths that can't return a response. */
export function assertNotViewingAs(session: Session | null): void {
  if (session?.viewAs) {
    throw new Error(readOnlyMessage(session.user?.name ?? session.user?.email));
  }
}
