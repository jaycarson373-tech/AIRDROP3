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
const workerEnabled = boolEnv("WORKER_ENABLED", false);
const rewardMode = rewardModeEnv();
const configuredRewardTokenMint = optionalPublicKeyEnv("REWARD_TOKEN_MINT");
const configuredRewardTokenMints = publicKeyListEnv("REWARD_TOKEN_MINTS");
const rewardTokenMints = configuredRewardTokenMints.length
  ? configuredRewardTokenMints
  : configuredRewardTokenMint
    ? [configuredRewardTokenMint]
    : [];
if (workerEnabled && rewardMode === "token" && !rewardTokenMints.length) {
  throw new Error("Missing required env REWARD_TOKEN_MINT or REWARD_TOKEN_MINTS when REWARD_MODE=token");
}
const configuredRewardTokenSymbols = stringListEnv("REWARD_TOKEN_SYMBOLS");
const configuredRewardTokenSplitBps = stringListEnv("REWARD_TOKEN_SPLIT_BPS").map((value) => Number(value));
const rewardSplitEnabled = configuredRewardTokenSplitBps.length > 0;
const configuredBagworkRewardWallet =
  optionalPublicKeyEnv("BAGWORK_REWARD_WALLET_PUBLIC_KEY") ?? optionalPublicKeyEnv("PFP_REWARD_WALLET_PUBLIC_KEY");
const configuredBagworkRewardBps = intEnv("BAGWORK_REWARD_BPS", intEnv("PFP_REWARD_BPS", 5000));
const configuredRewardBuyBps = intEnv("REWARD_BUY_BPS", 5000);
const solanaCluster = process.env.SOLANA_CLUSTER ?? "mainnet-beta";
const configuredEpochMinutes = Math.max(1, intEnv("EPOCH_MINUTES", 5));
const configuredAirdropBatchSize = Math.max(1, intEnv("AIRDROP_BATCH_SIZE", 4));

if (
  rewardSplitEnabled &&
  (configuredRewardTokenSplitBps.some((value) => !Number.isInteger(value) || value < 0) ||
    configuredRewardTokenSplitBps.reduce((sum, value) => sum + value, 0) !== 10_000)
) {
  throw new Error("REWARD_TOKEN_SPLIT_BPS must contain non-negative integers totaling 10000");
}
if (rewardSplitEnabled && rewardTokenMints.length > 0 && configuredRewardTokenSplitBps.length !== rewardTokenMints.length) {
  throw new Error("REWARD_TOKEN_SPLIT_BPS must match REWARD_TOKEN_MINTS");
}
if (workerEnabled && rewardSplitEnabled && rewardTokenMints.length < 2) {
  throw new Error("REWARD_TOKEN_SPLIT_BPS requires at least two REWARD_TOKEN_MINTS");
}
if (rewardSplitEnabled && configuredBagworkRewardWallet && configuredBagworkRewardBps > 0) {
  throw new Error("Multi-asset reward splitting cannot be combined with BAGWORK/PFP reward routing");
}

if (solanaCluster !== "mainnet-beta" && solanaCluster !== "devnet") {
  throw new Error(`Invalid SOLANA_CLUSTER=${solanaCluster}; expected mainnet-beta or devnet`);
}

