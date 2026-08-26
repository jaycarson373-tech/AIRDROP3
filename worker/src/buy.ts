import { LAMPORTS_PER_SOL, VersionedTransaction } from "@solana/web3.js";
import {
  NATIVE_MINT,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getMint
} from "@solana/spl-token";
import { config, treasuryKeypair } from "./config.js";
import { connection } from "./solana.js";
import { assertTreasuryIsOnlySigner } from "./transaction-safety.js";

const SWAP_EXECUTION_CUSHION_LAMPORTS = 3_000_000n;
const AIRDROP_TRANSFER_FEE_CUSHION_LAMPORTS = 25_000n;

export type BuyResult = {
  baseSpentLamports: bigint;
  rewardReceivedRaw: bigint;
  rewardReceivedUi: number;
  usableLamports: bigint;
  protectedLamports: bigint;
  txSig: string | null;
};

async function tokenProgramForMint() {
  const info = await connection.getAccountInfo(config.rewardTokenMint);
  if (!info) throw new Error(`Reward mint not found: ${config.rewardTokenMint.toBase58()}`);
  if (info.owner.equals(TOKEN_PROGRAM_ID)) return TOKEN_PROGRAM_ID;
  if (info.owner.equals(TOKEN_2022_PROGRAM_ID)) return TOKEN_2022_PROGRAM_ID;
  throw new Error(`Unsupported reward token program: ${info.owner.toBase58()}`);
}

async function rewardDecimals() {
  const tokenProgram = await tokenProgramForMint();
  const mint = await getMint(connection, config.rewardTokenMint, "confirmed", tokenProgram);
  return mint.decimals;
}

async function rewardBalanceRaw() {
  const treasury = treasuryKeypair();
  const tokenProgram = await tokenProgramForMint();
  const ata = getAssociatedTokenAddressSync(config.rewardTokenMint, treasury.publicKey, false, tokenProgram);
  try {
    return BigInt((await connection.getTokenAccountBalance(ata, "confirmed")).value.amount);
  } catch {
    return 0n;
  }
}

function rawToUi(raw: bigint, decimals: number) {
  return Number(raw) / 10 ** decimals;
}

function maxBigInt(left: bigint, right: bigint) {
  return left > right ? left : right;
}

async function postBuyReserveLamports() {
  const minReserveLamports = BigInt(Math.floor(config.minSolReserve * LAMPORTS_PER_SOL));
  if (!config.airdropEnabled) return minReserveLamports;
  const airdropReserveLamports = BigInt(Math.floor(config.airdropSolReserve * LAMPORTS_PER_SOL));
  const maxBatchCount = BigInt(Math.ceil(config.winnersPerEpoch / config.airdropBatchSize));
  const transferFeeCushionLamports = maxBatchCount * AIRDROP_TRANSFER_FEE_CUSHION_LAMPORTS;
  return minReserveLamports + airdropReserveLamports + transferFeeCushionLamports + SWAP_EXECUTION_CUSHION_LAMPORTS;
}

export async function treasurySwapAmount(explicitReserveLamports?: bigint) {
  const treasury = treasuryKeypair();
  const balance = BigInt(await connection.getBalance(treasury.publicKey, "confirmed"));
  const defaultReserveLamports = await postBuyReserveLamports();
  const reserveLamports = explicitReserveLamports === undefined
    ? defaultReserveLamports
    : maxBigInt(explicitReserveLamports, defaultReserveLamports);
  const usableLamports = balance > reserveLamports ? balance - reserveLamports : 0n;
  const swapBudget = (usableLamports * BigInt(config.swapBalanceBps)) / 10_000n;
  const amount = (swapBudget * BigInt(config.rewardBuyBps)) / 10_000n;
  const protectedLamports = usableLamports > amount ? usableLamports - amount : 0n;
  return { balance, amount, reserveLamports, usableLamports, protectedLamports };
}

