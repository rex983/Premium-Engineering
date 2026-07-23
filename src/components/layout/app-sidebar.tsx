"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calculator,
  Upload,
  Map,
  History,
  Snowflake,
  Users,
} from "lucide-react";
import type { UserRole } from "@/types/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { UserNav } from "@/components/layout/user-nav";
import { Logo } from "@/components/layout/logo";

const navItems = [
  { title: "Calculator", href: "/calculator", icon: Calculator },
];

const adminItems = [
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Upload Pricing", href: "/admin/upload", icon: Upload },
  { title: "Regions", href: "/admin/regions", icon: Map },
  { title: "State → Region", href: "/admin/states", icon: Snowflake },
  { title: "Audit Log", href: "/admin/audit-log", icon: History },
];

interface AppSidebarProps {
  effectiveRole: UserRole;
  realRole: UserRole;
}

export function AppSidebar({ effectiveRole, realRole }: AppSidebarProps) {
  const pathname = usePathname();
  const showAdmin = effectiveRole === "admin";

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <Link href="/calculator">
          <Logo size="small" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {showAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.href)}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <UserNav realRole={realRole} effectiveRole={effectiveRole} />
      </SidebarFooter>
    </Sidebar>
  );
}