export const config = {
  heliusRpcUrl: required("HELIUS_RPC_URL"),
  sourceTokenMint: workerEnabled
    ? publicKeyEnv("SOURCE_TOKEN_MINT")
    : optionalPublicKeyEnv("SOURCE_TOKEN_MINT") ?? new PublicKey("11111111111111111111111111111111"),
  rewardMode,
  rewardTokenMint: rewardTokenMints[0] ?? new PublicKey("So11111111111111111111111111111111111111112"),
  rewardTokenMints,
  rewardTokenSymbol: configuredRewardTokenSymbols[0] ?? process.env.NEXT_PUBLIC_REWARD_SYMBOL ?? "reward",
  rewardTokenSymbols: configuredRewardTokenSymbols,
  rewardTokenSplitBps: configuredRewardTokenSplitBps,
  rewardSplitEnabled,
  rewardRotationOffset: intEnv("REWARD_ROTATION_OFFSET", 0),
  treasuryWalletSecret: required("TREASURY_WALLET_SECRET"),
  supabaseUrl: required("SUPABASE_URL"),
  supabaseServiceRole: required("SUPABASE_SERVICE_ROLE"),
  scoutDynamicSelectionEnabled: boolEnv("SCOUT_DYNAMIC_SELECTION_ENABLED", false),

  workerEnabled,
  claimEnabled: boolEnv("CLAIM_ENABLED", false),
  buyEnabled: boolEnv("BUY_ENABLED", false),
  airdropEnabled: boolEnv("AIRDROP_ENABLED", false),
  // Archived tournament modules remain type-safe for migration replay, but are
  // unreachable from the Pump Money scheduler and cannot be enabled by env.
  casinoModeEnabled: false,
  casinoPayoutsEnabled: false,
  solanaCluster,
  switchboardRandomnessEnabled: false,
  switchboardComputeUnitPriceMicroLamports: 0,
  switchboardComputeLimitMultiple: 1,
  switchboardRetryAttempts: 1,
  switchboardRetryDelayMs: 2_000,
  casinoRoundMinutes: configuredEpochMinutes,
  casinoRoundPayoutBps: 0,
  casinoJackpotBps: 0,
  casinoTopThreeSplitBps: [0, 0, 0],
  casinoJackpotInterval: 25,
  casinoPollMs: 5_000,

  epochMinutes: configuredEpochMinutes,
  eligibilityMin: numberEnv("ELIGIBILITY_MIN", 1_000_000),
  maxWalletsPerEpoch: Math.max(1, intEnv("MAX_WALLETS_PER_EPOCH", 150)),
  drawWinnerCount: Math.max(1, intEnv("DRAW_WINNER_COUNT", 10)),
  maxHolderPct: numberEnv("MAX_HOLDER_PCT", 4),
  excludeWallets: workerEnabled ? optionalWallets("EXCLUDE_WALLETS") : [],

  swapBalanceBps: Math.min(10_000, Math.max(1, intEnv("SWAP_BALANCE_BPS", 9000))),
  rewardBuyBps: Math.min(10_000, Math.max(0, configuredRewardBuyBps)),
  pfpRewardWallet: configuredBagworkRewardWallet,
  pfpRewardBps: configuredBagworkRewardWallet ? Math.min(10_000, Math.max(0, configuredBagworkRewardBps)) : 0,
  minSolReserve: Math.max(0.3, numberEnv("MIN_SOL_RESERVE", 0.3)),
  airdropSolReserve: Math.max(0.05, numberEnv("AIRDROP_SOL_RESERVE", 0.05)),
  airdropBatchSize: configuredAirdropBatchSize,
  airdropRewardBps: Math.min(10_000, Math.max(1, intEnv("AIRDROP_REWARD_BPS", 10000))),
  swapSlippageBps: Math.max(1, intEnv("SWAP_SLIPPAGE_BPS", 300)),
  priorityFeeSol: numberEnv("PRIORITY_FEE_SOL", 0.000001),
  minRewardRawToAirdrop: BigInt(Math.max(0, intEnv("MIN_REWARD_RAW_TO_AIRDROP", 1)))
};

export function activateRewardForEpoch(epochId: string) {
  if (config.rewardMode !== "token" || config.rewardSplitEnabled || config.rewardTokenMints.length <= 1) return;
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
  config.rewardTokenSymbol = symbol.replace(/^\$/, "") || "PUMP";
}

export function treasuryKeypair() {
  cachedTreasury ??= Keypair.fromSecretKey(parseSecret(config.treasuryWalletSecret));
  return cachedTreasury;
}
