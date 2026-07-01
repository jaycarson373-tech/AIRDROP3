import { createHash } from "crypto";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
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
import { dryRunPayout, failPayout, planPayout, recordGoldenPayoutTx, settlePayout } from "./db.js";
import type { Holder } from "./snapshot.js";

export const GOLDEN_MULTIPLIER = 5;
const AIRDROP_TRANSFER_FEE_CUSHION_LAMPORTS = 25_000n;
const ROBIN_HOOD_BASE_BPS = 10_000;
const ROBIN_HOOD_MAX_TILT_BPS = 2_500;
const LOW_SOL_SIGNAL_CAP_LAMPORTS = 10n * BigInt(LAMPORTS_PER_SOL);

export type Allocation = {
  wallet: string;
  amount: bigint;
  uiAmount: number;
  normalAmount: bigint;
  normalUiAmount: number;
  goldenBonusAmount: bigint;
  goldenBonusUiAmount: number;
  goldenMultiplier: number;
  isGolden: boolean;
  goldenCapped: boolean;
};

export type GoldenSummary = {
  wallet: string | null;
  baseRewardRaw: bigint;
  baseRewardUi: number;
  bonusRewardRaw: bigint;
  bonusRewardUi: number;
  multiplier: number;
  capped: boolean;
  snapshotHash: string | null;
};

