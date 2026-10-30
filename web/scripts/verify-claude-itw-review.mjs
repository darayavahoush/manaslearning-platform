// Offline verification of ADHD event-order shuffle and Dyslexia pair rotation.
// Extracts the real functions from InTheirWorld.jsx. Run: node scripts/verify-claude-itw-review.mjs
import fs from "fs";
const src = fs.readFileSync(new URL("../components/itw/InTheirWorld.jsx", import.meta.url), "utf8");
const grab = (start, end) => src.slice(src.indexOf(start), src.indexOf(end, src.indexOf(start)));
const ext = grab("const ADHD_EXTERNAL_NOTIFICATIONS", "function createPrng");
const prngSrc = grab("function createPrng", "function shuffleWith");
const shufSrc = grab("function shuffleWith", "function AdhdWorkspaceSim");
const pairs = grab("const DYSLEXIA_PASSAGE_PAIRS", "const ITW_DYS_ORDER_KEY");
const rot = grab("const ITW_DYS_ORDER_KEY", "/* ================= Shared flow pieces");
const store = () => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => (m[k] = String(v)) }; };
globalThis.window = {}; globalThis.sessionStorage = store(); globalThis.localStorage = store();
const mod = new Function(`${ext}\n${prngSrc}\n${shufSrc}\n${pairs}\n${rot}\nreturn {ADHD_EXTERNAL_NOTIFICATIONS, ADHD_INTERNAL_THOUGHTS, createPrng, shuffleWith, DYSLEXIA_PASSAGE_PAIRS, getActiveDyslexiaPairIndex, advanceActiveDyslexiaPairIndex};`)();
let fail = 0; const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fail++; };

console.log("== ADHD: seeded order (first 8 event ids) ==");
const pool = [...mod.ADHD_EXTERNAL_NOTIFICATIONS, ...mod.ADHD_INTERNAL_THOUGHTS];
const orders = {};
for (const seed of [1, 42, 1337, 2026, 99999]) {
  const o = mod.shuffleWith(mod.createPrng(seed), pool).map(x => x.id);
  orders[seed] = o.join(",");
  console.log(`seed ${seed}: ${o.slice(0, 8).join(" > ")}`);
}
ok(new Set(Object.values(orders)).size === 5, "5 seeds give 5 distinct orders");
const again = mod.shuffleWith(mod.createPrng(42), pool).map(x => x.id).join(",");
ok(again === orders[42], "same seed reproduces the same order");
ok(mod.shuffleWith(mod.createPrng(7), pool).length === pool.length && new Set(mod.shuffleWith(mod.createPrng(7), pool).map(x => x.id)).size === pool.length, "shuffle keeps all 12 events, no dupes");
const firstPos = {}; for (let s = 1; s <= 600; s++) { const f = mod.shuffleWith(mod.createPrng(s), pool)[0].id; firstPos[f] = (firstPos[f] || 0) + 1; }
console.log("first-event distribution over 600 seeds:", JSON.stringify(firstPos));
ok(Object.keys(firstPos).length === 12, "every event can open a session");
const mixed = mod.shuffleWith(mod.createPrng(1337), pool).slice(0, 6).map(x => x.channel);
console.log("channel mix seed 1337 (first 6):", mixed.join(","));

console.log("\n== Dyslexia: pair rotation ==");
const n = mod.DYSLEXIA_PASSAGE_PAIRS.length;
const seq = [];
for (let i = 0; i < n * 4; i++) { seq.push(mod.getActiveDyslexiaPairIndex()); mod.advanceActiveDyslexiaPairIndex(); }
console.log("24 consecutive attempts:", seq.join(" "));
let cycleOk = true, boundaryOk = true;
for (let c = 0; c < 4; c++) { if (new Set(seq.slice(c * n, c * n + n)).size !== n) cycleOk = false; if (c > 0 && seq[c * n] === seq[c * n - 1]) boundaryOk = false; }
ok(cycleOk, "each cycle uses all 6 pairs exactly once");
ok(boundaryOk, "no cycle opens with the pair that just finished");
ok(seq.every((v, i) => i === 0 || v !== seq[i - 1]), "never the same pair twice in a row");
const before = mod.getActiveDyslexiaPairIndex(); ok(before === mod.getActiveDyslexiaPairIndex(), "refresh mid-run keeps the same pair (no silent change)");
sessionStorage = store(); localStorage.setItem("itw_dys_last_pair", "3");
let startsOn3 = 0; for (let t = 0; t < 200; t++) { sessionStorage = store(); if (mod.getActiveDyslexiaPairIndex() === 3) startsOn3++; }
ok(startsOn3 === 0, "new browser session never opens on the last completed pair");
ok(mod.DYSLEXIA_PASSAGE_PAIRS.every(p => p.passageA.passageId !== p.passageB.passageId && p.passageA.text !== p.passageB.text), "Run 1 and Run 2 differ within every pair");
console.log(fail ? `\n${fail} FAILED` : "\nALL PASSED"); process.exit(fail ? 1 : 0);
