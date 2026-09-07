import type { Metadata } from "next";
import { ReceiptsView } from "../../components/scout/views";

export const metadata: Metadata = {
  title: "Live Drops",
  description: "Verify BRAINROT-funded $NEURALP distributions and settled Solana transactions."
};

export default function RewardsPage() {
  return <ReceiptsView />;
}
