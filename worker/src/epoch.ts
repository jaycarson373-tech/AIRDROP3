import { claimFees } from "./claim.js";
import { buyReward } from "./buy.js";
import { airdropRewards, computeAllocations, treasuryRewardBalanceRaw } from "./airdrop.js";
import { completeEpoch, failEpoch, getEpoch, persistSnapshot, recordBuy, startEpoch } from "./db.js";
import { currentEpochId } from "./time.js";
import { snapshotEligibleHolders } from "./snapshot.js";

let running = false;

export async function runEpoch(date = new Date()) {
  if (running) {
    console.log("[SKIP] previous epoch still running");
    return;
  }

  running = true;
  const epochId = currentEpochId(date);

  try {
    const existing = await getEpoch(epochId);
    if (existing?.status === "completed") {
      console.log(`[${epochId}] already completed, skipping`);
      return;
    }

    await startEpoch(epochId);
    await claimFees(epochId);

    const buy = await buyReward(epochId);
    await recordBuy(
      epochId,
      buy.baseSpentLamports.toString(),
      buy.rewardReceivedRaw.toString(),
      buy.rewardReceivedUi.toString(),
      buy.txSig
    );

    const holders = await snapshotEligibleHolders();
    await persistSnapshot(
      epochId,
      holders.map((holder) => ({
        wallet: holder.wallet,
        source_balance: holder.uiBalance.toString(),
        source_balance_raw: holder.rawBalance.toString(),
        holder_pct: holder.holderPct.toString()
      }))
    );
    console.log(`[${epochId}] snapshot eligible holders: ${holders.length}`);

    const rewardBalance = await treasuryRewardBalanceRaw();
    const allocations = await computeAllocations(holders, rewardBalance);
    if (!allocations.length) {
      await completeEpoch(epochId, {
        eligible_count: holders.length,
        reward_bought: buy.rewardReceivedUi.toString(),
        reward_distributed: "0",
        status: "skipped"
      });
      console.log(`[${epochId}] no reward balance or eligible holders, skipped airdrop`);
      return;
    }

    await airdropRewards(epochId, allocations);
    const distributed = allocations.reduce((sum, allocation) => sum + allocation.uiAmount, 0);
    await completeEpoch(epochId, {
      eligible_count: allocations.length,
      reward_bought: buy.rewardReceivedUi.toString(),
      reward_distributed: distributed.toString()
    });
    console.log(
      `[${epochId}] summary: eligible=${holders.length}, recipients=${allocations.length}, bought=${buy.rewardReceivedUi}, distributed=${distributed}`
    );
  } catch (error) {
    await failEpoch(epochId, error).catch((dbError) => {
      console.error(`[${epochId}] failed to mark epoch failed`, dbError);
    });
    console.error(`[${epochId}] epoch failed`, error);
  } finally {
    running = false;
  }
}
