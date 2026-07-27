import { createHash } from "crypto";

export const CASINO_GAMES = [
  "PONG",
  "CRASH",
  "ROULETTE",
  "DUEL",
  "COINFLIP",
  "DICE",
  "PLINKO",
  "MINES",
  "HI-LO",
  "SLOTS"
] as const;

export type CasinoGame = (typeof CASINO_GAMES)[number];

export type CasinoEntrant = {
  wallet: string;
};

export type CasinoWinner = {
  position: 1 | 2 | 3;
  wallet: string;
  score: string;
};

export type CasinoFeePolicy = {
  roundPayoutBps: number;
  jackpotBps: number;
  topThreeSplitBps: readonly [number, number, number];
  jackpotInterval: number;
};

export type CasinoFeeAllocation = {
  roundPoolLamports: bigint;
  jackpotContributionLamports: bigint;
  jackpotPayoutLamports: bigint;
  jackpotClosingLamports: bigint;
  winnerRoundPayoutsLamports: readonly [bigint, bigint, bigint];
  winnerTotalPayoutsLamports: readonly [bigint, bigint, bigint];
  isJackpotRound: boolean;
};

function assertBps(value: number, label: string) {
  if (!Number.isInteger(value) || value < 0 || value > 10_000) {
    throw new Error(`${label} must be an integer between 0 and 10000`);
  }
}

export function gameForRound(roundSequence: number): CasinoGame {
  if (!Number.isInteger(roundSequence) || roundSequence < 1) {
    throw new Error("roundSequence must be a positive integer");
  }
  return CASINO_GAMES[(roundSequence - 1) % CASINO_GAMES.length];
}

export function normalizeRandomnessHex(value: string) {
  const normalized = value.trim().replace(/^0x/, "").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(normalized)) {
    throw new Error("Verified randomness must be exactly 32 bytes encoded as hex");
  }
  return normalized;
}

export function snapshotHash(entrants: Array<CasinoEntrant & { rawBalance?: bigint | string }>) {
  const canonical = entrants
    .map((entrant) => `${entrant.wallet}:${entrant.rawBalance?.toString() ?? ""}`)
    .sort()
    .join("\n");
  return createHash("sha256").update(canonical).digest("hex");
}

export function selectCasinoWinners(
  roundId: string,
  game: CasinoGame,
  verifiedRandomnessHex: string,
  entrants: CasinoEntrant[]
): CasinoWinner[] {
  const randomness = Buffer.from(normalizeRandomnessHex(verifiedRandomnessHex), "hex");
  const uniqueEntrants = new Map(entrants.map((entrant) => [entrant.wallet, entrant]));
  if (uniqueEntrants.size !== entrants.length) throw new Error("Casino entrant wallets must be unique");
  if (uniqueEntrants.size < 3) throw new Error("At least three eligible wallets are required to settle a round");

  return [...uniqueEntrants.values()]
    .map((entrant) => ({
      wallet: entrant.wallet,
      score: createHash("sha256")
        .update(randomness)
        .update("\0")
        .update(roundId)
        .update("\0")
        .update(game)
        .update("\0")
        .update(entrant.wallet)
        .digest("hex")
    }))
    .sort((a, b) => a.score.localeCompare(b.score) || a.wallet.localeCompare(b.wallet))
    .slice(0, 3)
    .map((winner, index) => ({
      ...winner,
      position: (index + 1) as 1 | 2 | 3
    }));
}

export function allocateCasinoFees(
  claimedLamports: bigint,
  jackpotOpeningLamports: bigint,
  roundSequence: number,
  policy: CasinoFeePolicy
): CasinoFeeAllocation {
  if (claimedLamports < 0n || jackpotOpeningLamports < 0n) {
    throw new Error("Casino fee balances cannot be negative");
  }
  if (!Number.isInteger(roundSequence) || roundSequence < 1) {
    throw new Error("roundSequence must be a positive integer");
  }
  assertBps(policy.roundPayoutBps, "roundPayoutBps");
  assertBps(policy.jackpotBps, "jackpotBps");
  if (policy.roundPayoutBps + policy.jackpotBps !== 10_000) {
    throw new Error("Round payout and jackpot basis points must total 10000");
  }
  if (!Number.isInteger(policy.jackpotInterval) || policy.jackpotInterval < 1) {
    throw new Error("jackpotInterval must be a positive integer");
  }
  if (
    policy.topThreeSplitBps.length !== 3 ||
    policy.topThreeSplitBps.some((value) => !Number.isInteger(value) || value < 0) ||
    policy.topThreeSplitBps.reduce((sum, value) => sum + value, 0) !== 10_000
  ) {
    throw new Error("Top-three basis points must contain three integers totaling 10000");
  }

  const roundPoolLamports = (claimedLamports * BigInt(policy.roundPayoutBps)) / 10_000n;
  const jackpotContributionLamports = claimedLamports - roundPoolLamports;
  const second = (roundPoolLamports * BigInt(policy.topThreeSplitBps[1])) / 10_000n;
  const third = (roundPoolLamports * BigInt(policy.topThreeSplitBps[2])) / 10_000n;
  const first = roundPoolLamports - second - third;
  const isJackpotRound = roundSequence % policy.jackpotInterval === 0;
  const availableJackpot = jackpotOpeningLamports + jackpotContributionLamports;
  const jackpotPayoutLamports = isJackpotRound ? availableJackpot : 0n;
  const jackpotClosingLamports = isJackpotRound ? 0n : availableJackpot;

  return {
    roundPoolLamports,
    jackpotContributionLamports,
    jackpotPayoutLamports,
    jackpotClosingLamports,
    winnerRoundPayoutsLamports: [first, second, third],
    winnerTotalPayoutsLamports: [first + jackpotPayoutLamports, second, third],
    isJackpotRound
  };
}
