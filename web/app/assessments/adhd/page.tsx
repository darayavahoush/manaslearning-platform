'use client'
import WelcomeWizard from '../../../components/assessments/WelcomeWizard'
import ReadAloud from '../../../components/assessments/ReadAloud'
import ClinicianReportButton from '../../../components/assessments/ClinicianReport'
import ParentCard, {type ParentAnswers} from '../../../components/assessments/ParentCard'
import SessionRecordDownload from '../../../components/assessments/SessionRecordDownload'
import {captureEnvironment} from '../../../components/assessments/session-record'
import {usePlayEvents} from '../../../components/assessments/play-events'
import {useAttentionCamera} from '../../../components/assessments/camera/useAttentionCamera'
import CameraConsent, {CameraBadge} from '../../../components/assessments/camera/CameraConsent'
import {useState, useEffect, useRef, useMemo} from 'react'
import Link from 'next/link'
import KeeperFeedback from '../../../components/assessments/KeeperFeedback'
import EndReport from '../../../components/assessments/report/EndReport'
import {QuestStyles, Fireflies, AmbientToggle} from '../../../components/assessments/QuestFX'

// The star-sequence tone version: one clear pitch per star position (a pentatonic-style set, all within the child's range)
const STAR_TONE_HZ = [262, 294, 330, 392, 440, 523, 587, 659, 784]
function playTone(hz: number) {
  if (typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = hz
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.65)
  } catch { /* audio is optional */ }
}

// Enchanted Web Audio synthesizer: Harmonic marimba, crystal bells, celestial glass, and royal fanfare
function playAudio(type: 'hit' | 'chime' | 'miss' | 'tap' | 'fanfare' | 'star' | 'whoosh') {
  if (typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    const now = ctx.currentTime

    if (type === 'hit') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(523.25, now)
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.09)
      gain.gain.setValueAtTime(0.09, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.18)
    } else if (type === 'star') {
      const notes = [523.25, 587.33, 659.25, 783.99, 880]
      const f = notes[Math.floor(Math.random() * notes.length)]
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(f, now)
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.38)
    } else if (type === 'fanfare') {
      const chords = [523.25, 659.25, 783.99, 1046.5, 1318.5]
      chords.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, now + idx * 0.08)
        gain.gain.setValueAtTime(0.08, now + idx * 0.08)
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.08)
        osc.stop(now + idx * 0.08 + 0.5)
      })
    } else if (type === 'miss') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(260, now)
      osc.frequency.linearRampToValueAtTime(180, now + 0.15)
      gain.gain.setValueAtTime(0.05, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.2)
    } else {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, now)
      gain.gain.setValueAtTime(0.04, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.06)
    }
  } catch {}
}

// Bespoke Storybook Vector Icons (Strictly No Unicode Emojis)
function BowIconSvg({className = 'w-6 h-6'}: {className?: string}) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12c0-4.418 3.582-8 8-8s8 3.582 8 8" />
      <path d="M4 12h16" />
      <path d="M12 4v16" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  )
}

function WandIconSvg({className = 'w-6 h-6'}: {className?: string}) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 4l5 5L7 22H2v-5L15 4z" />
      <path d="M14 6l3 3" />
      <path d="M18 2v2M22 6h-2M10 2l1 2M2 10l2 1" />
    </svg>
  )
}

function ShieldIconSvg({className = 'w-6 h-6'}: {className?: string}) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 6v12M8 10h8" />
    </svg>
  )
}

function CompassRoseSvg({className = 'w-6 h-6'}: {className?: string}) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="12,4 14,10 20,12 14,14 12,20 10,14 4,12 10,10" fill="currentColor" fillOpacity="0.25" />
    </svg>
  )
}

function AstrolabeCrystalSvg({className = 'w-6 h-6'}: {className?: string}) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="currentColor" fillOpacity="0.2" />
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="4" y1="12" x2="20" y2="12" />
    </svg>
  )
}

// --- Go/no-go task: fixed, balanced order so every child sees the same trials ---------------------------
// G = sunbird (tap), N = moth (wait). Rounds of 10: 7 sunbirds, 3 moths, never two moths in a row.
// The first 20 entries are the original order; later rounds were generated once from a fixed seed (20261105).
const CPT_ORDER = 'GGNGGGNGGNGGGNGGNGGNGGNGGGNGGNGGNGNGGNGGGGNGGNGGGNGNGGGGGNGN'
// Wait before each shape appears (ms). Same four values as before, in a fixed order, five of each.
const CPT_WAITS = [1200, 2050, 850, 1600, 1600, 850, 2050, 1200, 850, 1200, 1600, 2050, 2050, 1600, 1200, 850, 1200, 850, 2050, 1600, 850, 1200, 2050, 1600, 2050, 1200, 1600, 850, 2050, 1600, 1200, 850, 2050, 1600, 850, 1200, 2050, 1600, 850, 1200, 2050, 850, 1600, 1200, 850, 1600, 1200, 2050, 1600, 1200, 2050, 850, 1600, 850, 1200, 2050, 1200, 1600, 850, 2050]
// A tap counts from the moment the shape appears until this long after, even if the shape has already gone.
const CPT_WINDOW_MS = 1000
// A "hit" faster than this is counted as an early tap, not as a reaction.
const CPT_MIN_RT_MS = 150
// Task length and display time by age. These are OUR ESTIMATES for child-friendly length, not published norms.
// A round is 10 sightings. Ages 4-5: 2 rounds, shape shown 1.5 s. Ages 6-8: 3 rounds, 0.68 s. Ages 9-16: 4 rounds, 0.54 s then 0.44 s.
const CPT_BLOCK = 10
function cptPlanFor(age: number) {
  const blocks = age <= 5 ? 2 : age <= 8 ? 3 : 4
  const displayMs = age <= 5 ? 1500 : age <= 7 ? 680 : age <= 11 ? 540 : 440
  // the tap window must outlast the time the shape is on screen
  return {blocks, size: CPT_BLOCK, total: blocks * CPT_BLOCK, displayMs, windowMs: Math.max(CPT_WINDOW_MS, displayMs + 300)}
}
// Each round of the sunbird game has its own name and ring colour, and ends with a "sunstone" to collect, so the rounds feel
// different. Only the outer ring changes: the sunbird, the moth and the dark centre behind them are the same every time.
const CPT_SCENES = [
  {name: 'Dawn Meadow', ring: 'border-amber-300/80', stone: 'Dawn Sunstone'},
  {name: 'Golden Canopy', ring: 'border-emerald-300/80', stone: 'Canopy Sunstone'},
  {name: 'River Mist', ring: 'border-sky-300/80', stone: 'River Sunstone'},
  {name: 'Starlit Peak', ring: 'border-violet-300/80', stone: 'Starlight Sunstone'},
]
// Arrow game: centre arrow direction (L/R) and whether the side arrows match (C) or conflict (I).
const FLANKER_ORDER = ['LC', 'RI', 'RC', 'LC', 'LI', 'RC', 'RI', 'LC', 'RC', 'LI', 'LC', 'RI']

// Flat, hand-built target and distractor. Same size, no glow, no motion, so only the shape tells them apart.
function SunbirdTarget({className = 'w-28 h-28'}: {className?: string}) {
  return (
    <svg role="img" aria-label="Sunbird" viewBox="-8 -4 136 128" className={className}>
      <path d="M30 66 L6 56 L10 68 L3 78 L14 78 L9 90 L36 78 Z" fill="#C8671F" />
      <ellipse cx="60" cy="66" rx="28" ry="19" transform="rotate(-12 60 66)" fill="#F0BE4D" />
      <path d="M44 66 C48 42 74 36 86 54 C74 66 58 72 44 66 Z" fill="#E08A2E" />
      <circle cx="88" cy="46" r="14" fill="#F0BE4D" />
      <path d="M80 36 L79 24 L86 32 L91 21 L94 34 Z" fill="#E08A2E" />
      <path d="M99 44 L114 50 L99 55 Z" fill="#C8671F" />
      <circle cx="91" cy="44" r="2.6" fill="#2B2118" />
      <path d="M56 84 L54 96 M66 84 L68 96" stroke="#C8671F" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function MothDistractor({className = 'w-28 h-28'}: {className?: string}) {
  return (
    <svg role="img" aria-label="Moth" viewBox="-8 -4 136 128" className={className}>
      <path d="M60 56 L8 40 C4 58 14 76 44 76 Z" fill="#B7AFCB" />
      <path d="M60 56 L112 40 C116 58 106 76 76 76 Z" fill="#B7AFCB" />
      <path d="M60 64 L22 84 C26 98 44 100 58 86 Z" fill="#8C84A8" />
      <path d="M60 64 L98 84 C94 98 76 100 62 86 Z" fill="#8C84A8" />
      <path d="M24 50 L14 46 M30 58 L18 56 M96 50 L106 46 M90 58 L102 56" stroke="#8C84A8" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="60" cy="66" rx="7.5" ry="26" fill="#554C73" />
      <circle cx="60" cy="38" r="7" fill="#554C73" />
      <path d="M56 33 C50 24 44 20 36 20 M64 33 C70 24 76 20 84 20" stroke="#D5CFE3" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function GoldenSunbirdSvg({className = 'w-28 h-28'}: {className?: string}) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="54" fill="#FEF08A" fillOpacity="0.45"/>
      <circle cx="60" cy="60" r="48" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6"/>
      <path d="M 42 68 C 30 68 22 55 28 42 C 34 32 48 30 58 38 C 72 32 88 38 94 48 C 98 56 92 68 82 72 C 68 78 52 76 42 68 Z" fill="#F59E0B"/>
      <path d="M 44 48 C 36 28 52 14 68 18 C 74 20 80 26 82 32 C 72 34 60 40 44 48 Z" fill="#10B981"/>
      <circle cx="86" cy="48" r="10" fill="#FBBF24"/>
      <path d="M 94 47 L 110 50 L 94 53 Z" fill="#B45309"/>
      <circle cx="88" cy="46" r="3" fill="#1E293B"/>
      <circle cx="89" cy="45" r="1" fill="#FFFFFF"/>
      <path d="M 28 56 C 14 58 10 68 12 76 C 18 72 24 66 32 62 Z" fill="#D97706"/>
    </svg>
  )
}

function VelvetDuskmothSvg({className = 'w-28 h-28'}: {className?: string}) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="54" fill="#FEE2E2" fillOpacity="0.5"/>
      <circle cx="60" cy="60" r="48" stroke="#F87171" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6"/>
      <path d="M 60 56 C 45 35 25 32 18 42 C 12 50 18 68 35 72 C 45 74 55 66 60 56 Z" fill="#334155"/>
      <path d="M 60 56 C 75 35 95 32 102 42 C 108 50 102 68 85 72 C 75 74 65 66 60 56 Z" fill="#334155"/>
      <circle cx="32" cy="52" r="5" fill="#EF4444" opacity="0.8"/>
      <circle cx="88" cy="52" r="5" fill="#EF4444" opacity="0.8"/>
      <ellipse cx="60" cy="64" rx="4.5" ry="16" fill="#0F172A"/>
      <path d="M 58 48 C 54 36 44 26 36 24" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M 62 48 C 66 36 76 26 84 24" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

/**
 * The steering game's second skin: a rocket for the centre arrow and wind gusts for the side arrows.
 * Same rules and same measure. The skin is chosen by the clinician with ?skin=rocket on the page address.
 */
function RocketSvg({direction, className}: {direction: 'left' | 'right'; className: string}) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true" style={{transform: direction === 'left' ? 'scaleX(-1)' : undefined}}>
      <path d="M9 21 L1 24 L9 27 Z" fill="#FBBF24" />
      <path d="M8 24 L3 16 L12 20 Z M8 24 L3 32 L12 28 Z" fill="#F97316" />
      <path d="M8 24 L30 16 Q44 24 30 32 Z" fill="#F8FAFC" stroke="#1E3A8A" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="27" cy="24" r="3.5" fill="#38BDF8" stroke="#1E3A8A" strokeWidth="1.2" />
    </svg>
  )
}

