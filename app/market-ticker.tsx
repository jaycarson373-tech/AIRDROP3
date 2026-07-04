"use client";

type MarketTickerProps = {
  logoSrc: string;
  projectName: string;
  xUrl: string;
};

export function MarketTicker({ logoSrc, projectName, xUrl }: MarketTickerProps) {
  const navItems = [
    ["Initiation", "#initiation"],
    ["Rewards", "#rewards"],
    ["Army", "#army"],
    ["Proof", "#airdrops"],
    ["FAQ", "#faq"]
  ];

  return (
    <div className="market-ticker market-ticker-minimal" aria-label="Bullify header">
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
          <a className="ticker-action" href={xUrl} target="_blank" rel="noreferrer" aria-label="Open Bullify on X">
            X
          </a>
        </div>
      </div>
    </div>
  );
}
