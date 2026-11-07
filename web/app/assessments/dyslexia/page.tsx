/* eslint-disable */
"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ParentCard, { type ParentAnswers } from "../../../components/assessments/ParentCard";
import EndReport from "../../../components/assessments/report/EndReport";
import SessionRecordDownload from "../../../components/assessments/SessionRecordDownload";
import { captureEnvironment, type SessionRecord } from "../../../components/assessments/session-record";
import { usePlayEvents } from "../../../components/assessments/play-events";
import { AmbientToggle } from "../../../components/assessments/QuestFX";

// Original quiet sound effects normalized to comfortable quiet listening
function playAudio(type: 'hit' | 'chime' | 'miss' | 'tap' | 'complete') {
  if (typeof window === 'undefined') return;
  try {
    const audioMap: Record<string, string> = {
      hit: '/quests/dyslexia/audio/correct.mp3',
      chime: '/quests/dyslexia/audio/correct.mp3',
      tap: '/quests/dyslexia/audio/tap.mp3',
      miss: '/quests/dyslexia/audio/try_again.mp3',
      complete: '/quests/dyslexia/audio/complete.mp3',
    };
    const src = audioMap[type];
    if (src) {
      const snd = new Audio(src);
      snd.volume = 0.2;
      snd.play().catch(() => {});
    }
  } catch {}
}

// The Whispering Library: a screening-style play session inspired by rhyme judgment,
// initial-sound matching, letter-orientation discrimination, sound-sequence span and
// spelling choice tasks. Not a diagnosis. Nothing is stored: at the end the counts are sent once to build the report, and the page keeps no copy.

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const median = (a: number[]) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return Math.round(s[Math.floor(s.length / 2)]); };
const hasTTS = () => typeof window !== "undefined" && "speechSynthesis" in window;

let lastVoice = "";
const voiceLabel = () => lastVoice;

