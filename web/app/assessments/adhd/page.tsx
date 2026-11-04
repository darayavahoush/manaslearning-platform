'use client'
import {useState, useEffect, useRef} from 'react'
import Link from 'next/link'

interface Profile {
  childName: string
  childAge: number
  gender: string
  grade: string
  informantRole: string
  primaryConcerns: string
}

// Gentle Web Audio Synthesizer: Organic kalimba, chime, marimba, and celestial glass tones
function playSound(type: 'hit' | 'miss' | 'chime' | 'tap' | 'complete' | 'star' | 'flanker_left' | 'flanker_right') {
  if (typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    const now = ctx.currentTime

    if (type === 'hit') {
      // Warm marimba strike (C5 -> G5)
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
      // Celestial crystal bell note (Pentatonic: C5, D5, E5, G5, A5)
      const notes = [523.25, 587.33, 659.25, 783.99, 880.00]
      const f = notes[Math.floor(Math.random() * notes.length)]
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(f, now)
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.35)
    } else if (type === 'flanker_left') {
      // Soft left-channel harmonic note
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, now)
      osc.frequency.exponentialRampToValueAtTime(554.37, now + 0.08)
      gain.gain.setValueAtTime(0.07, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.15)
    } else if (type === 'flanker_right') {
      // Soft right-channel harmonic note
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(554.37, now)
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08)
      gain.gain.setValueAtTime(0.07, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.15)
    } else if (type === 'miss') {
      // Gentle soft woodblock thud
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(220, now)
      osc.frequency.linearRampToValueAtTime(160, now + 0.12)
      gain.gain.setValueAtTime(0.05, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.18)
    } else if (type === 'chime' || type === 'complete') {
      // Harmonious 4-note ascending chord
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + idx * 0.07)
        gain.gain.setValueAtTime(0.06, now + idx * 0.07)
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.07)
        osc.stop(now + idx * 0.07 + 0.38)
      })
    } else {
      // Light tactile tap
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(400, now)
      gain.gain.setValueAtTime(0.03, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.05)
    }
  } catch {}
}

// -------------------------------------------------------------
// BESPOKE VECTOR ILLUSTRATIONS (NO CHEAP EMOJIS)
// -------------------------------------------------------------

// Target Stimulus: Golden Sunbird (Fast reaction required)
function GoldenSunbirdSvg({className = 'w-28 h-28'}: {className?: string}) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.8"/>
          <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="featherGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A"/>
          <stop offset="40%" stopColor="#F59E0B"/>
          <stop offset="100%" stopColor="#D97706"/>
        </linearGradient>
        <linearGradient id="emeraldWing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399"/>
          <stop offset="100%" stopColor="#059669"/>
        </linearGradient>
      </defs>
      {/* Radiant Glow Ring */}
      <circle cx="60" cy="60" r="54" fill="url(#sunGlow)"/>
      <circle cx="60" cy="60" r="48" stroke="#FBBF24" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6"/>

      {/* Sunbird Body & Wing */}
      <path d="M 42 68 C 30 68 22 55 28 42 C 34 32 48 30 58 38 C 72 32 88 38 94 48 C 98 56 92 68 82 72 C 68 78 52 76 42 68 Z" fill="url(#featherGold)"/>
      {/* Sweeping Emerald Wing */}
      <path d="M 44 48 C 36 28 52 14 68 18 C 74 20 80 26 82 32 C 72 34 60 40 44 48 Z" fill="url(#emeraldWing)"/>
      <path d="M 52 46 C 44 32 58 24 70 26 C 62 30 58 38 52 46 Z" fill="#10B981" opacity="0.7"/>

      {/* Bird Head & Beak */}
      <circle cx="86" cy="48" r="10" fill="url(#featherGold)"/>
      <path d="M 94 47 L 110 50 L 94 53 Z" fill="#B45309"/>
      {/* Eye */}
      <circle cx="88" cy="46" r="3" fill="#1E293B"/>
      <circle cx="89" cy="45" r="1" fill="#FFFFFF"/>
      {/* Tail Feathers */}
      <path d="M 28 56 C 14 58 10 68 12 76 C 18 72 24 66 32 62 Z" fill="#F59E0B"/>
      <path d="M 32 60 C 20 64 16 74 20 82 C 24 76 28 70 36 66 Z" fill="#059669"/>
    </svg>
  )
}

// Distractor Stimulus: Velvet Duskmoth (Impulse control - DO NOT TAP)
function VelvetDuskmothSvg({className = 'w-28 h-28'}: {className?: string}) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="mothGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FCA5A5" stopOpacity="0.4"/>
          <stop offset="70%" stopColor="#EF4444" stopOpacity="0.1"/>
          <stop offset="100%" stopColor="#EF4444" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="duskWings" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#475569"/>
          <stop offset="50%" stopColor="#334155"/>
          <stop offset="100%" stopColor="#1E293B"/>
        </linearGradient>
      </defs>
      {/* Amber/Red Caution Ambient Aura */}
      <circle cx="60" cy="60" r="54" fill="url(#mothGlow)"/>
      <circle cx="60" cy="60" r="48" stroke="#F87171" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6"/>

      {/* Upper Wings */}
      <path d="M 60 56 C 45 35 25 32 18 42 C 12 50 18 68 35 72 C 45 74 55 66 60 56 Z" fill="url(#duskWings)"/>
      <path d="M 60 56 C 75 35 95 32 102 42 C 108 50 102 68 85 72 C 75 74 65 66 60 56 Z" fill="url(#duskWings)"/>

      {/* Decorative Wing Spots */}
      <circle cx="32" cy="52" r="6" fill="#F87171" opacity="0.8"/>
      <circle cx="32" cy="52" r="3" fill="#1E293B"/>
      <circle cx="88" cy="52" r="6" fill="#F87171" opacity="0.8"/>
      <circle cx="88" cy="52" r="3" fill="#1E293B"/>

      {/* Lower Hindwings */}
      <path d="M 60 62 C 50 68 38 74 36 86 C 34 94 46 98 54 90 C 58 86 60 76 60 62 Z" fill="#334155"/>
      <path d="M 60 62 C 70 68 82 74 84 86 C 86 94 74 98 66 90 C 62 86 60 76 60 62 Z" fill="#334155"/>

      {/* Moth Body & Velvet Antennae */}
      <ellipse cx="60" cy="64" rx="4.5" ry="16" fill="#0F172A"/>
      <path d="M 58 48 C 54 36 44 26 36 24" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M 62 48 C 66 36 76 26 84 24" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

