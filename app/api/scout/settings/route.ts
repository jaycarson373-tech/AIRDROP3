import { NextRequest, NextResponse } from "next/server";
import { getScoutSettings, scoutAdminAuthorized, updateScoutSettings } from "../../../../lib/scout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const editable = new Set([
  "eligibility_minimum",
  "public_signal_delay_seconds",
  "distribution_bps",
  "protocol_reserve_bps",
  "minimum_scout_score",
  "minimum_liquidity_usd",
  "minimum_active_seconds",
  "switch_score_margin"
]);

export async function GET() {
  try {
    return NextResponse.json(await getScoutSettings());
  } catch {
    return NextResponse.json({ error: "BUFFETTCOIN settings are unavailable" }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!scoutAdminAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as Record<string, unknown>;
  const values = Object.fromEntries(Object.entries(body).filter(([key]) => editable.has(key)));
  if (!Object.keys(values).length) return NextResponse.json({ error: "No editable settings supplied" }, { status: 400 });
  try {
    await updateScoutSettings(values);
    return NextResponse.json(await getScoutSettings());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Update failed" }, { status: 400 });
  }
}
