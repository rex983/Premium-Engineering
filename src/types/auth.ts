import type { DefaultSession } from "next-auth";

/**
 * Built-in launcher roles (launcher_roles.name). Admins can add custom roles
 * in the launcher, so any other string is possible. Permission checks use
 * session.user.permRole (launcher_permission_role: a custom role's acts_as,
 * else itself) against explicit allow-lists, so a custom role with no acts_as
 * gets the least-privileged behavior (calculator only).
 */
export type KnownUserRole =
  | "admin"
  | "senior_manager"
  | "junior_manager"
  | "team_lead"
  | "cancellations_dept"
  | "revisions_dept"
  | "sales_rep"
  | "bst"
  | "rnd";
export type UserRole = KnownUserRole | (string & {});
/** launcher_offices.name — admins can add more in the launcher. */
export type Office = string;
/** launcher_departments.name — admins can add more in the launcher. */
export type Department = string;

/** Set while a launcher admin is viewing this app as another user (read-only). */
export interface ViewAs {
  actorProfileId: string;
  actorEmail: string;
  actorName: string;
  /** Epoch ms. The session is invalidated 60 minutes after this. */
  startedAt: number;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  office: Office | null;
  department: Department | null;
}

declare module "next-auth" {
  interface Session {
    user: {
      /** Real launcher role — display only. */
      role: UserRole;
      /** Role used for every permission check (see KnownUserRole). */
      permRole: UserRole;
      /** launcher_roles.display_name for `role` (raw name if unknown). */
      roleLabel: string;
      profileId: string;
      office?: Office;
      department?: Department | null;
      isIt?: boolean;
    } & DefaultSession["user"];
    /** null unless an admin is viewing as this user. */
    viewAs: ViewAs | null;
  }

  interface JWT {
    role?: UserRole;
    permRole?: UserRole;
    roleLabel?: string;
    profileId?: string;
    office?: Office;
    department?: Department | null;
    isIt?: boolean;
    viewAs?: ViewAs | null;
  }
}
