"use client";

import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { projectConfig } from "./project-config";

const CHARACTERS = [
  {
    name: "PATRICK BRAINROT",
    era: "2026 // NO RECOVERY",
    note: "brain activity: no. aura: catastrophic.",
    image: "/brand/brainrot-logo.jpg",
    className: "is-patrick"
  },
  {
    name: "TRALALERO TRALALA",
    era: "2025 // ITALIAN ROT",
    note: "three shoes. zero explanations. bellissimo.",
    image: "/brand/tralalero.png",
    className: "is-tralalero"
  },
  {
    name: "BOMBARDIRO CROCODILO",
    era: "2025 // AIRBORNE NONSENSE",
    note: "the timeline requested air support. huge mistake.",
    image: "/brand/bombardiro.png",
    className: "is-bombardiro"
  },
  {
    name: "TUNG TUNG TUNG SAHUR",
    era: "2025 // MAXIMUM AURA",
    note: "heard three knocks. the lore entered with a bat.",
    image: "/brand/tung-tung.png",
    className: "is-tung"
  },
  {
    name: "BALLERINA CAPPUCCINA",
    era: "2025 // ESPRESSO ARC",
    note: "serving pirouettes, caffeine and irreversible damage.",
    image: "/brand/ballerina.png",
    className: "is-ballerina"
  },
  {
    name: "SIX SEVEN",
    era: "2025 // THE NUMBER INCIDENT",
    note: "math left the chat. the children understood everything.",
    image: null,
    className: "is-sixty-seven"
  }
] as const;

type LoreImage = { src: string; alt: string; className?: string };
type LoreEntry = {
  date: string;
  title: string;
  copy: string;
  images: LoreImage[];
  examples?: string[];
  archiveYear?: number;
  stamp: string;
  className?: string;
};

