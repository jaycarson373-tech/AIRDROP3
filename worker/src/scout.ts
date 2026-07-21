import { PublicKey } from "@solana/web3.js";
import { activateRewardMint, config } from "./config.js";
import { supabase } from "./db.js";

type ActiveSignalRow = {
  id: string;
  mint: string;
  symbol: string;
  status: string;
};

export async function activateScoutSignalForEpoch(epochId: string) {
  if (!config.scoutDynamicSelectionEnabled || config.rewardMode !== "token") return null;
  const result = await supabase
    .from("scout_signals")
    .select("id,mint,symbol,status")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (result.error) throw new Error(`Scout active signal lookup failed: ${JSON.stringify(result.error)}`);
  const signal = result.data as ActiveSignalRow | null;
  if (!signal) throw new Error("Scout dynamic selection is enabled but no active signal exists");

  const mint = new PublicKey(signal.mint);
  activateRewardMint(mint, signal.symbol);
  console.log(`[${epochId}] active Scout signal: $${signal.symbol} ${mint.toBase58()}`);
  return signal;
}
