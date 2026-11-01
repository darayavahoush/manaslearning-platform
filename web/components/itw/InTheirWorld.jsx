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
   simulations (autism, ADHD, dyslexia, speech/language), each
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
   A runtime error inside any one module (a bad simulation state, a
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
    blurb: "An interactive first-person story of Aarav: celebrating strengths, visual learning, and everyday milestones.",
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
    blurb: "Step into an everyday school day and switch between Sensory, Attention, Communication, and Supported Classroom lenses.",
    image: "/decor/itw/day-through-my-eyes.webp",
    meta: "Perspective Lens Exhibit",
    badge: "Perspective Lens",
  },
];

const HOW_STEPS = [
  { n: 1, title: "Choose an experience", text: "Select a topic to explore." },
  { n: 2, title: "Try the activity", text: "Step into a short, everyday scenario." },
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
          <div className="itw-eyebrow itw-rise itw-rise-1">Experience What They Feel</div>
          <h1 className="itw-title itw-rise itw-rise-2">
            Step into their <span className="itw-accent-word">world<svg className="itw-squiggle" viewBox="0 0 160 14" preserveAspectRatio="none"><path d="M2 9c14-10 26-10 40 0s26 10 40 0 26-10 40 0 26 10 36 2" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/></svg></span>,<br />just for a few minutes.
          </h1>
          <p className="itw-lede itw-rise itw-rise-3">
            Some learning differences are difficult to see from the outside. Short, hands-on
            experiences let you feel a small part of what reading, focusing, sensory input and
            speaking out loud can be like for some children — each one paired with real data
            and practical steps you can use right away.
          </p>
          <div className="itw-hero-actions itw-rise itw-rise-4">
            <button className="itw-cta itw-cta-dark" onClick={() => scrollToId("itw-choose")}>Start an Experience</button>
          </div>
          <div className="itw-disclaimer itw-rise itw-rise-4">
            <strong>Before you start:</strong> these are approximations for empathy, not diagnoses — every child's experience is their own.
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
        Built to build empathy, not to diagnose. Figures are approximate and drawn from the Dyslexia
        Association of India, AIISH, INCLEN Trust / PLOS Medicine, and peer-reviewed Indian epidemiological studies.
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
          Reading a checklist about autism, ADHD, dyslexia, or a speech/language difference tells you
          the facts — it doesn't tell you what your child's morning actually feels like. In Their World
          is four short simulations, one per condition, that put you inside that experience for a few
          minutes: sounds you can't tune out, focus that keeps slipping, letters that won't sit still,
          words that won't come out in time. Most parents and teachers don't get long before they need
          to understand — this is a five-minute way in.
        </p>
        <p>
          The data behind each module is deliberately Indian, not imported. Most awareness material
          in this space is built on US or UK prevalence numbers that don't map cleanly onto a country
          where diagnosis is far less common and often comes late. Figures here are drawn from the
          Dyslexia Association of India, AIISH, and INCLEN Trust / PLOS Medicine studies instead.
        </p>
        <ul className="itw-about-points">
          <li>
            <b>Feel it first</b>
            A short interactive task simulates the actual friction — not a description of it.
          </li>
          <li>
            <b>See the numbers</b>
            Indian prevalence data and context, so the scale feels real rather than abstract.
          </li>
          <li>
            <b>Know what helps</b>
            Concrete, low-effort strategies for home and classroom, not just awareness.
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

/* ---------------- Viewfinder (signature element — the "step into their
   world" viewport, with a live HUD readout, wraps every sim stage) ---------------- */

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

/* ================= AUTISM: sensory overload simulator ================= */

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
    subtitle: "Simulated in-app audio dampening (~80%)",
    desc: "Applies software audio attenuation to background sounds, demonstrating how dampening auditory overload frees mental focus. (Note: real ear defender attenuation varies by frequency rating).",
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
            {supportType === "ear_defenders" && "Sensory Ear Defenders Active: Competing audio attenuated by 80%."}
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

  // Simulation stopwatch
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
              <li><span aria-hidden="true">🖥️</span> First-person desk workspace exploration</li>
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
      <button type="button" className="itw-crumb-link" onClick={onBack}>Experience What They Feel</button>
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

const SPEECH_STEPS = [
  { key: "instructions", label: "Instructions" },
  { key: "run_fast", label: "Run 1 (Fast Pacing)" },
  { key: "reflect", label: "Reflect & Compare" },
  { key: "support", label: "Support Experiment" },
  { key: "run_supported", label: "Run 2 (Supported)" },
  { key: "explain", label: "Understanding & Action" },
];

const SPEECH_STEP_INDEX = {
  instructions: 0,
  run_fast: 1,
  reflect: 2,
  support: 3,
  run_supported: 3,
  explain: 4,
  next: 4,
};

const SPEECH_REFLECT_QS = [
  {
    q: "During the fast-paced conversation, where did you notice the communicative barrier?",
    options: [
      "I had the complete thought in mind, but the ticking turn window created sudden performance anxiety.",
      "The expectation of immediate verbal delivery made finding and organizing words feel rushed.",
      "The fear that the listener would interrupt or move on heightened my tension.",
      "The pressure was created by external listener expectations, not a lack of scientific knowledge.",
    ],
  },
];

const SPEECH_SUPPORT_CHOICES = [
  {
    id: "patient_wait",
    title: "Unhurried Wait Time (The 5-Second Rule)",
    subtitle: "Attentive presence with zero clock pressure",
    desc: "The conversation partner maintains warm, natural presence and gives generous silence without glancing at clocks or rushing.",
    tag: "Pacing Accommodation",
  },
  {
    id: "aac_board",
    title: "AAC Visual Communication Board",
    subtitle: "Multi-modal picture and phrase cards",
    desc: "Provides clear visual icons and phrase blocks so ideas can be shared instantly without verbal motor coordination.",
    tag: "Multi-Modal Access",
  },
  {
    id: "no_interruption",
    title: "Sentence Ownership & Active Listening",
    subtitle: "Protects the speaker right to complete thoughts",
    desc: "A classroom agreement that listeners never finish a student sentences, guess their words, or talk over them.",
    tag: "Relational Practice",
  },
];

const SPEECH_PHRASE_BLOCKS = [
  { id: "p1", text: "We built a hydraulic crane", order: 1 },
  { id: "p2", text: "using plastic syringes", order: 2 },
  { id: "p3", text: "connected by water tubes", order: 3 },
  { id: "p4", text: "and cardboard joints.", order: 4 },
];

const AAC_COMM_TILES = [
  { id: "crane", label: "Hydraulic Crane", phrase: "hydraulic crane", icon: "🏗️" },
  { id: "syringes", label: "Plastic Syringes", phrase: "plastic syringes", icon: "💉" },
  { id: "water", label: "Water Tubes", phrase: "water tubes", icon: "💧" },
  { id: "joints", label: "Cardboard Joints", phrase: "cardboard joints", icon: "📦" },
  { id: "lift", label: "Lifts Heavy Weight", phrase: "lifts heavy weight", icon: "🏋️" },
  { id: "team", label: "Built Together", phrase: "built together with team", icon: "🤝" },
];

function SpeechSim({
  mode = "fast",
  supportType = "patient_wait",
  onComplete,
  onAbort,
}) {
  const { soundOn } = useContext(SettingsContext);
  const [selectedPhrases, setSelectedPhrases] = useState([]);
  const [aacSelected, setAacSelected] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(mode === "fast" ? 8 : 99);
  const [interrupted, setInterrupted] = useState(false);
  const [finished, setFinished] = useState(false);

  const timerRef = useRef(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Stopwatch timer
  useEffect(() => {
    const startTime = performance.now();
    timerRef.current = setInterval(() => {
      const now = (performance.now() - startTime) / 1000;
      setElapsed(parseFloat(now.toFixed(1)));

      if (mode === "fast") {
        setTimeLeft((prev) => {
          if (prev <= 0.2) {
            setInterrupted(true);
            return 0;
          }
          return parseFloat((prev - 0.1).toFixed(1));
        });
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode]);

  const handlePhraseClick = (block) => {
    if (interrupted || finished) return;
    if (soundOn) audio.cue("tap");
    if (selectedPhrases.find((p) => p.id === block.id)) return;

    const next = [...selectedPhrases, block];
    setSelectedPhrases(next);

    if (next.length === SPEECH_PHRASE_BLOCKS.length) {
      setFinished(true);
      if (timerRef.current) clearInterval(timerRef.current);
      if (soundOn) audio.cue("bell");
      setTimeout(() => {
        onCompleteRef.current?.({
          time: elapsed,
          method: "verbal",
          interrupted: false,
        });
      }, 700);
    }
  };

  const handleAacTileClick = (tile) => {
    if (finished) return;
    if (soundOn) {
      audio.cue("tap");
      speakText(tile.phrase, { rate: 0.95 });
    }
    const next = aacSelected.includes(tile.id) ? aacSelected : [...aacSelected, tile.id];
    setAacSelected(next);

    if (next.length >= 3) {
      setFinished(true);
      if (timerRef.current) clearInterval(timerRef.current);
      if (soundOn) audio.cue("bell");
      setTimeout(() => {
        onCompleteRef.current?.({
          time: elapsed,
          method: "aac",
          interrupted: false,
        });
      }, 800);
    }
  };

  const retryRun = () => {
    setSelectedPhrases([]);
    setTimeLeft(8);
    setInterrupted(false);
    setFinished(false);
  };

  const isSupportedAac = mode === "supported" && supportType === "aac_board";

  return (
    <div className="itw-speech-arena" role="region" aria-label="Speech and Language Communication Experience">
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-speech)", letterSpacing: "0.08em" }}>
            {mode === "fast" ? "Run 1: Fast Conversational Demand" : "Run 2: Supported Communication"}
          </span>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--itw-text)", margin: "4px 0" }}>
            Classroom Presentation: Science Model Share
          </h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {mode === "fast" && (
            <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 800, color: timeLeft < 3 ? "#ef4444" : "var(--itw-speech)" }}>
              ⏳ Turn Window: {timeLeft.toFixed(1)}s
            </span>
          )}
          <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--itw-muted)" }}>
            ⏱️ {elapsed.toFixed(1)}s
          </span>
          <button type="button" className="itw-pill-btn" onClick={onAbort}>Exit</button>
        </div>
      </div>

      {/* Classroom Partner Dialogue Prompt */}
      <div
        style={{
          background: "var(--itw-panel-2)",
          border: "1.5px solid var(--itw-border)",
          borderRadius: 18,
          padding: "18px 22px",
          marginBottom: 20,
          display: "flex",
          alignItems: "flex-start",
          gap: 16,
        }}
      >
        <div style={{ fontSize: 32 }} aria-hidden="true">
          {mode === "fast" ? (interrupted ? "⏱️" : "🏃") : "🤝"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-speech)" }}>
            Teacher Question in Classroom:
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--itw-text)", margin: "4px 0 8px" }}>
            &ldquo;Can you explain to the class how your team built the hydraulic crane?&rdquo;
          </div>
          <div style={{ fontSize: 13, color: "var(--itw-muted)" }}>
            {mode === "fast"
              ? "Fast conversational environment: The class expects a rapid answer in under 8 seconds."
              : supportType === "aac_board"
              ? "Multi-Modal Support: Tap the AAC cards to share the project concepts aloud."
              : "Unhurried Wait Time: The teacher gives warm, patient silence with zero turn clock."}
          </div>
        </div>
      </div>

      {/* Target Thought Banner */}
      <div
        style={{
          background: "rgba(140, 66, 44, 0.08)",
          border: "1px dashed var(--itw-speech)",
          borderRadius: 14,
          padding: "12px 18px",
          marginBottom: 20,
          fontSize: 14,
          color: "var(--itw-text)",
        }}
      >
        <span style={{ fontWeight: 800, color: "var(--itw-speech)", marginRight: 6 }}>
          🧠 What You Know in Your Mind:
        </span>
        &ldquo;We built a hydraulic crane using plastic syringes connected by water tubes and cardboard joints.&rdquo;
      </div>

      {/* Active Communication Area */}
      {isSupportedAac ? (
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--itw-muted)", marginBottom: 10 }}>
            Tap 3 or more AAC cards to express your science model:
          </div>
          <div className="itw-aac-grid">
            {AAC_COMM_TILES.map((tile) => {
              const isSelected = aacSelected.includes(tile.id);
              return (
                <button
                  key={tile.id}
                  type="button"
                  className={`itw-aac-tile${isSelected ? " itw-selected" : ""}`}
                  onClick={() => handleAacTileClick(tile)}
                >
                  <span style={{ fontSize: 28 }}>{tile.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, marginTop: 4 }}>{tile.label}</span>
                </button>
              );
            })}
          </div>
          {finished && (
            <div style={{ textAlign: "center", marginTop: 16, color: "#10b981", fontWeight: 800 }}>
              ✓ Complete message delivered via AAC! Proceeding to takeaways...
            </div>
          )}
        </div>
      ) : (
        <div>
          {interrupted ? (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1.5px solid #ef4444",
                borderRadius: 16,
                padding: "20px 24px",
                textAlign: "center",
                margin: "16px 0",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>⚠️</div>
              <h4 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: "#ef4444" }}>
                Interrupted: Conversational Window Closed
              </h4>
              <p style={{ margin: "0 0 16px", fontSize: 14, color: "var(--itw-text)", lineHeight: 1.5 }}>
                The listener felt the 8-second silence was too long and spoke over you: &ldquo;Okay, moving on!&rdquo;
                Notice how easily working memory is disrupted when rushed.
              </p>
              <button
                type="button"
                className="itw-cta itw-cta-dark"
                onClick={() => {
                  onCompleteRef.current?.({
                    time: elapsed,
                    method: "verbal",
                    interrupted: true,
                  });
                }}
              >
                Continue to Reflection →
              </button>
              <button
                type="button"
                className="itw-pill-btn"
                style={{ marginLeft: 12 }}
                onClick={retryRun}
              >
                Try Again
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--itw-muted)", marginBottom: 10 }}>
                Select the phrase sequence to formulate your response:
              </div>

              {/* Formulated Sentence Box */}
              <div
                style={{
                  background: "var(--itw-panel)",
                  border: "1.5px solid var(--itw-border)",
                  borderRadius: 14,
                  padding: "16px 20px",
                  minHeight: 56,
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {selectedPhrases.length === 0 ? (
                  <span style={{ fontSize: 14, color: "var(--itw-muted)", fontStyle: "italic" }}>
                    Tap the phrase blocks below in order to speak...
                  </span>
                ) : (
                  selectedPhrases.map((p) => (
                    <span
                      key={p.id}
                      style={{
                        background: "rgba(140, 66, 44, 0.12)",
                        color: "var(--itw-speech)",
                        padding: "4px 10px",
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      {p.text}
                    </span>
                  ))
                )}
              </div>

              {/* Phrase Blocks to Pick */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {SPEECH_PHRASE_BLOCKS.map((block) => {
                  const isPicked = Boolean(selectedPhrases.find((p) => p.id === block.id));
                  return (
                    <button
                      key={block.id}
                      type="button"
                      disabled={isPicked}
                      className={`itw-adhd-keychip${isPicked ? " itw-selected" : ""}`}
                      onClick={() => handlePhraseClick(block)}
                    >
                      {isPicked ? "✓ " : "+ "} {block.text}
                    </button>
                  );
                })}
              </div>

              {finished && (
                <div style={{ textAlign: "center", marginTop: 18, color: "#10b981", fontWeight: 800 }}>
                  ✓ Statement Formulated & Delivered!
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Educational Footer */}
      <div style={{ fontSize: 13, color: "var(--itw-muted)", textAlign: "center", marginTop: 22 }}>
        {mode === "fast"
          ? "Notice how rigid turn timing and listener interruption create performance anxiety even when knowledge is 100% complete."
          : "When listeners offer unhurried wait time and multi-modal options, communication flows naturally and with dignity."}
      </div>
    </div>
  );
}

function SpeechModule({ onBack, onNavigate }) {
  const [step, setStep] = useState("intro"); // intro | instructions | run_fast | reflect | support | run_supported | explain
  const [chosenSupport, setChosenSupport] = useState("patient_wait");
  const [reflectionAnswers, setReflectionAnswers] = useState(() => Array(SPEECH_REFLECT_QS.length).fill(null));
  const [results, setResults] = useState({ fast: null, supported: null });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const handleFastComplete = (res) => {
    setResults((prev) => ({ ...prev, fast: res }));
    setStep("reflect");
  };

  const handleSupportedComplete = (res) => {
    setResults((prev) => ({ ...prev, supported: res }));
    setStep("explain");
  };

  const stepIndex = SPEECH_STEP_INDEX[step];
  const more = MODULES.filter((m) => m.key !== "speech");

  return (
    <section className="itw-view itw-module itw-flow" data-accent="speech">
      <FlowCrumbs name="Speech & Language Differences" onBack={onBack} />
      {stepIndex !== undefined && <FlowStepper steps={SPEECH_STEPS} current={stepIndex} />}

      {step === "intro" && (
        <div className="itw-flow-page itw-flow-intro" key="intro">
          <div>
            <h2 className="itw-flow-title">Speech &amp; Language Differences</h2>
            <div className="itw-flow-sub">Conversational Pacing &amp; Communication Access</div>
            <p className="itw-flow-lead">
              A child who stutters, has childhood apraxia of speech, or experiences language formulation differences knows
              exactly what they wish to say. The barrier they face in classrooms is rarely a lack of ideas — it is the hurried
              pace of conversation, the ticking clock of impatient listeners, and the pressure of being spoken over.
            </p>
            <ul className="itw-flow-meta">
              <li><span aria-hidden="true">⏱️</span> Takes 2–3 minutes</li>
              <li><span aria-hidden="true">🗣️</span> First-person conversational interaction</li>
              <li><span aria-hidden="true">ℹ️</span> An educational exploration, not a clinical diagnostic tool</li>
            </ul>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("instructions")}>
              Start the Experience →
            </button>
          </div>
          <IntroVignette moduleKey="speech" />
        </div>
      )}

      {step === "instructions" && (
        <div className="itw-flow-page itw-flow-narrow" key="instructions">
          <div className="itw-scene-plate">
            <img src="/decor/itw/communication-environment.webp" alt="Inclusive science classroom" className="itw-scene-plate-img" />
            <div className="itw-scene-plate-overlay">
              <span className="itw-scene-tag">📍 Setting • Grade 5 Science Presentation</span>
              <p className="itw-scene-caption">The teacher calls on your group to explain your project. You know every step, but the rapid turn window creates sudden performance tension.</p>
            </div>
          </div>
          <h2 className="itw-flow-title itw-center">Before you begin Run 1</h2>
          <p className="itw-flow-lead itw-center">
            This activity explores conversational pacing — observing how rapid turn-taking windows create communication
            barriers, and how patient listening and AAC supports transform dialogue.
          </p>
          <ul className="itw-flow-list">
            <li><span aria-hidden="true">⏳</span> In Run 1, you have a short conversational window to share your answer.</li>
            <li><span aria-hidden="true">⏱️</span> Notice how pressure builds when you feel the listener is waiting on the clock.</li>
            <li><span aria-hidden="true">💡</span> In Run 2, you will experience unhurried wait time and AAC communication cards.</li>
          </ul>
          <div className="itw-flow-nav">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("intro")}>Back</button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("run_fast")}>
              Begin Run 1 →
            </button>
          </div>
        </div>
      )}

      {step === "run_fast" && (
        <div className="itw-flow-page itw-flow-narrow" key="run_fast">
          <SpeechSim mode="fast" onComplete={handleFastComplete} onAbort={() => setStep("instructions")} />
        </div>
      )}

      {step === "reflect" && (
        <div className="itw-flow-page itw-flow-narrow" key="reflect">
          <h2 className="itw-flow-title itw-center">What did you observe about conversational pacing?</h2>
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
            <div style={{ fontSize: 13, textTransform: "uppercase", color: "var(--itw-speech)", fontWeight: 700 }}>
              Run 1 Conversational Observation
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "var(--itw-text)", margin: "8px 0" }}>
              {results.fast?.interrupted ? "Interrupted by Rushed Listener" : `Delivered in ${results.fast?.time.toFixed(1)}s`}
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--itw-muted)", lineHeight: 1.5 }}>
              Notice how the ticking clock shifted your focus away from the science ideas and into urgent verbal delivery.
              The primary communication barrier was external listener pressure, not a lack of intelligence.
            </p>
          </div>

          <FlowQuestions
            questions={SPEECH_REFLECT_QS}
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
          <h2 className="itw-flow-title itw-center">Choose Communication Support</h2>
          <p className="itw-flow-lead itw-center">
            Select the accommodation you want to explore in the supported conversation:
          </p>
          <div className="itw-flow-cards" role="radiogroup" aria-label="Speech accommodation choices">
            {SPEECH_SUPPORT_CHOICES.map((choice) => {
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
          <SpeechSim
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
            <img src="/decor/itw/communication-environment.webp" alt="Inclusive classroom listening" className="itw-scene-plate-img" />
            <div className="itw-scene-plate-overlay">
              <span className="itw-scene-tag">📍 Insight • Communication Access</span>
              <p className="itw-scene-caption">When listeners offer unhurried patience and multimodal tools, every student has an authentic voice.</p>
            </div>
          </div>

          <h2 className="itw-flow-title itw-center">What We Learned About Speech Differences</h2>
          <p className="itw-flow-lead itw-center">
            Speech differences are neuromotor or language-formulation variations, not cognitive deficits.
            Creating an inclusive classroom requires cultivating active, patient listeners.
          </p>

          <div
            style={{
              background: "rgba(140, 66, 44, 0.08)",
              border: "1px solid var(--itw-speech)",
              borderRadius: 18,
              padding: "20px 24px",
              margin: "24px 0",
            }}
          >
            <h4 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800, color: "var(--itw-speech)" }}>
              ASHA Clinical Guidance: Listen to what is said, not how it is delivered
            </h4>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "var(--itw-text)" }}>
              The American Speech-Language-Hearing Association (ASHA) emphasizes key relational practices: never finish a speaker&apos;s sentences or guess words for them, maintain warm and relaxed eye contact, keep your own speech rate measured, and focus entirely on the message being communicated rather than delivery fluency.
            </p>
          </div>

          <h3 className="itw-flow-h3">The Data: Indian Context</h3>
          <FactsGrid
            facts={[
              {
                num: "1.5% vs 0.46%",
                label: "community prevalence of stuttering in school-age cohorts: 1.5% in Bangalore (Srinath et al., ages 4–16 across cohorts) and 0.46% in Tamil Nadu (74,544 schoolchildren screened)",
                src: "Srinath et al. (2005) Bangalore Study; Tamil Nadu School Survey (2018)",
              },
              {
                num: "~10% Caseload",
                label: "proportion of pediatric clients presenting to specialized tertiary clinics who stutter — a clinical caseload denominator, not a general community prevalence figure",
                src: "All India Institute of Speech and Hearing (AIISH Mysore) Clinical Registry",
              },
              {
                num: "Multilingual",
                label: "In multilingual Indian environments, clinical guidelines emphasize distinguishing natural second-language formulation pauses from clinical speech disorders",
                src: "AIISH Clinical Guidelines & ASHA Multilingual Practice Recommendations",
              },
            ]}
            note="Community prevalence studies measure general child populations, whereas tertiary clinical statistics describe patients seeking specialized care. In multilingual Indian contexts, speech-language pathologists emphasize giving speakers unhurried time and distinguishing natural language formulation pauses from clinical speech disorders."
            onComplete={() => {}}
          />

          <h3 className="itw-flow-h3">Practical Ways to Support Speech Differences</h3>
          <ul className="itw-strat-list">
            <li>
              <b>Give 5–10 Seconds of Unhurried Silence:</b> Allow full pause time after asking a question before expecting a verbal answer.
            </li>
            <li>
              <b>Never Finish Their Sentences:</b> Let the student complete their own thought, preserving their communicative agency.
            </li>
            <li>
              <b>Welcome Multi-Modal Communication (AAC):</b> Validate pointing, typed messages, gestures, or visual communication cards equally.
            </li>
            <li>
              <b>Focus on the Message, Not the Mechanics:</b> Respond warmly to what the child said rather than how smoothly they said it.
            </li>
          </ul>

          <div className="itw-flow-nav itw-flow-nav-center" style={{ marginTop: 32, display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
            <a href="/consult" className="itw-cta itw-cta-dark" style={{ textDecoration: "none" }}>
              Book a Speech Consultation
            </a>
            <button type="button" className="itw-cta itw-cta-line" onClick={() => onNavigate("dyscalculia")}>
              Next Experience: Dyscalculia →
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

/* ================= DYSCALCULIA: Recipe Scaling & Concrete Representations ================= */

const DYSCALC_STEPS = [
  { key: "instructions", label: "Instructions" },
  { key: "run_abstract", label: "Run 1 (Abstract Math)" },
  { key: "reflect", label: "Reflect & Compare" },
  { key: "support", label: "Choose Supports" },
  { key: "run_concrete", label: "Run 2 (Visual CRA)" },
  { key: "explain", label: "Understanding & Action" },
];

const DYSCALC_STEP_INDEX = {
  instructions: 0,
  run_abstract: 1,
  reflect: 2,
  support: 3,
  run_concrete: 3,
  explain: 4,
  next: 4,
};

const DYSCALC_REFLECT_QS = [
  {
    q: "During the abstract scaling round, where did you notice the friction?",
    options: [
      "Keeping multiple numbers and ratios in active working memory felt taxing without visual aids.",
      "The numbers felt like arbitrary symbols on paper rather than concrete physical quantities.",
      "Visual measuring blocks made the doubling relationship immediately intuitive to grasp.",
      "Spatial and visual aids ground abstract arithmetic, making math accessible to all minds.",
    ],
  },
];

const DYSCALC_SUPPORT_CHOICES = [
  {
    id: "concrete_blocks",
    title: "CRA Concrete Visual Manipulatives",
    subtitle: "Visual measuring jars & ten-frame counters",
    desc: "Transforms abstract numbers into concrete, countable visual blocks so proportions can be verified spatially.",
    tag: "Multi-Sensory Math",
  },
  {
    id: "proportional_slider",
    title: "Interactive Proportional Scaling Bar",
    subtitle: "Real-time ratio visualization",
    desc: "Demonstrates that doubling servings (2 to 4) directly doubles every ingredient bar simultaneously.",
    tag: "Visual Scaffolding",
  },
  {
    id: "worked_example",
    title: "Step-by-Step Worked Example & Hint Cards",
    subtitle: "Explicit mathematical scaffolding",
    desc: "Breaks multi-step recipes into bite-sized, single-ingredient calculations with gentle guidance.",
    tag: "Cognitive Scaffolding",
  },
];

// Recipe 1 for Abstract Round: Mango Chia Pudding (Scale from 2 servings to 4 servings = 2x)
const RECIPE_1_ITEMS = [
  { id: "milk", name: "Almond Milk", original: 2, target: 4, unit: "cups", options: [3, 4, 6] },
  { id: "chia", name: "Chia Seeds", original: 4, target: 8, unit: "tablespoons", options: [6, 8, 12] },
  { id: "mango", name: "Diced Mango", original: 1, target: 2, unit: "cups", options: [2, 3, 4] },
  { id: "honey", name: "Cardamom Honey", original: 2, target: 4, unit: "teaspoons", options: [3, 4, 5] },
];

// Recipe 2 for Concrete Round: Fresh Mint Lemonade (Scale from 3 glasses to 6 glasses = 2x)
const RECIPE_2_ITEMS = [
  { id: "lemons", name: "Fresh Lemons", original: 2, target: 4, unit: "lemons", icon: "🍋" },
  { id: "mint", name: "Mint Leaves", original: 6, target: 12, unit: "leaves", icon: "🌿" },
  { id: "water", name: "Chilled Water", original: 3, target: 6, unit: "glasses", icon: "🥛" },
  { id: "sugar", name: "Raw Sugar", original: 2, target: 4, unit: "spoons", icon: "🥄" },
];

function DyscalculiaSim({ mode = "abstract", supportType = "concrete_blocks", onComplete, onAbort }) {
  const { soundOn } = useContext(SettingsContext);
  const [abstractAnswers, setAbstractAnswers] = useState({});
  const [concreteQuantities, setConcreteQuantities] = useState(() => {
    const init = {};
    RECIPE_2_ITEMS.forEach((item) => {
      init[item.id] = item.original;
    });
    return init;
  });
  const [elapsed, setElapsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [allCorrectNotice, setAllCorrectNotice] = useState(false);

  const startTimeRef = useRef(0);
  const timerRef = useRef(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    startTimeRef.current = performance.now();
    timerRef.current = setInterval(() => {
      setElapsed(parseFloat(((performance.now() - startTimeRef.current) / 1000).toFixed(1)));
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handlePickAbstract = (itemId, val) => {
    if (soundOn) audio.cue("tap");
    const next = { ...abstractAnswers, [itemId]: val };
    setAbstractAnswers(next);

    const isComplete = RECIPE_1_ITEMS.every((item) => next[item.id] !== undefined);
    if (isComplete) {
      if (soundOn) audio.cue("bell");
      setAllCorrectNotice(true);
      setTimeout(() => {
        onCompleteRef.current?.({
          time: elapsed,
          mode: "abstract",
          answers: next,
        });
      }, 700);
    }
  };

  const handleAdjustConcrete = (itemId, delta) => {
    if (soundOn) audio.cue("tap");
    setConcreteQuantities((prev) => {
      const cur = prev[itemId] || 0;
      const nextVal = Math.max(0, Math.min(20, cur + delta));
      const next = { ...prev, [itemId]: nextVal };

      const allTargetsMet = RECIPE_2_ITEMS.every((item) => next[item.id] === item.target);
      if (allTargetsMet) {
        if (soundOn) audio.cue("bell");
        setAllCorrectNotice(true);
        setTimeout(() => {
          onCompleteRef.current?.({
            time: elapsed,
            mode: "concrete",
            quantities: next,
          });
        }, 800);
      }
      return next;
    });
  };

  const isConcrete = mode === "concrete";

  return (
    <div className="itw-dyscalc-canvas" role="region" aria-label="Dyscalculia Recipe Scaling Experience">
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-dyscalculia)", letterSpacing: "0.08em" }}>
            {isConcrete ? "Run 2: Supported Concrete Manipulatives (CRA)" : "Run 1: Abstract Arithmetic Scaling"}
          </span>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--itw-text)", margin: "4px 0" }}>
            {isConcrete ? "Kitchen Lab: Scaling Mint Lemonade (3 → 6 Glasses)" : "Kitchen Lab: Scaling Mango Pudding (2 → 4 Servings)"}
          </h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--itw-muted)" }}>
            ⏱️ {elapsed.toFixed(1)}s
          </span>
          <button type="button" className="itw-pill-btn" onClick={onAbort}>Exit</button>
        </div>
      </div>

      {/* Task Objective Card */}
      <div
        style={{
          background: "var(--itw-panel-2)",
          border: "1.5px solid var(--itw-border)",
          borderRadius: 18,
          padding: "18px 22px",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-dyscalculia)" }}>
              Objective:
            </span>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--itw-text)", marginTop: 2 }}>
              {isConcrete
                ? "Double the recipe for 6 guests instead of 3. Use the + and - steppers to set the exact visual ingredients."
                : "The base recipe makes 2 servings. Two extra friends are visiting — scale each ingredient for 4 servings (multiply by 2)."}
            </div>
          </div>
          <button
            type="button"
            className="itw-pill-btn"
            style={{ fontSize: 12 }}
            onClick={() => setShowHint(!showHint)}
          >
            {showHint ? "Hide Worked Example" : "💡 Show Worked Example"}
          </button>
        </div>

        {showHint && (
          <div
            style={{
              marginTop: 14,
              padding: "12px 16px",
              background: "rgba(29, 133, 133, 0.08)",
              border: "1px solid var(--itw-dyscalculia)",
              borderRadius: 12,
              fontSize: 13.5,
              color: "var(--itw-text)",
              lineHeight: 1.5,
            }}
          >
            <b>Simple Worked Example:</b> If 2 servings need 2 cups of milk, then 4 servings (which is double) needs 2 × 2 = <b>4 cups</b> of milk. Every ingredient doubles!
          </div>
        )}
      </div>

      {/* Interactive Activity Body */}
      {!isConcrete ? (
        /* RUN 1: Abstract Round */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {RECIPE_1_ITEMS.map((item) => {
            const picked = abstractAnswers[item.id];
            return (
              <div
                key={item.id}
                style={{
                  background: "var(--itw-panel)",
                  border: picked !== undefined ? "1.5px solid var(--itw-dyscalculia)" : "1.5px solid var(--itw-border)",
                  borderRadius: 16,
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 800, fontSize: 16, color: "var(--itw-text)" }}>{item.name}</span>
                  <span style={{ fontSize: 12, color: "var(--itw-muted)", fontWeight: 600 }}>
                    Base: {item.original} {item.unit}
                  </span>
                </div>
                <div style={{ fontSize: 13.5, color: "var(--itw-muted)" }}>
                  Formula: {item.original} × 2 = ?
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                  {item.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`itw-adhd-keychip${picked === opt ? " itw-selected" : ""}`}
                      style={{ flex: 1, padding: "8px 0", textAlign: "center" }}
                      onClick={() => handlePickAbstract(item.id, opt)}
                    >
                      {opt} {item.unit}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* RUN 2: Concrete Visual CRA Round */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {RECIPE_2_ITEMS.map((item) => {
            const currentQty = concreteQuantities[item.id] || 0;
            const isMatch = currentQty === item.target;
            return (
              <div
                key={item.id}
                style={{
                  background: "var(--itw-panel)",
                  border: isMatch ? "2px solid #10b981" : "1.5px solid var(--itw-border)",
                  borderRadius: 18,
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  boxShadow: isMatch ? "0 4px 18px rgba(16, 185, 129, 0.12)" : "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 800, fontSize: 16, color: "var(--itw-text)" }}>
                    {item.name}
                  </span>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 99,
                      background: isMatch ? "rgba(16, 185, 129, 0.15)" : "var(--itw-panel-2)",
                      color: isMatch ? "#10b981" : "var(--itw-muted)",
                    }}
                  >
                    {isMatch ? "✓ Target Reached" : `Goal: ${item.target} ${item.unit}`}
                  </span>
                </div>

                {/* Concrete Visual Representation (Icons array) */}
                <div
                  style={{
                    background: "var(--itw-panel-2)",
                    borderRadius: 12,
                    padding: "14px",
                    minHeight: 64,
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {Array.from({ length: currentQty }).map((_, idx) => (
                    <span key={idx} style={{ fontSize: 24 }} title={`${item.name} unit ${idx + 1}`}>
                      {item.icon}
                    </span>
                  ))}
                  {currentQty === 0 && (
                    <span style={{ fontSize: 12, color: "var(--itw-muted)", fontStyle: "italic" }}>
                      Tap + to add {item.unit}...
                    </span>
                  )}
                </div>

                {/* Controls */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      type="button"
                      className="itw-pill-btn"
                      style={{ width: 34, height: 34, padding: 0, fontWeight: 900, fontSize: 18 }}
                      onClick={() => handleAdjustConcrete(item.id, -1)}
                      disabled={currentQty <= 0}
                      aria-label={`Decrease ${item.name}`}
                    >
                      −
                    </button>
                    <span style={{ fontSize: 16, fontWeight: 900, color: "var(--itw-text)", minWidth: 24, textAlign: "center" }}>
                      {currentQty}
                    </span>
                    <button
                      type="button"
                      className="itw-pill-btn"
                      style={{ width: 34, height: 34, padding: 0, fontWeight: 900, fontSize: 18 }}
                      onClick={() => handleAdjustConcrete(item.id, 1)}
                      aria-label={`Increase ${item.name}`}
                    >
                      +
                    </button>
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: isMatch ? "#10b981" : "var(--itw-muted)" }}>
                    {currentQty} / {item.target} {item.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {allCorrectNotice && (
        <div style={{ textAlign: "center", marginTop: 20, color: "#10b981", fontWeight: 800, fontSize: 15 }}>
          ✓ All ingredients correctly scaled! Proceeding...
        </div>
      )}

      {/* Educational Reflection Footer */}
      <div style={{ fontSize: 13, color: "var(--itw-muted)", textAlign: "center", marginTop: 22 }}>
        {!isConcrete
          ? "Notice how abstract numbers require active calculation in working memory — the core cognitive bottleneck in dyscalculia."
          : "Notice how concrete visual objects ground mathematical magnitude in spatial geometry, making ratios instantly clear."}
      </div>
    </div>
  );
}

function DyscalculiaModule({ onBack, onNavigate }) {
  const [step, setStep] = useState("intro"); // intro | instructions | run_abstract | reflect | support | run_concrete | explain
  const [chosenSupport, setChosenSupport] = useState("concrete_blocks");
  const [reflectionAnswers, setReflectionAnswers] = useState(() => Array(DYSCALC_REFLECT_QS.length).fill(null));
  const [results, setResults] = useState({ abstract: null, concrete: null });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const handleAbstractComplete = (res) => {
    setResults((prev) => ({ ...prev, abstract: res }));
    setStep("reflect");
  };

  const handleConcreteComplete = (res) => {
    setResults((prev) => ({ ...prev, concrete: res }));
    setStep("explain");
  };

  const stepIndex = DYSCALC_STEP_INDEX[step];
  const more = MODULES.filter((m) => m.key !== "dyscalculia");

  return (
    <section className="itw-view itw-module itw-flow" data-accent="dyscalculia">
      <FlowCrumbs name="Dyscalculia" onBack={onBack} />
      {stepIndex !== undefined && <FlowStepper steps={DYSCALC_STEPS} current={stepIndex} />}

      {step === "intro" && (
        <div className="itw-flow-page itw-flow-intro" key="intro">
          <div>
            <h2 className="itw-flow-title">Dyscalculia</h2>
            <div className="itw-flow-sub">Number Sense &amp; Mathematical Reasoning</div>
            <p className="itw-flow-lead">
              Dyscalculia is a learning difference that affects an individual&apos;s innate sense of numerical magnitude,
              proportions, and spatial mathematical relationships. It is not an inability to think logically or solve complex
              problems — it is an architectural variation in how the brain represents quantity.
            </p>
            <ul className="itw-flow-meta">
              <li><span aria-hidden="true">⏱️</span> Takes 2–3 minutes</li>
              <li><span aria-hidden="true">🍳</span> Interactive recipe scaling activity</li>
              <li><span aria-hidden="true">ℹ️</span> An educational exploration, not a clinical diagnostic tool</li>
            </ul>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("instructions")}>
              Start the Experience →
            </button>
          </div>
          <IntroVignette moduleKey="dyscalculia" />
        </div>
      )}

      {step === "instructions" && (
        <div className="itw-flow-page itw-flow-narrow" key="instructions">
          <div className="itw-scene-plate">
            <img src="/decor/itw/dyscalculia-environment.webp" alt="Kitchen table with measuring cups and recipe notes" className="itw-scene-plate-img" />
            <div className="itw-scene-plate-overlay">
              <span className="itw-scene-tag">📍 Setting • Weekend Cooking with Friends</span>
              <p className="itw-scene-caption">Measuring out recipe ingredients when the number of guests changes. In dyscalculia, mental ratios can feel abstract and elusive.</p>
            </div>
          </div>
          <h2 className="itw-flow-title itw-center">Before you begin Run 1</h2>
          <p className="itw-flow-lead itw-center">
            You will scale a recipe for unexpected guests. First using abstract numerical arithmetic, then using concrete visual manipulatives.
          </p>
          <ul className="itw-flow-list">
            <li><span aria-hidden="true">📊</span> In Run 1, you scale a 2-person recipe to 4 people using pure numbers.</li>
            <li><span aria-hidden="true">🧠</span> Notice the mental effort needed to calculate and remember ratios without visual anchors.</li>
            <li><span aria-hidden="true">🧱</span> In Run 2, you test Concrete-Representational-Abstract (CRA) visual measuring blocks.</li>
          </ul>
          <div className="itw-flow-nav">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("intro")}>Back</button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("run_abstract")}>
              Begin Run 1 →
            </button>
          </div>
        </div>
      )}

      {step === "run_abstract" && (
        <div className="itw-flow-page itw-flow-narrow" key="run_abstract">
          <DyscalculiaSim mode="abstract" onComplete={handleAbstractComplete} onAbort={() => setStep("instructions")} />
        </div>
      )}

      {step === "reflect" && (
        <div className="itw-flow-page itw-flow-narrow" key="reflect">
          <h2 className="itw-flow-title itw-center">What did you observe about abstract math?</h2>
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
            <div style={{ fontSize: 13, textTransform: "uppercase", color: "var(--itw-dyscalculia)", fontWeight: 700 }}>
              Run 1 Arithmetic Observation
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "var(--itw-text)", margin: "8px 0" }}>
              Completed in {results.abstract?.time.toFixed(1)}s
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--itw-muted)", lineHeight: 1.5 }}>
              Without physical anchors, calculating proportions requires juggling multiple numeric symbols in active working memory.
              For a learner with dyscalculia, numbers lack an intuitive spatial anchor — making mental math feel like an exhausting abstract cipher.
            </p>
          </div>

          <FlowQuestions
            questions={DYSCALC_REFLECT_QS}
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
          <h2 className="itw-flow-title itw-center">Choose Mathematical Accommodations</h2>
          <p className="itw-flow-lead itw-center">
            Select the instructional accommodation you want to explore in the supported recipe scaling:
          </p>
          <div className="itw-flow-cards" role="radiogroup" aria-label="Dyscalculia accommodation choices">
            {DYSCALC_SUPPORT_CHOICES.map((choice) => {
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
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("run_concrete")}>
              Apply &amp; Experience Run 2 →
            </button>
          </div>
        </div>
      )}

      {step === "run_concrete" && (
        <div className="itw-flow-page itw-flow-narrow" key="run_concrete">
          <DyscalculiaSim
            mode="concrete"
            supportType={chosenSupport}
            onComplete={handleConcreteComplete}
            onAbort={() => setStep("support")}
          />
        </div>
      )}

      {step === "explain" && (
        <div className="itw-flow-page itw-flow-narrow" key="explain">
          <div className="itw-scene-plate">
            <img src="/decor/itw/dyscalculia-environment.webp" alt="Kitchen table with visual measuring tools" className="itw-scene-plate-img" />
            <div className="itw-scene-plate-overlay">
              <span className="itw-scene-tag">📍 Insight • Concrete-Representational-Abstract (CRA)</span>
              <p className="itw-scene-caption">Grounding mathematical magnitude in tactile, visual objects bridges understanding effortlessly.</p>
            </div>
          </div>

          <h2 className="itw-flow-title itw-center">What We Learned About Dyscalculia</h2>
          <p className="itw-flow-lead itw-center">
            Dyscalculia is not a lack of logical or analytical ability; it is a difference in the brain&apos;s parietal
            regions (intraparietal sulcus) responsible for non-symbolic number magnitude.
          </p>

          <div
            style={{
              background: "rgba(29, 133, 133, 0.08)",
              border: "1px solid var(--itw-dyscalculia)",
              borderRadius: 18,
              padding: "20px 24px",
              margin: "24px 0",
            }}
          >
            <h4 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800, color: "var(--itw-dyscalculia)" }}>
              The Concrete-Representational-Abstract (CRA) Framework
            </h4>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "var(--itw-text)" }}>
              Special education mathematics prioritizes moving through three developmental phases: First <b>Concrete</b> (real measuring cups, beads, Base-10 blocks), second <b>Representational</b> (visual dot arrays, ten-frames, number lines), and only third <b>Abstract</b> (numbers and operational symbols). When children are supported through this progression, mathematical anxiety drops and authentic numerical fluency develops.
            </p>
          </div>

          <h3 className="itw-flow-h3">The Data: Indian Context</h3>
          <FactsGrid
            facts={[
              {
                num: "5%–8%",
                label: "estimated prevalence of dyscalculia in Indian primary school populations, representing 15–20 million learners who struggle with foundational number concepts",
                src: "Indian Journal of Pediatrics & AIISH Epidemiological Data",
              },
              {
                num: "Often Overlooked",
                label: "While dyslexia receives widespread public attention, dyscalculia is frequently misdiagnosed as carelessness or math anxiety, leaving students without appropriate accommodations",
                src: "Dyscalculia Association of India Clinical Registry",
              },
              {
                num: "Board Exemptions",
                label: "CBSE and state education boards in India now grant accommodations for students with dyscalculia, including calculator access, visual formula sheets, and alternative vocational math subjects",
                src: "CBSE Examination Bye-Laws & RPwD Act Guidelines",
              },
            ]}
            note="Clinical studies emphasize that dyscalculia is completely distinct from general IQ. Children with dyscalculia frequently show high visual-spatial, verbal, artistic, and coding aptitude."
            onComplete={() => {}}
          />

          <h3 className="itw-flow-h3">Evidence-Based Classroom Accommodations</h3>
          <ul className="itw-strat-list">
            <li>
              <b>Physical Manipulatives:</b> Always keep Base-10 blocks, Cuisenaire rods, and fraction circles accessible on desks.
            </li>
            <li>
              <b>Visual Number Lines &amp; Ten-Frames:</b> Tape horizontal number lines on desks to anchor addition, subtraction, and proportional steps spatially.
            </li>
            <li>
              <b>Calculator &amp; Fact Sheet Accommodations:</b> Allow calculators for multi-step problems so working memory can focus on logic rather than rote computation.
            </li>
            <li>
              <b>Grid &amp; Graph Paper:</b> Use lined or grid paper with large squares to prevent numbers from drifting across columns during long calculations.
            </li>
          </ul>

          <div className="itw-flow-nav itw-flow-nav-center" style={{ marginTop: 32, display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
            <a href="/consult" className="itw-cta itw-cta-dark" style={{ textDecoration: "none" }}>
              Book an Assessment Consultation
            </a>
            <button type="button" className="itw-cta itw-cta-line" onClick={() => onNavigate("dysgraphia")}>
              Next Experience: Dysgraphia →
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
                num: "Acoustic Noise",
                label: "Indian classrooms often average ambient noise levels of 65–75 dBA (ceiling fans, street traffic, high ceilings), exceeding the recommended 35 dBA acoustic standard",
                src: "Journal of the All India Institute of Speech and Hearing",
              },
              {
                num: "Multi-Modal Law",
                label: "RPwD Act 2016 and inclusive school guidelines mandate providing written instruction boards alongside verbal announcements for all students with sensory processing needs",
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

/* ================= EXECUTIVE FUNCTIONING: Task Sequencing & Working Memory ================= */

const EXEC_STEPS = [
  { key: "instructions", label: "Instructions" },
  { key: "run_single", label: "Run 1 (Single Task)" },
  { key: "run_pile", label: "Run 2 (Competing Pile)" },
  { key: "reflect", label: "Reflect & Compare" },
  { key: "support", label: "Choose Supports" },
  { key: "run_supported", label: "Run 3 (Supported)" },
  { key: "explain", label: "Understanding & Action" },
];

const EXEC_STEP_INDEX = {
  instructions: 0,
  run_single: 1,
  run_pile: 2,
  reflect: 3,
  support: 4,
  run_supported: 4,
  explain: 5,
  next: 5,
};

const EXEC_REFLECT_QS = [
  {
    q: "During the competing morning task pile, where did you notice the executive friction?",
    options: [
      "All tasks competed for attention simultaneously, making it hard to decide which one to initiate first.",
      "Keeping track of what was done versus what was remaining felt mentally taxing without visual structure.",
      "Having multiple open priorities created hesitation and split my working memory.",
      "When tasks were arranged in a clear Now / Next / Later board, initiation became immediate and effortless.",
    ],
  },
];

const EXEC_SUPPORT_CHOICES = [
  {
    id: "nnl",
    title: "Now / Next / Later 3-Column Board",
    subtitle: "Separates immediate action from upcoming steps",
    desc: "Structures tasks into 3 distinct visual columns: only one active task under NOW, upcoming items under NEXT, and future items under LATER.",
    tag: "Visual Organization",
  },
  {
    id: "one_step",
    title: "One-Next-Step Decomposition",
    subtitle: "Surfaces only the single immediate action",
    desc: "Completely hides the overwhelming multi-task backlog, presenting only the single immediate next action in a high-focus card.",
    tag: "Cognitive Scaffolding",
  },
  {
    id: "visual_checklist",
    title: "Visual Routine Checklist with Icons",
    subtitle: "Step-by-step sequential checkboxes",
    desc: "Provides clear pictorial routine cards with visual milestone checks to eliminate working memory strain.",
    tag: "Visual Scaffolding",
  },
];

const MORNING_TASKS = [
  { id: "uniform", title: "Put on School Uniform & Shoes", icon: "👟", timeEst: "2 min" },
  { id: "slip", title: "Sign Science Field Trip Permission Slip", icon: "📝", timeEst: "1 min" },
  { id: "math", title: "Complete Last 2 Math Practice Questions", icon: "📐", timeEst: "3 min" },
  { id: "pack", title: "Pack Backpack with Books & Stationery", icon: "🎒", timeEst: "2 min" },
  { id: "breakfast", title: "Eat Warm Morning Breakfast", icon: "🥣", timeEst: "5 min" },
];

function ExecutiveFunctioningSim({ mode = "single", supportType = "nnl", onComplete, onAbort }) {
  const { soundOn } = useContext(SettingsContext);
  const [completedIds, setCompletedIds] = useState([]);
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);

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

  const handleTaskClick = (taskId) => {
    if (completedIds.includes(taskId)) return;
    if (soundOn) audio.cue("tap");
    const next = [...completedIds, taskId];
    setCompletedIds(next);

    const targetTotal = mode === "single" ? 1 : MORNING_TASKS.length;
    if (next.length >= targetTotal) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (soundOn) audio.cue("slam");
      setTimeout(() => {
        onCompleteRef.current?.({
          time: elapsed,
          tasksCount: next.length,
          mode,
        });
      }, 400);
    }
  };

  const handleSupportedStepComplete = () => {
    if (soundOn) audio.cue("tap");
    const currentTask = MORNING_TASKS[activeStepIdx];
    const nextCompleted = [...completedIds, currentTask.id];
    setCompletedIds(nextCompleted);

    if (activeStepIdx + 1 >= MORNING_TASKS.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (soundOn) audio.cue("slam");
      setTimeout(() => {
        onCompleteRef.current?.({
          time: elapsed,
          tasksCount: nextCompleted.length,
          mode: "supported",
        });
      }, 400);
    } else {
      setActiveStepIdx((prev) => prev + 1);
    }
  };

  return (
    <div className="itw-exec-canvas" role="region" aria-label="Task Sequencing Exploration">
      {/* Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-executive)", letterSpacing: "0.08em" }}>
            {mode === "single" && "Run 1 • Single Defined Action (Zero Competing Load)"}
            {mode === "pile" && "Run 2 • Competing Morning Task Pile (Unscaffolded)"}
            {mode === "supported" && `Run 3 • Supported by ${supportType === "nnl" ? "Now / Next / Later Board" : "Focused Decomposition"}`}
          </span>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--itw-text)", margin: "4px 0" }}>
            School Morning Routine (Departure: 8:00 AM)
          </h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 15, fontFamily: "var(--font-mono, monospace)", fontWeight: 700, color: "var(--itw-muted)", display: "flex", alignItems: "center", gap: 6 }}>
            ⏱️ {elapsed.toFixed(1)}s
          </span>
          <button type="button" className="itw-pill-btn" onClick={onAbort}>Exit</button>
        </div>
      </div>

      {/* Mode 1: Single Step Action */}
      {mode === "single" && (
        <div style={{ padding: 24, borderRadius: 16, border: "1.5px solid var(--itw-border)", background: "var(--itw-panel)", textAlign: "center", maxWidth: 520, margin: "20px auto" }}>
          <div style={{ fontSize: 42, marginBottom: 10 }}>👟</div>
          <h4 style={{ fontSize: 18, fontWeight: 800, color: "var(--itw-text)", margin: "0 0 6px" }}>
            Step 1: Put on School Uniform &amp; Shoes
          </h4>
          <p style={{ fontSize: 14, color: "var(--itw-muted)", margin: "0 0 20px" }}>
            A single, isolated morning task. There are no competing priorities, no multitasking demands.
          </p>
          <button
            type="button"
            className="itw-cta itw-cta-dark"
            style={{ fontSize: 16, padding: "12px 28px" }}
            onClick={() => handleTaskClick(MORNING_TASKS[0].id)}
          >
            ✓ Complete Action
          </button>
        </div>
      )}

      {/* Mode 2: Competing Unorganized Pile */}
      {mode === "pile" && (
        <div>
          <div style={{ fontSize: 14, color: "var(--itw-muted)", marginBottom: 14, textAlign: "center" }}>
            All 5 tasks demand attention at the same time. Click each task to complete your morning routine:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, maxWidth: 760, margin: "0 auto" }}>
            {MORNING_TASKS.map((task) => {
              const isDone = completedIds.includes(task.id);
              return (
                <button
                  key={task.id}
                  type="button"
                  className={`itw-task-card${isDone ? " itw-task-done" : ""}`}
                  style={{
                    padding: 16,
                    borderRadius: 14,
                    border: isDone ? "1.5px solid #05b076" : "1.5px solid var(--itw-border)",
                    background: isDone ? "rgba(5, 176, 118, 0.08)" : "var(--itw-panel)",
                    textAlign: "left",
                    cursor: isDone ? "default" : "pointer",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => handleTaskClick(task.id)}
                >
                  <span style={{ fontSize: 24, lineHeight: 1 }}>{task.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: isDone ? "#05b076" : "var(--itw-text)", textDecoration: isDone ? "line-through" : "none" }}>
                      {task.title}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--itw-muted)", textTransform: "uppercase" }}>
                      {isDone ? "Completed ✓" : `Est: ${task.timeEst}`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 12, color: "var(--itw-muted)", marginTop: 14, textAlign: "center" }}>
            Completed: {completedIds.length} of {MORNING_TASKS.length} • Notice the hesitation before choosing which item to click first.
          </div>
        </div>
      )}

      {/* Mode 3: Supported Now / Next / Later Board */}
      {mode === "supported" && (
        <div>
          {supportType === "nnl" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 14, maxWidth: 860, margin: "0 auto" }}>
              {/* Column 1: NOW (High Focus, 1 Task Only) */}
              <div style={{ padding: 18, borderRadius: 16, background: "rgba(244, 117, 34, 0.06)", border: "2px solid var(--color-primary)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--color-primary)", display: "inline-block" }} />
                  <span style={{ fontSize: 13, fontWeight: 900, textTransform: "uppercase", color: "var(--color-primary)", letterSpacing: "0.06em" }}>
                    NOW • Active Focus (1 Item Only)
                  </span>
                </div>
                {activeStepIdx < MORNING_TASKS.length ? (
                  <div style={{ padding: 16, borderRadius: 12, background: "var(--itw-panel)", border: "1.5px solid var(--itw-border)", boxShadow: "0 4px 14px rgba(0,0,0,0.06)" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>{MORNING_TASKS[activeStepIdx].icon}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--itw-text)", marginBottom: 4 }}>
                      {MORNING_TASKS[activeStepIdx].title}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--itw-muted)", marginBottom: 16 }}>
                      Estimated duration: {MORNING_TASKS[activeStepIdx].timeEst}
                    </div>
                    <button
                      type="button"
                      className="itw-cta itw-cta-dark"
                      style={{ width: "100%", padding: "10px 0", fontSize: 14 }}
                      onClick={handleSupportedStepComplete}
                    >
                      ✓ Mark Done &amp; Advance
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: 20, color: "#05b076", fontWeight: 800 }}>
                    🎉 All morning tasks completed!
                  </div>
                )}
              </div>

              {/* Column 2: NEXT */}
              <div style={{ padding: 18, borderRadius: 16, background: "var(--itw-panel)", border: "1.5px solid var(--itw-border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--itw-muted)", opacity: 0.5, display: "inline-block" }} />
                  <span style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-muted)", letterSpacing: "0.06em" }}>
                    NEXT • Unlocks Next
                  </span>
                </div>
                {activeStepIdx + 1 < MORNING_TASKS.length ? (
                  <div style={{ padding: 14, borderRadius: 10, background: "rgba(0,0,0,0.02)", border: "1px dashed var(--itw-border)" }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{MORNING_TASKS[activeStepIdx + 1].icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--itw-text)" }}>
                      {MORNING_TASKS[activeStepIdx + 1].title}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "var(--itw-muted)", fontStyle: "italic", padding: 10 }}>
                    No more tasks pending.
                  </div>
                )}
              </div>

              {/* Column 3: LATER */}
              <div style={{ padding: 18, borderRadius: 16, background: "var(--itw-panel)", border: "1.5px solid var(--itw-border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--itw-muted)", opacity: 0.3, display: "inline-block" }} />
                  <span style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-muted)", letterSpacing: "0.06em" }}>
                    LATER
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {MORNING_TASKS.slice(activeStepIdx + 2).map((task) => (
                    <div key={task.id} style={{ padding: 10, borderRadius: 8, background: "rgba(0,0,0,0.02)", fontSize: 12, color: "var(--itw-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                      <span>{task.icon}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</span>
                    </div>
                  ))}
                  {MORNING_TASKS.slice(activeStepIdx + 2).length === 0 && (
                    <div style={{ fontSize: 12, color: "var(--itw-muted)", fontStyle: "italic" }}>
                      Queue clear.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 540, margin: "0 auto", padding: 24, borderRadius: 16, background: "var(--itw-panel)", border: "1.5px solid var(--itw-border)", textAlign: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--itw-executive)", textTransform: "uppercase" }}>
                Step {activeStepIdx + 1} of {MORNING_TASKS.length}
              </span>
              <div style={{ fontSize: 44, margin: "14px 0" }}>{MORNING_TASKS[activeStepIdx]?.icon}</div>
              <h4 style={{ fontSize: 20, fontWeight: 800, color: "var(--itw-text)", margin: "0 0 8px" }}>
                {MORNING_TASKS[activeStepIdx]?.title}
              </h4>
              <p style={{ fontSize: 14, color: "var(--itw-muted)", margin: "0 0 20px" }}>
                All other steps are hidden from view. Focus solely on this single micro-step.
              </p>
              <button
                type="button"
                className="itw-cta itw-cta-dark"
                style={{ fontSize: 16, padding: "12px 30px" }}
                onClick={handleSupportedStepComplete}
              >
                ✓ Complete &amp; Reveal Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExecutiveFunctioningModule({ onBack, onNavigate }) {
  const [step, setStep] = useState("intro"); // intro | instructions | run_single | run_pile | reflect | support | run_supported | explain
  const [chosenSupport, setChosenSupport] = useState("nnl");
  const [reflectionAnswers, setReflectionAnswers] = useState(() => Array(EXEC_REFLECT_QS.length).fill(null));
  const [results, setResults] = useState({ single: null, pile: null, supported: null });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const handleSingleComplete = (res) => {
    setResults((prev) => ({ ...prev, single: res }));
    setStep("run_pile");
  };

  const handlePileComplete = (res) => {
    setResults((prev) => ({ ...prev, pile: res }));
    setStep("reflect");
  };

  const handleSupportedComplete = (res) => {
    setResults((prev) => ({ ...prev, supported: res }));
    setStep("explain");
  };

  const stepIndex = EXEC_STEP_INDEX[step];
  const more = MODULES.filter((m) => m.key !== "executive");

  return (
    <section className="itw-view itw-module itw-flow" data-accent="executive">
      <FlowCrumbs name="Executive Functioning Differences" onBack={onBack} />
      {stepIndex !== undefined && <FlowStepper steps={EXEC_STEPS} current={stepIndex} />}

      {step === "intro" && (
        <div className="itw-flow-page itw-flow-intro" key="intro">
          <div>
            <h2 className="itw-flow-title">Executive Functioning Differences</h2>
            <div className="itw-flow-sub">Task Initiation, Sequencing &amp; Working Memory</div>
            <p className="itw-flow-lead">
              Executive function is the brain&apos;s management system — responsible for prioritizing tasks, estimating time,
              and holding sequential steps in working memory. When faced with multiple competing demands at once,
              a child with executive differences may experience decision fatigue and initiation delay, even when they want to begin.
            </p>
            <ul className="itw-flow-meta">
              <li><span aria-hidden="true">⏱️</span> Takes 2–3 minutes</li>
              <li><span aria-hidden="true">📋</span> Explores initiation and sequencing load, not clinical deficits</li>
              <li><span aria-hidden="true">🗂️</span> Compares unorganized task piles with Now / Next / Later visual scaffolding</li>
            </ul>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("instructions")}>
              Start the Experience →
            </button>
          </div>
          <IntroVignette moduleKey="executive" />
        </div>
      )}

      {step === "instructions" && (
        <div className="itw-flow-page itw-flow-narrow" key="instructions">
          <div className="itw-scene-plate">
            <img src="/decor/itw/executive-desk-scene.webp" alt="Morning student bedroom with school bag and homework desk" className="itw-scene-plate-img" />
            <div className="itw-scene-plate-overlay">
              <span className="itw-scene-tag">📍 Setting • 7:30 AM Morning Routine</span>
              <p className="itw-scene-caption">The school bus arrives in 30 minutes. Uniform, homework questions, permission slip, and breakfast all demand attention before heading out.</p>
            </div>
          </div>
          <h2 className="itw-flow-title itw-center">Before you begin Run 1</h2>
          <p className="itw-flow-lead itw-center">
            You will test your task initiation across structured versus competing morning demands.
          </p>
          <ul className="itw-flow-list">
            <li><span aria-hidden="true">👟</span> In Run 1, you complete a single isolated task to test baseline initiation.</li>
            <li><span aria-hidden="true">📋</span> In Run 2, you manage 5 competing tasks presented in an unorganized pile.</li>
            <li><span aria-hidden="true">🗂️</span> In Run 3, test how Now / Next / Later visual boards provide immediate clarity.</li>
          </ul>
          <div className="itw-flow-nav itw-flow-nav-center">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("intro")}>Back</button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("run_single")}>
              Start Run 1 (Single Step) →
            </button>
          </div>
        </div>
      )}

      {step === "run_single" && (
        <div className="itw-flow-page" key="run_single">
          <ExecutiveFunctioningSim
            mode="single"
            onComplete={handleSingleComplete}
            onAbort={() => setStep("instructions")}
          />
        </div>
      )}

      {step === "run_pile" && (
        <div className="itw-flow-page" key="run_pile">
          <ExecutiveFunctioningSim
            mode="pile"
            onComplete={handlePileComplete}
            onAbort={() => setStep("run_single")}
          />
        </div>
      )}

      {step === "reflect" && (
        <div className="itw-flow-page itw-flow-narrow" key="reflect">
          <h2 className="itw-flow-title itw-center">What did you observe about task initiation?</h2>
          <p className="itw-flow-lead itw-center">
            Single task took <b>~{results.single?.time || 1.4}s</b>, while navigating the unsorted pile required <b>~{results.pile?.time || 14}s</b> of decision coordination.
          </p>
          <FlowQuestions
            questions={EXEC_REFLECT_QS}
            answers={reflectionAnswers}
            onPick={(qi, oi) => {
              const next = [...reflectionAnswers];
              next[qi] = oi;
              setReflectionAnswers(next);
            }}
          />
          <div className="itw-flow-nav itw-flow-nav-center">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("run_pile")}>Replay Run 2</button>
            <button
              type="button"
              className="itw-cta itw-cta-dark"
              disabled={reflectionAnswers[0] === null}
              onClick={() => setStep("support")}
            >
              Explore Executive Scaffolding →
            </button>
          </div>
        </div>
      )}

      {step === "support" && (
        <div className="itw-flow-page itw-flow-narrow" key="support">
          <h2 className="itw-flow-title itw-center">Choose an Executive Function Support</h2>
          <p className="itw-flow-lead itw-center">
            Visual organization tools externalize working memory, allowing students to focus on one concrete step at a time.
          </p>
          <div className="itw-support-cards">
            {EXEC_SUPPORT_CHOICES.map((s) => (
              <label
                key={s.id}
                className={`itw-support-card${chosenSupport === s.id ? " itw-support-selected" : ""}`}
                style={{ cursor: "pointer", display: "block" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "var(--itw-text)" }}>{s.title}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "var(--itw-executive)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {s.tag}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: "var(--itw-muted)", lineHeight: 1.5 }}>{s.desc}</div>
                <input
                  type="radio"
                  name="exec-support"
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
              Run Supported Routine →
            </button>
          </div>
        </div>
      )}

      {step === "run_supported" && (
        <div className="itw-flow-page" key="run_supported">
          <ExecutiveFunctioningSim
            mode="supported"
            supportType={chosenSupport}
            onComplete={handleSupportedComplete}
            onAbort={() => setStep("support")}
          />
        </div>
      )}

      {step === "explain" && (
        <div className="itw-flow-page itw-flow-narrow" key="explain">
          <h2 className="itw-flow-title itw-center">Understanding Executive Functioning &amp; Initiation</h2>
          <div className="itw-flow-sub itw-center">The Prefrontal Cortex Management System</div>

          <div className="itw-comparison-card" style={{ padding: 22, borderRadius: 16, border: "1.5px solid var(--itw-border)", background: "var(--itw-panel)", margin: "24px 0" }}>
            <h4 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 800, color: "var(--itw-text)" }}>
              ⏱️ Your Morning Routine Comparison:
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ padding: 14, borderRadius: 12, background: "rgba(0,0,0,0.03)" }}>
                <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-muted)" }}>Run 2 • Competing Unorganized Pile</span>
                <div style={{ fontSize: 24, fontWeight: 800, color: "var(--itw-text)", marginTop: 4 }}>
                  ~{results.pile?.time || 15}s
                </div>
                <div style={{ fontSize: 12, color: "var(--itw-muted)", marginTop: 4 }}>
                  Decision fatigue • Working memory overload • Unclear sequence
                </div>
              </div>
              <div style={{ padding: 14, borderRadius: 12, background: "rgba(244, 117, 34, 0.08)", border: "1px solid rgba(244, 117, 34, 0.25)" }}>
                <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--color-primary)" }}>Run 3 • Now / Next / Later Support</span>
                <div style={{ fontSize: 24, fontWeight: 800, color: "var(--color-primary)", marginTop: 4 }}>
                  ~{results.supported?.time || 4.2}s
                </div>
                <div style={{ fontSize: 12, color: "var(--itw-muted)", marginTop: 4 }}>
                  Immediate initiation • Single active focus • Zero mental juggling
                </div>
              </div>
            </div>
          </div>

          <p className="itw-flow-lead">
            Executive functioning encompasses the brain&apos;s ability to filter distractions, prioritize actions, and sequence complex routines.
            When a child hesitates, procrastinates, or seems disorganized, they are usually struggling with an executive initiation hurdle —
            not a lack of effort or motivation.
          </p>

          <h3 className="itw-flow-h3">Practical Supports for Home &amp; School:</h3>
          <ul className="itw-flow-list">
            <li>
              <b>Now / Next / Later Boards:</b> Reduces anxiety by hiding future tasks until the current action is completed.
            </li>
            <li>
              <b>Visual Analog Timers:</b> Shows time as a concrete, disappearing colored wedge, helping learners understand how much time has passed.
            </li>
            <li>
              <b>Task Chunking &amp; Checklists:</b> Break big projects into micro-deliverables (e.g., &ldquo;Write just 2 sentences&rdquo; instead of &ldquo;Write your essay&rdquo;).
            </li>
            <li>
              <b>Compassionate Language:</b> Replace &ldquo;Why haven&apos;t you started?&rdquo; with &ldquo;What is the very first step we can do together?&rdquo;
            </li>
          </ul>

          <div className="itw-flow-nav itw-flow-nav-center" style={{ marginTop: 32, display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
            <a href="/consult" className="itw-cta itw-cta-dark" style={{ textDecoration: "none" }}>
              Book an Executive Coaching Consultation
            </a>
            <button type="button" className="itw-cta itw-cta-line" onClick={() => onNavigate("down-syndrome")}>
              Next: Stories &amp; Perspectives (Aarav&apos;s Day) →
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
            Try Interactive Simulations →
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
