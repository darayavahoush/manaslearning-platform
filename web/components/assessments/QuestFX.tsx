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
/* The sunbird is the measured target and the shadow moth is the distractor. Motion on only one of them would make it easier to notice, so neither moves. */
.sunbird-wing-anim{animation:none;transform-origin:center 60%}
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
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
    <button type="button" aria-pressed={on} onClick={() => { if (on) { stop(); } else { start(); } setOn(!on); }}
      className="fixed bottom-4 left-4 z-50 min-h-[44px] rounded-full border border-white/40 bg-black/60 px-4 text-xs font-bold text-white backdrop-blur-md hover:bg-black/75 focus-visible:outline focus-visible:outline-4 focus-visible:outline-white">
      {on ? "Ambient sound: on" : "Ambient sound: off"}
    </button>
  );
}

export function VerandaRailingSvg({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 360 40" className={className} preserveAspectRatio="none" aria-hidden="true">
      {/* Top carved stone rail */}
      <rect x="0" y="0" width="360" height="10" rx="3" fill="#C49A6C" stroke="#7A4C25" strokeWidth="1.5" />
      <rect x="2" y="2" width="356" height="2.5" fill="#EAD7B8" opacity="0.6" />
      {/* Lower stone molding */}
      <rect x="0" y="32" width="360" height="8" rx="2" fill="#A27343" stroke="#5E3516" strokeWidth="1.5" />
      {/* Pillar posts */}
      <rect x="8" y="10" width="14" height="22" fill="#B28757" stroke="#6E3E1A" strokeWidth="1" />
      <rect x="173" y="10" width="14" height="22" fill="#B28757" stroke="#6E3E1A" strokeWidth="1" />
      <rect x="338" y="10" width="14" height="22" fill="#B28757" stroke="#6E3E1A" strokeWidth="1" />
      {/* Left jali panel with carved arch windows */}
      <rect x="22" y="10" width="151" height="22" fill="#DFCCA8" stroke="#8C5E32" strokeWidth="1" />
      <path d="M34 32 V20 C34 15 44 15 44 20 V32 M56 32 V20 C56 15 66 15 66 20 V32 M78 32 V20 C78 15 88 15 88 20 V32 M100 32 V20 C100 15 110 15 110 20 V32 M122 32 V20 C122 15 132 15 132 20 V32 M144 32 V20 C144 15 154 15 154 20 V32 M160 32 V20 C160 15 168 15 168 20 V32" stroke="#6E3E1A" strokeWidth="1.5" fill="#4A280F" opacity="0.4" />
      {/* Right jali panel with carved arch windows */}
      <rect x="187" y="10" width="151" height="22" fill="#DFCCA8" stroke="#8C5E32" strokeWidth="1" />
      <path d="M199 32 V20 C199 15 209 15 209 20 V32 M221 32 V20 C221 15 231 15 231 20 V32 M243 32 V20 C243 15 253 15 253 20 V32 M265 32 V20 C265 15 275 15 275 20 V32 M287 32 V20 C287 15 297 15 297 20 V32 M309 32 V20 C309 15 319 15 319 20 V32 M325 32 V20 C325 15 333 15 333 20 V32" stroke="#6E3E1A" strokeWidth="1.5" fill="#4A280F" opacity="0.4" />
    </svg>
  );
}

// Aria: Clear gaze and pointing direction sprites. Starts with eye contact, then shifts gaze & points toward target.
export function GazeGuide({ gaze, onCue }: { gaze: "left" | "center" | "right"; isPointing?: boolean; onCue: () => void }) {
  const [cue, setCue] = useState(false);
  const cb = useRef(onCue);
  useEffect(() => {
    cb.current = onCue;
  }, [onCue]);
  useEffect(() => {
    const t = setTimeout(() => { setCue(true); cb.current(); }, 900);
    return () => clearTimeout(t);
  }, []);

  const spriteSrc = !cue
    ? "/quests/autism/aria_gaze_center.webp"
    : gaze === "left"
    ? "/quests/autism/aria_gaze_left.webp"
    : gaze === "right"
    ? "/quests/autism/aria_gaze_right.webp"
    : "/quests/autism/aria_gaze_center.webp";

  const ariaLabel = cue
    ? (gaze === "left" ? "Aria is looking and pointing to the left" : gaze === "right" ? "Aria is looking and pointing to the right" : "Aria is looking at the middle vessel")
    : "Aria is looking at you";

  return (
    <div className="qd-gz relative flex flex-col items-center">
      {/* Aria Character standing behind veranda terrace balustrade */}
      <div className="h-44 w-44 sm:h-52 sm:w-52 flex items-center justify-center relative z-0">
        <img
          src={spriteSrc}
          alt={ariaLabel}
          className="h-full w-full object-contain pointer-events-none select-none transition-all duration-300 drop-shadow-md"
          width={208}
          height={208}
        />
      </div>
      {/* Sandstone Terrace Balustrade Railing overlapping Aria's waist */}
      <div className="-mt-11 sm:-mt-13 relative z-10 w-72 sm:w-96 h-12 sm:h-14 pointer-events-none drop-shadow-lg">
        <VerandaRailingSvg />
      </div>
      <span className="sr-only" aria-live="polite">
        {cue ? "Where is Aria looking?" : "Aria is looking at you..."}
      </span>
    </div>
  );
}
