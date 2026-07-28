"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const [remaining, setRemaining] = useState(5 * 60);
  const [roundEnd, setRoundEnd] = useState<number | null>(null);

  useEffect(() => {
    const update = () => {
      const boundaryRemaining = 5 * 60 * 1000 - (Date.now() % (5 * 60 * 1000));
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
    ["ROUND LENGTH", "05:00"],
    ["VERIFIED ROUNDS", stats.totalEpochs.toLocaleString()],
    ["SETTLEMENT", "ON-CHAIN"]
  ];

  return (
    <div className="scout-ticker" aria-label="Casino live metrics">
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

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="scout-header">
      <div className="scout-header__inner">
        <Link className="scout-brand" href="/" aria-label="Casino home">
          <span className="scout-brand__mark casino-brand-mark" aria-hidden="true">
            <img src="/brand/casino-logo.png" alt="" />
          </span>
          <span>
            <strong>CASINO</strong>
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
        </div>
      ) : null}
    </header>
  );
}

function Footer() {
  return (
    <footer className="scout-footer">
      <div className="scout-footer__brand">
        <span className="scout-brand__mark casino-brand-mark" aria-hidden="true">
          <img src="/brand/casino-logo.png" alt="" />
        </span>
        <div>
          <strong>CASINO</strong>
          <p>Five-minute holder tournaments. Verifiable results.</p>
        </div>
      </div>
      <nav aria-label="Product links">
        {productNav.map(({ href, label, icon: Icon }) => (
          <Link href={href} key={href}><Icon size={14} /> {label}</Link>
        ))}
      </nav>
      <p className="scout-footer__risk">
        Casino is an experimental on-chain tournament interface. Digital assets are volatile. No result is final until its settlement transaction is confirmed. Verify every rule and on-chain transaction independently.
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
