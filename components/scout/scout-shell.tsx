"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Check, Copy, ExternalLink, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { scoutPublicConfig, shortAddress } from "../../lib/scout-public";
import { ScoutProvider, useScout } from "./scout-provider";
import { PrelaunchNotice } from "./ui";

const primaryNav = [
  { href: "/#live-round", label: "Live Round" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#leaderboard", label: "Leaderboard" },
  { href: "/airdrop-history", label: "Results" }
];

const productNav = [
  { href: "/docs", label: "Docs", icon: BookOpen }
];

function TopTicker() {
  const { launchState, stats, state } = useScout();
  const [remaining, setRemaining] = useState(15 * 60);
  const [roundEnd, setRoundEnd] = useState<number | null>(null);

  useEffect(() => {
    const update = () => {
      const boundaryRemaining = 15 * 60 * 1000 - (Date.now() % (15 * 60 * 1000));
      const milliseconds = roundEnd === null ? boundaryRemaining : Math.max(0, roundEnd - Date.now());
      setRemaining(Math.ceil(milliseconds / 1000));
    };
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [roundEnd]);

  useEffect(() => {
    const updateRoundEnd = (event: Event) => {
      const nextRoundEnd = (event as CustomEvent<number | null>).detail;
      setRoundEnd(typeof nextRoundEnd === "number" && Number.isFinite(nextRoundEnd) ? nextRoundEnd : null);
    };
    window.addEventListener("casino-live-round-end", updateRoundEnd);
    return () => window.removeEventListener("casino-live-round-end", updateRoundEnd);
  }, []);

  if (launchState === "prelaunch") {
    return <PrelaunchNotice compact />;
  }

  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");
  const metrics = [
    ["CASINO", state === "error" ? "OFFLINE" : "ONLINE"],
    ["ROUND", "LIVE"],
    ["ROTATION", "10 GAMES"],
    ["NEXT GAME", `${minutes}:${seconds}`],
    ["ROUND LENGTH", "15:00"],
    ["VERIFIED ROUNDS", stats.totalEpochs.toLocaleString()],
    ["SETTLEMENT", "ON-CHAIN"]
  ];

  return (
    <div className="scout-ticker" aria-label="Casino Strategy live metrics">
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
        <Link className="scout-brand" href="/" aria-label="Casino Strategy home">
          <span className="scout-brand__mark casino-brand-mark" aria-hidden="true"><i /><b>CS</b></span>
          <span>
            <strong>CASINO STRATEGY</strong>
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
          {scoutPublicConfig.xUrl ? <a className="scout-header-link" href={scoutPublicConfig.xUrl} target="_blank" rel="noreferrer" aria-label="Casino Strategy on X">X</a> : null}
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
              Buy $CASINO <ExternalLink size={15} />
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
        <span className="scout-brand__mark casino-brand-mark" aria-hidden="true"><i /><b>CS</b></span>
        <div>
          <strong>CASINO STRATEGY</strong>
          <p>Fifteen-minute holder tournaments. Verified on-chain.</p>
        </div>
      </div>
      <nav aria-label="Product links">
        {productNav.map(({ href, label, icon: Icon }) => (
          <Link href={href} key={href}><Icon size={14} /> {label}</Link>
        ))}
        {scoutPublicConfig.xUrl ? <a href={scoutPublicConfig.xUrl} target="_blank" rel="noreferrer">X <ExternalLink size={13} /></a> : null}
      </nav>
      <p className="scout-footer__risk">
        Casino Strategy is an experimental on-chain game interface. Digital assets are volatile. No result is final until its settlement transaction is confirmed. Verify every address, rule, and on-chain transaction independently.
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
      <div className="scout-background casino-background" aria-hidden="true">
        <i className="casino-bg-net" />
        <i className="casino-bg-paddle casino-bg-paddle--left" />
        <i className="casino-bg-paddle casino-bg-paddle--right" />
        <i className="casino-bg-ball" />
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