export type GoldenRewardPool = {
  rewardPoolRaw: bigint;
  snapshotHash: string | null;
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

type WeightedHolder = {
  holder: Holder;
  weight: bigint;
  robinHoodBps: number;
  solLamports: bigint;
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

function minBigInt(a: bigint, b: bigint) {
  return a < b ? a : b;
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

function clampBps(value: number) {
  return Math.max(0, Math.min(10_000, Math.round(value)));
}

function smallHolderSignalBps(holder: Holder) {
  const maxPct = Math.max(config.maxHolderPct, 0.0001);
  const signal = ((maxPct - holder.holderPct) / maxPct) * 10_000;
  return clampBps(signal);
}

function lowSolSignalBps(solLamports: bigint) {
  if (solLamports >= LOW_SOL_SIGNAL_CAP_LAMPORTS) return 0;
  return Number(((LOW_SOL_SIGNAL_CAP_LAMPORTS - solLamports) * 10_000n) / LOW_SOL_SIGNAL_CAP_LAMPORTS);
}

async function holderSolBalances(holders: Holder[]) {
  const balances = new Map<string, bigint>();
  for (const batch of chunk(holders, 100)) {
    const owners = batch.map((holder) => new PublicKey(holder.wallet));
    const accounts = await connection.getMultipleAccountsInfo(owners, "confirmed");
    accounts.forEach((account, index) => {
      balances.set(batch[index].wallet, BigInt(account?.lamports ?? 0));
    });
  }
  return balances;
}

async function computeRobinWeights(holders: Holder[]): Promise<WeightedHolder[]> {
  const solBalances = await holderSolBalances(holders);

  return holders.map((holder) => {
    const solLamports = solBalances.get(holder.wallet) ?? 0n;
    const robinSignalBps = Math.round((smallHolderSignalBps(holder) + lowSolSignalBps(solLamports)) / 2);
    const robinHoodBps = ROBIN_HOOD_BASE_BPS + Math.round((robinSignalBps * ROBIN_HOOD_MAX_TILT_BPS) / 10_000);

    return {
      holder,
      weight: holder.rawBalance * BigInt(robinHoodBps),
      robinHoodBps,
      solLamports
    };
  });
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
  const weightedHolders = await computeRobinWeights(holders);
  const totalWeight = weightedHolders.reduce((sum, holder) => sum + holder.weight, 0n);
  if (totalWeight <= 0n) return [];

  return weightedHolders
    .map(({ holder, weight }) => {
      const amount = (rewardRaw * weight) / totalWeight;
      return {
        wallet: holder.wallet,
        amount,
        uiAmount: rawToUi(amount, decimals),
        normalAmount: amount,
        normalUiAmount: rawToUi(amount, decimals),
        goldenBonusAmount: 0n,
        goldenBonusUiAmount: 0,
        goldenMultiplier: 1,
        isGolden: false,
        goldenCapped: false
      };
    })
    .filter((allocation) => allocation.amount > 0n);
}

function snapshotHash(holders: WeightedHolder[]) {
  const canonical = holders
    .map(({ holder, robinHoodBps, solLamports }) => `${holder.wallet}:${holder.rawBalance.toString()}:${robinHoodBps}:${solLamports.toString()}`)
    .join("|");
  return createHash("sha256").update(canonical).digest("hex");
}

function deterministicIndex(epochId: string, hash: string, count: number) {
  const seed = createHash("sha256").update(`${epochId}:${hash}`).digest();
  return Number(seed.readBigUInt64BE(0) % BigInt(count));
}

export async function computeGoldenRewardPool(epochId: string, holders: Holder[], availableRewardRaw: bigint): Promise<GoldenRewardPool> {
  const weightedHolders = holders.length ? await computeRobinWeights(holders) : [];
  if (!holders.length || availableRewardRaw <= 0n) {
    return { rewardPoolRaw: availableRewardRaw, snapshotHash: weightedHolders.length ? snapshotHash(weightedHolders) : null };
  }

  const hash = snapshotHash(weightedHolders);
  const winnerIndex = deterministicIndex(epochId, hash, weightedHolders.length);
  const winner = weightedHolders[winnerIndex];
  const totalWeight = weightedHolders.reduce((sum, holder) => sum + holder.weight, 0n);
  if (totalWeight <= 0n) return { rewardPoolRaw: 0n, snapshotHash: hash };

  const denominator = totalWeight + winner.weight * BigInt(GOLDEN_MULTIPLIER - 1);
  const rewardPoolRaw = (availableRewardRaw * totalWeight) / denominator;
  return { rewardPoolRaw, snapshotHash: hash };
}

export async function applyGoldenAirdrop(
  epochId: string,
  holders: Holder[],
  allocations: Allocation[],
  availableRewardRaw: bigint,
  precomputedSnapshotHash?: string | null
): Promise<GoldenSummary> {
  const decimals = await rewardDecimals();
  const hash = precomputedSnapshotHash ?? snapshotHash(await computeRobinWeights(holders));

  if (!allocations.length) {
    return {
      wallet: null,
      baseRewardRaw: 0n,
      baseRewardUi: 0,
      bonusRewardRaw: 0n,
      bonusRewardUi: 0,
      multiplier: GOLDEN_MULTIPLIER,
      capped: false,
      snapshotHash: hash
    };
  }

  const winnerIndex = deterministicIndex(epochId, hash, allocations.length);
  const winner = allocations[winnerIndex];
  const normalTotalRaw = allocations.reduce((sum, allocation) => sum + allocation.amount, 0n);
  const availableBonusRaw = availableRewardRaw > normalTotalRaw ? availableRewardRaw - normalTotalRaw : 0n;
  const targetBonusRaw = winner.normalAmount * BigInt(GOLDEN_MULTIPLIER - 1);
  const bonusRaw = minBigInt(targetBonusRaw, availableBonusRaw);
  const capped = bonusRaw < targetBonusRaw;

  winner.amount += bonusRaw;
  winner.uiAmount = rawToUi(winner.amount, decimals);
  winner.goldenBonusAmount = bonusRaw;
  winner.goldenBonusUiAmount = rawToUi(bonusRaw, decimals);
  winner.goldenMultiplier = GOLDEN_MULTIPLIER;
  winner.isGolden = true;
  winner.goldenCapped = capped;

  console.log(
    `[${epochId}] hood bonus winner ${winner.wallet}: base=${winner.normalAmount.toString()} raw, bonus=${bonusRaw.toString()} raw, multiplier=${GOLDEN_MULTIPLIER}x${capped ? " capped" : ""}`
  );

  return {
    wallet: winner.wallet,
    baseRewardRaw: winner.normalAmount,
    baseRewardUi: winner.normalUiAmount,
    bonusRewardRaw: bonusRaw,
    bonusRewardUi: winner.goldenBonusUiAmount,
    multiplier: GOLDEN_MULTIPLIER,
    capped,
    snapshotHash: hash
  };
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
  if (!wallets.length) return BigInt(Math.floor(config.airdropSolReserve * LAMPORTS_PER_SOL));

  if (config.rewardMode === "sol") {
    const reserveLamports = BigInt(Math.floor(config.airdropSolReserve * LAMPORTS_PER_SOL));
    const batchCount = BigInt(Math.max(1, Math.ceil(wallets.length / config.airdropBatchSize)));
    const estimatedFeeLamports = batchCount * AIRDROP_TRANSFER_FEE_CUSHION_LAMPORTS;
    const totalLamports = reserveLamports + estimatedFeeLamports;
    console.log(
      `[RESERVE] SOL payout reserve for ${wallets.length} wallets: total=${totalLamports}, base=${reserveLamports}, fees=${estimatedFeeLamports}`
    );
    return totalLamports;
  }

  const tokenProgram = await tokenProgramForMint();
  const atas = wallets.map((wallet) => rewardAtaForOwner(new PublicKey(wallet), tokenProgram));
  const reserve = await payoutReserveForAtas(atas);
  console.log(
    `[RESERVE] payout reserve for ${wallets.length} wallets: total=${reserve.totalLamports}, base=${reserve.reserveLamports}, ataRent=${reserve.estimatedRentLamports}, missingAtas=${reserve.missingAtas.size}, fees=${reserve.estimatedFeeLamports}`
  );
  return reserve.totalLamports;
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

  console.log(`[${epochId}] proof before send: ${allocations.length} payouts`);
  for (const allocation of allocations) {
    const sendMode = config.airdropEnabled ? "queued live send" : "[DRY-RUN] would send";
    console.log(`[${epochId}] ${sendMode} ${allocation.amount.toString()} raw reward tokens to ${allocation.wallet}`);
  }

  if (!config.airdropEnabled) {
    for (const allocation of allocations) {
      await dryRunPayout(epochId, allocation.wallet, allocation.amount.toString(), allocation.uiAmount.toString(), {
        normalRewardAmountRaw: allocation.normalAmount.toString(),
        normalRewardAmount: allocation.normalUiAmount.toString(),
        goldenBonusRewardRaw: allocation.goldenBonusAmount.toString(),
        goldenBonusReward: allocation.goldenBonusUiAmount.toString(),
        goldenMultiplier: allocation.goldenMultiplier,
        isGolden: allocation.isGolden,
        goldenCapped: allocation.goldenCapped
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

  const prepared: PreparedAllocation[] = allocations.map((allocation) => {
    const owner = new PublicKey(allocation.wallet);
    return {
      ...allocation,
      owner,
      destinationAta: rewardAtaForOwner(owner, tokenProgram)
    };
  });

  const signatures: string[] = [];
  for (const allocation of prepared) {
    await planPayout(epochId, allocation.wallet, allocation.amount.toString(), allocation.uiAmount.toString(), {
      normalRewardAmountRaw: allocation.normalAmount.toString(),
      normalRewardAmount: allocation.normalUiAmount.toString(),
      goldenBonusRewardRaw: allocation.goldenBonusAmount.toString(),
      goldenBonusReward: allocation.goldenBonusUiAmount.toString(),
      goldenMultiplier: allocation.goldenMultiplier,
      isGolden: allocation.isGolden,
      goldenCapped: allocation.goldenCapped
    });
  }

  const batches = chunk(prepared, config.airdropBatchSize);
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
    const batch = batches[batchIndex];
    const reserve = await payoutReserveForAtas(batch.map((allocation) => allocation.destinationAta));
    const requiredLamports = reserve.totalLamports;
    const balanceLamports = BigInt(await connection.getBalance(treasury.publicKey, "confirmed"));

    if (balanceLamports < requiredLamports) {
      stoppedForReserve = true;
      const error = new Error(
        `Treasury SOL below airdrop reserve: balance=${balanceLamports}, required=${requiredLamports}, reserve=${reserve.reserveLamports}, ataRent=${reserve.estimatedRentLamports}, missingAtas=${reserve.missingAtas.size}`
      );
      console.error(`[${epochId}] stopping airdrop batch: ${error.message}`);
      const remaining = batches.slice(batchIndex).flat();
      for (const allocation of remaining) {
        await failPayout(epochId, allocation.wallet, error);
      }
      break;
    }

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

      const txSig = await connection.sendRawTransaction(tx.serialize(), { maxRetries: 3, skipPreflight: false });
      await connection.confirmTransaction(txSig, "confirmed");
      for (const allocation of batch) {
        await settlePayout(epochId, allocation.wallet, txSig);
        settledRaw += allocation.amount;
        settledUi += allocation.uiAmount;
        settledCount += 1;
        if (allocation.isGolden) {
          await recordGoldenPayoutTx(epochId, txSig);
        }
        console.log(`[${epochId}] settled ${allocation.wallet}: ${txSig}`);
      }
      signatures.push(txSig);
    } catch (error) {
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
        normalRewardAmount: allocation.normalUiAmount.toString(),
        goldenBonusRewardRaw: allocation.goldenBonusAmount.toString(),
        goldenBonusReward: allocation.goldenBonusUiAmount.toString(),
        goldenMultiplier: allocation.goldenMultiplier,
        isGolden: allocation.isGolden,
        goldenCapped: allocation.goldenCapped
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
      normalRewardAmount: allocation.normalUiAmount.toString(),
      goldenBonusRewardRaw: allocation.goldenBonusAmount.toString(),
      goldenBonusReward: allocation.goldenBonusUiAmount.toString(),
      goldenMultiplier: allocation.goldenMultiplier,
      isGolden: allocation.isGolden,
      goldenCapped: allocation.goldenCapped
    });
  }

  const batches = chunk(prepared, config.airdropBatchSize);
  const reserveLamports = BigInt(Math.floor(config.airdropSolReserve * LAMPORTS_PER_SOL));
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
    const batch = batches[batchIndex];
    const batchAmountLamports = batch.reduce((sum, allocation) => sum + allocation.amount, 0n);
    const requiredLamports = reserveLamports + AIRDROP_TRANSFER_FEE_CUSHION_LAMPORTS + batchAmountLamports;
    const balanceLamports = BigInt(await connection.getBalance(treasury.publicKey, "confirmed"));

    if (balanceLamports < requiredLamports) {
      stoppedForReserve = true;
      const error = new Error(
        `Treasury SOL below SOL airdrop reserve: balance=${balanceLamports}, required=${requiredLamports}, reserve=${reserveLamports}, batch=${batchAmountLamports}`
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
        if (allocation.isGolden) {
          await recordGoldenPayoutTx(epochId, txSig);
        }
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
