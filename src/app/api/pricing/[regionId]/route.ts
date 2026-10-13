import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentPricingData } from "@/lib/pricing-data-cache";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ regionId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { regionId } = await params;
  if (!regionId.match(/^[0-9a-f-]{36}$/)) {
    return NextResponse.json({ error: "Invalid region id" }, { status: 400 });
  }
  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);
  const versionId = searchParams.get("versionId");

  let data;
  try {
    if (versionId) {
      const res = await supabase
        .from("psbe_pricing_data")
        .select("id, region_id, version, is_current, matrices, created_at")
        .eq("region_id", regionId)
        .eq("id", versionId)
        .maybeSingle();
      if (res.error) throw new Error(res.error.message);
      data = res.data;
    } else {
      data = await getCurrentPricingData(regionId);
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ pricing: null });
  }
  return NextResponse.json({ pricing: data });
}
