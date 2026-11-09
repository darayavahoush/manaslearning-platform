/* eslint-disable */
'use client'
import WelcomeWizard from '../../../components/assessments/WelcomeWizard'
import {CanopyRangerAvatarSvg, AstralSpellcasterAvatarSvg, SunfireKnightAvatarSvg} from '../../../components/assessments/CharacterAvatars'
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
import CognitiveDossierView from '../../../components/assessments/report/CognitiveDossierView'
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

// Gentle, sensory-safe audio playback with fallbacks
function playAudio(type: 'hit' | 'chime' | 'miss' | 'tap' | 'fanfare' | 'star' | 'whoosh') {
  if (typeof window === 'undefined') return
  try {
    const audioMap: Record<string, string> = {
      hit: '/quests/adhd/audio/correct.mp3',
      chime: '/quests/adhd/audio/correct.mp3',
      star: '/quests/adhd/audio/correct.mp3',
      tap: '/quests/adhd/audio/tap.mp3',
      whoosh: '/quests/adhd/audio/tap.mp3',
      miss: '/quests/adhd/audio/try_again.mp3',
      fanfare: '/quests/adhd/audio/complete.mp3',
    }
    const src = audioMap[type]
    if (src) {
      const snd = new Audio(src)
      snd.volume = 0.2
      snd.play().catch(() => {})
      return
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

// Sunbird Valley target and distractor sprites with strictly locked hit-box dimensions.
// Wings flutter gently in CSS only AFTER appearance, strictly inside the hit-box.
function SunbirdTarget({className = 'w-28 h-28'}: {className?: string}) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <img
        src="/quests/adhd/sunbird.webp"
        alt="Golden Sunbird"
        className="w-full h-full object-contain pointer-events-none sunbird-wing-anim select-none"
        width={192}
        height={192}
      />
    </div>
  )
}

function MothDistractor({className = 'w-28 h-28'}: {className?: string}) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <img
        src="/quests/adhd/shadow_moth.webp"
        alt="Shadow Moth"
        className="w-full h-full object-contain pointer-events-none select-none"
        width={192}
        height={192}
      />
    </div>
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

// Immersive Sunbird Valley Sky Observation Arena
// Replaces the dark spinning vortex with an actual vast, living dawn sky lookout across Sunbird Valley
function SunbirdSkyArena({
  stimulus,
  scene,
  birdClassName = 'w-32 h-32',
  isWaiting = false,
  pracSuccess = false,
  onTap,
  interactive = true,
  guideNote,
}: {
  stimulus: 'target' | 'distractor' | null
  scene?: {name: string; ring: string; stone: string}
  birdClassName?: string
  isWaiting?: boolean
  pracSuccess?: boolean
  onTap: () => void
  interactive?: boolean
  guideNote?: string
}) {
  return (
    <div
      onPointerDown={interactive ? onTap : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label="Sunbird Valley Sky Observation Arena"
      onKeyDown={(e) => {
        if (interactive && (e.key === ' ' || e.key === 'Enter')) {
          e.preventDefault()
          onTap()
        }
      }}
      className={`group relative mx-auto my-4 flex h-[440px] sm:h-[500px] md:h-[580px] lg:h-[640px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-4 ${
        scene ? scene.ring : 'border-[#D4A373]'
      } shadow-[0_20px_50px_rgba(0,0,0,0.65)] select-none transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400`}
    >
      {/* 1. Painted Sunbird Valley Dawn Sky & Meadow Canvas */}
      <img
        src="/quests/adhd/bg_sunbird.webp"
        alt="Sunbird Valley Sky"
        className="absolute inset-0 h-full w-full object-cover object-center filter saturate-[1.12] brightness-[1.02] transition-transform duration-700 group-hover:scale-[1.02]"
      />

      {/* 2. Soft Ambient Sky Atmosphere & Golden Sunbeam Rays */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_18%,rgba(254,243,199,0.38)_0%,rgba(245,158,11,0.12)_45%,transparent_75%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-amber-950/20" />

      {/* 3. Floating Sunlit Cloud Motes */}
      <div className="pointer-events-none absolute top-4 left-8 h-10 w-44 rounded-full bg-white/20 blur-lg animate-pulse" />
      <div className="pointer-events-none absolute top-10 right-12 h-8 w-36 rounded-full bg-amber-100/20 blur-md" />

      {/* 4. Center Sky Stimulus Stage */}
      <div className="relative z-10 flex h-full w-full items-center justify-center">
        {stimulus === 'target' && (
          <div className="relative flex items-center justify-center">
            {/* Gentle Morning Sun Aura behind Sunbird */}
            <div className="absolute -inset-6 rounded-full bg-amber-300/30 blur-xl animate-pulse" />
            <SunbirdTarget className={birdClassName} />
          </div>
        )}

        {stimulus === 'distractor' && (
          <div className="relative flex items-center justify-center">
            {/* Subtle Twilight Mist behind Moth */}
            <div className="absolute -inset-6 rounded-full bg-slate-400/25 blur-xl" />
            <MothDistractor className="w-32 h-32" />
          </div>
        )}

        {pracSuccess && (
          <div className="relative z-20 flex flex-col items-center">
            <span aria-hidden="true" className="cv-float text-7xl drop-shadow-[0_0_25px_rgba(251,191,36,0.9)]">⭐</span>
          </div>
        )}

        {!stimulus && !pracSuccess && isWaiting && (
          <div className="relative z-10 flex flex-col items-center text-center text-amber-200/90">
            {/* Soft Celestial Focus Reticle in the Center of the Sky */}
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-amber-300/50 bg-black/25 backdrop-blur-xs shadow-inner">
              <div className="absolute inset-2 rounded-full border border-dotted border-amber-400/30 animate-spin" style={{animationDuration: '30s'}} />
              <CompassRoseSvg className="h-7 w-7 text-amber-300 opacity-80" />
            </div>
            <span className="mt-2 text-xs font-bold tracking-widest uppercase text-amber-100 drop-shadow">
              Watch the Sky…
            </span>
          </div>
        )}
      </div>

      {/* 5. Treetop Observatory Balustrade & Guide Chirp Post */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-between border-t-2 border-[#D4A373]/80 bg-gradient-to-t from-[#25150B]/95 via-[#361E10]/90 to-transparent px-4 py-2 text-xs text-amber-200/90">
        <div className="flex items-center gap-2">
          <img src="/quests/adhd/guide_chirp.webp" alt="Guide Chirp" className="h-7 w-7 object-contain drop-shadow" />
          <span className="font-semibold text-[11px] text-amber-200">
            {scene ? scene.name : 'Dawn Meadow Lookout'}
          </span>
        </div>
        <span className="rounded-full bg-black/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-300/30">
          {guideNote || 'Tap Sky or Button'}
        </span>
      </div>
    </div>
  )
}

function StarlightNodeSvg({isLit}: {isLit: boolean}) {
  return (
    <div className={`relative w-full h-full flex items-center justify-center ${isLit ? 'star-pulse' : ''}`}>
      <img
        src={isLit ? "/quests/adhd/star_node_lit.webp" : "/quests/adhd/star_node.webp"}
        alt={isLit ? "Lit Star" : "Star"}
        className="w-full h-full object-contain pointer-events-none select-none transition-all duration-300"
        width={120}
        height={120}
      />
    </div>
  )
}

// Child Superpower Guild Classes
const GUILD_CLASSES = [
  {
    name: 'Canopy Sky Ranger',
    badge: 'Eagle-Eyed Scout',
    image: '/quests/characters/canopy_sky_ranger.webp?v=watercolor_v11',
    Svg: BowIconSvg,
    AvatarSvg: CanopyRangerAvatarSvg,
    desc: 'Fast & sharp-eyed · Spots distant birds'
  },
  {
    name: 'Astral Spellcaster',
    badge: 'Star Mage',
    image: '/quests/characters/astral_spellcaster.webp?v=watercolor_v11',
    Svg: WandIconSvg,
    AvatarSvg: AstralSpellcasterAvatarSvg,
    desc: 'Creative & bright · Lights up constellations'
  },
  {
    name: 'Sunfire Knight',
    badge: 'Sun Guardian',
    image: '/quests/characters/sunfire_knight.webp?v=watercolor_v11',
    Svg: ShieldIconSvg,
    AvatarSvg: SunfireKnightAvatarSvg,
    desc: 'Steady & brave · Brings courage & calm'
  },
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
  { id: '4-5', xs: 1.15, sm: 1.25, base: 1.4, chev: 'w-14 h-14 sm:w-24 sm:h-24', bird: 'w-44 h-44 sm:w-56 sm:h-56', grid: 560, seqs: [[1, 5], [3, 0, 6], [8, 4, 1, 6]], stepMs: 1000, litMs: 700 },
  { id: '6-8', xs: 1.05, sm: 1.15, base: 1.3, chev: 'w-14 h-14 sm:w-20 sm:h-20', bird: 'w-40 h-40 sm:w-52 sm:h-52', grid: 540, seqs: [[1, 5, 7], [3, 0, 6, 2], [8, 4, 1, 6, 3]], stepMs: 900, litMs: 600 },
  { id: '9-12', xs: 0.95, sm: 1.05, base: 1.15, chev: 'w-12 h-12 sm:w-18 sm:h-18', bird: 'w-36 h-36 sm:w-48 sm:h-48', grid: 520, seqs: [[4, 0, 7, 2], [1, 6, 3, 8, 5], [7, 2, 5, 0, 8, 3]], stepMs: 800, litMs: 520 },
  { id: '13-16', xs: 0.9, sm: 1, base: 1.1, chev: 'w-12 h-12 sm:w-18 sm:h-18', bird: 'w-36 h-36 sm:w-44 sm:h-44', grid: 500, seqs: [[2, 6, 1, 8, 4], [5, 0, 7, 3, 6, 1], [8, 3, 0, 5, 2, 7, 4]], stepMs: 700, litMs: 450 },
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

function SunbirdProgressTrail({stage}: {stage: string}) {
  const steps = [
    {id: 'cpt', icon: '🐦', label: 'Sunbird', stages: ['cpt_story', 'cpt_hold', 'cpt_game']},
    {id: 'flanker', icon: '🏹', label: 'Canopy', stages: ['flanker_story', 'flanker_game']},
    {id: 'memory', icon: '⭐', label: 'Stars', stages: ['memory_story', 'memory_game']},
    {id: 'charge', icon: '☀️', label: 'Sunstone', stages: ['situational_story', 'situational_game']},
    {id: 'trail', icon: '🌌', label: 'Sky Trail', stages: ['trail_story', 'trail_game']},
  ]
  const activeIdx = steps.findIndex(s => s.stages.includes(stage))
  if (activeIdx === -1 && stage !== 'celebration') return null
  const currentStep = activeIdx === -1 ? 5 : activeIdx

  return (
    <div className="mb-6 rounded-2xl bg-[#1A1510]/85 backdrop-blur-md p-3.5 border border-amber-400/40 shadow-lg max-w-xl mx-auto select-none">
      <div className="flex items-center justify-between relative px-4">
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1.5 bg-black/40 rounded-full z-0 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500 rounded-full"
            style={{width: `${Math.min(100, (currentStep / 4) * 100)}%`}}
          />
        </div>
        {steps.map((st, i) => {
          const isDone = i < currentStep
          const isCurrent = i === currentStep
          return (
            <div key={st.id} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  isDone
                    ? 'bg-amber-500 text-white shadow-md'
                    : isCurrent
                    ? 'bg-amber-400 ring-4 ring-amber-300/40 text-amber-950 font-bold shadow-md'
                    : 'bg-[#2E2015] border-2 border-amber-400/40 text-amber-300/70'
                }`}
              >
                {isDone ? (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : isCurrent ? (
                  <img src="/quests/adhd/guide_chirp.webp" alt="You are here" className="w-6 h-6 object-contain pointer-events-none drop-shadow" />
                ) : (
                  <span className="text-xs font-bold text-amber-200">{i + 1}</span>
                )}
              </div>
              <span className={`text-[11px] font-bold mt-1.5 flex items-center gap-1 ${isCurrent ? 'text-amber-200 font-extrabold' : isDone ? 'text-amber-300/80' : 'text-amber-100/50'}`}>
                <span>{st.icon}</span>
                <span>{st.label}</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GuideChirpNote({text}: {text: string}) {
  return (
    <div className="my-4 flex items-center gap-3.5 rounded-2xl bg-[#2A1D13]/90 border border-amber-400/40 p-4 shadow-md max-w-lg mx-auto text-amber-100 backdrop-blur-sm">
      <img src="/quests/adhd/guide_chirp.webp" alt="Guide Chirp" className="w-14 h-14 object-contain shrink-0 drop-shadow-md" />
      <p className="text-sm font-semibold text-amber-100 leading-relaxed text-left">{text}</p>
    </div>
  )
}

function McInner() {
  const [stage, setStage] = useState<'welcome' | 'avatar' | 'camera_setup' | 'cpt_story' | 'cpt_hold' | 'cpt_game' | 'flanker_story' | 'flanker_game' | 'memory_story' | 'memory_game' | 'situational_story' | 'situational_game' | 'trail_story' | 'trail_game' | 'trials' | 'parent_card' | 'agent_eval' | 'celebration'>('welcome')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search).get('stage')
      if (q) setStage(q as any)
      const qPrac = new URLSearchParams(window.location.search).get('prac')
      if (qPrac) setCptPrac(qPrac as any)
    }
  }, [])

  // Child Fantasy Persona
  const [heroName, setHeroName] = useState('')
  const [heroAge, setHeroAge] = useState(8)
  const [guildClass, setGuildClass] = useState('Canopy Sky Ranger')
  const [companion] = useState('Milo the Wise Owl')
  const band = bandFor(heroAge)
  // the night games (star memory, Sunstone charge, sky trail) use the dark night-sky look
  const darkStage = stage === 'memory_story' || stage === 'memory_game' || stage === 'situational_story' || stage === 'situational_game' || stage === 'trail_story' || stage === 'trail_game'
  const isWideStage = ['cpt_hold', 'cpt_game', 'cpt_prep', 'cpt_break', 'flanker_intro', 'flanker_prac', 'flanker_game', 'memory_intro', 'memory_prac', 'memory_game', 'situational_intro', 'situational_prac', 'situational_game', 'trail_story', 'trail_game', 'end'].includes(stage)

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

  // Chapter 5: Sky Trail (Alternating Trail Making Test Part B)
  const TRAIL_NODES = useMemo(() => [
    {id: 0, num: 1, type: 'sun' as const, symbol: '☀️', x: 22, y: 30, label: '1 ☀️'},
    {id: 1, num: 1, type: 'moon' as const, symbol: '🌙', x: 74, y: 22, label: '1 🌙'},
    {id: 2, num: 2, type: 'sun' as const, symbol: '☀️', x: 48, y: 50, label: '2 ☀️'},
    {id: 3, num: 2, type: 'moon' as const, symbol: '🌙', x: 20, y: 74, label: '2 🌙'},
    {id: 4, num: 3, type: 'sun' as const, symbol: '☀️', x: 80, y: 68, label: '3 ☀️'},
    {id: 5, num: 3, type: 'moon' as const, symbol: '🌙', x: 38, y: 16, label: '3 🌙'},
    {id: 6, num: 4, type: 'sun' as const, symbol: '☀️', x: 64, y: 36, label: '4 ☀️'},
    {id: 7, num: 4, type: 'moon' as const, symbol: '🌙', x: 50, y: 82, label: '4 🌙'},
  ], [])

  const [trailStep, setTrailStep] = useState(0)
  const [trailCompleted, setTrailCompleted] = useState<number[]>([])
  const [trailLines, setTrailLines] = useState<Array<{x1: number; y1: number; x2: number; y2: number}>>([])
  const [trailFeedback, setTrailFeedback] = useState<string>('')
  const [trailErrorShakeId, setTrailErrorShakeId] = useState<number | null>(null)
  const trailSwitchesCorrectRef = useRef<number>(0)
  const trailErrorsRef = useRef<number>(0)
  const trailStartTimeRef = useRef<number>(0)
  const trailCompletionMsRef = useRef<number>(0)

  function handleTrailNodeClick(nodeId: number) {
    if (trailCompleted.includes(nodeId)) return

    const expected = TRAIL_NODES[trailStep]
    if (nodeId === trailStep) {
      playAudio('chime')
      trailSwitchesCorrectRef.current += 1
      const newCompleted = [...trailCompleted, nodeId]
      setTrailCompleted(newCompleted)

      if (trailCompleted.length > 0) {
        const prevNode = TRAIL_NODES[trailCompleted[trailCompleted.length - 1]]
        const currNode = TRAIL_NODES[nodeId]
        setTrailLines((prev) => [...prev, {x1: prevNode.x, y1: prevNode.y, x2: currNode.x, y2: currNode.y}])
      }

      setTrailFeedback('✨ Starlight connected!')

      if (trailStep + 1 >= TRAIL_NODES.length) {
        trailCompletionMsRef.current = Math.round(performance.now() - trailStartTimeRef.current)
        playAudio('fanfare')
        setTrailFeedback('🎉 Constellation complete!')
        setTimeout(() => {
          setStage('parent_card')
        }, 1600)
      } else {
        setTrailStep((s) => s + 1)
      }
    } else {
      playAudio('miss')
      trailErrorsRef.current += 1
      setTrailErrorShakeId(nodeId)
      setTimeout(() => setTrailErrorShakeId(null), 600)

      const clickedNode = TRAIL_NODES[nodeId]
      if (expected && clickedNode && clickedNode.type === TRAIL_NODES[Math.max(0, trailStep - 1)]?.type) {
        setTrailFeedback(`Remember to alternate! Look for ${expected.num} ${expected.symbol} (${expected.type === 'sun' ? 'Sun' : 'Moon'})!`)
      } else if (expected) {
        setTrailFeedback(`Next star is ${expected.num} ${expected.symbol}!`)
      }
    }
  }

  // Agent Output
  const [agentResult, setAgentResult] = useState<any>(null)
  const [showClinicalDossier, setShowClinicalDossier] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('dossier') === 'true'
    }
    return false
  })
  const [keeperObs, setKeeperObs] = useState<any>(null)
  const [parentOk, setParentOk] = useState(false)
  const [notice, setNotice] = useState('')

  // Developer / Direct Stage landing fallback for celebration
  useEffect(() => {
    if (stage === 'celebration' && !agentResult) {
      fetch('/api/assessments/agent', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          assessmentType: 'adhd',
          childName: heroName || 'Canopy Ranger',
          childAge: heroAge || 8,
          guildClass: guildClass || 'Canopy Sky Ranger',
          companion: 'Guide Chirp',
          telemetry: {
            cptTrials: 18,
            cptResponses: 12,
            omissions: 1,
            commissions: 2,
            hrtMs: 418,
            rtvMs: 64,
            flankerCostMs: 32,
            flankerCongruentN: 6,
            flankerIncongruentN: 5,
            flankerCongruentTotal: 6,
            flankerIncongruentTotal: 6,
            workingMemorySpan: 4,
            trailSwitchesCorrect: 7,
            trailSwitchesTotal: 8,
            trailSwitchErrors: 1,
            trailCompletionMs: 14200,
            prematureReleases: 1,
            chargeTrials: 3,
            cptTargets: 12,
            cptNonTargets: 6,
            rtFirstHalfMs: 405,
            rtSecondHalfMs: 431,
          }
        })
      }).then(r => r.json()).then(j => {
        if (j.data) {
          setAgentResult(j.data)
          if (new URLSearchParams(window.location.search).get('dossier') === 'true') {
            setShowClinicalDossier(true)
          }
        }
      }).catch(() => {})
    }
  }, [stage, agentResult, heroName, heroAge, guildClass])

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
  }, [stage, holdPhase, holdIdx])

  useEffect(() => {
    if (stage !== 'cpt_hold' || holdPhase !== 'go') return
    const t = setTimeout(() => finishHold(null), 5000)
    return () => clearTimeout(t)
    // finishHold is rebuilt from the same state on every render, so this timer always sees current values
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
            playAudio('whoosh')
            setStage('trail_story')
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
        trailSwitchesCorrect: trailSwitchesCorrectRef.current,
        trailSwitchesTotal: 8,
        trailSwitchErrors: trailErrorsRef.current,
        trailCompletionMs: trailCompletionMsRef.current,
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

  const adhdBgImage = 
    (stage === 'welcome' || stage === 'avatar' || stage === 'camera_setup') ? '/quests/adhd/welcome.webp' :
    (stage === 'cpt_story' || stage === 'cpt_hold' || stage === 'cpt_game') ? '/quests/adhd/bg_sunbird.webp' :
    (stage === 'flanker_story' || stage === 'flanker_game') ? '/quests/adhd/bg_flanker.webp' :
    (stage === 'memory_story' || stage === 'memory_game') ? '/quests/adhd/bg_memory.webp' :
    (stage === 'situational_story' || stage === 'situational_game') ? '/quests/adhd/bg_charge.webp' :
    (stage === 'trail_story' || stage === 'trail_game') ? '/quests/adhd/bg_memory.webp' :
    '/quests/adhd/celebration.webp';
  const isParallaxStage = stage === 'welcome' || stage === 'celebration';

  return (
    <main data-no-listen="true" className={`relative min-h-screen ${darkStage ? 'bg-[#0B132B]' : 'bg-[#16120E]'} q-age py-8 px-4 font-poppins text-amber-50 overflow-x-hidden selection:bg-amber-400 selection:text-amber-950`}>
      <style>{`.q-age .text-xs{font-size:${band.xs}rem!important;line-height:1.55!important}.q-age .text-sm{font-size:${band.sm}rem!important;line-height:1.55!important}.q-age .text-base{font-size:${band.base}rem!important;line-height:1.6!important}`}</style>
      {/* Immersive Sunbird Valley Storybook Backdrop */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <QuestStyles />
        <Fireflies color={darkStage ? '#FDE68A' : '#D97706'} />
        <img
          src={adhdBgImage}
          alt=""
          aria-hidden="true"
          className={`w-full h-full object-cover object-center transition-opacity duration-700 ${
            isParallaxStage ? 'scale-105' : 'scale-100'
          }`}
        />
        {/* Calm translucent tint allowing the valley landscape to shine through */}
        <div className={`absolute inset-0 ${darkStage ? 'bg-gradient-to-b from-[#0B132B]/85 via-[#0B132B]/60 to-[#0B132B]/90' : 'bg-gradient-to-b from-black/35 via-black/15 to-black/50'} backdrop-blur-[0.5px]`} />
      </div>

      {notice && <div role="alert" className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-xl">{notice} <button type="button" className="ml-3 underline" onClick={() => setNotice('')}>Dismiss</button></div>}
      <AmbientToggle mood="adhd" />
      <div key={stage} className={`mx-auto ${isWideStage ? 'max-w-5xl lg:max-w-6xl w-full px-2 sm:px-4' : 'max-w-4xl'} relative z-10 qd-stage`}>
        {/* Navigation & Realm Indicator */}
        <div className="mb-4 flex items-center justify-between text-xs">
          <Link href="/gamified-assessments" prefetch={false} className="font-bold text-amber-300 hover:text-amber-200 hover:underline flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-300/30 shadow-sm">
            ← Gamified Quests
          </Link>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-black/50 backdrop-blur-md px-3.5 py-1.5 font-bold text-amber-200 border border-amber-400/40 shadow-sm">
              Sunbird Valley • Play-Based Attention Quest
            </span>
          </div>
        </div>

        <SunbirdProgressTrail stage={stage} />
        <ReadAloud age={heroAge} stage={stage} />
        {/* 1. WELCOME SCREEN: FANTASY HERO REALM */}
        {stage === 'welcome' && (
          <div className="rounded-3xl border-2 border-[#FDE68A] bg-white overflow-hidden shadow-2xl">
            {/* Storybook Hero Panorama */}
            <div className="relative h-64 md:h-84 w-full overflow-hidden bg-gradient-to-tr from-[#FEF3C7] to-[#DCFCE7]">
              <img
                src="/quests/adhd/welcome.webp"
                alt="Sunbird Valley Dawn"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent flex items-end p-6 md:p-8">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 backdrop-blur-md px-3.5 py-1 text-xs font-bold text-amber-200 border border-amber-300/30 mb-2">
                    ★ Sunbird Valley Quest • Guardians of the Golden Dawn
                  </div>
                  <h1 className="font-patrick text-3xl sm:text-4xl md:text-5xl text-white font-bold leading-tight drop-shadow-md">
                    Sunbird Valley Quest
                  </h1>
                  <p className="text-xs sm:text-sm text-white/90 max-w-2xl mt-1">
                    Join Guide Chirp on a sunlit adventure across Sunbird Valley. Watch the dawn skies, steer through forest trails, and harmonize the starlight stones.
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
          <div className="rounded-3xl border border-[#D4A373]/40 bg-gradient-to-b from-[#181410]/75 via-[#221B14]/65 to-[#14100C]/85 backdrop-blur-md overflow-hidden shadow-2xl text-amber-50">
            <style>{CV_CSS}</style>
            <div className="relative h-56 md:h-64 w-full overflow-hidden rounded-t-3xl border-b-2 border-[#D4A373]/60">
              <img
                src="/quests/adhd/bg_sunbird.webp"
                alt="Sunbird Valley Dawn"
                className="absolute inset-0 h-full w-full object-cover object-center filter saturate-[1.12] brightness-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-amber-950/20" />
              <div className="relative z-10 flex h-full items-center justify-center gap-6 sm:gap-10">
                <div className="relative flex items-center justify-center">
                  <div className="absolute -inset-4 rounded-full bg-amber-400/25 blur-lg" />
                  <SunbirdTarget className="h-28 w-28 sm:h-36 sm:w-36" />
                </div>
                <div className="relative flex items-center justify-center">
                  <div className="absolute -inset-4 rounded-full bg-slate-400/20 blur-lg" />
                  <MothDistractor className="h-24 w-24 sm:h-32 sm:w-32" />
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-black/40 px-3 py-1 rounded-full">
                  Chapter 1: Dawn Skies of the Valley
                </span>
                <h2 className="font-patrick text-3xl md:text-4xl text-white font-bold mt-1">The Sunbird and the Moth</h2>
              </div>
            </div>

            <div className="p-6 md:p-8 text-center">
              <GuideChirpNote text="Spot the golden sunbird? Tap quick! 🐦 See the grey moth? Let it fly by! 🦋" />
              <div className="grid grid-cols-2 gap-4 mb-5 max-w-md mx-auto">
                <div className="rounded-2xl bg-[#2A1D13]/85 border-2 border-amber-400/50 p-4 shadow-md">
                  <div className="mx-auto h-16 w-16"><SunbirdTarget className="h-full w-full" /></div>
                  <p className="mt-1 text-2xl font-bold text-amber-300">TAP!</p>
                </div>
                <div className="rounded-2xl bg-[#2D1414]/85 border-2 border-rose-400/50 p-4 shadow-md">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center"><MothDistractor className="h-full w-full" /></div>
                  <p className="mt-1 text-2xl font-bold text-rose-300">WAIT</p>
                </div>
              </div>
              <p className="text-base md:text-lg font-bold text-amber-100 mb-1">Tap fast for the sunbird. Wait for the moth.</p>
              <p className="text-xs text-amber-200/70 mb-5">After a short practice: {CPT_TOTAL_TRIALS} sightings in {cptPlan.blocks} rounds, with calm rests.</p>
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
                className="rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-12 py-5 text-xl font-bold text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                Let’s practice →
              </button>
            </div>
          </div>
        )}

        {/* 2b. SUNBIRD PRACTICE (not recorded) */}
        {stage === 'cpt_hold' && (
          <div className="rounded-3xl border border-[#D4A373]/40 bg-gradient-to-b from-[#181410]/75 via-[#221B14]/65 to-[#14100C]/85 backdrop-blur-md p-6 md:p-8 shadow-[0_16px_40px_rgba(0,0,0,0.6)] text-center select-none text-amber-50 max-w-5xl lg:max-w-6xl mx-auto w-full">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-200 bg-[#3A2412]/80 border border-amber-400/30 px-3.5 py-1 rounded-full">
                🐦 Wait {holdIdx + 1} of {HOLD_WAITS_MS.length}
              </span>
              <span className="text-xs font-bold text-amber-100 bg-[#422D19]/80 px-3 py-1 rounded-full border border-amber-400/30">
                <span>⏳</span> Hold still
              </span>
            </div>
            <p className="font-patrick text-2xl sm:text-3xl md:text-4xl font-bold mb-3 flex items-center justify-center gap-2" aria-live="polite">
              {holdPhase === 'wait' ? (
                <>
                  <span className="text-2xl sm:text-3xl">🤫</span>
                  <span className="text-amber-100">Hold still... wait for chime!</span>
                </>
              ) : (
                <>
                  <span className="text-2xl sm:text-3xl animate-bounce">🔔</span>
                  <span className="text-amber-300">CHIME! Tap the sunbird! 🐦</span>
                </>
              )}
            </p>
            <SunbirdSkyArena
              stimulus={holdPhase === 'go' ? 'target' : null}
              birdClassName={holdPhase === 'go' ? 'w-32 h-32' : 'w-28 h-28 opacity-60'}
              isWaiting={holdPhase === 'wait'}
              onTap={() => {
                if (holdPhase === 'wait') {
                  setHoldTaps((t) => { const n = [...t]; n[holdIdx] = (n[holdIdx] ?? 0) + 1; return n })
                  playAudio('miss')
                  return
                }
                playAudio('hit')
                const rt = Math.round(performance.now() - holdGoAtRef.current)
                finishHold(rt)
              }}
              guideNote={holdPhase === 'wait' ? 'Hold still… wait for chime' : 'Chime sounded! Tap sky!'}
            />
            <p className="text-xs text-amber-200/80 min-h-[1.5em]">
              {holdPhase === 'wait' && holdTaps[holdIdx] ? 'Not yet. Wait for the chime.' : ''}
            </p>
          </div>
        )}

        {stage === 'cpt_game' && cptPrac !== 'off' && (
          <div className="relative rounded-3xl border border-[#D4A373]/40 bg-gradient-to-b from-[#181410]/75 via-[#221B14]/65 to-[#14100C]/85 backdrop-blur-md p-6 md:p-8 shadow-[0_16px_40px_rgba(0,0,0,0.6)] text-center select-none text-amber-50 max-w-4xl lg:max-w-5xl mx-auto w-full">
            <style>{CV_CSS}</style>
            {cptPrac === 'ready' ? (
              <div className="flex flex-col items-center gap-3 py-2">
                <img src="/quests/adhd/guide_chirp.webp" alt="Guide Chirp" className="cv-float h-20 w-20 object-contain drop-shadow" />
                <p className="font-patrick text-3xl text-amber-300 font-bold">Great job!</p>
                <div className="my-2 flex items-center justify-center gap-6">
                  <div className="text-center">
                    <div className="mx-auto h-20 w-20 rounded-2xl bg-[#2A1D13] border border-amber-400/40 p-1 flex items-center justify-center shadow-md"><SunbirdTarget className="h-full w-full" /></div>
                    <p className="mt-1 text-xl font-bold text-amber-300">TAP!</p>
                  </div>
                  <div className="text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#2D1414] border border-rose-400/40 p-1 shadow-md"><MothDistractor className="h-14 w-14" /></div>
                    <p className="mt-1 text-xl font-bold text-rose-300">WAIT</p>
                  </div>
                </div>
                <button type="button" onClick={() => { playAudio('chime'); setCptPrac('off') }} className="rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-12 py-4 text-xl font-bold text-white shadow-xl hover:scale-105 active:scale-95 transition-all">I’m ready →</button>
                <button type="button" onClick={() => { events.noteRetry('sunbird'); setCptPrac('bird') }} className="text-sm font-bold text-amber-300 underline">Practice again</button>
              </div>
            ) : (
              <>
                <span className="inline-block rounded-full bg-[#3A2412]/80 border border-amber-400/30 px-4 py-1 text-sm font-bold text-amber-200">Practice</span>
                <div className="mt-3 flex items-center justify-center gap-3">
                  <img src="/quests/adhd/guide_chirp.webp" alt="Guide Chirp" className="cv-float h-14 w-14 object-contain drop-shadow" />
                  <p className="text-left text-base md:text-lg font-bold text-amber-100 max-w-xs" aria-live="polite">
                    {cptPrac === 'bird' ? 'Here comes the sunbird! Tap it!' : cptPrac === 'bird_ok' ? 'Yes! Great tap!' : cptPrac === 'moth' ? 'A moth! Do not tap. Just wait…' : cptPrac === 'moth_oops' ? 'Oops, that was the moth! Just wait.' : 'Perfect waiting!'}
                  </p>
                </div>
                <SunbirdSkyArena
                  stimulus={cptPrac === 'bird' ? 'target' : (cptPrac === 'moth' || cptPrac === 'moth_oops') ? 'distractor' : null}
                  birdClassName={band.bird}
                  isWaiting={cptPrac === 'bird' || cptPrac === 'moth'}
                  pracSuccess={cptPrac === 'bird_ok' || cptPrac === 'moth_ok'}
                  onTap={handleCptPracTap}
                  guideNote={cptPrac === 'bird' ? 'Tap sunbird in the sky!' : cptPrac === 'moth' ? 'Keep calm, wait for moth' : 'Great reflex!'}
                />
                <button
                  type="button"
                  onPointerDown={handleCptPracTap}
                  onClick={(e) => { if (e.detail === 0) handleCptPracTap() }}
                  className={`w-full max-w-sm rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 py-5 text-2xl font-extrabold text-white shadow-[0_10px_25px_rgba(217,119,6,0.45)] border-2 border-amber-300/60 active:scale-95 transition-all ${cptPrac === 'bird' ? 'ring-4 ring-amber-300' : ''}`}
                >
                  ☀️ TAP SKY OR BUTTON!
                </button>
              </>
            )}
          </div>
        )}

        {/* 3. CHAPTER 1 GAMEPLAY: CPT-3 VIGILANCE */}
        {stage === 'cpt_game' && cptPrac === 'off' && (
          <div className="relative rounded-3xl border border-[#D4A373]/40 bg-gradient-to-b from-[#181410]/75 via-[#221B14]/65 to-[#14100C]/85 backdrop-blur-md p-6 sm:p-8 shadow-[0_16px_40px_rgba(0,0,0,0.6)] text-center select-none text-amber-50 max-w-4xl lg:max-w-5xl mx-auto w-full">
            {cptResting && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl bg-gradient-to-b from-[#1E1710]/95 via-[#2A1F16]/95 to-[#17120D]/95 border-2 border-amber-400/40 p-5 text-center sm:gap-4 sm:p-6 text-amber-100">
                <style>{`@keyframes cr-breathe{0%,100%{transform:scale(.7);opacity:.5}50%{transform:scale(1);opacity:1}}@keyframes cr-bob{50%{transform:translateY(-8px)}}@media (prefers-reduced-motion:reduce){.cr-ring,.cr-owl{animation:none!important}}`}</style>
                <img src="/quests/adhd/guide_chirp.webp" alt="Guide Chirp" className="cr-owl h-20 w-20 object-contain drop-shadow" style={{ animation: 'cr-bob 3.2s ease-in-out infinite' }} />
                <h3 className="font-patrick text-4xl font-bold text-amber-300">Rest time</h3>
                <div className="flex items-center gap-2" role="img" aria-label={`${Math.floor(cptTrialIndex / cptPlan.size)} of ${cptPlan.blocks} rounds done`}>
                  {Array.from({ length: cptPlan.blocks }).map((_, i) => (
                    <span key={i} className={`h-3.5 w-3.5 rounded-full ${i < Math.floor(cptTrialIndex / cptPlan.size) ? 'bg-amber-400' : 'bg-amber-800'}`} />
                  ))}
                </div>
                <p className="text-sm font-semibold text-amber-100">Round {Math.floor(cptTrialIndex / cptPlan.size)} of {cptPlan.blocks} is done. You found the {CPT_SCENES[(Math.floor(cptTrialIndex / cptPlan.size) - 1) % CPT_SCENES.length].stone}!</p>
                <div className="relative flex h-20 w-20 items-center justify-center">
                  <span className="cr-ring absolute inset-0 rounded-full bg-amber-400/40" style={{ animation: 'cr-breathe 6s ease-in-out infinite' }} />
                  <span className="relative text-xs font-semibold text-amber-200">Breathe</span>
                </div>
                <p className="max-w-xs text-sm text-amber-200/80">Take a slow breath with the glowing circle. Press the button when you are ready for the next round.</p>
                <button
                  type="button"
                  onClick={() => { cptRestedAtRef.current = cptTrialIndex; cptRestingRef.current = false; setCptResting(false); playAudio('chime') }}
                  className="min-h-[52px] rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-10 py-3.5 text-base font-bold text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  I am ready →
                </button>
              </div>
            )}
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-200 bg-[#3A2412]/80 border border-amber-400/30 px-3.5 py-1 rounded-full backdrop-blur-sm">
                Sighting {Math.min(cptTrialIndex + 1, CPT_TOTAL_TRIALS)} of {CPT_TOTAL_TRIALS} · Round {Math.min(Math.floor(cptTrialIndex / cptPlan.size) + 1, cptPlan.blocks)} of {cptPlan.blocks} · {CPT_SCENES[Math.min(Math.floor(cptTrialIndex / cptPlan.size), cptPlan.blocks - 1) % CPT_SCENES.length].name}
              </span>
              <div className="flex items-center gap-2">
                {cptLastRt && (
                  <span className="text-xs font-bold text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-400/40">
                    Reflex: {cptLastRt} ms
                  </span>
                )}
                <div className="w-28 h-2.5 rounded-full bg-black/40 overflow-hidden border border-amber-400/30">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
                    style={{width: `${((cptTrialIndex + 1) / CPT_TOTAL_TRIALS) * 100}%`}}
                  />
                </div>
              </div>
            </div>

            <SunbirdSkyArena
              stimulus={cptStimulus === 'target' ? 'target' : cptStimulus === 'distractor' ? 'distractor' : null}
              scene={CPT_SCENES[Math.min(Math.floor(cptTrialIndex / cptPlan.size), cptPlan.blocks - 1) % CPT_SCENES.length]}
              birdClassName={band.bird}
              isWaiting={!cptStimulus}
              onTap={handleCptTap}
              guideNote="Tap Sky or Paddle Below"
            />

            <button
              type="button"
              onPointerDown={handleCptTap}
              onClick={(e) => { if (e.detail === 0) handleCptTap() }}
              className="w-full max-w-sm rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 py-5 text-2xl font-extrabold text-white shadow-[0_10px_25px_rgba(217,119,6,0.45)] border-2 border-amber-300/60 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400"
            >
              ☀️ TAP SKY OR BUTTON!
            </button>
          </div>
        )}

        {/* 4. CHAPTER 2 STORY: FOLLOW THE MIDDLE ARROW (clean, illustrated, byte-sized) */}
        {stage === 'flanker_story' && (
          <div className="rounded-3xl border border-[#D4A373]/40 bg-gradient-to-b from-[#181410]/75 via-[#221B14]/65 to-[#14100C]/85 backdrop-blur-md overflow-hidden shadow-2xl text-amber-50">
            <style>{CV_CSS}</style>
            <div className="relative h-56 md:h-64 w-full overflow-hidden bg-[#1E1B4B]">
              <img
                src="/quests/adhd/canopy_river_trail_banner.webp?v=wc1"
                alt="Canopy River Trail"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-5">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-black/50 border border-amber-400/30 px-3 py-1 rounded-full">
                  Chapter 2 • Forest Canopy Trail
                </span>
                <h2 className="font-patrick text-3xl md:text-4xl text-white font-bold mt-1">
                  Follow the Middle Arrow! 🏹
                </h2>
              </div>
            </div>
            <div className="p-6 md:p-8 text-center max-w-2xl mx-auto">
              {/* 3 Byte-sized visual steps for children */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
                <div className="rounded-2xl bg-amber-500/15 border border-amber-400/30 p-4 flex flex-col items-center text-center shadow-sm">
                  <span className="text-3xl mb-1.5" aria-hidden="true">👀</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Step 1</span>
                  <p className="text-sm font-bold text-amber-100 mt-1">Look at the middle arrow</p>
                </div>
                <div className="rounded-2xl bg-amber-500/15 border border-amber-400/30 p-4 flex flex-col items-center text-center shadow-sm">
                  <span className="text-3xl mb-1.5" aria-hidden="true">🙈</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Step 2</span>
                  <p className="text-sm font-bold text-amber-100 mt-1">Ignore the side arrows</p>
                </div>
                <div className="rounded-2xl bg-amber-500/15 border border-amber-400/30 p-4 flex flex-col items-center text-center shadow-sm">
                  <span className="text-3xl mb-1.5" aria-hidden="true">👈 ⛵ 👉</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Step 3</span>
                  <p className="text-sm font-bold text-amber-100 mt-1">Tap Left or Right</p>
                </div>
              </div>

              {/* Guide Chirp Friendly Tip */}
              <div className="my-4 flex items-center justify-center gap-3.5 rounded-2xl bg-[#2A1D13]/90 border border-amber-400/40 p-4 shadow-md text-amber-100 backdrop-blur-sm">
                <img src="/quests/adhd/guide_chirp.webp" alt="Guide Chirp" className="w-12 h-12 object-contain shrink-0 drop-shadow" />
                <p className="text-sm sm:text-base font-bold text-amber-100 text-left">
                  Steer the way the <span className="text-amber-300 underline underline-offset-4">big golden arrow</span> points! ⛵
                </p>
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
                className="mt-2 rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-10 py-4 text-xl font-extrabold text-white shadow-xl hover:scale-105 active:scale-95 transition-all border-2 border-amber-300/40"
              >
                Let’s practice! ⛵
              </button>
            </div>
          </div>
        )}

        {/* 5. CHAPTER 2 GAMEPLAY: FLANKER (practice rounds first, then the 12 recorded formations) */}
        {stage === 'flanker_game' && flankerPhase === 'ready' && (
          <div className="rounded-3xl border border-[#D4A373]/40 bg-gradient-to-b from-[#181410]/75 via-[#221B14]/65 to-[#14100C]/85 backdrop-blur-md p-8 md:p-10 shadow-[0_16px_40px_rgba(0,0,0,0.6)] text-center select-none text-amber-50 max-w-4xl lg:max-w-5xl mx-auto w-full">
            <style>{CV_CSS}</style>
            <img src="/quests/adhd/guide_chirp.webp" alt="Guide Chirp" className="cv-float mx-auto h-24 w-24 object-contain drop-shadow" />
            <p className="font-patrick text-3xl text-amber-300 font-bold mt-3">Great job!</p>
            <p className="text-base md:text-lg font-bold text-amber-100 mt-2">Now the real game. Look at the big golden arrow!</p>
            <div className="mt-6 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => { playAudio('whoosh'); setFlankerTrialIndex(0); setFlankerCongruentTimes([]); setFlankerIncongruentTimes([]); flankerTotalsRef.current = {congruent: 0, incongruent: 0}; flankerLogRef.current = []; setFlankerPhase('real') }}
                className="rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-12 py-4 text-xl font-bold text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                I’m ready →
              </button>
              <button type="button" onClick={() => { events.noteRetry('steering'); flankerLockRef.current = false; setFlankerPhase('demo1') }} className="text-sm font-bold text-amber-300 underline">Practice again</button>
            </div>
          </div>
        )}

        {stage === 'flanker_game' && flankerPhase !== 'ready' && currentFlanker && (
          <div className="relative rounded-3xl border border-[#D4A373]/40 bg-gradient-to-b from-[#181410]/75 via-[#221B14]/65 to-[#14100C]/85 backdrop-blur-md p-5 md:p-8 shadow-[0_16px_40px_rgba(0,0,0,0.6)] text-center select-none text-amber-50 max-w-4xl lg:max-w-5xl mx-auto w-full">
            <style>{CV_CSS}</style>
            <div className="mb-4">
              {flankerPhase === 'real' ? (
                <StarTrail done={flankerTrialIndex} total={FLANKER_TOTAL_TRIALS} />
              ) : (
                <span className="inline-block rounded-full bg-[#3A2412]/80 border border-amber-400/30 px-4 py-1 text-sm font-bold text-amber-200">Practice</span>
              )}
            </div>

            {flankerPhase !== 'real' && (
              <div className="mb-3 flex items-center justify-center gap-3">
                <img src="/quests/adhd/guide_chirp.webp" alt="Guide Chirp" className="cv-float h-14 w-14 object-contain drop-shadow" />
                <p className="text-left text-base md:text-lg font-bold text-amber-100 max-w-xs">
                  {flankerPhase === 'demo1' ? 'Tap the paddle the arrow points to!' : 'Look at the BIG golden arrow in the middle. Ignore the little ones!'}
                </p>
              </div>
            )}

            {/* Navigational Helm: Guide Chirp's Steering Compass */}
            <div className="relative my-6 flex items-center justify-center gap-3 md:gap-5 p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-[#2A1D13]/90 via-[#3D2B1C]/90 to-[#2A1D13]/90 border-2 border-[#D4A373]/60 shadow-[inset_0_4px_16px_rgba(0,0,0,0.8),0_8px_24px_rgba(0,0,0,0.4)] min-h-[8.5rem]">
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
              <p className="mb-3 font-patrick text-2xl font-bold text-amber-300" aria-live="polite">{flankerFx.ok ? 'Yes! Great!' : 'Try again! Look at the big golden one.'}</p>
            )}

            {/* Tactile Teak & Brass Steering Paddles */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <button
                type="button"
                aria-label="Steer Left"
                onClick={() => handleFlankerAnswer('left')}
                className={`rounded-3xl border-4 border-[#D4A373] bg-gradient-to-b from-[#3E2713] via-[#4A321E] to-[#2B170B] py-6 shadow-[0_8px_20px_rgba(0,0,0,0.6)] transition-all active:scale-95 flex items-center justify-center group hover:border-amber-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 ${flankerPhase === 'demo1' && currentFlanker.centerDir === 'left' ? 'ring-4 ring-amber-400' : ''}`}
              >
                <svg viewBox="0 0 48 48" className="h-16 w-16 sm:h-20 sm:w-20 transition-transform group-hover:-translate-x-1" fill="none">
                  <path d="M 30 8 L 14 24 L 30 40" stroke="#FBBF24" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M 30 8 L 14 24 L 30 40" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Steer Right"
                onClick={() => handleFlankerAnswer('right')}
                className={`rounded-3xl border-4 border-[#D4A373] bg-gradient-to-b from-[#3E2713] via-[#4A321E] to-[#2B170B] py-6 shadow-[0_8px_20px_rgba(0,0,0,0.6)] transition-all active:scale-95 flex items-center justify-center group hover:border-amber-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 ${flankerPhase === 'demo1' && currentFlanker.centerDir === 'right' ? 'ring-4 ring-amber-400' : ''}`}
              >
                <svg viewBox="0 0 48 48" className="h-16 w-16 sm:h-20 sm:w-20 transition-transform group-hover:translate-x-1" fill="none">
                  <path d="M 18 8 L 34 24 L 18 40" stroke="#FBBF24" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M 18 8 L 34 24 L 18 40" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* 6. CHAPTER 3 STORY: THE ASTROLABE MEMORY MATRIX */}
        {stage === 'memory_story' && (
          <div className="rounded-3xl border border-[#818CF8]/40 bg-gradient-to-b from-[#0B0F24]/75 via-[#121838]/65 to-[#0A0D1E]/85 backdrop-blur-md overflow-hidden shadow-2xl text-slate-100">
            <div className="relative h-60 md:h-72 w-full overflow-hidden bg-[#1E1B4B]">
              <img
                src="/quests/adhd/bg_memory.webp"
                alt="Starlit Valley Terrace"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent flex items-end p-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-300 bg-black/40 px-3 py-1 rounded-full">
                    Chapter 3: The Starlight Terrace
                  </span>
                  <h2 className="font-patrick text-3xl md:text-4xl text-white font-bold mt-1">
                    Remember the Stars! ⭐
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 text-center">
              <GuideChirpNote text="Watch the stars glow! Remember the pattern, then tap them in the exact same order! ⭐" />

              {/* 3 Byte-sized visual steps */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 max-w-xl mx-auto">
                <div className="rounded-2xl bg-indigo-500/15 border border-indigo-400/30 p-3 flex flex-col items-center text-center shadow-sm">
                  <span className="text-2xl mb-1">👀</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Step 1</span>
                  <p className="text-xs font-bold text-slate-100 mt-0.5">Watch stars glow</p>
                </div>
                <div className="rounded-2xl bg-indigo-500/15 border border-indigo-400/30 p-3 flex flex-col items-center text-center shadow-sm">
                  <span className="text-2xl mb-1">🧠</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Step 2</span>
                  <p className="text-xs font-bold text-slate-100 mt-0.5">Remember order</p>
                </div>
                <div className="rounded-2xl bg-indigo-500/15 border border-indigo-400/30 p-3 flex flex-col items-center text-center shadow-sm">
                  <span className="text-2xl mb-1">⭐</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Step 3</span>
                  <p className="text-xs font-bold text-slate-100 mt-0.5">Tap in same order!</p>
                </div>
              </div>

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
                  className="rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 px-12 py-5 text-xl font-bold text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  Let’s practice →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 7. CHAPTER 3 GAMEPLAY: ASTROLABE */}
        {stage === 'memory_game' && memPracReady && (
          <div className="rounded-3xl border border-[#818CF8]/40 bg-gradient-to-b from-[#0B0F24]/75 via-[#121838]/65 to-[#0A0D1E]/85 backdrop-blur-md p-8 md:p-10 shadow-[0_16px_40px_rgba(0,0,0,0.6)] text-center select-none text-slate-100 max-w-4xl lg:max-w-5xl mx-auto w-full">
            <style>{CV_CSS}</style>
            <img src="/quests/adhd/guide_chirp.webp" alt="Guide Chirp" className="cv-float mx-auto h-24 w-24 object-contain drop-shadow" />
            <p className="font-patrick text-3xl text-purple-300 font-bold mt-3">Great job!</p>
            <p className="text-base md:text-lg font-bold text-slate-200 mt-2">Now the real stars. Watch, then tap the same ones!</p>
            <div className="mt-6 flex flex-col items-center gap-3">
              <button type="button" onClick={() => { playAudio('whoosh'); setMemPracReady(false); starLogRef.current = []; setMemoryLevel(1) }} className="rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 px-12 py-4 text-xl font-bold text-white shadow-xl hover:scale-105 active:scale-95 transition-all">I’m ready →</button>
              <button type="button" onClick={() => { events.noteRetry('stars'); starPlanRef.current = null; setMemPracReady(false); setMemoryLevel(-1); setMemRetry((n) => n + 1) }} className="text-sm font-bold text-purple-300 underline">Practice again</button>
            </div>
          </div>
        )}

        {stage === 'memory_game' && !memPracReady && (
          <div className="rounded-3xl border border-[#818CF8]/40 bg-gradient-to-b from-[#0B0F24]/75 via-[#121838]/65 to-[#0A0D1E]/85 backdrop-blur-md p-4 sm:p-7 shadow-[0_16px_40px_rgba(0,0,0,0.6)] text-center select-none text-slate-100 max-w-4xl lg:max-w-5xl mx-auto w-full">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-200 bg-[#251E4A]/80 border border-purple-400/30 px-3.5 py-1 rounded-full backdrop-blur-sm">
                {memoryLevel < 1 ? 'Practice' : `Level ${memoryLevel} of 3 • Constellation Span: ${memorySequence.length || memoryLevel + 2}`}
              </span>
              <span className="text-xs font-bold text-amber-200 bg-[#3A2412]/80 px-3 py-1 rounded-full border border-amber-400/30 backdrop-blur-sm flex items-center gap-1">
                {memoryPhase === 'showing' ? (starToneRef.current ? '🎵 Listen!' : '✨ Watch the stars!') : '🌟 Your turn!'}
              </span>
            </div>

            {memoryLevel < 1 && (
              <div className="mb-2 flex items-center justify-center gap-3">
                <img src="/quests/adhd/guide_chirp.webp" alt="Guide Chirp" className="cv-float h-14 w-14 object-contain drop-shadow" />
                <p className="text-left text-base md:text-lg font-bold text-slate-200 max-w-xs" aria-live="polite">
                  {memMsg === 'ok' ? 'Yes! Great!' : memMsg === 'again' ? 'Try again! Watch the stars.' : memoryLevel === -1 ? 'Watch the star light up. Then tap it!' : 'Now two stars. Watch, then tap them in order!'}
                </p>
              </div>
            )}

            {/* The Astrolabe Mount */}
            <div className="mx-auto my-4 grid aspect-square grid-cols-3 gap-3 sm:gap-6 rounded-3xl bg-gradient-to-b from-[#0A0D1A] via-[#101428] to-[#080A14] border-4 border-[#6366F1]/50 p-4 sm:p-7 shadow-[0_12px_36px_rgba(0,0,0,0.8),inset_0_0_30px_rgba(30,27,75,0.6)]" style={{ width: '100%', maxWidth: band.grid }}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => {
                const isLit = memoryLitCell === idx || memoryTapCell === idx
                return (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Star Node ${idx + 1}`}
                    disabled={memoryPhase !== 'input'}
                    onPointerDown={() => { if (memoryPhase === 'input') { setMemoryTapCell(idx); setTimeout(() => setMemoryTapCell((c) => (c === idx ? null : c)), 320) } }}
                    onClick={() => handleMemoryClick(idx)}
                    className={`rounded-2xl p-1 sm:p-2.5 transition-all flex items-center justify-center ${
                      isLit
                        ? 'bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 shadow-[0_0_30px_#F59E0B] scale-105 border-2 border-amber-200'
                        : 'bg-slate-900/90 border-2 border-indigo-900/60 hover:border-indigo-400/60 shadow-md'
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
          <div className="rounded-3xl border border-[#D4A373]/40 bg-gradient-to-b from-[#181410]/75 via-[#221B14]/65 to-[#14100C]/85 backdrop-blur-md overflow-hidden shadow-2xl text-amber-50">
            <div className="relative h-60 md:h-72 w-full overflow-hidden bg-gradient-to-tr from-[#FEF3C7] to-[#DCFCE7]">
              <img
                src="/quests/adhd/bg_charge.webp"
                alt="Sunstone Temple Courtyard"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent flex items-end p-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-black/40 px-3 py-1 rounded-full">
                    Chapter 4: The Sunstone Courtyard
                  </span>
                  <h2 className="font-patrick text-3xl md:text-4xl text-white font-bold mt-1">
                    Hold the Sunstone! ☀️
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 text-center">
              <GuideChirpNote text="Press and HOLD the glowing stone! Keep holding steady until you hear the chime! 🔔" />

              {/* 3 Byte-sized visual steps */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 max-w-xl mx-auto">
                <div className="rounded-2xl bg-amber-500/15 border border-amber-400/30 p-3 flex flex-col items-center text-center shadow-sm">
                  <span className="text-2xl mb-1">👆</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Step 1</span>
                  <p className="text-xs font-bold text-amber-100 mt-0.5">Press & HOLD</p>
                </div>
                <div className="rounded-2xl bg-amber-500/15 border border-amber-400/30 p-3 flex flex-col items-center text-center shadow-sm">
                  <span className="text-2xl mb-1">⏳</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Step 2</span>
                  <p className="text-xs font-bold text-amber-100 mt-0.5">Stay steady</p>
                </div>
                <div className="rounded-2xl bg-amber-500/15 border border-amber-400/30 p-3 flex flex-col items-center text-center shadow-sm">
                  <span className="text-2xl mb-1">🔔</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Step 3</span>
                  <p className="text-xs font-bold text-amber-100 mt-0.5">Release on chime!</p>
                </div>
              </div>

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
                  className="rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-12 py-5 text-xl font-bold text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  Let’s practice →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 9. CHAPTER 4 GAMEPLAY: SACRED SUNSTONE POWER CHARGE ALTAR */}
        {stage === 'situational_game' && CHARGE_TRIALS[chargeTrialIndex] && (() => {
          const arcHeadAngle = (chargeProgress / 100) * 360 - 90
          const arcHeadRad = (arcHeadAngle * Math.PI) / 180
          const arcHeadX = 150 + 104 * Math.cos(arcHeadRad)
          const arcHeadY = 150 + 104 * Math.sin(arcHeadRad)
          const activeRuneCount = chargeProgress >= 100 ? 12 : Math.floor((chargeProgress / 100) * 12)

          const RUNES = [
            {id: 0, x: 150, y: 24, label: '☀️', glyph: 'M150 19 L153 25 L150 28 L147 25 Z'},
            {id: 1, x: 213, y: 41, label: '✨', glyph: 'M213 36 L216 42 L213 45 L210 42 Z'},
            {id: 2, x: 259, y: 87, label: '⚡', glyph: 'M259 82 L262 88 L259 91 L256 88 Z'},
            {id: 3, x: 276, y: 150, label: '🔥', glyph: 'M276 145 L279 151 L276 154 L273 151 Z'},
            {id: 4, x: 259, y: 213, label: '✦', glyph: 'M259 208 L262 214 L259 217 L256 214 Z'},
            {id: 5, x: 213, y: 259, label: '✧', glyph: 'M213 254 L216 260 L213 263 L210 260 Z'},
            {id: 6, x: 150, y: 276, label: '☀️', glyph: 'M150 271 L153 277 L150 280 L147 277 Z'},
            {id: 7, x: 87, y: 259, label: '✨', glyph: 'M87 254 L90 260 L87 263 L84 260 Z'},
            {id: 8, x: 41, y: 213, label: '⚡', glyph: 'M41 208 L44 214 L41 217 L38 214 Z'},
            {id: 9, x: 24, y: 150, label: '🔥', glyph: 'M24 145 L27 151 L24 154 L21 151 Z'},
            {id: 10, x: 41, y: 87, label: '✦', glyph: 'M41 82 L44 88 L41 91 L38 88 Z'},
            {id: 11, x: 87, y: 41, label: '✧', glyph: 'M87 36 L90 42 L87 45 L84 42 Z'},
          ]

          return (
            <div className="relative rounded-3xl border-2 border-[#D4A373]/60 bg-gradient-to-b from-[#1C1610]/90 via-[#271E15]/80 to-[#140F0A]/95 backdrop-blur-md p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.75)] text-center select-none text-amber-50 max-w-5xl lg:max-w-6xl mx-auto w-full overflow-hidden">
              {/* Subtle Temple Ambient Ray Overlay */}
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent -z-10" />

              {/* Altar Header */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-200 bg-[#3A2412]/90 border border-amber-400/40 px-3.5 py-1.5 rounded-full backdrop-blur-sm shadow-sm flex items-center gap-1.5">
                  <span className="text-amber-400">☀️</span>
                  {chargePrac ? 'Practice: Steady Hold' : `Charge ${chargeTrialIndex + 1} of ${CHARGE_TRIALS.length} • ${CHARGE_TRIALS[chargeTrialIndex].title}`}
                </span>
                <span className="text-xs font-bold text-amber-100 bg-[#422D19]/90 px-3.5 py-1.5 rounded-full border border-amber-400/40 backdrop-blur-sm shadow-sm flex items-center gap-1">
                  <span>🏛️</span> Sacred Altar
                </span>
              </div>

              {/* Guide Chirp Guidance Bubble */}
              <div className="mb-4 flex items-center justify-center gap-3 bg-[#24170E]/80 border border-amber-400/30 rounded-2xl p-3 shadow-md backdrop-blur-sm max-w-xl mx-auto">
                <style>{CV_CSS}</style>
                <img src="/quests/adhd/guide_chirp.webp" alt="Guide Chirp" className="cv-float h-12 w-12 object-contain drop-shadow" />
                <p className="text-left text-sm sm:text-base font-bold text-amber-100 leading-snug">
                  {chargePrac
                    ? 'Hold the stone steady until the ring fills! ☀️'
                    : chargeStatusText === 'early'
                    ? 'Almost! 💨 Hold steady all the way to 100% 🔔'
                    : chargeStatusText === 'charging'
                    ? `Power rising! ⚡ Keep holding! (${chargeProgress}%)`
                    : chargeStatusText === 'success'
                    ? '★ Ding! Chime sounded! Beautiful hold! 🌟'
                    : 'Press & HOLD the Sunstone until the chime! ☀️'}
                </p>
              </div>

              {/* Interactive Sacred Altar Dais & Sunstone Relic */}
              <div className="relative mx-auto my-6 flex h-80 w-80 sm:h-96 sm:w-96 md:h-[420px] md:w-[420px] items-center justify-center">
                {/* SVG Sacred Mandala Altar Dial */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none -rotate-90 select-none" viewBox="0 0 300 300">
                  <defs>
                    <linearGradient id="sunfireChargeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#F59E0B" />
                      <stop offset="50%" stopColor="#FBBF24" />
                      <stop offset="100%" stopColor="#FDE68A" />
                    </linearGradient>
                    <radialGradient id="altarCoreGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                    </radialGradient>
                    <filter id="runeGlow" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Ambient Altar Glow Backing */}
                  <circle cx="150" cy="150" r="142" fill="url(#altarCoreGlow)" />

                  {/* Outer Carved Stone Border */}
                  <circle cx="150" cy="150" r="138" stroke="#5C3B1E" strokeWidth="2.5" strokeDasharray="3 5" fill="none" opacity="0.6" />
                  <circle cx="150" cy="150" r="130" stroke="#784A24" strokeWidth="1.5" fill="none" opacity="0.4" />

                  {/* 12 Ancient Solar Runes */}
                  {RUNES.map((rune) => {
                    const isLit = rune.id < activeRuneCount
                    return (
                      <g key={rune.id} className="transition-all duration-300">
                        {/* Connecting ray to inner channel */}
                        <line
                          x1={rune.x}
                          y1={rune.y}
                          x2={150 + 104 * Math.cos(((rune.id * 30 - 90) * Math.PI) / 180)}
                          y2={150 + 104 * Math.sin(((rune.id * 30 - 90) * Math.PI) / 180)}
                          stroke={isLit ? '#FBBF24' : '#5C3B1E'}
                          strokeWidth={isLit ? '2' : '1'}
                          opacity={isLit ? '0.8' : '0.3'}
                        />
                        {/* Rune Node */}
                        <circle
                          cx={rune.x}
                          cy={rune.y}
                          r={isLit ? '7' : '5'}
                          fill={isLit ? '#FDE68A' : '#2A1C12'}
                          stroke={isLit ? '#F59E0B' : '#6B4522'}
                          strokeWidth="2"
                          filter={isLit ? 'url(#runeGlow)' : undefined}
                        />
                        {isLit && (
                          <circle
                            cx={rune.x}
                            cy={rune.y}
                            r="11"
                            fill="none"
                            stroke="#FBBF24"
                            strokeWidth="1"
                            opacity="0.6"
                            className="animate-ping"
                          />
                        )}
                      </g>
                    )
                  })}

                  {/* Base Channel Groove */}
                  <circle cx="150" cy="150" r="104" stroke="#2B1A0F" strokeWidth="12" fill="none" opacity="0.9" />
                  <circle cx="150" cy="150" r="104" stroke="#4A301A" strokeWidth="10" fill="none" opacity="0.7" />

                  {/* Active Molten Golden Energy Arc */}
                  <circle
                    cx="150"
                    cy="150"
                    r="104"
                    stroke="url(#sunfireChargeGrad)"
                    strokeWidth="11"
                    fill="none"
                    strokeDasharray="653.45"
                    strokeDashoffset={653.45 - (653.45 * chargeProgress) / 100}
                    strokeLinecap="round"
                    filter="url(#runeGlow)"
                    className="transition-all duration-75"
                  />

                  {/* Orbital Energy Spark at Arc Head */}
                  {isCharging && chargeProgress > 0 && chargeProgress < 100 && (
                    <g transform={`rotate(90 150 150)`}>
                      {/* Convert back from rotated coords */}
                      <circle
                        cx={arcHeadX}
                        cy={arcHeadY}
                        r="8"
                        fill="#FFFBEB"
                        stroke="#F59E0B"
                        strokeWidth="3"
                        filter="url(#runeGlow)"
                      />
                      <circle
                        cx={arcHeadX}
                        cy={arcHeadY}
                        r="14"
                        fill="none"
                        stroke="#FDE68A"
                        strokeWidth="1.5"
                        opacity="0.8"
                        className="animate-ping"
                      />
                    </g>
                  )}
                </svg>

                {/* Touchable Core Ancient Sunstone Relic */}
                <button
                  type="button"
                  aria-label="Ancient Sunstone power relic"
                  onPointerDown={handleStartCharge}
                  onPointerUp={handleEndCharge}
                  onPointerLeave={handleEndCharge}
                  onContextMenu={(e) => e.preventDefault()}
                  className={`relative z-10 w-52 h-52 sm:w-64 sm:h-64 md:w-72 md:h-72 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 ${
                    isCharging
                      ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-300 scale-105 shadow-[0_0_80px_rgba(245,158,11,0.95),0_0_140px_rgba(251,191,36,0.6)] border-4 border-yellow-200'
                      : chargeStatusText === 'success'
                      ? 'bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-400 scale-105 shadow-[0_0_70px_rgba(16,185,129,0.95)] border-4 border-emerald-200'
                      : 'bg-gradient-to-b from-[#2C180B] via-[#4A2912] to-[#1E0F05] border-4 border-amber-400/80 hover:border-amber-300 shadow-[0_12px_36px_rgba(0,0,0,0.8),inset_0_0_24px_rgba(245,158,11,0.25)]'
                  }`}
                >
                  {chargeStatusText === 'success' ? (
                    <div className="flex flex-col items-center text-white animate-bounce">
                      <img src="/quests/adhd/sunstone_orb.webp" alt="Sunstone Fully Charged" className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-[0_0_25px_rgba(255,255,255,0.9)] object-contain" />
                      <span className="font-patrick text-2xl font-bold mt-1 text-emerald-100 drop-shadow">✨ CHARGED! ✨</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center pointer-events-none select-none">
                      <img
                        src="/quests/adhd/sunstone_orb.webp"
                        alt="Sunstone Relic"
                        className={`w-20 h-20 sm:w-24 sm:h-24 object-contain transition-transform duration-300 ${
                          isCharging
                            ? 'scale-115 drop-shadow-[0_0_30px_rgba(251,191,36,0.95)]'
                            : 'opacity-95 hover:scale-105'
                        }`}
                      />
                      {isCharging ? (
                        <div className="mt-1 flex flex-col items-center">
                          <span className="rounded-full bg-black/60 backdrop-blur-sm px-3 py-0.5 text-xs sm:text-sm font-black text-amber-300 border border-amber-400/50 shadow-sm">
                            ⚡ {chargeProgress}% HOLD!
                          </span>
                          <span className="text-[10px] font-bold text-white uppercase tracking-widest mt-0.5 drop-shadow">
                            Wait for chime...
                          </span>
                        </div>
                      ) : (
                        <div className="mt-1 flex flex-col items-center">
                          <span className="rounded-full bg-[#1A0E05]/90 px-4 py-1 text-xs sm:text-sm font-black uppercase tracking-wider text-amber-200 border border-amber-400/50 shadow-sm flex items-center gap-1.5">
                            <span>☀️</span> PRESS & HOLD
                          </span>
                          <span className="text-[11px] font-bold text-amber-300 mt-1">
                            Hold until chime 🔔
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </button>
              </div>

              {/* Status and Action Feedback Banner */}
              <div className="max-w-md mx-auto">
                {chargeStatusText === 'early' && (
                  <div className="p-3 rounded-2xl bg-rose-950/85 border border-rose-500/60 text-xs sm:text-sm font-bold text-rose-200 animate-shake shadow-lg flex items-center justify-center gap-2">
                    <span>💨</span>
                    <span>Released a bit early! Hold until 100% 🔔</span>
                  </div>
                )}
                {chargeStatusText === 'charging' && (
                  <div className="p-3 rounded-2xl bg-[#3A2412]/90 border border-amber-400/50 text-xs sm:text-sm font-bold text-amber-200 animate-pulse shadow-lg flex items-center justify-center gap-2">
                    <span className="animate-spin">☀️</span>
                    <span>Charging {chargeProgress}% • Keep holding!</span>
                  </div>
                )}
                {chargeStatusText === 'success' && (
                  <div className="p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/60 text-xs sm:text-sm font-bold text-emerald-200 shadow-lg flex items-center justify-center gap-2">
                    <span>🌟</span>
                    <span>100% Charged! Super steady holding!</span>
                  </div>
                )}
                {chargeStatusText === 'idle' && (
                  <p className="text-xs sm:text-sm font-bold text-amber-200/90 flex items-center justify-center gap-1.5">
                    <span>👇</span>
                    <span>Touch and hold the center stone</span>
                  </p>
                )}
              </div>
            </div>
          )
        })()}

        {/* 10. CHAPTER 5 STORY: SKY TRAIL (SUN & MOON) */}
        {stage === 'trail_story' && (
          <div className="mx-auto max-w-2xl text-center select-none py-6">
            <div className="rounded-3xl border border-amber-400/40 bg-gradient-to-b from-[#18112C]/95 via-[#231840]/90 to-[#120B22]/95 backdrop-blur-md p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.7)] text-amber-50">
              <span className="inline-block rounded-full bg-amber-400/20 border border-amber-300/40 px-4 py-1 text-xs font-bold uppercase tracking-wider text-amber-200 mb-3 shadow-sm">
                🌌 Chapter 5: Constellation Trail
              </span>
              <h2 className="font-patrick text-3xl sm:text-4xl text-amber-200 font-bold mb-2 drop-shadow-md">
                Sky Trail: Sun & Moon ☀️🌙
              </h2>
              <p className="text-sm md:text-base text-amber-100 font-medium leading-relaxed mb-6 max-w-lg mx-auto">
                Connect the celestial stones in order, alternating between Sun and Moon!
              </p>

              {/* Byte-sized Visual Formula */}
              <div className="mb-6 rounded-2xl bg-black/40 border border-amber-400/30 p-4 max-w-md mx-auto">
                <p className="text-xs font-bold text-amber-200 uppercase tracking-wider mb-2">Alternating Sequence:</p>
                <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-black">
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/30 border border-amber-400 text-amber-200">1 ☀️</span>
                  <span>➔</span>
                  <span className="px-2.5 py-1 rounded-xl bg-indigo-500/30 border border-indigo-400 text-indigo-200">1 🌙</span>
                  <span>➔</span>
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/30 border border-amber-400 text-amber-200">2 ☀️</span>
                  <span>➔</span>
                  <span className="px-2.5 py-1 rounded-xl bg-indigo-500/30 border border-indigo-400 text-indigo-200">2 🌙</span>
                  <span>➔</span>
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/30 border border-amber-400 text-amber-200">3 ☀️...</span>
                </div>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    playAudio('whoosh')
                    setTrailStep(0)
                    setTrailCompleted([])
                    setTrailLines([])
                    setTrailFeedback('')
                    trailSwitchesCorrectRef.current = 0
                    trailErrorsRef.current = 0
                    trailStartTimeRef.current = performance.now()
                    setStage('trail_game')
                  }}
                  className="rounded-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-12 py-5 text-xl font-bold text-white shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  Start Sky Trail ▶
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 11. CHAPTER 5 GAMEPLAY: SKY TRAIL ARENA */}
        {stage === 'trail_game' && (() => {
          const expected = TRAIL_NODES[trailStep]
          return (
            <div className="mx-auto max-w-4xl lg:max-w-5xl select-none py-2 text-center">
              {/* Header Banner */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#140E24]/90 border border-amber-400/40 p-3 px-5 backdrop-blur-md shadow-md text-amber-100">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌌</span>
                  <div className="text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                      Trail Making Set-Shifting
                    </span>
                    <span className="font-patrick text-xl sm:text-2xl font-bold text-white">
                      Next: {expected ? `${expected.num} ${expected.symbol} (${expected.type === 'sun' ? 'Sun' : 'Moon'})` : 'Done!'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-amber-500/20 border border-amber-400/40 px-3.5 py-1 text-xs font-bold text-amber-200">
                    Step {Math.min(trailStep + 1, TRAIL_NODES.length)} of {TRAIL_NODES.length}
                  </span>
                </div>
              </div>

              {/* Feedback Prompt */}
              {trailFeedback && (
                <div className="mb-3 text-xs sm:text-sm font-bold text-amber-200 animate-pulse">
                  {trailFeedback}
                </div>
              )}

              {/* Starlight Constellation Canvas */}
              <div className="relative mx-auto w-full aspect-[16/10] min-h-[380px] sm:min-h-[460px] md:min-h-[520px] rounded-3xl overflow-hidden border-2 border-indigo-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.8)] bg-gradient-to-b from-[#090514] via-[#120B24] to-[#0A0616]">
                {/* SVG Constellation Connection Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {trailLines.map((line, idx) => (
                    <line
                      key={idx}
                      x1={`${line.x1}%`}
                      y1={`${line.y1}%`}
                      x2={`${line.x2}%`}
                      y2={`${line.y2}%`}
                      stroke="#FBBF24"
                      strokeWidth="0.8"
                      strokeDasharray="2 1"
                      strokeLinecap="round"
                      className="animate-pulse"
                      filter="drop-shadow(0 0 4px #F59E0B)"
                    />
                  ))}
                </svg>

                {/* Celestial Nodes */}
                {TRAIL_NODES.map((node) => {
                  const isDone = trailCompleted.includes(node.id)
                  const isNext = node.id === trailStep
                  const isShaking = trailErrorShakeId === node.id

                  return (
                    <button
                      key={node.id}
                      type="button"
                      aria-label={node.label}
                      onClick={() => handleTrailNodeClick(node.id)}
                      style={{left: `${node.x}%`, top: `${node.y}%`}}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center rounded-full transition-transform active:scale-90 cursor-pointer ${
                        isDone
                          ? 'w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-amber-400 to-yellow-300 border-2 border-white shadow-[0_0_20px_rgba(251,191,36,0.9)] opacity-90'
                          : isNext
                          ? 'w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-b from-[#2A1D4E] to-[#170E2E] border-2 border-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.7)] animate-pulse'
                          : 'w-14 h-14 sm:w-16 sm:h-16 bg-[#160E2A]/90 border border-indigo-400/50 hover:border-amber-300/80 shadow-md'
                      } ${isShaking ? 'animate-shake ring-4 ring-rose-500' : ''}`}
                    >
                      <span className={`text-xl sm:text-2xl ${isDone ? 'brightness-125' : ''}`}>
                        {node.symbol}
                      </span>
                      <span className={`text-[11px] sm:text-xs font-black mt-0.5 ${
                        isDone ? 'text-slate-950 font-extrabold' : 'text-amber-200'
                      }`}>
                        {node.num}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* 12. LOADING AGENTIC EVALUATION */}
        {stage === 'parent_card' && (
          <ParentCard childName={heroName} onDone={(a) => submitCognitiveAgent(a)} />
        )}

        {stage === 'agent_eval' && (
          <div className="rounded-3xl border border-[#D4A373]/40 bg-gradient-to-b from-[#181410]/75 via-[#221B14]/65 to-[#14100C]/85 backdrop-blur-md p-12 shadow-2xl text-center text-amber-50">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full border-4 border-amber-400 border-t-transparent animate-spin flex items-center justify-center">
              <AstrolabeCrystalSvg className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="font-patrick text-3xl text-amber-100 mb-2">
              The Sky Council is writing your summary...
            </h2>
            <p className="text-xs sm:text-sm text-amber-200/80 max-w-md mx-auto">
              Turning the play into a plain-language summary.
            </p>
          </div>
        )}

        {/* 11. CELEBRATION & RESULTS SCREEN */}
        {stage === 'celebration' && agentResult && (
          <div className="space-y-8">
            {/* Child Fantasy Award Certificate */}
            <div className="rounded-3xl border-4 border-amber-300 bg-gradient-to-b from-[#FFFDF8] via-white to-[#FEF3C7] shadow-2xl text-center relative overflow-hidden">
              <div className="relative h-48 sm:h-64 w-full overflow-hidden">
                <img
                  src="/quests/adhd/celebration.webp"
                  alt="Sunbird Valley Dawn Celebration"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex items-end justify-center p-6">
                  <h1 className="font-patrick text-3xl sm:text-5xl text-white font-bold drop-shadow-md">
                    {agentResult.superpowers.realmTitle}
                  </h1>
                </div>
              </div>
              <div className="p-6 md:p-10 max-w-xl mx-auto">
                <span className="text-xs font-bold uppercase tracking-widest text-[#B45309] block mb-2">
                  Sunbird Valley • Official Quest Certificate
                </span>
                <div className="inline-block rounded-full bg-amber-500 text-white font-bold text-xs uppercase px-4 py-1.5 shadow-sm mb-6">
                  {agentResult.superpowers.crestBadge}
                </div>

                <p className="text-sm sm:text-base text-[#475569] leading-relaxed italic mb-8 bg-amber-50/60 p-6 rounded-2xl border border-amber-200/80">
                  &ldquo;{agentResult.superpowers.miloScroll}&rdquo;
                </p>

                {/* Superpower Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-8">
                  {agentResult.superpowers.badges.map((badge: {name: string; desc: string; rank?: string}, i: number) => (
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

            {agentResult && showClinicalDossier && (() => { const a = agentResult as unknown as Record<string, any>; return (
              <div className="mb-4 flex flex-wrap items-center justify-center gap-3"><ClinicianReportButton quest="adhd" nickname={a.childName} age={a.childAge} generatedOn={a.clinicalReport?.generatedOn} rows={a.clinicalReport?.indices ?? []} clinicianQuestions={a.clinicalReport?.questions ?? []} measures={a.record?.measures} parentCard={a.record?.parentCard} steeringTrials={a.record?.steeringTrials} starLevels={a.record?.starLevels} />{a.record && <SessionRecordDownload record={a.record} />}</div>
            ) })()}
            {/* PERSONALISED REPORT FOR THE PARENT: built from this session, shown only once a clinician has checked the wording */}
            {agentResult && (agentResult as {record?: unknown}).record && (
              <div className="mb-8"><EndReport record={(agentResult as {record: Record<string, unknown>}).record as any} name={(agentResult as {childName: string}).childName} /></div>
            )}
            {/* GROWN-UP SUMMARY & CLINICAL DOSSIER */}
            {showClinicalDossier && agentResult?.clinicalReport && (
              <div className="space-y-6">
                <CognitiveDossierView
                  quest="adhd"
                  childName={(agentResult as {childName: string}).childName || heroName || 'Explorer'}
                  clinicalReport={agentResult.clinicalReport}
                />
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <Link
                    href="/consult"
                    className="rounded-full bg-[#05B076] px-8 py-3 text-xs font-bold text-white shadow-md hover:bg-[#049A68] transition-all"
                  >
                    Talk to a Manas specialist →
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowClinicalDossier(false)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
                  >
                    Collapse grown-up summary
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
export default function McGate(props: Record<string, unknown>) {
  const [mounted, setMounted] = __mcUseState(false);
  __mcUseEffect(() => { setMounted(true); }, []);
  return mounted ? <McInner {...props} /> : null;
}
