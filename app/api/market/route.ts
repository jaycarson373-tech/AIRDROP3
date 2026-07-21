import { NextResponse } from "next/server";
import { getActiveScoutSignal } from "../../../lib/scout";

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
  basket: Record<string, TokenMarket>;
  updatedAt: string;
};

const SOL_MINT = "So11111111111111111111111111111111111111112";
const CACHE_MS = 15_000;

let cache: { expiresAt: number; payload: MarketPayload } | null = null;

function env(name: string) {
  return process.env[name] ?? process.env[`NEXT_PUBLIC_${name}`];
}

function cleanAddress(value: string | undefined | null) {
  const trimmed = value?.trim();
  return trimmed || null;
}

function rewardMint(activeMint: string | null) {
  if (process.env.SCOUT_DYNAMIC_SELECTION_ENABLED === "true" && activeMint) return activeMint;
  return cleanAddress(env("REWARD_TOKEN_MINT")) ?? activeMint;
}

function sourceMint() {
  return cleanAddress(env("SOURCE_TOKEN_MINT")) ?? cleanAddress(env("CA"));
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

  const active = await getActiveScoutSignal({ premium: true }).catch(() => null);
  const reward = rewardMint(active?.mint ?? null);
  const source = sourceMint();
  const pairs = await fetchDexPairs([reward, source, SOL_MINT].filter(Boolean) as string[]);
  const rewardSymbol =
    (active && active.mint === reward ? active.symbol : null) ||
    process.env.NEXT_PUBLIC_REWARD_SYMBOL?.trim() ||
    "SIGNAL";
  const payload: MarketPayload = {
    reward: marketFromPair(pickPair(pairs, reward), rewardSymbol),
    source: marketFromPair(
      source ? pickPair(pairs, source) : null,
      process.env.NEXT_PUBLIC_SOURCE_SYMBOL ?? "RUNNER"
    ),
    sol: marketFromPair(pickPair(pairs, SOL_MINT), "SOL"),
    basket: reward ? { [reward]: marketFromPair(pickPair(pairs, reward), rewardSymbol) } : {},
    updatedAt: new Date().toISOString()
  };

  cache = { expiresAt: Date.now() + CACHE_MS, payload };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30"
    }
  });
}
