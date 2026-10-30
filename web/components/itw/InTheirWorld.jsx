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
  landing: "44,140,114",
  autism: "44,140,114",
  adhd: "140,101,32",
  dyslexia: "89,40,140",
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
  dyslexia: "170,126,221",
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
    this.samples = new Map(); // kind -> decoded AudioBuffer, once loaded
    this.sampleMissing = new Set(); // kinds we've confirmed have no file
    this.samplePending = new Set(); // kinds currently being fetched
  }

  setEnabled(val) {
    this.enabled = Boolean(val);
    if (!this.enabled) {
      this.stopAll();
    }
  }

  ensure() {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.12; // Master safety volume ceiling
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  stopAll() {
    for (const id of Array.from(this.drones.keys())) {
      this.stopDrone(id);
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
    const target = Math.max(0.0001, Math.min(0.12, val));
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(target, now + Math.max(0.15, rampSec));
  }

  // Fetches the real clip for this kind from the Hugging Face dataset
  // (see SOUND_FILE_EXT below for the exact filename/extension of each).
  // Fire-and-forget: the first time a kind is cued with no file yet
  // loaded, this kicks off a fetch in the background and the synthesized
  // fallback plays for *that* cue; once the fetch resolves (or fails),
  // later cues of the same kind either play the real clip or stop trying.
  loadSample(kind) {
    if (this.samples.has(kind) || this.sampleMissing.has(kind) || this.samplePending.has(kind)) return;
    const ctx = this.ensure();
    if (!ctx) return;
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
      .then((buf) => ctx.decodeAudioData(buf))
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
    const ctx = this.ctx;
    const buffer = this.samples.get(kind);
    if (!ctx || !buffer) return false;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    const target = Math.max(0.05, Math.min(1.0, gain)) * 0.7;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.linearRampToValueAtTime(target, ctx.currentTime + 0.16);
    src.connect(g);
    g.connect(this.master);
    src.start();
    return true;
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

function speakText(text, { rate = 1, pitch = 1, volume = 0.85 } = {}) {
  if (typeof window === "undefined" || !window.speechSynthesis || !text) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.pitch = pitch;
    u.volume = volume;
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
    icon: "🌱",
    name: "Down Syndrome & Developmental Pacing",
    sub: "Growing at My Own Pace",
    blurb: "An interactive first-person story of Aarav: celebrating strengths, visual learning, and everyday milestones.",
    image: "/decor/itw/down-syndrome-story.webp",
    meta: "Interactive Story Experience",
    badge: "Illustrated Story",
  },
  {
    key: "dayineyes",
    icon: "🎒",
    name: "A Day Through My Eyes",
    sub: "The Inclusive School Day Walkthrough",
    blurb: "Step into an everyday school day and switch between Sensory, Attention, Communication, and Supported Classroom lenses.",
    image: "/decor/itw/day-through-my-eyes.webp",
    meta: "Multi-Perspective Exhibit",
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
            <div className="itw-tag" style={{ background: "rgba(44, 140, 114, 0.12)", color: "var(--itw-autism)" }}>
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
        className={`itw-toggle-btn${darkMode ? " itw-active" : ""}`}
        aria-pressed={darkMode}
        onClick={() => setDarkMode((v) => !v)}
      >
        {darkMode ? "☀️ Light mode" : "🌙 Dark mode"}
      </button>
      <button
        type="button"
        className={`itw-toggle-btn${soundOn ? " itw-active" : ""}`}
        aria-pressed={soundOn}
        onClick={() => setSoundOn((v) => !v)}
      >
        {soundOn ? "🔊 Sound on" : "🔇 Sound off"}
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
        🖨️ Print these strategies
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

  // Read each fact aloud as it comes up on the belt, if sound is on and
  // the section has actually scrolled into view.
  useEffect(() => {
    if (!soundOn || !inView) return;
    const f = facts[idx];
    if (!f) return;
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    speakText(`${f.num}. ${f.label}`, { rate: 1.02, volume: 0.55 });
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, soundOn, factsKey, inView]);

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
  return (
    <>
      <FactsConveyor facts={facts} onComplete={onComplete} />
      {note && <p className="itw-fact-note">{note}</p>}
    </>
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
              <li><span aria-hidden="true">⏱️</span> Takes 2–3 minutes</li>
              <li><span aria-hidden="true">🎧</span> Sound is off by default; you have full control</li>
              <li><span aria-hidden="true">ℹ️</span> An empathy learning experience, not a diagnostic tool</li>
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
      setNotifications([]);
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

  const handleToggleKeyword = (kw) => {
    if (soundOn) audio.cue("tap");
    if (!currentTask.targets.includes(kw)) {
      if (soundOn) audio.cue("flicker");
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
      const finalTime = parseFloat(((performance.now() - startTimeRef.current) / 1000).toFixed(1));
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
    { id: "t1", title: "💭 Wait, do otters hold hands when they sleep?", text: "Yes! Sea otters hold hands while floating to avoid drifting apart in currents. Cute, but back to biology!", top: "18%", left: "6%" },
    { id: "t2", title: "💭 Did I turn off the kitchen stove?", text: "Checked in your mind: yes, the kettle was turned off after making chai.", top: "70%", left: "12%" },
    { id: "t3", title: "💭 What was that song from the car earlier?", text: "It was that nostalgic acoustic tune. Your brain spent 20 seconds trying to remember the chorus melody.", top: "25%", right: "8%" },
  ];

  return (
    <div className="itw-desk-sim" role="region" aria-label="ADHD Attention Regulation Simulation">
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
      {mode === "interrupted" && notifications.length > 0 && (
        <div className="itw-toast-container" aria-live="polite" style={{ zIndex: 10 }}>
          {notifications.map((n) => (
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
            <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: "rgba(140,101,32,0.15)", color: "var(--itw-adhd)" }}>
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
              return (
                <button
                  key={kw}
                  type="button"
                  className={`itw-adhd-keychip${isSelected ? " itw-selected" : ""}`}
                  onClick={() => handleToggleKeyword(kw)}
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
              <li><span aria-hidden="true">⏱️</span> Takes 2–3 minutes</li>
              <li><span aria-hidden="true">🖥️</span> First-person desk workspace simulation</li>
              <li><span aria-hidden="true">🛡️</span> Not a diagnostic test</li>
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
            <li><span aria-hidden="true">1️⃣</span> Read the brief, check notes in adjacent tabs, and extract 2 key data points.</li>
            <li><span aria-hidden="true">2️⃣</span> Select an evidence-based conservation policy and submit the assignment.</li>
            <li><span aria-hidden="true">🌿</span> In this first run, your digital environment is completely quiet and uninterrupted.</li>
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
                    background: intensity === opt.id ? "rgba(140, 101, 32, 0.12)" : "var(--itw-panel-2)",
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
            <li><span aria-hidden="true">🔔</span> Notification toasts and group chat pings will appear around your workspace.</li>
            <li><span aria-hidden="true">💭</span> Associative wandering thoughts may tempt you to branch into side tabs.</li>
            <li><span aria-hidden="true">🧠</span> Notice how much cognitive effort is spent re-orienting back to where you left off.</li>
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
                  background: chosenSupport === s.id ? "rgba(140, 101, 32, 0.08)" : "var(--itw-panel)",
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
  return (
    <ol className="itw-stepper" aria-label="Progress">
      {steps.map((s, i) => (
        <li
          key={s.key}
          className={`itw-step${i === current ? " itw-step-on" : ""}${i < current ? " itw-step-done" : ""}`}
          aria-current={i === current ? "step" : undefined}
        >
          <span className="itw-step-dot">{i + 1}</span>
          <span className="itw-step-label">{s.label}</span>
        </li>
      ))}
    </ol>
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
  const [readingMode, setReadingMode] = useState("decoding"); // standard | decoding | supported
  const [letterConfusion, setLetterConfusion] = useState(true);
  const [visualCrowding, setVisualCrowding] = useState(true);
  const [syllableChunks, setSyllableChunks] = useState(false);
  const activePair = DYSLEXIA_PASSAGE_PAIRS[pairIndex % DYSLEXIA_PASSAGE_PAIRS.length];

  const [step, setStep] = useState("intro"); // intro | instructions | read | questions | result | support | run_supported | questions_supported | explain | next
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
    advanceActiveDyslexiaPairIndex(); // Cycle for next visit
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

  // Calculate typography styles
  const fontSizes = { normal: "1.15rem", large: "1.32rem", xlarge: "1.55rem" };
  const lineHeights = { normal: 1.65, relaxed: 2.15, spacious: 2.6 };
  const letterSpacings = { normal: "normal", wide: "0.06em", xwide: "0.12em" };

  const currentTypoStyle = {
    fontSize: fontSizes[fontSize] || fontSizes.large,
    lineHeight: lineHeights[lineSpacing] || lineHeights.relaxed,
    letterSpacing: letterSpacings[letterSpacing] || letterSpacings.wide,
  };

  const allRun1Answered = answersRun1.every((a) => a !== null);
  const allRun2Answered = answersRun2.every((a) => a !== null);
  const stepIndex = DYS_STEP_INDEX[step];
  const more = MODULES.filter((m) => m.key !== "dyslexia");


  // High-fidelity dyslexia simulation: letter crowding, mirror rotation on b/d/p/q/n/u, and phonological decoding friction
  const renderInteractiveText = (text, mode) => {
    if (mode === "decoding") {
      const words = text.split(" ");
      return (
        <span className={`itw-reading-passage itw-dyslexia-decoding${visualCrowding ? " itw-crowded" : ""}`}>
          {words.map((word, wIdx) => {
            return (
              <span key={wIdx} className="itw-decoding-word" style={{ marginRight: visualCrowding ? "0.14em" : "0.32em" }}>
                {Array.from(word).map((char, cIdx) => {
                  const lower = char.toLowerCase();
                  const isMirror = ["b", "d", "p", "q", "n", "u"].includes(lower);
                  // Dynamic subtle flip on mirror letters for visceral decoding friction
                  const flippedMap = { b: "d", d: "b", p: "q", q: "p", n: "u", u: "n" };
                  const showFlipped = letterConfusion && isMirror && ((wIdx + cIdx) % 3 === 0);
                  const displayChar = showFlipped ? (char === lower ? flippedMap[lower] : flippedMap[lower].toUpperCase()) : char;

                  return (
                    <span
                      key={cIdx}
                      className={`itw-decoding-char${isMirror ? " itw-mirror-char" : ""}${showFlipped ? " itw-flipped" : ""}`}
                      data-orig={char}
                    >
                      {syllableChunks && "aeiouy".includes(lower) ? `${displayChar}·` : displayChar}
                    </span>
                  );
                })}
              </span>
            );
          })}
        </span>
      );
    }
    return <span>{text}</span>;
  };

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
              <li><span aria-hidden="true">ℹ️</span> An interactive learning simulation, not a clinical diagnostic tool</li>
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
            In the next screen, you will read a short passage at your own pace, followed by three comprehension questions.
          </p>
          <div
            style={{
              background: "rgba(240, 163, 33, 0.08)",
              border: "1.5px solid var(--itw-dyslexia)",
              borderRadius: 16,
              padding: "16px 20px",
              margin: "20px 0",
              fontSize: 14.5,
              lineHeight: 1.6,
              color: "var(--itw-text)",
            }}
          >
            <b>International Dyslexia Association Guidance:</b> Dyslexia is a language-based neurobiological difference in phonological processing — the brain's mechanism for mapping written symbols to spoken sounds. It is <i>not</i> an optical vision problem, and letters do not physically swap or move across the page in real life. In this activity, you will read clean, standard text at your own pace to observe how reading time and comprehension interact.
          </div>
          <ul className="itw-flow-list">
            <li><span aria-hidden="true">⏱️</span> Read at your natural, comfortable pace — the task is completely untimed.</li>
            <li><span aria-hidden="true">🧠</span> Focus on the meaning of the story; comprehension is the real goal of reading.</li>
            <li><span aria-hidden="true">💛</span> When you are ready, click "I've finished reading".</li>
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
            {/* Topic selector in Run 1 */}
          
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


          {/* Perspective Mode Selector */}
          <div className="itw-mode-bar" role="group" aria-label="Reading perspective mode">
            <button
              type="button"
              className={`itw-mode-pill${readingMode === "standard" ? " itw-active" : ""}`}
              onClick={() => setReadingMode("standard")}
            >
              📖 Standard Fluent Reading
            </button>
            <button
              type="button"
              className={`itw-mode-pill${readingMode === "decoding" ? " itw-active" : ""}`}
              onClick={() => setReadingMode("decoding")}
            >
              ⚡ Phonological Decoding Friction
            </button>
            <button
              type="button"
              className={`itw-mode-pill${readingMode === "supported" ? " itw-active" : ""}`}
              onClick={() => setReadingMode("supported")}
            >
              ✨ Supported Accommodations
            </button>
          </div>

          {readingMode === "decoding" && (
            <div style={{ background: "rgba(89, 40, 140, 0.08)", padding: 14, borderRadius: 14, border: "1.5px solid var(--itw-dyslexia)", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-dyslexia)" }}>
                  Decoding Load Options:
                </span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="itw-pill-btn"
                    style={{ fontSize: 12, padding: "3px 10px", borderColor: letterConfusion ? "var(--itw-dyslexia)" : "var(--itw-border)" }}
                    onClick={() => setLetterConfusion(!letterConfusion)}
                  >
                    {letterConfusion ? "✓ Mirror Focus (b/d/p/q): ON" : "+ Mirror Focus: OFF"}
                  </button>
                  <button
                    type="button"
                    className="itw-pill-btn"
                    style={{ fontSize: 12, padding: "3px 10px", borderColor: visualCrowding ? "var(--itw-dyslexia)" : "var(--itw-border)" }}
                    onClick={() => setVisualCrowding(!visualCrowding)}
                  >
                    {visualCrowding ? "✓ Visual Crowding: ON" : "+ Visual Crowding: OFF"}
                  </button>
                  <button
                    type="button"
                    className="itw-pill-btn"
                    style={{ fontSize: 12, padding: "3px 10px", borderColor: syllableChunks ? "var(--itw-dyslexia)" : "var(--itw-border)" }}
                    onClick={() => setSyllableChunks(!syllableChunks)}
                  >
                    {syllableChunks ? "✓ Syllable Breaks: ON" : "+ Syllable Breaks: OFF"}
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 13, color: "var(--itw-text)", lineHeight: 1.5 }}>
                Notice the conscious effort required to translate printed letterforms into phonemes. Underlined words contain letters with mirrored geometries (b, d, p, q, n, u) where the phonological network requires more time.
              </div>
            </div>
          )}

          <div className="itw-reading-passage" style={{ fontSize: "1.2rem", lineHeight: visualCrowding ? 1.4 : 1.8 }}>
            {renderInteractiveText(activePair.passageA.text, readingMode)}
          </div>
          </Viewfinder>
          <div className="itw-flow-nav">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("instructions")}>Back</button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={finishRun1Reading}>I've finished reading →</button>
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
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("read")}>Back</button>
            <button type="button" className="itw-cta itw-cta-dark" disabled={!allRun1Answered} onClick={submitCheck1}>
              Submit Answers →
            </button>
          </div>
        </div>
      )}

      {step === "result" && (
        <div className="itw-flow-page itw-flow-narrow itw-center" key="result">
          <div className="itw-flow-badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none"><path d="M6 20V11M12 20V4M18 20v-6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"/></svg>
          </div>
          <h2 className="itw-flow-title">Reflect &amp; Compare: Run 1 Observations</h2>
          <p className="itw-flow-lead">
            <b>How did that feel?</b><br />Decoding strain and understanding are two distinct cognitive processes.
          </p>
          <div className="itw-flow-box">
            <p style={{ fontWeight: 700, margin: "0 0 8px", fontSize: 16 }}>Here are your Run 1 observations:</p>
            <ul className="itw-flow-lines" style={{ textAlign: "left", margin: 0, paddingLeft: 20 }}>
              <li>You read the passage in <b>{run1Elapsed.toFixed(1)}s</b> and answered <b>{run1Score} of 3</b> questions correctly.</li>
              <li>When decoding requires intense conscious effort, cognitive bandwidth is diverted away from comprehension and synthesis.</li>
              <li>In the next step, you will test live accommodations on a fresh companion text from the same topic.</li>
            </ul>
          </div>
          <div className="itw-flow-nav itw-flow-nav-center">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("read")}>
              Read Run 1 Again
            </button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("support")}>
              Try Supportive Accommodations →
            </button>
          </div>
        </div>
      )}

      {step === "support" && (
        <div className="itw-flow-page itw-flow-narrow" key="support">
          <h2 className="itw-flow-title itw-center">Change the environment: Try reading accommodations</h2>
          <p className="itw-flow-lead itw-center">
            Children with dyslexia do not lack intelligence — they lack accommodations that mitigate decoding fatigue. Select your primary accommodation focus for Run 2:
          </p>
          <div style={{ display: "grid", gap: 14, margin: "24px 0" }}>
            {DYS_SUPPORT_CHOICES.map((s) => (
              <label
                key={s.id}
                style={{
                  display: "block",
                  padding: "16px 20px",
                  borderRadius: 18,
                  border: `2px solid ${chosenSupport === s.id ? "var(--itw-dyslexia)" : "var(--itw-border)"}`,
                  background: chosenSupport === s.id ? "rgba(240, 163, 33, 0.08)" : "var(--itw-panel)",
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
                  name="dyslexia-support"
                  value={s.id}
                  checked={chosenSupport === s.id}
                  onChange={() => {
                    setChosenSupport(s.id);
                    if (s.id === "spacing") {
                      setLineSpacing("relaxed");
                      setLetterSpacing("wide");
                    } else if (s.id === "ruler") {
                      setReadingRuler(true);
                    }
                  }}
                  style={{ display: "none" }}
                />
              </label>
            ))}
          </div>
          <div className="itw-flow-nav">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("result")}>Back</button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("run_supported")}>
              Run 2 with Accommodations →
            </button>
          </div>
        </div>
      )}

      {step === "run_supported" && (
        <div className="itw-flow-page itw-flow-narrow" key="run_supported">
          <div className="itw-flow-readtop">
            <div>
              <h2 className="itw-flow-title" style={{ margin: 0 }}>Run 2: Reading with Accommodations</h2>
              <p className="itw-flow-lead" style={{ margin: "4px 0 0", fontSize: 14 }}>
                Companion text: <b>{activePair.passageB.title}</b> ({activePair.passageB.wordCount} words)
              </p>
            </div>
            <div className="itw-timer" role="status" aria-label="Supported reading time elapsed">
              <span>Reading Time</span>
              <b>{elapsed.toFixed(1)}s</b>
            </div>
          </div>

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


          {/* Functional Accessible Reader Toolbar */}
          <div className="itw-reader-toolbar" role="toolbar" aria-label="Reading accessibility accommodations">
            <div className="itw-toolbar-group">
              <span className="itw-toolbar-label">Font Size</span>
              <div className="itw-toolbar-btn-group" role="group" aria-label="Font size options">
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
                style={{ borderRadius: 10, padding: "7px 12px", border: "1px solid var(--itw-border)" }}
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
                    <button type="button" className="itw-tts-btn itw-active" onClick={resumeSpeech}>
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
            hud={{ left: "SUPPORTED READING", right: "LIVE CONTROLS" }}
            stageStyle={{ minHeight: "auto", background: "var(--itw-panel)" }}
          >
            <div
              className="itw-reading-wrapper"
              onMouseMove={handleRulerMouseMove}
              onTouchMove={(e) => {
                if (!readingRuler || !e.touches[0]) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const relativeY = Math.max(12, Math.min(e.touches[0].clientY - rect.top, rect.height - 48));
                setRulerY(relativeY);
              }}
            >
              {readingRuler && (
                <div
                  className="itw-reading-ruler-bar"
                  style={{ top: rulerY }}
                  aria-hidden="true"
                />
              )}
              <div className="itw-reading-passage" style={currentTypoStyle}>
                <span>{activePair.passageB.text}</span>
              </div>
            </div>
          </Viewfinder>

          <p className="itw-flow-note" style={{ marginTop: 16 }}>
            When layout, spacing, ruler guidance, or audio tools are provided, the reader is free to engage directly with the ideas rather than wrestling with symbol decoding.
          </p>

          <div className="itw-flow-nav">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("support")}>Back</button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={finishRun2Reading}>
              I've finished reading with support →
            </button>
          </div>
        </div>
      )}

      {step === "questions_supported" && (
        <div className="itw-flow-page itw-flow-narrow" key="questions_supported">
          <h2 className="itw-flow-title">Check 2: Supported Reading Comprehension</h2>
          <p className="itw-flow-note">Answer based on the companion passage you just read ({activePair.passageB.title}):</p>
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
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("run_supported")}>Back</button>
            <button type="button" className="itw-cta itw-cta-dark" disabled={!allRun2Answered} onClick={submitCheck2}>
              Submit &amp; See Takeaways →
            </button>
          </div>
        </div>
      )}

      {step === "explain" && (
        <div className="itw-flow-page" key="explain">
          <div className="itw-flow-intro itw-flow-intro-tight">
            <div>
              <h2 className="itw-flow-title">What you just experienced</h2>
              <p className="itw-flow-lead">
                Decoding written language is an intensive neurological task. In children with dyslexia, the phonological
                processing network requires more time and explicit instruction to link letters to sounds. Understanding
                is fully intact — decoding is where the friction lives.
              </p>
            </div>
            <IntroVignette moduleKey="dyslexia" />
          </div>

          {/* Comparative Run Telemetry Card */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
              margin: "20px 0 28px",
            }}
          >
            <div
              style={{
                padding: "20px 22px",
                borderRadius: 18,
                background: "var(--itw-panel)",
                border: "1.5px solid var(--itw-border)",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--itw-muted)", marginBottom: 6 }}>
                Run 1 (Standard Reading)
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 24, color: "var(--itw-text)", marginBottom: 4 }}>
                {run1Elapsed.toFixed(1)}s <span style={{ fontSize: 16, fontWeight: 600, color: "var(--itw-muted)" }}>• {run1Score}/3 correct</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--itw-muted)", lineHeight: 1.45 }}>
                {activePair.passageA.title} without formatting accommodations.
              </p>
            </div>

            <div
              style={{
                padding: "20px 22px",
                borderRadius: 18,
                background: "rgba(89, 40, 140, 0.08)",
                border: "2px solid var(--itw-dyslexia)",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--itw-dyslexia)", marginBottom: 6 }}>
                Run 2 (Supported Reading)
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 24, color: "var(--itw-dyslexia)", marginBottom: 4 }}>
                {run2Elapsed > 0 ? `${run2Elapsed.toFixed(1)}s` : "Accommodated"} <span style={{ fontSize: 16, fontWeight: 600, color: "var(--itw-text)" }}>• {run2Score}/3 correct</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--itw-muted)", lineHeight: 1.45 }}>
                {activePair.passageB.title} with {lineSpacing} spacing, {fontSize} typography{readingRuler ? ", focus ruler" : ""}.
              </p>
            </div>
          </div>

          <div className="itw-flow-callout">
            <b>Dyslexia is not simply seeing letters backwards.</b>
            <p>
              It is a language-processing difference that affects reading fluency, decoding, spelling, and automaticity.
              Intelligence, reasoning, and creativity are unaffected — providing accommodations like audiobooks and extra time
              ensures those strengths can be realized.
            </p>
          </div>
          <h3 className="itw-flow-h3">You may also notice</h3>
          <div className="itw-flow-notice">
            {DYS_NOTICE.map((n) => (
              <div key={n.text} className="itw-flow-notice-item">
                <span aria-hidden="true">{n.icon}</span>
                <p>{n.text}</p>
              </div>
            ))}
          </div>
          <h3 className="itw-flow-h3">The Data: Indian Studies</h3>
          <FactsGrid
            facts={[
              {
                num: "~8%",
                label: "pooled prevalence of Specific Learning Disorders (SLDs) across 6 Indian studies (8,133 children screened, up to 19 years, 95% CI: 4%–11%)",
                src: "Scaria, Bhaskaran & George (2023), Indian Systematic Review & Meta-Analysis",
              },
              {
                num: "All SLDs",
                label: "The 8% pooled estimate encompasses reading (dyslexia), writing (dysgraphia), and math (dyscalculia) disorders with marked between-study variation, rather than dyslexia alone",
                src: "Scaria et al. (2023) systematic review across 6 Indian study cohorts",
              },
              {
                num: "10–15%",
                label: "of students across diverse Indian classrooms are estimated to benefit from structured, multisensory phonics and accessible text adaptations",
                src: "Dyslexia Association of India (DAI) Educational Guidelines",
              },
            ]}
            note="An Indian systematic review and meta-analysis estimated the pooled prevalence of Specific Learning Disorders at approximately 8% (95% CI: 4%–11%). This estimate covers reading, writing, and arithmetic-related learning disorders; it is not a dyslexia-specific prevalence estimate."
            onComplete={() => {}}
          />
          <section className="itw-block itw-help-block" style={{ marginTop: 40 }}>
            <div className="itw-help-head">
              <div>
                <div className="itw-help-eyebrow">Evidence-based accommodations</div>
                <h3 className="itw-help-title">At home and in the classroom</h3>
              </div>
            </div>
            <StrategyTabs
              home={[
                "Read aloud together well past the age other kids stop needing it — it protects a love of stories while decoding catches up.",
                "Use audiobooks and text-to-speech for content, so struggling to decode doesn't block access to ideas.",
                "Praise effort and strategy, not speed — a slow, correct reader is not behind in intelligence.",
                "Ask the school about a formal evaluation early; structured, phonics-based intervention works best the sooner it starts.",
              ]}
              classroom={[
                "Give extended time on reading-heavy tests — the accommodation targets decoding speed, not comprehension.",
                "Offer notes or slides in advance so class time can go to discussion instead of first-pass decoding.",
                "Never ask a dyslexic student to read aloud cold, in front of the class, without warning.",
                "Use structured literacy / explicit phonics instruction — it's the intervention with the strongest evidence behind it.",
              ]}
            />
            <HelpFooter />
          </section>
          <div className="itw-flow-callout">
            <b>Dyslexia is not simply seeing letters backwards.</b>
            <p>
              It is a language-processing difference that affects reading fluency, decoding, spelling, and automaticity.
              Intelligence, reasoning, and creativity are unaffected — providing accommodations like audiobooks and extra time
              ensures those strengths can be realized.
            </p>
          </div>
          <h3 className="itw-flow-h3">You may also notice</h3>
          <div className="itw-flow-notice">
            {DYS_NOTICE.map((n) => (
              <div key={n.text} className="itw-flow-notice-item">
                <span aria-hidden="true">{n.icon}</span>
                <p>{n.text}</p>
              </div>
            ))}
          </div>
          <h3 className="itw-flow-h3">The Data: Indian Studies</h3>
          <FactsGrid
            facts={[
              {
                num: "~8%",
                label: "pooled prevalence of Specific Learning Disorders (SLDs) across 6 Indian studies (8,133 children screened, up to 19 years, 95% CI: 4%–11%)",
                src: "Scaria, Bhaskaran & George (2023), Indian Systematic Review & Meta-Analysis",
              },
              {
                num: "All SLDs",
                label: "The 8% pooled estimate encompasses reading (dyslexia), writing (dysgraphia), and math (dyscalculia) disorders with marked between-study variation, rather than dyslexia alone",
                src: "Scaria et al. (2023) systematic review across 6 Indian study cohorts",
              },
              {
                num: "10–15%",
                label: "of students across diverse Indian classrooms are estimated to benefit from structured, multisensory phonics and accessible text adaptations",
                src: "Dyslexia Association of India (DAI) Educational Guidelines",
              },
            ]}
            note="An Indian systematic review and meta-analysis estimated the pooled prevalence of Specific Learning Disorders at approximately 8% (95% CI: 4%–11%). This estimate covers reading, writing, and arithmetic-related learning disorders; it is not a dyslexia-specific prevalence estimate."
            onComplete={() => {}}
          />
          <section className="itw-block itw-help-block" style={{ marginTop: 40 }}>
            <div className="itw-help-head">
              <div>
                <div className="itw-help-eyebrow">Evidence-based accommodations</div>
                <h3 className="itw-help-title">At home and in the classroom</h3>
              </div>
            </div>
            <StrategyTabs
              home={[
                "Read aloud together well past the age other kids stop needing it — it protects a love of stories while decoding catches up.",
                "Use audiobooks and text-to-speech for content, so struggling to decode doesn't block access to ideas.",
                "Praise effort and strategy, not speed — a slow, correct reader is not behind in intelligence.",
                "Ask the school about a formal evaluation early; structured, phonics-based intervention works best the sooner it starts.",
              ]}
              classroom={[
                "Give extended time on reading-heavy tests — the accommodation targets decoding speed, not comprehension.",
                "Offer notes or slides in advance so class time can go to discussion instead of first-pass decoding.",
                "Never ask a dyslexic student to read aloud cold, in front of the class, without warning.",
                "Use structured literacy / explicit phonics instruction — it's the intervention with the strongest evidence behind it.",
              ]}
            />
            <HelpFooter />
          </section>
          <div className="itw-flow-nav" style={{ marginTop: 32 }}>
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("result")}>Back</button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("next")}>Next Steps →</button>
          </div>
        </div>
      )}

      {step === "next" && (
        <div className="itw-flow-page itw-flow-narrow" key="next">
          <h2 className="itw-flow-title itw-center">Understanding creates a kinder tomorrow</h2>
          <p className="itw-flow-lead itw-center">
            Every child learns differently. If you have concerns about your child's reading or would like professional
            guidance, early structured support makes all the difference.
          </p>
          <div className="itw-flow-nav itw-flow-nav-center">
            <a className="itw-cta itw-cta-dark" href="/assessments">Take an Assessment →</a>
            <a className="itw-cta itw-cta-line" href="/consult">Book a Consultation →</a>
          </div>
          <h3 className="itw-flow-h3">Explore More Experiences</h3>
          <div className="itw-flow-more">
            {more.map((m) => (
              <button type="button" key={m.key} className="itw-flow-more-card" data-m={m.key} onClick={() => onNavigate(m.key)}>
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
    q: "During the fast-paced conversation, where did you notice the communicative pressure?",
    options: [
      "I had the thought clear in mind, but the ticking turn window created sudden performance anxiety.",
      "The expectation of immediate verbal delivery made finding and organizing words feel rushed.",
      "The fear that the listener would move on or interrupt heightened my communicative tension.",
      "The conversational rush was created by external listener expectations, not a lack of ideas.",
    ],
  },
];

const SPEECH_SUPPORT_CHOICES = [
  {
    id: "patient_wait",
    title: "Unhurried Wait Time (Patient Listening)",
    subtitle: "Attentive presence with zero clock pressure",
    desc: "The conversation partner maintains warm, natural presence and gives generous silence without glancing at clocks or rushing.",
    tag: "Pacing Accommodation",
  },
  {
    id: "no_interruption",
    title: "Sentence Ownership (Never Finishing Sentences)",
    subtitle: "Protects the speaker's right to complete their thought",
    desc: "Resists guessing words, filling in blanks, or finishing sentences, preserving the speaker's communicative agency.",
    tag: "Relational Respect",
  },
  {
    id: "multimodal",
    title: "Multi-Modal Communication Options",
    subtitle: "Welcomes typed, spoken, or gestural input equally",
    desc: "Validates multiple modes of communication, keeping total focus on the message rather than speech mechanics.",
    tag: "Universal Design",
  },
];

const FAST_PROMPTS = [
  { npc: "Quick question: what is one highlight from your week?", time: 11 },
  { npc: "Next: what's an activity you enjoy to relax?", time: 9 },
];

const SUPPORTED_PROMPTS = [
  { npc: "Take your time — tell me about something that made you smile recently." },
  { npc: "No rush at all — what is one place you'd love to visit someday?" },
];

function SpeechSim({
  mode = "fast",
  supportType = "wait",
  onComplete,
  onAbort,
}) {
  const { soundOn } = useContext(SettingsContext);
  const [stage, setStage] = useState("thinking"); // thinking | formulating | delivering | finished
  const [formulatedWords, setFormulatedWords] = useState([]);
  const [aacSelection, setAacSelection] = useState([]);
  const [partnerPatience, setPartnerPatience] = useState(mode === "fast" ? 100 : null);
  const [partnerInterrupted, setPartnerInterrupted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);

  const startTimeRef = useRef(0);
  const timerRef = useRef(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Stopwatch timer
  useEffect(() => {
    startTimeRef.current = performance.now();
    timerRef.current = setInterval(() => {
      setElapsed(parseFloat(((performance.now() - startTimeRef.current) / 1000).toFixed(1)));
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Impatient listener pressure timer in fast mode
  useEffect(() => {
    if (mode !== "fast" || !running) return undefined;

    const interval = setInterval(() => {
      setPartnerPatience((prev) => {
        if (prev <= 15 && !partnerInterrupted) {
          setPartnerInterrupted(true);
          if (soundOn) audio.cue("flicker");
        }
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 2.5;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [mode, running, partnerInterrupted, soundOn]);

  const TARGET_THOUGHT = "We built a hydraulic crane with syringes, water tubes, and cardboard joints.";
  const SPEECH_FRAGMENTS = [
    { text: "W-w-we...", full: "We" },
    { text: "b-built a...", full: "built a" },
    { text: "hydrau-...", full: "hydraulic" },
    { text: "crane with...", full: "crane with" },
    { text: "syringes...", full: "syringes" },
    { text: "and water tubes.", full: "and water tubes." },
  ];

  const AAC_TILES = [
    { id: "crane", icon: "🏗️", label: "Hydraulic Crane", phrase: "hydraulic crane" },
    { id: "water", icon: "💧", label: "Syringes & Water", phrase: "syringes and water tubes" },
    { id: "cardboard", icon: "📦", label: "Cardboard Joints", phrase: "cardboard joints" },
    { id: "pressure", icon: "⚙️", label: "Water Pressure", phrase: "powered by water pressure" },
    { id: "project", icon: "💡", label: "Science Exhibition", phrase: "our science exhibition project" },
    { id: "team", icon: "🤝", label: "Built with Brother", phrase: "built with my brother" },
  ];

  const handleStepFormulate = (frag) => {
    if (soundOn) audio.cue("tap");
    const next = [...formulatedWords, frag];
    setFormulatedWords(next);
    setStage("formulating");

    if (next.length >= SPEECH_FRAGMENTS.length) {
      handleCompleteSpeech("verbal");
    }
  };

  const handleAacTileClick = (tile) => {
    if (soundOn) {
      audio.cue("tap");
      speakText(tile.phrase, { rate: 0.95, volume: 0.9 });
    }
    const next = aacSelection.includes(tile.id) ? aacSelection : [...aacSelection, tile.id];
    setAacSelection(next);

    if (next.length >= 3) {
      handleCompleteSpeech("aac");
    }
  };

  const handleCompleteSpeech = (method) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRunning(false);
    setStage("finished");
    if (soundOn) audio.cue("slam");

    const finalTime = parseFloat(((performance.now() - startTimeRef.current) / 1000).toFixed(1));
    onCompleteRef.current?.({
      time: finalTime,
      method,
      interrupted: partnerInterrupted,
    });
  };

  return (
    <div className="itw-speech-arena" role="region" aria-label="Expressive Communication Simulation">
      {/* Header bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-speech)", letterSpacing: "0.08em" }}>
            {mode === "fast" ? "Run 1 (Fast-Paced Discussion Circle)" : "Run 2 (Supported Unhurried Communication)"}
          </span>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--itw-text)", margin: "4px 0" }}>
            Circle Time: &ldquo;Tell the group about your science project.&rdquo;
          </h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--itw-muted)" }}>
            ⏱️ {elapsed.toFixed(1)}s
          </span>
          <button type="button" className="itw-pill-btn" onClick={onAbort}>Exit</button>
        </div>
      </div>

      {/* Conversation Partner Banner */}
      <div className="itw-speech-partner">
        <div className="itw-partner-avatar">👩‍🏫</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--itw-text)" }}>
            Teacher &amp; Classroom Circle
          </div>
          <div style={{ fontSize: 14, color: "var(--itw-muted)" }}>
            {mode === "fast" && !partnerInterrupted && "Waiting for an immediate answer... turn timer running."}
            {mode === "fast" && partnerInterrupted && (
              <span style={{ color: "#d9381e", fontWeight: 700 }}>
                ⚠️ Conversational pressure: &ldquo;Anyone else have an answer? Should we move to the next person?&rdquo;
              </span>
            )}
            {mode === "supported" && "Attentive, unhurried presence: listening with warm eye contact and zero hurry."}
          </div>
          {mode === "fast" && (
            <div className="itw-meter-bar" style={{ marginTop: 8 }}>
              <div
                className="itw-meter-fill"
                style={{
                  width: `${partnerPatience}%`,
                  background: partnerPatience > 40 ? "var(--itw-speech)" : "#d9381e",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* The Internal Thought (Rich and clear in the speaker's mind) */}
      <div className="itw-thought-bubble">
        <div className="itw-thought-label">
          🧠 The Idea in Your Mind (Completely Clear &amp; Fluent)
        </div>
        <div className="itw-thought-text">
          &ldquo;{TARGET_THOUGHT}&rdquo;
        </div>
      </div>

      {/* Physical Delivery Canvas */}
      {mode === "supported" && supportType === "aac" ? (
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--itw-muted)", marginBottom: 8 }}>
            AAC Multi-Modal Soundboard: Tap concept tiles to speak aloud instantly
          </div>
          <div className="itw-aac-grid">
            {AAC_TILES.map((tile) => {
              const isSelected = aacSelection.includes(tile.id);
              return (
                <button
                  key={tile.id}
                  type="button"
                  className={`itw-aac-tile${isSelected ? " itw-selected" : ""}`}
                  onClick={() => handleAacTileClick(tile)}
                >
                  <span className="itw-aac-icon">{tile.icon}</span>
                  <span className="itw-aac-label">{tile.label}</span>
                </button>
              );
            })}
          </div>
          {aacSelection.length >= 3 && stage !== "finished" && (
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <button
                type="button"
                className="itw-cta itw-cta-dark"
                onClick={() => handleCompleteSpeech("aac")}
              >
                Complete Statement via AAC ✓
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="itw-articulation-box">
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-muted)", marginBottom: 6 }}>
              Verbal Speech Output
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--itw-text)", minHeight: 28 }}>
              {formulatedWords.length === 0 ? (
                <span style={{ color: "var(--itw-muted)", fontStyle: "italic", fontSize: 15 }}>
                  Assemble and articulate words below against conversational pacing...
                </span>
              ) : (
                formulatedWords.map((w, i) => (
                  <span key={i} style={{ marginRight: 6, color: "var(--itw-speech)" }}>
                    {w.text}
                  </span>
                ))
              )}
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--itw-muted)", marginBottom: 8 }}>
            {mode === "fast"
              ? "Articulate words (simulating motor speech planning friction under time pressure):"
              : "Take your time — form each phrase without rush:"}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SPEECH_FRAGMENTS.map((frag, idx) => {
              const isDone = formulatedWords.length > idx;
              const isNext = formulatedWords.length === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  className="itw-pill-btn"
                  disabled={isDone || !isNext}
                  onClick={() => handleStepFormulate(frag)}
                  style={{
                    padding: "10px 18px",
                    fontWeight: 700,
                    borderColor: isNext ? "var(--itw-speech)" : "var(--itw-border)",
                    background: isDone ? "var(--itw-panel-2)" : isNext ? "rgba(140,66,44,0.12)" : "var(--itw-panel)",
                    opacity: isDone ? 0.4 : isNext ? 1 : 0.6,
                  }}
                >
                  {isDone ? "✓ " : "+ "} {frag.text}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Takeaway note */}
      <div style={{ fontSize: 13, color: "var(--itw-muted)", textAlign: "center", marginTop: 20 }}>
        {mode === "fast"
          ? "Notice the pressure: the idea was clear in your head the whole time, but motor planning took longer than external conversation allowed."
          : "When conversation partners provide unhurried wait time and multimodal options, the speaker participates with full dignity."}
      </div>
    </div>
  );
}
function SpeechModule({ onBack, onNavigate }) {
  const [step, setStep] = useState("intro"); // intro | instructions | run_fast | reflect | support | run_supported | explain | next
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
            <h2 className="itw-flow-title">Speech & Language Differences</h2>
            <div className="itw-flow-sub">Communication Under Time Pressure: Conversational Pacing & Active Listening</div>
            <p className="itw-flow-lead">
              For people with developmental stuttering, word-finding delays, or speech-sound differences, the thought is
              fully formed and ready in the mind. The friction occurs when conversational turn-taking is rushed.
              In this activity, you will experience how pacing and listener behavior completely reshape the communication experience.
            </p>
            <ul className="itw-flow-meta">
              <li><span aria-hidden="true">⏱️</span> Takes 2–3 minutes</li>
              <li><span aria-hidden="true">💬</span> A conversational exchange comparing fast pacing vs. patient listening</li>
              <li><span aria-hidden="true">ℹ️</span> An educational simulation, not a clinical diagnostic tool</li>
            </ul>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("instructions")}>
              Begin Experience →
            </button>
          </div>
          <IntroVignette moduleKey="speech" />
        </div>
      )}

      {step === "instructions" && (
        <div className="itw-flow-page itw-flow-narrow" key="instructions">
          <div className="itw-scene-plate">
            <img src="/decor/itw/communication-environment.webp" alt="Courtyard communication bench" className="itw-scene-plate-img" />
            <div className="itw-scene-plate-overlay">
              <span className="itw-scene-tag">📍 Setting • Courtyard Bench & Classroom</span>
              <p className="itw-scene-caption">The thoughts are rich and complete. The difference lies between an unhurried, listening conversational partner and a hurried clock.</p>
            </div>
          </div>
          <h2 className="itw-flow-title itw-center">Before you begin: Conversational Pacing</h2>
          <p className="itw-flow-lead itw-center">
            In this activity, you will answer two everyday questions in two different conversational environments.
          </p>
          <div
            style={{
              background: "rgba(140, 66, 44, 0.08)",
              border: "1px solid var(--itw-speech)",
              borderRadius: 16,
              padding: "16px 20px",
              margin: "20px 0",
              fontSize: 14.5,
              lineHeight: 1.6,
              color: "var(--itw-text)",
            }}
          >
            <b>Clinical Distinction:</b> Communication differences take several distinct forms: developmental stuttering
            (motor speech blocks, sound prolongations, repetitions), word-finding delays, and speech-sound production differences.
            This simulation specifically models conversational pacing — experiencing how rapid turn windows create communicative
            pressure versus how patient partners foster psychological safety and dignity.
          </div>
          <ul className="itw-flow-list">
            <li><span aria-hidden="true">💬</span> Type a short answer and click “Share Response”.</li>
            <li><span aria-hidden="true">⏳</span> In Run 1, observe the pressure of a rapid, ticking turn window.</li>
            <li><span aria-hidden="true">👂</span> In Run 2, experience unhurried listening with no timers counting down.</li>
          </ul>
          <div className="itw-flow-nav">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("intro")}>Back</button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("run_fast")}>
              Start Run 1: Fast Pacing →
            </button>
          </div>
        </div>
      )}

      {step === "run_fast" && (
        <div className="itw-flow-page" key="run_fast">
          <div className="itw-flow-readtop">
            <h2 className="itw-flow-title">Run 1: Fast-Paced Conversation</h2>
            <p className="itw-flow-lead" style={{ margin: 0 }}>
              Answer the questions before the fast-paced response window closes.
            </p>
          </div>
          <SpeechSim
            mode="fast"
            onComplete={handleFastComplete}
            onAbort={() => setStep("instructions")}
          />
        </div>
      )}

      {step === "reflect" && (
        <div className="itw-flow-page itw-flow-narrow" key="reflect">
          <h2 className="itw-flow-title itw-center">Reflection: Conversational Urgency</h2>
          <p className="itw-flow-lead itw-center">
            Here are the neutral metrics from your fast-paced exchange:
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
                Total Speaking Time
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "var(--itw-speech)", margin: "8px 0" }}>
                {results.fast ? `${results.fast.time.toFixed(1)}s` : "—"}
              </div>
              <div style={{ fontSize: 13, color: "var(--itw-muted)" }}>Across 2 conversational turns</div>
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
                Turn Success Rate
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "var(--itw-speech)", margin: "8px 0" }}>
                {results.fast ? `${results.fast.completedTurns} / ${results.fast.turns}` : "—"}
              </div>
              <div style={{ fontSize: 13, color: "var(--itw-muted)" }}>
                {results.fast?.completedTurns === results.fast?.turns ? "Completed within window" : "Turns elapsed before delivery"}
              </div>
            </div>
          </div>

          <p className="itw-flow-lead" style={{ fontSize: 16, lineHeight: 1.6 }}>
            In high-speed discussions, the pressure of being interrupted or having the group move on generates communicative tension. The thoughts were ready — the conversational timing was simply unsupportive.
          </p>

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

          <div className="itw-flow-nav" style={{ marginTop: 24 }}>
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("run_fast")}>
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
          <h2 className="itw-flow-title itw-center">Change the environment: Try conversational support</h2>
          <p className="itw-flow-lead itw-center">
            People with speech differences do not need advice to “calm down” or “speak slower.” They need conversation partners who offer unhurried space. Select an accommodation for Run 2:
          </p>

          <div style={{ display: "grid", gap: 14, margin: "24px 0" }}>
            {SPEECH_SUPPORT_CHOICES.map((s) => (
              <label
                key={s.id}
                style={{
                  display: "block",
                  padding: "16px 20px",
                  borderRadius: 18,
                  border: `2px solid ${chosenSupport === s.id ? "var(--itw-speech)" : "var(--itw-border)"}`,
                  background: chosenSupport === s.id ? "rgba(140, 66, 44, 0.08)" : "var(--itw-panel)",
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
                  name="speech-support"
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
            <h2 className="itw-flow-title">Run 2: Supported by {SPEECH_SUPPORT_CHOICES.find((s) => s.id === chosenSupport)?.title}</h2>
            <p className="itw-flow-lead" style={{ margin: 0 }}>
              Notice how having an unhurried, attentive listener completely transforms communication comfort.
            </p>
          </div>
          <SpeechSim
            mode="supported"
            supportType={chosenSupport}
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
              A speech pause, block, or repetition is never a sign of lack of intelligence, hesitation, or unpreparedness.
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
                The American Speech-Language-Hearing Association (ASHA) emphasizes key relational practices: never finish a speaker's sentences or guess words for them, maintain warm and relaxed eye contact, keep your own speech rate measured, and focus entirely on the message being communicated rather than the delivery fluency.
              </p>
            </div>
          </div>

          <h3 className="itw-flow-h3">The Data: Indian Context</h3>
          <FactsGrid
            facts={[
              {
                num: "1.5% vs 0.46%",
                label: "community prevalence of stuttering in school-age cohorts: 1.5% in Bangalore (Srinath et al., ages 4–16 across urban and rural cohorts) and 0.46% in Tamil Nadu (74,544 schoolchildren screened)",
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
            note="Community prevalence studies (e.g., 1.5% in Bangalore or 0.46% in Tamil Nadu) measure general child populations, whereas tertiary clinical statistics (~10% at AIISH) describe patients seeking specialized care. In multilingual Indian contexts, speech-language pathologists emphasize giving speakers unhurried time and distinguishing natural language formulation pauses from clinical speech disorders."
            onComplete={() => {}}
          />

          <section className="itw-block itw-help-block" style={{ marginTop: 40 }}>
            <div className="itw-help-head">
              <div className="itw-help-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none"><path d="M12 21s-7.5-4.6-10-9.3C.4 8 2 4.5 5.6 4a5 5 0 0 1 6.4 2 5 5 0 0 1 6.4-2C22 4.5 23.6 8 22 11.7 19.5 16.4 12 21 12 21Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <div className="itw-help-eyebrow">Practical accommodations</div>
                <h3 className="itw-help-title">How you can support at home & in the classroom</h3>
              </div>
            </div>

            <StrategyTabs
              home={[
                "Let the speaker finish their own sentence — resist filling in words, even when you know what they intend to say.",
                "Slow down your own conversational pace slightly; a calm rhythm models ease rather than urgency.",
                "React to what they said, not how they said it — “tell me more” is far more supportive than commenting on fluency.",
                "Maintain natural, relaxed eye contact during speech blocks rather than looking away or expressing impatience.",
              ]}
              classroom={[
                "Never force a student who stutters to read aloud on the spot in front of peers without prior agreement and preparation.",
                "Provide extended wait time after asking a question before expecting an answer or calling on another student.",
                "Coordinate with the speech-language pathologist to integrate accommodations into regular classroom participation.",
                "Foster an inclusive classroom environment where all communication styles are respected equally.",
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
          <h2 className="itw-flow-title itw-center">Every voice deserves to be heard</h2>
          <p className="itw-flow-lead itw-center">
            When we create space for every communication style, we build more empathetic homes, classrooms, and communities.
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


/* ================= DYSCALCULIA: Do the Math ================= */

const DYSCALC_STEPS = [
  { key: "instructions", label: "Instructions" },
  { key: "run_baseline", label: "Run 1 (Direct Count)" },
  { key: "unsupported_intro", label: "Scaling Brief" },
  { key: "run_unsupported", label: "Run 2 (Abstract Scaling)" },
  { key: "reflect", label: "Reflect & Compare" },
  { key: "support", label: "Support Experiment" },
  { key: "explain", label: "Understanding & Action" },
];

const DYSCALC_STEP_INDEX = {
  instructions: 0,
  run_baseline: 1,
  unsupported_intro: 1,
  run_unsupported: 2,
  reflect: 3,
  support: 4,
  run_supported: 4,
  explain: 5,
};

const DYSCALC_REFLECT_QS = [
  {
    q: "During the abstract scaling calculation, what did you observe?",
    options: [
      "Calculating 1.5x in working memory felt slippery without visual number anchors.",
      "I had to recalculate multiple times because digits didn't feel spatially grounded.",
      "The arithmetic took mental energy away from understanding the broader recipe.",
      "Having a concrete number line or block model made the proportional relation instantly clear.",
    ],
  },
];

const DYSCALC_SUPPORT_CHOICES = [
  {
    id: "numberline",
    title: "Visual Number Line & Interval Jump",
    subtitle: "Spatial quantity anchoring",
    desc: "Anchors proportional scaling on a physical visual number line so mental arithmetic is replaced by visual estimation.",
    tag: "Spatial Scaffolding",
  },
  {
    id: "blocks",
    title: "Tactile Counter Blocks (CRA Model)",
    subtitle: "Concrete base-10 visual units",
    desc: "Uses the Concrete-Representational-Abstract framework: group 50g and 100g blocks visibly to reach the scaled amount.",
    tag: "Concrete Scaffolding",
  },
  {
    id: "scaffold",
    title: "Step-by-Step Ratio Deconstruction",
    subtitle: "Base + Half = Target formula",
    desc: "Deconstructs 1.5x into two atomic operations: take the original base amount, then add half of it.",
    tag: "Cognitive Scaffolding",
  },
];

function DyscalculiaSim({ mode = "baseline", supportType = "tenframes", onComplete, onAbort }) {
  const { soundOn } = useContext(SettingsContext);
  const [stage, setStage] = useState(1); // 1: naked numerals / subitizing, 2: spatial number line, 3: completed
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [userEstimate, setUserEstimate] = useState(50);
  const [tenFrameCount, setTenFrameCount] = useState(14);
  const [elapsed, setElapsed] = useState(0);
  const [errors, setErrors] = useState(0);

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

  const handleSubitizePick = (val, isCorrect) => {
    if (soundOn) audio.cue(isCorrect ? "slam" : "flicker");
    if (!isCorrect) {
      setErrors((e) => e + 1);
      return;
    }
    setSelectedAnswer(val);

    if (timerRef.current) clearInterval(timerRef.current);
    const finalTime = parseFloat(((performance.now() - startTimeRef.current) / 1000).toFixed(1));
    onCompleteRef.current?.({
      time: finalTime,
      errors,
      mode,
    });
  };

  // Ten-Frame calculation
  const fullFrames = Math.floor(tenFrameCount / 10);
  const remainder = tenFrameCount % 10;

  return (
    <div className="itw-dyscalc-arena" role="region" aria-label="Visual Number Sense Arena">
      {/* Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-dyscalculia)", letterSpacing: "0.08em" }}>
            {mode === "baseline" ? "Run 1 (Naked Abstract Numerals)" : "Run 2 (Visual Ten-Frames & Spatial Number Line)"}
          </span>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--itw-text)", margin: "4px 0" }}>
            {mode === "baseline" ? "The Challenge: Working with Pure Abstract Glyphs" : "The Visual Solution: Grounding Quantity in Space"}
          </h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--itw-muted)" }}>
            ⏱️ {elapsed.toFixed(1)}s
          </span>
          <button type="button" className="itw-pill-btn" onClick={onAbort}>Exit</button>
        </div>
      </div>

      {mode === "baseline" ? (
        /* Baseline mode: Demonstrating the friction of naked abstract symbols */
        <div>
          <div style={{ background: "var(--itw-panel-2)", padding: 22, borderRadius: 18, border: "1.5px solid var(--itw-border)", margin: "16px 0" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--itw-dyscalculia)", textTransform: "uppercase", marginBottom: 8 }}>
              Abstract Numerical Comparison
            </div>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--itw-text)", marginBottom: 20 }}>
              To a mind with dyscalculia, numbers like <b>47</b> and <b>74</b> are abstract shapes with no intrinsic visual volume or weight. Mental estimation requires laborious counting rather than automatic subitizing.
            </p>

            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 24, margin: "24px 0" }}>
              <div style={{ padding: "20px 32px", borderRadius: 16, border: "2px solid var(--itw-border)", fontSize: 36, fontFamily: "var(--font-mono)", fontWeight: 800, color: "var(--itw-text)" }}>
                68
              </div>
              <span style={{ fontSize: 20, fontWeight: 800, color: "var(--itw-muted)" }}>vs</span>
              <div style={{ padding: "20px 32px", borderRadius: 16, border: "2px solid var(--itw-border)", fontSize: 36, fontFamily: "var(--font-mono)", fontWeight: 800, color: "var(--itw-text)" }}>
                86
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--itw-muted)", marginBottom: 12 }}>
                Quick check: How many 10s are in the larger number?
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                {[6, 7, 8, 9].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className="itw-pill-btn"
                    style={{ fontSize: 18, padding: "10px 24px", fontWeight: 800 }}
                    onClick={() => handleSubitizePick(val, val === 8)}
                  >
                    {val} tens
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Supported mode: Rich Visual Models (Ten-Frames, Number Line, CRA model) */
        <div>
          <div style={{ background: "var(--itw-panel-2)", padding: 22, borderRadius: 18, border: "1.5px solid var(--itw-dyscalculia)", margin: "16px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--itw-dyscalculia)", textTransform: "uppercase" }}>
                ✨ Visual Ten-Frame Scaffolding (CRA Concrete Model)
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="itw-pill-btn"
                  onClick={() => setTenFrameCount((c) => Math.max(1, c - 1))}
                >
                  - 1
                </button>
                <button
                  type="button"
                  className="itw-pill-btn"
                  onClick={() => setTenFrameCount((c) => Math.min(30, c + 1))}
                >
                  + 1
                </button>
              </div>
            </div>

            <p style={{ fontSize: 15, color: "var(--itw-text)", lineHeight: 1.6, marginBottom: 16 }}>
              In a Ten-Frame, numbers are organized into instantly recognizable 5-and-10 patterns. Quantity is grasped visually in a glance without counting individual dots!
            </p>

            {/* Render Ten-Frames */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", margin: "16px 0" }}>
              {Array.from({ length: Math.ceil(tenFrameCount / 10) }).map((_, fIdx) => {
                const dotsInThisFrame = Math.min(10, tenFrameCount - fIdx * 10);
                return (
                  <div key={fIdx} className="itw-tenframe-grid">
                    {Array.from({ length: 10 }).map((_, cIdx) => (
                      <div key={cIdx} className="itw-tenframe-cell">
                        {cIdx < dotsInThisFrame && <span className="itw-tenframe-dot" />}
                      </div>
                    ))}
                  </div>
                );
              })}
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--itw-dyscalculia)" }}>
                = {tenFrameCount} ({fullFrames} ten{fullFrames !== 1 ? "s" : ""} + {remainder} one{remainder !== 1 ? "s" : ""})
              </div>
            </div>

            {/* Interactive Visual Number Line */}
            <div style={{ borderTop: "1px solid var(--itw-border)", paddingTop: 18, marginTop: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--itw-dyscalculia)", textTransform: "uppercase", marginBottom: 6 }}>
                Spatial Number Line with Landmark Anchors (0 to 100)
              </div>
              <div className="itw-number-line-wrap">
                <div className="itw-number-track">
                  <div
                    className="itw-number-pin"
                    style={{ left: `${tenFrameCount}%` }}
                  >
                    {tenFrameCount}
                  </div>
                  {[0, 25, 50, 75, 100].map((anchor) => (
                    <span
                      key={anchor}
                      className="itw-number-anchor"
                      style={{ left: `${anchor}%` }}
                    >
                      {anchor}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: 24 }}>
              <button
                type="button"
                className="itw-cta itw-cta-dark"
                onClick={() => handleSubitizePick(tenFrameCount, true)}
              >
                Confirm Visual Understanding ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Reflection */}
      <div style={{ fontSize: 13, color: "var(--itw-muted)", textAlign: "center", marginTop: 12 }}>
        {mode === "baseline"
          ? "Without spatial models, working memory is choked by basic magnitude checks."
          : "Concrete and visual representations transform abstract symbols into tangible quantities."}
      </div>
    </div>
  );
}
function DyscalculiaModule({ onBack, onNavigate }) {
  const [step, setStep] = useState("intro");
  const [results, setResults] = useState({ baseline: null, unsupported: null, supported: null });
  const [chosenSupport, setChosenSupport] = useState("numberline");
  const [reflectionAnswers, setReflectionAnswers] = useState([null]);

  const stepIndex = DYSCALC_STEP_INDEX[step];
  const more = MODULES.filter((m) => m.key !== "dyscalculia");

  const handleBaselineComplete = (data) => {
    setResults((prev) => ({ ...prev, baseline: data }));
    setStep("unsupported_intro");
  };

  const handleUnsupportedComplete = (data) => {
    setResults((prev) => ({ ...prev, unsupported: data }));
    setStep("reflect");
  };

  const handleSupportedComplete = (data) => {
    setResults((prev) => ({ ...prev, supported: data }));
    setStep("explain");
  };

  return (
    <section className="itw-view itw-module itw-flow" data-accent="dyscalculia">
      <FlowCrumbs name="Dyscalculia" onBack={onBack} />
      {stepIndex !== undefined && <FlowStepper steps={DYSCALC_STEPS} current={stepIndex} />}

      {step === "intro" && (
        <div className="itw-flow-page itw-flow-intro" key="intro">
          <div>
            <h2 className="itw-flow-title">Dyscalculia</h2>
            <div className="itw-flow-sub">Do the Math</div>
            <p className="itw-flow-lead">
              Numbers are not just abstract symbols on a page; in daily life, they represent spatial distances, time intervals,
              and physical quantities. For individuals with dyscalculia, holding mental numbers without concrete spatial anchors
              creates intense cognitive fatigue, turning everyday cooking, budgeting, or time-tracking into an uphill struggle.
            </p>
            <ul className="itw-flow-meta">
              <li><span aria-hidden="true">⏱️</span> Takes 2–3 minutes</li>
              <li><span aria-hidden="true">🔢</span> Everyday recipe scaling task</li>
              <li><span aria-hidden="true">🛡️</span> Empathy exercise, not a diagnostic test</li>
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
            <img src="/decor/itw/dyscalculia-environment.webp" alt="Math manipulatives table" className="itw-scene-plate-img" />
            <div className="itw-scene-plate-overlay">
              <span className="itw-scene-tag">📍 Setting • Kitchen & Math Resource Table</span>
              <p className="itw-scene-caption">Measuring ingredients, counting ratios, and scaling recipes: when numbers lack spatial anchors, physical manipulatives bring clarity.</p>
            </div>
          </div>
          <h2 className="itw-flow-title itw-center">Before you begin Run 1</h2>
          <p className="itw-flow-lead itw-center">
            You are measuring ingredients for traditional cardamom cookies.
          </p>
          <ul className="itw-flow-list">
            <li><span aria-hidden="true">🥣</span> In Run 1, simply adjust the ingredient amounts to match the base recipe for 4 servings.</li>
            <li><span aria-hidden="true">📏</span> In Run 2, you will experience the cognitive friction of scaling that recipe for 6 people without visual aids.</li>
            <li><span aria-hidden="true">💡</span> In Run 3, test how visual number lines and concrete scaffolding relieve mathematical strain.</li>
          </ul>
          <div className="itw-flow-nav">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("intro")}>Back</button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("run_baseline")}>
              Start Run 1 (Direct Count) →
            </button>
          </div>
        </div>
      )}

      {step === "run_baseline" && (
        <div className="itw-flow-page" key="run_baseline">
          <div className="itw-flow-readtop">
            <h2 className="itw-flow-title">Run 1: Base Recipe Measurement</h2>
            <p className="itw-flow-lead" style={{ margin: 0 }}>Notice how straightforward measuring is when quantities are already specified.</p>
          </div>
          <DyscalculiaSim mode="baseline" onComplete={handleBaselineComplete} onAbort={() => setStep("instructions")} />
        </div>
      )}

      {step === "unsupported_intro" && (
        <div className="itw-flow-page itw-flow-narrow" key="unsupported_intro">
          <h2 className="itw-flow-title itw-center">Now, Run 2: Scaling by 1.5×</h2>
          <p className="itw-flow-lead itw-center">
            Two extra guests have joined! You must now scale the recipe from 4 servings to 6 servings (a 1.5× multiplier).
          </p>
          <ul className="itw-flow-list">
            <li><span aria-hidden="true">🧠</span> Calculate 1.5× for 200g flour, 120ml milk, and 60g sugar mentally.</li>
            <li><span aria-hidden="true">⚠️</span> Notice how holding mental arithmetic calculations without visual models strains working memory.</li>
          </ul>
          <div className="itw-flow-nav">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("run_baseline")}>Back to Run 1</button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("run_unsupported")}>
              Start Run 2 (Abstract Scaling) →
            </button>
          </div>
        </div>
      )}

      {step === "run_unsupported" && (
        <div className="itw-flow-page" key="run_unsupported">
          <div className="itw-flow-readtop">
            <h2 className="itw-flow-title">Run 2: Abstract Mental Calculation</h2>
            <p className="itw-flow-lead" style={{ margin: 0 }}>Scale each ingredient by 1.5× without visual aids.</p>
          </div>
          <DyscalculiaSim mode="unsupported" onComplete={handleUnsupportedComplete} onAbort={() => setStep("unsupported_intro")} />
        </div>
      )}

      {step === "reflect" && (
        <div className="itw-flow-page itw-flow-narrow" key="reflect">
          <h2 className="itw-flow-title itw-center">What did you observe about mathematical working memory?</h2>
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
                Run 1 (Direct)
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "var(--itw-text)", margin: "8px 0" }}>
                {results.baseline ? `${results.baseline.time.toFixed(1)}s` : "—"}
              </div>
              <div style={{ fontSize: 13, color: "var(--itw-muted)" }}>0 calculations</div>
            </div>
            <div style={{ textAlign: "center", padding: 12, borderLeft: "1px solid var(--itw-border)" }}>
              <div style={{ fontSize: 13, textTransform: "uppercase", color: "var(--itw-dyscalculia)", fontWeight: 700 }}>
                Run 2 (Mental Scaling)
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "var(--itw-dyscalculia)", margin: "8px 0" }}>
                {results.unsupported ? `${results.unsupported.time.toFixed(1)}s` : "—"}
              </div>
              <div style={{ fontSize: 13, color: "var(--itw-muted)" }}>
                {results.unsupported ? `${results.unsupported.calcErrors} adjustment attempts` : "—"}
              </div>
            </div>
          </div>

          <p className="itw-flow-lead" style={{ fontSize: 16, lineHeight: 1.6 }}>
            {results.baseline && results.unsupported && results.unsupported.time > results.baseline.time
              ? `In this round, calculating proportions in working memory changed your task time by ${(results.unsupported.time - results.baseline.time).toFixed(1)} seconds. When mathematical concepts lack a spatial visual representation, everyday conversions require significant mental strain. This task observes visual scaffolding in arithmetic, not diagnostic math ability.`
              : "In this round, calculating proportions in working memory required additional mental effort. When mathematical concepts lack a spatial visual representation, everyday conversions require significant mental strain. This task observes visual scaffolding in arithmetic, not diagnostic math ability."}
          </p>

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

          <div className="itw-flow-nav" style={{ marginTop: 24 }}>
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("run_unsupported")}>
              Re-run Task
            </button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("support")}>
              Try a Visual Accommodation →
            </button>
          </div>
        </div>
      )}

      {step === "support" && (
        <div className="itw-flow-page itw-flow-narrow" key="support">
          <h2 className="itw-flow-title itw-center">Ground numbers spatially: Choose a support</h2>
          <p className="itw-flow-lead itw-center">
            Children with dyscalculia benefit enormously from multi-sensory, spatial representations of quantity. Choose an environmental scaffold below:
          </p>
          <div style={{ display: "grid", gap: 14, margin: "24px 0" }}>
            {DYSCALC_SUPPORT_CHOICES.map((s) => (
              <label
                key={s.id}
                style={{
                  display: "block",
                  padding: "16px 20px",
                  borderRadius: 18,
                  border: `2px solid ${chosenSupport === s.id ? "var(--itw-dyscalculia)" : "var(--itw-border)"}`,
                  background: chosenSupport === s.id ? "rgba(29, 133, 133, 0.08)" : "var(--itw-panel)",
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
                  name="dyscalc-support"
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
            <h2 className="itw-flow-title">Run 3: Supported by {DYSCALC_SUPPORT_CHOICES.find((s) => s.id === chosenSupport)?.title}</h2>
            <p className="itw-flow-lead" style={{ margin: 0 }}>
              {chosenSupport === "numberline" && "A marked visual number line anchors spatial intervals so you don't have to calculate in the dark."}
              {chosenSupport === "blocks" && "Concrete 50g block units make quantities tactile and visible."}
              {chosenSupport === "scaffold" && "Ratio deconstruction scaffolds operations into clear one-step additions."}
            </p>
          </div>
          <DyscalculiaSim
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
            {results.supported && results.unsupported
              ? `Supported time was ${results.supported.time.toFixed(1)}s (versus ${results.unsupported.time.toFixed(1)}s when unsupported). Spatial tools transform abstract numbers into intuitive concepts.`
              : "Visual and concrete tools transform abstract numerical calculations into intuitive concepts."}
          </p>

          <div className="itw-flow-explain" style={{ margin: "24px 0" }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: "var(--itw-text)" }}>
              Understanding Numerical Cognition
            </h3>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--itw-text)", marginBottom: 16 }}>
              Dyscalculia is a specific learning difference that affects the brain's intraparietal sulcus, which is responsible
              for foundational number sense — our intuitive ability to gauge "how many" without counting (subitizing) and
              spatially map magnitudes along a mental number line.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--itw-text)" }}>
              Children with dyscalculia do not struggle because they are careless; they struggle because their brains translate
              digits into quantities differently. Providing graph paper, visual number lines, measuring manipulatives, and
              calculators allows them to demonstrate their strong conceptual reasoning.
            </p>
          </div>

          <div style={{ margin: "28px 0" }}>
            <div className="itw-block-label" style={{ marginBottom: 12 }}>Indian Prevalence &amp; Research Context</div>
            <FactsGrid
              facts={[
                {
                  num: "~8% (All SLDs)",
                  label: "pooled prevalence of Specific Learning Disorders (SLDs) overall across Indian school-aged cohorts (Scaria et al., 2023; 95% CI: 4%–11%), encompassing reading, writing, and mathematics, with dyscalculia specifically estimated at 3%–6% within clinical sub-analyses",
                  src: "Scaria, Bhaskaran & George (2023), Indian Systematic Review & Meta-Analysis of SLDs",
                },
                {
                  num: "Foundational",
                  label: "Developmental dyscalculia reflects a core neurocognitive difference in basic number representation, not general intelligence",
                  src: "Butterworth (2010), Developmental Dyscalculia and Foundational Number Modules",
                },
                {
                  num: "CRA Framework",
                  label: "Concrete-Representational-Abstract instructional scaffolding significantly boosts arithmetic fluency and conceptual transfer",
                  src: "Indian Academy of Pediatrics (IAP) Guidelines on Learning Disorders",
                },
              ]}
              note="Dyscalculia is an innate difference in numerical magnitude processing. In Indian academic settings, allowing calculators for higher-order science and using concrete manipulatives helps children excel without unnecessary computational stress."
              onComplete={() => {}}
            />
          </div>

          <div style={{ margin: "32px 0" }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14, color: "var(--itw-text)" }}>
              Actionable Strategies That Help
            </h3>
            <StrategyTabs
              home={[
                "Use concrete measuring cups and physical coins during cooking and shopping to anchor quantities in physical space.",
                "Provide visual analog clocks with color-coded intervals rather than purely digital numbers.",
                "Encourage finger-counting and tactile counters without stigma — they serve as essential external working memory.",
                "Break multi-step math homework into one problem per page to eliminate visual crowding.",
              ]}
              classroom={[
                "Provide grid or graph paper during arithmetic tasks to assist spatial column and decimal alignment.",
                "Permit the use of visual number lines and multiplication matrices during assessments.",
                "Separate grading of conceptual mathematical reasoning from raw mental arithmetic accuracy.",
                "Adopt the Concrete-Representational-Abstract (CRA) teaching progression across math concepts.",
              ]}
            />
          </div>

          <div className="itw-flow-nav" style={{ marginTop: 32 }}>
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("instructions")}>
              Try Dyscalculia flow again
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
          <h2 className="itw-flow-title itw-center">Numbers make sense with the right tools</h2>
          <p className="itw-flow-lead itw-center">
            When we replace abstract mental burdens with spatial and concrete representations, every learner can develop mathematical confidence.
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

/* ================= DYSGRAPHIA: Write It Down ================= */

const DYSGRAPH_STEPS = [
  { key: "instructions", label: "Instructions" },
  { key: "run_baseline", label: "Run 1 (Mental Clarity)" },
  { key: "unsupported_intro", label: "Transcription Brief" },
  { key: "run_unsupported", label: "Run 2 (Motor Bottleneck)" },
  { key: "reflect", label: "Reflect & Compare" },
  { key: "support", label: "Support Experiment" },
  { key: "explain", label: "Understanding & Action" },
];

const DYSGRAPH_STEP_INDEX = {
  instructions: 0,
  run_baseline: 1,
  unsupported_intro: 1,
  run_unsupported: 2,
  reflect: 3,
  support: 4,
  run_supported: 4,
  explain: 5,
};

const DYSGRAPH_REFLECT_QS = [
  {
    q: "During the manual transcription run, where did you notice the disconnect?",
    options: [
      "I knew the exact sentence in my head, but manual word transcription felt slow and fragmented.",
      "The physical effort of transcribing text drained cognitive energy away from the science ideas.",
      "Manual transcription demands competed directly with the working memory needed for formulating academic thoughts.",
      "Switching to voice dictation or structured concept blocks let my ideas flow directly onto the page.",
    ],
  },
];

const DYSGRAPH_SUPPORT_CHOICES = [
  {
    id: "dictation",
    title: "Voice Dictation / Speech-to-Text",
    subtitle: "Bypasses motor transcription entirely",
    desc: "Speak your thoughts aloud; speech recognition software converts your spoken ideas into clean text with zero physical motor strain.",
    tag: "Motor Bypass Accommodation",
  },
  {
    id: "wordbank",
    title: "Structured Concept & Sentence Bank",
    subtitle: "One-click phrase assembly",
    desc: "Scaffolds transcription by allowing the learner to tap core academic phrases to construct coherent syntax with 80% fewer motor actions.",
    tag: "Executive Scaffolding",
  },
  {
    id: "predictive",
    title: "Keyboard Assist with Word Prediction",
    subtitle: "Predictive academic autocomplete",
    desc: "Predicts multi-syllable scientific words after 1–2 letters, eliminating manual handwriting fatigue.",
    tag: "Assistive Technology",
  },
];

const DYSGRAPH_TARGET_WORDS = ["Plants", "absorb", "sunlight", "to", "produce", "glucose", "releasing", "oxygen"];

function DysgraphiaSim({ mode = "baseline", supportType = "dictation", onComplete, onAbort }) {
  const { soundOn } = useContext(SettingsContext);
  const [writtenLetters, setWrittenLetters] = useState([]);
  const [motorFatigue, setMotorFatigue] = useState(0);
  const [simplifiedText, setSimplifiedText] = useState("");
  const [usedVoice, setUsedVoice] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);

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

  const MIND_THOUGHT = "The mangrove root network traps river sediment, preventing shoreline erosion while nurturing juvenile marine species.";
  const TARGET_LETTERS = "The mangrove roots trap river sediment".split("");

  const handleWriteStroke = (letter) => {
    if (soundOn) audio.cue("tap");
    const nextLetters = [...writtenLetters, letter];
    setWrittenLetters(nextLetters);
    const newFatigue = Math.min(100, motorFatigue + 7);
    setMotorFatigue(newFatigue);

    // If fatigue gets very high, working memory is taxed and the student is forced to simplify!
    if (newFatigue >= 75 && !simplifiedText) {
      setSimplifiedText("Roots trap dirt.");
      if (soundOn) audio.cue("flicker");
    }

    if (nextLetters.length >= TARGET_LETTERS.length || newFatigue >= 95) {
      finishSim("manual", nextLetters.length, newFatigue);
    }
  };

  const handleDictateVoice = () => {
    if (soundOn) {
      audio.cue("slam");
      speakText(MIND_THOUGHT, { rate: 0.95, volume: 0.9 });
    }
    setUsedVoice(true);
    setWrittenLetters(MIND_THOUGHT.split(""));
    setMotorFatigue(0);

    setTimeout(() => {
      finishSim("dictation", MIND_THOUGHT.length, 0);
    }, 1200);
  };

  const finishSim = (method, charCount, fatigue) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRunning(false);
    const finalTime = parseFloat(((performance.now() - startTimeRef.current) / 1000).toFixed(1));
    onCompleteRef.current?.({
      time: finalTime,
      method,
      charCount,
      motorFatigue: fatigue,
      wasSimplified: Boolean(simplifiedText),
    });
  };

  return (
    <div className="itw-dysgraph-canvas" role="region" aria-label="Transcription Mechanics Simulation">
      {/* Top Status Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-dysgraphia)", letterSpacing: "0.08em" }}>
            {mode === "baseline" ? "Run 1 (Manual Graphomotor Transcription Bottleneck)" : "Run 2 (Supported Speech-to-Text Expression)"}
          </span>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--itw-paper-text)", margin: "4px 0" }}>
            Science Notebook: Coastal Ecology Hypothesis
          </h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--itw-paper-muted)" }}>
            ⏱️ {elapsed.toFixed(1)}s
          </span>
          <button type="button" className="itw-pill-btn" onClick={onAbort}>Exit</button>
        </div>
      </div>

      {/* The Crucial Contrast Split: Mind vs Paper */}
      <div className="itw-dysgraph-split">
        {/* Mind Box: Eloquent, rich, advanced biology */}
        <div className="itw-mind-panel">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>🧠</span>
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-dysgraphia)", letterSpacing: "0.06em" }}>
              The Idea in Your Mind (Oral / Conceptual Mastery)
            </span>
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.6, color: "var(--itw-text)", margin: 0 }}>
            &ldquo;{MIND_THOUGHT}&rdquo;
          </p>
          <div style={{ fontSize: 12, color: "var(--itw-muted)", marginTop: 10 }}>
            Vocabulary level: Advanced • Conceptual depth: Full • Pacing: Effortless
          </div>
        </div>

        {/* Paper Box: The manual transcription friction */}
        <div className="itw-paper-panel">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>✏️</span>
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-paper-muted)", letterSpacing: "0.06em" }}>
              The Physical Page (Graphomotor Output)
            </span>
          </div>

          <div style={{ minHeight: 70, fontSize: 18, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--itw-paper-text)", borderBottom: "2px solid #d4c8ad", paddingBottom: 8 }}>
            {writtenLetters.length === 0 ? (
              <span style={{ color: "var(--itw-paper-muted)", fontStyle: "italic", fontSize: 14 }}>
                {mode === "supported" ? "Click 'Dictate with Voice' below..." : "Form letters below to transcribe..."}
              </span>
            ) : (
              writtenLetters.join("")
            )}
          </div>

          {simplifiedText && (
            <div style={{ marginTop: 10, padding: 8, borderRadius: 8, background: "rgba(217, 56, 30, 0.1)", color: "#b3240e", fontSize: 13, fontWeight: 700 }}>
              ⚠️ Motor fatigue forced mental simplification: &ldquo;{simplifiedText}&rdquo; (The rich biology thought was abandoned due to hand cramping).
            </div>
          )}
        </div>
      </div>

      {/* Hand Muscle Fatigue & Motor Load Meter */}
      <div className="itw-fatigue-meter">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: motorFatigue > 60 ? "#d9381e" : "var(--itw-dysgraphia)" }}>
            ⚡ Hand Muscle Strain &amp; Fine-Motor Cognitive Load: {motorFatigue}%
          </span>
          <span style={{ fontSize: 12, color: "var(--itw-muted)" }}>
            {motorFatigue > 70 ? "High Cramping & Working Memory Choke" : "Normal"}
          </span>
        </div>
        <div className="itw-meter-bar">
          <div
            className="itw-meter-fill"
            style={{
              width: `${motorFatigue}%`,
              background: motorFatigue > 70 ? "#d9381e" : "var(--itw-dysgraphia)",
            }}
          />
        </div>
      </div>

      {/* Control Area */}
      <div style={{ marginTop: 20, textAlign: "center" }}>
        {mode === "supported" ? (
          <div>
            <button
              type="button"
              className="itw-cta itw-cta-dark"
              style={{ fontSize: 16, padding: "14px 28px", display: "inline-flex", alignItems: "center", gap: 10 }}
              onClick={handleDictateVoice}
            >
              🎙️ Dictate Entire Hypothesis with Voice (Speech-to-Text)
            </button>
            <div style={{ fontSize: 13, color: "var(--itw-muted)", marginTop: 8 }}>
              Voice recognition translates your oral fluency directly onto the page, bypassing motor strain.
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--itw-muted)", marginBottom: 10 }}>
              Form each letter manually (notice hand fatigue rising with every stroke):
            </div>
            <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 6 }}>
              {TARGET_LETTERS.slice(writtenLetters.length, writtenLetters.length + 8).map((char, i) => (
                <button
                  key={i}
                  type="button"
                  className="itw-pill-btn"
                  style={{
                    fontSize: 16,
                    padding: "8px 16px",
                    fontWeight: 800,
                    fontFamily: "var(--font-mono)",
                    borderColor: "var(--itw-dysgraphia)",
                  }}
                  onClick={() => handleWriteStroke(char)}
                >
                  {char === " " ? "[Space]" : char}
                </button>
              ))}
              <button
                type="button"
                className="itw-pill-btn"
                style={{ fontSize: 13, padding: "8px 16px", fontWeight: 700 }}
                onClick={() => finishSim("manual", writtenLetters.length, motorFatigue)}
              >
                Complete Attempt →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pedagogical Footer */}
      <div style={{ fontSize: 13, color: "var(--itw-muted)", textAlign: "center", marginTop: 18 }}>
        Notice the core insight: Dysgraphia is an output transcription barrier, never a thinking barrier.
      </div>
    </div>
  );
}
function DysgraphiaModule({ onBack, onNavigate }) {
  const [step, setStep] = useState("intro");
  const [results, setResults] = useState({ baseline: null, unsupported: null, supported: null });
  const [chosenSupport, setChosenSupport] = useState("dictation");
  const [reflectionAnswers, setReflectionAnswers] = useState([null]);

  const stepIndex = DYSGRAPH_STEP_INDEX[step];
  const more = MODULES.filter((m) => m.key !== "dysgraphia");

  const handleBaselineComplete = (data) => {
    setResults((prev) => ({ ...prev, baseline: data }));
    setStep("unsupported_intro");
  };

  const handleUnsupportedComplete = (data) => {
    setResults((prev) => ({ ...prev, unsupported: data }));
    setStep("reflect");
  };

  const handleSupportedComplete = (data) => {
    setResults((prev) => ({ ...prev, supported: data }));
    setStep("explain");
  };

  return (
    <section className="itw-view itw-module itw-flow" data-accent="dysgraphia">
      <FlowCrumbs name="Dysgraphia" onBack={onBack} />
      {stepIndex !== undefined && <FlowStepper steps={DYSGRAPH_STEPS} current={stepIndex} />}

      {step === "intro" && (
        <div className="itw-flow-page itw-flow-intro" key="intro">
          <div>
            <h2 className="itw-flow-title">Dysgraphia</h2>
            <div className="itw-flow-sub">Write It Down</div>
            <p className="itw-flow-lead">
              A child with dysgraphia may possess an extraordinary vocabulary, complex scientific insights, and vivid
              story ideas. But when asked to put pencil to paper, a neurological disconnect in the motor transcription
              pathway turns writing into an agonizing physical slog, creating hand cramps and disjointed output.
            </p>
            <ul className="itw-flow-meta">
              <li><span aria-hidden="true">⏱️</span> Takes 2–3 minutes</li>
              <li><span aria-hidden="true">✏️</span> Transcription bottleneck simulation</li>
              <li><span aria-hidden="true">🛡️</span> Empathy exercise, not a diagnostic test</li>
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
            <img src="/decor/itw/dysgraphia-environment.webp" alt="Biology class notebook desk" className="itw-scene-plate-img" />
            <div className="itw-scene-plate-overlay">
              <span className="itw-scene-tag">📍 Setting • Biology Class Notebook Table</span>
              <p className="itw-scene-caption">Formulating the hypothesis is effortless; translating the thought into hand muscle motor coordination is where fatigue gathers.</p>
            </div>
          </div>
          <h2 className="itw-flow-title itw-center">Before you begin Run 1</h2>
          <p className="itw-flow-lead itw-center">
            You know the biology hypothesis perfectly: <b>&ldquo;Plants absorb sunlight to produce glucose, releasing oxygen.&rdquo;</b>
          </p>
          <ul className="itw-flow-list">
            <li><span aria-hidden="true">🧠</span> Notice how clear, fluent, and effortless the idea feels in your mind.</li>
            <li><span aria-hidden="true">✍️</span> In Run 2, experience what happens when the mechanical transcription channel is heavily constrained.</li>
            <li><span aria-hidden="true">🎙️</span> In Run 3, test voice dictation to see how motor bypass accommodations unlock true student potential.</li>
          </ul>
          <div className="itw-flow-nav">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("intro")}>Back</button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => handleBaselineComplete({ time: 3.2 })}>
              Confirm Mental Clarity (Run 1) →
            </button>
          </div>
        </div>
      )}

      {step === "unsupported_intro" && (
        <div className="itw-flow-page itw-flow-narrow" key="unsupported_intro">
          <h2 className="itw-flow-title itw-center">Now, Run 2: The Physical Transcription Barrier</h2>
          <p className="itw-flow-lead itw-center">
            You must now physically transcribe the exact sentence into your science notebook.
          </p>
          <ul className="itw-flow-list">
            <li><span aria-hidden="true">✍️</span> Transcribe the full scientific sentence into your notebook word by word.</li>
            <li><span aria-hidden="true">🧠</span> Notice how the conscious mechanical focus of transcription drains working memory away from the science concepts.</li>
            <li><span aria-hidden="true">🛡️</span> In Run 3, test assistive supports (speech-to-text or concept blocks) that bypass this bottleneck.</li>
          </ul>
          <div className="itw-flow-nav">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("instructions")}>Back</button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("run_unsupported")}>
              Start Run 2 (Manual Transcription) →
            </button>
          </div>
        </div>
      )}

      {step === "run_unsupported" && (
        <div className="itw-flow-page" key="run_unsupported">
          <div className="itw-flow-readtop">
            <h2 className="itw-flow-title">Run 2: Motor Transcription Bottleneck</h2>
            <p className="itw-flow-lead" style={{ margin: 0 }}>Transcribe your sentence while experiencing motor drag and hand fatigue.</p>
          </div>
          <DysgraphiaSim mode="unsupported" onComplete={handleUnsupportedComplete} onAbort={() => setStep("unsupported_intro")} />
        </div>
      )}

      {step === "reflect" && (
        <div className="itw-flow-page itw-flow-narrow" key="reflect">
          <h2 className="itw-flow-title itw-center">What did you observe about transcription effort?</h2>
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
                Run 1 (Mental Clarity)
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "var(--itw-text)", margin: "8px 0" }}>
                {results.baseline ? `${results.baseline.time.toFixed(1)}s` : "—"}
              </div>
              <div style={{ fontSize: 13, color: "var(--itw-muted)" }}>Instant mental formulation</div>
            </div>
            <div style={{ textAlign: "center", padding: 12, borderLeft: "1px solid var(--itw-border)" }}>
              <div style={{ fontSize: 13, textTransform: "uppercase", color: "var(--itw-dysgraphia)", fontWeight: 700 }}>
                Run 2 (Motor Bottleneck)
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "var(--itw-dysgraphia)", margin: "8px 0" }}>
                {results.unsupported ? `${results.unsupported.time.toFixed(1)}s` : "—"}
              </div>
              <div style={{ fontSize: 13, color: "var(--itw-muted)" }}>
                {results.unsupported ? "Mechanical fatigue & pauses" : "—"}
              </div>
            </div>
          </div>

          <p className="itw-flow-lead" style={{ fontSize: 16, lineHeight: 1.6 }}>
            {results.baseline && results.unsupported && results.unsupported.time > results.baseline.time
              ? `In this round, the physical mechanics of transcription slowed output by ${(results.unsupported.time - results.baseline.time).toFixed(1)} seconds. Notice how the physical effort of letter formation drained energy away from scientific ideation. Dysgraphia is an execution difference, not a lack of intelligence or creativity. This task observes transcription load, not diagnostic ability.`
              : "In this round, the physical mechanics of transcription created significant drag. Dysgraphia is an execution difference, not a lack of intelligence or creativity. This task observes transcription load, not diagnostic ability."}
          </p>

          <FlowQuestions
            questions={DYSGRAPH_REFLECT_QS}
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
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("run_unsupported")}>
              Re-run Task
            </button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("support")}>
              Try an Assistive Support →
            </button>
          </div>
        </div>
      )}

      {step === "support" && (
        <div className="itw-flow-page itw-flow-narrow" key="support">
          <h2 className="itw-flow-title itw-center">Bypass motor drag: Choose an accommodation</h2>
          <p className="itw-flow-lead itw-center">
            Children with dysgraphia shine when evaluation separates knowledge from handwriting motor execution. Select a support:
          </p>
          <div style={{ display: "grid", gap: 14, margin: "24px 0" }}>
            {DYSGRAPH_SUPPORT_CHOICES.map((s) => (
              <label
                key={s.id}
                style={{
                  display: "block",
                  padding: "16px 20px",
                  borderRadius: 18,
                  border: `2px solid ${chosenSupport === s.id ? "var(--itw-dysgraphia)" : "var(--itw-border)"}`,
                  background: chosenSupport === s.id ? "rgba(178, 89, 40, 0.08)" : "var(--itw-panel)",
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
                  name="dysgraph-support"
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
            <h2 className="itw-flow-title">Run 3: Supported by {DYSGRAPH_SUPPORT_CHOICES.find((s) => s.id === chosenSupport)?.title}</h2>
            <p className="itw-flow-lead" style={{ margin: 0 }}>
              {chosenSupport === "dictation" && "Voice recognition converts speech into text instantly, bypassing fine-motor barriers."}
              {chosenSupport === "wordbank" && "Structured concept blocks scaffold syntax and reduce repetitive physical keystrokes."}
              {chosenSupport === "predictive" && "Word autocomplete assists rapid scientific phrase composition."}
            </p>
          </div>
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
          <h2 className="itw-flow-title itw-center">What this means in everyday life</h2>
          <p className="itw-flow-lead itw-center">
            {results.supported && results.unsupported
              ? `Supported time was ${results.supported.time.toFixed(1)}s (versus ${results.unsupported.time.toFixed(1)}s when unsupported). When motor barriers are lifted, deep learning becomes visible.`
              : "Assistive accommodations allow children to express their true knowledge without motor exhaustion."}
          </p>

          <div className="itw-flow-explain" style={{ margin: "24px 0" }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: "var(--itw-text)" }}>
              Separating Ideation from Transcription
            </h3>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--itw-text)", marginBottom: 16 }}>
              Writing requires two completely distinct neurological systems: <i>ideation</i> (generating thoughts, vocabulary,
              and argument structure) and <i>transcription</i> (the fine-motor and orthographic motor programming needed to form
              letters and spell words).
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--itw-text)" }}>
              In dysgraphia, the orthographic motor loop operates with severe friction. When educators grade a student’s knowledge
              strictly through their physical handwriting neatness or writing speed, they penalize the child’s motor coordination
              rather than their intellect.
            </p>
            <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--itw-text)", marginTop: 12 }}>
              <strong>ASHA &amp; Clinical Definition:</strong> The American Speech-Language-Hearing Association (ASHA) and DSM-5 categorize written expression differences into transcription mechanics (handwriting, orthographic letter-form retrieval, and typing fluidity) and text generation / ideation (organizing thoughts, paragraph sequencing, and narrative coherence). Supporting students requires targeting both dimensions: assistive tech (speech-to-text, keyboarding) for transcription, alongside visual graphic organizers and sentence frames for text generation.
            </p>
          </div>

          <div style={{ margin: "28px 0" }}>
            <div className="itw-block-label" style={{ marginBottom: 12 }}>Indian Prevalence &amp; Clinical Context</div>
            <FactsGrid
              facts={[
                {
                  num: "10% – 14%",
                  label: "of Indian school students referred for learning difficulties exhibit marked written expression and graphomotor barriers",
                  src: "Indian Journal of Pediatrics & AIISH Mysore Clinical Reports",
                },
                {
                  num: "Orthographic Loop",
                  label: "Dysgraphia stems from working-memory retrieval of letterforms and motor planning, distinct from intellectual capacity",
                  src: "Berninger & Wolf (2009), Teaching Students with Dyslexia and Dysgraphia",
                },
                {
                  num: "Assistive Rights",
                  label: "The Rights of Persons with Disabilities (RPwD) Act 2016 mandates scribes, oral exams, and extra time for specific learning disabilities",
                  src: "Ministry of Social Justice & Empowerment, Government of India",
                },
              ]}
              note="Dysgraphia affects motor output, not intellectual comprehension. Simple accommodations like speech-to-text, typed submissions, and oral examinations bridge the gap between brilliant thinking and written work."
              onComplete={() => {}}
            />
          </div>

          <div style={{ margin: "32px 0" }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14, color: "var(--itw-text)" }}>
              Actionable Strategies That Help
            </h3>
            <StrategyTabs
              home={[
                "Allow children to dictate homework drafts using speech recognition before touching a pencil or keyboard.",
                "Provide ergonomic triangular pencil grips or weighted pens to reduce hand muscle cramping.",
                "Focus home praise on the ideas and storytelling within a paragraph rather than handwriting neatness.",
                "Incorporate hand-strengthening play (putty, clay, fine-motor origami) in low-pressure contexts.",
              ]}
              classroom={[
                "Separate grading: assign one grade for conceptual understanding and another for handwriting mechanics.",
                "Provide printed class notes or lecture slides so students don't spend all working memory copying from the board.",
                "Permit laptops, speech-to-text tools, or scribes for long-form essay examinations.",
                "Offer extra time during written assessments to accommodate motor rest pauses.",
              ]}
            />
          </div>

          <div className="itw-flow-nav" style={{ marginTop: 32 }}>
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("instructions")}>
              Try Dysgraphia flow again
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
          <h2 className="itw-flow-title itw-center">Ideas deserve to be heard, however they are recorded</h2>
          <p className="itw-flow-lead itw-center">
            When we eliminate handwriting bottlenecks with modern assistive tools, we open doors for brilliant writers, scientists, and thinkers.
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

/* ================= AUDITORY PROCESSING: Hear It Right ================= */

const AUDITORY_STEPS = [
  { key: "instructions", label: "Instructions" },
  { key: "run_baseline", label: "Run 1 (Quiet Room)" },
  { key: "unsupported_intro", label: "Classroom Noise Brief" },
  { key: "run_unsupported", label: "Run 2 (Competing Noise)" },
  { key: "reflect", label: "Reflect & Compare" },
  { key: "support", label: "Support Experiment" },
  { key: "explain", label: "Understanding & Action" },
];

const AUDITORY_STEP_INDEX = {
  instructions: 0,
  run_baseline: 1,
  unsupported_intro: 1,
  run_unsupported: 2,
  reflect: 3,
  support: 4,
  run_supported: 4,
  explain: 5,
};

const AUDITORY_REFLECT_QS = [
  {
    q: "During the announcement with background classroom noise, where did you notice the difficulty?",
    options: [
      "I heard the sound of the teacher's voice, but separating words from background murmurs took intense focus.",
      "Crucial details like page numbers and notebook colors blurred together with ambient chatter.",
      "I had to strain so hard to filter out noise that I lost the overall context of the instructions.",
      "Having synchronized visual captions or audio isolation made catching every instruction effortless.",
    ],
  },
];

const AUDITORY_SUPPORT_CHOICES = [
  {
    id: "captions",
    title: "Synchronized Real-Time Visual Captions",
    subtitle: "Visual text accompaniment",
    desc: "Real-time speech-to-text projects the teacher's verbal directions word-for-word on a visual display.",
    tag: "Multi-Modal Scaffolding",
  },
  {
    id: "isolation",
    title: "Teacher Remote Microphone System",
    subtitle: "Clearer signal access over ambient noise",
    desc: "Uses a direct transmitter microphone to deliver the teacher's clear voice signal without room acoustic degradation or ambient chatter.",
    tag: "Acoustic Scaffolding",
  },
  {
    id: "chunking",
    title: "Segmented Verbal Chunks & Replay",
    subtitle: "Step-by-step audio segments",
    desc: "Replaces long, rapid verbal monologues with 3 bite-sized segments with dedicated replay buttons.",
    tag: "Pacing Scaffolding",
  },
];

const AUDITORY_INSTRUCTIONS = [
  { id: "read", text: "Read Chapter 4, pages 30 to 35 in textbook", noiseVersion: "Read chapter [murmur] pages 30 to 35 in [rustle]", decoys: ["Read Chapter 5, pages 30 to 35", "Read Chapter 4, pages 40 to 45"] },
  { id: "notes", text: "Answer questions 2 and 5 in blue notebook", noiseVersion: "Answer questions [chatter] and 5 in [scrape] notebook", decoys: ["Answer questions 2 and 3 in blue notebook", "Answer questions 2 and 5 in black notebook"] },
  { id: "lab", text: "Bring your project outline for Friday's lab", noiseVersion: "Bring your [cough] outline for [bell] lab", decoys: ["Bring your completed project for Friday's lab", "Bring your lab kit for Thursday's lab"] },
];

function AuditoryProcessingSim({ mode = "baseline", supportType = "captions", onComplete, onAbort }) {
  const { soundOn } = useContext(SettingsContext);
  const [selectedItems, setSelectedItems] = useState([]);
  const [elapsed, setElapsed] = useState(0);

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

  const handleToggleSelect = (itemText) => {
    if (soundOn) audio.cue("tap");
    let next;
    if (selectedItems.includes(itemText)) {
      next = selectedItems.filter((i) => i !== itemText);
    } else {
      next = [...selectedItems, itemText];
    }
    setSelectedItems(next);

    if (next.length === AUDITORY_INSTRUCTIONS.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (soundOn) audio.cue("slam");
      onCompleteRef.current?.({
        time: elapsed,
        selectedCount: next.length,
      });
    }
  };

  return (
    <div className="itw-auditory-classroom" role="region" aria-label="Classroom Auditory Processing Simulation">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-auditory)", letterSpacing: "0.08em" }}>
            Classroom Announcement • {mode === "baseline" ? "Quiet Setting" : mode === "unsupported" ? "Competing Noise" : "Supported Audio"}
          </span>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--itw-text)", margin: "4px 0" }}>
            Identify the Teacher's 3 Directions for Tomorrow
          </h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--itw-muted)" }}>
            ⏱️ {elapsed.toFixed(1)}s
          </span>
          <button type="button" className="itw-pill-btn" onClick={onAbort}>Exit</button>
        </div>
      </div>

      {/* Acoustic Waveform Visualization */}
      <div className="itw-waveform-bar" aria-hidden="true">
        {[4, 12, 28, 16, 34, 22, 10, 36, 18, 8, 30, 20, 14, 38, 24, 8].map((h, idx) => (
          <span
            key={idx}
            className="itw-wave-col"
            style={{
              height: mode === "unsupported" ? `${h}px` : `${Math.max(6, h * 0.5)}px`,
              opacity: mode === "unsupported" ? 0.9 : 0.4,
              animationDelay: `${idx * 0.08}s`,
            }}
          />
        ))}
      </div>

      {/* Visual Captions Overlay if supported */}
      {mode === "supported" && supportType === "captions" && (
        <div className="itw-captions-display">
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-auditory)", marginBottom: 4 }}>
            📝 Live Whiteboard Captions:
          </div>
          <div style={{ fontWeight: 700 }}>
            &ldquo;Tomorrow's homework: 1) Read chapter 4 pages 30 to 35, 2) Answer questions 2 and 5 in blue notebook, 3) Bring project outline for Friday lab.&rdquo;
          </div>
        </div>
      )}

      {/* Instruction Selection Options */}
      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--itw-muted)", marginBottom: 10 }}>
          Select the 3 correct directions given by the teacher ({selectedItems.length}/3 selected):
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {[
            { text: "Read Chapter 4, pages 30 to 35 in textbook", correct: true },
            { text: "Read Chapter 5, pages 30 to 35 in textbook", correct: false },
            { text: "Answer questions 2 and 5 in blue notebook", correct: true },
            { text: "Answer questions 2 and 3 in blue notebook", correct: false },
            { text: "Bring your project outline for Friday's lab", correct: true },
            { text: "Bring your completed project for Friday's lab", correct: false },
          ].map((opt) => {
            const isSelected = selectedItems.includes(opt.text);
            return (
              <button
                key={opt.text}
                type="button"
                onClick={() => handleToggleSelect(opt.text)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: `1.5px solid ${isSelected ? "var(--itw-auditory)" : "var(--itw-border)"}`,
                  background: isSelected ? "rgba(44, 82, 130, 0.12)" : "var(--itw-panel)",
                  cursor: "pointer",
                  textAlign: "left",
                  color: "var(--itw-text)",
                  font: "inherit",
                  fontSize: 14,
                }}
              >
                <span style={{ fontSize: 16 }}>{isSelected ? "☑️" : "⚪"}</span>
                <span>
                  {mode === "unsupported" && !opt.correct
                    ? opt.text.replace("Chapter 5", "Chapter [murmur]").replace("questions 2 and 3", "questions [noise]")
                    : opt.text}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AuditoryProcessingModule({ onBack, onNavigate }) {
  const [step, setStep] = useState("intro");
  const [results, setResults] = useState({ baseline: null, unsupported: null, supported: null });
  const [chosenSupport, setChosenSupport] = useState("captions");
  const [reflectionAnswers, setReflectionAnswers] = useState([null]);

  const stepIndex = AUDITORY_STEP_INDEX[step];
  const more = MODULES.filter((m) => m.key !== "auditory");

  const handleBaselineComplete = (data) => {
    setResults((prev) => ({ ...prev, baseline: data }));
    setStep("unsupported_intro");
  };

  const handleUnsupportedComplete = (data) => {
    setResults((prev) => ({ ...prev, unsupported: data }));
    setStep("reflect");
  };

  const handleSupportedComplete = (data) => {
    setResults((prev) => ({ ...prev, supported: data }));
    setStep("explain");
  };

  return (
    <section className="itw-view itw-module itw-flow" data-accent="auditory">
      <FlowCrumbs name="Auditory Processing" onBack={onBack} />
      {stepIndex !== undefined && <FlowStepper steps={AUDITORY_STEPS} current={stepIndex} />}

      {step === "intro" && (
        <div className="itw-flow-page itw-flow-intro" key="intro">
          <div>
            <h2 className="itw-flow-title">Auditory Processing</h2>
            <div className="itw-flow-sub">Hear It Right</div>
            <p className="itw-flow-lead">
              Having normal physical hearing does not guarantee clear auditory understanding. In an active classroom,
              background murmurs, scraping chairs, and corridor chatter compete directly with the teacher's voice.
              For children with auditory processing differences, separating speech from noise requires tremendous cognitive effort.
            </p>
            <ul className="itw-flow-meta">
              <li><span aria-hidden="true">⏱️</span> Takes 2–3 minutes</li>
              <li><span aria-hidden="true">🎧</span> Speech-in-noise perception exercise</li>
              <li><span aria-hidden="true">🛡️</span> Empathy exercise, not an audiometric test</li>
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
            <img src="/decor/itw/auditory-processing-environment.webp" alt="Resonant lecture hall" className="itw-scene-plate-img" />
            <div className="itw-scene-plate-overlay">
              <span className="itw-scene-tag">📍 Setting • Resonant Classroom & Hallway</span>
              <p className="itw-scene-caption">Listening across background fan hum, shoe scuffs, and hallway echoes to isolate spoken instructions.</p>
            </div>
          </div>
          <h2 className="itw-flow-title itw-center">Before you begin Run 1</h2>
          <p className="itw-flow-lead itw-center">
            You will listen for 3 homework instructions given by the teacher at the end of class.
          </p>
          <ul className="itw-flow-list">
            <li><span aria-hidden="true">🌿</span> In Run 1, the classroom is completely quiet, making speech identification straightforward.</li>
            <li><span aria-hidden="true">📢</span> In Run 2, you will experience acoustic figure-ground competition amidst classroom murmurs.</li>
            <li><span aria-hidden="true">📝</span> In Run 3, test live captions and audio isolation to see how environmental supports restore clarity.</li>
          </ul>
          <div className="itw-flow-nav">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("intro")}>Back</button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("run_baseline")}>
              Start Run 1 (Quiet Room) →
            </button>
          </div>
        </div>
      )}

      {step === "run_baseline" && (
        <div className="itw-flow-page" key="run_baseline">
          <div className="itw-flow-readtop">
            <h2 className="itw-flow-title">Run 1: Clear, Quiet Announcement</h2>
            <p className="itw-flow-lead" style={{ margin: 0 }}>Notice how effortlessly speech is parsed when background acoustic noise is absent.</p>
          </div>
          <AuditoryProcessingSim mode="baseline" onComplete={handleBaselineComplete} onAbort={() => setStep("instructions")} />
        </div>
      )}

      {step === "unsupported_intro" && (
        <div className="itw-flow-page itw-flow-narrow" key="unsupported_intro">
          <h2 className="itw-flow-title itw-center">Now, Run 2: Competing Classroom Murmurs</h2>
          <p className="itw-flow-lead itw-center">
            The bell is about to ring. Students are packing books, chairs are moving, and hallway voices blend with the announcement.
          </p>
          <ul className="itw-flow-list">
            <li><span aria-hidden="true">🎧</span> Crucial phonemes and words will be masked by ambient chatter.</li>
            <li><span aria-hidden="true">⚠️</span> Look out for phonetically similar decoys (e.g. Chapter 4 vs Chapter 5).</li>
            <li><span aria-hidden="true">🧠</span> Notice how listening in noise drains working memory away from actually retaining the content.</li>
          </ul>
          <div className="itw-flow-nav">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("run_baseline")}>Back to Run 1</button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("run_unsupported")}>
              Start Run 2 (Competing Noise) →
            </button>
          </div>
        </div>
      )}

      {step === "run_unsupported" && (
        <div className="itw-flow-page" key="run_unsupported">
          <div className="itw-flow-readtop">
            <h2 className="itw-flow-title">Run 2: Listening Under Competing Noise</h2>
            <p className="itw-flow-lead" style={{ margin: 0 }}>Filter out ambient sounds to identify the 3 specific instructions.</p>
          </div>
          <AuditoryProcessingSim mode="unsupported" onComplete={handleUnsupportedComplete} onAbort={() => setStep("unsupported_intro")} />
        </div>
      )}

      {step === "reflect" && (
        <div className="itw-flow-page itw-flow-narrow" key="reflect">
          <h2 className="itw-flow-title itw-center">What did you observe about speech discrimination in noise?</h2>
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
              <div style={{ fontSize: 13, color: "var(--itw-muted)" }}>0 acoustic competition</div>
            </div>
            <div style={{ textAlign: "center", padding: 12, borderLeft: "1px solid var(--itw-border)" }}>
              <div style={{ fontSize: 13, textTransform: "uppercase", color: "var(--itw-auditory)", fontWeight: 700 }}>
                Run 2 (Competing Noise)
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "var(--itw-auditory)", margin: "8px 0" }}>
                {results.unsupported ? `${results.unsupported.time.toFixed(1)}s` : "—"}
              </div>
              <div style={{ fontSize: 13, color: "var(--itw-muted)" }}>
                {results.unsupported ? "Phonetic masking & strain" : "—"}
              </div>
            </div>
          </div>

          <p className="itw-flow-lead" style={{ fontSize: 16, lineHeight: 1.6 }}>
            {results.baseline && results.unsupported && results.unsupported.time > results.baseline.time
              ? `In this round, background noise increased processing time by ${(results.unsupported.time - results.baseline.time).toFixed(1)} seconds. Notice how separating speech from background noise required intense cognitive effort even though your hearing is intact. Central auditory processing describes how the brain decodes sound, not ear sensitivity. This task is an observation of acoustic load, not an audiogram.`
              : "In this round, background noise required additional cognitive filtering. Central auditory processing describes how the brain decodes sound, not ear sensitivity. This task is an observation of acoustic load, not an audiogram."}
          </p>

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

          <div className="itw-flow-nav" style={{ marginTop: 24 }}>
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("run_unsupported")}>
              Re-run Task
            </button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("support")}>
              Try an Acoustic Support →
            </button>
          </div>
        </div>
      )}

      {step === "support" && (
        <div className="itw-flow-page itw-flow-narrow" key="support">
          <h2 className="itw-flow-title itw-center">Restore clarity: Choose an environmental support</h2>
          <p className="itw-flow-lead itw-center">
            Children with auditory processing differences benefit from multi-sensory visual cues and clean acoustic signals:
          </p>
          <div style={{ display: "grid", gap: 14, margin: "24px 0" }}>
            {AUDITORY_SUPPORT_CHOICES.map((s) => (
              <label
                key={s.id}
                style={{
                  display: "block",
                  padding: "16px 20px",
                  borderRadius: 18,
                  border: `2px solid ${chosenSupport === s.id ? "var(--itw-auditory)" : "var(--itw-border)"}`,
                  background: chosenSupport === s.id ? "rgba(44, 82, 130, 0.08)" : "var(--itw-panel)",
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
                  name="auditory-support"
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
            <h2 className="itw-flow-title">Run 3: Supported by {AUDITORY_SUPPORT_CHOICES.find((s) => s.id === chosenSupport)?.title}</h2>
            <p className="itw-flow-lead" style={{ margin: 0 }}>
              {chosenSupport === "captions" && "Live visual captions reinforce the spoken instructions on the whiteboard."}
              {chosenSupport === "isolation" && "Teacher Remote Mic provides direct, clear acoustic access to the teacher's voice over ambient chatter."}
              {chosenSupport === "chunking" && "Segmented audio allows replay of discrete directions."}
            </p>
          </div>
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
          <h2 className="itw-flow-title itw-center">What this means in everyday life</h2>
          <p className="itw-flow-lead itw-center">
            {results.supported && results.unsupported
              ? `Supported time was ${results.supported.time.toFixed(1)}s (versus ${results.unsupported.time.toFixed(1)}s in noise). Environmental supports ensure that hearing what is said translates into understanding.`
              : "Acoustic and visual accommodations allow every child to catch essential directions without exhausting mental strain."}
          </p>

          <div className="itw-flow-explain" style={{ margin: "24px 0" }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: "var(--itw-text)" }}>
              Understanding Auditory Figure-Ground Perception
            </h3>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--itw-text)", marginBottom: 16 }}>
              Central Auditory Processing Disorder (CAPD/APD) is not a problem with the ears or hearing thresholds; pure-tone
              audiograms almost always return completely normal results. The difference lies in the central auditory nervous
              system’s ability to separate target speech from competing ambient noise (auditory figure-ground discrimination).
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--itw-text)" }}>
              In busy, tiled Indian classrooms with high reverberation, fans, and street traffic, an APD student may catch only
              isolated consonants. Accommodations such as preferential seating, FM listening systems, and pairing spoken directions
              with written bullet points prevent these students from falling behind.
            </p>
            <p style={{ fontSize: 14, color: "var(--itw-muted)", fontStyle: "italic", marginTop: 12 }}>
              Note: Spoken instructions in this activity are in English. In multilingual environments, acoustic clarity interacts with language familiarity and vocabulary.
            </p>
            <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--itw-text)", marginTop: 12 }}>
              <strong>Clinical Assessment &amp; Differential Diagnosis:</strong> An official diagnosis of Auditory Processing Disorder (APD) can only be established by a licensed audiologist using specialized behavioral and electrophysiological test batteries in a sound-treated booth. APD frequently co-occurs with and must be carefully distinguished from speech-language impairments, attention differences (ADHD), and typical auditory fatigue.
            </p>
          </div>

          <div style={{ margin: "28px 0" }}>
            <div className="itw-block-label" style={{ marginBottom: 12 }}>Indian Prevalence &amp; Clinical Context</div>
            <FactsGrid
              facts={[
                {
                  num: "~3% – 5%",
                  label: "of school-aged children experience Central Auditory Processing differences, often misdiagnosed as attention deficits",
                  src: "American Academy of Audiology (AAA) & AIISH Mysore Clinical Guidelines",
                },
                {
                  num: "Signal Clarity",
                  label: "In reverberant classrooms with ceiling fans and echo, background noise masks weak speech consonants; remote microphone systems deliver direct acoustic clarity to the listener",
                  src: "All India Institute of Speech and Hearing (AIISH Mysore) Classroom Acoustics Studies",
                },
                {
                  num: "Multilingual",
                  label: "Navigating bilingual Indian environments adds acoustic phonetic processing load, amplifying the need for visual captions",
                  src: "Indian Journal of Otolaryngology and Head & Neck Surgery",
                },
              ]}
              note="Auditory processing describes neural speech perception, not ear sensitivity. Simple accommodations like preferential seating, visual summaries, and personal FM systems restore complete clarity."
              onComplete={() => {}}
            />
          </div>

          <div style={{ margin: "32px 0" }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14, color: "var(--itw-text)" }}>
              Actionable Strategies That Help
            </h3>
            <StrategyTabs
              home={[
                "Gain the child’s gentle visual attention (a tap on the shoulder, eye contact) before speaking important instructions.",
                "Reduce competing domestic sound: turn down televisions or kitchen appliances when explaining tasks.",
                "Ask the child to paraphrase what they heard in their own words rather than asking “did you understand?”.",
                "Break multi-step household chores into single, sequential instructions with visual checklists.",
              ]}
              classroom={[
                "Seat the student near the front of the classroom, away from open windows, doors, and noisy ceiling fans.",
                "Always write homework directions and deadlines on the whiteboard in addition to announcing them verbally.",
                "Use an FM personal listening system or teacher microphone where available in large reverberant rooms.",
                "Slow down your speaking tempo slightly and pause between sentences to allow phonetic processing.",
              ]}
            />
          </div>

          <div className="itw-flow-nav" style={{ marginTop: 32 }}>
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("instructions")}>
              Try Auditory Processing flow again
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
          <h2 className="itw-flow-title itw-center">Clarity begins with listening environments</h2>
          <p className="itw-flow-lead itw-center">
            When we pair speech with visual anchors and clean acoustics, we build inclusive spaces where every child can learn without strain.
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

/* ================= EXECUTIVE FUNCTIONING: Where Do I Start? ================= */

const EXEC_STEPS = [
  { key: "instructions", label: "Instructions" },
  { key: "run_baseline", label: "Run 1 (Single Step)" },
  { key: "unsupported_intro", label: "Morning Scramble Brief" },
  { key: "run_unsupported", label: "Run 2 (Competing Pile)" },
  { key: "reflect", label: "Reflect & Compare" },
  { key: "support", label: "Support Experiment" },
  { key: "explain", label: "Understanding & Action" },
];

const EXEC_STEP_INDEX = {
  instructions: 0,
  run_baseline: 1,
  unsupported_intro: 1,
  run_unsupported: 2,
  reflect: 3,
  support: 4,
  run_supported: 4,
  explain: 5,
};

const EXEC_REFLECT_QS = [
  {
    q: "During the unorganized morning task scramble, where did you notice the executive friction?",
    options: [
      "All 5 tasks felt equally urgent, making it difficult to decide which one to initiate first.",
      "Hitting a hidden prerequisite (like packing a bag before finishing homework) broke my mental rhythm.",
      "Keeping track of elapsed time while sequencing dependencies created cognitive overload.",
      "Having a Now / Next / Later board or Visual Dependency Map eliminated hesitation about where to begin.",
    ],
  },
];

const EXEC_SUPPORT_CHOICES = [
  {
    id: "nnl",
    title: "Now / Next / Later 3-Column Board",
    subtitle: "Separates immediate action from subsequent steps",
    desc: "Groups morning routines into 3 clear time horizons: what to do right now, what unlocks next, and what to finish later.",
    tag: "Visual Organization",
  },
  {
    id: "roadmap",
    title: "Visual Dependency Map",
    subtitle: "Illustrates what depends on what",
    desc: "Displays an illustrative visual roadmap with clear prerequisite connections so the order of execution is immediately apparent.",
    tag: "Structural Scaffolding",
  },
  {
    id: "one_step",
    title: "One-Next-Step Decomposition",
    subtitle: "Surfaces only the single immediate action",
    desc: "Completely hides the overwhelming multi-task list, presenting only the single immediate next action in a focused card.",
    tag: "Executive Scaffolding",
  },
];

const EXEC_TASKS = [
  { id: "slip", title: "1. Sign Science Museum Field Trip Slip", desc: "Parent is leaving in 5 minutes! Must be signed before bag packing.", category: "prereq", unlocks: "pack" },
  { id: "math", title: "2. Complete Last 2 Math Problems", desc: "Science & math worksheet due today. Must finish before packing.", category: "prereq", unlocks: "pack" },
  { id: "uniform", title: "3. Put on School Uniform & Shoes", desc: "Cannot leave house without proper dress code.", category: "routine", unlocks: "bus" },
  { id: "pack", title: "4. Pack Backpack with Books & Signed Slip", desc: "Requires signed slip + finished math worksheet inside.", category: "next", requires: ["slip", "math"] },
  { id: "breakfast", title: "5. Eat Nutritious Morning Breakfast", desc: "Fuel for the day before walking out to the bus stop.", category: "routine", unlocks: "bus" },
];

function ExecutiveFunctioningSim({ mode = "baseline", supportType = "nnl", onComplete, onAbort }) {
  const { soundOn } = useContext(SettingsContext);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [elapsed, setElapsed] = useState(0);

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

  const handleTaskClick = (task) => {
    setErrorMsg(null);

    // Prerequisite checks
    if (task.requires) {
      const missing = task.requires.filter((r) => !completedTasks.includes(r));
      if (missing.length > 0) {
        if (soundOn) audio.cue("flicker");
        setErrorMsg("ℹ️ Sequence Guidance: Packing the backpack requires the signed permission slip and completed math sheet first.");
        return;
      }
    }

    if (soundOn) audio.cue("tap");
    const next = [...completedTasks, task.id];
    setCompletedTasks(next);

    const targetTotal = mode === "baseline" ? 1 : EXEC_TASKS.length;
    if (next.length >= targetTotal) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (soundOn) audio.cue("slam");
      onCompleteRef.current?.({
        time: elapsed,
        tasksCount: next.length,
      });
    }
  };

  // One-Next-Step support filter: show only first incomplete task
  const nextPendingTask = EXEC_TASKS.find((t) => !completedTasks.includes(t.id));

  return (
    <div style={{ background: "var(--itw-panel-2)", padding: 24, borderRadius: 20, border: "1.5px solid var(--itw-border)" }} role="region" aria-label="Executive Functioning Morning Planning Task">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-executive)", letterSpacing: "0.08em" }}>
            Morning Routine • 7:30 AM (Bus in 25 mins)
          </span>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--itw-text)", margin: "4px 0" }}>
            {mode === "baseline" ? "Single Action Step" : "Prioritize & Complete All 5 Tasks"}
          </h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--itw-muted)" }}>
            ⏱️ {elapsed.toFixed(1)}s
          </span>
          <button type="button" className="itw-pill-btn" onClick={onAbort}>Exit</button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: "rgba(140, 101, 32, 0.12)", border: "1.5px solid var(--itw-adhd)", borderRadius: 12, padding: "10px 14px", color: "var(--itw-text)", fontSize: 13.5, fontWeight: 700, marginBottom: 14 }}>
          {errorMsg}
        </div>
      )}

      {/* Visual Dependency Map Overlay if active */}
      {mode === "supported" && supportType === "roadmap" && (
        <div className="itw-dep-map">
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--itw-executive)", marginBottom: 8 }}>
            🗺️ Visual Dependency Map (What Depends on What):
          </div>
          <div className="itw-dep-item" style={{ background: "rgba(46, 125, 50, 0.08)" }}>
            <span>1. Sign Permission Slip</span>
            <span style={{ fontWeight: 800, color: "var(--itw-executive)" }}>➔</span>
            <span>4. Pack Backpack</span>
            <span style={{ fontWeight: 800, color: "var(--itw-executive)" }}>➔</span>
            <span>Ready for 7:55 AM School Bus</span>
          </div>
          <div className="itw-dep-item" style={{ background: "rgba(46, 125, 50, 0.08)" }}>
            <span>2. Complete Math Homework</span>
            <span style={{ fontWeight: 800, color: "var(--itw-executive)" }}>➔</span>
            <span>4. Pack Backpack</span>
          </div>
        </div>
      )}

      {/* One-Next-Step Accommodation */}
      {mode === "supported" && supportType === "one_step" && nextPendingTask && (
        <div style={{ background: "var(--itw-panel)", border: "2px solid var(--itw-executive)", borderRadius: 16, padding: 24, textAlign: "center", margin: "16px 0" }}>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-executive)", letterSpacing: "0.08em", marginBottom: 6 }}>
            🛡️ One-Next-Step Scaffolding: Focus Only on This
          </div>
          <h4 style={{ fontSize: 22, fontWeight: 800, color: "var(--itw-text)", marginBottom: 8 }}>
            {nextPendingTask.title}
          </h4>
          <p style={{ fontSize: 15, color: "var(--itw-muted)", maxWidth: "46ch", margin: "0 auto 20px" }}>
            {nextPendingTask.desc}
          </p>
          <button
            type="button"
            className="itw-cta itw-cta-dark"
            onClick={() => handleTaskClick(nextPendingTask)}
          >
            Complete This Action ✓
          </button>
        </div>
      )}

      {/* Now / Next / Later 3-Column Board */}
      {mode === "supported" && supportType === "nnl" && (
        <div className="itw-nnl-container">
          <div className="itw-nnl-col">
            <div className="itw-nnl-col-header" style={{ color: "var(--itw-executive)" }}>
              <span>⚡ NOW (Immediate)</span>
            </div>
            {EXEC_TASKS.filter((t) => t.category === "prereq").map((task) => {
              const isDone = completedTasks.includes(task.id);
              return (
                <button
                  key={task.id}
                  type="button"
                  className={`itw-exec-task-card${isDone ? " itw-task-done" : ""}`}
                  disabled={isDone}
                  onClick={() => handleTaskClick(task)}
                  style={{ marginBottom: 10 }}
                >
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{task.title}</div>
                  <div style={{ fontSize: 12, color: "var(--itw-muted)" }}>{task.desc}</div>
                </button>
              );
            })}
          </div>

          <div className="itw-nnl-col">
            <div className="itw-nnl-col-header" style={{ color: "var(--itw-autism)" }}>
              <span>📦 NEXT (Unlocked)</span>
            </div>
            {EXEC_TASKS.filter((t) => t.category === "next").map((task) => {
              const isDone = completedTasks.includes(task.id);
              const isReady = task.requires && task.requires.every((r) => completedTasks.includes(r));
              return (
                <button
                  key={task.id}
                  type="button"
                  className={`itw-exec-task-card${isDone ? " itw-task-done" : ""}${!isReady && !isDone ? " itw-task-locked" : ""}`}
                  disabled={isDone}
                  onClick={() => handleTaskClick(task)}
                  style={{ marginBottom: 10 }}
                >
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{task.title}</div>
                  <div style={{ fontSize: 12, color: "var(--itw-muted)" }}>{task.desc}</div>
                </button>
              );
            })}
          </div>

          <div className="itw-nnl-col">
            <div className="itw-nnl-col-header" style={{ color: "var(--itw-speech)" }}>
              <span>🌅 LATER (Routine)</span>
            </div>
            {EXEC_TASKS.filter((t) => t.category === "routine").map((task) => {
              const isDone = completedTasks.includes(task.id);
              return (
                <button
                  key={task.id}
                  type="button"
                  className={`itw-exec-task-card${isDone ? " itw-task-done" : ""}`}
                  disabled={isDone}
                  onClick={() => handleTaskClick(task)}
                  style={{ marginBottom: 10 }}
                >
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{task.title}</div>
                  <div style={{ fontSize: 12, color: "var(--itw-muted)" }}>{task.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Standard Board for baseline / unsupported / roadmap */}
      {!(mode === "supported" && (supportType === "one_step" || supportType === "nnl")) && (
        <div className="itw-exec-board">
          {(mode === "baseline" ? [EXEC_TASKS[0]] : EXEC_TASKS).map((task) => {
            const isDone = completedTasks.includes(task.id);
            const isLocked = task.requires && task.requires.some((r) => !completedTasks.includes(r));
            return (
              <button
                key={task.id}
                type="button"
                className={`itw-exec-task-card${isDone ? " itw-task-done" : ""}${isLocked ? " itw-task-locked" : ""}`}
                disabled={isDone}
                onClick={() => handleTaskClick(task)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: isDone ? "var(--itw-executive)" : "var(--itw-muted)" }}>
                    {isDone ? "✓ Done" : isLocked ? "🔒 Prerequisite needed" : "Ready to Start"}
                  </span>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "var(--itw-panel-2)", color: "var(--itw-muted)" }}>
                    {task.category}
                  </span>
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "var(--itw-text)" }}>{task.title}</div>
                <div style={{ fontSize: 13, color: "var(--itw-muted)", lineHeight: 1.4 }}>{task.desc}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ExecutiveFunctioningModule({ onBack, onNavigate }) {
  const [step, setStep] = useState("intro");
  const [results, setResults] = useState({ baseline: null, unsupported: null, supported: null });
  const [chosenSupport, setChosenSupport] = useState("matrix");
  const [reflectionAnswers, setReflectionAnswers] = useState([null]);

  const stepIndex = EXEC_STEP_INDEX[step];
  const more = MODULES.filter((m) => m.key !== "executive");

  const handleBaselineComplete = (data) => {
    setResults((prev) => ({ ...prev, baseline: data }));
    setStep("unsupported_intro");
  };

  const handleUnsupportedComplete = (data) => {
    setResults((prev) => ({ ...prev, unsupported: data }));
    setStep("reflect");
  };

  const handleSupportedComplete = (data) => {
    setResults((prev) => ({ ...prev, supported: data }));
    setStep("explain");
  };

  return (
    <section className="itw-view itw-module itw-flow" data-accent="executive">
      <FlowCrumbs name="Executive Functioning" onBack={onBack} />
      {stepIndex !== undefined && <FlowStepper steps={EXEC_STEPS} current={stepIndex} />}

      {step === "intro" && (
        <div className="itw-flow-page itw-flow-intro" key="intro">
          <div>
            <h2 className="itw-flow-title">Executive Functioning</h2>
            <div className="itw-flow-sub">Where Do I Start?</div>
            <p className="itw-flow-lead">
              Executive functions are the brain’s management system: organizing, prioritizing, initiating, and holding
              steps in working memory. When multiple tasks arrive simultaneously without clear external scaffolding,
              everything feels equally urgent, leading to hesitation and difficulty determining where to start rather than a lack of motivation.
            </p>
            <ul className="itw-flow-meta">
              <li><span aria-hidden="true">⏱️</span> Takes 2–3 minutes</li>
              <li><span aria-hidden="true">🗂️</span> Morning routine prioritization exercise</li>
              <li><span aria-hidden="true">🛡️</span> Empathy exercise, not a diagnostic test</li>
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
            <img src="/decor/itw/executive-functioning-environment.webp" alt="Morning organization desk" className="itw-scene-plate-img" />
            <div className="itw-scene-plate-overlay">
              <span className="itw-scene-tag">📍 Setting • Morning Organization & Planning Desk</span>
              <p className="itw-scene-caption">Sorting priorities, managing sequential steps, and holding multiple deadlines in active working memory.</p>
            </div>
          </div>
          <h2 className="itw-flow-title itw-center">Before you begin Run 1</h2>
          <p className="itw-flow-lead itw-center">
            You will test your prioritization during a busy school morning routine.
          </p>
          <ul className="itw-flow-list">
            <li><span aria-hidden="true">🌿</span> In Run 1, you will complete a single structured action to understand the interface.</li>
            <li><span aria-hidden="true">🗂️</span> In Run 2, you will manage 5 competing tasks with hidden dependencies and time pressure.</li>
            <li><span aria-hidden="true">🛡️</span> In Run 3, test how Now / Next / Later boards and Visual Dependency Maps provide actionable clarity.</li>
          </ul>
          <div className="itw-flow-nav">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("intro")}>Back</button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("run_baseline")}>
              Start Run 1 (Single Step) →
            </button>
          </div>
        </div>
      )}

      {step === "run_baseline" && (
        <div className="itw-flow-page" key="run_baseline">
          <div className="itw-flow-readtop">
            <h2 className="itw-flow-title">Run 1: Single Structured Action</h2>
            <p className="itw-flow-lead" style={{ margin: 0 }}>Notice how simple execution is when only one isolated action is presented.</p>
          </div>
          <ExecutiveFunctioningSim mode="baseline" onComplete={handleBaselineComplete} onAbort={() => setStep("instructions")} />
        </div>
      )}

      {step === "unsupported_intro" && (
        <div className="itw-flow-page itw-flow-narrow" key="unsupported_intro">
          <h2 className="itw-flow-title itw-center">Now, Run 2: The Morning Scramble</h2>
          <p className="itw-flow-lead itw-center">
            It is 7:30 AM. The school bus arrives in 25 minutes. 5 competing tasks are on your list, and some require prerequisites!
          </p>
          <ul className="itw-flow-list">
            <li><span aria-hidden="true">🎒</span> You cannot pack your backpack until the field trip slip is signed and math homework is finished.</li>
            <li><span aria-hidden="true">⚠️</span> Notice how holding dependencies in working memory while sequencing tasks creates cognitive friction.</li>
          </ul>
          <div className="itw-flow-nav">
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("run_baseline")}>Back to Run 1</button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("run_unsupported")}>
              Start Run 2 (Competing Pile) →
            </button>
          </div>
        </div>
      )}

      {step === "run_unsupported" && (
        <div className="itw-flow-page" key="run_unsupported">
          <div className="itw-flow-readtop">
            <h2 className="itw-flow-title">Run 2: Competing Tasks Without Scaffolding</h2>
            <p className="itw-flow-lead" style={{ margin: 0 }}>Navigate dependencies to prepare for school on time.</p>
          </div>
          <ExecutiveFunctioningSim mode="unsupported" onComplete={handleUnsupportedComplete} onAbort={() => setStep("unsupported_intro")} />
        </div>
      )}

      {step === "reflect" && (
        <div className="itw-flow-page itw-flow-narrow" key="reflect">
          <h2 className="itw-flow-title itw-center">What did you observe about task initiation and sequencing?</h2>
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
                Run 1 (Single Task)
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "var(--itw-text)", margin: "8px 0" }}>
                {results.baseline ? `${results.baseline.time.toFixed(1)}s` : "—"}
              </div>
              <div style={{ fontSize: 13, color: "var(--itw-muted)" }}>0 sequencing decisions</div>
            </div>
            <div style={{ textAlign: "center", padding: 12, borderLeft: "1px solid var(--itw-border)" }}>
              <div style={{ fontSize: 13, textTransform: "uppercase", color: "var(--itw-executive)", fontWeight: 700 }}>
                Run 2 (Competing Pile)
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "var(--itw-executive)", margin: "8px 0" }}>
                {results.unsupported ? `${results.unsupported.time.toFixed(1)}s` : "—"}
              </div>
              <div style={{ fontSize: 13, color: "var(--itw-muted)" }}>
                {results.unsupported ? "Dependency tracking & friction" : "—"}
              </div>
            </div>
          </div>

          <p className="itw-flow-lead" style={{ fontSize: 16, lineHeight: 1.6 }}>
            {results.baseline && results.unsupported && results.unsupported.time > results.baseline.time
              ? `In this round, tracking dependencies and priorities changed your task time by ${(results.unsupported.time - results.baseline.time).toFixed(1)} seconds. Notice how deciding which task to begin and holding prerequisites in memory created hesitation. Executive functioning differences affect execution and sequencing, not intelligence or willpower. This task is an observation of organizational scaffolding, not a diagnostic test.`
              : "In this round, tracking dependencies and priorities required additional cognitive overhead. Executive functioning differences affect execution and sequencing, not intelligence or willpower. This task is an observation of organizational scaffolding, not a diagnostic test."}
          </p>

          <FlowQuestions
            questions={EXEC_REFLECT_QS}
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
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("run_unsupported")}>
              Re-run Task
            </button>
            <button type="button" className="itw-cta itw-cta-dark" onClick={() => setStep("support")}>
              Try an Organizational Support →
            </button>
          </div>
        </div>
      )}

      {step === "support" && (
        <div className="itw-flow-page itw-flow-narrow" key="support">
          <h2 className="itw-flow-title itw-center">Deconstruct the pile: Choose a support</h2>
          <p className="itw-flow-lead itw-center">
            Children with executive functioning differences excel when multi-step routines are broken down visually:
          </p>
          <div style={{ display: "grid", gap: 14, margin: "24px 0" }}>
            {EXEC_SUPPORT_CHOICES.map((s) => (
              <label
                key={s.id}
                style={{
                  display: "block",
                  padding: "16px 20px",
                  borderRadius: 18,
                  border: `2px solid ${chosenSupport === s.id ? "var(--itw-executive)" : "var(--itw-border)"}`,
                  background: chosenSupport === s.id ? "rgba(46, 125, 50, 0.08)" : "var(--itw-panel)",
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
                  name="exec-support"
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
            <h2 className="itw-flow-title">Run 3: Supported by {EXEC_SUPPORT_CHOICES.find((s) => s.id === chosenSupport)?.title}</h2>
            <p className="itw-flow-lead" style={{ margin: 0 }}>
              {chosenSupport === "one_step" && "One-Next-Step hides the mountain and surfaces only the single immediate action."}
              {chosenSupport === "nnl" && "Now / Next / Later categorizes tasks into 3 clear time horizons so you know exactly where to begin."}
              {chosenSupport === "roadmap" && "Visual Dependency Map illustrates what depends on what so sequencing is intuitive."}
            </p>
          </div>
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
          <h2 className="itw-flow-title itw-center">What this means in everyday life</h2>
          <p className="itw-flow-lead itw-center">
            {results.supported && results.unsupported
              ? `Supported time was ${results.supported.time.toFixed(1)}s (versus ${results.unsupported.time.toFixed(1)}s when unsupported). Breaking routines into visible steps unlocks self-sufficiency.`
              : "Visual sequencing and single-step decomposition transform overwhelming routines into manageable actions."}
          </p>

          <div className="itw-flow-explain" style={{ margin: "24px 0" }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: "var(--itw-text)" }}>
              Understanding Executive Functioning
            </h3>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--itw-text)", marginBottom: 16 }}>
              Executive functions encompass working memory, cognitive flexibility, and inhibitory control. They reside in
              the prefrontal cortex and govern our ability to initiate tasks, anticipate deadlines, estimate time, and organize
              materials.
            </p>
            <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--itw-text)", marginBottom: 16 }}>
              <strong>Clinical &amp; Diagnostic Distinction:</strong> Executive functioning is not a standalone psychiatric diagnosis in the DSM-5; rather, it describes a suite of core neurocognitive processes coordinated by the prefrontal cortex. Executive differences commonly co-occur with ADHD, autism, specific learning differences, and stress.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--itw-text)" }}>
              When a child hesitates or leaves multi-step projects until the last hour, it is rarely due to apathy or defiance.
              The sheer cognitive load of deciding <i>which</i> step to begin creates initiation hesitation. Providing
              visual dependency maps, Now / Next / Later boards, and single-step decomposition removes this barrier.
            </p>
          </div>

          <div style={{ margin: "28px 0" }}>
            <div className="itw-block-label" style={{ marginBottom: 12 }}>Indian Prevalence &amp; Clinical Context</div>
            <FactsGrid
              facts={[
                {
                  num: "30% – 40%",
                  label: "co-occurrence with ADHD, autism, dyslexia, and stress; executive differences are widespread across pediatric neurotypes",
                  src: "Diamond (2013), Executive Functions Annual Review of Psychology",
                },
                {
                  num: "Task Initiation",
                  label: "Difficulty starting tasks is a working-memory gating difference, not defiance or poor work ethic",
                  src: "Dawson & Guare (2018), Executive Skills in Children and Adolescents",
                },
                {
                  num: "External Scaffolding",
                  label: "Using visible checklists, visual timers, and step chunking offloads working memory and fosters autonomy",
                  src: "Indian Academy of Pediatrics Clinical Guidelines on Adolescent Mental Health",
                },
              ]}
              note="Executive functioning governs planning and initiation. Externalizing steps with visual checklists and timers enables children to overcome overwhelm and build lifelong independence."
              onComplete={() => {}}
            />
          </div>

          <div style={{ margin: "32px 0" }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14, color: "var(--itw-text)" }}>
              Actionable Strategies That Help
            </h3>
            <StrategyTabs
              home={[
                "Replace broad instructions like “clean your room” with specific atomic steps: “Put the books on the shelf first”.",
                "Use a visual analog timer (like a Time Timer) to make remaining time visible rather than abstract.",
                "Post a morning and evening visual schedule by the bedroom door with Velcro or checkmark toggles.",
                "Practice backward planning: start at the deadline and map out milestone checkpoints backwards.",
              ]}
              classroom={[
                "Break large multi-week term papers into graded weekly milestones (outline, bibliography, draft).",
                "Provide an organized binder system with labeled color-coded folders for each subject.",
                "Provide an explicit transition warning 2–3 minutes before switching subjects or activities.",
                "Allow students to begin assignments with the easiest step first to build task initiation momentum.",
              ]}
            />
          </div>

          <div className="itw-flow-nav" style={{ marginTop: 32 }}>
            <button type="button" className="itw-cta itw-cta-line" onClick={() => setStep("instructions")}>
              Try Executive Functioning flow again
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
          <h2 className="itw-flow-title itw-center">Independence grows through clear structures</h2>
          <p className="itw-flow-lead itw-center">
            When we replace overwhelming lists with visual roadmaps and compassionate support, every child can develop lifelong organizational skills.
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


/* ---------------- Root ---------------- */


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

function DownSyndromeStory({ onBack, onNavigate }) {
  const { soundOn } = useContext(SettingsContext);
  const [currentPage, setCurrentPage] = useState(0);
  const [turnDir, setTurnDir] = useState("next");
  const [turnKey, setTurnKey] = useState(0);

  const PAGES = [
    {
      title: "Morning Sunlight & Visual Schedule",
      subtitle: "8:00 AM • Inclusive Primary School, Chennai",
      image: "/decor/itw/down-syndrome-story.webp",
      alt: "Aarav smiling at his visual learning schedule in the morning classroom",
      quote: "“My visual schedule cards show me the shape of the day. When I see the picture for gardening and painting, I know exactly what to look forward to!”",
      narrative: "For Aarav (age 9), having clear visual anchors reduces transition anxiety and builds autonomy. Visual memory is often a notable strength in children with Down syndrome — sequencing pictures anchors concepts far faster than spoken instructions alone.",
      insight: "Visual schedules and predictable routines allow children to navigate complex school days with confidence.",
      badge: "Visual Anchor Strength",
    },
    {
      title: "Hands in the Soil: Planting Together",
      subtitle: "10:30 AM • School Learning Garden",
      image: "/decor/itw/hero-world.webp",
      alt: "Children working together in the inclusive school garden planting seeds",
      quote: "“Diya digs the soft earth, and I carefully place the seeds. I like feeling the damp soil with my fingers. When we water them, we cheer together!”",
      narrative: "Peer-mediated inclusion thrives in cooperative, hands-on tasks. Tactile activities engage motor planning and sensory regulation while fostering authentic social friendships where every child contributes their strengths.",
      insight: "Real peer inclusion happens through shared meaningful activities, not isolated intervention rooms.",
      badge: "Cooperative Peer Learning",
    },
    {
      title: "Hands-On Science: Learning by Touching",
      subtitle: "1:15 PM • Classroom Laboratory Table",
      image: "/decor/itw/science-lab-story.webp",
      alt: "Diverse children examining botanical specimens under a microscope in science lab",
      quote: "“Teacher gives me the real plant and a big magnifying glass! I can count all the leaf veins. My friends come to ask me what the green chloroplasts look like.”",
      narrative: "Abstract textbook definitions can feel opaque, but concrete multi-sensory manipulatives bridge understanding effortlessly. When concepts are experienced physically, retention and expressive participation soar.",
      insight: "Concrete-Representational-Abstract (CRA) learning unlocks deep scientific curiosity.",
      badge: "Multi-Sensory Discovery",
    },
    {
      title: "Celebrating Every Milestone",
      subtitle: "3:30 PM • Courtyard Farewell",
      image: "/decor/itw/day-through-my-eyes.webp",
      alt: "Children walking happily together in the sunny school courtyard at the end of the day",
      quote: "“My teacher gives me a big smile and high-five. I tied my shoelaces all by myself today! I smiled all the way to the school bus.”",
      narrative: "Development in Down syndrome is not a race against a rigid timeline; it is a rich journey of steady progress. When schools measure growth by personal milestones rather than uniform speed, children thrive with unshakeable self-worth.",
      insight: "Dignity, patience, and celebrating authentic milestones form the cornerstone of inclusive education.",
      badge: "Strength-Based Milestone",
    },
  ];

  const turnToPage = (newPage) => {
    if (newPage === currentPage || newPage < 0 || newPage >= PAGES.length) return;
    const dir = newPage > currentPage ? "next" : "prev";
    setTurnDir(dir);
    setTurnKey((k) => k + 1);
    playPageTurnSound(soundOn);
    setCurrentPage(newPage);
  };

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
  }, [currentPage]);

  const page = PAGES[currentPage];

  return (
    <section className="itw-view itw-module itw-flow" data-accent="autism">
      <FlowCrumbs name="Down Syndrome Story" onBack={onBack} />

      <div className="itw-story-exhibit">
        {/* Story Header (Clean, unhurried, no duplicate titles!) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-autism)", letterSpacing: "0.08em" }}>
              Illustrated Children&apos;s Storybook • Aarav&apos;s Day
            </span>
            <h2 style={{ fontSize: "clamp(1.5rem, 2.6vw, 2.1rem)", fontWeight: 800, color: "var(--itw-text)", margin: "3px 0 0" }}>
              A Story of Belonging & Growth
            </h2>
          </div>
          <button type="button" className="itw-pill-btn" onClick={onBack}>← Back to Experiences</button>
        </div>

        {/* Physical Storybook Casing */}
        <div className="itw-storybook-casing">
          {/* Top Bookmark Ribbon Tabs */}
          <div className="itw-book-top-tabs" role="tablist" aria-label="Storybook moments">
            {PAGES.map((p, idx) => (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={idx === currentPage}
                className={`itw-book-tab${idx === currentPage ? " itw-active" : ""}`}
                onClick={() => turnToPage(idx)}
              >
                <span>🔖</span>
                <span>Moment {idx + 1}: {p.title.split(":")[0]}</span>
              </button>
            ))}
          </div>

          {/* Open Two-Page Storybook Spread */}
          <div className="itw-storybook-spread">
            {/* Left Page: Illustration Plate */}
            <div
              className={`itw-storybook-art-page ${turnDir === "prev" ? "itw-page-turn-prev" : "itw-page-flip-anim"}`}
              key={`ds-left-${turnKey}`}
            >
              {/* Top-Left Corner Curl (Turn Back) */}
              {currentPage > 0 && (
                <div
                  className="itw-book-corner-curl-prev"
                  title={`Turn back to Moment ${currentPage}`}
                  onClick={() => turnToPage(currentPage - 1)}
                  role="button"
                  tabIndex={0}
                  aria-label="Previous moment"
                />
              )}

              {/* Dynamic crease shadow when turning forward */}
              {turnDir === "next" && <div className="itw-page-crease-shadow" aria-hidden="true" />}

              <div className="itw-storybook-art-frame">
                <img
                  src={page.image}
                  alt={page.alt}
                  className="itw-storybook-art-img"
                  loading="eager"
                />
                <span className="itw-storybook-art-badge">{page.badge}</span>
              </div>
              <div className="itw-storybook-caption-plaque">
                <span>📍</span>
                <span>{page.subtitle}</span>
              </div>
              <div className="itw-book-left-folio">
                <span>Plate {currentPage + 1} of {PAGES.length}</span>
                <span>Chennai Inclusive Primary</span>
              </div>
            </div>

            {/* Book Spine Crease */}
            <div className="itw-book-spine" aria-hidden="true" />

            {/* Right Page: Story, Quote, Insight & In-Page Turn Navigation */}
            <div
              className={`itw-storybook-text-page ${turnDir === "next" ? "itw-page-turn-next" : "itw-page-flip-anim"}`}
              key={`ds-right-${turnKey}`}
            >
              {/* Sweeping Light Sheen on Bending Page */}
              <div className="itw-page-turn-sheen" aria-hidden="true" />

              {/* Curled Paper Dog-Ear (Top-Right Turn Next) */}
              {currentPage < PAGES.length - 1 && (
                <div
                  className="itw-book-corner-curl"
                  title={`Turn to Moment ${currentPage + 2}`}
                  onClick={() => turnToPage(currentPage + 1)}
                  role="button"
                  tabIndex={0}
                  aria-label="Turn page"
                />
              )}

              <div className="itw-storybook-chapter-ribbon">
                <span>Moment {currentPage + 1} of {PAGES.length}</span>
                <span className="itw-storybook-time-tag">Aarav&apos;s Day</span>
              </div>

              <h3 className="itw-storybook-page-title">{page.title}</h3>

              <div className="itw-storybook-quote-card">
                <p>{page.quote}</p>
              </div>

              <div className="itw-storybook-prose">
                <p>{page.narrative}</p>
              </div>

              <div className="itw-storybook-insight-box">
                <div className="itw-insight-title">
                  <span>💡</span> Pedagogical Insight
                </div>
                <p>{page.insight}</p>
              </div>

              {/* IN-PAGE NAVIGATION (Close by & immediately visible!) */}
              <div className="itw-book-inpage-nav">
                <button
                  type="button"
                  className="itw-book-turn-btn itw-book-turn-prev"
                  disabled={currentPage === 0}
                  onClick={() => turnToPage(currentPage - 1)}
                >
                  ← Turn Back
                </button>

                <div className="itw-book-page-dots" aria-label="Page selection">
                  {PAGES.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`itw-book-dot${idx === currentPage ? " itw-active" : ""}`}
                      onClick={() => turnToPage(idx)}
                      aria-label={`Go to moment ${idx + 1}`}
                    />
                  ))}
                </div>

                {currentPage < PAGES.length - 1 ? (
                  <button
                    type="button"
                    className="itw-book-turn-btn itw-book-turn-next"
                    onClick={() => turnToPage(currentPage + 1)}
                  >
                    Turn Page →
                  </button>
                ) : (
                  <button
                    type="button"
                    className="itw-book-turn-btn itw-book-turn-next"
                    onClick={() => onNavigate("autism")}
                  >
                    Explore Autism Experience →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DayThroughMyEyesStory({ onBack, onNavigate }) {
  const { soundOn } = useContext(SettingsContext);
  const [activePeriod, setActivePeriod] = useState(0);
  const [activeLens, setActiveLens] = useState("sensory"); // sensory | attention | communication | supported
  const [turnDir, setTurnDir] = useState("next");
  const [turnKey, setTurnKey] = useState(0);

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
      supported: "✨ Accommodations in action: Noise-dampening acoustic curtains, standing near the calm edge, and visual assembly agenda cards allow full, relaxed participation.",
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
      supported: "✨ Accommodations in action: AAC concept cards, small group roles with clear task breakdowns, and a visual step-by-step experiment board unlock my full scientific insight.",
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
      supported: "✨ Accommodations in action: A quiet sensory garden corner, designated lunch buddy system, and unhurried seating options make lunch a time of genuine restoration.",
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
      supported: "✨ Accommodations in action: Speech-to-text dictation, reading rulers with tinted focus overlays, and digital notebooks ensure my academic comprehension is fully recognized.",
    },
  ];

  const turnToPeriod = (newPeriod) => {
    if (newPeriod === activePeriod || newPeriod < 0 || newPeriod >= PERIODS.length) return;
    const dir = newPeriod > activePeriod ? "next" : "prev";
    setTurnDir(dir);
    setTurnKey((k) => k + 1);
    playPageTurnSound(soundOn);
    setActivePeriod(newPeriod);
  };

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
  }, [activePeriod]);

  const current = PERIODS[activePeriod];

  return (
    <section className="itw-view itw-module itw-flow" data-accent="adhd">
      <FlowCrumbs name="A Day Through My Eyes" onBack={onBack} />

      <div className="itw-story-exhibit">
        {/* Story Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--itw-adhd)", letterSpacing: "0.08em" }}>
              Multi-Sensory Storybook • 4 School Day Periods
            </span>
            <h2 style={{ fontSize: "clamp(1.5rem, 2.6vw, 2.1rem)", fontWeight: 800, color: "var(--itw-text)", margin: "3px 0 0" }}>
              A Day Through My Eyes
            </h2>
          </div>
          <button type="button" className="itw-pill-btn" onClick={onBack}>← Back to Experiences</button>
        </div>

        {/* Physical Storybook Casing */}
        <div className="itw-storybook-casing">
          {/* Top Bookmark Ribbon Tabs */}
          <div className="itw-book-top-tabs" role="tablist" aria-label="School day periods">
            {PERIODS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={idx === activePeriod}
                className={`itw-book-tab${idx === activePeriod ? " itw-active" : ""}`}
                onClick={() => turnToPeriod(idx)}
              >
                <span>⏰</span>
                <span>{p.time}: {p.title.split("&")[0]}</span>
              </button>
            ))}
          </div>

          {/* Open Two-Page Storybook Spread */}
          <div className="itw-storybook-spread">
            {/* Left Page: Period Environment Illustration Plate */}
            <div
              className={`itw-storybook-art-page ${turnDir === "prev" ? "itw-page-turn-prev" : "itw-page-flip-anim"}`}
              key={`eyes-left-${turnKey}`}
            >
              {/* Top-Left Corner Curl (Turn Back) */}
              {activePeriod > 0 && (
                <div
                  className="itw-book-corner-curl-prev"
                  title={`Turn back to Period ${activePeriod}`}
                  onClick={() => turnToPeriod(activePeriod - 1)}
                  role="button"
                  tabIndex={0}
                  aria-label="Previous period"
                />
              )}

              {/* Dynamic crease shadow when turning forward */}
              {turnDir === "next" && <div className="itw-page-crease-shadow" aria-hidden="true" />}

              <div className="itw-storybook-art-frame">
                <img
                  src={current.image}
                  alt={current.alt}
                  className="itw-storybook-art-img"
                  loading="eager"
                />
                <span className="itw-storybook-art-badge">📍 {current.time}</span>
              </div>
              <div className="itw-storybook-caption-plaque">
                <span>🏫</span>
                <span><strong>Setting:</strong> {current.setting}</span>
              </div>
              <div className="itw-book-left-folio">
                <span>Period {activePeriod + 1} of {PERIODS.length}</span>
                <span>{current.time} Schedule</span>
              </div>
            </div>

            {/* Book Spine Crease */}
            <div className="itw-book-spine" aria-hidden="true" />

            {/* Right Page: Perspective Lens & Story Page */}
            <div
              className={`itw-storybook-text-page ${turnDir === "next" ? "itw-page-turn-next" : "itw-page-flip-anim"}`}
              key={`eyes-right-${turnKey}`}
            >
              {/* Sweeping Light Sheen on Bending Page */}
              <div className="itw-page-turn-sheen" aria-hidden="true" />

              {/* Curled Paper Dog-Ear */}
              {activePeriod < PERIODS.length - 1 && (
                <div
                  className="itw-book-corner-curl"
                  title={`Turn to Period ${activePeriod + 2}`}
                  onClick={() => turnToPeriod(activePeriod + 1)}
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

              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--itw-text)", marginTop: 2 }}>
                Experience through different lenses:
              </div>
              <div className="itw-lens-switcher" role="radiogroup" aria-label="Perspective lenses">
                <button
                  type="button"
                  className={`itw-lens-btn${activeLens === "sensory" ? " itw-active" : ""}`}
                  onClick={() => setActiveLens("sensory")}
                  style={{ background: activeLens === "sensory" ? "var(--itw-autism)" : undefined }}
                >
                  🌿 Sensory
                </button>
                <button
                  type="button"
                  className={`itw-lens-btn${activeLens === "attention" ? " itw-active" : ""}`}
                  onClick={() => setActiveLens("attention")}
                  style={{ background: activeLens === "attention" ? "var(--itw-adhd)" : undefined }}
                >
                  🧠 Attention
                </button>
                <button
                  type="button"
                  className={`itw-lens-btn${activeLens === "communication" ? " itw-active" : ""}`}
                  onClick={() => setActiveLens("communication")}
                  style={{ background: activeLens === "communication" ? "var(--itw-speech)" : undefined }}
                >
                  💬 Speech
                </button>
                <button
                  type="button"
                  className={`itw-lens-btn${activeLens === "supported" ? " itw-active" : ""}`}
                  onClick={() => setActiveLens("supported")}
                  style={{ background: activeLens === "supported" ? "#2e7d32" : undefined }}
                >
                  ✨ Supported
                </button>
              </div>

              {/* Lens Content Box */}
              <div className="itw-storybook-quote-card" style={{
                background: activeLens === "supported" ? "rgba(46, 125, 50, 0.09)" : undefined,
                borderLeftColor: activeLens === "supported" ? "#2e7d32" : undefined,
              }}>
                <p style={{ fontStyle: "normal", fontSize: "1.06rem" }}>
                  {current[activeLens]}
                </p>
              </div>

              <div className="itw-storybook-insight-box">
                <div className="itw-insight-title">
                  <span>💡</span> Observation
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
                  disabled={activePeriod === 0}
                  onClick={() => turnToPeriod(activePeriod - 1)}
                >
                  ← Turn Back
                </button>

                <div className="itw-book-page-dots" aria-label="Period selection">
                  {PERIODS.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`itw-book-dot${idx === activePeriod ? " itw-active" : ""}`}
                      onClick={() => turnToPeriod(idx)}
                      aria-label={`Go to period ${idx + 1}`}
                    />
                  ))}
                </div>

                {activePeriod < PERIODS.length - 1 ? (
                  <button
                    type="button"
                    className="itw-book-turn-btn itw-book-turn-next"
                    onClick={() => turnToPeriod(activePeriod + 1)}
                  >
                    Turn to Next Period →
                  </button>
                ) : (
                  <button
                    type="button"
                    className="itw-book-turn-btn itw-book-turn-next"
                    onClick={() => onNavigate("autism")}
                  >
                    Try Interactive Simulations →
                  </button>
                )}
              </div>
            </div>
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
    return () => {
      document.body.style.background = prevBg;
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