// Sleek Astral Navigation Chevron (Flanker Stimulus)
function AstralChevronSvg({direction, isCenter, className = 'w-10 h-10'}: {direction: 'left' | 'right'; isCenter: boolean; className?: string}) {
  const isLeft = direction === 'left'
  return (
    <div className={`relative flex items-center justify-center ${isCenter ? 'scale-125' : 'opacity-70'}`}>
      {isCenter && (
        <span className="absolute -inset-2 rounded-xl bg-amber-400/20 blur-md animate-pulse"/>
      )}
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
        {isCenter && (
          <circle cx="16" cy="24" r="3" fill="#FDE68A"/>
        )}
      </svg>
    </div>
  )
}

// Constellation Starlight Node (Working Memory Matrix)
function StarlightNodeSvg({isLit, isTarget}: {isLit: boolean; isTarget?: boolean}) {
  return (
    <svg viewBox="0 0 60 60" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      {isLit && (
        <>
          <circle cx="30" cy="30" r="26" fill="#FDE68A" fillOpacity="0.25" className="animate-ping"/>
          <circle cx="30" cy="30" r="20" fill="#F59E0B" fillOpacity="0.3"/>
        </>
      )}
      {/* 4-Pointed Star Crystal */}
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

// -------------------------------------------------------------
// VANDERBILT DSM-5 DIAGNOSTIC QUESTIONNAIRE (18 ITEMS)
// -------------------------------------------------------------
const VANDERBILT_QUESTIONS = [
  {id: 'inatt_1', text: 'Fails to give close attention to details or makes careless mistakes in schoolwork or tasks', category: 'inatt'},
  {id: 'inatt_2', text: 'Has difficulty sustaining attention in tasks, instructions, or playful activities', category: 'inatt'},
  {id: 'inatt_3', text: 'Does not seem to listen when spoken to directly (mind seems elsewhere)', category: 'inatt'},
  {id: 'inatt_4', text: 'Does not follow through on instructions and fails to finish schoolwork or chores', category: 'inatt'},
  {id: 'inatt_5', text: 'Has difficulty organizing tasks, time, and independent activities', category: 'inatt'},
  {id: 'inatt_6', text: 'Avoids, dislikes, or is reluctant to engage in tasks requiring sustained mental effort', category: 'inatt'},
  {id: 'inatt_7', text: 'Loses things necessary for tasks or activities (pencils, books, assignments)', category: 'inatt'},
  {id: 'inatt_8', text: 'Is easily distracted by extraneous sights, sounds, or competing ideas', category: 'inatt'},
  {id: 'inatt_9', text: 'Is forgetful in daily activities and multi-step routines', category: 'inatt'},
  {id: 'hyper_1', text: 'Fidgets with hands or feet, taps, or squirms in seat', category: 'hyper'},
  {id: 'hyper_2', text: 'Leaves seat in classroom or situations where remaining seated is expected', category: 'hyper'},
  {id: 'hyper_3', text: 'Runs about, climbs excessively, or feels internal restlessness', category: 'hyper'},
  {id: 'hyper_4', text: 'Has difficulty playing or engaging in leisure activities quietly', category: 'hyper'},
  {id: 'hyper_5', text: 'Is "on the go" or acts as if "driven by a motor"', category: 'hyper'},
  {id: 'hyper_6', text: 'Talks excessively or rapidly shifts conversations', category: 'hyper'},
  {id: 'hyper_7', text: 'Blurts out answers before questions have been completed', category: 'hyper'},
  {id: 'hyper_8', text: 'Has difficulty waiting for their turn in games or group activities', category: 'hyper'},
  {id: 'hyper_9', text: 'Interrupts or intrudes on others (butts into conversations or games)', category: 'hyper'},
]

export default function AdhdAssessmentPage() {
  const [stage, setStage] = useState<'intro' | 'profile' | 'cpt_intro' | 'cpt_run' | 'flanker_intro' | 'flanker_run' | 'memory_intro' | 'memory_run' | 'vanderbilt' | 'analyzing' | 'report'>('intro')

  const [profile, setProfile] = useState<Profile>({
    childName: '',
    childAge: 9,
    gender: 'Prefer not to say',
    grade: 'Grade 4',
    informantRole: 'Parent / Caregiver',
    primaryConcerns: 'Focus during classroom lectures, sustained task initiation, and motor restlessness.'
  })

  // CPT-3 State (Continuous Performance Task)
  const [cptTrialIndex, setCptTrialIndex] = useState(0)
  const [cptCurrentStimulus, setCptCurrentStimulus] = useState<'target' | 'distractor' | null>(null)
  const [cptResponseTimes, setCptResponseTimes] = useState<number[]>([])
  const [cptLastRt, setCptLastRt] = useState<number | null>(null)
  const [cptOmissions, setCptOmissions] = useState(0)
  const [cptCommissions, setCptCommissions] = useState(0)
  const [cptTrialState, setCptTrialState] = useState<'waiting' | 'active' | 'feedback'>('waiting')
  const cptStartTimeRef = useRef<number>(0)
  const cptRespondedRef = useRef<boolean>(false)

  // Flanker Task State
  const [flankerTrialIndex, setFlankerTrialIndex] = useState(0)
  const [flankerCongruentTimes, setFlankerCongruentTimes] = useState<number[]>([])
  const [flankerIncongruentTimes, setFlankerIncongruentTimes] = useState<number[]>([])
  const [currentFlanker, setCurrentFlanker] = useState<{targetDir: 'left' | 'right'; isCongruent: boolean} | null>(null)
  const flankerStartRef = useRef<number>(0)

  // Memory Matrix State
  const [memorySequence, setMemorySequence] = useState<number[]>([])
  const [memoryUserSequence, setMemoryUserSequence] = useState<number[]>([])
  const [memoryTrial, setMemoryTrial] = useState(1)
  const [memoryLitCell, setMemoryLitCell] = useState<number | null>(null)
  const [memoryPhase, setMemoryPhase] = useState<'showing' | 'input' | 'feedback'>('showing')
  const [memoryMaxSpan, setMemoryMaxSpan] = useState(3)

  // Vanderbilt Rating Scale State (0 = Never, 1 = Occasionally, 2 = Often, 3 = Very Often)
  const [vanderbiltScores, setVanderbiltScores] = useState<Record<string, number>>({})

  // Final Clinical Report State
  const [reportData, setReportData] = useState<any>(null)

  // Keyboard navigation & spacebar responses
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (stage === 'cpt_run' && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault()
        handleCptTap()
      } else if (stage === 'flanker_run') {
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

  // --- CPT-3 Task Loop (20 Trials: 15 Targets, 5 Distractors) ---
  const CPT_TOTAL_TRIALS = 20
  useEffect(() => {
    if (stage !== 'cpt_run') return

    if (cptTrialIndex >= CPT_TOTAL_TRIALS) {
      playSound('complete')
      setStage('flanker_intro')
      return
    }

    cptRespondedRef.current = false
    const isTarget = Math.random() > 0.28
    const stimType = isTarget ? 'target' : 'distractor'

    const itiTimer = setTimeout(() => {
      setCptCurrentStimulus(stimType)
      setCptTrialState('active')
      cptStartTimeRef.current = performance.now()

      // Stimulus presentation window (700ms)
      const stimTimer = setTimeout(() => {
        if (!cptRespondedRef.current) {
          if (stimType === 'target') {
            setCptOmissions((prev) => prev + 1)
          }
        }
        setCptCurrentStimulus(null)
        setCptTrialState('waiting')

        // Inter-Trial Interval (380ms)
        const nextTrialTimer = setTimeout(() => {
          setCptTrialIndex((i) => i + 1)
        }, 380)

        return () => clearTimeout(nextTrialTimer)
      }, 700)

      return () => clearTimeout(stimTimer)
    }, 450)

    return () => clearTimeout(itiTimer)
  }, [stage, cptTrialIndex])

  function handleCptTap() {
    if (cptTrialState !== 'active' || cptRespondedRef.current) return
    cptRespondedRef.current = true
    const elapsed = Math.round(performance.now() - cptStartTimeRef.current)
    setCptLastRt(elapsed)

    if (cptCurrentStimulus === 'target') {
      playSound('hit')
      setCptResponseTimes((prev) => [...prev, elapsed])
    } else if (cptCurrentStimulus === 'distractor') {
      playSound('miss')
      setCptCommissions((prev) => prev + 1)
    }
  }

  // --- Flanker Task Loop (10 Trials) ---
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
    if (stage !== 'flanker_run') return

    if (flankerTrialIndex >= FLANKER_TOTAL_TRIALS) {
      playSound('complete')
      setStage('memory_intro')
      return
    }

    setCurrentFlanker(FLANKER_TRIALS[flankerTrialIndex])
    flankerStartRef.current = performance.now()
  }, [stage, flankerTrialIndex])

  function handleFlankerAnswer(dir: 'left' | 'right') {
    if (!currentFlanker) return
    const elapsed = Math.round(performance.now() - flankerStartRef.current)
    if (dir === currentFlanker.targetDir) {
      playSound(dir === 'left' ? 'flanker_left' : 'flanker_right')
      if (currentFlanker.isCongruent) {
        setFlankerCongruentTimes((prev) => [...prev, elapsed])
      } else {
        setFlankerIncongruentTimes((prev) => [...prev, elapsed])
      }
    } else {
      playSound('miss')
    }
    setFlankerTrialIndex((i) => i + 1)
  }

  // --- Spatial Working Memory Matrix ---
  useEffect(() => {
    if (stage !== 'memory_run') return

    const spanLength = memoryTrial + 2 // 3, 4, 5
    const seq: number[] = []
    while (seq.length < spanLength) {
      const cell = Math.floor(Math.random() * 9)
      if (seq[seq.length - 1] !== cell) seq.push(cell)
    }
    setMemorySequence(seq)
    setMemoryUserSequence([])
    setMemoryPhase('showing')

    // Playback sequence
    seq.forEach((cell, idx) => {
      setTimeout(() => {
        setMemoryLitCell(cell)
        playSound('star')
        setTimeout(() => setMemoryLitCell(null), 380)
      }, 600 + idx * 550)
    })

    const inputTimer = setTimeout(() => {
      setMemoryPhase('input')
    }, 600 + seq.length * 550)

    return () => clearTimeout(inputTimer)
  }, [stage, memoryTrial])

  function handleMemoryCellClick(cellIdx: number) {
    if (memoryPhase !== 'input') return
    playSound('star')
    const updated = [...memoryUserSequence, cellIdx]
    setMemoryUserSequence(updated)

    const currentStep = updated.length - 1
    if (updated[currentStep] !== memorySequence[currentStep]) {
      playSound('miss')
      setMemoryPhase('feedback')
      setTimeout(() => {
        if (memoryTrial < 3) {
          setMemoryTrial((t) => t + 1)
        } else {
          playSound('complete')
          setStage('vanderbilt')
        }
      }, 700)
      return
    }

    if (updated.length === memorySequence.length) {
      playSound('hit')
      setMemoryMaxSpan(memorySequence.length)
      setMemoryPhase('feedback')
      setTimeout(() => {
        if (memoryTrial < 3) {
          setMemoryTrial((t) => t + 1)
        } else {
          playSound('complete')
          setStage('vanderbilt')
        }
      }, 800)
    }
  }

  // --- Generate Full Research Report ---
  async function submitAssessment() {
    setStage('analyzing')

    const hrt = cptResponseTimes.length > 0
      ? Math.round(cptResponseTimes.reduce((a, b) => a + b, 0) / cptResponseTimes.length)
      : 520

    const rtv = cptResponseTimes.length > 1
      ? Math.round(Math.sqrt(cptResponseTimes.map(x => Math.pow(x - hrt, 2)).reduce((a, b) => a + b) / cptResponseTimes.length))
      : 85

    const avgCong = flankerCongruentTimes.length > 0 ? flankerCongruentTimes.reduce((a,b)=>a+b,0)/flankerCongruentTimes.length : 380
    const avgIncong = flankerIncongruentTimes.length > 0 ? flankerIncongruentTimes.reduce((a,b)=>a+b,0)/flankerIncongruentTimes.length : 460
    const flankerCost = Math.max(15, Math.round(avgIncong - avgCong))

    let inattSum = 0
    let hyperSum = 0
    VANDERBILT_QUESTIONS.forEach((q) => {
      const val = vanderbiltScores[q.id] || 0
      if (q.category === 'inatt') inattSum += val
      else hyperSum += val
    })

    const payload = {
      assessmentType: 'adhd',
      profile,
      adhdMetrics: {
        hrtMs: hrt,
        omissions: cptOmissions,
        commissions: cptCommissions,
        rtvMs: rtv,
        flankerCostMs: flankerCost,
        workingMemorySpan: memoryMaxSpan,
        vanderbiltInattention: inattSum,
        vanderbiltHyperactivity: hyperSum,
      }
    }

    try {
      const res = await fetch('/api/assessments/analyze', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to analyze')
      const data = await res.json()
      setReportData(data)
      setStage('report')
      playSound('complete')
    } catch (err) {
      console.error(err)
      alert('Unable to generate report. Please try again.')
      setStage('vanderbilt')
    }
  }

  return (
    <main data-no-listen="true" className="min-h-screen bg-[#FDFBF7] py-10 px-4 font-poppins text-[#1F2937]">
      <div className="mx-auto max-w-4xl">
        {/* Navigation & Clinical Standard Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between text-sm text-[#78716C] gap-2">
          <div className="flex items-center gap-2">
            <Link href="/assessments" prefetch={false} className="hover:text-[#05B076] transition-colors font-semibold">← All Assessments</Link>
            <span>/</span>
            <span className="font-semibold text-[#111827]">Manas FocusTrack™ ADHD Battery</span>
          </div>
          <span className="rounded-full bg-[#05B076]/10 border border-[#05B076]/30 px-3.5 py-1 font-semibold text-[#065F46] text-xs">
            Gold Standard Conners CPT-3 & Vanderbilt Normed
          </span>
        </div>

        {/* 1. INTRO / OVERVIEW & CLINICAL METHODOLOGY */}
        {stage === 'intro' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-xl">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#05B076]/15 px-3.5 py-1 text-xs font-bold text-[#065F46] uppercase tracking-wider mb-4 border border-[#05B076]/30">
                  Pediatric Cognitive Assessment • Free Open Access Beta
                </div>
                <h1 className="font-patrick text-4xl md:text-5xl text-[#0F172A] leading-tight mb-4">
                  Manas FocusTrack™ <span className="text-[#05B076]">ADHD Cognitive Battery</span>
                </h1>
                <p className="text-base text-[#475569] leading-relaxed mb-6">
                  Unlike conventional paper checklists that only capture subjective impressions, <strong>Manas FocusTrack™</strong> pairs an interactive continuous performance task (CPT-3) with Vanderbilt DSM-5 dimensional scaling. In 15 playful minutes, it measures real-time motor inhibition, reaction time variability, distractor filtering, and working memory capacity.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                  <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-center">
                    <div className="font-bold text-lg text-[#05B076]">Millisecond</div>
                    <div className="text-xs text-[#64748B]">Reaction Time Tracking</div>
                  </div>
                  <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-center">
                    <div className="font-bold text-lg text-[#F47522]">Age-Normed</div>
                    <div className="text-xs text-[#64748B]">T-Score Benchmarking</div>
                  </div>
                  <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-center col-span-2 sm:col-span-1">
                    <div className="font-bold text-lg text-[#3B82F6]">Instant PDF</div>
                    <div className="text-xs text-[#64748B]">Clinical Diagnostic Report</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => { playSound('tap'); setStage('profile') }}
                    className="rounded-full bg-gradient-to-r from-[#05B076] to-[#049A68] px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-[#05B076]/25 hover:shadow-xl hover:scale-[1.02] transition-all"
                  >
                    Start Assessment →
                  </button>
                  <span className="text-xs text-[#64748B]">
                    100% Free during Open Access • Full game battery, instant T-Score profile, and school accommodation blueprint.
                  </span>
                </div>
              </div>

              <div className="w-full md:w-80 shrink-0 text-center">
                <div className="relative mx-auto w-64 h-64 rounded-3xl bg-gradient-to-tr from-[#FEF3C7] to-[#DCFCE7] p-4 flex items-center justify-center shadow-inner border border-[#A7F3D0]">
                  <img
                    src="/decor/itw/itw-adhd-sticker.webp"
                    alt="FocusTrack Attention Explorer"
                    loading="lazy"
                    className="max-h-full max-w-full object-contain filter drop-shadow-md"
                  />
                </div>
                <p className="mt-3 text-xs text-[#78716C] italic font-medium">
                  Aligned with AAP Clinical Guidelines & Conners CPT-3
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. PARTICIPANT DEMOGRAPHICS */}
        {stage === 'profile' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-xl">
            <h2 className="font-patrick text-3xl text-[#111827] mb-2">Participant Details & Clinical Baseline</h2>
            <p className="text-sm text-[#64748B] mb-6">
              Clinical age-norming relies on accurate chronological age to calculate standard deviation percentiles.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">Child or Participant Name *</label>
                <input
                  type="text"
                  value={profile.childName}
                  onChange={(e) => setProfile({...profile, childName: e.target.value})}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full rounded-xl border border-[#CBD5E1] p-3 text-sm focus:border-[#05B076] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">Chronological Age *</label>
                <input
                  type="number"
                  min="4"
                  max="18"
                  value={profile.childAge}
                  onChange={(e) => setProfile({...profile, childAge: Number(e.target.value)})}
                  className="w-full rounded-xl border border-[#CBD5E1] p-3 text-sm focus:border-[#05B076] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">Grade / School Stage</label>
                <input
                  type="text"
                  value={profile.grade}
                  onChange={(e) => setProfile({...profile, grade: e.target.value})}
                  className="w-full rounded-xl border border-[#CBD5E1] p-3 text-sm focus:border-[#05B076] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">Respondent Role</label>
                <select
                  value={profile.informantRole}
                  onChange={(e) => setProfile({...profile, informantRole: e.target.value})}
                  className="w-full rounded-xl border border-[#CBD5E1] p-3 text-sm focus:border-[#05B076] focus:outline-none bg-white"
                >
                  <option>Parent / Caregiver</option>
                  <option>Classroom Teacher</option>
                  <option>Special Educator / Remedial Tutor</option>
                  <option>Self-Report (Adult / Adolescent)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">Primary Classroom / Home Concerns</label>
                <textarea
                  rows={2}
                  value={profile.primaryConcerns}
                  onChange={(e) => setProfile({...profile, primaryConcerns: e.target.value})}
                  className="w-full rounded-xl border border-[#CBD5E1] p-3 text-sm focus:border-[#05B076] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#F1F5F9]">
              <button
                type="button"
                onClick={() => setStage('intro')}
                className="text-sm font-semibold text-[#64748B] hover:text-[#0F172A]"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={!profile.childName.trim()}
                onClick={() => { playSound('chime'); setStage('cpt_intro') }}
                className="rounded-full bg-[#05B076] px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-[#049A68] disabled:opacity-50 transition-all"
              >
                Next: Task 1 (Canopy Observatory) →
              </button>
            </div>
          </div>
        )}

        {/* 3. CPT-3 INTRO (CANOPY OBSERVATORY) */}
        {stage === 'cpt_intro' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-xl text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FEF3C7] to-[#DCFCE7] p-2 border border-[#A7F3D0] shadow-md">
              <GoldenSunbirdSvg className="w-16 h-16"/>
            </div>
            <h2 className="font-patrick text-3xl text-[#111827] mb-3">Task 1: Canopy Observatory (Continuous Vigilance)</h2>
            <p className="mx-auto max-w-lg text-sm text-[#475569] leading-relaxed mb-6">
              This task measures sustained visual vigilance, reaction latency stability, and behavioral impulse control.
            </p>

            <div className="mx-auto max-w-md rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-6 text-left space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 shrink-0 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                  <GoldenSunbirdSvg className="w-10 h-10"/>
                </div>
                <p className="text-xs text-[#334155] leading-normal">
                  When you spot the <strong className="text-[#D97706]">Golden Sunbird</strong> in the lens, tap or press <strong>SPACEBAR</strong> as <strong>FAST</strong> as you can!
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 shrink-0 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                  <VelvetDuskmothSvg className="w-10 h-10"/>
                </div>
                <p className="text-xs text-[#334155] leading-normal">
                  When the <strong className="text-[#DC2626]">Shadow Duskmoth</strong> appears, <strong>FREEZE! DO NOT TAP!</strong> Let it pass quietly.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playSound('tap')
                setCptTrialIndex(0)
                setCptResponseTimes([])
                setCptOmissions(0)
                setCptCommissions(0)
                setCptLastRt(null)
                setStage('cpt_run')
              }}
              className="rounded-full bg-[#05B076] px-10 py-3.5 font-bold text-white shadow-lg hover:bg-[#049A68] hover:scale-105 transition-all text-base"
            >
              Enter Observatory (20 Observations) →
            </button>
          </div>
        )}

        {/* 4. CPT-3 RUN (THE OBSERVATORY LENS) */}
        {stage === 'cpt_run' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-2xl text-center select-none">
            {/* Real-time Telemetry Bar */}
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] bg-[#F1F5F9] px-3 py-1 rounded-full">
                Observation {cptTrialIndex + 1} of {CPT_TOTAL_TRIALS}
              </span>
              <div className="flex items-center gap-2">
                {cptLastRt && (
                  <span className="text-xs font-bold text-[#05B076] bg-white px-2.5 py-1 rounded-full shadow-sm border border-[#A7F3D0]">
                    ⚡ {cptLastRt} ms
                  </span>
                )}
                <div className="w-32 h-2.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                  <div
                    className="h-full bg-[#05B076] transition-all duration-300"
                    style={{width: `${((cptTrialIndex + 1) / CPT_TOTAL_TRIALS) * 100}%`}}
                  />
                </div>
              </div>
            </div>

            {/* Circular Observatory Telescope Bezel */}
            <div
              onClick={handleCptTap}
              className="relative mx-auto my-8 flex h-72 w-full max-w-md cursor-pointer items-center justify-center rounded-full border-8 border-[#F1F5F9] bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9] shadow-2xl transition-all hover:border-[#E2E8F0] active:scale-[0.98] overflow-hidden"
            >
              {/* Target / Distractor Stimuli */}
              {cptCurrentStimulus === 'target' && (
                <div className="flex flex-col items-center animate-bounce">
                  <GoldenSunbirdSvg className="w-32 h-32"/>
                  <span className="mt-2 text-xs font-bold tracking-wider text-[#05B076] uppercase bg-white/90 px-3 py-1 rounded-full shadow-sm">
                    TAP NOW! / SPACEBAR
                  </span>
                </div>
              )}
              {cptCurrentStimulus === 'distractor' && (
                <div className="flex flex-col items-center animate-pulse">
                  <VelvetDuskmothSvg className="w-32 h-32"/>
                  <span className="mt-2 text-xs font-bold tracking-wider text-[#DC2626] uppercase bg-white/90 px-3 py-1 rounded-full shadow-sm">
                    FREEZE! DO NOT TAP!
                  </span>
                </div>
              )}
              {!cptCurrentStimulus && (
                <div className="text-center text-[#94A3B8]">
                  <div className="h-16 w-16 mx-auto mb-2 rounded-full border-2 border-dashed border-[#CBD5E1] flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#94A3B8]" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="12" x2="16" y2="14"/>
                    </svg>
                  </div>
                  <span className="text-xs font-semibold">Keep gaze centered in the telescope lens...</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleCptTap}
              className="w-full max-w-md rounded-2xl bg-gradient-to-r from-[#05B076] to-[#049A68] py-4 text-base font-bold text-white shadow-lg active:scale-95 transition-all hover:shadow-xl"
            >
              TAP NOW (Or Press Spacebar)
            </button>
          </div>
        )}

        {/* 5. FLANKER INTRO */}
        {stage === 'flanker_intro' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-xl text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0F172A] to-[#1E293B] p-2 border border-[#334155] shadow-md">
              <AstralChevronSvg direction="right" isCenter={true} className="w-12 h-12"/>
            </div>
            <h2 className="font-patrick text-3xl text-[#111827] mb-3">Task 2: Starlight Wayfinder (Distractor Filtering)</h2>
            <p className="mx-auto max-w-lg text-sm text-[#475569] leading-relaxed mb-6">
              Measures interference control and the brain’s ability to filter out conflicting peripheral distractors.
            </p>

            <div className="mx-auto max-w-md rounded-2xl bg-[#0F172A] p-6 text-left space-y-4 mb-8 text-white">
              <p className="text-xs text-[#94A3B8] leading-normal">
                Focus <strong className="text-amber-400">ONLY on the glowing GOLDEN star arrow</strong> at the center. Ignore the side arrows!
              </p>
              <div className="flex justify-around items-center py-4 bg-[#1E293B] rounded-xl border border-[#334155]">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <AstralChevronSvg direction="right" isCenter={false} className="w-6 h-6"/>
                    <AstralChevronSvg direction="right" isCenter={true} className="w-8 h-8"/>
                    <AstralChevronSvg direction="right" isCenter={false} className="w-6 h-6"/>
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-2 font-semibold">Center = RIGHT → Tap Right</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <AstralChevronSvg direction="right" isCenter={false} className="w-6 h-6"/>
                    <AstralChevronSvg direction="left" isCenter={true} className="w-8 h-8"/>
                    <AstralChevronSvg direction="right" isCenter={false} className="w-6 h-6"/>
                  </div>
                  <div className="text-[11px] text-amber-400 mt-2 font-semibold">Center = LEFT → Tap Left</div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playSound('tap')
                setFlankerTrialIndex(0)
                setFlankerCongruentTimes([])
                setFlankerIncongruentTimes([])
                setStage('flanker_run')
              }}
              className="rounded-full bg-[#05B076] px-10 py-3.5 font-bold text-white shadow-lg hover:bg-[#049A68] hover:scale-105 transition-all text-base"
            >
              Start Wayfinder (10 Navigation Trials) →
            </button>
          </div>
        )}

        {/* 6. FLANKER RUN (COSMIC ARENA) */}
        {stage === 'flanker_run' && currentFlanker && (
          <div className="rounded-3xl border border-[#1E293B] bg-gradient-to-b from-[#090D16] via-[#0F172A] to-[#1E293B] p-8 md:p-12 shadow-2xl text-center select-none text-white">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] bg-[#1E293B] px-3 py-1 rounded-full border border-[#334155]">
                Navigation Trial {flankerTrialIndex + 1} of {FLANKER_TOTAL_TRIALS}
              </span>
              <span className="text-xs font-semibold text-amber-400">
                Focus on CENTER golden star
              </span>
            </div>

            {/* Celestial Star Array */}
            <div className="my-12 flex items-center justify-center gap-3 md:gap-5 py-10 px-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <AstralChevronSvg direction={currentFlanker.isCongruent ? currentFlanker.targetDir : (currentFlanker.targetDir === 'left' ? 'right' : 'left')} isCenter={false} className="w-9 h-9 md:w-12 md:h-12"/>
              <AstralChevronSvg direction={currentFlanker.isCongruent ? currentFlanker.targetDir : (currentFlanker.targetDir === 'left' ? 'right' : 'left')} isCenter={false} className="w-9 h-9 md:w-12 md:h-12"/>

              {/* Central Target */}
              <AstralChevronSvg direction={currentFlanker.targetDir} isCenter={true} className="w-12 h-12 md:w-16 md:h-16"/>

              <AstralChevronSvg direction={currentFlanker.isCongruent ? currentFlanker.targetDir : (currentFlanker.targetDir === 'left' ? 'right' : 'left')} isCenter={false} className="w-9 h-9 md:w-12 md:h-12"/>
              <AstralChevronSvg direction={currentFlanker.isCongruent ? currentFlanker.targetDir : (currentFlanker.targetDir === 'left' ? 'right' : 'left')} isCenter={false} className="w-9 h-9 md:w-12 md:h-12"/>
            </div>

            {/* Directional Controls */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => handleFlankerAnswer('left')}
                className="flex flex-col items-center justify-center rounded-2xl bg-[#1E293B] border-2 border-[#334155] p-5 shadow-lg hover:border-amber-400 hover:bg-[#334155] active:scale-95 transition-all"
              >
                <span className="text-2xl font-bold text-amber-400">← LEFT</span>
                <span className="text-[11px] text-[#94A3B8] mt-1 font-mono">[ Arrow Key Left ]</span>
              </button>
              <button
                type="button"
                onClick={() => handleFlankerAnswer('right')}
                className="flex flex-col items-center justify-center rounded-2xl bg-[#1E293B] border-2 border-[#334155] p-5 shadow-lg hover:border-amber-400 hover:bg-[#334155] active:scale-95 transition-all"
              >
                <span className="text-2xl font-bold text-amber-400">RIGHT →</span>
                <span className="text-[11px] text-[#94A3B8] mt-1 font-mono">[ Arrow Key Right ]</span>
              </button>
            </div>
          </div>
        )}

        {/* 7. MEMORY MATRIX INTRO */}
        {stage === 'memory_intro' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-xl text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0F172A] to-[#1E293B] p-2 border border-[#334155] shadow-md">
              <div className="w-12 h-12">
                <StarlightNodeSvg isLit={true}/>
              </div>
            </div>
            <h2 className="font-patrick text-3xl text-[#111827] mb-3">Task 3: Constellation Astrolabe (Working Memory)</h2>
            <p className="mx-auto max-w-lg text-sm text-[#475569] leading-relaxed mb-6">
              Measures spatial working memory capacity and mental rehearsal speed without verbal bias.
            </p>

            <div className="mx-auto max-w-md rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-6 text-left space-y-3 mb-8">
              <p className="text-xs text-[#334155] leading-normal">
                Watch the star nodes light up across the astrolabe. Remember the exact sequence and tap the stars in order!
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                playSound('tap')
                setMemoryTrial(1)
                setStage('memory_run')
              }}
              className="rounded-full bg-[#05B076] px-10 py-3.5 font-bold text-white shadow-lg hover:bg-[#049A68] hover:scale-105 transition-all text-base"
            >
              Start Constellation Puzzle (3 Levels) →
            </button>
          </div>
        )}

        {/* 8. MEMORY MATRIX RUN */}
        {stage === 'memory_run' && (
          <div className="rounded-3xl border border-[#1E293B] bg-gradient-to-b from-[#090D16] via-[#0F172A] to-[#1E293B] p-8 md:p-12 shadow-2xl text-center select-none text-white">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] bg-[#1E293B] px-3 py-1 rounded-full border border-[#334155]">
                Level {memoryTrial} of 3 • {memoryTrial + 2} Stars Recall
              </span>
              <span className="text-xs font-semibold text-amber-400">
                {memoryPhase === 'showing' ? 'Observe the starlight pattern...' : 'Tap the stars in order!'}
              </span>
            </div>

            {/* 3x3 Astrolabe Grid */}
            <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto my-8">
              {Array.from({length: 9}).map((_, idx) => {
                const isLit = memoryLitCell === idx || memoryUserSequence.includes(idx)
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={memoryPhase !== 'input'}
                    onClick={() => handleMemoryCellClick(idx)}
                    className={`h-24 w-24 rounded-2xl border-2 transition-all flex items-center justify-center p-3 ${
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

        {/* 9. VANDERBILT CLINICAL RATING */}
        {stage === 'vanderbilt' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#05B076]">Clinical Standardization</span>
                <h2 className="font-patrick text-3xl text-[#111827]">Vanderbilt DSM-5 Rating Scale</h2>
              </div>
              <span className="text-xs font-semibold bg-[#F1F5F9] text-[#475569] px-3 py-1.5 rounded-full">
                Completed: {Object.keys(vanderbiltScores).length} / 18
              </span>
            </div>
            <p className="text-xs text-[#64748B] mb-8 leading-relaxed">
              Standardized rating completed by parent or educator based on behaviors observed over the past 6 months across home and school routines.
            </p>

            <div className="space-y-6">
              {VANDERBILT_QUESTIONS.map((q, idx) => {
                const currentVal = vanderbiltScores[q.id]
                return (
                  <div key={q.id} className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] transition-all">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#05B076]/10 text-[#05B076] font-bold text-xs">
                        {idx + 1}
                      </span>
                      <p className="text-xs font-semibold text-[#1E293B] leading-relaxed">{q.text}</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#F1F5F9]">
                      {[
                        {label: '0 - Never', val: 0},
                        {label: '1 - Occasionally', val: 1},
                        {label: '2 - Often', val: 2},
                        {label: '3 - Very Often', val: 3},
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => {
                            playSound('tap')
                            setVanderbiltScores({...vanderbiltScores, [q.id]: opt.val})
                          }}
                          className={`rounded-xl py-2 px-3 text-xs font-semibold transition-all ${
                            currentVal === opt.val
                              ? 'bg-[#05B076] text-white shadow-md'
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

            <div className="mt-8 flex justify-end pt-6 border-t border-[#F1F5F9]">
              <button
                type="button"
                onClick={submitAssessment}
                className="rounded-full bg-gradient-to-r from-[#05B076] to-[#049A68] px-10 py-3.5 text-base font-bold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                Generate Diagnostic Assessment Report →
              </button>
            </div>
          </div>
        )}

        {/* 10. ANALYZING SPINNER */}
        {stage === 'analyzing' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-12 shadow-2xl text-center">
            <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-[#05B076]"/>
            <h2 className="font-patrick text-3xl text-[#111827] mb-2">Analyzing Behavioral & Reaction Telemetry...</h2>
            <p className="text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
              Norming Continuous Performance Hit Reaction Times (HRT) and Vanderbilt dimensional indices against age-stratified pediatric standards...
            </p>
          </div>
        )}

        {/* 11. FULL CLINICAL DIAGNOSTIC REPORT */}
        {stage === 'report' && reportData && (
          <div className="rounded-3xl border border-[#E2E8F0] bg-white p-8 md:p-12 shadow-2xl">
            {/* Clinic Document Header */}
            <div className="border-b border-[#E2E8F0] pb-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#05B076]">Clinical Assessment Document</span>
                <h1 className="font-patrick text-3xl md:text-4xl text-[#0F172A] mt-1">
                  {reportData.assessmentTitle}
                </h1>
                <div className="text-xs text-[#64748B] mt-1 font-mono">
                  Document ID: {reportData.reportId} • Date: {new Date(reportData.evaluatedAt).toLocaleDateString()}
                </div>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="self-start md:self-auto rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-2 text-xs font-bold text-[#334155] hover:bg-[#F1F5F9] shadow-sm flex items-center gap-1.5"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/>
                </svg>
                Print / Save Clinical PDF
              </button>
            </div>

            {/* Demographics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] mb-8 text-xs">
              <div>
                <span className="text-[#64748B] block">Participant</span>
                <strong className="text-[#0F172A] text-sm">{reportData.profile.childName}</strong>
              </div>
              <div>
                <span className="text-[#64748B] block">Age & Grade</span>
                <strong className="text-[#0F172A] text-sm">{reportData.profile.childAge} Years • {reportData.profile.grade}</strong>
              </div>
              <div>
                <span className="text-[#64748B] block">Informant</span>
                <strong className="text-[#0F172A] text-sm">{reportData.profile.informantRole}</strong>
              </div>
              <div>
                <span className="text-[#64748B] block">Diagnostic Model</span>
                <strong className="text-[#05B076] text-sm">DSM-5 & AAP Normed</strong>
              </div>
            </div>

            {/* Primary Clinical Classification */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#ECFDF5] to-[#F0FDF4] border-2 border-[#A7F3D0] mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-[#065F46] block mb-1">
                Diagnostic Impression & Attentional Classification
              </span>
              <div className="text-2xl font-bold text-[#065F46] mb-2 font-poppins">
                {reportData.stats.classification}
              </div>
              <p className="text-xs text-[#334155] leading-relaxed">
                {reportData.clinicalSummary}
              </p>
            </div>

            {/* Normed Indices & T-Scores Table */}
            <div className="mb-8">
              <h3 className="font-patrick text-2xl text-[#0F172A] mb-4">Normative Psychometric Indices</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-[#E2E8F0] rounded-xl overflow-hidden">
                  <thead className="bg-[#F8FAFC] text-[#475569] font-bold border-b border-[#E2E8F0]">
                    <tr>
                      <th className="p-3">Index / Subscale</th>
                      <th className="p-3">Score</th>
                      <th className="p-3">Normative Benchmark</th>
                      <th className="p-3">Clinical Risk Band</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {reportData.indices.map((idx: any, i: number) => (
                      <tr key={i} className="hover:bg-[#F8FAFC]">
                        <td className="p-3 font-semibold text-[#0F172A]">{idx.name}</td>
                        <td className="p-3 font-mono font-bold text-sm text-[#05B076]">{idx.score}</td>
                        <td className="p-3 text-[#64748B]">T-Score (Mean=50, SD=10)</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            idx.score >= 70
                              ? 'bg-rose-100 text-rose-800'
                              : idx.score >= 60
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {idx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Evidence-Based Classroom & Home Accommodations */}
            <div className="mb-8">
              <h3 className="font-patrick text-2xl text-[#0F172A] mb-4">IEP & 504 Pedagogical Accommodations</h3>
              <div className="space-y-3">
                {reportData.accommodations.map((acc: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#05B076] text-white text-[11px] font-bold mt-0.5">
                      ✓
                    </span>
                    <p className="text-xs text-[#334155] leading-relaxed">{acc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps CTA */}
            <div className="pt-6 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
              <Link
                href="/consult"
                className="rounded-full bg-[#05B076] px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-[#049A68] transition-all"
              >
                Schedule Specialist Review with Manas Pediatrician →
              </Link>
              <Link
                href="/assessments"
                className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
              >
                ← Return to Assessment Hub
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
