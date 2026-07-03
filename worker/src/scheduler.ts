import { runEpoch } from "./epoch.js";
import { config } from "./config.js";
import { msUntilNextEpoch } from "./time.js";

console.log(`ANSEMFY worker started. Schedule: every ${config.epochMinutes} minutes.`);
console.log(
  `Mode: REWARD_MODE=${config.rewardMode}. Gates: CLAIM_ENABLED=${config.claimEnabled}, BUY_ENABLED=${config.buyEnabled}, AIRDROP_ENABLED=${config.airdropEnabled}`
);
console.log(`Source token mint: ${config.sourceTokenMint.toBase58()}`);
console.log(`Eligibility minimum: ${config.eligibilityMin.toLocaleString()} source tokens`);
console.log(`ANSEM accumulation: ${config.ansemBuyBps} bps of usable creator fees goes to the ANSEM airdrop path after reserves.`);
console.log(
  `PFP reward split: ${config.pfpRewardWallet ? `${config.pfpRewardBps} bps to ${config.pfpRewardWallet.toBase58()}` : "disabled; set PFP_REWARD_WALLET_PUBLIC_KEY to enable"}`
);

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

scheduleFirstRun();
