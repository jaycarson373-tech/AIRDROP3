export const defaultCurrentRunner = {
  name: "TripleT",
  ticker: "TripleT",
  mint: "J8PSdNP3QewKq2Z1JJJFDMaqF7KcaiJhR7gbr5KZpump",
  logoSrc: "/brand/triplet-logo.jpg",
  scannedMarketCap: "Active accumulation",
  scannedAgo: "Selected by Runner",
  dexScreenerUrl: "https://dexscreener.com/solana/J8PSdNP3QewKq2Z1JJJFDMaqF7KcaiJhR7gbr5KZpump"
} as const;

const defaultContractAddress = "8Ab3XVBjvRB2p6sunVJgAiHGmwJA8hSgbs36kZFxpump";
const defaultXUrl = "";
const defaultDexScreenerUrl = `https://dexscreener.com/solana/${defaultContractAddress}`;

function cleanEnv(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed || "";
}

function cleanFirstEnv(...names: string[]) {
  for (const name of names) {
    const value = cleanEnv(process.env[name]);
    if (value) return value;
  }
  return "";
}

function looksLikeMint(value: string) {
  return value.length > 30 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(value);
}

function cleanProjectMint(value: string) {
  return looksLikeMint(value) ? value : "";
}

function cleanSocialUrl(value: string) {
  if (!value) return "";
  const lower = value.toLowerCase();
  if (!lower.includes("x.com/")) return value;
  return /(?:runner|animal|pump)/i.test(value) ? value : "";
}

const contractAddress =
  cleanProjectMint(cleanEnv(process.env.NEXT_PUBLIC_CA)) ||
  cleanProjectMint(cleanEnv(process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT)) ||
  defaultContractAddress;
const rawRewardSymbol = cleanEnv(process.env.NEXT_PUBLIC_REWARD_SYMBOL);
const rawRewardMint = cleanEnv(process.env.NEXT_PUBLIC_REWARD_TOKEN_MINT);
const rawActiveRunnerName = cleanFirstEnv("NEXT_PUBLIC_ACTIVE_INDEX_NAME", "NEXT_PUBLIC_ACTIVE_RUNNER_NAME");
const useDefaultCurrentRunner = !rawRewardSymbol || looksLikeMint(rawRewardSymbol);
const rewardMint = useDefaultCurrentRunner ? defaultCurrentRunner.mint : rawRewardMint || defaultCurrentRunner.mint;
const activeRunnerTicker = useDefaultCurrentRunner ? defaultCurrentRunner.ticker : rawRewardSymbol.replace(/^\$/, "");
const activeRunnerLabel = activeRunnerTicker.startsWith("$") ? activeRunnerTicker : `$${activeRunnerTicker}`;
const activeRunnerName =
  rawActiveRunnerName ||
  (useDefaultCurrentRunner || rewardMint === defaultCurrentRunner.mint ? defaultCurrentRunner.name : `${activeRunnerTicker} Runner`);
const parsedMinimumHolding = Number(process.env.NEXT_PUBLIC_ELIGIBILITY_MIN ?? 1_000_000);
const minimumHolding = Number.isFinite(parsedMinimumHolding) && parsedMinimumHolding > 0 ? parsedMinimumHolding : 1_000_000;
const rawActiveRunnerDexUrl = cleanFirstEnv("NEXT_PUBLIC_ACTIVE_INDEX_DEXSCREENER_URL", "NEXT_PUBLIC_ACTIVE_RUNNER_DEXSCREENER_URL");
const activeRunnerDexUrl =
  rawActiveRunnerDexUrl ||
  (rewardMint ? `https://dexscreener.com/solana/${rewardMint}` : defaultDexScreenerUrl);
const fallbackPumpFunUrl = contractAddress ? `https://pump.fun/coin/${contractAddress}` : "https://pump.fun/";

export type RunnerBoardRow = {
  rank: string;
  token: string;
  ticker: string;
  mint: string;
  logoSrc: string;
  detectedMarketCap: string;
  currentMarketCap: string;
  returnSinceDetection: string;
  amountAcquired: string;
  status: string;
  dexScreenerUrl: string;
};

export type RunnerPerformanceRow = {
  ticker: string;
  entryMarketCap: number;
  currentMarketCap: number;
  changePercent: number;
};

