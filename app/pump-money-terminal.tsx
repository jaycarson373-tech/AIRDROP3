"use client";

import { useEffect, useMemo, useState } from "react";

type Reward = { epoch: number; wallet: string; rewardAmount: number; time: string; txSig: string | null };
type Round = { epoch: number; recipients: number; rewardBought: number; distributedPump: number; txSig: string | null };
type Stats = {
  totalEpochs: number;
  totalRewardAirdropped: number;
  latestEligibleHolders: number;
  recentRewards: Reward[];
  roundHistory: Round[];
  workerStatus: string;
};

function shortWallet(wallet: string) {
  return wallet.length > 12 ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : wallet;
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function countdown(epochMinutes: number) {
  const epochMs = epochMinutes * 60_000;
  const remaining = epochMs - (Date.now() % epochMs);
  const minutes = Math.floor(remaining / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function PumpMoneyTerminal({
  epochMinutes,
  rewardSymbol,
  launchState
}: {
  epochMinutes: number;
  rewardSymbol: string;
  launchState: "prelaunch" | "live";
}) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [nextRound, setNextRound] = useState("--:--");

  useEffect(() => {
    const tick = () => setNextRound(countdown(epochMinutes));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [epochMinutes]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/stats", { cache: "no-store" });
        if (!response.ok) throw new Error("Stats unavailable");
        const payload = (await response.json()) as Stats;
        if (active) setStats(payload);
      } catch {
        if (active) setStats(null);
      }
    };
    load();
    const timer = window.setInterval(load, 15_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const latestRound = stats?.roundHistory?.[0];
  const isLive = launchState === "live";
  const verified = isLive && Boolean(latestRound?.txSig && (latestRound?.recipients ?? 0) > 0);
  const workerOnline = stats?.workerStatus === "online" || stats?.workerStatus === "running";
  const recent = useMemo(
    () => (isLive ? (stats?.recentRewards ?? []).filter((reward) => reward.txSig).slice(0, 4) : []),
    [isLive, stats]
  );

  return (
    <aside className="pm-terminal" id="terminal" aria-label="Pump Money live terminal">
      <div className="pm-terminal-head">
        <span><i className={isLive && workerOnline ? "is-live" : ""} /> {isLive ? (workerOnline ? "ENGINE ONLINE" : "AWAITING WORKER") : "PRELAUNCH"}</span>
        <span>{epochMinutes}M ENGINE</span>
      </div>

      <div className="pm-printer-mark" aria-hidden="true"><span>$</span></div>

      <div className="pm-terminal-stats">
        <article><span>NEXT ROUND</span><strong>{nextRound}</strong></article>
        <article><span>VERIFIED ROUNDS</span><strong>{verified ? stats?.totalEpochs : "AWAITING"}</strong></article>
        <article><span>TOTAL ${rewardSymbol}</span><strong>{verified ? formatAmount(stats?.totalRewardAirdropped ?? 0) : "AWAITING"}</strong></article>
        <article><span>ELIGIBLE SET</span><strong>{verified ? stats?.latestEligibleHolders : "AWAITING"}</strong></article>
      </div>

      <div className="pm-terminal-feed">
        <div className="pm-feed-title"><span>ROUND RECEIPTS</span><span>LIVE INDEX</span></div>
        {recent.length ? recent.map((reward) => (
          <a key={`${reward.epoch}:${reward.wallet}`} href={`https://solscan.io/tx/${reward.txSig}`} target="_blank" rel="noreferrer">
            <span>R{String(reward.epoch).padStart(3, "0")}</span>
            <strong>{shortWallet(reward.wallet)}</strong>
            <em>+{formatAmount(reward.rewardAmount)} {rewardSymbol}</em>
          </a>
        )) : (
          <div className="pm-terminal-empty">
            <strong>{isLive ? "PRINTER ARMED." : "PUMP MONEY IS IN PRELAUNCH."}</strong>
            <span>{isLive ? "The first confirmed distribution will appear here." : "Only confirmed Pump Money rounds will appear after launch."}</span>
          </div>
        )}
      </div>
    </aside>
  );
}
