"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { projectConfig } from "./project-config";
import { ScoutProvider } from "./scout-provider";

const navigation = [
  { href: "/#rot-feed", label: "ROT FEED" },
  { href: "/#timeline", label: "LORE.EXE" },
  { href: "/#rewards", label: "REWARDS" }
];

function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const buyUrl = projectConfig.buyUrl || projectConfig.stonkUrl;

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="scout-header brainrot-header">
      <div className="scout-header__inner">
        <Link className="scout-brand" href="/" aria-label="BRAINROT home">
          <span className="scout-brand__mark" aria-hidden="true">
            <img src="/brand/brainrot-logo.jpg" alt="" />
          </span>
          <span>
            <strong>BRAINROT</strong>
            <small>$BRAINROT // ROT ONLINE</small>
          </span>
        </Link>

        <nav className="scout-nav" aria-label="Primary navigation">
          {navigation.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
        </nav>

        <div className="scout-header__actions">
          {projectConfig.projectXUrl ? (
            <a className="scout-header-link scout-header-link--social" href={projectConfig.projectXUrl} target="_blank" rel="noopener noreferrer">X</a>
          ) : null}
          <a className="scout-header-link scout-header-link--buy" href={buyUrl} target="_blank" rel="noopener noreferrer">GET ROT</a>
          <button className="scout-menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="brainrot-mobile-nav" aria-label={open ? "Close menu" : "Open menu"}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="scout-mobile-nav" id="brainrot-mobile-nav" onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}>
          {navigation.map((item) => <Link href={item.href} key={item.href} onClick={() => setOpen(false)}>{item.label}</Link>)}
          {projectConfig.projectXUrl ? <a href={projectConfig.projectXUrl} target="_blank" rel="noopener noreferrer">BRAINROT X</a> : null}
          <a href={buyUrl} target="_blank" rel="noopener noreferrer">BUY $BRAINROT</a>
        </div>
      ) : null}
    </header>
  );
}

function Footer() {
  return (
    <footer className="scout-footer brainrot-footer">
      <div className="scout-footer__brand">
        <span className="scout-brand__mark" aria-hidden="true"><img src="/brand/brainrot-logo.jpg" alt="" /></span>
        <div>
          <strong>BRAINROT</strong>
          <p>THE INTERNET HAS A CONDITION.</p>
        </div>
      </div>
      <nav aria-label="Footer links">
        <Link href="/#rot-feed">Rot feed</Link>
        <Link href="/rewards">Receipts</Link>
        <Link href="/docs">Docs.exe</Link>
        <a href={projectConfig.stonkUrl} target="_blank" rel="noopener noreferrer">StonkFun</a>
      </nav>
      <p className="scout-footer__risk">
        $NEURALINK is a tokenized exposure asset, not direct Neuralink stock. BRAINROT is independent and is not affiliated with or endorsed by Neuralink, PreStocks, or StonkFun. Rewards depend on StonkFun mechanics and are not guaranteed. Nothing here is financial advice.
      </p>
    </footer>
  );
}

export function ScoutShell({ children, launchState }: { children: React.ReactNode; launchState: "prelaunch" | "live" }) {
  return (
    <ScoutProvider launchState={launchState}>
      <div className="scout-app brainrot-shell">
        <Header />
        <main>{children}</main>
        <Footer />
      </div>
    </ScoutProvider>
  );
}
