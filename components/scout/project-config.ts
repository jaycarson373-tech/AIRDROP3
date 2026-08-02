function publicValue(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export const projectConfig = {
  goatMint: publicValue(process.env.NEXT_PUBLIC_GOAT_MINT)
    ?? publicValue(process.env.NEXT_PUBLIC_CA)
    ?? publicValue(process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT),
  buyUrl: publicValue(process.env.NEXT_PUBLIC_BUY_URL),
  projectXUrl: publicValue(process.env.NEXT_PUBLIC_X_URL),
  communityUrl: publicValue(process.env.NEXT_PUBLIC_COMMUNITY_URL)
    ?? publicValue(process.env.NEXT_PUBLIC_TELEGRAM_URL),
  poorGoatXUrl: publicValue(process.env.NEXT_PUBLIC_POOR_GOAT_X_URL),
  poorGoatWalletUrl: publicValue(process.env.NEXT_PUBLIC_POOR_GOAT_WALLET_URL),
  poorGoatProofUrl: publicValue(process.env.NEXT_PUBLIC_POOR_GOAT_PROOF_URL),
  rewardApiUrl: publicValue(process.env.NEXT_PUBLIC_REWARD_API_URL),
  leaderboardApiUrl: publicValue(process.env.NEXT_PUBLIC_LEADERBOARD_API_URL),
  explorerBaseUrl: publicValue(process.env.NEXT_PUBLIC_EXPLORER_BASE_URL) ?? "https://solscan.io"
} as const;

export function explorerTxUrl(signature: string) {
  return `${projectConfig.explorerBaseUrl.replace(/\/$/, "")}/tx/${signature}`;
}
