"use client";

import Image from "next/image";
import { ArrowDown, ArrowRight, Check, ExternalLink, Radio, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useScout } from "../scout/scout-provider";

type MarketCapPoint = {
  value: number | null;
  source: "NASDAQ" | "DEXSCREENER";
  status: "live" | "unavailable" | "awaiting-mint";
  valuationType: "MARKET CAP" | "FDV" | null;
  updatedAt: string | null;
  url: string | null;
};

type MarketCaps = {
  sndk: MarketCapPoint;
  sndk6900: MarketCapPoint;
  comparison: {
    targetMultiple: number;
    progressPercent: number;
    gapUsd: number;
  } | null;
  updatedAt: string;
};

const campaign = [
  {
    src: "/brand/sndk6900-red-sea.png",
    alt: "SNDK6900 red landscape campaign artwork",
    className: "sndk-gallery__item--wide"
  },
  {
    src: "/brand/sndk6900-cyber.png",
    alt: "SNDK6900 cyber campaign artwork",
    className: ""
  },
  {
    src: "/brand/sndk6900-vault.png",
    alt: "SNDK6900 data vault campaign artwork",
    className: "sndk-gallery__item--wide"
  },
  {
    src: "/brand/sndk6900-coinlift.png",
    alt: "SNDK6900 market campaign artwork",
    className: ""
  },
  {
    src: "/brand/sndk6900-vitruvian.png",
    alt: "SNDK6900 Vitruvian campaign artwork",
    className: "sndk-gallery__item--portrait"
  },
  {
    src: "/brand/sndk6900-heatmap.png",
    alt: "SNDK6900 market heatmap campaign artwork",
    className: "sndk-gallery__item--wide"
  },
  {
    src: "/brand/sndk6900-mario.png",
    alt: "SNDK6900 flip campaign artwork",
    className: ""
  }
];

