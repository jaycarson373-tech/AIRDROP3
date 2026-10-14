import type { Metadata } from "next";
import { ReceiptsView } from "../../components/scout/views";

export const metadata: Metadata = {
  title: "Distribution Records",
  description: "Review finalized holder distributions and verify their Solana transaction receipts."
};

export default function RewardsPage() {
  return <ReceiptsView />;
}
