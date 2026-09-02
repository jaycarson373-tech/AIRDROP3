import type { Metadata } from "next";
import { LeaderboardView } from "../../components/scout/leaderboard-view";

export const metadata: Metadata = {
  title: "Eligible Holders",
  description: "Verified $BRAINROT holder balances, eligibility history, and $NEURAL reward receipts."
};

export default function LeaderboardPage() {
  return <LeaderboardView />;
}