export const pumpRunnerConfig = {
  name: "Runner",
  ticker: "RUNNER",
  tokenLabel: "$RUNNER",
  rewardSymbol: activeRunnerTicker,
  logoSrc: "/brand/runner-logo.jpg",
  backgroundSrc: "/brand/runner-logo.jpg",
  bannerSrc: "/brand/og-image.jpg",
  contractAddress,
  rewardMint,
  buyUrl: process.env.NEXT_PUBLIC_BUY_URL ?? fallbackPumpFunUrl,
  pumpFunUrl: process.env.NEXT_PUBLIC_PUMPFUN_URL ?? fallbackPumpFunUrl,
  dexScreenerUrl: process.env.NEXT_PUBLIC_DEXSCREENER_URL ?? defaultDexScreenerUrl,
  xUrl: cleanSocialUrl(cleanEnv(process.env.NEXT_PUBLIC_X_URL)) || defaultXUrl,
  telegramUrl: process.env.NEXT_PUBLIC_TELEGRAM_URL ?? "",
  minimumHolding,
  epochMinutes: Number(process.env.NEXT_PUBLIC_EPOCH_MINUTES ?? 5),
  scannerStatus: "RISING",
  treasuryStatus: "ACTIVE",
  currentRunner: {
    name: activeRunnerName,
    ticker: activeRunnerLabel,
    mint: rewardMint,
    logoSrc: cleanFirstEnv("NEXT_PUBLIC_ACTIVE_INDEX_LOGO_SRC", "NEXT_PUBLIC_ACTIVE_RUNNER_LOGO_SRC") || defaultCurrentRunner.logoSrc,
    dexScreenerUrl: activeRunnerDexUrl,
    detectedMarketCap: cleanFirstEnv("NEXT_PUBLIC_ACTIVE_INDEX_ENTRY_MCAP", "NEXT_PUBLIC_ACTIVE_RUNNER_ENTRY_MCAP") || defaultCurrentRunner.scannedMarketCap,
    currentMarketCap: cleanFirstEnv("NEXT_PUBLIC_ACTIVE_INDEX_CURRENT_MCAP", "NEXT_PUBLIC_ACTIVE_RUNNER_CURRENT_MCAP") || "Live runner",
    amountAcquired: cleanFirstEnv("NEXT_PUBLIC_ACTIVE_INDEX_AMOUNT", "NEXT_PUBLIC_ACTIVE_RUNNER_AMOUNT") || "Selected by Runner",
    status: cleanFirstEnv("NEXT_PUBLIC_ACTIVE_INDEX_STATUS", "NEXT_PUBLIC_ACTIVE_RUNNER_STATUS") || "Active selection"
  },
  marketTickerFallback: {
    price: "$0.00006900",
    marketCap: "$690K",
    volume24h: "$69K",
    holderCount: "6,900",
    totalDistributed: "$0"
  },
  scannerMetrics: {
    tokensTracked: "LIVE",
    signalsReviewed: "TRACKING",
    runnersSelected: "1",
    currentEpoch: "0"
  },
  multiplierTiers: [
    { label: "Under 24 hours", multiplier: "1.00x", progress: 12 },
    { label: "1-3 days", multiplier: "1.25x", progress: 38 },
    { label: "3-7 days", multiplier: "1.50x", progress: 68 },
    { label: "7+ days", multiplier: "2.00x", progress: 100 }
  ],
  runnerBoard: [
    {
      rank: "01",
      token: activeRunnerName,
      ticker: activeRunnerLabel,
      mint: rewardMint,
      logoSrc: cleanFirstEnv("NEXT_PUBLIC_ACTIVE_INDEX_LOGO_SRC", "NEXT_PUBLIC_ACTIVE_RUNNER_LOGO_SRC") || defaultCurrentRunner.logoSrc,
      detectedMarketCap: cleanFirstEnv("NEXT_PUBLIC_ACTIVE_INDEX_ENTRY_MCAP", "NEXT_PUBLIC_ACTIVE_RUNNER_ENTRY_MCAP") || "Unavailable",
      currentMarketCap: "Live market data",
      returnSinceDetection: "Active",
      amountAcquired: cleanFirstEnv("NEXT_PUBLIC_ACTIVE_INDEX_AMOUNT", "NEXT_PUBLIC_ACTIVE_RUNNER_AMOUNT") || "Awaiting settled buy",
      status: cleanFirstEnv("NEXT_PUBLIC_ACTIVE_INDEX_STATUS", "NEXT_PUBLIC_ACTIVE_RUNNER_STATUS") || "Active selection",
      dexScreenerUrl: activeRunnerDexUrl
    }
  ] satisfies RunnerBoardRow[],
  performanceRows: [
    { ticker: activeRunnerLabel, entryMarketCap: 1, currentMarketCap: 1, changePercent: 0 }
  ] satisfies RunnerPerformanceRow[],
  scannerCards: [
    {
      title: "SCAN",
      body: "Runner tracks liquidity, volume, holder growth, price action, token age and market velocity."
    },
    {
      title: "SELECT",
      body: "The strongest live setup becomes the active selection."
    },
    {
      title: "SNAPSHOT",
      body: "Holder weight is calculated from each eligible balance at the epoch snapshot."
    },
    {
      title: "DROP",
      body: "Eligible holders receive the active runner with onchain receipts."
    }
  ]
} as const;