const LORE: LoreEntry[] = [
  {
    date: "2020",
    title: "LOCKDOWN. PHONE ON.",
    copy: "COVID lockdowns moved hangouts, boredom and entertainment onto screens. Among Us made everyone sus; Coffin Dance and Bella Poarch turned a few seconds of sound and movement into endlessly repeatable jokes. the feed got faster, attention got shorter, and context became optional.",
    images: [],
    archiveYear: 2020,
    examples: ["Among Us / sus", "Coffin Dance", "Bella Poarch / M to the B", "Always Has Been", "DaBaby Car / Convertible", "Vector edits", "Juan / horse on balcony"],
    stamp: "PATIENT ZERO"
  },
  {
    date: "2021",
    title: "THE SOUND BECOMES THE JOKE",
    copy: "John Cena saying ‘bing chilling,’ a Fortnite-card giveaway and SugarCrash! became clips you recognized before anyone explained them. GigaChad and uncanny Mr. Incredible edits turned a face into a whole mood. the punchline was knowing the reference.",
    images: [],
    archiveYear: 2021,
    examples: ["Bing Chilling", "Mr. Incredible Becoming Uncanny", "GigaChad", "19 Dollar Fortnite Card", "Stretchy LeBron", "SugarCrash!", "Talking Tom edits"],
    stamp: "REPLAY DAMAGE"
  },
  {
    date: "2022",
    title: "THE FEED LEARNS OUR WEAKNESS",
    copy: "Quandale Dingle stories, Only in Ohio and Talking Ben made absurd voices, names and recurring characters into their own language. Sigma and Patrick Bateman edits could turn almost any clip into the same joke. sound + image + repetition; understanding was no longer required.",
    images: [],
    archiveYear: 2022,
    examples: ["Hom Say Young", "Kumalala vs. Savesta", "Shocked Jslutty", "Quandale Dingle", "Only in Ohio", "Nathaniel B", "Talking Ben", "Patrick Bateman / sigma edits", "Blue Grinch / knee surgery"],
    stamp: "ATTENTION LOST"
  },
  {
    date: "2023",
    title: "SKIBIDI TAKES OVER",
    copy: "toilets got heads: DaFuq!?Boom!’s Skibidi Toilet grew from a YouTube Short into serialized battles, factions and lore. John Pork was calling, the Smurf Cat was everywhere, and hood-irony edits kept scrambling the format. you didn’t just recognize the joke anymore; you followed its universe.",
    images: [],
    archiveYear: 2023,
    examples: ["Skibidi Toilet", "Barbie Dogs / Borzoi", "Smurf Cat", "Biggest Bird", "John Pork is calling", "Hood irony", "Rizz", "Gooning slang"],
    stamp: "NO RETURN"
  },
  {
    date: "2024",
    title: "THE ROT GETS A NAME",
    copy: "the TikTok Rizz Party, Costco Guys’ BOOM and the Low Taper Fade became catchphrases people carried off the screen. Oxford recorded a 230% increase in usage of ‘brain rot’ between 2023 and 2024. it became Oxford’s 2024 Word of the Year; the dictionary had entered the group chat.",
    images: [],
    archiveYear: 2024,
    examples: ["TikTok Rizz Party", "Costco Guys", "Low Taper Fade", "Hawk Tuah", "Sigma Boy", "LeBron / You Are My Sunshine", "Thick of It", "Prime / Lunchly", "Knee surgery resurgence"],
    stamp: "DICTIONARY INFECTED"
  },
  {
    date: "2025",
    title: "EVERYTHING IS AN INSIDE JOKE",
    copy: "LeBron parodies, gurt and name slang made ordinary words feel like passwords. Chicken Jockey became a cinema shout-along, while ‘100 men vs. one gorilla’ turned an absurd hypothetical into a shared argument. the comment section was now a dialect.",
    images: [],
    archiveYear: 2025,
    examples: ["LeBron parodies", "Gurt", "SYBAU", "Chicken Jockey", "Name slang", "100 men vs. 1 gorilla", "Tralalero Tralala", "Tung Tung Tung Sahur"],
    stamp: "CONTEXT COLLAPSED"
  },
  {
    date: "2025",
    title: "THE ANIMALS START TALKING",
    copy: "Italian Brainrot and related AI-character trends turned sneaker sharks, crocodile aircraft and coffee-cup ballerinas into a recurring cast. Indonesian Tung Tung Tung Sahur joined the wider remix universe too. animals got names nobody could pronounce; then everybody learned them.",
    images: [
      { src: "/brand/tralalero.png", alt: "Tralalero Tralala, the sneaker-wearing shark", className: "lore-tralalero" },
      { src: "/brand/lore/bombardiro-crocodilo.jpg", alt: "Bombardiro Crocodilo flying through clouds, in the supplied meme image", className: "lore-bombardiro" },
      { src: "/brand/ballerina.png", alt: "Ballerina Cappuccina, the coffee-cup ballerina", className: "lore-ballerina" },
      { src: "/brand/tung-tung.png", alt: "Tung Tung Tung Sahur, the wooden character", className: "lore-tung" }
    ],
    stamp: "ROT GLOBAL",
    className: "is-invasion"
  },
  {
    date: "2025",
    title: "TRIPLE T",
    copy: "Tung Tung Tung Sahur became ‘Triple T’: TikTok edits put the wooden character into baseball, doorbell cams and everyday life. the feed found triple t. then triple t found everybody.",
    images: [{ src: "/brand/tung-tung.png", alt: "Triple T — Tung Tung Tung Sahur" }],
    stamp: "FEED CAPTURED",
    className: "is-triple-t"
  },
  {
    date: "2025",
    title: "67",
    copy: "Skrilla’s song, basketball edits and the 67 Kid turned a phrase into a shared reflex. two numbers, one hand motion, zero explanation required. language had officially been compressed into integers.",
    images: [{ src: "/brand/lore/67-kid.jpg", alt: "The 67 Kid at a basketball game, in the supplied meme photo" }],
    stamp: "ROT CRITICAL"
  },
  {
    date: "2026",
    title: "BRAIN OFF",
    copy: "no setup. no context. no recovery.",
    images: [{ src: "/brand/brainrot-logo.jpg", alt: "Patrick Brainrot: the final state" }],
    stamp: "BRAIN OFF"
  }
];

