"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ScoutProvider, useScout } from "./scout-provider";
import { PrelaunchNotice } from "./ui";

const primaryNav = [
  { href: "/#flip-index", label: "Flip Index" },
  { href: "/#airdrops", label: "Airdrops" },
  { href: "/#mechanics-title", label: "Mechanism" },
  { href: "/#gallery", label: "Campaign" }
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
    ["SNDK6900", state === "error" ? "OFFLINE" : state === "stale" ? "DEGRADED" : "ONLINE"],
    ["REWARD", "SNDK"],
    ["NEXT DROP", `${minutes}:${seconds}`],
    ["CYCLE", "05:00"],
    ["VERIFIED DROPS", stats.totalEpochs > 0 ? stats.totalEpochs.toLocaleString() : "PENDING"],
    ["DELIVERY", "AUTOMATIC"],
    ["RECEIPTS", "ON-CHAIN"]
  ];

  return (
    <div className="scout-ticker" aria-label="SNDK6900 live metrics">
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
        <Link className="scout-brand" href="/" aria-label="SNDK6900 home">
          <span className="scout-brand__mark sndk-brand-mark" aria-hidden="true">
            <img src="/brand/sndk6900-logo-red-square.png" alt="" />
          </span>
          <span>
            <strong>SNDK6900</strong>
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
          {primaryNav.map((item) => (
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
        <span className="scout-brand__mark sndk-brand-mark" aria-hidden="true">
          <img src="/brand/sndk6900-logo-red-square.png" alt="" />
        </span>
        <div>
          <strong>SNDK6900</strong>
          <p>Hold SNDK6900. Receive SNDK every five minutes.</p>
        </div>
      </div>
      <nav aria-label="Footer links">
        <Link href="/#flip-index">Flip Index</Link>
        <Link href="/#airdrops">Airdrops</Link>
        <Link href="/#gallery">Campaign</Link>
      </nav>
      <p className="scout-footer__risk">
        SNDK6900 is an independent community experiment and is not affiliated with Sandisk Corporation or Nasdaq. SNDK equity market data is shown only as a public comparison target; distributions refer to the configured on-chain SNDK reward token, not equity. Digital assets are volatile—verify every transfer independently.
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
      <div className="scout-background sndk-background" aria-hidden="true">
        <i className="sndk-bg-grid" />
        <i className="sndk-bg-scan" />
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
