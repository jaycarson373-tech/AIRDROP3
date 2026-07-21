export const scoutPublicConfig = {
  name: "Runner",
  ticker: "RUNNER",
  tokenLabel: "$RUNNER",
  contractAddress:
    process.env.NEXT_PUBLIC_CA?.trim() ||
    process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT?.trim() ||
    "",
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
  xUrl: process.env.NEXT_PUBLIC_X_URL?.trim() || "",
  telegramUrl: process.env.NEXT_PUBLIC_TELEGRAM_URL?.trim() || "",
  buyUrl:
    process.env.NEXT_PUBLIC_BUY_URL?.trim() ||
    (process.env.NEXT_PUBLIC_CA?.trim()
      ? `https://pump.fun/coin/${process.env.NEXT_PUBLIC_CA.trim()}`
      : ""),
  dexScreenerUrl:
    process.env.NEXT_PUBLIC_DEXSCREENER_URL?.trim() ||
    (process.env.NEXT_PUBLIC_CA?.trim()
      ? `https://dexscreener.com/solana/${process.env.NEXT_PUBLIC_CA.trim()}`
      : "")
} as const;

export function shortAddress(value: string, head = 5, tail = 5) {
  if (!value) return "CA pending";
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}
