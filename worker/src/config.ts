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
// The Casino product is archived on its checkpoint branch. GOAT never enters
// tournament settlement mode, even if a stale deployment variable remains.
const casinoModeEnabled = false;
const casinoPayoutsEnabled = false;
const switchboardRandomnessEnabled = boolEnv("SWITCHBOARD_RANDOMNESS_ENABLED", false);
const solanaCluster = process.env.SOLANA_CLUSTER ?? "mainnet-beta";
const configuredEpochMinutes = Math.max(1, intEnv("EPOCH_MINUTES", 5));
const casinoRoundMinutes = Math.max(1, intEnv("CASINO_ROUND_MINUTES", 5));
const casinoRoundPayoutBps = Math.min(10_000, Math.max(0, intEnv("CASINO_ROUND_PAYOUT_BPS", 8_000)));
const casinoJackpotBps = Math.min(10_000, Math.max(0, intEnv("CASINO_JACKPOT_BPS", 2_000)));
const casinoTopThreeSplitBps = stringListEnv("CASINO_TOP3_SPLIT_BPS").length
  ? stringListEnv("CASINO_TOP3_SPLIT_BPS").map((value) => Number(value))
  : [5_000, 3_000, 2_000];
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

if (casinoModeEnabled && rewardMode !== "sol") {
  throw new Error("CASINO_MODE_ENABLED requires REWARD_MODE=sol");
}
if (casinoModeEnabled && configuredEpochMinutes !== casinoRoundMinutes) {
  throw new Error(
    `Casino schedule mismatch: EPOCH_MINUTES=${configuredEpochMinutes} but CASINO_ROUND_MINUTES=${casinoRoundMinutes}`
  );
}
if (casinoRoundPayoutBps + casinoJackpotBps !== 10_000) {
  throw new Error("CASINO_ROUND_PAYOUT_BPS + CASINO_JACKPOT_BPS must equal 10000");
}
if (
  casinoTopThreeSplitBps.length !== 3 ||
  casinoTopThreeSplitBps.some((value) => !Number.isInteger(value) || value < 0) ||
  casinoTopThreeSplitBps.reduce((sum, value) => sum + value, 0) !== 10_000
) {
  throw new Error("CASINO_TOP3_SPLIT_BPS must contain three non-negative integers totaling 10000");
}
if (casinoPayoutsEnabled && !casinoModeEnabled) {
  throw new Error("CASINO_PAYOUTS_ENABLED requires CASINO_MODE_ENABLED=true");
}
if (casinoPayoutsEnabled && !switchboardRandomnessEnabled) {
  throw new Error("CASINO_PAYOUTS_ENABLED requires SWITCHBOARD_RANDOMNESS_ENABLED=true");
}
if (casinoModeEnabled && configuredAirdropBatchSize < 3) {
  throw new Error("Casino settlement requires AIRDROP_BATCH_SIZE>=3 so the top-three payout is atomic");
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
  casinoModeEnabled,
  casinoPayoutsEnabled,
  solanaCluster,
  switchboardRandomnessEnabled,
  switchboardComputeUnitPriceMicroLamports: Math.max(
    0,
    intEnv("SWITCHBOARD_COMPUTE_UNIT_PRICE_MICROLAMPORTS", 75_000)
  ),
  switchboardComputeLimitMultiple: Math.max(
    1,
    numberEnv("SWITCHBOARD_COMPUTE_LIMIT_MULTIPLE", 1.5)
  ),
  switchboardRetryAttempts: Math.max(1, intEnv("SWITCHBOARD_RETRY_ATTEMPTS", 5)),
  switchboardRetryDelayMs: Math.max(500, intEnv("SWITCHBOARD_RETRY_DELAY_MS", 2_000)),
  casinoRoundMinutes,
  casinoRoundPayoutBps,
  casinoJackpotBps,
  casinoTopThreeSplitBps,
  casinoJackpotInterval: Math.max(1, intEnv("CASINO_JACKPOT_INTERVAL", 25)),
  casinoPollMs: Math.max(2_000, intEnv("CASINO_WORKER_POLL_MS", 5_000)),

  epochMinutes: configuredEpochMinutes,
  eligibilityMin: numberEnv("ELIGIBILITY_MIN", 1_000_000),
  maxWalletsPerEpoch: Math.max(1, intEnv("MAX_WALLETS_PER_EPOCH", 150)),
  maxHolderPct: numberEnv("MAX_HOLDER_PCT", 4),
  excludeWallets: optionalWallets("EXCLUDE_WALLETS"),

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
  config.rewardTokenSymbol = symbol.replace(/^\$/, "") || "GOAT asset";
}

export function treasuryKeypair() {
  cachedTreasury ??= Keypair.fromSecretKey(parseSecret(config.treasuryWalletSecret));
  return cachedTreasury;
}
