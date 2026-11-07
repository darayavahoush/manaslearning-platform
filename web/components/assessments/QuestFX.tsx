"use client";
import { useEffect, useRef, useState } from "react";

export function QuestStyles() {
  return (
    <style>{`
@keyframes qd-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.qd-stage{animation:qd-in .5s ease both}
@keyframes qd-fly{0%,100%{transform:translate(0,0);opacity:.15}50%{transform:translate(16px,-26px);opacity:.9}}
.qd-fly{position:absolute;width:6px;height:6px;border-radius:50%;animation:qd-fly 7s ease-in-out infinite}
@keyframes qd-blink{0%,94%,100%{transform:scaleY(1)}97%{transform:scaleY(.08)}}
.qd-blink{animation:qd-blink 5s infinite;transform-origin:100px 92px}
@keyframes sunbird-wing{0%,100%{transform:scaleY(1)}50%{transform:scaleY(0.92) translateY(2px)}}
.sunbird-wing-anim{animation:sunbird-wing 0.8s ease-in-out infinite;transform-origin:center 60%}
@keyframes star-pulse-soft{0%,100%{transform:scale(1);filter:drop-shadow(0 0 6px rgba(251,191,36,0.5))}50%{transform:scale(1.05);filter:drop-shadow(0 0 14px rgba(251,191,36,0.85))}}
.star-pulse{animation:star-pulse-soft 1.6s ease-in-out infinite}
@keyframes gentle-nod{0%,100%{transform:translateY(0)}50%{transform:translateY(6px)}}
.gentle-nod-anim{animation:gentle-nod 0.4s ease-out 1}
@media (prefers-reduced-motion:reduce){
  .qd-stage,.qd-fly,.qd-blink,.sunbird-wing-anim,.star-pulse,.gentle-nod-anim{animation:none!important}
  .qd-gz,.qd-gz *{transition:none!important}
}
`}</style>
  );
}

export function Fireflies({ color = "#FDE68A" }: { color?: string }) {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      {Array.from({ length: 16 }).map((_, i) => (
        <span key={i} className="qd-fly" style={{ left: `${(i * 37 + 8) % 100}%`, top: `${(i * 53 + 5) % 95}%`, background: color, boxShadow: `0 0 12px 4px ${color}88`, animationDelay: `${(i % 7) * 0.8}s`, animationDuration: `${6 + (i % 5)}s` }} />
      ))}
    </div>
  );
}

// Soft ambient pad + wind. Off by default, starts only after a tap, very quiet.
export function AmbientToggle({ mood }: { mood: "groves" | "citadel" | "adhd" | "autism" | "dyslexia" }) {
  const [on, setOn] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ref = useRef<{ ctx: AudioContext; master: GainNode } | null>(null);

  const questPath = mood === "adhd" ? "/quests/adhd/audio/ambience.mp3" :
                    mood === "autism" || mood === "groves" ? "/quests/autism/audio/ambience.mp3" :
                    mood === "dyslexia" ? "/quests/dyslexia/audio/ambience.mp3" :
                    "/quests/adhd/audio/ambience.mp3";

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const r = ref.current; if (!r) return;
    try {
      r.master.gain.setTargetAtTime(0, r.ctx.currentTime, 0.25);
      setTimeout(() => r.ctx.close().catch(() => {}), 800);
    } catch {}
    ref.current = null;
  };
  useEffect(() => stop, []);

  const start = () => {
    // Try HTML5 audio with gentle volume first
    try {
      const a = new Audio(questPath);
      a.loop = true;
      a.volume = 0.18;
      const p = a.play();
      if (p !== undefined) {
        p.then(() => {
          audioRef.current = a;
        }).catch(() => {
          startWebAudioFallback();
        });
      } else {
        audioRef.current = a;
      }
    } catch {
      startWebAudioFallback();
    }
  };

  const startWebAudioFallback = () => {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx: AudioContext = new AC();
    const master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    master.gain.setTargetAtTime(0.04, ctx.currentTime, 1.2);
    const notes = mood === "groves" || mood === "autism" ? [110, 164.8, 277.2] : [146.8, 220, 370];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = 0.3 / (i + 1);
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05 + i * 0.03;
      const lg = ctx.createGain(); lg.gain.value = 0.12 / (i + 1);
      lfo.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(master); o.start(); lfo.start();
    });
    ref.current = { ctx, master };
  };

  return (
    <button type="button" aria-pressed={on} onClick={() => { on ? stop() : start(); setOn(!on); }}
      className="fixed bottom-4 left-4 z-50 min-h-[44px] rounded-full border border-white/40 bg-black/60 px-4 text-xs font-bold text-white backdrop-blur-md hover:bg-black/75 focus-visible:outline focus-visible:outline-4 focus-visible:outline-white">
      {on ? "Ambient sound: on" : "Ambient sound: off"}
    </button>
  );
}

