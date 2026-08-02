import type { Metadata } from "next";
import { LeaderboardView } from "../../components/scout/leaderboard-view";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Verified GOAT holder balances, qualified epochs, holding streaks, rewards, and conviction scores."
};

export default function LeaderboardPage() {
  return <LeaderboardView />;
}
