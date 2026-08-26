import type { PublicKey, VersionedTransaction } from "@solana/web3.js";

export function assertTreasuryIsOnlySigner(transaction: VersionedTransaction, treasury: PublicKey) {
  const message = transaction.message;
  const requiredSigners = message.staticAccountKeys.slice(0, message.header.numRequiredSignatures);
  if (requiredSigners.length !== 1 || !requiredSigners[0]?.equals(treasury)) {
    throw new Error("Rejected external transaction: treasury must be the only required signer");
  }
  if (!message.staticAccountKeys[0]?.equals(treasury)) {
    throw new Error("Rejected external transaction: treasury is not the fee payer");
  }
}

export function assertNoAddressLookups(transaction: VersionedTransaction) {
  if (transaction.message.addressTableLookups.length > 0) {
    throw new Error("Rejected external transaction: address lookup tables are not allowed for fee claims");
  }
}

export function assertAllowedPrograms(transaction: VersionedTransaction, allowedPrograms: Set<string>) {
  for (const instruction of transaction.message.compiledInstructions) {
    const program = transaction.message.staticAccountKeys[instruction.programIdIndex];
    if (!program || !allowedPrograms.has(program.toBase58())) {
      throw new Error(`Rejected external transaction program: ${program?.toBase58() ?? "unknown"}`);
    }
  }
}