function speak(text: string, vol: number): Promise<void> {
  return new Promise((res) => {
    if (!hasTTS()) return res();
    const s = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(text);
    const v = s.getVoices();
    u.voice = v.find((x) => x.lang.startsWith("en-IN")) || v.find((x) => x.lang.startsWith("en")) || null;
    if (u.voice) lastVoice = `${u.voice.name} (${u.voice.lang})`.slice(0, 60);
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
const POS = { rhyme: "ABABBAABABAAB", first: "BABAABBABABBA", spell: "ABABAABBA" };
const RHYME = () => [mk("cat", "hat", "cap", true), mk("moon", "spoon", "mop"), mk("bell", "shell", "bed"), mk("light", "kite", "lamp"), mk("frog", "log", "fish"), mk("rain", "train", "rail"), mk("sock", "clock", "sack"), mk("bee", "tree", "bed"), mk("star", "car", "stone"), mk("pen", "hen", "pan"), mk("bat", "mat", "bag"), mk("nest", "vest", "net"), mk("ring", "king", "rug")];
const FIRST = () => [mk("sun", "sock", "ball", true), mk("dog", "door", "fish"), mk("map", "milk", "pen"), mk("fish", "fan", "cup"), mk("pig", "pan", "bus"), mk("tree", "train", "sheep"), mk("moon", "mouse", "spoon"), mk("cow", "cup", "duck"), mk("hat", "hand", "sock"), mk("bus", "ball", "cup"), mk("gate", "goat", "boat"), mk("ship", "sheep", "sock"), mk("lamp", "leaf", "nest")];
const SPELL = () => [mk("rain", "rain", "rane", true), mk("night", "night", "nite"), mk("boat", "boat", "bote"), mk("cake", "cake", "caik"), mk("sheep", "sheep", "sheap"), mk("light", "light", "lite"), mk("train", "train", "trane"), mk("knife", "knife", "nife"), mk("dream", "dream", "dreem")];

const CHAPTERS = [
  { id: "rhyme", name: "Echo Cave", say: "Listen to the echo. Then tap the stone that rhymes with it.", hint: "Listen, then tap the stone that sounds like the echo's end.", plain: { name: "Rhyme judgement", hint: "You will hear a word, then two options. Choose the option that rhymes with the word.", measures: "Whether the child can tell which of two spoken words ends with the same sound as a target word.", items: "12 scored, plus 1 practice", mins: "About 4 minutes" } },
  { id: "first", name: "Sound Stones", say: "Listen to the word. Tap the stone that starts with the same sound.", hint: "Tap the stone whose word starts the same way.", plain: { name: "Initial sounds", hint: "You will hear a word, then two options. Choose the option that starts with the same sound.", measures: "Whether the child can tell which of two spoken words begins with the same sound as a target word.", items: "12 scored, plus 1 practice", mins: "About 4 minutes" } },
  { id: "letters", name: "Mirror Moths", say: "Find every letter that looks exactly like the lantern letter.", hint: "Tap every letter facing the same way as the lantern letter.", plain: { name: "Letter orientation", hint: "Find every letter that faces the same way as the target letter.", measures: "Picking out one letter among look-alikes (b, d, p, q), the shapes most often confused.", items: "4 boards of 12 tiles", mins: "About 3 minutes" } },
  { id: "span", name: "Echo Steps", say: "Listen to the stones sing. Then sing them back in the same order.", hint: "Watch and listen, then tap the stones in the same order.", plain: { name: "Sound sequence", hint: "Listen to the sounds, then tap the numbered tiles in the same order.", measures: "Holding nonsense syllables in order and repeating them back, from 2 up to 5 in a row.", items: "Up to 8 scored sequences, plus 1 practice", mins: "About 4 minutes" } },
  { id: "words", name: "Lantern Words", say: "Some of these are real words. Some are made up. Tap real word or made-up word.", hint: "Read each word. Is it a real word, or one that was made up? You can skip this one.", plain: { name: "Word check", hint: "Decide whether each word on screen is a real word or a made-up word. Be quick, but try to be right. You can skip this part.", measures: "Telling real words from made-up words, which can only be done by sounding the word out.", items: "12 scored, plus 2 practice", mins: "About 3 minutes" } },
  { id: "spell", name: "Spell Stones", say: "Listen to the word. Tap the way it is spelled. You can skip this one.", hint: "For readers: tap the spelling that looks right. Skipping is fine.", plain: { name: "Spelling", hint: "Listen to the word, then choose the correct spelling. You can skip this part.", measures: "Choosing the correct spelling of a spoken word when the other option sounds the same.", items: "8 scored, plus 1 practice", mins: "About 3 minutes" } },
] as const;
const ROMAN = ["I", "II", "III", "IV", "V", "VI"];
const KEY: Record<string, string> = { rhyme: "rhyme", first: "firstSound", letters: "letters", span: "soundSpan", spell: "spelling", words: "wordCheck" };
const PIP = ["Lovely listening!", "The lanterns are glowing.", "You are doing great.", "Keep going, explorer!", "Pip is cheering!", "One more ink drop."];

function Owl({ line, pose = 'greeting' }: { line: string; pose?: 'greeting' | 'listening' | 'cheering' | 'resting' }) {
  const map: Record<string, string> = {
    greeting: '/quests/dyslexia/pip_greeting.webp',
    listening: '/quests/dyslexia/pip_listening.webp',
    cheering: '/quests/dyslexia/pip_cheering.webp',
    resting: '/quests/dyslexia/pip_resting.webp',
  };
  const src = map[pose] || '/quests/dyslexia/pip_greeting.webp';
  return (
    <div className="dq-owl" aria-live="polite">
      <img
        src={src}
        alt="Pip the Owl"
        width={72}
        height={72}
        className="w-16 h-16 object-contain pointer-events-none drop-shadow-sm select-none shrink-0"
      />
      <span className="text-sm font-medium text-amber-100">{line}</span>
    </div>
  );
}

function Stone({ lit, color, onClick, onDown, label, children, disabled }: { lit?: boolean; color: string; onClick?: () => void; onDown?: (t: number) => void; label: string; children?: React.ReactNode; disabled?: boolean }) {
  return <button className={"dq-stone" + (lit ? " lit" : "")} style={{ background: color }} onClick={onClick} onPointerDown={(e) => onDown?.(e.timeStamp)} aria-label={label} disabled={disabled}>{children}</button>;
}
const Speaker = () => <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" /><path d="M16 8a5 5 0 010 8M18.5 5.5a9 9 0 010 13" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>;

function AudioChoice({ items, mode, vol, focus, onInk, onDone }: { items: Item[]; mode: "listen" | "spell"; vol: number; focus: boolean; onInk: () => void; onDone: (s: any) => void }) {
  const [i, setI] = useState(0);
  const [ready, setReady] = useState(false);
  const [lit, setLit] = useState("");
  const [picked, setPicked] = useState<number | null>(null);
  const t0 = useRef(0), down = useRef(0), replays = useRef(0), tok = useRef(0);
  const log = useRef<{ s: string; ok: boolean; rt: number }[]>([]);
  const item = items[i];

  const play = useCallback(async () => {
    const me = ++tok.current; const alive = () => me === tok.current;
    setReady(false); setLit("p");
    await speak(item.say, vol); if (!alive()) return;
    if (mode === "listen") {
      await sleep(350); if (!alive()) return; setLit("a"); await speak(item.a, vol); if (!alive()) return;
      await sleep(250); if (!alive()) return; setLit("b"); await speak(item.b, vol); if (!alive()) return;
    }
    setLit(""); t0.current = 0; down.current = 0; setReady(true);
    // start the clock after the options have been drawn, not before
    requestAnimationFrame(() => requestAnimationFrame(() => { t0.current = performance.now(); }));
  }, [item, mode, vol]);

  useEffect(() => {
    setPicked(null);
    const id = setTimeout(play, 500);
    return () => { clearTimeout(id); tok.current++; if (hasTTS()) window.speechSynthesis.cancel(); };
  }, [play]);

  const pick = (n: number) => {
    if (!ready || picked !== null || !t0.current) return;
    const isHit = n === item.ok;
    playAudio(isHit ? 'hit' : 'miss');
    if (!item.practice) log.current.push({ s: item.say, ok: isHit, rt: Math.max(0, (down.current > t0.current ? down.current : performance.now()) - t0.current) });
    setPicked(n); onInk();
    if (item.practice) speak(isHit ? "Yes! Great listening!" : "Good try! This one was right.", vol); // PRACTICE-V2
    setTimeout(() => {
      if (i + 1 < items.length) setI(i + 1);
      else onDone({ trials: log.current.length, correct: log.current.filter((x) => x.ok).length, medianMs: median(log.current.map((x) => x.rt)), medianSec: Math.round(median(log.current.map((x) => x.rt)) / 100) / 10, replays: replays.current, items: log.current.map((x) => ({ s: x.s, ok: x.ok ? 1 : 0, ms: Math.round(x.rt) })) });
    }, item.practice ? 2400 : 1000);
  };
  const words = [item.a, item.b];
  return (
    <div className="dq-center">
      {item.practice && <p className="dq-tag">Practice round: nothing counts yet</p>}
      <Stone color="#f3d27a" label="Hear the word again" onClick={() => { playAudio('tap'); replays.current++; play(); }} lit={lit === "p"}><Speaker /></Stone>
      <div className="dq-row">
        {[0, 1].map((n) => (
          <Stone key={n} color="#fff8e6" lit={lit === (n ? "b" : "a")} disabled={!ready || picked !== null} label={mode === "spell" ? words[n] : `${focus ? "Option" : "Book plate"} ${n + 1}`} onDown={(t) => { down.current = t; }} onClick={() => pick(n)}>
            {mode === "spell" ? <span className="dq-word">{words[n]}</span> : focus ? <span className="dq-word">{n + 1}</span> : <Speaker />}
            {picked === n && !item.practice && <span className="dq-ring" />}
            {item.practice && picked !== null && n === item.ok && <span className="dq-ring" />}
          </Stone>
        ))}
      </div>
      <p className="dq-small">{item.practice && picked !== null ? (picked === item.ok ? "Yes! Great listening!" : "Good try! The glowing one was right.") : ready ? "Your turn" : "Listening..."}</p>
    </div>
  );
}

const LET = ["b", "d", "p", "q"];
// Two practice boards (not recorded): first an easy one, then one with look-alike letters.
const PRACTICE_BOARDS = [
  { target: "b", tiles: ["b", "o", "o", "b"] },
  { target: "d", tiles: ["d", "b", "d", "p", "b", "q"] },
];
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
  const [pp, setPp] = useState(0);
  const [pfb, setPfb] = useState({ msg: "", lock: false, tries: 0 });
  const st = useRef({ rounds: 0, hits: 0, falseTaps: 0, missed: 0, possibleHits: 0, possibleDistractors: 0, confusions: {} as Record<string, number>, byLetter: {} as Record<string, { hit: number; miss: number; fa: number }> });
  const target = LET[r];
  const pb = PRACTICE_BOARDS[pp];
  const checkPractice = () => {
    if (!pb || pfb.lock) return;
    const want = pb.tiles.map((t, k) => (t === pb.target ? k : -1)).filter((k) => k >= 0);
    const ok = want.length === sel.length && want.every((k) => sel.includes(k));
    if (ok) {
      speak("Great looking!", vol);
      setPfb({ msg: "Great looking!", lock: true, tries: 0 });
      setTimeout(() => { setPfb({ msg: "", lock: false, tries: 0 }); setPp(pp + 1); }, 1800);
    } else if (pfb.tries >= 1) {
      speak("These ones face the same way.", vol);
      setSel(want);
      setPfb({ msg: "These ones face the same way.", lock: true, tries: pfb.tries + 1 });
      setTimeout(() => { setPfb({ msg: "", lock: false, tries: 0 }); setPp(pp + 1); }, 2600);
    } else {
      speak("Nice try! Look again.", vol);
      setPfb({ msg: "Nice try! Look again at which way it faces.", lock: false, tries: pfb.tries + 1 });
    }
  };
  const tiles = useMemo(() => LAYOUT[target], [target]);
  useEffect(() => { setSel([]); const id = setTimeout(() => speak("Find every letter that looks exactly like this one.", vol), 400); return () => { clearTimeout(id); if (hasTTS()) window.speechSynthesis.cancel(); }; }, [r, vol, pp]);
  const done = () => {
    const s = st.current; s.rounds++; s.possibleHits += tiles.filter((t) => t === target).length; s.possibleDistractors += tiles.filter((t) => t !== target).length;
    tiles.forEach((t, k) => { const on = sel.includes(k); if (t === target) on ? s.hits++ : s.missed++; else if (on) { s.falseTaps++; const key = `${target}>${t}`; s.confusions[key] = (s.confusions[key] || 0) + 1; } });
    const bl = (s.byLetter[target] = s.byLetter[target] || { hit: 0, miss: 0, fa: 0 });
    tiles.forEach((t, k) => { const on = sel.includes(k); if (t === target) { if (on) bl.hit++; else bl.miss++; } else if (on) bl.fa++; });
    onInk();
    if (r + 1 < LET.length) setR(r + 1); else onDone(s);
  };
  return (
    <div className="dq-center">
      {pb && (
        <>
          <p className="dq-tag">Practice {pp + 1} of {PRACTICE_BOARDS.length}: nothing counts yet</p>
          <div className="dq-lantern" aria-label={`Lantern letter ${pb.target}`}>{pb.target}</div>
          <div className="dq-grid">
            {pb.tiles.map((t, k) => (
              <button key={k} className={"dq-tile" + (sel.includes(k) ? " on" : "")} aria-pressed={sel.includes(k)} disabled={pfb.lock} onClick={() => setSel(sel.includes(k) ? sel.filter((x) => x !== k) : [...sel, k])}>{t}</button>
            ))}
          </div>
          <p className="dq-small" role="status">{pfb.msg || "Tap every letter that looks the same, then press Done."}</p>
          <button className="dq-btn" disabled={pfb.lock || sel.length === 0} onClick={checkPractice}>Done</button>
        </>
      )}
      {!pb && (<>
      <div className="dq-lantern" aria-label={`Lantern letter ${target}`}>{target}</div>
      <div className="dq-grid">
        {tiles.map((t, k) => (
          <button key={k} className={"dq-tile" + (sel.includes(k) ? " on" : "")} aria-pressed={sel.includes(k)} onClick={() => setSel(sel.includes(k) ? sel.filter((x) => x !== k) : [...sel, k])}>{t}</button>
        ))}
      </div>
      <button className="dq-btn" onClick={done}>Done</button>
      </>)}
    </div>
  );
}

const SYL = ["bah", "dee", "moe", "koo"], COL = ["#f2a36b", "#7fd1c7", "#c9a7ee", "#f3d27a"];
const SEQS: Record<number, number[][]> = { 2: [[0, 2], [3, 1]], 3: [[1, 3, 0], [2, 0, 3]], 4: [[3, 0, 2, 1], [1, 2, 0, 3]], 5: [[2, 0, 3, 1, 2], [1, 3, 2, 0, 3]] };
const TRIALS = [{ len: 1, seq: [2], practice: true }, ...[2, 3, 4, 5].flatMap((len) => SEQS[len].map((seq) => ({ len, seq })))] as { len: number; seq: number[]; practice?: boolean }[];
function Span({ vol, focus, onInk, onDone }: { vol: number; focus: boolean; onInk: () => void; onDone: (s: any) => void }) {
  const [t, setT] = useState(0);
  const [seq, setSeq] = useState<number[]>([]);
  const [inp, setInp] = useState<number[]>([]);
  const [lit, setLit] = useState(-1);
  const [ready, setReady] = useState(false);
  const tok = useRef(0), longest = useRef(0), attempts = useRef(0), passed = useRef(0), failsAtLen = useRef(0), att = useRef<{ len: number; ok: number }[]>([]);
  useEffect(() => {
    const me = ++tok.current; const s = TRIALS[t].seq;
    setSeq(s); setInp([]); setReady(false);
    (async () => { await sleep(700); for (const n of s) { if (me !== tok.current) return; setLit(n); await speak(SYL[n], vol); setLit(-1); await sleep(250); } if (me === tok.current) setReady(true); })();
    return () => { tok.current++; if (hasTTS()) window.speechSynthesis.cancel(); };
  }, [t, vol]);
  const finish = () => onDone({ attempts: attempts.current, passed: passed.current, longest: longest.current, items: att.current });
  const tap = (n: number) => {
    if (!ready) return; speak(SYL[n], vol);
    const next = [...inp, n]; setInp(next);
    if (next.length < seq.length) return;
    setReady(false); onInk();
    const ok = next.every((x, k) => x === seq[k]); const tr = TRIALS[t];
    if (!tr.practice) { attempts.current++; att.current.push({ len: tr.len, ok: ok ? 1 : 0 }); if (ok) { longest.current = Math.max(longest.current, tr.len); passed.current++; failsAtLen.current = 0; } else failsAtLen.current++; }
    const nextT = t + 1; const lastOfLen = !TRIALS[nextT] || TRIALS[nextT].len !== tr.len;
    setTimeout(() => { if (!TRIALS[nextT] || (failsAtLen.current >= 2 && lastOfLen)) finish(); else { if (lastOfLen) failsAtLen.current = 0; setT(nextT); } }, 900);
  };
  return (
    <div className="dq-center">
      {TRIALS[t].practice && <p className="dq-tag">Practice round: nothing counts yet</p>}
      <div className="dq-row">
        {SYL.map((s, n) => {
          const stoneImg = ['/quests/dyslexia/stone_bah.webp', '/quests/dyslexia/stone_dee.webp', '/quests/dyslexia/stone_moe.webp', '/quests/dyslexia/stone_koo.webp'][n];
          return (
            <Stone
              key={n}
              color="#2a1f45"
              lit={lit === n}
              disabled={!ready}
              label={focus ? `Sound ${n + 1}` : `Singing stone ${s}`}
              onClick={() => { playAudio('tap'); tap(n); }}
            >
              {focus ? (
                <span className="dq-word" style={{ color: '#f6e7bd' }}>{n + 1}</span>
              ) : (
                <div className="flex flex-col items-center justify-center p-1 pointer-events-none select-none">
                  <img src={stoneImg} alt={s} width={50} height={50} className="w-12 h-12 object-contain drop-shadow-sm" />
                  <span className="text-xs font-bold text-amber-200 mt-1">{s}</span>
                </div>
              )}
            </Stone>
          );
        })}
      </div>
      <p className="dq-small">{ready ? (focus ? "Your turn: repeat the order" : "Your turn: sing them back") : "Listening..."}</p>
    </div>
  );
}

type Word = { w: string; real: boolean; practice?: boolean };
const WORDS: Record<"easy" | "older", Word[]> = {
  easy: [
    { w: "milk", real: true, practice: true }, { w: "mup", real: false, practice: true },
    { w: "jump", real: true }, { w: "stib", real: false }, { w: "plost", real: false }, { w: "storm", real: true },
    { w: "glunt", real: false }, { w: "bring", real: true }, { w: "plant", real: true }, { w: "snelp", real: false },
    { w: "frog", real: true }, { w: "twim", real: false }, { w: "dremp", real: false }, { w: "lunch", real: true },
  ],
  older: [
    { w: "garden", real: true, practice: true }, { w: "plusker", real: false, practice: true },
    { w: "plondish", real: false }, { w: "improve", real: true }, { w: "distance", real: true }, { w: "crelment", real: false },
    { w: "believe", real: true }, { w: "frosher", real: false }, { w: "mestrip", real: false }, { w: "thought", real: true },
    { w: "blandive", real: false }, { w: "machine", real: true }, { w: "capture", real: true }, { w: "tunteer", real: false },
  ],
};

// Real word or made-up word. Timing starts after the word is drawn; made-up words can only be told apart by sounding them out.
function WordCheck({ list, onInk, onDone }: { list: "easy" | "older"; onInk: () => void; onDone: (s: any) => void }) {
  const items = WORDS[list];
  const [i, setI] = useState(0);
  const [ready, setReady] = useState(false);
  const [fb, setFb] = useState("");
  const t0 = useRef(0), down = useRef(0), to = useRef<any>(0);
  const log = useRef<{ w: string; real: boolean; ok: boolean; rt: number }[]>([]);
  const item = items[i];
  useEffect(() => () => clearTimeout(to.current), []);
  useEffect(() => {
    setReady(false); setFb(""); t0.current = 0; down.current = 0;
    const id = setTimeout(() => { setReady(true); requestAnimationFrame(() => requestAnimationFrame(() => { t0.current = performance.now(); })); }, 700);
    return () => clearTimeout(id);
  }, [i]);
  const advance = () => {
    if (i + 1 < items.length) { setI(i + 1); return; }
    const L = log.current, R = L.filter((x) => x.real), N = L.filter((x) => !x.real);
    onDone({ list, trials: L.length, realTotal: R.length, realCorrect: R.filter((x) => x.ok).length, madeUpTotal: N.length, madeUpCorrect: N.filter((x) => x.ok).length, medianMs: median(L.map((x) => x.rt)), items: L.map((x) => ({ w: x.w, real: x.real ? 1 : 0, ok: x.ok ? 1 : 0, ms: Math.round(x.rt) })) });
  };
  const answer = (sayReal: boolean) => {
    if (!ready || !t0.current) return;
    setReady(false);
    const ok = sayReal === item.real;
    if (item.practice) {
      setFb(ok ? "Correct." : item.real ? "Not quite. That one is a real word." : "Not quite. That one is a made-up word.");
      to.current = setTimeout(advance, 1500);
      return;
    }
    log.current.push({ w: item.w, real: item.real, ok, rt: Math.max(0, (down.current > t0.current ? down.current : performance.now()) - t0.current) });
    onInk(); advance();
  };
  return (
    <div className="dq-center">
      {item.practice && <p className="dq-tag">Practice round: nothing counts yet</p>}
      <div className="dq-wordbox" aria-live="polite">{ready || fb ? item.w : "\u00a0"}</div>
      <div className="dq-row">
        <button className="dq-btn" disabled={!ready} onPointerDown={(e) => { down.current = e.timeStamp; }} onClick={() => answer(true)}>Real word</button>
        <button className="dq-btn ghost" disabled={!ready} onPointerDown={(e) => { down.current = e.timeStamp; }} onClick={() => answer(false)}>Made-up word</button>
      </div>
      <p className="dq-small">{fb || (ready ? "Real word or made-up word?" : "Next word...")}</p>
    </div>
  );
}

function McInner() {
  const [stage, setStage] = useState<"welcome" | "sound" | "intro" | "play" | "parent" | "eval" | "end">("welcome");
  const events = usePlayEvents();
  const [reportRecord, setReportRecord] = useState<SessionRecord | null>(null);
  const [notice, setNotice] = useState("");
  const [ch, setCh] = useState(0);
  const [nick, setNick] = useState("");
  const [age, setAge] = useState("");
  const [parent, setParent] = useState(false);
  const [vol, setVol] = useState(0.8);
  const [ink, setInk] = useState(0);
  const [line, setLine] = useState("Hello! I am Pip, the Story-Keeper.");
  const [heard, setHeard] = useState<boolean | null>(null);
  const [obs, setObs] = useState<Record<string, any>>({ completed: [] });
  const [sets] = useState(() => ({ rhyme: place(RHYME(), POS.rhyme), first: place(FIRST(), POS.first), spell: place(SPELL(), POS.spell) }));
  const [tested, setTested] = useState(false);
  const tts = typeof window !== "undefined" && hasTTS();
  const chapters = useMemo(() => CHAPTERS.filter((x) => x.id !== "words" || Number(age) >= 7), [age]);
  const teen = Number(age) >= 10;
  const plainUI = stage === "welcome" || teen;
  const allDone = stage === "parent" || stage === "eval" || stage === "end";
  const fin = () => { setObs((o) => ({ ...o, offered: chapters.length, voice: voiceLabel() })); setStage("parent"); };

  // Flat counts for the server, which builds the session record itself and does not trust the page.
  const telemetry = (parent: ParentAnswers | null): Record<string, number | null> => {
    const n = (v: unknown): number | null => (typeof v === "number" && isFinite(v) ? v : null);
    const choice = (o: Record<string, number> | undefined): Record<string, number> | null => (o && n(o.trials) ? o : null);
    const rh = choice(obs.rhyme), fs = choice(obs.firstSound), sp = choice(obs.spelling);
    const l = obs.letters && n(obs.letters.rounds) ? obs.letters : null;
    const conf = (l?.confusions || {}) as Record<string, number>;
    const mirror = ["b>d", "d>b", "p>q", "q>p"].reduce((a, k) => a + (conf[k] || 0), 0);
    const s = obs.soundSpan && n(obs.soundSpan.attempts) ? obs.soundSpan : null;
    const w = choice(obs.wordCheck);
    const ev = events.snapshot();
    return {
      rhymeTrials: rh ? rh.trials : null, rhymeCorrect: rh ? rh.correct : null, rhymeMedianMs: rh ? n(rh.medianMs) : null, rhymeReplays: rh ? n(rh.replays) : null,
      firstSoundTrials: fs ? fs.trials : null, firstSoundCorrect: fs ? fs.correct : null, firstSoundMedianMs: fs ? n(fs.medianMs) : null, firstSoundReplays: fs ? n(fs.replays) : null,
      spellTrials: sp ? sp.trials : null, spellCorrect: sp ? sp.correct : null, spellMedianMs: sp ? n(sp.medianMs) : null,
      letterRounds: l ? l.rounds : null, letterHits: l ? n(l.hits) : null, letterPossible: l ? n(l.possibleHits) : null, letterFalse: l ? n(l.falseTaps) : null,
      letterDistractors: l ? n(l.possibleDistractors) : null, letterMissed: l ? n(l.missed) : null, letterMirrorFalse: l ? mirror : null,
      soundSpanAttempts: s ? s.attempts : null, soundSpanPassed: s ? n(s.passed) : null, soundSpanLongest: s ? n(s.longest) : null,
      wordTrials: w ? w.trials : null, wordRealTotal: w ? n(w.realTotal) : null, wordRealCorrect: w ? n(w.realCorrect) : null,
      wordMadeTotal: w ? n(w.madeUpTotal) : null, wordMadeCorrect: w ? n(w.madeUpCorrect) : null, wordMedianMs: w ? n(w.medianMs) : null,
      pauseCount: ev.pauseCount, pausedSec: ev.pausedSec,
      parentTired: parent?.tired ?? null, parentLikeHome: parent?.likeHome ?? null, parentEnjoyed: parent?.enjoyed ?? null,
    };
  };

  const submit = async (parent: ParentAnswers | null) => {
    setNotice(""); setStage("eval");
    try {
      const res = await fetch("/api/assessments/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentType: "dyslexia", childName: nick.trim() || "Explorer", childAge: Number(age) || null, telemetry: telemetry(parent), environment: captureEnvironment() }),
      });
      if (!res.ok) throw new Error("report failed");
      const json = await res.json();
      setReportRecord(json.data.record);
      setStage("end");
    } catch {
      setNotice("Something went wrong while writing the report. Please try again.");
      setStage("parent");
    }
  };

  const addInk = () => { setInk((n) => n + 1); setLine(PIP[Math.floor(Math.random() * PIP.length)]); };
  const done = (id: string) => (s: any) => {
    const rest = { ...(s || {}) };
    delete rest.items; // item-by-item rows are not part of the report record
    setObs((o) => ({ ...o, [KEY[id]]: rest, completed: [...o.completed, id] }));
    next();
  };
  const next = () => { if (ch + 1 < chapters.length) { setCh(ch + 1); setStage("intro"); } else fin(); };
  useEffect(() => { if (stage === "intro") { const id = setTimeout(() => speak(teen ? chapters[ch].plain.hint : chapters[ch].say, vol), 300); return () => { clearTimeout(id); if (hasTTS()) window.speechSynthesis.cancel(); }; } }, [stage, ch, vol, teen, chapters]);

  const c = chapters[ch];
  const bgMap: Record<string, string> = {
    welcome: '/quests/dyslexia/welcome.webp',
    sound: '/quests/dyslexia/welcome.webp',
    intro: c ? (
      c.id === 'rhyme' || c.id === 'first' ? '/quests/dyslexia/bg_echo.webp' :
      c.id === 'letters' ? '/quests/dyslexia/bg_letters.webp' :
      c.id === 'span' ? '/quests/dyslexia/bg_span.webp' :
      '/quests/dyslexia/bg_words.webp'
    ) : '/quests/dyslexia/welcome.webp',
    play: c ? (
      c.id === 'rhyme' || c.id === 'first' ? '/quests/dyslexia/bg_echo.webp' :
      c.id === 'letters' ? '/quests/dyslexia/bg_letters.webp' :
      c.id === 'span' ? '/quests/dyslexia/bg_span.webp' :
      '/quests/dyslexia/bg_words.webp'
    ) : '/quests/dyslexia/welcome.webp',
    end: '/quests/dyslexia/celebration.webp',
  };
  const currentBg = bgMap[stage] || '/quests/dyslexia/welcome.webp';

  return (
    <main className={"dq relative" + (plainUI ? " focus" : "")}>
      <style>{CSS}</style>
      {/* Illustrated Whispering Library Backdrop Layer */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <img
          src={currentBg}
          alt="The Whispering Library"
          className="w-full h-full object-cover object-center opacity-30 filter blur-[1px]"
          width={1280}
          height={720}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1b1330]/85 via-[#231840]/80 to-[#120b22]/95" />
      </div>

      <AmbientToggle mood="dyslexia" />

      <header className="dq-head relative z-10">
        <div className="w-full flex items-center justify-between text-xs mb-3 max-w-xl mx-auto">
          <a href="/gamified-assessments" className="font-bold text-amber-300 hover:text-amber-200 hover:underline flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-300/30 shadow-sm">
            ← Gamified Quests
          </a>
          <span className="rounded-full bg-black/40 backdrop-blur-md px-3.5 py-1.5 font-bold text-amber-200 border border-amber-400/40 shadow-sm">
            {plainUI ? "Clinical Screener" : "The Whispering Library"} • Not a Diagnosis
          </span>
        </div>

        <h1>{plainUI ? "Reading & Sound Screener" : "The Whispering Library"}</h1>
        {stage !== "welcome" && (teen ? (
          <ol className="dq-ledger" aria-label="Progress">
            {chapters.map((x, k) => {
              const at = allDone ? chapters.length : ch;
              return (
                <li key={x.id} className={k < at ? "done" : k === at ? "cur" : ""} aria-current={k === at && !allDone ? "step" : undefined}>
                  <b>{k < at ? "✓" : ROMAN[k]}</b><span>{x.plain.name}</span>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="dq-lamps" aria-label={`Chapter ${Math.min(ch + 1, chapters.length)} of ${chapters.length}, ${ink} ink drops`}>
            {chapters.map((_, k) => <span key={k} className={"dq-lamp" + (k < (allDone ? chapters.length : ch) ? " on" : "")} />)}
            <span className="dq-ink flex items-center gap-1">
              <img src="/quests/dyslexia/ink_drop.webp" alt="" width={16} height={16} className="w-4 h-4 inline-block pointer-events-none" />
              {ink} ink
            </span>
          </div>
        ))}
      </header>

      {stage === "welcome" && (
        <section className="dq-center">
          <p>A parent or guardian should complete this page. The child then does short listening, letter and word activities (about 20 to 30 minutes). Use headphones in a quiet room with the sound on.</p>
          <article className="dq-card">
            <h2 className="dq-kick">What happens in this session</h2>
            <ol className="dq-list">
              <li><b>Rhyme judgement</b>: 12 items, spoken words</li>
              <li><b>Initial sounds</b>: 12 items, spoken words</li>
              <li><b>Letter orientation</b>: 4 boards of b, d, p and q</li>
              <li><b>Sound sequence</b>: repeating syllables, 2 to 5 in a row</li>
              <li><b>Word check</b>: real or made-up words, ages 7 and over, optional</li>
              <li><b>Spelling</b>: 8 items, optional</li>
            </ol>
            <h2 className="dq-kick">What is recorded</h2>
            <p>Counts of answers, response times, and how often the page was left during play, for this session only. Nothing is saved on our servers. At the end you answer three short questions, then get a report for you (what went well, what may need support, what needs a closer look), a 4-week home plan, and a one-page summary for a clinician.</p>
          </article>
          <label>Nickname (not the child’s full name)<br /><input className="dq-input" maxLength={16} value={nick} onChange={(e) => setNick(e.target.value)} /></label>
          <label>Age in years (4 to 16)<br /><input className="dq-input" inputMode="numeric" maxLength={2} value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))} /></label>
          <label>Volume<br /><input type="range" min="0.2" max="1" step="0.1" value={vol} onChange={(e) => setVol(Number(e.target.value))} /></label>
          <label className="dq-check"><input type="checkbox" checked={parent} onChange={(e) => setParent(e.target.checked)} /> I am this child's parent or guardian and I agree to the notes below.</label>
          <p className="dq-small">This is a play activity, not a diagnosis. We do not save anything from this session. At the end, only the nickname, age and play counts are sent once to build the report, and no AI model is used to write it.</p>
          <button className="dq-btn" disabled={!parent || !nick.trim() || !(Number(age) >= 4 && Number(age) <= 16)} onClick={() => setStage("sound")}>Next</button>
        </section>
      )}

      {stage === "sound" && (
        <section className="dq-center">
          {!teen && <Owl line="Can you hear me?" pose="listening" />}
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
          {teen ? (
            <article className="dq-card">
              <p className="dq-kick">Part {ch + 1} of {chapters.length}{c.id === "spell" || c.id === "words" ? " · optional" : ""}</p>
              <h2 className="dq-ch">{c.plain.name}</h2>
              <p>{c.plain.hint}</p>
              <dl className="dq-meta">
                <div><dt>What it samples</dt><dd>{c.plain.measures}</dd></div>
                <div><dt>Items</dt><dd>{c.plain.items}</dd></div>
                <div><dt>Time</dt><dd>{c.plain.mins}</dd></div>
              </dl>
            </article>
          ) : (
            <>
              <Owl line={`Chapter ${ch + 1}: ${c.name}`} pose="greeting" />
              <p>{c.hint}</p>
            </>
          )}
          <div className="dq-row">
            <button className="dq-btn" onClick={() => setStage("play")}>Start</button>
            {(c.id === "spell" || c.id === "words") && <button className="dq-btn ghost" onClick={() => next()}>Skip</button>}
            <button className="dq-btn ghost" onClick={() => speak(teen ? c.plain.hint : c.say, vol)}>Hear it again</button>
          </div>
        </section>
      )}

      {stage === "play" && (
        <>
          {!teen && <Owl line={line} pose="cheering" />}
          {c.id === "rhyme" && <AudioChoice key="r" items={sets.rhyme} mode="listen" vol={vol} focus={teen} onInk={addInk} onDone={done("rhyme")} />}
          {c.id === "first" && <AudioChoice key="f" items={sets.first} mode="listen" vol={vol} focus={teen} onInk={addInk} onDone={done("first")} />}
          {c.id === "letters" && <Letters vol={vol} onInk={addInk} onDone={done("letters")} />}
          {c.id === "span" && <Span vol={vol} focus={teen} onInk={addInk} onDone={done("span")} />}
          {c.id === "words" && <WordCheck key="w" list={Number(age) >= 10 ? "older" : "easy"} onInk={addInk} onDone={done("words")} />}
          {c.id === "spell" && <AudioChoice key="s" items={sets.spell} mode="spell" vol={vol} focus={teen} onInk={addInk} onDone={done("spell")} />}
          <button className="dq-btn ghost dq-rest" onClick={fin}>{teen ? "Finish now" : "Take a rest and finish"}</button>
        </>
      )}

      {stage === "parent" && (
        <section className="dq-wide">
          {notice && <p role="alert" className="dq-notice">{notice}</p>}
          <div className="dq-report"><ParentCard childName={nick.trim()} onDone={(a) => submit(a)} /></div>
          <button className="dq-btn ghost dq-rest" onClick={() => submit(null)}>Skip and see the report</button>
        </section>
      )}

      {stage === "eval" && (
        <section className="dq-center" aria-live="polite">
          {!teen && <Owl line="Pip is writing it all down..." pose="listening" />}
          <p>Writing the report...</p>
        </section>
      )}

      {stage === "end" && reportRecord && (
        <section className="dq-wide">
          <div className="dq-center">
            {!teen && <Owl line={`Well done, ${nick.trim() || "Explorer"}! The lanterns are glowing.`} pose="resting" />}
            <h2 className="dq-ch">{teen ? "Session complete" : "You finished the Whispering Library!"}</h2>
            {!teen && <p>You collected {ink} ink drops. The report below is for the grown-up.</p>}
          </div>
          <div className="dq-report">
            <EndReport record={reportRecord} name={nick.trim() || "Explorer"} />
            <div className="dq-actions"><SessionRecordDownload record={reportRecord} /></div>
          </div>
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
.dq-wide{max-width:860px;margin:0 auto}
.dq-report{color:#0f172a;letter-spacing:normal;line-height:1.5;font-family:system-ui,-apple-system,Segoe UI,sans-serif;text-align:left}
.dq-actions{margin:16px 0 0;display:flex;justify-content:center}
.dq-notice{background:#fff2;border:1px solid #d9b45a;border-radius:12px;padding:10px 14px;margin:0 0 12px;text-align:center}
.dq-row{display:flex;gap:20px;flex-wrap:wrap;justify-content:center}
.dq-owl{display:flex;align-items:center;gap:12px;max-width:560px;margin:0 auto 12px;background:rgba(255,255,255,.08);border-radius:20px;padding:8px 16px}
.dq-stone{position:relative;width:104px;height:104px;border-radius:50%;border:3px solid #fff3;color:#2b1d05;cursor:pointer;display:grid;place-items:center;transition:transform .2s}
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
.dq-ch{font-size:20px;margin:0}
.dq-wordbox{min-height:96px;display:grid;place-items:center;font-size:44px;font-weight:600;letter-spacing:.06em;font-family:Verdana,sans-serif}
.dq-kick{margin:0 0 4px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#d8b86a;font-family:system-ui,sans-serif;font-weight:600}
.dq-meta{margin:16px 0 0;display:grid;gap:10px}
.dq-meta div{display:grid;grid-template-columns:130px 1fr;gap:12px;padding-top:10px;border-top:1px solid #d8b86a2e}
.dq-meta dt{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#b9ad8f;font-family:system-ui,sans-serif}
.dq-meta dd{margin:0}
.dq-list{margin:6px 0 14px;padding-left:20px}
.dq-list li{margin:4px 0}
.dq-ledger{display:flex;flex-wrap:wrap;justify-content:center;gap:6px 16px;list-style:none;margin:0;padding:0;font-family:system-ui,sans-serif;font-size:12px}
.dq-ledger li{display:flex;align-items:center;gap:6px;opacity:.55}
.dq-ledger b{display:inline-grid;place-items:center;min-width:24px;height:24px;border:1px solid #d8b86a88;border-radius:50%;font-size:11px;font-weight:600}
.dq-ledger li.cur{opacity:1}
.dq-ledger li.cur b{background:#d8b86a;color:#0f1420;border-color:#d8b86a}
.dq-ledger li.done{opacity:.9}
.dq-ledger li.done b{border-color:#d8b86a;color:#d8b86a}
.dq.focus{background:radial-gradient(ellipse at 50% -10%,#1d2740 0,#0f1420 62%);color:#ece6d6;font-family:'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif;letter-spacing:.01em;line-height:1.65}
.dq.focus h1{font-size:21px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#d8b86a}
.dq.focus h1::after{content:"";display:block;width:64px;height:1px;background:#d8b86a;margin:10px auto 0;opacity:.7}
.dq.focus .dq-card{width:100%;max-width:560px;text-align:left;padding:22px 24px;border:1px solid #d8b86a44;border-radius:6px;background:linear-gradient(180deg,#18203a99,#111827cc);box-shadow:inset 0 1px 0 #ffffff12,0 10px 30px #0006}
.dq.focus .dq-card p{margin:0 0 10px}
.dq.focus .dq-ch{font-size:26px;font-weight:600;margin:0 0 8px}
.dq.focus .dq-stone{width:132px;height:84px;border-radius:6px;border:1px solid #d8b86a66;background:linear-gradient(180deg,#1c2644,#141b30)!important;color:#ece6d6;box-shadow:inset 0 1px 0 #ffffff14}
.dq.focus .dq-stone.lit{transform:none;border-color:#d8b86a;box-shadow:0 0 0 3px #d8b86a55}
.dq.focus .dq-word{color:#ece6d6;font-size:26px}
.dq.focus .dq-ring{inset:-5px;border-radius:9px;border:2px solid #d8b86a}
.dq.focus .dq-lantern{background:#141b30;color:#ece6d6;border:1px solid #d8b86a66;border-radius:6px;font-family:Georgia,serif}
.dq.focus .dq-tile{background:#141b30;border:1px solid #d8b86a55;color:#ece6d6;border-radius:6px;font-family:Georgia,serif}
.dq.focus .dq-tile.on{background:#d8b86a;color:#0f1420;border-color:#d8b86a}
.dq.focus .dq-btn{background:#d8b86a;color:#0f1420;font-weight:700;border-radius:6px;font-size:14px;letter-spacing:.08em;text-transform:uppercase;font-family:system-ui,sans-serif}
.dq.focus .dq-btn.ghost{background:transparent;border:1px solid #d8b86a88;color:#ece6d6}
.dq.focus .dq-input{background:#141b30;border:1px solid #d8b86a66;color:#ece6d6;border-radius:6px}
.dq.focus .dq-tag{background:transparent;border:1px solid #d8b86a66;border-radius:3px;font-family:system-ui,sans-serif;font-size:12px;letter-spacing:.08em;text-transform:uppercase}
.dq.focus .dq-wordbox{font-family:Georgia,serif}
.dq.focus .dq-stone:focus-visible,.dq.focus .dq-btn:focus-visible,.dq.focus .dq-tile:focus-visible,.dq.focus .dq-input:focus-visible{outline:3px solid #fff}
@media (prefers-reduced-motion:reduce){.dq *{animation:none!important;transition:none!important}}
`;

// --- mount gate: this quest uses random/time values, so it renders in the browser only ---
import { useState as __mcUseState, useEffect as __mcUseEffect } from "react";
export default function __McGate(props: any) {
  const [mounted, setMounted] = __mcUseState(false);
  __mcUseEffect(() => { setMounted(true); }, []);
  return mounted ? <McInner {...props} /> : null;
}
