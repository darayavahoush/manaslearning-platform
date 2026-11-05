import { NextResponse } from "next/server";
import { runKeeperGraph } from "./graph";

// Story-Keeper: turns RAW play observations into (1) a child-facing legend and
// (2) parent-facing notes. Nothing is stored or logged. No norms, scores or diagnoses.

type Obs = Record<string, any>;
type Out = {
  legend: string;
  noticed: string[];
  clinicianQuestions: string[];
  homeGames: { title: string; how: string }[];
  source: "llm" | "template";
  rows?: { name: string; value: string; detail?: string; note?: string }[];
  extra?: Extra;
};
type Extra = {
  method?: { name: string; samples: string; items: string; scoring: string }[];
  compare?: string[];
  appendix?: { title: string; head: string[]; rows: string[][] }[];
};

const wilson = (k: number, n: number): [number, number] => {
  const z = 1.96, p = k / n, d = 1 + (z * z) / n, c = p + (z * z) / (2 * n), m = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)];
};
const pct = (x: number) => Math.round(x * 100);

function secs(ms: any) {
  return typeof ms === "number" && ms > 0 ? Math.round(ms / 100) / 10 : null;
}

function template(quest: string, nick: string, obs: Obs): Out {
  const noticed: string[] = [];
  const homeGames: Out["homeGames"] = [];
  const done: string[] = obs.completed || [];
  const line = (name: string, o: Obs | undefined, label: string) => {
    if (!o || !o.trials) return noticed.push(`${label}: not enough data from this session.`);
    const t = secs(o.medianMs);
    noticed.push(`${label}: ${o.correct} of ${o.trials} picked the matching answer${t ? `, usually after about ${t} seconds` : ""}${o.replays ? `; replayed the sounds ${o.replays} times` : ""}.`);
  };
  if (quest === "dyslexia") {
    line("rhyme", obs.rhyme, "Rhyme game");
    line("firstSound", obs.firstSound, "First-sound game");
    const l = obs.letters;
    if (l?.rounds) {
      noticed.push(`Letter game: ${l.hits} matching letters found, ${l.falseTaps} look-alike letters tapped, ${l.missed} matching letters missed.`);
      if (l.falseTaps > 0) homeGames.push({ title: "Sky-write the pair", how: "Trace b and d in the air or in a tray of sand while saying 'bat then ball' (b) and 'drum' (d), five minutes, a few times a week." });
    } else noticed.push("Letter game: not enough data from this session.");
    const s = obs.soundSpan;
    noticed.push(s?.attempts ? `Sound-order game: repeated up to ${s.longest} sounds in a row.` : "Sound-order game: not enough data from this session.");
    if (obs.wordCheck?.trials) noticed.push(`Word game: ${obs.wordCheck.realCorrect} of ${obs.wordCheck.realTotal} real words and ${obs.wordCheck.madeUpCorrect} of ${obs.wordCheck.madeUpTotal} made-up words judged correctly.`);
    if (obs.spelling?.trials) line("spelling", obs.spelling, "Spelling game");
    homeGames.push({ title: "Rhyme walk", how: "On a walk, take turns naming things that rhyme with what you see. No right or wrong, just play." });
    homeGames.push({ title: "First-sound I-spy", how: "Play 'I spy something that starts with the sound sss', using the sound, not the letter name." });
  } else if (quest === "adhd") {
    const num = (v: any) => typeof v === "number" && isFinite(v);
    const t = secs(obs.hrtMs);
    noticed.push(num(obs.cptTrials) && obs.cptTrials > 0 ? `Sunbird game: ${obs.cptResponses ?? 0} taps over ${obs.cptTrials} rounds, with ${obs.omissions ?? 0} sunbirds missed and ${obs.commissions ?? 0} early taps on the moth${t ? `; taps usually took about ${t} seconds` : ""}.` : "Sunbird game: not enough data from this session.");
    noticed.push(num(obs.flankerCostMs) ? `Steering game: choices took about ${obs.flankerCostMs} ms longer when the distractions pointed the other way.` : "Steering game: not enough data from this session.");
    noticed.push(num(obs.workingMemorySpan) ? `Star-sequence game: remembered up to ${obs.workingMemorySpan} stars in a row.` : "Star-sequence game: not enough data from this session.");
    noticed.push(num(obs.chargeTrials) && obs.chargeTrials > 0 ? `Patience game: ${obs.prematureReleases ?? 0} early ${obs.prematureReleases === 1 ? "release" : "releases"} in ${obs.chargeTrials} tries.` : "Patience game: not enough data from this session.");
    homeGames.push({ title: "Freeze dance", how: "Dance while music plays and freeze when it stops, then swap who controls the music. Five minutes of silly fun." });
    homeGames.push({ title: "Copy the pattern", how: "Tap a short pattern on coloured cups and let your child copy it. Add one step only when it still feels like play." });
  } else if (quest === "autism") {
    const num = (v: any) => typeof v === "number" && isFinite(v);
    const jt = secs(obs.jaMedianMs), st = secs(obs.sortMedianMs);
    noticed.push(num(obs.jaTrials) && obs.jaTrials > 0 ? `Gaze game: picked the vessel Aria looked or pointed at ${obs.jaCorrect ?? 0} of ${obs.jaTrials} times${jt ? `, usually after about ${jt} seconds` : ""}.` : "Gaze game: not enough data from this session.");
    noticed.push(num(obs.feelingsTrials) && obs.feelingsTrials > 0 ? `Feelings match: ${obs.feelingsCorrect ?? 0} of ${obs.feelingsTrials} faces matched.` : "Feelings match: not enough data from this session.");
    noticed.push(num(obs.lightLevel) && num(obs.soundLevel) && num(obs.touchLevel) ? `Comfort choices (preferences, not scores): light ${obs.lightLevel} out of 10, sound ${obs.soundLevel} out of 10, touch ${obs.touchLevel} out of 10.` : "Comfort choices: not enough data from this session.");
    noticed.push(num(obs.sortCount) && obs.sortCount > 0 ? `Sorting game: ${obs.sortCount} cards sorted${st ? `, usually about ${st} seconds each` : ""}.` : "Sorting game: not enough data from this session.");
    homeGames.push({ title: "Look where I look", how: "Take turns glancing at an object across the room and guessing what the other is looking at. Keep it light and silly." });
    homeGames.push({ title: "Feelings faces", how: "Make faces in a mirror together and guess the feeling, then swap who leads." });
    homeGames.push({ title: "Cosy corner", how: "Let your child tune the light, sound and cushions in a quiet spot, and notice what they choose." });
  } else {
    noticed.push("Not enough data from this session.");
  }
  const finished = done.length;
  return {
    legend: `${nick}, the Keeper wrote your story down. You listened, you looked, and you kept going${finished ? ` through ${finished} chapters` : ""}. The library lanterns glow brighter because of you. Come back soon for the next chapter!`,
    noticed,
    clinicianQuestions: [
      "Which of these observations, if any, would you want to look at more closely in a full evaluation?",
      "Is there anything about how my child plays that you would want to see again over several sessions?",
      "What would you suggest I watch for at home and at school?",
    ],
    homeGames,
    source: "template",
  };
}

