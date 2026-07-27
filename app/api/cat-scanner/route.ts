import { NextResponse } from "next/server";
import { cateCall, type CatScannerCall } from "../../../lib/cat-scanner-public";

export const dynamic = "force-dynamic";

type DexPair = {
  url?: string;
  marketCap?: number;
  fdv?: number;
  liquidity?: { usd?: number };
  info?: { imageUrl?: string };
};

function finiteNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export async function GET() {
  const mint = process.env.CAT_SCANNER_CATE_MINT?.trim() || "";
  if (!mint) {
    return NextResponse.json({ calls: [cateCall] }, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" }
    });
  }

  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(mint)}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 30 }
    });
    if (!response.ok) throw new Error(`Market response ${response.status}`);
    const payload = await response.json() as { pairs?: DexPair[] };
    const pair = [...(payload.pairs ?? [])]
      .sort((left, right) => Number(right.liquidity?.usd ?? 0) - Number(left.liquidity?.usd ?? 0))[0];
    const marketCap = finiteNumber(pair?.marketCap) ?? finiteNumber(pair?.fdv);
    const call: CatScannerCall = {
      ...cateCall,
      mint,
      currentMarketCapUsd: marketCap ?? cateCall.currentMarketCapUsd,
      currentValueSource: marketCap ? "live" : "reported",
      logoUrl: pair?.info?.imageUrl || null,
      chartUrl: pair?.url || `https://dexscreener.com/solana/${mint}`
    };
    return NextResponse.json({ calls: [call] }, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" }
    });
  } catch {
    return NextResponse.json({
      calls: [{
        ...cateCall,
        mint,
        chartUrl: `https://dexscreener.com/solana/${mint}`
      }]
    }, {
      headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60" }
    });
  }
}
