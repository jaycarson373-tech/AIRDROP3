import { Wallet } from "@coral-xyz/anchor";
import bs58 from "bs58";
import { createHash, createHmac } from "node:crypto";
import {
  Keypair,
  PublicKey,
  TransactionInstruction,
  type VersionedTransaction
} from "@solana/web3.js";
import * as sb from "@switchboard-xyz/on-demand";
import { config, treasuryKeypair } from "./config.js";
import {
  recordCasinoRandomnessCommit,
  recordCasinoRandomnessReveal,
  type CasinoRoundRow
} from "./db.js";
import { connection } from "./solana.js";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
const RANDOMNESS_DERIVATION_DOMAIN = "casino-strategy-switchboard-round-v1";
const COMMIT_INSTRUCTION_DISCRIMINATOR = anchorInstructionDiscriminator("randomness_commit");
const REVEAL_INSTRUCTION_DISCRIMINATOR = anchorInstructionDiscriminator("randomness_reveal");

type SwitchboardProgram = Awaited<ReturnType<typeof sb.AnchorUtils.loadProgramFromConnection>>;

type SwitchboardContext = {
  program: SwitchboardProgram;
  queue: PublicKey;
  authority: Keypair;
};

type RandomnessAccountState = {
  seedSlot: number;
  revealSlot: number;
  valueHex: string | null;
};

let contextPromise: Promise<SwitchboardContext> | null = null;

export class RandomnessPendingError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "RandomnessPendingError";
  }
}

export class RandomnessIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RandomnessIntegrityError";
  }
}

function anchorInstructionDiscriminator(name: string) {
  return createHash("sha256").update(`global:${name}`).digest().subarray(0, 8);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retry<T>(label: string, operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= config.switchboardRetryAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === config.switchboardRetryAttempts) break;
      const delay = Math.min(config.switchboardRetryDelayMs * 2 ** (attempt - 1), 15_000);
      console.warn(`${label} failed (${attempt}/${config.switchboardRetryAttempts}); retrying in ${delay}ms`);
      await sleep(delay);
    }
  }
  throw new RandomnessPendingError(`${label} failed after ${config.switchboardRetryAttempts} attempts`, {
    cause: lastError
  });
}

export function casinoRandomnessCommitBinding(round: Pick<CasinoRoundRow, "round_id" | "snapshot_hash">, account: PublicKey) {
  return ["CASINO_SB_COMMIT_V1", round.round_id, round.snapshot_hash, account.toBase58()].join("|");
}

export function casinoRandomnessRevealBinding(
  round: Pick<CasinoRoundRow, "round_id" | "snapshot_hash">,
  account: PublicKey,
  commitTxSig: string
) {
  return ["CASINO_SB_REVEAL_V1", round.round_id, round.snapshot_hash, account.toBase58(), commitTxSig].join("|");
}

export function deriveCasinoRandomnessKeypair(
  authority: Keypair,
  round: Pick<CasinoRoundRow, "round_id" | "snapshot_hash">
) {
  const seed = createHmac("sha256", authority.secretKey)
    .update(RANDOMNESS_DERIVATION_DOMAIN)
    .update("\0")
    .update(round.round_id)
    .update("\0")
    .update(round.snapshot_hash)
    .digest();
  return Keypair.fromSeed(seed);
}

function memoInstruction(binding: string) {
  return new TransactionInstruction({
    programId: MEMO_PROGRAM_ID,
    keys: [],
    data: Buffer.from(binding, "utf8")
  });
}

function bnToSafeNumber(value: { toString(): string }, label: string) {
  const parsed = Number(value.toString());
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new RandomnessIntegrityError(`Invalid Switchboard ${label}: ${value.toString()}`);
  }
  return parsed;
}

