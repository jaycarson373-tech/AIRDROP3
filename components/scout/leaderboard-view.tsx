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
  const ansem = entry.totalRewards.ANSEM;
  const cate = entry.totalRewards.CATE;
  if (!ansem && !cate) return <span className="goat-leaderboard__awaiting">AWAITING FIRST EPOCH</span>;
  return (
    <span className="goat-leaderboard__rewards">
      {ansem ? <b>{formatToken(ansem, "ANSEM")}</b> : null}
      {cate ? <b>{formatToken(cate, "CATE")}</b> : null}
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
      <div><span>GOAT BALANCE</span><strong>{formatToken(entry.goatBalance, "GOAT")}</strong></div>
      <div><span>QUALIFIED EPOCHS</span><strong>{entry.qualifiedEpochs.toLocaleString()}</strong></div>
      <div><span>HOLDING STREAK</span><strong>{entry.holdingStreak.toLocaleString()}</strong></div>
      <div><span>TOTAL REWARDS</span><RewardTotal entry={entry} /></div>
      <div className="goat-leaderboard-card__score"><span>CONVICTION SCORE</span><strong>{entry.convictionScore}</strong><i style={{ width: `${entry.convictionScore}%` }} /></div>
    </article>
  );
}

function LeaderboardList({ entries }: { entries: LeaderboardEntry[] }) {
  if (!entries.length) {
    return <EmptyState title="LEADERBOARD ACTIVATES AT LAUNCH." body="Ranks publish only after the first eligible holder snapshot is recorded." />;
  }
  return <div className="goat-leaderboard-list">{entries.map((entry) => <LeaderboardCard entry={entry} key={entry.wallet} />)}</div>;
}

export function LeaderboardSection() {
  const { stats } = useScout();
  return (
    <section className="goat-leaderboard" id="leaderboard">
      <div className="goat-leaderboard__head">
        <div><span>LEADERBOARD</span><h2>TOP CONVICTION HOLDERS.</h2><p>Balance gets you in. Conviction keeps you ranked.</p></div>
        <Link className="goat-button" href="/leaderboard">VIEW FULL LEADERBOARD <ArrowUpRight size={13} /></Link>
      </div>
      <LeaderboardList entries={stats.leaderboard.slice(0, 5)} />
    </section>
  );
}

export function LeaderboardView() {
  const { stats } = useScout();
  const [walletQuery, setWalletQuery] = useState("");
  const normalizedQuery = walletQuery.trim();
  const walletRank = useMemo(
    () => normalizedQuery ? stats.leaderboard.find((entry) => entry.wallet === normalizedQuery) ?? null : null,
    [normalizedQuery, stats.leaderboard]
  );
  const longestStreak = [...stats.leaderboard].sort((a, b) => b.holdingStreak - a.holdingStreak)[0];
  const mostEpochs = [...stats.leaderboard].sort((a, b) => b.qualifiedEpochs - a.qualifiedEpochs)[0];
  const mostReceipts = [...stats.leaderboard].sort((a, b) => b.rewardReceipts - a.rewardReceipts)[0];

  return (
    <div className="scout-page goat-leaderboard-page">
      <div className="scout-page-heading"><div><span className="scout-kicker">GOAT LEADERBOARD</span><h1>TOP CONVICTION HOLDERS.</h1><p>Balance gets you in. Conviction keeps you ranked.</p></div></div>

      <section className="goat-rank-lookup">
        <div><span>CURRENT WALLET RANK</span><strong>{walletRank ? `#${walletRank.rank}` : "ENTER A WALLET"}</strong></div>
        <label><Search size={14} /><span className="sr-only">Wallet address</span><input value={walletQuery} onChange={(event) => setWalletQuery(event.target.value)} placeholder="Paste a public wallet address" /></label>
      </section>

      <div className="goat-leaderboard-highlights">
        <div><span>LONGEST STREAK</span><strong>{longestStreak ? longestStreak.holdingStreak.toLocaleString() : "AWAITING FIRST EPOCH"}</strong><small>{longestStreak ? shortWallet(longestStreak.wallet) : "REAL SNAPSHOTS ONLY"}</small></div>
        <div><span>MOST EPOCHS QUALIFIED</span><strong>{mostEpochs ? mostEpochs.qualifiedEpochs.toLocaleString() : "AWAITING FIRST EPOCH"}</strong><small>{mostEpochs ? shortWallet(mostEpochs.wallet) : "REAL SNAPSHOTS ONLY"}</small></div>
        <div><span>MOST REWARD RECEIPTS</span><strong>{mostReceipts ? mostReceipts.rewardReceipts.toLocaleString() : "AWAITING FIRST EPOCH"}</strong><small>{mostReceipts ? shortWallet(mostReceipts.wallet) : "REAL RECEIPTS ONLY"}</small></div>
      </div>

      <LeaderboardList entries={stats.leaderboard} />

      <section className="goat-hall-of-fame">
        <div><span>HALL OF FAME</span><h2>THE HORNS STAY ON.</h2></div>
        {stats.leaderboard.length ? (
          <div>{stats.leaderboard.slice(0, 3).map((entry) => <a href={walletUrl(entry.wallet)} target="_blank" rel="noopener noreferrer" key={entry.wallet}><b>#{entry.rank}</b><strong>{shortWallet(entry.wallet)}</strong><span>{entry.convictionScore} PTS</span></a>)}</div>
        ) : <p>Hall of Fame entries begin after verified leaderboard data is available.</p>}
      </section>

      <section className="goat-scoring">
        <span>SCORING EXPLANATION</span>
        <p>Conviction score is a transparent 100-point relative index: GOAT balance contributes 50 points, qualified epochs contribute 30, and the current holding streak contributes 20. Scores use recorded holder snapshots only.</p>
      </section>
    </div>
  );
}
