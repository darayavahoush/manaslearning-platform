/* eslint-disable */
"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ParentCard, { type ParentAnswers } from "../../../components/assessments/ParentCard";
import EndReport from "../../../components/assessments/report/EndReport";
import SessionRecordDownload from "../../../components/assessments/SessionRecordDownload";
import { captureEnvironment, type SessionRecord } from "../../../components/assessments/session-record";
import { usePlayEvents } from "../../../components/assessments/play-events";
import { AmbientToggle } from "../../../components/assessments/QuestFX";
import WelcomeWizard, { type Cls } from "../../../components/assessments/WelcomeWizard";
import CognitiveDossierView from "../../../components/assessments/report/CognitiveDossierView";

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

const SCHOLAR_CLASSES: Cls[] = [
  {
    name: "Echo Scribe",
    desc: "Keen listener · Catches echoing sounds and rhyming words",
    badge: "Sound Scholar",
    image: "/quests/characters/echo_scribe.webp",
  },
  {
    name: "Rune Archivist",
    desc: "Letter detective · Untangles puzzle letters and finds hidden words",
    badge: "Letter Seeker",
    image: "/quests/characters/rune_archivist.webp",
  },
  {
    name: "Story Navigator",
    desc: "Creative thinker · Enjoys great adventures, pictures, and tales",
    badge: "Story Weaver",
    image: "/quests/characters/story_navigator.webp",
  },
];

const CHAPTER_VISUALS: Record<string, { icon: string; shortPrompt: string; steps: [string, string, string] }> = {
  rhyme: {
    icon: '🔔',
    shortPrompt: 'Listen to the echo ➔ Tap the rhyming stone!',
    steps: ['👂 1. Hear word', '🔔 2. Find rhyme', '💎 3. Tap stone!'],
  },
  first: {
    icon: '🎯',
    shortPrompt: 'Listen to the start sound ➔ Tap the match!',
    steps: ['👂 1. Hear sound', '🎯 2. Match start', '💎 3. Tap stone!'],
  },
  letters: {
    icon: '🦋',
    shortPrompt: 'Find all letters matching the lantern!',
    steps: ['🏮 1. Check letter', '🔍 2. Spot twins', '🦋 3. Tap all!'],
  },
  span: {
    icon: '🎵',
    shortPrompt: 'Listen to the tunes ➔ Tap in the same order!',
    steps: ['🎵 1. Hear tune', '🧠 2. Remember order', '🔢 3. Tap stones!'],
  },
  words: {
    icon: '📖',
    shortPrompt: 'Real word or made-up word? Tap to sort!',
    steps: ['📖 1. Read word', '✨ 2. Real word?', '🪄 3. Or made-up?'],
  },
  spell: {
    icon: '✍️',
    shortPrompt: 'Listen to the word ➔ Pick the right spelling!',
    steps: ['👂 1. Hear word', '✍️ 2. Pick spelling', '🌟 3. Tap match!'],
  },
};

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
    if (item.practice) speak(isHit ? "Yes! Great listening!" : "Good try! This one was right.", vol);
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
const PRACTICE_BOARDS = [
  { target: "b", tiles: ["b", "o", "o", "b"] },
  { target: "d", tiles: ["d", "b", "d", "p", "b", "q"] },
];
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
  const [ready, setReady] = useState(false);
  const [lit, setLit] = useState<number | null>(null);
  const tok = useRef(0);
  const pass = useRef(0), fails = useRef(0), longest = useRef(0), currLen = useRef(0), attempts = useRef(0);
  const cur = TRIALS[t];

  const play = useCallback(async () => {
    const me = ++tok.current; const alive = () => me === tok.current;
    setReady(false); setInp([]);
    for (const id of cur.seq) {
      if (!alive()) return; setLit(id); await speak(SYL[id], vol); if (!alive()) return;
      await sleep(150); setLit(null); await sleep(150);
    }
    setReady(true);
  }, [cur, vol]);

  useEffect(() => { const id = setTimeout(play, 500); return () => { clearTimeout(id); tok.current++; if (hasTTS()) window.speechSynthesis.cancel(); }; }, [play]);

  const tap = (k: number) => {
    if (!ready || inp.length >= cur.seq.length) return;
    playAudio('tap');
    const next = [...inp, k]; setInp(next);
    if (next.length === cur.seq.length) {
      const ok = next.every((x, i) => x === cur.seq[i]);
      if (!cur.practice) {
        attempts.current++;
        if (cur.len !== currLen.current) { currLen.current = cur.len; fails.current = 0; }
        if (ok) { pass.current++; longest.current = Math.max(longest.current, cur.len); } else fails.current++;
      }
      playAudio(ok ? 'hit' : 'miss');
      onInk();
      setTimeout(() => {
        if (!cur.practice && fails.current >= 2) onDone({ attempts: attempts.current, passed: pass.current, longest: longest.current });
        else if (t + 1 < TRIALS.length) setT(t + 1);
        else onDone({ attempts: attempts.current, passed: pass.current, longest: longest.current });
      }, 700);
    }
  };

  return (
    <div className="dq-center">
      {cur.practice && <p className="dq-tag">Practice round: nothing counts yet</p>}
      <div className="dq-row">
        {SYL.map((s, k) => (
          <Stone key={k} color={COL[k]} lit={lit === k} disabled={!ready} label={`${focus ? "Sound" : "Singing stone"} ${k + 1}: ${s}`} onClick={() => tap(k)}>
            <span className="dq-word">{focus ? k + 1 : s}</span>
          </Stone>
        ))}
      </div>
      <p className="dq-small">{ready ? (inp.length ? `Tapped ${inp.length} of ${cur.seq.length}` : "Your turn") : "Listen..."}</p>
    </div>
  );
}