async function jupiterSwap(baseAmount: bigint, treasuryPublicKey: string) {
  const query = new URLSearchParams({
    inputMint: NATIVE_MINT.toBase58(),
    outputMint: config.rewardTokenMint.toBase58(),
    amount: baseAmount.toString(),
    slippageBps: String(config.swapSlippageBps),
    restrictIntermediateTokens: "true"
  });
  const quoteResponse = await fetch(`https://lite-api.jup.ag/swap/v1/quote?${query}`);
  if (!quoteResponse.ok) throw new Error(`Jupiter quote failed: ${await quoteResponse.text()}`);
  const quote = (await quoteResponse.json()) as { outAmount: string };
  if (BigInt(quote.outAmount) <= 0n) throw new Error("Jupiter returned an empty PUMP quote");

  const swapResponse = await fetch("https://lite-api.jup.ag/swap/v1/swap", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: treasuryPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      dynamicSlippage: false
    })
  });
  if (!swapResponse.ok) throw new Error(`Jupiter swap build failed: ${await swapResponse.text()}`);
  return { quote, swap: (await swapResponse.json()) as { swapTransaction: string } };
}

export async function buyReward(epochId: string, explicitReserveLamports?: bigint): Promise<BuyResult> {
  if (config.rewardMode === "sol") {
    return { baseSpentLamports: 0n, rewardReceivedRaw: 0n, rewardReceivedUi: 0, usableLamports: 0n, protectedLamports: 0n, txSig: null };
  }

  const treasury = treasuryKeypair();
  const { amount, balance, reserveLamports, usableLamports, protectedLamports } = await treasurySwapAmount(explicitReserveLamports);
  const decimals = await rewardDecimals();
  if (amount <= 0n) {
    console.log(`[${epochId}] no creator-fee budget available: balance=${balance}, reserve=${reserveLamports}`);
    return { baseSpentLamports: 0n, rewardReceivedRaw: 0n, rewardReceivedUi: 0, usableLamports, protectedLamports, txSig: null };
  }

  const { quote, swap } = await jupiterSwap(amount, treasury.publicKey.toBase58());
  const quotedRaw = BigInt(quote.outAmount);
  console.log(`[${epochId}] ${config.buyEnabled ? "" : "[DRY-RUN] "}PUMP buy: spend=${amount}, quoted=${quotedRaw}, reserve=${reserveLamports}`);

  if (!config.buyEnabled) {
    return { baseSpentLamports: amount, rewardReceivedRaw: quotedRaw, rewardReceivedUi: rawToUi(quotedRaw, decimals), usableLamports, protectedLamports, txSig: null };
  }

  const balanceBefore = await rewardBalanceRaw();
  const transaction = VersionedTransaction.deserialize(Buffer.from(swap.swapTransaction, "base64"));
  assertTreasuryIsOnlySigner(transaction, treasury.publicKey);
  transaction.sign([treasury]);
  const simulation = await connection.simulateTransaction(transaction, { replaceRecentBlockhash: true, sigVerify: false });
  if (simulation.value.err) {
    console.error(simulation.value.logs?.join("\n"));
    throw new Error(`Swap simulation failed: ${JSON.stringify(simulation.value.err)}`);
  }

  const txSig = await connection.sendRawTransaction(transaction.serialize(), { maxRetries: 3, skipPreflight: false });
  await connection.confirmTransaction(txSig, "confirmed");
  const balanceAfter = await rewardBalanceRaw();
  const receivedRaw = balanceAfter > balanceBefore ? balanceAfter - balanceBefore : 0n;
  if (receivedRaw <= 0n) throw new Error(`PUMP buy confirmed but no reward-token balance increase was measured: ${txSig}`);

  return {
    baseSpentLamports: amount,
    rewardReceivedRaw: receivedRaw,
    rewardReceivedUi: rawToUi(receivedRaw, decimals),
    usableLamports,
    protectedLamports,
    txSig
  };
}