async function loadContext(): Promise<SwitchboardContext> {
  const authority = treasuryKeypair();
  const expectMainnet = config.solanaCluster === "mainnet-beta";
  const isMainnet = await sb.isMainnetConnection(connection);
  if (isMainnet !== expectMainnet) {
    throw new RandomnessIntegrityError(
      `SOLANA_CLUSTER=${config.solanaCluster} does not match the configured RPC genesis hash`
    );
  }

  const programId = expectMainnet ? sb.ON_DEMAND_MAINNET_PID : sb.ON_DEMAND_DEVNET_PID;
  const queue = sb.getDefaultQueueAddress(expectMainnet);
  const program = await sb.AnchorUtils.loadProgramFromConnection(
    connection,
    new Wallet(authority),
    programId
  );
  if (!program.programId.equals(programId)) {
    throw new RandomnessIntegrityError("Loaded Switchboard program ID does not match the configured cluster");
  }

  const [programAccount, queueAccount] = await Promise.all([
    connection.getAccountInfo(programId, "confirmed"),
    connection.getAccountInfo(queue, "confirmed")
  ]);
  if (!programAccount?.executable) {
    throw new RandomnessIntegrityError(`Switchboard program ${programId.toBase58()} is not executable`);
  }
  if (!queueAccount || !queueAccount.owner.equals(programId)) {
    throw new RandomnessIntegrityError(`Switchboard queue ${queue.toBase58()} has an invalid owner`);
  }
  return { program, queue, authority };
}

async function getContext() {
  contextPromise ??= loadContext().catch((error) => {
    contextPromise = null;
    throw error;
  });
  return contextPromise;
}

async function loadRandomnessState(
  context: SwitchboardContext,
  randomness: sb.Randomness
): Promise<RandomnessAccountState | null> {
  const accountInfo = await connection.getAccountInfo(randomness.pubkey, "confirmed");
  if (!accountInfo) return null;
  if (!accountInfo.owner.equals(context.program.programId)) {
    throw new RandomnessIntegrityError(
      `Randomness account ${randomness.pubkey.toBase58()} is not owned by Switchboard`
    );
  }

  const data = await randomness.loadData();
  if (!data.authority?.equals(context.authority.publicKey)) {
    throw new RandomnessIntegrityError("Switchboard randomness authority does not match the treasury");
  }
  if (!data.queue?.equals(context.queue)) {
    throw new RandomnessIntegrityError("Switchboard randomness queue does not match the configured network");
  }

  const seedSlot = bnToSafeNumber(data.seedSlot, "seed slot");
  const revealSlot = bnToSafeNumber(data.revealSlot, "reveal slot");
  const rawValue = Buffer.from(data.value ?? []);
  if (rawValue.length !== 32) {
    throw new RandomnessIntegrityError(`Switchboard randomness value is ${rawValue.length} bytes; expected 32`);
  }
  return {
    seedSlot,
    revealSlot,
    valueHex: revealSlot > 0 ? rawValue.toString("hex") : null
  };
}

function instructionUsesAccount(
  instruction: { accountKeyIndexes: Uint8Array | number[] },
  staticKeys: PublicKey[],
  account: PublicKey
) {
  return Array.from(instruction.accountKeyIndexes).some((index) => staticKeys[index]?.equals(account));
}

async function assertBoundSwitchboardTransaction(
  signature: string,
  account: PublicKey,
  authority: PublicKey,
  programId: PublicKey,
  binding: string,
  discriminator: Buffer
) {
  const response = await retry(`fetch Switchboard transaction ${signature}`, () =>
    connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0
    })
  );
  if (!response) throw new RandomnessPendingError(`Switchboard transaction ${signature} is not indexed yet`);
  if (response.meta?.err) {
    throw new RandomnessIntegrityError(
      `Switchboard transaction ${signature} failed: ${JSON.stringify(response.meta.err)}`
    );
  }

  const message = response.transaction.message;
  const staticKeys = message.staticAccountKeys;
  if (!staticKeys[0]?.equals(authority)) {
    throw new RandomnessIntegrityError(`Switchboard transaction ${signature} has the wrong fee payer`);
  }

  const hasMemo = message.compiledInstructions.some((instruction) => {
    const instructionProgram = staticKeys[instruction.programIdIndex];
    return (
      instructionProgram?.equals(MEMO_PROGRAM_ID) &&
      Buffer.from(instruction.data).toString("utf8") === binding
    );
  });
  if (!hasMemo) {
    throw new RandomnessIntegrityError(`Switchboard transaction ${signature} is missing its round binding`);
  }

  const hasExpectedSwitchboardInstruction = message.compiledInstructions.some((instruction) => {
    const instructionProgram = staticKeys[instruction.programIdIndex];
    const data = Buffer.from(instruction.data);
    return (
      instructionProgram?.equals(programId) &&
      instructionUsesAccount(instruction, staticKeys, account) &&
      data.subarray(0, discriminator.length).equals(discriminator)
    );
  });
  if (!hasExpectedSwitchboardInstruction) {
    throw new RandomnessIntegrityError(
      `Switchboard transaction ${signature} does not contain the expected bound instruction`
    );
  }
  return response;
}

