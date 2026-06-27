import Link from "next/link";
import { ParallaxBackground } from "../parallax-background";

type StatsResponse = {
  currentEpoch: number;
  totalEpochs: number;
  lastRewardAirdropped: number;
  totalRewardAirdropped: number;
  nextDropTime: string;
  epochHistory: Array<{
    epoch: number;
    rewardAmount: number;
    recipients: number;
    timestamp: string;
    status: string;
  }>;
};

type HoldersResponse = {
  topHolders: Array<{
    rank: number;
    address: string;
    balance: number;
    percentage: string;
  }>;
};

const emptyStats: StatsResponse = {
  currentEpoch: 0,
  totalEpochs: 0,
  lastRewardAirdropped: 0,
  totalRewardAirdropped: 0,
  nextDropTime: new Date().toISOString(),
  epochHistory: []
};

async function getJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const response = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

function compactAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default async function DashboardPage() {
  const [stats, holders] = await Promise.all([
    getJson<StatsResponse>("/api/stats", emptyStats),
    getJson<HoldersResponse>("/api/holders", { topHolders: [] })
  ]);

  return (
    <div className="page">
      <ParallaxBackground />
      <div className="grid-bg" />
      <header className="nav">
        <div className="container nav-inner">
          <Link className="brand" href="/">
            <span className="coin">$</span>
            <span>Pump Airdrop</span>
          </Link>
          <div className="nav-links">
            <Link href="/">Landing</Link>
            <Link href="/dashboard">Dashboard</Link>
          </div>
        </div>
      </header>

      <main className="dashboard">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="eyebrow">
                <span className="pulse" />
                Live reward proof
              </div>
              <h1 style={{ fontSize: "clamp(44px, 7vw, 82px)" }}>Airdrop Dashboard</h1>
            </div>
            <p className="lead">
              This page reads the same Supabase tables the Railway worker writes: epochs, snapshots, buys, and payouts.
            </p>
          </div>

          <div className="stats">
            <div className="stat">
              <strong>{stats.currentEpoch}</strong>
              <span>Current epoch</span>
            </div>
            <div className="stat">
              <strong>{stats.totalEpochs}</strong>
              <span>Total epochs</span>
            </div>
            <div className="stat">
              <strong>{stats.lastRewardAirdropped.toLocaleString()}</strong>
              <span>Last PUMP airdropped</span>
            </div>
            <div className="stat">
              <strong>{stats.totalRewardAirdropped.toLocaleString()}</strong>
              <span>Total PUMP airdropped</span>
            </div>
          </div>

          <div className="dash-grid" style={{ marginTop: 16 }}>
            <section className="card">
              <h3>Recent Epochs</h3>
              <div className="table-wrap" style={{ marginTop: 14 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Epoch</th>
                      <th>Status</th>
                      <th className="right">Recipients</th>
                      <th className="right">PUMP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.epochHistory.length ? (
                      stats.epochHistory.map((epoch) => (
                        <tr key={`${epoch.epoch}-${epoch.timestamp}`}>
                          <td className="mono">#{epoch.epoch}</td>
                          <td>{epoch.status}</td>
                          <td className="right">{epoch.recipients}</td>
                          <td className="right">{epoch.rewardAmount.toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4}>No completed epochs yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card">
              <h3>Latest Top Holders</h3>
              <div className="table-wrap" style={{ marginTop: 14 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Wallet</th>
                      <th className="right">Balance</th>
                      <th className="right">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holders.topHolders.length ? (
                      holders.topHolders.map((holder) => (
                        <tr key={holder.address}>
                          <td>#{holder.rank}</td>
                          <td className="mono">{compactAddress(holder.address)}</td>
                          <td className="right">{holder.balance.toLocaleString()}</td>
                          <td className="right">{holder.percentage}%</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4}>No snapshot yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
