"use client";

import { ArrowUpRight, CheckCircle2, Circle, Clock3, Radio, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { scoutPublicConfig } from "../../lib/scout-public";
import { shortWallet } from "./format";
import { useScout } from "./scout-provider";
import type { CasinoChatMessage, CasinoChatPayload, CasinoLivePayload } from "./types";

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

type CasinoGameName = (typeof games)[number]["name"];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function clockLabel(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`;
}

function GameVisual({
  game,
  currentPlay,
  now
}: {
  game: CasinoGameName;
  currentPlay: CasinoLivePayload["currentPlay"];
  now: number;
}) {
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
    const hasRevealedOutcome = Boolean(currentPlay?.resultHash);
    const crashPoint = Number(currentPlay?.outcome.crashMultiplier ?? 1);
    const cashoutTarget = Number(currentPlay?.outcome.cashoutTarget ?? 1);
    const startedAt = Date.parse(currentPlay?.startedAt ?? "");
    const scheduledAt = Date.parse(currentPlay?.scheduledAt ?? "");
    const playProgress =
      currentPlay && Number.isFinite(startedAt) && Number.isFinite(scheduledAt) && scheduledAt > startedAt
        ? Math.min(1, Math.max(0, (now - startedAt) / (scheduledAt - startedAt)))
        : 0;
    const liveMultiplier = 1 + Math.max(0, crashPoint - 1) * Math.pow(playProgress, 1.75);
    const playComplete = Boolean(currentPlay && playProgress >= 1);
    return (
      <div className={`casino-game casino-game--crash${currentPlay ? " is-live" : ""}`} aria-label="Live deterministic crash simulation">
        <svg viewBox="0 0 600 260" role="img">
          <path className="casino-crash-grid" d="M0 52H600M0 104H600M0 156H600M0 208H600M120 0V260M240 0V260M360 0V260M480 0V260" />
          <path
            className="casino-crash-line"
            d="M8 244 C105 235 144 218 214 190 S322 130 380 110 S481 61 592 12"
            pathLength="100"
            style={currentPlay ? { strokeDasharray: 100, strokeDashoffset: 100 - playProgress * 100 } : undefined}
          />
        </svg>
        <strong>{currentPlay ? (hasRevealedOutcome ? `${liveMultiplier.toFixed(2)}×` : "RUNNING") : "PROOF REQUIRED"}</strong>
        {currentPlay ? (
          <small className="casino-crash-readout">
            {hasRevealedOutcome
              ? `AUTO EXIT ${cashoutTarget.toFixed(2)}× / ${playComplete ? `CRASHED ${crashPoint.toFixed(2)}×` : "CURVE LIVE"}`
              : "OUTCOME SEALED UNTIL REVEAL"}
          </small>
        ) : null}
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

function liveStatusLabel(status: CasinoLivePayload["status"]) {
  switch (status) {
    case "playing":
      return "PLAYING VERIFIED QUEUE";
    case "awaiting_proof":
      return "AWAITING VERIFIED RANDOMNESS";
    case "awaiting_settlement":
      return "QUEUE COMPLETE / SETTLEMENT PENDING";
    case "settled":
      return "ROUND SETTLED";
    case "failed":
      return "ROUND HALTED";
    case "skipped":
      return "ROUND SKIPPED";
    case "offline":
      return "LIVE FEED OFFLINE";
    default:
      return "WAITING FOR FIRST ROUND";
  }
}

function LiveGameFeed({ live }: { live: CasinoLivePayload }) {
  const total = live.round?.eligibleCount ?? 0;
  const current = live.currentPlay;
  return (
    <section className="casino-live-feed" aria-labelledby="live-game-feed-title">
      <div className="casino-live-feed__head">
        <div>
          <span>{live.tournamentStage}</span>
          <h2 id="live-game-feed-title">HOLDER SPEED RUN</h2>
        </div>
        <strong><i /> {liveStatusLabel(live.status)}</strong>
      </div>
      <div className="casino-live-feed__meter">
        <span>
          {live.remainingCount.toLocaleString()} LEFT
          {live.nextCutCount > 0 ? ` / NEXT CUT ${live.nextCutCount.toLocaleString()}` : ""}
        </span>
        <i><b style={{ width: total ? `${Math.min(100, (live.completedCount / total) * 100)}%` : "0%" }} /></i>
      </div>
      <div className="casino-current-play">
        <span>{current ? `ELIM ${String(current.playIndex).padStart(3, "0")}` : "CURRENT PLAY"}</span>
        <strong>{current ? shortWallet(current.wallet) : "NO VERIFIED PLAYER"}</strong>
        <b>{current ? live.round?.game : "—"}</b>
        <small>{current ? "OUTCOME SEALED..." : "RESULTS APPEAR AFTER VERIFIED PROOF"}</small>
      </div>
      <div className="casino-feed-columns">
        <div>
          <h3>LIVE LEADERBOARD</h3>
          {[0, 1, 2].map((index) => {
            const result = live.leaderboard[index];
            return (
              <div className="casino-feed-row" key={index}>
                <span>0{index + 1}</span>
                <strong>{result ? shortWallet(result.wallet) : "OPEN"}</strong>
                <small>{result?.summary ?? "NO VERIFIED RESULT"}</small>
              </div>
            );
          })}
        </div>
        <div>
          <h3>RECENT ELIMINATIONS</h3>
          {live.latestPlays.length ? live.latestPlays.slice(0, 5).map((result) => (
            <div className="casino-feed-row" key={result.resultHash}>
              <span>{String(result.playIndex).padStart(3, "0")}</span>
              <strong>{shortWallet(result.wallet)}</strong>
              <small>{result.summary}</small>
            </div>
          )) : (
            <div className="casino-feed-empty">NO COMPLETED VERIFIED PLAYS</div>
          )}
        </div>
      </div>
    </section>
  );
}

function LiveChat() {
  const [chat, setChat] = useState<CasinoChatPayload>({ enabled: false, canPost: false, messages: [] });
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("casino_chat_author");
    const generated = `PLAYER-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    setAuthor(saved || generated);
  }, []);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/casino/chat", { cache: "no-store" });
        const payload = (await response.json()) as CasinoChatPayload;
        if (active) setChat(payload);
      } catch {
        if (active) setChat({ enabled: false, canPost: false, messages: [] });
      }
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 4_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/casino/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, body })
      });
      const payload = (await response.json()) as { error?: string; message?: CasinoChatMessage };
      if (!response.ok) throw new Error(payload.error || "Message could not be posted");
      window.localStorage.setItem("casino_chat_author", author);
      setBody("");
      const refreshed = await fetch("/api/casino/chat", { cache: "no-store" });
      setChat((await refreshed.json()) as CasinoChatPayload);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Message could not be posted");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="casino-chat" aria-labelledby="casino-chat-title">
      <div className="casino-chat__head">
        <div><span>PUBLIC CHANNEL</span><h2 id="casino-chat-title">LIVE CHAT</h2></div>
        <strong><i /> {chat.enabled ? "CONNECTED" : "LOCKED"}</strong>
      </div>
      <div className="casino-chat__messages" aria-live="polite">
        {chat.messages.length ? chat.messages.map((message) => (
          <div key={message.id}>
            <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}</span>
            <strong>{message.author}</strong>
            <p>{message.body}</p>
          </div>
        )) : <p className="casino-chat__empty">CHAT OPENS WITH THE VERIFIED LIVE ENGINE.</p>}
      </div>
      <form className="casino-chat__form" onSubmit={submit}>
        <input
          aria-label="Chat name"
          disabled={!chat.canPost}
          maxLength={24}
          onChange={(event) => setAuthor(event.target.value.replace(/[^A-Za-z0-9_-]/g, ""))}
          value={author}
        />
        <input
          aria-label="Chat message"
          disabled={!chat.canPost}
          maxLength={240}
          onChange={(event) => setBody(event.target.value)}
          placeholder={chat.canPost ? "MESSAGE THE FLOOR" : "CHAT NOT ENABLED"}
          value={body}
        />
        <button disabled={!chat.canPost || sending || !body.trim()} type="submit">{sending ? "..." : "SEND"}</button>
      </form>
      {error ? <p className="casino-chat__error">{error}</p> : null}
    </section>
  );
}

