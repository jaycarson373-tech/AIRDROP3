const DAY_MS = 24 * 60 * 60 * 1000;
const THREE_DAY_MS = 3 * DAY_MS;
const SEVEN_DAY_MS = 7 * DAY_MS;
const THIRTY_DAY_MS = 30 * DAY_MS;

export function hasDetectedSale(previousRaw: bigint, currentRaw: bigint) {
  return previousRaw > 0n && currentRaw < previousRaw;
}

export function holderMultiplierBps(eligibleSince: string | null, nowMs: number) {
  const sinceMs = Date.parse(eligibleSince ?? "");
  if (!Number.isFinite(sinceMs)) return 10_000;

  const heldMs = Math.max(0, nowMs - sinceMs);
  if (heldMs >= THIRTY_DAY_MS) return 13_500;
  if (heldMs >= SEVEN_DAY_MS) return 12_000;
  if (heldMs >= THREE_DAY_MS) return 11_000;
  if (heldMs >= DAY_MS) return 10_500;
  return 10_000;
}
