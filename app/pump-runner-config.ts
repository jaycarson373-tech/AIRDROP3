const contractAddress = process.env.NEXT_PUBLIC_CA ?? process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT ?? "";
const rewardMint = process.env.NEXT_PUBLIC_REWARD_TOKEN_MINT ?? "";
const activeRunnerTicker = process.env.NEXT_PUBLIC_REWARD_SYMBOL ?? "TBD";
const activeRunnerLabel = activeRunnerTicker.startsWith("$") ? activeRunnerTicker : `$${activeRunnerTicker}`;
const parsedMinimumHolding = Number(process.env.NEXT_PUBLIC_ELIGIBILITY_MIN ?? 2_500_000);
const minimumHolding = Number.isFinite(parsedMinimumHolding) && parsedMinimumHolding > 0 ? parsedMinimumHolding : 2_500_000;
const activeRunnerDexUrl =
  process.env.NEXT_PUBLIC_ACTIVE_RUNNER_DEXSCREENER_URL ??
  (rewardMint ? `https://dexscreener.com/solana/${rewardMint}` : "https://dexscreener.com/solana");
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
    name: process.env.NEXT_PUBLIC_ACTIVE_RUNNER_NAME ?? (activeRunnerTicker === "TBD" ? "First Runner TBD" : `${activeRunnerTicker} Runner`),
    ticker: activeRunnerLabel,
    mint: rewardMint,
    dexScreenerUrl: activeRunnerDexUrl,
    detectedMarketCap: process.env.NEXT_PUBLIC_ACTIVE_RUNNER_ENTRY_MCAP ?? "Awaiting entry",
    currentMarketCap: process.env.NEXT_PUBLIC_ACTIVE_RUNNER_CURRENT_MCAP ?? "Live after buy",
    amountAcquired: process.env.NEXT_PUBLIC_ACTIVE_RUNNER_AMOUNT ?? "Buying this epoch",
    status: process.env.NEXT_PUBLIC_ACTIVE_RUNNER_STATUS ?? "Current Runner"
  },
  marketTickerFallback: {
    price: "$0.000042",
    marketCap: "$420K",
    volume24h: "$84K",
    holderCount: "1,284",
    totalDistributed: "$0"
  },
  scannerMetrics: {
    tokensTracked: "12,481",
    signalsReviewed: "348",
    runnersSelected: "4",
    currentEpoch: "08"
  },
  treasuryStatistics: {
    runnersCaughtToday: "1",
    averageEntryMarketCap: "Awaiting live scan",
    averageReturn: "Tracking",
    bestRunner: activeRunnerLabel,
    totalDistributedToday: "Awaiting first drop"
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
      token: process.env.NEXT_PUBLIC_ACTIVE_RUNNER_NAME ?? (activeRunnerTicker === "TBD" ? "First Runner TBD" : `${activeRunnerTicker} Runner`),
      ticker: activeRunnerLabel,
      detectedMarketCap: process.env.NEXT_PUBLIC_ACTIVE_RUNNER_ENTRY_MCAP ?? "Awaiting entry",
      currentMarketCap: process.env.NEXT_PUBLIC_ACTIVE_RUNNER_CURRENT_MCAP ?? "Live after buy",
      returnSinceDetection: process.env.NEXT_PUBLIC_ACTIVE_RUNNER_RETURN ?? "Tracking",
      amountAcquired: process.env.NEXT_PUBLIC_ACTIVE_RUNNER_AMOUNT ?? "Buying this epoch",
      status: process.env.NEXT_PUBLIC_ACTIVE_RUNNER_STATUS ?? "Current Runner",
      dexScreenerUrl: activeRunnerDexUrl
    },
    {
      rank: "02",
      token: "Previous Runner",
      ticker: "—",
      detectedMarketCap: "Pending",
      currentMarketCap: "Pending",
      returnSinceDetection: "Pending",
      amountAcquired: "Pending",
      status: "Next update",
      dexScreenerUrl: fallbackDexScreenerUrl
    },
    {
      rank: "03",
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
    { ticker: activeRunnerLabel, entryMarketCap: 30_000, currentMarketCap: 30_000, changePercent: 0 },
    { ticker: "Runner 02", entryMarketCap: 1, currentMarketCap: 1, changePercent: 0 },
    { ticker: "Runner 03", entryMarketCap: 1, currentMarketCap: 1, changePercent: 0 },
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