function HowItWorks() {
  const scales = [
    { field: "10 WALLETS", path: "10 → 8 → 5 → 3", pace: "SLOW HEATS" },
    { field: "100 WALLETS", path: "100 → 32 → 10 → 3", pace: "STANDARD BRACKET" },
    { field: "1,000 WALLETS", path: "1,000 → 100 → 25 → 10 → 3", pace: "RAPID QUALIFIER" }
  ];

  return (
    <section className="casino-how" id="how-it-works" aria-labelledby="casino-how-title">
      <div className="casino-section-heading">
        <div>
          <span>AUTOMATIC HOLDER TOURNAMENT</span>
          <h2 id="casino-how-title">HOLD. WATCH. WIN.</h2>
        </div>
        <p>No wallet connection and no game entry transaction. The round snapshot automatically enters every eligible holder.</p>
      </div>

      <div className="casino-how__steps">
        <article><span>01</span><strong>HOLD 1M+ $CASINO</strong><p>Your on-chain balance is your entry. One eligible wallet, one tournament position.</p></article>
        <article><span>02</span><strong>FIELD LOCKS</strong><p>A snapshot and verifiable randomness commitment lock the players before the game begins.</p></article>
        <article><span>03</span><strong>15-MINUTE SPEED RUN</strong><p>Large fields move in fast batches. The clock slows as the tournament reaches its final wallets.</p></article>
        <article><span>04</span><strong>TOP THREE PAID</strong><p>The verified podium receives the round pool automatically after the settlement transaction confirms.</p></article>
      </div>

      <div className="casino-scale" aria-label="Adaptive tournament examples">
        <div className="casino-scale__head"><span>STARTING FIELD</span><span>15-MINUTE CUT PATH</span><span>PLAYBACK MODE</span></div>
        {scales.map((scale) => (
          <div className="casino-scale__row" key={scale.field}>
            <strong>{scale.field}</strong>
            <b>{scale.path}</b>
            <span>{scale.pace}</span>
          </div>
        ))}
      </div>
      <div className="casino-hold-only"><i aria-hidden="true">◆</i> NO CONNECT WALLET. NO MANUAL ENTRY. HOLD BEFORE THE SNAPSHOT.</div>
    </section>
  );
}