const WORDS = {
  easy: [
    { w: "jump", real: true, practice: true }, { w: "bask", real: true, practice: true },
    { w: "help", real: true }, { w: "narp", real: false }, { w: "desk", real: true }, { w: "fost", real: false },
    { w: "lamp", real: true }, { w: "pelt", real: true }, { w: "kest", real: false }, { w: "camp", real: true },
    { w: "dint", real: false }, { w: "belt", real: true }, { w: "morp", real: false }, { w: "tusk", real: true },
  ],
  older: [
    { w: "frost", real: true, practice: true }, { w: "trisp", real: false, practice: true },
    { w: "crisp", real: true }, { w: "blint", real: false }, { w: "track", real: true }, { w: "glomp", real: false },
    { w: "drink", real: true }, { w: "snarp", real: false }, { w: "plant", real: true }, { w: "clasp", real: true },
    { w: "plend", real: false }, { w: "stamp", real: true }, { w: "drolt", real: false }, { w: "brisk", real: true },
  ],
};
function WordCheck({ list, onInk, onDone }: { list: "easy" | "older"; onInk: () => void; onDone: (s: any) => void }) {
  const [i, setI] = useState(0);
  const [ready, setReady] = useState(false);
  const [fb, setFb] = useState<string | null>(null);
  const items = WORDS[list];
  const item = items[i];
  const t0 = useRef(0), down = useRef(0);
  const log = useRef<{ w: string; real: boolean; ok: boolean; rt: number }[]>([]);

  useEffect(() => {
    setReady(false); setFb(null); down.current = 0; t0.current = 0;
    const id = setTimeout(() => {
      setReady(true);
      requestAnimationFrame(() => requestAnimationFrame(() => { t0.current = performance.now(); }));
    }, 450);
    return () => clearTimeout(id);
  }, [i]);

  const answer = (ansReal: boolean) => {
    if (!ready || !t0.current) return;
    const isHit = ansReal === item.real;
    playAudio(isHit ? 'hit' : 'miss');
    const rt = Math.max(0, (down.current > t0.current ? down.current : performance.now()) - t0.current);
    if (!item.practice) log.current.push({ w: item.w, real: item.real, ok: isHit, rt });
    onInk();
    if (item.practice) setFb(isHit ? "Yes! Correct." : `This is ${item.real ? "a real word" : "a made-up word"}.`);
    setTimeout(() => {
      if (i + 1 < items.length) setI(i + 1);
      else {
        const r = log.current.filter((x) => x.real), m = log.current.filter((x) => !x.real);
        onDone({ trials: log.current.length, realTotal: r.length, realCorrect: r.filter((x) => x.ok).length, madeUpTotal: m.length, madeUpCorrect: m.filter((x) => x.ok).length, medianMs: median(log.current.map((x) => x.rt)), items: log.current.map((x) => ({ w: x.w, real: x.real ? 1 : 0, ok: x.ok ? 1 : 0, ms: Math.round(x.rt) })) });
      }
    }, item.practice ? 1200 : 350);
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
  const [guildClass, setGuildClass] = useState("Echo Scribe");
  const [reportRecord, setReportRecord] = useState<SessionRecord | null>(null);
  const [clinicalReport, setClinicalReport] = useState<any>(null);
  const [notice, setNotice] = useState("");
  const [ch, setCh] = useState(0);
  const [nick, setNick] = useState("");
  const [age, setAge] = useState("8");
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
  const plainUI = false;
  const allDone = stage === "parent" || stage === "eval" || stage === "end";
  const fin = () => { setObs((o) => ({ ...o, offered: chapters.length, voice: voiceLabel() })); setStage("parent"); };

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
        body: JSON.stringify({
          assessmentType: "dyslexia",
          childName: nick.trim() || "Echo Scribe",
          guildClass,
          childAge: Number(age) || null,
          telemetry: telemetry(parent),
          environment: captureEnvironment(),
        }),
      });
      if (!res.ok) throw new Error("report failed");
      const json = await res.json();
      setReportRecord(json.data.record);
      setClinicalReport(json.data.clinicalReport);
      setStage("end");
    } catch {
      setNotice("Something went wrong while generating the clinical summary. Please try again.");
      setStage("parent");
    }
  };

  const addInk = () => { setInk((n) => n + 1); setLine(PIP[Math.floor(Math.random() * PIP.length)]); };
  const done = (id: string) => (s: any) => {
    const rest = { ...(s || {}) };
    delete rest.items;
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
        <div className="absolute inset-0 bg-gradient-to-b from-[#1b1330]/90 via-[#231840]/85 to-[#120b22]/95" />
      </div>

      <AmbientToggle mood="dyslexia" />

      <header className="dq-head relative z-10">
        <div className="w-full flex items-center justify-between text-xs mb-3 max-w-4xl mx-auto px-4">
          <a href="/gamified-assessments" className="font-bold text-amber-300 hover:text-amber-200 hover:underline flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-300/30 shadow-sm">
            ← Gamified Quests
          </a>
          <span className="rounded-full bg-black/40 backdrop-blur-md px-3.5 py-1.5 font-bold text-amber-200 border border-amber-400/40 shadow-sm">
            The Whispering Library • Reading & Phonology Screener
          </span>
        </div>

        {stage !== "welcome" && (
          <div className="dq-lamps" aria-label={`Chapter ${Math.min(ch + 1, chapters.length)} of ${chapters.length}, ${ink} ink drops`}>
            {chapters.map((_, k) => <span key={k} className={"dq-lamp" + (k < (allDone ? chapters.length : ch) ? " on" : "")} />)}
            <span className="dq-ink flex items-center gap-1 font-bold text-amber-200">
              <img src="/quests/dyslexia/ink_drop.webp" alt="" width={16} height={16} className="w-4 h-4 inline-block pointer-events-none" />
              {ink} ink
            </span>
          </div>
        )}
      </header>

      {/* STAGE 1: WELCOME WIZARD */}
      {stage === "welcome" && (
        <section className="mx-auto max-w-4xl relative z-10 qd-stage my-6 px-4">
          <div className="rounded-3xl border-2 border-indigo-400/40 bg-white/95 backdrop-blur-md p-6 md:p-10 shadow-2xl text-slate-800">
            <WelcomeWizard
              theme="indigo"
              classLabel="Scholar Guild Class"
              classes={SCHOLAR_CLASSES}
              selected={guildClass}
              onSelect={setGuildClass}
              nameLabel="child's explorer nickname"
              namePlaceholder="e.g. Maya, Aarav, Leo"
              name={nick}
              onName={setNick}
              ages={[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]}
              age={Number(age) || 8}
              onAge={(n) => setAge(String(n))}
              ageNote={(a) =>
                a <= 6
                  ? "Ages 4–6: Focuses on listening to rhyming echoes and early letter finding. Visual, auditory and playful."
                  : a <= 9
                  ? "Ages 7–9: Explores sound sequencing, mirror letter orientation, and word sounding-out."
                  : "Ages 10+: Full phonological memory sequence span and advanced word checks."
              }
              consent={parent}
              onConsent={setParent}
              startLabel="Enter The Whispering Library →"
              onStart={() => {
                playAudio("chime");
                setStage("sound");
              }}
            />
          </div>
        </section>
      )}

      {/* STAGE 2: AUDIO SETUP */}
      {stage === "sound" && (
        <section className="mx-auto max-w-2xl relative z-10 my-8 px-4">
          <div className="rounded-3xl border-2 border-indigo-400/40 bg-gradient-to-b from-[#1E1636]/90 via-[#261C44]/80 to-[#18112C]/95 backdrop-blur-md p-8 md:p-10 shadow-2xl text-center text-amber-100">
            <Owl line="Can you hear Pip whispering?" pose="listening" />
            <h2 className="font-patrick text-2xl sm:text-3xl text-amber-300 font-bold mt-4 mb-2">
              Audio Check & Listening Setup
            </h2>
            <p className="text-sm text-amber-200/90 leading-relaxed max-w-md mx-auto mb-6">
              The Whispering Library uses spoken words, echoing rhymes, and musical river stones. Headphones in a quiet room give the most comfortable experience.
            </p>

            {!tts && (
              <div role="alert" className="p-4 rounded-2xl bg-amber-900/60 border border-amber-400 text-amber-200 text-sm mb-6">
                This browser cannot play spoken speech synthesis. Please open in Chrome, Safari, or Edge.
              </div>
            )}

            <div className="my-6 flex flex-col items-center justify-center gap-4">
              <Stone
                color="#f3d27a"
                label="Play test word"
                onClick={() => {
                  speak("moon", vol);
                  setTested(true);
                  setHeard(null);
                }}
              >
                <Speaker />
              </Stone>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Tap the Lantern to hear &quot;Moon&quot;
              </span>
            </div>

            {/* Volume Slider */}
            <div className="my-4 max-w-xs mx-auto text-left">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-300 block mb-1">
                Volume: {Math.round(vol * 100)}%
              </label>
              <input
                type="range"
                min="0.2"
                max="1"
                step="0.1"
                value={vol}
                onChange={(e) => setVol(Number(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>

            {tested && (
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <button
                  className="rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-8 py-3.5 text-base font-bold text-slate-950 shadow-xl hover:scale-105 active:scale-95 transition-all"
                  onClick={() => { playAudio('chime'); setStage("intro"); }}
                >
                  I heard &quot;moon&quot; clearly →
                </button>
                <button
                  className="rounded-full border-2 border-amber-400/60 bg-black/30 px-6 py-3.5 text-sm font-bold text-amber-200 hover:bg-black/50 transition-all"
                  onClick={() => setHeard(false)}
                >
                  No sound heard
                </button>
              </div>
            )}

            {(!tested || heard === false) && (
              <p className="mt-4 text-xs text-amber-300/80">
                Tip: turn up the device volume, unmute silent mode, or plug in headphones, then tap the glowing lantern again.
              </p>
            )}
          </div>
        </section>
      )}

      {/* STAGE 3: CHAPTER BRIEFING */}
      {stage === "intro" && (
        <section className="mx-auto max-w-3xl relative z-10 my-8 px-4">
          <div className="rounded-3xl border-2 border-indigo-400/40 bg-gradient-to-b from-[#1E1636]/90 via-[#261C44]/80 to-[#18112C]/95 backdrop-blur-md p-6 sm:p-10 shadow-2xl text-center text-amber-100">
            <Owl line={`Chapter ${ch + 1}: ${c.name}`} pose="greeting" />

            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 px-3.5 py-1 text-xs font-bold text-amber-200">
              <span>{CHAPTER_VISUALS[c.id]?.icon || '✨'}</span>
              <span>Chapter {ch + 1} of {chapters.length}</span>
            </div>

            <h2 className="font-patrick text-3xl sm:text-4xl text-amber-300 font-bold mt-2 mb-1">
              {c.name}
            </h2>
            <p className="text-base sm:text-lg font-bold text-amber-100 max-w-lg mx-auto mb-5">
              {CHAPTER_VISUALS[c.id]?.shortPrompt || c.hint}
            </p>

            {/* Illustrated Byte-Sized Action Chips */}
            {CHAPTER_VISUALS[c.id] && (
              <div className="grid grid-cols-3 gap-2.5 max-w-md mx-auto mb-6">
                {CHAPTER_VISUALS[c.id].steps.map((st, idx) => (
                  <div key={idx} className="flex flex-col items-center p-2.5 rounded-2xl bg-black/40 border border-indigo-400/30 shadow-xs">
                    <span className="text-xs font-bold text-amber-200">{st}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-4">
              <button
                className="rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-10 py-4 text-lg font-bold text-slate-950 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                onClick={() => setStage("play")}
              >
                Start Chapter ▶
              </button>
              {(c.id === "spell" || c.id === "words") && (
                <button className="rounded-full border border-amber-400/60 bg-black/30 px-6 py-4 text-sm font-bold text-amber-200 hover:bg-black/50 transition-all cursor-pointer" onClick={() => next()}>
                  Skip this part
                </button>
              )}
              <button className="rounded-full border border-amber-400/60 bg-black/30 px-6 py-4 text-sm font-bold text-amber-200 hover:bg-black/50 transition-all cursor-pointer" onClick={() => speak(teen ? c.plain.hint : c.say, vol)}>
                Hear again 🔊
              </button>
            </div>
          </div>
        </section>
      )}

      {/* STAGE 4: INTERACTIVE GAMEPLAY */}
      {stage === "play" && (
        <section className="mx-auto max-w-5xl relative z-10 my-6 px-4">
          <div className="rounded-3xl border-2 border-indigo-400/40 bg-gradient-to-b from-[#1C1534]/90 via-[#241A42]/85 to-[#160F2A]/95 backdrop-blur-md p-6 sm:p-10 shadow-2xl text-center text-amber-100">
            {!teen && <Owl line={line} pose="cheering" />}
            <div className="my-6">
              {c.id === "rhyme" && <AudioChoice key="r" items={sets.rhyme} mode="listen" vol={vol} focus={teen} onInk={addInk} onDone={done("rhyme")} />}
              {c.id === "first" && <AudioChoice key="f" items={sets.first} mode="listen" vol={vol} focus={teen} onInk={addInk} onDone={done("first")} />}
              {c.id === "letters" && <Letters vol={vol} onInk={addInk} onDone={done("letters")} />}
              {c.id === "span" && <Span vol={vol} focus={teen} onInk={addInk} onDone={done("span")} />}
              {c.id === "words" && <WordCheck key="w" list={Number(age) >= 10 ? "older" : "easy"} onInk={addInk} onDone={done("words")} />}
              {c.id === "spell" && <AudioChoice key="s" items={sets.spell} mode="spell" vol={vol} focus={teen} onInk={addInk} onDone={done("spell")} />}
            </div>
            <button className="mt-8 text-xs font-semibold text-amber-300/80 hover:text-amber-200 underline" onClick={fin}>
              {teen ? "Finish session now" : "Take a rest and finish now"}
            </button>
          </div>
        </section>
      )}

      {/* STAGE 5: PARENT REFLECTIONS */}
      {stage === "parent" && (
        <section className="mx-auto max-w-3xl relative z-10 my-8 px-4">
          {notice && <p role="alert" className="p-3 mb-4 rounded-xl bg-amber-900/60 border border-amber-400 text-amber-200 text-sm text-center">{notice}</p>}
          <div className="rounded-3xl border-2 border-indigo-300/60 bg-white/95 p-6 md:p-10 shadow-2xl text-slate-800">
            <ParentCard childName={nick.trim() || "your child"} onDone={(a) => submit(a)} />
          </div>
          <div className="mt-4 text-center">
            <button className="text-sm font-bold text-amber-300/90 underline" onClick={() => submit(null)}>
              Skip and see the report directly
            </button>
          </div>
        </section>
      )}

      {/* STAGE 6: EVALUATING */}
      {stage === "eval" && (
        <section className="mx-auto max-w-xl relative z-10 my-16 text-center text-amber-100 px-4">
          <Owl line="Pip is synthesizing the phonological insights..." pose="listening" />
          <h2 className="font-patrick text-3xl text-amber-300 font-bold mt-4">Generating Developmental Dossier</h2>
          <p className="text-sm text-amber-200/80 mt-2">Connecting response times, sound memory span, and letter orientation data...</p>
        </section>
      )}

      {/* STAGE 7: END CLINICAL DOSSIER */}
      {stage === "end" && (
        <section className="mx-auto max-w-5xl relative z-10 pb-16 px-4">
          <div className="mb-8 flex flex-col items-center text-center">
            <Owl line={`Brilliant reading exploration, ${nick.trim() || "Scholar"}! The library lanterns are glowing.`} pose="resting" />
            <h2 className="font-patrick text-3xl sm:text-4xl text-amber-100 font-bold mt-3">
              The Whispering Library Completed!
            </h2>
            <p className="text-sm text-amber-200/80 mt-1 max-w-md">
              You collected {ink} starlight ink drops. Below is the clinical and developmental report for parents and educators.
            </p>
          </div>

          {clinicalReport ? (
            <CognitiveDossierView quest="dyslexia" childName={nick.trim() || "Explorer"} clinicalReport={clinicalReport} />
          ) : reportRecord ? (
            <div className="rounded-3xl border-2 border-indigo-300 bg-white p-6 md:p-10 shadow-2xl">
              <EndReport record={reportRecord} name={nick.trim() || "Explorer"} />
            </div>
          ) : null}

          {reportRecord && (
            <div className="mt-8 flex justify-center gap-4">
              <SessionRecordDownload record={reportRecord} />
            </div>
          )}
        </section>
      )}
    </main>
  );
}

const CSS = `
.dq{min-height:100vh;padding:20px 16px 60px;background:radial-gradient(circle at 50% 0,#2c1f48,#140d25 70%);color:#f6e7bd;font-family:Verdana,system-ui,sans-serif;line-height:1.7;letter-spacing:.03em}
.dq h1{font-size:24px;margin:0;text-align:center}
.dq-head{display:flex;flex-direction:column;align-items:center;gap:8px;margin-bottom:16px}
.dq-lamps{display:flex;align-items:center;gap:8px}
.dq-lamp{width:20px;height:20px;border-radius:50%;border:2px solid #d9b45a}
.dq-lamp.on{background:#ffd76a;box-shadow:0 0 12px #ffd76a}
.dq-ink{margin-left:8px;font-size:14px}
.dq-center{display:flex;flex-direction:column;align-items:center;gap:20px;max-width:960px;width:100%;margin:0 auto;text-align:center}
.dq-wide{max-width:1120px;width:100%;margin:0 auto}
.dq-report{color:#0f172a;letter-spacing:normal;line-height:1.5;font-family:system-ui,-apple-system,Segoe UI,sans-serif;text-align:left}
.dq-actions{margin:16px 0 0;display:flex;justify-content:center}
.dq-notice{background:#fff2;border:1px solid #d9b45a;border-radius:12px;padding:10px 14px;margin:0 0 12px;text-align:center}
.dq-row{display:flex;gap:24px;flex-wrap:wrap;justify-content:center}
.dq-owl{display:flex;items-center;gap:12px;max-width:620px;margin:0 auto 12px;background:rgba(255,255,255,.08);border-radius:24px;padding:10px 20px;border:1px solid rgba(255,255,255,.12)}
.dq-stone{position:relative;width:114px;height:114px;border-radius:50%;border:3px solid #fff4;color:#2b1d05;cursor:pointer;display:grid;place-items:center;transition:transform .2s,box-shadow .2s}
.dq-stone:disabled{opacity:.55;cursor:default}
.dq-stone:focus-visible,.dq-btn:focus-visible,.dq-tile:focus-visible,.dq-input:focus-visible{outline:4px solid #fff;outline-offset:3px}
.dq-stone.lit{transform:scale(1.1);box-shadow:0 0 32px #ffe9a0}
.dq-ring{position:absolute;inset:-8px;border-radius:50%;border:4px solid #ffd76a}
.dq-word{color:#2b1d05;font-size:24px;font-weight:700}
.dq-lantern{font-size:96px;width:130px;height:130px;display:grid;place-items:center;border-radius:28px;background:#ffd76a;color:#2b1d05;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,0.4)}
.dq-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;max-width:440px;margin:0 auto}
.dq-tile{width:82px;height:82px;font-size:44px;font-family:Verdana,sans-serif;border-radius:20px;border:3px solid #d9b45a;background:#2a1f45;color:#f6e7bd;cursor:pointer;transition:transform .15s}
.dq-tile:hover{transform:scale(1.05)}
.dq-tile.on{background:#d9b45a;color:#2b1d05}
.dq-btn{min-height:52px;padding:12px 28px;border-radius:999px;border:0;background:#ffd76a;color:#2b1d05;font-size:18px;font-weight:700;cursor:pointer;transition:transform .15s,box-shadow .15s}
.dq-btn:hover{transform:scale(1.03)}
.dq-btn.ghost{background:transparent;border:2px solid #d9b45a;color:#f6e7bd}
.dq-btn:disabled{opacity:.5;cursor:default}
.dq-rest{display:block;margin:28px auto 0}
.dq-input{min-height:48px;font-size:18px;padding:8px 14px;border-radius:12px;border:2px solid #d9b45a;background:#fff8e6;color:#2b1d05}
.dq-check{text-align:left;font-size:15px}
.dq-small{font-size:14px;opacity:.9}
.dq-tag{background:#fff2;border-radius:999px;padding:4px 16px;font-size:13px;margin:0;font-weight:bold;letter-spacing:.05em}
.dq-wordbox{min-height:104px;display:grid;place-items:center;font-size:48px;font-weight:700;letter-spacing:.06em;font-family:Verdana,sans-serif;color:#ffd76a}
@media (prefers-reduced-motion:reduce){.dq *{animation:none!important;transition:none!important}}
`;

import { useState as __mcUseState, useEffect as __mcUseEffect } from "react";
export default function __McGate(props: any) {
  const [mounted, setMounted] = __mcUseState(false);
  __mcUseEffect(() => { setMounted(true); }, []);
  return mounted ? <McInner {...props} /> : null;
}
