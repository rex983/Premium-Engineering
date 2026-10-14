"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { KnownUserRole, UserRole } from "@/types/auth";

const ROLE_LABEL: Record<KnownUserRole, string> = {
  admin: "Admin",
  senior_manager: "Senior Manager",
  junior_manager: "Junior Manager",
  team_lead: "Team Lead",
  cancellations_dept: "Cancellations",
  revisions_dept: "Revisions",
  sales_rep: "Sales Rep",
  bst: "BST",
  rnd: "R&D",
};

/** Custom launcher roles fall back to their raw name. */
function roleLabel(role: UserRole): string {
  return ROLE_LABEL[role as KnownUserRole] ?? (role || "No role");
}

interface UserNavProps {
  role: UserRole;
}

export function UserNav({ role }: UserNavProps) {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const initials =
    session.user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={session.user.image || undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="truncate text-sm">{session.user.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{session.user.name}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {session.user.email}
            </span>
            <span className="mt-1 text-xs font-normal text-muted-foreground">
              Role: {roleLabel(role)}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
