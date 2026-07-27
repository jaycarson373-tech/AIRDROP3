import bs58 from "bs58";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemInstruction,
  SystemProgram,
  Transaction
} from "@solana/web3.js";
import { airdropRewards, type Allocation } from "./airdrop.js";
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
import { claimFees } from "./claim.js";
import { config } from "./config.js";
import {
  casinoJackpotOpening,
  casinoSnapshot,
  completeEpoch,
  createCasinoRound,
  failCasinoRound,
  failEpoch,
  getCasinoRoundForEpoch,
  getEpoch,
  markCasinoRoundReady,
  markCasinoRoundBroadcast,
  pendingCasinoRounds,
  planPayout,
  persistCasinoGameResults,
  persistSnapshot,
  recordCasinoWinner,
  setCasinoRoundClaim,
  setCasinoRoundGame,
  settleCasinoRound,
  settlePayout,
  skipCasinoRound,
  startEpoch,
  type CasinoRoundRow
} from "./db.js";
import { applyHolderState } from "./holder-state.js";
import { connection } from "./solana.js";
import { treasuryKeypair } from "./config.js";
import { eligibleHoldersFromSnapshot, snapshotSourceHolders, type Holder } from "./snapshot.js";

function lamportsToSol(lamports: bigint) {
  return Number(lamports) / LAMPORTS_PER_SOL;
}

function roundSequence(row: CasinoRoundRow) {
  const value = Number(row.round_sequence);
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`Invalid casino round sequence ${row.round_sequence}`);
  }
  return value;
}

function casinoPolicy(): CasinoFeePolicy {
  return {
    roundPayoutBps: config.casinoRoundPayoutBps,
    jackpotBps: config.casinoJackpotBps,
    topThreeSplitBps: config.casinoTopThreeSplitBps as [number, number, number],
    jackpotInterval: config.casinoJackpotInterval
  };
}

function validateSwitchboardProof(round: CasinoRoundRow) {
  if (
    round.randomness_provider !== "switchboard" ||
    !round.randomness_account ||
    round.randomness_commit_slot === null ||
    !round.randomness_hex ||
    !round.randomness_commit_tx_sig ||
    !round.randomness_reveal_tx_sig ||
    !round.randomness_verified_at
  ) {
    return false;
  }
  return true;
}

function allocationForWinner(
  holder: { wallet: string },
  totalPayoutLamports: bigint,
  roundPayoutLamports: bigint
): Allocation {
  return {
    wallet: holder.wallet,
    amount: totalPayoutLamports,
    uiAmount: lamportsToSol(totalPayoutLamports),
    normalAmount: roundPayoutLamports,
    normalUiAmount: lamportsToSol(roundPayoutLamports)
  };
}

const CASINO_TRANSFER_FEE_CUSHION_LAMPORTS = 25_000n;

function validateStoredSettlementTransaction(
  transaction: Transaction,
  allocations: Allocation[],
  treasury: PublicKey
) {
  if (!transaction.feePayer?.equals(treasury)) throw new Error("Stored casino transaction has the wrong fee payer");
  if (transaction.instructions.length !== allocations.length) {
    throw new Error("Stored casino transaction transfer count does not match the committed winners");
  }
  transaction.instructions.forEach((instruction, index) => {
    if (!instruction.programId.equals(SystemProgram.programId)) {
      throw new Error("Stored casino transaction contains a non-system instruction");
    }
    const decoded = SystemInstruction.decodeTransfer(instruction);
    const allocation = allocations[index];
    if (
      !decoded.fromPubkey.equals(treasury) ||
      !decoded.toPubkey.equals(new PublicKey(allocation.wallet)) ||
      BigInt(decoded.lamports) !== allocation.amount
    ) {
      throw new Error(`Stored casino transfer ${index + 1} does not match the committed payout`);
    }
  });
}

async function confirmCasinoTransaction(
  signature: string,
  transaction: Transaction,
  lastValidBlockHeight: number
) {
  const confirmation = await connection.confirmTransaction(
    {
      signature,
      blockhash: transaction.recentBlockhash!,
      lastValidBlockHeight
    },
    "confirmed"
  );
  if (confirmation.value.err) {
    throw new Error(`Casino settlement confirmation failed: ${JSON.stringify(confirmation.value.err)}`);
  }
}

