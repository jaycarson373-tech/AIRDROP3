"use client";

import { ArrowUpRight, CheckCircle2, Circle, Clock3, Radio, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { scoutPublicConfig } from "../../lib/scout-public";
import { shortWallet } from "./format";
import { useScout } from "./scout-provider";

const ROUND_MS = 15 * 60 * 1000;

const games = [
  { name: "PONG", code: "01", rule: "Last paddle standing" },
  { name: "CRASH", code: "02", rule: "Closest clean exit" },
  { name: "ROULETTE", code: "03", rule: "Verified wheel result" },
  { name: "DUEL", code: "04", rule: "One-on-one elimination" },
  { name: "COINFLIP", code: "05", rule: "Heads or tails" },
  { name: "DICE", code: "06", rule: "Highest verified roll" },
  { name: "PLINKO", code: "07", rule: "Highest landing zone" },
  { name: "MINES", code: "08", rule: "Longest clean path" },
  { name: "HI-LO", code: "09", rule: "Longest correct streak" },
  { name: "SLOTS", code: "10", rule: "Highest settled line" }
] as const;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function clockLabel(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`;
}

function GameVisual({ game }: { game: (typeof games)[number]["name"] }) {
  if (game === "PONG") {
    return (
      <div className="casino-game casino-game--pong" aria-label="Animated Pong game">
        <i className="casino-pong-net" />
        <i className="casino-pong-paddle casino-pong-paddle--left" />
        <i className="casino-pong-paddle casino-pong-paddle--right" />
        <i className="casino-pong-ball" />
        <span className="casino-game-score">P1&nbsp;&nbsp;P2</span>
      </div>
    );
  }

  if (game === "CRASH") {
    return (
      <div className="casino-game casino-game--crash" aria-label="Animated crash graph">
        <svg viewBox="0 0 600 260" role="img">
          <path className="casino-crash-grid" d="M0 52H600M0 104H600M0 156H600M0 208H600M120 0V260M240 0V260M360 0V260M480 0V260" />
          <path className="casino-crash-line" d="M8 244 C105 235 144 218 214 190 S322 130 380 110 S481 61 592 12" />
        </svg>
        <strong>LIVE CURVE</strong>
      </div>
    );
  }

  if (game === "ROULETTE") {
    return (
      <div className="casino-game casino-game--roulette" aria-label="Animated roulette wheel">
        <div className="casino-wheel"><i /><span>RND</span></div>
        <span className="casino-wheel-marker">▼</span>
      </div>
    );
  }

  if (game === "DUEL") {
    return (
      <div className="casino-game casino-game--duel" aria-label="Animated duel">
        <span className="casino-duelist casino-duelist--one">P1</span>
        <i className="casino-duel-shot" />
        <span className="casino-duelist casino-duelist--two">P2</span>
      </div>
    );
  }

  if (game === "COINFLIP") {
    return (
      <div className="casino-game casino-game--coinflip" aria-label="Animated coin flip">
        <div className="casino-coin"><span>H</span><i>T</i></div>
        <small>HEADS / TAILS</small>
      </div>
    );
  }

  if (game === "DICE") {
    return (
      <div className="casino-game casino-game--dice" aria-label="Animated dice">
        <div className="casino-die casino-die--one"><i /><i /><i /><i /><i /></div>
        <div className="casino-die casino-die--two"><i /><i /><i /><i /><i /><i /></div>
      </div>
    );
  }

  if (game === "PLINKO") {
    return (
      <div className="casino-game casino-game--plinko" aria-label="Animated Plinko board">
        <i className="casino-plinko-ball" />
        <div className="casino-peg-grid">
          {Array.from({ length: 28 }).map((_, index) => <i key={index} />)}
        </div>
        <div className="casino-plinko-slots"><span>1×</span><span>2×</span><span>5×</span><span>2×</span><span>1×</span></div>
      </div>
    );
  }

  if (game === "MINES") {
    return (
      <div className="casino-game casino-game--mines" aria-label="Animated mines grid">
        {Array.from({ length: 20 }).map((_, index) => (
          <i className={index === 6 || index === 14 ? "is-mine" : index < 10 ? "is-cleared" : ""} key={index}>
            {index === 6 || index === 14 ? "×" : index < 10 ? "·" : ""}
          </i>
        ))}
      </div>
    );
  }

  if (game === "HI-LO") {
    return (
      <div className="casino-game casino-game--hilo" aria-label="Animated high low cards">
        <div className="casino-card"><span>7</span><i>♠</i></div>
        <strong>↑<small>HIGHER?</small></strong>
        <div className="casino-card casino-card--hidden"><span>?</span></div>
      </div>
    );
  }

  return (
    <div className="casino-game casino-game--slots" aria-label="Animated slot reels">
      <div><span>7</span><span>◆</span><span>BAR</span></div>
      <div><span>◆</span><span>7</span><span>BAR</span></div>
      <div><span>BAR</span><span>◆</span><span>7</span></div>
      <i />
    </div>
  );
}

function ResultBoard() {
  const { stats } = useScout();
  const latestEpoch = stats.recentRewards.reduce((highest, item) => Math.max(highest, item.epoch), 0);
  const verified = stats.recentRewards
    .filter((item) => item.epoch === latestEpoch && item.txSig)
    .sort((a, b) => b.rewardAmount - a.rewardAmount)
    .slice(0, 3);

  return (
    <section className="casino-results" aria-labelledby="casino-results-title">
      <div className="casino-section-heading">
        <div>
          <span>VERIFIED SETTLEMENT</span>
          <h2 id="casino-results-title">TOP THREE</h2>
        </div>
        <p>Top-three fee recipients publish only after settlement is confirmed on-chain.</p>
      </div>
      <div className="casino-podium">
        {[0, 1, 2].map((index) => {
          const result = verified[index];
          return (
            <article className="casino-podium-row" key={index}>
              <strong>0{index + 1}</strong>
              <div>
                <span>{result ? shortWallet(result.wallet) : "NO VERIFIED RESULT"}</span>
                <small>{result ? `ROUND ${result.epoch}` : "ROUND STILL OPEN"}</small>
              </div>
              <b>{result ? result.rewardAmount.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}</b>
              {result?.txSig ? (
                <a href={`https://solscan.io/tx/${result.txSig}`} target="_blank" rel="noreferrer" aria-label={`View result ${index + 1} on Solscan`}>
                  PROOF <ArrowUpRight size={13} />
                </a>
              ) : <span>UNSETTLED</span>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function CasinoTerminalView() {
  const { launchState, stats, state, lastUpdated } = useScout();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const roundNumber = now === null ? 0 : Math.floor(now / ROUND_MS);
  const gameIndex = roundNumber % games.length;
  const activeGame = games[gameIndex];
  const nextGame = games[(gameIndex + 1) % games.length];
  const remaining = now === null ? ROUND_MS : ROUND_MS - (now % ROUND_MS);
  const progress = now === null ? 0 : (now % ROUND_MS) / ROUND_MS;
  const roundId = `CS-${String(roundNumber).slice(-8).padStart(8, "0")}`;
  const displayTime = useMemo(
    () => lastUpdated?.toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) ?? "OFF-CHAIN",
    [lastUpdated]
  );

  return (
    <div className="casino-home">
      <section className="casino-hero">
        <div className="casino-hero__copy">
          <div className="casino-eyebrow"><span>CASINO STRATEGY</span><i /> ROUND {roundId}</div>
          <h1>EVERY 15 MINUTES.<br /><span>A NEW GAME.</span></h1>
          <p>
            A monochrome on-chain casino arcade rotating through ten fast, verifiable games.
            Every result stays pending until settlement is confirmed.
          </p>
          <div className="casino-hero__actions">
            <a className="casino-button casino-button--solid" href="#live-round">ENTER LIVE ROUND <ArrowUpRight size={16} /></a>
            <a className="casino-button" href="#results">VIEW RESULTS</a>
          </div>
          <div className="casino-hero__metrics">
            <div><span>NEXT GAME</span><strong>{clockLabel(remaining)}</strong></div>
            <div><span>VERIFIED ROUNDS</span><strong>{stats.totalEpochs.toLocaleString()}</strong></div>
            <div><span>DISTRIBUTED VALUE</span><strong>{stats.totalSolValueAirdropped.toFixed(2)} SOL</strong></div>
            <div><span>FEED</span><strong>{state === "error" ? "OFFLINE" : "ONLINE"}</strong></div>
          </div>
        </div>

        <div className="casino-stage" id="live-round">
          <div className="casino-stage__bar">
            <span><i /> ROUND LIVE</span>
            <strong>{activeGame.code} / {activeGame.name}</strong>
            <small>{clockLabel(remaining)}</small>
          </div>
          <div className="casino-stage__screen">
            <GameVisual game={activeGame.name} />
            <div className="casino-screen-corners" aria-hidden="true"><i /><i /><i /><i /></div>
          </div>
          <div className="casino-stage__footer">
            <span>{activeGame.rule.toUpperCase()}</span>
            <span>NEXT: {nextGame.name}</span>
            <span>SETTLEMENT: ON-CHAIN</span>
          </div>
          <div className="casino-round-progress"><i style={{ width: `${progress * 100}%` }} /></div>
        </div>
      </section>

      {launchState === "prelaunch" ? (
        <div className="casino-launch-line">FIRST CASINO ROUND OPENS AT LAUNCH. VERIFIED RESULTS ONLY.</div>
      ) : null}

      <section className="casino-console">
        <div className="casino-console__status">
          <span><Radio size={13} /> SYSTEM</span>
          <strong>CASINO ENGINE ONLINE</strong>
          <small>LAST INDEX {displayTime}</small>
        </div>
        <div className="casino-console__grid">
          <div><span>ROUND ID</span><strong>{roundId}</strong></div>
          <div><span>GAME</span><strong>{activeGame.name}</strong></div>
          <div><span>PHASE</span><strong>{remaining < 30_000 ? "LOCKING" : "OPEN"}</strong></div>
          <div><span>RESULT</span><strong>NOT SETTLED</strong></div>
          <div><span>INTEGRITY</span><strong>VERIFY ON-CHAIN</strong></div>
          <div><span>NEXT ROTATION</span><strong>{clockLabel(remaining)}</strong></div>
        </div>
      </section>

      <section className="casino-games" id="games">
        <div className="casino-section-heading">
          <div>
            <span>ROTATING ARCADE</span>
            <h2>TEN GAMES. ONE CLOCK.</h2>
          </div>
          <p>The game changes automatically at each fifteen-minute UTC boundary.</p>
        </div>
        <div className="casino-game-list">
          {games.map((game, index) => (
            <article className={index === gameIndex ? "is-active" : ""} key={game.name}>
              <span>{game.code}</span>
              <strong>{game.name}</strong>
              <small>{game.rule}</small>
              <i>{index === gameIndex ? "LIVE" : index === (gameIndex + 1) % games.length ? "NEXT" : "QUEUED"}</i>
            </article>
          ))}
        </div>
      </section>

      <div id="results"><ResultBoard /></div>

      <section className="casino-settlement">
        <div>
          <Clock3 size={18} />
          <span>01</span>
          <strong>PLAY</strong>
          <p>The current two-dimensional game remains open until the round clock closes.</p>
        </div>
        <div>
          <Circle size={18} />
          <span>02</span>
          <strong>LOCK</strong>
          <p>Inputs lock at the fifteen-minute boundary. No late result is displayed.</p>
        </div>
        <div>
          <ShieldCheck size={18} />
          <span>03</span>
          <strong>SETTLE</strong>
          <p>The settlement feed records recipients and transaction proofs.</p>
        </div>
        <div>
          <CheckCircle2 size={18} />
          <span>04</span>
          <strong>VERIFY</strong>
          <p>The top three appear only when a real on-chain receipt exists.</p>
        </div>
      </section>

      <section className="casino-final">
        <span>CASINO STRATEGY / {scoutPublicConfig.tokenLabel}</span>
        <h2>THE HOUSE RUNS<br />ON A CLOCK.</h2>
        <p>Ten games. Fifteen-minute rounds. Public settlement receipts.</p>
        {scoutPublicConfig.buyUrl ? (
          <a className="casino-button casino-button--solid" href={scoutPublicConfig.buyUrl} target="_blank" rel="noreferrer">
            BUY {scoutPublicConfig.tokenLabel} <ArrowUpRight size={16} />
          </a>
        ) : null}
      </section>
    </div>
  );
}
