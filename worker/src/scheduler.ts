import { runEpoch } from "./epoch.js";
import { config } from "./config.js";
import { msUntilNextEpoch } from "./time.js";
import { recordWorkerHeartbeat } from "./db.js";
import { currentEpochId } from "./time.js";

console.log(`Pump Money worker started. Schedule: every ${config.epochMinutes} minutes.`);
console.log(
  `Mode: REWARD_MODE=${config.rewardMode}. Gates: CLAIM_ENABLED=${config.claimEnabled}, BUY_ENABLED=${config.buyEnabled}, AIRDROP_ENABLED=${config.airdropEnabled}`
);
console.log(`Source token mint: ${config.sourceTokenMint.toBase58()}`);
console.log(`Eligibility minimum: ${config.eligibilityMin.toLocaleString()} source tokens`);
console.log(`Eligibility rule: ${config.eligibilityMin.toLocaleString()}+ source tokens; wallets above ${config.maxHolderPct}% are excluded.`);
console.log(`Reward buyback allocation: ${config.rewardBuyBps} bps of usable creator fees buys the configured PUMP reward mint.`);
console.log(`Winners per round: ${config.winnersPerEpoch}. Payouts split equally after selection.`);

async function loop() {
  const epochId = currentEpochId();
  await recordWorkerHeartbeat("running", epochId);
  await runEpoch();
  await recordWorkerHeartbeat("online", epochId);
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
  recordWorkerHeartbeat("online").catch((error) => console.error("heartbeat failed", error));
  scheduleFirstRun();
} else {
  console.log("WORKER_ENABLED=false. Pump Money worker is safely paused.");
  const reportPaused = () => recordWorkerHeartbeat("paused").catch((error) => console.error("heartbeat failed", error));
  reportPaused();
  setInterval(reportPaused, 60_000);
}
