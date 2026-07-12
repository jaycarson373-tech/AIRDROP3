export const defaultCurrentRunner = {
  name: "The Pink Bull",
  ticker: "PINKBULL",
  mint: "Er58M968bCGnmKwvrrPhW21zesoFfo8gXPUDokKMpump",
  logoSrc: "/brand/pink-bull-runner-logo.png",
  scannedMarketCap: "$15.2K",
  scannedAgo: "7:38 PM EST"
} as const;

function cleanEnv(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed || "";
}

function isStaleHomeRunner(value: string) {
  return value.replace(/^\$/, "").toUpperCase() === "HOME";
}

function isPreviousRunner(value: string) {
  const normalized = value.replace(/^\$/, "").toUpperCase();
  return normalized === "GIRL" || normalized === "GIRLCOIN" || normalized === "HARRIS";
}

function isPreviousRunnerMint(value: string) {
  return value === "GWNYjjSPsE6PthXjc61JQrTcjfNerSrRzBakeinqpump" || value === "3LT2dbBd5Bw2gffDUuq3d7iXqJzevSd5uuLCvNe9pump";
}

function looksLikeMint(value: string) {
  return value.length > 30 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(value);
}

const contractAddress = cleanEnv(process.env.NEXT_PUBLIC_CA) || cleanEnv(process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT);
const rawRewardSymbol = cleanEnv(process.env.NEXT_PUBLIC_REWARD_SYMBOL);
const rawRewardMint = cleanEnv(process.env.NEXT_PUBLIC_REWARD_TOKEN_MINT);
const rawActiveRunnerName = cleanEnv(process.env.NEXT_PUBLIC_ACTIVE_RUNNER_NAME);
const useDefaultCurrentRunner = !rawRewardSymbol || looksLikeMint(rawRewardSymbol) || isStaleHomeRunner(rawRewardSymbol) || isPreviousRunner(rawRewardSymbol) || isPreviousRunnerMint(rawRewardMint) || /home/i.test(rawActiveRunnerName) || /girl|harris/i.test(rawActiveRunnerName);
const rewardMint = useDefaultCurrentRunner ? defaultCurrentRunner.mint : rawRewardMint || defaultCurrentRunner.mint;
const activeRunnerTicker = useDefaultCurrentRunner ? defaultCurrentRunner.ticker : rawRewardSymbol;
const activeRunnerLabel = activeRunnerTicker.startsWith("$") ? activeRunnerTicker : `$${activeRunnerTicker}`;
const activeRunnerName =
  rawActiveRunnerName ||
  (activeRunnerTicker.replace(/^\$/, "").toUpperCase() === defaultCurrentRunner.ticker ? defaultCurrentRunner.name : `${activeRunnerTicker} Runner`);
const parsedMinimumHolding = Number(process.env.NEXT_PUBLIC_ELIGIBILITY_MIN ?? 2_500_000);
const minimumHolding = Number.isFinite(parsedMinimumHolding) && parsedMinimumHolding > 0 ? parsedMinimumHolding : 2_500_000;
const rawActiveRunnerDexUrl = cleanEnv(process.env.NEXT_PUBLIC_ACTIVE_RUNNER_DEXSCREENER_URL);
const activeRunnerDexUrl =
  rawActiveRunnerDexUrl || (rewardMint ? `https://dexscreener.com/solana/${rewardMint}` : "https://dexscreener.com/solana");
const fallbackPumpFunUrl = contractAddress ? `https://pump.fun/coin/${contractAddress}` : "https://pump.fun/";
const fallbackDexScreenerUrl = contractAddress ? `https://dexscreener.com/solana/${contractAddress}` : "https://dexscreener.com/solana";

