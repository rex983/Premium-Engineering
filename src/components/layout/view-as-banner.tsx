"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/types/auth";

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  senior_manager: "Senior Manager",
  junior_manager: "Junior Manager",
  team_lead: "Team Lead",
  cancellations_dept: "Cancellations",
  revisions_dept: "Revisions",
  sales_rep: "Sales Rep",
  bst: "BST",
  rnd: "R&D",
  viewer: "Viewer",
};

export function ViewAsBanner({ effectiveRole }: { effectiveRole: UserRole }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function returnToAdmin() {
    setLoading(true);
    await fetch("/api/view-as", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "admin" }),
    });
    router.refresh();
  }

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b bg-amber-100 px-4 py-2 text-sm text-amber-900 dark:bg-amber-950/60 dark:text-amber-100">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4" />
        <span>
          Viewing as{" "}
          <span className="font-medium">{ROLE_LABEL[effectiveRole]}</span>
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        disabled={loading}
        onClick={returnToAdmin}
        className="h-7 border-amber-300 bg-amber-50 hover:bg-amber-100"
      >
        Return to admin
      </Button>
    </div>
  );
}
