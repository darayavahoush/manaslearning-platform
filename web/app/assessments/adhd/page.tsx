'use client'
import ClinicianReportButton from '../../../components/assessments/ClinicianReport'
import {useState, useEffect, useRef, useMemo} from 'react'
import Link from 'next/link'
import KeeperFeedback from '../../../components/assessments/KeeperFeedback'
import {QuestStyles, Fireflies, AmbientToggle} from '../../../components/assessments/QuestFX'

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
// G = sunbird (tap), N = moth (wait). 14 sunbirds, 6 moths, never two moths in a row.
const CPT_ORDER = 'GGNGGGNGGNGGGNGGNGGN'
// Wait before each shape appears (ms). Same four values as before, in a fixed order, five of each.
const CPT_WAITS = [1200, 2050, 850, 1600, 1600, 850, 2050, 1200, 850, 1200, 1600, 2050, 2050, 1600, 1200, 850, 1200, 850, 2050, 1600]
// A tap counts from the moment the shape appears until this long after, even if the shape has already gone.
const CPT_WINDOW_MS = 1000
// A "hit" faster than this is counted as an early tap, not as a reaction.
const CPT_MIN_RT_MS = 150
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

function __McInner() {
  const [stage, setStage] = useState<'welcome' | 'avatar' | 'cpt_story' | 'cpt_game' | 'flanker_story' | 'flanker_game' | 'memory_story' | 'memory_game' | 'situational_story' | 'situational_game' | 'trials' | 'agent_eval' | 'celebration'>('welcome')

  // Child Fantasy Persona
  const [heroName, setHeroName] = useState('')
  const [heroAge, setHeroAge] = useState(8)
  const [guildClass, setGuildClass] = useState('Canopy Sky Ranger')
  const [companion] = useState('Milo the Wise Owl')
  const band = bandFor(heroAge)
  // the last two games (star memory and Sunstone charge) use the dark night-sky look
  const darkStage = stage === 'memory_story' || stage === 'memory_game' || stage === 'situational_story' || stage === 'situational_game'

  // CPT-3 Randomized Parameters (Conners Continuous Performance Battery)
  const CPT_TOTAL_TRIALS = 20
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
  const [flankerCongruentTimes, setFlankerCongruentTimes] = useState<number[]>([])
  const [flankerIncongruentTimes, setFlankerIncongruentTimes] = useState<number[]>([])
  const [currentFlanker, setCurrentFlanker] = useState<{centerDir: 'left' | 'right'; flankerDir: 'left' | 'right' | 'neutral'; isCongruent: boolean} | null>(null)
  const flankerStartRef = useRef<number>(0)

  // Astrolabe Memory Matrix State
  const [memoryLevel, setMemoryLevel] = useState(1)
  const [memorySequence, setMemorySequence] = useState<number[]>([])
  const [memoryUserSequence, setMemoryUserSequence] = useState<number[]>([])
  const [memoryLitCell, setMemoryLitCell] = useState<number | null>(null)
  const [memoryTapCell, setMemoryTapCell] = useState<number | null>(null)
  const [memoryPhase, setMemoryPhase] = useState<'showing' | 'input' | 'feedback'>('showing')
  const [memoryMaxSpan, setMemoryMaxSpan] = useState(0)

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

    if (cptTrialIndex >= CPT_TOTAL_TRIALS) {
      playAudio('fanfare')
      setStage('flanker_story')
      return
    }

    const stim = CPT_ORDER[cptTrialIndex % CPT_ORDER.length] === 'G' ? 'target' : 'distractor'
    const wait = CPT_WAITS[cptTrialIndex % CPT_WAITS.length]
    const displayDuration = heroAge <= 7 ? 680 : heroAge <= 11 ? 540 : 440
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
        if (stim === 'target' && !cptRespondedRef.current) setCptOmissions((o) => o + 1)
        later(() => setCptTrialIndex((i) => i + 1), 340)
      }, CPT_WINDOW_MS)
    }, wait)

    return () => timers.forEach(clearTimeout)
  }, [stage, cptTrialIndex, heroAge])

  function handleCptTap() {
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
    }
  }

  // Flanker Randomizer Loop
  useEffect(() => {
    if (stage !== 'flanker_game') return

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
  }, [stage, flankerTrialIndex])

  function handleFlankerAnswer(dir: 'left' | 'right') {
    if (!currentFlanker) return
    flankerTotalsRef.current[currentFlanker.isCongruent ? 'congruent' : 'incongruent'] += 1
    const elapsed = Math.round(performance.now() - flankerStartRef.current)

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

    // Fixed sequences (3, 4 and 5 stars, one try each) so every child sees the same items.
    const MEMORY_SEQS = band.seqs
    const seq: number[] = MEMORY_SEQS[Math.min(memoryLevel, MEMORY_SEQS.length) - 1]
    setMemorySequence(seq)
    setMemoryUserSequence([])
    setMemoryPhase('showing')

    seq.forEach((cell, idx) => {
      setTimeout(() => {
        setMemoryLitCell(cell)
        playAudio('star')
        setTimeout(() => setMemoryLitCell(null), band.litMs)
      }, 500 + idx * band.stepMs)
    })

    const timer = setTimeout(() => {
      setMemoryPhase('input')
    }, 500 + seq.length * band.stepMs)

    return () => clearTimeout(timer)
  }, [stage, memoryLevel, band.id])

  function handleMemoryClick(cellIdx: number) {
    if (memoryPhase !== 'input') return
    playAudio('star')
    const updated = [...memoryUserSequence, cellIdx]
    setMemoryUserSequence(updated)

    const step = updated.length - 1
    if (updated[step] !== memorySequence[step]) {
      playAudio('miss')
      setMemoryPhase('feedback')
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

    const target = CHARGE_TRIALS[chargeTrialIndex].targetMs

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
          if (chargeTrialIndex + 1 < CHARGE_TRIALS.length) {
            setChargeTrialIndex((idx) => idx + 1)
            setChargeProgress(0)
            setChargeStatusText('idle')
          } else {
            submitCognitiveAgent()
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
    const target = CHARGE_TRIALS[chargeTrialIndex].targetMs

    if (elapsed < target) {
      setIsCharging(false)
      setChargeProgress(0)
      setChargeStatusText('early')
      setPrematureReleases((p) => p + 1)
      playAudio('miss')
    }
  }

  useEffect(() => {
    return () => {
      if (chargeIntervalRef.current) clearInterval(chargeIntervalRef.current)
    }
  }, [])

  // Submit via Multi-Node Agent
  async function submitCognitiveAgent() {
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

    const payload = {
      assessmentType: 'adhd',
      childName: heroName || 'Canopy Ranger',
      childAge: heroAge,
      guildClass,
      companion,
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
        flankerIncongruentTotal: flankerTotalsRef.current.incongruent
      }
    }

    try {
      const res = await fetch('/api/assessments/agent', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
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
          <Link href="/assessments" prefetch={false} className="font-bold text-amber-300 hover:text-amber-200 hover:underline flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-300/30 shadow-sm">
            ← Assessment Directory
          </Link>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-black/40 backdrop-blur-md px-3.5 py-1.5 font-bold text-amber-200 border border-amber-400/40 shadow-sm">
              Play-Based Attention Quest • Not a Diagnosis
            </span>
          </div>
        </div>

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
              {/* Guild Class Selector */}
              <div className="mb-8">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#78350F] mb-3">
                  Step 1: Choose Your Explorer Guild Class
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {GUILD_CLASSES.map((cls) => {
                    const isSelected = guildClass === cls.name
                    const SvgComponent = cls.Svg
                    return (
                      <button
                        key={cls.name}
                        type="button"
                        onClick={() => { playAudio('tap'); setGuildClass(cls.name) }}
                        className={`rounded-2xl p-4 text-left border-2 transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/80 shadow-md ring-2 ring-amber-300'
                            : 'border-[#E7E5E4] bg-white hover:border-amber-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className={`p-2 rounded-xl ${isSelected ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'}`}>
                            <SvgComponent className="w-5 h-5" />
                          </div>
                          {isSelected && <span className="text-[10px] font-bold text-amber-700 uppercase bg-amber-200/80 px-2 py-0.5 rounded-full">Active</span>}
                        </div>
                        <div>
                          <strong className="text-sm text-[#0F172A] block font-bold">{cls.name}</strong>
                          <span className="text-xs text-[#64748B]">{cls.desc}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Explorer Codename & Age */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#78350F] mb-2">
                    Step 2: Enter Your Explorer Codename
                  </label>
                  <input
                    type="text"
                    value={heroName}
                    onChange={(e) => setHeroName(e.target.value)}
                    placeholder="e.g. Captain Arjun or Arya Star-Seeker"
                    className="w-full rounded-2xl border-2 border-[#E7E5E4] px-4 py-3 text-sm font-semibold text-[#0F172A] focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#78350F] mb-2">
                    Step 3: Age Category
                  </label>
                  <select
                    value={heroAge}
                    onChange={(e) => setHeroAge(Number(e.target.value))}
                    className="w-full rounded-2xl border-2 border-[#E7E5E4] px-4 py-3 text-sm font-semibold text-[#0F172A] focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white"
                  >
                    {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((age) => (
                      <option key={age} value={age}>
                        Age {age}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="mb-5 flex items-start gap-3 text-left text-xs leading-relaxed text-slate-700">
                <input type="checkbox" checked={parentOk} onChange={(e) => setParentOk(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0" />
                <span>I am this child&apos;s parent or guardian. This is a play activity, not a diagnosis. We do not save anything from this session. At the end, the codename and play counts are sent to write the summary, and an AI model may help word it.</span>
              </label>
              {/* Start Button */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  disabled={!heroName.trim() || !parentOk}
                  onClick={() => { playAudio('chime'); setStage('cpt_story') }}
                  className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-10 py-4 text-base font-bold text-white shadow-lg hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
                >
                  Embark on Quest: Chapter 1 →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. CHAPTER 1 STORY: THE OBSERVATORY */}
        {stage === 'cpt_story' && (
          <div className="rounded-3xl border-2 border-amber-300/40 bg-white/95 backdrop-blur-md overflow-hidden shadow-2xl">
            <div className="relative h-60 md:h-72 w-full overflow-hidden bg-gradient-to-b from-[#FEF3C7] to-[#DCFCE7]">
              <img
                src="/decor/itw/quest-sky-citadel-banner.webp"
                alt="Watchtower of Aethelgard"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-black/40 px-3 py-1 rounded-full">
                    Chapter 1: The Watchtower of Aethelgard
                  </span>
                  <h2 className="font-patrick text-3xl md:text-4xl text-white font-bold mt-1">
                    The Sunbird and the Moth
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <p className="text-xs md:text-sm text-[#475569] leading-relaxed mb-6">
                Watch the circle. Sometimes the sunbird appears and sometimes the moth does. Tap for the sunbird and wait for the moth. Milo the Owl says: <em>“Be quick, but wait until you see which one it is.”</em>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <div className="w-16 h-16 shrink-0 rounded-2xl bg-white border border-amber-300 flex items-center justify-center shadow-sm overflow-hidden p-1">
                    <SunbirdTarget className="h-full w-full" />
                  </div>
                  <div>
                    <strong className="text-xs text-[#92400E] block font-bold">When the sunbird appears:</strong>
                    <span className="text-xs text-[#78350F]">Tap the screen or press <strong>SPACEBAR</strong> as fast as you can.</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-rose-50 border border-rose-200">
                  <div className="w-16 h-16 shrink-0 rounded-2xl bg-white border border-rose-300 flex items-center justify-center shadow-sm">
                    <MothDistractor className="w-12 h-12" />
                  </div>
                  <div>
                    <strong className="text-xs text-[#991B1B] block font-bold">When the moth appears:</strong>
                    <span className="text-xs text-[#7F1D1D]"><strong>Wait.</strong> Do not tap.</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
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
                    cptRtLogRef.current = []
                    flankerTotalsRef.current = {congruent: 0, incongruent: 0}
                    setStage('cpt_game')
                  }}
                  className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-10 py-3.5 text-base font-bold text-white shadow-lg hover:scale-105 transition-all"
                >
                  Start (20 sightings) →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. CHAPTER 1 GAMEPLAY: CPT-3 VIGILANCE */}
        {stage === 'cpt_game' && (
          <div className="rounded-3xl border-2 border-amber-300/40 bg-white/95 backdrop-blur-md p-6 md:p-10 shadow-2xl text-center select-none">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] bg-[#F1F5F9] px-3.5 py-1 rounded-full">
                Sighting {cptTrialIndex + 1} of {CPT_TOTAL_TRIALS}
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
              className="relative mx-auto my-6 flex h-72 w-full max-w-sm cursor-pointer items-center justify-center rounded-full border-8 border-amber-300/80 bg-[#1E293B] transition-all hover:border-amber-400 active:scale-95 overflow-hidden"
            >
              {cptStimulus === 'target' && (
                <div className="flex flex-col items-center">
                  <SunbirdTarget className={band.bird} />
                </div>
              )}
              {cptStimulus === 'distractor' && (
                <div className="flex flex-col items-center">
                  <MothDistractor className="w-32 h-32" />
                </div>
              )}
              {!cptStimulus && (
                <div className="text-center text-amber-200/80">
                  <div className="h-16 w-16 mx-auto mb-2 rounded-full border-2 border-dashed border-amber-400/50 flex items-center justify-center bg-white/5">
                    <CompassRoseSvg className="w-6 h-6 text-amber-300" />
                  </div>
                  <span className="text-xs font-semibold text-amber-200">Watching the sky vortex...</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onPointerDown={handleCptTap}
              onClick={(e) => { if (e.detail === 0) handleCptTap() }}
              className="w-full max-w-sm rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-7 text-xl font-bold text-white shadow-lg active:scale-95 transition-all"
            >
              TAP NOW (Or Spacebar)
            </button>
          </div>
        )}

        {/* 4. CHAPTER 2 STORY: THE STARFIRE FLANKER */}
        {stage === 'flanker_story' && (
          <div className="rounded-3xl border-2 border-amber-300/40 bg-white/95 backdrop-blur-md overflow-hidden shadow-2xl">
            <div className="relative h-60 md:h-72 w-full overflow-hidden bg-[#0F172A]">
              <img
                src="/decor/itw/itw-adhd-support-focus-shield.webp"
                alt="Cosmic Starfire Drift"
                className="h-full w-full object-cover object-center opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-white/10 px-3 py-1 rounded-full">
                    Chapter 2: The Starfire Navigation
                  </span>
                  <h2 className="font-patrick text-3xl md:text-4xl text-white font-bold mt-1">
                    The Solar Chevrons
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <p className="text-xs md:text-sm text-[#475569] leading-relaxed mb-6">
                Your sky-skiff enters an astral meteor belt. Waves of radiant chevrons fly across your helm. Surrounding chevrons may try to confuse your course. <strong>Always focus ONLY on the CENTER golden chevron</strong>.
              </p>

              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center gap-3 mb-8">
                <span className="text-xs font-bold text-sky-900">If Center points LEFT: press LEFT arrow or tap Left.</span>
                <span className="text-xs font-bold text-sky-900">If Center points RIGHT: press RIGHT arrow or tap Right.</span>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    playAudio('whoosh')
                    setFlankerTrialIndex(0)
                    setFlankerCongruentTimes([])
                    setFlankerIncongruentTimes([])
                    setStage('flanker_game')
                  }}
                  className="rounded-full bg-gradient-to-r from-sky-500 to-sky-600 px-10 py-3.5 text-base font-bold text-white shadow-lg hover:scale-105 transition-all"
                >
                  Take the Helm (12 Formations) →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. CHAPTER 2 GAMEPLAY: FLANKER */}
        {stage === 'flanker_game' && currentFlanker && (
          <div className="rounded-3xl border-2 border-amber-300/40 bg-white/95 backdrop-blur-md p-6 md:p-10 shadow-2xl text-center select-none">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] bg-[#F1F5F9] px-3.5 py-1 rounded-full">
                Formation {flankerTrialIndex + 1} of {FLANKER_TOTAL_TRIALS}
              </span>
              <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
                Focus on CENTER Star
              </span>
            </div>

            <div className="my-10 flex items-center justify-center gap-3 md:gap-6 p-4 sm:p-8 rounded-3xl bg-[#D6E6F2] shadow-inner">
              <AstralChevronSvg direction={currentFlanker.flankerDir} isCenter={false} className={band.chev} />
              <AstralChevronSvg direction={currentFlanker.flankerDir} isCenter={false} className={band.chev} />
              <AstralChevronSvg direction={currentFlanker.centerDir} isCenter={true} className={band.chev} />
              <AstralChevronSvg direction={currentFlanker.flankerDir} isCenter={false} className={band.chev} />
              <AstralChevronSvg direction={currentFlanker.flankerDir} isCenter={false} className={band.chev} />
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <button
                type="button"
                onClick={() => handleFlankerAnswer('left')}
                className="rounded-2xl border-2 border-sky-500 bg-sky-50 hover:bg-sky-500 hover:text-white py-8 text-2xl font-bold text-sky-700 shadow-md transition-all active:scale-95"
              >
                ← Steer Left
              </button>
              <button
                type="button"
                onClick={() => handleFlankerAnswer('right')}
                className="rounded-2xl border-2 border-sky-500 bg-sky-50 hover:bg-sky-500 hover:text-white py-8 text-2xl font-bold text-sky-700 shadow-md transition-all active:scale-95"
              >
                Steer Right →
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
                Deep in the Citadel observatory lies the 9-node Starlight Astrolabe. Milo will illuminate a sequence of star crystals. Watch the pattern carefully, then tap the crystals in the exact same sequence!
              </p>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    playAudio('whoosh')
                    setMemoryLevel(1)
                    setStage('memory_game')
                  }}
                  className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-10 py-3.5 text-base font-bold text-white shadow-lg hover:scale-105 transition-all"
                >
                  Awaken the Astrolabe →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 7. CHAPTER 3 GAMEPLAY: ASTROLABE */}
        {stage === 'memory_game' && (
          <div className="rounded-3xl border-2 border-amber-300/40 bg-white/95 backdrop-blur-md p-6 md:p-10 shadow-2xl text-center select-none">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] bg-[#F1F5F9] px-3.5 py-1 rounded-full">
                Level {memoryLevel} of 3 • Constellation Span: {memorySequence.length || memoryLevel + 2}
              </span>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                {memoryPhase === 'showing' ? 'Watch Pattern...' : 'Your Turn to Harmonize!'}
              </span>
            </div>

            <div className="mx-auto my-6 grid aspect-square grid-cols-3 gap-3 rounded-3xl bg-[#0F172A] p-4 shadow-2xl" style={{ width: '100%', maxWidth: band.grid }}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => {
                const isLit = memoryLitCell === idx || memoryTapCell === idx
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={memoryPhase !== 'input'}
                    onPointerDown={() => { if (memoryPhase === 'input') { setMemoryTapCell(idx); setTimeout(() => setMemoryTapCell((c) => (c === idx ? null : c)), 320) } }}
                    onClick={() => handleMemoryClick(idx)}
                    className={`rounded-2xl p-2 transition-all flex items-center justify-center ${
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
                Before Milo awards your golden Sunstone crest, you must charge the sacred crystal! <strong>Press and HOLD</strong> the glowing Sunstone. Keep holding steady — do not let go until the celestial star bell chimes!
              </p>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    playAudio('whoosh')
                    setChargeTrialIndex(0)
                    setChargeProgress(0)
                    setChargeStatusText('idle')
                    setStage('situational_game')
                  }}
                  className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-10 py-3.5 text-base font-bold text-white shadow-lg hover:scale-105 transition-all"
                >
                  Enter Sunstone Chamber (3 Charges) →
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
                Charge {chargeTrialIndex + 1} of {CHARGE_TRIALS.length} • {CHARGE_TRIALS[chargeTrialIndex].title}
              </span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Patience & Steady Hold
              </span>
            </div>

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
                  ★ Celestial Chime! {CHARGE_TRIALS[chargeTrialIndex].rewardText}
                </div>
              )}
              {chargeStatusText === 'idle' && (
                <p className="text-xs sm:text-sm font-semibold text-slate-600">
                  Touch and hold your finger or mouse on the Sunstone. Do not release until the bell rings!
                </p>
              )}
            </div>
          </div>
        )}

        {/* 10. LOADING AGENTIC EVALUATION */}
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
              <div className="mb-4 flex justify-center"><ClinicianReportButton quest="adhd" nickname={a.childName} age={a.childAge} generatedOn={a.clinicalReport?.generatedOn} rows={a.clinicalReport?.indices ?? []} clinicianQuestions={a.clinicalReport?.questions ?? []} /></div>
            ) })()}
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
