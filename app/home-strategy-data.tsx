"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Round = {
  epoch: number;
  status: string;
  startedAt: string;
  duration: string;
  rewardBought: number;
  distributedPump: number;
  txSig: string | null;
};

type Reward = {
  epoch: number;
  wallet: string;
  rewardAmount: number;
  goldenMultiplier: number;
  time: string;
  status: string;
  txSig: string | null;
};

type StatsResponse = {
  currentEpoch: number;
  totalEpochs: number;
  lastRewardAirdropped: number;
  totalRewardAirdropped: number;
  latestEligibleHolders: number;
  averageMultiplier: number | null;
  nextDropTime: string;
  roundHistory: Round[];
  recentRewards: Reward[];
};

type HoldersResponse = {
  topHolders: Array<{
    rank: number;
    address: string;
    balance: number;
    percentage: string;
    currentMultiplier: string | null;
    currentMultiplierBps: number | null;
    currentHoldTime: string | null;
    currentStreak: number | null;
    totalAnsemEarned: number;
    lastFeedingAt: string | null;
    permanentlyIneligible: boolean;
    ineligibleReason: string | null;
  }>;
  fallenBulls?: Array<{
    address: string;
    balance: number;
    currentMultiplier: string | null;
    currentMultiplierBps: number | null;
    currentStreak: number | null;
    totalAnsemEarned: number;
    lastFeedingAt: string | null;
    ineligibleReason: string;
    ineligibleAt: string | null;
    lastSeenAt: string | null;
  }>;
};

const emptyStats: StatsResponse = {
  currentEpoch: 0,
  totalEpochs: 0,
  lastRewardAirdropped: 0,
  totalRewardAirdropped: 0,
  latestEligibleHolders: 0,
  averageMultiplier: null,
  nextDropTime: new Date().toISOString(),
  roundHistory: [],
  recentRewards: []
};

const emptyHolders: HoldersResponse = { topHolders: [] };
const REFRESH_MS = 12_000;
const SOURCE_SYMBOL = process.env.NEXT_PUBLIC_SOURCE_SYMBOL ?? "HOOD";
const REWARD_SYMBOL = process.env.NEXT_PUBLIC_REWARD_SYMBOL ?? "rewards";

async function getJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