function LoreVisual({ entry }: { entry: LoreEntry }) {
  if (entry.archiveYear) {
    const src = `/brand/lore/community-archive-${entry.archiveYear}.jpg`;
    return <a className="lore-archive-crop" href={src} target="_blank" rel="noopener noreferrer" aria-label={`Open the supplied ${entry.archiveYear} community meme archive`}>
      <Image src={src} alt={`Community archive collage of ${entry.archiveYear} memes from the supplied TikTok reference`} fill sizes="(max-width: 700px) 85vw, (max-width: 900px) 42vw, 360px" loading="lazy" />
    </a>;
  }
  if (!entry.images.length) return null;
  return <div className={`lore-image-mat${entry.images.length > 1 ? " is-collage" : ""}`}>
    {entry.images.map((image) => <Image key={image.src} src={image.src} alt={image.alt} className={image.className} width={600} height={400} sizes="(max-width: 700px) 85vw, (max-width: 900px) 42vw, 360px" loading="lazy" />)}
  </div>;
}

type CallPhase = "ringing" | "answering" | "done";

function JohnPorkCallIntro() {
  const [phase, setPhase] = useState<CallPhase>("ringing");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (phase === "done") return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setPhase(phase === "ringing" ? "answering" : "done"), reducedMotion ? 200 : phase === "ringing" ? 3000 : 450);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const answerNow = () => {
    if (phase !== "ringing") return;
    setPhase("answering");
  };

  if (phase === "done") return null;

  const preview = (
    <div className={`brainrot-call-gate is-${phase}`} role="dialog" aria-modal="true" aria-label="John Pork incoming call" onKeyDown={(event) => { if (event.key === "Escape") setPhase("done"); if (event.key === "Tab") event.preventDefault(); }}>
      <div className="brainrot-call-phone">
        <img src="/brand/john-pork-calling.jpg" alt="John Pork is calling" />
        <button className="brainrot-call-answer" type="button" autoFocus onClick={answerNow} aria-label="Accept John Pork call and enter the site" />
      </div>
    </div>
  );

  // Render outside the site's stacking contexts so the intro covers the viewport.
  return mounted ? createPortal(preview, document.body) : preview;
}