// Aria: eyes, head and arm actually move. Starts with eye contact, then shifts gaze (and points) toward the target.
export function GazeGuide({ gaze, isPointing, onCue }: { gaze: "left" | "center" | "right"; isPointing: boolean; onCue: () => void }) {
  const [cue, setCue] = useState(false);
  const cb = useRef(onCue); cb.current = onCue;
  useEffect(() => { const t = setTimeout(() => { setCue(true); cb.current(); }, 900); return () => clearTimeout(t); }, []);
  const s = gaze === "left" ? -1 : gaze === "right" ? 1 : 0;
  const ease = "transform .55s cubic-bezier(.3,.7,.2,1)";
  const pupil = { transform: `translate(${cue ? s * 5.5 : 0}px,${cue ? 2.8 : 0}px)`, transition: ease } as React.CSSProperties;
  const head = { transform: `translate(${cue ? s * 5 : 0}px,0) rotate(${cue ? s * 5 : 0}deg)`, transformOrigin: "100px 130px", transition: ease } as React.CSSProperties;
  const arm = gaze === "left" ? { d: "M58 162 Q30 175 24 208", hx: 24, hy: 208 } : gaze === "right" ? { d: "M142 162 Q170 175 176 208", hx: 176, hy: 208 } : { d: "M142 162 Q130 190 106 214", hx: 106, hy: 214 };
  return (
    <div className="qd-gz flex flex-col items-center">
      <svg viewBox="0 0 200 230" className="h-48 w-44 md:h-56 md:w-52" role="img" aria-label={cue ? "Aria is looking toward one of the vessels" : "Aria is looking at you"}>
        <circle cx="100" cy="110" r="92" fill="#CCFBF1" opacity=".55" />
        <path d="M30 230 C30 176 60 150 100 150 C140 150 170 176 170 230Z" fill="#0F766E" />
        <polygon points="100,164 108,176 100,192 92,176" fill="#FBBF24" />
        <rect x="90" y="132" width="20" height="24" rx="8" fill="#E8B98F" />
        <path d={arm.d} fill="none" stroke="#E8B98F" strokeWidth="9" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={cue && isPointing ? 0 : 1} style={{ transition: "stroke-dashoffset .6s ease" }} />
        <circle cx={arm.hx} cy={arm.hy} r="7" fill="#E8B98F" style={{ opacity: cue && isPointing ? 1 : 0, transition: "opacity .3s .35s" }} />
        <g style={head}>
          <circle cx="56" cy="98" r="7" fill="#E8B98F" /><circle cx="144" cy="98" r="7" fill="#E8B98F" />
          <ellipse cx="100" cy="94" rx="44" ry="50" fill="#EDC4A0" />
          <path d="M54 90 C48 38 152 38 146 90 C140 66 120 56 100 56 C80 56 60 66 54 90Z" fill="#3B2A20" />
          <path d="M70 76 Q80 71 90 75M110 75 Q120 71 130 76" stroke="#3B2A20" strokeWidth="3" strokeLinecap="round" fill="none" />
          <g className="qd-blink">
            <ellipse cx="80" cy="92" rx="11" ry="8" fill="#fff" /><ellipse cx="120" cy="92" rx="11" ry="8" fill="#fff" />
            <g style={pupil}>
              <circle cx="80" cy="92" r="5.2" fill="#2B1D05" /><circle cx="120" cy="92" r="5.2" fill="#2B1D05" />
              <circle cx="81.8" cy="90.2" r="1.6" fill="#fff" /><circle cx="121.8" cy="90.2" r="1.6" fill="#fff" />
            </g>
          </g>
          <circle cx="70" cy="108" r="6" fill="#F9A8A8" opacity=".5" /><circle cx="130" cy="108" r="6" fill="#F9A8A8" opacity=".5" />
          <path d="M88 118 Q100 128 112 118" stroke="#8A4B3A" strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>
      </svg>
      <span className="mt-1 rounded-full border border-teal-200 bg-white/95 px-3 py-1 text-xs font-bold text-teal-900 shadow-sm" aria-live="polite">
        {cue ? "Where is Aria looking?" : "Aria is looking at you..."}
      </span>
    </div>
  );
}
