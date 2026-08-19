import type { DefaultSession } from "next-auth";

export type UserRole =
  | "admin"
  | "manager"
  | "senior_manager"
  | "junior_manager"
  | "team_lead"
  | "cancellations_dept"
  | "revisions_dept"
  | "sales_rep"
  | "bst"
  | "rnd"
  | "viewer";
export type Office = "Harbor" | "Marion" | "BST" | "RnD";
export type Department = "SALES TEAM" | "BST" | "RnD";

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
    } & DefaultSession["user"];
  }

  interface JWT {
    role?: UserRole;
    profileId?: string;
    office?: Office;
    department?: Department | null;
  }
}