function RotFeed() {
  const [paused, setPaused] = useState(false);
  return (
    <section className="fever-feed" id="rot-feed">
      <header>
        <span>LIVE FROM THE DAMAGED PART OF THE INTERNET</span>
        <h2>BRAINROT INDEX</h2>
        <strong>ROT LEVEL: ██████████ 100%</strong>
        <button className="fever-feed__control" type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? "RESUME THE ROT" : "PAUSE THE ROT"}</button>
        <p className="fever-feed__hint">SWIPE FOR MORE DAMAGE</p>
      </header>
      <div className="fever-feed__viewport" tabIndex={0} role="region" aria-label="Brainrot characters — swipe or use arrow keys to explore">
        <div className={`fever-feed__track${paused ? " is-paused" : ""}`}>
          {[...CHARACTERS, ...CHARACTERS].map((character, index) => (
            <article className={`fever-card ${character.className}`} aria-hidden={index >= CHARACTERS.length} key={`${character.name}-${index}`}>
              <div className="fever-card__warning">{index % 2 ? "⚠ DO NOT THINK" : "100% REAL LORE"}</div>
              {character.image ? (
                <img src={character.image} alt={index < CHARACTERS.length ? character.name : ""} loading="lazy" decoding="async" />
              ) : (
                <div className="fever-card__67" aria-label="Six seven">67</div>
              )}
              <span>{character.era}</span>
              <h3>{character.name}</h3>
              <p>{character.note}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScreenTimeReport() {
  const days = ["M", "T", "W", "T", "F", "S", "NOW"];
  const doomPosts = [
    "one more video bro",
    "john pork called again",
    "67 DETECTED",
    "tralalero posted",
    "screen time limit ignored",
    "brain loading... 0%",
    "you are still scrolling",
    "there is no bottom"
  ];

  return (
    <section className="fever-screentime" id="screen-time">
      <img className="fever-screentime__invader" src="/brand/tung-tung.png" alt="Tung Tung Tung Sahur invading the screen-time report" loading="lazy" decoding="async" />
      <div className="fever-screentime__copy">
        <span>WEEKLY DEVICE REPORT // VERY CONCERNING</span>
        <h2>SCREEN TIME<br /><em>OFF THE CHARTS</em></h2>
        <p>the green rot has breached containment. please put the phone down after this next video.</p>
        <strong>DOOMSCROLL STATUS: NO BOTTOM FOUND</strong>
      </div>

      <div className="fever-phone-report">
        <div className="fever-phone-report__top"><i /> SCREEN TIME <b>● LIVE</b></div>
        <p>DAILY AVERAGE</p>
        <h3>13h 37m</h3>
        <strong>UP 420% FROM LAST WEEK</strong>
        <div className="fever-screen-chart" aria-label="Screen time chart showing usage increasing beyond the chart">
          {days.map((day, index) => (
            <div className={index === days.length - 1 ? "is-today" : ""} key={`${day}-${index}`}>
              <i><em /></i><span>{day}</span>
            </div>
          ))}
          <b>HELP</b>
        </div>
        <div className="fever-phone-report__stats">
          <span><b>667</b> pickups</span>
          <span><b>∞</b> refreshes</span>
          <span><b>0m</b> outside</span>
        </div>
      </div>

      <div className="fever-doomscroll" aria-label="Infinite doomscroll parody">
        <header><b>FOR YOU</b><span>doom feed</span></header>
        <div>
          {[0, 1].map((group) => <div className="fever-doomscroll__group" key={group} aria-hidden={group === 1}>
            {doomPosts.map((post, index) => <article key={post}><i>{index % 3 === 0 ? "67" : index % 3 === 1 ? "🧠" : "?!"}</i><p>{post}</p><span>♡ {6900 - index * 67}</span></article>)}
          </div>)}
        </div>
        <footer>YOU HAVE SCROLLED 14.7 KM TODAY</footer>
      </div>
    </section>
  );
}

export function BrainrotView() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [fateAccepted, setFateAccepted] = useState(false);

  useEffect(() => {
    const popupTimer = window.setTimeout(() => setPopupOpen(true), 4700);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => window.clearTimeout(popupTimer);

    let pointerFrame = 0;
    let scrollFrame = 0;
    const update = (event: PointerEvent) => {
      if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
      pointerFrame = window.requestAnimationFrame(() => {
        const x = (event.clientX / window.innerWidth - .5) * 18;
        const y = (event.clientY / window.innerHeight - .5) * 14;
        rootRef.current?.style.setProperty("--parallax-bg-x", `${x * -.25}px`);
        rootRef.current?.style.setProperty("--parallax-bg-y", `${y * -.25}px`);
        rootRef.current?.style.setProperty("--parallax-title-x", `${x * .18}px`);
        rootRef.current?.style.setProperty("--parallax-title-y", `${y * .12}px`);
        rootRef.current?.style.setProperty("--parallax-collage-x", `${x * -.34}px`);
        rootRef.current?.style.setProperty("--parallax-collage-y", `${y * -.2}px`);
      });
    };
    const updateScroll = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        rootRef.current?.style.setProperty("--scroll-drift", `${Math.min(window.scrollY * .04, 80)}px`);
      });
    };
    updateScroll();
    window.addEventListener("pointermove", update, { passive: true });
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => {
      window.clearTimeout(popupTimer);
      window.removeEventListener("pointermove", update);
      window.removeEventListener("scroll", updateScroll);
      if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
    };
  }, []);

  useEffect(() => {
    if (!popupOpen) return;
    const timer = window.setTimeout(() => setPopupOpen(false), 6000);
    return () => window.clearTimeout(timer);
  }, [popupOpen]);

  return (
    <div className="brainrot-fever" ref={rootRef}>
      <JohnPorkCallIntro />

      {popupOpen ? (
        <aside className="fever-popup" role="status">
          <div><span>brain_scan.exe</span><button type="button" onClick={() => setPopupOpen(false)} aria-label="Close brain scan popup"><X size={15} /></button></div>
          <strong>⚠ CRITICAL ROT DETECTED</strong>
          <p>good news: ur early<br />bad news: brain gone</p>
          <button type="button" onClick={() => setPopupOpen(false)}>ok lol</button>
        </aside>
      ) : null}

      <section className="fever-hero" id="top">
        <div className="fever-scanlines" aria-hidden="true" />
        <div className="fever-hero__copy">
          <span className="fever-kicker">WORLD WIDE WEB // CONDITION: TERMINAL</span>
          <h1 data-text="BRAINROT" aria-label="BRAINROT">BRAINROT</h1>
          <h2>THE INTERNET HAS A CONDITION.</h2>
          <p>HOLD $BRAINROT. GET $NEURALINK.</p>
        </div>

        <div className="fever-collage" aria-label="Brainrot character collage">
          <img className="fever-char fever-char--tralalero" src="/brand/tralalero.png" alt="Tralalero Tralala" />
          <img className="fever-char fever-char--bombardiro" src="/brand/bombardiro.png" alt="Bombardiro Crocodilo" />
          <img className="fever-char fever-char--tung" src="/brand/tung-tung.png" alt="Tung Tung Tung Sahur" />
          <img className="fever-char fever-char--ballerina" src="/brand/ballerina.png" alt="Ballerina Cappuccina" />
          <div className="fever-char fever-char--patrick">
            <img src="/brand/brainrot-logo.jpg" alt="Patrick Brainrot" />
            <b>PATRICK.BRAINROT</b>
          </div>
          <strong className="fever-67" aria-label="Six seven">67</strong>
        </div>

        <div className="fever-system fever-system--one"><b>brain activity</b><span>none detected</span><i><em /></i></div>
        <div className="fever-system fever-system--two"><b>rot level</b><span>CRITICAL</span><i><em /></i></div>
        <div className="fever-sticker fever-sticker--one">SIGNAL LOST</div>
        <div className="fever-sticker fever-sticker--two">67 DETECTED</div>
        <div className="fever-sticker fever-sticker--three">NO THOUGHTS<br />HEAD EMPTY</div>
      </section>

      <div className="fever-marquee" aria-label="Brainrot status feed"><div>
        {Array.from({ length: 2 }, (_, group) => (
          <span key={group}>ROT ROT ROT // JOHN PORK CALLING // SKIBIDI // TUNG TUNG TUNG // 67 // AURA +6900 // BRAIN OFF //&nbsp;</span>
        ))}
      </div></div>

      <RotFeed />

      <ScreenTimeReport />

      <section className="fever-rewards" id="rewards">
        <div className="fever-alert">THIS COULD HAVE BEEN AN EMAIL</div>
        <h2>HOLD BRAINROT.<br />GET NEURALINK.<br /><span>BRAIN OFF.</span></h2>
        <div className="fever-pipeline" aria-label="BRAINROT holder reward pipeline">
          <div className="fever-orb fever-orb--brainrot"><img src="/brand/brainrot-logo.jpg" alt="BRAINROT" /><b>HOLD</b></div>
          <div className="fever-wire"><i /><i /><i /><strong>STONK<br />DOES<br />THING</strong></div>
          <div className="fever-brain" aria-hidden="true">🧠<span>⚡</span></div>
          <div className="fever-wire fever-wire--reverse"><i /><i /><i /></div>
          <div className="fever-orb fever-orb--neural"><b>$NEURALINK</b><small>REWARD</small></div>
        </div>
        <div className="fever-reward-links">
          <a href={projectConfig.stonkUrl} target="_blank" rel="noopener noreferrer">STONKFUN</a>
          <Link href="/rewards">REAL RECEIPTS ONLY</Link>
        </div>
      </section>

      <section className="fever-lore fever-lore--evolution" id="timeline">
        <header>
          <span>ARCHIVE CORRUPTED SUCCESSFULLY</span>
          <h2>THE TIMELINE<br />GOT WORSE</h2>
          <p>2020–2026 // LOCKDOWN SCROLLING. SHARED SOUNDS. RECURRING CHARACTERS. AN ENTIRE INTERNET DIALECT.</p>
          <div className="lore-context">
            <p>2020 wasn’t the invention of weird internet humor. It was the lockdown acceleration: phones became the hangout, short videos became the format, and jokes became things you replayed, remixed and quoted.</p>
            <p>“Brain rot” is older than the internet—Oxford traces it to 1854. Gen Z and Gen Alpha gave it fresh life online, and by 2024 it was Oxford’s Word of the Year. This is the modern feed’s evolution, not the word’s birth certificate.</p>
            <a href="https://corp.oup.com/news/brain-rot-named-oxford-word-of-the-year-2024/" target="_blank" rel="noopener noreferrer">OXFORD: THE WORD’S HISTORY</a>
            <small>Years group overlapping meme waves, not every original upload. Supplied community collages are reference material; tap one to view it in full.</small>
          </div>
        </header>
        <div className="fever-lore__wall">
          {LORE.map((item, index) => (
            <article className={`fever-lore-item fever-lore-item--${index + 1} ${item.className ?? ""}`} key={item.title}>
              <div className="fever-tape" aria-hidden="true" />
              <LoreVisual entry={item} />
              <time>{item.date}</time>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
              {item.archiveYear === 2024 ? <a className="lore-source" href="https://corp.oup.com/news/brain-rot-named-oxford-word-of-the-year-2024/" target="_blank" rel="noopener noreferrer">SOURCE: OXFORD UNIVERSITY PRESS</a> : null}
              {item.examples ? <div className="lore-examples">
                <h4>IN THE FEED · {item.examples.length} REFERENCES</h4>
                <ul>{item.examples.map((example) => <li key={example}>{example}</li>)}</ul>
              </div> : null}
              <strong>{item.stamp}</strong>
            </article>
          ))}
          <aside className="fever-error-box">
            <b>Internet Explorer</b>
            <p role="status">{fateAccepted ? "fate accepted. welcome to the damaged part of the internet." : "recovery.exe was not found. the condition is permanent."}</p>
            <button type="button" disabled={fateAccepted} onClick={() => setFateAccepted(true)}>{fateAccepted ? "brain successfully uninstalled ✓" : "accept fate"}</button>
          </aside>
        </div>
      </section>

      <section className="fever-pair" id="pair">
        <span>UNAUTHORIZED CROSSOVER EVENT</span>
        <h2>BRAINROT + NEURALINK</h2>
        <div className="fever-collision">
          <div className="fever-collision__token fever-collision__token--rot"><img src="/brand/brainrot-logo.jpg" alt="BRAINROT" /><b>$BRAINROT</b></div>
          <strong>×</strong>
          <div className="fever-collision__brain"><i>🧠</i><b>$NEURALINK</b></div>
          <em>BOOM</em>
        </div>
        <h3>NO BRAIN MEETS MAXIMUM BRAIN.</h3>
        <p>the prophecy is complete. the browser is overheating. please remain extremely online.</p>
      </section>
    </div>
  );
}