function RoundLeaderboard({ live }: { live: CasinoLivePayload }) {
  return (
    <section className="casino-leaderboard" id="leaderboard" aria-labelledby="casino-leaderboard-title">
      <div className="casino-section-heading">
        <div>
          <span>VERIFIED ROUND STANDINGS</span>
          <h2 id="casino-leaderboard-title">LEADERBOARD</h2>
        </div>
        <p>
          {live.round
            ? `Round ${live.round.roundNumber} · ${live.tournamentStage} · ${live.remainingCount.toLocaleString()} wallets remain`
            : "Standings appear only after verified holder simulations complete."}
        </p>
      </div>
      <div className="casino-leaderboard__table" role="table" aria-label="Current casino round leaderboard">
        <div className="casino-leaderboard__row casino-leaderboard__row--head" role="row">
          <span role="columnheader">RANK</span>
          <span role="columnheader">WALLET</span>
          <span role="columnheader">GAME</span>
          <span role="columnheader">VERIFIED OUTCOME</span>
          <span role="columnheader">RESULT HASH</span>
        </div>
        {live.leaderboard.length ? live.leaderboard.slice(0, 25).map((result, index) => (
          <div
            className={`casino-leaderboard__row${index < 3 ? " is-podium" : ""}`}
            role="row"
            key={result.resultHash || `${result.wallet}-${result.playIndex}`}
          >
            <strong role="cell">{String(index + 1).padStart(2, "0")}</strong>
            <span role="cell">{shortWallet(result.wallet)}</span>
            <span role="cell">{live.round?.game ?? "—"}</span>
            <b role="cell">{result.summary}</b>
            <code role="cell">{result.resultHash ? `${result.resultHash.slice(0, 8)}…${result.resultHash.slice(-6)}` : "—"}</code>
          </div>
        )) : (
          <div className="casino-leaderboard__empty">NO VERIFIED PLAYS IN THE CURRENT ROUND</div>
        )}
      </div>
      {live.leaderboard.length > 25 ? (
        <p className="casino-leaderboard__note">Showing the top 25 of {live.leaderboard.length.toLocaleString()} ranked results.</p>
      ) : null}
    </section>
  );
}

