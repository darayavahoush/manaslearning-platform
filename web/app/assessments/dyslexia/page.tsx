"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import KeeperFeedback from "../../../components/assessments/KeeperFeedback";

// The Whispering Library: a screening-style play session inspired by rhyme judgment,
// initial-sound matching, letter-orientation discrimination, sound-sequence span and
// spelling choice tasks. Not a diagnosis. Nothing is stored.

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const median = (a: number[]) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return Math.round(s[Math.floor(s.length / 2)]); };
const hasTTS = () => typeof window !== "undefined" && "speechSynthesis" in window;

function speak(text: string, vol: number): Promise<void> {
  return new Promise((res) => {
    if (!hasTTS()) return res();
    const s = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(text);
    const v = s.getVoices();
    u.voice = v.find((x) => x.lang.startsWith("en-IN")) || v.find((x) => x.lang.startsWith("en")) || null;
    u.lang = u.voice?.lang || "en-IN"; u.rate = 0.85; u.volume = vol;
    const t = setTimeout(res, 4000);
    u.onend = u.onerror = () => { clearTimeout(t); res(); };
    s.speak(u);
  });
}

type Item = { say: string; a: string; b: string; ok: 0 | 1; practice?: boolean };
// Items are written with the correct answer first, then placed by a fixed A/B pattern below.
// Fixed positions keep every session comparable. Each pattern has no more than two
// correct answers in a row on the same side.
const mk = (say: string, good: string, bad: string, practice = false): Item => ({ say, a: good, b: bad, ok: 0, practice });
const place = (items: Item[], pat: string): Item[] => items.map((it, i) => (pat[i] === "B" ? { ...it, a: it.b, b: it.a, ok: 1 as const } : it));
const POS = { rhyme: "ABABBAABA", first: "BABAABBAB", spell: "AABABA" };
const RHYME = () => [mk("cat", "hat", "cap", true), mk("moon", "spoon", "mop"), mk("bell", "shell", "bed"), mk("light", "kite", "lamp"), mk("frog", "log", "fish"), mk("rain", "train", "rail"), mk("sock", "clock", "sack"), mk("bee", "tree", "bed"), mk("star", "car", "stone")];
const FIRST = () => [mk("sun", "sock", "ball", true), mk("dog", "door", "fish"), mk("map", "milk", "pen"), mk("fish", "fan", "cup"), mk("pig", "pan", "bus"), mk("tree", "train", "sheep"), mk("moon", "mouse", "spoon"), mk("cow", "cup", "duck"), mk("hat", "hand", "sock")];
const SPELL = () => [mk("rain", "rain", "rane", true), mk("night", "night", "nite"), mk("boat", "boat", "bote"), mk("cake", "cake", "caik"), mk("sheep", "sheep", "sheap"), mk("light", "light", "lite")];

const CHAPTERS = [
  { id: "rhyme", name: "Echo Cave", say: "Listen to the echo. Then tap the stone that rhymes with it.", hint: "Listen, then tap the stone that sounds like the echo's end." },
  { id: "first", name: "Sound Stones", say: "Listen to the word. Tap the stone that starts with the same sound.", hint: "Tap the stone whose word starts the same way." },
  { id: "letters", name: "Mirror Moths", say: "Find every letter that looks exactly like the lantern letter.", hint: "Tap every letter facing the same way as the lantern letter." },
  { id: "span", name: "Echo Steps", say: "Listen to the stones sing. Then sing them back in the same order.", hint: "Watch and listen, then tap the stones in the same order." },
  { id: "spell", name: "Spell Stones", say: "Listen to the word. Tap the way it is spelled. You can skip this one.", hint: "For readers: tap the spelling that looks right. Skipping is fine." },
] as const;
const KEY: Record<string, string> = { rhyme: "rhyme", first: "firstSound", letters: "letters", span: "soundSpan", spell: "spelling" };
const PIP = ["Lovely listening!", "The lanterns are glowing.", "You are doing great.", "Keep going, explorer!", "Pip is cheering!", "One more ink drop."];

function Owl({ line }: { line: string }) {
  return (
    <div className="dq-owl" aria-live="polite">
      <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true"><path d="M14 18l8 8M58 18l-8 8" stroke="#8a5a2b" strokeWidth="5" strokeLinecap="round" /><ellipse cx="36" cy="40" rx="26" ry="27" fill="#a8743a" /><circle cx="25" cy="34" r="10" fill="#fff6dc" /><circle cx="47" cy="34" r="10" fill="#fff6dc" /><circle cx="26" cy="35" r="4.5" fill="#2b1d05" /><circle cx="46" cy="35" r="4.5" fill="#2b1d05" /><path d="M32 42h8l-4 8z" fill="#e8a33d" /></svg>
      <span>{line}</span>
    </div>
  );
}