function WindGustSvg({direction, className}: {direction: 'left' | 'right'; className: string}) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true" style={{transform: direction === 'left' ? 'scaleX(-1)' : undefined}}>
      <path d="M4 16 Q18 10 30 16 T44 16" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
      <path d="M4 24 Q18 18 30 24 T44 24" stroke="#7DD3FC" strokeWidth="3" strokeLinecap="round" />
      <path d="M4 32 Q18 26 30 32 T44 32" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function FlankerGlyph({skin, direction, isCenter, className}: {skin: 'arrows' | 'rocket'; direction: 'left' | 'right' | 'neutral'; isCenter: boolean; className: string}) {
  if (skin === 'arrows' || direction === 'neutral') return <AstralChevronSvg direction={direction} isCenter={isCenter} className={className} />
  return isCenter ? <RocketSvg direction={direction} className={className} /> : <WindGustSvg direction={direction} className={className} />
}

function AstralChevronSvg({direction, isCenter, className = 'w-11 h-11 sm:w-16 sm:h-16'}: {direction: 'left' | 'right' | 'neutral'; isCenter: boolean; className?: string}) {
  if (direction === 'neutral') {
    return (
      <div className="w-12 h-12 flex items-center justify-center text-slate-500 font-bold text-3xl select-none">
        •
      </div>
    )
  }
  const isLeft = direction === 'left'
  return (
    <div className={`relative flex items-center justify-center ${isCenter ? 'scale-125' : 'opacity-90'}`}>
      {isCenter && <span className="absolute -inset-2 rounded-xl bg-amber-400/20 blur-md animate-pulse"/>}
      <svg
        viewBox="0 0 48 48"
        className={`${className} transition-transform ${isLeft ? '' : 'rotate-180'}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 32 8 L 16 24 L 32 40"
          stroke={isCenter ? '#C2410C' : '#1D4ED8'}
          strokeWidth={isCenter ? '5' : '3.5'}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {isCenter && <circle cx="16" cy="24" r="3" fill="#FDE68A"/>}
      </svg>
    </div>
  )
}

const CV_CSS = `@keyframes cv-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}@keyframes cv-twinkle{0%,100%{opacity:.35}50%{opacity:1}}@keyframes cv-pop{0%{transform:translate(-50%,-50%) scale(.3);opacity:0}25%{transform:translate(-50%,-60%) scale(1.25);opacity:1}100%{transform:translate(-50%,-130%) scale(1);opacity:0}}@keyframes cv-ring{0%,100%{box-shadow:0 0 0 0 rgba(251,191,36,.75)}50%{box-shadow:0 0 0 14px rgba(251,191,36,0)}}@keyframes cv-wobble{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}.cv-float{animation:cv-float 3.4s ease-in-out infinite}.cv-twinkle{animation:cv-twinkle 2.6s ease-in-out infinite}.cv-ring{animation:cv-ring 1.4s ease-in-out infinite}@media (prefers-reduced-motion:reduce){.cv-float,.cv-twinkle,.cv-ring{animation:none!important}}`

function ChevronScene({className = 'w-full h-full'}: {className?: string}) {
  const stars: [number, number, number][] = [[40, 30, 2.2], [110, 70, 1.6], [190, 24, 2], [290, 50, 1.5], [380, 22, 2.4], [470, 64, 1.8], [560, 34, 2.2], [70, 150, 1.5], [520, 150, 1.7], [330, 196, 1.4]]
  return (
    <svg role="img" aria-label="A golden sky-skiff sailing past glowing arrows" viewBox="0 0 600 240" preserveAspectRatio="xMidYMid slice" className={className}>
      <defs>
        <linearGradient id="cvSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1E1B4B" />
          <stop offset="0.6" stopColor="#4C1D95" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
        <radialGradient id="cvGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FDE68A" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FDE68A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="600" height="240" fill="url(#cvSky)" />
      {stars.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#FFF7D6" className="cv-twinkle" style={{animationDelay: `${(i % 5) * 0.4}s`}} />
      ))}
      <circle cx="505" cy="62" r="34" fill="#C4B5FD" />
      <circle cx="517" cy="54" r="34" fill="#4C1D95" opacity="0.55" />
      <ellipse cx="0" cy="250" rx="260" ry="46" fill="#6D28D9" opacity="0.55" />
      <ellipse cx="600" cy="252" rx="280" ry="52" fill="#7C3AED" opacity="0.5" />
      <g className="cv-float">
        <ellipse cx="250" cy="142" rx="120" ry="60" fill="url(#cvGlow)" />
        <path d="M150 128 L232 128 L232 50 Z" fill="#FDE68A" />
        <path d="M242 128 L242 62 L318 128 Z" fill="#FBBF24" />
        <rect x="231" y="40" width="4" height="96" rx="2" fill="#7C2D12" />
        <path d="M235 40 L262 48 L235 56 Z" fill="#EF4444" />
        <path d="M130 130 L360 130 Q338 172 282 176 L206 176 Q150 170 130 130 Z" fill="#C2410C" />
        <path d="M138 138 L352 138" stroke="#FDBA74" strokeWidth="5" strokeLinecap="round" />
        <circle cx="200" cy="154" r="7" fill="#FEF3C7" />
        <circle cx="240" cy="156" r="7" fill="#FEF3C7" />
        <circle cx="280" cy="154" r="7" fill="#FEF3C7" />
      </g>
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M ${420 + i * 46} 92 L ${456 + i * 46} 128 L ${420 + i * 46} 164`} fill="none" stroke="#FBBF24" strokeOpacity={1 - i * 0.28} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" transform="translate(-0 0)" />
      ))}
      <circle cx="90" cy="196" r="11" fill="#78350F" opacity="0.8" />
      <circle cx="560" cy="205" r="8" fill="#78350F" opacity="0.8" />
    </svg>
  )
}

function StarTrail({done, total}: {done: number; total: number}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5" aria-label={`${Math.min(done, total)} of ${total} stars`}>
      {Array.from({length: total}).map((_, i) => (
        <span key={i} className={`inline-block text-2xl sm:text-3xl transition-all duration-300 ${i < done ? 'scale-110' : 'opacity-25 grayscale'}`} aria-hidden="true">⭐</span>
      ))}
    </div>
  )
}

const VX_CSS = `@keyframes cv-spin{to{transform:rotate(360deg)}}@keyframes cv-spin-rev{to{transform:rotate(-360deg)}}.cv-spin{animation:cv-spin 38s linear infinite}.cv-spin-rev{animation:cv-spin-rev 26s linear infinite}@media (prefers-reduced-motion:reduce){.cv-spin,.cv-spin-rev{animation:none!important}}`

