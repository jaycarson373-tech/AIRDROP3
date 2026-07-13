export const defaultCurrentRunner = {
  name: "Homer let the barts out",
  ticker: "Barts",
  mint: "SZriK9WPVbggS4xTWgyCcNAjs3ongzeLB3AzAwwpump",
  logoSrc: "/brand/barts-runner-logo.jpg",
  scannedMarketCap: "$26.7K",
  scannedAgo: "10:33:34 AM EST",
  dexScreenerUrl: "https://dexscreener.com/solana/ebjz4mlyeyss57f6f1h1s1hdgtyom8aaqaegej9cyul3"
} as const;

const defaultContractAddress = "2B2VJHTaxBQyKTE9Cre96Aku7TuURaeEa44MiKLkpump";
const defaultXUrl = "https://x.com/CopyCat_pf";

function cleanEnv(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed || "";
}

function looksLikeMint(value: string) {
  return value.length > 30 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(value);
}

const contractAddress = cleanEnv(process.env.NEXT_PUBLIC_CA) || cleanEnv(process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT) || defaultContractAddress;
const rawRewardSymbol = cleanEnv(process.env.NEXT_PUBLIC_REWARD_SYMBOL);
const rawRewardMint = cleanEnv(process.env.NEXT_PUBLIC_REWARD_TOKEN_MINT);
const rawActiveRunnerName = cleanEnv(process.env.NEXT_PUBLIC_ACTIVE_RUNNER_NAME);
const useDefaultCurrentRunner = !rawRewardSymbol || looksLikeMint(rawRewardSymbol);
const rewardMint = useDefaultCurrentRunner ? defaultCurrentRunner.mint : rawRewardMint || defaultCurrentRunner.mint;
const activeRunnerTicker = useDefaultCurrentRunner ? defaultCurrentRunner.ticker : rawRewardSymbol;
const activeRunnerLabel = activeRunnerTicker.startsWith("$") ? activeRunnerTicker : `$${activeRunnerTicker}`;
const activeRunnerName =
  rawActiveRunnerName ||
  (activeRunnerTicker.replace(/^\$/, "").toUpperCase() === defaultCurrentRunner.ticker ? defaultCurrentRunner.name : `${activeRunnerTicker} Copy`);
const parsedMinimumHolding = Number(process.env.NEXT_PUBLIC_ELIGIBILITY_MIN ?? 1_000_000);
const minimumHolding = Number.isFinite(parsedMinimumHolding) && parsedMinimumHolding > 0 ? parsedMinimumHolding : 1_000_000;
const rawActiveRunnerDexUrl = cleanEnv(process.env.NEXT_PUBLIC_ACTIVE_RUNNER_DEXSCREENER_URL);
const activeRunnerDexUrl =
  rawActiveRunnerDexUrl ||
  (useDefaultCurrentRunner ? defaultCurrentRunner.dexScreenerUrl : rewardMint ? `https://dexscreener.com/solana/${rewardMint}` : "https://dexscreener.com/solana");
const fallbackPumpFunUrl = contractAddress ? `https://pump.fun/coin/${contractAddress}` : "https://pump.fun/";
const fallbackDexScreenerUrl = contractAddress ? `https://dexscreener.com/solana/${contractAddress}` : "https://dexscreener.com/solana";

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
  name: "Copy Cat",
  ticker: "COPYCAT",
  tokenLabel: "$COPYCAT",
  rewardSymbol: activeRunnerTicker,
  logoSrc: "/brand/copy-cat-logo.jpg",
  backgroundSrc: "/brand/copy-cat-background.jpg",
  bannerSrc: "/brand/copy-cat-background.jpg",
  contractAddress,
  rewardMint,
  buyUrl: process.env.NEXT_PUBLIC_BUY_URL ?? fallbackPumpFunUrl,
  pumpFunUrl: process.env.NEXT_PUBLIC_PUMPFUN_URL ?? fallbackPumpFunUrl,
  dexScreenerUrl: process.env.NEXT_PUBLIC_DEXSCREENER_URL ?? fallbackDexScreenerUrl,
  xUrl: cleanEnv(process.env.NEXT_PUBLIC_X_URL) || defaultXUrl,
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
    { label: "1-3 days", multiplier: "1.25x", progress: 38 },
    { label: "3-7 days", multiplier: "1.50x", progress: 68 },
    { label: "7+ days", multiplier: "2.00x", progress: 100 }
  ],
  runnerBoard: [
    {
      rank: "01",
      token: useDefaultCurrentRunner ? defaultCurrentRunner.name : activeRunnerName,
      ticker: activeRunnerLabel,
      mint: rewardMint,
      logoSrc: useDefaultCurrentRunner ? defaultCurrentRunner.logoSrc : cleanEnv(process.env.NEXT_PUBLIC_ACTIVE_RUNNER_LOGO_SRC) || defaultCurrentRunner.logoSrc,
      detectedMarketCap: process.env.NEXT_PUBLIC_ACTIVE_RUNNER_ENTRY_MCAP ?? defaultCurrentRunner.scannedMarketCap,
      currentMarketCap: process.env.NEXT_PUBLIC_ACTIVE_RUNNER_CURRENT_MCAP ?? "Live after buy",
      returnSinceDetection: process.env.NEXT_PUBLIC_ACTIVE_RUNNER_RETURN ?? "Tracking",
      amountAcquired: process.env.NEXT_PUBLIC_ACTIVE_RUNNER_AMOUNT ?? "Buying this epoch",
      status: process.env.NEXT_PUBLIC_ACTIVE_RUNNER_STATUS ?? `Scanned ${defaultCurrentRunner.scannedAgo}`,
      dexScreenerUrl: activeRunnerDexUrl
    },
    {
      rank: "02",
      token: "Private Copy Queue",
      ticker: "—",
      mint: "",
      logoSrc: "/brand/copy-cat-logo.jpg",
      detectedMarketCap: "Private",
      currentMarketCap: "Private",
      returnSinceDetection: "Private",
      amountAcquired: "Not published",
      status: "Scanning",
      dexScreenerUrl: fallbackDexScreenerUrl
    }
  ] satisfies RunnerBoardRow[],
  performanceRows: [
    { ticker: activeRunnerLabel, entryMarketCap: 26_700, currentMarketCap: 35_392, changePercent: 33 }
  ] satisfies RunnerPerformanceRow[],
  scannerCards: [
    {
      title: "Smart Wallets",
      body: "Aggregates wallets that have historically moved early into live Pump.fun setups."
    },
    {
      title: "Signal Matching",
      body: "Combines wallet flow, liquidity, volume and timing into one private scan feed."
    },
    {
      title: "Fee Routing",
      body: "Routes 100% of usable creator fees toward buying the active scan token."
    },
    {
      title: "Airdrop Rail",
      body: "Airdrops the scan token to eligible holders above the configured holding minimum."
    }
  ]
} as const;
