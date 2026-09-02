import type { NextConfig } from "next";

const officialNeuralMint = "PrekqLJvJ3qVdXmBGDiexvwUTF4rLFDa6HWS4HJbw9S";
const configuredNeuralMint =
  process.env.NEXT_PUBLIC_NEURAL_MINT ??
  process.env.NEURAL_MINT ??
  process.env.NEXT_PUBLIC_REWARD_TOKEN_MINT ??
  process.env.REWARD_TOKEN_MINT;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1"],
  env: {
    NEXT_PUBLIC_NEURAL_MINT: configuredNeuralMint === officialNeuralMint ? configuredNeuralMint : officialNeuralMint,
    NEXT_PUBLIC_BRAINROT_MINT:
      process.env.NEXT_PUBLIC_BRAINROT_MINT ??
      process.env.BRAINROT_MINT ??
      process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT ??
      process.env.SOURCE_TOKEN_MINT ??
      ""
  }
};

export default nextConfig;
