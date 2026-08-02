"use client";

import { ExternalLink, Radio, ShieldCheck } from "lucide-react";
import { formatTime, formatToken, shortWallet } from "./format";
import { explorerTxUrl } from "./project-config";
import { useScout } from "./scout-provider";
import { EmptyState, Metric, Skeleton, StatusBadge } from "./ui";

function PageHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="scout-page-heading">
      <div><span className="scout-kicker">{eyebrow}</span><h1>{title}</h1><p>{body}</p></div>
    </div>
  );
}

export function ReceiptsView() {
  const { stats, state } = useScout();
  const awaitingLaunch = "AWAITING FIRST EPOCH";
  const rewardTotal = (symbol: "ANSEM" | "CATE") => {
    const row = stats.rewardBreakdown.find((entry) => entry.asset.trim().toUpperCase() === symbol);
    return row && row.transfers > 0 && row.total > 0 ? formatToken(row.total, symbol) : awaitingLaunch;
  };
  return (
    <div className="scout-page">
      <PageHeading eyebrow="GOAT Rewards" title="REWARD HISTORY." body="Every settled epoch, recipient wallet, timestamp, and onchain receipt in one verifiable ledger." />
      <div className="scout-overview-grid">
        <Metric label="Current Epoch" value={stats.currentEpoch ? `#${stats.currentEpoch}` : awaitingLaunch} />
        <Metric label="ANSEM Distributed" value={rewardTotal("ANSEM")} />
        <Metric label="CATE Distributed" value={rewardTotal("CATE")} />
        <Metric label="Holders Rewarded" value={stats.totalHoldersRewarded ? stats.totalHoldersRewarded.toLocaleString() : awaitingLaunch} />
      </div>
      <section className="scout-panel scout-panel--table">
        <div className="scout-panel__head"><div><span className="scout-kicker">Cycle history</span><h2>Verified settlements</h2></div><Radio size={20} /></div>
        {state === "loading" ? <Skeleton rows={5} /> : stats.roundHistory.length ? (
          <div className="scout-table-wrap">
            <table className="scout-table scout-table--rewards">
              <thead><tr><th>Cycle</th><th>Started</th><th>Eligible</th><th>Allocation</th><th>SOL value</th><th>Status</th><th>Transaction</th></tr></thead>
              <tbody>{stats.roundHistory.map((row) => (
                <tr key={`${row.epoch}-${row.startedAt}`}>
                  <td data-label="EPOCH">#{row.epoch}</td><td data-label="TIMESTAMP">{formatTime(row.startedAt)}</td><td data-label="ELIGIBLE SNAPSHOT">{row.eligibleCount.toLocaleString()}</td>
                  <td data-label="ALLOCATION">50% ANSEM / 50% CATE</td>
                  <td data-label="SOL VALUE">{row.solValueAirdropped.toFixed(4)} SOL</td><td data-label="STATUS"><StatusBadge label={row.status} /></td>
                  <td data-label="TRANSACTION">{row.txSig ? <a className="scout-icon-link" href={explorerTxUrl(row.txSig)} target="_blank" rel="noopener noreferrer" aria-label={`Verify cycle ${row.epoch}`}><ExternalLink size={15} /></a> : awaitingLaunch}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyState title="REWARD HISTORY BEGINS AT LAUNCH." body="Epochs appear only after recipient transactions are recorded as settled." />}
      </section>
      <section className="scout-panel scout-panel--table">
        <div className="scout-panel__head"><div><span className="scout-kicker">Recipient feed</span><h2>Recent verified payouts</h2></div><ShieldCheck size={20} /></div>
        {stats.recentRewards.length ? (
          <div className="scout-table-wrap">
            <table className="scout-table scout-table--rewards">
              <thead><tr><th>Wallet</th><th>Cycle</th><th>Asset</th><th>Amount</th><th>Time</th><th>Status</th><th>Receipt</th></tr></thead>
              <tbody>{stats.recentRewards.map((row, index) => (
                <tr key={`${row.wallet}-${row.epoch}-${index}`}>
                  <td data-label="WALLET">{shortWallet(row.wallet)}</td><td data-label="EPOCH">#{row.epoch}</td><td data-label="ASSET">${row.rewardAsset || "TOKEN"}</td><td data-label="AMOUNT">{formatToken(row.rewardAmount, row.rewardAsset || "TOKENS")}</td>
                  <td data-label="TIMESTAMP">{formatTime(row.time)}</td><td data-label="STATUS">{row.status}</td>
                  <td data-label="RECEIPT">{row.txSig ? <a className="scout-icon-link" href={explorerTxUrl(row.txSig)} target="_blank" rel="noopener noreferrer" aria-label="Verify payout"><ExternalLink size={15} /></a> : awaitingLaunch}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyState title="REWARD HISTORY BEGINS AT LAUNCH." body="Recipient wallets and transaction signatures publish after the first completed distribution." />}
      </section>
    </div>
  );
}

export function DocsView() {
  return (
    <div className="scout-page scout-page--docs">
      <PageHeading eyebrow="Documentation" title="How GOAT works." body="Every five minutes, the reward budget splits evenly between ANSEM and CATE and moves to eligible GOAT holders." />
      <div className="scout-doc-layout">
        <aside><a href="#lifecycle">Distribution cycle</a><a href="#weight">Eligibility</a><a href="#treasury">Settlement</a></aside>
        <div className="scout-doc-content">
          <section id="lifecycle"><span className="scout-kicker">01</span><h2>Distribution cycle</h2><p>At each five-minute UTC boundary, GOAT snapshots eligible holders and divides the available reward-buy budget: 50% ANSEM and 50% CATE.</p></section>
          <section id="weight"><span className="scout-kicker">02</span><h2>Eligibility</h2><p>Holding GOAT is the entry. Any detected decrease in the wallet&apos;s GOAT balance—including a transfer—ends future eligibility. Never-sold wallets receive a modest holding-weight boost up to 1.35× after 30 days.</p></section>
          <section id="treasury"><span className="scout-kicker">03</span><h2>Settlement</h2><p>Both assets use the same verified holder snapshot. Reward amounts publish only after their real Solana transfer receipts are available.</p></section>
        </div>
      </div>
    </div>
  );
}
