'use client'
import {useState, useEffect, useRef} from 'react'
import Link from 'next/link'

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

// Custom Vector Art: Golden Celestial Sunbird (Target)
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

// Custom Vector Art: Shadow Duskmoth (Inhibitory Distractor)
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

// Astral Starlight Chevrons (Flanker Task)
function AstralChevronSvg({direction, isCenter, className = 'w-10 h-10'}: {direction: 'left' | 'right'; isCenter: boolean; className?: string}) {
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

// Starlight Node (Astrolabe Memory)
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
        d="M 30 10 L 33 25 L 48 28 L 34 32 L 30 48 L 26 32 L 12 28 L 27 25 Z"
        fill={isLit ? '#FBBF24' : '#334155'}
        stroke={isLit ? '#FEF08A' : '#475569'}
        strokeWidth="1.5"
      />
      <circle cx="30" cy="28.5" r={isLit ? 3.5 : 2} fill={isLit ? '#FFFFFF' : '#64748B'}/>
    </svg>
  )
}

// Fantasy Trial Questions (Child-Facing)
const FANTASY_TRIAL_QUESTIONS = [
  {
    id: 'k1',
    title: 'The Rocket Idea Engine',
    desc: 'When an exciting new quest or invention pops into your mind, does it feel like a rocket taking off at turbo speed?',
    icon: '🚀'
  },
  {
    id: 'k2',
    title: 'The Happy Wiggle Spark',
    desc: 'Do your hands, feet, or body like wiggling and dancing while you think, listen to stories, or do your homework?',
    icon: '⚡'
  },
  {
    id: 'k3',
    title: 'The Deep Daydream Portal',
    desc: 'Do you ever find yourself lost in your own magical adventure world, where someone has to call your name twice to wake you?',
    icon: '🌌'
  },
  {
    id: 'k4',
    title: 'The Lightning Answer Flash',
    desc: 'When you know the secret answer to a puzzle, is it super tough to wait because your brain wants to blurt it right out?',
    icon: '✨'
  },
  {
    id: 'k5',
    title: 'The Disappearing Artifacts',
    desc: 'Do pencils, erasers, books, or secret treasures play hide-and-seek and magically vanish right when you need them?',
    icon: '🔍'
  },
  {
    id: 'k6',
    title: 'The Endless Energy Engine',
    desc: 'Does your body ever feel like it has a high-energy dynamo that wants to climb, jump, or run even when everyone else is sitting still?',
    icon: '🏎️'
  }
]

