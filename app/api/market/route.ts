import { NextResponse } from "next/server";
import { defaultCurrentRunner } from "../../pump-runner-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DexToken = {
  address?: string;
  symbol?: string;
  name?: string;
};

type DexPair = {
  chainId?: string;
  dexId?: string;
  url?: string;
  pairAddress?: string;
  baseToken?: DexToken;
  quoteToken?: DexToken;
  priceUsd?: string | null;
  priceChange?: {
    h24?: number;
  } | null;
  volume?: {
    h24?: number;
  } | null;
  liquidity?: {
    usd?: number;
  } | null;
  marketCap?: number | null;
  fdv?: number | null;
};

type TokenMarket = {
  priceUsd: number | null;
  change24h: number | null;
  marketCapUsd: number | null;
  fdvUsd: number | null;
  volume24hUsd: number | null;
  liquidityUsd: number | null;
  url: string | null;
  symbol: string;
};

type MarketPayload = {
  reward: TokenMarket;
  source: TokenMarket;
  sol: TokenMarket;
  updatedAt: string;
};

const SOL_MINT = "So11111111111111111111111111111111111111112";
const DEFAULT_SOURCE_MINT = "8ZG2jEdmEp5t31aikFFHJrYU4JxJjUGRTjxEpPSipump";
const CACHE_MS = 15_000;
const OLD_PROJECT_MINTS = new Set([
  "2B2VJHTaxBQyKTE9Cre96Aku7TuURaeEa44MiKLkpump",
  "3dejiWxvpL6QH63rBE38fSrVbna8pVrKbmbPPDke7wuH",
  "SZriK9WPVbggS4xTWgyCcNAjs3ongzeLB3AzAwwpump",
  "8TUWgrMcBMtviLyuJWUvpXLx8RUUYDKK2Bp7qUVJpump",
  "GWNYjjSPsE6PthXjc61JQrTcjfNerSrRzBakeinqpump",
  "3LT2dbBd5Bw2gffDUuq3d7iXqJzevSd5uuLCvNe9pump",
  "Er58M968bCGnmKwvrrPhW21zesoFfo8gXPUDokKMpump",
  "ERhuqP9nGdNcQS8Fb2uGj7a1xrDJkjwRxM99PcXgpump",
  "G7cjRAF31V8K6r89pxHqLYrmG94TwxkJtfWg3AZapump",
  "3UiQ7mFuAdpeMUMbQTQDon8N1mK2L4YMiMzfpr4upump",
  "FTAat9Wt3wHkLkjHXXifJG6TmbUH5yVVWEfAGBhMpump"
]);

let cache: { expiresAt: number; payload: MarketPayload } | null = null;

function env(name: string) {
  return process.env[name] ?? process.env[`NEXT_PUBLIC_${name}`];
}

function cleanAddress(value: string | undefined | null) {
  const trimmed = value?.trim();
  return trimmed || null;
}

function rewardMint() {
  const configured = cleanAddress(env("REWARD_TOKEN_MINT"));
  if (!configured || OLD_PROJECT_MINTS.has(configured)) return defaultCurrentRunner.mint;
  return configured;
}

function sourceMint() {
  const configured = cleanAddress(env("SOURCE_TOKEN_MINT")) ?? cleanAddress(env("CA"));
  if (configured && !OLD_PROJECT_MINTS.has(configured)) return configured;
  return cleanAddress(DEFAULT_SOURCE_MINT);
}

function sameAddress(a: string | undefined, b: string) {
  return a?.toLowerCase() === b.toLowerCase();
}

function liquidity(pair: DexPair) {
  return pair.liquidity?.usd ?? 0;
}

function pickPair(pairs: DexPair[], mint: string | null) {
  if (!mint) return null;
  const solanaPairs = pairs.filter((pair) => pair.chainId === "solana");
  const basePairs = solanaPairs.filter((pair) => sameAddress(pair.baseToken?.address, mint));
  const matchingPairs = basePairs.length
    ? basePairs
    : solanaPairs.filter((pair) => sameAddress(pair.quoteToken?.address, mint));

  return matchingPairs.sort((a, b) => liquidity(b) - liquidity(a))[0] ?? null;
}

function marketFromPair(pair: DexPair | null, symbol: string): TokenMarket {
  const priceUsd = Number(pair?.priceUsd ?? NaN);
  const change24h = Number(pair?.priceChange?.h24 ?? NaN);
  const marketCapUsd = Number(pair?.marketCap ?? NaN);
  const fdvUsd = Number(pair?.fdv ?? NaN);
  const volume24hUsd = Number(pair?.volume?.h24 ?? NaN);
  const liquidityUsd = Number(pair?.liquidity?.usd ?? NaN);

  return {
    priceUsd: Number.isFinite(priceUsd) ? priceUsd : null,
    change24h: Number.isFinite(change24h) ? change24h : null,
    marketCapUsd: Number.isFinite(marketCapUsd) ? marketCapUsd : null,
    fdvUsd: Number.isFinite(fdvUsd) ? fdvUsd : null,
    volume24hUsd: Number.isFinite(volume24hUsd) ? volume24hUsd : null,
    liquidityUsd: Number.isFinite(liquidityUsd) ? liquidityUsd : null,
    url: pair?.url ?? null,
    symbol
  };
}

async function fetchDexPairs(mints: string[]) {
  if (!mints.length) return [];

  const joined = Array.from(new Set(mints)).join(",");
  const response = await fetch(`https://api.dexscreener.com/tokens/v1/solana/${joined}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 15 }
  });

  if (!response.ok) throw new Error(`DexScreener token request failed ${response.status}`);
  return (await response.json()) as DexPair[];
}

export async function GET() {
  if (cache && Date.now() < cache.expiresAt) {
    return NextResponse.json(cache.payload);
  }

  const reward = rewardMint();
  const source = sourceMint();
  const pairs = await fetchDexPairs([reward, source, SOL_MINT].filter(Boolean) as string[]);
  const rewardSymbol = reward === defaultCurrentRunner.mint
    ? defaultCurrentRunner.ticker
    : process.env.NEXT_PUBLIC_REWARD_SYMBOL?.trim() || defaultCurrentRunner.ticker;
  const payload: MarketPayload = {
    reward: marketFromPair(pickPair(pairs, reward), rewardSymbol),
    source: marketFromPair(
      source ? pickPair(pairs, source) : null,
      process.env.NEXT_PUBLIC_SOURCE_SYMBOL ?? "SMI6900"
    ),
    sol: marketFromPair(pickPair(pairs, SOL_MINT), "SOL"),
    updatedAt: new Date().toISOString()
  };

  cache = { expiresAt: Date.now() + CACHE_MS, payload };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30"
    }
  });
}
