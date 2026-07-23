import { cookies } from "next/headers";
import { auth } from "@/auth";
import type { UserRole } from "@/types/auth";

export const VIEW_AS_COOKIE = "pse_view_as_role";

const IMPERSONABLE_ROLES: UserRole[] = ["admin", "manager", "sales_rep", "viewer"];

export interface EffectiveIdentity {
  realRole: UserRole;
  effectiveRole: UserRole;
  isImpersonating: boolean;
  email: string | null;
}

export function isImpersonableRole(role: string): role is UserRole {
  return (IMPERSONABLE_ROLES as string[]).includes(role);
}

/**
 * Effective identity for the current request. Only real admins can shift their
 * effective role via the view-as cookie; for everyone else the effective role
 * equals the real role.
 */
export async function getEffectiveIdentity(): Promise<EffectiveIdentity | null> {
  const session = await auth();
  if (!session?.user) return null;

  const realRole = (session.user.role ?? "viewer") as UserRole;
  const email = session.user.email ?? null;
  const base: EffectiveIdentity = {
    realRole,
    effectiveRole: realRole,
    isImpersonating: false,
    email,
  };

  if (realRole !== "admin") return base;

  const store = await cookies();
  const viewAs = store.get(VIEW_AS_COOKIE)?.value;
  if (!viewAs || viewAs === realRole || !isImpersonableRole(viewAs)) return base;

  return {
    ...base,
    effectiveRole: viewAs,
    isImpersonating: true,
  };
}
