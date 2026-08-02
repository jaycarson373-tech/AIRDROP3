import type { Metadata } from "next";
import { ReceiptsView } from "../../components/scout/views";

export const metadata: Metadata = {
  title: "Rewards",
  description: "Verify GOAT reward epochs, distributions, recipients, and settled Solana transactions."
};

export default function RewardsPage() {
  return <ReceiptsView />;
}