async function recoverCasinoSettlement(round: CasinoRoundRow, allocations: Allocation[]) {
  if (
    round.status !== "settling" ||
    !round.settlement_tx_sig ||
    !round.settlement_transaction_base64 ||
    round.settlement_last_valid_block_height === null
  ) {
    return null;
  }

  const treasury = treasuryKeypair();
  const transaction = Transaction.from(Buffer.from(round.settlement_transaction_base64, "base64"));
  validateStoredSettlementTransaction(transaction, allocations, treasury.publicKey);
  const status = (await connection.getSignatureStatuses([round.settlement_tx_sig], { searchTransactionHistory: true }))
    .value[0];
  if (status?.err) throw new Error(`Stored casino settlement failed on-chain: ${JSON.stringify(status.err)}`);
  if (status?.confirmationStatus === "confirmed" || status?.confirmationStatus === "finalized") {
    return round.settlement_tx_sig;
  }

  const lastValidBlockHeight = Number(round.settlement_last_valid_block_height);
  if (!Number.isSafeInteger(lastValidBlockHeight)) {
    throw new Error("Stored casino settlement has an invalid block-height expiry");
  }
  const currentBlockHeight = await connection.getBlockHeight("confirmed");
  if (currentBlockHeight > lastValidBlockHeight) return null;

  const raw = transaction.serialize();
  const replaySignature = await connection.sendRawTransaction(raw, { maxRetries: 3, skipPreflight: false });
  if (replaySignature !== round.settlement_tx_sig) {
    throw new Error("Stored casino settlement signature changed during replay");
  }
  await confirmCasinoTransaction(replaySignature, transaction, lastValidBlockHeight);
  return replaySignature;
}

async function sendCasinoSettlement(round: CasinoRoundRow, allocations: Allocation[]) {
  const recovered = await recoverCasinoSettlement(round, allocations);
  if (recovered) return recovered;

  const treasury = treasuryKeypair();
  const payoutLamports = allocations.reduce((sum, allocation) => sum + allocation.amount, 0n);
  const requiredLamports =
    BigInt(Math.floor(config.minSolReserve * LAMPORTS_PER_SOL)) +
    BigInt(Math.floor(config.airdropSolReserve * LAMPORTS_PER_SOL)) +
    CASINO_TRANSFER_FEE_CUSHION_LAMPORTS +
    payoutLamports;
  const balanceLamports = BigInt(await connection.getBalance(treasury.publicKey, "confirmed"));
  if (balanceLamports < requiredLamports) {
    throw new Error(
      `Treasury below casino settlement reserve: balance=${balanceLamports}, required=${requiredLamports}`
    );
  }

  const latestBlockhash = await connection.getLatestBlockhash("confirmed");
  const transaction = new Transaction({
    feePayer: treasury.publicKey,
    recentBlockhash: latestBlockhash.blockhash
  });
  for (const allocation of allocations) {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: treasury.publicKey,
        toPubkey: new PublicKey(allocation.wallet),
        lamports: allocation.amount
      })
    );
  }
  transaction.sign(treasury);
  const simulation = await connection.simulateTransaction(transaction);
  if (simulation.value.err) {
    throw new Error(`Casino settlement simulation failed: ${JSON.stringify(simulation.value.err)}`);
  }

  const raw = transaction.serialize();
  const signatureBytes = transaction.signature;
  if (!signatureBytes) throw new Error("Casino settlement transaction was not signed");
  const expectedSignature = bs58.encode(signatureBytes);
  for (const allocation of allocations) {
    await planPayout(
      round.epoch_id,
      allocation.wallet,
      allocation.amount.toString(),
      allocation.uiAmount.toString(),
      {
        normalRewardAmountRaw: allocation.normalAmount.toString(),
        normalRewardAmount: allocation.normalUiAmount.toString(),
        rewardMint: "So11111111111111111111111111111111111111112",
        rewardAsset: "SOL"
      }
    );
  }
  await markCasinoRoundBroadcast(round.round_id, {
    txSig: expectedSignature,
    transactionBase64: raw.toString("base64"),
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
  });

  const sentSignature = await connection.sendRawTransaction(raw, { maxRetries: 3, skipPreflight: false });
  if (sentSignature !== expectedSignature) throw new Error("Casino settlement signature did not match its intent");
  await confirmCasinoTransaction(sentSignature, transaction, latestBlockhash.lastValidBlockHeight);
  return sentSignature;
}

