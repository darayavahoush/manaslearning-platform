import React, { useState, useEffect, useRef } from "react";
import CueIcon from "./CueIcon";

/**
 * Calm Quiet Corner scene with warm Web Audio synth pad for "What Helps".
 */
export default function QuietCorner({ className = "" }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => {
      // Clean up synth on unmount
      if (audioRef.current) {
        audioRef.current.stop();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleSound = () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.stop();
        audioRef.current = null;
      }
      setIsPlaying(false);
    } else {
      const pad = startWarmPad();
      audioRef.current = pad;
      setIsPlaying(true);
    }
  };

  return (
    <div className={`itw-quiet-corner ${className}`.trim()}>
      <div className="itw-quiet-corner-scene" aria-label="Quiet corner sensory reset space">
        <svg
          viewBox="0 0 520 280"
          className="itw-quiet-corner-svg"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="qc-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#dce8e1" />
              <stop offset="100%" stopColor="#edf3ef" />
            </linearGradient>
            <linearGradient id="qc-lamp-glow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff8db" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#fff2b3" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#fff2b3" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="qc-wall" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f5f7f3" />
              <stop offset="100%" stopColor="#eaf0ea" />
            </linearGradient>
            <linearGradient id="qc-cushion" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a3bfae" />
              <stop offset="100%" stopColor="#7a9a86" />
            </linearGradient>
          </defs>

          {/* Room Wall */}
          <rect width="520" height="280" fill="url(#qc-wall)" rx="16" />

          {/* Wooden Floor */}
          <rect y="228" width="520" height="52" fill="#ebe4d8" />
          <line x1="0" y1="228" x2="520" y2="228" stroke="#d5ccbe" strokeWidth="2" />
          <line x1="80" y1="228" x2="60" y2="280" stroke="#dfd6c7" strokeWidth="1.2" />
          <line x1="210" y1="228" x2="190" y2="280" stroke="#dfd6c7" strokeWidth="1.2" />
          <line x1="360" y1="228" x2="340" y2="280" stroke="#dfd6c7" strokeWidth="1.2" />

          {/* Window looking out */}
          <g transform="translate(42, 32)">
            <rect width="110" height="150" rx="55" fill="url(#qc-sky)" stroke="#cbdad0" strokeWidth="3" />
            <line x1="55" y1="0" x2="55" y2="150" stroke="#cbdad0" strokeWidth="2.5" />
            <line x1="0" y1="88" x2="110" y2="88" stroke="#cbdad0" strokeWidth="2.5" />
            {/* Distant gentle hill */}
            <path d="M0 135 Q55 110 110 130 L110 150 L0 150 Z" fill="#c3d7cb" opacity="0.6" />
          </g>

          {/* Soft round woven rug */}
          <ellipse cx="290" cy="242" rx="145" ry="24" fill="#dee8e0" stroke="#cbd8ce" strokeWidth="1.5" />
          <ellipse cx="290" cy="242" rx="120" ry="18" fill="#e7efe9" />

          {/* Warm Floor Lamp with gentle glow */}
          <g transform="translate(390, 75)">
            {/* Lamp shade */}
            <path d="M12 28 L36 28 L42 58 L6 58 Z" fill="#fffbe8" stroke="#e0d6b8" strokeWidth="1.5" />
            {/* Glow cone */}
            <polygon points="6,58 42,58 72,170 -24,170" fill="url(#qc-lamp-glow)" />
            {/* Stem & base */}
            <line x1="24" y1="58" x2="24" y2="162" stroke="#687a70" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="24" cy="162" rx="18" ry="4" fill="#586960" />
          </g>

          {/* Cozy Armchair / Beanbag */}
          <g transform="translate(210, 138)">
            {/* Backrest cushion */}
            <rect x="20" y="0" width="130" height="95" rx="28" fill="url(#qc-cushion)" stroke="#678371" strokeWidth="2" />
            {/* Seat cushion */}
            <rect x="10" y="48" width="150" height="48" rx="22" fill="#88a894" stroke="#678371" strokeWidth="2" />
            {/* Throw pillow */}
            <rect x="35" y="42" width="46" height="38" rx="12" fill="#fff0da" transform="rotate(-8 35 42)" stroke="#dec8ad" strokeWidth="1.5" />
            {/* Chair legs */}
            <line x1="28" y1="94" x2="20" y2="108" stroke="#586960" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="142" y1="94" x2="150" y2="108" stroke="#586960" strokeWidth="3.5" strokeLinecap="round" />
          </g>

          {/* Wooden wall shelf with plant and books */}
          <g transform="translate(190, 48)">
            <rect width="130" height="8" rx="3" fill="#bfae98" />
            {/* Potted plant */}
            <path d="M22 8 L32 8 L30 -6 L24 -6 Z" fill="#d9826c" />
            <path d="M27 -6 Q18 -22 14 -12 Q14 -5 27 -6" fill="#69927b" />
            <path d="M27 -6 Q36 -24 38 -14 Q36 -5 27 -6" fill="#7ba38d" />
            <path d="M27 -6 Q27 -26 25 -16" stroke="#5a806b" strokeWidth="2" fill="none" />
            {/* Two soft books */}
            <rect x="52" y="-18" width="8" height="26" rx="2" fill="#7fa090" />
            <rect x="62" y="-14" width="7" height="22" rx="2" fill="#dec8ad" />
            <rect x="71" y="-12" width="6" height="20" rx="2" fill="#93b0a2" />
          </g>

          {/* Wall peg with noise-reducing headphones */}
          <g transform="translate(350, 42)">
            <circle cx="10" cy="10" r="4" fill="#a4937d" />
            {/* Hanging headphones */}
            <path d="M-2 20 Q10 10 22 20" fill="none" stroke="#374d41" strokeWidth="3.5" strokeLinecap="round" />
            <rect x="-6" y="20" width="8" height="15" rx="4" fill="#446152" stroke="#2c3f35" strokeWidth="1.2" />
            <rect x="18" y="20" width="8" height="15" rx="4" fill="#446152" stroke="#2c3f35" strokeWidth="1.2" />
          </g>
        </svg>
      </div>

      <div className="itw-quiet-corner-bar">
        <div className="itw-quiet-corner-info">
          <div className="itw-quiet-corner-title">
            <CueIcon name="headphones" size={16} />
            <span>Low-Stimulation Quiet Sanctuary</span>
          </div>
          <p className="itw-quiet-corner-dek">
            Dim indirect lighting, soft textures, and noise-reducing headphones allow a sensory system in overdrive to decompress safely.
          </p>
        </div>
        <button
          type="button"
          className={`itw-btn-ghost itw-quiet-sound-btn${isPlaying ? " itw-active" : ""}`}
          onClick={toggleSound}
          aria-pressed={isPlaying}
        >
          {isPlaying ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: "-2px", marginRight: 6 }}>
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
              <span>Mute calm pad</span>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: "-2px", marginRight: 6 }}>
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
              <span>Play calm pad</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * Pure Web Audio synthesizer: Warm, gentle Cmaj9 pad with slow attack and safe volume.
 */
