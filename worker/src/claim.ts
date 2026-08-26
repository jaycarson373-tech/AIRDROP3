import { ComputeBudgetProgram, LAMPORTS_PER_SOL, SystemProgram, VersionedTransaction } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { config, treasuryKeypair } from "./config.js";
import { connection } from "./solana.js";
import { getClaim, recordClaim } from "./db.js";
import { assertAllowedPrograms, assertNoAddressLookups, assertTreasuryIsOnlySigner } from "./transaction-safety.js";

const PUMP_PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
const PUMP_AMM_PROGRAM_ID = "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA";

export type ClaimResult = { txSig: string | null; amountClaimed: string };

function allowedClaimPrograms() {
  return new Set([
    PUMP_PROGRAM_ID,
    PUMP_AMM_PROGRAM_ID,
    ComputeBudgetProgram.programId.toBase58(),
    SystemProgram.programId.toBase58(),
    TOKEN_PROGRAM_ID.toBase58(),
    TOKEN_2022_PROGRAM_ID.toBase58(),
    ASSOCIATED_TOKEN_PROGRAM_ID.toBase58(),
    ...config.claimAllowedProgramIds.map((program) => program.toBase58())
  ]);
}

export async function claimFees(epochId: string): Promise<ClaimResult> {
  const existing = await getClaim(epochId);
  if (existing?.tx_sig) {
    console.log(`[${epochId}] creator-fee claim already confirmed, skipping`);
    return { txSig: existing.tx_sig, amountClaimed: String(existing.amount_claimed ?? "0") };
  }

  if (!config.claimEnabled) {
    console.log(`[${epochId}] [DRY-RUN] creator-fee claim disabled`);
    return { txSig: null, amountClaimed: "0" };
  }

  const treasury = treasuryKeypair();
  const response = await fetch("https://pumpportal.fun/api/trade-local", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      publicKey: treasury.publicKey.toBase58(),
      action: "collectCreatorFee",
      priorityFee: config.priorityFeeSol
    })
  });

  if (!response.ok) {
    throw new Error(`Creator-fee claim API failed ${response.status}: ${await response.text()}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length === 0) {
    await recordClaim(epochId, "0", null);
    console.log(`[${epochId}] no creator fees available`);
    return { txSig: null, amountClaimed: "0" };
  }

  const transaction = VersionedTransaction.deserialize(bytes);
  assertTreasuryIsOnlySigner(transaction, treasury.publicKey);
  assertNoAddressLookups(transaction);
  assertAllowedPrograms(transaction, allowedClaimPrograms());

  const balanceBefore = await connection.getBalance(treasury.publicKey, "confirmed");
  transaction.sign([treasury]);
  const simulation = await connection.simulateTransaction(transaction, { replaceRecentBlockhash: true, sigVerify: false });
  if (simulation.value.err) {
    console.error(simulation.value.logs?.join("\n"));
    throw new Error(`Creator-fee claim simulation failed: ${JSON.stringify(simulation.value.err)}`);
  }

  const txSig = await connection.sendRawTransaction(transaction.serialize(), { maxRetries: 3, skipPreflight: false });
  await connection.confirmTransaction(txSig, "confirmed");
  const balanceAfter = await connection.getBalance(treasury.publicKey, "confirmed");
  const netClaimedLamports = Math.max(0, balanceAfter - balanceBefore);
  const amountClaimed = (netClaimedLamports / LAMPORTS_PER_SOL).toString();
  await recordClaim(epochId, amountClaimed, txSig);
  console.log(`[${epochId}] creator fees confirmed: ${amountClaimed} SOL net, ${txSig}`);
  return { txSig, amountClaimed };
}