async function settleOneCasinoRound(round: CasinoRoundRow) {
  if (!validateSwitchboardProof(round)) return "waiting" as const;

  const snapshotRows = await casinoSnapshot(round.epoch_id);
  const committedHash = snapshotHash(
    snapshotRows.map((row) => ({ wallet: row.wallet, rawBalance: row.source_balance_raw }))
  );
  if (committedHash !== round.snapshot_hash) {
    throw new Error(`Snapshot commitment verification failed for ${round.round_id}`);
  }
  if (snapshotRows.length < 3) {
    throw new Error(`Round ${round.round_id} has fewer than three committed eligible wallets`);
  }

  const sequence = roundSequence(round);
  const game = gameForRound(sequence);
  if (round.game !== game) {
    throw new Error(`Game commitment mismatch for ${round.round_id}: stored=${round.game}, expected=${game}`);
  }

  const openingJackpot = await casinoJackpotOpening(sequence);
  const fees = allocateCasinoFees(BigInt(round.claimed_lamports), openingJackpot, sequence, casinoPolicy());
  const results = simulateCasinoRound(round.round_id, game, round.randomness_hex!, snapshotRows);
  const resultsHash = casinoResultsHash(results);
  if (round.results_hash && round.results_hash !== resultsHash) {
    throw new Error(`Committed game result verification failed for ${round.round_id}`);
  }
  const roundStartedAtMs = Date.parse(round.started_at);
  const randomnessVerifiedAtMs = Date.parse(round.randomness_verified_at!);
  if (!Number.isFinite(roundStartedAtMs) || !Number.isFinite(randomnessVerifiedAtMs)) {
    throw new Error(`Round ${round.round_id} has invalid playback timestamps`);
  }
  const hardRoundEndMs = roundStartedAtMs + config.casinoRoundMinutes * 60_000;
  const playbackStartedAtMs = Math.max(roundStartedAtMs, randomnessVerifiedAtMs);
  const playbackEndsAtMs = Math.max(playbackStartedAtMs, hardRoundEndMs);
  const playbackStartedAt = new Date(playbackStartedAtMs);
  const playbackEndsAt = new Date(playbackEndsAtMs);
  const scheduledResults = scheduleCasinoPlayback(results, playbackStartedAt, playbackEndsAt);
  await persistCasinoGameResults(round.round_id, game, scheduledResults);
  if (!round.results_hash) {
    await markCasinoRoundReady(round.round_id, {
      roundPoolLamports: fees.roundPoolLamports,
      jackpotOpeningLamports: openingJackpot,
      jackpotContributionLamports: fees.jackpotContributionLamports,
      jackpotPayoutLamports: fees.jackpotPayoutLamports,
      jackpotClosingLamports: fees.jackpotClosingLamports,
      isJackpotRound: fees.isJackpotRound,
      playbackStartedAt: playbackStartedAt.toISOString(),
      playbackEndsAt: playbackEndsAt.toISOString(),
      resultsHash
    });
  }

  if (Date.now() < playbackEndsAtMs) return "playing" as const;

  const winners = selectCasinoWinners(round.round_id, game, round.randomness_hex!, snapshotRows);
  const allocations = winners.map((winner, index) =>
    allocationForWinner(
      winner,
      fees.winnerTotalPayoutsLamports[index],
      fees.winnerRoundPayoutsLamports[index]
    )
  );
  const sendEnabled = config.casinoPayoutsEnabled && config.airdropEnabled;

  for (const [index, winner] of winners.entries()) {
    await recordCasinoWinner(round.round_id, {
      position: winner.position,
      wallet: winner.wallet,
      selectionScore: winner.score,
      roundPayoutLamports: fees.winnerRoundPayoutsLamports[index],
      jackpotPayoutLamports: index === 0 ? fees.jackpotPayoutLamports : 0n,
      totalPayoutLamports: fees.winnerTotalPayoutsLamports[index],
      status: sendEnabled ? "planned" : "dry_run"
    });
  }

  if (!sendEnabled) {
    await airdropRewards(round.epoch_id, allocations, false);
    console.log(
      `[${round.round_id}] [DRY-RUN] verified winners ready; live settlement remains gated by CASINO_PAYOUTS_ENABLED and AIRDROP_ENABLED`
    );
    return "dry_run" as const;
  }

  const settlementTxSig = await sendCasinoSettlement(round, allocations);
  for (const [index, winner] of winners.entries()) {
    await settlePayout(round.epoch_id, winner.wallet, settlementTxSig);
    await recordCasinoWinner(round.round_id, {
      position: winner.position,
      wallet: winner.wallet,
      selectionScore: winner.score,
      roundPayoutLamports: fees.winnerRoundPayoutsLamports[index],
      jackpotPayoutLamports: index === 0 ? fees.jackpotPayoutLamports : 0n,
      totalPayoutLamports: fees.winnerTotalPayoutsLamports[index],
      status: "settled",
      txSig: settlementTxSig
    });
  }

  await settleCasinoRound(round.round_id, settlementTxSig);
  await completeEpoch(round.epoch_id, {
    eligible_count: snapshotRows.length,
    reward_bought: "0",
    reward_distributed: lamportsToSol(
      allocations.reduce((sum, allocation) => sum + allocation.amount, 0n)
    ).toString()
  });
  console.log(
    `[${round.round_id}] settled ${game}: roundPool=${fees.roundPoolLamports} jackpotContribution=${fees.jackpotContributionLamports} jackpotPayout=${fees.jackpotPayoutLamports} tx=${settlementTxSig}`
  );
  return "settled" as const;
}

