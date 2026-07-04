"use client";

import { useEffect, useMemo, useState } from "react";
import { CopyCaButton } from "./copy-ca-button";

type TokenMarket = {
  priceUsd: number | null;
  change24h: number | null;
  marketCapUsd: number | null;
  fdvUsd: number | null;
  url: string | null;
  symbol: string;
};

type MarketResponse = {
  ansem: TokenMarket;
  source: TokenMarket;
  updatedAt: string;
};

type StatsResponse = {
  totalRewardAirdropped: number;
  nextDropTime: string;
};

type MarketTickerProps = {
  logoSrc: string;
  projectName: string;
  contractAddress: string;
  buyUrl: string;
  xUrl: string;
};

const REFRESH_MS = 30_000;
const emptyMarket: MarketResponse = {
  ansem: { priceUsd: null, change24h: null, marketCapUsd: null, fdvUsd: null, url: null, symbol: "ANSEM" },
  source: { priceUsd: null, change24h: null, marketCapUsd: null, fdvUsd: null, url: null, symbol: "BULLIFY" },
  updatedAt: new Date().toISOString()
};
const emptyStats: StatsResponse = {
  totalRewardAirdropped: 0,
  nextDropTime: new Date().toISOString()
};

async function getJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

function formatPrice(value: number | null) {
  if (!Number.isFinite(value) || value === null || value <= 0) return "Loading";
  if (value >= 1) {
    return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
  if (value >= 0.01) {
    return `$${value.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
  }
  return `$${value.toLocaleString(undefined, { maximumSignificantDigits: 4 })}`;
}

function formatCompact(value: number, maximumFractionDigits = 2) {
  if (!Number.isFinite(value) || value <= 0) return "0";
  return Intl.NumberFormat(undefined, {
    notation: value >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits
  }).format(value);
}

function formatMoney(value: number | null) {
  if (!Number.isFinite(value) || value === null || value <= 0) return "Loading";
  return `$${formatCompact(value, value >= 1_000_000 ? 2 : 0)}`;
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function shortAddress(address: string) {
  if (!address) return "";
  if (address.length <= 14) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function MarketPill({ market }: { market: TokenMarket }) {
  const content = (
    <>
      <span>{market.symbol}</span>
      <strong>{formatPrice(market.priceUsd)}</strong>
    </>
  );

  if (market.url) {
    return (
      <a className="ticker-pill ticker-price-pill" href={market.url} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return <div className="ticker-pill ticker-price-pill">{content}</div>;
}

function PlaceholderMarketPill({ symbol }: { symbol: string }) {
  return (
    <div className="ticker-pill ticker-price-pill">
      <span>{symbol}</span>
      <strong>Loading</strong>
    </div>
  );
}

export function MarketTicker({ logoSrc, projectName, contractAddress, buyUrl, xUrl }: MarketTickerProps) {
  const [market, setMarket] = useState<MarketResponse>(emptyMarket);
  const [stats, setStats] = useState<StatsResponse>(emptyStats);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;

    const load = async () => {
      const [nextMarket, nextStats] = await Promise.all([
        getJson<MarketResponse>("/api/market", emptyMarket),
        getJson<StatsResponse>("/api/stats", emptyStats)
      ]);

      if (!active) return;
      setMarket(nextMarket);
      setStats(nextStats);
    };

    load();
    const timer = window.setInterval(load, REFRESH_MS);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const countdown = useMemo(() => {
    const next = Date.parse(stats.nextDropTime);
    return Number.isFinite(next) ? formatCountdown(next - now) : "Loading";
  }, [now, stats.nextDropTime]);

  return (
    <div className="market-ticker" aria-label="Live market ticker">
      <div className="container market-ticker-inner">
        <a className="ticker-brand" href="/" aria-label={`${projectName} home`}>
          <img src={logoSrc} alt="" />
          <strong>{projectName}</strong>
        </a>
        <div className="ticker-track">
          <div className="ticker-status">
            <span />
            Live
          </div>
          <MarketPill market={market.ansem} />
          <PlaceholderMarketPill symbol="SOL" />
          <PlaceholderMarketPill symbol="BTC" />
          <PlaceholderMarketPill symbol="ETH" />
          <PlaceholderMarketPill symbol="HYPE" />
          <MarketPill market={market.source} />
          <div className="ticker-pill ticker-market-cap">
            <span>Market Cap</span>
            <strong>{formatMoney(market.source.marketCapUsd ?? market.source.fdvUsd)}</strong>
          </div>
          <div className="ticker-pill">
            <span>Total ANSEM Distributed</span>
            <strong>{formatCompact(stats.totalRewardAirdropped, 3)}</strong>
          </div>
          <div className="ticker-pill ticker-countdown">
            <span>Next Epoch</span>
            <strong>{countdown}</strong>
          </div>
        </div>
        <div className="ticker-actions" aria-label="Project links">
          {contractAddress ? <CopyCaButton address={contractAddress} label={shortAddress(contractAddress)} /> : null}
          <a className="ticker-action" href={xUrl} target="_blank" rel="noreferrer" aria-label="Open Bullify on X">
            X
          </a>
          <a className="ticker-action ticker-buy" href={buyUrl} target="_blank" rel="noreferrer">
            Buy
          </a>
        </div>
      </div>
    </div>
  );
}
