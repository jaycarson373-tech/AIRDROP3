import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MarketCapPoint = {
  value: number | null;
  source: "NASDAQ" | "DEXSCREENER";
  status: "live" | "unavailable" | "awaiting-mint";
  valuationType: "MARKET CAP" | "FDV" | null;
  updatedAt: string | null;
  url: string | null;
};

type DexPair = {
  chainId?: string;
  url?: string;
  marketCap?: number;
  fdv?: number;
  liquidity?: { usd?: number };
};

function parseUsd(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : null;
  if (typeof value !== "string") return null;
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

async function getSndkMarketCap(): Promise<MarketCapPoint> {
  try {
    const response = await fetch("https://api.nasdaq.com/api/quote/SNDK/summary?assetclass=stocks", {
      cache: "no-store",
      headers: {
        Accept: "application/json, text/plain, */*",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
      }
    });
    if (!response.ok) throw new Error(`NASDAQ returned ${response.status}`);
    const payload = (await response.json()) as {
      data?: { summaryData?: { MarketCap?: { value?: string } } };
    };
    const value = parseUsd(payload.data?.summaryData?.MarketCap?.value);
    return {
      value,
      source: "NASDAQ",
      status: value ? "live" : "unavailable",
      valuationType: value ? "MARKET CAP" : null,
      updatedAt: value ? new Date().toISOString() : null,
      url: "https://www.nasdaq.com/market-activity/stocks/sndk"
    };
  } catch {
    return {
      value: null,
      source: "NASDAQ",
      status: "unavailable",
      valuationType: null,
      updatedAt: null,
      url: "https://www.nasdaq.com/market-activity/stocks/sndk"
    };
  }
}

async function getSndk6900MarketCap(): Promise<MarketCapPoint> {
  const mint = process.env.SNDK6900_TOKEN_MINT?.trim() ?? "";
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)) {
    return {
      value: null,
      source: "DEXSCREENER",
      status: "awaiting-mint",
      valuationType: null,
      updatedAt: null,
      url: null
    };
  }

  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`, {
      cache: "no-store",
      headers: { Accept: "application/json" }
    });
    if (!response.ok) throw new Error(`DexScreener returned ${response.status}`);
    const payload = (await response.json()) as { pairs?: DexPair[] | null };
    const pairs = (payload.pairs ?? [])
      .filter((pair) => pair.chainId === "solana")
      .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));
    const pair = pairs[0];
    const marketCap = parseUsd(pair?.marketCap);
    const fdv = parseUsd(pair?.fdv);
    const value = marketCap ?? fdv;

    return {
      value,
      source: "DEXSCREENER",
      status: value ? "live" : "unavailable",
      valuationType: marketCap ? "MARKET CAP" : fdv ? "FDV" : null,
      updatedAt: value ? new Date().toISOString() : null,
      url: pair?.url ?? `https://dexscreener.com/solana/${mint}`
    };
  } catch {
    return {
      value: null,
      source: "DEXSCREENER",
      status: "unavailable",
      valuationType: null,
      updatedAt: null,
      url: `https://dexscreener.com/solana/${mint}`
    };
  }
}

export async function GET() {
  const [sndk, sndk6900] = await Promise.all([getSndkMarketCap(), getSndk6900MarketCap()]);
  const comparison =
    sndk.value && sndk6900.value
      ? {
          targetMultiple: sndk.value / sndk6900.value,
          progressPercent: Math.min(100, (sndk6900.value / sndk.value) * 100),
          gapUsd: Math.max(0, sndk.value - sndk6900.value)
        }
      : null;

  return NextResponse.json(
    {
      sndk,
      sndk6900,
      comparison,
      updatedAt: new Date().toISOString()
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
      }
    }
  );
}