function compactAddress(address: string) {
  if (!address) return "Awaiting";
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function formatNumber(value: number, maximumFractionDigits = 2) {
  if (!Number.isFinite(value) || value <= 0) return "Awaiting";
  return value.toLocaleString(undefined, { maximumFractionDigits });
}

function formatCount(value: number) {
  if (!Number.isFinite(value) || value < 0) return "Awaiting";
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatAmount(value: number, symbol: string, maximumFractionDigits = 2) {
  if (!Number.isFinite(value) || value <= 0) return "Awaiting live distribution";
  return `${formatNumber(value, maximumFractionDigits)} ${symbol}`;
}

function formatMultiplier(value: number | null | undefined) {
  if (!Number.isFinite(value ?? NaN) || !value) return "Awaiting live state";
  return `${value.toFixed(2)}x`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Awaiting" : date.toLocaleString();
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function statusLabel(status: string) {
  if (status === "completed" || status === "settled") return "Settled";
  if (status === "running") return "Running";
  return status.replace(/_/g, " ");
}

export function useProtocolData() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [holders, setHolders] = useState<HoldersResponse | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;

    const load = async () => {
      const [nextStats, nextHolders] = await Promise.all([
        getJson<StatsResponse>("/api/stats", emptyStats),
        getJson<HoldersResponse>("/api/holders", emptyHolders)
      ]);

      if (!active) return;
      setStats(nextStats);
      setHolders(nextHolders);
    };

    load();
    const refreshTimer = window.setInterval(load, REFRESH_MS);
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return { stats, holders, now };
}

export function HeroCountdown() {
  const { stats, now } = useProtocolData();
  const nextDropTime = stats?.nextDropTime ? Date.parse(stats.nextDropTime) : 0;
  const countdown = nextDropTime ? formatCountdown(nextDropTime - now) : "Loading";

  return (
    <div className="hero-countdown" aria-live="polite">
      <span>Next Reward Drop</span>
      <strong>{countdown}</strong>
    </div>
  );
}

export function LiveProtocolDashboard() {
  const { stats } = useProtocolData();
  const rounds = stats?.roundHistory ?? [];
  const todaysAirdrops = countToday(rounds);

  return (
    <section className="section live-section airdrop-section" id="dashboard">
      <div className="container">
        <div className="section-kicker">Proof section</div>
        <div className="section-head split-head">
          <h2>The Hood pays live.</h2>
          <p>Live values come from the existing reward backend. No fake production data.</p>
        </div>
        <div className="lux-grid dashboard-grid airdrop-grid">
          <MetricCard label={`${REWARD_SYMBOL} Purchased`} value={formatAmount(sumRounds(rounds, "rewardBought"), REWARD_SYMBOL)} />
          <MetricCard label="Today's Drops" value={stats ? formatCount(todaysAirdrops) : "Loading"} />
          <MetricCard label="Current Epoch" value={stats ? formatCount(stats.currentEpoch) : "Loading"} />
          <MetricCard label={`Eligible ${SOURCE_SYMBOL} Holders`} value={stats ? formatCount(stats.latestEligibleHolders) : "Loading"} strong />
          <MetricCard label="Hood Bonus" value="5.00x" muted />
        </div>
      </div>
    </section>
  );
}

function countToday(rounds: Round[]) {
  const today = new Date().toDateString();
  return rounds.filter((round) => new Date(round.startedAt).toDateString() === today).length;
}

function sumRounds(rounds: Round[], key: "rewardBought" | "distributedPump") {
  return rounds.reduce((sum, round) => sum + (Number.isFinite(round[key]) ? round[key] : 0), 0);
}

function MetricCard({
  label,
  value,
  strong,
  muted
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <article className={strong ? "metric-card metric-card-strong" : muted ? "metric-card metric-card-muted" : "metric-card"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

const hoodModelCards = [
  ["80%", "Supply weight", `$${SOURCE_SYMBOL} held still drives most of the allocation.`],
  ["20%", "Robin Hood boost", "Smaller supply share and lower SOL balance get a slight tilt."],
  ["5×", "Hood Bonus", "One eligible wallet can receive the special bonus on a live drop."]
];

export function HoodBonusSection() {
  return (
    <section className="section conviction-section" id="hood-bonus">
      <div className="container">
        <div className="section-kicker">Hood Bonus</div>
        <div className="section-head split-head">
          <h2>One bonus. Simple math.</h2>
          <p>Rewards are primarily based on holdings. The Robin Hood tilt is intentionally small and transparent.</p>
        </div>
        <div className="multiplier-grid">
          {hoodModelCards.map(([value, title, copy]) => (
            <article className="multiplier-card" key={title}>
              <span>{value}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
              <strong>{value}</strong>
            </article>
          ))}
        </div>
        <div className="reset-warning-card">
          <span>Important</span>
          <strong>The old hold-time multiplier is removed.</strong>
          <p>The live allocation now uses $HOOD balance plus the lightweight Robin Hood boost. The separate lucky bonus is 5x.</p>
        </div>
        <div className="conviction-card streak-card">
          <span>Transparent reward weight</span>
          <h3>Robin Hood weighting</h3>
          <div className="streak-readout">
            <div>
              <span>Primary weight</span>
              <strong>~80% $HOOD held</strong>
            </div>
            <div>
              <span>Trench tilt</span>
              <strong>~20% smaller holder / lower SOL</strong>
            </div>
            <div>
              <span>Bonus</span>
              <strong>5x Hood Bonus</strong>
            </div>
          </div>
          <div className="conviction-progress" aria-hidden="true">
            <i />
          </div>
          <p>Supply weighting still dominates. The boost only nudges rewards toward the trenches.</p>
          <div className="max-row">
            <span>Bonus max</span>
            <b>5×</b>
          </div>
        </div>
      </div>
      <div className="container rank-strip" aria-label="Reward model">
        {["Hold", "Fees buy rewards", "80% holdings", "20% trench tilt", "5x bonus"].map((rank) => (
          <span key={rank}>{rank}</span>
        ))}
      </div>
    </section>
  );
}

export function PermanentEligibility() {
  return (
    <section className="section eligibility-section" id="eligibility">
      <div className="container warning-layout">
        <div>
          <div className="section-kicker">Eligibility rules</div>
          <h2>Stay in the forest.</h2>
        </div>
        <div className="eligibility-flow">
          {[`1M+ $${SOURCE_SYMBOL}`, "Stay Eligible", "Every 5 Minutes", "Rewards Buy", "Hood Weight", "Automatic Airdrop"].map((item, index) => (
            <article className="eligibility-card" key={item}>
              <span>{index + 1}</span>
              <strong>{item}</strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RewardExplanation() {
  return (
    <section className="section reward-explainer-section" id="how">
      <div className="container">
        <div className="section-kicker">How rewards work</div>
        <div className="section-head split-head">
          <h2>Simple: hold HOOD, receive rewards.</h2>
          <p>Most of your allocation comes from how much $HOOD you hold. A smaller portion gives a Robin Hood tilt to the trenches.</p>
        </div>
        <div className="reward-flow">
          {[
            `Hold at least 1,000,000 $${SOURCE_SYMBOL}`,
            `Creator fees buy ${REWARD_SYMBOL} every 5 minutes`,
            `${REWARD_SYMBOL} is distributed to eligible holders`,
            "~80% of weight comes from $HOOD held",
            "~20% slightly favors smaller holders and lower SOL wallets"
          ].map((item) => (
            <article className="reward-flow-card" key={item}>
              <strong>{item}</strong>
            </article>
          ))}
        </div>
        <div className="share-example">
          {[
            ["Holder A", "More $HOOD", "receives a larger base share"],
            ["Holder B", "Smaller wallet", "can receive a slight boost"],
            ["Holder C", "Hood Bonus", "can receive the 5x bonus"]
          ].map(([holder, multiplier, copy]) => (
            <article className="share-card" key={holder}>
              <span>{holder}</span>
              <strong>{multiplier}</strong>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BullBoard() {
  const { stats, holders } = useProtocolData();
  const recentRewards = stats?.recentRewards ?? [];

  const earnedByWallet = useMemo(() => {
    const totals = new Map<string, number>();
    for (const reward of recentRewards) {
      totals.set(reward.wallet, (totals.get(reward.wallet) ?? 0) + reward.rewardAmount);
    }
    return totals;
  }, [recentRewards]);

  const rows = holders?.topHolders ?? [];

  return (
    <section className="section bull-board-section" id="hood-board">
      <div className="container">
        <div className="section-kicker">The Hood Board</div>
        <div className="section-head split-head">
          <h2>THE HOOD BOARD</h2>
          <p>Ranked by settled rewards earned, then current $HOOD balance.</p>
          <a className="cta secondary" href="/fallen-bulls">
            Outlawed Wallets
          </a>
        </div>
        <div className="history-card bull-board-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Wallet</th>
                  <th>$HOOD Held</th>
                  <th>Supply Share</th>
                  <th>Total {REWARD_SYMBOL} Earned</th>
                  <th>Last Airdrop</th>
                  <th>Hood Bonus</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.slice(0, 25).map((holder) => {
                    const lastReward = recentRewards.find((reward) => reward.wallet === holder.address);
                    const recentEarned = holder.totalAnsemEarned ?? earnedByWallet.get(holder.address) ?? 0;
                    return (
                      <tr key={holder.address}>
                        <td>{compactAddress(holder.address)}</td>
                        <td>{formatNumber(holder.balance, 0)}</td>
                        <td>{holder.percentage}%</td>
                        <td>{recentEarned > 0 ? formatAmount(recentEarned, REWARD_SYMBOL) : "Awaiting holder totals"}</td>
                        <td>{holder.lastFeedingAt ? formatDate(holder.lastFeedingAt) : lastReward ? formatDate(lastReward.time) : "Awaiting airdrop"}</td>
                        <td>Eligible for 5x</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6}>Awaiting The Hood Board.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export function RecentAirdrops() {
  const { stats } = useProtocolData();
  const rewards = stats?.recentRewards ?? [];

  return (
    <section className="section recent-airdrops-section" id="airdrops">
      <div className="container">
        <div className="section-kicker">Recent airdrops</div>
        <div className="section-head split-head">
          <h2>Proof the drops are live.</h2>
          <p>Settled reward transfers from the live backend.</p>
        </div>
        <div className="history-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Wallet</th>
                  <th>Bonus</th>
                  <th>{REWARD_SYMBOL} Received</th>
                  <th>Time</th>
                  <th>TX Link</th>
                </tr>
              </thead>
              <tbody>
                {rewards.length ? (
                  rewards.slice(0, 50).map((reward) => (
                    <tr key={`${reward.wallet}-${reward.time}-${reward.rewardAmount}`}>
                      <td>{compactAddress(reward.wallet)}</td>
                      <td>{reward.goldenMultiplier > 1 ? `${reward.goldenMultiplier.toFixed(2)}x Hood Bonus` : "Base"}</td>
                      <td>{formatAmount(reward.rewardAmount, REWARD_SYMBOL)}</td>
                      <td>{formatDate(reward.time)}</td>
                      <td>
                        {reward.txSig ? (
                          <a href={`https://solscan.io/tx/${reward.txSig}`} target="_blank" rel="noreferrer">
                            Solscan
                          </a>
                        ) : (
                          "Awaiting tx"
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>Awaiting settled reward airdrops.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HolderLookup() {
  const [wallet, setWallet] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(Boolean(wallet.trim()));
  };

  return (
    <section className="section lookup-section" id="lookup">
      <div className="container split-section">
        <div>
          <div className="section-kicker">Holder lookup</div>
          <h2>Check your place in the Hood.</h2>
          <p className="lead">
            Wallet-level status uses the live holder-state tracker after the first tracked epoch.
          </p>
        </div>
        <form className="lookup-card" onSubmit={handleSubmit}>
          <label htmlFor="wallet">Wallet address</label>
          <div className="lookup-row">
            <input
              id="wallet"
              value={wallet}
              onChange={(event) => setWallet(event.target.value)}
              placeholder="Paste wallet address"
            />
            <button type="submit">Lookup</button>
          </div>
          <div className="lookup-result">
            {submitted ? (
              <>
                <strong>{compactAddress(wallet)}</strong>
                <span>Awaiting live backend integration for wallet-level Hood status.</span>
              </>
            ) : (
              <span>Enter a wallet to check eligibility once lookup integration is live.</span>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

export function AirdropHistory() {
  const { stats } = useProtocolData();
  const rounds = stats?.roundHistory ?? [];

  return (
    <section className="section history-section" id="airdrops-history">
      <div className="container">
        <div className="section-kicker">Airdrop history</div>
        <div className="section-head split-head">
          <h2>{REWARD_SYMBOL} Distributions</h2>
          <p>Settled airdrops only. Failed or skipped worker attempts are not counted.</p>
        </div>
        <div className="history-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Epoch</th>
                  <th>{REWARD_SYMBOL} Purchased</th>
                  <th>Recipients</th>
                  <th>Hood Weight</th>
                  <th>Total Distributed</th>
                  <th>Transaction</th>
                </tr>
              </thead>
              <tbody>
                {rounds.length ? (
                  rounds.map((round) => (
                    <tr key={`${round.epoch}-${round.startedAt}`}>
                      <td>#{round.epoch}</td>
                      <td>{formatAmount(round.rewardBought, REWARD_SYMBOL)}</td>
                      <td>{round.distributedPump > 0 ? "Settled" : statusLabel(round.status)}</td>
                      <td>80/20 live model</td>
                      <td>{formatAmount(round.distributedPump, REWARD_SYMBOL)}</td>
                      <td>
                        {round.txSig ? (
                          <a href={`https://solscan.io/tx/${round.txSig}`} target="_blank" rel="noreferrer">
                            Solscan
                          </a>
                        ) : (
                          "Awaiting tx"
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>Awaiting settled reward airdrops.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
