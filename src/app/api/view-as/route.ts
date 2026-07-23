import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { VIEW_AS_COOKIE, isImpersonableRole } from "@/lib/view-as";
import type { UserRole } from "@/types/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const raw = typeof body?.role === "string" ? body.role : "";
  const store = await cookies();

  if (!raw || raw === "admin") {
    store.delete(VIEW_AS_COOKIE);
    return NextResponse.json({ ok: true, role: "admin" as UserRole });
  }

  if (!isImpersonableRole(raw)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  store.set(VIEW_AS_COOKIE, raw, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return NextResponse.json({ ok: true, role: raw });
}
