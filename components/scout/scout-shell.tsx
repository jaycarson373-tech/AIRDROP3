"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Menu, Radio, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { projectConfig } from "./project-config";
import { ScoutProvider, useScout } from "./scout-provider";
import { PrelaunchNotice } from "./ui";

const primaryNav = [
  { href: "/#portfolio", label: "THE GOAT" },
  { href: "/#origins", label: "ORIGINS" },
  { href: "/#terminal", label: "TERMINAL" },
  { href: "/leaderboard", label: "LEADERBOARD" },
  { href: "/rewards", label: "REWARDS" }
];

const productNav = [
  { href: "/leaderboard", label: "Leaderboard", icon: Radio },
  { href: "/rewards", label: "Rewards", icon: Radio },
  { href: "/docs", label: "Docs", icon: BookOpen }
];

function TopTicker() {
  const { launchState, stats, state } = useScout();
  const [remaining, setRemaining] = useState(5 * 60);

  useEffect(() => {
    const update = () => {
      const boundaryRemaining = 5 * 60 * 1000 - (Date.now() % (5 * 60 * 1000));
      setRemaining(Math.ceil(boundaryRemaining / 1000));
    };
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  if (launchState === "prelaunch") {
    return <PrelaunchNotice compact />;
  }

  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");
  const metrics = [
    ["GOAT", state === "error" ? "OFFLINE" : "ONLINE"],
    ["REWARD SPLIT", "50 / 50"],
    ["ASSET 01", "$ANSEM"],
    ["ASSET 02", "$CATE"],
    ["NEXT EPOCH", `${minutes}:${seconds}`],
    ["CYCLE", "05:00"],
    ["SETTLED EPOCHS", stats.totalEpochs ? stats.totalEpochs.toLocaleString() : "AWAITING FIRST EPOCH"]
  ];

  return (
    <div className="scout-ticker" aria-label="GOAT live distribution metrics">
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
  const [copiedMint, setCopiedMint] = useState(false);
  const headerBuyUrl = projectConfig.buyUrl || (projectConfig.goatMint ? `https://jup.ag/swap/SOL-${projectConfig.goatMint}` : null);
  const mintExplorerUrl = projectConfig.goatMint
    ? `${projectConfig.explorerBaseUrl.replace(/\/$/, "")}/token/${projectConfig.goatMint}`
    : null;
  const shortMint = projectConfig.goatMint
    ? `${projectConfig.goatMint.slice(0, 4)}…${projectConfig.goatMint.slice(-4)}`
    : null;

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="scout-header">
      <div className="scout-header__inner">
        <Link className="scout-brand" href="/" aria-label="GOAT home">
          <span className="scout-brand__mark goat-brand-mark" aria-hidden="true">
            <img src="/brand/goat-logo.png" alt="" />
          </span>
          <span>
            <strong>GOAT</strong>
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
          {projectConfig.goatMint ? (
            <button
              className="goat-header-ca"
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(projectConfig.goatMint!);
                setCopiedMint(true);
                window.setTimeout(() => setCopiedMint(false), 1600);
              }}
              aria-label={`Copy GOAT contract address ${projectConfig.goatMint}`}
              title="Copy GOAT contract address"
            >
              <span>CA</span>
              <strong>{copiedMint ? "COPIED" : shortMint}</strong>
            </button>
          ) : null}
          {projectConfig.projectXUrl ? <a className="scout-header-link scout-header-link--social" href={projectConfig.projectXUrl} target="_blank" rel="noopener noreferrer">X ↗</a> : null}
          {projectConfig.poorGoatXUrl ? <a className="scout-header-link scout-header-link--profile" href={projectConfig.poorGoatXUrl} target="_blank" rel="noopener noreferrer">POOR GOAT ↗</a> : null}
          {headerBuyUrl ? <a className="scout-header-link scout-header-link--buy" href={headerBuyUrl} target="_blank" rel="noopener noreferrer">BUY</a> : null}
          <button className="scout-menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Open menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="scout-mobile-nav">
          {[...primaryNav, ...productNav.filter((item) => !primaryNav.some((primary) => primary.href === item.href))].map((item) => (
            <Link href={item.href} key={item.href}>{item.label}</Link>
          ))}
          {projectConfig.poorGoatXUrl ? <a href={projectConfig.poorGoatXUrl} target="_blank" rel="noopener noreferrer">POOR GOAT ↗</a> : null}
          {projectConfig.projectXUrl ? <a href={projectConfig.projectXUrl} target="_blank" rel="noopener noreferrer">GOATCOIN X ↗</a> : null}
          {mintExplorerUrl ? <a href={mintExplorerUrl} target="_blank" rel="noopener noreferrer">VIEW CA ↗</a> : null}
          {headerBuyUrl ? <a href={headerBuyUrl} target="_blank" rel="noopener noreferrer">BUY GOAT ↗</a> : null}
        </div>
      ) : null}
    </header>
  );
}

function Footer() {
  return (
    <footer className="scout-footer">
      <div className="scout-footer__brand">
        <span className="scout-brand__mark goat-brand-mark" aria-hidden="true">
          <img src="/brand/goat-logo.png" alt="" />
        </span>
        <div>
          <strong>GOAT</strong>
          <p>The 2026 Goatcoin. Inspired by conviction, verified onchain.</p>
        </div>
      </div>
      <nav aria-label="Product links">
        {productNav.map(({ href, label, icon: Icon }) => (
          <Link href={href} key={href}><Icon size={14} /> {label}</Link>
        ))}
        {projectConfig.projectXUrl ? <a href={projectConfig.projectXUrl} target="_blank" rel="noopener noreferrer">X ↗</a> : null}
      </nav>
      <p className="scout-footer__risk">
        GOAT is an experimental community token and holder-distribution project. Reward timing, eligibility, and availability may change. Nothing on this site is financial advice.
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
      appRef.current?.style.setProperty("--goat-parallax-y", `${-Math.min(window.scrollY * 0.045, 72)}px`);
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
      <div className="scout-background goat-background" aria-hidden="true">
        <i className="goat-bg-grid" />
        <i className="goat-bg-peak goat-bg-peak--one" />
        <i className="goat-bg-peak goat-bg-peak--two" />
        <i className="goat-bg-line" />
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
