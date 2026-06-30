"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type FallenBull = {
  address: string;
  balance: number;
  currentMultiplier: string | null;
  currentStreak: number | null;
  totalAnsemEarned: number;
  lastFeedingAt: string | null;
  ineligibleReason: string;
  ineligibleAt: string | null;
  lastSeenAt: string | null;
};

type HoldersResponse = {
  fallenBulls?: FallenBull[];
};

const emptyResponse: HoldersResponse = { fallenBulls: [] };

function compactAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function formatNumber(value: number, maximumFractionDigits = 2) {
  if (!Number.isFinite(value) || value <= 0) return "0";
  return value.toLocaleString(undefined, { maximumFractionDigits });
}

function formatDate(value: string | null) {
  if (!value) return "Awaiting";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Awaiting" : date.toLocaleString();
}

async function getHolders() {
  try {
    const response = await fetch("/api/holders", { cache: "no-store" });
    if (!response.ok) return emptyResponse;
    return (await response.json()) as HoldersResponse;
  } catch {
    return emptyResponse;
  }
}

export function FallenBullsClient() {
  const [fallenBulls, setFallenBulls] = useState<FallenBull[]>([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const data = await getHolders();
      if (active) setFallenBulls(data.fallenBulls ?? []);
    };

    load();
    const timer = window.setInterval(load, 12000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="page">
      <header className="nav">
        <div className="container nav-inner">
          <Link className="brand" href="/">
            <img className="brand-logo" src="/brand/nietzschean-crest.jpg" alt="The Final Bull logo" />
            <span>
              The Final Bull
              <small>Fallen Bulls</small>
            </span>
          </Link>
          <div className="nav-links">
            <Link href="/">Landing</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/fallen-bulls">Fallen Bulls</Link>
          </div>
        </div>
      </header>

      <main className="dashboard fallen-bulls-page">
        <section className="section history-section">
          <div className="container">
            <div className="section-kicker">Permanent ineligibility ledger</div>
            <div className="section-head split-head">
              <h1 className="dashboard-title">Fallen Bulls</h1>
              <p>Wallets that lost eligibility by selling or falling below the 1,000,000 BULL requirement.</p>
            </div>

            <div className="history-card bull-board-card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Wallet</th>
                      <th>Reason</th>
                      <th>Total ANSEM Earned</th>
                      <th>Last Multiplier</th>
                      <th>Final Streak</th>
                      <th>Last Airdrop</th>
                      <th>Removed At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fallenBulls.length ? (
                      fallenBulls.map((bull) => (
                        <tr key={`${bull.address}-${bull.ineligibleAt ?? bull.lastSeenAt ?? "fallen"}`}>
                          <td>{compactAddress(bull.address)}</td>
                          <td>{bull.ineligibleReason}</td>
                          <td>{formatNumber(bull.totalAnsemEarned)} ANSEM</td>
                          <td>{bull.currentMultiplier ?? "1.00x"}</td>
                          <td>{bull.currentStreak ?? 0} epochs</td>
                          <td>{formatDate(bull.lastFeedingAt)}</td>
                          <td>{formatDate(bull.ineligibleAt ?? bull.lastSeenAt)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7}>No fallen bulls recorded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