export type RunnerBoardRow = {
  rank: string;
  token: string;
  ticker: string;
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
  name: "Pump Runner",
  ticker: "RUNNER",
  tokenLabel: "$RUNNER",
  rewardSymbol: activeRunnerTicker,
  logoSrc: "/brand/pump-runner-logo.png",
  backgroundSrc: "/brand/pump-runner-bg.png",
  bannerSrc: "/brand/pump-runner-banner.png",
  contractAddress,
  rewardMint,
  buyUrl: process.env.NEXT_PUBLIC_BUY_URL ?? fallbackPumpFunUrl,
  pumpFunUrl: process.env.NEXT_PUBLIC_PUMPFUN_URL ?? fallbackPumpFunUrl,
  dexScreenerUrl: process.env.NEXT_PUBLIC_DEXSCREENER_URL ?? fallbackDexScreenerUrl,
  xUrl: process.env.NEXT_PUBLIC_X_URL ?? "",
  telegramUrl: process.env.NEXT_PUBLIC_TELEGRAM_URL ?? "",
  minimumHolding,
  epochMinutes: Number(process.env.NEXT_PUBLIC_EPOCH_MINUTES ?? 5),
  scannerStatus: "SCANNING",
  treasuryStatus: "ACTIVE",
  currentRunner: {
    name: useDefaultCurrentRunner ? defaultCurrentRunner.name : activeRunnerName,
    ticker: activeRunnerLabel,
    mint: rewardMint,
    logoSrc: useDefaultCurrentRunner ? defaultCurrentRunner.logoSrc : cleanEnv(process.env.NEXT_PUBLIC_ACTIVE_RUNNER_LOGO_SRC) || defaultCurrentRunner.logoSrc,
    dexScreenerUrl: activeRunnerDexUrl,
    detectedMarketCap: process.env.NEXT_PUBLIC_ACTIVE_RUNNER_ENTRY_MCAP ?? defaultCurrentRunner.scannedMarketCap,
    currentMarketCap: process.env.NEXT_PUBLIC_ACTIVE_RUNNER_CURRENT_MCAP ?? "Live after buy",
    amountAcquired: process.env.NEXT_PUBLIC_ACTIVE_RUNNER_AMOUNT ?? `Buying ${activeRunnerLabel}`,
    status: process.env.NEXT_PUBLIC_ACTIVE_RUNNER_STATUS ?? `Scanned ${defaultCurrentRunner.scannedAgo}`
  },
  marketTickerFallback: {
    price: "$0.000042",
    marketCap: "$420K",
    volume24h: "$84K",
    holderCount: "1,284",
    totalDistributed: "$0"
  },
  scannerMetrics: {
    tokensTracked: "0",
    signalsReviewed: "0",
    runnersSelected: "0",
    currentEpoch: "0"
  },
  treasuryStatistics: {
    runnersCaughtToday: "1",
    averageEntryMarketCap: defaultCurrentRunner.scannedMarketCap,
    averageReturn: "Tracking",
    bestRunner: activeRunnerLabel,
    totalDistributedToday: "0 SOL"
  },
  multiplierTiers: [
    { label: "Under 24 hours", multiplier: "1.00x", progress: 12 },
    { label: "1-3 days", multiplier: "1.05x", progress: 38 },
    { label: "3-7 days", multiplier: "1.10x", progress: 68 },
    { label: "7+ days", multiplier: "1.15x", progress: 100 }
  ],
  runnerBoard: [
    {
      rank: "01",
      token: useDefaultCurrentRunner ? defaultCurrentRunner.name : activeRunnerName,
      ticker: activeRunnerLabel,
      detectedMarketCap: process.env.NEXT_PUBLIC_ACTIVE_RUNNER_ENTRY_MCAP ?? defaultCurrentRunner.scannedMarketCap,
      currentMarketCap: process.env.NEXT_PUBLIC_ACTIVE_RUNNER_CURRENT_MCAP ?? "Live after buy",
      returnSinceDetection: process.env.NEXT_PUBLIC_ACTIVE_RUNNER_RETURN ?? "Tracking",
      amountAcquired: process.env.NEXT_PUBLIC_ACTIVE_RUNNER_AMOUNT ?? "Buying this epoch",
      status: process.env.NEXT_PUBLIC_ACTIVE_RUNNER_STATUS ?? `Scanned ${defaultCurrentRunner.scannedAgo}`,
      dexScreenerUrl: activeRunnerDexUrl
    },
    {
      rank: "02",
      token: "Harris",
      ticker: "$HARRIS",
      detectedMarketCap: "$40.2K",
      currentMarketCap: "Archived",
      returnSinceDetection: "Tracking",
      amountAcquired: "Previous drop",
      status: "Scanned 22:17:05",
      dexScreenerUrl: "https://dexscreener.com/solana/3LT2dbBd5Bw2gffDUuq3d7iXqJzevSd5uuLCvNe9pump"
    },
    {
      rank: "03",
      token: "Girlcoin",
      ticker: "$GIRLCOIN",
      detectedMarketCap: "$52.9K",
      currentMarketCap: "$264.5K",
      returnSinceDetection: "5x",
      amountAcquired: "Archived",
      status: "Scanned 20:57 · 48 mins ago",
      dexScreenerUrl: "https://dexscreener.com/solana/GWNYjjSPsE6PthXjc61JQrTcjfNerSrRzBakeinqpump"
    },
    {
      rank: "04",
      token: "Runner Archive",
      ticker: "—",
      detectedMarketCap: "Pending",
      currentMarketCap: "Pending",
      returnSinceDetection: "Pending",
      amountAcquired: "Pending",
      status: "Distributed runners",
      dexScreenerUrl: fallbackDexScreenerUrl
    },
    {
      rank: "04",
      token: "Scanner Queue",
      ticker: "—",
      detectedMarketCap: "Private",
      currentMarketCap: "Private",
      returnSinceDetection: "Private",
      amountAcquired: "Not published",
      status: "Scanning",
      dexScreenerUrl: fallbackDexScreenerUrl
    }
  ] satisfies RunnerBoardRow[],
  performanceRows: [
    { ticker: activeRunnerLabel, entryMarketCap: 15_200, currentMarketCap: 15_200, changePercent: 0 },
    { ticker: "$HARRIS", entryMarketCap: 40_200, currentMarketCap: 40_200, changePercent: 0 },
    { ticker: "$GIRLCOIN", entryMarketCap: 52_900, currentMarketCap: 264_500, changePercent: 400 },
    { ticker: "Runner 04", entryMarketCap: 1, currentMarketCap: 1, changePercent: 0 }
  ] satisfies RunnerPerformanceRow[],
  scannerCards: [
    {
      title: "Momentum",
      body: "Tracks acceleration in buys, volume and market activity."
    },
    {
      title: "Liquidity",
      body: "Filters for sufficient liquidity and sustainable trading conditions."
    },
    {
      title: "Distribution",
      body: "Reviews holder concentration and wallet behaviour."
    },
    {
      title: "Velocity",
      body: "Measures how quickly attention and capital are entering a token."
    }
  ],
  riskCopy:
    "$RUNNER and all distributed assets are highly speculative digital tokens. Nothing on this website constitutes financial advice or guarantees future returns.",
  rentCopy:
    "Distribution minimums exist because creating or funding token accounts can incur Solana network rent and transaction costs. Very small allocations may be delayed, combined or excluded when the cost of distribution would be disproportionate to the reward. Requirements may be adjusted as network conditions change."
} as const;
