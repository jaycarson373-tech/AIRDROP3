const unavailablePublicLink: string | null = null;

export const scoutPublicConfig = {
  name: "Casino",
  ticker: "CASINO",
  tokenLabel: "$CASINO",
  rewardSymbol: "TOKENS",
  basketLabel: "Active casino round",
  basketAssets: ["PONG", "CRASH", "ROULETTE", "DUEL", "COINFLIP"],
  contractAddress: unavailablePublicLink,
  minimumHolding: (() => {
    const parsed = Number(process.env.NEXT_PUBLIC_ELIGIBILITY_MIN ?? 1_000_000);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1_000_000;
  })(),
  epochMinutes: (() => {
    const parsed = Number(process.env.NEXT_PUBLIC_EPOCH_MINUTES ?? 5);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 15;
  })(),
  publicDelaySeconds: (() => {
    const parsed = Number(
      process.env.NEXT_PUBLIC_SCOUT_PUBLIC_DELAY_SECONDS ??
      60
    );
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 60;
  })(),
  xUrl: unavailablePublicLink,
  telegramUrl: process.env.NEXT_PUBLIC_TELEGRAM_URL?.trim() || "",
  buyUrl: unavailablePublicLink,
  dexScreenerUrl: unavailablePublicLink
} as const;

export function shortAddress(value: string, head = 5, tail = 5) {
  if (!value) return "No address";
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}
