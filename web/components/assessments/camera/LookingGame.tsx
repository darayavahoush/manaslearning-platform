'use client'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import type {AttentionCamera} from './useAttentionCamera'
import {
  LOOK_SOCIAL_SIDES, LookingTrials, NOT_CALIBRATED_TELEMETRY, calibrate, lookingTelemetry,
  type Calibration, type GazeSample, type Side,
} from './gaze-side'

/**
 * The looking game (The Lantern Garden autism quest, optional camera gaze tracking):
 * The child looks at a glowing celestial star crystal on the left, then on the right,
 * so the camera learns eye and head orientation.
 * Then six short trials present a friendly storybook companion alongside moving geometric patterns.
 * Telemetry measures social visual orientation latency and preference.
 */

const CAL_MS = 3200
const CAL_SETTLE_SEC = 1.2 // time for the eyes to reach the star before frames count
const GAP_MS = 1500
const TRIAL_MS = 8000
const LEFT_X = '20%'
const RIGHT_X = '80%'

type Phase =
  | {k: 'intro'}
  | {k: 'cal'; side: Side; attempt: number}
  | {k: 'retry'}
  | {k: 'gap'; i: number}
  | {k: 'trial'; i: number}
  | {k: 'end'}

function playAudioCue(type: 'whoosh' | 'chime' | 'fanfare') {
  if (typeof window === 'undefined') return
  try {
    const audioMap: Record<string, string> = {
      whoosh: '/quests/autism/audio/tap.mp3',
      chime: '/quests/autism/audio/correct.mp3',
      fanfare: '/quests/autism/audio/complete.mp3',
    }
    const src = audioMap[type]
    if (src) {
      const snd = new Audio(src)
      snd.volume = 0.25
      snd.play().catch(() => {})
    }
  } catch {}
}

