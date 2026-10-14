import type { Metadata } from "next";
import { LeaderboardView } from "../../components/scout/leaderboard-view";

export const metadata: Metadata = {
  title: "Holder Standings",
  description: "View recorded BRAINROT holder balances and verified distribution history."
};

export default function LeaderboardPage() {
  return <LeaderboardView />;
}