function Stone({ lit, color, onClick, label, children, disabled }: { lit?: boolean; color: string; onClick?: () => void; label: string; children?: React.ReactNode; disabled?: boolean }) {
  return <button className={"dq-stone" + (lit ? " lit" : "")} style={{ background: color }} onClick={onClick} aria-label={label} disabled={disabled}>{children}</button>;
}
const Speaker = () => <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="#2b1d05" /><path d="M16 8a5 5 0 010 8M18.5 5.5a9 9 0 010 13" stroke="#2b1d05" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>;

function AudioChoice({ items, mode, vol, onInk, onDone }: { items: Item[]; mode: "listen" | "spell"; vol: number; onInk: () => void; onDone: (s: any) => void }) {
  const [i, setI] = useState(0);
  const [ready, setReady] = useState(false);
  const [lit, setLit] = useState("");
  const [picked, setPicked] = useState<number | null>(null);
  const t0 = useRef(0), replays = useRef(0), tok = useRef(0);
  const log = useRef<{ ok: boolean; rt: number }[]>([]);
  const item = items[i];

  const play = useCallback(async () => {
    const me = ++tok.current; const alive = () => me === tok.current;
    setReady(false); setLit("p");
    await speak(item.say, vol); if (!alive()) return;
    if (mode === "listen") {
      await sleep(350); if (!alive()) return; setLit("a"); await speak(item.a, vol); if (!alive()) return;
      await sleep(250); if (!alive()) return; setLit("b"); await speak(item.b, vol); if (!alive()) return;
    }
    setLit(""); t0.current = performance.now(); setReady(true);
  }, [item, mode, vol]);

  useEffect(() => {
    setPicked(null);
    const id = setTimeout(play, 500);
    return () => { clearTimeout(id); tok.current++; if (hasTTS()) window.speechSynthesis.cancel(); };
  }, [play]);

  const pick = (n: number) => {
    if (!ready || picked !== null) return;
    if (!item.practice) log.current.push({ ok: n === item.ok, rt: performance.now() - t0.current });
    setPicked(n); onInk();
    setTimeout(() => {
      if (i + 1 < items.length) setI(i + 1);
      else onDone({ trials: log.current.length, correct: log.current.filter((x) => x.ok).length, medianMs: median(log.current.map((x) => x.rt)), medianSec: Math.round(median(log.current.map((x) => x.rt)) / 100) / 10, replays: replays.current });
    }, 1000);
  };
  const words = [item.a, item.b];
  return (
    <div className="dq-center">
      {item.practice && <p className="dq-tag">Practice round: nothing counts yet</p>}
      <Stone color="#f3d27a" label="Hear the word again" onClick={() => { replays.current++; play(); }} lit={lit === "p"}><Speaker /></Stone>
      <div className="dq-row">
        {[0, 1].map((n) => (
          <Stone key={n} color={n ? "#7fd1c7" : "#f2a36b"} lit={lit === (n ? "b" : "a")} disabled={!ready || picked !== null} label={mode === "spell" ? words[n] : `Stone ${n + 1}`} onClick={() => pick(n)}>
            {mode === "spell" ? <span className="dq-word">{words[n]}</span> : <Speaker />}
            {picked === n && !item.practice && <span className="dq-ring" />}
            {item.practice && picked !== null && n === item.ok && <span className="dq-ring" />}
          </Stone>
        ))}
      </div>
      <p className="dq-small">{ready ? "Your turn" : "Listening..."}</p>
    </div>
  );
}

