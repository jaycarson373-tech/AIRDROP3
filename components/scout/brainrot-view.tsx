"use client";

import { Check, Copy, ExternalLink, RefreshCcw, Wallet, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { projectConfig, explorerTxUrl } from "./project-config";
import { useScout } from "./scout-provider";
import type { ScoutStats } from "./types";

const EPOCH_MS = 5 * 60 * 1000;
const AWAITING = "Awaiting live data";

type ExtendedStats = ScoutStats & {
  liveDataAvailable?: boolean;
  totalCreatorFeesConvertedSol?: number | null;
  latestTransaction?: string | null;
  sourceMint?: string | null;
  rewardMint?: string | null;
  eligibilityMin?: number | null;
  maxHolderPct?: number | null;
  emergencyPaused?: boolean;
};

type WalletHistoryRow = {
  epochId: string;
  time: string | null;
  rewardAmount: number | null;
  txSig: string | null;
  status: string;
};

type WalletPayload = {
  configured: boolean;
  wallet: string;
  balance: number | null;
  eligibilityStatus: string;
  allocationWeight: string | null;
  nextDistributionTime: string | null;
  totalRewardReceived: number | null;
  history: WalletHistoryRow[];
};

type PublicKeyLike = {
  toBase58?: () => string;
  toString: () => string;
};

type SolanaProvider = {
  publicKey?: PublicKeyLike | null;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKeyLike }>;
  disconnect?: () => Promise<void>;
  on?: (event: "connect" | "disconnect" | "accountChanged", handler: (publicKey?: PublicKeyLike | null) => void) => void;
  off?: (event: "connect" | "disconnect" | "accountChanged", handler: (publicKey?: PublicKeyLike | null) => void) => void;
};

declare global {
  interface Window {
    solana?: SolanaProvider;
  }
}

function nextEpochTimestamp(now = Date.now()) {
  return Math.floor(now / EPOCH_MS + 1) * EPOCH_MS;
}

function useEpochCountdown() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (now === null) {
    return {
      iso: null,
      label: "--:--"
    };
  }

  const target = nextEpochTimestamp(now);
  const remainingSeconds = Math.max(0, Math.ceil((target - now) / 1000));
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return {
    iso: new Date(target).toISOString(),
    label: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  };
}

function publicKeyString(publicKey: PublicKeyLike | null | undefined) {
  if (!publicKey) return null;
  return publicKey.toBase58?.() ?? publicKey.toString();
}

function compactAddress(address: string | null | undefined) {
  if (!address) return AWAITING;
  if (address.length <= 14) return address;
  return `${address.slice(0, 5)}...${address.slice(-5)}`;
}

function formatUtc(value: string | null | undefined) {
  if (!value) return AWAITING;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return AWAITING;
  return `${date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC"
  })} ${date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC"
  })} UTC`;
}

function formatAmount(value: number | null | undefined, fractionDigits = 4) {
  if (value === null || value === undefined || !Number.isFinite(value)) return AWAITING;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: fractionDigits }).format(value);
}

function formatSol(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return AWAITING;
  return `${formatAmount(value, 6)} SOL`;
}

function metricValue(liveDataAvailable: boolean, value: number | null | undefined, formatter = formatAmount) {
  if (!liveDataAvailable) return AWAITING;
  return formatter(value);
}

