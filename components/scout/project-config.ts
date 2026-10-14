function publicValue(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

const officialNeuralMint = "PrekqLJvJ3qVdXmBGDiexvwUTF4rLFDa6HWS4HJbw9S";
const configuredNeuralMint =
  publicValue(process.env.NEXT_PUBLIC_NEURAL_MINT) ??
  publicValue(process.env.NEXT_PUBLIC_REWARD_TOKEN_MINT);

export const projectConfig = {
  brainrotMint:
    publicValue(process.env.NEXT_PUBLIC_BRAINROT_MINT) ??
    publicValue(process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT),
  neuralMint:
    configuredNeuralMint === officialNeuralMint ? configuredNeuralMint : officialNeuralMint,
  projectXUrl: publicValue(process.env.NEXT_PUBLIC_BRAINROT_X_URL),
  communityUrl: publicValue(process.env.NEXT_PUBLIC_BRAINROT_COMMUNITY_URL),
  pumpFunTokenConfigured: Boolean(publicValue(process.env.NEXT_PUBLIC_PUMPFUN_URL)),
  pumpFunUrl:
    publicValue(process.env.NEXT_PUBLIC_PUMPFUN_URL) ??
    "https://pump.fun",
  dexScreenerPair: publicValue(process.env.NEXT_PUBLIC_DEXSCREENER_PAIR),
  pumpMoneyMint:
    publicValue(process.env.NEXT_PUBLIC_BRAINROT_MINT) ??
    publicValue(process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT),
  rewardApiUrl: publicValue(process.env.NEXT_PUBLIC_REWARD_API_URL),
  leaderboardApiUrl: publicValue(process.env.NEXT_PUBLIC_LEADERBOARD_API_URL),
  explorerBaseUrl: publicValue(process.env.NEXT_PUBLIC_EXPLORER_BASE_URL) ?? "https://solscan.io"
} as const;

export const legacyProjectConfig = {
  pumpMoneyMint: projectConfig.brainrotMint
} as const;

export function explorerTxUrl(signature: string) {
  return `${projectConfig.explorerBaseUrl.replace(/\/$/, "")}/tx/${signature}`;
}
