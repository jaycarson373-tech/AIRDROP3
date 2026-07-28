export type CasinoTournamentStage = {
  label: string;
  targetRemaining: number;
  progress: number;
};

function playerCountValue(playerCount: number) {
  if (!Number.isSafeInteger(playerCount) || playerCount < 0) {
    throw new Error("Casino tournament player count must be a non-negative safe integer");
  }
  return playerCount;
}

function appendStage(
  stages: CasinoTournamentStage[],
  previousRemaining: number,
  desiredRemaining: number,
  progress: number,
  label: string
) {
  const targetRemaining = Math.max(3, Math.min(previousRemaining - 1, desiredRemaining));
  if (targetRemaining >= previousRemaining) return previousRemaining;
  stages.push({ label, targetRemaining, progress });
  return targetRemaining;
}

export function casinoTournamentStages(playerCount: number): CasinoTournamentStage[] {
  const total = playerCountValue(playerCount);
  if (total <= 3) return [];

  const stages: CasinoTournamentStage[] = [];
  let remaining = total;

  if (total <= 20) {
    remaining = appendStage(stages, remaining, Math.ceil(total * 0.75), 0.32, "OPENING HEAT");
    remaining = appendStage(stages, remaining, Math.ceil(total * 0.5), 0.62, "ELIMINATION HEAT");
    appendStage(stages, remaining, 3, 0.88, "SEMIFINAL");
    return stages;
  }

  if (total <= 200) {
    remaining = appendStage(stages, remaining, 32, 0.32, "FIELD QUALIFIER");
    remaining = appendStage(stages, remaining, 10, 0.68, "ROUND OF 32");
    appendStage(stages, remaining, 3, 0.88, "FINAL 10");
    return stages;
  }

  remaining = appendStage(stages, remaining, 100, 0.32, "MASS QUALIFIER");
  remaining = appendStage(stages, remaining, 25, 0.58, "ROUND OF 100");
  remaining = appendStage(stages, remaining, 10, 0.78, "ROUND OF 25");
  appendStage(stages, remaining, 3, 0.88, "FINAL 10");
  return stages;
}

export function casinoTournamentState(playerCount: number, completedCount: number) {
  const total = playerCountValue(playerCount);
  const completed = Math.max(0, Math.min(total, Math.floor(completedCount)));
  const remainingCount = total - completed;

  if (!total) {
    return { stage: "WAITING FOR FIELD", remainingCount: 0, nextCutCount: 0 };
  }
  if (!remainingCount) {
    return { stage: "ROUND COMPLETE", remainingCount: 0, nextCutCount: 0 };
  }

  for (const stage of casinoTournamentStages(total)) {
    if (remainingCount > stage.targetRemaining) {
      return {
        stage: stage.label,
        remainingCount,
        nextCutCount: stage.targetRemaining
      };
    }
  }

  return {
    stage: "PODIUM REVEAL",
    remainingCount,
    nextCutCount: Math.max(0, remainingCount - 1)
  };
}

export function casinoTournamentRevealProgress(playerCount: number, revealIndex: number) {
  const total = playerCountValue(playerCount);
  if (!total) return 1;
  if (!Number.isSafeInteger(revealIndex) || revealIndex < 1 || revealIndex > total) {
    throw new Error("Casino tournament reveal index is outside the player field");
  }

  const checkpoints = [
    { revealed: 0, progress: 0 },
    ...casinoTournamentStages(total).map((stage) => ({
      revealed: total - stage.targetRemaining,
      progress: stage.progress
    })),
    { revealed: Math.max(0, total - 2), progress: 0.92 },
    { revealed: Math.max(0, total - 1), progress: 0.96 },
    { revealed: total, progress: 1 }
  ].filter(
    (checkpoint, index, values) =>
      index === 0 ||
      (checkpoint.revealed > values[index - 1].revealed && checkpoint.progress > values[index - 1].progress)
  );

  for (let index = 1; index < checkpoints.length; index += 1) {
    const previous = checkpoints[index - 1];
    const next = checkpoints[index];
    if (revealIndex > next.revealed) continue;
    const segmentSize = next.revealed - previous.revealed;
    const segmentPosition = revealIndex - previous.revealed;
    return previous.progress + (next.progress - previous.progress) * (segmentPosition / segmentSize);
  }

  return 1;
}