const LET = ["b", "d", "p", "q"];
// Fixed boards: 4 matching tiles and 8 look-alikes each (4 mirror, 2 + 2 other).
const LAYOUT: Record<string, string[]> = {
  b: ["d", "b", "p", "b", "d", "q", "d", "b", "p", "d", "q", "b"],
  d: ["b", "d", "q", "d", "b", "p", "b", "d", "q", "b", "p", "d"],
  p: ["q", "p", "d", "p", "q", "b", "q", "p", "d", "q", "b", "p"],
  q: ["p", "q", "b", "q", "p", "d", "p", "q", "b", "p", "d", "q"],
};
function Letters({ vol, onInk, onDone }: { vol: number; onInk: () => void; onDone: (s: any) => void }) {
  const [r, setR] = useState(0);
  const [sel, setSel] = useState<number[]>([]);
  const st = useRef({ rounds: 0, hits: 0, falseTaps: 0, missed: 0, possibleHits: 0, possibleDistractors: 0, confusions: {} as Record<string, number> });
  const target = LET[r];
  const tiles = useMemo(() => LAYOUT[target], [target]);
  useEffect(() => { setSel([]); const id = setTimeout(() => speak("Find every letter that looks exactly like this one.", vol), 400); return () => { clearTimeout(id); if (hasTTS()) window.speechSynthesis.cancel(); }; }, [r, vol]);
  const done = () => {
    const s = st.current; s.rounds++; s.possibleHits += tiles.filter((t) => t === target).length; s.possibleDistractors += tiles.filter((t) => t !== target).length;
    tiles.forEach((t, k) => { const on = sel.includes(k); if (t === target) on ? s.hits++ : s.missed++; else if (on) { s.falseTaps++; const key = `${target}>${t}`; s.confusions[key] = (s.confusions[key] || 0) + 1; } });
    onInk();
    if (r + 1 < LET.length) setR(r + 1); else onDone(s);
  };
  return (
    <div className="dq-center">
      <div className="dq-lantern" aria-label={`Lantern letter ${target}`}>{target}</div>
      <div className="dq-grid">
        {tiles.map((t, k) => (
          <button key={k} className={"dq-tile" + (sel.includes(k) ? " on" : "")} aria-pressed={sel.includes(k)} onClick={() => setSel(sel.includes(k) ? sel.filter((x) => x !== k) : [...sel, k])}>{t}</button>
        ))}
      </div>
      <button className="dq-btn" onClick={done}>Done</button>
    </div>
  );
}

const SYL = ["bah", "dee", "moe", "koo"], COL = ["#f2a36b", "#7fd1c7", "#c9a7ee", "#f3d27a"];
const SEQS: Record<number, number[][]> = { 2: [[0, 2], [3, 1]], 3: [[1, 3, 0], [2, 0, 3]], 4: [[3, 0, 2, 1], [1, 2, 0, 3]], 5: [[2, 0, 3, 1, 2], [1, 3, 2, 0, 3]] };
const TRIALS = [{ len: 1, seq: [2], practice: true }, ...[2, 3, 4, 5].flatMap((len) => SEQS[len].map((seq) => ({ len, seq })))] as { len: number; seq: number[]; practice?: boolean }[];
function Span({ vol, onInk, onDone }: { vol: number; onInk: () => void; onDone: (s: any) => void }) {
  const [t, setT] = useState(0);
  const [seq, setSeq] = useState<number[]>([]);
  const [inp, setInp] = useState<number[]>([]);
  const [lit, setLit] = useState(-1);
  const [ready, setReady] = useState(false);
  const tok = useRef(0), longest = useRef(0), attempts = useRef(0), passed = useRef(0), failsAtLen = useRef(0);
  useEffect(() => {
    const me = ++tok.current; const s = TRIALS[t].seq;
    setSeq(s); setInp([]); setReady(false);
    (async () => { await sleep(700); for (const n of s) { if (me !== tok.current) return; setLit(n); await speak(SYL[n], vol); setLit(-1); await sleep(250); } if (me === tok.current) setReady(true); })();
    return () => { tok.current++; if (hasTTS()) window.speechSynthesis.cancel(); };
  }, [t, vol]);
  const finish = () => onDone({ attempts: attempts.current, passed: passed.current, longest: longest.current });
  const tap = (n: number) => {
    if (!ready) return; speak(SYL[n], vol);
    const next = [...inp, n]; setInp(next);
    if (next.length < seq.length) return;
    setReady(false); onInk();
    const ok = next.every((x, k) => x === seq[k]); const tr = TRIALS[t];
    if (!tr.practice) { attempts.current++; if (ok) { longest.current = Math.max(longest.current, tr.len); passed.current++; failsAtLen.current = 0; } else failsAtLen.current++; }
    const nextT = t + 1; const lastOfLen = !TRIALS[nextT] || TRIALS[nextT].len !== tr.len;
    setTimeout(() => { if (!TRIALS[nextT] || (failsAtLen.current >= 2 && lastOfLen)) finish(); else { if (lastOfLen) failsAtLen.current = 0; setT(nextT); } }, 900);
  };
  return (
    <div className="dq-center">
      {TRIALS[t].practice && <p className="dq-tag">Practice round: nothing counts yet</p>}
      <div className="dq-row">{SYL.map((_, n) => <Stone key={n} color={COL[n]} lit={lit === n} disabled={!ready} label={`Singing stone ${n + 1}`} onClick={() => tap(n)} />)}</div>
      <p className="dq-small">{ready ? "Your turn: sing them back" : "Listening..."}</p>
    </div>
  );
}

