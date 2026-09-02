import { NextResponse } from "next/server";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, getMint } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ParsedTokenAccountInfo = {
  mint?: string;
  owner?: string;
  tokenAmount?: {
    amount?: string;
  };
};

type PayoutRow = {
  epoch_id: string;
  reward_mint: string | null;
  reward_asset: string | null;
  reward_amount: string | number | null;
  status: string | null;
  tx_sig: string | null;
  updated_at: string | null;
  created_at: string | null;
};

type HolderStateRow = {
  wallet: string;
  permanently_ineligible: boolean | null;
  ineligible_reason: string | null;
};

const EPOCH_MS = 5 * 60 * 1000;
const OFFICIAL_NEURAL_MINT = "PrekqLJvJ3qVdXmBGDiexvwUTF4rLFDa6HWS4HJbw9S";

function env(name: string) {
  return process.env[name] || process.env[`NEXT_PUBLIC_${name}`];
}

function supabaseConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

function supabaseHeaders(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`
  };
}

function rpcUrl() {
  return env("HELIUS_RPC_URL") ?? env("SOLANA_RPC_URL") ?? "https://api.mainnet-beta.solana.com";
}

function numberEnv(name: string) {
  const value = env(name);
  if (value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sourceMintValue() {
  return env("BRAINROT_MINT") ?? env("SOURCE_TOKEN_MINT") ?? null;
}

function rewardMintValue() {
  const configured = env("NEURAL_MINT") ?? env("REWARD_TOKEN_MINT") ?? OFFICIAL_NEURAL_MINT;
  return configured === OFFICIAL_NEURAL_MINT ? configured : OFFICIAL_NEURAL_MINT;
}

function isNeuralPayout(row: PayoutRow) {
  const asset = row.reward_asset?.replace(/^\$/, "").trim().toUpperCase();
  return row.reward_mint === rewardMintValue() || asset === "NEURAL";
}

function nextDropTime() {
  return new Date(Math.floor(Date.now() / EPOCH_MS + 1) * EPOCH_MS).toISOString();
}

function toNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function rawToUi(raw: bigint, decimals: number) {
  return Number(raw) / 10 ** decimals;
}

function holderPct(rawBalance: bigint, rawSupply: bigint) {
  if (rawSupply <= 0n) return 0;
  return Number((rawBalance * 1_000_000n) / rawSupply) / 10_000;
}

function parsedTokenInfo(data: unknown) {
  return (data as { parsed?: { info?: ParsedTokenAccountInfo } })?.parsed?.info ?? null;
}

async function tokenProgramForMint(connection: Connection, mint: PublicKey) {
  const info = await connection.getAccountInfo(mint, "confirmed");
  if (!info) throw new Error(`Mint not found: ${mint.toBase58()}`);
  if (info.owner.equals(TOKEN_PROGRAM_ID)) return TOKEN_PROGRAM_ID;
  if (info.owner.equals(TOKEN_2022_PROGRAM_ID)) return TOKEN_2022_PROGRAM_ID;
  throw new Error(`Unsupported token program: ${info.owner.toBase58()}`);
}

async function getJson<T>(url: string, key: string) {
  const response = await fetch(url, {
    headers: supabaseHeaders(key),
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`Supabase error ${response.status}`);
  return (await response.json()) as T;
}

async function settledPayouts(wallet: string) {
  const config = supabaseConfig();
  if (!config) return null;

  const rows = await getJson<PayoutRow[]>(
    `${config.url}/rest/v1/payouts?select=epoch_id,reward_mint,reward_asset,reward_amount,status,tx_sig,updated_at,created_at&wallet=eq.${encodeURIComponent(
      wallet
    )}&status=eq.settled&order=updated_at.desc&limit=50`,
    config.key
  );
  return rows.filter(isNeuralPayout);
}

async function holderState(wallet: string) {
  const config = supabaseConfig();
  if (!config) return null;

  try {
    const rows = await getJson<HolderStateRow[]>(
      `${config.url}/rest/v1/holder_states?select=wallet,permanently_ineligible,ineligible_reason&wallet=eq.${encodeURIComponent(
        wallet
      )}&limit=1`,
      config.key
    );
    return rows[0] ?? null;
  } catch (error) {
    console.warn("wallet holder-state lookup failed", error);
    return null;
  }
}

function ineligibleReasonLabel(reason: string | null | undefined) {
  if (reason === "balance_decreased") return "Not eligible - balance decreased";
  if (reason === "dropped_below_threshold") return "Not eligible - below confirmed minimum";
  if (reason === "dropped_below_threshold_or_sold") return "Not eligible - sold or below confirmed minimum";
  return "Not eligible - holder-state rule";
}

export async function GET(_request: Request, context: { params: Promise<{ wallet: string }> }) {
  const { wallet: walletParam } = await context.params;
  let wallet: PublicKey;

  try {
    wallet = new PublicKey(walletParam);
  } catch {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  const sourceMintRaw = sourceMintValue();
  const rewardMintRaw = rewardMintValue();
  if (!sourceMintRaw || !rewardMintRaw) {
    return NextResponse.json({
      configured: false,
      wallet: wallet.toBase58(),
      balance: null,
      eligibilityStatus: "Awaiting live data",
      allocationWeight: null,
      nextDistributionTime: nextDropTime(),
      totalRewardReceived: null,
      history: []
    });
  }

  try {
    const sourceMint = new PublicKey(sourceMintRaw);
    new PublicKey(rewardMintRaw);
    const connection = new Connection(rpcUrl(), "confirmed");
    const tokenProgram = await tokenProgramForMint(connection, sourceMint);
    const mintInfo = await getMint(connection, sourceMint, "confirmed", tokenProgram);
    const accounts = await connection.getParsedTokenAccountsByOwner(wallet, { programId: tokenProgram }, "confirmed");
    const rawBalance = accounts.value.reduce((sum, account) => {
      const parsed = parsedTokenInfo(account.account.data);
      if (parsed?.mint !== sourceMint.toBase58() || !parsed.tokenAmount?.amount) return sum;
      return sum + BigInt(parsed.tokenAmount.amount);
    }, 0n);

    const balance = rawToUi(rawBalance, mintInfo.decimals);
    const min = numberEnv("ELIGIBILITY_MIN");
    const maxPct = numberEnv("MAX_HOLDER_PCT") ?? 4;
    const pct = holderPct(rawBalance, mintInfo.supply);
    const state = await holderState(wallet.toBase58());
    let eligibilityStatus = "Awaiting confirmed eligibility requirements";

    if (state?.permanently_ineligible || state?.ineligible_reason) {
      eligibilityStatus = ineligibleReasonLabel(state.ineligible_reason);
    } else if (min !== null && balance < min) {
      eligibilityStatus = "Not eligible - below confirmed minimum";
    } else if (pct > maxPct) {
      eligibilityStatus = "Not eligible - above max wallet cap";
    } else if (min !== null) {
      eligibilityStatus = "Eligible";
    }

    const payouts = await settledPayouts(wallet.toBase58()).catch((error) => {
      console.warn("wallet payout lookup failed", error);
      return null;
    });
    const totalRewardReceived = payouts ? payouts.reduce((sum, row) => sum + toNumber(row.reward_amount), 0) : null;
    const history =
      payouts?.map((row) => ({
        epochId: row.epoch_id,
        time: row.updated_at ?? row.created_at ?? row.epoch_id,
        rewardAmount: toNumber(row.reward_amount),
        txSig: row.tx_sig,
        status: row.status ?? "unknown"
      })) ?? [];

    return NextResponse.json({
      configured: true,
      wallet: wallet.toBase58(),
      balance,
      eligibilityStatus,
      allocationWeight: eligibilityStatus === "Eligible" ? "Calculated at distribution time" : null,
      nextDistributionTime: nextDropTime(),
      totalRewardReceived,
      history
    });
  } catch (error) {
    console.error("wallet route failed", error);
    return NextResponse.json({
      configured: false,
      wallet: wallet.toBase58(),
      balance: null,
      eligibilityStatus: "Awaiting live data",
      allocationWeight: null,
      nextDistributionTime: nextDropTime(),
      totalRewardReceived: null,
      history: []
    });
  }
}
