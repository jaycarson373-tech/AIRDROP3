import { createHash } from "node:crypto";

export type DrawCandidate = {
  wallet: string;
  uiBalance: number;
  holdMultiplierBps?: number;
};

function deterministicUnitInterval(seed: string) {
  const hex = createHash("sha256").update(seed).digest("hex").slice(0, 13);
  const value = Number.parseInt(hex, 16);
  return (value + 1) / (0xfffffffffffff + 2);
}

function selectionWeight(candidate: DrawCandidate) {
  const balanceWeight = Math.sqrt(Math.max(0, candidate.uiBalance));
  const holdingWeight = Math.max(10_000, candidate.holdMultiplierBps ?? 10_000) / 10_000;
  return Math.max(Number.EPSILON, balanceWeight * holdingWeight);
}

/**
 * Deterministic weighted sampling without replacement. Balance and continuous
 * holding increase selection weight; sale-disqualified wallets are removed by
 * holder-state before this function is called.
 */
export function selectWeightedRecipients<T extends DrawCandidate>(
  epochId: string,
  candidates: T[],
  winnerCount: number
) {
  const uniqueCandidates = [...new Map(candidates.map((candidate) => [candidate.wallet, candidate])).values()];
  return uniqueCandidates
    .map((candidate) => {
      const unit = deterministicUnitInterval(`${epochId}:${candidate.wallet}`);
      return { candidate, key: -Math.log(unit) / selectionWeight(candidate) };
    })
    .sort((a, b) => a.key - b.key || a.candidate.wallet.localeCompare(b.candidate.wallet))
    .slice(0, Math.max(0, winnerCount))
    .map(({ candidate }) => candidate);
}

export function equalRewardShares(wallets: string[], rewardRaw: bigint) {
  if (!wallets.length || rewardRaw <= 0n) return [];
  const divisor = BigInt(wallets.length);
  const base = rewardRaw / divisor;
  const remainder = rewardRaw % divisor;
  return wallets.map((wallet, index) => ({
    wallet,
    amount: base + (BigInt(index) < remainder ? 1n : 0n)
  }));
}