export async function settlePendingCasinoRounds() {
  const pending = await pendingCasinoRounds();
  for (const round of pending) {
    try {
      const result = await settleOneCasinoRound(round);
      if (result === "waiting" || result === "playing" || result === "dry_run") break;
    } catch (error) {
      await failCasinoRound(round.round_id, error).catch(() => undefined);
      await failEpoch(round.epoch_id, error).catch(() => undefined);
      throw error;
    }
  }
}

async function committedEligibleHolders(epochId: string): Promise<Holder[]> {
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
  return eligibleHolders;
}

export async function openCasinoRound(epochId: string) {
  const existingRound = await getCasinoRoundForEpoch(epochId);
  if (existingRound) return;
  const existingEpoch = await getEpoch(epochId);
  if (existingEpoch?.status === "completed" || existingEpoch?.status === "skipped") return;

  await startEpoch(epochId, null);
  const eligibleHolders = await committedEligibleHolders(epochId);
  const commitment = snapshotHash(eligibleHolders);
  let round = await createCasinoRound(epochId, commitment, eligibleHolders.length, "0");
  const sequence = roundSequence(round);
  const game = gameForRound(sequence);
  if (round.game === "PENDING") round = await setCasinoRoundGame(round.round_id, game);

  const openingJackpot = await casinoJackpotOpening(sequence);
  if (eligibleHolders.length < 3) {
    await skipCasinoRound(round.round_id, openingJackpot, 0n, "At least three eligible wallets are required");
    await completeEpoch(epochId, {
      eligible_count: eligibleHolders.length,
      reward_bought: "0",
      reward_distributed: "0",
      status: "skipped"
    });
    return;
  }

  const claim = await claimFees(epochId);
  const claimedLamports = BigInt(claim.amountClaimed || "0");
  await setCasinoRoundClaim(round.round_id, claimedLamports);
  if (claimedLamports <= 0n) {
    await skipCasinoRound(round.round_id, openingJackpot, 0n, "No creator fees were claimed for this round");
    await completeEpoch(epochId, {
      eligible_count: eligibleHolders.length,
      reward_bought: "0",
      reward_distributed: "0",
      status: "skipped"
    });
    return;
  }

  console.log(
    `[${round.round_id}] ${game} committed with ${eligibleHolders.length} eligible wallets and ${claimedLamports} claimed lamports; awaiting verified Switchboard randomness`
  );
}
