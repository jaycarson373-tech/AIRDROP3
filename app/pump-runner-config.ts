export const defaultCurrentRunner = {
  name: "AI6900",
  ticker: "AI6900",
  mint: "",
  logoSrc: "/brand/smi6900-logo.png",
  scannedMarketCap: "Active index slot",
  scannedAgo: "Live basket drop",
  dexScreenerUrl: "https://dexscreener.com/solana"
} as const;

const defaultContractAddress = "";
const defaultXUrl = "https://x.com/SMI6900";
const defaultDexScreenerUrl = "https://dexscreener.com/solana";
const oldProjectMints = new Set([
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

function isOldReward(value: string) {
  return oldProjectMints.has(value);
}

function cleanProjectMint(value: string) {
  return oldProjectMints.has(value) ? "" : value;
}

const contractAddress =
  cleanProjectMint(cleanEnv(process.env.NEXT_PUBLIC_CA)) ||
  cleanProjectMint(cleanEnv(process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT)) ||
  defaultContractAddress;
const rawRewardSymbol = cleanEnv(process.env.NEXT_PUBLIC_REWARD_SYMBOL);
const rawRewardMint = cleanEnv(process.env.NEXT_PUBLIC_REWARD_TOKEN_MINT);
const rawActiveRunnerName = cleanFirstEnv("NEXT_PUBLIC_ACTIVE_INDEX_NAME", "NEXT_PUBLIC_ACTIVE_RUNNER_NAME");
const useDefaultCurrentRunner = !rawRewardSymbol || looksLikeMint(rawRewardSymbol) || isOldReward(rawRewardSymbol) || isOldReward(rawRewardMint);
const rewardMint = useDefaultCurrentRunner ? defaultCurrentRunner.mint : rawRewardMint || defaultCurrentRunner.mint;
const activeRunnerTicker = useDefaultCurrentRunner ? defaultCurrentRunner.ticker : rawRewardSymbol.replace(/^\$/, "");
const activeRunnerLabel = activeRunnerTicker.startsWith("$") ? activeRunnerTicker : `$${activeRunnerTicker}`;
const activeRunnerName = rawActiveRunnerName || (useDefaultCurrentRunner ? defaultCurrentRunner.name : `${activeRunnerTicker} Index Asset`);
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
  name: "SMI6900",
  ticker: "SMI6900",
  tokenLabel: "$SMI6900",
  rewardSymbol: activeRunnerTicker,
  logoSrc: "/brand/smi6900-logo.png",
  backgroundSrc: "/brand/smi6900-logo.png",
  bannerSrc: "/brand/smi6900-logo.png",
  contractAddress,
  rewardMint,
  buyUrl: process.env.NEXT_PUBLIC_BUY_URL ?? fallbackPumpFunUrl,
  pumpFunUrl: process.env.NEXT_PUBLIC_PUMPFUN_URL ?? fallbackPumpFunUrl,
  dexScreenerUrl: process.env.NEXT_PUBLIC_DEXSCREENER_URL ?? defaultDexScreenerUrl,
  xUrl: cleanEnv(process.env.NEXT_PUBLIC_X_URL) || defaultXUrl,
  telegramUrl: process.env.NEXT_PUBLIC_TELEGRAM_URL ?? "",
  minimumHolding,
  epochMinutes: Number(process.env.NEXT_PUBLIC_EPOCH_MINUTES ?? 5),
  scannerStatus: "INDEXING",
  treasuryStatus: "ACTIVE",
  currentRunner: {
    name: activeRunnerName,
    ticker: activeRunnerLabel,
    mint: rewardMint,
    logoSrc: cleanFirstEnv("NEXT_PUBLIC_ACTIVE_INDEX_LOGO_SRC", "NEXT_PUBLIC_ACTIVE_RUNNER_LOGO_SRC") || defaultCurrentRunner.logoSrc,
    dexScreenerUrl: activeRunnerDexUrl,
    detectedMarketCap: cleanFirstEnv("NEXT_PUBLIC_ACTIVE_INDEX_ENTRY_MCAP", "NEXT_PUBLIC_ACTIVE_RUNNER_ENTRY_MCAP") || defaultCurrentRunner.scannedMarketCap,
    currentMarketCap: cleanFirstEnv("NEXT_PUBLIC_ACTIVE_INDEX_CURRENT_MCAP", "NEXT_PUBLIC_ACTIVE_RUNNER_CURRENT_MCAP") || "Live basket",
    amountAcquired: cleanFirstEnv("NEXT_PUBLIC_ACTIVE_INDEX_AMOUNT", "NEXT_PUBLIC_ACTIVE_RUNNER_AMOUNT") || "Index weight active",
    status: cleanFirstEnv("NEXT_PUBLIC_ACTIVE_INDEX_STATUS", "NEXT_PUBLIC_ACTIVE_RUNNER_STATUS") || "Airdropping now"
  },
  marketTickerFallback: {
    price: "$0.00006900",
    marketCap: "$690K",
    volume24h: "$69K",
    holderCount: "6,900",
    totalDistributed: "$0"
  },
  scannerMetrics: {
    tokensTracked: "6,900",
    signalsReviewed: "690",
    runnersSelected: "3",
    currentEpoch: "0"
  },
  treasuryStatistics: {
    runnersCaughtToday: "3",
    averageEntryMarketCap: "Rotating",
    averageReturn: "Live",
    bestRunner: activeRunnerLabel,
    totalDistributedToday: "0 SOL"
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
      detectedMarketCap: cleanFirstEnv("NEXT_PUBLIC_ACTIVE_INDEX_ENTRY_MCAP", "NEXT_PUBLIC_ACTIVE_RUNNER_ENTRY_MCAP") || defaultCurrentRunner.scannedMarketCap,
      currentMarketCap: cleanFirstEnv("NEXT_PUBLIC_ACTIVE_INDEX_CURRENT_MCAP", "NEXT_PUBLIC_ACTIVE_RUNNER_CURRENT_MCAP") || "Live basket",
      returnSinceDetection: cleanFirstEnv("NEXT_PUBLIC_ACTIVE_INDEX_RETURN", "NEXT_PUBLIC_ACTIVE_RUNNER_RETURN") || "Airdropping",
      amountAcquired: cleanFirstEnv("NEXT_PUBLIC_ACTIVE_INDEX_AMOUNT", "NEXT_PUBLIC_ACTIVE_RUNNER_AMOUNT") || "Index weight active",
      status: cleanFirstEnv("NEXT_PUBLIC_ACTIVE_INDEX_STATUS", "NEXT_PUBLIC_ACTIVE_RUNNER_STATUS") || "Airdropping now",
      dexScreenerUrl: activeRunnerDexUrl
    },
    {
      rank: "02",
      token: "SPX6900",
      ticker: "$SPX6900",
      mint: "",
      logoSrc: "/brand/smi6900-logo.png",
      detectedMarketCap: "Meme slot",
      currentMarketCap: "Tracked",
      returnSinceDetection: "Basket",
      amountAcquired: "Index member",
      status: "Index member",
      dexScreenerUrl: defaultDexScreenerUrl
    },
    {
      rank: "03",
      token: "AI6900",
      ticker: "$AI6900",
      mint: "",
      logoSrc: "/brand/smi6900-logo.png",
      detectedMarketCap: "AI meme slot",
      currentMarketCap: "Tracked",
      returnSinceDetection: "Basket",
      amountAcquired: "Index member",
      status: "Index member",
      dexScreenerUrl: defaultDexScreenerUrl
    }
  ] satisfies RunnerBoardRow[],
  performanceRows: [
    { ticker: activeRunnerLabel, entryMarketCap: 69_000, currentMarketCap: 69_000, changePercent: 0 },
    { ticker: "$SPX6900", entryMarketCap: 69_000, currentMarketCap: 690_000, changePercent: 900 },
    { ticker: "$AI6900", entryMarketCap: 42_000, currentMarketCap: 420_000, changePercent: 900 }
  ] satisfies RunnerPerformanceRow[],
  scannerCards: [
    {
      title: "SCAN",
      body: "The engine monitors Solana meme activity, attention, liquidity and rotation strength."
    },
    {
      title: "SELECT",
      body: "The strongest eligible asset enters the active index basket."
    },
    {
      title: "SNAPSHOT",
      body: "Holder weight is calculated every epoch from balance and holding streak."
    },
    {
      title: "DROP",
      body: "Eligible holders receive the active basket asset with onchain receipts."
    }
  ]
} as const;