function __McInner() {
  const [stage, setStage] = useState<"welcome" | "sound" | "intro" | "play" | "end">("welcome");
  const [ch, setCh] = useState(0);
  const [nick, setNick] = useState("");
  const [parent, setParent] = useState(false);
  const [vol, setVol] = useState(0.8);
  const [ink, setInk] = useState(0);
  const [line, setLine] = useState("Hello! I am Pip, the Story-Keeper.");
  const [heard, setHeard] = useState<boolean | null>(null);
  const [obs, setObs] = useState<Record<string, any>>({ completed: [] });
  const [sets] = useState(() => ({ rhyme: place(RHYME(), POS.rhyme), first: place(FIRST(), POS.first), spell: place(SPELL(), POS.spell) }));
  const [tested, setTested] = useState(false);
  const tts = typeof window !== "undefined" && hasTTS();

  const addInk = () => { setInk((n) => n + 1); setLine(PIP[Math.floor(Math.random() * PIP.length)]); };
  const done = (id: string) => (s: any) => { setObs((o) => ({ ...o, [KEY[id]]: s, completed: [...o.completed, id] })); next(); };
  const next = () => { if (ch + 1 < CHAPTERS.length) { setCh(ch + 1); setStage("intro"); } else setStage("end"); };
  useEffect(() => { if (stage === "intro") { const id = setTimeout(() => speak(CHAPTERS[ch].say, vol), 300); return () => { clearTimeout(id); if (hasTTS()) window.speechSynthesis.cancel(); }; } }, [stage, ch, vol]);

  const c = CHAPTERS[ch];
  return (
    <main className="dq">
      <style>{CSS}</style>
      <header className="dq-head">
        <h1>The Whispering Library</h1>
        {stage !== "welcome" && (
          <div className="dq-lamps" aria-label={`Chapter ${Math.min(ch + 1, 5)} of 5, ${ink} ink drops`}>
            {CHAPTERS.map((_, k) => <span key={k} className={"dq-lamp" + (k < (stage === "end" ? 5 : ch) ? " on" : "")} />)}
            <span className="dq-ink">{ink} ink</span>
          </div>
        )}
      </header>

      {stage === "welcome" && (
        <section className="dq-center">
          <Owl line={line} />
          <p>Pick a nickname for your explorer. Use headphones in a quiet room. This is a listening game, so sound needs to be on.</p>
          <label>Nickname<br /><input className="dq-input" maxLength={16} value={nick} onChange={(e) => setNick(e.target.value)} /></label>
          <label>Volume<br /><input type="range" min="0.2" max="1" step="0.1" value={vol} onChange={(e) => setVol(Number(e.target.value))} /></label>
          <label className="dq-check"><input type="checkbox" checked={parent} onChange={(e) => setParent(e.target.checked)} /> I am this child's parent or guardian and I agree to the notes below.</label>
          <p className="dq-small">This is a play activity, not a diagnosis. We do not save anything from this session. At the end, only the nickname and play counts are sent to write the summary, and an AI model may help word it.</p>
          <button className="dq-btn" disabled={!parent || !nick.trim()} onClick={() => setStage("sound")}>Next</button>
        </section>
      )}

      {stage === "sound" && (
        <section className="dq-center">
          <Owl line="Can you hear me?" />
          {!tts && <p role="alert">This browser cannot play spoken words. Please open this page in Chrome, Safari or Edge.</p>}
          <Stone color="#f3d27a" label="Play a test word" onClick={() => { speak("moon", vol); setTested(true); setHeard(null); }}><Speaker /></Stone>
          {tested && (
            <div className="dq-row">
              <button className="dq-btn" onClick={() => setStage("intro")}>I heard "moon"</button>
              <button className="dq-btn ghost" onClick={() => setHeard(false)}>No sound</button>
            </div>
          )}
          {(!tested || heard === false) && <p className="dq-small">Tip: turn up the volume, unmute the device, try headphones, then press the lantern again.</p>}
        </section>
      )}

      {stage === "intro" && (
        <section className="dq-center">
          <Owl line={`Chapter ${ch + 1}: ${c.name}`} />
          <p>{c.hint}</p>
          <div className="dq-row">
            <button className="dq-btn" onClick={() => setStage("play")}>Start</button>
            {c.id === "spell" && <button className="dq-btn ghost" onClick={() => setStage("end")}>Skip</button>}
            <button className="dq-btn ghost" onClick={() => speak(c.say, vol)}>Hear it again</button>
          </div>
        </section>
      )}

      {stage === "play" && (
        <>
          <Owl line={line} />
          {c.id === "rhyme" && <AudioChoice key="r" items={sets.rhyme} mode="listen" vol={vol} onInk={addInk} onDone={done("rhyme")} />}
          {c.id === "first" && <AudioChoice key="f" items={sets.first} mode="listen" vol={vol} onInk={addInk} onDone={done("first")} />}
          {c.id === "letters" && <Letters vol={vol} onInk={addInk} onDone={done("letters")} />}
          {c.id === "span" && <Span vol={vol} onInk={addInk} onDone={done("span")} />}
          {c.id === "spell" && <AudioChoice key="s" items={sets.spell} mode="spell" vol={vol} onInk={addInk} onDone={done("spell")} />}
          <button className="dq-btn ghost dq-rest" onClick={() => setStage("end")}>Take a rest and finish</button>
        </>
      )}

      {stage === "end" && (
        <section>
          <KeeperFeedback quest="dyslexia" nickname={nick.trim() || "Explorer"} observations={obs} />
        </section>
      )}
    </main>
  );
}

