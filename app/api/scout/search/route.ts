import { NextRequest, NextResponse } from "next/server";
import { enrichScoutSignalsWithLiveMarket, listScoutSignals, validateAccessToken } from "../../../../lib/scout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function moneyLimit(query: string) {
  const match = query.match(/(?:under|below|less than)\s*\$?([\d.]+)\s*([kmb])?/i);
  if (!match) return null;
  const scale = match[2]?.toLowerCase() === "b" ? 1e9 : match[2]?.toLowerCase() === "m" ? 1e6 : match[2]?.toLowerCase() === "k" ? 1e3 : 1;
  return Number(match[1]) * scale;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
  const premium = Boolean(await validateAccessToken(token).catch(() => null));
  try {
    const recordedSignals = await listScoutSignals({ premium, limit: 100 });
    const signals = await enrichScoutSignalsWithLiveMarket(recordedSignals).catch(() => recordedSignals);
    const lower = query.toLowerCase();
    const cap = moneyLimit(query);
    const since = lower.includes("last hour")
      ? Date.now() - 60 * 60_000
      : lower.includes("today")
        ? Date.now() - 24 * 60 * 60_000
        : null;
    const terms = lower
      .replace(/show|find|tokens?|coins?|runners?|under|below|less|than|gaining|attention|trending|new|with|strong|holder|growth|last|hour|today|\$|\d+(?:\.\d+)?[kmb]?/g, " ")
      .split(/\s+/)
      .filter((term) => term.length > 1);
    const results = signals.filter((signal) => {
      if (cap !== null && Number(signal.market_cap_usd ?? Infinity) >= cap) return false;
      if (since !== null && Date.parse(signal.detected_at) < since) return false;
      if (lower.includes("active") && signal.status !== "active") return false;
      if (lower.includes("rising") && Number((signal.metrics as { change1h?: number }).change1h ?? 0) <= 0) return false;
      if (!terms.length) return true;
      const haystack = `${signal.name} ${signal.symbol} ${signal.reasons.join(" ")} ${signal.selection_reason ?? ""}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
    return NextResponse.json({
      query,
      access: premium ? "premium" : "public",
      interpretedAs: {
        maximumMarketCapUsd: cap,
        detectedSince: since ? new Date(since).toISOString() : null,
        positiveMomentumOnly: lower.includes("rising")
      },
      results
    });
  } catch (error) {
    console.error("BUFFETTCOIN search failed", error);
    return NextResponse.json({ error: "Search is temporarily unavailable", results: [] }, { status: 503 });
  }
}
