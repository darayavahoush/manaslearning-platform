'use client'
import {useCallback, useEffect, useRef, useState} from 'react'
import type {AttentionCamera} from './useAttentionCamera'
import {
  LOOK_SOCIAL_SIDES, LookingTrials, NOT_CALIBRATED_TELEMETRY, calibrate, lookingTelemetry,
  type Calibration, type GazeSample, type Side,
} from './gaze-side'

/**
 * The looking game (autism quest, optional camera): the child looks at a star on the left, then on the right, so the
 * camera learns what each side looks like. Then six short trials show a friendly cartoon face and some moving shapes side
 * by side, with the face on alternating sides. Only the totals in the returned telemetry are kept; nothing is recorded.
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

export default function LookingGame({cam, name, onFinish}: {cam: AttentionCamera; name: string; onFinish: (telemetry: Record<string, number>) => void}) {
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

  // if the camera stops part-way (the grown-up pressed Stop camera, or it failed), keep what was measured so far
  useEffect(() => {
    if (!started.current || finished.current || status === 'on') return
    const cal = calRef.current
    finish(cal && trialsRef.current ? lookingTelemetry(trialsRef.current.summary()) : NOT_CALIBRATED_TELEMETRY)
  }, [status, finish])

  useEffect(() => {
    if (phase.k === 'cal') {
      const t0 = performance.now() / 1000
      const buf = phase.side === 'left' ? bufL : bufR
      buf.current = []
      sink.current = (f) => { if (f.t >= t0 + CAL_SETTLE_SEC) buf.current.push(f) }
      const id = setTimeout(() => {
        if (phase.side === 'left') { setPhase({k: 'cal', side: 'right', attempt: phase.attempt }); return }
        const cal = calibrate(bufL.current, bufR.current)
        if (cal) {
          calRef.current = cal
          trialsRef.current = new LookingTrials(cal)
          setPhase({k: 'gap', i: 0})
        } else if (phase.attempt === 0) setPhase({k: 'retry'})
        else finish(NOT_CALIBRATED_TELEMETRY)
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
        if (phase.i + 1 < LOOK_SOCIAL_SIDES.length) setPhase({k: 'gap', i: phase.i + 1})
        else finish(lookingTelemetry(trials.summary()))
      }, TRIAL_MS)
      return () => { clearTimeout(id); sink.current = null }
    }
  }, [phase, finish])

  const start = () => { started.current = true; setPhase({k: 'cal', side: 'left', attempt: 0}) }
  const skip = () => { finished.current = true; onFinishRef.current({}) }

  return (
    <section aria-label="Looking game" className="rounded-3xl border-2 border-teal-300/40 bg-white/95 backdrop-blur-md p-5 md:p-8 shadow-2xl text-center select-none">
      <style>{CSS}</style>
      {phase.k === 'intro' && (
        <div className="py-6">
          <h2 className="font-patrick text-3xl text-[#0F172A] mb-3">Looking game</h2>
          <p className="text-[#334155] mb-2 max-w-lg mx-auto">First {name} looks at a star on the left, then a star on the right. Then pictures show up. {name} can just watch.</p>
          <p className="text-sm text-[#64748B] mb-6 max-w-lg mx-auto">Please sit so the face is in the little camera picture, with the screen straight ahead, and keep the screen as steady as you can.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={start} className="rounded-full bg-teal-600 px-7 py-3 text-sm font-bold text-white">Start</button>
            <button type="button" onClick={skip} className="rounded-full border-2 border-slate-300 px-6 py-3 text-sm font-bold text-slate-700">Skip this game</button>
          </div>
        </div>
      )}

      {phase.k === 'retry' && (
        <div className="py-10">
          <p className="text-lg text-[#0F172A] mb-2">The camera needs one more go at the stars.</p>
          <p className="text-sm text-[#64748B] mb-5">Face the screen, make sure the face is in the little picture and the room is not dark behind {name}.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => setPhase({k: 'cal', side: 'left', attempt: 1})} className="rounded-full bg-teal-600 px-7 py-3 text-sm font-bold text-white">Try the stars again</button>
            <button type="button" onClick={() => finish(NOT_CALIBRATED_TELEMETRY)} className="rounded-full border-2 border-slate-300 px-6 py-3 text-sm font-bold text-slate-700">Skip this game</button>
          </div>
        </div>
      )}

      {(phase.k === 'cal' || phase.k === 'gap' || phase.k === 'trial') && (
        <div>
          <p className="text-sm font-bold text-teal-700 mb-3" aria-live="polite">
            {phase.k === 'cal' ? (phase.side === 'left' ? 'Look at the star on the left' : 'Now look at the star on the right')
              : phase.k === 'gap' ? 'Get ready' : 'Watch the pictures'}
          </p>
          <div className="relative mx-auto w-full max-w-4xl aspect-[16/9] rounded-2xl overflow-hidden" style={{background: '#14213d'}}>
            {phase.k === 'cal' && <Star key={phase.side} x={phase.side === 'left' ? LEFT_X : RIGHT_X} />}
            {phase.k === 'gap' && <Star key={`g${phase.i}`} x="50%" />}
            {phase.k === 'trial' && (
              <div key={`t${phase.i}`}>
                <Panel side="left">{LOOK_SOCIAL_SIDES[phase.i] === 'left' ? <Face /> : <Shapes />}</Panel>
                <Panel side="right">{LOOK_SOCIAL_SIDES[phase.i] === 'right' ? <Face /> : <Shapes />}</Panel>
              </div>
            )}
          </div>
          <p className="mt-3 text-xs text-[#64748B]">{phase.k === 'trial' ? `Picture ${phase.i + 1} of ${LOOK_SOCIAL_SIDES.length}` : phase.k === 'gap' ? `Picture ${phase.i + 1} of ${LOOK_SOCIAL_SIDES.length} is next` : 'Just a moment'}</p>
        </div>
      )}
    </section>
  )
}

function Star({x}: {x: string}) {
  return (
    <div className="absolute top-1/2" style={{left: x, transform: 'translate(-50%, -50%)'}} aria-hidden="true">
      <span className="lk-star block text-6xl md:text-7xl text-amber-300">★</span>
    </div>
  )
}

function Panel({side, children}: {side: Side; children: React.ReactNode}) {
  return (
    <div className="absolute top-1/2 aspect-square" style={{height: '78%', [side === 'left' ? 'left' : 'right']: '3%', transform: 'translateY(-50%)'}} aria-hidden="true">
      {children}
    </div>
  )
}

/** A friendly cartoon face: head bobs, eyes blink, mouth opens and closes as if talking. */
function Face() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full rounded-2xl" role="img" aria-label="A friendly cartoon face">
      <rect width="200" height="200" fill="#fde68a" />
      <g className="lk-bob">
        <circle cx="100" cy="104" r="62" fill="#fcd9b6" />
        <path d="M40 92 C40 38 160 38 160 92 C140 66 60 66 40 92 Z" fill="#7c4a2d" />
        <circle cx="62" cy="116" r="9" fill="#f9a8a0" opacity="0.7" />
        <circle cx="138" cy="116" r="9" fill="#f9a8a0" opacity="0.7" />
        <g className="lk-blink"><ellipse cx="76" cy="100" rx="7" ry="9" fill="#1f2937" /><ellipse cx="124" cy="100" rx="7" ry="9" fill="#1f2937" /></g>
        <circle cx="78" cy="97" r="2.5" fill="#fff" /><circle cx="126" cy="97" r="2.5" fill="#fff" />
        <path d="M64 84 Q76 76 88 84" stroke="#7c4a2d" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M112 84 Q124 76 136 84" stroke="#7c4a2d" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <g className="lk-talk"><ellipse cx="100" cy="138" rx="17" ry="11" fill="#9f1239" /><ellipse cx="100" cy="143" rx="9" ry="4" fill="#fb7185" /></g>
      </g>
    </svg>
  )
}

