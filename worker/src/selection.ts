import { createHash } from "crypto";

const DAY_MS = 24 * 60 * 60 * 1000;

export function holdingMultiplierBps(eligibleSince: string | null | undefined, now = Date.now()) {
  const startedAt = Date.parse(eligibleSince ?? "");
  if (!Number.isFinite(startedAt)) return 10_000;
  const heldFor = Math.max(0, now - startedAt);
  if (heldFor >= 30 * DAY_MS) return 100_000;
  if (heldFor >= 7 * DAY_MS) return 50_000;
  if (heldFor >= 3 * DAY_MS) return 20_000;
  if (heldFor >= DAY_MS) return 15_000;
  return 10_000;
}

export function selectionWeightBps(uiBalance: number, eligibilityMin: number, holdingBps: number) {
  const balanceRatio = eligibilityMin > 0 ? Math.max(1, uiBalance / eligibilityMin) : 1;
  const cappedBalanceBoost = Math.min(3, Math.sqrt(balanceRatio));
  return Math.max(1, Math.round(holdingBps * cappedBalanceBoost));
}

function deterministicUnit(seed: string, stableId: string) {
  const digest = createHash("sha256").update(`${seed}:${stableId}`).digest();
  const value = digest.readBigUInt64BE(0) >> 11n;
  return (Number(value) + 1) / (2 ** 53 + 1);
}

export function weightedDeterministicSelect<T>(
  seed: string,
  candidates: { item: T; stableId: string; weightBps: number }[],
  count: number
) {
  return candidates
    .map((candidate) => ({
      ...candidate,
      priority: -Math.log(deterministicUnit(seed, candidate.stableId)) / Math.max(1, candidate.weightBps)
    }))
    .sort((left, right) => left.priority - right.priority || left.stableId.localeCompare(right.stableId))
    .slice(0, Math.max(0, count))
    .map((candidate) => candidate.item);
}

export function splitEvenly(total: bigint, count: number) {
  if (total <= 0n || count <= 0) return [];
  const divisor = BigInt(count);
  const base = total / divisor;
  const remainder = total % divisor;
  return Array.from({ length: count }, (_, index) => base + (BigInt(index) < remainder ? 1n : 0n));
}
