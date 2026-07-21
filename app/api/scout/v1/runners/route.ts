import { NextRequest, NextResponse } from "next/server";
import { enrichScoutSignalsWithLiveMarket, listScoutSignals, validateScoutApiKey } from "../../../../../lib/scout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const key = request.headers.get("x-scout-api-key") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const apiKey = await validateScoutApiKey(key).catch(() => null);
  if (!apiKey) return NextResponse.json({ error: "Valid Runner API key required" }, { status: 401 });
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 50);
  const recordedSignals = await listScoutSignals({ premium: true, limit });
  const signals = await enrichScoutSignalsWithLiveMarket(recordedSignals).catch(() => recordedSignals);
  return NextResponse.json({ data: signals, tier: apiKey.tier, generatedAt: new Date().toISOString() });
}
