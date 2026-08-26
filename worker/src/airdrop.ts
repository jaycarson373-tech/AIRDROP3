import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import bs58 from "bs58";
import {
  ACCOUNT_SIZE,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  getMint
} from "@solana/spl-token";
import { config, treasuryKeypair } from "./config.js";
import { connection } from "./solana.js";
import { splitEvenly } from "./selection.js";
import { dryRunPayout, failPayout, getPayoutsForEpoch, markPayoutSubmitted, planPayout, settlePayout } from "./db.js";
import type { Holder } from "./snapshot.js";

const AIRDROP_TRANSFER_FEE_CUSHION_LAMPORTS = 25_000n;

export type Allocation = {
  wallet: string;
  amount: bigint;
  uiAmount: number;
  normalAmount: bigint;
  normalUiAmount: number;
};

export type AirdropResult = {
  signatures: string[];
  settledCount: number;
  settledRaw: bigint;
  settledUi: number;
  stoppedForReserve: boolean;
};

type PreparedAllocation = Allocation & {
  owner: PublicKey;
  destinationAta: PublicKey;
};

type PayoutReserve = {
  totalLamports: bigint;
  reserveLamports: bigint;
  estimatedRentLamports: bigint;
  estimatedFeeLamports: bigint;
  missingAtas: Set<string>;
};

async function tokenProgramForMint() {
  if (config.rewardMode === "sol") throw new Error("Token mint lookup is not used when REWARD_MODE=sol");
  const info = await connection.getAccountInfo(config.rewardTokenMint);
  if (!info) throw new Error(`Reward mint not found: ${config.rewardTokenMint.toBase58()}`);
  if (info.owner.equals(TOKEN_PROGRAM_ID)) return TOKEN_PROGRAM_ID;
  if (info.owner.equals(TOKEN_2022_PROGRAM_ID)) return TOKEN_2022_PROGRAM_ID;
  throw new Error(`Unsupported reward token program: ${info.owner.toBase58()}`);
}

function rawToUi(raw: bigint, decimals: number) {
  return Number(raw) / 10 ** decimals;
}

async function rewardDecimals() {
  if (config.rewardMode === "sol") return 9;
  const tokenProgram = await tokenProgramForMint();
  const mintInfo = await getMint(connection, config.rewardTokenMint, "confirmed", tokenProgram);
  return mintInfo.decimals;
}