// Decorative swirl behind the sunbird and moth. The centre stays dark and the same for every sighting,
// so the sunbird and moth are always seen against the same background.
function VortexBg({round = false}: {round?: boolean}) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${round ? 'rounded-full' : ''}`}>
      <style>{VX_CSS}</style>
      <div className="cv-spin absolute" style={{inset: '-35%', background: 'conic-gradient(from 0deg, #0F172A, #3B1A78, #0F172A, #0E5C57, #0F172A, #7C3A0A, #0F172A)'}} />
      <div className="cv-spin-rev absolute rounded-full border-4 border-dashed border-amber-200/25" style={{inset: '-8%'}} />
      <div className="cv-spin absolute rounded-full border-2 border-dotted border-sky-200/30" style={{inset: '10%'}} />
      <div className="absolute inset-0" style={{background: 'radial-gradient(circle at center, #0F172A 0%, rgba(15,23,42,.92) 38%, rgba(15,23,42,0) 78%)'}} />
    </div>
  )
}

function StarlightNodeSvg({isLit}: {isLit: boolean}) {
  return (
    <svg viewBox="0 0 60 60" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      {isLit && (
        <>
          <circle cx="30" cy="30" r="26" fill="#FDE68A" fillOpacity="0.25" className="animate-ping"/>
          <circle cx="30" cy="30" r="20" fill="#F59E0B" fillOpacity="0.3"/>
        </>
      )}
      <path
        d="M 30 10 L 35 25 L 50 30 L 35 35 L 30 50 L 25 35 L 10 30 L 25 25 Z"
        fill={isLit ? '#F59E0B' : '#CBD5E1'}
        stroke={isLit ? '#D97706' : '#94A3B8'}
        strokeWidth="1.5"
      />
      <circle cx="30" cy="30" r="4" fill={isLit ? '#FFFFFF' : '#64748B'}/>
    </svg>
  )
}

// Child Superpower Guild Classes
const GUILD_CLASSES = [
  {name: 'Canopy Sky Ranger', Svg: BowIconSvg, desc: 'Sharp Focus & Vigilant Watch'},
  {name: 'Astral Spellcaster', Svg: WandIconSvg, desc: 'Creative Spark & Quick Ideas'},
  {name: 'Sunfire Knight', Svg: ShieldIconSvg, desc: 'Calm Reflexes & Steady Courage'},
]

// Chapter 4: The Sunstone Power Charge (100% Visual Motor Inhibition & Delay of Gratification Trial)
const CHARGE_TRIALS = [
  {targetMs: 2500, title: 'Spark Charge', rewardText: 'Sunlight Spark Gathered!'},
  {targetMs: 3200, title: 'Flame Charge', rewardText: 'Solar Flame Awakened!'},
  {targetMs: 4000, title: 'Nova Charge', rewardText: 'Sunstone Crystal Fully Powered!'}
]

// Age bands. Text and tap targets grow as the child gets younger (young children react more slowly and tap
// less precisely, so larger targets and more time help); the star sequences and their pace rise with age
// (spatial span keeps growing through childhood). These are sizing and pacing choices informed by published
// child-interface and span research. They are not clinical norms.
type AgeBand = { id: string; xs: number; sm: number; base: number; chev: string; bird: string; grid: number; seqs: number[][]; stepMs: number; litMs: number }
const AGE_BANDS: AgeBand[] = [
  { id: '4-5', xs: 1.15, sm: 1.25, base: 1.4, chev: 'w-12 h-12 sm:w-24 sm:h-24', bird: 'w-40 h-40 sm:w-48 sm:h-48', grid: 420, seqs: [[1, 5], [3, 0, 6], [8, 4, 1, 6]], stepMs: 1000, litMs: 700 },
  { id: '6-8', xs: 1.05, sm: 1.15, base: 1.3, chev: 'w-12 h-12 sm:w-20 sm:h-20', bird: 'w-36 h-36 sm:w-44 sm:h-44', grid: 400, seqs: [[1, 5, 7], [3, 0, 6, 2], [8, 4, 1, 6, 3]], stepMs: 900, litMs: 600 },
  { id: '9-12', xs: 0.95, sm: 1.05, base: 1.15, chev: 'w-11 h-11 sm:w-16 sm:h-16', bird: 'w-32 h-32 sm:w-40 sm:h-40', grid: 380, seqs: [[4, 0, 7, 2], [1, 6, 3, 8, 5], [7, 2, 5, 0, 8, 3]], stepMs: 800, litMs: 520 },
  { id: '13-16', xs: 0.9, sm: 1, base: 1.1, chev: 'w-11 h-11 sm:w-16 sm:h-16', bird: 'w-32 h-32 sm:w-36 sm:h-36', grid: 360, seqs: [[2, 6, 1, 8, 4], [5, 0, 7, 3, 6, 1], [8, 3, 0, 5, 2, 7, 4]], stepMs: 700, litMs: 450 },
]
function bandFor(age: number): AgeBand {
  return age <= 5 ? AGE_BANDS[0] : age <= 8 ? AGE_BANDS[1] : age <= 12 ? AGE_BANDS[2] : AGE_BANDS[3]
}

// Star patterns are drawn fresh for every session so a child never meets the same pattern twice. Each level keeps the length it
// had before, every star is a different cell, and no three in a row sit on one line (which would make the pattern easier to chunk).
const STAR_LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]
// Consecutive stars should sit far apart: first try cells that do not touch at all (not even at a corner), then cells that
// do not share an edge, and only then any cell, so a pattern is always found.
function cellsTouch(a: number, b: number, diagonal: boolean): boolean {
  const dr = Math.abs(Math.floor(a / 3) - Math.floor(b / 3))
  const dc = Math.abs((a % 3) - (b % 3))
  return diagonal ? Math.max(dr, dc) <= 1 : dr + dc === 1
}
function randomStarSeq(len: number, avoid: number[][] = []): number[] {
  for (let tier = 0; tier < 3; tier++) {
    for (let tries = 0; tries < 400; tries++) {
      const cells = [0, 1, 2, 3, 4, 5, 6, 7, 8]
      for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[cells[i], cells[j]] = [cells[j], cells[i]]
      }
      const s = cells.slice(0, len)
      let ok = true
      for (let i = 1; i < len && ok; i++) {
        if (tier === 0 && cellsTouch(s[i - 1], s[i], true)) ok = false
        if (tier === 1 && cellsTouch(s[i - 1], s[i], false)) ok = false
        if (i >= 2 && STAR_LINES.some((l) => l.includes(s[i - 2]) && l.includes(s[i - 1]) && l.includes(s[i]))) ok = false
      }
      if (ok && avoid.some((a) => a.join() === s.join())) ok = false
      if (ok) return s
    }
  }
  return Array.from({length: len}, (_, i) => (i * 4) % 9)
}

function __McInner() {
  const [stage, setStage] = useState<'welcome' | 'avatar' | 'camera_setup' | 'cpt_story' | 'cpt_hold' | 'cpt_game' | 'flanker_story' | 'flanker_game' | 'memory_story' | 'memory_game' | 'situational_story' | 'situational_game' | 'trials' | 'parent_card' | 'agent_eval' | 'celebration'>('welcome')

  // Child Fantasy Persona
  const [heroName, setHeroName] = useState('')
  const [heroAge, setHeroAge] = useState(8)
  const [guildClass, setGuildClass] = useState('Canopy Sky Ranger')
  const [companion] = useState('Milo the Wise Owl')
  const band = bandFor(heroAge)
  // the last two games (star memory and Sunstone charge) use the dark night-sky look
  const darkStage = stage === 'memory_story' || stage === 'memory_game' || stage === 'situational_story' || stage === 'situational_game'

  // CPT-3 Randomized Parameters (Conners Continuous Performance Battery)
  const cptPlan = cptPlanFor(heroAge)
  const CPT_TOTAL_TRIALS = cptPlan.total
  const [cptResting, setCptResting] = useState(false)
  const cptRestingRef = useRef(false)
  const cptRestedAtRef = useRef(-1)
  const cptBlockMissRef = useRef<number[]>([])
  const cptBlockFaRef = useRef<number[]>([])
  const [cptTrialIndex, setCptTrialIndex] = useState(0)
  const [cptStimulus, setCptStimulus] = useState<'target' | 'distractor' | null>(null)
  const [cptResponseTimes, setCptResponseTimes] = useState<number[]>([])
  const [cptLastRt, setCptLastRt] = useState<number | null>(null)
  const [cptOmissions, setCptOmissions] = useState(0)
  const [cptCommissions, setCptCommissions] = useState(0)
  const [cptActive, setCptActive] = useState(false)
  const cptStartRef = useRef<number>(0)
  const cptRespondedRef = useRef<boolean>(false)

  // Randomized Flanker State
  const FLANKER_TOTAL_TRIALS = 12
  const [flankerTrialIndex, setFlankerTrialIndex] = useState(0)
  const [cptAnticipatory, setCptAnticipatory] = useState(0)
  const cptWindowOpenRef = useRef(false)
  const cptStimRef = useRef<'target' | 'distractor' | null>(null)
  const cptRtLogRef = useRef<{i: number; rt: number}[]>([])
  const flankerTotalsRef = useRef({congruent: 0, incongruent: 0})
  // every recorded steering answer in order (practice rounds are never logged)
  const flankerLogRef = useRef<{congruent: boolean; ok: boolean; ms: number}[]>([])
  const [flankerCongruentTimes, setFlankerCongruentTimes] = useState<number[]>([])
  const [flankerIncongruentTimes, setFlankerIncongruentTimes] = useState<number[]>([])
  const [currentFlanker, setCurrentFlanker] = useState<{centerDir: 'left' | 'right'; flankerDir: 'left' | 'right' | 'neutral'; isCongruent: boolean} | null>(null)
  const flankerStartRef = useRef<number>(0)
  // practice rounds (not recorded): demo1 = one arrow, demo2 = arrow with friends, ready = child chooses to start
  const [flankerPhase, setFlankerPhase] = useState<'demo1' | 'demo2' | 'ready' | 'real'>('real')
  const [flankerFx, setFlankerFx] = useState<{k: number; ok: boolean}>({k: 0, ok: true})
  const flankerLockRef = useRef(false)
  // practice rounds for the other games (never recorded)
  const events = usePlayEvents()
  // optional camera step: off unless the grown-up agrees on the camera_setup screen; numbers only, no video leaves the device
  const cam = useAttentionCamera()
  const {setSegment: setCamSegment, stop: stopCam} = cam
  useEffect(() => {
    if (stage === 'cpt_hold' || stage === 'cpt_game') setCamSegment('sunbird')
    else if (stage === 'flanker_game') setCamSegment('steering')
    else if (stage === 'memory_game') setCamSegment('stars')
    else setCamSegment('other')
    // the camera is only needed during play: it stops before the parent card and the summary
    if (stage === 'parent_card' || stage === 'agent_eval' || stage === 'celebration') stopCam()
  }, [stage, setCamSegment, stopCam])
  const [cptPrac, setCptPrac] = useState<'off' | 'bird' | 'bird_ok' | 'moth' | 'moth_oops' | 'moth_ok' | 'ready'>('off')
  // hold-still waits before the sunbird practice: three fixed waits; taps during a wait are early responses
  const HOLD_WAITS_MS = [3500, 5000, 4200] as const
  const [holdIdx, setHoldIdx] = useState(0)
  const [holdPhase, setHoldPhase] = useState<'wait' | 'go'>('wait')
  const [holdTaps, setHoldTaps] = useState<number[]>([])
  const [holdRts, setHoldRts] = useState<Array<number | null>>([])
  const holdGoAtRef = useRef<number>(0)
  const [memRetry, setMemRetry] = useState(0)
  const [memMsg, setMemMsg] = useState<'' | 'ok' | 'again'>('')
  const [memPracReady, setMemPracReady] = useState(false)
  const [chargePrac, setChargePrac] = useState(false)
  const [chargePracDone, setChargePracDone] = useState(false)

  // Astrolabe Memory Matrix State
  const [memoryLevel, setMemoryLevel] = useState(1)
  const [memorySequence, setMemorySequence] = useState<number[]>([])
  const [memoryUserSequence, setMemoryUserSequence] = useState<number[]>([])
  const [memoryLitCell, setMemoryLitCell] = useState<number | null>(null)
  // ?mode=tone plays each star as a tone instead of lighting it (chosen by the clinician, not the child)
  const starToneRef = useRef(false)
  const [memoryTapCell, setMemoryTapCell] = useState<number | null>(null)
  const [memoryPhase, setMemoryPhase] = useState<'showing' | 'input' | 'feedback'>('showing')
  const [memoryMaxSpan, setMemoryMaxSpan] = useState(0)
  // one entry per real star level (practice is never logged)
  const starPlanRef = useRef<{bandId: string; levels: number[][]; prac1: number[]; prac2: number[]} | null>(null)
  const starLogRef = useRef<{length: number; completed: boolean; missedAt: number | null}[]>([])

  // Chapter 4: Sunstone Charge State (100% Game, Zero Questions)
  const [chargeTrialIndex, setChargeTrialIndex] = useState(0)
  const [isCharging, setIsCharging] = useState(false)
  const [chargeProgress, setChargeProgress] = useState(0)
  const [chargeStatusText, setChargeStatusText] = useState<'idle' | 'charging' | 'early' | 'success'>('idle')
  const [prematureReleases, setPrematureReleases] = useState(0)
  const chargeStartRef = useRef<number>(0)
  const chargeIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Agent Output
  const [agentResult, setAgentResult] = useState<any>(null)
  const [showClinicalDossier, setShowClinicalDossier] = useState(false)
  const [keeperObs, setKeeperObs] = useState<any>(null)
  const [parentOk, setParentOk] = useState(false)
  const [notice, setNotice] = useState('')

  // star-sequence mode: ?mode=tone on the page address selects the tone version
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('mode') === 'tone') starToneRef.current = true
  }, [])

  // hold-still waits: the chime sounds after a fixed wait, then the child taps; a tap during the wait is an early response
  useEffect(() => {
    if (stage !== 'cpt_hold' || holdPhase !== 'wait') return
    const t = setTimeout(() => {
      holdGoAtRef.current = performance.now()
      setHoldPhase('go')
      playAudio('chime')
    }, HOLD_WAITS_MS[holdIdx])
    return () => clearTimeout(t)
    // HOLD_WAITS_MS is a fixed list defined in render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, holdPhase, holdIdx])

  useEffect(() => {
    if (stage !== 'cpt_hold' || holdPhase !== 'go') return
    const t = setTimeout(() => finishHold(null), 5000)
    return () => clearTimeout(t)
    // finishHold is rebuilt from the same state on every render, so this timer always sees current values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, holdPhase, holdIdx])

  function finishHold(rt: number | null) {
    setHoldRts((r) => [...r, rt])
    if (holdIdx + 1 < HOLD_WAITS_MS.length) {
      setHoldIdx((i) => i + 1)
      setHoldPhase('wait')
    } else {
      setStage('cpt_game')
    }
  }

  // steering skin: ?skin=rocket on the page address selects the rocket version (chosen by the clinician, not the child)
  const [steerSkin, setSteerSkin] = useState<'arrows' | 'rocket'>('arrows')
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('skin') === 'rocket') setSteerSkin('rocket')
  }, [])

  // Keyboard Navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (stage === 'cpt_game' && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault()
        handleCptTap()
      } else if (stage === 'flanker_game') {
        if (e.code === 'ArrowLeft') {
          e.preventDefault()
          handleFlankerAnswer('left')
        } else if (e.code === 'ArrowRight') {
          e.preventDefault()
          handleFlankerAnswer('right')
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  // Go/no-go loop. Fixed order (CPT_ORDER / CPT_WAITS). A tap counts from when the shape appears until
  // CPT_WINDOW_MS later, even if the shape has gone. Every timer is cleared when the trial or stage changes.
  useEffect(() => {
    if (stage !== 'cpt_game') return
    if (cptPrac !== 'off') return

    if (cptTrialIndex >= CPT_TOTAL_TRIALS) {
      playAudio('fanfare')
      setStage('flanker_story')
      return
    }

    // child-controlled rest between rounds; no timers run while resting
    if (cptTrialIndex > 0 && cptTrialIndex % cptPlan.size === 0 && cptRestedAtRef.current !== cptTrialIndex) {
      cptRestingRef.current = true
      setCptResting(true)
      return
    }
    const stim = CPT_ORDER[cptTrialIndex % CPT_ORDER.length] === 'G' ? 'target' : 'distractor'
    const wait = CPT_WAITS[cptTrialIndex % CPT_WAITS.length]
    const displayDuration = cptPlan.displayMs
    const timers: ReturnType<typeof setTimeout>[] = []
    const later = (fn: () => void, ms: number) => { timers.push(setTimeout(fn, ms)) }

    cptRespondedRef.current = false
    cptWindowOpenRef.current = false
    cptStimRef.current = null

    later(() => {
      cptStimRef.current = stim
      cptWindowOpenRef.current = true
      setCptStimulus(stim)
      setCptActive(true)
      cptStartRef.current = performance.now()
      // re-stamp once the browser has painted the shape, so the clock starts when the child can see it
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (cptStimRef.current === stim && !cptRespondedRef.current) cptStartRef.current = performance.now()
      }))
      later(() => { setCptStimulus(null); setCptActive(false) }, displayDuration)
      later(() => {
        cptWindowOpenRef.current = false
        if (stim === 'target' && !cptRespondedRef.current) {
          setCptOmissions((o) => o + 1)
          const b = Math.floor(cptTrialIndex / cptPlan.size)
          cptBlockMissRef.current[b] = (cptBlockMissRef.current[b] || 0) + 1
        }
        later(() => setCptTrialIndex((i) => i + 1), 340)
      }, cptPlan.windowMs)
    }, wait)

    return () => timers.forEach(clearTimeout)
  }, [stage, cptTrialIndex, heroAge, cptResting, cptPrac])

  function handleCptPracTap() {
    if (cptPrac === 'bird') { playAudio('hit'); setCptPrac('bird_ok') }
    else if (cptPrac === 'moth') { playAudio('miss'); setCptPrac('moth_oops') }
  }

  // practice steps move on by themselves; the real game only starts when the child presses the ready button
  useEffect(() => {
    if (stage !== 'cpt_game') return
    let t: ReturnType<typeof setTimeout> | undefined
    if (cptPrac === 'bird_ok') t = setTimeout(() => setCptPrac('moth'), 1200)
    else if (cptPrac === 'moth') t = setTimeout(() => { playAudio('star'); setCptPrac('moth_ok') }, 3200)
    else if (cptPrac === 'moth_oops') t = setTimeout(() => setCptPrac('moth'), 1600)
    else if (cptPrac === 'moth_ok') t = setTimeout(() => setCptPrac('ready'), 1500)
    return () => { if (t) clearTimeout(t) }
  }, [stage, cptPrac])

  function handleCptTap() {
    if (cptPrac !== 'off') { handleCptPracTap(); return }
    if (cptRestingRef.current) return
    // nothing is on screen: not a hit and not a miss, but worth recording
    if (!cptWindowOpenRef.current) {
      setCptAnticipatory((n) => n + 1)
      return
    }
    if (cptRespondedRef.current) return
    cptRespondedRef.current = true
    const elapsed = Math.round(performance.now() - cptStartRef.current)

    if (cptStimRef.current === 'target') {
      if (elapsed < CPT_MIN_RT_MS) {
        setCptAnticipatory((n) => n + 1)
        playAudio('hit')
        return
      }
      setCptLastRt(elapsed)
      playAudio('hit')
      setCptResponseTimes((prev) => [...prev, elapsed])
      cptRtLogRef.current.push({i: cptTrialIndex, rt: elapsed})
    } else {
      playAudio('miss')
      setCptCommissions((c) => c + 1)
      const fb = Math.floor(cptTrialIndex / cptPlan.size)
      cptBlockFaRef.current[fb] = (cptBlockFaRef.current[fb] || 0) + 1
    }
  }

  // Flanker Randomizer Loop
  useEffect(() => {
    if (stage !== 'flanker_game') return

    // practice rounds never touch the recorded numbers
    if (flankerPhase === 'demo1') { setCurrentFlanker({centerDir: 'right', flankerDir: 'neutral', isCongruent: true}); return }
    if (flankerPhase === 'demo2') { setCurrentFlanker({centerDir: 'left', flankerDir: 'right', isCongruent: false}); return }
    if (flankerPhase === 'ready') return

    if (flankerTrialIndex >= FLANKER_TOTAL_TRIALS) {
      playAudio('fanfare')
      setStage('memory_story')
      return
    }

    const spec = FLANKER_ORDER[flankerTrialIndex % FLANKER_ORDER.length]
    const center: 'left' | 'right' = spec[0] === 'L' ? 'left' : 'right'
    const isCongruent = spec[1] === 'C'
    const flanker = isCongruent ? center : center === 'left' ? 'right' : 'left'

    setCurrentFlanker({centerDir: center, flankerDir: flanker, isCongruent})
    flankerStartRef.current = performance.now()
  }, [stage, flankerTrialIndex, flankerPhase])

  function handleFlankerAnswer(dir: 'left' | 'right') {
    if (!currentFlanker) return
    if (flankerPhase === 'ready') return
    if (flankerPhase === 'demo1' || flankerPhase === 'demo2') {
      if (flankerLockRef.current) return
      const ok = dir === currentFlanker.centerDir
      setFlankerFx((f) => ({k: f.k + 1, ok}))
      if (!ok) { playAudio('miss'); return }
      playAudio('star')
      flankerLockRef.current = true
      const next = flankerPhase === 'demo1' ? 'demo2' : 'ready'
      setTimeout(() => { flankerLockRef.current = false; setFlankerPhase(next) }, 1100)
      return
    }
    setFlankerFx((f) => ({k: f.k + 1, ok: dir === currentFlanker.centerDir}))
    flankerTotalsRef.current[currentFlanker.isCongruent ? 'congruent' : 'incongruent'] += 1
    const elapsed = Math.round(performance.now() - flankerStartRef.current)
    flankerLogRef.current.push({congruent: currentFlanker.isCongruent, ok: dir === currentFlanker.centerDir, ms: elapsed})

    if (dir === currentFlanker.centerDir) {
      playAudio('star')
      if (currentFlanker.isCongruent) {
        setFlankerCongruentTimes((prev) => [...prev, elapsed])
      } else {
        setFlankerIncongruentTimes((prev) => [...prev, elapsed])
      }
    } else {
      playAudio('miss')
    }
    setFlankerTrialIndex((i) => i + 1)
  }

  // Memory Matrix (Dynamic Astrolabe Span)
  useEffect(() => {
    if (stage !== 'memory_game') return

    // New patterns for every session (see randomStarSeq), drawn once and kept, so a replay of a level shows the same pattern.
    // The lengths match the age band's three levels, so the span measured is on the same scale for every child.
    let plan = starPlanRef.current
    if (!plan || plan.bandId !== band.id) {
      const levels: number[][] = []
      band.seqs.forEach((s) => levels.push(randomStarSeq(s.length, levels)))
      plan = {bandId: band.id, levels, prac1: [Math.floor(Math.random() * 9)], prac2: randomStarSeq(2)}
      starPlanRef.current = plan
    }
    const MEMORY_SEQS = plan.levels
    // levels -1 and 0 are practice (one star, then two); real levels start at 1
    const seq: number[] = memoryLevel === -1 ? plan.prac1 : memoryLevel === 0 ? plan.prac2 : MEMORY_SEQS[Math.min(memoryLevel, MEMORY_SEQS.length) - 1]
    setMemorySequence(seq)
    setMemoryUserSequence([])
    setMemoryPhase('showing')

    seq.forEach((cell, idx) => {
      setTimeout(() => {
        if (starToneRef.current) {
          playTone(STAR_TONE_HZ[cell])
        } else {
          setMemoryLitCell(cell)
          playAudio('star')
          setTimeout(() => setMemoryLitCell(null), band.litMs)
        }
      }, 500 + idx * band.stepMs)
    })

    const timer = setTimeout(() => {
      setMemoryPhase('input')
    }, 500 + seq.length * band.stepMs)

    return () => clearTimeout(timer)
  }, [stage, memoryLevel, band.id, memRetry])

  function handleMemoryPracClick(cellIdx: number) {
    playAudio('star')
    const updated = [...memoryUserSequence, cellIdx]
    setMemoryUserSequence(updated)
    const step = updated.length - 1
    if (updated[step] !== memorySequence[step]) {
      playAudio('miss')
      setMemoryPhase('feedback')
      setMemMsg('again')
      setTimeout(() => { setMemMsg(''); setMemRetry((n) => n + 1) }, 1400)
      return
    }
    if (updated.length === memorySequence.length) {
      playAudio('hit')
      setMemoryPhase('feedback')
      setMemMsg('ok')
      setTimeout(() => { setMemMsg(''); if (memoryLevel === -1) setMemoryLevel(0); else setMemPracReady(true) }, 1200)
    }
  }

  function handleMemoryClick(cellIdx: number) {
    if (memoryPhase !== 'input') return
    if (memoryLevel < 1) { handleMemoryPracClick(cellIdx); return }
    if (starToneRef.current) playTone(STAR_TONE_HZ[cellIdx]); else playAudio('star')
    const updated = [...memoryUserSequence, cellIdx]
    setMemoryUserSequence(updated)

    const step = updated.length - 1
    if (updated[step] !== memorySequence[step]) {
      playAudio('miss')
      setMemoryPhase('feedback')
      starLogRef.current.push({length: memorySequence.length, completed: false, missedAt: step + 1})
      setTimeout(() => {
        if (memoryLevel < 3) setMemoryLevel((l) => l + 1)
        else {
          playAudio('fanfare')
          setStage('situational_story')
        }
      }, 700)
      return
    }

    if (updated.length === memorySequence.length) {
      playAudio('hit')
      setMemoryMaxSpan(memorySequence.length)
      starLogRef.current.push({length: memorySequence.length, completed: true, missedAt: null})
      setMemoryPhase('feedback')
      setTimeout(() => {
        if (memoryLevel < 3) setMemoryLevel((l) => l + 1)
        else {
          playAudio('fanfare')
          setStage('situational_story')
        }
      }, 800)
    }
  }

  // Chapter 4: Sunstone Charge Handlers (100% Tactile Hold Game, Zero Questions)
  function handleStartCharge() {
    if (chargeTrialIndex >= CHARGE_TRIALS.length || isCharging) return
    setIsCharging(true)
    setChargeStatusText('charging')
    setChargeProgress(0)
    chargeStartRef.current = performance.now()
    playAudio('whoosh')

    const target = chargePrac ? 1500 : CHARGE_TRIALS[chargeTrialIndex].targetMs

    chargeIntervalRef.current = setInterval(() => {
      const elapsed = performance.now() - chargeStartRef.current
      const pct = Math.min(100, Math.round((elapsed / target) * 100))
      setChargeProgress(pct)

      if (elapsed >= target) {
        if (chargeIntervalRef.current) clearInterval(chargeIntervalRef.current)
        chargeIntervalRef.current = null
        setIsCharging(false)
        setChargeProgress(100)
        setChargeStatusText('success')
        playAudio('star')
        playAudio('fanfare')

        setTimeout(() => {
          if (chargePrac) {
            setChargePrac(false)
            setChargePracDone(true)
            setChargeProgress(0)
            setChargeStatusText('idle')
            return
          }
          if (chargeTrialIndex + 1 < CHARGE_TRIALS.length) {
            setChargeTrialIndex((idx) => idx + 1)
            setChargeProgress(0)
            setChargeStatusText('idle')
          } else {
            setStage('parent_card')
          }
        }, 1400)
      }
    }, 30)
  }

  function handleEndCharge() {
    if (!isCharging) return
    if (chargeIntervalRef.current) {
      clearInterval(chargeIntervalRef.current)
      chargeIntervalRef.current = null
    }

    const elapsed = performance.now() - chargeStartRef.current
    const target = chargePrac ? 1500 : CHARGE_TRIALS[chargeTrialIndex].targetMs

    if (elapsed < target) {
      setIsCharging(false)
      setChargeProgress(0)
      setChargeStatusText('early')
      if (!chargePrac) setPrematureReleases((p) => p + 1)
      playAudio('miss')
    }
  }

  useEffect(() => {
    return () => {
      if (chargeIntervalRef.current) clearInterval(chargeIntervalRef.current)
    }
  }, [])

  // Submit via Multi-Node Agent
  async function submitCognitiveAgent(parent?: ParentAnswers) {
    setStage('agent_eval')

    const meanOf = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
    const hrt = meanOf(cptResponseTimes)
    const rtv = hrt !== null && cptResponseTimes.length > 1
      ? Math.sqrt(cptResponseTimes.map((x) => Math.pow(x - hrt, 2)).reduce((a, b) => a + b, 0) / cptResponseTimes.length)
      : null
    const avgCong = meanOf(flankerCongruentTimes)
    const avgIncong = meanOf(flankerIncongruentTimes)
    const flankerCost = avgCong !== null && avgIncong !== null ? Math.max(0, Math.round(avgIncong - avgCong)) : null

    const halfOf = (from: number, to: number) => {
      const xs = cptRtLogRef.current.filter((x) => x.i >= from && x.i < to).map((x) => x.rt)
      const m = meanOf(xs)
      return xs.length >= 3 && m !== null ? Math.round(m) : null
    }
    const cptTargets = CPT_ORDER.slice(0, CPT_TOTAL_TRIALS).split('').filter((x) => x === 'G').length
    const cptBlocks = {
      size: cptPlan.size,
      count: cptPlan.blocks,
      displayMs: cptPlan.displayMs,
      windowMs: cptPlan.windowMs,
      rtMs: Array.from({length: cptPlan.blocks}, (_, b) => halfOf(b * cptPlan.size, (b + 1) * cptPlan.size)),
      misses: Array.from({length: cptPlan.blocks}, (_, b) => cptBlockMissRef.current[b] || 0),
      wrongTaps: Array.from({length: cptPlan.blocks}, (_, b) => cptBlockFaRef.current[b] || 0)
    }

    const ev = events.snapshot()
    const payload = {
      assessmentType: 'adhd',
      childName: heroName || 'Canopy Ranger',
      childAge: heroAge,
      guildClass,
      companion,
      cptBlocks,
      steerTrials: flankerLogRef.current,
      starLevels: starLogRef.current,
      telemetry: {
        cptTrials: CPT_TOTAL_TRIALS,
        cptResponses: cptResponseTimes.length,
        omissions: cptOmissions,
        commissions: cptCommissions,
        hrtMs: hrt !== null ? Math.round(hrt) : null,
        rtvMs: rtv !== null ? Math.round(rtv) : null,
        flankerCostMs: flankerCost,
        flankerCongruentN: flankerCongruentTimes.length,
        flankerIncongruentN: flankerIncongruentTimes.length,
        workingMemorySpan: memoryMaxSpan > 0 ? memoryMaxSpan : null,
        prematureReleases,
        chargeTrials: CHARGE_TRIALS.length,
        cptTargets,
        cptNonTargets: CPT_TOTAL_TRIALS - cptTargets,
        cptAnticipatory,
        rtFirstHalfMs: halfOf(0, CPT_TOTAL_TRIALS / 2),
        rtSecondHalfMs: halfOf(CPT_TOTAL_TRIALS / 2, CPT_TOTAL_TRIALS),
        flankerCongruentTotal: flankerTotalsRef.current.congruent,
        flankerIncongruentTotal: flankerTotalsRef.current.incongruent,
        retrySunbird: ev.retries.sunbird ?? 0,
        retrySteering: ev.retries.steering ?? 0,
        retryStars: ev.retries.stars ?? 0,
        // the parent card (each answer is 0 to 2, or null when skipped)
        parentTired: parent?.tired ?? null,
        parentLikeHome: parent?.likeHome ?? null,
        parentEnjoyed: parent?.enjoyed ?? null,
        // 1 when the steering game was played as the rocket version (same rules, same measure)
        steerRocket: steerSkin === 'rocket' ? 1 : 0,
        // 1 when the star sequence used tones instead of lights
        starTone: starToneRef.current ? 1 : 0,
        // hold-still waits: how many had an early tap (of 3), and the average time to tap after the chime
        holdTries: HOLD_WAITS_MS.length,
        holdEarly: holdTaps.filter((n) => n > 0).length,
        holdRtMs: holdRts.filter((x): x is number => x !== null).length
          ? Math.round(holdRts.filter((x): x is number => x !== null).reduce((a, b) => a + b, 0) / holdRts.filter((x): x is number => x !== null).length)
          : null,
        pauseCount: ev.pauseCount,
        pausedSec: ev.pausedSec,
        // optional camera step: empty unless the camera was turned on
        ...cam.telemetry()
      }
    }

    try {
      const res = await fetch('/api/assessments/agent', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({...payload, environment: captureEnvironment()})
      })
      if (!res.ok) throw new Error('Agent evaluation failed')
      const json = await res.json()
      setAgentResult(json.data)
      setKeeperObs(payload.telemetry)
      setStage('celebration')
      playAudio('fanfare')
    } catch (err) {
      console.error(err)
      setNotice('Something went wrong while writing the summary. Please try again.')
      setStage('welcome')
    }
  }

  return (
    <main data-no-listen="true" className={`relative min-h-screen ${darkStage ? 'bg-[#0B132B]' : 'bg-[#EAF3F8]'} q-age py-8 px-4 font-poppins text-[#1F2937] overflow-x-hidden selection:bg-amber-400 selection:text-amber-950`}>
      <style>{`.q-age .text-xs{font-size:${band.xs}rem!important;line-height:1.55!important}.q-age .text-sm{font-size:${band.sm}rem!important;line-height:1.55!important}.q-age .text-base{font-size:${band.base}rem!important;line-height:1.6!important}`}</style>
      {/* Immersive Fantasy Sky Citadel Celestial Backdrop */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <QuestStyles />
        <Fireflies color={darkStage ? '#FDE68A' : '#D97706'} />
        {/* Full-bleed citadel illustration with ambient atmospheric blur */}
        <img
          src="/decor/itw/quest-sky-citadel-banner.webp"
          alt="Sky Citadel Panorama"
          className="w-full h-full object-cover object-center opacity-30 filter blur-[2px] scale-105"
        />
        {/* Enchanted celestial overlays & radial starlight glows */}
        <div className={`absolute inset-0 bg-gradient-to-b ${darkStage ? 'from-[#0B132B]/75 via-[#1C2541]/70 to-[#0B132B]/90' : 'from-[#F4F9FC]/80 via-[#E4EFF6]/75 to-[#EAF3F8]/90'}`} />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[55rem] h-[30rem] rounded-full bg-gradient-to-b from-amber-400/20 via-orange-500/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -left-32 w-96 h-96 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -right-32 w-96 h-96 rounded-full bg-amber-300/15 blur-3xl pointer-events-none" />
        {/* Floating starlight constellation specks */}
        <div className={`absolute inset-0 opacity-40 ${darkStage ? 'bg-[radial-gradient(#FDE68A_1px,transparent_1px)]' : 'bg-[radial-gradient(#9DB9D1_1px,transparent_1px)]'} [background-size:32px_32px]`} />
      </div>

      {notice && <div role="alert" className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-xl">{notice} <button type="button" className="ml-3 underline" onClick={() => setNotice('')}>Dismiss</button></div>}
      <AmbientToggle mood="citadel" />
      <div key={stage} className="mx-auto max-w-4xl relative z-10 qd-stage">
        {/* Navigation & Realm Indicator */}
        <div className={`mb-6 flex items-center justify-between text-xs ${darkStage ? '' : '[&_*]:text-[#1F2937]'}`}>
          <Link href="/gamified-assessments" prefetch={false} className="font-bold text-amber-300 hover:text-amber-200 hover:underline flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-300/30 shadow-sm">
            ← Gamified Quests
          </Link>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-black/40 backdrop-blur-md px-3.5 py-1.5 font-bold text-amber-200 border border-amber-400/40 shadow-sm">
              Play-Based Attention Quest • Not a Diagnosis
            </span>
          </div>
        </div>

        <ReadAloud age={heroAge} stage={stage} />
        {/* 1. WELCOME SCREEN: FANTASY HERO REALM */}
        {stage === 'welcome' && (
          <div className="rounded-3xl border-2 border-[#FDE68A] bg-white overflow-hidden shadow-2xl">
            {/* Storybook Hero Panorama */}
            <div className="relative h-64 md:h-84 w-full overflow-hidden bg-gradient-to-tr from-[#FEF3C7] to-[#DCFCE7]">
              <img
                src="/decor/itw/quest-sky-citadel-banner.webp"
                alt="Floating Sky Citadel of Aethelgard"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent flex items-end p-6 md:p-8">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 backdrop-blur-md px-3.5 py-1 text-xs font-bold text-amber-200 border border-amber-300/30 mb-2">
                    ★ The Chronicles of the Sunbird • Chapter Quest
                  </div>
                  <h1 className="font-patrick text-3xl sm:text-4xl md:text-5xl text-white font-bold leading-tight drop-shadow-md">
                    The Sky Citadel of Aethelgard
                  </h1>
                  <p className="text-xs sm:text-sm text-white/90 max-w-2xl mt-1">
                    Join Milo the Owl on a high-flying adventure above the clouds. Test your reflexes, navigate starry meteor storms, and unlock your mind’s natural superpowers.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-10">
              <WelcomeWizard
                theme="amber"
                classLabel="Explorer Guild Class"
                classes={GUILD_CLASSES}
                selected={guildClass}
                onSelect={(n) => { playAudio('tap'); setGuildClass(n) }}
                nameLabel="Explorer Codename"
                namePlaceholder="e.g. Captain Arjun or Arya Star-Seeker"
                name={heroName}
                onName={setHeroName}
                ages={[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]}
                age={heroAge}
                onAge={setHeroAge}
                ageNote={(a) => (a <= 8 ? 'For this age the games use larger targets, and each story screen has a Hear this button that reads the instructions aloud.' : 'For this age the games use standard-size targets.')}
                consent={parentOk}
                onConsent={setParentOk}
                startLabel="Embark on Quest: Chapter 1 →"
                onStart={() => { playAudio('chime'); setStage('camera_setup') }}
                onTick={() => playAudio('tap')}
              />
            </div>
          </div>
        )}

        {/* 1b. OPTIONAL CAMERA STEP (for the grown-up) */}
        {stage === 'camera_setup' && (
          <CameraConsent cam={cam} childName={heroName} onContinue={() => { playAudio('chime'); setStage('cpt_story') }} />
        )}

        {/* 2. CHAPTER 1 STORY: THE SUNBIRD AND THE MOTH (picture first) */}
        {stage === 'cpt_story' && (
          <div className="rounded-3xl border-2 border-amber-300/40 bg-white/95 backdrop-blur-md overflow-hidden shadow-2xl">
            <style>{CV_CSS}</style>
            <div className="relative h-56 md:h-64 w-full overflow-hidden bg-[#0F172A]">
              <VortexBg />
              <div className="relative z-10 flex h-full items-center justify-center gap-6 sm:gap-10">
                <SunbirdTarget className="h-28 w-28 sm:h-36 sm:w-36" />
                <MothDistractor className="h-24 w-24 sm:h-32 sm:w-32" />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5">
                <h2 className="font-patrick text-3xl md:text-4xl text-white font-bold">The Sunbird and the Moth</h2>
              </div>
            </div>

            <div className="p-6 md:p-8 text-center">
              <div className="grid grid-cols-2 gap-4 mb-5 max-w-md mx-auto">
                <div className="rounded-2xl bg-amber-50 border-2 border-amber-300 p-4">
                  <div className="mx-auto h-16 w-16"><SunbirdTarget className="h-full w-full" /></div>
                  <p className="mt-1 text-2xl font-bold text-amber-800">TAP!</p>
                </div>
                <div className="rounded-2xl bg-rose-50 border-2 border-rose-300 p-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center"><MothDistractor className="h-full w-full" /></div>
                  <p className="mt-1 text-2xl font-bold text-rose-800">WAIT</p>
                </div>
              </div>
              <p className="text-base md:text-lg font-bold text-[#1F2937] mb-1">Tap fast for the sunbird. Wait for the moth.</p>
              <p className="text-xs text-slate-500 mb-5">After a short practice: {CPT_TOTAL_TRIALS} sightings in {cptPlan.blocks} rounds, with rests.</p>
              <button
                type="button"
                onClick={() => {
                  playAudio('whoosh')
                  setCptTrialIndex(0)
                  setCptResponseTimes([])
                  setCptOmissions(0)
                  setCptCommissions(0)
                  setCptLastRt(null)
                  setCptAnticipatory(0)
                  setCptResting(false)
                  cptRestingRef.current = false
                  cptRestedAtRef.current = -1
                  cptBlockMissRef.current = []
                  cptBlockFaRef.current = []
                  cptRtLogRef.current = []
                  flankerTotalsRef.current = {congruent: 0, incongruent: 0}
                  setCptPrac('bird')
                  setHoldIdx(0)
                  setHoldPhase('wait')
                  setHoldTaps([])
                  setHoldRts([])
                  setStage('cpt_hold')
                }}
                className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-10 py-4 text-lg font-bold text-white shadow-lg hover:scale-105 transition-all"
              >
                Let’s practice →
              </button>
            </div>
          </div>
        )}

        {/* 2b. SUNBIRD PRACTICE (not recorded) */}
        {stage === 'cpt_hold' && (
          <div className="rounded-3xl border-2 border-amber-300/40 bg-[#0F172A]/90 backdrop-blur-md p-6 md:p-10 shadow-2xl text-center select-none text-amber-50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-200 bg-white/10 px-3.5 py-1 rounded-full">
                Wait {holdIdx + 1} of {HOLD_WAITS_MS.length}
              </span>
              <span className="text-xs font-bold text-amber-200">Hold still</span>
            </div>
            <p className="font-patrick text-2xl md:text-3xl font-bold mb-4" aria-live="polite">
              {holdPhase === 'wait' ? 'Hold still and wait for the chime. Do not tap yet.' : 'Chime! Tap the sunbird now!'}
            </p>
            <div
              onPointerDown={() => {
                if (holdPhase === 'wait') {
                  setHoldTaps((t) => { const n = [...t]; n[holdIdx] = (n[holdIdx] ?? 0) + 1; return n })
                  playAudio('miss')
                  return
                }
                playAudio('hit')
                const rt = Math.round(performance.now() - holdGoAtRef.current)
                finishHold(rt)
              }}
              className="relative mx-auto my-4 flex h-64 w-full max-w-sm cursor-pointer items-center justify-center rounded-full border-8 border-amber-300/80 bg-[#1E293B]"
            >
              <VortexBg round />
              <div className="relative z-10">
                <SunbirdTarget className={holdPhase === 'go' ? 'w-32 h-32' : 'w-28 h-28 opacity-60'} />
              </div>
            </div>
            <p className="text-xs text-amber-200/80 min-h-[1.5em]">
              {holdPhase === 'wait' && holdTaps[holdIdx] ? 'Not yet. Wait for the chime.' : ''}
            </p>
          </div>
        )}

        {stage === 'cpt_game' && cptPrac !== 'off' && (
          <div className="relative rounded-3xl border-2 border-amber-300/40 bg-white/95 backdrop-blur-md p-6 md:p-10 shadow-2xl text-center select-none">
            <style>{CV_CSS}</style>
            {cptPrac === 'ready' ? (
              <div className="flex flex-col items-center gap-3 py-2">
                <img src="/decor/milo-owl.webp" alt="" aria-hidden="true" className="cv-float h-20 w-20" />
                <p className="font-patrick text-3xl text-amber-800 font-bold">Great job!</p>
                <div className="my-2 flex items-center justify-center gap-6">
                  <div className="text-center">
                    <div className="mx-auto h-20 w-20 rounded-2xl bg-[#1E293B] p-1"><SunbirdTarget className="h-full w-full" /></div>
                    <p className="mt-1 text-xl font-bold text-amber-800">TAP!</p>
                  </div>
                  <div className="text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#1E293B] p-1"><MothDistractor className="h-14 w-14" /></div>
                    <p className="mt-1 text-xl font-bold text-rose-800">WAIT</p>
                  </div>
                </div>
                <button type="button" onClick={() => { playAudio('chime'); setCptPrac('off') }} className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-12 py-4 text-xl font-bold text-white shadow-lg hover:scale-105 transition-all">I’m ready →</button>
                <button type="button" onClick={() => { events.noteRetry('sunbird'); setCptPrac('bird') }} className="text-sm font-bold text-sky-700 underline">Practice again</button>
              </div>
            ) : (
              <>
                <span className="inline-block rounded-full bg-amber-100 px-4 py-1 text-sm font-bold text-amber-800">Practice</span>
                <div className="mt-3 flex items-center justify-center gap-3">
                  <img src="/decor/milo-owl.webp" alt="" aria-hidden="true" className="cv-float h-14 w-14" />
                  <p className="text-left text-base md:text-lg font-bold text-[#1F2937] max-w-xs" aria-live="polite">
                    {cptPrac === 'bird' ? 'Here comes the sunbird! Tap it!' : cptPrac === 'bird_ok' ? 'Yes! Great tap!' : cptPrac === 'moth' ? 'A moth! Do not tap. Just wait…' : cptPrac === 'moth_oops' ? 'Oops, that was the moth! Just wait.' : 'Perfect waiting!'}
                  </p>
                </div>
                <div
                  onPointerDown={handleCptPracTap}
                  className="relative mx-auto my-4 flex h-72 w-full max-w-sm cursor-pointer items-center justify-center rounded-full border-8 border-amber-300/80 bg-[#1E293B] active:scale-95 overflow-hidden"
                >
                  <VortexBg round />
                  <div className="relative z-10 flex items-center justify-center">
                    {cptPrac === 'bird' && <SunbirdTarget className={band.bird} />}
                    {(cptPrac === 'moth' || cptPrac === 'moth_oops') && <MothDistractor className="w-32 h-32" />}
                    {(cptPrac === 'bird_ok' || cptPrac === 'moth_ok') && <span aria-hidden="true" className="cv-float text-7xl">⭐</span>}
                  </div>
                </div>
                <button
                  type="button"
                  onPointerDown={handleCptPracTap}
                  onClick={(e) => { if (e.detail === 0) handleCptPracTap() }}
                  className={`w-full max-w-sm rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-7 text-2xl font-bold text-white shadow-lg active:scale-95 transition-all ${cptPrac === 'bird' ? 'cv-ring' : ''}`}
                >
                  TAP!
                </button>
              </>
            )}
          </div>
        )}

        {/* 3. CHAPTER 1 GAMEPLAY: CPT-3 VIGILANCE */}
        {stage === 'cpt_game' && cptPrac === 'off' && (
          <div className="relative rounded-3xl border-2 border-amber-300/40 bg-white/95 backdrop-blur-md p-6 md:p-10 shadow-2xl text-center select-none">
            {cptResting && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl bg-gradient-to-b from-[#FFF4D6] via-[#FFFDF6] to-[#E4F2EA] p-5 text-center sm:gap-4 sm:p-6">
                <style>{`@keyframes cr-breathe{0%,100%{transform:scale(.7);opacity:.5}50%{transform:scale(1);opacity:1}}@keyframes cr-bob{50%{transform:translateY(-8px)}}@media (prefers-reduced-motion:reduce){.cr-ring,.cr-owl{animation:none!important}}`}</style>
                <img src="/decor/milo-owl.webp" alt="" aria-hidden="true" className="cr-owl h-20 w-20" style={{ animation: 'cr-bob 3.2s ease-in-out infinite' }} />
                <h3 className="font-patrick text-4xl font-bold text-[#92400E]">Rest time</h3>
                <div className="flex items-center gap-2" role="img" aria-label={`${Math.floor(cptTrialIndex / cptPlan.size)} of ${cptPlan.blocks} rounds done`}>
                  {Array.from({ length: cptPlan.blocks }).map((_, i) => (
                    <span key={i} className={`h-3.5 w-3.5 rounded-full ${i < Math.floor(cptTrialIndex / cptPlan.size) ? 'bg-amber-500' : 'bg-amber-200'}`} />
                  ))}
                </div>
                <p className="text-sm font-semibold text-[#475569]">Round {Math.floor(cptTrialIndex / cptPlan.size)} of {cptPlan.blocks} is done. You found the {CPT_SCENES[(Math.floor(cptTrialIndex / cptPlan.size) - 1) % CPT_SCENES.length].stone}!</p>
                <div className="relative flex h-20 w-20 items-center justify-center">
                  <span className="cr-ring absolute inset-0 rounded-full bg-amber-300/60" style={{ animation: 'cr-breathe 6s ease-in-out infinite' }} />
                  <span className="relative text-xs font-semibold text-[#92400E]">Breathe</span>
                </div>
                <p className="max-w-xs text-sm text-[#475569]">Take a slow breath with the glowing circle. Press the button when you are ready for the next round.</p>
                <button
                  type="button"
                  onClick={() => { cptRestedAtRef.current = cptTrialIndex; cptRestingRef.current = false; setCptResting(false); playAudio('chime') }}
                  className="min-h-[52px] rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-10 py-3.5 text-base font-bold text-white shadow-lg transition-transform hover:scale-105"
                >
                  I am ready →
                </button>
              </div>
            )}
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] bg-[#F1F5F9] px-3.5 py-1 rounded-full">
                Sighting {Math.min(cptTrialIndex + 1, CPT_TOTAL_TRIALS)} of {CPT_TOTAL_TRIALS} · Round {Math.min(Math.floor(cptTrialIndex / cptPlan.size) + 1, cptPlan.blocks)} of {cptPlan.blocks} · {CPT_SCENES[Math.min(Math.floor(cptTrialIndex / cptPlan.size), cptPlan.blocks - 1) % CPT_SCENES.length].name}
              </span>
              <div className="flex items-center gap-2">
                {cptLastRt && (
                  <span className="text-xs font-bold text-[#05B076] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    Reflex: {cptLastRt} ms
                  </span>
                )}
                <div className="w-28 h-2.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{width: `${((cptTrialIndex + 1) / CPT_TOTAL_TRIALS) * 100}%`}}
                  />
                </div>
              </div>
            </div>

            <div
              onPointerDown={handleCptTap}
              className={`relative mx-auto my-6 flex h-72 w-full max-w-sm cursor-pointer items-center justify-center rounded-full border-8 ${CPT_SCENES[Math.min(Math.floor(cptTrialIndex / cptPlan.size), cptPlan.blocks - 1) % CPT_SCENES.length].ring} bg-[#1E293B] transition-all active:scale-95 overflow-hidden`}
            >
              <VortexBg round />
              {cptStimulus === 'target' && (
                <div className="relative z-10 flex flex-col items-center">
                  <SunbirdTarget className={band.bird} />
                </div>
              )}
              {cptStimulus === 'distractor' && (
                <div className="relative z-10 flex flex-col items-center">
                  <MothDistractor className="w-32 h-32" />
                </div>
              )}
              {!cptStimulus && (
                <div className="relative z-10 text-center text-amber-200/80">
                  <div className="h-16 w-16 mx-auto mb-2 rounded-full border-2 border-dashed border-amber-400/50 flex items-center justify-center bg-white/5">
                    <CompassRoseSvg className="w-6 h-6 text-amber-300" />
                  </div>
                  <span className="text-xs font-semibold text-amber-200">Watch…</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onPointerDown={handleCptTap}
              onClick={(e) => { if (e.detail === 0) handleCptTap() }}
              className="w-full max-w-sm rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-7 text-xl font-bold text-white shadow-lg active:scale-95 transition-all"
            >
              TAP!
            </button>
          </div>
        )}

        {/* 4. CHAPTER 2 STORY: THE SOLAR CHEVRONS (short, picture first) */}
        {stage === 'flanker_story' && (
          <div className="rounded-3xl border-2 border-amber-300/40 bg-white/95 backdrop-blur-md overflow-hidden shadow-2xl">
            <style>{CV_CSS}</style>
            <div className="relative h-56 md:h-64 w-full overflow-hidden bg-[#1E1B4B]">
              <ChevronScene className="h-full w-full" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5">
                <h2 className="font-patrick text-3xl md:text-4xl text-white font-bold">The Solar Chevrons</h2>
              </div>
            </div>
            <div className="p-6 md:p-8 text-center">
              <div className="flex items-center justify-center gap-4 mb-4">
                <img src="/decor/milo-owl.webp" alt="" aria-hidden="true" className="cv-float h-16 w-16" />
                <p className="text-left text-base md:text-lg font-bold text-[#1F2937] max-w-xs">Tap the way the big golden arrow points!</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  playAudio('whoosh')
                  setFlankerTrialIndex(0)
                  setFlankerCongruentTimes([])
                  setFlankerIncongruentTimes([])
                  flankerLockRef.current = false
                  setCurrentFlanker(null)
                  // younger children get both practice rounds; older children get the short second one
                  setFlankerPhase(band.id === '4-5' || band.id === '6-8' ? 'demo1' : 'demo2')
                  setStage('flanker_game')
                }}
                className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-10 py-4 text-lg font-bold text-white shadow-lg hover:scale-105 transition-all"
              >
                Let’s practice →
              </button>
            </div>
          </div>
        )}

        {/* 5. CHAPTER 2 GAMEPLAY: FLANKER (practice rounds first, then the 12 recorded formations) */}
        {stage === 'flanker_game' && flankerPhase === 'ready' && (
          <div className="rounded-3xl border-2 border-amber-300/40 bg-white/95 backdrop-blur-md p-8 md:p-10 shadow-2xl text-center select-none">
            <style>{CV_CSS}</style>
            <img src="/decor/milo-owl.webp" alt="" aria-hidden="true" className="cv-float mx-auto h-24 w-24" />
            <p className="font-patrick text-3xl text-amber-800 font-bold mt-3">Great job!</p>
            <p className="text-base md:text-lg font-bold text-[#1F2937] mt-2">Now the real game. Look at the big golden arrow!</p>
            <div className="mt-6 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => { playAudio('whoosh'); setFlankerTrialIndex(0); setFlankerCongruentTimes([]); setFlankerIncongruentTimes([]); flankerTotalsRef.current = {congruent: 0, incongruent: 0}; flankerLogRef.current = []; setFlankerPhase('real') }}
                className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-12 py-4 text-xl font-bold text-white shadow-lg hover:scale-105 transition-all"
              >
                I’m ready →
              </button>
              <button type="button" onClick={() => { events.noteRetry('steering'); flankerLockRef.current = false; setFlankerPhase('demo1') }} className="text-sm font-bold text-sky-700 underline">Practice again</button>
            </div>
          </div>
        )}

        {stage === 'flanker_game' && flankerPhase !== 'ready' && currentFlanker && (
          <div className="relative rounded-3xl border-2 border-amber-300/40 bg-white/95 backdrop-blur-md p-5 md:p-10 shadow-2xl text-center select-none">
            <style>{CV_CSS}</style>
            <div className="mb-4">
              {flankerPhase === 'real' ? (
                <StarTrail done={flankerTrialIndex} total={FLANKER_TOTAL_TRIALS} />
              ) : (
                <span className="inline-block rounded-full bg-amber-100 px-4 py-1 text-sm font-bold text-amber-800">Practice</span>
              )}
            </div>

            {flankerPhase !== 'real' && (
              <div className="mb-3 flex items-center justify-center gap-3">
                <img src="/decor/milo-owl.webp" alt="" aria-hidden="true" className="cv-float h-14 w-14" />
                <p className="text-left text-base md:text-lg font-bold text-[#1F2937] max-w-xs">
                  {flankerPhase === 'demo1' ? 'Tap the side the arrow points to!' : 'Look at the BIG golden arrow in the middle. Ignore the little ones!'}
                </p>
              </div>
            )}

            <div className="relative my-6 flex items-center justify-center gap-3 md:gap-6 p-4 sm:p-8 rounded-3xl bg-[#D6E6F2] shadow-inner min-h-[8rem]">
              {flankerPhase === 'demo1' ? (
                <FlankerGlyph skin={steerSkin} direction={currentFlanker.centerDir} isCenter={true} className="w-24 h-24 sm:w-32 sm:h-32" />
              ) : (
                <>
                  <FlankerGlyph skin={steerSkin} direction={currentFlanker.flankerDir} isCenter={false} className={band.chev} />
                  <FlankerGlyph skin={steerSkin} direction={currentFlanker.flankerDir} isCenter={false} className={band.chev} />
                  <FlankerGlyph skin={steerSkin} direction={currentFlanker.centerDir} isCenter={true} className={band.chev} />
                  <FlankerGlyph skin={steerSkin} direction={currentFlanker.flankerDir} isCenter={false} className={band.chev} />
                  <FlankerGlyph skin={steerSkin} direction={currentFlanker.flankerDir} isCenter={false} className={band.chev} />
                </>
              )}
              {flankerFx.k > 0 && (
                <span key={flankerFx.k} aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 text-5xl font-bold" style={{animation: 'cv-pop .9s ease-out forwards'}}>
                  {flankerFx.ok ? '⭐' : '💫'}
                </span>
              )}
            </div>

            {flankerPhase !== 'real' && flankerFx.k > 0 && (
              <p className="mb-3 font-patrick text-2xl font-bold text-amber-800" aria-live="polite">{flankerFx.ok ? 'Yes! Great!' : 'Try again! Look at the big golden one.'}</p>
            )}

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <button
                type="button"
                aria-label="Left"
                onClick={() => handleFlankerAnswer('left')}
                className={`rounded-3xl border-4 border-sky-500 bg-sky-100 py-6 shadow-md transition-all active:scale-95 flex items-center justify-center ${flankerPhase === 'demo1' && currentFlanker.centerDir === 'left' ? 'cv-ring' : ''}`}
              >
                <svg viewBox="0 0 48 48" className="h-16 w-16 sm:h-20 sm:w-20" fill="none"><path d="M 30 8 L 14 24 L 30 40" stroke="#0369A1" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button
                type="button"
                aria-label="Right"
                onClick={() => handleFlankerAnswer('right')}
                className={`rounded-3xl border-4 border-sky-500 bg-sky-100 py-6 shadow-md transition-all active:scale-95 flex items-center justify-center ${flankerPhase === 'demo1' && currentFlanker.centerDir === 'right' ? 'cv-ring' : ''}`}
              >
                <svg viewBox="0 0 48 48" className="h-16 w-16 sm:h-20 sm:w-20" fill="none"><path d="M 18 8 L 34 24 L 18 40" stroke="#0369A1" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          </div>
        )}

        {/* 6. CHAPTER 3 STORY: THE ASTROLABE MEMORY MATRIX */}
        {stage === 'memory_story' && (
          <div className="rounded-3xl border-2 border-amber-300/40 bg-white/95 backdrop-blur-md overflow-hidden shadow-2xl">
            <div className="relative h-60 md:h-72 w-full overflow-hidden bg-[#1E1B4B]">
              <img
                src="/decor/itw/quest-sky-citadel-banner.webp"
                alt="Astrolabe Observatory"
                className="h-full w-full object-cover object-center opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-300 bg-white/10 px-3 py-1 rounded-full">
                    Chapter 3: The Starlight Astrolabe
                  </span>
                  <h2 className="font-patrick text-3xl md:text-4xl text-white font-bold mt-1">
                    Harmonizing the Constellation Nodes
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <p className="text-xs md:text-sm text-[#475569] leading-relaxed mb-6">
                {starToneRef.current ? 'Listen to the tones. Then tap the stars in the same order!' : 'Watch the stars light up. Then tap them in the same order!'}
              </p>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    playAudio('whoosh')
                    setMemoryLevel(-1)
                    setMemPracReady(false)
                    setMemMsg('')
                    setMemoryUserSequence([])
                    setStage('memory_game')
                  }}
                  className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-10 py-3.5 text-base font-bold text-white shadow-lg hover:scale-105 transition-all"
                >
                  Let’s practice →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 7. CHAPTER 3 GAMEPLAY: ASTROLABE */}
        {stage === 'memory_game' && memPracReady && (
          <div className="rounded-3xl border-2 border-amber-300/40 bg-white/95 backdrop-blur-md p-8 md:p-10 shadow-2xl text-center select-none">
            <style>{CV_CSS}</style>
            <img src="/decor/milo-owl.webp" alt="" aria-hidden="true" className="cv-float mx-auto h-24 w-24" />
            <p className="font-patrick text-3xl text-amber-800 font-bold mt-3">Great job!</p>
            <p className="text-base md:text-lg font-bold text-[#1F2937] mt-2">Now the real stars. Watch, then tap the same ones!</p>
            <div className="mt-6 flex flex-col items-center gap-3">
              <button type="button" onClick={() => { playAudio('whoosh'); setMemPracReady(false); starLogRef.current = []; setMemoryLevel(1) }} className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-12 py-4 text-xl font-bold text-white shadow-lg hover:scale-105 transition-all">I’m ready →</button>
              <button type="button" onClick={() => { events.noteRetry('stars'); starPlanRef.current = null; setMemPracReady(false); setMemoryLevel(-1); setMemRetry((n) => n + 1) }} className="text-sm font-bold text-sky-700 underline">Practice again</button>
            </div>
          </div>
        )}

        {stage === 'memory_game' && !memPracReady && (
          <div className="rounded-3xl border-2 border-amber-300/40 bg-white/95 backdrop-blur-md p-6 md:p-10 shadow-2xl text-center select-none">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] bg-[#F1F5F9] px-3.5 py-1 rounded-full">
                {memoryLevel < 1 ? 'Practice' : `Level ${memoryLevel} of 3 • Constellation Span: ${memorySequence.length || memoryLevel + 2}`}
              </span>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                {memoryPhase === 'showing' ? (starToneRef.current ? 'Listen!' : 'Watch the stars!') : 'Your turn!'}
              </span>
            </div>

            {memoryLevel < 1 && (
              <div className="mb-2 flex items-center justify-center gap-3">
                <img src="/decor/milo-owl.webp" alt="" aria-hidden="true" className="cv-float h-14 w-14" />
                <p className="text-left text-base md:text-lg font-bold text-[#1F2937] max-w-xs" aria-live="polite">
                  {memMsg === 'ok' ? 'Yes! Great!' : memMsg === 'again' ? 'Try again! Watch the stars.' : memoryLevel === -1 ? 'Watch the star light up. Then tap it!' : 'Now two stars. Watch, then tap them in order!'}
                </p>
              </div>
            )}
            <div className="mx-auto my-6 grid aspect-square grid-cols-3 gap-5 sm:gap-8 rounded-3xl bg-[#0F172A] p-5 sm:p-8 shadow-2xl" style={{ width: '100%', maxWidth: band.grid }}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => {
                const isLit = memoryLitCell === idx || memoryTapCell === idx
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={memoryPhase !== 'input'}
                    onPointerDown={() => { if (memoryPhase === 'input') { setMemoryTapCell(idx); setTimeout(() => setMemoryTapCell((c) => (c === idx ? null : c)), 320) } }}
                    onClick={() => handleMemoryClick(idx)}
                    className={`rounded-full p-3 sm:p-4 transition-all flex items-center justify-center ${
                      isLit
                        ? 'bg-amber-400 shadow-[0_0_20px_#F59E0B] scale-105'
                        : 'bg-slate-800/80 hover:bg-slate-700/80'
                    } disabled:cursor-not-allowed`}
                  >
                    <StarlightNodeSvg isLit={isLit} />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 8. CHAPTER 4 STORY: THE SUNSTONE POWER CHARGE */}
        {stage === 'situational_story' && (
          <div className="rounded-3xl border-2 border-amber-300/40 bg-white/95 backdrop-blur-md overflow-hidden shadow-2xl">
            <div className="relative h-60 md:h-72 w-full overflow-hidden bg-gradient-to-tr from-[#FEF3C7] to-[#DCFCE7]">
              <img
                src="/decor/itw/quest-sky-citadel-banner.webp"
                alt="Sunstone Sanctuary"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-white/10 px-3 py-1 rounded-full">
                    Chapter 4: The Solar Sunstone Sanctuary
                  </span>
                  <h2 className="font-patrick text-3xl md:text-4xl text-white font-bold mt-1">
                    The Sacred Sun-Power Charging Game
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 text-center">
              <p className="text-sm md:text-base text-[#1E293B] font-medium leading-relaxed mb-6 max-w-lg mx-auto">
                Press and <strong>HOLD</strong> the glowing stone. Do not let go until it chimes!
              </p>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    playAudio('whoosh')
                    setChargeTrialIndex(0)
                    setChargeProgress(0)
                    setChargeStatusText('idle')
                    setChargePrac(true)
                    setChargePracDone(false)
                    setStage('situational_game')
                  }}
                  className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-10 py-3.5 text-base font-bold text-white shadow-lg hover:scale-105 transition-all"
                >
                  Let’s practice →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 9. CHAPTER 4 GAMEPLAY: SUNSTONE POWER CHARGE */}
        {stage === 'situational_game' && CHARGE_TRIALS[chargeTrialIndex] && (
          <div className="rounded-3xl border-2 border-amber-300/40 bg-white/95 backdrop-blur-md p-6 md:p-10 shadow-2xl text-center select-none">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] bg-[#F1F5F9] px-3.5 py-1 rounded-full">
                {chargePrac ? 'Practice' : `Charge ${chargeTrialIndex + 1} of ${CHARGE_TRIALS.length} • ${CHARGE_TRIALS[chargeTrialIndex].title}`}
              </span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Patience & Steady Hold
              </span>
            </div>

            {chargePrac && (
              <div className="mb-2 flex items-center justify-center gap-3">
                <style>{CV_CSS}</style>
                <img src="/decor/milo-owl.webp" alt="" aria-hidden="true" className="cv-float h-14 w-14" />
                <p className="text-left text-base md:text-lg font-bold text-[#1F2937] max-w-xs">Press and HOLD the glowing stone. Do not let go until it chimes!</p>
              </div>
            )}

            {/* Glowing Interactive Sunstone Charging Orb */}
            <div className="relative mx-auto my-8 flex h-60 w-60 sm:h-72 sm:w-72 items-center justify-center">
              {/* Circular SVG Gauge */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" stroke="#E2E8F0" strokeWidth="8" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  stroke="#F59E0B"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray="276.46"
                  strokeDashoffset={276.46 - (276.46 * chargeProgress) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-75"
                />
              </svg>

              {/* Touchable Core Orb */}
              <button
                type="button"
                onPointerDown={handleStartCharge}
                onPointerUp={handleEndCharge}
                onPointerLeave={handleEndCharge}
                onContextMenu={(e) => e.preventDefault()}
                className={`relative z-10 w-44 h-44 sm:w-52 sm:h-52 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all cursor-pointer active:scale-95 ${
                  isCharging
                    ? 'bg-gradient-to-tr from-amber-400 via-orange-500 to-yellow-300 scale-105 shadow-[0_0_50px_rgba(245,158,11,0.8)]'
                    : chargeStatusText === 'success'
                    ? 'bg-gradient-to-tr from-emerald-400 to-teal-500 shadow-[0_0_40px_rgba(16,185,129,0.8)]'
                    : 'bg-gradient-to-b from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A] border-4 border-amber-300 hover:border-amber-400'
                }`}
              >
                {chargeStatusText === 'success' ? (
                  <div className="flex flex-col items-center animate-bounce text-white">
                    <AstrolabeCrystalSvg className="w-16 h-16 drop-shadow-md" />
                    <span className="font-patrick text-xl font-bold mt-1">Charged!</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center pointer-events-none">
                    <AstrolabeCrystalSvg className={`w-16 h-16 sm:w-20 sm:h-20 ${isCharging ? 'text-white animate-spin' : 'text-amber-500'}`} />
                    <span className={`text-xs sm:text-sm font-black uppercase tracking-wider mt-2 ${isCharging ? 'text-white' : 'text-amber-900'}`}>
                      {isCharging ? `${chargeProgress}% HOLD!` : 'PRESS & HOLD'}
                    </span>
                  </div>
                )}
              </button>
            </div>

            {/* Instruction and Feedback Banner */}
            <div className="max-w-md mx-auto">
              {chargeStatusText === 'early' && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 animate-shake">
                  Oops! Released too early. Take a slow breath and hold steady until 100%!
                </div>
              )}
              {chargeStatusText === 'charging' && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">
                  Gathering solar energy... Keep holding! Wait for the chime!
                </div>
              )}
              {chargeStatusText === 'success' && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                  ★ Celestial Chime! {chargePrac ? 'Great holding!' : CHARGE_TRIALS[chargeTrialIndex].rewardText}
                </div>
              )}
              {chargeStatusText === 'idle' && (
                <p className="text-xs sm:text-sm font-semibold text-slate-600">
                  {chargePrac ? 'Practice: press and HOLD the stone until the ring is full!' : chargePracDone && chargeTrialIndex === 0 ? 'Great! Now it counts. Press and HOLD until the bell!' : 'Press and HOLD the stone. Do not let go until the bell rings!'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 10. LOADING AGENTIC EVALUATION */}
        {stage === 'parent_card' && (
          <ParentCard childName={heroName} onDone={(a) => submitCognitiveAgent(a)} />
        )}

        {stage === 'agent_eval' && (
          <div className="rounded-3xl border-2 border-amber-300/40 bg-white/95 backdrop-blur-md p-12 shadow-2xl text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full border-4 border-amber-500 border-t-transparent animate-spin flex items-center justify-center">
              <AstrolabeCrystalSvg className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="font-patrick text-3xl text-[#0F172A] mb-2">
              The Sky Council is writing your summary...
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto">
              Turning the play into a plain-language summary.
            </p>
          </div>
        )}

        {/* 11. CELEBRATION & RESULTS SCREEN */}
        {stage === 'celebration' && agentResult && (
          <div className="space-y-8">
            {/* Child Fantasy Award Certificate */}
            <div className="rounded-3xl border-4 border-amber-300 bg-gradient-to-b from-[#FFFDF8] via-white to-[#FEF3C7] p-8 md:p-12 shadow-2xl text-center relative overflow-hidden">
              <div className="max-w-xl mx-auto">
                <span className="text-xs font-bold uppercase tracking-widest text-[#B45309] block mb-2">
                  Celestial Sky Realm • Official Honor
                </span>
                <h1 className="font-patrick text-4xl sm:text-5xl text-[#78350F] font-bold mb-3">
                  {agentResult.superpowers.realmTitle}
                </h1>
                <div className="inline-block rounded-full bg-amber-500 text-white font-bold text-xs uppercase px-4 py-1.5 shadow-sm mb-6">
                  {agentResult.superpowers.crestBadge}
                </div>

                <p className="text-sm sm:text-base text-[#475569] leading-relaxed italic mb-8 bg-amber-50/60 p-6 rounded-2xl border border-amber-200/80">
                  "{agentResult.superpowers.miloScroll}"
                </p>

                {/* Superpower Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-8">
                  {agentResult.superpowers.badges.map((badge: any, i: number) => (
                    <div key={i} className="p-4 rounded-2xl bg-white border border-amber-200 shadow-sm flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                        <CompassRoseSvg className="w-5 h-5" />
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-[#0F172A] block">{badge.name}</strong>
                        <span className="text-[11px] text-[#64748B] leading-tight block mt-0.5">{badge.desc}</span>
                        <span className="text-[10px] font-bold text-amber-700 block mt-1">{badge.rank}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setShowClinicalDossier(!showClinicalDossier)}
                    className="rounded-full bg-gradient-to-r from-slate-900 to-slate-800 text-white px-8 py-3 text-xs font-bold shadow-md hover:bg-slate-700 transition-all"
                  >
                    {showClinicalDossier ? 'Hide grown-up summary' : 'View grown-up summary →'}
                  </button>
                  <Link
                    href="/consult"
                    className="rounded-full bg-gradient-to-r from-[#05B076] to-[#049A68] text-white px-8 py-3 text-xs font-bold shadow-md hover:scale-105 transition-all"
                  >
                    Schedule Specialist Review →
                  </Link>
                </div>
              </div>
            </div>

            {keeperObs && (
              <div className="rounded-3xl border border-white/20 bg-black/40 p-6 backdrop-blur-md md:p-8">
                <KeeperFeedback quest="adhd" nickname={heroName || 'Explorer'} observations={keeperObs} />
              </div>
            )}

            {agentResult && showClinicalDossier && (() => { const a: any = agentResult; return (
              <div className="mb-4 flex flex-wrap items-center justify-center gap-3"><ClinicianReportButton quest="adhd" nickname={a.childName} age={a.childAge} generatedOn={a.clinicalReport?.generatedOn} rows={a.clinicalReport?.indices ?? []} clinicianQuestions={a.clinicalReport?.questions ?? []} measures={a.record?.measures} parentCard={a.record?.parentCard} steeringTrials={a.record?.steeringTrials} starLevels={a.record?.starLevels} />{a.record && <SessionRecordDownload record={a.record} />}</div>
            ) })()}
            {/* PERSONALISED REPORT FOR THE PARENT: built from this session, shown only once a clinician has checked the wording */}
            {agentResult && (agentResult as {record?: unknown}).record && (
              <div className="mb-8"><EndReport record={(agentResult as {record: any}).record} name={(agentResult as {childName: string}).childName} /></div>
            )}
            {/* GROWN-UP SUMMARY */}
            {showClinicalDossier && (
              <div className="rounded-3xl border-2 border-[#CBD5E1] bg-white p-8 md:p-12 shadow-2xl">
                <div className="border-b border-[#E2E8F0] pb-6 mb-6">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B]">
                    Grown-up summary • {agentResult.clinicalReport.generatedOn}
                  </span>
                  <h2 className="font-patrick text-3xl sm:text-4xl text-[#0F172A] font-bold mt-1">
                    What we noticed while playing
                  </h2>
                  <p className="text-xs text-[#475569] mt-2 leading-relaxed">
                    {agentResult.clinicalReport.summary}
                  </p>
                </div>

                <div role="note" className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] mb-8 text-xs text-[#78350F] leading-relaxed">
                  <strong>This is not a diagnosis.</strong> It shows counts and speeds from one short play session. Nothing here is compared with other children, and many everyday things change it: tiredness, mood, the device, or how much your child enjoyed the game. If you have concerns about attention, communication or sensory comfort, please talk to a paediatrician or another qualified clinician.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {agentResult.clinicalReport.indices.map((idx: any, i: number) => (
                    <div key={i} className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                      <strong className="text-sm text-[#0F172A] block">{idx.name}</strong>
                      <div className="font-mono font-bold text-sm mt-1" style={{color: '#05B076'}}>{idx.value}</div>
                      <span className="text-[11px] text-[#64748B] block mt-1">{idx.detail}</span>
                      <span className="text-[11px] text-[#475569] block mt-2 leading-relaxed">{idx.note}</span>
                    </div>
                  ))}
                </div>

                <div className="mb-8">
                  <h3 className="font-patrick text-2xl text-[#0F172A] mb-3">Questions you could bring to a clinician</h3>
                  <ul className="space-y-1.5 text-xs text-[#334155]">
                    {agentResult.clinicalReport.questions.map((q: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="font-bold" style={{color: '#05B076'}}>?</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 4-Part IEP & 504 Accommodations Blueprint */}
                <div className="mb-8 space-y-6">
                  <h3 className="font-patrick text-2xl text-[#0F172A]">Ideas to discuss with your school or clinician</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                      <strong className="text-xs font-bold text-[#05B076] uppercase tracking-wider block mb-2">
                        1. Classroom Seating & Environment
                      </strong>
                      <ul className="space-y-1.5 text-xs text-[#334155]">
                        {agentResult.clinicalReport.accommodations.classroom.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-[#05B076] font-bold">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                      <strong className="text-xs font-bold text-[#2563EB] uppercase tracking-wider block mb-2">
                        2. Examination & Testing Accommodations
                      </strong>
                      <ul className="space-y-1.5 text-xs text-[#334155]">
                        {agentResult.clinicalReport.accommodations.examinations.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-[#2563EB] font-bold">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                      <strong className="text-xs font-bold text-[#D97706] uppercase tracking-wider block mb-2">
                        3. Working Memory & Executive Scaffolding
                      </strong>
                      <ul className="space-y-1.5 text-xs text-[#334155]">
                        {agentResult.clinicalReport.accommodations.executive.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-[#D97706] font-bold">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                      <strong className="text-xs font-bold text-[#7C3AED] uppercase tracking-wider block mb-2">
                        4. Sensory & Proprioceptive Movement Diet
                      </strong>
                      <ul className="space-y-1.5 text-xs text-[#334155]">
                        {agentResult.clinicalReport.accommodations.sensoryDiet.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-[#7C3AED] font-bold">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
                  <Link
                    href="/consult"
                    className="rounded-full bg-[#05B076] px-8 py-3 text-xs font-bold text-white shadow-md hover:bg-[#049A68] transition-all"
                  >
                    Talk to a Manas specialist →
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowClinicalDossier(false)}
                    className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
                  >
                    Close summary
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <CameraBadge status={cam.status} videoRef={cam.videoRef} onStop={cam.stop} large={stage === 'camera_setup'} />
    </main>
  )
}

// --- mount gate: this quest uses random/time values, so it renders in the browser only ---
import { useState as __mcUseState, useEffect as __mcUseEffect } from "react";
export default function __McGate(props: any) {
  const [mounted, setMounted] = __mcUseState(false);
  __mcUseEffect(() => { setMounted(true); }, []);
  return mounted ? <__McInner {...props} /> : null;
}
