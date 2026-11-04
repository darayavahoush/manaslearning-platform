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

function AstralChevronSvg({direction, isCenter, className = 'w-10 h-10'}: {direction: 'left' | 'right' | 'neutral'; isCenter: boolean; className?: string}) {
  if (direction === 'neutral') {
    return (
      <div className="w-10 h-10 flex items-center justify-center text-slate-400 font-bold text-xl select-none">
        •
      </div>
    )
  }
  const isLeft = direction === 'left'
  return (
    <div className={`relative flex items-center justify-center ${isCenter ? 'scale-125' : 'opacity-70'}`}>
      {isCenter && <span className="absolute -inset-2 rounded-xl bg-amber-400/20 blur-md animate-pulse"/>}
      <svg
        viewBox="0 0 48 48"
        className={`${className} transition-transform ${isLeft ? '' : 'rotate-180'}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 32 8 L 16 24 L 32 40"
          stroke={isCenter ? '#F59E0B' : '#60A5FA'}
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

function __McInner() {
  const [stage, setStage] = useState<'welcome' | 'avatar' | 'cpt_story' | 'cpt_game' | 'flanker_story' | 'flanker_game' | 'memory_story' | 'memory_game' | 'situational_story' | 'situational_game' | 'trials' | 'agent_eval' | 'celebration'>('welcome')

  // Child Fantasy Persona
  const [heroName, setHeroName] = useState('')
  const [heroAge, setHeroAge] = useState(8)
  const [guildClass, setGuildClass] = useState('Canopy Sky Ranger')
  const [companion] = useState('Milo the Wise Owl')

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
  const [flankerCongruentTimes, setFlankerCongruentTimes] = useState<number[]>([])
  const [flankerIncongruentTimes, setFlankerIncongruentTimes] = useState<number[]>([])
  const [currentFlanker, setCurrentFlanker] = useState<{centerDir: 'left' | 'right'; flankerDir: 'left' | 'right' | 'neutral'; isCongruent: boolean} | null>(null)
  const flankerStartRef = useRef<number>(0)

  // Astrolabe Memory Matrix State
  const [memoryLevel, setMemoryLevel] = useState(1)
  const [memorySequence, setMemorySequence] = useState<number[]>([])
  const [memoryUserSequence, setMemoryUserSequence] = useState<number[]>([])
  const [memoryLitCell, setMemoryLitCell] = useState<number | null>(null)
  const [memoryPhase, setMemoryPhase] = useState<'showing' | 'input' | 'feedback'>('showing')
  const [memoryMaxSpan, setMemoryMaxSpan] = useState(3)

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

  // CPT-3 Trial Loop with Inter-Stimulus Jitter (900ms - 2100ms)
  useEffect(() => {
    if (stage !== 'cpt_game') return

    if (cptTrialIndex >= CPT_TOTAL_TRIALS) {
      playAudio('fanfare')
      setStage('flanker_story')
      return
    }

    cptRespondedRef.current = false
    const isTarget = Math.random() > 0.28
    const stim = isTarget ? 'target' : 'distractor'

    // Jittered inter-stimulus interval to test true endogenous vigilance
    const jitteredWait = [850, 1200, 1600, 2050][Math.floor(Math.random() * 4)]

    const waitTimer = setTimeout(() => {
      setCptStimulus(stim)
      setCptActive(true)
      cptStartRef.current = performance.now()

      // Adaptive stimulus display duration
      const displayDuration = heroAge <= 7 ? 680 : heroAge <= 11 ? 540 : 440

      const displayTimer = setTimeout(() => {
        if (!cptRespondedRef.current && stim === 'target') {
          setCptOmissions((o) => o + 1)
        }
        setCptStimulus(null)
        setCptActive(false)

        const nextTimer = setTimeout(() => {
          setCptTrialIndex((i) => i + 1)
        }, 340)
        return () => clearTimeout(nextTimer)
      }, displayDuration)

      return () => clearTimeout(displayTimer)
    }, jitteredWait)

    return () => clearTimeout(waitTimer)
  }, [stage, cptTrialIndex, heroAge])

  function handleCptTap() {
    if (!cptActive || cptRespondedRef.current) return
    cptRespondedRef.current = true
    const elapsed = Math.round(performance.now() - cptStartRef.current)
    setCptLastRt(elapsed)

    if (cptStimulus === 'target') {
      playAudio('hit')
      setCptResponseTimes((prev) => [...prev, elapsed])
    } else if (cptStimulus === 'distractor') {
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

    const dirs: ('left' | 'right')[] = ['left', 'right']
    const center = dirs[Math.floor(Math.random() * 2)]
    const isCongruent = Math.random() > 0.45
    const flanker = isCongruent ? center : center === 'left' ? 'right' : 'left'

    setCurrentFlanker({centerDir: center, flankerDir: flanker, isCongruent})
    flankerStartRef.current = performance.now()
  }, [stage, flankerTrialIndex])

  function handleFlankerAnswer(dir: 'left' | 'right') {
    if (!currentFlanker) return
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

    const span = Math.min(6, memoryLevel + 2)
    const seq: number[] = []
    while (seq.length < span) {
      const cell = Math.floor(Math.random() * 9)
      if (seq[seq.length - 1] !== cell) seq.push(cell)
    }
    setMemorySequence(seq)
    setMemoryUserSequence([])
    setMemoryPhase('showing')

    seq.forEach((cell, idx) => {
      setTimeout(() => {
        setMemoryLitCell(cell)
        playAudio('star')
        setTimeout(() => setMemoryLitCell(null), 360)
      }, 500 + idx * 520)
    })

    const timer = setTimeout(() => {
      setMemoryPhase('input')
    }, 500 + seq.length * 520)

    return () => clearTimeout(timer)
  }, [stage, memoryLevel])

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
    chargeStartRef.current = Date.now()
    playAudio('whoosh')

    const target = CHARGE_TRIALS[chargeTrialIndex].targetMs

    chargeIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - chargeStartRef.current
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

    const elapsed = Date.now() - chargeStartRef.current
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
        chargeTrials: CHARGE_TRIALS.length
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
    <main data-no-listen="true" className="relative min-h-screen bg-[#0B132B] py-8 px-4 font-poppins text-[#1F2937] overflow-x-hidden selection:bg-amber-400 selection:text-amber-950">
      {/* Immersive Fantasy Sky Citadel Celestial Backdrop */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <QuestStyles />
        <Fireflies color="#FDE68A" />
        {/* Full-bleed citadel illustration with ambient atmospheric blur */}
        <img
          src="/decor/itw/quest-sky-citadel-banner.webp"
          alt="Sky Citadel Panorama"
          className="w-full h-full object-cover object-center opacity-30 filter blur-[2px] scale-105"
        />
        {/* Enchanted celestial overlays & radial starlight glows */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B132B]/75 via-[#1C2541]/70 to-[#0B132B]/90" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[55rem] h-[30rem] rounded-full bg-gradient-to-b from-amber-400/20 via-orange-500/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -left-32 w-96 h-96 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -right-32 w-96 h-96 rounded-full bg-amber-300/15 blur-3xl pointer-events-none" />
        {/* Floating starlight constellation specks */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#FDE68A_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      {notice && <div role="alert" className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-xl">{notice} <button type="button" className="ml-3 underline" onClick={() => setNotice('')}>Dismiss</button></div>}
      <AmbientToggle mood="citadel" />
      <div key={stage} className="mx-auto max-w-4xl relative z-10 qd-stage">
        {/* Navigation & Realm Indicator */}
        <div className="mb-6 flex items-center justify-between text-xs">
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
                    The Celestial Sunbird & The Shadow Duskmoth
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <p className="text-xs md:text-sm text-[#475569] leading-relaxed mb-6">
                Through the high observatory lens, rare celestial creatures swoop past the canopy clouds at unexpected moments. Milo the Owl advises: <em>"Keep your eyes locked on the circular lens! React swiftly, but do not jump early."</em>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <div className="w-16 h-16 shrink-0 rounded-2xl bg-white border border-amber-300 flex items-center justify-center shadow-sm overflow-hidden p-1">
                    <img src="/decor/itw/quest-sunbird-target.webp" alt="Celestial Sunbird" className="h-full w-full object-contain" />
                  </div>
                  <div>
                    <strong className="text-xs text-[#92400E] block font-bold">When the Golden Sunbird appears:</strong>
                    <span className="text-xs text-[#78350F]">Tap the screen or press <strong>SPACEBAR</strong> as <strong>FAST</strong> as lightning!</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-rose-50 border border-rose-200">
                  <div className="w-16 h-16 shrink-0 rounded-2xl bg-white border border-rose-300 flex items-center justify-center shadow-sm">
                    <VelvetDuskmothSvg className="w-12 h-12"/>
                  </div>
                  <div>
                    <strong className="text-xs text-[#991B1B] block font-bold">When the Velvet Duskmoth flutters by:</strong>
                    <span className="text-xs text-[#7F1D1D]"><strong>FREEZE! Stay completely still!</strong> Do not touch any keys!</span>
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
                    setStage('cpt_game')
                  }}
                  className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-10 py-3.5 text-base font-bold text-white shadow-lg hover:scale-105 transition-all"
                >
                  Peer Through Observatory Lens (20 Sightings) →
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
              onClick={handleCptTap}
              className="relative mx-auto my-6 flex h-72 w-full max-w-sm cursor-pointer items-center justify-center rounded-full border-8 border-amber-300/80 bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0A0F1D] shadow-[0_0_50px_rgba(245,158,11,0.25)] transition-all hover:border-amber-400 active:scale-95 overflow-hidden"
            >
              {cptStimulus === 'target' && (
                <div className="flex flex-col items-center animate-bounce">
                  <img src="/decor/itw/quest-sunbird-target.webp" alt="Target" className="w-32 h-32 object-contain filter drop-shadow-[0_0_15px_rgba(245,158,11,0.7)]" />
                  <span className="mt-2 text-xs font-black tracking-wider text-amber-950 uppercase bg-amber-300 px-3.5 py-1 rounded-full shadow-lg border border-amber-400">
                    ★ TAP NOW / SPACEBAR ★
                  </span>
                </div>
              )}
              {cptStimulus === 'distractor' && (
                <div className="flex flex-col items-center animate-pulse">
                  <VelvetDuskmothSvg className="w-32 h-32 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]"/>
                  <span className="mt-2 text-xs font-black tracking-wider text-white uppercase bg-rose-600 px-3.5 py-1 rounded-full shadow-lg border border-rose-400">
                    FREEZE! DO NOT TAP!
                  </span>
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
              onClick={handleCptTap}
              className="w-full max-w-sm rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-4 text-base font-bold text-white shadow-lg active:scale-95 transition-all"
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

            <div className="my-10 flex items-center justify-center gap-3 md:gap-6 p-8 rounded-3xl bg-[#0F172A] shadow-inner">
              <AstralChevronSvg direction={currentFlanker.flankerDir} isCenter={false} />
              <AstralChevronSvg direction={currentFlanker.flankerDir} isCenter={false} />
              <AstralChevronSvg direction={currentFlanker.centerDir} isCenter={true} />
              <AstralChevronSvg direction={currentFlanker.flankerDir} isCenter={false} />
              <AstralChevronSvg direction={currentFlanker.flankerDir} isCenter={false} />
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <button
                type="button"
                onClick={() => handleFlankerAnswer('left')}
                className="rounded-2xl border-2 border-sky-500 bg-sky-50 hover:bg-sky-500 hover:text-white py-4 text-base font-bold text-sky-700 shadow-md transition-all active:scale-95"
              >
                ← Steer Left
              </button>
              <button
                type="button"
                onClick={() => handleFlankerAnswer('right')}
                className="rounded-2xl border-2 border-sky-500 bg-sky-50 hover:bg-sky-500 hover:text-white py-4 text-base font-bold text-sky-700 shadow-md transition-all active:scale-95"
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
                Level {memoryLevel} of 3 • Constellation Span: {memoryLevel + 2}
              </span>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                {memoryPhase === 'showing' ? 'Watch Pattern...' : 'Your Turn to Harmonize!'}
              </span>
            </div>

            <div className="mx-auto my-6 grid w-72 h-72 grid-cols-3 gap-3 rounded-3xl bg-[#0F172A] p-4 shadow-2xl">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => {
                const isLit = memoryLitCell === idx
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={memoryPhase !== 'input'}
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
