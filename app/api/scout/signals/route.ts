import { NextRequest, NextResponse } from "next/server";
import {
  getActiveScoutSignal,
  getScoutSettings,
  discoverLiveScoutSignals,
  ingestScoutSignal,
  listScoutEvents,
  listScoutSignals,
  processTelegramQueue,
  queueSignalDeliveries,
  scoutAdminAuthorized,
  validateAccessToken
} from "../../../../lib/scout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bearer(request: NextRequest) {
  return request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
}

export async function GET(request: NextRequest) {
  try {
    const session = await validateAccessToken(bearer(request)).catch(() => null);
    const premium = Boolean(session);
    const [signals, active, settings, events] = await Promise.all([
      listScoutSignals({ premium, limit: Number(request.nextUrl.searchParams.get("limit") ?? 40) }),
      getActiveScoutSignal({ premium }),
      getScoutSettings(),
      listScoutEvents(30, premium)
    ]);
    return NextResponse.json({
      access: premium ? "premium" : "public",
      publicDelaySeconds: Number(settings.public_signal_delay_seconds ?? 60),
      active,
      signals,
      events
    });
  } catch (error) {
    console.error("Runner signals GET failed", error);
    try {
      const signals = await discoverLiveScoutSignals(Number(request.nextUrl.searchParams.get("limit") ?? 40));
      return NextResponse.json({
        access: "public",
        publicDelaySeconds: 0,
        active: signals[0] ?? null,
        signals,
        events: []
      });
    } catch (liveError) {
      console.error("Runner live scanner fallback failed", liveError);
      return NextResponse.json({ error: "Runner scanner is reconnecting" }, { status: 503 });
    }
  }
}

export async function POST(request: NextRequest) {
  if (!scoutAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      mint?: string;
      name?: string;
      symbol?: string;
      sourceUrl?: string;
      activate?: boolean;
    };
    if (!body.mint) return NextResponse.json({ error: "mint is required" }, { status: 400 });
    const result = await ingestScoutSignal({
      mint: body.mint,
      name: body.name,
      symbol: body.symbol,
      source: "admin",
      sourceUrl: body.sourceUrl,
      forceActivate: body.activate === true
    });
    if (result.activated) {
      await queueSignalDeliveries(result.signal);
      await processTelegramQueue(20).catch((error) => console.warn("Immediate Runner delivery failed", error));
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signal ingestion failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
