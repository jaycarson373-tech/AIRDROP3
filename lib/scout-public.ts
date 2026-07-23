const BUFFETTCOIN_CA = "";
const BUFFETTCOIN_X_URL = "https://x.com/i/communities/2029250283063394361";
const OLD_PROJECT_MINTS = new Set([
  "EWdDQyqHoUaSd93MwCpCaYygEPpF8deqLU87Cq5Bpump"
]);

function cleanPublicCa(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || OLD_PROJECT_MINTS.has(trimmed)) return "";
  return trimmed;
}

function cleanPublicUrl(value: string | undefined, configuredMint: string) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || [...OLD_PROJECT_MINTS].some((mint) => trimmed.includes(mint))) return "";
  if (configuredMint && trimmed.includes("pump.fun/coin/") && !trimmed.includes(configuredMint)) return "";
  if (configuredMint && trimmed.includes("dexscreener.com/solana/") && !trimmed.includes(configuredMint)) return "";
  return trimmed;
}

const configuredCa = cleanPublicCa(process.env.NEXT_PUBLIC_CA) || BUFFETTCOIN_CA;
const configuredBuyUrl = cleanPublicUrl(process.env.NEXT_PUBLIC_BUY_URL, configuredCa);
const configuredDexUrl = cleanPublicUrl(process.env.NEXT_PUBLIC_DEXSCREENER_URL, configuredCa);

export const scoutPublicConfig = {
  name: "Buffettcoin",
  ticker: "BUFFETT",
  tokenLabel: "$BUFFETT",
  rewardSymbol: process.env.NEXT_PUBLIC_REWARD_SYMBOL?.trim() || "AAPL.x/BRK.Bx",
  basketLabel: "50% AAPL.x / 50% BRK.Bx",
  basketAssets: ["AAPL.x", "BRK.Bx"],
  contractAddress:
    configuredCa,
  minimumHolding: (() => {
    const parsed = Number(process.env.NEXT_PUBLIC_ELIGIBILITY_MIN ?? 1_000_000);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1_000_000;
  })(),
  epochMinutes: (() => {
    const parsed = Number(process.env.NEXT_PUBLIC_EPOCH_MINUTES ?? 5);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
  })(),
  publicDelaySeconds: (() => {
    const parsed = Number(
      process.env.NEXT_PUBLIC_RUNNER_PUBLIC_DELAY_SECONDS ??
      process.env.NEXT_PUBLIC_SCOUT_PUBLIC_DELAY_SECONDS ??
      60
    );
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 60;
  })(),
  xUrl: process.env.NEXT_PUBLIC_X_URL?.trim() || BUFFETTCOIN_X_URL,
  telegramUrl: process.env.NEXT_PUBLIC_TELEGRAM_URL?.trim() || "",
  buyUrl:
    configuredBuyUrl ||
    (configuredCa ? `https://pump.fun/coin/${configuredCa}` : ""),
  dexScreenerUrl:
    configuredDexUrl ||
    (configuredCa ? `https://dexscreener.com/solana/${configuredCa}` : "")
} as const;

export function shortAddress(value: string, head = 5, tail = 5) {
  if (!value) return "CA pending";
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}
