"use client";

import { CopyCaButton } from "./copy-ca-button";

type MarketTickerProps = {
  logoSrc: string;
  projectName: string;
  xUrl: string;
  contractAddress?: string;
};

function compactAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function MarketTicker({ logoSrc, projectName, xUrl, contractAddress }: MarketTickerProps) {
  const navItems = [
    ["Protocol", "#initiation"],
    ["Rewards", "#rewards"],
    ["Hood Board", "#army"],
    ["Proof", "#airdrops"],
    ["FAQ", "#faq"]
  ];

  return (
    <div className="market-ticker market-ticker-minimal" aria-label="Cat in Hood header">
      <div className="container market-ticker-inner">
        <a className="ticker-brand" href="/" aria-label={`${projectName} home`}>
          <img src={logoSrc} alt="" />
          <strong>{projectName}</strong>
        </a>
        <nav className="ticker-nav" aria-label="Main navigation">
          {navItems.map(([label, href]) => (
            <a href={href} key={label}>
              {label}
            </a>
          ))}
        </nav>
        <div className="ticker-actions" aria-label="Project links">
          {contractAddress ? <CopyCaButton address={contractAddress} label={compactAddress(contractAddress)} /> : null}
          <a className="ticker-action" href={xUrl} target="_blank" rel="noreferrer" aria-label="Open Cat in Hood on X">
            X
          </a>
        </div>
      </div>
    </div>
  );
}
