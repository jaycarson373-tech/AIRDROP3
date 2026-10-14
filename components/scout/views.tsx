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
  const rewardBreakdown = live
    ? stats.rewardBreakdown.filter((entry) => entry.transfers > 0 && entry.total > 0)
    : [];
  const rewardAssets = rewardBreakdown.length
    ? rewardBreakdown.map((entry) => formatToken(entry.total, entry.asset)).join(" · ")
    : awaitingLaunch;
  return (
    <div className="scout-page">
      <PageHeading eyebrow="BRAINROT" title="DISTRIBUTION RECORDS." body="Any separate holder distribution appears here only after it is finalized and verifiable on Solana. No reward schedule is currently promised." />
      <div className="scout-overview-grid">
        <Metric label="Latest Cycle" value={live && stats.currentEpoch ? `#${stats.currentEpoch}` : awaitingLaunch} />
        <Metric label="Recorded Distribution" value={rewardAssets} />
        <Metric label="Assets Recorded" value={rewardBreakdown.length ? rewardBreakdown.map((entry) => entry.asset).join(", ") : "NONE YET"} />
        <Metric label="Recipients Recorded" value={live && stats.totalHoldersRewarded ? stats.totalHoldersRewarded.toLocaleString() : awaitingLaunch} />
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
                  <td data-label="ALLOCATION">RECORDED ALLOCATION</td>
                  <td data-label="SOL VALUE">{row.solValueAirdropped.toFixed(4)} SOL</td><td data-label="STATUS"><StatusBadge label={row.status} /></td>
                  <td data-label="TRANSACTION">{row.txSig ? <a className="scout-icon-link" href={explorerTxUrl(row.txSig)} target="_blank" rel="noopener noreferrer" aria-label={`Verify epoch ${row.epoch}`}><ExternalLink size={15} /></a> : awaitingLaunch}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyState title="NO SETTLEMENTS RECORDED." body="Distributions appear only after real transactions are recorded as settled." />}
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
        ) : <EmptyState title="NO SETTLEMENTS RECORDED." body="Wallets and transaction signatures appear here only after a separate distribution is confirmed onchain." />}
      </section>
    </div>
  );
}

export function DocsView() {
  return (
    <div className="scout-page scout-page--docs">
      <PageHeading eyebrow="Documentation" title="How BRAINROT works." body="$BRAINROT is launching on Pump.fun. Market data is shown through DexScreener, and any separate reward program is published with its own confirmed rules and receipts." />
      <div className="scout-doc-layout">
        <aside><a href="#lifecycle">Launch venue</a><a href="#weight">Market data</a><a href="#treasury">Distribution status</a></aside>
        <div className="scout-doc-content">
          <section id="lifecycle"><span className="scout-kicker">01</span><h2>Pump.fun launch</h2><p>$BRAINROT launches on Pump.fun. Use the project’s verified launch link to find the token; this site does not create or custody tokens.</p></section>
          <section id="weight"><span className="scout-kicker">02</span><h2>Market data</h2><p>The live chart is served by DexScreener after the verified Solana pair is configured. Until then, the chart area clearly shows that the feed is waiting for the pair address.</p></section>
          <section id="treasury"><span className="scout-kicker">03</span><h2>Distribution records</h2><p>There is no active holder-reward schedule in this release. If a separate distribution is introduced, its rules and final transactions will be published here only after confirmation.</p></section>
        </div>
      </div>
    </div>
  );
}