async function findBoundSignature(
  account: PublicKey,
  authority: PublicKey,
  programId: PublicKey,
  binding: string,
  discriminator: Buffer
) {
  const signatures = await connection.getSignaturesForAddress(account, { limit: 20 }, "confirmed");
  for (const candidate of signatures) {
    if (candidate.err) continue;
    try {
      await assertBoundSwitchboardTransaction(
        candidate.signature,
        account,
        authority,
        programId,
        binding,
        discriminator
      );
      return candidate.signature;
    } catch (error) {
      if (error instanceof RandomnessIntegrityError) continue;
      throw error;
    }
  }
  throw new RandomnessPendingError(`No bound Switchboard transaction found for ${account.toBase58()}`);
}

async function sendBoundTransaction(
  instructions: TransactionInstruction[],
  signers: Keypair[]
) {
  const context = await getContext();
  const transaction = (await sb.asV0Tx({
    connection,
    ixs: instructions,
    payer: context.authority.publicKey,
    signers,
    computeUnitPrice: config.switchboardComputeUnitPriceMicroLamports,
    computeUnitLimitMultiple: config.switchboardComputeLimitMultiple
  })) as VersionedTransaction;
  const simulation = await connection.simulateTransaction(transaction, {
    commitment: "processed",
    sigVerify: true
  });
  if (simulation.value.err) {
    throw new RandomnessIntegrityError(
      `Switchboard transaction simulation failed: ${JSON.stringify(simulation.value.err)}; logs=${JSON.stringify(
        simulation.value.logs
      )}`
    );
  }

  const expectedSignature = bs58.encode(transaction.signatures[0]);
  const sentSignature = await connection.sendTransaction(transaction, {
    maxRetries: 3,
    skipPreflight: false,
    preflightCommitment: "processed"
  });
  if (sentSignature !== expectedSignature) {
    throw new RandomnessIntegrityError("Switchboard transaction signature changed during broadcast");
  }
  const confirmation = await connection.confirmTransaction(sentSignature, "confirmed");
  if (confirmation.value.err) {
    throw new RandomnessIntegrityError(
      `Switchboard transaction confirmation failed: ${JSON.stringify(confirmation.value.err)}`
    );
  }
  return sentSignature;
}

function assertStoredCommitment(
  round: CasinoRoundRow,
  context: SwitchboardContext,
  account: PublicKey,
  binding: string,
  seedSlot: number,
  commitTxSig: string
) {
  const expected = {
    provider: "switchboard",
    program: context.program.programId.toBase58(),
    queue: context.queue.toBase58(),
    authority: context.authority.publicKey.toBase58(),
    account: account.toBase58(),
    binding,
    seedSlot,
    commitTxSig
  };
  const actual = {
    provider: round.randomness_provider,
    program: round.randomness_program,
    queue: round.randomness_queue,
    authority: round.randomness_authority,
    account: round.randomness_account,
    binding: round.randomness_binding,
    seedSlot:
      round.randomness_commit_slot === null ? null : Number(round.randomness_commit_slot),
    commitTxSig: round.randomness_commit_tx_sig
  };
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (actual[key as keyof typeof actual] !== expectedValue) {
      throw new RandomnessIntegrityError(`Stored Switchboard commitment mismatch: ${key}`);
    }
  }
}

