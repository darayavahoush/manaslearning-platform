/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useContext,
  createContext,
} from "react";
import "./InTheirWorld.css";
import "./media/media.css";
import CueIcon from "./media/CueIcon";
import EffectsToggle from "./media/EffectsToggle";
import QuietCorner from "./media/QuietCorner";

/* ============================================================
   In Their World
   A field guide for parents & teachers — four short interactive
   modules (autism, ADHD, dyslexia, speech/language), each
   framed as a task you attempt and get rated on, with synthesized
   ambient audio, plus real prevalence data (US/global AND India)
   and practical strategies.

   Drop-in usage:
     import InTheirWorld from "./InTheirWorld";
     <InTheirWorld />
   ============================================================ */

/* Smoothly scroll a section into view by id — used by the module TOC and by
   the facts conveyor once it's cycled through everything. */
function scrollToId(id) {
  if (typeof document === "undefined") return;
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

const ACCENT_HEX = {
  landing: "59,130,246",
  autism: "59,130,246",
  adhd: "245,158,11",
  dyslexia: "30,117,93",
  speech: "140,66,44",
  dyscalculia: "29,133,133",
  dysgraphia: "178,89,40",
  auditory: "44,82,130",
  executive: "46,125,50",
};
const ACCENT_HEX_DARK = {
  landing: "86,210,177",
  autism: "86,210,177",
  adhd: "210,160,86",
  dyslexia: "52,211,153",
  speech: "210,115,86",
  dyscalculia: "77,208,225",
  dysgraphia: "255,138,101",
  auditory: "99,179,237",
  executive: "129,199,132",
};

/* ---------------- Error boundary ----------------
   A runtime error inside any one module (an unexpected component state, a
   malformed fact, whatever) used to blank the whole screen with no way
   back. This catches it at the module level and offers a way out instead. */
class ModuleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("In Their World — module crashed:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="itw-error-boundary">
          <div className="itw-error-icon" aria-hidden="true">⚠️</div>
          <h2>Something went wrong</h2>
          <p>This module hit an unexpected error. Your progress elsewhere is safe — head back and try again.</p>
          <button
            type="button"
            className="itw-btn-primary"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onBack?.();
            }}
          >
            ← Back to all modules
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ---------------- Settings context (sound) ---------------- */

const SettingsContext = createContext({ soundOn: false });

/* ---------------- Real media assets ----------------
   Sourced from the Hugging Face dataset at
   https://huggingface.co/datasets/anabaena/autism-profile-assets, but
   pulled down into public/sounds and public/videos at BUILD time (see
   scripts/fetch-assets.mjs + the "prebuild"/"predev" scripts in
   package.json) rather than fetched by the browser at runtime — a
   straight browser fetch to huggingface.co from another site was hanging
   indefinitely for some visitors, so the build now fetches once,
   server-side, and the deployed site serves everything same-origin. */

// Exact filename extension for each sound "kind", as uploaded to HF.
const SOUND_FILE_EXT = {
  announce: "mp3",
  argue: "mp3",
  bell: "mp3",
  buzzphone: "mp3",
  call: "mp3",
  crash: "mp3",
  flicker: "mp3",
  footsteps: "mp3",
  glare: "mp3",
  hum: "mp3",
  laugh: "mp3",
  rustle: "mp3",
  scrape: "mp3",
  screech: "mp3",
  shout: "mp3",
  slam: "mp3",
  tap: "mp3",
  tray: "mp3",
  whir: "mp3",
};

/* ---------------- Audio engine (Web Audio API) ----------------
   Every kind below has a synthesized fallback. Real recorded clips are
   served from /sounds/<kind>.<ext> (see SOUND_FILE_EXT for which kinds
   have one and what extension) — same-origin, fetched at build time as
   described above. A kind missing from that map, or a fetch that fails
   (file genuinely absent, offline), just falls back to the synthesized
   version below — nothing breaks either way. */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = false; // Off by default (explicit opt-in only)
    this.drones = new Map();
    this.loops = new Map();
    this.samples = new Map(); // kind -> decoded AudioBuffer, once loaded
    this.sampleMissing = new Set(); // kinds we've confirmed have no file
    this.samplePending = new Set(); // kinds currently being fetched
  }

  setEnabled(val) {
    this.enabled = Boolean(val);
    if (!this.enabled) {
      this.stopAll();
    } else if (this.master && this.ctx) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setValueAtTime(0.25, now);
    }
  }

  ensure() {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.25; // Master safety volume ceiling
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    // Restore master volume if previously ramped to near-zero by stopAll
    if (this.master && this.master.gain.value < 0.05) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setValueAtTime(0.25, now);
    }
    return this.ctx;
  }

  stopAll() {
    for (const id of Array.from(this.drones.keys())) {
      this.stopDrone(id);
    }
    if (this.loops) {
      for (const id of Array.from(this.loops.keys())) {
        this.stopLoop(id);
      }
    }
    if (this.master && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.master.gain.cancelScheduledValues(now);
        this.master.gain.setValueAtTime(0.0001, now);
      } catch {}
    }
  }

  setMasterGain(val, rampSec = 0.18) {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const now = ctx.currentTime;
    const target = Math.max(0.0001, Math.min(0.25, val));
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(target, now + Math.max(0.15, rampSec));
  }

  loadSample(kind) {
    if (this.samples.has(kind) || this.sampleMissing.has(kind) || this.samplePending.has(kind)) return;
    if (typeof window === "undefined") return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!this.ctx) {
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.25;
      this.master.connect(this.ctx.destination);
    }
    const ext = SOUND_FILE_EXT[kind];
    if (!ext) {
      this.sampleMissing.add(kind);
      return;
    }
    this.samplePending.add(kind);
    fetch(`/sounds/${kind}.${ext}`)
      .then((res) => {
        if (!res.ok) throw new Error("missing");
        return res.arrayBuffer();
      })
      .then((buf) => this.ctx.decodeAudioData(buf))
      .then((decoded) => {
        this.samples.set(kind, decoded);
        this.samplePending.delete(kind);
      })
      .catch(() => {
        this.sampleMissing.add(kind);
        this.samplePending.delete(kind);
      });
  }

  playSample(kind, gain = 1) {
    const ctx = this.ensure();
    if (!ctx) return false;
    const playBuf = (buffer) => {
      try {
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const g = ctx.createGain();
        const target = Math.max(0.08, Math.min(1.5, gain)) * 0.85;
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.linearRampToValueAtTime(target, ctx.currentTime + 0.04);
        src.connect(g);
        g.connect(this.master);
        src.start();
      } catch {}
    };

    const buffer = this.samples.get(kind);
    if (buffer) {
      playBuf(buffer);
      return true;
    }
    const ext = SOUND_FILE_EXT[kind] || "mp3";
    fetch(`/sounds/${kind}.${ext}`)
      .then((res) => (res.ok ? res.arrayBuffer() : null))
      .then((buf) => (buf ? ctx.decodeAudioData(buf) : null))
      .then((decoded) => {
        if (decoded) {
          this.samples.set(kind, decoded);
          playBuf(decoded);
        }
      })
      .catch(() => {});
    return true;
  }

  loopSample(id, kind, gain = 0.5) {
    const ctx = this.ensure();
    if (!ctx) return false;
    this.stopLoop(id);

    const playLoop = (buffer) => {
      try {
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        const g = ctx.createGain();
        const target = Math.max(0.05, Math.min(1.2, gain)) * 0.75;
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.linearRampToValueAtTime(target, ctx.currentTime + 0.15);
        src.connect(g);
        g.connect(this.master);
        src.start();
        if (!this.loops) this.loops = new Map();
        this.loops.set(id, { src, g });
      } catch {}
    };

    const buffer = this.samples.get(kind);
    if (buffer) {
      playLoop(buffer);
      return true;
    }

    const ext = SOUND_FILE_EXT[kind] || "mp3";
    fetch(`/sounds/${kind}.${ext}`)
      .then((res) => (res.ok ? res.arrayBuffer() : null))
      .then((buf) => (buf ? ctx.decodeAudioData(buf) : null))
      .then((decoded) => {
        if (decoded) {
          this.samples.set(kind, decoded);
          playLoop(decoded);
        }
      })
      .catch(() => {});
    return true;
  }

  stopLoop(id) {
    if (!this.loops || !this.loops.has(id)) return;
    const item = this.loops.get(id);
    try {
      if (this.ctx) {
        item.g.gain.setValueAtTime(item.g.gain.value, this.ctx.currentTime);
        item.g.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.15);
        setTimeout(() => {
          try { item.src.stop(); } catch {}
        }, 180);
      } else {
        item.src.stop();
      }
    } catch {}
    this.loops.delete(id);
  }

  tone({ freq = 440, type = "sine", duration = 0.2, gain = 0.14, detune = 0, delay = 0 } = {}) {
    const ctx = this.ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    g.gain.value = 0;
    osc.connect(g);
    g.connect(this.master);
    const start = ctx.currentTime + delay;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  sweep({ from = 800, to = 200, duration = 0.35, type = "sawtooth", gain = 0.12 } = {}) {
    const ctx = this.ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, to), ctx.currentTime + duration);
    g.gain.value = 0;
    osc.connect(g);
    g.connect(this.master);
    g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.05);
  }

  noiseBurst({ duration = 0.25, gain = 0.09, filterFreq = 1800, type = "bandpass" } = {}) {
    const ctx = this.ensure();
    if (!ctx) return;
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filt = ctx.createBiquadFilter();
    filt.type = type;
    filt.frequency.value = filterFreq;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(filt);
    filt.connect(g);
    g.connect(this.master);
    src.start();
  }

  startDrone(id, { freqs = [110, 165], type = "sawtooth" } = {}) {
    const ctx = this.ensure();
    if (!ctx || this.drones.has(id)) return;
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    g.connect(this.master);
    const oscs = freqs.map((f) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      o.connect(g);
      o.start();
      return o;
    });
    this.drones.set(id, { g, oscs });
  }

  setDroneGain(id, value) {
    const d = this.drones.get(id);
    if (!d) return;
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    d.g.gain.cancelScheduledValues(now);
    d.g.gain.setValueAtTime(d.g.gain.value, now);
    d.g.gain.linearRampToValueAtTime(Math.max(0.0001, value), now + 0.18);
  }

  stopDrone(id) {
    const d = this.drones.get(id);
    if (!d) return;
    const ctx = this.ctx;
    if (ctx) {
      const now = ctx.currentTime;
      d.g.gain.cancelScheduledValues(now);
      d.g.gain.setValueAtTime(d.g.gain.value, now);
      d.g.gain.linearRampToValueAtTime(0.0001, now + 0.18);
      setTimeout(() => {
        d.oscs.forEach((o) => {
          try {
            o.stop();
          } catch {}
        });
      }, 200);
    } else {
      d.oscs.forEach((o) => {
        try {
          o.stop();
        } catch {}
      });
    }
    this.drones.delete(id);
  }

  // A short, distinct sound tied to a *specific* sensory event (a chair
  // scraping, a laugh, a slammed door) rather than generic static — each
  // kind gets its own small signature built from the primitives above.
  // If a real recorded clip has been dropped into public/sounds/ for this
  // kind (see the loader above), that plays instead of the synthesis.
  cue(kind, gain = 1) {
    const g = Math.max(0.15, Math.min(1.4, gain));
    if (this.samples.has(kind)) {
      this.playSample(kind, g);
      return;
    }
    if (!this.sampleMissing.has(kind)) this.loadSample(kind);
    switch (kind) {
      case "laugh":
        this.tone({ freq: 500, type: "triangle", duration: 0.09, gain: 0.12 * g });
        this.tone({ freq: 640, type: "triangle", duration: 0.09, gain: 0.12 * g, delay: 0.1 });
        this.tone({ freq: 580, type: "triangle", duration: 0.13, gain: 0.11 * g, delay: 0.21 });
        break;
      case "bell":
        this.tone({ freq: 1050, type: "sine", duration: 0.35, gain: 0.14 * g });
        this.tone({ freq: 1050, type: "sine", duration: 0.3, gain: 0.1 * g, delay: 0.38 });
        break;
      case "scrape":
      case "screech":
        // A real scrape/screech is mostly noise, not a clean tone — layer a
        // filtered noise burst under the pitch sweep so it rasps instead of whistling.
        this.sweep({ from: 900, to: 2600, duration: 0.35, type: "sawtooth", gain: 0.09 * g });
        this.noiseBurst({ duration: 0.32, gain: 0.1 * g, filterFreq: 2000, type: "bandpass" });
        break;
      case "buzzphone":
        for (let i = 0; i < 5; i++) this.tone({ freq: 180, type: "square", duration: 0.05, gain: 0.07 * g, delay: i * 0.06 });
        break;
      case "slam":
        this.noiseBurst({ duration: 0.18, gain: 0.16 * g, filterFreq: 400, type: "lowpass" });
        break;
      case "crash":
        this.noiseBurst({ duration: 0.28, gain: 0.13 * g, filterFreq: 2600, type: "highpass" });
        break;
      case "shout":
        // Voice-like yelling: a noisy core plus two slightly-detuned tones
        // (rough stand-in for vocal formants) instead of one clean sawtooth.
        this.noiseBurst({ duration: 0.22, gain: 0.11 * g, filterFreq: 1400, type: "bandpass" });
        this.tone({ freq: 300, type: "sawtooth", duration: 0.24, gain: 0.09 * g, detune: -15, delay: 0.01 });
        this.tone({ freq: 340, type: "sawtooth", duration: 0.22, gain: 0.07 * g, detune: 20, delay: 0.03 });
        break;
      case "whir":
      case "hum":
        this.tone({ freq: 150, type: "sawtooth", duration: 0.5, gain: 0.06 * g });
        break;
      case "footsteps":
        this.tone({ freq: 90, type: "triangle", duration: 0.09, gain: 0.1 * g });
        this.tone({ freq: 90, type: "triangle", duration: 0.09, gain: 0.1 * g, delay: 0.28 });
        break;
      case "argue":
        // Two overlapping voices, not two clean beeps.
        this.noiseBurst({ duration: 0.16, gain: 0.06 * g, filterFreq: 1100, type: "bandpass" });
        this.tone({ freq: 340, type: "sawtooth", duration: 0.14, gain: 0.06 * g, detune: -10 });
        this.tone({ freq: 420, type: "sawtooth", duration: 0.14, gain: 0.06 * g, detune: 15, delay: 0.1 });
        break;
      case "rustle":
        this.noiseBurst({ duration: 0.14, gain: 0.05 * g, filterFreq: 3400, type: "highpass" });
        break;
      case "tray":
        this.noiseBurst({ duration: 0.3, gain: 0.14 * g, filterFreq: 2200, type: "bandpass" });
        break;
      case "tap":
        this.tone({ freq: 900, type: "square", duration: 0.03, gain: 0.06 * g });
        this.tone({ freq: 900, type: "square", duration: 0.03, gain: 0.06 * g, delay: 0.14 });
        break;
      case "call":
        this.tone({ freq: 500, type: "sine", duration: 0.18, gain: 0.1 * g });
        this.tone({ freq: 500, type: "sine", duration: 0.18, gain: 0.1 * g, delay: 0.35 });
        break;
      case "flicker":
        this.tone({ freq: 2200, type: "square", duration: 0.02, gain: 0.03 * g });
        this.tone({ freq: 2200, type: "square", duration: 0.02, gain: 0.03 * g, delay: 0.08 });
        break;
      // PA/tannoy-style announcement — starts low and climbs, rather than
      // the high-to-low "alarm" sweeps used elsewhere in this file.
      case "announce":
        this.sweep({ from: 220, to: 1500, duration: 0.6, type: "sine", gain: 0.09 * g });
        break;
      // A sudden glare (storefront glass, a camera flash, sun off a slide) —
      // paired in AutismSim with an actual full-screen bright flash.
      case "glare":
        this.tone({ freq: 1900, type: "sine", duration: 0.14, gain: 0.05 * g });
        break;
      case "bark":
        this.tone({ freq: 220, type: "sawtooth", duration: 0.08, gain: 0.12 * g });
        this.tone({ freq: 180, type: "sawtooth", duration: 0.09, gain: 0.1 * g, delay: 0.15 });
        break;
      default:
        this.noiseBurst({ duration: 0.15, gain: 0.08 * g });
    }
  }
}

const audio = new AudioEngine();

let cachedVoices = [];
if (typeof window !== "undefined" && window.speechSynthesis) {
  cachedVoices = window.speechSynthesis.getVoices() || [];
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices() || [];
  };
}

function findIndianVoice() {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = cachedVoices.length > 0 ? cachedVoices : (window.speechSynthesis.getVoices() || []);
  if (!voices || voices.length === 0) return null;

  // 1. Direct Indian English match: lang is en-IN or en_IN
  const inLang = voices.find((v) => {
    const l = (v.lang || "").toLowerCase().replace("_", "-");
    return l === "en-in" || l.startsWith("en-in");
  });
  if (inLang) return inLang;

  // 2. Specific Indian voice names (macOS Rishi/Lekha/Veena, Windows Heera/Ravi/Neerja, Android/Chrome)
  const indianKeywords = ["rishi", "lekha", "veena", "neerja", "heera", "ravi", "prabhat", "kavya", "geeta", "india", "indian"];
  const nameMatch = voices.find((v) => {
    const n = (v.name || "").toLowerCase();
    return indianKeywords.some((kw) => n.includes(kw));
  });
  if (nameMatch) return nameMatch;

  // 3. Fallback: English voice
  return voices.find((v) => {
    const l = (v.lang || "").toLowerCase();
    const n = (v.name || "").toLowerCase();
    return l.startsWith("en") && !n.includes("whisper");
  }) || voices[0];
}

function speakText(text, { rate = 1, pitch = 1, volume = 0.9 } = {}) {
  if (typeof window === "undefined" || !window.speechSynthesis || !text) return;
  try {
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-IN";
    u.rate = rate;
    u.pitch = pitch;
    u.volume = volume;
    const match = findIndianVoice();
    if (match) u.voice = match;
    window.speechSynthesis.speak(u);
  } catch {
    /* speech synthesis unavailable — visual/audio-tone feedback still works */
  }
}

/* ---------------- Landing ---------------- */

const MODULES = [
  {
    key: "autism",
    tag: "Sensory filtering",
    name: "Autism",
    sub: "Sensory Worlds",
    blurb: "Sensory processing, filtering, and why an everyday environment can feel overwhelming.",
    image: "/decor/itw/autism-environment.webp",
    statBig: "~1 in 100",
    statRest: "children under 10 in India (INCLEN Trust, PLOS Medicine)",
  },
  {
    key: "adhd",
    tag: "Attention regulation",
    name: "ADHD",
    sub: "A Mind With Too Many Open Tabs",
    blurb: "Holding focus on an assignment when competing pings, stray thoughts, and tabs pull equally.",
    image: "/decor/itw/adhd-workspace-scene.webp",
    statBig: "~6.3%–7.1%",
    statRest: "pooled prevalence, Indian children (Chauhan 2022, Joseph & Devu 2019)",
  },
  {
    key: "dyslexia",
    tag: "Reading & decoding",
    name: "Dyslexia",
    sub: "Words on Paper",
    blurb: "Decoding text when letter-sound translation requires intense, continuous mental effort.",
    image: "/decor/itw/dyslexia-environment.webp",
    statBig: "10–15%",
    statRest: "of Indian children, estimated dyslexic (Dyslexia Association of India)",
  },
  {
    key: "speech",
    tag: "Communication & timing",
    name: "Speech & Language",
    sub: "Finding the Words",
    blurb: "Knowing what you want to say while words take longer to formulate under social pressure.",
    image: "/decor/itw/communication-environment.webp",
    statBig: "~1 in 11",
    statRest: "at-risk children found to have one on evaluation (Indian rural screening study)",
  },
  {
    key: "dyscalculia",
    tag: "Numerical reasoning",
    name: "Dyscalculia",
    sub: "Do the Math",
    blurb: "Working with quantities, proportions, and mental math when numbers lack spatial anchors.",
    image: "/decor/itw/dyscalculia-environment.webp",
    statBig: "~5.6%–8.2%",
    statRest: "estimated prevalence in Indian school cohorts (Scaria et al., 2023 meta-analysis)",
  },
  {
    key: "dysgraphia",
    tag: "Motor & transcription",
    name: "Dysgraphia",
    sub: "Write It Down",
    blurb: "Translating rich, fluent thought into physical text when the motor transcription pathway is strained.",
    image: "/decor/itw/dysgraphia-environment.webp",
    statBig: "10%–14%",
    statRest: "of students with learning differences experience severe written expression barriers (Indian J Pediatr)",
  },
  {
    key: "auditory",
    tag: "Listening in noise",
    name: "Auditory Processing",
    sub: "Hear It Right",
    blurb: "Extracting critical verbal instructions in a noisy room where background sounds compete with speech.",
    image: "/decor/itw/auditory-processing-environment.webp",
    statBig: "~3%–5%",
    statRest: "of school-aged children experience Central Auditory Processing differences (Jerger & Musiek, AIISH)",
  },
  {
    key: "executive",
    tag: "Planning & sequencing",
    name: "Executive Functioning",
    sub: "Where Do I Start?",
    blurb: "Initiating, prioritizing, and sequencing multiple competing tasks when everything feels equally urgent.",
    image: "/decor/itw/executive-functioning-environment.webp",
    statBig: "30%–40%",
    statRest: "overlap with ADHD, autism & learning differences; affects working memory & initiation (Diamond, 2013)",
  },
];

const MODULE_ICONS = {
  autism: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 20c3-7 7-7 8 0s5 7 8 0 5-7 8 0 3 7 4 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  adhd: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="4.5" fill="currentColor" />
      <path d="M20 4v7M20 29v7M4 20h7M29 20h7M9 9l5 5M26 26l5 5M31 9l-5 5M14 26l-5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  ),
  dyslexia: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="7" y="27" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="22" fill="currentColor">b</text>
      <text x="20" y="27" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="22" fill="currentColor" transform="scale(-1,1) translate(-40,0)">b</text>
    </svg>
  ),
  speech: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 12a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H16l-6 6v-6a4 4 0 0 1-2-3.4V12Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M14 17h12M14 21h7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  ),
  dyscalculia: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="7" width="26" height="26" rx="6" stroke="currentColor" strokeWidth="2.4" />
      <path d="M14 15h12M20 11v8M14 26h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="20" cy="26" r="2" fill="currentColor" />
    </svg>
  ),
  dysgraphia: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 30l4.5-1.5L27 16l-3-3L11.5 25.5L10 30Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M7 33c4-1 9 1 13-1s7-3 13-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  auditory: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 20a12 12 0 0 1 24 0v4a5 5 0 0 1-5 5h-1a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3h6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 19h2a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  ),
  executive: (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="24" height="24" rx="5" stroke="currentColor" strokeWidth="2.2" />
      <path d="M13 15l2.5 2.5L20 13M23 15h4M13 22l2.5 2.5L20 20M23 22h4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const SOON_STORIES = [
  {
    key: "downsyndrome",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22v-9" />
        <path d="M9 8a5 5 0 0 1 8-3 5 5 0 0 1-5 8c-3 0-5-2-5-5a5 5 0 0 1 2-4" />
        <path d="M15 13a4 4 0 0 0-4-4" />
      </svg>
    ),
    name: "Down Syndrome & Developmental Pacing",
    sub: "Growing at My Own Pace",
    blurb: "An illustrated story celebrating Aarav's strengths, visual learning style, and everyday classroom milestones.",
    image: "/decor/itw/down-syndrome-story.webp",
    meta: "Interactive Story Experience",
    badge: "Illustrated Story",
  },
  {
    key: "dayineyes",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
        <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
        <path d="M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5" />
        <line x1="8" y1="10" x2="16" y2="10" />
      </svg>
    ),
    name: "A Day Through My Eyes",
    sub: "The Inclusive School Day Walkthrough",
    blurb: "Explore an everyday school day and switch between Sensory, Attention, Communication, and Supported Classroom lenses.",
    image: "/decor/itw/day-through-my-eyes.webp",
    meta: "Perspective Lens Exhibit",
    badge: "Perspective Lens",
  },
];

const HOW_STEPS = [
  { n: 1, title: "Choose an experience", text: "Select a topic to explore." },
  { n: 2, title: "Try the activity", text: "Engage with a short, everyday classroom scenario." },
  { n: 3, title: "Understand what it may mean", text: "See key insights and ways to support." },
];

const INTRO_VIGNETTES = {
  autism: { src: "/decor/itw/autism-sticker.webp", label: "Sensory Processing in Real Life" },
  adhd: { src: "/decor/itw/adhd-sticker.webp", label: "A Mind With Dynamic Currents" },
  dyslexia: { src: "/decor/itw/dyslexia-sticker.webp", label: "Phonological Decoding & Fluency" },
  speech: { src: "/decor/itw/speech-sticker.webp", label: "Expressive Communication & AAC" },
  dyscalculia: { src: "/decor/itw/dyscalculia-sticker.webp", label: "Visual Number Sense & Magnitude" },
  dysgraphia: { src: "/decor/itw/dysgraphia-sticker.webp", label: "Graphomotor Pathway & Expression" },
  auditory: { src: "/decor/itw/auditory-sticker.webp", label: "Classroom Acoustic Perception" },
  executive: { src: "/decor/itw/executive-sticker.webp", label: "Working Memory & Initiation" },
};

function IntroVignette({ moduleKey }) {
  const item = INTRO_VIGNETTES[moduleKey] || INTRO_VIGNETTES.autism;
  return (
    <div className="itw-flow-sticker-panel" aria-hidden="true">
      <div className="itw-flow-sticker-glow" />
      <img src={item.src} alt="" className="itw-flow-sticker-img" loading="eager" />
      <span className="itw-flow-sticker-badge">{item.label}</span>
    </div>
  );
}

function SoonCard({ c, onSelect }) {
  return (
    <button
      type="button"
      className="itw-mcard itw-story-card"
      data-m={c.key}
      onClick={() => onSelect && onSelect(c.key)}
      style={{ textAlign: "left" }}
    >
      <div className="itw-mcard-banner-wrap">
        <img src={c.image} alt="" className="itw-mcard-banner" loading="lazy" decoding="async" />
        <span className="itw-mcard-status-pill">{c.badge || "Story"}</span>
      </div>
      <div className="itw-mcard-body">
        <div className="itw-mcard-top">
          <div className="itw-mcard-icon" aria-hidden="true">{c.icon}</div>
          <div>
            <div className="itw-tag" style={{ background: "var(--itw-autism-soft)", color: "var(--itw-autism)" }}>
              {c.badge || "Interactive"}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--itw-muted)", marginTop: 2 }}>{c.sub}</div>
          </div>
        </div>
        <h3>{c.name}</h3>
        <p>{c.blurb}</p>
        <div className="itw-soon-meta" style={{ color: "var(--itw-accent)", fontWeight: 700 }}>
          {c.meta} →
        </div>
      </div>
    </button>
  );
}

function Landing({ onSelect }) {
  const pick = (keys) => keys.map((k) => MODULES.find((m) => m.key === k)).filter(Boolean);
  const renderCard = (m) => (
    <button key={m.key} className="itw-mcard" data-m={m.key} onClick={() => onSelect(m.key)}>
      <div className="itw-mcard-banner-wrap">
        <img src={m.image} alt="" className="itw-mcard-banner" loading="lazy" decoding="async" />
        <span className="itw-mcard-status-pill">Interactive</span>
      </div>
      <div className="itw-mcard-body">
        <div className="itw-mcard-top">
          <div className="itw-mcard-icon">{MODULE_ICONS[m.key]}</div>
          <div>
            <div className="itw-tag">{m.tag}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--itw-muted)", marginTop: 2 }}>{m.sub}</div>
          </div>
        </div>
        <h3>{m.name}</h3>
        <p>{m.blurb}</p>
        <div className="itw-mcard-bottom">
          <div className="itw-enter">
            Explore Experience
            <svg viewBox="0 0 20 20" fill="none"><path d="M4 10h11M10 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
      </div>
    </button>
  );

  return (
    <section className="itw-view">
      <div className="itw-blob itw-blob-1" />
      <div className="itw-blob itw-blob-2" />
      <div className="itw-blob itw-blob-3" />

      <div className="itw-hero">
        <div className="itw-masthead">
          <div className="itw-eyebrow itw-rise itw-rise-1">Learning Differences &amp; Accommodations</div>
          <h1 className="itw-title itw-rise itw-rise-2">
            In Their <span className="itw-accent-word">World<svg className="itw-squiggle" viewBox="0 0 160 14" preserveAspectRatio="none"><path d="M2 9c14-10 26-10 40 0s26 10 40 0 26-10 40 0 26 10 36 2" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/></svg></span>:<br />Barriers &amp; Supports.
          </h1>
          <p className="itw-lede itw-rise itw-rise-3">
            Some learning differences are difficult to see from the outside. Interactive
            perspectives explore task demands, environmental friction, and practical supports across reading,
            focus, sensory filtering, and communication access — each one paired with Indian data
            and actionable accommodations you can use right away.
          </p>
          <div className="itw-hero-actions itw-rise itw-rise-4">
            <button className="itw-cta itw-cta-dark" onClick={() => scrollToId("itw-choose")}>Explore Experiences &amp; Supports</button>
          </div>
          <div className="itw-disclaimer itw-rise itw-rise-4">
            <strong>Important:</strong> These interactive activities explore task demands, classroom barriers, and accommodations — they do not diagnose, simulate, or recreate an individual's lived experience.
          </div>
        </div>
        <aside className="itw-hero-card itw-rise itw-rise-3" aria-hidden="true">
          <picture>
            <source srcSet="/decor/itw/hero-world.webp" type="image/webp" />
            <img src="/decor/itw/hero-world.webp" alt="Inclusive, supportive learning landscape" loading="eager" decoding="async" />
          </picture>
          <p>Understanding is the first step towards meaningful support.</p>
        </aside>
      </div>

      <section className="itw-sec itw-rise itw-rise-5" id="itw-choose">
        <div className="itw-sec-head">
          <h2>Choose an Experience</h2>
          <p>Explore a short interactive activity and see an everyday task from a different perspective.</p>
        </div>
        <div className="itw-group-label">Sensory &amp; Attentional Landscapes</div>
        <div className="itw-editorial-grid">
          {pick(["autism", "adhd", "dyslexia", "speech"]).map(renderCard)}
        </div>
        <div className="itw-group-label">Learning &amp; Executive Scaffolding</div>
        <div className="itw-editorial-grid">
          {pick(["dyscalculia", "dysgraphia", "auditory", "executive"]).map(renderCard)}
        </div>
        <div className="itw-group-label">Stories &amp; Perspectives</div>
        <div className="itw-cardgrid">
          {SOON_STORIES.map((c) => <SoonCard key={c.key} c={c} onSelect={onSelect} />)}
        </div>
      </section>

      <section className="itw-sec itw-rise itw-rise-5">
        <div className="itw-sec-head"><h2>How It Works</h2></div>
        <div className="itw-how">
          {HOW_STEPS.map((s) => (
            <div className="itw-how-step" key={s.n}>
              <span className="itw-how-num">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="itw-sec itw-why itw-rise itw-rise-5">
        <h2>Why This Matters</h2>
        <p>
          Children are often judged by what adults can see. Understanding what may be happening
          underneath the behaviour is the first step towards meaningful support, empathy and growth.
        </p>
      </section>

      <AboutBlock />

      <section className="itw-sec itw-endcta">
        <div>
          <h2>Understanding is the first step.<br />Clarity comes next.</h2>
          <p>Explore assessments and expert support at MANAS Learning.</p>
        </div>
        <div className="itw-hero-actions">
          <a className="itw-cta itw-cta-dark" href="/assessments">Take an Assessment</a>
          <a className="itw-cta itw-cta-line" href="/consult">Book an Expert Consultation</a>
        </div>
      </section>

      <div className="itw-foot-note">
        Built to explore environmental barriers and inclusive accommodations, not to diagnose. Figures are drawn from peer-reviewed Indian epidemiological studies and official frameworks.
      </div>
    </section>
  );
}

function AboutBlock() {
  return (
    <div className="itw-about itw-rise itw-rise-5">
      <div className="itw-about-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 21s-7.5-4.6-10-9.3C.4 8 2 4.5 5.6 4a5 5 0 0 1 6.4 2 5 5 0 0 1 6.4-2C22 4.5 23.6 8 22 11.7 19.5 16.4 12 21 12 21Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>
      </div>
      <div>
        <h3>About In Their World</h3>
        <p>
          Reading a diagnostic checklist about autism, ADHD, dyslexia, or speech/language differences tells you
          clinical terms — it does not always show how classroom environments and task demands create friction.
          In Their World provides interactive perspectives exploring environmental barriers, task design, and
          practical accommodations across attention, sensory processing, reading decoding, mathematical representation,
          and communication access.
        </p>
        <p>
          The data behind each module is grounded in Indian pediatric and educational contexts. Rather than relying solely
          on imported prevalence statistics, figures here reflect Indian clinical and epidemiological research,
          exam board frameworks, and the Rights of Persons with Disabilities (RPwD) Act 2016.
        </p>
        <ul className="itw-about-points">
          <li>
            <b>Explore Task Demands</b>
            Interactive perspectives examine how environment, pacing, and representation shape learning.
          </li>
          <li>
            <b>See the Data</b>
            Carefully cited Indian epidemiological and clinical context with clear denominators.
          </li>
          <li>
            <b>Know What Helps</b>
            Concrete, evidence-based accommodations for home and classroom, from visual horizons to multi-modal AAC.
          </li>
        </ul>
        <p className="itw-brand-echo">EveryChildLearnsDifferently.</p>
        <p>
          Made by <a href="https://www.manaslearning.com" target="_blank" rel="noreferrer">Manas Learning</a>,
          for the parents and teachers who want a starting point, not a stereotype.
        </p>
      </div>
    </div>
  );
}

/* ---------------- Shared module shell ---------------- */

function SettingsBar({ soundOn, setSoundOn, darkMode, setDarkMode }) {
  return (
    <div className="itw-settings-bar">
      <button
        type="button"
        className={`itw-toggle-btn itw-theme-toggle${darkMode ? " itw-active itw-dark-active" : ""}`}
        aria-pressed={darkMode}
        onClick={() => setDarkMode((v) => !v)}
        title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {darkMode ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ verticalAlign: "-2px", marginRight: 6 }}>
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
            <span>Light mode</span>
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ verticalAlign: "-2px", marginRight: 6 }}>
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
            <span>Dark mode</span>
          </>
        )}
      </button>
      <button
        type="button"
        className={`itw-toggle-btn itw-sound-toggle${soundOn ? " itw-active" : ""}`}
        aria-pressed={soundOn}
        onClick={() => setSoundOn((v) => !v)}
        title={soundOn ? "Mute audio" : "Enable audio"}
      >
        {soundOn ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ verticalAlign: "-2px", marginRight: 6 }}>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
            <span>Sound on</span>
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: "-2px", marginRight: 5 }}>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
            <span>Sound off</span>
          </>
        )}
      </button>
    </div>
  );
}

function StrategyTabs({ home, classroom }) {
  const [tab, setTab] = useState("home");
  return (
    <>
      <div className="itw-strat-tabs itw-print-hide">
        <button
          className={`itw-btn-ghost${tab === "home" ? " itw-active" : ""}`}
          onClick={() => setTab("home")}
        >
          At home
        </button>
        <button
          className={`itw-btn-ghost${tab === "class" ? " itw-active" : ""}`}
          onClick={() => setTab("class")}
        >
          In the classroom
        </button>
      </div>
      {/* Both lists stay in the DOM (not conditionally rendered) so the print
          stylesheet can reveal both regardless of which tab is active on screen. */}
      <ul className={`itw-strat-list${tab === "home" ? "" : " itw-strat-hidden"}`} data-print-label="At home">
        {home.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      <ul className={`itw-strat-list${tab === "class" ? "" : " itw-strat-hidden"}`} data-print-label="In the classroom">
        {classroom.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </>
  );
}

/* Print button + a quiet, non-pushy link to Manas Learning's actual
   services — shown once per module, right after the strategies. */
function HelpFooter() {
  return (
    <div className="itw-help-footer itw-print-hide">
      <button type="button" className="itw-btn-ghost itw-print-btn" onClick={() => window.print()}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: "-2px", marginRight: 6 }}>
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        <span>Print these strategies</span>
      </button>
      <a className="itw-manas-cta" href="https://www.manaslearning.com" target="_blank" rel="noreferrer">
        <span>If this felt familiar, Manas Learning works with kids like this every day.</span>
        <span className="itw-manas-cta-arrow">Learn more →</span>
      </a>
    </div>
  );
}

/* A conveyor belt of facts: one at a time, popping in big and bright, then
   sliding off to make way for the next. Cycles through the whole set once
   and fires onComplete — used to auto-scroll down to "how you can help". */
function FactsConveyor({ facts, onComplete }) {
  const { soundOn } = useContext(SettingsContext);
  const [idx, setIdx] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [tapPaused, setTapPaused] = useState(false); // touch has no hover, so tapping the card toggles this instead
  const paused = hoverPaused || tapPaused;
  const completedRef = useRef(false);
  // Facts used to start reading themselves aloud the instant this section
  // mounted — which happens as soon as the module loads, well before
  // anyone has scrolled down to "The data". Gate speech on the section
  // actually being visible instead.
  const [inView, setInView] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Reset only when the actual fact set changes (e.g. US/India toggle) —
  // not on every unrelated re-render, since the facts array is a fresh
  // literal each time the parent renders.
  const factsKey = facts.map((f) => f.num).join("|");
  useEffect(() => {
    completedRef.current = false;
    queueMicrotask(() => {
      setTapPaused(false);
      setIdx(0);
    });
  }, [factsKey]);

  const handleEnd = () => {
    if (paused) return;
    if (idx === facts.length - 1) {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
      setIdx(0);
    } else {
      setIdx((i) => i + 1);
    }
  };

  const jump = (i) => {
    completedRef.current = true; // manual browsing shouldn't re-trigger the auto-scroll
    setIdx(i);
  };
  const prev = () => jump((idx - 1 + facts.length) % facts.length);
  const next = () => jump((idx + 1) % facts.length);
  const toggleTapPause = () => setTapPaused((v) => !v);

  const f = facts[idx];

  return (
    <div
      className="itw-conveyor"
      ref={containerRef}
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
    >
      <button
        type="button"
        className="itw-conveyor-arrow itw-conveyor-arrow-prev"
        aria-label="Previous fact"
        onClick={prev}
      >
        <svg viewBox="0 0 20 20" fill="none"><path d="M12 4 6 10l6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <div
        className="itw-conveyor-track"
        role="button"
        tabIndex={0}
        aria-pressed={tapPaused}
        aria-label={tapPaused ? "Resume auto-advancing facts" : "Pause auto-advancing facts"}
        onClick={toggleTapPause}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), toggleTapPause())}
      >
        <div
          key={idx}
          className={`itw-conveyor-card${paused ? " itw-conveyor-paused" : ""}`}
          onAnimationEnd={handleEnd}
        >
          <div className="itw-conveyor-num">{f.num}</div>
          <div className="itw-conveyor-lbl">{f.label}</div>
          <div className="itw-conveyor-src">{f.src}</div>
        </div>
        {tapPaused && (
          <div className="itw-conveyor-paused-badge" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="none"><rect x="5" y="4" width="3.4" height="12" rx="1" fill="currentColor"/><rect x="11.6" y="4" width="3.4" height="12" rx="1" fill="currentColor"/></svg>
            paused — tap to resume
          </div>
        )}
      </div>
      <button
        type="button"
        className="itw-conveyor-arrow itw-conveyor-arrow-next"
        aria-label="Next fact"
        onClick={next}
      >
        <svg viewBox="0 0 20 20" fill="none"><path d="M8 4l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <div className="itw-conveyor-dots">
        {facts.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Show fact ${i + 1} of ${facts.length}`}
            className={i === idx ? "itw-active" : ""}
            onClick={() => jump(i)}
          />
        ))}
      </div>
    </div>
  );
}

function FactsGrid({ facts, note, onComplete }) {
  useEffect(() => {
    onComplete?.();
  }, [onComplete]);

  return (
    <div className="itw-facts-section">
      <div className="itw-facts-grid">
        {facts.map((item, i) => (
          <div key={i} className="itw-fact-card-static">
            <div className="itw-fact-card-num">{item.num}</div>
            <div className="itw-fact-card-lbl">{item.label}</div>
            {item.src && <div className="itw-fact-card-src">{item.src}</div>}
          </div>
        ))}
      </div>
      {note && <p className="itw-fact-note">{note}</p>}
    </div>
  );
}

/* ---------------- Viewfinder (signature element — experiential viewport,
   with a live HUD readout, wraps every activity stage) ---------------- */

function Viewfinder({ hud, stageStyle, children }) {
  return (
    <div className="itw-viewfinder">
      <div className="itw-viewfinder-stage itw-sim-stage" style={stageStyle}>
        <div className="itw-vf-corner itw-vf-tl" />
        <div className="itw-vf-corner itw-vf-tr" />
        <div className="itw-vf-corner itw-vf-bl" />
        <div className="itw-vf-corner itw-vf-br" />
        <div className="itw-viewfinder-hud">
          <span className="itw-hud-rec">
            <span className="itw-hud-dot" />
            {(hud && hud.left) || "Take your time"}
          </span>
          <span>{(hud && hud.right) || ""}</span>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ================= AUTISM: Sensory Processing & Environmental Accommodations ================= */

// Concrete sensory events, each with its own icon and its own synthesized
// sound (see AudioEngine.cue) — this is what's actually competing for
// attention, not abstract static. Grouped by real-world setting: a mall,
// a school classroom, and a grocery store each throw a different mix of
// noise, light and crowding at a child.
const SCENARIOS = {
  mall: {
    label: "Shopping mall",
    tag: "Busiest — recommended",
    desc: "Bright showroom lights, music overhead, a food-court hum, AC blasting cold air on your neck.",
    bg:
      "radial-gradient(120% 130% at 50% 0%, rgba(255,255,255,.65), transparent 62%), linear-gradient(165deg, #fff7e2, #ffdf9e)",
    events: [
      { text: "PA announcement crackles overhead", icon: "📢", kind: "announce" },
      { text: "escalator humming non-stop", icon: "🔺", kind: "hum" },
      { text: "food court clatter", icon: "🍜", kind: "tray" },
      { text: "AC vent blasting cold air", icon: "❄️", kind: "whir" },
      { text: "storefront glass glaring", icon: "✨", kind: "glare" },
      { text: "a kid crying near the toy shop", icon: "😭", kind: "shout" },
      { text: "trolley wheels squeaking", icon: "🛒", kind: "screech" },
      { text: "sale bell ringing", icon: "🔔", kind: "bell" },
      { text: "crowd chatter swelling", icon: "🗣️", kind: "argue" },
      { text: "a phone flash goes off", icon: "📸", kind: "glare" },
      { text: "elevator ding", icon: "🛗", kind: "call" },
      { text: "your name, called over the noise", icon: "🙋", kind: "call" },
    ],
  },
  school: {
    label: "School classroom",
    desc: "Chairs scraping, chalk squeaking, a bell about to go off, someone talking right over you.",
    bg:
      "radial-gradient(120% 130% at 50% 0%, rgba(255,255,255,.6), transparent 62%), linear-gradient(165deg, #fff0f0, #ffd9d9)",
    events: [
      { text: "chair scraping", icon: "🪑", kind: "scrape" },
      { text: "someone's laughing", icon: "😄", kind: "laugh" },
      { text: "the light is humming", icon: "💡", kind: "hum" },
      { text: "bell in 3...2...", icon: "🔔", kind: "bell" },
      { text: "LOOK AT ME WHEN I TALK", icon: "📢", kind: "shout" },
      { text: "the fan is loud", icon: "🌀", kind: "whir" },
      { text: "papers rustling", icon: "📄", kind: "rustle" },
      { text: "someone dropped a tray", icon: "🍽️", kind: "tray" },
      { text: "someone's phone buzzing", icon: "📳", kind: "buzzphone" },
      { text: "footsteps behind you", icon: "👣", kind: "footsteps" },
      { text: "chalk squeaking", icon: "✏️", kind: "screech" },
      { text: "two kids arguing", icon: "🗣️", kind: "argue" },
      { text: "door slamming", icon: "🚪", kind: "slam" },
      { text: "your name, called twice", icon: "🙋", kind: "call" },
      { text: "fluorescent flicker", icon: "💡", kind: "flicker" },
      { text: "pencil tapping", icon: "✏️", kind: "tap" },
    ],
  },
  grocery: {
    label: "Grocery store",
    desc: "Fluorescent aisles, a freezer hum, trolleys clanging, a billing counter beeping.",
    bg:
      "radial-gradient(120% 130% at 50% 0%, rgba(255,255,255,.6), transparent 62%), linear-gradient(165deg, #f0f9ff, #cdeafd)",
    events: [
      { text: "checkout beeping, again and again", icon: "🛍️", kind: "tap" },
      { text: "freezer aisle humming", icon: "🧊", kind: "hum" },
      { text: "trolley wheels clanging", icon: "🛒", kind: "screech" },
      { text: "aisle tube-light flickering", icon: "💡", kind: "glare" },
      { text: "a shelf gets knocked over", icon: "🥫", kind: "crash" },
      { text: "billing queue murmuring", icon: "🗣️", kind: "argue" },
      { text: "cardboard boxes being stacked", icon: "📦", kind: "tray" },
      { text: "weighing scale beeping", icon: "⚖️", kind: "tap" },
      { text: "\"today's offer\" announcement", icon: "📢", kind: "announce" },
      { text: "a trolley bumps into you", icon: "🛒", kind: "slam" },
    ],
  },
};

// Real background footage per setting, played on loop, cycling through the
// clip list — served from /videos/<scenario>/<n>.mp4, same-origin (see the
// build-time fetch note above). Missing/broken files just fall back to
// the plain SCENARIOS[x].bg color.
const VIDEO_SCENES = {
  mall: ["/videos/mall/1.mp4", "/videos/mall/2.mp4"],
  school: ["/videos/school/1.mp4", "/videos/school/2.mp4", "/videos/school/3.mp4"],
  grocery: ["/videos/grocery/1.mp4"],
};

const AUTISM_ROUNDS = 3;
const AUTISM_ROUND_LIMIT = 5.5;

const AUTISM_STEPS = [
  { key: "instructions", label: "Instructions" },
  { key: "scenario", label: "Setting & Baseline" },
  { key: "run_unfiltered", label: "Run 1 (Unfiltered)" },
  { key: "reflect", label: "Reflect & Compare" },
  { key: "support", label: "Support Experiment" },
  { key: "explain", label: "Understanding & Action" },
];

const AUTISM_STEP_INDEX = {
  instructions: 0,
  scenario: 1,
  run_unfiltered: 2,
  reflect: 3,
  support: 4,
  run_supported: 4,
  explain: 5,
  next: 5,
};

const AUTISM_REFLECT_QS = [
  {
    q: "During the unfiltered observation, where did you notice the sensory friction?",
    options: [
      "The overlapping visual cues and background noise made it hard to isolate the target.",
      "Filtering out the decoys required conscious effort and mental stamina on every second.",
      "I felt an urge to look away or turn the brightness/volume down immediately.",
      "The time limit added extra tension on top of the competing sensory inputs.",
    ],
  },
];

const AUTISM_SUPPORT_CHOICES = [
  {
    id: "ear_defenders",
    title: "Sensory Ear Defenders / Noise Reduction",
    subtitle: "In-app audio volume reduction",
    desc: "Reduces the volume of synthetic audio cues in this exercise to illustrate the relief of lowering sensory intensity. Note: In-app software volume reduction is not equivalent to physical acoustic ear defenders or active noise-cancelling headphones.",
    tag: "Auditory Scaffolding",
  },
  {
    id: "visual_calm",
    title: "Visual Declutter / Focus Zone",
    subtitle: "Dim ambient motion & non-essential decoys",
    desc: "Reduces visual clutter, eliminates glare spikes, and lowers the number of competing decoys in the scene.",
    tag: "Visual Accommodation",
  },
  {
    id: "quiet_corner",
    title: "Predictable Quiet Reset Space",
    subtitle: "Support package: soft indirect lighting & unhurried pacing",
    desc: "Provides a holistic environmental reset combining reduced competing stimuli, softer ambient lighting, and relaxed response time.",
    tag: "Environmental Reset",
  },
];

function AutismSim({
  mode = "unfiltered",
  supportType = null,
  scenario = "mall",
  perspective = "central",
  onComplete,
  onAbort,
}) {
  const { soundOn } = useContext(SettingsContext);
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const [autismSoundOn, setAutismSoundOn] = useState(false);
  const [autismVolume, setAutismVolume] = useState(0.08);
  const effectiveSoundOn = soundOn && autismSoundOn && (supportType !== "ear_defenders");
  const [paused, setPaused] = useState(false);
  const [round, setRound] = useState(1);
  const [targetPos, setTargetPos] = useState({ top: 50, left: 50 });
  const [decoys, setDecoys] = useState([]);
  const [timeLeft, setTimeLeft] = useState(AUTISM_ROUND_LIMIT);
  const [flicker, setFlicker] = useState(false);

  const videoRef = useRef(null);
  const [videoIdx, setVideoIdx] = useState(0);
  const [videoFailCount, setVideoFailCount] = useState(0);

  const roundStartRef = useRef(0);
  const pausedTimeRef = useRef(0);
  const timeAccRef = useRef(0);
  const missesRef = useRef(0);
  const timeoutsRef = useRef(0);
  const decoyIdRef = useRef(0);
  const timerIntervalRef = useRef(null);
  const flickerTimeoutRef = useRef(null);
  const cuesTimeoutRef = useRef([]);
  const setupRoundRef = useRef(null);
  const handleRoundFinishedRef = useRef(null);

  const [cues, setCues] = useState([]);
  const cueIdRef = useRef(0);

  const sceneVideos = VIDEO_SCENES[scenario] || [];
  const advanceVideo = () => {
    setVideoIdx((i) => (i + 1) % Math.max(1, sceneVideos.length));
  };
  const handleVideoError = () => {
    setVideoFailCount((c) => c + 1);
    advanceVideo();
  };
  const videoBroken = sceneVideos.length === 0 || videoFailCount >= sceneVideos.length;

  useEffect(() => {
    if (!videoRef.current) return;
    if (effectsEnabled && !paused && supportType !== "visual_calm") {
      videoRef.current.play?.().catch(() => {});
    } else {
      videoRef.current.pause?.();
    }
  }, [effectsEnabled, videoIdx, scenario, paused, supportType]);

  useEffect(() => {
    if (effectiveSoundOn) {
      audio.setMasterGain(supportType === "ear_defenders" ? 0.02 : autismVolume, 0.18);
    }
  }, [effectiveSoundOn, autismVolume, supportType]);

  useEffect(() => {
    if (!effectiveSoundOn || paused) {
      audio.stopDrone("autism");
      return;
    }
    audio.startDrone("autism", { freqs: [98, 147, 201, 302], type: "sawtooth" });
    audio.setDroneGain("autism", supportType === "ear_defenders" ? 0.005 : autismVolume * 0.4);
    return () => audio.stopDrone("autism");
  }, [effectiveSoundOn, paused, supportType, autismVolume]);

  const clearTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const clearAllCues = () => {
    cuesTimeoutRef.current.forEach(clearTimeout);
    cuesTimeoutRef.current = [];
  };

  useEffect(() => {
    return () => {
      clearTimer();
      clearAllCues();
      clearTimeout(flickerTimeoutRef.current);
      audio.stopDrone("autism");
    };
  }, []);

  const randPos = (avoid) => {
    let top, left, ok;
    do {
      top = 10 + Math.random() * 70;
      left = 8 + Math.random() * 76;
      ok = true;
      for (const p of avoid) {
        if (Math.abs(p.top - top) < 15 && Math.abs(p.left - left) < 15) ok = false;
      }
    } while (!ok);
    return { top, left };
  };

  const randPosEdge = (avoid) => {
    let top, left, ok;
    do {
      const edge = Math.floor(Math.random() * 4);
      if (edge === 0) {
        top = 6 + Math.random() * 10;
        left = 8 + Math.random() * 76;
      } else if (edge === 1) {
        top = 76 + Math.random() * 12;
        left = 8 + Math.random() * 76;
      } else if (edge === 2) {
        top = 22 + Math.random() * 52;
        left = 5 + Math.random() * 9;
      } else {
        top = 22 + Math.random() * 52;
        left = 82 + Math.random() * 9;
      }
      ok = true;
      for (const p of avoid) {
        if (Math.abs(p.top - top) < 14 && Math.abs(p.left - left) < 14) ok = false;
      }
    } while (!ok);
    return { top, left };
  };

  const nextPos = (avoid) => (perspective === "peripheral" ? randPosEdge(avoid) : randPos(avoid));

  const spawnCues = () => {
    clearAllCues();
    if (supportType === "quiet_corner" || paused) return;
    const pool = SCENARIOS[scenario].events;
    const spawn = () => {
      if (paused) return;
      const evt = pool[Math.floor(Math.random() * pool.length)];
      const id = cueIdRef.current++;
      const top = 10 + Math.random() * 70;
      const left = 6 + Math.random() * 76;
      setCues((prev) => [...prev.slice(-4), { id, ...evt, top, left }]);
      if (effectiveSoundOn && supportType !== "ear_defenders") {
        audio.cue(evt.kind, 0.45);
      }
      if (effectsEnabled && supportType !== "visual_calm" && (evt.kind === "glare" || evt.kind === "flicker")) {
        setFlicker(true);
        clearTimeout(flickerTimeoutRef.current);
        flickerTimeoutRef.current = setTimeout(() => setFlicker(false), 450);
      }
      const life = setTimeout(() => {
        setCues((prev) => prev.filter((c) => c.id !== id));
      }, 1600);
      const delay = supportType === "visual_calm" ? 2200 : 950 + Math.random() * 450;
      const next = setTimeout(spawn, delay);
      cuesTimeoutRef.current.push(life, next);
    };
    const kick = setTimeout(spawn, 300);
    cuesTimeoutRef.current.push(kick);
  };

  const setupRound = (rNum) => {
    clearTimer();
    const t = nextPos([]);
    const decoyCount = supportType === "visual_calm" ? 1 : rNum >= 3 ? 3 : 2;
    const avoid = [t];
    const nd = [];
    for (let i = 0; i < decoyCount; i++) {
      const p = nextPos(avoid);
      avoid.push(p);
      nd.push({ id: decoyIdRef.current++, ...p });
    }
    setTargetPos(t);
    setDecoys(nd);

    const limit = supportType === "quiet_corner" ? 7.5 : AUTISM_ROUND_LIMIT;
    setTimeLeft(limit);
    roundStartRef.current = performance.now();

    timerIntervalRef.current = setInterval(() => {
      const elapsed = (performance.now() - roundStartRef.current) / 1000;
      const remaining = limit - elapsed;
      if (remaining <= 0) {
        setTimeLeft(0);
        clearTimer();
        timeoutsRef.current += 1;
        timeAccRef.current += limit;
        if (effectiveSoundOn) audio.sweep({ from: 260, to: 110, duration: 0.25, type: "sawtooth", gain: 0.06 });
        handleRoundFinishedRef.current?.(rNum);
      } else {
        setTimeLeft(remaining);
      }
    }, 70);

    spawnCues();
  };

  const handleRoundFinished = (finishedRound) => {
    if (finishedRound >= AUTISM_ROUNDS) {
      clearTimer();
      clearAllCues();
      audio.stopDrone("autism");
      onComplete?.({
        time: timeAccRef.current,
        misses: missesRef.current,
        timeouts: timeoutsRef.current,
        rounds: AUTISM_ROUNDS,
      });
    } else {
      const next = finishedRound + 1;
      setRound(next);
      setupRound(next);
    }
  };

  useEffect(() => {
    setupRoundRef.current = setupRound;
    handleRoundFinishedRef.current = handleRoundFinished;
  });

  useEffect(() => {
    timeAccRef.current = 0;
    missesRef.current = 0;
    timeoutsRef.current = 0;
    queueMicrotask(() => {
      setRound(1);
      setupRoundRef.current?.(1);
    });
    return () => {
      clearTimer();
      clearAllCues();
    };
  }, [mode, supportType, scenario, perspective]);

  const clickTarget = () => {
    if (paused) return;
    const elapsed = (performance.now() - roundStartRef.current) / 1000;
    timeAccRef.current += elapsed;
    clearTimer();
    if (effectiveSoundOn) audio.tone({ freq: 620, type: "sine", duration: 0.15, gain: 0.1 });
    handleRoundFinished(round);
  };

  const clickDecoy = () => {
    if (paused) return;
    missesRef.current += 1;
    if (effectiveSoundOn) audio.sweep({ from: 440, to: 160, duration: 0.18, type: "sawtooth", gain: 0.07 });
  };

  const togglePause = () => {
    if (!paused) {
      clearTimer();
      clearAllCues();
      pausedTimeRef.current = performance.now();
      setPaused(true);
      audio.stopDrone("autism");
    } else {
      const pauseDuration = performance.now() - pausedTimeRef.current;
      roundStartRef.current += pauseDuration;
      setPaused(false);
      const limit = supportType === "quiet_corner" ? 7.5 : AUTISM_ROUND_LIMIT;
      timerIntervalRef.current = setInterval(() => {
        const elapsed = (performance.now() - roundStartRef.current) / 1000;
        const remaining = limit - elapsed;
        if (remaining <= 0) {
          setTimeLeft(0);
          clearTimer();
          timeoutsRef.current += 1;
          timeAccRef.current += limit;
          handleRoundFinished(round);
        } else {
          setTimeLeft(remaining);
        }
      }, 70);
      spawnCues();
    }
  };

  const roundLimit = supportType === "quiet_corner" ? 7.5 : AUTISM_ROUND_LIMIT;
  const timerPct = Math.max(0, Math.min(100, (timeLeft / roundLimit) * 100));

  return (
    <div className={`itw-sim${!effectsEnabled ? " itw-effects-off" : ""}`}>
      {/* Media and sensory controls */}
      <div className="itw-media-bar">
        <div className="itw-media-bar-group">
          <EffectsToggle effectsEnabled={effectsEnabled} onToggle={setEffectsEnabled} />
          <button
            type="button"
            className={`itw-btn-ghost${paused ? " itw-active" : ""}`}
            onClick={togglePause}
            aria-label={paused ? "Resume task" : "Pause task"}
          >
            {paused ? "▶ Resume" : "⏸ Pause"}
          </button>
          {onAbort && (
            <button type="button" className="itw-btn-ghost" onClick={onAbort} aria-label="Exit observation">
              ✕ Exit
            </button>
          )}
        </div>
        <div className="itw-media-bar-group itw-volume-group">
          <button
            type="button"
            className={`itw-btn-ghost${autismSoundOn ? " itw-active" : ""}`}
            onClick={() => setAutismSoundOn((v) => !v)}
            aria-pressed={autismSoundOn}
          >
            {autismSoundOn ? "🔊 Audio: On" : "🔇 Audio: Off"}
          </button>
          {autismSoundOn && (
            <div className="itw-volume-slider-wrap">
              <label htmlFor="itw-autism-vol-slider" className="itw-mono" style={{ fontSize: 11 }}>Vol</label>
              <input
                id="itw-autism-vol-slider"
                type="range"
                min="0.01"
                max="0.12"
                step="0.01"
                value={autismVolume}
                onChange={(e) => setAutismVolume(parseFloat(e.target.value))}
                className="itw-volume-slider"
              />
              <span className="itw-volume-readout">{Math.round((autismVolume / 0.12) * 100)}%</span>
            </div>
          )}
        </div>
      </div>

      {supportType && (
        <div
          style={{
            padding: "8px 16px",
            background: "rgba(102, 128, 77, 0.12)",
            border: "1px solid var(--itw-autism)",
            borderRadius: 12,
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 13.5,
            fontWeight: 600,
            color: "var(--itw-text)",
          }}
        >
          <span style={{ fontSize: 16 }}>🛡️</span>
          <span>
            {supportType === "ear_defenders" && "Sensory Ear Defenders Active: Background audio volume lowered in-app."}
            {supportType === "visual_calm" && "Visual Focus Filter Active: Competing visual decoys reduced to 1."}
            {supportType === "quiet_corner" && "Predictable Quiet Space: Generous unhurried time limit and softer contrast."}
          </span>
        </div>
      )}

      <Viewfinder
        hud={{
          left: paused ? "PAUSED" : `ROUND ${round}/${AUTISM_ROUNDS}`,
          right: SCENARIOS[scenario].label.toUpperCase(),
        }}
        stageStyle={{
          background: supportType === "quiet_corner" ? "var(--itw-panel-2)" : SCENARIOS[scenario].bg,
        }}
      >
        {!videoBroken && supportType !== "visual_calm" && supportType !== "quiet_corner" && (
          <video
            ref={videoRef}
            key={`${scenario}-${videoIdx}`}
            className="itw-scene-video"
            src={sceneVideos[videoIdx]}
            autoPlay={effectsEnabled && !paused}
            muted
            playsInline
            preload="none"
            onEnded={advanceVideo}
            onError={handleVideoError}
          />
        )}
        {!videoBroken && <div className="itw-scene-video-overlay" aria-hidden="true" />}
        <div className={`itw-glare-overlay${flicker && effectsEnabled ? " itw-gentle-flicker" : ""}`} aria-hidden="true" />

        <div className="itw-round-timer">
          <div
            className="itw-round-timer-fill"
            style={{ width: `${timerPct}%`, background: "var(--itw-autism)" }}
          />
        </div>

        {/* Target dot */}
        <button
          type="button"
          className={`itw-sensory-target${perspective === "peripheral" ? " itw-peripheral-blur" : ""}`}
          style={{ top: `${targetPos.top}%`, left: `${targetPos.left}%`, border: "none", background: "transparent" }}
          onClick={clickTarget}
          aria-label="Target observation point"
        >
          <div className="itw-dot" />
        </button>

        {/* Decoys */}
        {decoys.map((d) => (
          <button
            key={d.id}
            type="button"
            className={`itw-decoy-target${perspective === "peripheral" ? " itw-peripheral-blur" : ""}`}
            style={{ top: `${d.top}%`, left: `${d.left}%`, border: "none", background: "transparent" }}
            onClick={clickDecoy}
            aria-label="Distractor visual decoy"
          >
            <div className="itw-dot" />
          </button>
        ))}

        {/* Sensory event cues */}
        {supportType !== "quiet_corner" &&
          cues.map((c) => (
            <div
              key={c.id}
              className="itw-sound-cue"
              style={{
                top: `${c.top}%`,
                left: `${c.left}%`,
                opacity: supportType === "ear_defenders" ? 0.4 : 1,
              }}
            >
              <span className="itw-cue-icon" aria-hidden="true">
                <CueIcon name={c.kind} size={16} />
              </span>
              <span className="itw-cue-text">{c.text}</span>
            </div>
          ))}

        {paused && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(18, 22, 15, 0.82)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 20,
              gap: 12,
            }}
          >
            <div style={{ fontSize: 19, fontWeight: 700, color: "#fff" }}>Observation Paused</div>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, margin: 0 }}>Take a breather whenever you need.</p>
            <button type="button" className="itw-cta itw-cta-dark" onClick={togglePause}>
              Resume Observation →
            </button>
          </div>
        )}
      </Viewfinder>

      <div className="itw-sim-controls">
        <div className="itw-round-pips">
          {Array.from({ length: AUTISM_ROUNDS }).map((_, i) => (
            <span
              key={i}
              className={i < round - 1 ? "itw-pip-done" : i === round - 1 ? "itw-pip-current" : ""}
            />
          ))}
        </div>
        <div className="itw-readout">
          {supportType
            ? "Notice how reducing competing sensory stimuli eases the effort of locating the target."
            : "Notice how background noise, visual motion, and decoy cues compete for your focus."}
        </div>
      </div>
    </div>
  );
}

function AutismModule({ onBack, onNavigate }) {
  const [step, setStep] = useState("intro"); // intro | scenario | run_unfiltered | reflect | support | run_supported | explain | next
  const [scenario, setScenario] = useState("mall");
  const [perspective, setPerspective] = useState("central");
  const [chosenSupport, setChosenSupport] = useState("ear_defenders");
  const [reflectionAnswers, setReflectionAnswers] = useState(() => Array(AUTISM_REFLECT_QS.length).fill(null));
  const [results, setResults] = useState({ unfiltered: null, supported: null });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const handleUnfilteredComplete = (res) => {
    setResults((prev) => ({ ...prev, unfiltered: res }));
    setStep("reflect");
  };

  const handleSupportedComplete = (res) => {
    setResults((prev) => ({ ...prev, supported: res }));
    setStep("explain");
  };

  const stepIndex = AUTISM_STEP_INDEX[step];
  const more = MODULES.filter((m) => m.key !== "autism");

  const perspectiveNote =
    perspective === "peripheral"
      ? "Using side vision — many autistic individuals find direct central focus too intense and naturally rely on peripheral vision, though fine details can be harder to resolve."
      : "Looking directly at the scene — full detail, but direct gaze in a chaotic room can rapidly cause sensory fatigue.";

  return (
    <section className="itw-view itw-module itw-flow" data-accent="autism">
      <FlowCrumbs name="Autism" onBack={onBack} />
      {stepIndex !== undefined && <FlowStepper steps={AUTISM_STEPS} current={stepIndex} />}

      {step === "intro" && (
        <div className="itw-flow-page itw-flow-intro" key="intro">
          <div>
            <h2 className="itw-flow-title">Autism</h2>
            <div className="itw-flow-sub">The Room Doesn't Turn Down</div>
            <p className="itw-flow-lead">
              For many autistic people, sensory input doesn't fade into the background automatically. The hum of fluorescent
              lights, a chair scraping, and conversations across the room can all arrive at full volume at once.
            </p>
            <ul className="itw-flow-meta">
              <li><span aria-hidden="true">•</span> Takes 2–3 minutes</li>
              <li><span aria-hidden="true">•</span> Sound is off by default; you have full control</li>
              <li><span aria-hidden="true">•</span> An empathy learning experience, not a diagnostic tool</li>
            </ul>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("scenario")}>
              Begin the Journey →
            </button>
          </div>
          <IntroVignette moduleKey="autism" />
        </div>
      )}

      {step === "scenario" && (
        <div className="itw-flow-page itw-flow-narrow" key="scenario">
          <div className="itw-scene-plate">
            <img src="/decor/itw/autism-environment.webp" alt="School central atrium" className="itw-scene-plate-img" />
            <div className="itw-scene-plate-overlay">
              <span className="itw-scene-tag">📍 Setting • School Central Atrium & Cafeteria</span>
              <p className="itw-scene-caption">Hard tile reflections, overlapping hallway echoes, and bright overhead skylights where sensory inputs arrive all at once.</p>
            </div>
          </div>
          <h2 className="itw-flow-title itw-center">Choose an Everyday Setting</h2>
          <p className="itw-flow-lead itw-center">
            Pick a familiar environment to explore how competing sights and sounds interact. You can also compare direct central focus versus peripheral viewing.
          </p>

          <div className="itw-scenario-picker" style={{ margin: "24px 0" }}>
            <div className="itw-picker-group">
              <label className="itw-mono itw-picker-label">Setting</label>
              <div className="itw-strat-tabs">
                {Object.entries(SCENARIOS).map(([key, s]) => (
                  <button
                    key={key}
                    type="button"
                    className={`itw-btn-ghost${scenario === key ? " itw-active" : ""}`}
                    onClick={() => setScenario(key)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <p className="itw-picker-desc">{SCENARIOS[scenario].desc}</p>
            </div>

            <div className="itw-picker-group">
              <label className="itw-mono itw-picker-label">Vision Perspective</label>
              <div className="itw-strat-tabs">
                <button
                  type="button"
                  className={`itw-btn-ghost${perspective === "central" ? " itw-active" : ""}`}
                  onClick={() => setPerspective("central")}
                >
                  Central Vision
                </button>
                <button
                  type="button"
                  className={`itw-btn-ghost${perspective === "peripheral" ? " itw-active" : ""}`}
                  onClick={() => setPerspective("peripheral")}
                >
                  Peripheral Vision
                </button>
              </div>
              <p className="itw-picker-desc">{perspectiveNote}</p>
            </div>
          </div>

          <div className="itw-flow-nav">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("intro")}>Back</button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("run_unfiltered")}>
              Start Run 1: Unfiltered →
            </button>
          </div>
        </div>
      )}

      {step === "run_unfiltered" && (
        <div className="itw-flow-page" key="run_unfiltered">
          <div className="itw-flow-readtop">
            <h2 className="itw-flow-title">Run 1: Unfiltered Sensory Observation</h2>
            <p className="itw-flow-lead" style={{ margin: 0 }}>
              Spot the real target dot among competing visual and auditory cues across 3 short rounds.
            </p>
          </div>
          <AutismSim
            mode="unfiltered"
            scenario={scenario}
            perspective={perspective}
            onComplete={handleUnfilteredComplete}
            onAbort={() => setStep("scenario")}
          />
        </div>
      )}

      {step === "reflect" && (
        <div className="itw-flow-page itw-flow-narrow" key="reflect">
          <h2 className="itw-flow-title itw-center">Observation Summary & Reflection</h2>
          <p className="itw-flow-lead itw-center">
            Here are the neutral metrics from your first run in the {SCENARIOS[scenario].label.toLowerCase()}:
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 16,
              margin: "24px 0",
            }}
          >
            <div
              style={{
                background: "var(--itw-panel)",
                border: "1px solid var(--itw-border)",
                borderRadius: 18,
                padding: "20px 18px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--itw-muted)", fontWeight: 700 }}>
                Total Time
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "var(--itw-autism)", margin: "8px 0" }}>
                {results.unfiltered ? `${results.unfiltered.time.toFixed(1)}s` : "—"}
              </div>
              <div style={{ fontSize: 13, color: "var(--itw-muted)" }}>Across 3 rounds</div>
            </div>

            <div
              style={{
                background: "var(--itw-panel)",
                border: "1px solid var(--itw-border)",
                borderRadius: 18,
                padding: "20px 18px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--itw-muted)", fontWeight: 700 }}>
                Decoy Interactions
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "var(--itw-autism)", margin: "8px 0" }}>
                {results.unfiltered ? results.unfiltered.misses : 0}
              </div>
              <div style={{ fontSize: 13, color: "var(--itw-muted)" }}>
                {results.unfiltered?.misses === 0 ? "Target spotted cleanly" : "Distractor decoys clicked"}
              </div>
            </div>
          </div>

          <p className="itw-flow-lead" style={{ fontSize: 16, lineHeight: 1.6 }}>
            In an unfiltered environment, the nervous system has to spend active mental energy sorting signal from noise. That continuous filtering demand accumulates as exhaustion throughout the school or work day.
          </p>

          <FlowQuestions
            questions={AUTISM_REFLECT_QS}
            answers={reflectionAnswers}
            onPick={(qi, oi) => {
              setReflectionAnswers((prev) => {
                const next = [...prev];
                next[qi] = oi;
                return next;
              });
            }}
          />

          <div className="itw-flow-nav" style={{ marginTop: 24 }}>
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("run_unfiltered")}>
              Re-run Run 1
            </button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("support")}>
              Try a Supportive Accommodation →
            </button>
          </div>
        </div>
      )}

      {step === "support" && (
        <div className="itw-flow-page itw-flow-narrow" key="support">
          <h2 className="itw-flow-title itw-center">Change the Environment: Try a Support</h2>
          <p className="itw-flow-lead itw-center">
            Sensory comfort isn't about teaching someone to endure overwhelm — it's about shaping spaces that respect sensory boundaries. Choose an accommodation to test in Run 2:
          </p>

          <div style={{ display: "grid", gap: 14, margin: "24px 0" }}>
            {AUTISM_SUPPORT_CHOICES.map((s) => (
              <label
                key={s.id}
                style={{
                  display: "block",
                  padding: "16px 20px",
                  borderRadius: 18,
                  border: `2px solid ${chosenSupport === s.id ? "var(--itw-autism)" : "var(--itw-border)"}`,
                  background: chosenSupport === s.id ? "rgba(102, 128, 77, 0.08)" : "var(--itw-panel)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontWeight: 800, fontSize: 17, color: "var(--itw-text)" }}>{s.title}</div>
                  <span
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                      padding: "3px 10px",
                      borderRadius: 99,
                      background: "var(--itw-panel-2)",
                      color: "var(--itw-muted)",
                    }}
                  >
                    {s.tag}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: "var(--itw-muted)", lineHeight: 1.5 }}>{s.desc}</div>
                <input
                  type="radio"
                  name="autism-support"
                  value={s.id}
                  checked={chosenSupport === s.id}
                  onChange={() => setChosenSupport(s.id)}
                  style={{ display: "none" }}
                />
              </label>
            ))}
          </div>

          <div className="itw-flow-nav">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("reflect")}>Back</button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("run_supported")}>
              Run with Support →
            </button>
          </div>
        </div>
      )}

      {step === "run_supported" && (
        <div className="itw-flow-page" key="run_supported">
          <div className="itw-flow-readtop">
            <h2 className="itw-flow-title">Run 2: Supported by {AUTISM_SUPPORT_CHOICES.find((s) => s.id === chosenSupport)?.title}</h2>
            <p className="itw-flow-lead" style={{ margin: 0 }}>
              Observe how adjusting sensory volume and visual competition frees up bandwidth for focus.
            </p>
          </div>
          <AutismSim
            mode="supported"
            supportType={chosenSupport}
            scenario={scenario}
            perspective={perspective}
            onComplete={handleSupportedComplete}
            onAbort={() => setStep("support")}
          />
        </div>
      )}

      {step === "explain" && (
        <div className="itw-flow-page" key="explain">
          <div className="itw-flow-narrow" style={{ margin: "0 auto 36px" }}>
            <h2 className="itw-flow-title itw-center">What this means in everyday life</h2>
            <p className="itw-flow-lead itw-center">
              Sensory overload is not a behavioral problem or a lack of self-control. It is a nervous system taking in more raw sensory input than it can sort through in real time.
            </p>

            <div
              style={{
                background: "rgba(102, 128, 77, 0.08)",
                border: "1px solid var(--itw-autism)",
                borderRadius: 18,
                padding: "20px 24px",
                margin: "24px 0",
              }}
            >
              <h4 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800, color: "var(--itw-autism)" }}>
                The Takeaway: Accommodations change everything
              </h4>
              <p style={{ margin: "0 0 12px", fontSize: 14.5, lineHeight: 1.6, color: "var(--itw-text)" }}>
                When environmental supports like noise-dampening headphones, dimmable lights, and quiet retreat zones are available, autistic individuals can participate fully without exhausting their nervous systems on baseline sensory survival.
              </p>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "var(--itw-muted)" }}>
                <b>Diverse Sensory Profiles:</b> Autistic sensory experiences are varied and personal. Some individuals are sensory-avoiding (sensitive to fluorescent flicker, sudden noise, or visual crowds), while others are sensory-seeking (seeking deep pressure, rhythmic movement, or tactile engagement). Support should be tailored to the individual rather than assumed to be identical for all.
              </p>
            </div>
          </div>

          <h3 className="itw-flow-h3">The Data: Indian Epidemiology</h3>
          <FactsGrid
            facts={[
              {
                num: "~1 in 89",
                label: "estimated prevalence (~1.1%) among 3,964 children aged 2–9 years across five selected Indian study districts (fieldwork 2011–2012)",
                src: "Arora et al. / INCLEN Study, PLOS Medicine (5-district cohort)",
              },
              {
                num: "0.4%–1.8%",
                label: "regional variation across the five study sites (e.g. rural Palwal to urban North Goa), demonstrating local population and diagnostic variance",
                src: "INCLEN Study Group (Arora et al.)",
              },
              {
                num: "Cohort Context",
                label: "These findings represent the specific 5-region study sample and age band (2–9 years); they should not be interpreted as a current, nationally representative estimate",
                src: "Indian Journal of Medical Research Autism Reviews",
              },
            ]}
            note="An INCLEN population-based study across five selected Indian sites estimated autism prevalence at approximately 1 in 89 children aged 2–9, with variation across sites. These findings represent the study populations and should not be interpreted as a current, nationally representative estimate. Accommodations like quiet spaces, noise-dampening tools, and predictable transitions allow individuals to thrive."
            onComplete={() => {}}
          />

          <section className="itw-block itw-help-block" style={{ marginTop: 40 }}>
            <div className="itw-help-head">
              <div className="itw-help-icon" aria-hidden="true">
                <CueIcon name="headphones" size={20} />
              </div>
              <div>
                <div className="itw-help-eyebrow">Practical accommodations</div>
                <h3 className="itw-help-title">How you can help at home & in the classroom</h3>
              </div>
            </div>

            <QuietCorner />

            <StrategyTabs
              home={[
                "Build in a low-stimulation space the child can retreat to before overload turns into a meltdown, not after.",
                "Give transitions a warning — “five more minutes” — instead of a sudden switch between activities.",
                "Ask what specifically feels like “too much” (a sound, a fabric, a smell) instead of guessing.",
                "Treat stimming (rocking, hand-flapping, fidgeting) as a regulation tool, not something to stop.",
              ]}
              classroom={[
                "Offer noise-reducing headphones or a seat away from the door/window as a default option, not a special favor.",
                "Post the day's schedule visually — unpredictability is often harder than the activities themselves.",
                "Give instructions one step at a time, and check for understanding rather than assuming eye contact means engagement.",
                "Build in movement or quiet breaks between high-stimulation activities like assemblies or fire drills.",
              ]}
            />
            <HelpFooter />
          </section>

          <div className="itw-flow-nav" style={{ marginTop: 32 }}>
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("support")}>Back</button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("next")}>Next Steps →</button>
          </div>
        </div>
      )}

      {step === "next" && (
        <div className="itw-flow-page itw-flow-narrow" key="next">
          <h2 className="itw-flow-title itw-center">Understanding creates a kinder world</h2>
          <p className="itw-flow-lead itw-center">
            Every child's sensory profile is unique. When we design environments that respect these differences, we allow their real strengths to shine.
          </p>
          <div className="itw-flow-nav itw-flow-nav-center">
            <a className="itw-cta itw-cta-dark" href="/assessments">Take an Assessment →</a>
            <a className="itw-cta itw-cta-line" href="/consult">Book a Consultation →</a>
          </div>
          <h3 className="itw-flow-h3">Explore More Experiences</h3>
          <div className="itw-flow-more">
            {more.map((m) => (
              <button
                type="button"
                key={m.key}
                className="itw-flow-more-card"
                data-m={m.key}
                onClick={() => onNavigate(m.key)}
              >
                <b>{m.name}</b>
                <span>{m.tag}</span>
                <i aria-hidden="true">→</i>
              </button>
            ))}
          </div>
          <div className="itw-flow-nav itw-flow-nav-center">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("explain")}>Back</button>
            <button type="button" className="itw-cta itw-cta-line" onClick={onBack}>All experiences</button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ================= ADHD: A Mind With Too Many Open Tabs ================= */

const ADHD_STEPS = [
  { key: "instructions", label: "Instructions" },
  { key: "run_baseline", label: "Run 1 (Quiet)" },
  { key: "interrupted_intro", label: "Interruption Brief" },
  { key: "run_interrupted", label: "Run 2 (Competing Pulls)" },
  { key: "reflect", label: "Reflect & Compare" },
  { key: "support", label: "Support Experiment" },
  { key: "explain", label: "Understanding & Action" },
];

const ADHD_STEP_INDEX = {
  instructions: 0,
  run_baseline: 1,
  interrupted_intro: 1,
  run_interrupted: 2,
  reflect: 3,
  support: 4,
  run_supported: 4,
  explain: 5,
};

const ADHD_REFLECT_QS = [
  {
    q: "During the second run with interruptions, where did you notice the cognitive friction?",
    options: [
      "Even when I tried to ignore the notification toasts, reading them felt almost involuntary.",
      "Re-orienting back to the assignment after dismissing a distraction took noticeable mental effort.",
      "The wandering thought chips pulled my curiosity away from the primary assignment goal.",
      "The task felt significantly more draining even though the core assignment steps were identical.",
    ],
  },
];

const ADHD_SUPPORT_CHOICES = [
  {
    id: "checklist",
    title: "Externalized Visual Checklist",
    subtitle: "Pinned step-by-step progress anchors",
    desc: "Anchors working memory with a high-contrast checklist of completed and remaining steps so you never lose your place.",
    tag: "Working Memory Scaffolding",
  },
  {
    id: "filter",
    title: "Focus Shield / Do Not Disturb",
    subtitle: "Mutes external pings and tabs",
    desc: "Completely filters out sudden notification popups and hides unrelated browser tabs to protect unbroken attention.",
    tag: "Environmental Filter",
  },
  {
    id: "chunking",
    title: "Task Chunking (One-Next-Step)",
    subtitle: "Isolates one sub-step at a time",
    desc: "Hides future steps and secondary tangents, presenting only the single immediate next action in a focused card.",
    tag: "Executive Scaffolding",
  },
];

const ADHD_EXTERNAL_NOTIFICATIONS = [
  { id: "chat_citation", channel: "external", icon: "💬", title: "Class Group Chat", body: "Has anyone found the citation for the Bangalore biodiversity report?", autoExpire: 9 },
  { id: "cal_checkin", channel: "external", icon: "📅", title: "Calendar Alert", body: "Biology Group Check-in starting in 15 minutes.", autoExpire: 12 },
  { id: "batt_warning", channel: "external", icon: "🔋", title: "Battery Warning", body: "14% remaining — please connect your laptop power adapter.", autoExpire: 10 },
  { id: "deliv_update", channel: "external", icon: "📦", title: "Delivery Update", body: "Package out for delivery in your neighborhood.", autoExpire: 8 },
  { id: "portal_reminder", channel: "external", icon: "🔔", title: "Portal Reminder", body: "Assignment submission window closes at the end of class.", autoExpire: 14 },
  { id: "library_room", channel: "external", icon: "📚", title: "Library Notice", body: "Quiet study cubicle reservation confirmed for 4:00 PM.", autoExpire: 9 },
  { id: "friend_dm", channel: "external", icon: "💬", title: "Rohan (Direct Message)", body: "Did you finish question 3 on lake buffer zones yet?", autoExpire: 8 },
];

const ADHD_INTERNAL_THOUGHTS = [
  { id: "thought_garden", channel: "thought", icon: "💭", title: "Balcony Herb Garden", body: "Did I water the balcony coriander pots this morning?", tangentTitle: "Balcony Herb Garden", tangentText: "You wonder if the afternoon heat will dry out the soil... but you need to submit this ecology brief first!", autoExpire: 11 },
  { id: "thought_pelicans", channel: "thought", icon: "💭", title: "Spot-Billed Pelicans", body: "Do spot-billed pelicans still nest at Bellandur lake in winter?", tangentTitle: "Spot-Billed Pelicans in Bengaluru", tangentText: "Spot-billed pelicans and painted storks still nest in urban wetland patches when water quality permits.", autoExpire: 11 },
  { id: "thought_tabs", channel: "thought", icon: "💭", title: "Tab Clutter Tangent", body: "My browser tabs are so messy, should I organize them first?", tangentTitle: "Tab Organizer Tangent", tangentText: "You spent 40 seconds bookmarking tabs before remembering your ecology assignment is due!", autoExpire: 10 },
  { id: "thought_tea", channel: "thought", icon: "💭", title: "Hot Ginger Tea", body: "A warm cup of ginger tea would really help me focus right now...", tangentTitle: "Tea Break Reflection", tangentText: "You consider going to the kitchen for hot tea, then remember the clock is ticking on your assignment.", autoExpire: 9 },
  { id: "thought_camera", channel: "thought", icon: "💭", title: "Camera Battery", body: "Did I recharge my camera battery for Sunday morning bird walk?", tangentTitle: "Weekend Bird Walk", tangentText: "You imagine spotting kingfishers along the lake, but your immediate assignment needs your attention.", autoExpire: 10 },
];

const ADHD_TANGENT_POOL = [
  {
    id: "tangent_species",
    label: "🦆 Spot-Billed Pelican Diet",
    title: "Spot-Billed Pelican Diet Tangent",
    text: "You open three Wikipedia tabs researching what pelicans eat in South Indian wetlands, spending two minutes fascinated by bird beaks before remembering your assignment!",
  },
  {
    id: "tangent_tab_clean",
    label: "🔖 Tab Bookmark Organization",
    title: "Tab Organization Rabbit Hole",
    text: "You start categorizing your 27 open browser tabs into neat color-coded folders... and realize you haven't written a single sentence of your assignment brief.",
  },
  {
    id: "tangent_music",
    label: "🎧 Search Lo-Fi Focus Playlist",
    title: "The Perfect Study Playlist Quest",
    text: "You spend 90 seconds previewing eight different instrumental tracks searching for the exact frequency to help you focus, losing your train of thought in the process.",
  },
  {
    id: "tangent_tea",
    label: "☕ Kitchen Ginger Tea Break",
    title: "Kitchen Tea Daydream",
    text: "You daydream about brewing fresh ginger and cardamom tea. It feels urgent and necessary right now, but your assignment timer is still running!",
  },
];

function createPrng(seed = 1337) {
  let s = seed >>> 0;
  return function next() {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWith(rand, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function AdhdWorkspaceSim({ mode = "baseline", intensity = "moderate", supportType = "filter", onComplete, onAbort }) {
  const { soundOn } = useContext(SettingsContext);
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTangent, setActiveTangent] = useState(null);
  const [distractionsDismissed, setDistractionsDismissed] = useState(0);
  const [tangentsExplored, setTangentsExplored] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const [paused, setPaused] = useState(false);
  const [focusSpotlight, setFocusSpotlight] = useState(mode === "supported");

  const startTimeRef = useRef(0);
  const timerIntervalRef = useRef(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Handle sound drone
  useEffect(() => {
    audio.setDroneGain("adhd", soundOn && running && !paused && mode === "interrupted" ? 0.03 : 0.0001);
  }, [soundOn, running, paused, mode]);

  useEffect(() => {
    if (!soundOn || mode !== "interrupted") {
      audio.stopDrone("adhd");
      return;
    }
    audio.startDrone("adhd", { freqs: [220, 330], type: "triangle" });
    return () => audio.stopDrone("adhd");
  }, [soundOn, mode]);

  const clearTimers = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
  }, []);

  // Activity stopwatch
  useEffect(() => {
    startTimeRef.current = performance.now();
    timerIntervalRef.current = setInterval(() => {
      setElapsed(parseFloat(((performance.now() - startTimeRef.current) / 1000).toFixed(1)));
    }, 100);
    return clearTimers;
  }, [clearTimers]);

  // Distinct tasks per round to completely prevent muscle memory
  const ADHD_TASKS = {
    baseline: {
      topic: "Planetary Science • Robotic Exploration",
      title: "Mars Surface & Atmosphere",
      text: "Mars is often called the Red Planet because its surface dust is rich in iron minerals. Robotic rovers navigate across ancient volcanic craters, sampling minerals and analyzing the thin carbon dioxide atmosphere for clues of prehistoric rivers.",
      instruction: "Identify the 3 planetary science concepts in the brief above:",
      targets: ["Robotic Rovers", "Volcanic Craters", "Carbon Atmosphere"],
      options: [
        "Robotic Rovers",
        "Glacial Tundra",
        "Volcanic Craters",
        "Saturn Rings",
        "Carbon Atmosphere",
        "Solar Flare",
      ],
    },
    interrupted: {
      topic: "Deep Oceanography • Mariana Trench",
      title: "Abyssal Marine Biology",
      text: "Seven miles down in the Pacific Ocean lies perpetual midnight and crushing pressure. Mysterious fish create flashes of blue bioluminescence to communicate, while clouds of microscopic plankton drift past thermal chimneys in a unique submarine ecosystem.",
      instruction: "Click the 3 ocean concepts in the brief above while pings compete for focus:",
      targets: ["Luminous Bioluminescence", "Microscopic Plankton", "Deep Ecosystem"],
      options: [
        "Luminous Bioluminescence",
        "Coral Lagoon",
        "Microscopic Plankton",
        "Desert Dune",
        "Deep Ecosystem",
        "Photosynthesis",
      ],
    },
    supported: {
      topic: "Ancient Civilizations • Indus River Valley",
      title: "Planned Urban Archaeology",
      text: "Four thousand years ago along the Indus River, engineers built planned cities with covered drains. Craftspeople carved beads from red carnelian, stamped unicorn seals onto trading goods, and docked international freight boats at the tidal harbor of Lothal.",
      instruction: "Click the 3 Indus Valley concepts below (Focus Spotlight active):",
      targets: ["Carved Carnelian", "Unicorn Seals", "Tidal Harbor"],
      options: [
        "Carved Carnelian",
        "Pyramid Tombs",
        "Unicorn Seals",
        "Gladiator Arena",
        "Tidal Harbor",
        "Roman Colosseum",
      ],
    },
  };

  const currentTask = ADHD_TASKS[mode] || ADHD_TASKS.baseline;

  // Synthesized Web Audio cues for distinct distraction types
  const playAdhdSound = useCallback((type) => {
    if (!soundOn || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!window.__adhdAudioCtx) window.__adhdAudioCtx = new AudioCtx();
      const ctx = window.__adhdAudioCtx;
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "ping") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1320, now + 0.08);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.36);
      } else if (type === "buzzer") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === "chat") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(1040, now);
        osc.frequency.setValueAtTime(1280, now + 0.06);
        osc.frequency.setValueAtTime(1560, now + 0.12);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
        osc.start(now);
        osc.stop(now + 0.27);
      } else if (type === "whoosh") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(1600, now + 0.28);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.36);
      }
    } catch {}
  }, [soundOn]);

  // Dynamic Distraction Generator for interrupted mode: Multi-font, multi-color pop-ins
  useEffect(() => {
    if (mode === "baseline" || mode === "supported" || paused || !running) {
      return undefined;
    }

    const timers = [];
    let isCancelled = false;

    const notifPool = [
      {
        id: "msg1",
        title: "⚡ Discord • #study-buddies",
        body: "Aryan: \"Wait, is the assignment due at 5 PM or midnight?! ANSWER PLS\"",
        icon: "💬",
        delay: 800,
        sound: "chat",
        styleType: "discord",
      },
      {
        id: "msg2",
        title: "📅 Calendar Reminder",
        body: "Dentist appointment tomorrow at 4:30 PM",
        icon: "⏰",
        delay: 2400,
        sound: "buzzer",
        styleType: "calendar",
      },
      {
        id: "msg3",
        title: "📦 Amazon Delivery Alert",
        body: "Driver is 2 stops away! Package arriving shortly.",
        icon: "🚚",
        delay: 4800,
        sound: "ping",
        styleType: "delivery",
      },
      {
        id: "msg4",
        title: "🔥 WhatsApp • Family Group (42 unread)",
        body: "Mom sent a 4-minute voice note + 8 recipe photos",
        icon: "📱",
        delay: 7200,
        sound: "chat",
        styleType: "whatsapp",
      },
      {
        id: "msg5",
        title: "🎵 Spotify Now Playing",
        body: "Liked: \"synthwave late-night coding beats vol. 4\"",
        icon: "🎧",
        delay: 9800,
        sound: "whoosh",
        styleType: "spotify",
      },
      {
        id: "msg6",
        title: "✨ Breaking Trend",
        body: "Everyone is talking about the new rover photos right now!",
        icon: "🚀",
        delay: 12500,
        sound: "ping",
        styleType: "trend",
      },
    ];

    notifPool.forEach((item) => {
      timers.push(setTimeout(() => {
        if (isCancelled) return;
        playAdhdSound(item.sound);
        setNotifications((prev) => [item, ...prev.slice(0, 2)]);
      }, item.delay));
    });

    return () => {
      isCancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [mode, paused, running, playAdhdSound]);

  const [missChip, setMissChip] = useState(null);
  const visibleNotifications = (mode === "baseline" || mode === "supported" || paused || !running) ? [] : notifications;

  const handleToggleKeyword = (kw) => {
    if (soundOn) audio.cue("tap");
    if (!currentTask.targets.includes(kw)) {
      if (soundOn) audio.cue("flicker");
      setMissChip(kw);
      setTimeout(() => setMissChip(null), 600);
      return;
    }

    const next = selectedKeywords.includes(kw)
      ? selectedKeywords.filter((k) => k !== kw)
      : [...selectedKeywords, kw];
    setSelectedKeywords(next);

    // If all 3 targets identified, finish!
    if (currentTask.targets.every((t) => next.includes(t))) {
      clearTimers();
      setRunning(false);
      if (soundOn) audio.cue("slam");
      const finalTime = elapsed > 0 ? elapsed : 0.1;
      onCompleteRef.current?.({
        time: finalTime,
        distractionsDismissed,
        tangentsExplored,
      });
    }
  };

  const dismissNotif = (id) => {
    if (soundOn) audio.cue("tap");
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setDistractionsDismissed((c) => c + 1);
  };

  const openTangent = (tangent) => {
    if (soundOn) audio.cue("tap");
    setActiveTangent(tangent);
    setTangentsExplored((c) => c + 1);
  };

  const TANGENT_BUBBLES = [
    { id: "t1", title: "💭 Wait, do otters hold hands when they sleep?", text: "Yes! Sea otters hold hands while floating to avoid drifting apart in currents. Cute, but back to biology!", top: "10%", left: "4%" },
    { id: "t2", title: "💭 Did I turn off the kitchen stove?", text: "Checked in your mind: yes, the kettle was turned off after making chai.", bottom: "4%", left: "4%" },
    { id: "t3", title: "💭 What was that song from the car earlier?", text: "It was that nostalgic acoustic tune. Your brain spent 20 seconds trying to remember the chorus melody.", top: "12%", right: "4%" },
  ];

  return (
    <div className="itw-desk-sim" role="region" aria-label="ADHD Attention Regulation Workspace">
      <div className="itw-desk-bg-wrap" aria-hidden="true">
        <img src="/decor/itw/adhd-workspace-scene.webp" alt="" className="itw-desk-bg-img" />
      </div>

      {/* Desk Status Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, position: "relative", zIndex: 5 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-adhd)", letterSpacing: "0.08em" }}>
            {mode === "baseline" ? "Run 1 (Quiet Baseline • Mars)" : mode === "interrupted" ? "Run 1 (The Distraction Storm • Deep Sea)" : "Run 2 (Focus Spotlight • Indus Valley)"}
          </span>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--itw-text)", margin: "4px 0" }}>
            {currentTask.title}
          </h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--itw-muted)" }}>
            ⏱️ {elapsed.toFixed(1)}s
          </span>
          <button type="button" className="itw-pill-btn" onClick={onAbort}>Exit</button>
        </div>
      </div>

      {/* Floating Notifications in Interrupted Mode */}
      {mode === "interrupted" && visibleNotifications.length > 0 && (
        <div className="itw-toast-container" aria-live="polite" style={{ zIndex: 10 }}>
          {visibleNotifications.map((n) => (
            <div key={n.id} className={`itw-desk-toast itw-toast-${n.styleType || "default"} itw-distraction-burst`}>
              <span className="itw-toast-icon" aria-hidden="true">{n.icon}</span>
              <div className="itw-toast-content">
                <div className="itw-toast-title">{n.title}</div>
                <div style={{ fontSize: 13, lineHeight: 1.4 }}>{n.body}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <button
                    type="button"
                    className="itw-pill-btn"
                    style={{ fontSize: 11, padding: "2px 8px" }}
                    onClick={() => dismissNotif(n.id)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="itw-toast-close"
                aria-label={`Dismiss ${n.title}`}
                onClick={() => dismissNotif(n.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Associative Thought Sparks in Interrupted Mode */}
      {mode === "interrupted" && !activeTangent && (
        <>
          {TANGENT_BUBBLES.map((t) => (
            <button
              key={t.id}
              type="button"
              className="itw-spark-thought"
              style={{ top: t.top, left: t.left, right: t.right }}
              onClick={() => openTangent(t)}
            >
              {t.title}
            </button>
          ))}
        </>
      )}

      {/* Tangent Modal */}
      {activeTangent && (
        <div className="itw-tangent-overlay" role="dialog" aria-modal="true" aria-label="Associative Thought">
          <div className="itw-tangent-modal">
            <div style={{ fontSize: 32, marginBottom: 8 }} aria-hidden="true">💭</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--itw-text)", marginBottom: 8 }}>
              {activeTangent.title}
            </h3>
            <p style={{ fontSize: 15, color: "var(--itw-muted)", lineHeight: 1.6, marginBottom: 20 }}>
              {activeTangent.text}
            </p>
            <button
              type="button"
              className="itw-cta itw-cta-dark"
              onClick={() => setActiveTangent(null)}
            >
              ← Return to Assignment
            </button>
          </div>
        </div>
      )}

      {/* Central Reading & Focus Box */}
      <div className={`itw-adhd-focus-box${focusSpotlight ? " itw-spotlight" : ""}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-adhd)", letterSpacing: "0.06em" }}>
            {currentTask.topic}
          </span>
          {mode === "supported" && (
            <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: "var(--itw-adhd-soft)", color: "var(--itw-adhd)" }}>
              ✨ Focus Spotlight Active
            </span>
          )}
        </div>

        <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--itw-text)", marginBottom: 18 }}>
          {currentTask.text}
        </p>

        <div style={{ borderTop: "1px solid var(--itw-border)", paddingTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--itw-muted)", marginBottom: 8 }}>
            {currentTask.instruction} ({selectedKeywords.length} of 3 selected):
          </div>
          <div className="itw-adhd-keywords">
            {currentTask.options.map((kw) => {
              const isSelected = selectedKeywords.includes(kw);
              const isMiss = missChip === kw;
              return (
                <button
                  key={kw}
                  type="button"
                  className={`itw-adhd-keychip${isSelected ? " itw-selected" : ""}${isMiss ? " itw-keychip-miss" : ""}`}
                  onClick={() => handleToggleKeyword(kw)}
                  title={isSelected ? "Selected" : "Click to select"}
                >
                  {isSelected ? "✓ " : "+ "} {kw}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Hint */}
      <div style={{ fontSize: 13, color: "var(--itw-muted)", textAlign: "center", marginTop: 12 }}>
        {mode === "interrupted"
          ? "Notice how notifications and wandering thoughts pull your eyes away from finishing a 15-second task."
          : "With competing pulls filtered out, holding continuous focus requires a fraction of the mental energy."}
      </div>
    </div>
  );
}

function AdhdModule({ onBack, onNavigate }) {
  const [step, setStep] = useState("intro");
  const [intensity, setIntensity] = useState("moderate");
  const [results, setResults] = useState({
    baseline: null,
    interrupted: null,
    supported: null,
  });
  const [chosenSupport, setChosenSupport] = useState("checklist");
  const [reflectionAnswers, setReflectionAnswers] = useState([null]);

  const stepIndex = ADHD_STEP_INDEX[step];
  const more = MODULES.filter((m) => m.key !== "adhd");

  const handleBaselineComplete = (data) => {
    setResults((prev) => ({ ...prev, baseline: data }));
    setStep("interrupted_intro");
  };

  const handleInterruptedComplete = (data) => {
    setResults((prev) => ({ ...prev, interrupted: data }));
    setStep("reflect");
  };

  const handleSupportedComplete = (data) => {
    setResults((prev) => ({ ...prev, supported: data }));
    setStep("explain");
  };

  return (
    <section className="itw-view itw-module itw-flow" data-accent="adhd">
      <FlowCrumbs name="ADHD" onBack={onBack} />
      {stepIndex !== undefined && <FlowStepper steps={ADHD_STEPS} current={stepIndex} />}

      {step === "intro" && (
        <div className="itw-flow-page itw-flow-intro" key="intro">
          <div>
            <h2 className="itw-flow-title">ADHD</h2>
            <div className="itw-flow-sub">A Mind With Too Many Open Tabs</div>
            <p className="itw-flow-lead">
              It is a common myth that ADHD is simply a lack of attention. In reality, attention is abundant — but
              it is drawn equally to every stimulus in the room. Holding focus on a quiet assignment while notifications,
              stray thoughts, and tangential curiosities compete for working memory requires constant, exhausting effort.
            </p>
            <ul className="itw-flow-meta">
              <li><span aria-hidden="true">•</span> Takes 2–3 minutes</li>
              <li><span aria-hidden="true">🖥️</span> Interactive desk workspace exploration</li>
              <li><span aria-hidden="true">•</span> Not a diagnostic test</li>
            </ul>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("instructions")}>
              Start the Experience →
            </button>
          </div>
          <IntroVignette moduleKey="adhd" />
        </div>
      )}

      {step === "instructions" && (
        <div className="itw-flow-page itw-flow-narrow" key="instructions">
          <div className="itw-scene-plate">
            <img src="/decor/itw/adhd-environment.webp" alt="Bangalore study desk" className="itw-scene-plate-img" />
            <div className="itw-scene-plate-overlay">
              <span className="itw-scene-tag">📍 Setting • Bangalore School Study Desk</span>
              <p className="itw-scene-caption">Friday afternoon homework session: multiple research articles, notebook notes, and constant background notifications.</p>
            </div>
          </div>
          <h2 className="itw-flow-title itw-center">Before you begin Run 1</h2>
          <p className="itw-flow-lead itw-center">
            You will act as a student preparing a short brief on <b>Urban Wildlife Conservation</b> in Bengaluru.
          </p>
          <ul className="itw-flow-list">
            <li><span aria-hidden="true">•</span> Read the brief, check notes in adjacent tabs, and extract 2 key data points.</li>
            <li><span aria-hidden="true">•</span> Select an evidence-based conservation policy and submit the assignment.</li>
            <li><span aria-hidden="true">•</span> In this first run, your digital environment is completely quiet and uninterrupted.</li>
          </ul>

          <div style={{ margin: "24px 0", background: "var(--itw-panel)", padding: 18, borderRadius: 16, border: "1px solid var(--itw-border)" }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8, color: "var(--itw-text)" }}>
              Choose Interruption Pacing for Run 2:
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {[
                { id: "gentle", label: "Gentle", desc: "Longer intervals between pings" },
                { id: "moderate", label: "Moderate", desc: "Realistic everyday pacing" },
                { id: "complex", label: "Intense", desc: "Rapid competing stimuli" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setIntensity(opt.id)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: `2px solid ${intensity === opt.id ? "var(--itw-adhd)" : "var(--itw-border)"}`,
                    background: intensity === opt.id ? "var(--itw-adhd-soft)" : "var(--itw-panel-2)",
                    color: "var(--itw-text)",
                    cursor: "pointer",
                    textAlign: "center",
                    font: "inherit",
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: "var(--itw-muted)", marginTop: 2 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <p className="itw-flow-note itw-center">
            This activity is an educational demonstration of cognitive load and environmental scaffolding. Individual ADHD profiles vary widely and cannot be measured by a computer task.
          </p>
          <div className="itw-flow-nav">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("intro")}>Back</button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("run_baseline")}>
              Start Run 1 (Quiet) →
            </button>
          </div>
        </div>
      )}

      {step === "run_baseline" && (
        <div className="itw-flow-page" key="run_baseline">
          <div className="itw-flow-readtop">
            <h2 className="itw-flow-title">Run 1: Quiet Assignment Preparation</h2>
            <p className="itw-flow-lead" style={{ margin: 0 }}>Notice the rhythm of work when nothing competes for your attention.</p>
          </div>
          <AdhdWorkspaceSim mode="baseline" onComplete={handleBaselineComplete} onAbort={() => setStep("instructions")} />
        </div>
      )}

      {step === "interrupted_intro" && (
        <div className="itw-flow-page itw-flow-narrow" key="interrupted_intro">
          <h2 className="itw-flow-title itw-center">Now, Run 2: Competing Pulls on Focus</h2>
          <p className="itw-flow-lead itw-center">
            {results.baseline
              ? `You finished the quiet run in ${results.baseline.time.toFixed(1)} seconds.`
              : "Great start."}
            {" "}Now, attempt the assignment under everyday conditions where notifications, chat pings, and internal thoughts compete for attention.
          </p>
          <ul className="itw-flow-list">
            <li><span aria-hidden="true">•</span> Notification toasts and group chat pings will appear around your workspace.</li>
            <li><span aria-hidden="true">•</span> Associative wandering thoughts may tempt you to branch into side tabs.</li>
            <li><span aria-hidden="true">•</span> Notice how much cognitive effort is spent re-orienting back to where you left off.</li>
          </ul>
          <div className="itw-flow-nav">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("run_baseline")}>Back to Run 1</button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("run_interrupted")}>
              Start Run 2 (Competing Pulls) →
            </button>
          </div>
        </div>
      )}

      {step === "run_interrupted" && (
        <div className="itw-flow-page" key="run_interrupted">
          <div className="itw-flow-readtop">
            <h2 className="itw-flow-title">Run 2: Competing Pulls on Attention</h2>
            <p className="itw-flow-lead" style={{ margin: 0 }}>Prepare and submit your brief while managing unexpected interruptions.</p>
          </div>
          <AdhdWorkspaceSim
            mode="interrupted"
            intensity={intensity}
            onComplete={handleInterruptedComplete}
            onAbort={() => setStep("interrupted_intro")}
          />
        </div>
      )}

      {step === "reflect" && (
        <div className="itw-flow-page itw-flow-narrow" key="reflect">
          <h2 className="itw-flow-title itw-center">What did you observe about your attention?</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              margin: "24px 0",
              background: "var(--itw-panel)",
              padding: 20,
              borderRadius: 20,
              border: "1px solid var(--itw-border)",
            }}
          >
            <div style={{ textAlign: "center", padding: 12 }}>
              <div style={{ fontSize: 13, textTransform: "uppercase", color: "var(--itw-muted)", fontWeight: 700 }}>
                Run 1 (Quiet)
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "var(--itw-text)", margin: "8px 0" }}>
                {results.baseline ? `${results.baseline.time.toFixed(1)}s` : "—"}
              </div>
              <div style={{ fontSize: 13, color: "var(--itw-muted)" }}>0 interruptions</div>
            </div>
            <div style={{ textAlign: "center", padding: 12, borderLeft: "1px solid var(--itw-border)" }}>
              <div style={{ fontSize: 13, textTransform: "uppercase", color: "var(--itw-adhd)", fontWeight: 700 }}>
                Run 2 (Competing Pulls)
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "var(--itw-adhd)", margin: "8px 0" }}>
                {results.interrupted ? `${results.interrupted.time.toFixed(1)}s` : "—"}
              </div>
              <div style={{ fontSize: 13, color: "var(--itw-muted)" }}>
                {results.interrupted ? `${results.interrupted.distractionsDismissed} dismissed • ${results.interrupted.distractionsDeferred || 0} snoozed • ${results.interrupted.tangentsExplored} tangents` : "—"}
              </div>
            </div>
          </div>

          <p className="itw-flow-lead" style={{ fontSize: 16, lineHeight: 1.6 }}>
            {results.baseline && results.interrupted && results.interrupted.time > results.baseline.time
              ? `In this round, interruptions and competing stimuli changed your task time by ${(results.interrupted.time - results.baseline.time).toFixed(1)} seconds. Recovering focus after each distraction required re-orienting to the task sequence. Breaking tasks into smaller steps or reducing non-essential interruptions may help in some contexts. This task is an observation of external distractions and scaffolding, not an ADHD test.`
              : "In this round, interruptions changed your task time. Recovering focus after each distraction required re-orienting to the task sequence. Breaking tasks into smaller steps or reducing non-essential interruptions may help in some contexts. This task is an observation of external distractions, not an ADHD test."}
          </p>

          <FlowQuestions
            questions={ADHD_REFLECT_QS}
            answers={reflectionAnswers}
            onPick={(qi, oi) => {
              setReflectionAnswers((prev) => {
                const next = [...prev];
                next[qi] = oi;
                return next;
              });
            }}
          />

          <div className="itw-flow-nav" style={{ marginTop: 24 }}>
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("run_interrupted")}>
              Re-run Task
            </button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("support")}>
              Try an Environmental Support →
            </button>
          </div>
        </div>
      )}

      {step === "support" && (
        <div className="itw-flow-page itw-flow-narrow" key="support">
          <h2 className="itw-flow-title itw-center">Change the environment: Try a support</h2>
          <p className="itw-flow-lead itw-center">
            Children with ADHD do not lack willpower — they thrive when the environment provides executive scaffolding. Choose an accommodation below to test its impact:
          </p>
          <div style={{ display: "grid", gap: 14, margin: "24px 0" }}>
            {ADHD_SUPPORT_CHOICES.map((s) => (
              <label
                key={s.id}
                style={{
                  display: "block",
                  padding: "16px 20px",
                  borderRadius: 18,
                  border: `2px solid ${chosenSupport === s.id ? "var(--itw-adhd)" : "var(--itw-border)"}`,
                  background: chosenSupport === s.id ? "var(--itw-adhd-soft)" : "var(--itw-panel)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontWeight: 800, fontSize: 17, color: "var(--itw-text)" }}>{s.title}</div>
                  <span
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                      padding: "3px 10px",
                      borderRadius: 99,
                      background: "var(--itw-panel-2)",
                      color: "var(--itw-muted)",
                    }}
                  >
                    {s.tag}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: "var(--itw-muted)", lineHeight: 1.5 }}>{s.desc}</div>
                <input
                  type="radio"
                  name="adhd-support"
                  value={s.id}
                  checked={chosenSupport === s.id}
                  onChange={() => setChosenSupport(s.id)}
                  style={{ display: "none" }}
                />
              </label>
            ))}
          </div>
          <div className="itw-flow-nav">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("reflect")}>Back</button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("run_supported")}>
              Run with Support →
            </button>
          </div>
        </div>
      )}

      {step === "run_supported" && (
        <div className="itw-flow-page" key="run_supported">
          <div className="itw-flow-readtop">
            <h2 className="itw-flow-title">Run 3: Supported by {ADHD_SUPPORT_CHOICES.find((s) => s.id === chosenSupport)?.title}</h2>
            <p className="itw-flow-lead" style={{ margin: 0 }}>
              {chosenSupport === "checklist" && "A high-contrast sidebar checklist anchors working memory and step progress."}
              {chosenSupport === "filter" && "Focus Shield has muted external notification popups to protect unbroken flow."}
              {chosenSupport === "chunking" && "Task Chunking isolates only the immediate next action to prevent overwhelm."}
            </p>
          </div>
          <AdhdWorkspaceSim
            mode="supported"
            supportType={chosenSupport}
            onComplete={handleSupportedComplete}
            onAbort={() => setStep("support")}
          />
        </div>
      )}

      {step === "explain" && (
        <div className="itw-flow-page itw-flow-narrow" key="explain">
          <h2 className="itw-flow-title itw-center">What this means in everyday life</h2>
          <p className="itw-flow-lead itw-center">
            {results.supported && results.interrupted
              ? `Supported time was ${results.supported.time.toFixed(1)}s (versus ${results.interrupted.time.toFixed(1)}s when unfiltered). Environmental accommodations create immediate, measurable reductions in cognitive friction.`
              : "Environmental scaffolding makes immediate, tangible differences in attention regulation."}
          </p>

          <div className="itw-flow-explain" style={{ margin: "24px 0" }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: "var(--itw-text)" }}>
              Understanding Attention Regulation
            </h3>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--itw-text)", marginBottom: 16 }}>
              ADHD is not a lack of intelligence or discipline — it is a neurodevelopmental difference in the dopamine
              pathways of the brain’s frontal lobe, which regulates executive functions such as working memory,
              prioritization, and filtering irrelevant stimulation.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--itw-text)", marginBottom: 16 }}>
              Not every person with ADHD experiences constant distracting thoughts or physical restlessness. ADHD manifests across
              diverse executive-function profiles: some individuals experience inattentive presentations with low task initiation
              unless external novelty is present; others experience intense hyperfocus on stimulating topics while struggling with
              mundane transitions; still others experience verbal or physical impulsivity. Understanding these heterogeneous profiles
              avoids the misconception that ADHD is simply &ldquo;having a chaotic mind&rdquo;.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--itw-text)" }}>
              When an environment is rich in unexpected pings, movements, or clutter, an ADHD nervous system treats
              nearly all inputs with equal urgency. Accommodations that structure the visual field, provide clear
              checkpoints, and allow physical movement preserve cognitive energy for actual learning.
            </p>
          </div>

          <div style={{ margin: "28px 0" }}>
            <div className="itw-block-label" style={{ marginBottom: 12 }}>Indian Prevalence &amp; Clinical Context</div>
            <FactsGrid
              facts={[
                {
                  num: "~6.3%",
                  label: "pooled prevalence (63.2 per 1,000 children; 95% CI: 4.9%–7.7%) across 19 Indian studies, with wide variation across diagnostic tools and regions",
                  src: "Chauhan et al. (2022), Systematic Review & Meta-Analysis (19 Indian studies)",
                },
                {
                  num: "7.1%",
                  label: "pooled prevalence reported in an earlier meta-analysis of 14 Indian studies (20,143 children/adolescents; 95% CI: 5.1%–9.8%)",
                  src: "Joseph & Devu (2019), Systematic Review & Meta-Analysis (14 studies)",
                },
                {
                  num: "1.3% – 28.9%",
                  label: "range across individual regional Indian cohorts, reflecting differing screening cutoffs and clinical diagnostic criteria",
                  src: "Indian Psychiatric Society Review of Epidemiological Studies",
                },
              ]}
              note="ADHD is an executive function difference, not a measure of character or intelligence. Variations across Indian reviews reflect differing screening tools, diagnostic criteria, and age bands. Scaffolding like chunking and visual anchors helps students engage their true abilities."
              onComplete={() => {}}
            />
          </div>

          <div style={{ margin: "32px 0" }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14, color: "var(--itw-text)" }}>
              Actionable Strategies That Help
            </h3>
            <StrategyTabs
              home={[
                "Break homework into small, numbered checklists (1 to 3 items) rather than broad open-ended directions.",
                "Use a visual analogue timer (like a Time Timer) so elapsed time is visible rather than abstract.",
                "Build in physical movement breaks between assignments — dopamine and motor activity are deeply linked.",
                "Keep homework desks visually uncluttered with only the immediate book or notebook in view.",
              ]}
              classroom={[
                "Provide seating near the front or away from high-traffic doors and windows as a supportive default.",
                "Chunk assignments into milestone checkpoints with immediate, gentle feedback.",
                "Permit unobtrusive fidget tools or flexible seating — physical movement often anchors auditory focus.",
                "Give explicit transition warnings 2 minutes before changing tasks or subjects.",
              ]}
            />
          </div>

          <div className="itw-flow-nav" style={{ marginTop: 32 }}>
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("instructions")}>
              Try ADHD flow again
            </button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("next")}>
              Next Steps →
            </button>
          </div>
          <HelpFooter />
        </div>
      )}

      {step === "next" && (
        <div className="itw-flow-page itw-flow-narrow" key="next">
          <h2 className="itw-flow-title itw-center">Scaffolding transforms potential into achievement</h2>
          <p className="itw-flow-lead itw-center">
            When we provide external structure and reduce unnecessary friction, children with ADHD can harness their deep creativity and problem-solving abilities.
          </p>
          <div className="itw-flow-nav itw-flow-nav-center">
            <a className="itw-cta itw-cta-dark" href="/assessments">Take an Assessment →</a>
            <a className="itw-cta itw-cta-line" href="/consult">Book a Consultation →</a>
          </div>
          <h3 className="itw-flow-h3">Explore More Experiences</h3>
          <div className="itw-flow-more">
            {more.map((m) => (
              <button
                type="button"
                key={m.key}
                className="itw-flow-more-card"
                data-m={m.key}
                onClick={() => onNavigate(m.key)}
              >
                <b>{m.name}</b>
                <span>{m.tag}</span>
                <i aria-hidden="true">→</i>
              </button>
            ))}
          </div>
          <div className="itw-flow-nav itw-flow-nav-center">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("explain")}>Back</button>
            <button type="button" className="itw-cta itw-cta-line" onClick={onBack}>All experiences</button>
          </div>
        </div>
      )}
    </section>
  );
}


/* ================= DYSLEXIA: 12-PASSAGE LIBRARY (6 MATCHED PAIRS) ================= */

const DYSLEXIA_PASSAGE_PAIRS = [
  {
    pairId: "monsoon_rainwater",
    pairTopic: "Monsoon Rainwater Harvesting",
    passageA: {
      passageId: "pair1_rainwater_harvest_a",
      title: "Maya's Terrace Rainwater Pots",
      wordCount: 107,
      sentenceCount: 5,
      text: "Maya watched the gray monsoon clouds gather above the bustling streets of Bengaluru before the sudden evening downpour arrived. Her grandfather carried three wide terracotta pots up to the open terrace to harvest the clean freshwater runoff from their sloping tin roof. Cool water gushed down the bamboo pipe, filling each clay jar to the brim in less than twenty minutes of steady rain. Maya scooped a polished brass tumbler of harvested water to refresh the fragrant tulsi and coriander flourishing in their balcony kitchen garden. She recorded the evening water level in her school nature journal before settling beside the window with a warm mug of spiced ginger tea.",
      questions: [
        {
          q: "What did Maya's grandfather carry to the terrace?",
          options: ["Metal storage tanks", "Three wide terracotta pots", "Plastic buckets and hoses"],
          correct: 1,
        },
        {
          q: "How long did it take for the jars to fill during the steady rain?",
          options: ["Nearly two hours", "Less than twenty minutes", "All through the night"],
          correct: 1,
        },
        {
          q: "What did Maya write in her school nature journal before tea?",
          options: ["The evening water level", "A poem about thunder", "Her homework answers"],
          correct: 0,
        },
      ],
    },
    passageB: {
      passageId: "pair1_rainwater_harvest_b",
      title: "Aarav's Well Recharge Pit",
      wordCount: 108,
      sentenceCount: 5,
      text: "Aarav checked the nylon mesh filter over the courtyard drainage pipe just as thunder echoed across the Chennai neighbourhood. His family had installed an underground recharge pit lined with coarse gravel and river sand to channel rain back into the dried well. Within minutes, clean sheets of storm runoff cascaded down the tiled verandah, swirling through the pebble layers into the dark sandy reservoir. Aarav held a flashlight close to the inspection hatch, watching the rising water level steadily replenish the deep family well. He noted the filter condition on the wall chart so his uncle could inspect the sediment trap before the next storm system swept inland.",
      questions: [
        {
          q: "What was the underground recharge pit lined with to filter the rain?",
          options: ["Charcoal briquettes and clay", "Concrete blocks and cloth", "Coarse gravel and river sand"],
          correct: 2,
        },
        {
          q: "Where did the storm runoff cascade from before entering the pebble layers?",
          options: ["The roadside ditch", "The tiled verandah", "The kitchen sink"],
          correct: 1,
        },
        {
          q: "Why did Aarav write a note on the wall chart?",
          options: ["To remind his uncle to inspect the sediment trap", "To ask for pocket money", "To cancel school next morning"],
          correct: 0,
        },
      ],
    },
  },
  {
    pairId: "terrace_garden",
    pairTopic: "Terrace Garden & Pollinators",
    passageA: {
      passageId: "pair2_terrace_garden_a",
      title: "Priya's Heirloom Seedlings",
      wordCount: 101,
      sentenceCount: 5,
      text: "Priya stepped onto the sunny terrace garden early Saturday morning carrying a wooden crate of red earthenware seedling pots. Her grandmother had carefully saved heirloom tomato seeds from last summer in a folded square of clean muslin cloth. Together they scooped dark compost made from dried neem leaves and vegetable peelings into each round pot, pressing the damp soil down gently. A pair of bright yellow butterflies fluttered around the blooming marigolds, brushing pollen across the delicate golden flower heads. Priya marked each ceramic pot with a small wooden popsicle stick so she would remember where the cherry tomatoes were planted.",
      questions: [
        {
          q: "What had Priya's grandmother saved inside a folded square of clean muslin cloth?",
          options: ["Dried chili peppers", "Heirloom tomato seeds", "Fresh flower petals"],
          correct: 1,
        },
        {
          q: "What ingredients were used to make the dark compost for the pots?",
          options: ["Dried neem leaves and vegetable peelings", "River mud and wood chips", "Chemical fertilizer granules"],
          correct: 0,
        },
        {
          q: "How did Priya label the ceramic pots so she would remember where the tomatoes were?",
          options: ["With painted river pebbles", "With colorful chalk markers", "With small wooden popsicle sticks"],
          correct: 2,
        },
      ],
    },
    passageB: {
      passageId: "pair2_terrace_garden_b",
      title: "Rohan's Rooftop Greenhouse",
      wordCount: 99,
      sentenceCount: 5,
      text: "Rohan climbed the spiral staircase leading to their rooftop greenhouse with a green watering can balanced carefully in his hands. Three honeybees hummed busily inside the bell-shaped white blossoms of the bell pepper vines strung along the south wall. He gently checked the drip irrigation tubing connected to their recycled blue drum to ensure each seedling received equal moisture. A small green caterpillar was quietly nibbling on a mint leaf, so Rohan lifted it onto a nearby jasmine branch instead. Satisfied that every plant was healthy, he recorded the morning temperature on the chalkboard hanging beside the terrace door.",
      questions: [
        {
          q: "Where were the bell pepper vines strung inside the rooftop greenhouse?",
          options: ["Over the metal roof rafters", "Along the south wall", "Inside plastic hanging baskets"],
          correct: 1,
        },
        {
          q: "What did Rohan do when he found a small green caterpillar on a mint leaf?",
          options: ["He moved it onto a nearby jasmine branch", "He gently washed it down the drain", "He left it to eat the whole leaf"],
          correct: 0,
        },
        {
          q: "What did Rohan record on the chalkboard hanging beside the terrace door?",
          options: ["The number of ripe tomatoes", "His daily watering schedule", "The morning temperature"],
          correct: 2,
        },
      ],
    },
  },
  {
    pairId: "lake_birds",
    pairTopic: "Wetlands & Bird Sanctuary",
    passageA: {
      passageId: "pair3_lake_birds_a",
      title: "Vedant at Vedanthangal Sanctuary",
      wordCount: 99,
      sentenceCount: 5,
      text: "Vedant adjusted the focus wheel on his father's binoculars while standing quietly on the wooden watchtower overlooking Vedanthangal bird sanctuary. Hundreds of painted storks nested among the submerged acacia branches, their pink and white feathers gleaming against the calm silver lake. A mother stork returned to her twig nest with a tiny silver fish caught from the shallow marsh waters below. Vedant sketched the curved black bill and long yellow legs of a spoonbill foraging through the floating water hyacinths. As evening mist settled across the wetlands, the park guide signaled that the viewing platform would close for the night.",
      questions: [
        {
          q: "What kind of trees were the painted storks nesting in across the lake?",
          options: ["Tall eucalyptus trees", "Submerged acacia branches", "Old banyan branches"],
          correct: 1,
        },
        {
          q: "What did the mother stork carry back to her twig nest?",
          options: ["A tiny silver fish", "A bundle of soft green moss", "A freshwater snail"],
          correct: 0,
        },
        {
          q: "What bird did Vedant sketch as it foraged through the water hyacinths?",
          options: ["A kingfisher", "A pelican", "A spoonbill"],
          correct: 2,
        },
      ],
    },
    passageB: {
      passageId: "pair3_lake_birds_b",
      title: "Ananya at Pulicat Lagoon",
      wordCount: 102,
      sentenceCount: 5,
      text: "Ananya stood beside the wooden railing at the Pulicat lagoon watching a flock of greater flamingos wading in shallow salt water. Their long curved necks swept back and forth through the muddy bottom, filtering microscopic pink algae through their bristled black bills. A sudden flock of black-winged stilts took flight nearby, their slender pink legs trailing gracefully through the cool morning breeze. Ananya counted forty-two flamingos resting on the sandbar before noting their feeding patterns in her wildlife observation field binder. When the fishing boats started their quiet morning run across the inlet, she packed her spotting scope into its canvas carrying bag.",
      questions: [
        {
          q: "What were the flamingos filtering from the muddy bottom of the lagoon?",
          options: ["Small water beetles", "Microscopic pink algae", "River reeds and seeds"],
          correct: 1,
        },
        {
          q: "How many flamingos did Ananya count resting on the sandbar?",
          options: ["Twenty-five", "Forty-two", "Sixty-four"],
          correct: 1,
        },
        {
          q: "What prompted Ananya to pack her spotting scope into its canvas bag?",
          options: ["Fishing boats starting their morning run", "A sudden heavy rainstorm", "The noon heat becoming too strong"],
          correct: 0,
        },
      ],
    },
  },
  {
    pairId: "science_fair",
    pairTopic: "School Science Exhibition",
    passageA: {
      passageId: "pair4_science_fair_a",
      title: "Diya's Solar Cooker Model",
      wordCount: 97,
      sentenceCount: 5,
      text: "Diya secured the cardboard solar cooker model onto the demonstration table in the crowded middle school auditorium. She had lined an old shoebox with shiny aluminum foil and fitted a black metal pan inside to absorb heat efficiently. When the judges stopped at her table, Diya placed a thermometer under the transparent plastic lid to demonstrate the greenhouse effect. Within fifteen minutes under the bright overhead halogen light, the interior air temperature rose by eight degrees Celsius. The head judge praised her clear presentation and asked how local farmers could scale the design for drying organic spices.",
      questions: [
        {
          q: "What did Diya use to line the inside of the shoebox solar cooker?",
          options: ["Dark brown wax paper", "Silver spray paint", "Shiny aluminum foil"],
          correct: 2,
        },
        {
          q: "How much did the temperature inside the cooker rise under the halogen lamp?",
          options: ["By eight degrees Celsius", "By twenty degrees Celsius", "By two degrees Celsius"],
          correct: 0,
        },
        {
          q: "What practical question did the head judge ask Diya about her design?",
          options: ["How much the materials cost to buy", "How farmers could scale it for drying spices", "Whether it could bake bread outdoors"],
          correct: 1,
        },
      ],
    },
    passageB: {
      passageId: "pair4_science_fair_b",
      title: "Kabir's Hydraulic Crane",
      wordCount: 103,
      sentenceCount: 5,
      text: "Kabir adjusted the brass balance weights on his tabletop hydraulic crane during the annual district science exhibition. He had linked two large plastic medical syringes with clear silicone tubing filled with dyed blue water to illustrate fluid pressure. When he pushed the primary syringe plunger inward, the hydraulic arm lifted a small brass block smoothly off the pine baseboard. Several younger students gathered around his display booth to try moving the lever and measuring the distance lifted on a millimeter ruler. Kabir explained how real excavators use the same hydraulic physics to move tons of earth during railway construction projects across India.",
      questions: [
        {
          q: "What was the clear silicone tubing on Kabir's crane model filled with?",
          options: ["Compressed air", "Dyed blue water", "Light mineral oil"],
          correct: 1,
        },
        {
          q: "What happened when Kabir pushed the primary syringe plunger inward?",
          options: ["The arm lifted a small brass block smoothly", "Water leaked out of the tube", "The pine baseboard tilted"],
          correct: 0,
        },
        {
          q: "What real-world machine did Kabir compare his hydraulic crane demonstration to?",
          options: ["Large wind turbine blades", "Automated car assembly robots", "Heavy excavators used in railway construction"],
          correct: 2,
        },
      ],
    },
  },
  {
    pairId: "pottery_craft",
    pairTopic: "Artisan Workshops & Craft",
    passageA: {
      passageId: "pair5_pottery_craft_a",
      title: "Meera at Kumbharwada",
      wordCount: 101,
      sentenceCount: 5,
      text: "Meera sat on a low wooden stool beside the electric pottery wheel in her uncle's busy Kumbharwada workshop. She centered a smooth mound of moist river clay between her cupped palms as the spinning wheel hummed rhythmically. Pressing her thumbs firmly into the exact center, she slowly drew the rising clay walls upward into a slender terracotta vase. Her uncle handed her a wet sponge to smooth out the rim before slicing the base free with a thin copper wire. They carried the finished vase out to the shaded courtyard where dozens of drying pots rested under warm afternoon sunlight.",
      questions: [
        {
          q: "What was the pottery wheel made of or how was it powered?",
          options: ["A wooden foot-pedal wheel", "An electric pottery wheel", "A hand-turned stone disk"],
          correct: 1,
        },
        {
          q: "What tool did Meera's uncle hand her to slice the base of the vase free from the wheel?",
          options: ["A thin copper wire", "A sharp wooden spatula", "A metal kitchen knife"],
          correct: 0,
        },
        {
          q: "Where were the finished pots placed to dry?",
          options: ["Inside a brick kiln", "On the rooftop water tank", "In the shaded courtyard"],
          correct: 2,
        },
      ],
    },
    passageB: {
      passageId: "pair5_pottery_craft_b",
      title: "Dev at the Textile Studio",
      wordCount: 96,
      sentenceCount: 5,
      text: "Dev pressed carved wooden printing blocks into a dish of natural indigo dye inside the Jaipur textile studio. He aligned the brass registration pins carefully against the selvedge of a long roll of handwoven cream khadi cotton. With two firm taps of his wooden mallet, the intricate floral motif transferred cleanly onto the stretched damp fabric. His master printer examined the sharpness of the blue lines and praised the consistent pressure across every stamped petal. Together they draped the five-meter stamped runner over bamboo poles suspended from the ceiling to dry in the warm breeze.",
      questions: [
        {
          q: "What type of dye was Dev using for his woodblock printing?",
          options: ["Synthetic acrylic paint", "Natural indigo dye", "Turmeric yellow extract"],
          correct: 1,
        },
        {
          q: "What tool did Dev tap against the wooden block to transfer the pattern?",
          options: ["A rubber hammer", "A wooden mallet", "His bare hand"],
          correct: 1,
        },
        {
          q: "How was the finished fabric hung to dry?",
          options: ["Over bamboo poles suspended from the ceiling", "Stretched flat on outdoor grass", "Inside an electric drying machine"],
          correct: 0,
        },
      ],
    },
  },
  {
    pairId: "train_journey",
    pairTopic: "Scenic Indian Railways",
    passageA: {
      passageId: "pair6_train_journey_a",
      title: "Arjun on the Nilgiri Mountain Railway",
      wordCount: 108,
      sentenceCount: 5,
      text: "Arjun pulled down the tinted glass window of the Nilgiri Mountain Railway coach as the vintage diesel engine chugged up the steep grade. Fragrant pine mist drifted through the carriage, carrying the fresh scent of wild mountain eucalyptus and damp tea plantations. The train crawled across a high stone viaduct spanning a roaring waterfall that cascaded hundreds of feet into the gorge below. A troop of bonnet macaques sat on the mossy rock ledge, watching the passengers with curious amber eyes as the whistle blew. Arjun took a sip of hot cardamom tea from his steel flask just as the train entered a curved stone tunnel.",
      questions: [
        {
          q: "What scent drifted into the carriage as the mountain train climbed the grade?",
          options: ["Roasted peanuts and dry dust", "Wild mountain eucalyptus and damp tea plantations", "Ocean breeze and salt spray"],
          correct: 1,
        },
        {
          q: "What structure did the train cross over a roaring waterfall?",
          options: ["A high stone viaduct", "A swinging rope bridge", "A modern steel truss bridge"],
          correct: 0,
        },
        {
          q: "What kind of tea was Arjun drinking from his steel flask?",
          options: ["Sweet lemon iced tea", "Plain green herbal tea", "Hot cardamom tea"],
          correct: 2,
        },
      ],
    },
    passageB: {
      passageId: "pair6_train_journey_b",
      title: "Kavya along the Konkan Coast",
      wordCount: 102,
      sentenceCount: 5,
      text: "Kavya watched the lush coconut palms sway in the wind as the Konkan express swept past the quiet backwaters of coastal Kerala. Traditional wooden houseboats drifted along the emerald canals, their woven bamboo roofs framed against the bright blue tropical sky. At the village railway station, vendors carried wicker baskets filled with warm spiced banana fritters wrapped in fresh green leaves. Her mother bought a steaming packet to share while Kavya unfolded the regional tourist map to trace their route toward Kochi. The afternoon light cast long golden reflections across the water as the train accelerated smoothly along the coastal track.",
      questions: [
        {
          q: "What kind of boats were drifting along the emerald canals outside the train window?",
          options: ["Traditional wooden houseboats with woven bamboo roofs", "Speedboats with modern outboard motors", "White canvas sailboats"],
          correct: 0,
        },
        {
          q: "What snack did the vendors sell in wicker baskets at the station?",
          options: ["Roasted corn on the cob", "Warm spiced banana fritters wrapped in leaves", "Steamed rice cakes with chutney"],
          correct: 1,
        },
        {
          q: "What city were Kavya and her mother traveling toward on the regional map?",
          options: ["Madurai", "Goa", "Kochi"],
          correct: 2,
        },
      ],
    },
  },
];

const ITW_DYS_ORDER_KEY = "itw_dys_order";
const ITW_DYS_LAST_KEY = "itw_dys_last_pair";

function readJson(store, key) {
  try { return JSON.parse(store.getItem(key)); } catch { return null; }
}

function buildDyslexiaOrder(avoidFirst) {
  const n = DYSLEXIA_PASSAGE_PAIRS.length;
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  // never start a new cycle with the pair that just finished
  if (n > 1 && order[0] === avoidFirst) order.push(order.shift());
  return order;
}

/* Shuffled cycle: every pair is used once before any repeats; a reshuffle never
   starts with the most recently completed pair; the last completed pair is also
   remembered across browser sessions so a new session does not open on it. */
function getActiveDyslexiaPairIndex() {
  if (typeof window === "undefined") return 0;
  const n = DYSLEXIA_PASSAGE_PAIRS.length;
  try {
    let st = readJson(sessionStorage, ITW_DYS_ORDER_KEY);
    if (!st || !Array.isArray(st.order) || st.order.length !== n || st.pos >= n) {
      let last = null;
      try { last = parseInt(localStorage.getItem(ITW_DYS_LAST_KEY), 10); } catch {}
      st = { order: buildDyslexiaOrder(Number.isNaN(last) ? null : last), pos: 0 };
      sessionStorage.setItem(ITW_DYS_ORDER_KEY, JSON.stringify(st));
    }
    return st.order[st.pos];
  } catch {
    // storage unavailable: pick randomly rather than silently reusing pair 0
    return Math.floor(Math.random() * n);
  }
}

function advanceActiveDyslexiaPairIndex() {
  if (typeof window === "undefined") return;
  try {
    const st = readJson(sessionStorage, ITW_DYS_ORDER_KEY);
    if (!st) return;
    try { localStorage.setItem(ITW_DYS_LAST_KEY, String(st.order[st.pos])); } catch {}
    st.pos += 1;
    if (st.pos >= st.order.length) {
      st.order = buildDyslexiaOrder(st.order[st.order.length - 1]);
      st.pos = 0;
    }
    sessionStorage.setItem(ITW_DYS_ORDER_KEY, JSON.stringify(st));
  } catch {}
}

/* ================= Shared flow pieces (breadcrumb, stepper, radio questions) ================= */

function FlowCrumbs({ name, onBack }) {
  return (
    <nav className="itw-crumbs" aria-label="Breadcrumb">
      <button type="button" className="itw-crumb-link" onClick={onBack}>In Their World • Experiences</button>
      <span aria-hidden="true">›</span>
      <span aria-current="page">{name}</span>
    </nav>
  );
}

function FlowStepper({ steps, current }) {
  const currentStep = steps[current] || steps[0];
  return (
    <div className="itw-stepper-wrap">
      <ol className="itw-stepper" aria-label="Progress">
        {steps.map((s, i) => (
          <li
            key={s.key}
            className={`itw-step${i === current ? " itw-step-on" : ""}${i < current ? " itw-step-done" : ""}`}
            aria-current={i === current ? "step" : undefined}
          >
            <span className="itw-step-dot">{i + 1}</span>
          </li>
        ))}
      </ol>
      {currentStep && (
        <div className="itw-stepper-current-pill">
          <span className="itw-stepper-pill-count">Step {current + 1} of {steps.length}</span>
          <span className="itw-stepper-pill-sep">•</span>
          <span className="itw-stepper-pill-label">{currentStep.label}</span>
        </div>
      )}
    </div>
  );
}

function FlowQuestions({ questions, answers, onPick }) {
  return (
    <ol className="itw-flow-qs">
      {questions.map((item, qi) => (
        <li key={qi} className="itw-flow-q">
          <p>{item.q}</p>
          <div className="itw-flow-opts" role="radiogroup" aria-label={item.q}>
            {item.options.map((opt, oi) => (
              <label key={oi} className={`itw-flow-opt${answers[qi] === oi ? " itw-active" : ""}`}>
                <input type="radio" name={`flow-q-${qi}`} checked={answers[qi] === oi} onChange={() => onPick(qi, oi)} />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ================= DYSLEXIA: 8-step flow ================= */

const DYS_STEPS = [
  { key: "instructions", label: "Instructions" },
  { key: "read", label: "Run 1 (Standard)" },
  { key: "questions", label: "Check 1" },
  { key: "result", label: "Reflect & Compare" },
  { key: "support", label: "Choose Supports" },
  { key: "run_supported", label: "Run 2 (Supported)" },
  { key: "questions_supported", label: "Check 2" },
  { key: "explain", label: "Takeaways & Data" },
];
const DYS_STEP_INDEX = {
  instructions: 0,
  read: 1,
  questions: 2,
  result: 3,
  support: 4,
  run_supported: 5,
  questions_supported: 6,
  explain: 7,
  next: 7,
};

const DYS_NOTICE = [
  { icon: "🐢", text: "Slower reading speed" },
  { icon: "✏️", text: "Difficulty with spelling" },
  { icon: "📏", text: "Losing track of lines" },
  { icon: "⏳", text: "Needing more time and support" },
];

const DYS_SUPPORT_CHOICES = [
  {
    id: "spacing",
    title: "Dyslexia-Friendly Letter & Line Spacing",
    subtitle: "Expanded kerning & 2.15x line height",
    desc: "Expands whitespace between lines and characters, reducing visual crowding and preventing line-skipping.",
    tag: "Visual Scaffolding",
  },
  {
    id: "ruler",
    title: "Reading Ruler / Focus Line Guide",
    subtitle: "Tinted guide overlay underneath active line",
    desc: "Anchors visual tracking with a soft contrast highlight, preventing jumping between paragraphs.",
    tag: "Tracking Support",
  },
  {
    id: "audio",
    title: "Multi-Modal Audio Read-Aloud",
    subtitle: "Auditory narration accompaniment",
    desc: "Uses speech synthesis to read the passage aloud, liberating cognitive bandwidth for meaning and comprehension.",
    tag: "Multi-Modal Access",
  },
];

function DyslexiaModule({ onBack, onNavigate }) {
  const { soundOn } = useContext(SettingsContext);
  const [pairIndex, setPairIndex] = useState(() => getActiveDyslexiaPairIndex());
  const activePair = DYSLEXIA_PASSAGE_PAIRS[pairIndex % DYSLEXIA_PASSAGE_PAIRS.length];

  const [step, setStep] = useState("intro"); // intro | instructions | read | questions | result | support | run_supported | questions_supported | explain
  const [elapsed, setElapsed] = useState(0);
  const [run1Elapsed, setRun1Elapsed] = useState(0);
  const [run1Score, setRun1Score] = useState(0);
  const [run2Elapsed, setRun2Elapsed] = useState(0);
  const [run2Score, setRun2Score] = useState(0);

  const [answersRun1, setAnswersRun1] = useState(() => Array(3).fill(null));
  const [answersRun2, setAnswersRun2] = useState(() => Array(3).fill(null));
  const [chosenSupport, setChosenSupport] = useState("spacing");

  // Reader toolbar controls for Run 2
  const [fontSize, setFontSize] = useState("large"); // normal | large | xlarge
  const [lineSpacing, setLineSpacing] = useState("relaxed"); // normal | relaxed | spacious
  const [letterSpacing, setLetterSpacing] = useState("wide"); // normal | wide | xwide
  const [readingRuler, setReadingRuler] = useState(true);
  const [rulerY, setRulerY] = useState(48);
  const [activeTint, setActiveTint] = useState("cream"); // none | cream | yellow | sage | blue | lavender
  const [useOpenDyslexic, setUseOpenDyslexic] = useState(false);

  // Audio Speech Synthesis state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const startRef = useRef(0);
  const doneRef = useRef(false);

  // Clean up speech synthesis when navigating away or unmounting
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (step !== "run_supported") {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        queueMicrotask(() => {
          setIsSpeaking(false);
          setIsPaused(false);
        });
      }
    }
  }, [step]);

  // Live stopwatch timer for reading runs
  useEffect(() => {
    if (step !== "read" && step !== "run_supported") return undefined;
    doneRef.current = false;
    startRef.current = performance.now();
    queueMicrotask(() => setElapsed(0));
    const tickId = setInterval(() => {
      const now = (performance.now() - startRef.current) / 1000;
      setElapsed(now);
    }, 100);
    return () => clearInterval(tickId);
  }, [step]);

  // Finish Run 1 (Standard reading)
  const finishRun1Reading = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    const t = (performance.now() - startRef.current) / 1000;
    setRun1Elapsed(t);
    if (soundOn) audio.tone({ freq: 480, type: "sine", duration: 0.2, gain: 0.1 });
    setAnswersRun1(Array(3).fill(null));
    setStep("questions");
  };

  // Submit Check 1 (Run 1 questions)
  const submitCheck1 = () => {
    const questions = activePair.passageA.questions;
    const correct = answersRun1.filter((a, i) => a === questions[i].correct).length;
    setRun1Score(correct);
    if (soundOn) {
      audio.tone({ freq: 523, type: "sine", duration: 0.16, gain: 0.1 });
      audio.tone({ freq: 659, type: "sine", duration: 0.2, gain: 0.09, delay: 0.09 });
    }
    setStep("result");
  };

  // Finish Run 2 (Supported reading)
  const finishRun2Reading = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    const t = (performance.now() - startRef.current) / 1000;
    setRun2Elapsed(t);
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
    if (soundOn) audio.tone({ freq: 480, type: "sine", duration: 0.2, gain: 0.1 });
    setAnswersRun2(Array(3).fill(null));
    setStep("questions_supported");
  };

  // Submit Check 2 (Run 2 questions)
  const submitCheck2 = () => {
    const questions = activePair.passageB.questions;
    const correct = answersRun2.filter((a, i) => a === questions[i].correct).length;
    setRun2Score(correct);
    advanceActiveDyslexiaPairIndex();
    if (soundOn) {
      audio.tone({ freq: 523, type: "sine", duration: 0.16, gain: 0.1 });
      audio.tone({ freq: 659, type: "sine", duration: 0.2, gain: 0.09, delay: 0.09 });
    }
    setStep("explain");
  };

  // TTS speech functions
  const playSpeech = (text) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    const indianVoice = findIndianVoice();
    if (indianVoice) u.voice = indianVoice;
    u.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    u.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    window.speechSynthesis.speak(u);
    setIsSpeaking(true);
    setIsPaused(false);
  };

  const pauseSpeech = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  };

  const resumeSpeech = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
  };

  const stopSpeech = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  // Reading ruler pointer tracking
  const handleRulerMouseMove = (e) => {
    if (!readingRuler) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = Math.max(12, Math.min(e.clientY - rect.top, rect.height - 48));
    setRulerY(relativeY);
  };

  const handleRulerTouchMove = (e) => {
    if (!readingRuler || !e.touches[0]) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = Math.max(12, Math.min(e.touches[0].clientY - rect.top, rect.height - 48));
    setRulerY(relativeY);
  };

  // Calculate typography styles
  const fontSizes = { normal: "1.15rem", large: "1.32rem", xlarge: "1.55rem" };
  const lineHeights = { normal: 1.65, relaxed: 2.15, spacious: 2.6 };
  const letterSpacings = { normal: "normal", wide: "0.06em", xwide: "0.12em" };

  const currentTypoStyle = {
    fontSize: fontSizes[fontSize] || fontSizes.large,
    lineHeight: lineHeights[lineSpacing] || lineHeights.relaxed,
    letterSpacing: letterSpacings[letterSpacing] || letterSpacings.wide,
  };

  const tintStyles = {
    none: {},
    cream: { background: "rgba(253, 248, 238, 0.92)" },
    yellow: { background: "rgba(254, 249, 195, 0.55)" },
    sage: { background: "rgba(220, 252, 231, 0.55)" },
    blue: { background: "rgba(224, 242, 254, 0.55)" },
    lavender: { background: "rgba(243, 232, 255, 0.55)" },
  };

  const allRun1Answered = answersRun1.every((a) => a !== null);
  const allRun2Answered = answersRun2.every((a) => a !== null);
  const stepIndex = DYS_STEP_INDEX[step];
  const more = MODULES.filter((m) => m.key !== "dyslexia");

  return (
    <section className="itw-view itw-module itw-flow" data-accent="dyslexia">
      <FlowCrumbs name="Dyslexia" onBack={onBack} />
      {stepIndex !== undefined && <FlowStepper steps={DYS_STEPS} current={stepIndex} />}

      {step === "intro" && (
        <div className="itw-flow-page itw-flow-intro" key="intro">
          <div>
            <h2 className="itw-flow-title">Dyslexia</h2>
            <div className="itw-flow-sub">Reading, Decoding &amp; Access to Meaning</div>
            <p className="itw-flow-lead">
              Dyslexia is a language-processing difference that primarily affects phonological decoding and reading fluency.
              It is not a vision defect or a measure of intelligence. In this experience, you will explore the mental effort
              involved in decoding text and observe how accommodations transform the reading journey on matched passages.
            </p>
            <ul className="itw-flow-meta">
              <li><span aria-hidden="true">⏱️</span> Takes 2–3 minutes</li>
              <li><span aria-hidden="true">📖</span> Two parallel reading passages ({activePair.pairTopic})</li>
              <li><span aria-hidden="true">ℹ️</span> An interactive learning experience, not a clinical diagnostic tool</li>
            </ul>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("instructions")}>
              Start the Experience →
            </button>
          </div>
          <IntroVignette moduleKey="dyslexia" />
        </div>
      )}

      {step === "instructions" && (
        <div className="itw-flow-page itw-flow-narrow" key="instructions">
          <div className="itw-scene-plate">
            <img src="/decor/itw/dyslexia-environment.webp" alt="School library study corner" className="itw-scene-plate-img" />
            <div className="itw-scene-plate-overlay">
              <span className="itw-scene-tag">📍 Setting • Afternoon in the School Library</span>
              <p className="itw-scene-caption">A quiet library corner bathed in natural light. The joy of curiosity, accompanied by the cognitive work of phonological decoding.</p>
            </div>
          </div>
          <h2 className="itw-flow-title itw-center">Before you begin: An honest, evidence-based framing</h2>
          <p className="itw-flow-lead itw-center">
            In the next screen, you will read a short passage at your own comfortable pace, followed by three comprehension questions.
          </p>
          <div
            style={{
              background: "rgba(30, 117, 93, 0.08)",
              border: "1.5px solid var(--itw-dyslexia)",
              borderRadius: 16,
              padding: "16px 20px",
              margin: "20px 0",
              fontSize: 14.5,
              lineHeight: 1.6,
              color: "var(--itw-text)",
            }}
          >
            <b>International Dyslexia Association Guidance:</b> Dyslexia is a language-based neurobiological difference in phonological processing — the brain&apos;s mechanism for mapping written symbols to spoken sounds. It is <i>not</i> an optical vision problem, and letters do not physically swap, dance, or move across the page in real life. In this activity, you will read clean, standard text at your own pace to observe how reading time and comprehension interact.
          </div>
          <ul className="itw-flow-list">
            <li><span aria-hidden="true">⏱️</span> Read at your natural, comfortable pace — the task is completely untimed.</li>
            <li><span aria-hidden="true">🧠</span> Focus on the meaning of the story; comprehension is the real goal of reading.</li>
            <li><span aria-hidden="true">💛</span> When you are ready, click &ldquo;I&apos;ve finished reading&rdquo;.</li>
          </ul>
          <div className="itw-flow-nav">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("intro")}>Back</button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("read")}>Start Reading →</button>
          </div>
        </div>
      )}

      {step === "read" && (
        <div className="itw-flow-page itw-flow-narrow" key="read">
          <div className="itw-flow-readtop">
            <div>
              <h2 className="itw-flow-title" style={{ margin: 0 }}>Run 1: Standard Untimed Reading</h2>
              <span style={{ fontSize: 13, color: "var(--itw-muted)" }}>
                {activePair.pairTopic} • {activePair.passageA.title} ({activePair.passageA.wordCount} words)
              </span>
            </div>
            <div className="itw-timer" role="status" aria-label="Reading time elapsed">
              <span>Reading Time</span>
              <b>{elapsed.toFixed(1)}s</b>
            </div>
          </div>

          <Viewfinder
            hud={{ left: "STANDARD READING", right: "UNTIMED" }}
            stageStyle={{ minHeight: "auto", background: "var(--itw-panel)" }}
          >
            {/* Interactive Passage Topic Picker */}
            <div className="itw-passage-picker" role="radiogroup" aria-label="Choose a reading topic">
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-muted)", marginRight: 6 }}>
                📚 Choose Topic:
              </span>
              {DYSLEXIA_PASSAGE_PAIRS.map((p, idx) => (
                <button
                  key={p.pairId}
                  type="button"
                  className={`itw-passage-chip${idx === pairIndex % DYSLEXIA_PASSAGE_PAIRS.length ? " itw-active" : ""}`}
                  onClick={() => {
                    setPairIndex(idx);
                    setAnswersRun1(Array(3).fill(null));
                    setAnswersRun2(Array(3).fill(null));
                  }}
                >
                  {p.pairTopic}
                </button>
              ))}
            </div>

            <div className="itw-reading-passage" style={{ fontSize: "1.25rem", lineHeight: 1.8, padding: "20px 8px" }}>
              <p>{activePair.passageA.text}</p>
            </div>
          </Viewfinder>
          <div className="itw-flow-nav">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("instructions")}>Back</button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={finishRun1Reading}>I&apos;ve finished reading →</button>
          </div>
        </div>
      )}

      {step === "questions" && (
        <div className="itw-flow-page itw-flow-narrow" key="questions">
          <h2 className="itw-flow-title">Check 1: Comprehension Check</h2>
          <p className="itw-flow-note">The passage is now hidden — answer based on what you remember from {activePair.passageA.title}:</p>
          <FlowQuestions
            questions={activePair.passageA.questions}
            answers={answersRun1}
            onPick={(qi, oi) => {
              setAnswersRun1((prev) => {
                const c = [...prev];
                c[qi] = oi;
                return c;
              });
            }}
          />
          <div className="itw-flow-nav">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("read")}>Re-read Passage</button>
            <button type="button" className="itw-cta itw-cta-dark" disabled={!allRun1Answered} onClick={submitCheck1}>
              See Results →
            </button>
          </div>
        </div>
      )}

      {step === "result" && (
        <div className="itw-flow-page itw-flow-narrow" key="result">
          <h2 className="itw-flow-title itw-center">Reading Reflection</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              margin: "24px 0",
              background: "var(--itw-panel)",
              padding: 20,
              borderRadius: 20,
              border: "1px solid var(--itw-border)",
            }}
          >
            <div style={{ textAlign: "center", padding: 12 }}>
              <div style={{ fontSize: 13, textTransform: "uppercase", color: "var(--itw-muted)", fontWeight: 700 }}>Reading Time</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: "var(--itw-text)", margin: "8px 0" }}>{run1Elapsed.toFixed(1)}s</div>
              <div style={{ fontSize: 13, color: "var(--itw-muted)" }}>~{Math.round((activePair.passageA.wordCount / (run1Elapsed || 1)) * 60)} WPM</div>
            </div>
            <div style={{ textAlign: "center", padding: 12, borderLeft: "1px solid var(--itw-border)" }}>
              <div style={{ fontSize: 13, textTransform: "uppercase", color: "var(--itw-dyslexia)", fontWeight: 700 }}>Comprehension</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: "var(--itw-dyslexia)", margin: "8px 0" }}>{run1Score} / 3</div>
              <div style={{ fontSize: 13, color: "var(--itw-muted)" }}>Accuracy on detail questions</div>
            </div>
          </div>
          <p className="itw-flow-lead">
            In neurotypical reading, phonological decoding is largely automated, allowing the mind to focus entirely on story meaning.
            In dyslexic readers, decoding requires active, conscious mental energy — similar to translating an unfamiliar cipher.
            When readers are given visual guidance, tinted overlays, expanded whitespace, or audio support, that decoding barrier eases substantially.
          </p>
          <div className="itw-flow-nav itw-flow-nav-center">
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("support")}>
              Explore Accommodations →
            </button>
          </div>
        </div>
      )}

      {step === "support" && (
        <div className="itw-flow-page itw-flow-narrow" key="support">
          <h2 className="itw-flow-title itw-center">Choose Your Reading Accommodations</h2>
          <p className="itw-flow-lead itw-center">
            Select the accommodations you want to explore on the parallel passage ({activePair.passageB.title}):
          </p>
          <div className="itw-flow-cards" role="radiogroup" aria-label="Reading accommodation options">
            {DYS_SUPPORT_CHOICES.map((choice) => {
              const selected = chosenSupport === choice.id;
              return (
                <div
                  key={choice.id}
                  role="radio"
                  aria-checked={selected}
                  tabIndex={0}
                  className={`itw-flow-card${selected ? " itw-active" : ""}`}
                  onClick={() => setChosenSupport(choice.id)}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      setChosenSupport(choice.id);
                    }
                  }}
                >
                  <span className="itw-flow-card-tag">{choice.tag}</span>
                  <div className="itw-flow-card-title">{choice.title}</div>
                  <div className="itw-flow-card-sub">{choice.subtitle}</div>
                  <p className="itw-flow-card-desc">{choice.desc}</p>
                </div>
              );
            })}
          </div>
          <div className="itw-flow-nav itw-flow-nav-center">
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("run_supported")}>
              Apply &amp; Read Passage 2 →
            </button>
          </div>
        </div>
      )}

      {step === "run_supported" && (
        <div className="itw-flow-page itw-flow-narrow" key="run_supported">
          <div className="itw-flow-readtop">
            <div>
              <h2 className="itw-flow-title" style={{ margin: 0 }}>Run 2: Supported Reading</h2>
              <span style={{ fontSize: 13, color: "var(--itw-muted)" }}>
                {activePair.pairTopic} • {activePair.passageB.title} ({activePair.passageB.wordCount} words)
              </span>
            </div>
            <div className="itw-timer" role="status" aria-label="Supported reading time">
              <span>Reading Time</span>
              <b>{elapsed.toFixed(1)}s</b>
            </div>
          </div>

          {/* Accommodation Toolbar */}
          <div className="itw-reader-toolbar" role="toolbar" aria-label="Reading accommodations controls">
            <div className="itw-toolbar-group">
              <span className="itw-toolbar-label">Text Size</span>
              <div className="itw-toolbar-btn-group" role="group" aria-label="Text size options">
                <button
                  type="button"
                  className={`itw-toolbar-btn${fontSize === "normal" ? " itw-active" : ""}`}
                  onClick={() => setFontSize("normal")}
                >
                  A
                </button>
                <button
                  type="button"
                  className={`itw-toolbar-btn${fontSize === "large" ? " itw-active" : ""}`}
                  onClick={() => setFontSize("large")}
                >
                  A+
                </button>
                <button
                  type="button"
                  className={`itw-toolbar-btn${fontSize === "xlarge" ? " itw-active" : ""}`}
                  onClick={() => setFontSize("xlarge")}
                >
                  A++
                </button>
              </div>
            </div>

            <div className="itw-toolbar-group">
              <span className="itw-toolbar-label">Line Spacing</span>
              <div className="itw-toolbar-btn-group" role="group" aria-label="Line spacing options">
                <button
                  type="button"
                  className={`itw-toolbar-btn${lineSpacing === "normal" ? " itw-active" : ""}`}
                  onClick={() => setLineSpacing("normal")}
                >
                  1.6x
                </button>
                <button
                  type="button"
                  className={`itw-toolbar-btn${lineSpacing === "relaxed" ? " itw-active" : ""}`}
                  onClick={() => setLineSpacing("relaxed")}
                >
                  2.1x
                </button>
                <button
                  type="button"
                  className={`itw-toolbar-btn${lineSpacing === "spacious" ? " itw-active" : ""}`}
                  onClick={() => setLineSpacing("spacious")}
                >
                  2.6x
                </button>
              </div>
            </div>

            <div className="itw-toolbar-group">
              <span className="itw-toolbar-label">Kerning</span>
              <div className="itw-toolbar-btn-group" role="group" aria-label="Letter spacing options">
                <button
                  type="button"
                  className={`itw-toolbar-btn${letterSpacing === "normal" ? " itw-active" : ""}`}
                  onClick={() => setLetterSpacing("normal")}
                >
                  Standard
                </button>
                <button
                  type="button"
                  className={`itw-toolbar-btn${letterSpacing === "wide" ? " itw-active" : ""}`}
                  onClick={() => setLetterSpacing("wide")}
                >
                  Wide
                </button>
                <button
                  type="button"
                  className={`itw-toolbar-btn${letterSpacing === "xwide" ? " itw-active" : ""}`}
                  onClick={() => setLetterSpacing("xwide")}
                >
                  Extra Wide
                </button>
              </div>
            </div>

            <div className="itw-toolbar-group">
              <button
                type="button"
                className={`itw-toolbar-btn${readingRuler ? " itw-active" : ""}`}
                style={{ borderRadius: 10, padding: "7px 12px", border: "1.5px solid var(--itw-border)" }}
                onClick={() => setReadingRuler(!readingRuler)}
              >
                {readingRuler ? "📏 Ruler: ON" : "📏 Ruler: OFF"}
              </button>
              {readingRuler && (
                <div className="itw-toolbar-btn-group" role="group" aria-label="Ruler line adjust">
                  <button
                    type="button"
                    className="itw-toolbar-btn"
                    onClick={() => setRulerY((y) => Math.max(12, y - 36))}
                    aria-label="Move reading ruler up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="itw-toolbar-btn"
                    onClick={() => setRulerY((y) => Math.min(260, y + 36))}
                    aria-label="Move reading ruler down"
                  >
                    ▼
                  </button>
                </div>
              )}
            </div>

            {/* Tint Overlay Selector */}
            <div className="itw-toolbar-group">
              <span className="itw-toolbar-label">Color Tint</span>
              <div className="itw-toolbar-btn-group" role="group" aria-label="Color tint overlay">
                {[
                  { id: "none", label: "None" },
                  { id: "cream", label: "Cream" },
                  { id: "yellow", label: "Warm" },
                  { id: "sage", label: "Sage" },
                  { id: "blue", label: "Sky" },
                  { id: "lavender", label: "Soft" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`itw-toolbar-btn${activeTint === t.id ? " itw-active" : ""}`}
                    onClick={() => setActiveTint(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Family Toggle */}
            <div className="itw-toolbar-group">
              <button
                type="button"
                className={`itw-toolbar-btn${useOpenDyslexic ? " itw-active" : ""}`}
                style={{ borderRadius: 10, padding: "7px 12px", border: "1.5px solid var(--itw-border)" }}
                onClick={() => setUseOpenDyslexic(!useOpenDyslexic)}
              >
                {useOpenDyslexic ? "🔤 OpenDyslexic: ON" : "🔤 Clean Sans"}
              </button>
            </div>

            {/* Multi-modal Speech Synthesis Read-Aloud */}
            <div className="itw-tts-controls">
              {!isSpeaking ? (
                <button
                  type="button"
                  className="itw-tts-btn"
                  onClick={() => playSpeech(activePair.passageB.text)}
                >
                  <span>🔊</span> Listen Aloud
                </button>
              ) : (
                <>
                  {!isPaused ? (
                    <button type="button" className="itw-tts-btn itw-active" onClick={pauseSpeech}>
                      <span>⏸</span> Pause
                    </button>
                  ) : (
                    <button type="button" className="itw-tts-btn" onClick={resumeSpeech}>
                      <span>▶</span> Resume
                    </button>
                  )}
                  <button type="button" className="itw-tts-btn" onClick={stopSpeech}>
                    <span>⏹</span> Stop
                  </button>
                </>
              )}
            </div>
          </div>

          <Viewfinder
            hud={{ left: "SUPPORTED READING", right: "ACCOMMODATIONS ACTIVE" }}
            stageStyle={{
              minHeight: "auto",
              ...currentTypoStyle,
              ...(tintStyles[activeTint] || {}),
              position: "relative",
              cursor: readingRuler ? "row-resize" : "default",
            }}
          >
            <div
              className={`itw-reading-passage${useOpenDyslexic ? " itw-font-opendyslexic" : ""}`}
              style={{ ...currentTypoStyle, position: "relative" }}
              onMouseMove={handleRulerMouseMove}
              onTouchMove={handleRulerTouchMove}
            >
              {readingRuler && (
                <div
                  className="itw-reading-ruler-bar"
                  style={{ top: `${rulerY}px` }}
                  aria-hidden="true"
                />
              )}
              <p style={{ ...currentTypoStyle, margin: 0 }}>
                {activePair.passageB.text}
              </p>
            </div>
          </Viewfinder>

          <div className="itw-flow-nav">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("support")}>Back</button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={finishRun2Reading}>I&apos;ve finished reading →</button>
          </div>
        </div>
      )}

      {step === "questions_supported" && (
        <div className="itw-flow-page itw-flow-narrow" key="questions_supported">
          <h2 className="itw-flow-title">Check 2: Comprehension Check</h2>
          <p className="itw-flow-note">Answer based on what you remember from {activePair.passageB.title}:</p>
          <FlowQuestions
            questions={activePair.passageB.questions}
            answers={answersRun2}
            onPick={(qi, oi) => {
              setAnswersRun2((prev) => {
                const c = [...prev];
                c[qi] = oi;
                return c;
              });
            }}
          />
          <div className="itw-flow-nav">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("run_supported")}>Re-read Passage</button>
            <button type="button" className="itw-cta itw-cta-dark" disabled={!allRun2Answered} onClick={submitCheck2}>
              See Final Takeaways →
            </button>
          </div>
        </div>
      )}

      {step === "explain" && (
        <div className="itw-flow-page itw-flow-narrow" key="explain">
          <div className="itw-scene-plate">
            <img src="/decor/itw/dyslexia-environment.webp" alt="School library study corner" className="itw-scene-plate-img" />
            <div className="itw-scene-plate-overlay">
              <span className="itw-scene-tag">📍 Insight • Language &amp; Neurodiversity</span>
              <p className="itw-scene-caption">With intentional accommodations, dyslexic learners excel and bring unique strengths to society.</p>
            </div>
          </div>

          <h2 className="itw-flow-title itw-center">What We Learned About Dyslexia</h2>
          <p className="itw-flow-lead itw-center">
            Dyslexia is an architectural variation in the brain&apos;s language circuits. When schools provide multi-sensory phonics, unhurried reading time, and assistive tools, reading barriers diminish.
          </p>

          {/* Comparison summary */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              margin: "24px 0",
              background: "var(--itw-panel)",
              padding: 20,
              borderRadius: 20,
              border: "1.5px solid var(--itw-border)",
            }}
          >
            <div style={{ textAlign: "center", padding: 12 }}>
              <div style={{ fontSize: 13, textTransform: "uppercase", color: "var(--itw-muted)", fontWeight: 700 }}>Run 1 (Standard)</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "var(--itw-text)", margin: "8px 0" }}>{run1Elapsed.toFixed(1)}s</div>
              <div style={{ fontSize: 13, color: "var(--itw-muted)" }}>{run1Score} / 3 Correct</div>
            </div>
            <div style={{ textAlign: "center", padding: 12, borderLeft: "1px solid var(--itw-border)" }}>
              <div style={{ fontSize: 13, textTransform: "uppercase", color: "var(--itw-dyslexia)", fontWeight: 700 }}>Run 2 (Supported)</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "var(--itw-dyslexia)", margin: "8px 0" }}>{run2Elapsed.toFixed(1)}s</div>
              <div style={{ fontSize: 13, color: "var(--itw-muted)" }}>{run2Score} / 3 Correct</div>
            </div>
          </div>

          <h3 className="itw-flow-h3">The Data: Indian Context</h3>
          <FactsGrid
            facts={[
              {
                num: "10%–15%",
                label: "estimated prevalence of dyslexic reading traits in Indian school cohorts, affecting approximately 35 million schoolchildren across linguistic regions",
                src: "Dyslexia Association of India (DAI) & AIISH National Survey",
              },
              {
                num: "Multilingual",
                label: "In India, children often learn reading across multiple scripts (e.g. English + regional script). Transparent phonetic scripts (like Tamil, Hindi, or Kannada) show different decoding patterns than irregular English spelling.",
                src: "NCERT Department of Education of Groups with Special Needs",
              },
              {
                num: "RPwD Act 2016",
                label: "Recognized Specific Learning Disabilities (including Dyslexia) as an official protected category under Indian law, guaranteeing school accommodations and exam compensatory time.",
                src: "Rights of Persons with Disabilities Act (Government of India)",
              },
            ]}
            note="Clinical studies across Chennai, Mumbai, and Delhi show that early multi-sensory remediation and structured phonics instruction before grade 3 normalize reading comprehension outcomes for over 90% of children with dyslexia."
            onComplete={() => {}}
          />

          <h3 className="itw-flow-h3">Evidence-Based Classroom Accommodations</h3>
          <ul className="itw-strat-list">
            <li>
              <b>Systematic Multi-Sensory Phonics:</b> Structured Orton-Gillingham methods that pair tactile letter tracing with auditory phonemes and visual cards.
            </li>
            <li>
              <b>Reading Rulers &amp; Tinted Overlays:</b> Physical or digital focus bars that block out extraneous text lines and reduce visual stress.
            </li>
            <li>
              <b>Audio Accompaniment (Text-to-Speech):</b> Allowing students to listen to grade-level textbooks so vocabulary and scientific concepts advance unhindered.
            </li>
            <li>
              <b>Compensatory Exam Time:</b> Providing 20 additional minutes per hour and exemption from negative marking for spelling errors.
            </li>
          </ul>

          <div className="itw-flow-nav itw-flow-nav-center" style={{ marginTop: 32, display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
            <a href="/consult" className="itw-cta itw-cta-dark" style={{ textDecoration: "none" }}>
              Book a Free Remedial Consultation
            </a>
            <button type="button" className="itw-cta itw-cta-line" onClick={() => onNavigate("speech")}>
              Next Experience: Speech &amp; Language →
            </button>
            <button type="button" className="itw-cta itw-cta-line" onClick={onBack}>
              ← Back to All Experiences
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ================= SPEECH & LANGUAGE: Communication Access Studio ================= */

const SPEECH_SCENARIOS = [
  {
    id: "stuttering",
    title: "Scenario A: A Student Who Stutters",
    student: "Rohan (Grade 8)",
    topic: "Classroom Science Discussion • Plant Respiration",
    context: "Rohan is contributing an explanation about plant transpiration and leaf stomata during a whole-class science discussion.",
    barrierDescription: "Fast-paced classroom expectations, classmates guessing his words, and listener advice to 'slow down' create unnecessary pressure around natural speech fluency.",
    practices: [
      {
        id: "give_time",
        label: "Allow Unhurried Time",
        desc: "Offer calm conversational pacing without impatience, desk-tapping, or time pressure.",
      },
      {
        id: "no_finish",
        label: "Never Finish Sentences",
        desc: "Honor sentence ownership; do not guess words or complete thoughts for the speaker.",
      },
      {
        id: "message_focus",
        label: "Focus on Message Content",
        desc: "Respond directly to the scientific insight rather than commenting on speech delivery or fluency.",
      },
      {
        id: "relational_respect",
        label: "Respectful Relational Presence",
        desc: "Maintain warm, comfortable engagement without demanding fixed eye contact, which can add discomfort.",
      },
    ],
  },
  {
    id: "aac",
    title: "Scenario B: A Student Who Uses AAC",
    student: "Ananya (Grade 7)",
    topic: "Science Exhibition Showcase • Water Filtration",
    context: "Ananya uses a dynamic tablet AAC device with symbol tiles to explain her two-stage water purification model to visitors.",
    barrierDescription: "Visitors often address Ananya's peer assistant instead of looking at her, touch her device without permission, or rush her while she navigates symbol folders.",
    practices: [
      {
        id: "direct_address",
        label: "Address Student Directly",
        desc: "Address Ananya directly, while respecting her preferred position, gaze, communication method, and device.",
      },
      {
        id: "device_autonomy",
        label: "Respect Device Autonomy",
        desc: "Never touch, grab, or alter an AAC system without explicit permission. It is personal physical space.",
      },
      {
        id: "compose_time",
        label: "Allow Composition Time",
        desc: "Recognize that navigating symbol folders and assembling multi-word phrases requires unhurried motor time.",
      },
      {
        id: "multimodal",
        label: "Welcome Multi-Modal Output",
        desc: "Value synthesized device voice, diagram pointing, gestures, and vocalizations equally.",
      },
    ],
  },
  {
    id: "language_time",
    title: "Scenario C: Processing Time & Clear Prompts",
    student: "Kavi (Grade 5)",
    topic: "Chemistry Investigation • Litmus Acid-Base Test",
    context: "The teacher checks in with Kavi during a chemistry lab where blue litmus paper turns red in lemon juice.",
    barrierDescription: "A compound three-part question asked in rapid succession can add verbal demands and make it harder for some learners to organize a response; rapid rephrasing adds competing verbal input before thoughts can be assembled.",
    practices: [
      {
        id: "clear_prompt",
        label: "Ask One Clear Question",
        desc: "Break compound questions into a single, focused inquiry at a time.",
      },
      {
        id: "processing_time",
        label: "Allow Processing Silence",
        desc: "Offer generous silent thinking time without jumping in with rapid rephrasings that introduce competing verbal input.",
      },
      {
        id: "visual_anchor",
        label: "Provide Visual Anchors",
        desc: "Point to labeled charts, diagrams, or key vocabulary cards on the lab table.",
      },
      {
        id: "varied_response",
        label: "Welcome Varied Response Modes",
        desc: "Accept pointing to the chart, keyword notes, or verbal replies as valid scientific communication.",
      },
    ],
  },
];

const AAC_SAMPLE_TILES = [
  { id: "sand", label: "Sand Layer", icon: "🏖️" },
  { id: "traps", label: "Traps", icon: "🪤" },
  { id: "sediment", label: "Fine Sediment", icon: "🪨" },
  { id: "clean", label: "Clean Water", icon: "💧" },
  { id: "test", label: "Tested With Team", icon: "🤝" },
  { id: "charcoal", label: "Charcoal Layer", icon: "🪵" },
];

function getSpeechDialogue(scenarioId, activePractices) {
  const has = (id) => activePractices.includes(id);

  if (scenarioId === "stuttering") {
    const giveTime = has("give_time");
    const noFinish = has("no_finish");
    const messageFocus = has("message_focus");
    const respect = has("relational_respect");

    const turns = [
      {
        speaker: "Teacher (Classroom Science Discussion)",
        text: "Rohan, can you explain how leaf stomata regulate water loss during a hot afternoon?",
      },
      {
        speaker: "Rohan (Student)",
        text: "The moisture... [pause] ... escapes through microscopic pores called stomata.",
      },
    ];

    // Turn 3: Partner Pacing & Sentence Ownership reaction
    if (giveTime && noFinish) {
      turns.push({
        speaker: "Conversation Partner (Patient & Attentive)",
        text: "(Waits quietly and attentively at a natural pace while Rohan completes his thought.)",
        isSuccess: true,
      });
    } else if (!giveTime && !noFinish) {
      turns.push({
        speaker: "Classmate (Interruption & Guessing)",
        text: "Stomata! You mean stomata, right? Quick, just spit it out, the bell is going to ring!",
        isAlert: true,
      });
    } else if (giveTime && !noFinish) {
      turns.push({
        speaker: "Classmate (Jumping In)",
        text: "Are you trying to say stomata? Here, let me finish it for you: they close up!",
        isAlert: true,
      });
    } else {
      turns.push({
        speaker: "Teacher (Pacing Pressure)",
        text: "Rohan, please hurry up, we have four other questions to cover before the period ends.",
        isAlert: true,
      });
    }

    // Turn 4: Rohan completes thought
    turns.push({
      speaker: "Rohan (Student)",
      text: "When the air is dry, the guard cells close the pores to prevent the plant from wilting.",
    });

    // Turn 5: Feedback & Presence
    if (messageFocus && respect) {
      turns.push({
        speaker: "Teacher (Scientific Engagement)",
        text: "Spot on, Rohan. Guard cells respond directly to ambient humidity to conserve moisture. That is excellent reasoning.",
        isSuccess: true,
      });
    } else if (!messageFocus && !respect) {
      turns.push({
        speaker: "Teacher (Fluency Critique & Eye Contact Demand)",
        text: "Look at me when you answer, Rohan. You knew the answer, but try taking a deep breath so you don't hesitate next time.",
        isAlert: true,
      });
    } else if (messageFocus && !respect) {
      turns.push({
        speaker: "Teacher (Eye Contact Demand)",
        text: "Good scientific point, Rohan. But make sure you keep your eyes locked on me when answering in class.",
        isAlert: true,
      });
    } else {
      turns.push({
        speaker: "Teacher (Fluency Focus)",
        text: "You got the definition, but remember to practice your breathing rhythm so words flow without pauses.",
        isAlert: true,
      });
    }

    return turns;
  }

  if (scenarioId === "aac") {
    const direct = has("direct_address");
    const autonomy = has("device_autonomy");
    const compTime = has("compose_time");
    const multimodal = has("multimodal");

    const turns = [];

    // Turn 1: Opening address
    if (direct) {
      turns.push({
        speaker: "Exhibition Visitor (Speaking Directly to Ananya)",
        text: "Hello Ananya, could you tell us how your two-stage water filtration model works?",
        isSuccess: true,
      });
    } else {
      turns.push({
        speaker: "Exhibition Visitor (Talking About Ananya to Peer Assistant)",
        text: "Can she explain to us what this sand filtration model does? Does she know how it works?",
        isAlert: true,
      });
    }

    // Turn 2: Device handling & composition
    if (autonomy && compTime) {
      turns.push({
        speaker: "Ananya (Navigating AAC Symbol Pages)",
        text: "(Selects [ Science ] → [ Water Project ] → [ Filtration Layers ] on her communication device unhurriedly.)",
        isSuccess: true,
      });
    } else if (!autonomy && !compTime) {
      turns.push({
        speaker: "Visitor (Intruding on Device & Rushing)",
        text: "(Leans over Ananya's shoulder and reaches toward her screen) 'Let me tap that button for you... is it this one? Hurry up, other parents want to see!'",
        isAlert: true,
      });
    } else if (!autonomy && compTime) {
      turns.push({
        speaker: "Visitor (Touching Device)",
        text: "(Points fingers directly onto Ananya's personal tablet screen) 'Let me scroll that folder down for you...'",
        isAlert: true,
      });
    } else {
      turns.push({
        speaker: "Visitor (Rushing Composition)",
        text: "(Taps foot and sighs) 'Can you tap faster? We have to visit five more project booths before lunch.'",
        isAlert: true,
      });
    }

    // Turn 3: Assembled AAC expression
    turns.push({
      speaker: "Ananya (Composed AAC Message)",
      text: "[ Sand Layer ] + [ Traps ] + [ Fine Sediment ] + [ Clean Water ]",
    });

    // Turn 4: Delivery & Reception
    if (multimodal) {
      turns.push({
        speaker: "AAC Device Voice & Ananya (Multi-Modal Delivery)",
        text: "“The sand layer traps fine sediment before the charcoal filter.” (Ananya points to the water sample vial.)",
        isSuccess: true,
      });
      turns.push({
        speaker: "Visitor (Respectful Feedback)",
        text: "Thank you, Ananya! Pointing to that vial makes the sediment removal crystal clear. That is great engineering.",
        isSuccess: true,
      });
    } else {
      turns.push({
        speaker: "Visitor (Demanding Spoken Speech)",
        text: "The tablet is nice, but can't you just explain it out loud with your actual voice for the judging criteria?",
        isAlert: true,
      });
    }

    return turns;
  }

  // Scenario C: language_time
  const clearPrompt = has("clear_prompt");
  const procTime = has("processing_time");
  const visualAnchor = has("visual_anchor");
  const variedMode = has("varied_response");

  const turns = [];

  // Turn 1: Teacher Prompt
  if (clearPrompt) {
    turns.push({
      speaker: "Teacher (Focused Single Prompt)",
      text: "Kavi, look at the blue litmus strip we dipped in the lemon juice. What does the red color indicate?",
      isSuccess: true,
    });
  } else {
    turns.push({
      speaker: "Teacher (Compound Barrage)",
      text: "Kavi, why did the litmus paper turn red, what does that say about pH and hydronium ions, and did you write down the formula?",
      isAlert: true,
    });
  }

  // Turn 2: Processing window & Visual support
  if (procTime && visualAnchor) {
    turns.push({
      speaker: "Teacher & Environment (Patient Silence + Visual Support)",
      text: "(Teacher allows an unhurried pause and gestures to the color-coded pH scale on the laboratory bench. Kavi observes the strip and chart.)",
      isSuccess: true,
    });
  } else if (!procTime && !visualAnchor) {
    turns.push({
      speaker: "Teacher (Rapid Rephrasing Without Visuals)",
      text: "(Interrupts before the learner has time to respond) 'Was it acid or base, Kavi? Come on, is it sour? Quick, answer before the bell!'",
      isAlert: true,
    });
  } else if (procTime && !visualAnchor) {
    turns.push({
      speaker: "Teacher (Patient Silence Without Visuals)",
      text: "(Teacher allows an unhurried pause, but without pointing to any visual diagram or vocabulary card on the table.)",
    });
  } else {
    turns.push({
      speaker: "Teacher (Interrupting Despite Visuals)",
      text: "(Points to the chart, but interrupts before the learner has time to formulate a response: 'Acid or base? Quick!')",
      isAlert: true,
    });
  }

  // Turn 3: Response Mode
  if (variedMode) {
    turns.push({
      speaker: "Kavi & Teacher (Flexible Communication Accepted)",
      text: "Kavi points to 'Acid (pH < 7)' on the chart and says: 'The red color means lemon juice is an acid.' Teacher replies: 'Spot on, Kavi. The red litmus test confirms high acidity.'",
      isSuccess: true,
    });
  } else {
    turns.push({
      speaker: "Teacher (Demanding Formal Oral Recitation)",
      text: "Kavi points to the chart, but teacher says: 'No pointing, Kavi! Use a full grammatical sentence out loud or it doesn't count for lab points.'",
      isAlert: true,
    });
  }

  return turns;
}

function CommunicationAccessStudio() {
  const { soundOn } = useContext(SettingsContext);
  const [activeScenarioId, setActiveScenarioId] = useState("stuttering");
  const [enabledPractices, setEnabledPractices] = useState({
    stuttering: ["give_time", "no_finish"],
    aac: ["direct_address", "device_autonomy"],
    language_time: ["clear_prompt", "processing_time"],
  });
  const [aacMessage, setAacMessage] = useState([]);
  const [aacSpeechStatus, setAacSpeechStatus] = useState("idle"); // idle | playing | stopped | unsupported
  const [liveAnnouncement, setLiveAnnouncement] = useState("");

  const currentScenario = SPEECH_SCENARIOS.find((s) => s.id === activeScenarioId) || SPEECH_SCENARIOS[0];
  const activePractices = enabledPractices[activeScenarioId] || [];

  // Cleanup speech synthesis on unmount or scenario change
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeScenarioId]);

  const togglePractice = (practiceId) => {
    if (soundOn) audio.cue("tap");
    setEnabledPractices((prev) => {
      const current = prev[activeScenarioId] || [];
      const updated = current.includes(practiceId)
        ? current.filter((id) => id !== practiceId)
        : [...current, practiceId];
      return { ...prev, [activeScenarioId]: updated };
    });
  };

  const handleTileClick = (tile) => {
    if (soundOn) audio.cue("tap");
    if (aacMessage.some((t) => t.id === tile.id)) return;
    setAacMessage((prev) => [...prev, tile]);
    setLiveAnnouncement(`Added ${tile.label} to message.`);
  };

  const handleClearAac = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setAacMessage([]);
    setAacSpeechStatus("idle");
    setLiveAnnouncement("AAC message cleared.");
  };

  const handleStopAac = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setAacSpeechStatus("stopped");
    setLiveAnnouncement("Speech output stopped.");
  };

  // Explicit user-initiated AAC Speech Output (works independently of global soundOn)
  const handlePlayAac = () => {
    if (aacMessage.length === 0) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setAacSpeechStatus("unsupported");
      setLiveAnnouncement("Speech synthesis is not supported in this browser environment.");
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const sentence = aacMessage.map((t) => t.label).join(" ");
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.onstart = () => {
        setAacSpeechStatus("playing");
        setLiveAnnouncement(`Playing message: ${sentence}`);
      };
      utterance.onend = () => {
        setAacSpeechStatus("idle");
        setLiveAnnouncement("Message playback finished.");
      };
      utterance.onerror = () => {
        setAacSpeechStatus("idle");
      };
      window.speechSynthesis.speak(utterance);
    } catch {
      setAacSpeechStatus("unsupported");
      setLiveAnnouncement("Speech synthesis encountered an error.");
    }
  };

  const dialogueTurns = getSpeechDialogue(activeScenarioId, activePractices);
  const inactivePractices = currentScenario.practices.filter((p) => !activePractices.includes(p.id));

  return (
    <div className="itw-studio-wrap" role="region" aria-label="Communication Access Studio">
      {/* Accessible Live Region for Announcements */}
      <div className="itw-sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      {/* Studio Header */}
      <div className="itw-studio-header" style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-speech)", letterSpacing: "0.08em" }}>
          Interactive Practice Studio
        </span>
        <h3 style={{ fontSize: 24, fontWeight: 800, color: "var(--itw-text)", margin: "4px 0 8px" }}>
          Making Room for Diverse Ways of Communicating
        </h3>
        <p style={{ fontSize: 14.5, color: "var(--itw-muted)", maxWidth: "70ch", margin: 0 }}>
          Communication is a collaborative exchange, not a solo performance. Explore how adjusting listener habits,
          conversational pacing, and relational practices transforms classroom accessibility.
        </p>
      </div>

      {/* Scenario Selection Tabs */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 22 }} role="tablist" aria-label="Classroom Scenarios">
        {SPEECH_SCENARIOS.map((s) => {
          const isActive = s.id === activeScenarioId;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`itw-cta ${isActive ? "itw-cta-dark" : "itw-cta-line"}`}
              style={{ fontSize: 13.5, padding: "10px 20px" }}
              onClick={() => {
                if (typeof window !== "undefined" && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                }
                setAacSpeechStatus("idle");
                setActiveScenarioId(s.id);
              }}
            >
              {s.title}
            </button>
          );
        })}
      </div>

      {/* Active Scenario Card */}
      <div style={{ padding: 22, borderRadius: 18, border: "1.5px solid var(--itw-border)", background: "var(--itw-panel)", marginBottom: 24, boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-speech)" }}>
              {currentScenario.student} • {currentScenario.topic}
            </span>
            <h4 style={{ fontSize: 18, fontWeight: 800, color: "var(--itw-text)", margin: "2px 0" }}>
              {currentScenario.title}
            </h4>
          </div>
          <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 99, background: activePractices.length === 4 ? "rgba(5, 176, 118, 0.12)" : "rgba(244, 117, 34, 0.12)", color: activePractices.length === 4 ? "#05b076" : "#f47522", fontWeight: 700 }}>
            {activePractices.length === 4
              ? "All 4 Accommodations Active"
              : `${activePractices.length} of 4 Practices Enabled (${inactivePractices.length} Barrier${inactivePractices.length > 1 ? "s" : ""} Remaining)`}
          </span>
        </div>
        <p style={{ fontSize: 14.5, color: "var(--itw-muted)", lineHeight: 1.6, margin: 0 }}>
          {currentScenario.context}
        </p>
      </div>

      {/* Interactive Practices Palette */}
      <div style={{ marginBottom: 26 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <h4 style={{ fontSize: 15, fontWeight: 800, color: "var(--itw-text)", margin: 0 }}>
            Classroom Communication Practices (Click to Toggle):
          </h4>
          <span style={{ fontSize: 12.5, color: "var(--itw-muted)" }}>
            {activePractices.length} of {currentScenario.practices.length} practices enabled
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          {currentScenario.practices.map((p) => {
            const isEnabled = activePractices.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={isEnabled}
                onClick={() => togglePractice(p.id)}
                style={{
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: isEnabled ? "1.5px solid #05b076" : "1.5px solid var(--itw-border)",
                  background: isEnabled ? "rgba(5, 176, 118, 0.08)" : "var(--itw-panel)",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: isEnabled ? "#05b076" : "var(--itw-text)" }}>
                    {isEnabled ? "✓ " : "+ "}{p.label}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isEnabled ? "#05b076" : "var(--itw-muted)", textTransform: "uppercase" }}>
                    {isEnabled ? "Enabled" : "Off"}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: "var(--itw-muted)", lineHeight: 1.45 }}>
                  {p.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reactive Dialogue Preview */}
      <div style={{ padding: 22, borderRadius: 18, border: "1.5px solid var(--itw-border)", background: "var(--itw-panel)", marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, borderBottom: "1px solid var(--itw-border)", paddingBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-muted)", letterSpacing: "0.06em" }}>
            Live Dialogue Preview • Dynamic Response to Enabled Choices
          </span>
          <span style={{ fontSize: 12, color: activePractices.length === 4 ? "#05b076" : "#f47522", fontWeight: 700 }}>
            {activePractices.length === 4
              ? "All Practices Active"
              : `${inactivePractices.length} Barrier${inactivePractices.length > 1 ? "s" : ""} Present in Exchange`}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {dialogueTurns.map((d, idx) => (
            <div
              key={idx}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                background: d.isAlert
                  ? "rgba(220, 38, 38, 0.08)"
                  : d.isSuccess
                  ? "rgba(5, 176, 118, 0.08)"
                  : "rgba(0, 0, 0, 0.02)",
                border: d.isAlert
                  ? "1px solid rgba(220, 38, 38, 0.25)"
                  : d.isSuccess
                  ? "1px solid rgba(5, 176, 118, 0.25)"
                  : "1px solid transparent",
              }}
            >
              <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: "uppercase", color: d.isAlert ? "#dc2626" : d.isSuccess ? "#05b076" : "var(--itw-muted)", marginBottom: 3 }}>
                {d.speaker}
              </div>
              <div style={{ fontSize: 14.5, color: "var(--itw-text)", lineHeight: 1.5, fontWeight: d.isAlert || d.isSuccess ? 700 : 500 }}>
                {d.text}
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Accommodations Impact Summary */}
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px dashed var(--itw-border)", display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-text)" }}>
            Current Interaction Dynamics:
          </span>
          <ul style={{ margin: 0, paddingLeft: "1.2em", fontSize: 13, color: "var(--itw-muted)", lineHeight: 1.5 }}>
            {activePractices.map((pid) => {
              const p = currentScenario.practices.find((item) => item.id === pid);
              return p ? (
                <li key={pid} style={{ color: "#05b076" }}>
                  <b>Active:</b> {p.label} — {p.desc}
                </li>
              ) : null;
            })}
            {inactivePractices.map((p) => (
              <li key={p.id} style={{ color: "#dc2626" }}>
                <b>Inactive Barrier:</b> {p.label} is currently disabled in the palette.
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Optional AAC Message Construction Sandbox for Scenario B */}
      {activeScenarioId === "aac" && (
        <div style={{ padding: 22, borderRadius: 18, border: "1.5px dashed var(--itw-border)", background: "rgba(244, 117, 34, 0.04)", marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-speech)" }}>
                Illustrative AAC Message Construction
              </span>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--itw-text)", margin: "2px 0" }}>
                Explore How Symbol Tiles Assemble Ideas
              </h4>
            </div>
            <span style={{ fontSize: 12, color: "var(--itw-muted)" }}>
              One illustrative grid layout • AAC tools vary per person
            </span>
          </div>

          <div style={{ minHeight: 46, padding: "10px 14px", borderRadius: 12, background: "var(--itw-panel)", border: "1px solid var(--itw-border)", marginBottom: 14, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            {aacMessage.length === 0 ? (
              <span style={{ color: "var(--itw-muted)", fontStyle: "italic", fontSize: 13.5 }}>
                Tap symbol tiles below to construct a multi-word message...
              </span>
            ) : (
              aacMessage.map((t) => (
                <span key={t.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, background: "rgba(5, 176, 118, 0.12)", color: "#05b076", fontSize: 13, fontWeight: 700 }}>
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </span>
              ))
            )}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {AAC_SAMPLE_TILES.map((t) => {
              const isSelected = aacMessage.some((m) => m.id === t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleTileClick(t)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 10,
                    border: isSelected ? "1.5px solid #05b076" : "1.5px solid var(--itw-border)",
                    background: isSelected ? "rgba(5, 176, 118, 0.08)" : "var(--itw-panel)",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--itw-text)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* AAC Voice Output Controls (Explicit user trigger, independent of global soundOn) */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              className="itw-cta itw-cta-dark"
              style={{ fontSize: 13, padding: "8px 18px" }}
              disabled={aacMessage.length === 0 || aacSpeechStatus === "playing"}
              onClick={handlePlayAac}
            >
              🔊 Play Message (Speech Output)
            </button>
            <button
              type="button"
              className="itw-cta itw-cta-line"
              style={{ fontSize: 13, padding: "8px 18px" }}
              disabled={aacSpeechStatus !== "playing"}
              onClick={handleStopAac}
            >
              ⏹️ Stop Message
            </button>
            <button
              type="button"
              className="itw-cta itw-cta-line"
              style={{ fontSize: 13, padding: "8px 18px" }}
              disabled={aacMessage.length === 0}
              onClick={handleClearAac}
            >
              ✕ Clear Message
            </button>
          </div>

          {aacSpeechStatus === "playing" && (
            <div style={{ marginTop: 10, fontSize: 12.5, color: "#05b076", fontWeight: 700 }}>
              🔊 Speech output active: “{aacMessage.map((t) => t.label).join(" ")}”
            </div>
          )}

          {aacSpeechStatus === "unsupported" && (
            <div style={{ marginTop: 10, fontSize: 12.5, color: "#f47522", fontWeight: 600 }}>
              ℹ️ Web Speech Synthesis API is not available in this browser environment. Assembled text display remains fully active.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SpeechModule({ onBack, onNavigate }) {
  const [tab, setTab] = useState("studio"); // studio | explain

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [tab]);

  return (
    <section className="itw-view itw-module itw-flow" data-accent="speech">
      <FlowCrumbs name="Speech &amp; Communication Access" onBack={onBack} />

      {tab === "studio" && (
        <div className="itw-flow-page" key="studio">
          <div className="itw-flow-readtop">
            <h2 className="itw-flow-title">Communication Access Studio</h2>
            <div className="itw-flow-sub">Classroom Conversational Pacing, Partner Practices &amp; Multi-Modal AAC</div>
            <p className="itw-flow-lead" style={{ margin: 0 }}>
              Explore how listening habits, conversational pacing, and relational respect transform access for students
              who stutter, students who use AAC, and students who benefit from processing time.
            </p>
          </div>

          <CommunicationAccessStudio />

          <div className="itw-flow-nav itw-flow-nav-center" style={{ marginTop: 28 }}>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setTab("explain")}>
              View Clinical Principles &amp; Indian Context →
            </button>
            <button type="button" className="itw-cta itw-cta-line" onClick={onBack}>
              ← Back to All Experiences
            </button>
          </div>
        </div>
      )}

      {tab === "explain" && (
        <div className="itw-flow-page itw-flow-narrow" key="explain">
          <h2 className="itw-flow-title itw-center">Understanding Speech, Language &amp; Communication</h2>
          <div className="itw-flow-sub itw-center">Key Distinctions in Clinical Communication Science</div>

          <p className="itw-flow-lead">
            Communication differences are diverse and multi-faceted. Understanding the distinction between fluency,
            motor speech, language formulation, and AAC prevents common misconceptions. Communication preferences vary across individuals.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, margin: "20px 0" }}>
            <div style={{ padding: 18, borderRadius: 14, background: "var(--itw-panel)", border: "1.5px solid var(--itw-border)" }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-speech)" }}>Domain 1</span>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--itw-text)", margin: "4px 0 6px" }}>Speech Fluency (Stuttering)</h4>
              <p style={{ fontSize: 13, color: "var(--itw-muted)", margin: 0, lineHeight: 1.5 }}>
                Rhythm and flow of speech, involving repetitions, prolongations, or blocks. Fluency does not reflect intelligence, knowledge, or vocabulary depth.
              </p>
            </div>

            <div style={{ padding: 18, borderRadius: 14, background: "var(--itw-panel)", border: "1.5px solid var(--itw-border)" }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-speech)" }}>Domain 2</span>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--itw-text)", margin: "4px 0 6px" }}>Motor Speech Production (Apraxia)</h4>
              <p style={{ fontSize: 13, color: "var(--itw-muted)", margin: 0, lineHeight: 1.5 }}>
                Neurological planning and coordination of muscle movements required for articulating sounds. The student knows the word, but the motor execution plan requires targeted therapy.
              </p>
            </div>

            <div style={{ padding: 18, borderRadius: 14, background: "var(--itw-panel)", border: "1.5px solid var(--itw-border)" }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-speech)" }}>Domain 3</span>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--itw-text)", margin: "4px 0 6px" }}>Language Formulation &amp; Processing</h4>
              <p style={{ fontSize: 13, color: "var(--itw-muted)", margin: 0, lineHeight: 1.5 }}>
                Organizing thoughts into grammatical syntax and processing spoken language. Providing generous processing time and single-concept prompts supports accurate retrieval.
              </p>
            </div>

            <div style={{ padding: 18, borderRadius: 14, background: "var(--itw-panel)", border: "1.5px solid var(--itw-border)" }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-speech)" }}>Domain 4</span>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--itw-text)", margin: "4px 0 6px" }}>Augmentative &amp; Alternative Communication (AAC)</h4>
              <p style={{ fontSize: 13, color: "var(--itw-muted)", margin: 0, lineHeight: 1.5 }}>
                An umbrella term for communication systems ranging from picture exchange boards and communication books to dynamic eye-gaze speech-generating tablets.
              </p>
            </div>
          </div>

          <h3 className="itw-flow-h3">The Data: Indian Context</h3>
          <FactsGrid
            facts={[
              {
                num: "1.68% Regional Stuttering Cohort",
                label: "A localized epidemiological survey of 3,437 school children aged 6–15 years in Dakshina Kannada district, Karnataka, identified a stuttering prevalence of 1.68%. Researchers emphasize that this district-level finding reflects a specific regional primary and secondary school sample and should not be generalized as a national prevalence estimate or applied across all speech, language, or communication differences.",
                src: "Varghese et al. (2023). Prevalence of stuttering among school age children in Dakshina Kannada district of Karnataka, India. Clinical Epidemiology and Global Health, 22, 101327. DOI: 10.1016/j.cegh.2023.101327",
              },
              {
                num: "Multilingual Classrooms",
                label: "In multilingual Indian classroom settings, speech-language pathologists and educators highlight the importance of distinguishing natural bilingual formulation pauses, code-switching, and second-language lexical retrieval from developmental speech sound or fluency disorders.",
                src: "Multilingual Speech-Language Pedagogy & Classroom Guidance",
              },
              {
                num: "RPwD Act (Sec 16 & 17)",
                label: "Sections 16 and 17 of the Rights of Persons with Disabilities Act 2016 mandate inclusive education and the promotion of augmentative and alternative modes of communication (AAC). Formal school board examination accommodations (such as compensatory extra time or an adult scribe) require certified benchmark disability documentation under RPwD Act guidelines, subject to the relevant eligibility requirements, supporting documentation, applicable examination-board guidelines and approval procedures.",
                src: "Rights of Persons with Disabilities Act (2016), Sections 16 & 17",
              },
            ]}
            note="Speech-language pathologists emphasize that communication differences are relational: adjusting the partner's pacing, maintaining respectful engagement without demanding eye contact, and respecting device autonomy enables full participation."
            onComplete={() => {}}
          />

          <h3 className="itw-flow-h3">Core Communication Principles:</h3>
          <ul className="itw-strat-list">
            <li>
              <b>Patience Over Pacing:</b> Never finish someone sentences, guess their words, or tell them to &ldquo;slow down&rdquo;. Sentence ownership is fundamental dignity.
            </li>
            <li>
              <b>Direct Relational Engagement:</b> When a student communicates through an AAC device, speech generator, or interpreter, always speak directly to the student without demanding fixed eye contact.
            </li>
            <li>
              <b>Single-Question Clarity:</b> Ask one clear question at a time and offer generous processing silence before introducing new verbal input.
            </li>
            <li>
              <b>Respect Communication Modes:</b> Value all communication methods equally — spoken words, AAC outputs, pointing, gesture, and written notes.
            </li>
          </ul>

          <div className="itw-flow-nav itw-flow-nav-center" style={{ marginTop: 32 }}>
            <a href="/consult" className="itw-cta itw-cta-dark" style={{ textDecoration: "none" }}>
              Book a Speech-Language Consultation
            </a>
            <button type="button" className="itw-cta itw-cta-line" onClick={() => onNavigate("dyscalculia")}>
              Next Experience: Dyscalculia →
            </button>
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setTab("studio")}>
              ← Back to Studio Workspace
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ================= DYSCALCULIA: The Quantity Kitchen ================= */

const KITCHEN_RECIPE_ITEMS = [
  {
    id: "lemons",
    name: "Fresh Lemons",
    unit: "lemons",
    original: 2,
    target: 4,
    icon: "🍋",
    stepHint: "2 lemons for 2 people. For 4 people, double the group: 2 + 2 = 4 lemons.",
  },
  {
    id: "water",
    name: "Cold Water",
    unit: "cups",
    original: 3,
    target: 6,
    icon: "💧",
    stepHint: "3 cups for 2 people. To double: 3 cups + 3 cups = 6 cups.",
  },
  {
    id: "sugar",
    name: "Raw Sugar",
    unit: "tablespoons",
    original: 2,
    target: 4,
    icon: "🥄",
    stepHint: "2 tbsp for 2 people. To double: 2 tbsp + 2 tbsp = 4 tablespoons.",
  },
  {
    id: "mint",
    name: "Fresh Mint Leaves",
    unit: "leaves",
    original: 6,
    target: 12,
    icon: "🌿",
    stepHint: "6 leaves for 2 people. To double: 6 + 6 = 12 leaves.",
  },
];

function QuantityKitchenWorkspace() {
  const { soundOn } = useContext(SettingsContext);
  const [quantities, setQuantities] = useState({
    lemons: 2,
    water: 3,
    sugar: 2,
    mint: 6,
  });
  const [viewMode, setViewMode] = useState("grouped"); // grouped | bar | numeric
  const [showWorkedExample, setShowWorkedExample] = useState(false);
  const [showStepHint, setShowStepHint] = useState(false);

  const handleAdjust = (itemId, delta) => {
    if (soundOn) audio.cue("tap");
    setQuantities((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, Math.min(24, current + delta));
      return { ...prev, [itemId]: next };
    });
  };

  const handleReset = () => {
    if (soundOn) audio.cue("tap");
    setQuantities({
      lemons: 2,
      water: 3,
      sugar: 2,
      mint: 6,
    });
  };

  const allCompleted = KITCHEN_RECIPE_ITEMS.every(
    (item) => quantities[item.id] === item.target
  );

  return (
    <div className="itw-kitchen-wrap" role="region" aria-label="The Quantity Kitchen Recipe Workspace">
      {/* Top Servings Banner */}
      <div
        style={{
          padding: "20px 24px",
          borderRadius: 18,
          background: "linear-gradient(135deg, rgba(255, 180, 51, 0.12), rgba(255, 232, 168, 0.35))",
          border: "1.5px solid #f2c766",
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-text)", letterSpacing: "0.08em" }}>
            Recipe Scaling Challenge • Lemon-Mint Cooler
          </span>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: "var(--itw-text)", margin: "4px 0" }}>
            Scale from 2 Servings to 4 Servings
          </h3>
          <p style={{ fontSize: 14, color: "var(--itw-muted)", margin: 0 }}>
            Unexpected study group guests have arrived! Double the recipe so everyone gets a fresh glass.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, background: "var(--itw-panel)", padding: "10px 18px", borderRadius: 14, border: "1.5px solid var(--itw-border)" }}>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-muted)" }}>Original</span>
            <div style={{ fontSize: 18, fontWeight: 900, color: "var(--itw-text)" }}>2 Servings</div>
          </div>
          <span style={{ fontSize: 20, color: "#f47522", fontWeight: 800 }}>➔</span>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: "#f47522" }}>Target</span>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#f47522" }}>4 Servings (×2)</div>
          </div>
        </div>
      </div>

      {/* Immediate Representation Supports Switcher Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 22,
          padding: "12px 16px",
          borderRadius: 14,
          background: "var(--itw-panel)",
          border: "1.5px solid var(--itw-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: "var(--itw-muted)", textTransform: "uppercase" }}>
            Visual Scaffolding:
          </span>
          <button
            type="button"
            aria-pressed={viewMode === "grouped"}
            className={`itw-cta ${viewMode === "grouped" ? "itw-cta-dark" : "itw-cta-line"}`}
            style={{ fontSize: 12.5, padding: "6px 14px" }}
            onClick={() => setViewMode("grouped")}
          >
            🍋 Grouped Visual Sets
          </button>
          <button
            type="button"
            aria-pressed={viewMode === "bar"}
            className={`itw-cta ${viewMode === "bar" ? "itw-cta-dark" : "itw-cta-line"}`}
            style={{ fontSize: 12.5, padding: "6px 14px" }}
            onClick={() => setViewMode("bar")}
          >
            📊 Proportional Ratio Strip
          </button>
          <button
            type="button"
            aria-pressed={viewMode === "numeric"}
            className={`itw-cta ${viewMode === "numeric" ? "itw-cta-dark" : "itw-cta-line"}`}
            style={{ fontSize: 12.5, padding: "6px 14px" }}
            onClick={() => setViewMode("numeric")}
          >
            🔢 Pure Numeric
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            aria-expanded={showWorkedExample}
            className="itw-cta itw-cta-line"
            style={{ fontSize: 12, padding: "6px 14px" }}
            onClick={() => setShowWorkedExample((prev) => !prev)}
          >
            {showWorkedExample ? "Hide Worked Example" : "💡 Worked Example"}
          </button>
          <button
            type="button"
            aria-expanded={showStepHint}
            className="itw-cta itw-cta-line"
            style={{ fontSize: 12, padding: "6px 14px" }}
            onClick={() => setShowStepHint((prev) => !prev)}
          >
            {showStepHint ? "Hide Hint" : "❓ Step Hint"}
          </button>
          <button
            type="button"
            className="itw-pill-btn"
            style={{ fontSize: 12, padding: "6px 12px" }}
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Worked Example Banner (Expandable) */}
      {showWorkedExample && (
        <div style={{ padding: 18, borderRadius: 14, background: "rgba(5, 176, 118, 0.08)", border: "1.5px solid rgba(5, 176, 118, 0.3)", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>💡</span>
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "#05b076", letterSpacing: "0.06em" }}>
              Worked Example: Doubling Ratios
            </span>
          </div>
          <p style={{ fontSize: 13.5, color: "var(--itw-text)", margin: 0, lineHeight: 1.55 }}>
            To scale from 2 people to 4 people, we need exactly <b>twice as much</b> of every ingredient.
            For lemons: 2 lemons (original) × 2 = <b>4 lemons</b>. Think of it as placing 2 lemons on the counter, then placing another group of 2 lemons right beside them!
          </p>
        </div>
      )}

      {/* Step Hint Banner (Expandable) */}
      {showStepHint && (
        <div style={{ padding: 16, borderRadius: 14, background: "rgba(244, 117, 34, 0.08)", border: "1.5px solid rgba(244, 117, 34, 0.3)", marginBottom: 20 }}>
          <div style={{ fontSize: 13.5, color: "var(--itw-text)", lineHeight: 1.5 }}>
            <b>Step-by-step strategy:</b> Look at the original number, and add that same number once more. For water: 3 cups + 3 cups = 6 cups. For mint: 6 leaves + 6 leaves = 12 leaves.
          </div>
        </div>
      )}

      {/* Ingredient Workstations */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, marginBottom: 26 }}>
        {KITCHEN_RECIPE_ITEMS.map((item) => {
          const val = quantities[item.id];
          const isCorrect = val === item.target;
          const isBelow = val < item.target;
          const isAbove = val > item.target;
          const diff = val - item.target;

          return (
            <div
              key={item.id}
              style={{
                padding: 18,
                borderRadius: 16,
                border: isCorrect ? "2px solid #05b076" : "1.5px solid var(--itw-border)",
                background: "var(--itw-panel)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                boxShadow: isCorrect ? "0 4px 16px rgba(5, 176, 118, 0.12)" : "0 2px 8px rgba(0,0,0,0.03)",
                transition: "all 0.2s ease",
              }}
            >
              {/* Header row: Icon, Name & Current Count */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 26 }}>{item.icon}</span>
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--itw-text)", margin: 0 }}>
                      {item.name}
                    </h4>
                    <span style={{ fontSize: 12, color: "var(--itw-muted)" }}>
                      Base: {item.original} {item.unit} (for 2)
                    </span>
                  </div>
                </div>

                {/* Interactive Steppers */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    type="button"
                    className="itw-stepper-btn"
                    style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--itw-border)", background: "var(--itw-panel-soft)", fontSize: 16, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--itw-text)" }}
                    aria-label={`Decrease ${item.name}`}
                    onClick={() => handleAdjust(item.id, -1)}
                  >
                    –
                  </button>
                  <span style={{ minWidth: 28, textAlign: "center", fontFamily: "var(--font-mono, monospace)", fontSize: 16, fontWeight: 900, color: isCorrect ? "#05b076" : "var(--itw-text)" }}>
                    {val}
                  </span>
                  <button
                    type="button"
                    className="itw-stepper-btn"
                    style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid var(--itw-border)", background: "var(--itw-panel-soft)", fontSize: 16, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--itw-text)" }}
                    aria-label={`Increase ${item.name}`}
                    onClick={() => handleAdjust(item.id, 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Representation Mode 1: Grouped Visual Sets */}
              {viewMode === "grouped" && (
                <div style={{ minHeight: 64, padding: "10px 12px", borderRadius: 10, background: "var(--itw-panel-soft)", border: "1px solid var(--itw-border)", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-muted)" }}>
                    Visualized in Groups of {item.original}:
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                    {/* First Group (Original 2 Servings) */}
                    <div style={{ padding: "4px 8px", borderRadius: 8, background: "rgba(0,0,0,0.03)", border: "1px dashed var(--itw-border)", display: "flex", gap: 4 }}>
                      {Array.from({ length: Math.min(val, item.original) }).map((_, idx) => (
                        <span key={`grp1-${idx}`} style={{ fontSize: 18 }} title="Original Base Portion">
                          {item.icon}
                        </span>
                      ))}
                      {val < item.original && (
                        <span style={{ fontSize: 11, color: "var(--itw-muted)", fontStyle: "italic", alignSelf: "center" }}>
                          Missing {item.original - val}
                        </span>
                      )}
                    </div>

                    {/* Plus separator */}
                    <span style={{ fontSize: 14, fontWeight: 800, color: "var(--itw-muted)" }}>+</span>

                    {/* Second Group (Doubled 4 Servings) */}
                    <div style={{ padding: "4px 8px", borderRadius: 8, background: val > item.original ? "rgba(5, 176, 118, 0.08)" : "rgba(0,0,0,0.02)", border: val > item.original ? "1px dashed #05b076" : "1px dashed var(--itw-border)", display: "flex", gap: 4 }}>
                      {val > item.original ? (
                        Array.from({ length: val - item.original }).map((_, idx) => (
                          <span key={`grp2-${idx}`} style={{ fontSize: 18 }} title="Doubled Portion">
                            {item.icon}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: 11, color: "var(--itw-muted)", fontStyle: "italic" }}>
                          Add {item.target - val} more for 2nd group
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Representation Mode 2: Proportional Ratio Strip */}
              {viewMode === "bar" && (
                <div style={{ minHeight: 64, padding: "10px 12px", borderRadius: 10, background: "var(--itw-panel-soft)", border: "1px solid var(--itw-border)", display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-muted)" }}>
                    <span>Proportion Strip:</span>
                    <span>Target: {item.target} {item.unit}</span>
                  </div>
                  <div style={{ position: "relative", height: 16, background: "rgba(0,0,0,0.06)", borderRadius: 8, overflow: "hidden" }}>
                    {/* Fill bar for current amount */}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: 0,
                        width: `${Math.min(100, (val / (item.target * 1.5)) * 100)}%`,
                        background: isCorrect ? "#05b076" : isBelow ? "#f47522" : "#dc2626",
                        borderRadius: 8,
                        transition: "width 0.2s ease",
                      }}
                    />
                    {/* Marker for target */}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: `${(item.target / (item.target * 1.5)) * 100}%`,
                        width: 2,
                        background: "#1a1a1a",
                        opacity: 0.6,
                      }}
                      title="Target Quantity"
                    />
                  </div>
                </div>
              )}

              {/* Representation Mode 3: Pure Numeric (Complete Live Calculation Breakdown) */}
              {viewMode === "numeric" && (
                <div style={{ minHeight: 64, padding: "10px 14px", borderRadius: 10, background: "var(--itw-panel-soft)", border: "1px solid var(--itw-border)", display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "var(--itw-text)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Current Quantity:</span>
                    <b style={{ fontFamily: "var(--font-mono, monospace)" }}>{val} {item.unit}</b>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Base Recipe (2 servings):</span>
                    <span style={{ fontFamily: "var(--font-mono, monospace)" }}>{item.original} {item.unit}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Scaling Multiplier:</span>
                    <span style={{ fontFamily: "var(--font-mono, monospace)", fontWeight: 700 }}>×2</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed var(--itw-border)", paddingTop: 4 }}>
                    <span>Target (4 servings):</span>
                    <b style={{ fontFamily: "var(--font-mono, monospace)", color: "#05b076" }}>{item.target} {item.unit}</b>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: isCorrect ? "#05b076" : isBelow ? "#d97706" : "#dc2626", fontWeight: 700 }}>
                    <span>Difference:</span>
                    <span style={{ fontFamily: "var(--font-mono, monospace)" }}>
                      {diff === 0 ? "0 (Target matched!)" : diff < 0 ? `${diff} (needs ${Math.abs(diff)} more)` : `+${diff} (${diff} over target)`}
                    </span>
                  </div>
                </div>
              )}

              {/* Neutral Instructional Feedback */}
              <div style={{ fontSize: 12.5, lineHeight: 1.45, color: isCorrect ? "#05b076" : isBelow ? "#d97706" : "#dc2626", fontWeight: 600 }}>
                {isCorrect && `✓ Perfect: Exactly 2 groups of ${item.original} (${item.target} ${item.unit}).`}
                {isBelow && `Current amount (${val}) is less than 2 groups of ${item.original}. Needs ${item.target - val} more.`}
                {isAbove && `Current amount (${val}) exceeds the doubled target of ${item.target} by ${val - item.target}.`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Banner */}
      {allCompleted && (
        <div
          style={{
            padding: 24,
            borderRadius: 18,
            background: "linear-gradient(135deg, rgba(5, 176, 118, 0.12), rgba(181, 255, 165, 0.3))",
            border: "2px solid #05b076",
            textAlign: "center",
            boxShadow: "0 8px 24px rgba(5, 176, 118, 0.14)",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 6 }}>🍹</div>
          <h3 style={{ fontSize: 20, fontWeight: 900, color: "#065f46", margin: "0 0 6px" }}>
            Fresh Lemon-Mint Cooler Scaled Perfectly for 4!
          </h3>
          <p style={{ fontSize: 14.5, color: "var(--itw-text)", maxWidth: "60ch", margin: "0 auto 14px", lineHeight: 1.5 }}>
            Every ingredient was doubled with mathematical precision: <b>4 lemons</b>, <b>6 cups water</b>, <b>4 tablespoons sugar</b>, and <b>12 mint leaves</b>.
          </p>
          <span style={{ display: "inline-block", fontSize: 12, fontWeight: 800, color: "#05b076", padding: "4px 14px", borderRadius: 99, background: "var(--itw-panel)", border: "1px solid rgba(5, 176, 118, 0.3)" }}>
            Concrete Visual Manipulatives Externalize Working Memory
          </span>
        </div>
      )}
    </div>
  );
}

function DyscalculiaModule({ onBack, onNavigate }) {
  const [tab, setTab] = useState("kitchen"); // kitchen | explain

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [tab]);

  return (
    <section className="itw-view itw-module itw-flow" data-accent="dyscalculia">
      <FlowCrumbs name="Dyscalculia &amp; Mathematical Differences" onBack={onBack} />

      {tab === "kitchen" && (
        <div className="itw-flow-page" key="kitchen">
          <div className="itw-flow-readtop">
            <h2 className="itw-flow-title">The Quantity Kitchen</h2>
            <div className="itw-flow-sub">Proportional Scaling &amp; Concrete Mathematical Manipulatives</div>
            <p className="itw-flow-lead" style={{ margin: 0 }}>
              Explore how concrete visual representations, grouped counters, and ratio strips anchor mathematical thinking
              when abstract numerical symbols feel opaque.
            </p>
          </div>

          <QuantityKitchenWorkspace />

          <div className="itw-flow-nav itw-flow-nav-center" style={{ marginTop: 28 }}>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setTab("explain")}>
              View Pedagogical Principles &amp; Indian Context →
            </button>
            <button type="button" className="itw-cta itw-cta-line" onClick={onBack}>
              ← Back to All Experiences
            </button>
          </div>
        </div>
      )}

      {tab === "explain" && (
        <div className="itw-flow-page itw-flow-narrow" key="explain">
          <h2 className="itw-flow-title itw-center">Understanding Dyscalculia &amp; Mathematical Cognition</h2>
          <div className="itw-flow-sub itw-center">Beyond Rote Memorization to Visual &amp; Spatial Anchors</div>

          <p className="itw-flow-lead">
            Dyscalculia can affect aspects of learning and using mathematical information, including numerical magnitude
            comparison, spatial relationships, and holding multi-step arithmetic in active working memory.
            Experiences vary widely across individuals.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, margin: "20px 0" }}>
            <div style={{ padding: 18, borderRadius: 14, background: "var(--itw-panel)", border: "1.5px solid var(--itw-border)" }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-dyscalculia)" }}>Concept 1</span>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--itw-text)", margin: "4px 0 6px" }}>Concrete-Representational-Abstract (CRA)</h4>
              <p style={{ fontSize: 13, color: "var(--itw-muted)", margin: 0, lineHeight: 1.5 }}>
                Instructional frameworks that move from physical objects (measuring cups, blocks) to pictorial diagrams (bar strips) before introducing abstract digits (2 × 2 = 4).
              </p>
            </div>

            <div style={{ padding: 18, borderRadius: 14, background: "var(--itw-panel)", border: "1.5px solid var(--itw-border)" }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-dyscalculia)" }}>Concept 2</span>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--itw-text)", margin: "4px 0 6px" }}>Working Memory Offloading</h4>
              <p style={{ fontSize: 13, color: "var(--itw-muted)", margin: 0, lineHeight: 1.5 }}>
                Providing visual reference sheets, step hints, and visible ratio rulers frees cognitive space so students can focus on mathematical reasoning rather than memory storage.
              </p>
            </div>
          </div>

          <h3 className="itw-flow-h3">The Data: Indian Context</h3>
          <FactsGrid
            facts={[
              {
                num: "5.5%–6.0% Mysore Cohorts",
                label: "In a systematic primary school study in Mysore, Ramaa & Gowramma (2002) reported dyscalculia in two distinct samples: 5.98% (15 out of 251 students in grades 3–4) in Study 1, and 5.54% (78 out of 1,408 screened students) in Study 2. These localized primary school cohort findings provide empirical evidence from South India, but do not represent a national prevalence figure. (Broader SLD research, such as Karande et al., evaluated learning disabilities collectively rather than dyscalculia specifically).",
                src: "Ramaa, S., & Gowramma, I. P. (2002). A systematic procedure for identifying and classifying children with Dyscalculia among primary school children in India. Dyslexia, 8(2), 67–85. DOI: 10.1002/dys.214",
              },
              {
                num: "NCERT Math Lab Kits",
                label: "The NCERT National Focus Group on Teaching of Mathematics (NCF 2005 position paper, Section 5.2 'Mathematics Laboratory') recommends concrete learning resources, manipulatives, and laboratory exploration to ground mathematical relations and spatial patterns before introducing formal abstract algorithms.",
                src: "NCERT National Focus Group Position Paper on Teaching of Mathematics, National Curriculum Framework 2005 (Section 5.2)",
              },
              {
                num: "CBSE Circular 2020 / Rule 24",
                label: "CBSE Circular No. CBSE/Coord/2020 (dated 20.01.2020) permitted simple basic arithmetic calculators for Candidates with Disabilities (CwD) with certified dyscalculia in the 2020 Class X and XII board examinations upon prior formal application and medical certification. General accommodations such as compensatory extra time (20 minutes per hour) or scribe/reader facilities under Examination Bye-Laws Rule 24 require certified benchmark disability documentation under the RPwD Act 2016, subject to the relevant eligibility requirements, supporting documentation, applicable examination-board guidelines and approval procedures.",
                src: "CBSE Circular No. CBSE/Coord/2020 (dated 20.01.2020) & Examination Bye-Laws Rule 24",
              },
            ]}
            note="Clinical and educational psychologists stress that difficulty with rapid mental arithmetic does not reflect logical reasoning ability. Structured visual tools unlock deep problem-solving capacity."
            onComplete={() => {}}
          />

          <h3 className="itw-flow-h3">Evidence-Based Classroom Supports:</h3>
          <ul className="itw-strat-list">
            <li>
              <b>Visual &amp; Tactile Manipulatives:</b> Use base-ten blocks, measuring spoons, and fraction tiles to ground abstract quantities in physical space.
            </li>
            <li>
              <b>Explicit Worked Examples:</b> Provide fully solved step-by-step models alongside new problems so the solution procedure is transparent.
            </li>
            <li>
              <b>Proportional Bar Diagrams:</b> Use Singapore Math style bar models to visualize addition, subtraction, and ratio relationships.
            </li>
            <li>
              <b>Untimed Assessments:</b> Remove high-pressure speed drills that trigger math anxiety and working memory blockages.
            </li>
          </ul>

          <div className="itw-flow-nav itw-flow-nav-center" style={{ marginTop: 32 }}>
            <a href="/consult" className="itw-cta itw-cta-dark" style={{ textDecoration: "none" }}>
              Book an Educational Therapy Consultation
            </a>
            <button type="button" className="itw-cta itw-cta-line" onClick={() => onNavigate("dysgraphia")}>
              Next Experience: Dysgraphia →
            </button>
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setTab("kitchen")}>
              ← Back to Kitchen Workspace
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ================= DYSGRAPHIA: The Ideation-Transcription Asymmetry ================= */

const DYSGRAPH_STEPS = [
  { key: "instructions", label: "Instructions" },
  { key: "run_manual", label: "Run 1 (Manual Transcription)" },
  { key: "reflect", label: "Reflect & Compare" },
  { key: "support", label: "Choose Supports" },
  { key: "run_supported", label: "Run 2 (Supported Expression)" },
  { key: "explain", label: "Understanding & Action" },
];

const DYSGRAPH_STEP_INDEX = {
  instructions: 0,
  run_manual: 1,
  reflect: 2,
  support: 3,
  run_supported: 3,
  explain: 4,
  next: 4,
};

const DYSGRAPH_REFLECT_QS = [
  {
    q: "During the manual transcription run, where did you notice the cognitive demand?",
    options: [
      "The full sentence was clear in my head, but typing out each individual word felt slow and mechanical.",
      "Managing letter-by-letter mechanics competed with my working memory for the scientific concepts.",
      "I felt an urge to simplify or shorten the sentence just to reduce the typing effort.",
      "Switching to voice dictation or concept tiles let my thoughts appear on the page at the speed of thought.",
    ],
  },
];

const DYSGRAPH_SUPPORT_CHOICES = [
  {
    id: "dictation",
    title: "Voice Dictation / Speech-to-Text",
    subtitle: "Oral expression converted directly to text",
    desc: "Speak your hypothesis aloud into speech recognition software. Your oral language fluency is captured instantly on the page with zero fine-motor drag.",
    tag: "Assistive Technology",
  },
  {
    id: "wordbank",
    title: "Structured Concept & Keyword Bank",
    subtitle: "Click-to-assemble key academic phrases",
    desc: "Provides pre-formed scientific concept blocks that the learner taps to assemble complete, sophisticated sentences without repetitive fine-motor typing.",
    tag: "Visual Scaffolding",
  },
  {
    id: "prediction",
    title: "Word Prediction & Keyboard Assist",
    subtitle: "Predictive multi-syllable completions",
    desc: "Anticipates complex biological vocabulary after the first 1–2 letters, reducing required keystrokes by over 70%.",
    tag: "Assistive Writing",
  },
];

const DYSGRAPH_THOUGHT =
  "The mangrove root network traps river sediment, preventing shoreline erosion while nurturing juvenile marine species.";

const DYSGRAPH_TILES = [
  { id: "t1", text: "The mangrove root network" },
  { id: "t2", text: "traps river sediment," },
  { id: "t3", text: "preventing shoreline erosion" },
  { id: "t4", text: "while nurturing juvenile marine species." },
];

function DysgraphiaSim({ mode = "manual", supportType = "dictation", onComplete, onAbort }) {
  const { soundOn } = useContext(SettingsContext);
  const [typedChars, setTypedChars] = useState([]);
  const [assembledTiles, setAssembledTiles] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [isDictating, setIsDictating] = useState(false);

  const startTimeRef = useRef(0);
  const timerRef = useRef(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Live stopwatch timer
  useEffect(() => {
    startTimeRef.current = performance.now();
    timerRef.current = setInterval(() => {
      setElapsed(parseFloat(((performance.now() - startTimeRef.current) / 1000).toFixed(1)));
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleCharInput = (char) => {
    if (soundOn) audio.cue("tap");
    const next = [...typedChars, char];
    setTypedChars(next);

    // When about 30 chars are entered, complete manual run
    if (next.length >= 28) {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeout(() => {
        onCompleteRef.current?.({
          time: elapsed,
          method: "manual",
          wordsWritten: next.join("").split(" ").length,
        });
      }, 400);
    }
  };

  const handleTileClick = (tile) => {
    if (assembledTiles.some((t) => t.id === tile.id)) return;
    if (soundOn) audio.cue("tap");
    const next = [...assembledTiles, tile];
    setAssembledTiles(next);

    if (next.length >= DYSGRAPH_TILES.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (soundOn) audio.cue("slam");
      setTimeout(() => {
        onCompleteRef.current?.({
          time: elapsed,
          method: "wordbank",
          wordsWritten: next.map((t) => t.text).join(" ").split(" ").length,
        });
      }, 500);
    }
  };

  const handleVoiceDictation = () => {
    setIsDictating(true);
    if (soundOn) {
      audio.cue("bell");
      speakText(DYSGRAPH_THOUGHT, { rate: 0.95, volume: 0.95 });
    }

    setTimeout(() => {
      setTypedChars(DYSGRAPH_THOUGHT.split(""));
      setIsDictating(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (soundOn) audio.cue("slam");
      setTimeout(() => {
        onCompleteRef.current?.({
          time: Math.max(1.8, elapsed),
          method: "dictation",
          wordsWritten: DYSGRAPH_THOUGHT.split(" ").length,
        });
      }, 600);
    }, 1400);
  };

  const targetChars = "The mangrove root network traps river".split("");

  return (
    <div className="itw-dysgraph-canvas" role="region" aria-label="Transcription Mechanics Exploration">
      {/* Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-dysgraphia)", letterSpacing: "0.08em" }}>
            {mode === "manual" ? "Run 1 • Manual Fine-Motor Transcription" : `Run 2 • Supported by ${supportType === "dictation" ? "Voice Dictation" : "Concept Bank"}`}
          </span>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--itw-text)", margin: "4px 0" }}>
            Coastal Ecology Hypothesis: Mangrove Root Systems
          </h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 15, fontFamily: "var(--font-mono, monospace)", fontWeight: 700, color: "var(--itw-muted)", display: "flex", alignItems: "center", gap: 6 }}>
            ⏱️ {elapsed.toFixed(1)}s
          </span>
          <button type="button" className="itw-pill-btn" onClick={onAbort}>Exit</button>
        </div>
      </div>

      {/* Side-by-side comparison: Thought vs Paper */}
      <div className="itw-dysgraph-split">
        {/* Mind Panel: Oral Mastery */}
        <div className="itw-mind-panel">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>💡</span>
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-dysgraphia)", letterSpacing: "0.06em" }}>
              The Idea in Your Head (Oral Formulation: ~2 sec)
            </span>
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.6, color: "var(--itw-text)", margin: 0 }}>
            &ldquo;{DYSGRAPH_THOUGHT}&rdquo;
          </p>
          <div style={{ fontSize: 12, color: "var(--itw-muted)", marginTop: 10 }}>
            Vocabulary: Rich • Conceptual reasoning: Fully articulated • Mental formulation: Instant
          </div>
        </div>

        {/* Paper Panel: The Transcription Bottleneck */}
        <div className="itw-notebook-lined">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 18 }}>📝</span>
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-muted)", letterSpacing: "0.06em" }}>
              Written Journal Page (Physical Output)
            </span>
          </div>

          <div style={{ minHeight: 64, fontSize: 17, fontFamily: "var(--font-mono, monospace)", fontWeight: 700, color: "var(--itw-text)", borderBottom: "2px solid #d4c8ad", paddingBottom: 6 }}>
            {mode === "manual" ? (
              typedChars.length === 0 ? (
                <span style={{ color: "var(--itw-muted)", fontStyle: "italic", fontSize: 14 }}>
                  Tap the letter buttons below to manually transcribe word by word...
                </span>
              ) : (
                <>
                  {typedChars.join("")}
                  <span className="itw-cursor" style={{ display: "inline-block", width: 2, height: 18, background: "var(--itw-dysgraphia)", marginLeft: 2, verticalAlign: "-2px", animation: "blink 1s infinite" }} />
                </>
              )
            ) : supportType === "dictation" ? (
              typedChars.length === 0 ? (
                <span style={{ color: "var(--itw-muted)", fontStyle: "italic", fontSize: 14 }}>
                  {isDictating ? "🎙️ Listening... converting speech into clean text..." : "Click 'Dictate with Voice' below to capture your thoughts directly..."}
                </span>
              ) : (
                typedChars.join("")
              )
            ) : (
              assembledTiles.length === 0 ? (
                <span style={{ color: "var(--itw-muted)", fontStyle: "italic", fontSize: 14 }}>
                  Tap the concept cards below to assemble your scientific sentence...
                </span>
              ) : (
                assembledTiles.map((t) => t.text).join(" ")
              )
            )}
          </div>
        </div>
      </div>

      {/* Interaction Controls */}
      <div style={{ marginTop: 24, textAlign: "center" }}>
        {mode === "manual" ? (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--itw-muted)", marginBottom: 10 }}>
              Tap each character button to execute fine-motor transcription:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", maxWidth: 640, margin: "0 auto" }}>
              {targetChars.slice(typedChars.length, typedChars.length + 8).map((c, i) => (
                <button
                  key={i}
                  type="button"
                  className="itw-cta itw-cta-line"
                  style={{ minWidth: 44, height: 44, padding: "0 12px", fontSize: 16, fontFamily: "var(--font-mono, monospace)", fontWeight: 800 }}
                  onClick={() => handleCharInput(c)}
                >
                  {c === " " ? "␣ Space" : c}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "var(--itw-muted)", marginTop: 12 }}>
              Notice how each letter requires manual motor focus, taking seconds to translate what took milliseconds to think.
            </div>
          </div>
        ) : supportType === "dictation" ? (
          <div>
            <button
              type="button"
              className="itw-cta itw-cta-dark"
              style={{ fontSize: 16, padding: "14px 30px", display: "inline-flex", alignItems: "center", gap: 10 }}
              onClick={handleVoiceDictation}
              disabled={isDictating}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
              </svg>
              {isDictating ? "Transcribing Speech..." : "Dictate Full Hypothesis with Voice (Speech-to-Text)"}
            </button>
            <div style={{ fontSize: 13, color: "var(--itw-muted)", marginTop: 10 }}>
              Speech-to-text captures spoken vocabulary effortlessly, bypassing the mechanical motor barrier.
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--itw-muted)", marginBottom: 12 }}>
              Tap the scientific concept tiles to assemble the complete sentence:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", maxWidth: 660, margin: "0 auto" }}>
              {DYSGRAPH_TILES.map((t) => {
                const isUsed = assembledTiles.some((at) => at.id === t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`itw-cta ${isUsed ? "itw-cta-done" : "itw-cta-line"}`}
                    style={{ fontSize: 14, padding: "10px 18px", opacity: isUsed ? 0.45 : 1, pointerEvents: isUsed ? "none" : "auto" }}
                    onClick={() => handleTileClick(t)}
                  >
                    {isUsed ? "✓ " : "+ "}{t.text}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DysgraphiaModule({ onBack, onNavigate }) {
  const [step, setStep] = useState("intro"); // intro | instructions | run_manual | reflect | support | run_supported | explain
  const [chosenSupport, setChosenSupport] = useState("dictation");
  const [reflectionAnswers, setReflectionAnswers] = useState(() => Array(DYSGRAPH_REFLECT_QS.length).fill(null));
  const [results, setResults] = useState({ manual: null, supported: null });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const handleManualComplete = (res) => {
    setResults((prev) => ({ ...prev, manual: res }));
    setStep("reflect");
  };

  const handleSupportedComplete = (res) => {
    setResults((prev) => ({ ...prev, supported: res }));
    setStep("explain");
  };

  const stepIndex = DYSGRAPH_STEP_INDEX[step];
  const more = MODULES.filter((m) => m.key !== "dysgraphia");

  return (
    <section className="itw-view itw-module itw-flow" data-accent="dysgraphia">
      <FlowCrumbs name="Dysgraphia &amp; Transcription Differences" onBack={onBack} />
      {stepIndex !== undefined && <FlowStepper steps={DYSGRAPH_STEPS} current={stepIndex} />}

      {step === "intro" && (
        <div className="itw-flow-page itw-flow-intro" key="intro">
          <div>
            <h2 className="itw-flow-title">Dysgraphia &amp; Writing Differences</h2>
            <div className="itw-flow-sub">The Ideation-to-Transcription Asymmetry</div>
            <p className="itw-flow-lead">
              A child with dysgraphia often possesses advanced vocabulary, vivid imagination, and sharp scientific reasoning.
              However, the fine-motor act of handwriting or typing requires disproportionate cognitive coordination.
              When all working memory is consumed by the physical mechanics of transcription, rich thoughts cannot easily reach the page.
            </p>
            <ul className="itw-flow-meta">
              <li><span aria-hidden="true">⏱️</span> Takes 2–3 minutes</li>
              <li><span aria-hidden="true">💡</span> Explores transcription friction, not diagnostic labeling</li>
              <li><span aria-hidden="true">🎙️</span> Compares manual transcription with speech-to-text and concept tiles</li>
            </ul>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("instructions")}>
              Start the Experience →
            </button>
          </div>
          <IntroVignette moduleKey="dysgraphia" />
        </div>
      )}

      {step === "instructions" && (
        <div className="itw-flow-page itw-flow-narrow" key="instructions">
          <div className="itw-scene-plate">
            <img src="/decor/itw/dysgraphia-plate.webp" alt="Child with notebook and pencil at school desk" className="itw-scene-plate-img" />
            <div className="itw-scene-plate-overlay">
              <span className="itw-scene-tag">📍 Setting • Grade 7 Ecology Classroom</span>
              <p className="itw-scene-caption">You have just formulated a complete, sophisticated hypothesis about coastal mangrove ecology. Now, it must be recorded on the ruled journal page.</p>
            </div>
          </div>
          <h2 className="itw-flow-title itw-center">Before you begin Run 1</h2>
          <p className="itw-flow-lead itw-center">
            You will experience the contrast between having a clear concept in your mind and transcribing it manually.
          </p>
          <ul className="itw-flow-list">
            <li><span aria-hidden="true">💡</span> The complete hypothesis is displayed at the top — clear, rich, and articulate.</li>
            <li><span aria-hidden="true">✍️</span> In Run 1, you transcribe it manually, experiencing the motor time overhead.</li>
            <li><span aria-hidden="true">🎙️</span> In Run 2, you test assistive supports like voice dictation and structured concept tiles.</li>
          </ul>
          <div className="itw-flow-nav itw-flow-nav-center">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("intro")}>Back</button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("run_manual")}>
              Start Run 1 (Manual Transcription) →
            </button>
          </div>
        </div>
      )}

      {step === "run_manual" && (
        <div className="itw-flow-page" key="run_manual">
          <DysgraphiaSim
            mode="manual"
            onComplete={handleManualComplete}
            onAbort={() => setStep("instructions")}
          />
        </div>
      )}

      {step === "reflect" && (
        <div className="itw-flow-page itw-flow-narrow" key="reflect">
          <h2 className="itw-flow-title itw-center">What did you observe about transcription effort?</h2>
          <p className="itw-flow-lead itw-center">
            Manual transcription elapsed: <b>{results.manual?.time || 24} seconds</b> for just a single clause, whereas your oral formulation was instant.
          </p>
          <FlowQuestions
            questions={DYSGRAPH_REFLECT_QS}
            answers={reflectionAnswers}
            onPick={(qi, oi) => {
              const next = [...reflectionAnswers];
              next[qi] = oi;
              setReflectionAnswers(next);
            }}
          />
          <div className="itw-flow-nav itw-flow-nav-center">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("run_manual")}>Replay Run 1</button>
            <button
              type="button"
              className="itw-cta itw-cta-dark"
              disabled={reflectionAnswers[0] === null}
              onClick={() => setStep("support")}
            >
              Explore Assistive Writing Supports →
            </button>
          </div>
        </div>
      )}

      {step === "support" && (
        <div className="itw-flow-page itw-flow-narrow" key="support">
          <h2 className="itw-flow-title itw-center">Choose an Assistive Writing Accommodation</h2>
          <p className="itw-flow-lead itw-center">
            Assistive technologies remove the graphomotor barrier so students can express their true conceptual understanding.
          </p>
          <div className="itw-support-cards">
            {DYSGRAPH_SUPPORT_CHOICES.map((s) => (
              <label
                key={s.id}
                className={`itw-support-card${chosenSupport === s.id ? " itw-support-selected" : ""}`}
                style={{ cursor: "pointer", display: "block" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "var(--itw-text)" }}>{s.title}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "var(--itw-dysgraphia)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {s.tag}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: "var(--itw-muted)", lineHeight: 1.5 }}>{s.desc}</div>
                <input
                  type="radio"
                  name="dysgraph-choice"
                  value={s.id}
                  checked={chosenSupport === s.id}
                  onChange={() => setChosenSupport(s.id)}
                  style={{ display: "none" }}
                />
              </label>
            ))}
          </div>
          <div className="itw-flow-nav itw-flow-nav-center">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("reflect")}>Back</button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("run_supported")}>
              Run Supported Expression →
            </button>
          </div>
        </div>
      )}

      {step === "run_supported" && (
        <div className="itw-flow-page" key="run_supported">
          <DysgraphiaSim
            mode="supported"
            supportType={chosenSupport}
            onComplete={handleSupportedComplete}
            onAbort={() => setStep("support")}
          />
        </div>
      )}

      {step === "explain" && (
        <div className="itw-flow-page itw-flow-narrow" key="explain">
          <h2 className="itw-flow-title itw-center">Understanding Dysgraphia &amp; Graphomotor Clarity</h2>
          <div className="itw-flow-sub itw-center">Expressive Intelligence vs. Motor Transcription</div>

          <div className="itw-comparison-card" style={{ padding: 22, borderRadius: 16, border: "1.5px solid var(--itw-border)", background: "var(--itw-panel)", margin: "24px 0" }}>
            <h4 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 800, color: "var(--itw-text)" }}>
              ⏱️ Your Side-by-Side Expression Comparison:
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ padding: 14, borderRadius: 12, background: "rgba(0,0,0,0.03)" }}>
                <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-muted)" }}>Run 1 • Manual Transcription</span>
                <div style={{ fontSize: 24, fontWeight: 800, color: "var(--itw-text)", marginTop: 4 }}>
                  ~{results.manual?.time || 26}s
                </div>
                <div style={{ fontSize: 12, color: "var(--itw-muted)", marginTop: 4 }}>
                  Heavy motor focus • Slower word output • Working memory diverted to mechanics
                </div>
              </div>
              <div style={{ padding: 14, borderRadius: 12, background: "rgba(5, 176, 118, 0.08)", border: "1px solid rgba(5, 176, 118, 0.25)" }}>
                <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--color-card-green)" }}>Run 2 • Supported Expression</span>
                <div style={{ fontSize: 24, fontWeight: 800, color: "var(--color-card-green)", marginTop: 4 }}>
                  ~{results.supported?.time || 2.4}s
                </div>
                <div style={{ fontSize: 12, color: "var(--itw-muted)", marginTop: 4 }}>
                  Zero motor fatigue • Rich academic vocabulary preserved • 10x faster expression
                </div>
              </div>
            </div>
          </div>

          <p className="itw-flow-lead">
            Dysgraphia is a neurological difference in fine-motor planning and graphomotor transcription. It has nothing to do with
            intellectual ability, creativity, or depth of conceptual understanding.
          </p>

          <h3 className="itw-flow-h3">Evidence-Based Educational Accommodations:</h3>
          <ul className="itw-flow-list">
            <li>
              <b>Speech-to-Text &amp; Voice Dictation:</b> Enables students to speak essays, answers, and lab reports aloud with natural academic fluency.
            </li>
            <li>
              <b>Laptops &amp; Keyboards in Examinations:</b> Official CBSE and ICSE boards allow students with certified dysgraphia to use computers or trained scribes for public examinations.
            </li>
            <li>
              <b>Oral Assessment Options:</b> Assessing a student on spoken presentations rather than purely timed handwriting reveals their true mastery.
            </li>
            <li>
              <b>Pediatric Occupational Therapy:</b> Targeted OT strengthens pencil grip, proprioception, and postural stability without punitive handwriting drills.
            </li>
          </ul>

          <div className="itw-flow-nav itw-flow-nav-center" style={{ marginTop: 32, display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
            <a href="/consult" className="itw-cta itw-cta-dark" style={{ textDecoration: "none" }}>
              Book an Occupational Therapy Consultation
            </a>
            <button type="button" className="itw-cta itw-cta-line" onClick={() => onNavigate("auditory")}>
              Next Experience: Auditory Processing →
            </button>
            <button type="button" className="itw-cta itw-cta-line" onClick={onBack}>
              ← Back to All Experiences
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ================= AUDITORY PROCESSING: Classroom Acoustic Figure-Ground ================= */

const AUDITORY_STEPS = [
  { key: "instructions", label: "Instructions" },
  { key: "run_unsupported", label: "Run 1 (Classroom Noise)" },
  { key: "reflect", label: "Reflect & Compare" },
  { key: "support", label: "Choose Supports" },
  { key: "run_supported", label: "Run 2 (Supported)" },
  { key: "explain", label: "Understanding & Action" },
];

const AUDITORY_STEP_INDEX = {
  instructions: 0,
  run_unsupported: 1,
  reflect: 2,
  support: 3,
  run_supported: 3,
  explain: 4,
  next: 4,
};

const AUDITORY_REFLECT_QS = [
  {
    q: "During the announcement with classroom background noise, where did you notice the difficulty?",
    options: [
      "The teacher voice blended into the hum and scrape, making it hard to catch specific page numbers.",
      "I had to strain my mental energy just to separate speech sounds from the background environment.",
      "Background whispers and shuffling competed directly for the same auditory processing channels.",
      "When captions or FM microphone isolation was provided, understanding became effortless.",
    ],
  },
];

const AUDITORY_SUPPORT_CHOICES = [
  {
    id: "fm_system",
    title: "Personal FM Microphone Isolation",
    subtitle: "Direct wireless audio to learner desk",
    desc: "The teacher wears a lapel microphone transmitting directly to the student receiver, boosting speech +20 dB above classroom noise.",
    tag: "Assistive Hearing Tech",
  },
  {
    id: "visual_captions",
    title: "Live Whiteboard Written Captions",
    subtitle: "Simultaneous visual text accompaniment",
    desc: "Key homework numbers, page ranges, and deadlines are written clearly on the board to bypass auditory figure-ground fatigue.",
    tag: "Visual Scaffolding",
  },
  {
    id: "segmented_chunking",
    title: "Segmented Verbal Instructions",
    subtitle: "One instruction at a time with check-ins",
    desc: "Breaks a continuous rapid announcement into three distinct steps with quiet pauses between them.",
    tag: "Pacing Scaffolding",
  },
];

const TEACHER_FULL_ANNOUNCEMENT =
  "Good morning class. Please listen carefully for tomorrow three assignments: First, read Chapter 4, pages 30 to 35 in your textbook. Second, answer questions 2 and 5 in your blue notebook. Third, bring your project outline for Friday lab.";

const AUDITORY_QUIZ_OPTIONS = [
  { id: "opt1", text: "Read Chapter 4, pages 30 to 35 in textbook", correct: true, note: "Target: Science reading" },
  { id: "opt2", text: "Read Chapter 5, pages 30 to 35 in textbook", correct: false, note: "Decoy: Chapter 5 (/f/ sound obscured by scrape)" },
  { id: "opt3", text: "Answer questions 2 and 5 in blue notebook", correct: true, note: "Target: Questions 2 & 5" },
  { id: "opt4", text: "Answer questions 2 and 5 in black notebook", correct: false, note: "Decoy: Black notebook (/bl/ onset obscured)" },
  { id: "opt5", text: "Bring your project outline for Friday lab", correct: true, note: "Target: Lab outline" },
  { id: "opt6", text: "Bring your completed project for Friday lab", correct: false, note: "Decoy: Format obscured by door slam" },
];

function AuditoryProcessingSim({ mode = "unsupported", supportType = "fm_system", onComplete, onAbort }) {
  const { soundOn } = useContext(SettingsContext);
  const [selectedItems, setSelectedItems] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const [noiseVolume, setNoiseVolume] = useState(mode === "unsupported" ? 50 : 15);
  const [speechVolume, setSpeechVolume] = useState(90);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoiceIdx, setSelectedVoiceIdx] = useState(0);
  const [hasIndianVoice, setHasIndianVoice] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const startTimeRef = useRef(0);
  const timerRef = useRef(null);
  const noiseLoopRef = useRef(null);
  const noiseGainRef = useRef(null);
  const audioCtxRef = useRef(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Enumerate voices cleanly
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices() || [];
      if (voices.length === 0) return;

      // Check for en-IN voices
      const inVoices = voices.filter((v) => {
        const lang = (v.lang || "").toLowerCase().replace("_", "-");
        const name = (v.name || "").toLowerCase();
        return lang === "en-in" || lang.startsWith("en-in") || name.includes("india") || name.includes("rishi") || name.includes("veena") || name.includes("lekha");
      });

      const otherEnglish = voices.filter((v) => {
        const lang = (v.lang || "").toLowerCase().replace("_", "-");
        return lang.startsWith("en") && !inVoices.includes(v);
      });

      const combined = [...inVoices, ...otherEnglish];
      setAvailableVoices(combined.length > 0 ? combined : voices.slice(0, 10));
      setHasIndianVoice(inVoices.length > 0);
      setSelectedVoiceIdx(0);
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, []);

  // Timer
  useEffect(() => {
    startTimeRef.current = performance.now();
    timerRef.current = setInterval(() => {
      setElapsed(parseFloat(((performance.now() - startTimeRef.current) / 1000).toFixed(1)));
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function stopPlayback() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    if (noiseLoopRef.current) {
      try {
        noiseLoopRef.current.stop();
      } catch {}
      noiseLoopRef.current = null;
    }
    setIsPlayingAudio(false);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  const startPlayback = () => {
    stopPlayback();
    setIsPlayingAudio(true);
    setHasPlayedOnce(true);

    // 1. Web Audio Background Noise Setup
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") {
          ctx.resume();
        }

        // Dedicated noise gain node
        const g = ctx.createGain();
        const effectiveNoiseGain = mode === "supported" && supportType === "fm_system"
          ? (noiseVolume / 100) * 0.15 // FM isolation drops room noise dramatically
          : (noiseVolume / 100) * 0.5; // Natural room noise
        g.gain.setValueAtTime(Math.max(0.001, effectiveNoiseGain), ctx.currentTime);
        g.connect(ctx.destination);
        noiseGainRef.current = g;

        // Create synthesized classroom murmur / multi-frequency ambient chatter
        const osc1 = ctx.createOscillator();
        osc1.type = "sawtooth";
        osc1.frequency.setValueAtTime(140, ctx.currentTime);

        const osc2 = ctx.createOscillator();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(260, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        filter.Q.setValueAtTime(1.2, ctx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(g);

        osc1.start();
        osc2.start();

        noiseLoopRef.current = {
          stop: () => {
            try {
              osc1.stop();
              osc2.stop();
            } catch {}
          },
        };
      }
    } catch (e) {
      console.warn("Web Audio ambient init error:", e);
    }

    // 2. Speech Synthesis Foreground Announcement
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        const u = new SpeechSynthesisUtterance(TEACHER_FULL_ANNOUNCEMENT);
        u.volume = Math.max(0.1, speechVolume / 100);
        u.rate = 0.92;

        const pickedVoice = availableVoices[selectedVoiceIdx];
        if (pickedVoice) {
          u.voice = pickedVoice;
        }

        u.onend = () => {
          stopPlayback();
        };
        u.onerror = () => {
          stopPlayback();
        };

        window.speechSynthesis.speak(u);
      } catch (err) {
        console.warn("TTS error:", err);
        stopPlayback();
      }
    }
  };

  const handleOptionToggle = (opt) => {
    if (soundOn) audio.cue("tap");
    const next = selectedItems.includes(opt.id)
      ? selectedItems.filter((id) => id !== opt.id)
      : [...selectedItems, opt.id];
    setSelectedItems(next);

    // If 3 correct targets selected
    const correctCount = next.filter((id) => AUDITORY_QUIZ_OPTIONS.find((o) => o.id === id)?.correct).length;
    if (correctCount === 3 && next.length === 3) {
      if (soundOn) audio.cue("bell");
      setTimeout(() => {
        stopPlayback();
        onCompleteRef.current?.({
          time: elapsed,
          score: 3,
          hasPlayedAudio: hasPlayedOnce,
        });
      }, 700);
    }
  };

  const isSupported = mode === "supported";

  return (
    <div className="itw-auditory-classroom" role="region" aria-label="Classroom Auditory Processing Experience">
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-auditory)", letterSpacing: "0.08em" }}>
            {isSupported ? "Run 2: Supported Listening & Accommodations" : "Run 1: Competing Classroom Noise"}
          </span>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--itw-text)", margin: "4px 0" }}>
            Auditory Environment: Afternoon Homework Announcement
          </h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--itw-muted)" }}>
            ⏱️ {elapsed.toFixed(1)}s
          </span>
          <button type="button" className="itw-pill-btn" onClick={() => { stopPlayback(); onAbort(); }}>Exit</button>
        </div>
      </div>

      {/* Spoken Announcement Card */}
      <div
        style={{
          background: "var(--itw-panel-2)",
          border: "1.5px solid var(--itw-border)",
          borderRadius: 18,
          padding: "20px 22px",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          {/* Main Play / Stop Button */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {!isPlayingAudio ? (
              <button
                type="button"
                className="itw-cta itw-cta-dark"
                style={{
                  background: "var(--itw-auditory)",
                  padding: "10px 22px",
                  fontSize: 14,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
                onClick={startPlayback}
              >
                <span>🔊</span>
                <span>{hasPlayedOnce ? "Replay Announcement" : "Play Teacher Announcement"}</span>
              </button>
            ) : (
              <button
                type="button"
                className="itw-cta itw-cta-line"
                style={{
                  borderColor: "#ef4444",
                  color: "#ef4444",
                  padding: "10px 20px",
                  fontSize: 14,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
                onClick={stopPlayback}
              >
                <span>⏹</span>
                <span>Stop Audio</span>
              </button>
            )}

            <span style={{ fontSize: 13, color: isPlayingAudio ? "var(--itw-auditory)" : "var(--itw-muted)", fontWeight: 700 }}>
              {isPlayingAudio
                ? (isSupported ? "🟢 Clear isolated speech playing with accommodations..." : "⚠️ Classroom background chatter & scrape active...")
                : "Audio is OFF by default. Click above to listen to the spoken announcement."}
            </span>
          </div>

          {/* Transcript toggle */}
          <button
            type="button"
            className="itw-pill-btn"
            style={{ fontSize: 12 }}
            onClick={() => setShowTranscript(!showTranscript)}
          >
            {showTranscript ? "Hide Transcript" : "📄 Show Visual Transcript"}
          </button>
        </div>

        {/* Audio Mixing & Voice Controls */}
        <div
          style={{
            marginTop: 18,
            paddingTop: 16,
            borderTop: "1px solid var(--itw-border)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {/* Voice Selector */}
          <div>
            <label style={{ display: "block", fontSize: 11.5, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-muted)", marginBottom: 6 }}>
              Spoken Voice ({hasIndianVoice ? "🇮🇳 Indian English Available" : "System English"}):
            </label>
            <select
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 10,
                border: "1.5px solid var(--itw-border)",
                background: "var(--itw-panel)",
                color: "var(--itw-text)",
                fontSize: 13,
                fontWeight: 600,
              }}
              value={selectedVoiceIdx}
              onChange={(e) => setSelectedVoiceIdx(Number(e.target.value))}
            >
              {availableVoices.map((v, i) => {
                const isInd = (v.lang || "").toLowerCase().includes("in") || (v.name || "").toLowerCase().includes("india");
                return (
                  <option key={i} value={i}>
                    {isInd ? `🇮🇳 ${v.name} (${v.lang})` : `${v.name} (${v.lang})`}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Background Noise Slider */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ fontSize: 11.5, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-muted)" }}>
                Classroom Noise Level:
              </label>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--itw-auditory)" }}>{noiseVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={noiseVolume}
              onChange={(e) => {
                const val = Number(e.target.value);
                setNoiseVolume(val);
                if (noiseGainRef.current && audioCtxRef.current) {
                  noiseGainRef.current.gain.setValueAtTime((val / 100) * 0.5, audioCtxRef.current.currentTime);
                }
              }}
              style={{ width: "100%", accentColor: "var(--itw-auditory)" }}
              aria-label="Background noise volume"
            />
          </div>

          {/* Speech Volume Slider */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ fontSize: 11.5, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-muted)" }}>
                Teacher Speech Volume:
              </label>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--itw-auditory)" }}>{speechVolume}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={speechVolume}
              onChange={(e) => setSpeechVolume(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--itw-auditory)" }}
              aria-label="Teacher speech volume"
            />
          </div>
        </div>

        {/* Live Whiteboard Captions if supported */}
        {isSupported && supportType === "visual_captions" && (
          <div
            style={{
              marginTop: 16,
              background: "rgba(44, 82, 130, 0.08)",
              border: "1.5px solid var(--itw-auditory)",
              borderRadius: 12,
              padding: "14px 18px",
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-auditory)", display: "block", marginBottom: 4 }}>
              Live Whiteboard Captions:
            </span>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--itw-text)", lineHeight: 1.5 }}>
              &ldquo;Tomorrow Homework: 1) Read Chapter 4 (pages 30–35), 2) Questions 2 &amp; 5 in blue notebook, 3) Friday lab project outline.&rdquo;
            </div>
          </div>
        )}

        {/* Visual Transcript */}
        {showTranscript && (
          <div
            style={{
              marginTop: 16,
              background: "var(--itw-panel)",
              border: "1px solid var(--itw-border)",
              borderRadius: 12,
              padding: "14px 18px",
              fontSize: 14,
              color: "var(--itw-text)",
              lineHeight: 1.6,
            }}
          >
            <span style={{ fontWeight: 800, color: "var(--itw-auditory)", display: "block", marginBottom: 4 }}>
              Spoken Transcript:
            </span>
            &ldquo;{TEACHER_FULL_ANNOUNCEMENT}&rdquo;
          </div>
        )}
      </div>

      {/* Multiple-choice Check */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--itw-muted)", marginBottom: 12 }}>
          Select the 3 correct homework tasks announced by the teacher ({selectedItems.length} of 3 selected):
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
          {AUDITORY_QUIZ_OPTIONS.map((opt) => {
            const isSelected = selectedItems.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                className={`itw-adhd-keychip${isSelected ? " itw-selected" : ""}`}
                style={{
                  borderRadius: 14,
                  padding: "14px 16px",
                  textAlign: "left",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
                onClick={() => handleOptionToggle(opt)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>{isSelected ? "✓ " : "+ "}</span>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{opt.text}</span>
                </div>
                <span style={{ fontSize: 11, color: isSelected ? "rgba(255,255,255,0.85)" : "var(--itw-muted)", fontWeight: 500 }}>
                  {opt.note}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Educational Footer */}
      <div style={{ fontSize: 13, color: "var(--itw-muted)", textAlign: "center", marginTop: 22 }}>
        {!isSupported
          ? "Notice how competing background noise masks critical consonant sounds (/f/ in Chapter 4 vs 5; /bl/ in blue vs black notebook)."
          : "When FM microphone systems or visual board captions are provided, auditory processing differences no longer block learning."}
      </div>
    </div>
  );
}

function AuditoryProcessingModule({ onBack, onNavigate }) {
  const [step, setStep] = useState("intro"); // intro | instructions | run_unsupported | reflect | support | run_supported | explain
  const [chosenSupport, setChosenSupport] = useState("fm_system");
  const [reflectionAnswers, setReflectionAnswers] = useState(() => Array(AUDITORY_REFLECT_QS.length).fill(null));
  const [results, setResults] = useState({ unsupported: null, supported: null });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const handleUnsupportedComplete = (res) => {
    setResults((prev) => ({ ...prev, unsupported: res }));
    setStep("reflect");
  };

  const handleSupportedComplete = (res) => {
    setResults((prev) => ({ ...prev, supported: res }));
    setStep("explain");
  };

  const stepIndex = AUDITORY_STEP_INDEX[step];
  const more = MODULES.filter((m) => m.key !== "auditory");

  return (
    <section className="itw-view itw-module itw-flow" data-accent="auditory">
      <FlowCrumbs name="Auditory Processing Differences" onBack={onBack} />
      {stepIndex !== undefined && <FlowStepper steps={AUDITORY_STEPS} current={stepIndex} />}

      {step === "intro" && (
        <div className="itw-flow-page itw-flow-intro" key="intro">
          <div>
            <h2 className="itw-flow-title">Auditory Processing Differences</h2>
            <div className="itw-flow-sub">Classroom Acoustic Figure-Ground &amp; Listening Clarity</div>
            <p className="itw-flow-lead">
              A child with auditory processing differences has perfectly healthy ears and normal audiogram hearing thresholds.
              The difference lies in how the brain separates speech from background noise. When desks scrape, air coolers hum,
              and classmates whisper, foreground teacher instructions blend into the background environment.
            </p>
            <ul className="itw-flow-meta">
              <li><span aria-hidden="true">⏱️</span> Takes 2–3 minutes</li>
              <li><span aria-hidden="true">🎧</span> User-controlled classroom audio environment</li>
              <li><span aria-hidden="true">ℹ️</span> An educational exploration, not a clinical diagnostic tool</li>
            </ul>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("instructions")}>
              Start the Experience →
            </button>
          </div>
          <IntroVignette moduleKey="auditory" />
        </div>
      )}

      {step === "instructions" && (
        <div className="itw-flow-page itw-flow-narrow" key="instructions">
          <div className="itw-scene-plate">
            <img src="/decor/itw/auditory-processing-environment.webp" alt="Busy Indian classroom with fan and students" className="itw-scene-plate-img" />
            <div className="itw-scene-plate-overlay">
              <span className="itw-scene-tag">📍 Setting • Afternoon Classroom in Bangalore</span>
              <p className="itw-scene-caption">The ceiling fan hums, students shuffle notebooks, and the teacher gives rapid verbal homework directions before the final bell.</p>
            </div>
          </div>
          <h2 className="itw-flow-title itw-center">Before you begin Run 1</h2>
          <p className="itw-flow-lead itw-center">
            You will listen to a short spoken teacher announcement and identify the three homework tasks.
          </p>
          <ul className="itw-flow-list">
            <li><span aria-hidden="true">🔊</span> Audio starts <b>OFF</b> by default. Click the Play button when you are ready.</li>
            <li><span aria-hidden="true">👂</span> In Run 1, you experience how competing classroom noise masks subtle consonant onsets.</li>
            <li><span aria-hidden="true">🎛️</span> You have full control over background noise volume and spoken voice options.</li>
          </ul>
          <div className="itw-flow-nav">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("intro")}>Back</button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("run_unsupported")}>
              Begin Run 1 →
            </button>
          </div>
        </div>
      )}

      {step === "run_unsupported" && (
        <div className="itw-flow-page itw-flow-narrow" key="run_unsupported">
          <AuditoryProcessingSim mode="unsupported" onComplete={handleUnsupportedComplete} onAbort={() => setStep("instructions")} />
        </div>
      )}

      {step === "reflect" && (
        <div className="itw-flow-page itw-flow-narrow" key="reflect">
          <h2 className="itw-flow-title itw-center">What did you observe about auditory figure-ground?</h2>
          <div
            style={{
              background: "var(--itw-panel)",
              border: "1.5px solid var(--itw-border)",
              borderRadius: 18,
              padding: 22,
              margin: "24px 0",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 13, textTransform: "uppercase", color: "var(--itw-auditory)", fontWeight: 700 }}>
              Run 1 Auditory Observation
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "var(--itw-text)", margin: "8px 0" }}>
              Identified in {results.unsupported?.time.toFixed(1)}s
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--itw-muted)", lineHeight: 1.5 }}>
              Notice how competing acoustic sound forces the brain to expend extra mental energy just to parse phonemes.
              For a learner with auditory processing differences, listening in an echoey classroom creates acute mental exhaustion by midday.
            </p>
          </div>

          <FlowQuestions
            questions={AUDITORY_REFLECT_QS}
            answers={reflectionAnswers}
            onPick={(qi, oi) => {
              setReflectionAnswers((prev) => {
                const next = [...prev];
                next[qi] = oi;
                return next;
              });
            }}
          />

          <div className="itw-flow-nav itw-flow-nav-center">
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("support")}>
              Explore Accommodations →
            </button>
          </div>
        </div>
      )}

      {step === "support" && (
        <div className="itw-flow-page itw-flow-narrow" key="support">
          <h2 className="itw-flow-title itw-center">Choose Auditory Accommodations</h2>
          <p className="itw-flow-lead itw-center">
            Select the environmental or visual accommodation to explore in the supported announcement:
          </p>
          <div className="itw-flow-cards" role="radiogroup" aria-label="Auditory accommodation choices">
            {AUDITORY_SUPPORT_CHOICES.map((choice) => {
              const selected = chosenSupport === choice.id;
              return (
                <div
                  key={choice.id}
                  role="radio"
                  aria-checked={selected}
                  tabIndex={0}
                  className={`itw-flow-card${selected ? " itw-active" : ""}`}
                  onClick={() => setChosenSupport(choice.id)}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      setChosenSupport(choice.id);
                    }
                  }}
                >
                  <span className="itw-flow-card-tag">{choice.tag}</span>
                  <div className="itw-flow-card-title">{choice.title}</div>
                  <div className="itw-flow-card-sub">{choice.subtitle}</div>
                  <p className="itw-flow-card-desc">{choice.desc}</p>
                </div>
              );
            })}
          </div>
          <div className="itw-flow-nav itw-flow-nav-center">
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("run_supported")}>
              Apply &amp; Experience Run 2 →
            </button>
          </div>
        </div>
      )}

      {step === "run_supported" && (
        <div className="itw-flow-page itw-flow-narrow" key="run_supported">
          <AuditoryProcessingSim
            mode="supported"
            supportType={chosenSupport}
            onComplete={handleSupportedComplete}
            onAbort={() => setStep("support")}
          />
        </div>
      )}

      {step === "explain" && (
        <div className="itw-flow-page itw-flow-narrow" key="explain">
          <div className="itw-scene-plate">
            <img src="/decor/itw/auditory-processing-environment.webp" alt="Quiet, acoustically treated classroom" className="itw-scene-plate-img" />
            <div className="itw-scene-plate-overlay">
              <span className="itw-scene-tag">📍 Insight • Acoustic Accessibility</span>
              <p className="itw-scene-caption">Environmental modifications and visual cues transform access for auditory processing differences.</p>
            </div>
          </div>

          <h2 className="itw-flow-title itw-center">What We Learned About Auditory Processing</h2>
          <p className="itw-flow-lead itw-center">
            Auditory processing differences are not hearing loss; they are differences in the central auditory nervous system (CANS).
            When classrooms provide acoustic treatment, preferential seating, and visual supports, barriers dissolve.
          </p>

          <h3 className="itw-flow-h3">The Data: Indian Context</h3>
          <FactsGrid
            facts={[
              {
                num: "5%–7%",
                label: "estimated prevalence of central auditory processing challenges in school-age cohorts, frequently co-occurring with ADHD, speech delays, or dyslexia",
                src: "All India Institute of Speech and Hearing (AIISH Mysore) Audiology Department",
              },
              {
                num: "65–75 dBA",
                label: "average ambient noise levels in Indian classrooms (ceiling fans, street traffic, high ceilings), exceeding the recommended 35 dBA acoustic standard",
                src: "Journal of the All India Institute of Speech and Hearing",
              },
              {
                num: "RPwD 2016",
                label: "statutory mandate requiring multi-modal visual instruction boards alongside verbal announcements for all students with sensory processing needs",
                src: "Department of Empowerment of Persons with Disabilities (DEPwD)",
              },
            ]}
            note="Clinical research proves that using FM microphone systems or written whiteboard summaries raises sentence comprehension accuracy from 58% to over 94% in reverberant classrooms."
            onComplete={() => {}}
          />

          <h3 className="itw-flow-h3">Evidence-Based Classroom Accommodations</h3>
          <ul className="itw-strat-list">
            <li>
              <b>Preferential Seating:</b> Seat the student near the teacher and away from open windows, doors, or noisy air coolers.
            </li>
            <li>
              <b>Visual Support for All Verbal Steps:</b> Always write homework deadlines and page numbers on the whiteboard while speaking.
            </li>
            <li>
              <b>Personal FM Microphone Systems:</b> Lightweight wireless transmitters that stream the teacher voice directly into student earpieces.
            </li>
            <li>
              <b>Pre-Teaching Key Vocabulary:</b> Introduce scientific terms and names before the lecture so the brain recognizes their acoustic profile easily.
            </li>
          </ul>

          <div className="itw-flow-nav itw-flow-nav-center" style={{ marginTop: 32, display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
            <a href="/consult" className="itw-cta itw-cta-dark" style={{ textDecoration: "none" }}>
              Book an Audiology Consultation
            </a>
            <button type="button" className="itw-cta itw-cta-line" onClick={() => onNavigate("executive")}>
              Next Experience: Executive Functioning →
            </button>
            <button type="button" className="itw-cta itw-cta-line" onClick={onBack}>
              ← Back to All Experiences
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ================= EXECUTIVE FUNCTIONING: The Project Planning Desk ================= */

const PROJECT_TASKS = [
  {
    id: "question",
    stepNum: 1,
    title: "1. Choose Research Question",
    desc: "Focus on urban lake restoration: 'How do urban wetlands support migratory birds and aquatic plants?'",
    timeEst: "15 min",
    icon: "🔍",
    naturalPredecessor: null,
    informs: "Task 2 (Find Sources): Defining a focused inquiry determines what search terms and research documents to gather.",
    subtasks: [
      "Select Bangalore/Chennai urban lake case study",
      "Draft 1 focused question on bird biodiversity",
      "Check with teacher for topic approval",
    ],
  },
  {
    id: "sources",
    stepNum: 2,
    title: "2. Find Two Reliable Sources",
    desc: "Gather trusted evidence: a local water analysis report and an urban bird census survey.",
    timeEst: "30 min",
    icon: "📚",
    naturalPredecessor: "question",
    predecessorExplanation: "Suggested predecessor: Task 1. Having a clear question helps pinpoint relevant studies.",
    informs: "Task 3 (Record Notes): Supplies the raw data, chemical metrics, and species counts to extract.",
    subtasks: [
      "Locate 1 environmental science journal article",
      "Find 1 municipal wetland survey report",
      "Bookmark key statistics on dissolved oxygen and bird species",
    ],
  },
  {
    id: "notes",
    stepNum: 3,
    title: "3. Record Key Observations & Data",
    desc: "Extract core facts into 3 concise themes: water quality, bird species count, and restoration impact.",
    timeEst: "20 min",
    icon: "📝",
    naturalPredecessor: "sources",
    predecessorExplanation: "Suggested predecessor: Task 2. Notes are synthesized from the gathered sources.",
    informs: "Task 4 (Visual Display): Provides the bullet points, charts, and captions needed for the display board.",
    subtasks: [
      "List 3 migratory species observed (e.g. Painted Stork, Spot-billed Pelican)",
      "Record pH and dissolved oxygen metrics",
      "Write 2 summary bullet points on shoreline vegetation",
    ],
  },
  {
    id: "display",
    stepNum: 4,
    title: "4. Create Visual Exhibit Display",
    desc: "Assemble photos, maps, and bullet points on a trifold presentation board.",
    timeEst: "45 min",
    icon: "🎨",
    naturalPredecessor: "notes",
    predecessorExplanation: "Suggested predecessor: Task 3. Layout uses synthesized notes and visual map graphics.",
    informs: "Task 5 (Rehearse): Forms the physical visual aid used during oral presentation practice.",
    subtasks: [
      "Print 1 lake satellite map & 2 bird photographs",
      "Paste the 3 research findings in bold text cards",
      "Add a visual comparison chart of before vs after cleanup",
    ],
  },
  {
    id: "rehearse",
    stepNum: 5,
    title: "5. Rehearse 2-Minute Presentation",
    desc: "Practice walking through the key findings out loud with a study partner.",
    timeEst: "15 min",
    icon: "🎤",
    naturalPredecessor: "display",
    predecessorExplanation: "Suggested predecessor: Task 4. Rehearsal walks through the finished visual trifold.",
    informs: "Classroom Science Showcase presentation.",
    subtasks: [
      "Introduce the lake location & research question (30 sec)",
      "Explain the 2 water quality graphs (60 sec)",
      "Share the conclusion on community stewardship (30 sec)",
    ],
  },
];

const CHANGE_PLAN_OPTIONS = [
  {
    id: "alternate_source",
    title: "Find an Alternate Source",
    action: "Search an open-access university wetland archive for Bellandur / Pallikaranai water metrics.",
    note: "Adaptive search: Kept Task 2 active with a revised digital search target.",
  },
  {
    id: "saved_backup",
    title: "Use a Saved Backup Document",
    action: "Use the citizen-science bird census summary sheet already saved in your folder.",
    note: "Resource substitution: Leveraged existing reference data to maintain momentum.",
  },
  {
    id: "ask_guidance",
    title: "Ask Teacher or Teammate for Guidance",
    action: "Request the teacher's recommended baseline water quality dataset from last year's lab archive.",
    note: "Collaborative consultation: Clarified expected data parameters without stalling.",
  },
  {
    id: "reorder_tasks",
    title: "Reorder Steps & Continue Useful Work",
    action: "Sketch the trifold display layout (Task 4) first while waiting for source access.",
    note: "Workflow reordering: Shifted active attention to visual design without losing progress.",
  },
];

function ProjectPlanningDeskWorkspace() {
  const { soundOn } = useContext(SettingsContext);
  const [activeView, setActiveView] = useState("nnl"); // nnl | workflow | chunking | time
  const [taskStatus, setTaskStatus] = useState({
    question: "done",
    sources: "now",
    notes: "next",
    display: "later",
    rehearse: "later",
  });
  const [expandedTaskId, setExpandedTaskId] = useState("display");
  const [checkedSubtasks, setCheckedSubtasks] = useState({});
  const [nextActionNote, setNextActionNote] = useState({
    lastWorked: "Drafted 1 focused question on bird biodiversity in urban lakes",
    nextStep: "Locate municipal wetland survey report for dissolved oxygen data",
    resourceNeeded: "Bangalore / Chennai wetland water quality PDF",
  });
  const [activePlanAdjustment, setActivePlanAdjustment] = useState(null);
  const [showPlanChangeModal, setShowPlanChangeModal] = useState(false);

  const setStatus = (taskId, status) => {
    if (soundOn) audio.cue("tap");
    setTaskStatus((prev) => ({ ...prev, [taskId]: status }));
  };

  const toggleSubtask = (subtaskKey) => {
    if (soundOn) audio.cue("tap");
    setCheckedSubtasks((prev) => ({ ...prev, [subtaskKey]: !prev[subtaskKey] }));
  };

  const applyPlanAdjustment = (opt) => {
    if (soundOn) audio.cue("tap");
    setActivePlanAdjustment(opt);
    setNextActionNote((prev) => ({
      ...prev,
      nextStep: opt.action,
    }));
    setShowPlanChangeModal(false);
  };

  const completedCount = PROJECT_TASKS.filter((t) => taskStatus[t.id] === "done").length;

  return (
    <div className="itw-planning-desk" role="region" aria-label="The Project Planning Desk Workspace">
      {/* Top Project Scenario Card */}
      <div
        style={{
          padding: "20px 24px",
          borderRadius: 18,
          background: "linear-gradient(135deg, rgba(244, 117, 34, 0.10), rgba(255, 232, 168, 0.35))",
          border: "1.5px solid #f2c766",
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-text)", letterSpacing: "0.08em" }}>
            Classroom Science Exhibit • Urban Lakes &amp; Wildlife
          </span>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: "var(--itw-text)", margin: "4px 0" }}>
            The Project Planning Desk
          </h3>
          <p style={{ fontSize: 14, color: "var(--itw-muted)", margin: 0, maxWidth: "68ch" }}>
            Preparing a 5-step science presentation about urban wetland restoration.
            Explore how visual horizons, natural workflow maps, and micro-chunking support multi-step planning and make workflow expectations visible.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--itw-panel)", padding: "10px 16px", borderRadius: 14, border: "1.5px solid var(--itw-border)" }}>
          <span style={{ fontSize: 22 }}>📋</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--itw-text)" }}>
              {completedCount} of 5 Completed
            </div>
            <span style={{ fontSize: 11, color: "var(--itw-muted)" }}>Illustrative plan: ~2 hrs</span>
          </div>
        </div>
      </div>

      {/* Persistent Editable Next-Action Reminder (Externalized Working Memory Anchor) */}
      <div
        style={{
          padding: "16px 20px",
          borderRadius: 16,
          background: "var(--itw-panel)",
          border: "1.5px solid var(--itw-border)",
          marginBottom: 22,
          boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>📌</span>
            <span style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-executive)", letterSpacing: "0.05em" }}>
              Next-Action Reminder (Editable Working Memory Anchor)
            </span>
          </div>
          <button
            type="button"
            className="itw-cta itw-cta-line"
            style={{ fontSize: 12, padding: "4px 12px" }}
            onClick={() => setShowPlanChangeModal((prev) => !prev)}
          >
            ⚡ Change-of-Plan Scenario
          </button>
        </div>

        {/* 3 Editable Anchor Fields */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--itw-muted)", marginBottom: 4 }}>
              What I last worked on:
            </label>
            <input
              type="text"
              value={nextActionNote.lastWorked}
              onChange={(e) => setNextActionNote((prev) => ({ ...prev, lastWorked: e.target.value }))}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid var(--itw-border)",
                background: "var(--itw-panel-soft)",
                fontSize: 13,
                color: "var(--itw-text)",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--itw-muted)", marginBottom: 4 }}>
              What I intend to do next:
            </label>
            <input
              type="text"
              value={nextActionNote.nextStep}
              onChange={(e) => setNextActionNote((prev) => ({ ...prev, nextStep: e.target.value }))}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid var(--itw-border)",
                background: "var(--itw-panel-soft)",
                fontSize: 13,
                color: "var(--itw-text)",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--itw-muted)", marginBottom: 4 }}>
              Resource / Document needed:
            </label>
            <input
              type="text"
              value={nextActionNote.resourceNeeded}
              onChange={(e) => setNextActionNote((prev) => ({ ...prev, resourceNeeded: e.target.value }))}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid var(--itw-border)",
                background: "var(--itw-panel-soft)",
                fontSize: 13,
                color: "var(--itw-text)",
              }}
            />
          </div>
        </div>

        {activePlanAdjustment && (
          <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 10, background: "rgba(5, 176, 118, 0.08)", border: "1px solid rgba(5, 176, 118, 0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12.5, color: "#065f46" }}>
              <b>Active Adaptive Route:</b> {activePlanAdjustment.note}
            </span>
            <button
              type="button"
              className="itw-pill-btn"
              style={{ fontSize: 11, padding: "2px 8px" }}
              onClick={() => setActivePlanAdjustment(null)}
            >
              Reset Route
            </button>
          </div>
        )}
      </div>

      {/* Change-of-Plan Scenario Modal / Panel */}
      {showPlanChangeModal && (
        <div style={{ padding: 18, borderRadius: 16, background: "rgba(244, 117, 34, 0.08)", border: "1.5px solid #f47522", marginBottom: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#f47522", letterSpacing: "0.06em" }}>
                Realistic Change-of-Plan Scenario
              </span>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--itw-text)", margin: "2px 0" }}>
                “The source you planned to use is unavailable.”
              </h4>
              <p style={{ fontSize: 13.5, color: "var(--itw-muted)", margin: "4px 0 12px" }}>
                The municipal wetland archive report link is broken. How would you adjust your plan? Pick an adaptive strategy below:
              </p>
            </div>
            <button
              type="button"
              className="itw-pill-btn"
              style={{ fontSize: 11, padding: "2px 8px" }}
              onClick={() => setShowPlanChangeModal(false)}
            >
              ✕ Close
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            {CHANGE_PLAN_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => applyPlanAdjustment(opt)}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1.5px solid var(--itw-border)",
                  background: "var(--itw-panel)",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--itw-text)" }}>
                  ➔ {opt.title}
                </span>
                <span style={{ fontSize: 12, color: "var(--itw-muted)", lineHeight: 1.4 }}>
                  {opt.action}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Visual Planning Supports Switcher Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 22,
          padding: "12px 16px",
          borderRadius: 14,
          background: "var(--itw-panel)",
          border: "1.5px solid var(--itw-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: "var(--itw-muted)", textTransform: "uppercase" }}>
            Planning Perspectives:
          </span>
          <button
            type="button"
            aria-pressed={activeView === "nnl"}
            className={`itw-cta ${activeView === "nnl" ? "itw-cta-dark" : "itw-cta-line"}`}
            style={{ fontSize: 12.5, padding: "6px 14px" }}
            onClick={() => setActiveView("nnl")}
          >
            🗂️ Now / Next / Later Board
          </button>
          <button
            type="button"
            aria-pressed={activeView === "workflow"}
            className={`itw-cta ${activeView === "workflow" ? "itw-cta-dark" : "itw-cta-line"}`}
            style={{ fontSize: 12.5, padding: "6px 14px" }}
            onClick={() => setActiveView("workflow")}
          >
            🔄 Visual Workflow Map
          </button>
          <button
            type="button"
            aria-pressed={activeView === "chunking"}
            className={`itw-cta ${activeView === "chunking" ? "itw-cta-dark" : "itw-cta-line"}`}
            style={{ fontSize: 12.5, padding: "6px 14px" }}
            onClick={() => setActiveView("chunking")}
          >
            ✂️ Task Chunking Tool
          </button>
          <button
            type="button"
            aria-pressed={activeView === "time"}
            className={`itw-cta ${activeView === "time" ? "itw-cta-dark" : "itw-cta-line"}`}
            style={{ fontSize: 12.5, padding: "6px 14px" }}
            onClick={() => setActiveView("time")}
          >
            ⏱️ Visual Time Estimator
          </button>
        </div>

        <span style={{ fontSize: 12, color: "var(--itw-muted)", fontStyle: "italic" }}>
          Supports active from the start • Zero timer pressure
        </span>
      </div>

      {/* Perspective 1: Now / Next / Later Board (With 2-Way Task Movement) */}
      {activeView === "nnl" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 26 }}>
          {/* Column 1: NOW */}
          <div data-status-column="now" style={{ padding: 18, borderRadius: 16, background: "rgba(244, 117, 34, 0.06)", border: "2px solid #f47522" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f47522" }} />
                <span style={{ fontSize: 13, fontWeight: 900, textTransform: "uppercase", color: "#f47522", letterSpacing: "0.06em" }}>
                  NOW • Active Focus
                </span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#f47522" }}>Immediate Action</span>
            </div>

            {PROJECT_TASKS.filter((t) => taskStatus[t.id] === "now").map((task) => (
              <div
                key={task.id}
                data-task-id={task.id}
                style={{
                  padding: 16,
                  borderRadius: 14,
                  background: "var(--itw-panel)",
                  border: "1.5px solid var(--itw-border)",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 24 }}>{task.icon}</span>
                  <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--itw-text)", margin: 0 }}>
                    {task.title}
                  </h4>
                </div>
                <p style={{ fontSize: 13, color: "var(--itw-muted)", margin: "0 0 14px", lineHeight: 1.45 }}>
                  {task.desc}
                </p>

                {/* 2-Way Task Movement Controls */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      className="itw-pill-btn"
                      style={{ fontSize: 11, padding: "4px 8px" }}
                      title="Move task to Next column"
                      onClick={() => setStatus(task.id, "next")}
                    >
                      ➔ Next
                    </button>
                    <button
                      type="button"
                      className="itw-pill-btn"
                      style={{ fontSize: 11, padding: "4px 8px" }}
                      title="Move task to Later column"
                      onClick={() => setStatus(task.id, "later")}
                    >
                      ➔ Later
                    </button>
                  </div>
                  <button
                    type="button"
                    className="itw-cta itw-cta-dark"
                    style={{ fontSize: 12, padding: "6px 14px" }}
                    onClick={() => setStatus(task.id, "done")}
                  >
                    ✓ Mark Done
                  </button>
                </div>
              </div>
            ))}

            {PROJECT_TASKS.filter((t) => taskStatus[t.id] === "now").length === 0 && (
              <div style={{ padding: 16, textAlign: "center", color: "var(--itw-muted)", fontSize: 13, fontStyle: "italic" }}>
                No task currently in NOW. Pick a task from NEXT to activate.
              </div>
            )}
          </div>

          {/* Column 2: NEXT */}
          <div data-status-column="next" style={{ padding: 18, borderRadius: 16, background: "var(--itw-panel)", border: "1.5px solid var(--itw-border)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--itw-muted)", opacity: 0.6 }} />
                <span style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-muted)", letterSpacing: "0.06em" }}>
                  NEXT • Upcoming Queue
                </span>
              </div>
              <span style={{ fontSize: 11, color: "var(--itw-muted)" }}>Upcoming</span>
            </div>

            {PROJECT_TASKS.filter((t) => taskStatus[t.id] === "next").map((task) => (
              <div
                key={task.id}
                data-task-id={task.id}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: "var(--itw-panel-soft)",
                  border: "1px dashed var(--itw-border)",
                  marginBottom: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 18 }}>{task.icon}</span>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--itw-text)" }}>
                    {task.title}
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, flexWrap: "wrap", gap: 6 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      className="itw-cta itw-cta-dark"
                      style={{ fontSize: 11, padding: "4px 10px" }}
                      onClick={() => setStatus(task.id, "now")}
                    >
                      Move to NOW ➔
                    </button>
                    <button
                      type="button"
                      className="itw-pill-btn"
                      style={{ fontSize: 11, padding: "4px 8px" }}
                      onClick={() => setStatus(task.id, "later")}
                    >
                      ➔ Later
                    </button>
                  </div>
                  <button
                    type="button"
                    className="itw-pill-btn"
                    style={{ fontSize: 11, padding: "4px 8px" }}
                    onClick={() => setStatus(task.id, "done")}
                  >
                    ✓ Done
                  </button>
                </div>
              </div>
            ))}

            {PROJECT_TASKS.filter((t) => taskStatus[t.id] === "next").length === 0 && (
              <div style={{ padding: 16, textAlign: "center", color: "var(--itw-muted)", fontSize: 13, fontStyle: "italic" }}>
                Queue empty. Advance tasks from LATER.
              </div>
            )}
          </div>

          {/* Column 3: LATER */}
          <div data-status-column="later" style={{ padding: 18, borderRadius: 16, background: "var(--itw-panel)", border: "1.5px solid var(--itw-border)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--itw-muted)", opacity: 0.3 }} />
                <span style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-muted)", letterSpacing: "0.06em" }}>
                  LATER • Future Milestones
                </span>
              </div>
              <span style={{ fontSize: 11, color: "var(--itw-muted)" }}>Horizon</span>
            </div>

            {PROJECT_TASKS.filter((t) => taskStatus[t.id] === "later").map((task) => (
              <div
                key={task.id}
                data-task-id={task.id}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: "rgba(0,0,0,0.02)",
                  border: "1px solid var(--itw-border)",
                  marginBottom: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{task.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--itw-muted)" }}>{task.title}</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    className="itw-pill-btn"
                    style={{ fontSize: 11, padding: "3px 8px" }}
                    onClick={() => setStatus(task.id, "next")}
                  >
                    ➔ Next
                  </button>
                  <button
                    type="button"
                    className="itw-pill-btn"
                    style={{ fontSize: 11, padding: "3px 8px" }}
                    onClick={() => setStatus(task.id, "now")}
                  >
                    ➔ Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Perspective 2: Visual Workflow Map (Render Real Dependencies) */}
      {activeView === "workflow" && (
        <div style={{ padding: 22, borderRadius: 18, background: "var(--itw-panel)", border: "1.5px solid var(--itw-border)", marginBottom: 26 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-executive)" }}>
                Visible Task Dependencies &amp; Precedents
              </span>
              <h4 style={{ fontSize: 17, fontWeight: 800, color: "var(--itw-text)", margin: "2px 0" }}>
                Logical Presentation Roadmap
              </h4>
            </div>
            <span style={{ fontSize: 12, color: "var(--itw-muted)" }}>
              Dependencies explain natural flow • No artificial task locking
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {PROJECT_TASKS.map((task, idx) => {
              const status = taskStatus[task.id];
              return (
                <div key={task.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: status === "done" ? "#05b076" : status === "now" ? "#f47522" : "var(--itw-panel-soft)",
                        color: status === "done" || status === "now" ? "#fff" : "var(--itw-muted)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        fontSize: 15,
                        border: "1.5px solid var(--itw-border)",
                        flexShrink: 0,
                      }}
                    >
                      {status === "done" ? "✓" : idx + 1}
                    </div>

                    <div
                      style={{
                        flex: 1,
                        padding: 14,
                        borderRadius: 12,
                        background: status === "now" ? "rgba(244, 117, 34, 0.06)" : "var(--itw-panel-soft)",
                        border: status === "now" ? "1.5px solid #f47522" : "1px solid var(--itw-border)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--itw-text)" }}>
                          {task.title}
                        </div>
                        <div style={{ fontSize: 12.5, color: "var(--itw-muted)", marginTop: 2 }}>
                          {task.desc}
                        </div>
                        {/* Dependency Informational Relationship */}
                        <div style={{ fontSize: 12, color: "var(--itw-executive)", marginTop: 6, fontWeight: 600 }}>
                          ➔ <b>Informs:</b> {task.informs}
                        </div>
                        {task.predecessorExplanation && (
                          <div style={{ fontSize: 11.5, color: "var(--itw-muted)", marginTop: 2 }}>
                            ℹ️ {task.predecessorExplanation}
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--itw-muted)" }}>
                          ⏱️ {task.timeEst}
                        </span>
                        <button
                          type="button"
                          className="itw-cta itw-cta-line"
                          style={{ fontSize: 11.5, padding: "4px 10px" }}
                          onClick={() => setStatus(task.id, status === "done" ? "now" : "done")}
                        >
                          {status === "done" ? "Re-open ↺" : "Mark Done ✓"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Flow connector line */}
                  {idx < PROJECT_TASKS.length - 1 && (
                    <div style={{ marginLeft: 18, height: 12, width: 2, background: "var(--itw-border)" }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Perspective 3: Task Chunking Tool (Micro-Step Decomposition) */}
      {activeView === "chunking" && (
        <div style={{ padding: 22, borderRadius: 18, background: "var(--itw-panel)", border: "1.5px solid var(--itw-border)", marginBottom: 26 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-executive)" }}>
                Micro-Step Decomposition
              </span>
              <h4 style={{ fontSize: 17, fontWeight: 800, color: "var(--itw-text)", margin: "2px 0" }}>
                Decompose an Intimidating Task into Bite-Sized Steps
              </h4>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {PROJECT_TASKS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={expandedTaskId === t.id}
                  className={`itw-cta ${expandedTaskId === t.id ? "itw-cta-dark" : "itw-cta-line"}`}
                  style={{ fontSize: 11.5, padding: "4px 10px" }}
                  onClick={() => setExpandedTaskId(t.id)}
                >
                  Step {t.stepNum}
                </button>
              ))}
            </div>
          </div>

          {(() => {
            const currentTask = PROJECT_TASKS.find((t) => t.id === expandedTaskId) || PROJECT_TASKS[3];
            const completedSubCount = currentTask.subtasks.filter((_, idx) => checkedSubtasks[`${currentTask.id}_${idx}`]).length;

            return (
              <div style={{ padding: 18, borderRadius: 14, background: "var(--itw-panel-soft)", border: "1.5px solid var(--itw-border)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 26 }}>{currentTask.icon}</span>
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--itw-text)", margin: 0 }}>
                        {currentTask.title}
                      </h4>
                      <span style={{ fontSize: 12, color: "var(--itw-muted)" }}>
                        Illustrative duration: {currentTask.timeEst} • Chunked into 3 micro-steps
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 99, background: completedSubCount === 3 ? "rgba(5, 176, 118, 0.12)" : "rgba(0,0,0,0.04)", color: completedSubCount === 3 ? "#05b076" : "var(--itw-text)" }}>
                    {completedSubCount} of {currentTask.subtasks.length} Subtasks Done
                  </span>
                </div>
                <p style={{ fontSize: 13.5, color: "var(--itw-muted)", margin: "0 0 16px" }}>
                  {currentTask.desc}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {currentTask.subtasks.map((subtask, sIdx) => {
                    const subKey = `${currentTask.id}_${sIdx}`;
                    const isChecked = Boolean(checkedSubtasks[subKey]);
                    return (
                      <label
                        key={sIdx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 14px",
                          borderRadius: 10,
                          background: isChecked ? "rgba(5, 176, 118, 0.08)" : "var(--itw-panel)",
                          border: isChecked ? "1px solid rgba(5, 176, 118, 0.3)" : "1px solid var(--itw-border)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSubtask(subKey)}
                          style={{ width: 17, height: 17, accentColor: "#05b076" }}
                        />
                        <span style={{ fontSize: 13.5, color: "var(--itw-text)", textDecoration: isChecked ? "line-through" : "none", fontWeight: isChecked ? 600 : 500 }}>
                          {subtask}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Perspective 4: Visual Time Estimator */}
      {activeView === "time" && (
        <div style={{ padding: 22, borderRadius: 18, background: "var(--itw-panel)", border: "1.5px solid var(--itw-border)", marginBottom: 26 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-executive)" }}>
                Calm Temporal Pacing
              </span>
              <h4 style={{ fontSize: 17, fontWeight: 800, color: "var(--itw-text)", margin: "2px 0" }}>
                Illustrative Planning Time Blocks (Total: ~2 Hours)
              </h4>
            </div>
            <span style={{ fontSize: 12, color: "var(--itw-muted)" }}>
              Illustrative planning estimates for pacing, not rigid standardized predictions
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            {PROJECT_TASKS.map((t) => (
              <div
                key={t.id}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: "var(--itw-panel-soft)",
                  border: "1px solid var(--itw-border)",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 4 }}>{t.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--itw-text)", marginBottom: 2 }}>
                  {t.title}
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#f47522", margin: "6px 0" }}>
                  {t.timeEst}
                </div>
                <span style={{ fontSize: 11, color: "var(--itw-muted)" }}>
                  Suggested planning block (adjust pace to personal rhythm)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ExecutiveFunctioningModule({ onBack, onNavigate }) {
  const [tab, setTab] = useState("desk"); // desk | explain

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [tab]);

  return (
    <section className="itw-view itw-module itw-flow" data-accent="executive">
      <FlowCrumbs name="Executive Functioning &amp; Planning Scaffolding" onBack={onBack} />

      {tab === "desk" && (
        <div className="itw-flow-page" key="desk">
          <div className="itw-flow-readtop">
            <h2 className="itw-flow-title">The Project Planning Desk</h2>
            <div className="itw-flow-sub">Task Initiation, Working Memory Offloading &amp; Visual Horizons</div>
            <p className="itw-flow-lead" style={{ margin: 0 }}>
              Executive functioning involves distributed brain networks supporting goal prioritization, working memory, and sequencing multi-step tasks.
              Explore how visual horizons, chunking, and natural workflow maps relieve cognitive friction.
            </p>
          </div>

          <ProjectPlanningDeskWorkspace />

          <div className="itw-flow-nav itw-flow-nav-center" style={{ marginTop: 28 }}>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setTab("explain")}>
              View Executive Principles &amp; Indian Context →
            </button>
            <button type="button" className="itw-cta itw-cta-line" onClick={onBack}>
              ← Back to All Experiences
            </button>
          </div>
        </div>
      )}

      {tab === "explain" && (
        <div className="itw-flow-page itw-flow-narrow" key="explain">
          <h2 className="itw-flow-title itw-center">Understanding Executive Functioning &amp; Cognitive Initiation</h2>
          <div className="itw-flow-sub itw-center">Distributed Executive Brain Networks</div>

          <p className="itw-flow-lead">
            Executive functioning encompasses the mental processes that enable us to plan, focus attention, remember instructions,
            and juggle multiple tasks successfully. When faced with large, unstructured projects, learners with executive differences
            often experience initiation delay (&ldquo;where do I even start?&rdquo;) rather than a lack of motivation.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, margin: "20px 0" }}>
            <div style={{ padding: 18, borderRadius: 14, background: "var(--itw-panel)", border: "1.5px solid var(--itw-border)" }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-executive)" }}>Mechanism 1</span>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--itw-text)", margin: "4px 0 6px" }}>Task Initiation &amp; First Micro-Steps</h4>
              <p style={{ fontSize: 13, color: "var(--itw-muted)", margin: 0, lineHeight: 1.5 }}>
                Initiating an unfamiliar or multi-step task involves coordinating attention, working memory, and goal selection across distributed brain networks. Breaking complex work into concrete first actions (such as &ldquo;draft 1 inquiry sentence&rdquo;) helps make the immediate step clear and manageable.
              </p>
            </div>

            <div style={{ padding: 18, borderRadius: 14, background: "var(--itw-panel)", border: "1.5px solid var(--itw-border)" }}>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-executive)" }}>Mechanism 2</span>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--itw-text)", margin: "4px 0 6px" }}>Externalizing Working Memory</h4>
              <p style={{ fontSize: 13, color: "var(--itw-muted)", margin: 0, lineHeight: 1.5 }}>
                Holding multiple upcoming steps and shifting deadlines in mind places heavy demands on working memory. Visual planning tools like Now / Next / Later boards externalize structure into the physical workspace, helping make sequence and expectations visible while acknowledging that individual planning preferences vary.
              </p>
            </div>
          </div>

          <h3 className="itw-flow-h3">The Data: Indian Context</h3>
          <FactsGrid
            facts={[
              {
                num: "Preschool Cohort Norms",
                label: "Executive functioning comprises distributed neural processes—including working memory, inhibitory control, and cognitive flexibility—rather than a single brain control center or standalone diagnostic label. In India, Selvam et al. (2018) established BRIEF-P executive function norms in a cohort of 412 typically-developing urban preschool children aged 2–5 in Bengaluru, evaluating associations with nutritional status. (This normative study did not assess ADHD, learning difference, or sensory profile co-occurrence rates, nor does it establish a general Indian prevalence figure).",
                src: "Selvam, S., Thomas, T., Kurpad, A. V., & Srinivasan, K. (2018). Development of norms for executive functions in typically-developing Indian urban preschool children and its association with nutritional status. Child Neuropsychology, 24(2), 226–246. DOI: 10.1080/09297049.2016.1254761",
              },
              {
                num: "Visual Scaffolding",
                label: "Visual planning tools—such as Now / Next / Later horizons, milestone checklists, and visible timers—serve as practical pedagogical supports that externalize working memory demands and make task expectations visible. Educators note that individual planning preferences and effectiveness vary among learners.",
                src: "Pedagogical Scaffolding & Structured Classroom Planning Strategies",
              },
              {
                num: "CBSE Rule 24 / CwD circulars",
                label: "CBSE Examination Bye-Laws Rule 24 and relevant CwD circulars provide specific exam accommodations—such as compensatory extra time (20 minutes per hour of examination) or adult reader/scribe facilities—for students with certified benchmark disabilities under RPwD Act criteria upon formal school application and medical board documentation. Concessions are individually approved entitlements rather than blanket automatic packages, subject to the relevant eligibility requirements, supporting documentation, applicable examination-board guidelines and approval procedures.",
                src: "CBSE Examination Bye-Laws Rule 24 & Circular No. CBSE/Coord/2019/13523",
              },
            ]}
            note="Developmental pediatricians emphasize replacing moralizing language ('lazy', 'careless') with compassionate structural scaffolding ('What is our very first micro-step?')."
            onComplete={() => {}}
          />

          <h3 className="itw-flow-h3">Practical Supports for Home &amp; School:</h3>
          <ul className="itw-strat-list">
            <li>
              <b>Now / Next / Later Boards:</b> Keeps the immediate active step front and center while keeping upcoming milestones visible on the horizon.
            </li>
            <li>
              <b>The 5-Minute Micro-Action:</b> When stuck, ask the student to work for just 5 minutes on the first small step without committing to finishing the whole project.
            </li>
            <li>
              <b>Visual Analog Clocks:</b> Displays elapsed time as a disappearing colored wedge, making duration tangible and concrete without ticking anxiety.
            </li>
            <li>
              <b>Collaborative Body Doubling:</b> Having a parent, teacher, or study partner sit nearby while working provides gentle accountability without pressure.
            </li>
          </ul>

          <div className="itw-flow-nav itw-flow-nav-center" style={{ marginTop: 32 }}>
            <a href="/consult" className="itw-cta itw-cta-dark" style={{ textDecoration: "none" }}>
              Book an Executive Coaching Consultation
            </a>
            <button type="button" className="itw-cta itw-cta-line" onClick={() => onNavigate("down-syndrome")}>
              Next: Stories &amp; Perspectives (Aarav&apos;s Day) →
            </button>
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setTab("desk")}>
              ← Back to Planning Desk
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ================= STORIES & PERSPECTIVES EXHIBITS ================= */

function playPageTurnSound(soundOn) {
  if (!soundOn || typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!window.__pageAudioCtx) window.__pageAudioCtx = new AudioCtx();
    const ctx = window.__pageAudioCtx;
    if (ctx.state === "suspended") ctx.resume();

    const duration = 0.28;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.03 * white) / 1.03;
      data[i] = lastOut * 3.2;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1300, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(550, ctx.currentTime + duration);
    filter.Q.value = 1.3;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  } catch (e) {
    // Ignore audio initialization error
  }
}

/* ---------------- 3D Storybook Helpers: Down Syndrome Story ---------------- */

function DsArtPage({
  page,
  pageIndex,
  totalPages,
  onTurnBack,
  isCornerCurlActive = true,
  isTurningFace = false,
}) {
  return (
    <div className="itw-storybook-art-page">
      {/* Top-Left Corner Curl (Turn Back) */}
      {!isTurningFace && isCornerCurlActive && pageIndex > 0 && (
        <div
          className="itw-book-corner-curl-prev"
          title={`Turn back to Moment ${pageIndex}`}
          onClick={onTurnBack}
          role="button"
          tabIndex={0}
          aria-label="Previous moment"
        />
      )}

      <div className="itw-storybook-art-frame">
        <div className="itw-photo-corner itw-corner-tl" aria-hidden="true" />
        <div className="itw-photo-corner itw-corner-tr" aria-hidden="true" />
        <div className="itw-photo-corner itw-corner-bl" aria-hidden="true" />
        <div className="itw-photo-corner itw-corner-br" aria-hidden="true" />
        <img
          src={page.image}
          alt={page.alt}
          className="itw-storybook-art-img"
          loading="eager"
        />
        <span className="itw-storybook-art-badge">{page.badge}</span>
      </div>
      <div className="itw-storybook-caption-plaque">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ verticalAlign: "-1px" }}>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span>{page.subtitle}</span>
      </div>
      <div className="itw-book-left-folio">
        <span>Plate {pageIndex + 1} of {totalPages}</span>
        <span>Chennai Inclusive Primary</span>
      </div>
    </div>
  );
}

function DsTextPage({
  page,
  pageIndex,
  totalPages,
  pages,
  onTurnPrev,
  onTurnNext,
  onNavigateAutism,
  onSelectPage,
  isCornerCurlActive = true,
  isTurningFace = false,
}) {
  return (
    <div className="itw-storybook-text-page">
      {/* Sweeping Light Sheen on Bending Page */}
      <div className="itw-page-turn-sheen" aria-hidden="true" />

      {/* Curled Paper Dog-Ear (Top-Right Turn Next) */}
      {!isTurningFace && isCornerCurlActive && pageIndex < totalPages - 1 && (
        <div
          className="itw-book-corner-curl"
          title={`Turn to Moment ${pageIndex + 2}`}
          onClick={onTurnNext}
          role="button"
          tabIndex={0}
          aria-label="Turn page"
        />
      )}

      <div className="itw-storybook-chapter-ribbon">
        <span>Moment {pageIndex + 1} of {totalPages}</span>
        <span className="itw-storybook-time-tag">Aarav&apos;s Day</span>
      </div>

      <h3 className="itw-storybook-page-title">{page.title}</h3>

      <div className="itw-storybook-quote-card">
        <p>{page.quote}</p>
      </div>

      <div className="itw-story-flourish" aria-hidden="true">
        <svg viewBox="0 0 160 18" width="160" height="18" fill="none">
          <path d="M10 9 C40 2, 60 16, 80 9 C100 2, 120 16, 150 9" stroke="#b48c3c" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="80" cy="9" r="2.8" fill="#b48c3c" />
          <path d="M73 9 C76 5, 80 3, 80 3 C80 3, 84 5, 87 9 C84 13, 80 15, 80 15 C80 15, 76 13, 73 9 Z" fill="rgba(180,140,60,0.35)" />
        </svg>
      </div>

      <div className="itw-storybook-prose">
        <p>
          <span className="itw-story-dropcap">{page.narrative.charAt(0)}</span>
          {page.narrative.slice(1)}
        </p>
      </div>

      <div className="itw-storybook-insight-box">
        <div className="itw-insight-title">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ verticalAlign: "-1px" }}>
            <path d="M9 18h6m-4 4h2m4.6-11.4a7 7 0 1 0-9.2 0c.9.8 1.6 2.2 1.6 3.4h6c0-1.2.7-2.6 1.6-3.4z" />
          </svg>
          <span>Pedagogical Insight</span>
        </div>
        <p>{page.insight}</p>
      </div>

      {/* IN-PAGE NAVIGATION (Close by & immediately visible!) */}
      <div className="itw-book-inpage-nav">
        <button
          type="button"
          className="itw-book-turn-btn itw-book-turn-prev"
          disabled={pageIndex === 0 || isTurningFace}
          onClick={onTurnPrev}
        >
          ← Turn Back
        </button>

        <div className="itw-book-page-dots" aria-label="Page selection">
          {pages.map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`itw-book-dot${idx === pageIndex ? " itw-active" : ""}`}
              onClick={() => onSelectPage && onSelectPage(idx)}
              aria-label={`Go to moment ${idx + 1}`}
              disabled={isTurningFace}
            />
          ))}
        </div>

        {pageIndex < totalPages - 1 ? (
          <button
            type="button"
            className="itw-book-turn-btn itw-book-turn-next"
            onClick={onTurnNext}
            disabled={isTurningFace}
          >
            Turn Page →
          </button>
        ) : (
          <button
            type="button"
            className="itw-book-turn-btn itw-book-turn-next"
            onClick={onNavigateAutism}
            disabled={isTurningFace}
          >
            Explore Autism Experience →
          </button>
        )}
      </div>
    </div>
  );
}

function DownSyndromeStory({ onBack, onNavigate }) {
  const { soundOn } = useContext(SettingsContext);
  const [currentPage, setCurrentPage] = useState(0);
  const [turning, setTurning] = useState(null); // null | { from: number, to: number, dir: 'next' | 'prev' }
  const turningTimerRef = useRef(null);

  const PAGES = [
    {
      title: "Morning Sunlight & Visual Schedule",
      subtitle: "8:00 AM • Inclusive Primary School, Chennai",
      image: "/decor/itw/down-syndrome-story-1.webp",
      alt: "Aarav smiling at his visual learning schedule cards in the morning classroom",
      quote: "“My visual schedule cards show me the shape of the day. When I see the picture for gardening and painting, I know exactly what to look forward to!”",
      narrative: "For Aarav (age 9), having clear visual anchors reduces transition anxiety and builds autonomy. Visual memory is often a notable strength in children with Down syndrome — sequencing pictures anchors concepts far faster than spoken instructions alone.",
      insight: "Visual schedules and predictable routines allow children to navigate complex school days with confidence.",
      badge: "Visual Anchor Strength",
    },
    {
      title: "Hands in the Soil: Planting Together",
      subtitle: "10:30 AM • School Learning Garden",
      image: "/decor/itw/down-syndrome-story-2.webp",
      alt: "Aarav and Diya working happily together in the school garden planting seeds in terracotta pots",
      quote: "“Diya digs the soft earth, and I carefully place the seeds. I like feeling the damp soil with my fingers. When we water them, we cheer together!”",
      narrative: "Peer-mediated inclusion thrives in cooperative, hands-on tasks. Tactile activities engage motor planning and sensory regulation while fostering authentic social friendships where every child contributes their strengths.",
      insight: "Real peer inclusion happens through shared meaningful activities, not isolated intervention rooms.",
      badge: "Cooperative Peer Learning",
    },
    {
      title: "Hands-On Science: Learning by Touching",
      subtitle: "1:15 PM • Classroom Laboratory Table",
      image: "/decor/itw/down-syndrome-story-3.webp",
      alt: "Aarav and classmates examining botanical leaf specimens through a large magnifying glass",
      quote: "“Teacher gives me the real plant and a big magnifying glass! I can count all the leaf veins. My friends come to ask me what the green chloroplasts look like.”",
      narrative: "Abstract textbook definitions can feel opaque, but concrete multi-sensory manipulatives bridge understanding effortlessly. When concepts are experienced physically, retention and expressive participation soar.",
      insight: "Concrete-Representational-Abstract (CRA) learning unlocks deep scientific curiosity.",
      badge: "Multi-Sensory Discovery",
    },
    {
      title: "Celebrating Every Milestone",
      subtitle: "3:30 PM • Courtyard Farewell",
      image: "/decor/itw/down-syndrome-story-4.webp",
      alt: "Aarav celebrating tying his shoelaces with a proud high-five with his teacher in the school courtyard",
      quote: "“My teacher gives me a big smile and high-five. I tied my shoelaces all by myself today! I smiled all the way to the school bus.”",
      narrative: "Development in Down syndrome is not a race against a rigid timeline; it is a rich journey of steady progress. When schools measure growth by personal milestones rather than uniform speed, children thrive with unshakeable self-worth.",
      insight: "Dignity, patience, and celebrating authentic milestones form the cornerstone of inclusive education.",
      badge: "Strength-Based Milestone",
    },
  ];

  const turnToPage = (newPage) => {
    if (turning) return;
    if (newPage === currentPage || newPage < 0 || newPage >= PAGES.length) return;
    const dir = newPage > currentPage ? "next" : "prev";
    playPageTurnSound(soundOn);
    setTurning({ from: currentPage, to: newPage, dir });

    if (turningTimerRef.current) clearTimeout(turningTimerRef.current);
    turningTimerRef.current = setTimeout(() => {
      setCurrentPage(newPage);
      setTurning(null);
    }, 570);
  };

  useEffect(() => {
    return () => {
      if (turningTimerRef.current) clearTimeout(turningTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight") {
        turnToPage(currentPage + 1);
      } else if (e.key === "ArrowLeft") {
        turnToPage(currentPage - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, turning]);

  const page = PAGES[currentPage];
  const MOMENT_TABS = ["1. Schedule", "2. Garden", "3. Science", "4. Milestone"];

  return (
    <section className="itw-view itw-module itw-flow" data-accent="autism">
      {/* Sleek, de-congested top navigation */}
      <div className="itw-story-nav-header">
        <div className="itw-story-nav-left">
          <button type="button" className="itw-pill-btn" onClick={onBack}>
            ← All Experiences
          </button>
          <span className="itw-story-nav-sep" aria-hidden="true">/</span>
          <span className="itw-story-nav-name">Aarav&apos;s Day: A Story of Belonging</span>
        </div>
        <span className="itw-story-nav-count">
          Moment {currentPage + 1} of {PAGES.length}
        </span>
      </div>

      <div className="itw-story-exhibit">
        {/* Physical Storybook Casing */}
        <div className="itw-storybook-casing">
          {/* Top Bookmark Ribbon Tabs (Short, crisp, never clipped!) */}
          <div className="itw-book-top-tabs" role="tablist" aria-label="Storybook moments">
            {PAGES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={idx === currentPage}
                className={`itw-book-tab${idx === currentPage ? " itw-active" : ""}`}
                onClick={() => turnToPage(idx)}
                disabled={Boolean(turning)}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ verticalAlign: "-1px" }}>
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                <span>{MOMENT_TABS[idx]}</span>
              </button>
            ))}
          </div>

          {/* Open Two-Page Storybook Spread with True 3D Page Turn */}
          <div className="itw-storybook-spread">
            {/* Silk Bookmark Ribbon Draped Over Top Spine */}
            <div className="itw-silk-ribbon" aria-hidden="true">
              <div className="itw-silk-ribbon-tail" />
            </div>

            {/* Stationary Left Page (Shows from page during next turn, to page during prev turn) */}
            <DsArtPage
              page={turning ? (turning.dir === "next" ? PAGES[turning.from] : PAGES[turning.to]) : page}
              pageIndex={turning ? (turning.dir === "next" ? turning.from : turning.to) : currentPage}
              totalPages={PAGES.length}
              onTurnBack={() => turnToPage(currentPage - 1)}
              isCornerCurlActive={!turning}
            />

            {/* Book Spine Crease */}
            <div className="itw-book-spine" aria-hidden="true" />

            {/* Stationary Right Page (Shows to page during next turn, from page during prev turn) */}
            <DsTextPage
              page={turning ? (turning.dir === "next" ? PAGES[turning.to] : PAGES[turning.from]) : page}
              pageIndex={turning ? (turning.dir === "next" ? turning.to : turning.from) : currentPage}
              totalPages={PAGES.length}
              pages={PAGES}
              onTurnPrev={() => turnToPage(currentPage - 1)}
              onTurnNext={() => turnToPage(currentPage + 1)}
              onNavigateAutism={() => onNavigate("autism")}
              onSelectPage={turnToPage}
              isCornerCurlActive={!turning}
            />

            {/* Dynamic under-shadows on stationary pages */}
            {turning && turning.dir === "next" && (
              <div className="itw-under-shadow-left" aria-hidden="true" />
            )}
            {turning && turning.dir === "prev" && (
              <div className="itw-under-shadow-right" aria-hidden="true" />
            )}

            {/* 3D Turning Leaf Overlay */}
            {turning && (
              <div
                key={`ds-turning-${turning.from}-${turning.to}`}
                className={`itw-turning-leaf-layer ${turning.dir === "next" ? "itw-leaf-next" : "itw-leaf-prev"}`}
              >
                {/* Front Face of Turning Leaf */}
                <div className="itw-leaf-face itw-leaf-face-front">
                  {turning.dir === "next" ? (
                    <DsTextPage
                      page={PAGES[turning.from]}
                      pageIndex={turning.from}
                      totalPages={PAGES.length}
                      pages={PAGES}
                      isTurningFace
                    />
                  ) : (
                    <DsArtPage
                      page={PAGES[turning.from]}
                      pageIndex={turning.from}
                      totalPages={PAGES.length}
                      isTurningFace
                    />
                  )}
                  <div className="itw-leaf-reflection" aria-hidden="true" />
                </div>

                {/* Back Face of Turning Leaf (Faces viewer after crossing spine) */}
                <div className="itw-leaf-face itw-leaf-face-back">
                  {turning.dir === "next" ? (
                    <DsArtPage
                      page={PAGES[turning.to]}
                      pageIndex={turning.to}
                      totalPages={PAGES.length}
                      isTurningFace
                    />
                  ) : (
                    <DsTextPage
                      page={PAGES[turning.to]}
                      pageIndex={turning.to}
                      totalPages={PAGES.length}
                      pages={PAGES}
                      isTurningFace
                    />
                  )}
                  <div className="itw-leaf-reflection" aria-hidden="true" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 3D Storybook Helpers: Day Through My Eyes Story ---------------- */

function EyesArtPage({
  current,
  activePeriod,
  totalPeriods,
  onTurnBack,
  isCornerCurlActive = true,
  isTurningFace = false,
}) {
  return (
    <div className="itw-storybook-art-page">
      {/* Top-Left Corner Curl (Turn Back) */}
      {!isTurningFace && isCornerCurlActive && activePeriod > 0 && (
        <div
          className="itw-book-corner-curl-prev"
          title={`Turn back to Period ${activePeriod}`}
          onClick={onTurnBack}
          role="button"
          tabIndex={0}
          aria-label="Previous period"
        />
      )}

      <div className="itw-storybook-art-frame">
        <div className="itw-photo-corner itw-corner-tl" aria-hidden="true" />
        <div className="itw-photo-corner itw-corner-tr" aria-hidden="true" />
        <div className="itw-photo-corner itw-corner-bl" aria-hidden="true" />
        <div className="itw-photo-corner itw-corner-br" aria-hidden="true" />
        <img
          src={current.image}
          alt={current.alt}
          className="itw-storybook-art-img"
          loading="eager"
        />
        <span className="itw-storybook-art-badge">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ verticalAlign: "-1px", marginRight: 3 }}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {current.time}
        </span>
      </div>
      <div className="itw-storybook-caption-plaque">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: "-1px", flexShrink: 0 }}>
          <path d="M3 21h18M5 21V7l8-4 8 4v14M8 10h2m-2 4h2m-2 4h2m6-8h2m-2 4h2m-2 4h2" />
        </svg>
        <span><strong>Setting:</strong> {current.setting}</span>
      </div>
      <div className="itw-book-left-folio">
        <span>Period {activePeriod + 1} of {totalPeriods}</span>
        <span>{current.time} Schedule</span>
      </div>
    </div>
  );
}

function EyesTextPage({
  current,
  activePeriod,
  totalPeriods,
  periods,
  activeLens,
  setActiveLens,
  onTurnPrev,
  onTurnNext,
  onNavigateAutism,
  onSelectPeriod,
  isCornerCurlActive = true,
  isTurningFace = false,
}) {
  return (
    <div className="itw-storybook-text-page">
      {/* Sweeping Light Sheen on Bending Page */}
      <div className="itw-page-turn-sheen" aria-hidden="true" />

      {/* Curled Paper Dog-Ear */}
      {!isTurningFace && isCornerCurlActive && activePeriod < totalPeriods - 1 && (
        <div
          className="itw-book-corner-curl"
          title={`Turn to Period ${activePeriod + 2}`}
          onClick={onTurnNext}
          role="button"
          tabIndex={0}
          aria-label="Turn page"
        />
      )}

      <div className="itw-storybook-chapter-ribbon">
        <span>Period {activePeriod + 1} • {current.time}</span>
        <span className="itw-storybook-time-tag">A Day Through My Eyes</span>
      </div>

      <h3 className="itw-storybook-page-title">{current.title}</h3>

      <div style={{ fontSize: 13, fontWeight: 800, color: "#1e3325", marginTop: 2 }}>
        Experience through different lenses:
      </div>
      <div className="itw-lens-switcher" role="radiogroup" aria-label="Perspective lenses">
        <button
          type="button"
          className={`itw-lens-btn${activeLens === "sensory" ? " itw-active" : ""}`}
          onClick={() => setActiveLens && setActiveLens("sensory")}
          style={{ background: activeLens === "sensory" ? "var(--itw-autism)" : undefined }}
          disabled={isTurningFace}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ verticalAlign: "-1px" }}>
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
          </svg>
          <span>Sensory</span>
        </button>
        <button
          type="button"
          className={`itw-lens-btn${activeLens === "attention" ? " itw-active" : ""}`}
          onClick={() => setActiveLens && setActiveLens("attention")}
          style={{ background: activeLens === "attention" ? "var(--itw-adhd)" : undefined }}
          disabled={isTurningFace}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ verticalAlign: "-1px" }}>
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04zM14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z" />
          </svg>
          <span>Attention</span>
        </button>
        <button
          type="button"
          className={`itw-lens-btn${activeLens === "communication" ? " itw-active" : ""}`}
          onClick={() => setActiveLens && setActiveLens("communication")}
          style={{ background: activeLens === "communication" ? "var(--itw-speech)" : undefined }}
          disabled={isTurningFace}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ verticalAlign: "-1px" }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>Speech</span>
        </button>
        <button
          type="button"
          className={`itw-lens-btn${activeLens === "supported" ? " itw-active" : ""}`}
          onClick={() => setActiveLens && setActiveLens("supported")}
          style={{ background: activeLens === "supported" ? "#2e7d32" : undefined }}
          disabled={isTurningFace}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ verticalAlign: "-1px" }}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span>Supported</span>
        </button>
      </div>

      {/* Lens Content Box */}
      <div className="itw-storybook-quote-card" style={{
        background: activeLens === "supported" ? "rgba(46, 125, 50, 0.09)" : undefined,
        borderLeftColor: activeLens === "supported" ? "#2e7d32" : undefined,
      }}>
        <p style={{ fontStyle: "normal", fontSize: "1.06rem" }}>
          <span className="itw-story-dropcap">{current[activeLens]?.charAt(0)}</span>
          {current[activeLens]?.slice(1)}
        </p>
      </div>

      <div className="itw-story-flourish" aria-hidden="true">
        <svg viewBox="0 0 160 18" width="160" height="18" fill="none">
          <path d="M10 9 C40 2, 60 16, 80 9 C100 2, 120 16, 150 9" stroke="#b48c3c" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="80" cy="9" r="2.8" fill="#b48c3c" />
          <path d="M73 9 C76 5, 80 3, 80 3 C80 3, 84 5, 87 9 C84 13, 80 15, 80 15 C80 15, 76 13, 73 9 Z" fill="rgba(180,140,60,0.35)" />
        </svg>
      </div>

      <div className="itw-storybook-insight-box">
        <div className="itw-insight-title">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ verticalAlign: "-1px" }}>
            <path d="M9 18h6m-4 4h2m4.6-11.4a7 7 0 1 0-9.2 0c.9.8 1.6 2.2 1.6 3.4h6c0-1.2.7-2.6 1.6-3.4z" />
          </svg>
          <span>Observation</span>
        </div>
        <p>
          {activeLens === "supported"
            ? "When proactive physical and sensory scaffolding is designed into the space, fatigue drops and learning blooms."
            : "Every child experiences sensory and attentional demands differently. A classroom that feels normal to one can demand enormous energy from another."}
        </p>
      </div>

      {/* IN-PAGE NAVIGATION (Close by & immediately visible!) */}
      <div className="itw-book-inpage-nav">
        <button
          type="button"
          className="itw-book-turn-btn itw-book-turn-prev"
          disabled={activePeriod === 0 || isTurningFace}
          onClick={onTurnPrev}
        >
          ← Turn Back
        </button>

        <div className="itw-book-page-dots" aria-label="Period selection">
          {periods.map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`itw-book-dot${idx === activePeriod ? " itw-active" : ""}`}
              onClick={() => onSelectPeriod && onSelectPeriod(idx)}
              aria-label={`Go to period ${idx + 1}`}
              disabled={isTurningFace}
            />
          ))}
        </div>

        {activePeriod < totalPeriods - 1 ? (
          <button
            type="button"
            className="itw-book-turn-btn itw-book-turn-next"
            onClick={onTurnNext}
            disabled={isTurningFace}
          >
            Turn to Next Period →
          </button>
        ) : (
          <button
            type="button"
            className="itw-book-turn-btn itw-book-turn-next"
            onClick={onNavigateAutism}
            disabled={isTurningFace}
          >
            Explore Interactive Experiences →
          </button>
        )}
      </div>
    </div>
  );
}

function DayThroughMyEyesStory({ onBack, onNavigate }) {
  const { soundOn } = useContext(SettingsContext);
  const [activePeriod, setActivePeriod] = useState(0);
  const [activeLens, setActiveLens] = useState("sensory"); // sensory | attention | communication | supported
  const [turning, setTurning] = useState(null); // null | { from: number, to: number, dir: 'next' | 'prev' }
  const turningTimerRef = useRef(null);

  const PERIODS = [
    {
      time: "8:30 AM",
      title: "Morning Assembly & Echoing Hallway",
      image: "/decor/itw/day-through-my-eyes.webp",
      alt: "Courtyard assembly with hundreds of students under bright morning sun",
      setting: "300 students standing in rows on polished granite; morning announcements booming through high-mounted horn speakers; bright sunlight glaring off courtyard pavers.",
      sensory: "The loudspeaker reverberates in my ears like physical pressure. The hum of 300 footsteps on stone creates a wall of white noise where words get lost.",
      attention: "My eyes are pulled to the flutter of pigeons in the courtyard rafters and the flicker of distant hallway bulbs. Holding attention on announcements requires intense effort.",
      communication: "The teacher asks me for my homework diary suddenly. The noise makes my throat tighten; finding the words takes longer than the teacher waits.",
      supported: "Accommodations in action: Noise-dampening acoustic curtains, standing near the calm edge, and visual assembly agenda cards allow full, relaxed participation.",
    },
    {
      time: "10:15 AM",
      title: "Science Laboratory & Group Project",
      image: "/decor/itw/science-lab-story.webp",
      alt: "Diverse children gathered around a wooden table examining microscope and plants",
      setting: "Tables with glassware, microscopes, and tap water; multiple group conversations happening at once.",
      sensory: "The smell of methylated spirits and bleach mixes with the clatter of test tubes on slate benches.",
      attention: "I have 4 ideas for our model simultaneously! Keeping them in sequential order while partners debate is an executive balancing act.",
      communication: "I know the answer to the hypothesis! But speaking over louder classmates requires more motor planning time than the discussion pause allows.",
      supported: "Accommodations in action: AAC concept cards, small group roles with clear task breakdowns, and a visual step-by-step experiment board unlock my full scientific insight.",
    },
    {
      time: "12:30 PM",
      title: "Canteen Lunch & Neem Tree Bench",
      image: "/decor/itw/hero-world.webp",
      alt: "Quiet shaded garden bench under lush green trees with gentle sunlight",
      setting: "Bustling school cafeteria with stainless steel trays, cutlery clatter, and fast-moving peer banter.",
      sensory: "The scraping of metal chairs on floor tiles and overlapping smells can feel like a sudden wave. A quiet shaded bench under the neem tree restores my equilibrium.",
      attention: "Social games have unwritten, shifting rules. When someone changes the game halfway, my mind takes time to re-route.",
      communication: "Relaxed, low-pressure conversations with close friends where no one rushes my sentences make this my favorite time of day.",
      supported: "Accommodations in action: A quiet sensory garden corner, designated lunch buddy system, and unhurried seating options make lunch a time of genuine restoration.",
    },
    {
      time: "2:15 PM",
      title: "Reading & Creative Art Studio",
      image: "/decor/itw/dyslexia-environment.webp",
      alt: "Warm quiet library with open books and art easels bathed in afternoon light",
      setting: "Afternoon classroom; students transcribing notes from the blackboard into notebooks.",
      sensory: "Afternoon heat and fatigue build up; pencil grip feels heavier as hand muscles tire.",
      attention: "After 5 hours of continuous filtering, my brain's battery is low. Short movement breaks and sensory fidgets restore my focus immediately.",
      communication: "When the teacher asks me to explain what I wrote, speaking it aloud is 10 times easier than the messy pencil marks on my page.",
      supported: "Accommodations in action: Speech-to-text dictation, reading rulers with tinted focus overlays, and digital notebooks ensure my academic comprehension is fully recognized.",
    },
  ];

  const turnToPeriod = (newPeriod) => {
    if (turning) return;
    if (newPeriod === activePeriod || newPeriod < 0 || newPeriod >= PERIODS.length) return;
    const dir = newPeriod > activePeriod ? "next" : "prev";
    playPageTurnSound(soundOn);
    setTurning({ from: activePeriod, to: newPeriod, dir });

    if (turningTimerRef.current) clearTimeout(turningTimerRef.current);
    turningTimerRef.current = setTimeout(() => {
      setActivePeriod(newPeriod);
      setTurning(null);
    }, 570);
  };

  useEffect(() => {
    return () => {
      if (turningTimerRef.current) clearTimeout(turningTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight") {
        turnToPeriod(activePeriod + 1);
      } else if (e.key === "ArrowLeft") {
        turnToPeriod(activePeriod - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePeriod, turning]);

  const current = PERIODS[activePeriod];
  const PERIOD_TABS = ["1. Assembly (8:30 AM)", "2. Science (10:15 AM)", "3. Lunch (12:30 PM)", "4. Studio (2:15 PM)"];

  return (
    <section className="itw-view itw-module itw-flow" data-accent="adhd">
      {/* Sleek, de-congested top navigation */}
      <div className="itw-story-nav-header">
        <div className="itw-story-nav-left">
          <button type="button" className="itw-pill-btn" onClick={onBack}>
            ← All Experiences
          </button>
          <span className="itw-story-nav-sep" aria-hidden="true">/</span>
          <span className="itw-story-nav-name">A Day Through My Eyes</span>
        </div>
        <span className="itw-story-nav-count">
          Period {activePeriod + 1} of {PERIODS.length}
        </span>
      </div>

      <div className="itw-story-exhibit">
        {/* Physical Storybook Casing */}
        <div className="itw-storybook-casing">
          {/* Top Bookmark Ribbon Tabs (Short, crisp, never clipped!) */}
          <div className="itw-book-top-tabs" role="tablist" aria-label="School day periods">
            {PERIODS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={idx === activePeriod}
                className={`itw-book-tab${idx === activePeriod ? " itw-active" : ""}`}
                onClick={() => turnToPeriod(idx)}
                disabled={Boolean(turning)}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ verticalAlign: "-1px" }}>
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{PERIOD_TABS[idx]}</span>
              </button>
            ))}
          </div>

          {/* Open Two-Page Storybook Spread with True 3D Page Turn */}
          <div className="itw-storybook-spread">
            {/* Silk Bookmark Ribbon Draped Over Top Spine */}
            <div className="itw-silk-ribbon" aria-hidden="true">
              <div className="itw-silk-ribbon-tail" />
            </div>

            {/* Stationary Left Page (Shows from period during next turn, to period during prev turn) */}
            <EyesArtPage
              current={turning ? (turning.dir === "next" ? PERIODS[turning.from] : PERIODS[turning.to]) : current}
              activePeriod={turning ? (turning.dir === "next" ? turning.from : turning.to) : activePeriod}
              totalPeriods={PERIODS.length}
              onTurnBack={() => turnToPeriod(activePeriod - 1)}
              isCornerCurlActive={!turning}
            />

            {/* Book Spine Crease */}
            <div className="itw-book-spine" aria-hidden="true" />

            {/* Stationary Right Page (Shows to period during next turn, from period during prev turn) */}
            <EyesTextPage
              current={turning ? (turning.dir === "next" ? PERIODS[turning.to] : PERIODS[turning.from]) : current}
              activePeriod={turning ? (turning.dir === "next" ? turning.to : turning.from) : activePeriod}
              totalPeriods={PERIODS.length}
              periods={PERIODS}
              activeLens={activeLens}
              setActiveLens={setActiveLens}
              onTurnPrev={() => turnToPeriod(activePeriod - 1)}
              onTurnNext={() => turnToPeriod(activePeriod + 1)}
              onNavigateAutism={() => onNavigate("autism")}
              onSelectPeriod={turnToPeriod}
              isCornerCurlActive={!turning}
            />

            {/* Dynamic under-shadows on stationary pages */}
            {turning && turning.dir === "next" && (
              <div className="itw-under-shadow-left" aria-hidden="true" />
            )}
            {turning && turning.dir === "prev" && (
              <div className="itw-under-shadow-right" aria-hidden="true" />
            )}

            {/* 3D Turning Leaf Overlay */}
            {turning && (
              <div
                key={`eyes-turning-${turning.from}-${turning.to}`}
                className={`itw-turning-leaf-layer ${turning.dir === "next" ? "itw-leaf-next" : "itw-leaf-prev"}`}
              >
                {/* Front Face of Turning Leaf */}
                <div className="itw-leaf-face itw-leaf-face-front">
                  {turning.dir === "next" ? (
                    <EyesTextPage
                      current={PERIODS[turning.from]}
                      activePeriod={turning.from}
                      totalPeriods={PERIODS.length}
                      periods={PERIODS}
                      activeLens={activeLens}
                      isTurningFace
                    />
                  ) : (
                    <EyesArtPage
                      current={PERIODS[turning.from]}
                      activePeriod={turning.from}
                      totalPeriods={PERIODS.length}
                      isTurningFace
                    />
                  )}
                  <div className="itw-leaf-reflection" aria-hidden="true" />
                </div>

                {/* Back Face of Turning Leaf (Faces viewer after crossing spine) */}
                <div className="itw-leaf-face itw-leaf-face-back">
                  {turning.dir === "next" ? (
                    <EyesArtPage
                      current={PERIODS[turning.to]}
                      activePeriod={turning.to}
                      totalPeriods={PERIODS.length}
                      isTurningFace
                    />
                  ) : (
                    <EyesTextPage
                      current={PERIODS[turning.to]}
                      activePeriod={turning.to}
                      totalPeriods={PERIODS.length}
                      periods={PERIODS}
                      activeLens={activeLens}
                      isTurningFace
                    />
                  )}
                  <div className="itw-leaf-reflection" aria-hidden="true" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function InTheirWorld() {
  const [view, setView] = useState(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const mod = p.get("module") || window.location.hash.replace("#", "");
      if (mod && ["autism", "adhd", "dyslexia", "speech", "dyscalculia", "dysgraphia", "auditory", "executive"].includes(mod)) return mod;
    }
    return "landing";
  });
  const [soundOn, setSoundOn] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = window.localStorage.getItem("itw-dark-mode");
    if (saved !== null) return saved === "1";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  useEffect(() => {
    audio.setEnabled(soundOn);
    if (!soundOn) {
      audio.stopAll();
    }
  }, [soundOn]);

  useEffect(() => {
    window.localStorage.setItem("itw-dark-mode", darkMode ? "1" : "0");
    const prevBg = document.body.style.background;
    document.body.style.background = darkMode ? "#14180f" : "#fdf8ee";
    if (darkMode) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("itw-dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("itw-dark");
    }
    return () => {
      document.body.style.background = prevBg;
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("itw-dark");
    };
  }, [darkMode]);

  useEffect(() => {
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = prev;
    };
  }, []);

  useEffect(() => {
    const handleUrlChange = () => {
      const p = new URLSearchParams(window.location.search);
      const mod = p.get("module") || window.location.hash.replace("#", "");
      if (mod && ["autism", "adhd", "dyslexia", "speech", "dyscalculia", "dysgraphia", "auditory", "executive"].includes(mod)) {
        setView(mod);
      } else if (!mod) {
        setView("landing");
      }
    };
    window.addEventListener("popstate", handleUrlChange);
    window.addEventListener("hashchange", handleUrlChange);
    return () => {
      window.removeEventListener("popstate", handleUrlChange);
      window.removeEventListener("hashchange", handleUrlChange);
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  const goBack = () => {
    audio.stopAll();
    setView("landing");
  };
  const navigate = (key) => {
    audio.stopAll();
    setView(key);
  };

  const accentTable = darkMode ? ACCENT_HEX_DARK : ACCENT_HEX;
  const glow = `rgba(${accentTable[view] || accentTable.landing}, .16)`;
  const settings = useMemo(() => ({ soundOn }), [soundOn]);

  return (
    <SettingsContext.Provider value={settings}>
      <div className={`itw-root${darkMode ? " itw-dark" : ""}`}>
        <div className="itw-grain" aria-hidden="true" />
        <div className="itw-ambient" style={{ "--itw-glow": glow }} aria-hidden="true" />
        <div className="itw-app">
          <SettingsBar soundOn={soundOn} setSoundOn={setSoundOn} darkMode={darkMode} setDarkMode={setDarkMode} />
          {view === "landing" && <Landing onSelect={setView} />}
          {view === "autism" && (
            <ModuleErrorBoundary onBack={goBack}>
              <AutismModule key="autism" onBack={goBack} onNavigate={navigate} />
            </ModuleErrorBoundary>
          )}
          {view === "adhd" && (
            <ModuleErrorBoundary onBack={goBack}>
              <AdhdModule key="adhd" onBack={goBack} onNavigate={navigate} />
            </ModuleErrorBoundary>
          )}
          {view === "dyslexia" && (
            <ModuleErrorBoundary onBack={goBack}>
              <DyslexiaModule key="dyslexia" onBack={goBack} onNavigate={navigate} />
            </ModuleErrorBoundary>
          )}
          {view === "speech" && (
            <ModuleErrorBoundary onBack={goBack}>
              <SpeechModule key="speech" onBack={goBack} onNavigate={navigate} />
            </ModuleErrorBoundary>
          )}
          {view === "dyscalculia" && (
            <ModuleErrorBoundary onBack={goBack}>
              <DyscalculiaModule key="dyscalculia" onBack={goBack} onNavigate={navigate} />
            </ModuleErrorBoundary>
          )}
          {view === "dysgraphia" && (
            <ModuleErrorBoundary onBack={goBack}>
              <DysgraphiaModule key="dysgraphia" onBack={goBack} onNavigate={navigate} />
            </ModuleErrorBoundary>
          )}
          {view === "auditory" && (
            <ModuleErrorBoundary onBack={goBack}>
              <AuditoryProcessingModule key="auditory" onBack={goBack} onNavigate={navigate} />
            </ModuleErrorBoundary>
          )}
          {view === "executive" && (
            <ModuleErrorBoundary onBack={goBack}>
              <ExecutiveFunctioningModule key="executive" onBack={goBack} onNavigate={navigate} />
            </ModuleErrorBoundary>
          )}
          {view === "downsyndrome" && (
            <ModuleErrorBoundary onBack={goBack}>
              <DownSyndromeStory key="downsyndrome" onBack={goBack} onNavigate={navigate} />
            </ModuleErrorBoundary>
          )}
          {view === "dayineyes" && (
            <ModuleErrorBoundary onBack={goBack}>
              <DayThroughMyEyesStory key="dayineyes" onBack={goBack} onNavigate={navigate} />
            </ModuleErrorBoundary>
          )}
        </div>
      </div>
    </SettingsContext.Provider>
  );
}
