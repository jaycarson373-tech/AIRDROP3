# Timeline-only lore update — asset audit

## RinTinTin addition

Added a dedicated 2026 RINTINTIN chapter before the final Patrick/BRAIN OFF card, bringing the timeline to 16 chapters. Uses the live-performance still of JJQ from https://i.kym-cdn.com/entries/icons/original/000/057/281/rintincover.jpg, saved unchanged as `public/brand/lore/rin-tin-tin.jpg` (1280×720), visually inspected, and rendered through the existing responsive Next Image component. Context and visible source link: https://knowyourmeme.com/memes/rin-tin-tin-rap-kid. Copy describes the August 2026 reaction/remix wave without invented views or quoting the rap lyrics. No styling or reward changes. The chapter count label now derives from the data array.

Status: expanded to 15 chapters spanning 2005–2026, with 88 visible named references across ten era lists. All prior 48 references are retained. Three newly supplied early-history collages are added; six repeated 2020–2025 screenshots reuse the existing identical references. The taped paper aesthetic and character carousel remain.

## September 7 history expansion

- Added unchanged supplied screenshots at `community-archive-2005.jpg`, `community-archive-2010.jpg`, and `community-archive-2018.jpg`, from upload folder `F0690AEF-5C34-4FCA-BE11-EB49ADBE578B`, photos 1–3. They represent 2005–2009, 2010–2014, and 2018–2019 respectively. CSS frames the book without modifying the originals.
- The missing 2015–2017 screenshot is not invented. That chapter uses a native typographic Vine catchphrase wall and a visible list of 12 recognizable references.
- `tung-tung-original.png`: original standing wooden character holding a bat, inspected at 1170×1180. Downloaded unchanged from https://upload.wikimedia.org/wikipedia/commons/1/12/Full_image_of_Tung_Tung_Tung_Sahur.png and attributed in the card. Replaces the bat-less cartoon in the timeline and character carousel only.
- `bombardiro-crocodilo-hq.png`: inspected 1920×1080 GIGA editorial composition using the same crocodile aircraft as the supplied image, with a white outline and different background. This is NOT represented as an upscale of the user's 225×225 upload. Used in its new dedicated chapter and carousel, with a source link. The exact user image remains in the AI-cast collage.
- Bombardiro source: https://www.giga.de/tech/bombardiro-crocodilo-was-steckt-hinter-dem-militaer-krokodil-meme-nicht-jugendfrei--01KC9EMC4Y6AAHBQ9XXXTVQ6MH
- The actual supplied 67 Kid photo now also replaces the generic number in the character carousel. The hero's typographic 67 accent is unchanged.
- Early-era dates group circulation waves, not inventions: Annoying Orange and Trollface predate the 2010 grouping; their continued spread belongs in that era. YOLO existed before Drake popularized it in 2011. “Brain rot” itself is recorded in 1854, so the new copy explicitly says internet-cultural predecessors, not memes predating the word.
- YOLO context: https://knowyourmeme.com/memes/yolo
- What are those, viral June 2015: https://www.dictionary.com/culture/memes/what-are-those
- E / Markiplier-Farquaad, 2018: https://knowyourmeme.com/memes/lord-marquaad-e
- New long-form single-column archive walk uses proportional large visuals, all examples visible, a chapter selector, back/next buttons, and reading progress. No timed gate, forced scrolling, autoplay video, or sound. Reduced-motion preference is respected. Layout stacks on mobile; no fixed-width tables.
- Scope: timeline content/layout and three carousel image references. The outer container uses `overflow: clip` instead of `hidden` so the archive's sticky chapter controls work. No token, reward, backend, pairing, global navigation, intro, or wallet configuration changes.

The following notes preserve the earlier audit; the expansion above supersedes older scope/count/image-use statements.

### Validation for the expansion

- `npm run build`: passed, including TypeScript and static page generation.
- `node scripts/check-brainrot-history.mjs`: passed against the generated homepage; verifies 15 chapter anchors, 88 visible list entries, historical date/usage wording, all nine archive files, the new character images, and the removed CA strip remaining absent.
- `git diff --check`: passed.
- Original Tung and the higher-resolution Bombardiro composition were visually inspected before use.
- Interactive/mobile screenshot QA could not run: the Browser runtime reported no available browsers, with discovery returning an empty list. Responsive CSS is implemented but a rendered mobile QA pass is still outstanding.

## Existing assets inspected

