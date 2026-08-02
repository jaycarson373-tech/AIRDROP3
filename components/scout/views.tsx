"use client";

import { ExternalLink, Radio, ShieldCheck } from "lucide-react";
import { formatTime, formatToken, shortWallet } from "./format";
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
  return (
    <div className="scout-page">
      <PageHeading eyebrow="GOAT Receipts" title="Verify every distribution." body="Every settled reward links to its cycle, asset, amount, recipient, and Solana transaction." />
      <div className="scout-overview-grid">
        <Metric label="Settled Cycles" value={stats.totalEpochs ? stats.totalEpochs.toLocaleString() : "NONE YET"} />
        <Metric label="Reward Assets" value="ANSEM + CATE" />
        <Metric label="Budget Split" value="50 / 50" />
        <Metric label="Distributed Value" value={stats.totalEpochs ? `${stats.totalSolValueAirdropped.toFixed(4)} SOL` : "NONE YET"} />
      </div>
      <section className="scout-panel scout-panel--table">
        <div className="scout-panel__head"><div><span className="scout-kicker">Cycle history</span><h2>Verified settlements</h2></div><Radio size={20} /></div>
        {state === "loading" ? <Skeleton rows={5} /> : stats.roundHistory.length ? (
          <div className="scout-table-wrap">
            <table className="scout-table">
              <thead><tr><th>Cycle</th><th>Started</th><th>Eligible</th><th>Allocation</th><th>SOL value</th><th>Status</th><th>Transaction</th></tr></thead>
              <tbody>{stats.roundHistory.map((row) => (
                <tr key={`${row.epoch}-${row.startedAt}`}>
                  <td>#{row.epoch}</td><td>{formatTime(row.startedAt)}</td><td>{row.eligibleCount.toLocaleString()}</td>
                  <td>50% ANSEM / 50% CATE</td>
                  <td>{row.solValueAirdropped.toFixed(4)} SOL</td><td><StatusBadge label={row.status} /></td>
                  <td>{row.txSig ? <a className="scout-icon-link" href={`https://solscan.io/tx/${row.txSig}`} target="_blank" rel="noreferrer" aria-label={`Verify cycle ${row.epoch}`}><ExternalLink size={15} /></a> : "NOT RECORDED"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyState title="No verified settlement yet" body="Cycles appear here only after recipient transactions are recorded as settled." />}
      </section>
      <section className="scout-panel scout-panel--table">
        <div className="scout-panel__head"><div><span className="scout-kicker">Recipient feed</span><h2>Recent verified payouts</h2></div><ShieldCheck size={20} /></div>
        {stats.recentRewards.length ? (
          <div className="scout-table-wrap">
            <table className="scout-table">
              <thead><tr><th>Wallet</th><th>Cycle</th><th>Asset</th><th>Amount</th><th>Time</th><th>Status</th><th>Receipt</th></tr></thead>
              <tbody>{stats.recentRewards.map((row, index) => (
                <tr key={`${row.wallet}-${row.epoch}-${index}`}>
                  <td>{shortWallet(row.wallet)}</td><td>#{row.epoch}</td><td>${row.rewardAsset || "TOKEN"}</td><td>{formatToken(row.rewardAmount, row.rewardAsset || "TOKENS")}</td>
                  <td>{formatTime(row.time)}</td><td>{row.status}</td>
                  <td>{row.txSig ? <a className="scout-icon-link" href={`https://solscan.io/tx/${row.txSig}`} target="_blank" rel="noreferrer" aria-label="Verify payout"><ExternalLink size={15} /></a> : "NOT RECORDED"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyState title="No recipient receipts yet" body="Individual proofs populate after the first completed GOAT distribution." />}
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
          <section id="weight"><span className="scout-kicker">02</span><h2>Eligibility</h2><p>Holding GOAT is the entry. The exact minimum is set only after the final GOAT supply is confirmed. No wallet connection, signing, or approval is required.</p></section>
          <section id="treasury"><span className="scout-kicker">03</span><h2>Settlement</h2><p>Both assets use the same verified holder snapshot. Reward amounts publish only after their real Solana transfer receipts are available.</p></section>
        </div>
      </div>
    </div>
  );
}
