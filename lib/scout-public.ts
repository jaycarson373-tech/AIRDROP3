const OLD_PROJECT_MINTS = new Set([
  "EWdDQyqHoUaSd93MwCpCaYygEPpF8deqLU87Cq5Bpump",
  "3dFiGivB2wRHQPXybNQTK2w2dHS6dR769cuJsVwypump",
  "8Ab3XVBjvRB2p6sunVJgAiHGmwJA8hSgbs36kZFxpump",
  "8ZG2jEdmEp5t31aikFFHJrYU4JxJjUGRTjxEpPSipump",
  "2B2VJHTaxBQyKTE9Cre96Aku7TuURaeEa44MiKLkpump",
  "8TUWgrMcBMtviLyuJWUvpXLx8RUUYDKK2Bp7qUVJpump"
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

const defaultCstrCa = "3h2DwifvFhxhVvR7MesbMo9xb13QTF5ZtTAyqz8Cpump";
const configuredCa = cleanPublicCa(
  process.env.NEXT_PUBLIC_CA || process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT || defaultCstrCa
);
const configuredBuyUrl = cleanPublicUrl(process.env.NEXT_PUBLIC_BUY_URL, configuredCa);
const configuredDexUrl = cleanPublicUrl(process.env.NEXT_PUBLIC_DEXSCREENER_URL, configuredCa);

export const scoutPublicConfig = {
  name: "Casino Strategy",
  ticker: "CASINO",
  tokenLabel: "$CASINO",
  rewardSymbol: "TOKENS",
  basketLabel: "Active casino round",
  basketAssets: ["PONG", "CRASH", "ROULETTE", "DUEL", "COINFLIP"],
  contractAddress: configuredCa || null,
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
  xUrl: "https://x.com/CSTR_sol",
  telegramUrl: process.env.NEXT_PUBLIC_TELEGRAM_URL?.trim() || "",
  buyUrl: configuredBuyUrl || (configuredCa ? `https://pump.fun/coin/${configuredCa}` : null),
  dexScreenerUrl: configuredDexUrl || (configuredCa ? `https://dexscreener.com/solana/${configuredCa}` : null)
} as const;

export function shortAddress(value: string, head = 5, tail = 5) {
  if (!value) return "No address";
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}
