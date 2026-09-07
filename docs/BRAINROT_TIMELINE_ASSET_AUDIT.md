# Timeline-only lore update — asset audit

Status: expanded with the user's six supplied community-archive references. The 67 Kid portrait remains unavailable; its card has copy only, with no generic number graphic or unrelated substitute.

## Existing assets inspected

| File | Content | Timeline use |
| --- | --- | --- |
| `public/brand/brainrot-logo.jpg` | Patrick Brainrot scene | 2026 final state |
| `public/brand/tung-tung.png` | Wooden Tung Tung Tung Sahur character | Dedicated Triple T card and AI-character collage |
| `public/brand/tralalero.png` | Tralalero shark sticker, including surrounding transparent space | AI-character collage |
| `public/brand/bombardiro.png` | Illustrated crocodile aircraft | AI-character collage, not an early-era image |
| `public/brand/ballerina.png` | Coffee-cup ballerina | AI-character collage |
| `public/brand/john-pork-calling.jpg` | Incoming John Pork call | Not reused for 2020–2022 or Skibidi; intro is outside this task |

The six supplied screenshots are stored unchanged at `public/brand/lore/community-archive-2020.jpg` through `community-archive-2025.jpg`. Each is 589×1280 and approximately 132–139 KB. CSS frames the book area; the full screenshot is available by tapping the image. Next Image provides responsive, lazy-loaded delivery. These are attributed as community collages, not treated as authoritative first-upload dates. The 2023 screenshot includes recognizable Skibidi imagery. No supplied screenshot contains the actual 67 Kid / hand-motion portrait; that asset is still needed to finish the earlier portrait requirement.

The source screenshot's “Victor” is rendered as Vector. Talking Ben's major meme revival belongs in 2022, rather than treating the 2021 screenshot as an exact chronology. Earlier origins and later resurgences overlap, which is explicitly explained on the site. Knee surgery appears with the 2022 wave and its 2024 resurgence. The 2025 list is separated from the AI-cast collage so both the language trends and the characters have context.

## Historical checks

- Triple T is a nickname for Tung Tung Tung Sahur, not a separate character. The nickname appears in late-2025 TikTok caption/remix culture, including baseball and doorbell-camera edits: https://knowyourmeme.com/memes/triple-t
- Tung Tung Tung Sahur began as an Indonesian meme and is commonly grouped with the wider AI brainrot cast; the card avoids calling every character Italian: https://knowyourmeme.com/memes/tung-tung-tung-sahur
- Skibidi Toilet began in 2023 as DaFuq!?Boom!'s YouTube Shorts series: https://knowyourmeme.com/memes/subcultures/skibidi-toilet
- The 67 Kid comes from a March 2025 basketball video and references Skrilla's song: https://knowyourmeme.com/memes/67-kid
- Independent context for the song, basketball videos and hand motion: https://apnews.com/article/e5a0cddd8d1e6ec5e90c51242367146d
- The term is recorded in 1854 and was Oxford Word of the Year in 2024, not coined in 2020: https://corp.oup.com/news/brain-rot-named-oxford-word-of-the-year-2024/
- TikTok's pandemic context: https://newsroom.tiktok.com/an-update-for-our-tiktok-family?lang=en
- DaBaby Convertible imagery existed in 2020, with a wider 2021 wave: https://knowyourmeme.com/memes/ironic-dababy-memes
- Juan / horse-on-balcony circulated in 2020: https://knowyourmeme.com/memes/juan-horse-on-balcony
- Bing Chilling's 2021 clip and subsequent remix circulation: https://knowyourmeme.com/editorials/guides/what-does-bing-chilling-mean-and-how-is-john-cena-involved
- Talking Ben's 2022 revival: https://memepedia.ru/govoryashhij-ben/
- 2025 gorilla debate revival: https://knowyourmeme.com/memes/100-men-vs-1-gorilla

The requested 2025 card order is thematic escalation, not a claim that the 67 Kid appeared after the Triple T nickname. No audience counts or views are used. 2020–2022 is framed as the short-form-feed prehistory of this timeline, not the invention date of internet absurdism or the word brainrot.

## Implementation boundaries

Only timeline data, timeline visual rendering, and styles scoped to `.fever-lore--evolution` change. Existing paper, borders, tape, typography, and stamps remain. No navigation, reward, token, pairing, worker, or API changes.

Timeline character images use Next Image, responsive sizes, lazy loading, fixed layout boxes, and `object-fit: contain`. Archive screenshots use `object-fit: cover` in proportional frames, so there is no stretching. Existing source images are not overwritten. The multi-character collage uses all four approved local AI-character assets. The generic giant 67 is removed from the timeline only; the separate character feed and hero are out of scope.