function ResultBoard() {
  const { stats } = useScout();
  const latestRound = stats.casinoWinners.reduce((highest, item) => Math.max(highest, item.roundNumber), 0);
  const verified = stats.casinoWinners
    .filter((item) => item.roundNumber === latestRound && item.txSig)
    .sort((a, b) => a.position - b.position)
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
                <small>{result ? `${result.game} / ROUND ${result.roundNumber}` : "ROUND STILL OPEN"}</small>
              </div>
              <b>{result ? `${result.payoutSol.toLocaleString(undefined, { maximumFractionDigits: 4 })} SOL` : "—"}</b>
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
  const [live, setLive] = useState<CasinoLivePayload>({
    status: "waiting_for_round",
    round: null,
    completedCount: 0,
    remainingCount: 0,
    tournamentStage: "WAITING FOR FIELD",
    nextCutCount: 0,
    currentPlay: null,
    latestPlays: [],
    leaderboard: []
  });

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const interval = window.setInterval(update, 100);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let active = true;
    const refreshLive = async () => {
      try {
        const response = await fetch("/api/casino/live");
        const payload = (await response.json()) as CasinoLivePayload;
        if (active) {
          setLive(payload);
          const nextRoundEnd = Date.parse(payload.round?.playbackEndsAt ?? "");
          window.dispatchEvent(
            new CustomEvent("casino-live-round-end", {
              detail: Number.isFinite(nextRoundEnd) ? nextRoundEnd : null
            })
          );
        }
      } catch {
        if (active) {
          setLive((current) => ({ ...current, status: "offline" }));
        }
      }
    };
    void refreshLive();
    const interval = window.setInterval(() => void refreshLive(), 2_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const scheduledRoundNumber = now === null ? 0 : Math.floor(now / ROUND_MS);
  const scheduledGameIndex = scheduledRoundNumber % games.length;
  const liveGameIndex = games.findIndex((game) => game.name === live.round?.game);
  const gameIndex = liveGameIndex >= 0 ? liveGameIndex : scheduledGameIndex;
  const activeGame = games[gameIndex];
  const nextGame = games[(gameIndex + 1) % games.length];
  const playbackStart = Date.parse(live.round?.playbackStartedAt ?? "");
  const playbackEnd = Date.parse(live.round?.playbackEndsAt ?? "");
  const boundaryRemaining = now === null ? ROUND_MS : ROUND_MS - (now % ROUND_MS);
  const remaining =
    now !== null && live.round && Number.isFinite(playbackEnd)
      ? Math.max(0, playbackEnd - now)
      : boundaryRemaining;
  const progress =
    now !== null && Number.isFinite(playbackStart) && Number.isFinite(playbackEnd) && playbackEnd > playbackStart
      ? Math.min(1, Math.max(0, (now - playbackStart) / (playbackEnd - playbackStart)))
      : 0;
  const roundId = live.round?.roundId ?? `CS-${String(scheduledRoundNumber).slice(-8).padStart(8, "0")}`;
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
            Hold 1M+ {scoutPublicConfig.tokenLabel} before the snapshot and your wallet is entered automatically.
            No connection. No click. Every round eliminates the field until three verified winners remain.
          </p>
          <div className="casino-hero__actions">
            <a className="casino-button casino-button--solid" href="#live-round">ENTER LIVE ROUND <ArrowUpRight size={16} /></a>
            <a className="casino-button" href="#results">VIEW RESULTS</a>
          </div>
          <div className="casino-hero__metrics">
            <div><span>NEXT GAME</span><strong>{clockLabel(remaining)}</strong></div>
            <div><span>PLAYERS LEFT</span><strong>{live.remainingCount.toLocaleString()}</strong></div>
            <div><span>VERIFIED ROUNDS</span><strong>{stats.casinoRoundCount.toLocaleString()}</strong></div>
            <div><span>DISTRIBUTED VALUE</span><strong>{stats.casinoTotalDistributedSol.toFixed(2)} SOL</strong></div>
          </div>
        </div>

        <div className="casino-stage" id="live-round">
          <div className="casino-stage__bar">
            <span><i /> {live.status === "playing" ? "ROUND LIVE" : "ENGINE READY"}</span>
            <strong>{activeGame.code} / {activeGame.name} / {live.tournamentStage}</strong>
            <small>{clockLabel(remaining)}</small>
          </div>
          <div className="casino-stage__screen">
            <GameVisual game={activeGame.name} currentPlay={live.currentPlay} now={now ?? 0} />
            <div className="casino-stage__playback">
              <span>{live.currentPlay ? `PLAY ${live.currentPlay.playIndex}/${live.round?.eligibleCount ?? 0}` : "VERIFIED QUEUE"}</span>
              <strong>{live.currentPlay ? shortWallet(live.currentPlay.wallet) : liveStatusLabel(live.status)}</strong>
            </div>
            <div className="casino-screen-corners" aria-hidden="true"><i /><i /><i /><i /></div>
          </div>
          <div className="casino-stage__footer">
            <span>{activeGame.rule.toUpperCase()}</span>
            <span>{live.remainingCount.toLocaleString()} LEFT / NEXT: {nextGame.name}</span>
            <span>
              SETTLEMENT: {state === "error" || live.status === "offline" ? "OFFLINE" : live.round?.proofVerified ? "PROOF VERIFIED" : "PROOF REQUIRED"}
            </span>
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
          <div><span>PHASE</span><strong>{live.tournamentStage}</strong></div>
          <div><span>PLAYERS</span><strong>{live.round ? `${live.remainingCount.toLocaleString()} / ${live.round.eligibleCount.toLocaleString()}` : "NO ROUND"}</strong></div>
          <div><span>INTEGRITY</span><strong>{live.round?.proofVerified ? "PROOF VERIFIED" : "PROOF REQUIRED"}</strong></div>
          <div><span>NEXT ROTATION</span><strong>{clockLabel(remaining)}</strong></div>
        </div>
      </section>

      <div className="casino-live-grid">
        <LiveGameFeed live={live} />
        <LiveChat />
      </div>

      <HowItWorks />

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

      <RoundLeaderboard live={live} />

      <div id="results"><ResultBoard /></div>

      <section className="casino-settlement">
        <div>
          <Clock3 size={18} />
          <span>01</span>
          <strong>80% ROUND POOL</strong>
          <p>Eighty percent of verified creator fees funds the current round&apos;s top three.</p>
        </div>
        <div>
          <Circle size={18} />
          <span>02</span>
          <strong>50 / 30 / 20</strong>
          <p>First, second, and third split the round pool at fifty, thirty, and twenty percent.</p>
        </div>
        <div>
          <ShieldCheck size={18} />
          <span>03</span>
          <strong>20% JACKPOT</strong>
          <p>Twenty percent of every round carries into the independently tracked jackpot.</p>
        </div>
        <div>
          <CheckCircle2 size={18} />
          <span>04</span>
          <strong>EVERY 25TH ROUND</strong>
          <p>The accumulated jackpot is added to first place after proof and settlement confirm.</p>
        </div>
      </section>

      <section className="casino-final">
        <span>CASINO STRATEGY / {scoutPublicConfig.tokenLabel}</span>
        <h2>THE HOUSE RUNS<br />ON A CLOCK.</h2>
        <p>Ten games. Fifteen-minute rounds. 80% to the top three. 20% to the jackpot.</p>
        {scoutPublicConfig.buyUrl ? (
          <a className="casino-button casino-button--solid" href={scoutPublicConfig.buyUrl} target="_blank" rel="noreferrer">
            BUY {scoutPublicConfig.tokenLabel} <ArrowUpRight size={16} />
          </a>
        ) : null}
      </section>
    </div>
  );
}
