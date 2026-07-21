import "dotenv/config";
import bs58 from "bs58";
import { Keypair, PublicKey } from "@solana/web3.js";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env ${name}`);
  return value;
}

function boolEnv(name: string, defaultValue: boolean) {
  const value = process.env[name];
  if (value === undefined || value === "") return defaultValue;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function numberEnv(name: string, defaultValue: number) {
  const value = process.env[name];
  if (value === undefined || value === "") return defaultValue;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid number env ${name}=${value}`);
  return parsed;
}

function intEnv(name: string, defaultValue: number) {
  return Math.floor(numberEnv(name, defaultValue));
}

function publicKeyEnv(name: string) {
  return new PublicKey(required(name));
}

function optionalPublicKeyEnv(name: string) {
  const value = process.env[name];
  return value ? new PublicKey(value) : null;
}

function publicKeyListEnv(name: string) {
  const value = process.env[name];
  if (!value) return [];
  return value
    .split(",")
    .map((mint) => mint.trim())
    .filter(Boolean)
    .map((mint) => new PublicKey(mint));
}

function stringListEnv(name: string) {
  const value = process.env[name];
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function rewardModeEnv() {
  const rawValue = process.env.REWARD_MODE ?? "sol";
  const value = rawValue.toLowerCase();
  if (value === "sol" || value === "token") return value;
  if (process.env.REWARD_TOKEN_MINT) {
    try {
      new PublicKey(rawValue);
      console.warn(
        `Invalid REWARD_MODE=${rawValue}; it looks like a mint. Continuing with REWARD_MODE=token because REWARD_TOKEN_MINT is set.`
      );
      return "token";
    } catch {
      // Fall through to the explicit config error below.
    }
  }
  throw new Error(`Invalid REWARD_MODE=${value}; expected sol or token`);
}

function optionalWallets(name: string) {
  const value = process.env[name];
  if (!value) return [];
  return value
    .split(",")
    .map((wallet) => wallet.trim())
    .filter(Boolean)
    .map((wallet) => new PublicKey(wallet));
}

function parseSecret(raw: string) {
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    return Uint8Array.from(JSON.parse(trimmed) as number[]);
  }
  return bs58.decode(trimmed);
}

let cachedTreasury: Keypair | null = null;
const rewardMode = rewardModeEnv();
const configuredRewardTokenMint = optionalPublicKeyEnv("REWARD_TOKEN_MINT");
const configuredRewardTokenMints = publicKeyListEnv("REWARD_TOKEN_MINTS");
const rewardTokenMints = configuredRewardTokenMints.length
  ? configuredRewardTokenMints
  : configuredRewardTokenMint
    ? [configuredRewardTokenMint]
    : [];
if (rewardMode === "token" && !rewardTokenMints.length) {
  throw new Error("Missing required env REWARD_TOKEN_MINT or REWARD_TOKEN_MINTS when REWARD_MODE=token");
}
const configuredRewardTokenSymbols = stringListEnv("REWARD_TOKEN_SYMBOLS");
const configuredBagworkRewardWallet =
  optionalPublicKeyEnv("BAGWORK_REWARD_WALLET_PUBLIC_KEY") ?? optionalPublicKeyEnv("PFP_REWARD_WALLET_PUBLIC_KEY");
const configuredBagworkRewardBps = intEnv("BAGWORK_REWARD_BPS", intEnv("PFP_REWARD_BPS", 5000));
const configuredRewardBuyBps = intEnv("REWARD_BUY_BPS", 5000);

