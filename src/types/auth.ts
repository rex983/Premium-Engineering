import type { DefaultSession } from "next-auth";

/**
 * Launcher roles (launcher_roles.name). Admins can add custom roles in the
 * launcher, so any other string is possible — every check in this app is an
 * explicit allow-list, so an unknown role gets the least-privileged behavior
 * (calculator only).
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
export type Office = "Sales" | "BST" | "RnD";
export type Department = "SALES TEAM" | "BST" | "RnD";

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
      role: UserRole;
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
    profileId?: string;
    office?: Office;
    department?: Department | null;
    isIt?: boolean;
    viewAs?: ViewAs | null;
  }
}
