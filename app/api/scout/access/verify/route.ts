import { createPublicKey, verify } from "node:crypto";
import bs58 from "bs58";
import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  createAccessSession,
  getAccessChallenge,
  markChallengeUsed,
  validateSolanaMint
} from "../../../../../lib/scout";

export const runtime = "nodejs";

function rpcUrl() {
  return process.env.HELIUS_RPC_URL ?? process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";
}

function sourceMint() {
  return process.env.SOURCE_TOKEN_MINT ?? process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT ?? process.env.NEXT_PUBLIC_CA ?? "";
}

function eligibilityMinimum() {
  const parsed = Number(process.env.ELIGIBILITY_MIN ?? process.env.NEXT_PUBLIC_ELIGIBILITY_MIN ?? 1_000_000);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1_000_000;
}

function signatureBytes(value: string) {
  try {
    return bs58.decode(value);
  } catch {
    return Buffer.from(value, "base64");
  }
}

function validWalletSignature(wallet: string, message: string, signature: string) {
  const prefix = Buffer.from("302a300506032b6570032100", "hex");
  const publicKey = createPublicKey({
    key: Buffer.concat([prefix, new PublicKey(wallet).toBuffer()]),
    format: "der",
    type: "spki"
  });
  return verify(null, Buffer.from(message, "utf8"), publicKey, signatureBytes(signature));
}

async function tokenBalance(wallet: string) {
  const mint = validateSolanaMint(sourceMint());
  if (!mint) throw new Error("BUFFETTCOIN token mint is not configured");
  const connection = new Connection(rpcUrl(), "confirmed");
  const accounts = await connection.getParsedTokenAccountsByOwner(new PublicKey(wallet), { mint: new PublicKey(mint) });
  return accounts.value.reduce((sum, account) => {
    const amount = account.account.data.parsed.info.tokenAmount.uiAmount;
    return sum + (Number.isFinite(Number(amount)) ? Number(amount) : 0);
  }, 0);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { challengeId?: string; wallet?: string; signature?: string };
    if (!body.challengeId || !body.wallet || !body.signature) {
      return NextResponse.json({ error: "challengeId, wallet and signature are required" }, { status: 400 });
    }
    const challenge = await getAccessChallenge(body.challengeId);
    if (!challenge || challenge.used_at || Date.parse(challenge.expires_at) <= Date.now()) {
      return NextResponse.json({ error: "Challenge expired or already used" }, { status: 400 });
    }
    if (challenge.wallet !== body.wallet || !validWalletSignature(body.wallet, challenge.message, body.signature)) {
      return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
    }
    const balance = await tokenBalance(body.wallet);
    const minimum = eligibilityMinimum();
    if (balance < minimum) {
      return NextResponse.json({ error: "Wallet is below the BUFFETTCOIN access threshold", balance, minimum }, { status: 403 });
    }
    const session = await createAccessSession(body.wallet, balance);
    await markChallengeUsed(challenge.id);
    return NextResponse.json({ ...session, wallet: body.wallet, balance, minimum });
  } catch (error) {
    console.error("BUFFETTCOIN access verification failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Verification failed" }, { status: 400 });
  }
}
