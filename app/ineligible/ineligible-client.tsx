"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { pumpRunnerConfig } from "../pump-runner-config";

type IneligibleWallet = {
  address: string;
  balance: number;
  currentMultiplier: string | null;
  currentStreak: number | null;
  totalRewardEarned: number;
  lastAirdropAt: string | null;
  ineligibleReason: string;
  ineligibleAt: string | null;
  lastSeenAt: string | null;
};

type HoldersResponse = {
  ineligibleWallets?: IneligibleWallet[];
};

const emptyResponse: HoldersResponse = { ineligibleWallets: [] };
const PROJECT_NAME = process.env.NEXT_PUBLIC_PROJECT_NAME ?? "SMI6900";
const SOURCE_SYMBOL = process.env.NEXT_PUBLIC_SOURCE_SYMBOL ?? "SMI6900";
const REWARD_SYMBOL = pumpRunnerConfig.currentRunner.ticker;
const parsedEligibilityMin = Number(process.env.NEXT_PUBLIC_ELIGIBILITY_MIN ?? 1_000_000);
const eligibilityMin = Number.isFinite(parsedEligibilityMin) && parsedEligibilityMin > 0 ? parsedEligibilityMin : 1_000_000;
const ELIGIBILITY_LABEL =
  process.env.NEXT_PUBLIC_ELIGIBILITY_LABEL ?? eligibilityMin.toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 1 });

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

export function IneligibleClient() {
  const [ineligibleWallets, setIneligibleWallets] = useState<IneligibleWallet[]>([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const data = await getHolders();
      if (active) setIneligibleWallets(data.ineligibleWallets ?? []);
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
            <img className="brand-logo" src={pumpRunnerConfig.logoSrc} alt={`${PROJECT_NAME} logo`} />
            <span>
              {PROJECT_NAME}
              <small>Ineligible Wallets</small>
            </span>
          </Link>
          <div className="nav-links">
            <Link href="/">Landing</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/ineligible">Ineligible</Link>
          </div>
        </div>
      </header>

      <main className="dashboard ineligible-page">
        <section className="section history-section">
          <div className="container">
            <div className="section-kicker">Ineligibility ledger</div>
            <div className="section-head split-head">
              <h1 className="dashboard-title">Ineligible Wallets</h1>
              <p>Wallets that lost eligibility by selling or falling below the {ELIGIBILITY_LABEL} {SOURCE_SYMBOL} requirement.</p>
            </div>

            <div className="history-card ineligible-board-card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Wallet</th>
                      <th>Reason</th>
                      <th>Total Rewards Earned</th>
                      <th>Status</th>
                      <th>Final Streak</th>
                      <th>Last Airdrop</th>
                      <th>Removed At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ineligibleWallets.length ? (
                      ineligibleWallets.map((wallet) => (
                        <tr key={`${wallet.address}-${wallet.ineligibleAt ?? wallet.lastSeenAt ?? "ineligible"}`}>
                          <td>{compactAddress(wallet.address)}</td>
                          <td>{wallet.ineligibleReason}</td>
                          <td>{formatNumber(wallet.totalRewardEarned)} {REWARD_SYMBOL}</td>
                          <td>Ineligible</td>
                          <td>{wallet.currentStreak ?? 0} epochs</td>
                          <td>{formatDate(wallet.lastAirdropAt)}</td>
                          <td>{formatDate(wallet.ineligibleAt ?? wallet.lastSeenAt)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7}>No ineligible wallets recorded yet.</td>
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