export async function advanceCasinoRandomness(round: CasinoRoundRow): Promise<CasinoRoundRow> {
  if (!config.switchboardRandomnessEnabled) return round;
  if (round.status !== "awaiting_randomness") return round;

  const context = await getContext();
  const randomnessKeypair = deriveCasinoRandomnessKeypair(context.authority, round);
  const randomness = new sb.Randomness(context.program, randomnessKeypair.publicKey);
  if (round.randomness_account && round.randomness_account !== randomness.pubkey.toBase58()) {
    throw new RandomnessIntegrityError("Stored randomness account does not match the round-bound account");
  }
  const commitBinding = casinoRandomnessCommitBinding(round, randomness.pubkey);
  let state = await loadRandomnessState(context, randomness);
  let commitTxSig = round.randomness_commit_tx_sig;

  if (!state) {
    if (commitTxSig) {
      throw new RandomnessIntegrityError("Committed Switchboard randomness account is missing on-chain");
    }
    const [createdRandomness, createIx] = await sb.Randomness.create(
      context.program,
      randomnessKeypair,
      context.queue,
      context.authority.publicKey
    );
    const commitIx = await retry("build Switchboard commit instruction", () =>
      createdRandomness.commitIx(context.queue, context.authority.publicKey)
    );
    commitTxSig = await sendBoundTransaction(
      [createIx, commitIx, memoInstruction(commitBinding)],
      [context.authority, randomnessKeypair]
    );
    state = await retry("load committed Switchboard randomness", async () => {
      const loaded = await loadRandomnessState(context, randomness);
      if (!loaded || loaded.seedSlot === 0) throw new Error("randomness commitment is not visible yet");
      return loaded;
    });
  } else if (state.seedSlot === 0) {
    if (commitTxSig) {
      throw new RandomnessIntegrityError("Stored Switchboard commitment is not present in the on-chain account");
    }
    const commitIx = await retry("build Switchboard commit instruction", () =>
      randomness.commitIx(context.queue, context.authority.publicKey)
    );
    commitTxSig = await sendBoundTransaction(
      [commitIx, memoInstruction(commitBinding)],
      [context.authority]
    );
    state = await retry("load committed Switchboard randomness", async () => {
      const loaded = await loadRandomnessState(context, randomness);
      if (!loaded || loaded.seedSlot === 0) throw new Error("randomness commitment is not visible yet");
      return loaded;
    });
  }

  if (!commitTxSig) {
    commitTxSig = await findBoundSignature(
      randomness.pubkey,
      context.authority.publicKey,
      context.program.programId,
      commitBinding,
      COMMIT_INSTRUCTION_DISCRIMINATOR
    );
  }
  const commitTransaction = await assertBoundSwitchboardTransaction(
    commitTxSig,
    randomness.pubkey,
    context.authority.publicKey,
    context.program.programId,
    commitBinding,
    COMMIT_INSTRUCTION_DISCRIMINATOR
  );
  if (state.seedSlot <= commitTransaction.slot || state.seedSlot > commitTransaction.slot + 2) {
    throw new RandomnessIntegrityError(
      `Switchboard seed slot ${state.seedSlot} is not bound to commit transaction slot ${commitTransaction.slot}`
    );
  }

  let committedRound = round;
  if (!round.randomness_commit_tx_sig) {
    committedRound = await recordCasinoRandomnessCommit(round.round_id, {
      program: context.program.programId.toBase58(),
      queue: context.queue.toBase58(),
      authority: context.authority.publicKey.toBase58(),
      account: randomness.pubkey.toBase58(),
      seedSlot: state.seedSlot,
      binding: commitBinding,
      commitTxSig
    });
  } else {
    assertStoredCommitment(round, context, randomness.pubkey, commitBinding, state.seedSlot, commitTxSig);
  }

  let revealTxSig = committedRound.randomness_reveal_tx_sig;
  if (state.revealSlot === 0) {
    const revealBinding = casinoRandomnessRevealBinding(committedRound, randomness.pubkey, commitTxSig);
    const revealIx = await retry("build Switchboard reveal instruction", () =>
      randomness.revealIx(context.authority.publicKey)
    );
    revealTxSig = await sendBoundTransaction(
      [revealIx, memoInstruction(revealBinding)],
      [context.authority]
    );
    state = await retry("load revealed Switchboard randomness", async () => {
      const loaded = await loadRandomnessState(context, randomness);
      if (!loaded || loaded.revealSlot === 0 || !loaded.valueHex) {
        throw new Error("randomness reveal is not visible yet");
      }
      return loaded;
    });
  }

  const revealBinding = casinoRandomnessRevealBinding(committedRound, randomness.pubkey, commitTxSig);
  if (!revealTxSig) {
    revealTxSig = await findBoundSignature(
      randomness.pubkey,
      context.authority.publicKey,
      context.program.programId,
      revealBinding,
      REVEAL_INSTRUCTION_DISCRIMINATOR
    );
  }
  const revealTransaction = await assertBoundSwitchboardTransaction(
    revealTxSig,
    randomness.pubkey,
    context.authority.publicKey,
    context.program.programId,
    revealBinding,
    REVEAL_INSTRUCTION_DISCRIMINATOR
  );
  if (state.revealSlot !== revealTransaction.slot || state.revealSlot <= state.seedSlot) {
    throw new RandomnessIntegrityError(
      `Switchboard reveal slot ${state.revealSlot} does not match reveal transaction slot ${revealTransaction.slot}`
    );
  }
  if (!state.valueHex || !/^[0-9a-f]{64}$/.test(state.valueHex)) {
    throw new RandomnessIntegrityError("Switchboard revealed value is not 32 bytes");
  }

  if (committedRound.randomness_verified_at) {
    await verifyCasinoRandomnessProof(committedRound);
    return committedRound;
  }
  return recordCasinoRandomnessReveal(committedRound.round_id, {
    revealSlot: state.revealSlot,
    randomnessHex: state.valueHex,
    revealTxSig
  });
}

