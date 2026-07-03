import { LAMPORTS_PER_SOL, SystemProgram, Transaction, VersionedTransaction } from "@solana/web3.js";
import { NATIVE_MINT, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, getMint } from "@solana/spl-token";
import { config, treasuryKeypair } from "./config.js";
import { connection } from "./solana.js";
import { getBuy, recordPfpReward } from "./db.js";

const SWAP_EXECUTION_CUSHION_LAMPORTS = 3_000_000n;
const AIRDROP_TRANSFER_FEE_CUSHION_LAMPORTS = 25_000n;
const PFP_TRANSFER_FEE_CUSHION_LAMPORTS = 25_000n;

export type BuyResult = {
  baseSpentLamports: bigint;
  rewardReceivedRaw: bigint;
  rewardReceivedUi: number;
  usableLamports: bigint;
  solLongReserveLamports: bigint;
  pfpRewardLamports: bigint;
  pfpRewardTxSig: string | null;
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

function rawToUi(raw: bigint, decimals: number) {
  return Number(raw) / 10 ** decimals;
}

function maxBigInt(a: bigint, b: bigint) {
  return a > b ? a : b;
}

async function postBuyReserveLamports() {
  const minReserveLamports = BigInt(Math.floor(config.minSolReserve * LAMPORTS_PER_SOL));
  if (!config.airdropEnabled) return minReserveLamports;

  const airdropReserveLamports = BigInt(Math.floor(config.airdropSolReserve * LAMPORTS_PER_SOL));
  const maxBatchCount = BigInt(Math.ceil(config.maxWalletsPerEpoch / config.airdropBatchSize));
  const transferFeeCushionLamports = maxBatchCount * AIRDROP_TRANSFER_FEE_CUSHION_LAMPORTS;
  const pfpTransferFeeLamports = config.pfpRewardWallet && config.pfpRewardBps > 0 ? PFP_TRANSFER_FEE_CUSHION_LAMPORTS : 0n;
  const payoutReserveLamports =
    airdropReserveLamports + transferFeeCushionLamports + SWAP_EXECUTION_CUSHION_LAMPORTS + pfpTransferFeeLamports;

  return minReserveLamports + payoutReserveLamports;
}

export async function treasurySwapAmount(explicitReserveLamports?: bigint) {
  const treasury = treasuryKeypair();
  const balance = BigInt(await connection.getBalance(treasury.publicKey, "confirmed"));
  const defaultReserveLamports = await postBuyReserveLamports();
  const reserveLamports =
    explicitReserveLamports === undefined ? defaultReserveLamports : maxBigInt(explicitReserveLamports, defaultReserveLamports);
  const usableLamports = balance > reserveLamports ? balance - reserveLamports : 0n;
  const splitBudgetLamports = (usableLamports * BigInt(config.swapBalanceBps)) / 10_000n;
  const pfpRewardLamports =
    config.pfpRewardWallet && config.pfpRewardBps > 0
      ? (splitBudgetLamports * BigInt(config.pfpRewardBps)) / 10_000n
      : 0n;
  const ansemBudget = (splitBudgetLamports * BigInt(config.ansemBuyBps)) / 10_000n;
  const remainingAfterPfp = splitBudgetLamports > pfpRewardLamports ? splitBudgetLamports - pfpRewardLamports : 0n;
  const amount = ansemBudget < remainingAfterPfp ? ansemBudget : remainingAfterPfp;
  const spentLamports = amount + pfpRewardLamports;
  const solLongReserveLamports = usableLamports > spentLamports ? usableLamports - spentLamports : 0n;

  return {
    balance,
    amount: amount > 0n ? amount : 0n,
    pfpRewardLamports: pfpRewardLamports > 0n ? pfpRewardLamports : 0n,
    reserveLamports,
    usableLamports,
    solLongReserveLamports
  };
}

async function sendPfpReward(epochId: string, amount: bigint, existingTxSig?: string | null) {
  if (!config.pfpRewardWallet || amount <= 0n) return { pfpRewardLamports: 0n, pfpRewardTxSig: null };
  if (existingTxSig) {
    console.log(`[${epochId}] PFP reward already recorded, skipping duplicate transfer: ${existingTxSig}`);
    return { pfpRewardLamports: amount, pfpRewardTxSig: existingTxSig };
  }

  console.log(
    `[${epochId}] ${config.buyEnabled ? "" : "[DRY-RUN] "}PFP reward split: ${amount.toString()} lamports to ${config.pfpRewardWallet.toBase58()} (${config.pfpRewardBps} bps)`
  );

  if (!config.buyEnabled) return { pfpRewardLamports: amount, pfpRewardTxSig: null };

  // Prove the DB has the PFP reward columns before money moves.
  await recordPfpReward(epochId, "0", null);

  const treasury = treasuryKeypair();
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: treasury.publicKey,
      toPubkey: config.pfpRewardWallet,
      lamports: amount
    })
  );

  tx.feePayer = treasury.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
  tx.sign(treasury);

  const simulation = await connection.simulateTransaction(tx);
  if (simulation.value.err) {
    throw new Error(`PFP reward transfer simulation failed: ${JSON.stringify(simulation.value.err)}`);
  }

  const txSig = await connection.sendRawTransaction(tx.serialize(), { maxRetries: 3, skipPreflight: false });
  await connection.confirmTransaction(txSig, "confirmed");
  await recordPfpReward(epochId, amount.toString(), txSig);
  console.log(`[${epochId}] PFP reward settled: ${txSig}`);
  return { pfpRewardLamports: amount, pfpRewardTxSig: txSig };
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
    console.log(`[${epochId}] REWARD_MODE=sol, buy path disabled`);
    return {
      baseSpentLamports: 0n,
      rewardReceivedRaw: 0n,
      rewardReceivedUi: 0,
      usableLamports: 0n,
      solLongReserveLamports: 0n,
      pfpRewardLamports: 0n,
      pfpRewardTxSig: null,
      txSig: null
    };
  }

  const treasury = treasuryKeypair();
  const existingBuy = (await getBuy(epochId).catch(() => null)) as
    | { pfp_reward_tx_sig?: string | null; pfp_reward_lamports?: string | number | null }
    | null;
  const { amount, pfpRewardLamports, balance, reserveLamports, usableLamports, solLongReserveLamports } =
    await treasurySwapAmount(explicitReserveLamports);
  const decimals = await rewardDecimals();
  const pfpReward = await sendPfpReward(
    epochId,
    pfpRewardLamports,
    existingBuy?.pfp_reward_tx_sig ?? null
  );

  if (amount <= 0n) {
    console.log(
      `[${epochId}] insufficient treasury after reserve/split, skipping ANSEM buy: balance=${balance}, reserve=${reserveLamports}, usable=${usableLamports}, ansemBuyBps=${config.ansemBuyBps}`
    );
    return {
      baseSpentLamports: 0n,
      rewardReceivedRaw: 0n,
      rewardReceivedUi: 0,
      usableLamports,
      solLongReserveLamports,
      pfpRewardLamports: pfpReward.pfpRewardLamports,
      pfpRewardTxSig: pfpReward.pfpRewardTxSig,
      txSig: null
    };
  }

  const { quote, swap } = await jupiterSwap(amount, treasury.publicKey.toBase58());
  const rewardReceivedRaw = BigInt(quote.outAmount);
  const rewardReceivedUi = rawToUi(rewardReceivedRaw, decimals);
  console.log(
    `[${epochId}] ${config.buyEnabled ? "" : "[DRY-RUN] "}ANSEM accumulation: usable=${usableLamports}, PFP reward=${pfpReward.pfpRewardLamports}, ANSEM buy=${amount} lamports (${config.ansemBuyBps} bps), remaining protected=${solLongReserveLamports} lamports, reserve=${reserveLamports}`
  );
  console.log(
    `[${epochId}] ${config.buyEnabled ? "" : "[DRY-RUN] "}would buy ${rewardReceivedRaw.toString()} raw reward tokens for ${amount.toString()} lamports`
  );

  if (!config.buyEnabled) {
    return {
      baseSpentLamports: amount,
      rewardReceivedRaw,
      rewardReceivedUi,
      usableLamports,
      solLongReserveLamports,
      pfpRewardLamports: pfpReward.pfpRewardLamports,
      pfpRewardTxSig: pfpReward.pfpRewardTxSig,
      txSig: null
    };
  }

  const tx = VersionedTransaction.deserialize(Buffer.from(swap.swapTransaction, "base64"));
  tx.sign([treasury]);
  const simulation = await connection.simulateTransaction(tx, { replaceRecentBlockhash: true, sigVerify: false });
  if (simulation.value.err) {
    console.error(simulation.value.logs?.join("\n"));
    throw new Error(`Swap simulation failed: ${JSON.stringify(simulation.value.err)}`);
  }

  const txSig = await connection.sendRawTransaction(tx.serialize(), { maxRetries: 3, skipPreflight: false });
  await connection.confirmTransaction(txSig, "confirmed");
  return {
    baseSpentLamports: amount,
    rewardReceivedRaw,
    rewardReceivedUi,
    usableLamports,
    solLongReserveLamports,
    pfpRewardLamports: pfpReward.pfpRewardLamports,
    pfpRewardTxSig: pfpReward.pfpRewardTxSig,
    txSig
  };
}
