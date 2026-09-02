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
  const { launchState, stats, state } = useScout();
  const live = launchState === "live";
  const awaitingLaunch = "AWAITING LIVE DATA";
  const neural = live ? stats.rewardBreakdown.find((entry) => entry.asset.trim().toUpperCase() === "NEURAL") : undefined;
  const rewardTotal = neural && neural.transfers > 0 && neural.total > 0 ? formatToken(neural.total, "NEURAL") : awaitingLaunch;
  return (
    <div className="scout-page">
      <PageHeading eyebrow="BRAINROT Rewards" title="DROP HISTORY." body="Every settled $NEURAL distribution, timestamp, and onchain receipt in one verifiable ledger." />
      <div className="scout-overview-grid">
        <Metric label="Current Drop" value={live && stats.currentEpoch ? `#${stats.currentEpoch}` : awaitingLaunch} />
        <Metric label="$NEURAL Distributed" value={rewardTotal} />
        <Metric label="Reward Asset" value="$NEURAL" />
        <Metric label="Holders Rewarded" value={live && stats.totalHoldersRewarded ? stats.totalHoldersRewarded.toLocaleString() : awaitingLaunch} />
      </div>
      <section className="scout-panel scout-panel--table">
        <div className="scout-panel__head"><div><span className="scout-kicker">Distribution history</span><h2>Verified settlements</h2></div><Radio size={20} /></div>
        {live && state === "loading" ? <Skeleton rows={5} /> : live && stats.roundHistory.length ? (
          <div className="scout-table-wrap">
            <table className="scout-table scout-table--rewards">
              <thead><tr><th>Epoch</th><th>Started</th><th>Eligible</th><th>Allocation</th><th>SOL value</th><th>Status</th><th>Transaction</th></tr></thead>
              <tbody>{stats.roundHistory.map((row) => (
                <tr key={`${row.epoch}-${row.startedAt}`}>
                  <td data-label="EPOCH">#{row.epoch}</td><td data-label="TIMESTAMP">{formatTime(row.startedAt)}</td><td data-label="ELIGIBLE SNAPSHOT">{row.eligibleCount.toLocaleString()}</td>
                  <td data-label="ALLOCATION">EXISTING HOLDER LOGIC</td>
                  <td data-label="SOL VALUE">{row.solValueAirdropped.toFixed(4)} SOL</td><td data-label="STATUS"><StatusBadge label={row.status} /></td>
                  <td data-label="TRANSACTION">{row.txSig ? <a className="scout-icon-link" href={explorerTxUrl(row.txSig)} target="_blank" rel="noopener noreferrer" aria-label={`Verify epoch ${row.epoch}`}><ExternalLink size={15} /></a> : awaitingLaunch}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyState title="DROP HISTORY AWAITS LIVE DATA." body="Distributions appear only after real transactions are recorded as settled." />}
      </section>
      <section className="scout-panel scout-panel--table">
        <div className="scout-panel__head"><div><span className="scout-kicker">Recipient feed</span><h2>Recent verified payouts</h2></div><ShieldCheck size={20} /></div>
        {live && stats.recentRewards.length ? (
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
        ) : <EmptyState title="DROP HISTORY AWAITS LIVE DATA." body="Wallets and transaction signatures publish after completed $NEURAL distributions." />}
      </section>
    </div>
  );
}

export function DocsView() {
  return (
    <div className="scout-page scout-page--docs">
      <PageHeading eyebrow="Documentation" title="How BRAINROT works." body="Every five minutes, accrued creator fees buy $NEURAL and are distributed to eligible $BRAINROT holders using the existing allocation logic." />
      <div className="scout-doc-layout">
        <aside><a href="#lifecycle">Distribution cycle</a><a href="#weight">Eligibility</a><a href="#treasury">Settlement</a></aside>
        <div className="scout-doc-content">
          <section id="lifecycle"><span className="scout-kicker">01</span><h2>Five-minute drop</h2><p>At each fixed five-minute UTC boundary, the worker snapshots eligible $BRAINROT holders and prepares the next $NEURAL distribution.</p></section>
          <section id="weight"><span className="scout-kicker">02</span><h2>Eligibility</h2><p>Eligibility uses the confirmed holder rules configured for the worker. This site does not invent reward amounts or formulas.</p></section>
          <section id="treasury"><span className="scout-kicker">03</span><h2>Settlement</h2><p>Creator fees are claimed server-side, swapped into the verified $NEURAL PreStocks asset, and distributed only when real Solana transfer receipts are available.</p></section>
        </div>
      </div>
    </div>
  );
}
