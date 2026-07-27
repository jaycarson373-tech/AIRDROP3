"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Check, Copy, ExternalLink, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { scoutPublicConfig, shortAddress } from "../../lib/scout-public";
import { formatToken } from "./format";
import { useCountdown } from "./hooks";
import { ScoutProvider, useScout } from "./scout-provider";
import { PrelaunchNotice } from "./ui";

const primaryNav = [
  { href: "/terminal", label: "Strategy" },
  { href: "/runners", label: "Cats" },
  { href: "/airdrop-history", label: "Receipts" }
];

const productNav = [
  { href: "/docs", label: "Docs", icon: BookOpen }
];

function TopTicker() {
  const { launchState, stats, signals, state } = useScout();
  const countdown = useCountdown(stats.nextDropTime);
  const active = signals.active;

  if (launchState === "prelaunch") {
    return <PrelaunchNotice compact />;
  }

  const metrics = [
    ["LIVE", state === "loading" ? "CONNECTING" : state === "error" || state === "stale" ? "RECONNECTING" : "ONLINE"],
    ["ACTIVE CAT", active ? `$${active.symbol}` : "NO LIVE RUNNER"],
    ["NEXT DROP", countdown.label],
    ["ELIGIBLE HOLDERS", stats.latestEligibleHolders.toLocaleString()],
    ["CAT DROPPED", formatToken(stats.totalRewardAirdropped, scoutPublicConfig.rewardSymbol)],
    ["EPOCH", stats.currentEpoch > 0 ? `#${stats.currentEpoch.toLocaleString()}` : "NOT RECORDED"],
    ["AVG MULTIPLIER", stats.averageMultiplier ? `${(stats.averageMultiplier / 10000).toFixed(2)}x` : "BASE"]
  ];

  return (
    <div className="scout-ticker" aria-label="Cat Strategy live metrics">
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
        <Link className="scout-brand" href="/" aria-label="Cat Strategy home">
          <span className="scout-brand__mark" aria-hidden="true">
            <img src="/brand/cat-strategy-logo.jpg" alt="" />
          </span>
          <span>
            <strong>CAT STRATEGY</strong>
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
          {scoutPublicConfig.contractAddress ? (
            <button
              className="scout-ca-button"
              type="button"
              onClick={copyContract}
              title="Copy full contract address"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              <span className="scout-ca-button__full">{scoutPublicConfig.contractAddress}</span>
              <span className="scout-ca-button__short">{shortAddress(scoutPublicConfig.contractAddress, 4, 5)}</span>
            </button>
          ) : null}
          {scoutPublicConfig.xUrl ? <a className="scout-header-link" href={scoutPublicConfig.xUrl} target="_blank" rel="noreferrer" aria-label="Cat Strategy on X">X</a> : null}
          {scoutPublicConfig.buyUrl ? <a className="scout-header-link scout-header-link--buy" href={scoutPublicConfig.buyUrl} target="_blank" rel="noreferrer">Buy</a> : null}
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
              Buy $CSTR <ExternalLink size={15} />
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
        <span className="scout-brand__mark" aria-hidden="true"><img src="/brand/cat-strategy-logo.jpg" alt="" /></span>
        <div>
          <strong>CAT STRATEGY</strong>
          <p>Verified calls. Verified onchain.</p>
        </div>
      </div>
      <nav aria-label="Product links">
        {productNav.map(({ href, label, icon: Icon }) => (
          <Link href={href} key={href}><Icon size={14} /> {label}</Link>
        ))}
        {scoutPublicConfig.xUrl ? <a href={scoutPublicConfig.xUrl} target="_blank" rel="noreferrer">X <ExternalLink size={13} /></a> : null}
      </nav>
      <p className="scout-footer__risk">
        Cat Strategy is an experimental cat-token runner reward protocol. Digital assets are volatile. Selling resets holder multiplier progress back to base weight. Verify every address, eligibility rule, and onchain transaction independently.
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
        <div className="cat-real-drift">
          <span className="cat-scene cat-scene--walk">
            <img src="/brand/cat-walker-pixel-v2.png" alt="" decoding="async" draggable={false} />
          </span>
          <span className="cat-scene cat-scene--sit">
            <img src="/brand/cat-sitting-pixel-v1.png" alt="" decoding="async" draggable={false} />
          </span>
          <span className="cat-scene cat-scene--stand">
            <img src="/brand/cat-standing-pixel-v1.png" alt="" decoding="async" draggable={false} />
          </span>
        </div>
      </div>
      <TopTicker />
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

export function ScoutShell({
  children,
  launchState
}: {
  children: React.ReactNode;
  launchState: "prelaunch" | "live";
}) {
  return (
    <ScoutProvider launchState={launchState}>
      <ShellContent>{children}</ShellContent>
    </ScoutProvider>
  );
}
