import type { Metadata } from "next";
import { LeaderboardView } from "../../components/scout/leaderboard-view";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Verified Pump Money holder balances, qualified draws, holding streaks, and reward receipts."
};

export default function LeaderboardPage() {
  return <LeaderboardView />;
}
