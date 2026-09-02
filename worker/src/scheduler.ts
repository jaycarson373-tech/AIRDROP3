import { runEpoch } from "./epoch.js";
import { config } from "./config.js";
import { msUntilNextEpoch } from "./time.js";

async function loop() {
  await runEpoch();
  const waitMs = msUntilNextEpoch(new Date()) + 500;
  setTimeout(loop, waitMs);
}

function scheduleFirstRun() {
  const waitMs = msUntilNextEpoch(new Date()) + 500;
  console.log(`First epoch run scheduled in ${Math.round(waitMs / 1000)}s.`);
  setTimeout(() => {
    loop().catch((error) => {
      console.error("worker crashed", error);
      process.exit(1);
    });
  }, waitMs);
}

if (config.workerEnabled) {
  console.log(`BRAINROT worker started. Schedule: fixed ${config.epochMinutes}-minute UTC epochs.`);
  console.log(
    `Mode: REWARD_MODE=${config.rewardMode}. Gates: CLAIM_ENABLED=${config.claimEnabled}, BUY_ENABLED=${config.buyEnabled}, AIRDROP_ENABLED=${config.airdropEnabled}, EMERGENCY_PAUSED=${config.emergencyPaused}`
  );
  console.log(`Source token: $${config.sourceTokenSymbol}=${config.sourceTokenMint.toBase58()}`);
  console.log(`Reward token: $${config.rewardTokenSymbol}=${config.rewardTokenMint.toBase58()}`);
  console.log(`Distribution policy: ${config.drawWinnerCount} unique weighted recipients; equal $NEURAL allocations.`);
  console.log(`Eligibility rule: ${config.eligibilityMin.toLocaleString()}+ $BRAINROT; wallets above ${config.maxHolderPct}% are excluded.`);
  scheduleFirstRun();
} else {
  console.log(
    "WORKER_ENABLED=false. BRAINROT scheduler is parked; no claims, swaps, or distributions will run."
  );
  setInterval(() => undefined, 60_000);
}