type Row = { name: string; value: string; detail?: string; note?: string };

// Counts come straight from the play data, not from the AI wording, so the printed table is exact.
function dyslexiaRows(obs: Obs, age: number | null = null): Row[] {
  const rows: Row[] = [];
  const num = (v: any) => typeof v === "number" && isFinite(v);
  const choice = (name: string, o: Obs | undefined) => {
    if (!o || !num(o.trials) || o.trials <= 0) { rows.push({ name, value: "Not completed" }); return; }
    const t = secs(o.medianMs);
    const bits: string[] = [];
    if (num(o.correct)) { const [lo, hi] = wilson(o.correct, o.trials); bits.push(`${pct(o.correct / o.trials)}% matched (95% interval ${pct(lo)} to ${pct(hi)}%, n = ${o.trials})`); }
    if (t) bits.push(`median response ${t} s from when the choices were available`);
    if (num(o.replays) && o.replays > 0) bits.push(`sounds replayed ${o.replays} ${o.replays === 1 ? "time" : "times"}`);
    rows.push({ name, value: `${o.correct} of ${o.trials} matching answers chosen`, detail: bits.join("; ") || undefined });
  };
  choice("Rhyme game", obs.rhyme);
  choice("First-sound game", obs.firstSound);
  const l = obs.letters;
  if (l && num(l.rounds) && l.rounds > 0) {
    const possible = num(l.possibleHits) ? l.possibleHits : (l.hits ?? 0) + (l.missed ?? 0);
    const conf = (l.confusions || {}) as Record<string, number>;
    const mirror = ["b>d", "d>b", "p>q", "q>p"].reduce((n, k) => n + (conf[k] || 0), 0);
    const top = Object.entries(conf).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k, n]) => { const [want, got] = k.split(">"); return `${got} tapped for ${want} (${n})`; });
    rows.push({
      name: "Letter game",
      value: `${l.hits} of ${possible} matching letters found`,
      detail: [
        `${l.falseTaps} look-alike taps${num(l.possibleDistractors) ? ` out of ${l.possibleDistractors} look-alike tiles` : ""}`,
        l.falseTaps > 0 ? `mirror pairs (b/d, p/q): ${mirror}` : "",
        top.length ? `most frequent: ${top.join(", ")}` : "",
      ].filter(Boolean).join("; "),
      note: age !== null && age < 8 ? "Mirror-letter confusions (b/d, p/q) are common in early readers, roughly up to age 7 or 8, so they say less at this age." : undefined,
    });
  } else rows.push({ name: "Letter game", value: "Not completed" });
  const s = obs.soundSpan;
  if (s && num(s.attempts) && s.attempts > 0) {
    rows.push({
      name: "Sound-order game",
      value: s.longest > 0 ? `Repeated up to ${s.longest} sounds in order` : "No scored sequence repeated correctly",
      detail: num(s.passed) ? `${s.passed} of ${s.attempts} sequences repeated correctly` : `${s.attempts} sequences tried`,
    });
  } else rows.push({ name: "Sound-order game", value: "Not completed" });
  const w = obs.wordCheck;
  if (w && num(w.trials) && w.trials > 0) {
    const t = secs(w.medianMs);
    rows.push({
      name: "Word check (optional)",
      value: `${w.realCorrect} of ${w.realTotal} real words accepted; ${w.madeUpCorrect} of ${w.madeUpTotal} made-up words rejected`,
      detail: [
        t ? `median response ${t} s from when the word appeared on screen` : "",
        w.list === "older" ? "longer word list" : "shorter word list",
        num(w.realCorrect) && num(w.madeUpCorrect) ? (() => { const k = w.realCorrect + w.madeUpCorrect, [lo, hi] = wilson(k, w.trials); return `${pct(k / w.trials)}% correct overall (95% interval ${pct(lo)} to ${pct(hi)}%, n = ${w.trials})`; })() : "",
        `random guessing would give about ${Math.round(w.trials / 2)} of ${w.trials} overall`,
      ].filter(Boolean).join("; "),
    });
  }
  if (obs.spelling?.trials) choice("Spelling game (optional)", obs.spelling);
  const voice = typeof obs.voice === "string" ? obs.voice.replace(/[^\p{L}\p{N} ()._-]/gu, "").slice(0, 60) : "";
  rows.push({
    name: "Spoken audio",
    value: voice ? `Device voice: ${voice}` : "Device voice not reported",
    detail: "Spoken words and sounds come from the device's built-in voice, which differs between phones and browsers.",
  });
  rows.push({ name: "Chapters finished", value: `${Array.isArray(obs.completed) ? obs.completed.length : 0} of ${num(obs.offered) && obs.offered > 0 ? obs.offered : 5}`, detail: "The word-check and spelling chapters are optional." });
  return rows;
}

