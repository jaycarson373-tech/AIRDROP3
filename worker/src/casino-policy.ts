import { createHash } from "crypto";
import { casinoTournamentRevealProgress } from "./casino-tournament.js";

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

export type CasinoGameOutcomeValue = string | number | boolean;

export type CasinoGameResult = {
  wallet: string;
  playIndex: number;
  score: string;
  tieBreak: string;
  summary: string;
  outcome: Record<string, CasinoGameOutcomeValue>;
};

export type ScheduledCasinoGameResult = CasinoGameResult & {
  scheduledAt: string;
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

function digest(
  randomness: Buffer,
  roundId: string,
  game: CasinoGame,
  wallet: string,
  label: string,
  index = 0
) {
  return createHash("sha256")
    .update(randomness)
    .update("\0")
    .update(roundId)
    .update("\0")
    .update(game)
    .update("\0")
    .update(wallet)
    .update("\0")
    .update(label)
    .update("\0")
    .update(String(index))
    .digest();
}

function draw(
  randomness: Buffer,
  roundId: string,
  game: CasinoGame,
  wallet: string,
  label: string,
  index: number,
  maxExclusive: number
) {
  if (!Number.isSafeInteger(maxExclusive) || maxExclusive < 1) {
    throw new Error("Casino draw range must be a positive safe integer");
  }
  return digest(randomness, roundId, game, wallet, label, index).readUInt32BE(0) % maxExclusive;
}

function scoreResult(
  wallet: string,
  score: bigint,
  summary: string,
  outcome: Record<string, CasinoGameOutcomeValue>,
  tieBreak: string
) {
  return { wallet, score: score.toString(), summary, outcome, tieBreak };
}

function simulatePong(randomness: Buffer, roundId: string, wallet: string) {
  let points = 0;
  let longestRally = 0;
  let rally = 0;
  for (let shot = 0; shot < 18; shot += 1) {
    const reaction = draw(randomness, roundId, "PONG", wallet, "reaction", shot, 100);
    if (reaction >= 24) {
      rally += 1;
      longestRally = Math.max(longestRally, rally);
      if (reaction >= 86) points += 2;
    } else {
      points += shot % 2 === 0 ? 0 : 1;
      rally = 0;
    }
  }
  const score = BigInt(points * 1_000_000 + longestRally * 10_000 + rally);
  return { score, summary: `${points} PTS / ${longestRally} RALLY`, outcome: { points, longestRally } };
}

function crashPointBps(randomness: Buffer, roundId: string) {
  const raw = draw(randomness, roundId, "CRASH", "ROUND", "crash-point", 0, 1_000_000);
  const unit = raw / 1_000_000;
  return Math.min(1_000_000, Math.max(10_000, Math.floor(9_900 / Math.max(0.01, 1 - unit))));
}

function simulateCrash(randomness: Buffer, roundId: string, wallet: string) {
  const crashBps = crashPointBps(randomness, roundId);
  const cashoutBps = 10_100 + draw(randomness, roundId, "CRASH", wallet, "auto-cashout", 0, 239_901);
  const cashedOut = cashoutBps <= crashBps;
  const distance = Math.abs(crashBps - cashoutBps);
  const score = cashedOut
    ? 1_000_000_000_000n + BigInt(cashoutBps) * 1_000n + BigInt(Math.max(0, 999 - distance))
    : BigInt(Math.max(0, 100_000_000 - distance));
  const crashMultiplier = crashBps / 10_000;
  const cashoutTarget = cashoutBps / 10_000;
  return {
    score,
    summary: cashedOut
      ? `CASHED ${cashoutTarget.toFixed(2)}×`
      : `BUST ${crashMultiplier.toFixed(2)}× / TARGET ${cashoutTarget.toFixed(2)}×`,
    outcome: { crashMultiplier, cashoutTarget, cashedOut }
  };
}

function rouletteColor(value: number) {
  if (value === 0) return "GREEN";
  return value % 2 === 0 ? "BLACK" : "WHITE";
}

function simulateRoulette(randomness: Buffer, roundId: string, wallet: string) {
  const wheel = draw(randomness, roundId, "ROULETTE", "ROUND", "wheel", 0, 37);
  const pick = draw(randomness, roundId, "ROULETTE", wallet, "pick", 0, 37);
  const directDistance = Math.abs(wheel - pick);
  const distance = Math.min(directDistance, 37 - directDistance);
  const exact = pick === wheel;
  const colorMatch = rouletteColor(pick) === rouletteColor(wheel);
  const score =
    (exact ? 1_000_000_000n : colorMatch ? 500_000_000n : 0n) + BigInt(37 - distance) * 1_000_000n;
  return {
    score,
    summary: exact ? `STRAIGHT ${pick}` : `${pick} → ${wheel} / ${colorMatch ? "COLOR" : "MISS"}`,
    outcome: { wheel, pick, exact, colorMatch }
  };
}

function simulateDuel(randomness: Buffer, roundId: string, wallet: string) {
  let wins = 0;
  let margin = 0;
  for (let exchange = 0; exchange < 7; exchange += 1) {
    const attack = draw(randomness, roundId, "DUEL", wallet, "attack", exchange, 100);
    const defense = draw(randomness, roundId, "DUEL", wallet, "defense", exchange, 100);
    if (attack >= defense) wins += 1;
    margin += attack - defense;
  }
  const score = BigInt(wins * 1_000_000 + (margin + 700) * 1_000);
  return { score, summary: `${wins}-WIN DUEL / ${margin >= 0 ? "+" : ""}${margin}`, outcome: { wins, margin } };
}

function simulateCoinflip(randomness: Buffer, roundId: string, wallet: string) {
  let correct = 0;
  let streak = 0;
  let longestStreak = 0;
  for (let flip = 0; flip < 12; flip += 1) {
    const result = draw(randomness, roundId, "COINFLIP", "ROUND", "flip", flip, 2);
    const pick = draw(randomness, roundId, "COINFLIP", wallet, "pick", flip, 2);
    if (pick === result) {
      correct += 1;
      streak += 1;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 0;
    }
  }
  const score = BigInt(correct * 1_000_000 + longestStreak * 10_000);
  return {
    score,
    summary: `${correct}/12 CORRECT / ${longestStreak} STREAK`,
    outcome: { correct, flips: 12, longestStreak }
  };
}

function simulateDice(randomness: Buffer, roundId: string, wallet: string) {
  const rolls = Array.from(
    { length: 6 },
    (_, index) => draw(randomness, roundId, "DICE", wallet, "roll", index, 6) + 1
  );
  const total = rolls.reduce((sum, value) => sum + value, 0);
  const sixes = rolls.filter((value) => value === 6).length;
  const score = BigInt(total * 1_000_000 + sixes * 10_000);
  return { score, summary: `${total} TOTAL / ${sixes} SIXES`, outcome: { total, sixes, rolls: rolls.join("-") } };
}

function simulatePlinko(randomness: Buffer, roundId: string, wallet: string) {
  let rightSteps = 0;
  let path = "";
  for (let step = 0; step < 12; step += 1) {
    const right = draw(randomness, roundId, "PLINKO", wallet, "step", step, 2) === 1;
    if (right) rightSteps += 1;
    path += right ? "R" : "L";
  }
  const multipliers = [25, 10, 5, 2, 1.25, 0.75, 0.5, 0.75, 1.25, 2, 5, 10, 25];
  const multiplier = multipliers[rightSteps];
  const score = BigInt(Math.round(multiplier * 10_000)) * 1_000n + BigInt(rightSteps);
  return {
    score,
    summary: `${multiplier.toFixed(2)}× / SLOT ${rightSteps}`,
    outcome: { multiplier, slot: rightSteps, path }
  };
}

function uniquePositions(
  randomness: Buffer,
  roundId: string,
  game: CasinoGame,
  wallet: string,
  label: string,
  count: number,
  range: number
) {
  const positions: number[] = [];
  for (let index = 0; positions.length < count; index += 1) {
    const value = draw(randomness, roundId, game, wallet, label, index, range);
    if (!positions.includes(value)) positions.push(value);
  }
  return positions;
}

function simulateMines(randomness: Buffer, roundId: string, wallet: string) {
  const mines = uniquePositions(randomness, roundId, "MINES", "ROUND", "mine", 5, 25);
  const path = uniquePositions(randomness, roundId, "MINES", wallet, "path", 20, 25);
  let cleared = 0;
  let hit = -1;
  for (const tile of path) {
    if (mines.includes(tile)) {
      hit = tile;
      break;
    }
    cleared += 1;
  }
  const score = BigInt(cleared * 1_000_000 + (hit < 0 ? 500_000 : 25 - hit));
  return { score, summary: `${cleared} SAFE / ${hit < 0 ? "CLEAR" : `MINE ${hit + 1}`}`, outcome: { cleared, hit } };
}

function simulateHiLo(randomness: Buffer, roundId: string, wallet: string) {
  const cards = Array.from(
    { length: 13 },
    (_, index) => draw(randomness, roundId, "HI-LO", wallet, "card", index, 13) + 1
  );
  let correct = 0;
  let streak = 0;
  let longestStreak = 0;
  for (let index = 0; index < cards.length - 1; index += 1) {
    const current = cards[index];
    const next = cards[index + 1];
    const guessedHigher = current <= 7;
    const won = guessedHigher ? next > current : next < current;
    if (won) {
      correct += 1;
      streak += 1;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 0;
    }
  }
  const score = BigInt(correct * 1_000_000 + longestStreak * 10_000);
  return {
    score,
    summary: `${correct}/12 CORRECT / ${longestStreak} STREAK`,
    outcome: { correct, longestStreak, cards: cards.join("-") }
  };
}

function simulateSlots(randomness: Buffer, roundId: string, wallet: string) {
  const symbols = ["7", "BAR", "DIAMOND", "CHERRY", "BELL"] as const;
  let payout = 0;
  let bestPayout = 0;
  let bestLine = "";
  for (let spin = 0; spin < 5; spin += 1) {
    const line = Array.from(
      { length: 3 },
      (_, reel) => symbols[draw(randomness, roundId, "SLOTS", wallet, `spin-${spin}`, reel, symbols.length)]
    );
    let linePayout = 0;
    if (line.every((symbol) => symbol === "7")) linePayout = 100;
    else if (line[0] === line[1] && line[1] === line[2]) linePayout = 30;
    else if (new Set(line).size === 2) linePayout = 5;
    else if (line.includes("CHERRY")) linePayout = 1;
    if (linePayout > bestPayout) {
      bestPayout = linePayout;
      bestLine = line.join("-");
    }
    payout += linePayout;
  }
  const score = BigInt(payout * 1_000_000);
  return { score, summary: `${payout} PAY / ${bestLine || "NO LINE"}`, outcome: { payout, bestLine: bestLine || "NONE" } };
}

function simulateEntrant(
  randomness: Buffer,
  roundId: string,
  game: CasinoGame,
  wallet: string
) {
  switch (game) {
    case "PONG":
      return simulatePong(randomness, roundId, wallet);
    case "CRASH":
      return simulateCrash(randomness, roundId, wallet);
    case "ROULETTE":
      return simulateRoulette(randomness, roundId, wallet);
    case "DUEL":
      return simulateDuel(randomness, roundId, wallet);
    case "COINFLIP":
      return simulateCoinflip(randomness, roundId, wallet);
    case "DICE":
      return simulateDice(randomness, roundId, wallet);
    case "PLINKO":
      return simulatePlinko(randomness, roundId, wallet);
    case "MINES":
      return simulateMines(randomness, roundId, wallet);
    case "HI-LO":
      return simulateHiLo(randomness, roundId, wallet);
    case "SLOTS":
      return simulateSlots(randomness, roundId, wallet);
  }
}

export function simulateCasinoRound(
  roundId: string,
  game: CasinoGame,
  verifiedRandomnessHex: string,
  entrants: CasinoEntrant[]
): CasinoGameResult[] {
  const randomness = Buffer.from(normalizeRandomnessHex(verifiedRandomnessHex), "hex");
  const uniqueEntrants = new Map(entrants.map((entrant) => [entrant.wallet, entrant]));
  if (uniqueEntrants.size !== entrants.length) throw new Error("Casino entrant wallets must be unique");
  if (uniqueEntrants.size < 3) throw new Error("At least three eligible wallets are required to simulate a round");

  return [...uniqueEntrants.values()]
    .map((entrant) => {
      const tieBreak = digest(randomness, roundId, game, entrant.wallet, "rank-tie").toString("hex");
      const playOrder = digest(randomness, roundId, game, entrant.wallet, "play-order").toString("hex");
      const simulated = simulateEntrant(randomness, roundId, game, entrant.wallet);
      return {
        ...scoreResult(entrant.wallet, simulated.score, simulated.summary, simulated.outcome, tieBreak),
        playOrder
      };
    })
    .sort((a, b) => a.playOrder.localeCompare(b.playOrder) || a.wallet.localeCompare(b.wallet))
    .map(({ playOrder: _playOrder, ...result }, index) => ({ ...result, playIndex: index + 1 }));
}

function compareResults(a: CasinoGameResult, b: CasinoGameResult) {
  const aScore = BigInt(a.score);
  const bScore = BigInt(b.score);
  if (aScore !== bScore) return aScore > bScore ? -1 : 1;
  return a.tieBreak.localeCompare(b.tieBreak) || a.wallet.localeCompare(b.wallet);
}

export function selectCasinoWinners(
  roundId: string,
  game: CasinoGame,
  verifiedRandomnessHex: string,
  entrants: CasinoEntrant[]
): CasinoWinner[] {
  return simulateCasinoRound(roundId, game, verifiedRandomnessHex, entrants)
    .sort(compareResults)
    .slice(0, 3)
    .map((winner, index) => ({
      wallet: winner.wallet,
      score: winner.score,
      position: (index + 1) as 1 | 2 | 3
    }));
}

export function scheduleCasinoPlayback(
  results: CasinoGameResult[],
  playbackStartedAt: Date,
  playbackEndsAt: Date
): ScheduledCasinoGameResult[] {
  const startedAt = playbackStartedAt.getTime();
  const endsAt = playbackEndsAt.getTime();
  if (!Number.isFinite(startedAt) || !Number.isFinite(endsAt) || endsAt < startedAt) {
    throw new Error("Casino playback window is invalid");
  }
  if (!results.length) return [];
  const duration = endsAt - startedAt;
  const eliminationOrder = [...results].sort(compareResults).reverse();
  return eliminationOrder.map((result, index) => {
    const playIndex = index + 1;
    const progress = casinoTournamentRevealProgress(eliminationOrder.length, playIndex);
    return {
      ...result,
      playIndex,
      scheduledAt: new Date(startedAt + Math.floor(duration * progress)).toISOString()
    };
  });
}

export function casinoResultsHash(results: CasinoGameResult[]) {
  const canonical = [...results]
    .sort((a, b) => a.playIndex - b.playIndex)
    .map((result) =>
      [
        result.playIndex,
        result.wallet,
        result.score,
        result.tieBreak,
        result.summary,
        JSON.stringify(result.outcome)
      ].join(":")
    )
    .join("\n");
  return createHash("sha256").update(canonical).digest("hex");
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
