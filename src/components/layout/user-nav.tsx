"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Check, Eye, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UserRole } from "@/types/auth";

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  manager: "Manager",
  sales_rep: "Sales Rep",
  viewer: "Viewer",
};

const VIEW_AS_ROLES: UserRole[] = ["admin", "manager", "sales_rep", "viewer"];

interface UserNavProps {
  realRole: UserRole;
  effectiveRole: UserRole;
}

export function UserNav({ realRole, effectiveRole }: UserNavProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  if (!session?.user) return null;

  const initials =
    session.user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  async function setViewAs(role: UserRole) {
    setPending(true);
    await fetch("/api/view-as", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setPending(false);
    router.refresh();
  }

  const canImpersonate = realRole === "admin";

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
              Role: {ROLE_LABEL[realRole]}
              {realRole !== effectiveRole && (
                <> · viewing as {ROLE_LABEL[effectiveRole]}</>
              )}
            </span>
          </div>
        </DropdownMenuLabel>
        {canImpersonate && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Eye className="mr-2 h-4 w-4" />
                View as
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {VIEW_AS_ROLES.map((r) => (
                  <DropdownMenuItem
                    key={r}
                    disabled={pending}
                    onClick={() => setViewAs(r)}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        effectiveRole === r ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    {ROLE_LABEL[r]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