function startWarmPad() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  const ctx = new AudioCtx();
  if (ctx.state === "suspended") ctx.resume();

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, ctx.currentTime);
  // Gentle 2-second ramp up, capped at super-safe 0.06 gain
  master.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 2.0);

  // Warm low-pass filter
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 420;
  filter.Q.value = 1.0;

  filter.connect(master);
  master.connect(ctx.destination);

  // Cmaj9 warm chord: C3, G3, B3, E4, plus subtle chorus detune
  const freqs = [130.81, 196.0, 246.94, 329.63];
  const oscs = [];

  freqs.forEach((freq) => {
    // Primary warm sine
    const o1 = ctx.createOscillator();
    o1.type = "sine";
    o1.frequency.value = freq;
    o1.connect(filter);
    o1.start();
    oscs.push(o1);

    // Subtle detuned triangle for body
    const o2 = ctx.createOscillator();
    o2.type = "triangle";
    o2.frequency.value = freq;
    o2.detune.value = 4;
    const g2 = ctx.createGain();
    g2.gain.value = 0.35;
    o2.connect(g2);
    g2.connect(filter);
    o2.start();
    oscs.push(o2);
  });

  return {
    stop() {
      try {
        const now = ctx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(master.gain.value, now);
        master.gain.linearRampToValueAtTime(0.0001, now + 1.2);
        setTimeout(() => {
          oscs.forEach((o) => {
            try {
              o.stop();
            } catch {}
          });
          try {
            ctx.close();
          } catch {}
        }, 1300);
      } catch {}
    },
  };
}
