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
  roundHistory: Array<{
    epoch: number;
    status: string;
    startedAt: string;
    duration: string;
    claimedSol: number;
    distributedPump: number;
    txSig: string | null;
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
  epochHistory: [],
  roundHistory: []
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

function statusLabel(status: string) {
  return status.toUpperCase();
}

function statusClass(status: string) {
  if (status === "completed") return "status-pill completed";
  if (status === "failed") return "status-pill failed";
  if (status === "skipped") return "status-pill skipped";
  return "status-pill running";
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
            <img className="brand-logo" src="/logo.png" alt="Pump Airdrop logo" />
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

          <section className="history-card" style={{ marginTop: 16 }}>
            <div className="history-head">
              <h3>Round History</h3>
              <span>Latest 10 rounds</span>
            </div>
            <div className="table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Round</th>
                    <th>Status</th>
                    <th>Started</th>
                    <th>Duration</th>
                    <th className="right">Claimed</th>
                    <th className="right">Distributed</th>
                    <th className="right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.roundHistory.length ? (
                    stats.roundHistory.map((round) => (
                      <tr key={`${round.epoch}-${round.startedAt}`}>
                        <td className="mono">#{round.epoch}</td>
                        <td>
                          <span className={statusClass(round.status)}>{statusLabel(round.status)}</span>
                        </td>
                        <td>{new Date(round.startedAt).toLocaleString()}</td>
                        <td>{round.duration}</td>
                        <td className="right mono">
                          {round.claimedSol ? `${round.claimedSol.toLocaleString()} SOL` : "-"}
                        </td>
                        <td className="right mono">
                          {round.distributedPump ? `${round.distributedPump.toLocaleString()} PUMP` : "-"}
                        </td>
                        <td className="right">
                          {round.txSig ? (
                            <a
                              className="details-button"
                              href={`https://solscan.io/tx/${round.txSig}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Details
                            </a>
                          ) : (
                            <span className="details-button disabled">Details</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7}>No rounds yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="dash-grid" style={{ marginTop: 16 }}>
            <section className="card">
              <h3>Latest Epoch Summary</h3>
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
