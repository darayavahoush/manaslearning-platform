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
    <div className="qd-gz flex flex-col items-center">
      <div className="h-44 w-44 sm:h-52 sm:w-52 flex items-center justify-center relative">
        <img
          src={spriteSrc}
          alt={ariaLabel}
          className="h-full w-full object-contain pointer-events-none select-none transition-all duration-300 drop-shadow-md"
          width={208}
          height={208}
        />
      </div>
      <span className="sr-only" aria-live="polite">
        {cue ? "Where is Aria looking?" : "Aria is looking at you..."}
      </span>
    </div>
  );
}
