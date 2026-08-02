import { runEpoch } from "./epoch.js";
import { config } from "./config.js";
import { msUntilNextEpoch } from "./time.js";

async function loop() {
  await runEpoch();
  const waitMs = config.casinoModeEnabled ? config.casinoPollMs : msUntilNextEpoch(new Date()) + 500;
  setTimeout(loop, waitMs);
}

function scheduleFirstRun() {
  const waitMs = config.casinoModeEnabled ? 250 : msUntilNextEpoch(new Date()) + 500;
  console.log(`First epoch run scheduled in ${Math.round(waitMs / 1000)}s.`);
  setTimeout(() => {
    loop().catch((error) => {
      console.error("worker crashed", error);
      process.exit(1);
    });
  }, waitMs);
}

if (config.workerEnabled) {
  console.log(`GOAT worker started. Schedule: every ${config.epochMinutes} minutes.`);
  console.log(
    `Mode: REWARD_MODE=${config.rewardMode}. Gates: CLAIM_ENABLED=${config.claimEnabled}, BUY_ENABLED=${config.buyEnabled}, AIRDROP_ENABLED=${config.airdropEnabled}`
  );
  console.log(`Source token mint: ${config.sourceTokenMint.toBase58()}`);
  console.log(
    `Reward split: ${config.rewardTokenMints
      .map((mint, index) => `${config.rewardTokenSymbols[index] ?? `asset ${index + 1}`}=${mint.toBase58()} (${config.rewardTokenSplitBps[index] ?? 0} bps)`)
      .join(" + ")}`
  );
  console.log(`Eligibility rule: ${config.eligibilityMin.toLocaleString()}+ GOAT; wallets above ${config.maxHolderPct}% are excluded.`);
  scheduleFirstRun();
} else {
  console.log(
    "WORKER_ENABLED=false. GOAT scheduler is parked; no claims, swaps, or distributions will run."
  );
  setInterval(() => undefined, 60_000);
}
