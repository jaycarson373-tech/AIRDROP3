import { runEpoch } from "./epoch.js";
import { config } from "./config.js";
import { msUntilNextEpoch } from "./time.js";

console.log(`Cat in Hood worker started. Schedule: every ${config.epochMinutes} minutes.`);
console.log(
  `Mode: REWARD_MODE=${config.rewardMode}. Gates: CLAIM_ENABLED=${config.claimEnabled}, BUY_ENABLED=${config.buyEnabled}, AIRDROP_ENABLED=${config.airdropEnabled}`
);
console.log(`Source token mint: ${config.sourceTokenMint.toBase58()}`);
console.log(`Eligibility minimum: ${config.eligibilityMin.toLocaleString()} source tokens`);
console.log(`Eligibility rule: ${config.eligibilityMin.toLocaleString()}+ source tokens; wallets above ${config.maxHolderPct}% are excluded.`);
console.log(`Reward buyback allocation: ${config.ansemBuyBps} bps of usable creator fees is available for HOOD buybacks after reserves.`);
if (config.pfpRewardWallet && config.pfpRewardBps > 0) {
  console.log(
    `Bagworking split: ${config.pfpRewardBps} bps routes to ${config.pfpRewardWallet.toBase58()}; remaining buy allocation goes to holder airdrops.`
  );
} else {
  console.log("Bagworking split disabled: 100% of configured buy allocation stays on the holder airdrop path.");
}

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