function formatClock(totalSeconds: number) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatUsd(value: number) {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toLocaleString("en-US", { maximumFractionDigits: 2 })}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 2 })}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toLocaleString("en-US", { maximumFractionDigits: 1 })}K`;
  }
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function formatMultiple(value: number) {
  if (value >= 1000) return `${Math.round(value).toLocaleString("en-US")}×`;
  if (value >= 100) return `${value.toFixed(0)}×`;
  if (value >= 10) return `${value.toFixed(1)}×`;
  return `${value.toFixed(2)}×`;
}

function MarketValue({ point, empty }: { point: MarketCapPoint | null; empty: string }) {
  if (point?.value) return <>{formatUsd(point.value)}</>;
  if (point?.status === "awaiting-mint") return <>AWAITING LAUNCH MINT</>;
  return <>{empty}</>;
}

function MarketLink({ point }: { point: MarketCapPoint | null }) {
  if (!point?.url) return null;
  return (
    <a href={point.url} target="_blank" rel="noreferrer">
      {point.source}
      <ExternalLink size={12} aria-hidden="true" />
    </a>
  );
}

export function SndkHomeView() {
  const { launchState, stats, state, lastUpdated } = useScout();
  const [remaining, setRemaining] = useState(5 * 60);
  const [marketCaps, setMarketCaps] = useState<MarketCaps | null>(null);
  const [marketState, setMarketState] = useState<"loading" | "loaded" | "error">("loading");

  useEffect(() => {
    const update = () => {
      const milliseconds = 5 * 60 * 1000 - (Date.now() % (5 * 60 * 1000));
      setRemaining(Math.ceil(milliseconds / 1000));
    };
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const refreshMarketCaps = useCallback(async () => {
    try {
      const response = await fetch("/api/sndk/market-caps", { cache: "no-store" });
      if (!response.ok) throw new Error("Market data unavailable");
      setMarketCaps((await response.json()) as MarketCaps);
      setMarketState("loaded");
    } catch {
      setMarketState("error");
    }
  }, []);

  useEffect(() => {
    void refreshMarketCaps();
    const interval = window.setInterval(() => void refreshMarketCaps(), 60_000);
    return () => window.clearInterval(interval);
  }, [refreshMarketCaps]);

  const verifiedDrops = stats.totalEpochs > 0 ? stats.totalEpochs.toLocaleString("en-US") : "FIRST DROP PENDING";
  const eligibleHolders =
    stats.latestEligibleHolders > 0 ? stats.latestEligibleHolders.toLocaleString("en-US") : "AWAITING SNAPSHOT";
  const distributed =
    stats.totalRewardAirdropped > 0
      ? `${stats.totalRewardAirdropped.toLocaleString("en-US", { maximumFractionDigits: 2 })} SNDK`
      : "NO VERIFIED DISTRIBUTIONS";
  const updatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "CONNECTING";
  const comparison = marketCaps?.comparison ?? null;
  const progressWidth = comparison ? Math.max(0.35, comparison.progressPercent) : 0;
  const marketTimestamp = useMemo(() => {
    if (!marketCaps?.updatedAt) return "MARKET FEED CONNECTING";
    return `UPDATED ${new Date(marketCaps.updatedAt).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    })}`;
  }, [marketCaps?.updatedAt]);

  return (
    <div className="sndk-page">
      <section className="sndk-hero" aria-labelledby="sndk-title">
        <div className="sndk-hero__banner">
          <Image
            src="/brand/sndk6900-banner.png"
            alt="SNDK6900"
            width={1280}
            height={426}
            priority
            sizes="(max-width: 760px) 100vw, 1280px"
          />
          <div className="sndk-hero__banner-status">
            <span><i aria-hidden="true" /> DISTRIBUTION ENGINE {launchState === "live" ? "LIVE" : "READY"}</span>
            <span>05:00 UTC CYCLE</span>
          </div>
        </div>

        <div className="sndk-hero__grid">
          <div className="sndk-hero__copy">
            <p className="sndk-kicker">THE FIVE-MINUTE SNDK DISTRIBUTION LAYER</p>
            <h1 id="sndk-title">FLIP <em>SNDK.</em></h1>
            <p className="sndk-hero__lead">
              Hold SNDK6900. Every five minutes, eligible holders receive SNDK automatically.
            </p>
            <div className="sndk-hero__proof">
              <span><Check size={14} /> NO WALLET CONNECT</span>
              <span><Check size={14} /> NO CLAIM PAGE</span>
              <span><Check size={14} /> ON-CHAIN RECEIPTS</span>
            </div>
            <div className="sndk-hero__actions">
              <a className="sndk-button sndk-button--primary" href="#airdrops">
                HOW AIRDROPS WORK <ArrowDown size={16} />
              </a>
              <a className="sndk-button" href="#flip-index">
                VIEW FLIP INDEX <ArrowRight size={16} />
              </a>
            </div>
          </div>

          <div className="sndk-cycle" id="airdrops">
            <div className="sndk-cycle__topline">
              <span>NEXT HOLDER SNAPSHOT</span>
              <span className="sndk-live-dot"><i /> {launchState === "live" ? "LIVE" : "PRELAUNCH"}</span>
            </div>
            <strong className="sndk-cycle__clock">{formatClock(remaining)}</strong>
            <div className="sndk-cycle__rail" aria-hidden="true"><i /></div>
            <dl>
              <div><dt>REWARD</dt><dd>SNDK</dd></div>
              <div><dt>INTERVAL</dt><dd>5 MIN</dd></div>
              <div><dt>DELIVERY</dt><dd>AUTOMATIC</dd></div>
              <div><dt>RECEIPTS</dt><dd>ON-CHAIN</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section className="sndk-index" id="flip-index" aria-labelledby="flip-index-title">
        <div className="sndk-section-heading">
          <div>
            <p className="sndk-kicker">LIVE COMPARISON // REAL DATA ONLY</p>
            <h2 id="flip-index-title">THE FLIP INDEX</h2>
          </div>
          <button type="button" onClick={() => void refreshMarketCaps()} disabled={marketState === "loading"}>
            <RefreshCw size={14} className={marketState === "loading" ? "sndk-spin" : ""} />
            {marketTimestamp}
          </button>
        </div>

        <div className="sndk-index__board">
          <article>
            <header>
              <span>01 / TARGET</span>
              <MarketLink point={marketCaps?.sndk ?? null} />
            </header>
            <h3>SNDK</h3>
            <strong><MarketValue point={marketCaps?.sndk ?? null} empty="MARKET DATA UNAVAILABLE" /></strong>
            <p>SANDISK CORPORATION // EQUITY MARKET CAP</p>
          </article>
          <div className="sndk-index__versus" aria-hidden="true">VS</div>
          <article>
            <header>
              <span>02 / CHALLENGER</span>
              <MarketLink point={marketCaps?.sndk6900 ?? null} />
            </header>
            <h3>SNDK6900</h3>
            <strong><MarketValue point={marketCaps?.sndk6900 ?? null} empty="ON-CHAIN MARKET DATA UNAVAILABLE" /></strong>
            <p>SOLANA // {marketCaps?.sndk6900.valuationType ?? "MARKET CAP"}</p>
          </article>
        </div>

        <div className="sndk-index__progress">
          <div>
            <span>ROAD TO THE FLIP</span>
            <strong>
              {comparison
                ? `${comparison.progressPercent.toLocaleString("en-US", { maximumFractionDigits: 6 })}%`
                : "AWAITING BOTH LIVE MARKETS"}
            </strong>
          </div>
          <div className="sndk-index__track">
            <i style={{ width: `${progressWidth}%` }} />
          </div>
          <div>
            <span>{comparison ? `${formatUsd(comparison.gapUsd)} GAP` : "NO FABRICATED VALUES"}</span>
            <span>{comparison ? `${formatMultiple(comparison.targetMultiple)} TO FLIP` : "CONNECT LAUNCH MINT TO ACTIVATE"}</span>
          </div>
        </div>
      </section>

      <section className="sndk-stats" aria-label="Verified distribution statistics">
        <article>
          <span>01 / NEXT AIRDROP</span>
          <strong>{formatClock(remaining)}</strong>
          <p>NEXT FIVE-MINUTE UTC BOUNDARY</p>
        </article>
        <article>
          <span>02 / ELIGIBLE HOLDERS</span>
          <strong>{eligibleHolders}</strong>
          <p>LATEST VERIFIED HOLDER SNAPSHOT</p>
        </article>
        <article>
          <span>03 / VERIFIED DROPS</span>
          <strong>{verifiedDrops}</strong>
          <p>COMPLETED DISTRIBUTION CYCLES</p>
        </article>
        <article>
          <span>04 / SNDK DISTRIBUTED</span>
          <strong>{distributed}</strong>
          <p>BACKEND STATUS {state === "error" ? "OFFLINE" : state === "stale" ? "DEGRADED" : updatedLabel}</p>
        </article>
      </section>

      <section className="sndk-mechanics" aria-labelledby="mechanics-title">
        <div className="sndk-section-heading">
          <div>
            <p className="sndk-kicker">ONE POSITION // CONTINUOUS REWARDS</p>
            <h2 id="mechanics-title">HOLD ONCE. RUN EVERY FIVE MINUTES.</h2>
          </div>
        </div>
        <div className="sndk-mechanics__flow">
          <article><b>01</b><span>HOLD</span><strong>SNDK6900</strong><p>Your on-chain balance is your entry.</p></article>
          <i><ArrowRight /></i>
          <article><b>02</b><span>SNAPSHOT</span><strong>EVERY 5 MIN</strong><p>Eligible holders are indexed automatically.</p></article>
          <i><ArrowRight /></i>
          <article><b>03</b><span>DISTRIBUTE</span><strong>RECEIVE SNDK</strong><p>No connect, signature, or manual claim.</p></article>
          <i><ArrowRight /></i>
          <article><b>04</b><span>VERIFY</span><strong>ON-CHAIN</strong><p>Every completed transfer becomes a receipt.</p></article>
        </div>
      </section>

      <section className="sndk-gallery" id="gallery" aria-labelledby="gallery-title">
        <div className="sndk-section-heading">
          <div>
            <p className="sndk-kicker">SNDK6900 // CAMPAIGN ARCHIVE</p>
            <h2 id="gallery-title">BUILT TO FLIP.</h2>
          </div>
          <span>07 VISUAL RECORDS</span>
        </div>
        <div className="sndk-gallery__grid">
          {campaign.map((item, index) => (
            <figure className={item.className} key={item.src}>
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw"
              />
              <figcaption>SNDK6900 // RECORD {String(index + 1).padStart(2, "0")}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="sndk-closing">
        <Image src="/brand/sndk6900-banner.png" alt="SNDK6900" width={1280} height={426} sizes="100vw" />
        <div>
          <p className="sndk-kicker">THE CLOCK NEVER STOPS</p>
          <h2>EVERY FIVE MINUTES.<br />SNDK TO HOLDERS.</h2>
          <a className="sndk-button sndk-button--primary" href="#airdrops">
            VIEW NEXT SNAPSHOT <Radio size={16} />
          </a>
        </div>
      </section>
    </div>
  );
}