// Item-by-item tables and side-by-side comparisons. Built from the counts and per-item data the child's own session produced.
function dyslexiaExtra(obs: Obs, detail: Obs): Extra {
  const num = (v: any) => typeof v === "number" && isFinite(v);
  const clean = (s: any) => String(s ?? "").replace(/[^\p{L}\p{N} '-]/gu, "").slice(0, 24);
  const list = (k: string): any[] => (Array.isArray(detail?.[k]) ? detail[k].slice(0, 40).filter((x: any) => x && typeof x === "object") : []);
  const t = (ms: any) => (num(ms) && ms > 0 ? (Math.round(ms / 100) / 10).toFixed(1) : "-");
  const appendix: NonNullable<Extra["appendix"]> = [];
  const choice = (title: string, key: string, headWord: string) => {
    const it = list(key);
    if (it.length) appendix.push({ title, head: ["#", headWord, "Result", "Time (s)"], rows: it.map((x, i) => [String(i + 1), clean(x.s), x.ok ? "Matching answer" : "Other answer", t(x.ms)]) });
  };
  choice("Rhyme game", "rhyme", "Spoken word");
  choice("First-sound game", "firstSound", "Spoken word");
  const wc = list("wordCheck");
  if (wc.length) appendix.push({ title: "Word check", head: ["#", "Word", "Type", "Response", "Time (s)"], rows: wc.map((x, i) => [String(i + 1), clean(x.w), x.real ? "Real" : "Made-up", x.ok ? "Correct" : x.real ? "Called made-up" : "Called real", t(x.ms)]) });
  choice("Spelling game", "spelling", "Spoken word");
  const sp = list("soundSpan");
  if (sp.length) appendix.push({ title: "Sound-order game", head: ["Attempt", "Sequence length", "Result"], rows: sp.map((x, i) => [String(i + 1), num(x.len) ? String(x.len) : "-", x.ok ? "Repeated correctly" : "Not repeated correctly"]) });
  const l = obs.letters;
  if (l && num(l.rounds) && l.rounds > 0) {
    const LT = ["b", "d", "p", "q"];
    const bl = (l.byLetter && typeof l.byLetter === "object" ? l.byLetter : {}) as Record<string, any>;
    const conf = (l.confusions && typeof l.confusions === "object" ? l.confusions : {}) as Record<string, any>;
    const g = (c: string, k: string) => (num(bl[c]?.[k]) ? String(bl[c][k]) : "-");
    appendix.push({ title: "Letter game: by target letter", head: ["Target", "Found (of 4)", "Missed", "Look-alike taps"], rows: LT.map((c) => [c, g(c, "hit"), g(c, "miss"), g(c, "fa")]) });
    appendix.push({ title: "Letter game: which look-alike was tapped", head: ["Target \\ tapped", ...LT], rows: LT.map((a) => [a, ...LT.map((b) => (a === b ? "-" : String(num(conf[`${a}>${b}`]) ? conf[`${a}>${b}`] : 0)))]) });
  }

  const compare: string[] = [];
  const half = (label: string, key: string) => {
    const it = list(key);
    if (it.length < 6) return;
    const m = Math.floor(it.length / 2), a = it.slice(0, m), b = it.slice(m);
    const c = (z: any[]) => z.filter((x) => x.ok).length;
    compare.push(`${label}: ${c(a)} of ${a.length} matching answers in the first half, ${c(b)} of ${b.length} in the second half.`);
  };
  half("Rhyme game", "rhyme"); half("First-sound game", "firstSound"); half("Word check", "wordCheck"); half("Spelling game", "spelling");
  const w = obs.wordCheck;
  if (w && num(w.trials) && w.trials > 0) compare.push(`Word check: ${w.realCorrect} of ${w.realTotal} real words accepted, against ${w.madeUpCorrect} of ${w.madeUpTotal} made-up words rejected.`);
  const all = [...list("rhyme"), ...list("firstSound"), ...list("spelling"), ...list("wordCheck")].filter((x) => num(x.ms));
  const med = (z: any[]) => z.map((x) => x.ms).sort((p: number, q: number) => p - q)[Math.floor(z.length / 2)];
  const good = all.filter((x) => x.ok), bad = all.filter((x) => !x.ok);
  if (good.length >= 4 && bad.length >= 2) compare.push(`Median response time was ${t(med(good))} s for matching answers (${good.length} items) and ${t(med(bad))} s for other answers (${bad.length} items), pooled across the choice activities.`);

  const method = [
    { name: "Rhyme game", samples: "Hearing which of two spoken words ends with the same sound as a target word.", items: "12 scored, 1 practice", scoring: "One point per matching answer; median response time." },
    { name: "First-sound game", samples: "Hearing which of two spoken words starts with the same sound as a target word.", items: "12 scored, 1 practice", scoring: "One point per matching answer; median response time." },
    { name: "Letter game", samples: "Finding b, d, p or q among look-alike letters.", items: "4 boards of 12 tiles (16 matching, 32 look-alike)", scoring: "Found, missed and look-alike taps; which letter was tapped instead." },
    { name: "Sound-order game", samples: "Repeating the nonsense syllables bah, dee, moe, koo in order, 2 to 5 in a row.", items: "Up to 8 scored, 1 practice", scoring: "Longest sequence repeated; stops after two misses at one length." },
    { name: "Word check (age 7+)", samples: "Telling real words from made-up words; made-up words can only be told apart by sounding them out.", items: "12 scored, 2 practice", scoring: "Real words accepted, made-up words rejected; median response time." },
    { name: "Spelling game", samples: "Choosing the correct spelling of a spoken word when the other option sounds the same.", items: "8 scored, 1 practice", scoring: "One point per correct spelling." },
  ];
  return { method, compare, appendix };
}

export async function POST(req: Request) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }
  const quest = ["dyslexia", "adhd", "autism"].includes(body?.quest) ? body.quest : "dyslexia";
  const nick = String(body?.nickname || "Explorer").replace(/[^\p{L}\p{N} ]/gu, "").slice(0, 20) || "Explorer";
  const obs: Obs = body?.observations && typeof body.observations === "object" ? body.observations : {};
  const fallback = template(quest, nick, obs);
  const ageNum = Number(body?.age);
  const age = Number.isFinite(ageNum) && ageNum >= 4 && ageNum <= 16 ? Math.round(ageNum) : null;
  const rows = quest === "dyslexia" ? dyslexiaRows(obs, age) : undefined;
  const detail: Obs = body?.detail && typeof body.detail === "object" && JSON.stringify(body.detail).length < 9000 ? body.detail : {};
  const extra = quest === "dyslexia" ? dyslexiaExtra(obs, detail) : undefined;
  const send = (o: Out) => NextResponse.json(rows ? { ...o, rows, extra } : o);
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || JSON.stringify(obs).length > 6000) return send(fallback);
  try {
    return send(await runKeeperGraph({ quest, nick, obs, fallback, apiKey: key }));
  } catch {
    return send(fallback);
  }
}
