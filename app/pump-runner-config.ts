const contractAddress = process.env.NEXT_PUBLIC_CA ?? process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT ?? "";
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
  name: process.env.NEXT_PUBLIC_PROJECT_NAME ?? "Pump Runner",
  ticker: process.env.NEXT_PUBLIC_SOURCE_SYMBOL ?? "RUNNER",
  tokenLabel: `$${process.env.NEXT_PUBLIC_SOURCE_SYMBOL ?? "RUNNER"}`,
  rewardSymbol: process.env.NEXT_PUBLIC_REWARD_SYMBOL ?? "Runner drops",
  contractAddress,
  buyUrl: process.env.NEXT_PUBLIC_BUY_URL ?? fallbackPumpFunUrl,
  pumpFunUrl: process.env.NEXT_PUBLIC_PUMPFUN_URL ?? fallbackPumpFunUrl,
  dexScreenerUrl: process.env.NEXT_PUBLIC_DEXSCREENER_URL ?? fallbackDexScreenerUrl,
  xUrl: process.env.NEXT_PUBLIC_X_URL ?? "",
  telegramUrl: process.env.NEXT_PUBLIC_TELEGRAM_URL ?? "",
  minimumHolding: 2_500_000,
  epochMinutes: Number(process.env.NEXT_PUBLIC_EPOCH_MINUTES ?? 5),
  scannerStatus: "SCANNING",
  treasuryStatus: "ACTIVE",
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
    runnersCaughtToday: "4",
    averageEntryMarketCap: "$52K",
    averageReturn: "+181%",
    bestRunner: "+500%",
    totalDistributedToday: "$7.4K"
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
      token: "Example Runner",
      ticker: "$EXRUN",
      detectedMarketCap: "$30K",
      currentMarketCap: "$180K",
      returnSinceDetection: "+500%",
      amountAcquired: "$2,840",
      status: "Distributed",
      dexScreenerUrl: fallbackDexScreenerUrl
    },
    {
      rank: "02",
      token: "Example Token",
      ticker: "$EXAMP",
      detectedMarketCap: "$52K",
      currentMarketCap: "$140K",
      returnSinceDetection: "+169%",
      amountAcquired: "$1,920",
      status: "Next Drop",
      dexScreenerUrl: fallbackDexScreenerUrl
    },
    {
      rank: "03",
      token: "Example Coin",
      ticker: "$ECOIN",
      detectedMarketCap: "$85K",
      currentMarketCap: "$110K",
      returnSinceDetection: "+29%",
      amountAcquired: "$1,140",
      status: "Holding",
      dexScreenerUrl: fallbackDexScreenerUrl
    },
    {
      rank: "04",
      token: "Example Velocity",
      ticker: "$VELO",
      detectedMarketCap: "$41K",
      currentMarketCap: "$96K",
      returnSinceDetection: "+134%",
      amountAcquired: "$1,520",
      status: "Queued",
      dexScreenerUrl: fallbackDexScreenerUrl
    }
  ] satisfies RunnerBoardRow[],
  performanceRows: [
    { ticker: "$EXRUN", entryMarketCap: 30_000, currentMarketCap: 180_000, changePercent: 500 },
    { ticker: "$EXAMP", entryMarketCap: 52_000, currentMarketCap: 140_000, changePercent: 169 },
    { ticker: "$ECOIN", entryMarketCap: 85_000, currentMarketCap: 110_000, changePercent: 29 },
    { ticker: "$VELO", entryMarketCap: 41_000, currentMarketCap: 96_000, changePercent: 134 }
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