export default function LookingGame({
  cam,
  name,
  onFinish,
}: {
  cam: AttentionCamera
  name: string
  onFinish: (telemetry: Record<string, number>) => void
}) {
  const [phase, setPhase] = useState<Phase>({k: 'intro'})
  const bufL = useRef<GazeSample[]>([])
  const bufR = useRef<GazeSample[]>([])
  const calRef = useRef<Calibration | null>(null)
  const trialsRef = useRef<LookingTrials | null>(null)
  const sink = useRef<((f: GazeSample) => void) | null>(null)
  const started = useRef(false)
  const finished = useRef(false)
  const onFinishRef = useRef(onFinish)
  useEffect(() => { onFinishRef.current = onFinish }, [onFinish])

  const {subscribe, status} = cam
  useEffect(() => subscribe((f) => sink.current?.(f)), [subscribe])

  const finish = useCallback((tele: Record<string, number>) => {
    if (finished.current) return
    finished.current = true
    sink.current = null
    setPhase({k: 'end'})
    onFinishRef.current(tele)
  }, [])

  // If the camera stops part-way, keep what was measured so far
  useEffect(() => {
    if (!started.current || finished.current || status === 'on') return
    const cal = calRef.current
    finish(cal && trialsRef.current ? lookingTelemetry(trialsRef.current.summary()) : NOT_CALIBRATED_TELEMETRY)
  }, [status, finish])

  useEffect(() => {
    if (phase.k === 'cal') {
      playAudioCue('whoosh')
      const t0 = performance.now() / 1000
      const buf = phase.side === 'left' ? bufL : bufR
      buf.current = []
      sink.current = (f) => { if (f.t >= t0 + CAL_SETTLE_SEC) buf.current.push(f) }
      const id = setTimeout(() => {
        if (phase.side === 'left') {
          setPhase({k: 'cal', side: 'right', attempt: phase.attempt})
          return
        }
        const cal = calibrate(bufL.current, bufR.current)
        if (cal) {
          playAudioCue('chime')
          calRef.current = cal
          trialsRef.current = new LookingTrials(cal)
          setPhase({k: 'gap', i: 0})
        } else if (phase.attempt === 0) {
          setPhase({k: 'retry'})
        } else {
          finish(NOT_CALIBRATED_TELEMETRY)
        }
      }, CAL_MS)
      return () => { clearTimeout(id); sink.current = null }
    }
    if (phase.k === 'gap') {
      sink.current = null
      const id = setTimeout(() => setPhase({k: 'trial', i: phase.i}), GAP_MS)
      return () => clearTimeout(id)
    }
    if (phase.k === 'trial') {
      const trials = trialsRef.current
      if (!trials) return
      trials.begin(LOOK_SOCIAL_SIDES[phase.i])
      sink.current = (f) => trials.add(f)
      const id = setTimeout(() => {
        trials.end()
        if (phase.i + 1 < LOOK_SOCIAL_SIDES.length) {
          setPhase({k: 'gap', i: phase.i + 1})
        } else {
          playAudioCue('fanfare')
          finish(lookingTelemetry(trials.summary()))
        }
      }, TRIAL_MS)
      return () => { clearTimeout(id); sink.current = null }
    }
  }, [phase, finish])

  const start = () => {
    started.current = true
    setPhase({k: 'cal', side: 'left', attempt: 0})
  }
  const skip = () => {
    finished.current = true
    onFinishRef.current({})
  }

  const ariaAvatar =
    phase.k === 'cal' && phase.side === 'left'
      ? '/quests/autism/aria_gaze_left.webp'
      : phase.k === 'cal' && phase.side === 'right'
      ? '/quests/autism/aria_gaze_right.webp'
      : '/quests/autism/aria_gaze_center.webp'

  return (
    <section
      aria-label="The Starlight Looking Activity"
      className="relative rounded-3xl border-2 border-teal-400/50 bg-gradient-to-b from-[#0F1E17]/95 via-[#162B21]/90 to-[#0A1610]/95 backdrop-blur-md p-5 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.65)] text-center select-none text-teal-50"
    >
      <style>{CSS}</style>

      {/* 1. INTRO SCREEN */}
      {phase.k === 'intro' && (
        <div className="py-6 max-w-xl mx-auto">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-teal-400/60 bg-gradient-to-b from-[#18352A] to-[#0A1D16] p-1 shadow-lg">
            <img
              src="/quests/autism/aria_gaze_center.webp"
              alt="Aria the Alchemist"
              className="h-full w-full object-cover rounded-xl"
            />
          </div>
          <span className="inline-block rounded-full bg-teal-400/20 border border-teal-300/40 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-teal-200 mb-2">
            The Lantern Garden • Starlight Gaze Calibration
          </span>
          <h2 className="font-patrick text-3xl sm:text-4xl text-amber-200 font-bold mb-3">
            The Starlight Looking Activity
          </h2>
          <p className="text-sm sm:text-base text-teal-100/90 mb-3 leading-relaxed">
            First, {name} watches a gentle glowing star glide across the night sky — to the left, then to the right. Then garden pictures will appear!
          </p>
          <div className="mb-6 rounded-2xl bg-black/40 border border-teal-400/30 p-3.5 text-xs text-teal-200/90 leading-relaxed text-left flex items-start gap-2.5">
            <span className="text-base shrink-0">💡</span>
            <span>
              <strong>Parent Tip:</strong> Sit facing the screen comfortably in a well-lit room. {name} can just watch naturally — zero buttons or reading required.
            </span>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-4">
            <button
              type="button"
              onClick={start}
              className="rounded-full bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 px-8 py-4 text-base font-bold text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              Start Starlight Activity ▶
            </button>
            <button
              type="button"
              onClick={skip}
              className="rounded-full border border-teal-300/40 bg-black/30 px-6 py-4 text-sm font-bold text-teal-200 hover:bg-black/50 transition-all"
            >
              Skip this part
            </button>
          </div>
        </div>
      )}

      {/* 2. RETRY SCREEN */}
      {phase.k === 'retry' && (
        <div className="py-8 max-w-lg mx-auto">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-amber-400/60 bg-gradient-to-b from-[#2B1B10] to-[#150D06] p-1 shadow-lg">
            <img
              src="/quests/autism/aria_gaze_center.webp"
              alt="Aria the Alchemist"
              className="h-full w-full object-cover rounded-xl"
            />
          </div>
          <h3 className="font-patrick text-3xl text-amber-300 font-bold mb-2">
            One More Starlight Glimpse!
          </h3>
          <p className="text-sm text-amber-100/90 mb-4 leading-relaxed">
            Aria needs one more gentle look at the stars to calibrate the starlight. Please keep your screen steady with the room gently lit.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => setPhase({k: 'cal', side: 'left', attempt: 1})}
              className="rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 px-8 py-3.5 text-base font-bold text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              Follow the Stars Again ▶
            </button>
            <button
              type="button"
              onClick={() => finish(NOT_CALIBRATED_TELEMETRY)}
              className="rounded-full border border-teal-300/40 bg-black/30 px-6 py-3.5 text-sm font-bold text-teal-200 hover:bg-black/50 transition-all"
            >
              Continue without camera
            </button>
          </div>
        </div>
      )}

      {/* 3. ACTIVE ARENA (CALIBRATION, GAP, TRIALS) */}
      {(phase.k === 'cal' || phase.k === 'gap' || phase.k === 'trial') && (
        <div>
          {/* Header & Aria Companion Dialogue */}
          <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0B1A14]/80 border border-teal-400/30 rounded-2xl p-3 px-4 shadow-md backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <img
                src={ariaAvatar}
                alt="Aria Guidance"
                className="h-12 w-12 rounded-xl object-cover border border-teal-300/50 shadow-sm transition-all"
              />
              <div className="text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 block">
                  Aria, Grove Alchemist
                </span>
                <p className="font-patrick text-xl sm:text-2xl text-amber-100 font-bold leading-tight" aria-live="polite">
                  {phase.k === 'cal'
                    ? phase.side === 'left'
                      ? 'Look at the glowing star on the left!'
                      : 'Now look! The star glided to the right!'
                    : phase.k === 'gap'
                    ? 'Wonderful! Keep looking at the center star...'
                    : 'Watch whatever catches your eyes!'}
                </p>
              </div>
            </div>

            {/* Stage Progress Indicator */}
            <div className="flex items-center gap-2">
              {phase.k === 'cal' ? (
                <div className="flex items-center gap-2 bg-black/40 px-3.5 py-1.5 rounded-full border border-teal-400/30">
                  <span className={`h-2.5 w-2.5 rounded-full ${phase.side === 'left' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                  <span className="text-xs font-bold text-teal-100">
                    {phase.side === 'left' ? 'Step 1 of 2: Left Star' : 'Step 2 of 2: Right Star'}
                  </span>
                  <span className={`h-2.5 w-2.5 rounded-full ${phase.side === 'right' ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
                </div>
              ) : phase.k === 'trial' ? (
                <span className="rounded-full bg-black/50 border border-teal-400/40 px-3.5 py-1 text-xs font-bold text-amber-300 shadow-sm">
                  Picture {phase.i + 1} of {LOOK_SOCIAL_SIDES.length}
                </span>
              ) : (
                <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-bold text-teal-200">
                  Readying next picture...
                </span>
              )}
            </div>
          </div>

          {/* Majestic Celestial Twilight Sky Arena */}
          <div className="relative mx-auto w-full aspect-[16/9] min-h-[360px] sm:min-h-[440px] md:min-h-[480px] rounded-3xl overflow-hidden border-2 border-teal-400/40 shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_2px_24px_rgba(0,0,0,0.8)] select-none">
            {/* Deep Starlight Night Canvas */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#06151E] via-[#091D26] to-[#040F15]" />

            {/* Glowing Celestial Aurora & Nebulas */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_25%,rgba(45,212,191,0.22)_0%,rgba(20,184,166,0.08)_45%,transparent_75%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(251,191,36,0.15)_0%,transparent_50%)] pointer-events-none" />

            {/* Twinkling Ambient Star Motes */}
            <div className="absolute inset-0 pointer-events-none opacity-45">
              <div className="absolute top-10 left-16 h-1.5 w-1.5 rounded-full bg-white animate-ping" />
              <div className="absolute top-24 right-20 h-2 w-2 rounded-full bg-amber-200 animate-pulse" />
              <div className="absolute bottom-20 left-36 h-1 w-1 rounded-full bg-teal-200 animate-pulse" />
              <div className="absolute bottom-28 right-36 h-1.5 w-1.5 rounded-full bg-white animate-ping" />
              <div className="absolute top-16 left-1/2 h-1 w-1 rounded-full bg-amber-100 animate-pulse" />
            </div>

            {/* STIMULUS: CALIBRATION ACTIVE STAR */}
            {phase.k === 'cal' && (
              <Star
                key={phase.side}
                x={phase.side === 'left' ? LEFT_X : RIGHT_X}
                label={phase.side === 'left' ? 'Look here ✦' : 'Look here ✦'}
              />
            )}

            {/* STIMULUS: CENTER FIXATION GAP STAR */}
            {phase.k === 'gap' && (
              <Star key={`g${phase.i}`} x="50%" label="Center focus" />
            )}

            {/* STIMULUS: DUAL-PANEL TRIAL (SOCIAL FACE VS DYNAMIC GEOMETRIC PATTERNS) */}
            {phase.k === 'trial' && (
              <div key={`t${phase.i}`} className="relative h-full w-full flex items-center justify-between p-4 sm:p-8">
                <Panel side="left">
                  {LOOK_SOCIAL_SIDES[phase.i] === 'left' ? <Face /> : <Shapes />}
                </Panel>
                <Panel side="right">
                  {LOOK_SOCIAL_SIDES[phase.i] === 'right' ? <Face /> : <Shapes />}
                </Panel>
              </div>
            )}

            {/* Garden Observatory Terrace Balustrade Trim */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-between border-t border-teal-400/30 bg-gradient-to-t from-[#081510]/95 via-[#0C1E17]/85 to-transparent px-5 py-2.5 text-xs text-teal-200/90">
              <div className="flex items-center gap-2">
                <span className="text-sm">🏛️</span>
                <span className="font-semibold text-[11px] text-teal-100">
                  The Lantern Garden • Starlight Observatory
                </span>
              </div>
              <span className="rounded-full bg-black/50 px-3 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-300/30">
                Natural Visual Gaze
              </span>
            </div>
          </div>

          {/* Subtext info */}
          <p className="mt-3 text-xs text-teal-200/70">
            {phase.k === 'trial'
              ? `Showing picture ${phase.i + 1} of ${LOOK_SOCIAL_SIDES.length} · Free visual exploration`
              : phase.k === 'gap'
              ? `Next garden picture starting in a moment...`
              : 'Hold steady and follow the glowing celestial star'}
          </p>
        </div>
      )}
    </section>
  )
}

/** Luminous Multi-Tiered Celestial Star Crystal */
function Star({x, label}: {x: string; label?: string}) {
  return (
    <div
      className="absolute top-1/2 flex flex-col items-center justify-center transition-all duration-700 pointer-events-none"
      style={{left: x, transform: 'translate(-50%, -50%)'}}
      aria-hidden="true"
    >
      <div className="relative flex items-center justify-center">
        {/* Pulsing ambient starlight halos */}
        <div className="absolute -inset-10 rounded-full bg-amber-400/35 blur-2xl animate-pulse" />
        <div className="absolute -inset-6 rounded-full bg-yellow-300/50 blur-lg" />

        {/* Rotating celestial alignment rings */}
        <div
          className="absolute -inset-8 rounded-full border border-dashed border-amber-300/60 animate-spin"
          style={{animationDuration: '24s'}}
        />
        <div
          className="absolute -inset-12 rounded-full border border-dotted border-teal-300/40 animate-spin"
          style={{animationDuration: '36s', animationDirection: 'reverse'}}
        />

        {/* Multi-tier Sacred Star Crystal */}
        <svg
          viewBox="0 0 120 120"
          className="relative z-10 w-24 h-24 sm:w-32 sm:h-32 drop-shadow-[0_0_35px_rgba(251,191,36,0.95)] lk-star"
        >
          <defs>
            <radialGradient id="starCoreGold" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="35%" stopColor="#FEF08A" />
              <stop offset="70%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </radialGradient>
            <linearGradient id="starRayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#FBBF24" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* 4 Diagonal secondary star rays */}
          <polygon
            points="60,20 68,52 100,60 68,68 60,100 52,68 20,60 52,52"
            fill="url(#starRayGrad)"
            opacity="0.8"
            transform="rotate(45 60 60)"
          />

          {/* Primary 8-point celestial starlight star */}
          <polygon
            points="60,8 72,46 112,60 72,74 60,112 48,74 8,60 48,46"
            fill="url(#starCoreGold)"
            stroke="#FFFBEB"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Central diamond facet jewel */}
          <polygon
            points="60,38 72,52 86,60 72,68 60,82 48,68 34,60 48,52"
            fill="#FFFFFF"
            opacity="0.95"
            stroke="#FDE047"
            strokeWidth="1.5"
          />
          <circle cx="60" cy="60" r="5" fill="#FFFFFF" className="animate-ping" />
        </svg>

        {/* Floating Sparkles */}
        <span className="absolute -top-4 -right-3 text-xl animate-bounce drop-shadow">✨</span>
        <span className="absolute -bottom-3 -left-3 text-sm animate-pulse text-amber-200">✦</span>
      </div>

      {label && (
        <span className="mt-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-amber-300/40 text-[11px] font-bold text-amber-200 shadow-md">
          {label}
        </span>
      )}
    </div>
  )
}

function Panel({side, children}: {side: Side; children: React.ReactNode}) {
  return (
    <div
      className="absolute top-1/2 aspect-square"
      style={{
        height: '80%',
        [side === 'left' ? 'left' : 'right']: '4%',
        transform: 'translateY(-50%)',
      }}
      aria-hidden="true"
    >
      {children}
    </div>
  )
}

/** Social Stimulus: Storybook Friendly Companion */
function Face() {
  return (
    <div className="relative h-full w-full rounded-3xl overflow-hidden border-2 border-amber-400/50 bg-gradient-to-b from-[#2B1B10]/95 via-[#3A2415]/90 to-[#1F130B]/95 shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center p-3 select-none">
      {/* Gentle Warm Aura */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(251,191,36,0.25)_0%,transparent_70%)] pointer-events-none" />

      {/* Cheerful Animated Companion */}
      <div className="relative flex flex-col items-center justify-center lk-bob">
        <div className="relative h-28 w-28 sm:h-36 sm:w-36 md:h-44 md:w-44 flex items-center justify-center">
          <img
            src="/quests/autism/fox_happy.webp"
            alt="Friendly Garden Friend"
            className="h-full w-full object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)]"
          />
          <span className="absolute -top-1 -right-1 text-2xl animate-bounce">💛</span>
        </div>
      </div>

      <div className="mt-2 text-center">
        <span className="inline-block rounded-full bg-amber-400/20 border border-amber-300/40 px-3 py-0.5 text-xs font-bold text-amber-200 shadow-sm">
          Friendly Friend
        </span>
      </div>
    </div>
  )
}

/** Dynamic Geometric Stimulus: Sacred Geometry Kaleidoscope */
function Shapes() {
  return (
    <div className="relative h-full w-full rounded-3xl overflow-hidden border-2 border-teal-400/50 bg-gradient-to-b from-[#0B211D]/95 via-[#12312C]/90 to-[#071714]/95 shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center p-3 select-none">
      {/* Alchemical Aura */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(45,212,191,0.25)_0%,transparent_70%)] pointer-events-none" />

      {/* Mesmerizing Sacred Geometry Mandala */}
      <div className="relative h-28 w-28 sm:h-36 sm:w-36 md:h-44 md:w-44 flex items-center justify-center">
        {/* Outer Orbiting Jewel Ring */}
        <svg viewBox="0 0 200 200" className="h-full w-full lk-spin">
          <defs>
            <linearGradient id="kaleidoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2DD4BF" />
              <stop offset="50%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="88" stroke="#2DD4BF" strokeWidth="2.5" strokeDasharray="6 6" fill="none" opacity="0.7" />
          <polygon points="100,18 171,59 171,141 100,182 29,141 29,59" stroke="url(#kaleidoGrad)" strokeWidth="3" fill="none" opacity="0.8" />
          <polygon points="100,28 162,64 162,136 100,172 38,136 38,64" stroke="#FDE047" strokeWidth="2" fill="none" opacity="0.6" transform="rotate(30 100 100)" />
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <circle
              key={deg}
              cx={100 + 72 * Math.cos((deg * Math.PI) / 180)}
              cy={100 + 72 * Math.sin((deg * Math.PI) / 180)}
              r="7"
              fill="#FDE047"
              stroke="#FFF"
              strokeWidth="2"
            />
          ))}
        </svg>

        {/* Counter-rotating Inner Mandala */}
        <svg viewBox="0 0 100 100" className="absolute inset-4 lk-spin-rev">
          <polygon points="50,15 85,50 50,85 15,50" fill="#38BDF8" fillOpacity="0.3" stroke="#38BDF8" strokeWidth="2" />
          <polygon points="50,15 85,50 50,85 15,50" fill="#2DD4BF" fillOpacity="0.25" stroke="#2DD4BF" strokeWidth="2" transform="rotate(45 50 50)" />
          <circle cx="50" cy="50" r="10" fill="#FBBF24" stroke="#FFF" strokeWidth="2" className="animate-pulse" />
        </svg>
      </div>

      <div className="mt-2 text-center">
        <span className="inline-block rounded-full bg-teal-400/20 border border-teal-300/40 px-3 py-0.5 text-xs font-bold text-teal-200 shadow-sm">
          Moving Patterns
        </span>
      </div>
    </div>
  )
}

const CSS = `
.lk-star {
  animation: lk-float-pulse 1.8s ease-in-out infinite;
}
@keyframes lk-float-pulse {
  0%, 100% {
    transform: scale(1) translateY(0);
    filter: drop-shadow(0 0 25px rgba(251, 191, 36, 0.85));
  }
  50% {
    transform: scale(1.12) translateY(-6px);
    filter: drop-shadow(0 0 45px rgba(251, 191, 36, 1));
  }
}
.lk-bob {
  animation: lk-bob-subtle 2.4s ease-in-out infinite;
}
@keyframes lk-bob-subtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
.lk-spin {
  animation: lk-spin-slow 16s linear infinite;
}
.lk-spin-rev {
  animation: lk-spin-slow 12s linear infinite reverse;
}
@keyframes lk-spin-slow {
  to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .lk-star, .lk-bob, .lk-spin, .lk-spin-rev {
    animation: none !important;
  }
}
`