export const config = {
  heliusRpcUrl: required("HELIUS_RPC_URL"),
  sourceTokenMint: publicKeyEnv("SOURCE_TOKEN_MINT"),
  rewardMode,
  rewardTokenMint: rewardTokenMints[0] ?? new PublicKey("So11111111111111111111111111111111111111112"),
  rewardTokenMints,
  rewardTokenSymbol: configuredRewardTokenSymbols[0] ?? process.env.NEXT_PUBLIC_REWARD_SYMBOL ?? "reward",
  rewardTokenSymbols: configuredRewardTokenSymbols,
  rewardRotationOffset: intEnv("REWARD_ROTATION_OFFSET", 0),
  treasuryWalletSecret: required("TREASURY_WALLET_SECRET"),
  supabaseUrl: required("SUPABASE_URL"),
  supabaseServiceRole: required("SUPABASE_SERVICE_ROLE"),
  scoutDynamicSelectionEnabled: boolEnv("SCOUT_DYNAMIC_SELECTION_ENABLED", false),

  claimEnabled: boolEnv("CLAIM_ENABLED", false),
  buyEnabled: boolEnv("BUY_ENABLED", false),
  airdropEnabled: boolEnv("AIRDROP_ENABLED", false),

  epochMinutes: Math.max(1, intEnv("EPOCH_MINUTES", 5)),
  eligibilityMin: numberEnv("ELIGIBILITY_MIN", 2_500_000),
  maxWalletsPerEpoch: Math.max(1, intEnv("MAX_WALLETS_PER_EPOCH", 150)),
  maxHolderPct: numberEnv("MAX_HOLDER_PCT", 4),
  excludeWallets: optionalWallets("EXCLUDE_WALLETS"),

  swapBalanceBps: Math.min(10_000, Math.max(1, intEnv("SWAP_BALANCE_BPS", 9000))),
  rewardBuyBps: Math.min(10_000, Math.max(0, configuredRewardBuyBps)),
  pfpRewardWallet: configuredBagworkRewardWallet,
  pfpRewardBps: configuredBagworkRewardWallet ? Math.min(10_000, Math.max(0, configuredBagworkRewardBps)) : 0,
  minSolReserve: Math.max(0.3, numberEnv("MIN_SOL_RESERVE", 0.3)),
  airdropSolReserve: Math.max(0.05, numberEnv("AIRDROP_SOL_RESERVE", 0.05)),
  airdropBatchSize: Math.max(1, intEnv("AIRDROP_BATCH_SIZE", 4)),
  airdropRewardBps: Math.min(10_000, Math.max(1, intEnv("AIRDROP_REWARD_BPS", 10000))),
  swapSlippageBps: Math.max(1, intEnv("SWAP_SLIPPAGE_BPS", 300)),
  priorityFeeSol: numberEnv("PRIORITY_FEE_SOL", 0.000001),
  minRewardRawToAirdrop: BigInt(Math.max(0, intEnv("MIN_REWARD_RAW_TO_AIRDROP", 1)))
};

export function activateRewardForEpoch(epochId: string) {
  if (config.rewardMode !== "token" || config.rewardTokenMints.length <= 1) return;
  const epochMs = config.epochMinutes * 60_000;
  const epochNumber = Math.floor(Date.parse(epochId) / epochMs);
  const index =
    (((epochNumber + config.rewardRotationOffset) % config.rewardTokenMints.length) + config.rewardTokenMints.length) %
    config.rewardTokenMints.length;
  config.rewardTokenMint = config.rewardTokenMints[index];
  config.rewardTokenSymbol = config.rewardTokenSymbols[index] ?? `asset ${index + 1}`;
  console.log(
    `[${epochId}] active reward rotation ${index + 1}/${config.rewardTokenMints.length}: ${config.rewardTokenSymbol} ${config.rewardTokenMint.toBase58()}`
  );
}

export function activateRewardMint(mint: PublicKey, symbol: string) {
  config.rewardTokenMint = mint;
  config.rewardTokenSymbol = symbol.replace(/^\$/, "") || "SCOUT signal";
}

export function treasuryKeypair() {
  cachedTreasury ??= Keypair.fromSecretKey(parseSecret(config.treasuryWalletSecret));
  return cachedTreasury;
}