function statusLabel(status: string | null | undefined) {
  if (status === "skipped" || status === "no_distribution") return "No distribution this epoch";
  if (status === "failed") return "Failed";
  if (status === "running") return "Running";
  if (status === "completed" || status === "settled") return "Completed";
  return AWAITING;
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function CopyButton({ value, label }: { value: string | null | undefined; label: string }) {
  const [copied, setCopied] = useState(false);
  const disabled = !value;

  const handleClick = async () => {
    if (!value) return;
    await copyText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <button className="brainrot-copy" type="button" onClick={handleClick} disabled={disabled} aria-label={`Copy ${label}`}>
      {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

function MintCard({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <article className="brainrot-mint-card">
      <span>{label}</span>
      <strong>{value || AWAITING}</strong>
      <CopyButton value={value} label={label} />
    </article>
  );
}

function useWallet(walletAddress: string | null) {
  const [wallet, setWallet] = useState<WalletPayload | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!walletAddress) {
      setWallet(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/wallet/${walletAddress}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`wallet ${response.status}`);
        const payload = (await response.json()) as WalletPayload;
        if (!cancelled) setWallet(payload);
      } catch (error) {
        console.warn("wallet fetch failed", error);
        if (!cancelled) {
          setWallet({
            configured: false,
            wallet: walletAddress,
            balance: null,
            eligibilityStatus: AWAITING,
            allocationWeight: null,
            nextDistributionTime: new Date(nextEpochTimestamp()).toISOString(),
            totalRewardReceived: null,
            history: []
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const interval = window.setInterval(load, 20_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [walletAddress]);

  return { wallet, loading };
}

export function BrainrotView() {
  const { stats, state, refresh } = useScout();
  const extendedStats = stats as ExtendedStats;
  const countdown = useEpochCountdown();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletMessage, setWalletMessage] = useState<string | null>(null);
  const { wallet, loading: walletLoading } = useWallet(walletAddress);
  const liveDataAvailable = extendedStats.liveDataAvailable === true;
  const sourceMint = extendedStats.sourceMint ?? projectConfig.brainrotMint;
  const rewardMint = extendedStats.rewardMint ?? projectConfig.neuralMint;
  const buyUrl = projectConfig.buyUrl || (sourceMint ? `https://jup.ag/swap/SOL-${sourceMint}` : "#verified-mints");
  const buyExternal = buyUrl.startsWith("http");
  const latestTransaction =
    extendedStats.latestTransaction ??
    stats.roundHistory.find((row) => Boolean(row.txSig))?.txSig ??
    stats.recentRewards.find((row) => Boolean(row.txSig))?.txSig ??
    null;
  const creatorFeesConverted = extendedStats.totalCreatorFeesConvertedSol ?? stats.totalSolValueAirdropped;
  const eligibilityText = useMemo(() => {
    const explicit = process.env.NEXT_PUBLIC_ELIGIBILITY_LABEL?.trim();
    if (explicit) return explicit;
    if (extendedStats.eligibilityMin && extendedStats.maxHolderPct) {
      return `${formatAmount(extendedStats.eligibilityMin, 0)}+ $BRAINROT and below ${extendedStats.maxHolderPct}% of supply.`;
    }
    return "Awaiting confirmed eligibility requirements.";
  }, [extendedStats.eligibilityMin, extendedStats.maxHolderPct]);

  useEffect(() => {
    const provider = window.solana;
    if (!provider) return;

    provider
      .connect({ onlyIfTrusted: true })
      .then((response) => setWalletAddress(publicKeyString(response.publicKey)))
      .catch(() => undefined);

    const handleConnect = (publicKey?: PublicKeyLike | null) => setWalletAddress(publicKeyString(publicKey ?? provider.publicKey));
    const handleDisconnect = () => setWalletAddress(null);
    provider.on?.("connect", handleConnect);
    provider.on?.("accountChanged", handleConnect);
    provider.on?.("disconnect", handleDisconnect);

    return () => {
      provider.off?.("connect", handleConnect);
      provider.off?.("accountChanged", handleConnect);
      provider.off?.("disconnect", handleDisconnect);
    };
  }, []);

  const connectWallet = async () => {
    const provider = window.solana;
    if (!provider) {
      setWalletMessage("Install a Solana wallet such as Phantom to view wallet-specific rewards.");
      return;
    }

    try {
      const response = await provider.connect();
      setWalletAddress(publicKeyString(response.publicKey));
      setWalletMessage(null);
    } catch (error) {
      console.warn("wallet connect failed", error);
      setWalletMessage("Wallet connection was cancelled.");
    }
  };

  const disconnectWallet = async () => {
    await window.solana?.disconnect?.();
    setWalletAddress(null);
  };

  return (
    <div className="brainrot-home">
      <section className="brainrot-hero" aria-labelledby="brainrot-title">
        <div className="brainrot-noise" aria-hidden="true" />
        <div className="brainrot-particles" aria-hidden="true" />
        <img className="brainrot-hero-banner" src="/brand/brainrot-banner.jpg" alt="BRAINROT banner with meme characters" />
        <div className="brainrot-hero-inner">
          <div className="brainrot-hero-copy">
            <div className="brainrot-eyebrow">THE INTERNET'S FINAL FORM</div>
            <h1 id="brainrot-title">BRAINROT</h1>
            <p className="brainrot-headline">HOLD BRAINROT. GET NEURALINK.</p>
            <p className="brainrot-five-second">
              <span>HOLD $BRAINROT.</span>
              <span>CREATOR FEES BUY $NEURAL.</span>
              <span>HOLDERS GET AIRDROPPED EVERY FIVE MINUTES.</span>
            </p>
            <p className="brainrot-description">
              Brainrot finally gets its Solana run. Accrued creator fees buy tokenized Neuralink pre-IPO exposure and
              airdrop it to eligible $BRAINROT holders every five minutes.
            </p>
            <div className="brainrot-mobile-timer" aria-label="Next NEURAL drop timer">
              <div className="brainrot-timer">
                <span>NEXT $NEURAL DROP</span>
                <strong>{countdown.label}</strong>
                <small>{formatUtc(countdown.iso)}</small>
              </div>
            </div>
            <div className="brainrot-loop" aria-label="BRAINROT reward loop">
              <span>TRADE $BRAINROT</span>
              <span>CREATOR FEES ACCRUE</span>
              <span>FEES BUY $NEURAL</span>
              <span>HOLDERS RECEIVE AIRDROPS</span>
            </div>
            <div className="brainrot-actions">
              <a className="brainrot-button primary" href={buyUrl} target={buyExternal ? "_blank" : undefined} rel={buyExternal ? "noreferrer" : undefined}>
                <Zap size={18} aria-hidden="true" />
                BUY $BRAINROT
              </a>
              <a className="brainrot-button secondary" href="#live-drops">
                VIEW LIVE DROPS
              </a>
            </div>
          </div>

          <aside className="brainrot-hero-side" aria-label="Next NEURAL drop timer">
            <div className="brainrot-timer">
              <span>NEXT $NEURAL DROP</span>
              <strong>{countdown.label}</strong>
              <small>{formatUtc(countdown.iso)}</small>
            </div>
            <div className="brainrot-character-card">
              <img src="/brand/brainrot-logo.jpg" alt="BRAINROT Patrick character" />
              <div>
                <span>MAIN CHARACTER</span>
                <strong>Patrick leads the feed</strong>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="brainrot-dashboard-section" id="live-drops" aria-labelledby="live-drops-title">
        <div className="brainrot-section-head">
          <span>LIVE REWARDS DASHBOARD</span>
          <h2 id="live-drops-title">$NEURAL distribution proof</h2>
          <button className="brainrot-refresh" type="button" onClick={() => void refresh()} aria-label="Refresh live data">
            <RefreshCcw size={16} aria-hidden="true" />
            Refresh
          </button>
        </div>

        {extendedStats.emergencyPaused ? <div className="brainrot-alert">Emergency pause is active. Distribution execution is disabled.</div> : null}

        <div className="brainrot-metrics" aria-busy={state === "loading"}>
          <Metric label="Next $NEURAL drop" value={formatUtc(extendedStats.nextDropTime ?? countdown.iso)} />
          <Metric label="Total $NEURAL distributed" value={metricValue(liveDataAvailable, stats.totalRewardAirdropped)} />
          <Metric label="Drops completed" value={metricValue(liveDataAvailable, stats.totalEpochs, (value) => formatAmount(value, 0))} />
          <Metric label="Creator fees converted" value={metricValue(liveDataAvailable, creatorFeesConverted, formatSol)} />
          <Metric label="Eligible holders" value={metricValue(liveDataAvailable, stats.latestEligibleHolders, (value) => formatAmount(value, 0))} />
          <Metric
            label="Latest transaction"
            value={liveDataAvailable && latestTransaction ? compactAddress(latestTransaction) : AWAITING}
            href={latestTransaction ? explorerTxUrl(latestTransaction) : undefined}
          />
        </div>

        <div className="brainrot-history-wrap">
          <div className="brainrot-history-title">
            <h3>Live Distribution History</h3>
            <span>{liveDataAvailable ? "Real backend and onchain records" : AWAITING}</span>
          </div>
          <div className="brainrot-history-scroll">
            <table className="brainrot-history">
              <thead>
                <tr>
                  <th>Date and UTC time</th>
                  <th>Creator fees used</th>
                  <th>$NEURAL purchased</th>
                  <th>Recipients</th>
                  <th>Transaction signature</th>
                  <th>Solscan</th>
                </tr>
              </thead>
              <tbody>
                {liveDataAvailable && stats.roundHistory.length ? (
                  stats.roundHistory.map((row, index) => {
                    const skipped = row.status === "skipped" || row.status === "no_distribution";
                    return (
                      <tr key={`${row.startedAt}-${index}`}>
                        <td>{formatUtc(row.startedAt)}</td>
                        <td>{skipped ? "No distribution this epoch" : formatSol(row.claimedSol)}</td>
                        <td>{skipped ? "No distribution this epoch" : formatAmount(row.rewardBought)}</td>
                        <td>{skipped ? "No distribution this epoch" : formatAmount(row.eligibleCount, 0)}</td>
                        <td>{row.txSig ? compactAddress(row.txSig) : statusLabel(row.status)}</td>
                        <td>
                          {row.txSig ? (
                            <a href={explorerTxUrl(row.txSig)} target="_blank" rel="noreferrer">
                              View <ExternalLink size={14} aria-hidden="true" />
                            </a>
                          ) : (
                            statusLabel(row.status)
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6}>{AWAITING}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="brainrot-mints" id="verified-mints" aria-labelledby="mint-title">
        <div className="brainrot-section-head">
          <span>VERIFIED MINTS</span>
          <h2 id="mint-title">Never identify a token by ticker alone.</h2>
        </div>
        <div className="brainrot-mint-grid">
          <MintCard label="$BRAINROT mint" value={sourceMint} />
          <MintCard label="$NEURAL mint" value={rewardMint} />
        </div>
      </section>

      <section className="brainrot-steps" id="how" aria-labelledby="how-title">
        <div className="brainrot-section-head">
          <span>HOW IT WORKS</span>
          <h2 id="how-title">Trade attention into automated $NEURAL drops.</h2>
        </div>
        <div className="brainrot-step-grid">
          <Step number="1" title="HOLD BRAINROT" body="Buy and hold $BRAINROT in an eligible Solana wallet." />
          <Step
            number="2"
            title="FEES BUY NEURALINK"
            body="Accrued creator fees automatically purchase the verified $NEURAL PreStocks asset on Solana."
          />
          <Step
            number="3"
            title="GET AIRDROPPED"
            body="Every five minutes, purchased $NEURAL is distributed to eligible $BRAINROT holders using the existing holder-allocation logic."
          />
        </div>
        <div className="brainrot-eligibility">
          <span>Confirmed eligibility requirements</span>
          <strong>{eligibilityText}</strong>
        </div>
      </section>

      <section className="brainrot-thesis" id="thesis" aria-labelledby="thesis-title">
        <div className="brainrot-section-head">
          <span>THESIS</span>
          <h2 id="thesis-title">THE META THAT NEVER GOT ITS REAL RUN</h2>
        </div>
        <p>
          Brainrot became the universal language of the internet. Triple T. 67. Tralalero Tralala. Bombardiro
          Crocodilo. Billions of views, endless characters and an entire generation speaking in memes.
        </p>
        <p>Individual characters have run, but Brainrot itself has never had its definitive Solana run.</p>
        <p>$BRAINROT changes that—and wires the attention directly into tokenized Neuralink exposure.</p>
      </section>

      <section className="brainrot-neural" id="neural" aria-labelledby="neural-title">
        <div className="brainrot-section-head">
          <span>WHY NEURALINK?</span>
          <h2 id="neural-title">THE INTERNET'S FINAL FORM MEETS THE FUTURE OF THE BRAIN</h2>
        </div>
        <p>
          Neuralink remains private and has no publicly traded stock ticker. $NEURAL provides tokenized pre-IPO
          economic exposure on Solana. $BRAINROT turns creator fees into recurring $NEURAL airdrops for eligible
          holders.
        </p>
      </section>

      <section className="brainrot-wallet" id="wallet" aria-labelledby="wallet-title">
        <div className="brainrot-section-head">
          <span>WALLET PANEL</span>
          <h2 id="wallet-title">Your live eligibility view</h2>
          {walletAddress ? (
            <button className="brainrot-refresh" type="button" onClick={disconnectWallet}>
              Disconnect
            </button>
          ) : (
            <button className="brainrot-refresh" type="button" onClick={connectWallet}>
              <Wallet size={16} aria-hidden="true" />
              Connect
            </button>
          )}
        </div>

        {walletMessage ? <div className="brainrot-alert">{walletMessage}</div> : null}

        <div className="brainrot-wallet-grid" aria-busy={walletLoading}>
          <WalletMetric label="Connected wallet" value={walletAddress ? compactAddress(walletAddress) : "Connect wallet"} />
          <WalletMetric label="$BRAINROT balance" value={wallet ? formatAmount(wallet.balance) : walletAddress ? AWAITING : "Connect wallet"} />
          <WalletMetric label="Eligibility status" value={wallet?.eligibilityStatus ?? (walletAddress ? AWAITING : "Connect wallet")} />
          <WalletMetric label="Allocation weight" value={wallet?.allocationWeight ?? (walletAddress ? AWAITING : "Connect wallet")} />
          <WalletMetric label="Next distribution time" value={walletAddress ? formatUtc(wallet?.nextDistributionTime ?? countdown.iso) : "Connect wallet"} />
          <WalletMetric label="Total $NEURAL received" value={wallet ? formatAmount(wallet.totalRewardReceived) : walletAddress ? AWAITING : "Connect wallet"} />
        </div>

        <div className="brainrot-wallet-history">
          <h3>Personal Distribution History</h3>
          <div className="brainrot-history-scroll">
            <table className="brainrot-history compact">
              <thead>
                <tr>
                  <th>UTC time</th>
                  <th>$NEURAL received</th>
                  <th>Status</th>
                  <th>Solscan</th>
                </tr>
              </thead>
              <tbody>
                {wallet?.history.length ? (
                  wallet.history.map((row) => (
                    <tr key={`${row.epochId}-${row.txSig ?? row.status}`}>
                      <td>{formatUtc(row.time ?? row.epochId)}</td>
                      <td>{formatAmount(row.rewardAmount)}</td>
                      <td>{row.status}</td>
                      <td>
                        {row.txSig ? (
                          <a href={explorerTxUrl(row.txSig)} target="_blank" rel="noreferrer">
                            View <ExternalLink size={14} aria-hidden="true" />
                          </a>
                        ) : (
                          AWAITING
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>{walletAddress ? AWAITING : "Connect wallet"}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="brainrot-faq" id="faq" aria-labelledby="faq-title">
        <div className="brainrot-section-head">
          <span>FAQ</span>
          <h2 id="faq-title">Mechanics, proof and disclosure.</h2>
        </div>
        <div className="brainrot-faq-grid">
          <Faq title="What is $BRAINROT?" body="$BRAINROT is a Solana memecoin for the internet's brainrot meta with automated $NEURAL reward distribution." />
          <Faq title="What is $NEURAL?" body="$NEURAL is the verified PreStocks asset that provides tokenized Neuralink pre-IPO economic exposure on Solana." />
          <Faq title="How are airdrops funded?" body="Accrued creator fees are claimed server-side, swapped into $NEURAL, and distributed when the epoch clears the configured threshold." />
          <Faq title="When do distributions happen?" body="Distributions run on fixed five-minute UTC epochs. The countdown is synchronized to those epochs and does not restart on refresh." />
          <Faq title="Who is eligible?" body={eligibilityText} />
          <Faq title="How are allocations calculated?" body="Allocations use the existing holder-allocation logic already deployed in the airdrop worker. This site does not invent a new formula." />
          <Faq title="What happens when no fees accrue?" body="If fees or purchased rewards are below the configured minimum threshold, the dashboard shows No distribution this epoch." />
          <Faq title="Where can every drop be verified?" body="Every completed distribution links to its Solana transaction on Solscan from the live history table." />
          <Faq
            title="Is this affiliated with Neuralink or PreStocks?"
            body="$NEURAL provides tokenized economic exposure to Neuralink through PreStocks. It does not provide direct Neuralink ownership, voting rights, dividends, information rights or guaranteed liquidity. $BRAINROT is not affiliated with or endorsed by Neuralink or PreStocks. Rewards depend on accrued creator fees, asset availability, technical execution and holder eligibility. Geographic restrictions may apply. Nothing on this website constitutes financial advice."
          />
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <article className="brainrot-metric">
      <span>{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer">
          {value} <ExternalLink size={14} aria-hidden="true" />
        </a>
      ) : (
        <strong>{value}</strong>
      )}
    </article>
  );
}

function WalletMetric({ label, value }: { label: string; value: string }) {
  return (
    <article className="brainrot-wallet-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Step({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <article className="brainrot-step">
      <span>{number}</span>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}

function Faq({ title, body }: { title: string; body: string }) {
  return (
    <article className="brainrot-faq-item">
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}