export async function verifyCasinoRandomnessProof(round: CasinoRoundRow) {
  if (
    round.randomness_provider !== "switchboard" ||
    !round.randomness_program ||
    !round.randomness_queue ||
    !round.randomness_authority ||
    !round.randomness_account ||
    round.randomness_commit_slot === null ||
    round.randomness_reveal_slot === null ||
    !round.randomness_binding ||
    !round.randomness_hex ||
    !round.randomness_commit_tx_sig ||
    !round.randomness_reveal_tx_sig ||
    !round.randomness_verified_at
  ) {
    return false;
  }

  const context = await getContext();
  const account = new PublicKey(round.randomness_account);
  const randomness = new sb.Randomness(context.program, account);
  const expectedCommitBinding = casinoRandomnessCommitBinding(round, account);
  const seedSlot = Number(round.randomness_commit_slot);
  const revealSlot = Number(round.randomness_reveal_slot);
  if (!Number.isSafeInteger(seedSlot) || !Number.isSafeInteger(revealSlot)) {
    throw new RandomnessIntegrityError("Stored Switchboard slots are invalid");
  }
  assertStoredCommitment(
    round,
    context,
    account,
    expectedCommitBinding,
    seedSlot,
    round.randomness_commit_tx_sig
  );

  const state = await loadRandomnessState(context, randomness);
  if (
    !state ||
    state.seedSlot !== seedSlot ||
    state.revealSlot !== revealSlot ||
    state.valueHex !== round.randomness_hex
  ) {
    throw new RandomnessIntegrityError("Stored Switchboard proof does not match the on-chain randomness account");
  }
  const commitTransaction = await assertBoundSwitchboardTransaction(
    round.randomness_commit_tx_sig,
    account,
    context.authority.publicKey,
    context.program.programId,
    expectedCommitBinding,
    COMMIT_INSTRUCTION_DISCRIMINATOR
  );
  if (seedSlot <= commitTransaction.slot || seedSlot > commitTransaction.slot + 2) {
    throw new RandomnessIntegrityError("Stored Switchboard seed slot does not match the commit transaction");
  }

  const revealBinding = casinoRandomnessRevealBinding(
    round,
    account,
    round.randomness_commit_tx_sig
  );
  const revealTransaction = await assertBoundSwitchboardTransaction(
    round.randomness_reveal_tx_sig,
    account,
    context.authority.publicKey,
    context.program.programId,
    revealBinding,
    REVEAL_INSTRUCTION_DISCRIMINATOR
  );
  if (revealSlot !== revealTransaction.slot || revealSlot <= seedSlot) {
    throw new RandomnessIntegrityError("Stored Switchboard reveal slot does not match the reveal transaction");
  }
  return true;
}