| File | Content | Timeline use |
| --- | --- | --- |
| `public/brand/brainrot-logo.jpg` | Patrick Brainrot scene | 2026 final state |
| `public/brand/tung-tung.png` | Wooden Tung Tung Tung Sahur character | Dedicated Triple T card and AI-character collage |
| `public/brand/tralalero.png` | Tralalero shark sticker, including surrounding transparent space | AI-character collage |
| `public/brand/lore/bombardiro-crocodilo.jpg` | User-supplied crocodile aircraft flying through clouds, 225×225 | AI-character timeline collage; the older site-wide illustration is unchanged |
| `public/brand/ballerina.png` | Coffee-cup ballerina | AI-character collage |
| `public/brand/john-pork-calling.jpg` | Incoming John Pork call | Not reused for 2020–2022 or Skibidi; intro is outside this task |
| `public/brand/lore/67-kid.jpg` | User-supplied 67 Kid photo, 588×330 | Dedicated 2025 67 card, with proportional contain sizing |

The six supplied screenshots are stored unchanged at `public/brand/lore/community-archive-2020.jpg` through `community-archive-2025.jpg`. Each is 589×1280 and approximately 132–139 KB. CSS frames the book area; the full screenshot is available by tapping the image. Next Image provides responsive, lazy-loaded delivery. These are attributed as community collages, not treated as authoritative first-upload dates. The 2023 screenshot includes recognizable Skibidi imagery. The separate 67 Kid photo was supplied afterward and is stored unchanged; its full frame is preserved without stretching.

The source screenshot's “Victor” is rendered as Vector. Talking Ben's major meme revival belongs in 2022, rather than treating the 2021 screenshot as an exact chronology. Earlier origins and later resurgences overlap, which is explicitly explained on the site. Knee surgery appears with the 2022 wave and its 2024 resurgence. The 2025 list is separated from the AI-cast collage so both the language trends and the characters have context.

## Historical checks

- Triple T is a nickname for Tung Tung Tung Sahur, not a separate character. The nickname appears in late-2025 TikTok caption/remix culture, including baseball and doorbell-camera edits: https://knowyourmeme.com/memes/triple-t
- Tung Tung Tung Sahur began as an Indonesian meme and is commonly grouped with the wider AI brainrot cast; the card avoids calling every character Italian: https://knowyourmeme.com/memes/tung-tung-tung-sahur
- Skibidi Toilet began in 2023 as DaFuq!?Boom!'s YouTube Shorts series: https://knowyourmeme.com/memes/subcultures/skibidi-toilet
- The 67 Kid comes from a March 2025 basketball video and references Skrilla's song: https://knowyourmeme.com/memes/67-kid
- Independent context for the song, basketball videos and hand motion: https://apnews.com/article/e5a0cddd8d1e6ec5e90c51242367146d
- The term is recorded in 1854 and was Oxford Word of the Year in 2024, not coined in 2020: https://corp.oup.com/news/brain-rot-named-oxford-word-of-the-year-2024/
- Oxford reports a **230% increase in usage frequency between 2023 and 2024**, not 280% in 2023. The 2024 card uses the verified figure and links directly to that announcement.
- TikTok's pandemic context: https://newsroom.tiktok.com/an-update-for-our-tiktok-family?lang=en
- DaBaby Convertible imagery existed in 2020, with a wider 2021 wave: https://knowyourmeme.com/memes/ironic-dababy-memes
- Juan / horse-on-balcony circulated in 2020: https://knowyourmeme.com/memes/juan-horse-on-balcony
- Bing Chilling's 2021 clip and subsequent remix circulation: https://knowyourmeme.com/editorials/guides/what-does-bing-chilling-mean-and-how-is-john-cena-involved
- Talking Ben's 2022 revival: https://memepedia.ru/govoryashhij-ben/
- 2025 gorilla debate revival: https://knowyourmeme.com/memes/100-men-vs-1-gorilla

The requested 2025 card order is thematic escalation, not a claim that the 67 Kid appeared after the Triple T nickname. No audience counts or views are used. 2020–2022 is framed as the short-form-feed prehistory of this timeline, not the invention date of internet absurdism or the word brainrot.

## Implementation boundaries

All 48 named references across the six yearly archive cards are displayed as visible lists, not collapsed disclosures. The supplied references are covered using recognizable names (for example, DaBaby Car / Convertible and Smurf Cat). Talking Tom and Talking Ben are listed separately across 2021 and 2022 to preserve the chronology correction. The AI-character, Triple T, 67, and Patrick cards remain separate timeline moments.

Only timeline data, timeline visual rendering, and styles scoped to `.fever-lore--evolution` change. Existing paper, borders, tape, typography, and stamps remain. No navigation, reward, token, pairing, worker, or API changes.

Timeline character images use Next Image, responsive sizes, lazy loading, fixed layout boxes, and `object-fit: contain`. Archive screenshots use `object-fit: cover` in proportional frames, so there is no stretching. Existing source images are not overwritten. The multi-character collage uses all four approved local AI-character assets. The generic giant 67 is removed from the timeline only; the separate character feed and hero are out of scope.