export default function AdhdFantasyAssessmentPage() {
  const [stage, setStage] = useState<'welcome' | 'avatar' | 'cpt_story' | 'cpt_game' | 'flanker_story' | 'flanker_game' | 'memory_story' | 'memory_game' | 'trials' | 'agent_eval' | 'celebration'>('welcome')

  // Child Fantasy Persona
  const [heroName, setHeroName] = useState('')
  const [heroAge, setHeroAge] = useState(8)
  const [guildClass, setGuildClass] = useState('Canopy Sky Ranger')
  const [companion, setCompanion] = useState('Milo the Wise Owl')

  // CPT-3 State
  const [cptTrialIndex, setCptTrialIndex] = useState(0)
  const [cptStimulus, setCptStimulus] = useState<'target' | 'distractor' | null>(null)
  const [cptResponseTimes, setCptResponseTimes] = useState<number[]>([])
  const [cptLastRt, setCptLastRt] = useState<number | null>(null)
  const [cptOmissions, setCptOmissions] = useState(0)
  const [cptCommissions, setCptCommissions] = useState(0)
  const [cptActive, setCptActive] = useState(false)
  const cptStartRef = useRef<number>(0)
  const cptRespondedRef = useRef<boolean>(false)

  // Flanker State
  const [flankerTrialIndex, setFlankerTrialIndex] = useState(0)
  const [flankerCongruentTimes, setFlankerCongruentTimes] = useState<number[]>([])
  const [flankerIncongruentTimes, setFlankerIncongruentTimes] = useState<number[]>([])
  const [currentFlanker, setCurrentFlanker] = useState<{targetDir: 'left' | 'right'; isCongruent: boolean} | null>(null)
  const flankerStartRef = useRef<number>(0)

  // Memory Matrix State
  const [memorySequence, setMemorySequence] = useState<number[]>([])
  const [memoryUserSequence, setMemoryUserSequence] = useState<number[]>([])
  const [memoryLevel, setMemoryLevel] = useState(1)
  const [memoryLitCell, setMemoryLitCell] = useState<number | null>(null)
  const [memoryPhase, setMemoryPhase] = useState<'showing' | 'input' | 'feedback'>('showing')
  const [memoryMaxSpan, setMemoryMaxSpan] = useState(3)

  // Trial Responses
  const [trialAnswers, setTrialAnswers] = useState<Record<string, number>>({})

  // LangGraph Agent Output
  const [agentResult, setAgentResult] = useState<any>(null)
  const [showClinicalDossier, setShowClinicalDossier] = useState(false)

  // Spacebar and Arrow Key Listeners
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

  // CPT-3 Loop (20 Trials)
  const CPT_TOTAL_TRIALS = 20
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

    const waitTimer = setTimeout(() => {
      setCptStimulus(stim)
      setCptActive(true)
      cptStartRef.current = performance.now()

      const displayTimer = setTimeout(() => {
        if (!cptRespondedRef.current && stim === 'target') {
          setCptOmissions((o) => o + 1)
        }
        setCptStimulus(null)
        setCptActive(false)

        const nextTimer = setTimeout(() => {
          setCptTrialIndex((i) => i + 1)
        }, 380)
        return () => clearTimeout(nextTimer)
      }, 700)

      return () => clearTimeout(displayTimer)
    }, 450)

    return () => clearTimeout(waitTimer)
  }, [stage, cptTrialIndex])

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

  // Flanker Loop (10 Trials)
  const FLANKER_TOTAL_TRIALS = 10
  const FLANKER_TRIALS: Array<{targetDir: 'left' | 'right'; isCongruent: boolean}> = [
    {targetDir: 'left', isCongruent: true},
    {targetDir: 'right', isCongruent: true},
    {targetDir: 'left', isCongruent: false},
    {targetDir: 'right', isCongruent: false},
    {targetDir: 'right', isCongruent: true},
    {targetDir: 'left', isCongruent: true},
    {targetDir: 'right', isCongruent: false},
    {targetDir: 'left', isCongruent: false},
    {targetDir: 'right', isCongruent: true},
    {targetDir: 'right', isCongruent: false},
  ]

  useEffect(() => {
    if (stage !== 'flanker_game') return

    if (flankerTrialIndex >= FLANKER_TOTAL_TRIALS) {
      playAudio('fanfare')
      setStage('memory_story')
      return
    }

    setCurrentFlanker(FLANKER_TRIALS[flankerTrialIndex])
    flankerStartRef.current = performance.now()
  }, [stage, flankerTrialIndex])

  function handleFlankerAnswer(dir: 'left' | 'right') {
    if (!currentFlanker) return
    const elapsed = Math.round(performance.now() - flankerStartRef.current)
    if (dir === currentFlanker.targetDir) {
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

  // Memory Matrix (3 Levels)
  useEffect(() => {
    if (stage !== 'memory_game') return

    const span = memoryLevel + 2
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
        setTimeout(() => setMemoryLitCell(null), 380)
      }, 600 + idx * 550)
    })

    const timer = setTimeout(() => {
      setMemoryPhase('input')
    }, 600 + seq.length * 550)

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
          setStage('trials')
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
          setStage('trials')
        }
      }, 800)
    }
  }

  // Submit via LangGraph Multi-Node Agent
  async function submitLangGraphAgent() {
    setStage('agent_eval')

    const hrt = cptResponseTimes.length > 0
      ? Math.round(cptResponseTimes.reduce((a, b) => a + b, 0) / cptResponseTimes.length)
      : 480

    const rtv = cptResponseTimes.length > 1
      ? Math.round(Math.sqrt(cptResponseTimes.map(x => Math.pow(x - hrt, 2)).reduce((a, b) => a + b) / cptResponseTimes.length))
      : 72

    const avgCong = flankerCongruentTimes.length > 0 ? flankerCongruentTimes.reduce((a, b) => a + b, 0) / flankerCongruentTimes.length : 360
    const avgIncong = flankerIncongruentTimes.length > 0 ? flankerIncongruentTimes.reduce((a, b) => a + b, 0) / flankerIncongruentTimes.length : 430
    const flankerCost = Math.max(15, Math.round(avgIncong - avgCong))

    const payload = {
      assessmentType: 'adhd',
      childName: heroName || 'Sky Ranger',
      childAge: heroAge,
      guildClass,
      companion,
      telemetry: {
        hrtMs: hrt,
        rtvMs: rtv,
        omissions: cptOmissions,
        commissions: cptCommissions,
        flankerCostMs: flankerCost,
        workingMemorySpan: memoryMaxSpan,
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
      setStage('celebration')
      playAudio('fanfare')
    } catch (err) {
      console.error(err)
      alert('The Sky Citadel Guild is reconnecting... please try again!')
      setStage('trials')
    }
  }

  return (
    <main data-no-listen="true" className="min-h-screen bg-[#FFFDF8] py-8 px-4 font-poppins text-[#1F2937]">
      <div className="mx-auto max-w-4xl">
        {/* Navigation & Realm Indicator */}
        <div className="mb-6 flex items-center justify-between text-xs text-[#78716C]">
          <Link href="/assessments" prefetch={false} className="font-bold text-[#05B076] hover:underline flex items-center gap-1.5">
            ← Assessment Directory
          </Link>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-500/15 px-3 py-1 font-bold text-amber-900 border border-amber-300">
              Paid Clinical Battery • CPT-3 Standard
            </span>
          </div>
        </div>

        {/* 1. WELCOME SCREEN: FANTASY HERO REALM */}
        {stage === 'welcome' && (
          <div className="rounded-3xl border-2 border-[#FDE68A] bg-white overflow-hidden shadow-2xl">
            {/* Storybook Hero Panorama */}
            <div className="relative h-64 md:h-80 w-full overflow-hidden bg-gradient-to-tr from-[#FEF3C7] to-[#DCFCE7]">
              <img
                src="/decor/itw/itw-adhd-run-brief.webp"
                alt="Sky Citadel of the Sunbird"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent flex items-end p-6 md:p-8">
                <div>
                  <span className="inline-block rounded-full bg-amber-400 text-slate-900 px-3.5 py-1 text-xs font-bold uppercase tracking-wider mb-2 shadow">
                    Fantasy Adventure & Clinical Battery
                  </span>
                  <h1 className="font-patrick text-3xl md:text-5xl text-white font-bold drop-shadow-md">
                    Chronicles of the Sunbird: <span className="text-amber-300">The Sky Citadel Quest</span>
                  </h1>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-10">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 mb-8">
                <img
                  src="/decor/itw/milo-owl.webp"
                  alt="Milo Owl"
                  className="w-16 h-16 rounded-full border-2 border-amber-400 shadow-sm shrink-0 object-cover"
                />
                <div className="text-xs text-[#334155] leading-relaxed">
                  <strong className="text-amber-800 text-sm block font-poppins">Hoot hoot! Greetings, brave traveler.</strong>
                  The Celestial Sunbird has summoned you to the floating Sky Citadel of Aethelgard. Test your lightning reflexes, chart the cosmic starways, and unlock your unique mental superpowers!
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] p-4 text-center">
                  <div className="text-2xl mb-1">🦜</div>
                  <strong className="text-xs text-[#065F46] block font-bold">Chapter 1: The Watchtower</strong>
                  <span className="text-[11px] text-[#047857]">Conners CPT-3 Continuous Focus</span>
                </div>
                <div className="rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] p-4 text-center">
                  <div className="text-2xl mb-1">🧭</div>
                  <strong className="text-xs text-[#1E40AF] block font-bold">Chapter 2: Cosmic Drift</strong>
                  <span className="text-[11px] text-[#2563EB]">Eriksen Flanker Conflict Filtering</span>
                </div>
                <div className="rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] p-4 text-center">
                  <div className="text-2xl mb-1">✨</div>
                  <strong className="text-xs text-[#92400E] block font-bold">Chapter 3: Star Astrolabe</strong>
                  <span className="text-[11px] text-[#B45309]">Spatial Working Memory Matrix</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#F1F5F9]">
                <div className="text-xs text-[#64748B]">
                  Includes <strong>Certified Neuropsychological Dossier & IEP Blueprint</strong> for Parents
                </div>
                <button
                  type="button"
                  onClick={() => { playAudio('chime'); setStage('avatar') }}
                  className="w-full sm:w-auto rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                >
                  Enter the Sky Citadel →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. CHOOSE HERO NAME & GUILD CLASS */}
        {stage === 'avatar' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-6 md:p-10 shadow-xl">
            <div className="text-center max-w-lg mx-auto mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Sky Citadel Guild Registration</span>
              <h2 className="font-patrick text-3xl md:text-4xl text-[#0F172A] mt-1">Choose Your Explorer Identity</h2>
              <p className="text-xs text-[#64748B] mt-2">Every hero who ascends the citadel is recognized by their guild name and class!</p>
            </div>

            <div className="max-w-md mx-auto space-y-6 mb-8">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-2">My Hero Codename</label>
                <input
                  type="text"
                  value={heroName}
                  onChange={(e) => setHeroName(e.target.value)}
                  placeholder="e.g. Captain Aarav, Star Voyager Diya"
                  className="w-full rounded-2xl border-2 border-[#CBD5E1] p-3.5 text-sm font-semibold focus:border-amber-500 focus:outline-none bg-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-2">Choose Your Guild Class</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {name: 'Canopy Sky Ranger', icon: '🏹', desc: 'Eagle Eyes'},
                    {name: 'Astral Spellcaster', icon: '🔮', desc: 'Star Magic'},
                    {name: 'Sunfire Knight', icon: '🛡️', desc: 'Calm Courage'},
                  ].map((cls) => (
                    <button
                      key={cls.name}
                      type="button"
                      onClick={() => { playAudio('tap'); setGuildClass(cls.name) }}
                      className={`p-3 rounded-2xl border-2 text-center transition-all ${
                        guildClass === cls.name
                          ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-md'
                          : 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1]'
                      }`}
                    >
                      <div className="text-2xl mb-1">{cls.icon}</div>
                      <strong className="block text-[11px] font-bold leading-tight">{cls.name}</strong>
                      <span className="text-[10px] text-[#94A3B8]">{cls.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-2">Explorer Age Bracket</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {age: 6, label: 'Ages 5–7', title: 'Novice Scout'},
                    {age: 9, label: 'Ages 8–11', title: 'Sky Voyager'},
                    {age: 13, label: 'Ages 12+', title: 'Master Navigator'},
                  ].map((tier) => (
                    <button
                      key={tier.age}
                      type="button"
                      onClick={() => { playAudio('tap'); setHeroAge(tier.age) }}
                      className={`rounded-2xl p-3 text-center border-2 transition-all ${
                        heroAge === tier.age
                          ? 'border-[#05B076] bg-[#ECFDF5] text-[#065F46] shadow-md'
                          : 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1]'
                      }`}
                    >
                      <strong className="block text-xs font-bold">{tier.title}</strong>
                      <span className="text-[10px]">{tier.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#F1F5F9]">
              <button
                type="button"
                onClick={() => setStage('welcome')}
                className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={!heroName.trim()}
                onClick={() => { playAudio('chime'); setStage('cpt_story') }}
                className="rounded-full bg-amber-500 px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-amber-600 disabled:opacity-50 transition-all"
              >
                Begin Chapter 1: The Watchtower →
              </button>
            </div>
          </div>
        )}

        {/* 3. CHAPTER 1 STORY: THE WATCHTOWER */}
        {stage === 'cpt_story' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white overflow-hidden shadow-2xl">
            <div className="relative h-60 md:h-72 w-full overflow-hidden bg-gradient-to-b from-[#FEF3C7] to-[#DCFCE7]">
              <img
                src="/decor/itw/adhd-workspace-scene.webp"
                alt="Watchtower of Aethelgard"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex items-end p-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-black/40 px-3 py-1 rounded-full">
                    Chapter 1: The Watchtower of Aethelgard
                  </span>
                  <h2 className="font-patrick text-3xl md:text-4xl text-white font-bold mt-1">
                    The Sacred Sunbird & The Shadow Moth
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <p className="text-xs md:text-sm text-[#475569] leading-relaxed mb-6">
                Through the enchanted observatory lens, rare celestial creatures swoop past the canopy. Milo hoots: <em>"Keep your gaze locked on the center!"</em>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <div className="w-16 h-16 shrink-0 rounded-2xl bg-white border border-amber-300 flex items-center justify-center shadow-sm">
                    <GoldenSunbirdSvg className="w-12 h-12"/>
                  </div>
                  <div>
                    <strong className="text-xs text-[#92400E] block font-bold">When the Golden Sunbird appears:</strong>
                    <span className="text-xs text-[#78350F]">Tap the lens or press <strong>SPACEBAR</strong> as <strong>FAST</strong> as lightning!</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-rose-50 border border-rose-200">
                  <div className="w-16 h-16 shrink-0 rounded-2xl bg-white border border-rose-300 flex items-center justify-center shadow-sm">
                    <VelvetDuskmothSvg className="w-12 h-12"/>
                  </div>
                  <div>
                    <strong className="text-xs text-[#991B1B] block font-bold">When the Shadow Duskmoth flutters by:</strong>
                    <span className="text-xs text-[#7F1D1D]"><strong>FREEZE! Stay completely still!</strong> Do not tap!</span>
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

        {/* 4. CHAPTER 1 GAMEPLAY: CPT-3 */}
        {stage === 'cpt_game' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-6 md:p-10 shadow-2xl text-center select-none">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] bg-[#F1F5F9] px-3.5 py-1 rounded-full">
                Sighting {cptTrialIndex + 1} of {CPT_TOTAL_TRIALS}
              </span>
              <div className="flex items-center gap-2">
                {cptLastRt && (
                  <span className="text-xs font-bold text-[#05B076] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    ⚡ {cptLastRt} ms Reflex
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
              className="relative mx-auto my-6 flex h-72 w-full max-w-sm cursor-pointer items-center justify-center rounded-full border-8 border-amber-100 bg-gradient-to-b from-[#FEFCE8] to-[#FFFDF8] shadow-2xl transition-all hover:border-amber-200 active:scale-95 overflow-hidden"
            >
              {cptStimulus === 'target' && (
                <div className="flex flex-col items-center animate-bounce">
                  <GoldenSunbirdSvg className="w-32 h-32"/>
                  <span className="mt-2 text-xs font-black tracking-wider text-amber-700 uppercase bg-white/95 px-3 py-1 rounded-full shadow-sm">
                    TAP NOW! / SPACEBAR
                  </span>
                </div>
              )}
              {cptStimulus === 'distractor' && (
                <div className="flex flex-col items-center animate-pulse">
                  <VelvetDuskmothSvg className="w-32 h-32"/>
                  <span className="mt-2 text-xs font-black tracking-wider text-[#DC2626] uppercase bg-white/95 px-3 py-1 rounded-full shadow-sm">
                    FREEZE! DO NOT TAP!
                  </span>
                </div>
              )}
              {!cptStimulus && (
                <div className="text-center text-[#94A3B8]">
                  <div className="h-16 w-16 mx-auto mb-2 rounded-full border-2 border-dashed border-amber-300 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="12" x2="16" y2="14"/>
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-amber-800">Watching the canopy vortex...</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleCptTap}
              className="w-full max-w-sm rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-4 text-base font-bold text-white shadow-lg active:scale-95 transition-all"
            >
              TAP NOW (Or Press Spacebar)
            </button>
          </div>
        )}

        {/* 5. CHAPTER 2 STORY: THE COSMIC METEOR DRIFT */}
        {stage === 'flanker_story' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white overflow-hidden shadow-2xl">
            <div className="relative h-60 md:h-72 w-full overflow-hidden bg-[#0F172A]">
              <img
                src="/decor/itw/itw-adhd-support-focus-shield.webp"
                alt="Cosmic Starfire Drift"
                className="h-full w-full object-cover object-center opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-white/10 px-3 py-1 rounded-full">
                    Chapter 2: The Starfire Meteor Drift
                  </span>
                  <h2 className="font-patrick text-3xl md:text-4xl text-white font-bold mt-1">
                    Align the Golden Star Compass
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <p className="text-xs md:text-sm text-[#475569] leading-relaxed mb-6">
                Your skyship is drifting through an astral meteor shower! Conflicting side stars will try to mislead your vessel. Milo warns: <em>"Look ONLY at the glowing center Golden Star! Which way is it pointing?"</em>
              </p>

              <div className="p-4 rounded-2xl bg-[#0F172A] text-white flex items-center justify-around mb-8">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <AstralChevronSvg direction="right" isCenter={false} className="w-5 h-5"/>
                    <AstralChevronSvg direction="right" isCenter={true} className="w-7 h-7"/>
                    <AstralChevronSvg direction="right" isCenter={false} className="w-5 h-5"/>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-bold block mt-2">Center = RIGHT → Steer Right</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <AstralChevronSvg direction="right" isCenter={false} className="w-5 h-5"/>
                    <AstralChevronSvg direction="left" isCenter={true} className="w-7 h-7"/>
                    <AstralChevronSvg direction="right" isCenter={false} className="w-5 h-5"/>
                  </div>
                  <span className="text-[11px] text-amber-400 font-bold block mt-2">Center = LEFT → Steer Left</span>
                </div>
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
                  className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-10 py-3.5 text-base font-bold text-white shadow-lg hover:scale-105 transition-all"
                >
                  Take the Helm (10 Navigations) →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. CHAPTER 2 GAMEPLAY: FLANKER */}
        {stage === 'flanker_game' && currentFlanker && (
          <div className="rounded-3xl border border-[#1E293B] bg-gradient-to-b from-[#090D16] via-[#0F172A] to-[#1E293B] p-6 md:p-10 shadow-2xl text-center select-none text-white">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] bg-[#1E293B] px-3.5 py-1 rounded-full border border-[#334155]">
                Course {flankerTrialIndex + 1} of {FLANKER_TOTAL_TRIALS}
              </span>
              <span className="text-xs font-bold text-amber-400">
                Center Golden Star = True Course
              </span>
            </div>

            <div className="my-10 flex items-center justify-center gap-3 md:gap-5 py-10 px-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <AstralChevronSvg direction={currentFlanker.isCongruent ? currentFlanker.targetDir : (currentFlanker.targetDir === 'left' ? 'right' : 'left')} isCenter={false} className="w-9 h-9 md:w-12 md:h-12"/>
              <AstralChevronSvg direction={currentFlanker.isCongruent ? currentFlanker.targetDir : (currentFlanker.targetDir === 'left' ? 'right' : 'left')} isCenter={false} className="w-9 h-9 md:w-12 md:h-12"/>

              <AstralChevronSvg direction={currentFlanker.targetDir} isCenter={true} className="w-12 h-12 md:w-16 md:h-16"/>

              <AstralChevronSvg direction={currentFlanker.isCongruent ? currentFlanker.targetDir : (currentFlanker.targetDir === 'left' ? 'right' : 'left')} isCenter={false} className="w-9 h-9 md:w-12 md:h-12"/>
              <AstralChevronSvg direction={currentFlanker.isCongruent ? currentFlanker.targetDir : (currentFlanker.targetDir === 'left' ? 'right' : 'left')} isCenter={false} className="w-9 h-9 md:w-12 md:h-12"/>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => handleFlankerAnswer('left')}
                className="rounded-2xl bg-[#1E293B] border-2 border-[#334155] p-5 shadow-lg hover:border-amber-400 hover:bg-[#334155] active:scale-95 transition-all"
              >
                <span className="text-xl font-bold text-amber-400 block">← STEER LEFT</span>
                <span className="text-[10px] text-[#94A3B8] font-mono mt-1">[ Arrow Key Left ]</span>
              </button>
              <button
                type="button"
                onClick={() => handleFlankerAnswer('right')}
                className="rounded-2xl bg-[#1E293B] border-2 border-[#334155] p-5 shadow-lg hover:border-amber-400 hover:bg-[#334155] active:scale-95 transition-all"
              >
                <span className="text-xl font-bold text-amber-400 block">STEER RIGHT →</span>
                <span className="text-[10px] text-[#94A3B8] font-mono mt-1">[ Arrow Key Right ]</span>
              </button>
            </div>
          </div>
        )}

        {/* 7. CHAPTER 3 STORY: THE ANCIENT RUNE ASTROLABE */}
        {stage === 'memory_story' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white overflow-hidden shadow-2xl">
            <div className="relative h-60 md:h-72 w-full overflow-hidden bg-gradient-to-tr from-[#FEF3C7] to-[#DCFCE7]">
              <img
                src="/decor/itw/itw-adhd-support-checklist.webp"
                alt="Ancient Rune Astrolabe"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-black/40 px-3 py-1 rounded-full">
                    Chapter 3: The Ancient Rune Astrolabe
                  </span>
                  <h2 className="font-patrick text-3xl md:text-4xl text-white font-bold mt-1">
                    Awaken the Musical Constellation
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <p className="text-xs md:text-sm text-[#475569] leading-relaxed mb-6">
                You have reached the mountaintop astrolabe! The 9 glowing rune stars chime with celestial harmony. Milo whispers: <em>"Remember the exact melody sequence and tap the star stones to rekindle the sky!"</em>
              </p>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    playAudio('whoosh')
                    setMemoryLevel(1)
                    setStage('memory_game')
                  }}
                  className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-10 py-3.5 text-base font-bold text-white shadow-lg hover:scale-105 transition-all"
                >
                  Awaken the Runes (3 Levels) →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 8. CHAPTER 3 GAMEPLAY: MEMORY MATRIX */}
        {stage === 'memory_game' && (
          <div className="rounded-3xl border border-[#1E293B] bg-gradient-to-b from-[#090D16] via-[#0F172A] to-[#1E293B] p-6 md:p-10 shadow-2xl text-center select-none text-white">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] bg-[#1E293B] px-3.5 py-1 rounded-full border border-[#334155]">
                Level {memoryLevel} of 3 • {memoryLevel + 2} Star Sequence
              </span>
              <span className="text-xs font-bold text-amber-400">
                {memoryPhase === 'showing' ? 'Listen to the star melody...' : 'Your turn! Tap the stars in order!'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3.5 max-w-xs mx-auto my-8">
              {Array.from({length: 9}).map((_, idx) => {
                const isLit = memoryLitCell === idx || memoryUserSequence.includes(idx)
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={memoryPhase !== 'input'}
                    onClick={() => handleMemoryClick(idx)}
                    className={`h-20 w-20 md:h-24 md:w-24 rounded-2xl border-2 transition-all flex items-center justify-center p-3 ${
                      isLit
                        ? 'border-amber-400 bg-amber-400/20 shadow-lg shadow-amber-400/20'
                        : 'border-[#334155] bg-[#1E293B]/70 hover:border-[#64748B]'
                    }`}
                  >
                    <StarlightNodeSvg isLit={isLit}/>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 9. CHAPTER 4: TRIAL OF THE FOUR WINDS */}
        {stage === 'trials' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-6 md:p-10 shadow-xl">
            <div className="text-center max-w-lg mx-auto mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Trial of the Four Winds</span>
              <h2 className="font-patrick text-3xl md:text-4xl text-[#0F172A] mt-1">My Daily Explorer Powers</h2>
              <p className="text-xs text-[#64748B] mt-2">
                Help Milo map your mental energy, spark, and focus rhythms!
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {FANTASY_TRIAL_QUESTIONS.map((card) => {
                const val = trialAnswers[card.id]
                return (
                  <div key={card.id} className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0 p-2 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">{card.icon}</span>
                      <div>
                        <strong className="text-xs font-bold text-[#0F172A] block">{card.title}</strong>
                        <p className="text-xs text-[#475569] leading-relaxed">{card.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      {[
                        {label: 'Rarely', score: 0},
                        {label: 'Sometimes', score: 1},
                        {label: 'A Lot!', score: 2},
                      ].map((opt) => (
                        <button
                          key={opt.score}
                          type="button"
                          onClick={() => {
                            playAudio('tap')
                            setTrialAnswers({...trialAnswers, [card.id]: opt.score})
                          }}
                          className={`rounded-xl py-2 px-3 text-xs font-semibold transition-all ${
                            val === opt.score
                              ? 'bg-amber-500 text-white shadow-md'
                              : 'bg-white text-[#64748B] border border-[#CBD5E1] hover:bg-[#F1F5F9]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end pt-4 border-t border-[#F1F5F9]">
              <button
                type="button"
                onClick={submitLangGraphAgent}
                className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-10 py-3.5 text-base font-bold text-white shadow-lg hover:scale-105 transition-all"
              >
                Synthesize My Golden Superpower Crest →
              </button>
            </div>
          </div>
        )}

        {/* 10. AGENT EVALUATION SPINNER */}
        {stage === 'agent_eval' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-12 shadow-2xl text-center">
            <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-amber-500"/>
            <h2 className="font-patrick text-3xl text-[#0F172A] mb-2">Milo & The Agentic Guild Are Synthesizing...</h2>
            <p className="text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
              Norming CPT-3 reaction times, calculating flanker conflict cost, and authoring your certified neuropsychological evaluation dossier...
            </p>
          </div>
        )}

        {/* 11. CELEBRATION CERTIFICATE & SUPERPOWERS */}
        {stage === 'celebration' && agentResult && (
          <div className="space-y-8">
            {/* Child-Facing Magical Award Certificate */}
            <div className="rounded-3xl border-4 border-amber-300 bg-gradient-to-b from-[#FEFCE8] via-white to-[#F0FDF4] p-6 md:p-10 shadow-2xl text-center relative overflow-hidden">
              <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-3xl bg-amber-100 border-2 border-amber-300 p-3 shadow-inner">
                <img
                  src="/decor/itw/itw-adhd-sticker.webp"
                  alt="Golden Sunstone Crest"
                  className="h-full w-full object-contain filter drop-shadow-md"
                />
              </div>

              <span className="text-xs font-bold uppercase tracking-widest text-amber-800 bg-amber-100 px-4 py-1.5 rounded-full inline-block mb-2 border border-amber-300">
                Official Sky Citadel Superpower Award
              </span>

              <h1 className="font-patrick text-3xl md:text-5xl text-[#0F172A] font-bold">
                Congratulations, {agentResult.childName}!
              </h1>
              <p className="font-patrick text-xl text-amber-800 mt-1">
                Conferred the Title of: <strong>{agentResult.superpowers.realmTitle}</strong>
              </p>

              {/* Milo's Personal Scroll */}
              <div className="my-6 p-5 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-sm max-w-xl mx-auto flex items-start gap-4 text-left">
                <img
                  src="/decor/itw/milo-owl.webp"
                  alt="Milo the Owl"
                  className="w-12 h-12 rounded-full border border-amber-400 object-cover shrink-0"
                />
                <p className="text-xs text-[#334155] leading-relaxed italic">
                  "{agentResult.superpowers.miloScroll}"
                </p>
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-2xl mx-auto text-left mb-8">
                {agentResult.superpowers.badges.map((b: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex items-start gap-3">
                    <span className="text-2xl p-2 rounded-xl bg-amber-50 border border-amber-200">{b.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-[#0F172A]">{b.name}</strong>
                        <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">{b.rank}</span>
                      </div>
                      <span className="text-[11px] text-[#64748B] leading-snug block mt-0.5">{b.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="pt-6 border-t border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setShowClinicalDossier(!showClinicalDossier)}
                  className="rounded-full bg-white border-2 border-[#CBD5E1] px-6 py-2.5 text-xs font-bold text-[#334155] hover:bg-[#F8FAFC] shadow-sm transition-all"
                >
                  {showClinicalDossier ? 'Hide Clinical Dossier' : 'For Grown-Ups & Teachers: View Comprehensive Diagnostic & IEP Dossier ↓'}
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-full bg-amber-500 px-8 py-2.5 text-xs font-bold text-white shadow-md hover:bg-amber-600 transition-all"
                >
                  Print / Save My Certificate (PDF)
                </button>
              </div>
            </div>

            {/* ADULT CLINICAL EVALUATION DOSSIER (PAID-GRADE QUALITY) */}
            {showClinicalDossier && (
              <div className="rounded-3xl border-2 border-slate-300 bg-white p-6 md:p-10 shadow-2xl">
                {/* Official Clinical Header */}
                <div className="border-b-2 border-slate-200 pb-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#05B076] block mb-1">
                      Manas Cognitive Neurodevelopmental Clinic • Official Dossier
                    </span>
                    <h2 className="font-patrick text-3xl text-[#0F172A]">
                      Pediatric Continuous Performance & Executive Function Evaluation
                    </h2>
                    <div className="text-xs font-mono text-[#64748B] mt-1">
                      Document ID: {agentResult.clinicalReport.documentId} • Evaluated: {agentResult.clinicalReport.evaluationTimestamp}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="self-start md:self-auto rounded-xl border border-slate-300 bg-[#F8FAFC] px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-sm flex items-center gap-2"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/>
                    </svg>
                    Print Clinical PDF
                  </button>
                </div>

                {/* Participant Metadata Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] mb-8 text-xs">
                  <div>
                    <span className="text-[#64748B] block">Participant</span>
                    <strong className="text-[#0F172A] text-sm">{agentResult.childName}</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">Chronological Age</span>
                    <strong className="text-[#0F172A] text-sm">{agentResult.childAge} Years Old</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">Diagnostic Standard</span>
                    <strong className="text-[#05B076] text-sm">AAP & Conners CPT-3</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">Confidence Level</span>
                    <strong className="text-[#0F172A] text-sm">95% Confidence Interval</strong>
                  </div>
                </div>

                {/* Primary Diagnostic Impression */}
                <div className="p-6 rounded-2xl bg-[#ECFDF5] border-2 border-[#A7F3D0] mb-8">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#065F46] block mb-1">
                    Clinical Impression & Attentional Stratification
                  </span>
                  <div className="text-2xl font-bold text-[#065F46] mb-1 font-poppins">
                    {agentResult.clinicalReport.classification}
                  </div>
                  <span className="text-xs font-bold text-[#047857] block mb-3">
                    {agentResult.clinicalReport.supportLevel}
                  </span>
                  <p className="text-xs text-[#334155] leading-relaxed">
                    {agentResult.clinicalReport.clinicalSummary}
                  </p>
                </div>

                {/* Psychometric Telemetry Table */}
                <div className="mb-8">
                  <h3 className="font-patrick text-2xl text-[#0F172A] mb-3">Normative Psychometric Indices (Conners CPT-3 Benchmarked)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-[#E2E8F0] rounded-xl overflow-hidden">
                      <thead className="bg-[#F8FAFC] text-[#475569] font-bold border-b border-[#E2E8F0]">
                        <tr>
                          <th className="p-3">Psychometric Dimension</th>
                          <th className="p-3">Score</th>
                          <th className="p-3">Norm Benchmark</th>
                          <th className="p-3">Percentile Rank</th>
                          <th className="p-3">Clinical Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {agentResult.clinicalReport.indices.map((idx: any, i: number) => (
                          <tr key={i} className="hover:bg-[#F8FAFC]">
                            <td className="p-3">
                              <strong className="text-[#0F172A] block">{idx.name}</strong>
                              <span className="text-[10px] text-[#64748B]">{idx.clinicalNote}</span>
                            </td>
                            <td className="p-3 font-mono font-bold text-sm text-[#05B076]">{idx.score}</td>
                            <td className="p-3 text-[#64748B]">{idx.benchmark}</td>
                            <td className="p-3 font-bold text-slate-700">{idx.percentile}</td>
                            <td className="p-3">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {idx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Comprehensive 4-Part IEP Accommodations Blueprint */}
                <div className="mb-8 space-y-6">
                  <h3 className="font-patrick text-2xl text-[#0F172A]">Individualized Education Plan (IEP & 504) Pedagogical Accommodations</h3>

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

                {/* Consultation Handoff */}
                <div className="pt-6 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
                  <Link
                    href="/consult"
                    className="rounded-full bg-[#05B076] px-8 py-3 text-xs font-bold text-white shadow-md hover:bg-[#049A68] transition-all"
                  >
                    Schedule 1-on-1 Clinical Review with Manas Pediatric Specialist →
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowClinicalDossier(false)}
                    className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
                  >
                    Close Dossier
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