function rewardAtaForOwner(owner: PublicKey, tokenProgram: PublicKey) {
  return getAssociatedTokenAddressSync(
    config.rewardTokenMint,
    owner,
    true,
    tokenProgram,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
}

export async function treasuryRewardBalanceRaw(reserveLamports = 0n) {
  const treasury = treasuryKeypair();
  if (config.rewardMode === "sol") {
    const balance = BigInt(await connection.getBalance(treasury.publicKey, "confirmed"));
    return balance > reserveLamports ? balance - reserveLamports : 0n;
  }

  const tokenProgram = await tokenProgramForMint();
  const ata = getAssociatedTokenAddressSync(config.rewardTokenMint, treasury.publicKey, false, tokenProgram);
  try {
    const balance = await connection.getTokenAccountBalance(ata, "confirmed");
    return BigInt(balance.value.amount);
  } catch {
    return 0n;
  }
}

export async function computeAllocations(holders: Holder[], rewardRaw: bigint): Promise<Allocation[]> {
  if (!holders.length || rewardRaw <= config.minRewardRawToAirdrop) return [];
  const decimals = await rewardDecimals();
  const shares = splitEvenly(rewardRaw, holders.length);

  return holders
    .map((holder, index) => {
      const amount = shares[index] ?? 0n;
      return {
        wallet: holder.wallet,
        amount,
        uiAmount: rawToUi(amount, decimals),
        normalAmount: amount,
        normalUiAmount: rawToUi(amount, decimals)
      };
    })
    .filter((allocation) => allocation.amount > 0n);
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function payoutReserveForAtas(atas: PublicKey[]): Promise<PayoutReserve> {
  const reserveLamports = BigInt(Math.floor(config.airdropSolReserve * LAMPORTS_PER_SOL));
  const batchCount = BigInt(Math.max(1, Math.ceil(atas.length / config.airdropBatchSize)));
  const estimatedFeeLamports = batchCount * AIRDROP_TRANSFER_FEE_CUSHION_LAMPORTS;
  const accounts = atas.length ? await connection.getMultipleAccountsInfo(atas, "confirmed") : [];
  const missingAtas = new Set<string>();

  accounts.forEach((account, index) => {
    if (!account) missingAtas.add(atas[index].toBase58());
  });

  const rentLamports = BigInt(await connection.getMinimumBalanceForRentExemption(ACCOUNT_SIZE));
  const estimatedRentLamports = BigInt(missingAtas.size) * rentLamports;

  return {
    totalLamports: reserveLamports + estimatedFeeLamports + estimatedRentLamports,
    reserveLamports,
    estimatedRentLamports,
    estimatedFeeLamports,
    missingAtas
  };
}

export async function estimatePayoutReserveLamports(wallets: string[]) {
  const permanentReserveLamports = BigInt(Math.floor(config.minSolReserve * LAMPORTS_PER_SOL));
  const airdropReserveLamports = BigInt(Math.floor(config.airdropSolReserve * LAMPORTS_PER_SOL));
  if (!wallets.length) return permanentReserveLamports + airdropReserveLamports;

  if (config.rewardMode === "sol") {
    const batchCount = BigInt(Math.max(1, Math.ceil(wallets.length / config.airdropBatchSize)));
    const estimatedFeeLamports = batchCount * AIRDROP_TRANSFER_FEE_CUSHION_LAMPORTS;
    const totalLamports = permanentReserveLamports + airdropReserveLamports + estimatedFeeLamports;
    console.log(
      `[RESERVE] SOL payout reserve for ${wallets.length} wallets: total=${totalLamports}, permanent=${permanentReserveLamports}, buffer=${airdropReserveLamports}, fees=${estimatedFeeLamports}`
    );
    return totalLamports;
  }

  const tokenProgram = await tokenProgramForMint();
  const atas = wallets.map((wallet) => rewardAtaForOwner(new PublicKey(wallet), tokenProgram));
  const reserve = await payoutReserveForAtas(atas);
  const totalLamports = permanentReserveLamports + reserve.totalLamports;
  console.log(
    `[RESERVE] token payout reserve for ${wallets.length} wallets: total=${totalLamports}, permanent=${permanentReserveLamports}, buffer=${reserve.reserveLamports}, ataRent=${reserve.estimatedRentLamports}, missingAtas=${reserve.missingAtas.size}, fees=${reserve.estimatedFeeLamports}`
  );
  return totalLamports;
}

export async function airdropRewards(epochId: string, allocations: Allocation[]): Promise<AirdropResult> {
  if (config.rewardMode === "sol") return airdropSolRewards(epochId, allocations);

  const treasury = treasuryKeypair();
  const tokenProgram = await tokenProgramForMint();
  const mintInfo = await getMint(connection, config.rewardTokenMint, "confirmed", tokenProgram);
  const sourceAta = getAssociatedTokenAddressSync(config.rewardTokenMint, treasury.publicKey, false, tokenProgram);
  let settledRaw = 0n;
  let settledUi = 0;
  let settledCount = 0;
  let stoppedForReserve = false;
  const signatures: string[] = [];

  console.log(`[${epochId}] proof before send: ${allocations.length} payouts`);
  for (const allocation of allocations) {
    const sendMode = config.airdropEnabled ? "queued live send" : "[DRY-RUN] would send";
    console.log(`[${epochId}] ${sendMode} ${allocation.amount.toString()} raw reward tokens to ${allocation.wallet}`);
  }

  if (!config.airdropEnabled) {
    for (const allocation of allocations) {
      await dryRunPayout(epochId, allocation.wallet, allocation.amount.toString(), allocation.uiAmount.toString(), {
        normalRewardAmountRaw: allocation.normalAmount.toString(),
        normalRewardAmount: allocation.normalUiAmount.toString()
      });
    }
    return {
      signatures: [],
      settledCount: 0,
      settledRaw: 0n,
      settledUi: 0,
      stoppedForReserve: false
    };
  }

  const existingPayouts = await getPayoutsForEpoch(epochId);
  const existingByWallet = new Map(existingPayouts.map((payout) => [payout.wallet, payout]));
  const pendingAllocations: Allocation[] = [];
  for (const allocation of allocations) {
    const existing = existingByWallet.get(allocation.wallet);
    if (existing?.status === "settled") {
      settledRaw += BigInt(existing.reward_amount_raw);
      settledUi += Number(existing.reward_amount);
      settledCount += 1;
      if (existing.tx_sig) signatures.push(existing.tx_sig);
      continue;
    }
    if (existing?.status === "submitted" && existing.tx_sig) {
      const signature = await connection.getSignatureStatus(existing.tx_sig, { searchTransactionHistory: true });
      if (signature.value && !signature.value.err && (signature.value.confirmationStatus === "confirmed" || signature.value.confirmationStatus === "finalized")) {
        await settlePayout(epochId, allocation.wallet, existing.tx_sig);
        settledRaw += allocation.amount;
        settledUi += allocation.uiAmount;
        settledCount += 1;
        signatures.push(existing.tx_sig);
        continue;
      }
      throw new Error(`Payout ${existing.tx_sig} has an unresolved submitted state; refusing a duplicate send`);
    }
    pendingAllocations.push(allocation);
  }

  const prepared: PreparedAllocation[] = pendingAllocations.map((allocation) => {
    const owner = new PublicKey(allocation.wallet);
    return {
      ...allocation,
      owner,
      destinationAta: rewardAtaForOwner(owner, tokenProgram)
    };
  });

  for (const allocation of prepared) {
    await planPayout(epochId, allocation.wallet, allocation.amount.toString(), allocation.uiAmount.toString(), {
      normalRewardAmountRaw: allocation.normalAmount.toString(),
      normalRewardAmount: allocation.normalUiAmount.toString()
    });
  }

  const batches = chunk(prepared, config.airdropBatchSize);
  const permanentReserveLamports = BigInt(Math.floor(config.minSolReserve * LAMPORTS_PER_SOL));
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
    const batch = batches[batchIndex];
    const reserve = await payoutReserveForAtas(batch.map((allocation) => allocation.destinationAta));
    const requiredLamports = permanentReserveLamports + reserve.totalLamports;
    const balanceLamports = BigInt(await connection.getBalance(treasury.publicKey, "confirmed"));

    if (balanceLamports < requiredLamports) {
      stoppedForReserve = true;
      const error = new Error(
        `Treasury SOL below token airdrop reserve: balance=${balanceLamports}, required=${requiredLamports}, permanent=${permanentReserveLamports}, buffer=${reserve.reserveLamports}, ataRent=${reserve.estimatedRentLamports}, missingAtas=${reserve.missingAtas.size}`
      );
      console.error(`[${epochId}] stopping airdrop batch: ${error.message}`);
      const remaining = batches.slice(batchIndex).flat();
      for (const allocation of remaining) {
        await failPayout(epochId, allocation.wallet, error);
      }
      break;
    }

    let submittedTxSig: string | null = null;
    try {
      const tx = new Transaction();
      for (const allocation of batch) {
        if (reserve.missingAtas.has(allocation.destinationAta.toBase58())) {
          tx.add(
            createAssociatedTokenAccountIdempotentInstruction(
              treasury.publicKey,
              allocation.destinationAta,
              allocation.owner,
              config.rewardTokenMint,
              tokenProgram,
              ASSOCIATED_TOKEN_PROGRAM_ID
            )
          );
        }

        tx.add(
          createTransferCheckedInstruction(
            sourceAta,
            config.rewardTokenMint,
            allocation.destinationAta,
            treasury.publicKey,
            allocation.amount,
            mintInfo.decimals,
            [],
            tokenProgram
          )
        );
      }

      tx.feePayer = treasury.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
      tx.sign(treasury);

      const simulation = await connection.simulateTransaction(tx);
      if (simulation.value.err) {
        throw new Error(`Transfer simulation failed: ${JSON.stringify(simulation.value.err)}`);
      }

      if (!tx.signature) throw new Error("Signed payout transaction did not produce a signature");
      const predictedTxSig = bs58.encode(tx.signature);
      submittedTxSig = predictedTxSig;
      for (const allocation of batch) {
        await markPayoutSubmitted(epochId, allocation.wallet, predictedTxSig);
      }
      const txSig = await connection.sendRawTransaction(tx.serialize(), { maxRetries: 3, skipPreflight: false });
      if (txSig !== predictedTxSig) throw new Error(`Broadcast signature mismatch: expected ${predictedTxSig}, received ${txSig}`);
      await connection.confirmTransaction(txSig, "confirmed");
      for (const allocation of batch) {
        await settlePayout(epochId, allocation.wallet, txSig);
        settledRaw += allocation.amount;
        settledUi += allocation.uiAmount;
        settledCount += 1;
        console.log(`[${epochId}] settled ${allocation.wallet}: ${txSig}`);
      }
      signatures.push(txSig);
    } catch (error) {
      if (submittedTxSig) {
        console.error(`[${epochId}] submitted payout ${submittedTxSig} requires confirmation recovery`, error);
        throw error;
      }
      for (const allocation of batch) {
        await failPayout(epochId, allocation.wallet, error);
        console.error(`[${epochId}] payout failed for ${allocation.wallet}:`, error);
      }
    }
  }

  return {
    signatures,
    settledCount,
    settledRaw,
    settledUi,
    stoppedForReserve
  };
}

async function airdropSolRewards(epochId: string, allocations: Allocation[]): Promise<AirdropResult> {
  const treasury = treasuryKeypair();
  let settledRaw = 0n;
  let settledUi = 0;
  let settledCount = 0;
  let stoppedForReserve = false;

  console.log(`[${epochId}] proof before SOL send: ${allocations.length} payouts`);
  for (const allocation of allocations) {
    const sendMode = config.airdropEnabled ? "queued live SOL send" : "[DRY-RUN] would send";
    console.log(`[${epochId}] ${sendMode} ${allocation.amount.toString()} lamports to ${allocation.wallet}`);
  }

  if (!config.airdropEnabled) {
    for (const allocation of allocations) {
      await dryRunPayout(epochId, allocation.wallet, allocation.amount.toString(), allocation.uiAmount.toString(), {
        normalRewardAmountRaw: allocation.normalAmount.toString(),
        normalRewardAmount: allocation.normalUiAmount.toString()
      });
    }
    return {
      signatures: [],
      settledCount: 0,
      settledRaw: 0n,
      settledUi: 0,
      stoppedForReserve: false
    };
  }

  const prepared = allocations.map((allocation) => ({
    ...allocation,
    owner: new PublicKey(allocation.wallet)
  }));

  const signatures: string[] = [];
  for (const allocation of prepared) {
    await planPayout(epochId, allocation.wallet, allocation.amount.toString(), allocation.uiAmount.toString(), {
      normalRewardAmountRaw: allocation.normalAmount.toString(),
      normalRewardAmount: allocation.normalUiAmount.toString()
    });
  }

  const batches = chunk(prepared, config.airdropBatchSize);
  const permanentReserveLamports = BigInt(Math.floor(config.minSolReserve * LAMPORTS_PER_SOL));
  const reserveLamports = BigInt(Math.floor(config.airdropSolReserve * LAMPORTS_PER_SOL));
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
    const batch = batches[batchIndex];
    const batchAmountLamports = batch.reduce((sum, allocation) => sum + allocation.amount, 0n);
    const requiredLamports = permanentReserveLamports + reserveLamports + AIRDROP_TRANSFER_FEE_CUSHION_LAMPORTS + batchAmountLamports;
    const balanceLamports = BigInt(await connection.getBalance(treasury.publicKey, "confirmed"));

    if (balanceLamports < requiredLamports) {
      stoppedForReserve = true;
      const error = new Error(
        `Treasury SOL below SOL airdrop reserve: balance=${balanceLamports}, required=${requiredLamports}, permanent=${permanentReserveLamports}, buffer=${reserveLamports}, batch=${batchAmountLamports}`
      );
      console.error(`[${epochId}] stopping SOL airdrop batch: ${error.message}`);
      const remaining = batches.slice(batchIndex).flat();
      for (const allocation of remaining) {
        await failPayout(epochId, allocation.wallet, error);
      }
      break;
    }

    try {
      const tx = new Transaction();
      for (const allocation of batch) {
        tx.add(
          SystemProgram.transfer({
            fromPubkey: treasury.publicKey,
            toPubkey: allocation.owner,
            lamports: allocation.amount
          })
        );
      }

      tx.feePayer = treasury.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
      tx.sign(treasury);

      const simulation = await connection.simulateTransaction(tx);
      if (simulation.value.err) {
        throw new Error(`SOL transfer simulation failed: ${JSON.stringify(simulation.value.err)}`);
      }

      const txSig = await connection.sendRawTransaction(tx.serialize(), { maxRetries: 3, skipPreflight: false });
      await connection.confirmTransaction(txSig, "confirmed");
      for (const allocation of batch) {
        await settlePayout(epochId, allocation.wallet, txSig);
        settledRaw += allocation.amount;
        settledUi += allocation.uiAmount;
        settledCount += 1;
        console.log(`[${epochId}] settled SOL ${allocation.wallet}: ${txSig}`);
      }
      signatures.push(txSig);
    } catch (error) {
      for (const allocation of batch) {
        await failPayout(epochId, allocation.wallet, error);
        console.error(`[${epochId}] SOL payout failed for ${allocation.wallet}:`, error);
      }
    }
  }

  return {
    signatures,
    settledCount,
    settledRaw,
    settledUi,
    stoppedForReserve
  };
}
