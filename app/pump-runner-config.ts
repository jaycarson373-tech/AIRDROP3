export const defaultCurrentRunner = {
  name: "TripleT",
  ticker: "TripleT",
  mint: "J8PSdNP3QewKq2Z1JJJFDMaqF7KcaiJhR7gbr5KZpump",
  logoSrc: "/brand/triplet-logo.jpg",
  scannedMarketCap: "Active accumulation",
  scannedAgo: "Only active fund drop",
  dexScreenerUrl: "https://dexscreener.com/solana/J8PSdNP3QewKq2Z1JJJFDMaqF7KcaiJhR7gbr5KZpump"
} as const;

const fundBasketAssets = [
  {
    rank: "01",
    name: "ANSEM",
    ticker: "$ANSEM",
    mint: "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump",
    logoSrc: "/brand/ansem-logo.jpg",
    weight: "25%",
    route: "Epoch 1 of 4",
    dexScreenerUrl: "https://dexscreener.com/solana/9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump"
  },
  {
    rank: "02",
    name: "TROLL",
    ticker: "$TROLL",
    mint: "5UUH9RTDiSpq6HKS6bp4NdU9PNJpXRXuiw6ShBTBhgH2",
    logoSrc: "/brand/troll-logo.jpg",
    weight: "25%",
    route: "Epoch 2 of 4",
    dexScreenerUrl: "https://dexscreener.com/solana/5UUH9RTDiSpq6HKS6bp4NdU9PNJpXRXuiw6ShBTBhgH2"
  },
  {
    rank: "03",
    name: "KINS",
    ticker: "$KINS",
    mint: "Tqj8yFmagrg7oorpQkVGYR52r96RFTamvWfth9bpump",
    logoSrc: "/brand/kins-logo.jpg",
    weight: "25%",
    route: "Epoch 3 of 4",
    dexScreenerUrl: "https://dexscreener.com/solana/Tqj8yFmagrg7oorpQkVGYR52r96RFTamvWfth9bpump"
  },
  {
    rank: "04",
    name: "TripleT",
    ticker: "$TripleT",
    mint: defaultCurrentRunner.mint,
    logoSrc: defaultCurrentRunner.logoSrc,
    weight: "25%",
    route: "Epoch 4 of 4",
    dexScreenerUrl: defaultCurrentRunner.dexScreenerUrl
  }
] as const;

const defaultContractAddress = "";
const defaultXUrl = "";
const defaultDexScreenerUrl = "https://dexscreener.com/solana";

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
  return /(?:ptf|pump|treasury|fund)/i.test(value) ? value : "";
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
  (useDefaultCurrentRunner || rewardMint === defaultCurrentRunner.mint ? defaultCurrentRunner.name : `${activeRunnerTicker} Fund Asset`);
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
  name: "PTF",
  ticker: "PTF",
  tokenLabel: "$PTF",
  rewardSymbol: activeRunnerTicker,
  logoSrc: "/brand/ptf-logo.png",
  backgroundSrc: "/brand/ptf-logo.png",
  bannerSrc: "/brand/ptf-header-banner.jpg",
  contractAddress,
  rewardMint,
  buyUrl: process.env.NEXT_PUBLIC_BUY_URL ?? fallbackPumpFunUrl,
  pumpFunUrl: process.env.NEXT_PUBLIC_PUMPFUN_URL ?? fallbackPumpFunUrl,
  dexScreenerUrl: process.env.NEXT_PUBLIC_DEXSCREENER_URL ?? defaultDexScreenerUrl,
  xUrl: cleanSocialUrl(cleanEnv(process.env.NEXT_PUBLIC_X_URL)) || defaultXUrl,
  telegramUrl: process.env.NEXT_PUBLIC_TELEGRAM_URL ?? "",
  minimumHolding,
  epochMinutes: Number(process.env.NEXT_PUBLIC_EPOCH_MINUTES ?? 5),
  scannerStatus: "LIVE",
  treasuryStatus: "ACTIVE",
  currentRunner: {
    name: activeRunnerName,
    ticker: activeRunnerLabel,
    mint: rewardMint,
    logoSrc: cleanFirstEnv("NEXT_PUBLIC_ACTIVE_INDEX_LOGO_SRC", "NEXT_PUBLIC_ACTIVE_RUNNER_LOGO_SRC") || defaultCurrentRunner.logoSrc,
    dexScreenerUrl: activeRunnerDexUrl,
    detectedMarketCap: cleanFirstEnv("NEXT_PUBLIC_ACTIVE_INDEX_ENTRY_MCAP", "NEXT_PUBLIC_ACTIVE_RUNNER_ENTRY_MCAP") || defaultCurrentRunner.scannedMarketCap,
    currentMarketCap: cleanFirstEnv("NEXT_PUBLIC_ACTIVE_INDEX_CURRENT_MCAP", "NEXT_PUBLIC_ACTIVE_RUNNER_CURRENT_MCAP") || "Live basket",
    amountAcquired: cleanFirstEnv("NEXT_PUBLIC_ACTIVE_INDEX_AMOUNT", "NEXT_PUBLIC_ACTIVE_RUNNER_AMOUNT") || "Holder weight active",
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
    runnersSelected: "1",
    currentEpoch: "0"
  },
  treasuryStatistics: {
    runnersCaughtToday: "1",
    averageEntryMarketCap: "Current selection",
    averageReturn: "Live epoch",
    bestRunner: "$ANSEM",
    totalDistributedToday: "0 SOL"
  },
  multiplierTiers: [
    { label: "Under 24 hours", multiplier: "1.00x", progress: 12 },
    { label: "1-3 days", multiplier: "1.25x", progress: 38 },
    { label: "3-7 days", multiplier: "1.50x", progress: 68 },
    { label: "7+ days", multiplier: "2.00x", progress: 100 }
  ],
  runnerBoard: fundBasketAssets.map((asset) => ({
    rank: asset.rank,
    token: asset.name,
    ticker: asset.ticker,
    mint: asset.mint,
    logoSrc: asset.logoSrc,
    detectedMarketCap: asset.weight,
    currentMarketCap: asset.route,
    returnSinceDetection: "Rotating",
    amountAcquired: asset.weight,
    status: "Active rotation",
    dexScreenerUrl: asset.dexScreenerUrl
  })) satisfies RunnerBoardRow[],
  performanceRows: [
    { ticker: activeRunnerLabel, entryMarketCap: 1, currentMarketCap: 1, changePercent: 0 }
  ] satisfies RunnerPerformanceRow[],
  scannerCards: [
    {
      title: "SCAN",
      body: "The fund scans Pump.fun activity, attention, liquidity and rotation strength."
    },
    {
      title: "SELECT",
      body: "The strongest eligible token enters the active fund basket."
    },
    {
      title: "SNAPSHOT",
      body: "Holder weight is calculated every epoch from balance and holding streak."
    },
    {
      title: "DROP",
      body: "Eligible holders receive the active Pump.fun basket asset with onchain receipts."
    }
  ]
} as const;
