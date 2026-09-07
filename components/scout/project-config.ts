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
  buyUrl:
    publicValue(process.env.NEXT_PUBLIC_BUY_URL) ??
    publicValue(process.env.NEXT_PUBLIC_BRAINROT_BUY_URL),
  projectXUrl: null,
  communityUrl: publicValue(process.env.NEXT_PUBLIC_BRAINROT_COMMUNITY_URL),
  stonkUrl:
    publicValue(process.env.NEXT_PUBLIC_STONK_URL) ??
    "https://www.stonkfun.xyz",
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
