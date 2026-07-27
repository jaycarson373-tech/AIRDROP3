export type CatScannerCall = {
  id: string;
  symbol: string;
  name: string;
  mint: string | null;
  calledAt: string;
  calledMarketCapUsd: number;
  currentMarketCapUsd: number;
  currentValueSource: "live" | "reported";
  epochCount: number;
  totalAirdropped: number;
  logoUrl: string | null;
  chartUrl: string | null;
  rewardStatus: "next" | "distributed";
};

export const cateCall: CatScannerCall = {
  id: "cate-2026-07-26",
  symbol: "CATE",
  name: "CATE",
  mint: null,
  calledAt: "2026-07-26T10:08:00-04:00",
  calledMarketCapUsd: 276_000,
  currentMarketCapUsd: 5_000_000,
  currentValueSource: "reported",
  epochCount: 0,
  totalAirdropped: 0,
  logoUrl: null,
  chartUrl: null,
  rewardStatus: "next"
};
