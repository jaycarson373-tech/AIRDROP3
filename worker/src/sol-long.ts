import { LAMPORTS_PER_SOL, SystemProgram, Transaction } from "@solana/web3.js";
import { config, treasuryKeypair } from "./config.js";
import { connection } from "./solana.js";

const LONG_TRANSFER_FEE_CUSHION_LAMPORTS = 5_000_000n;

function protectedReserveLamports() {
  const minReserveLamports = BigInt(Math.floor(config.minSolReserve * LAMPORTS_PER_SOL));
  const airdropReserveLamports = BigInt(Math.floor(config.airdropSolReserve * LAMPORTS_PER_SOL));
  return minReserveLamports + airdropReserveLamports + LONG_TRANSFER_FEE_CUSHION_LAMPORTS;
}

export async function forwardSolLongReserve(epochId: string, intendedLamports: bigint) {
  if (!config.solLongWallet) {
    if (intendedLamports > 0n) {
      console.log(`[${epochId}] SOL_LONG_WALLET not set; keeping ${intendedLamports.toString()} lamports in treasury long reserve`);
    }
    return null;
  }

  if (intendedLamports <= 0n) return null;

  const treasury = treasuryKeypair();
  const balance = BigInt(await connection.getBalance(treasury.publicKey, "confirmed"));
  const reserve = protectedReserveLamports();
  const available = balance > reserve ? balance - reserve : 0n;
  const amount = intendedLamports < available ? intendedLamports : available;

  if (amount <= 0n) {
    console.log(
      `[${epochId}] SOL long transfer skipped: balance=${balance}, protectedReserve=${reserve}, intended=${intendedLamports}`
    );
    return null;
  }

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: treasury.publicKey,
      toPubkey: config.solLongWallet,
      lamports: Number(amount)
    })
  );
  const signature = await connection.sendTransaction(transaction, [treasury], { maxRetries: 3, skipPreflight: false });
  await connection.confirmTransaction(signature, "confirmed");

  console.log(
    `[${epochId}] forwarded ${amount.toString()} lamports to SOL long wallet ${config.solLongWallet.toBase58()}: ${signature}`
  );
  return signature;
}
