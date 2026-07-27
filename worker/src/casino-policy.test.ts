import assert from "node:assert/strict";
import test from "node:test";
import {
  allocateCasinoFees,
  casinoResultsHash,
  gameForRound,
  scheduleCasinoPlayback,
  selectCasinoWinners,
  simulateCasinoRound,
  snapshotHash,
  type CasinoFeePolicy
} from "./casino-policy.js";

const policy: CasinoFeePolicy = {
  roundPayoutBps: 8_000,
  jackpotBps: 2_000,
  topThreeSplitBps: [5_000, 3_000, 2_000],
  jackpotInterval: 25
};

test("rotates through all ten games", () => {
  assert.equal(gameForRound(1), "PONG");
  assert.equal(gameForRound(10), "SLOTS");
  assert.equal(gameForRound(11), "PONG");
});

test("splits each round 80/20 and top three 50/30/20 without losing lamports", () => {
  const allocation = allocateCasinoFees(1_000_003n, 0n, 1, policy);
  assert.equal(allocation.roundPoolLamports, 800_002n);
  assert.equal(allocation.jackpotContributionLamports, 200_001n);
  assert.deepEqual(allocation.winnerRoundPayoutsLamports, [400_002n, 240_000n, 160_000n]);
  assert.equal(
    allocation.winnerRoundPayoutsLamports.reduce((sum, amount) => sum + amount, 0n),
    allocation.roundPoolLamports
  );
  assert.equal(allocation.roundPoolLamports + allocation.jackpotContributionLamports, 1_000_003n);
});

test("carries jackpot and pays the full balance to first place every 25th round", () => {
  const allocation = allocateCasinoFees(1_000_000n, 4_800_000n, 25, policy);
  assert.equal(allocation.isJackpotRound, true);
  assert.equal(allocation.jackpotPayoutLamports, 5_000_000n);
  assert.equal(allocation.jackpotClosingLamports, 0n);
  assert.deepEqual(allocation.winnerTotalPayoutsLamports, [5_400_000n, 240_000n, 160_000n]);
});

test("winner selection is deterministic, unique, and bound to the round", () => {
  const entrants = ["11111111111111111111111111111111", "wallet-b", "wallet-c", "wallet-d"].map((wallet) => ({
    wallet
  }));
  const randomness = "ab".repeat(32);
  const first = selectCasinoWinners("CS-00000001", "PONG", randomness, entrants);
  const replay = selectCasinoWinners("CS-00000001", "PONG", randomness, entrants);
  const nextRound = selectCasinoWinners("CS-00000002", "CRASH", randomness, entrants);

  assert.deepEqual(first, replay);
  assert.equal(new Set(first.map((winner) => winner.wallet)).size, 3);
  assert.notDeepEqual(first, nextRound);
});

test("every game deterministically simulates every eligible wallet", () => {
  const entrants = Array.from({ length: 12 }, (_, index) => ({ wallet: `wallet-${index}` }));
  const randomness = "4d".repeat(32);
  for (let sequence = 1; sequence <= 10; sequence += 1) {
    const game = gameForRound(sequence);
    const results = simulateCasinoRound(`CS-${sequence}`, game, randomness, entrants);
    const replay = simulateCasinoRound(`CS-${sequence}`, game, randomness, entrants);
    assert.deepEqual(results, replay);
    assert.equal(results.length, entrants.length);
    assert.deepEqual(
      results.map((result) => result.playIndex),
      Array.from({ length: entrants.length }, (_, index) => index + 1)
    );
    assert.equal(new Set(results.map((result) => result.wallet)).size, entrants.length);
    assert.ok(results.every((result) => /^\d+$/.test(result.score) && result.summary.length > 0));
    assert.equal(casinoResultsHash(results), casinoResultsHash(replay));
  }
});

test("crash uses one verified crash point and wallet-specific auto cashouts", () => {
  const entrants = Array.from({ length: 20 }, (_, index) => ({ wallet: `crash-wallet-${index}` }));
  const results = simulateCasinoRound("CS-CRASH", "CRASH", "7f".repeat(32), entrants);
  const crashPoints = new Set(results.map((result) => result.outcome.crashMultiplier));
  const cashouts = new Set(results.map((result) => result.outcome.cashoutTarget));
  assert.equal(crashPoints.size, 1);
  assert.ok(cashouts.size > 1);
  assert.ok(
    results.every(
      (result) =>
        typeof result.outcome.cashedOut === "boolean" &&
        Number(result.outcome.crashMultiplier) >= 1 &&
        Number(result.outcome.cashoutTarget) >= 1.01
    )
  );
});

test("playback schedules every entrant inside the round window", () => {
  const results = simulateCasinoRound(
    "CS-SCHEDULE",
    "HI-LO",
    "12".repeat(32),
    Array.from({ length: 150 }, (_, index) => ({ wallet: `wallet-${index}` }))
  );
  const start = new Date("2026-01-01T00:00:00.000Z");
  const end = new Date("2026-01-01T00:15:00.000Z");
  const scheduled = scheduleCasinoPlayback(results, start, end);
  assert.equal(scheduled.length, 150);
  assert.ok(Date.parse(scheduled[0].scheduledAt) > start.getTime());
  assert.equal(scheduled.at(-1)?.scheduledAt, end.toISOString());
  assert.ok(scheduled.every((result, index) => index === 0 || result.scheduledAt >= scheduled[index - 1].scheduledAt));
});

test("snapshot commitment is order-independent", () => {
  const one = snapshotHash([
    { wallet: "a", rawBalance: 10n },
    { wallet: "b", rawBalance: 20n }
  ]);
  const two = snapshotHash([
    { wallet: "b", rawBalance: 20n },
    { wallet: "a", rawBalance: 10n }
  ]);
  assert.equal(one, two);
});
