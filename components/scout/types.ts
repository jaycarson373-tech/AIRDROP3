export type ScoutSignalStatus = "queued" | "active" | "passed" | "rejected" | "archived";

export type ScoutSignal = {
  id: string;
  chain: string;
  mint: string;
  name: string;
  symbol: string;
  source: string;
  source_url: string | null;
  status: ScoutSignalStatus;
  scout_score: number | null;
  price_usd: number | null;
  market_cap_usd: number | null;
  liquidity_usd: number | null;
  volume_24h_usd: number | null;
  holder_count: number | null;
  token_age_seconds: number | null;
  metrics: Record<string, number | string | null | undefined>;
  reasons: string[];
  risk_flags: string[];
  selection_reason: string | null;
  detected_at: string;
  selected_at: string | null;
  public_at: string;
  retired_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ScoutEvent = {
  id: number;
  signal_id: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
  signal:
    | Pick<ScoutSignal, "mint" | "name" | "symbol" | "status">
    | Pick<ScoutSignal, "mint" | "name" | "symbol" | "status">[]
    | null;
};

export type ScoutSignalsPayload = {
  access: "public" | "premium";
  publicDelaySeconds: number;
  active: ScoutSignal | null;
  signals: ScoutSignal[];
  events: ScoutEvent[];
};

export type ScoutStats = {
  currentEpoch: number;
  totalEpochs: number;
  lastRewardAirdropped: number;
  totalRewardAirdropped: number;
  latestEligibleHolders: number;
  averageMultiplier: number | null;
  nextDropTime: string | null;
  totalSolValueAirdropped: number;
  roundHistory: Array<{
    epoch: number;
    status: string;
    startedAt: string;
    duration: string;
    claimedSol: number;
    rewardBought: number;
    eligibleCount: number;
    distributedPump: number;
    solValueAirdropped: number;
    txSig: string | null;
  }>;
  recentRewards: Array<{
    epoch: number;
    wallet: string;
    rewardAmount: number;
    time: string;
    status: string;
    txSig: string | null;
  }>;
};

export type ScoutHolder = {
  rank: number;
  address: string;
  balance: number;
  currentMultiplier: string;
  currentMultiplierBps: number;
  currentStreak: number;
  finalWeight: number;
  totalRewardEarned: number;
  rewardEpochs: number;
  lastAirdropAt: string | null;
};

export type ScoutHoldersPayload = {
  topHolders: ScoutHolder[];
  totalSupply: number;
  uniqueHolders: number;
};

export type ScoutWalletPayload = {
  wallet: string;
  sourceBalance: number;
  eligible: boolean;
  eligibilityMinimum: number;
  status: string;
  multiplierBps: number | null;
  eligibleSince: string | null;
  currentStreak: number;
  totalRewardReceived: number;
  totalDropSolValue: number;
  lastAirdropAt: string | null;
  receipts: Array<{
    epochId: string;
    rewardAmount: number;
    dropSolValue: number;
    txSig: string | null;
    time: string;
    status: string;
  }>;
};

export type LoadState = "loading" | "loaded" | "empty" | "stale" | "error";