/** Moving shapes in the same size, background and rough colours as the face. */
function Shapes() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full rounded-2xl" role="img" aria-label="Moving shapes">
      <rect width="200" height="200" fill="#fde68a" />
      <g className="lk-orbit"><circle cx="100" cy="46" r="20" fill="#fcd9b6" stroke="#7c4a2d" strokeWidth="3" /></g>
      <g className="lk-spin"><polygon points="100,72 138,138 62,138" fill="#fb7185" /></g>
      <g className="lk-hop"><rect x="30" y="140" width="34" height="34" rx="5" fill="#7c4a2d" /></g>
      <g className="lk-hop2"><rect x="136" y="140" width="34" height="34" rx="17" fill="#1f2937" /></g>
    </svg>
  )
}

const CSS = `
.lk-star{animation:lk-pulse 1s ease-in-out infinite}
@keyframes lk-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}
.lk-bob{transform-origin:100px 170px;animation:lk-bob 1.6s ease-in-out infinite}
@keyframes lk-bob{0%,100%{transform:rotate(-3deg) translateY(0)}50%{transform:rotate(3deg) translateY(-4px)}}
.lk-blink{transform-origin:100px 100px;animation:lk-blink 3.2s infinite}
@keyframes lk-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(0.1)}}
.lk-talk{transform-origin:100px 138px;animation:lk-talk 0.9s ease-in-out infinite}
@keyframes lk-talk{0%,100%{transform:scaleY(0.45)}50%{transform:scaleY(1)}}
.lk-orbit{transform-origin:100px 110px;animation:lk-spin 3.4s linear infinite}
.lk-spin{transform-origin:100px 118px;animation:lk-spin 4.8s linear infinite reverse}
@keyframes lk-spin{to{transform:rotate(360deg)}}
.lk-hop{animation:lk-hop 1.1s ease-in-out infinite}
.lk-hop2{animation:lk-hop 1.3s ease-in-out infinite .4s}
@keyframes lk-hop{0%,100%{transform:translateY(0)}50%{transform:translateY(-26px)}}
`
