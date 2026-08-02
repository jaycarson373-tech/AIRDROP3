export function allocateRewardBudget(totalLamports: bigint, splitBps: number[]) {
  if (totalLamports < 0n) throw new Error("Reward budget cannot be negative");
  if (
    splitBps.length < 2 ||
    splitBps.some((value) => !Number.isInteger(value) || value < 0) ||
    splitBps.reduce((sum, value) => sum + value, 0) !== 10_000
  ) {
    throw new Error("Reward split must contain at least two non-negative basis-point values totaling 10000");
  }

  let allocated = 0n;
  return splitBps.map((bps, index) => {
    const amount =
      index === splitBps.length - 1
        ? totalLamports - allocated
        : (totalLamports * BigInt(bps)) / 10_000n;
    allocated += amount;
    return amount;
  });
}
