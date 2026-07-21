"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  Menu,
  X
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { scoutPublicConfig, shortAddress } from "../../lib/scout-public";
import { formatMoney, formatToken } from "./format";
import { useCountdown } from "./hooks";
import { ScoutProvider, useScout } from "./scout-provider";

const primaryNav = [
  { href: "/terminal", label: "Current Runner" },
  { href: "/runners", label: "Signals" },
  { href: "/airdrop-history", label: "Receipts" }
];

const productNav = [
  { href: "/docs", label: "Docs", icon: BookOpen }
];

function TopTicker() {
  const { signals, stats, state } = useScout();
  const countdown = useCountdown(stats.nextDropTime);
  const active = signals.active;
  const connectedInputs = active
    ? [
        active.volume_24h_usd,
        active.metrics.smartWalletScore ?? active.metrics.smart_wallet_score,
        active.metrics.attentionScore ?? active.metrics.attention_score,
        active.metrics.narrativeScore ?? active.metrics.narrative_score
      ].filter((value) => value !== null && value !== undefined).length
    : 0;
  const metrics = [
    ["LIVE", state === "loading" ? "STARTING" : state === "error" || state === "stale" ? "RECONNECTING" : "ONLINE"],
    ["CURRENT RUNNER", active ? `$${active.symbol}` : "NO VERIFIED TARGET"],
    [active ? "NEXT AIRDROP" : "NEXT SCAN", countdown.label],
    ["MARKET STATUS", "OPEN 24/7"],
    ["SCANNER", active ? "SIGNAL VERIFIED" : state === "loading" ? "STARTING" : state === "error" || state === "stale" ? "RECONNECTING" : "SCANNING"],
    ["RPC", "STATUS UNAVAILABLE"],
    ["NETWORK", "SOLANA"],
    ["MOMENTUM", active?.scout_score === null || active?.scout_score === undefined ? "AWAITING AUTHENTICATED SIGNAL" : `${active.scout_score}/100`],
    ["MARKET CAP", formatMoney(active?.market_cap_usd)],
    ["SIGNALS RANKED", active ? signals.signals.length.toLocaleString() : "NO VERIFIED SIGNALS"],
    ["SCANNER INPUTS", active ? `${connectedInputs}/4 VERIFIED` : "AWAITING TARGET"],
    ["SCAN CYCLE", stats.currentEpoch > 0 ? `#${stats.currentEpoch.toLocaleString()}` : "--"]
  ];

  return (
    <div className="scout-ticker" aria-label="Live Runner metrics">
      <div className="scout-ticker__track">
        {[...metrics, ...metrics].map(([label, value], index) => (
          <span className="scout-ticker__item" aria-hidden={index >= metrics.length} key={`${label}-${index}`}>
            <i aria-hidden="true" />
            <span>{label}</span>
            <strong>{value}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  async function copyContract() {
    if (!scoutPublicConfig.contractAddress) return;
    await navigator.clipboard.writeText(scoutPublicConfig.contractAddress);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <header className="scout-header">
      <div className="scout-header__inner">
        <Link className="scout-brand" href="/terminal" aria-label="Runner terminal">
          <span className="scout-brand__mark" aria-hidden="true">
            <img src="/brand/runner-logo.jpg" alt="" />
          </span>
          <span>
            <strong>RUNNER</strong>
            <small>Momentum terminal</small>
          </span>
        </Link>

        <nav className="scout-nav" aria-label="Primary navigation">
          {primaryNav.map((item) => (
            <Link className={pathname === item.href ? "is-active" : ""} href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="scout-header__actions">
          <button
            className="scout-ca-button"
            type="button"
            onClick={copyContract}
            disabled={!scoutPublicConfig.contractAddress}
            title={scoutPublicConfig.contractAddress || "RUNNER contract pending"}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            <span>{shortAddress(scoutPublicConfig.contractAddress)}</span>
          </button>
          <button className="scout-menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Open menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="scout-mobile-nav">
          {[...primaryNav, ...productNav].map((item) => (
            <Link href={item.href} key={item.href}>{item.label}</Link>
          ))}
          {scoutPublicConfig.buyUrl ? (
            <a href={scoutPublicConfig.buyUrl} target="_blank" rel="noreferrer">
              Buy $RUNNER <ExternalLink size={15} />
            </a>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}

function Footer() {
  return (
    <footer className="scout-footer">
      <div className="scout-footer__brand">
        <span className="scout-brand__mark" aria-hidden="true"><img src="/brand/runner-logo.jpg" alt="" /></span>
        <div>
          <strong>RUNNER</strong>
          <p>Own the runner. Don't chase it.</p>
        </div>
      </div>
      <nav aria-label="Product links">
        {productNav.map(({ href, label, icon: Icon }) => (
          <Link href={href} key={href}><Icon size={14} /> {label}</Link>
        ))}
        {scoutPublicConfig.xUrl ? <a href={scoutPublicConfig.xUrl} target="_blank" rel="noreferrer">X <ExternalLink size={13} /></a> : null}
      </nav>
      <p className="scout-footer__risk">
        Runner surfaces market momentum and experimental token distributions. Digital assets are volatile. Verify every address and onchain transaction independently.
      </p>
    </footer>
  );
}

function ShellContent({ children }: { children: React.ReactNode }) {
  const appRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const updateParallax = () => {
      frame = 0;
      appRef.current?.style.setProperty("--runner-parallax-y", `${-Math.min(window.scrollY * 0.045, 72)}px`);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateParallax);
    };
    updateParallax();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="scout-app" ref={appRef}>
      <div className="scout-background" aria-hidden="true">
        <i /><i /><i />
      </div>
      <TopTicker />
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

export function ScoutShell({ children }: { children: React.ReactNode }) {
  return (
    <ScoutProvider>
      <ShellContent>{children}</ShellContent>
    </ScoutProvider>
  );
}
