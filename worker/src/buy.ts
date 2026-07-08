import { LAMPORTS_PER_SOL, SystemProgram, Transaction, VersionedTransaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { NATIVE_MINT, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, getMint } from "@solana/spl-token";
import { config, treasuryKeypair } from "./config.js";
import { connection } from "./solana.js";

const SWAP_EXECUTION_CUSHION_LAMPORTS = 3_000_000n;
const AIRDROP_TRANSFER_FEE_CUSHION_LAMPORTS = 25_000n;

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
  const pfpTransferCushionLamports = config.pfpRewardWallet && config.pfpRewardBps > 0 ? 50_000n : 0n;
  const payoutReserveLamports =
    airdropReserveLamports + transferFeeCushionLamports + SWAP_EXECUTION_CUSHION_LAMPORTS + pfpTransferCushionLamports;

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
  const bagworkBps = config.pfpRewardWallet ? config.pfpRewardBps : 0;
  const rewardBuyBps = config.pfpRewardWallet ? Math.max(0, Math.min(config.ansemBuyBps, 10_000 - bagworkBps)) : config.ansemBuyBps;
  const amount = (splitBudgetLamports * BigInt(rewardBuyBps)) / 10_000n;
  const pfpRewardLamports = (splitBudgetLamports * BigInt(bagworkBps)) / 10_000n;
  const allocatedLamports = amount + pfpRewardLamports;
  const solLongReserveLamports = usableLamports > allocatedLamports ? usableLamports - allocatedLamports : 0n;

  return {
    balance,
    amount: amount > 0n ? amount : 0n,
    pfpRewardLamports: pfpRewardLamports > 0n ? pfpRewardLamports : 0n,
    reserveLamports,
    usableLamports,
    solLongReserveLamports,
    rewardBuyBps,
    bagworkBps
  };
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

async function sendPfpReward(epochId: string, amountLamports: bigint) {
  if (!config.pfpRewardWallet || amountLamports <= 0n) return null;
  const treasury = treasuryKeypair();
  console.log(
    `[${epochId}] ${config.buyEnabled ? "" : "[DRY-RUN] "}bagworking reward split: ${amountLamports.toString()} lamports to ${config.pfpRewardWallet.toBase58()}`
  );
  if (!config.buyEnabled) return null;
  if (amountLamports > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("Bagworking reward is too large for a single transfer");
  }
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: treasury.publicKey,
      toPubkey: config.pfpRewardWallet,
      lamports: Number(amountLamports)
    })
  );
  return await sendAndConfirmTransaction(connection, tx, [treasury], { commitment: "confirmed", maxRetries: 3 });
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
  const { amount, pfpRewardLamports, balance, reserveLamports, usableLamports, solLongReserveLamports, rewardBuyBps, bagworkBps } =
    await treasurySwapAmount(explicitReserveLamports);
  const decimals = await rewardDecimals();

  if (amount <= 0n) {
    console.log(
      `[${epochId}] insufficient treasury after reserve/split, skipping HOOD buyback: balance=${balance}, reserve=${reserveLamports}, usable=${usableLamports}, buyBps=${rewardBuyBps}, bagworkBps=${bagworkBps}`
    );
    return {
      baseSpentLamports: 0n,
      rewardReceivedRaw: 0n,
      rewardReceivedUi: 0,
      usableLamports,
      solLongReserveLamports,
      pfpRewardLamports,
      pfpRewardTxSig: null,
      txSig: null
    };
  }

  const { quote, swap } = await jupiterSwap(amount, treasury.publicKey.toBase58());
  const rewardReceivedRaw = BigInt(quote.outAmount);
  const rewardReceivedUi = rawToUi(rewardReceivedRaw, decimals);
  console.log(
    `[${epochId}] ${config.buyEnabled ? "" : "[DRY-RUN] "}Hood Strategy buyback: usable=${usableLamports}, automatic holders=${amount} lamports (${rewardBuyBps} bps), verified draws=${pfpRewardLamports} lamports (${bagworkBps} bps), remaining protected=${solLongReserveLamports} lamports, reserve=${reserveLamports}`
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
      pfpRewardLamports,
      pfpRewardTxSig: null,
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
  const pfpRewardTxSig = await sendPfpReward(epochId, pfpRewardLamports);
  return {
    baseSpentLamports: amount,
    rewardReceivedRaw,
    rewardReceivedUi,
    usableLamports,
    solLongReserveLamports,
    pfpRewardLamports,
    pfpRewardTxSig,
    txSig
  };
}
