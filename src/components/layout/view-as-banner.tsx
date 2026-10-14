"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Eye } from "lucide-react";
import { LAUNCHER_DASHBOARD_URL } from "@/lib/launcher/urls";

/**
 * Fixed banner shown while a launcher admin is viewing this app as another
 * user. Everything is read-only server-side; "Exit" signs out of this app
 * and returns to the launcher dashboard.
 */
export function ViewAsBanner() {
  const { data: session } = useSession();
  const [exiting, setExiting] = useState(false);
  const viewAs = session?.viewAs;
  if (!viewAs) return null;

  const targetName = session.user?.name || session.user?.email || "user";
  const targetRole = session.user?.roleLabel || session.user?.role || "no role";

  async function exit() {
    setExiting(true);
    try {
      await signOut({ redirect: false });
    } finally {
      window.location.href = LAUNCHER_DASHBOARD_URL;
    }
  }

  return (
    <>
      <div
        role="status"
        className="fixed inset-x-0 top-0 z-[100] flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-400 px-4 py-2 text-sm font-medium text-black shadow-md"
      >
        <Eye className="h-4 w-4 shrink-0" aria-hidden />
        <span>
          Viewing as <strong>{targetName}</strong> ({targetRole}) — read-only.
          Signed in as {viewAs.actorName}.
        </span>
        <button
          type="button"
          onClick={exit}
          disabled={exiting}
          className="rounded border border-black/70 bg-black px-3 py-0.5 text-xs font-semibold text-amber-300 hover:bg-black/80 disabled:opacity-60"
        >
          {exiting ? "Exiting…" : "Exit"}
        </button>
      </div>
      {/* Spacer so the banner never covers page content. */}
      <div aria-hidden className="h-10 shrink-0" />
    </>
  );
}
