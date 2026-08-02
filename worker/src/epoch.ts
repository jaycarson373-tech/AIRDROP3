import { claimFees } from "./claim.js";
import { buyReward, buyRewardForAmount, treasurySwapAmount } from "./buy.js";
import { activateRewardForEpoch, activateRewardMint, config } from "./config.js";
import {
  airdropRewards,
  computeAllocations,
  estimatePayoutReserveLamports,
  treasuryRewardBalanceRaw
} from "./airdrop.js";
import { completeEpoch, failEpoch, getEpoch, persistSnapshot, recordBuy, recordRewardBuy, startEpoch } from "./db.js";
import { applyHolderState } from "./holder-state.js";
import { currentEpochId } from "./time.js";
import { activateScoutSignalForEpoch } from "./scout.js";
import { eligibleHoldersFromSnapshot, selectRewardRecipients, snapshotSourceHolders } from "./snapshot.js";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { openCasinoRound, settlePendingCasinoRounds } from "./casino-engine.js";
import { allocateRewardBudget } from "./reward-split.js";

let running = false;

function lamportsToSol(lamports: bigint) {
  return Number(lamports) / LAMPORTS_PER_SOL;
}

export async function runEpoch(date = new Date()) {
  if (running) {
    console.log("[SKIP] previous epoch still running");
    return;
  }

  running = true;
  const epochId = currentEpochId(date);
  activateRewardForEpoch(epochId);

  try {
    if (config.casinoModeEnabled) {
      const roundInProgress = await settlePendingCasinoRounds();
      if (!roundInProgress) await openCasinoRound(epochId);
      return;
    }

    const scoutSignal = config.rewardSplitEnabled ? null : await activateScoutSignalForEpoch(epochId);
    const existing = await getEpoch(epochId);
    if (existing?.status === "completed") {
      console.log(`[${epochId}] already completed, skipping`);
      return;
    }

    await startEpoch(epochId, scoutSignal?.id ?? null);
    const claim = await claimFees(epochId);
    const claimedLamports = BigInt(claim.amountClaimed || "0");
    if (claimedLamports <= 0n) {
      await recordBuy(epochId, "0", "0", "0", null);
      await completeEpoch(epochId, {
        eligible_count: 0,
        reward_bought: "0",
        reward_distributed: "0",
        status: "skipped"
      });
      console.log(`[${epochId}] claim delta was 0 lamports; shutting down worker before buy/airdrop.`);
      process.exit(0);
    }

    const sourceHolders = await snapshotSourceHolders();
    const balanceEligibleHolders = await eligibleHoldersFromSnapshot(sourceHolders);
    const eligibleHolders = await applyHolderState(epochId, balanceEligibleHolders, sourceHolders);
    await persistSnapshot(
      epochId,
      eligibleHolders.map((holder) => ({
        wallet: holder.wallet,
        source_balance: holder.uiBalance.toString(),
        source_balance_raw: holder.rawBalance.toString(),
        holder_pct: holder.holderPct.toString()
      }))
    );
    console.log(
      `[${epochId}] snapshot eligible holders: ${eligibleHolders.length}/${balanceEligibleHolders.length} after holder-state rules`
    );
    const selectedHolders = selectRewardRecipients(epochId, eligibleHolders);
    const holders = selectedHolders;
    console.log(`[${epochId}] selected reward recipients: ${holders.length}`);

    if (!holders.length) {
      await recordBuy(epochId, "0", "0", "0", null);
      await completeEpoch(epochId, {
        eligible_count: eligibleHolders.length,
        reward_bought: "0",
        reward_distributed: "0",
        status: "skipped"
      });
      console.log(`[${epochId}] no reward-ready holders, skipped reward distribution`);
      return;
    }

    if (config.rewardMode === "token" && config.rewardSplitEnabled) {
      const wallets = holders.map((holder) => holder.wallet);
      let payoutReserveLamports = 0n;
      for (const [index, mint] of config.rewardTokenMints.entries()) {
        activateRewardMint(mint, config.rewardTokenSymbols[index] ?? `asset ${index + 1}`);
        payoutReserveLamports += await estimatePayoutReserveLamports(wallets);
      }
      if (config.rewardTokenMints.length > 1) {
        const sharedReserveLamports =
          BigInt(Math.floor(config.minSolReserve * LAMPORTS_PER_SOL)) +
          BigInt(Math.floor(config.airdropSolReserve * LAMPORTS_PER_SOL));
        payoutReserveLamports -= sharedReserveLamports * BigInt(config.rewardTokenMints.length - 1);
      }

      const plan = await treasurySwapAmount(payoutReserveLamports);
      if (plan.amount <= 0n) {
        await completeEpoch(epochId, {
          eligible_count: eligibleHolders.length,
          reward_bought: "0",
          reward_distributed: "0",
          status: "skipped"
        });
        console.log(`[${epochId}] no SOL available for the configured multi-asset reward split`);
        return;
      }

      const rewardBudgets = allocateRewardBudget(plan.amount, config.rewardTokenSplitBps);
      let settledAssets = 0;
      let settledTransfers = 0;
      for (const [index, mint] of config.rewardTokenMints.entries()) {
        const splitBps = config.rewardTokenSplitBps[index];
        const baseAmount = rewardBudgets[index];
        activateRewardMint(mint, config.rewardTokenSymbols[index] ?? `asset ${index + 1}`);

        const buy = await buyRewardForAmount(epochId, baseAmount);
        await recordRewardBuy(
          epochId,
          splitBps,
          buy.baseSpentLamports.toString(),
          buy.rewardReceivedRaw.toString(),
          buy.rewardReceivedUi.toString(),
          buy.txSig,
          config.buyEnabled ? "settled" : "dry_run"
        );

        const rewardPoolRaw = (buy.rewardReceivedRaw * BigInt(config.airdropRewardBps)) / 10_000n;
        if (rewardPoolRaw <= config.minRewardRawToAirdrop) {
          console.log(`[${epochId}] ${config.rewardTokenSymbol} split below minimum; no payout planned`);
          continue;
        }

        const allocations = await computeAllocations(holders, rewardPoolRaw);
        if (!allocations.length) continue;
        const airdrop = await airdropRewards(epochId, allocations);
        if (airdrop.stoppedForReserve && airdrop.settledCount === 0) {
          throw new Error(`${config.rewardTokenSymbol} airdrop stopped before sending any payouts`);
        }
        if (airdrop.settledCount > 0) settledAssets += 1;
        settledTransfers += airdrop.settledCount;
        console.log(
          `[${epochId}] ${config.rewardTokenSymbol} summary: split=${splitBps}bps, bought=${buy.rewardReceivedUi}, recipients=${airdrop.settledCount}/${allocations.length}`
        );
      }

      await completeEpoch(epochId, {
        eligible_count: eligibleHolders.length,
        reward_bought: "0",
        reward_distributed: "0",
        status: settledAssets === config.rewardTokenMints.length ? "completed" : "skipped"
      });
      console.log(
        `[${epochId}] dual-reward summary: assets=${settledAssets}/${config.rewardTokenMints.length}, transfers=${settledTransfers}`
      );
      return;
    }

    const payoutReserveLamports = await estimatePayoutReserveLamports(holders.map((holder) => holder.wallet));
    let buy = {
      baseSpentLamports: 0n,
      rewardReceivedRaw: 0n,
      rewardReceivedUi: 0,
      usableLamports: 0n,
      solLongReserveLamports: 0n,
      pfpRewardLamports: 0n,
      pfpRewardTxSig: null as string | null,
      txSig: null as string | null
    };

    if (config.rewardMode === "token") {
      buy = await buyReward(epochId, payoutReserveLamports);
      await recordBuy(
        epochId,
        buy.baseSpentLamports.toString(),
        buy.rewardReceivedRaw.toString(),
        buy.rewardReceivedUi.toString(),
        buy.txSig,
        {
          pfpRewardLamports: buy.pfpRewardLamports.toString(),
          pfpRewardTxSig: buy.pfpRewardTxSig
        }
      );
    } else {
      console.log(`[${epochId}] REWARD_MODE=sol, skipping buy; creator fees remain SOL for direct airdrop`);
    }

    const availableRewardRaw = await treasuryRewardBalanceRaw(payoutReserveLamports);
    const rewardPoolRaw = (availableRewardRaw * BigInt(config.airdropRewardBps)) / 10_000n;
    if (config.rewardMode === "sol") {
      buy = {
        baseSpentLamports: 0n,
        rewardReceivedRaw: rewardPoolRaw,
        rewardReceivedUi: lamportsToSol(rewardPoolRaw),
        usableLamports: rewardPoolRaw,
        solLongReserveLamports: 0n,
        pfpRewardLamports: 0n,
        pfpRewardTxSig: null,
        txSig: null
      };
      await recordBuy(epochId, "0", rewardPoolRaw.toString(), buy.rewardReceivedUi.toString(), null);
    }
    console.log(
      `[${epochId}] reward pool: ${rewardPoolRaw.toString()} raw of ${availableRewardRaw.toString()} raw treasury balance (${config.airdropRewardBps} bps)`
    );
    if (rewardPoolRaw <= config.minRewardRawToAirdrop) {
      await completeEpoch(epochId, {
        eligible_count: eligibleHolders.length,
        reward_bought: buy.rewardReceivedUi.toString(),
        reward_distributed: "0",
        status: "skipped"
      });
      console.log(`[${epochId}] insufficient reward balance after reserve/split, skipped epoch`);
      return;
    }
    const allocations = await computeAllocations(holders, rewardPoolRaw);
    if (!allocations.length) {
      await completeEpoch(epochId, {
        eligible_count: eligibleHolders.length,
        reward_bought: buy.rewardReceivedUi.toString(),
        reward_distributed: "0",
        status: "skipped"
      });
      console.log(`[${epochId}] no reward balance or eligible holders, skipped airdrop`);
      return;
    }

    const airdrop = await airdropRewards(epochId, allocations);
    if (airdrop.stoppedForReserve && airdrop.settledCount === 0) {
      throw new Error("Airdrop stopped before sending any payouts: treasury SOL below airdrop reserve");
    }
    const distributed = airdrop.settledUi;
    await completeEpoch(epochId, {
      eligible_count: eligibleHolders.length,
      reward_bought: buy.rewardReceivedUi.toString(),
      reward_distributed: distributed.toString()
    });
    console.log(
      `[${epochId}] summary: eligible=${eligibleHolders.length}, recipients=${airdrop.settledCount}/${allocations.length}, bought=${buy.rewardReceivedUi}, distributed=${distributed}`
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