const CSS = `
.dq{min-height:100vh;padding:20px 16px 60px;background:radial-gradient(circle at 50% 0,#3b2a5c,#1b1330 70%);color:#f6e7bd;font-family:Verdana,system-ui,sans-serif;line-height:1.7;letter-spacing:.03em}
.dq h1{font-size:22px;margin:0;text-align:center}
.dq-head{display:flex;flex-direction:column;align-items:center;gap:8px;margin-bottom:16px}
.dq-lamps{display:flex;align-items:center;gap:8px}
.dq-lamp{width:18px;height:18px;border-radius:50%;border:2px solid #d9b45a}
.dq-lamp.on{background:#ffd76a;box-shadow:0 0 10px #ffd76a}
.dq-ink{margin-left:8px;font-size:14px}
.dq-center{display:flex;flex-direction:column;align-items:center;gap:16px;max-width:560px;margin:0 auto;text-align:center}
.dq-row{display:flex;gap:20px;flex-wrap:wrap;justify-content:center}
.dq-owl{display:flex;align-items:center;gap:12px;max-width:560px;margin:0 auto 12px;background:rgba(255,255,255,.08);border-radius:20px;padding:8px 16px}
.dq-stone{position:relative;width:104px;height:104px;border-radius:50%;border:3px solid #fff3;cursor:pointer;display:grid;place-items:center;transition:transform .2s}
.dq-stone:disabled{opacity:.55;cursor:default}
.dq-stone:focus-visible,.dq-btn:focus-visible,.dq-tile:focus-visible,.dq-input:focus-visible{outline:4px solid #fff;outline-offset:3px}
.dq-stone.lit{transform:scale(1.12);box-shadow:0 0 28px #ffe9a0}
.dq-ring{position:absolute;inset:-8px;border-radius:50%;border:4px solid #ffd76a}
.dq-word{color:#2b1d05;font-size:22px;font-weight:700}
.dq-lantern{font-size:84px;width:120px;height:120px;display:grid;place-items:center;border-radius:24px;background:#ffd76a;color:#2b1d05;font-weight:700}
.dq-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.dq-tile{width:68px;height:68px;font-size:40px;font-family:Verdana,sans-serif;border-radius:16px;border:3px solid #d9b45a;background:#2a1f45;color:#f6e7bd;cursor:pointer}
.dq-tile.on{background:#d9b45a;color:#2b1d05}
.dq-btn{min-height:48px;padding:10px 24px;border-radius:999px;border:0;background:#ffd76a;color:#2b1d05;font-size:18px;font-weight:700;cursor:pointer}
.dq-btn.ghost{background:transparent;border:2px solid #d9b45a;color:#f6e7bd}
.dq-btn:disabled{opacity:.5;cursor:default}
.dq-rest{display:block;margin:28px auto 0}
.dq-input{min-height:48px;font-size:18px;padding:8px 14px;border-radius:12px;border:2px solid #d9b45a;background:#fff8e6;color:#2b1d05}
.dq-check{text-align:left;font-size:15px}
.dq-small{font-size:14px;opacity:.85}
.dq-tag{background:#fff2;border-radius:999px;padding:2px 14px;font-size:14px;margin:0}
@keyframes dq-float{50%{transform:translateY(-4px)}}
.dq-owl svg{animation:dq-float 3s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.dq *{animation:none!important;transition:none!important}}
`;

// --- mount gate: this quest uses random/time values, so it renders in the browser only ---
import { useState as __mcUseState, useEffect as __mcUseEffect } from "react";
export default function __McGate(props: any) {
  const [mounted, setMounted] = __mcUseState(false);
  __mcUseEffect(() => { setMounted(true); }, []);
  return mounted ? <__McInner {...props} /> : null;
}
