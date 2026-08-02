export type ScoutStats = {
  currentEpoch: number;
  totalEpochs: number;
  lastRewardAirdropped: number;
  totalRewardAirdropped: number;
  latestEligibleHolders: number;
  averageMultiplier: number | null;
  nextDropTime: string | null;
  totalSolValueAirdropped: number;
  totalHoldersRewarded: number;
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
    rewardAsset: string | null;
    rewardAmount: number;
    time: string;
    status: string;
    txSig: string | null;
  }>;
  rewardBreakdown: Array<{
    asset: string;
    total: number;
    transfers: number;
    baseSpentSol: number;
  }>;
  leaderboard: LeaderboardEntry[];
};

export type LeaderboardEntry = {
  rank: number;
  wallet: string;
  goatBalance: number;
  qualifiedEpochs: number;
  holdingStreak: number;
  totalRewards: Record<string, number>;
  rewardReceipts: number;
  convictionScore: number;
};

export type LoadState = "loading" | "loaded" | "empty" | "stale" | "error";
