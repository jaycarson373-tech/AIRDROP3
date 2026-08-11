function publicValue(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export const projectConfig = {
  pumpMoneyMint: publicValue(process.env.NEXT_PUBLIC_PUMP_MONEY_MINT),
  buyUrl: publicValue(process.env.NEXT_PUBLIC_PUMP_MONEY_BUY_URL),
  projectXUrl: publicValue(process.env.NEXT_PUBLIC_PUMP_MONEY_X_URL),
  communityUrl: publicValue(process.env.NEXT_PUBLIC_PUMP_MONEY_COMMUNITY_URL),
  rewardApiUrl: publicValue(process.env.NEXT_PUBLIC_REWARD_API_URL),
  leaderboardApiUrl: publicValue(process.env.NEXT_PUBLIC_LEADERBOARD_API_URL),
  explorerBaseUrl: publicValue(process.env.NEXT_PUBLIC_EXPLORER_BASE_URL) ?? "https://solscan.io"
} as const;

export function explorerTxUrl(signature: string) {
  return `${projectConfig.explorerBaseUrl.replace(/\/$/, "")}/tx/${signature}`;
}
