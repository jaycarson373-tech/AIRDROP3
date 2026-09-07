// Run after `npm run build`. Checks the shipped static output, not just source strings.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const html = readFileSync(".next/server/app/index.html", "utf8");
const timeline = html.match(/<section[^>]*id="timeline"[\s\S]*?<\/section>/)?.[0];
assert.ok(timeline, "Timeline must be present in the rendered homepage");
assert.equal((timeline.match(/data-chapter="\d+"/g) ?? []).length, 15, "All 15 history chapters render");
assert.equal((timeline.match(/<li>/g) ?? []).length, 88, "All 88 era references stay visible");
for (const text of ["2005–2009", "2010–2014", "2015–2017", "2018–2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026", "YOLO", "Swag", "What are those?!", "TRIPLE T", "BOMBARDIRO CROCODILO", "1854", "230%"]) {
  assert.ok(timeline.includes(text), `Missing history content: ${text}`);
}
assert.ok(!timeline.includes("<details"), "Meme examples must not be hidden in disclosures");
assert.ok(!timeline.includes("280%"), "Do not restore the unverified usage statistic");
for (let index = 0; index < 15; index++) {
  assert.ok(timeline.includes(`id="rot-chapter-${index}"`), `Chapter ${index} must have a navigation target`);
}
for (const year of [2005, 2010, 2018, 2020, 2021, 2022, 2023, 2024, 2025]) {
  assert.ok(existsSync(`public/brand/lore/community-archive-${year}.jpg`), `Missing archive image ${year}`);
}
for (const file of ["tung-tung-original.png", "bombardiro-crocodilo-hq.png", "bombardiro-crocodilo.jpg", "67-kid.jpg"]) {
  assert.ok(existsSync(`public/brand/lore/${file}`), `Missing character image ${file}`);
  assert.ok(html.includes(encodeURIComponent(`/brand/lore/${file}`)), `Image not rendered: ${file}`);
}
assert.ok(!html.includes("$BRAINROT CA"), "Removed CA strip must stay removed");
console.log("History checks passed: 15 chapters, 88 visible references, 9 archives, original character assets, truthful dates/statistic.");
