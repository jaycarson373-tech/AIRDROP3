"use client";

import { ArrowUpRight, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatToken, shortWallet } from "./format";
import { projectConfig } from "./project-config";
import { useScout } from "./scout-provider";
import type { LeaderboardEntry } from "./types";
import { EmptyState } from "./ui";

function walletUrl(wallet: string) {
  return `${projectConfig.explorerBaseUrl.replace(/\/$/, "")}/account/${wallet}`;
}

function RewardTotal({ entry }: { entry: LeaderboardEntry }) {
  const neural = entry.totalRewards.NEURAL;
  if (!neural) return <span className="goat-leaderboard__awaiting">AWAITING LIVE DATA</span>;
  return (
    <span className="goat-leaderboard__rewards">
      <b>{formatToken(neural, "NEURAL")}</b>
    </span>
  );
}

function LeaderboardCard({ entry }: { entry: LeaderboardEntry }) {
  return (
    <article className="goat-leaderboard-card">
      <div className="goat-leaderboard-card__rank"><span>RANK</span><strong>{String(entry.rank).padStart(2, "0")}</strong></div>
      <a className="goat-leaderboard-card__wallet" href={walletUrl(entry.wallet)} target="_blank" rel="noopener noreferrer">
        <span>WALLET</span><strong>{shortWallet(entry.wallet)}</strong><ArrowUpRight size={12} />
      </a>
      <div><span>$BRAINROT BALANCE</span><strong>{formatToken(entry.tokenBalance, "BRAINROT")}</strong></div>
      <div><span>QUALIFIED DROPS</span><strong>{entry.qualifiedEpochs.toLocaleString()}</strong></div>
      <div><span>HOLDING STREAK</span><strong>{entry.holdingStreak.toLocaleString()}</strong></div>
      <div><span>TOTAL REWARDS</span><RewardTotal entry={entry} /></div>
      <div className="goat-leaderboard-card__score"><span>HOLDER SCORE</span><strong>{entry.selectionScore}</strong><i style={{ width: `${entry.selectionScore}%` }} /></div>
    </article>
  );
}

function LeaderboardList({ entries }: { entries: LeaderboardEntry[] }) {
  if (!entries.length) {
    return <EmptyState title="HOLDER BOARD AWAITS LIVE DATA." body="Ranks publish only after real eligible holder snapshots are recorded." />;
  }
  return <div className="goat-leaderboard-list">{entries.map((entry) => <LeaderboardCard entry={entry} key={entry.wallet} />)}</div>;
}

export function LeaderboardSection() {
  const { launchState, stats } = useScout();
  const entries = launchState === "live" ? stats.leaderboard : [];
  return (
    <section className="goat-leaderboard" id="leaderboard">
      <div className="goat-leaderboard__head">
        <div><span>HOLDER BOARD</span><h2>ELIGIBLE $BRAINROT HOLDERS.</h2><p>Balance and eligibility history come from real backend records.</p></div>
        <Link className="goat-button" href="/leaderboard">VIEW ALL HOLDERS <ArrowUpRight size={13} /></Link>
      </div>
      <LeaderboardList entries={entries.slice(0, 5)} />
    </section>
  );
}

export function LeaderboardView() {
  const { launchState, stats } = useScout();
  const entries = launchState === "live" ? stats.leaderboard : [];
  const [walletQuery, setWalletQuery] = useState("");
  const normalizedQuery = walletQuery.trim();
  const walletRank = useMemo(
    () => normalizedQuery ? entries.find((entry) => entry.wallet === normalizedQuery) ?? null : null,
    [entries, normalizedQuery]
  );
  const longestStreak = [...entries].sort((a, b) => b.holdingStreak - a.holdingStreak)[0];
  const mostEpochs = [...entries].sort((a, b) => b.qualifiedEpochs - a.qualifiedEpochs)[0];
  const mostReceipts = [...entries].sort((a, b) => b.rewardReceipts - a.rewardReceipts)[0];

  return (
    <div className="scout-page goat-leaderboard-page">
      <div className="scout-page-heading"><div><span className="scout-kicker">$BRAINROT HOLDERS</span><h1>HOLDER WEIGHT.</h1><p>Verified balance and holding history only. No fabricated ranks.</p></div></div>

      <section className="goat-rank-lookup">
        <div><span>CURRENT WALLET RANK</span><strong>{walletRank ? `#${walletRank.rank}` : "ENTER A WALLET"}</strong></div>
        <label><Search size={14} /><span className="sr-only">Wallet address</span><input value={walletQuery} onChange={(event) => setWalletQuery(event.target.value)} placeholder="Paste a public wallet address" /></label>
      </section>

      <div className="goat-leaderboard-highlights">
        <div><span>LONGEST STREAK</span><strong>{longestStreak ? longestStreak.holdingStreak.toLocaleString() : "AWAITING LIVE DATA"}</strong><small>{longestStreak ? shortWallet(longestStreak.wallet) : "REAL SNAPSHOTS ONLY"}</small></div>
        <div><span>MOST DROPS QUALIFIED</span><strong>{mostEpochs ? mostEpochs.qualifiedEpochs.toLocaleString() : "AWAITING LIVE DATA"}</strong><small>{mostEpochs ? shortWallet(mostEpochs.wallet) : "REAL SNAPSHOTS ONLY"}</small></div>
        <div><span>MOST REWARD RECEIPTS</span><strong>{mostReceipts ? mostReceipts.rewardReceipts.toLocaleString() : "AWAITING LIVE DATA"}</strong><small>{mostReceipts ? shortWallet(mostReceipts.wallet) : "REAL RECEIPTS ONLY"}</small></div>
      </div>

      <LeaderboardList entries={entries} />

      <section className="goat-hall-of-fame">
        <div><span>TOP HOLDERS</span><h2>THE LONG HOLD.</h2></div>
        {entries.length ? (
          <div>{entries.slice(0, 3).map((entry) => <a href={walletUrl(entry.wallet)} target="_blank" rel="noopener noreferrer" key={entry.wallet}><b>#{entry.rank}</b><strong>{shortWallet(entry.wallet)}</strong><span>{entry.selectionScore} PTS</span></a>)}</div>
        ) : <p>Top-holder entries begin after verified snapshot data is available.</p>}
      </section>

      <section className="goat-scoring">
        <span>DISPLAY SCORE</span>
        <p>The holder score is a relative display index built from verified token balance, qualified drops, and holding streak. Rewards are never guaranteed.</p>
      </section>
    </div>
  );
}
