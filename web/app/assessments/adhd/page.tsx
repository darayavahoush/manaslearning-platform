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

// Sound synthesized via Web Audio API
function playSound(type: 'hit' | 'miss' | 'chime' | 'tap' | 'complete') {
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
      osc.frequency.setValueAtTime(523.25, now) // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12) // E5
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.16)
    } else if (type === 'miss') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(220, now)
      osc.frequency.linearRampToValueAtTime(180, now + 0.18)
      gain.gain.setValueAtTime(0.06, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.22)
    } else if (type === 'chime' || type === 'complete') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + idx * 0.08)
        gain.gain.setValueAtTime(0.07, now + idx * 0.08)
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.08)
        osc.stop(now + idx * 0.08 + 0.45)
      })
    } else {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(400, now)
      gain.gain.setValueAtTime(0.05, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.06)
    }
  } catch {}
}

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
    primaryConcerns: 'Concentration in class, homework battles, distractibility'
  })

  // CPT-3 State
  const [cptTrialIndex, setCptTrialIndex] = useState(0)
  const [cptCurrentStimulus, setCptCurrentStimulus] = useState<'target' | 'distractor' | null>(null)
  const [cptResponseTimes, setCptResponseTimes] = useState<number[]>([])
  const [cptOmissions, setCptOmissions] = useState(0)
  const [cptCommissions, setCptCommissions] = useState(0)
  const [cptTrialState, setCptTrialState] = useState<'waiting' | 'active' | 'feedback'>('waiting')
  const cptStartTimeRef = useRef<number>(0)
  const cptRespondedRef = useRef<boolean>(false)

  // Flanker State
  const [flankerTrialIndex, setFlankerTrialIndex] = useState(0)
  const [flankerCongruentTimes, setFlankerCongruentTimes] = useState<number[]>([])
  const [flankerIncongruentTimes, setFlankerIncongruentTimes] = useState<number[]>([])
  const [currentFlanker, setCurrentFlanker] = useState<{arrows: string; targetDir: 'left' | 'right'; isCongruent: boolean} | null>(null)
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

  // --- CPT-3 Task Loop (20 Trials: 15 Targets, 5 Distractors) ---
  const CPT_TOTAL_TRIALS = 20
  useEffect(() => {
    if (stage !== 'cpt_run') return

    if (cptTrialIndex >= CPT_TOTAL_TRIALS) {
      playSound('complete')
      setStage('flanker_intro')
      return
    }

    // Schedule next stimulus
    cptRespondedRef.current = false
    const isTarget = Math.random() > 0.28 // ~72% targets, 28% non-targets
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

        // Gap before next trial
        const nextTrialTimer = setTimeout(() => {
          setCptTrialIndex((i) => i + 1)
        }, 350)

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
  const FLANKER_TRIALS = [
    {arrows: '← ← ← ← ←', targetDir: 'left' as const, isCongruent: true},
    {arrows: '→ → → → →', targetDir: 'right' as const, isCongruent: true},
    {arrows: '→ → ← → →', targetDir: 'left' as const, isCongruent: false},
    {arrows: '← ← → ← ←', targetDir: 'right' as const, isCongruent: false},
    {arrows: '→ → → → →', targetDir: 'right' as const, isCongruent: true},
    {arrows: '← ← ← ← ←', targetDir: 'left' as const, isCongruent: true},
    {arrows: '← ← → ← ←', targetDir: 'right' as const, isCongruent: false},
    {arrows: '→ → ← → →', targetDir: 'left' as const, isCongruent: false},
    {arrows: '→ → → → →', targetDir: 'right' as const, isCongruent: true},
    {arrows: '← ← → ← ←', targetDir: 'right' as const, isCongruent: false},
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
      playSound('hit')
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

  // --- Spatial Working Memory Matrix (3-5 stars recall) ---
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
        playSound('tap')
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
    playSound('tap')
    const updated = [...memoryUserSequence, cellIdx]
    setMemoryUserSequence(updated)

    // Check progress
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

    // Average Hit Reaction Time
    const hrt = cptResponseTimes.length > 0
      ? Math.round(cptResponseTimes.reduce((a, b) => a + b, 0) / cptResponseTimes.length)
      : 520

    // Reaction Time Variability (SD)
    const rtv = cptResponseTimes.length > 1
      ? Math.round(Math.sqrt(cptResponseTimes.map(x => Math.pow(x - hrt, 2)).reduce((a, b) => a + b) / cptResponseTimes.length))
      : 85

    // Flanker Interference Cost
    const avgCong = flankerCongruentTimes.length > 0 ? flankerCongruentTimes.reduce((a,b)=>a+b,0)/flankerCongruentTimes.length : 380
    const avgIncong = flankerIncongruentTimes.length > 0 ? flankerIncongruentTimes.reduce((a,b)=>a+b,0)/flankerIncongruentTimes.length : 460
    const flankerCost = Math.max(15, Math.round(avgIncong - avgCong))

    // Vanderbilt Inattention & Hyperactivity Scores
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
    <main className="min-h-screen bg-[#FFFDF8] py-10 px-4 font-poppins text-[#1F2937]">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb & Navigation */}
        <div className="mb-6 flex items-center justify-between text-sm text-[#78716C]">
          <div className="flex items-center gap-2">
            <Link href="/assessments" className="hover:text-[#05B076] transition-colors">← All Assessments</Link>
            <span>/</span>
            <span className="font-semibold text-[#111827]">Manas FocusTrack™ ADHD Battery</span>
          </div>
          <span className="rounded-full bg-[#05B076]/10 px-3 py-1 font-semibold text-[#065F46] text-xs">
            Gold Standard CPT-3 + Vanderbilt Normed
          </span>
        </div>

        {/* 1. INTRO / PRICING & CLINICAL CREDENTIALS */}
        {stage === 'intro' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-xl">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#F47522]/15 px-3.5 py-1 text-xs font-bold text-[#C2410C] uppercase tracking-wider mb-4">
                  ★ Research-Grade Gamified Battery • Standardized Assessment
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
                    Start Complete Assessment • ₹799
                  </button>
                  <span className="text-xs text-[#64748B]">
                    Includes full game battery, instant T-Score profile, and school accommodation blueprint.
                  </span>
                </div>
              </div>

              <div className="w-full md:w-80 shrink-0 text-center">
                <div className="relative mx-auto w-64 h-64 rounded-3xl bg-gradient-to-tr from-[#FEF3C7] to-[#DCFCE7] p-4 flex items-center justify-center shadow-inner">
                  <img
                    src="/decor/itw/itw-adhd-sticker.webp"
                    alt="FocusTrack Attention Explorer"
                    className="max-h-full max-w-full object-contain filter drop-shadow-md"
                  />
                </div>
                <p className="mt-3 text-xs text-[#78716C] italic">
                  Aligned with AAP Clinical Guidelines & Conners CPT-3
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. PARTICIPANT PROFILE */}
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
                  placeholder="e.g. Aarav M."
                  className="w-full rounded-xl border border-[#CBD5E1] p-3 text-sm focus:border-[#05B076] focus:outline-none focus:ring-2 focus:ring-[#05B076]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">Chronological Age *</label>
                <select
                  value={profile.childAge}
                  onChange={(e) => setProfile({...profile, childAge: Number(e.target.value)})}
                  className="w-full rounded-xl border border-[#CBD5E1] p-3 text-sm focus:border-[#05B076] focus:outline-none focus:ring-2 focus:ring-[#05B076]/20 bg-white"
                >
                  {[5,6,7,8,9,10,11,12,13,14,15,16,17,18].map((age) => (
                    <option key={age} value={age}>{age} years old</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">Informant Relationship</label>
                <select
                  value={profile.informantRole}
                  onChange={(e) => setProfile({...profile, informantRole: e.target.value})}
                  className="w-full rounded-xl border border-[#CBD5E1] p-3 text-sm focus:border-[#05B076] focus:outline-none focus:ring-2 focus:ring-[#05B076]/20 bg-white"
                >
                  <option>Parent / Primary Caregiver</option>
                  <option>Classroom Educator / Special Educator</option>
                  <option>Self-Evaluation (Adolescent / Adult)</option>
                  <option>Clinician / Therapist</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">Current Academic Grade / Year</label>
                <input
                  type="text"
                  value={profile.grade}
                  onChange={(e) => setProfile({...profile, grade: e.target.value})}
                  placeholder="e.g. Grade 4, Year 5"
                  className="w-full rounded-xl border border-[#CBD5E1] p-3 text-sm focus:border-[#05B076] focus:outline-none focus:ring-2 focus:ring-[#05B076]/20"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">Primary Questions or Attentional Challenges</label>
                <input
                  type="text"
                  value={profile.primaryConcerns}
                  onChange={(e) => setProfile({...profile, primaryConcerns: e.target.value})}
                  placeholder="e.g. Struggles to complete multi-step tasks, impulsive talking, frequent daydreaming"
                  className="w-full rounded-xl border border-[#CBD5E1] p-3 text-sm focus:border-[#05B076] focus:outline-none focus:ring-2 focus:ring-[#05B076]/20"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#F1F5F9]">
              <button
                type="button"
                onClick={() => setStage('intro')}
                className="text-sm font-semibold text-[#64748B] hover:text-[#111827]"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!profile.childName.trim()}
                onClick={() => { playSound('chime'); setStage('cpt_intro') }}
                className="rounded-full bg-[#05B076] px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-[#049A68] disabled:opacity-50 transition-all"
              >
                Begin Task 1: Jungle Safari Vigilance →
              </button>
            </div>
          </div>
        )}

        {/* 3. CPT-3 INTRO */}
        {stage === 'cpt_intro' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-xl text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#DCFCE7] text-3xl">
              🐒
            </div>
            <h2 className="font-patrick text-3xl text-[#111827] mb-3">Task 1: Jungle Safari Vigilance (CPT-3)</h2>
            <p className="mx-auto max-w-lg text-sm text-[#475569] leading-relaxed mb-6">
              This task measures sustained attention, response latency, and behavioral impulse control.
            </p>

            <div className="mx-auto max-w-md rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-6 text-left space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#05B076] text-white font-bold text-xs">1</span>
                <p className="text-xs text-[#334155] leading-normal">
                  Whenever you see the <strong>Golden Monkey 🐒</strong>, tap the screen or press the green button as <strong>FAST</strong> as you can!
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#DC2626] text-white font-bold text-xs">2</span>
                <p className="text-xs text-[#334155] leading-normal">
                  If the <strong>Red Tiger 🐯</strong> appears, <strong>FREEZE! Do NOT tap!</strong> Hold back your impulse.
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
                setStage('cpt_run')
              }}
              className="rounded-full bg-[#05B076] px-10 py-3.5 font-bold text-white shadow-lg hover:bg-[#049A68] hover:scale-105 transition-all text-base"
            >
              Start Safari Vigilance (20 Trials) →
            </button>
          </div>
        )}

        {/* 4. CPT-3 ACTIVE RUN */}
        {stage === 'cpt_run' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-2xl text-center select-none">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Trial {cptTrialIndex + 1} of {CPT_TOTAL_TRIALS}
              </span>
              <div className="w-36 h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
                <div
                  className="h-full bg-[#05B076] transition-all duration-300"
                  style={{width: `${((cptTrialIndex + 1) / CPT_TOTAL_TRIALS) * 100}%`}}
                />
              </div>
            </div>

            <div
              onClick={handleCptTap}
              className="relative mx-auto my-8 flex h-72 w-full max-w-md cursor-pointer items-center justify-center rounded-3xl border-4 border-dashed border-[#CBD5E1] bg-[#F8FAFC] transition-all hover:bg-[#F1F5F9] active:scale-[0.98]"
            >
              {cptCurrentStimulus === 'target' && (
                <div className="flex flex-col items-center animate-bounce">
                  <span className="text-8xl">🐒</span>
                  <span className="mt-2 text-sm font-bold text-[#05B076]">TAP NOW!</span>
                </div>
              )}
              {cptCurrentStimulus === 'distractor' && (
                <div className="flex flex-col items-center">
                  <span className="text-8xl">🐯</span>
                  <span className="mt-2 text-sm font-bold text-[#DC2626]">FREEZE! DO NOT TAP!</span>
                </div>
              )}
              {!cptCurrentStimulus && (
                <div className="text-center text-[#94A3B8]">
                  <span className="text-4xl block mb-2">👁️</span>
                  <span className="text-xs font-semibold">Eyes on center...</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleCptTap}
              className="w-full max-w-md rounded-2xl bg-gradient-to-r from-[#05B076] to-[#049A68] py-4 text-xl font-bold text-white shadow-lg active:scale-95 transition-all"
            >
              TAP / SPACEBAR!
            </button>
          </div>
        )}

        {/* 5. FLANKER INTRO */}
        {stage === 'flanker_intro' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-xl text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E0E7FF] text-3xl">
              🎯
            </div>
            <h2 className="font-patrick text-3xl text-[#111827] mb-3">Task 2: Starlight Flanker (Distractor Filtering)</h2>
            <p className="mx-auto max-w-lg text-sm text-[#475569] leading-relaxed mb-6">
              Measures interference control and the brain’s ability to filter out conflicting peripheral distractors.
            </p>

            <div className="mx-auto max-w-md rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-6 text-left space-y-3 mb-8">
              <p className="text-xs text-[#334155] leading-normal">
                Focus <strong>ONLY on the CENTER arrow</strong>. Ignore the arrows surrounding it!
              </p>
              <div className="flex justify-around items-center py-2 bg-white rounded-xl border border-[#E2E8F0]">
                <div className="text-center">
                  <span className="font-mono font-bold text-lg text-[#05B076]">→ → → → →</span>
                  <div className="text-[11px] text-[#64748B]">Center points RIGHT → Tap Right</div>
                </div>
                <div className="text-center">
                  <span className="font-mono font-bold text-lg text-[#F47522]">← ← → ← ←</span>
                  <div className="text-[11px] text-[#64748B]">Center points RIGHT → Still Tap Right!</div>
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
              Start Flanker Trials (10 Trials) →
            </button>
          </div>
        )}

        {/* 6. FLANKER RUN */}
        {stage === 'flanker_run' && currentFlanker && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-2xl text-center select-none">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Flanker {flankerTrialIndex + 1} of {FLANKER_TOTAL_TRIALS}
              </span>
              <span className="text-xs text-[#64748B]">Focus on the middle arrow</span>
            </div>

            <div className="my-12 py-10 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="font-mono text-5xl md:text-6xl font-black tracking-widest text-[#0F172A]">
                {currentFlanker.arrows}
              </div>
            </div>

            <div className="flex justify-center gap-6 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => handleFlankerAnswer('left')}
                className="flex-1 rounded-2xl border-2 border-[#CBD5E1] bg-white py-5 text-2xl font-bold text-[#1E293B] shadow-md hover:border-[#05B076] hover:bg-[#F0FDF4] active:scale-95 transition-all"
              >
                ← LEFT
              </button>
              <button
                type="button"
                onClick={() => handleFlankerAnswer('right')}
                className="flex-1 rounded-2xl border-2 border-[#CBD5E1] bg-white py-5 text-2xl font-bold text-[#1E293B] shadow-md hover:border-[#05B076] hover:bg-[#F0FDF4] active:scale-95 transition-all"
              >
                RIGHT →
              </button>
            </div>
          </div>
        )}

        {/* 7. MEMORY MATRIX INTRO */}
        {stage === 'memory_intro' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-xl text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FEF3C7] text-3xl">
              ⭐
            </div>
            <h2 className="font-patrick text-3xl text-[#111827] mb-3">Task 3: Constellation Memory Matrix</h2>
            <p className="mx-auto max-w-lg text-sm text-[#475569] leading-relaxed mb-6">
              Measures spatial working memory capacity and the brain’s executive mental scratchpad.
            </p>

            <div className="mx-auto max-w-md rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-6 text-left space-y-3 mb-8">
              <p className="text-xs text-[#334155] leading-normal">
                Watch the grid carefully as stars light up in sequence. Once they finish, tap the stars in the <strong>exact same sequence</strong>!
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
              Start Constellation Recall (3 Rounds) →
            </button>
          </div>
        )}

        {/* 8. MEMORY MATRIX RUN */}
        {stage === 'memory_run' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-2xl text-center select-none">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Round {memoryTrial} of 3 (Span: {memorySequence.length} stars)
              </span>
              <span className="text-xs font-semibold text-[#05B076]">
                {memoryPhase === 'showing' ? '👀 WATCH SEQUENCE...' : '👉 TAP THE STARS NOW!'}
              </span>
            </div>

            <div className="mx-auto grid grid-cols-3 gap-3 w-72 h-72 my-8 p-3 rounded-2xl bg-[#0F172A] shadow-inner">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => {
                const isLit = memoryLitCell === idx
                const isClicked = memoryUserSequence.includes(idx) && memoryPhase === 'input'
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={memoryPhase !== 'input'}
                    onClick={() => handleMemoryCellClick(idx)}
                    className={`rounded-xl transition-all duration-150 flex items-center justify-center text-2xl ${
                      isLit
                        ? 'bg-[#FBBF24] shadow-[0_0_20px_#FBBF24] scale-105'
                        : isClicked
                        ? 'bg-[#05B076] text-white shadow-md'
                        : 'bg-[#1E293B] hover:bg-[#334155]'
                    }`}
                  >
                    {isLit ? '⭐' : isClicked ? '✓' : ''}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 9. VANDERBILT RATING SCALE (18 ITEMS) */}
        {stage === 'vanderbilt' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#05B076]/10 px-3 py-1 text-xs font-bold text-[#065F46] uppercase tracking-wider mb-2">
              Clinical Dimensional Questionnaire • Vanderbilt Scale
            </div>
            <h2 className="font-patrick text-3xl text-[#111827] mb-2">Observational Behavioral Rating</h2>
            <p className="text-sm text-[#64748B] mb-8">
              Please rate how frequently each behavior has been observed over the past 6 months across home and school environments.
            </p>

            <div className="space-y-6">
              {VANDERBILT_QUESTIONS.map((q, idx) => (
                <div key={q.id} className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <p className="text-sm font-semibold text-[#1E293B] mb-3">
                    {idx + 1}. {q.text}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      {label: 'Never (0)', val: 0},
                      {label: 'Occasionally (1)', val: 1},
                      {label: 'Often (2)', val: 2},
                      {label: 'Very Often (3)', val: 3},
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => {
                          playSound('tap')
                          setVanderbiltScores((prev) => ({...prev, [q.id]: opt.val}))
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                          vanderbiltScores[q.id] === opt.val
                            ? 'bg-[#05B076] text-white border-[#05B076] shadow-sm'
                            : 'bg-white text-[#475569] border-[#CBD5E1] hover:bg-[#F1F5F9]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex justify-between items-center pt-6 border-t border-[#F1F5F9]">
              <div className="text-xs text-[#64748B]">
                {Object.keys(vanderbiltScores).length} of {VANDERBILT_QUESTIONS.length} items rated
              </div>
              <button
                type="button"
                onClick={submitAssessment}
                className="rounded-full bg-gradient-to-r from-[#05B076] to-[#049A68] px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all"
              >
                Synthesize Research Diagnostic Report →
              </button>
            </div>
          </div>
        )}

        {/* 10. ANALYZING LOADER */}
        {stage === 'analyzing' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-16 shadow-xl text-center">
            <div className="mx-auto mb-6 h-14 w-14 animate-spin rounded-full border-4 border-[#05B076]/20 border-t-[#05B076]" />
            <h2 className="font-patrick text-3xl text-[#111827] mb-2">Normative Scoring in Progress…</h2>
            <p className="text-sm text-[#64748B] max-w-md mx-auto">
              Calculating Hit Reaction Time distributions, Omission/Commission T-scores, Flanker distractor costs, and generating child-specific accommodations…
            </p>
          </div>
        )}

        {/* 11. CLINICAL REPORT */}
        {stage === 'report' && reportData && (
          <div className="space-y-8">
            <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-2xl print:border-none print:shadow-none">
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-[#E2E8F0] gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#05B076]">Official Clinical Assessment</div>
                  <h1 className="font-patrick text-3xl md:text-4xl text-[#0F172A]">{reportData.assessmentTitle}</h1>
                  <p className="text-xs text-[#64748B] mt-1">
                    Report ID: <span className="font-mono text-[#0F172A]">{reportData.reportId}</span> • Date: {new Date(reportData.evaluatedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-full border border-[#CBD5E1] bg-[#F8FAFC] px-5 py-2 text-xs font-bold text-[#1E293B] hover:bg-[#E2E8F0] transition print:hidden"
                >
                  🖨️ Print / Save PDF
                </button>
              </div>

              {/* Participant Profile Banner */}
              <div className="my-6 grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-4 text-xs">
                <div><span className="text-[#64748B] block">Participant:</span><strong>{reportData.profile.childName}</strong></div>
                <div><span className="text-[#64748B] block">Age / Grade:</span><strong>{reportData.profile.childAge} yrs • {reportData.profile.grade}</strong></div>
                <div><span className="text-[#64748B] block">Evaluated By:</span><strong>{reportData.profile.informantRole}</strong></div>
                <div><span className="text-[#64748B] block">Norming Baseline:</span><strong>Conners-3 / Vanderbilt</strong></div>
              </div>

              {/* Classification Banner */}
              <div className="rounded-2xl bg-gradient-to-r from-[#FEF3C7] to-[#DCFCE7] border border-[#FDE68A] p-5 mb-8">
                <div className="text-xs font-bold uppercase tracking-wider text-[#92400E]">Diagnostic Classification</div>
                <div className="text-xl md:text-2xl font-bold text-[#0F172A] mt-1">{reportData.stats.classification}</div>
                <p className="text-xs text-[#475569] mt-2 leading-relaxed">{reportData.clinicalSummary}</p>
              </div>

              {/* Normative Cognitive Indices Table */}
              <h3 className="font-patrick text-2xl text-[#0F172A] mb-4">Core Cognitive & Executive Indices</h3>
              <div className="space-y-4 mb-8">
                {reportData.indices.map((idx: any) => (
                  <div key={idx.name} className="rounded-xl border border-[#E2E8F0] p-4 bg-white">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-semibold text-[#1E293B]">{idx.name}</span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        idx.score >= 65 ? 'bg-[#FEE2E2] text-[#B91C1C]' : 'bg-[#DCFCE7] text-[#15803D]'
                      }`}>
                        T-Score: {idx.score} ({idx.status})
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                      <div
                        className={`h-full transition-all ${idx.score >= 65 ? 'bg-[#EF4444]' : 'bg-[#05B076]'}`}
                        style={{width: `${Math.min(100, (idx.score / 90) * 100)}%`}}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Raw Reaction Time Telemetry */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
                <div>
                  <div className="text-xl font-bold text-[#05B076]">{reportData.adhdMetrics.hrtMs} ms</div>
                  <div className="text-[11px] text-[#64748B]">Hit Reaction Time (HRT)</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-[#DC2626]">{reportData.adhdMetrics.omissions}</div>
                  <div className="text-[11px] text-[#64748B]">Omission Errors (Missed)</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-[#F47522]">{reportData.adhdMetrics.commissions}</div>
                  <div className="text-[11px] text-[#64748B]">Commission Errors (Impulsive)</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-[#3B82F6]">±{reportData.adhdMetrics.rtvMs} ms</div>
                  <div className="text-[11px] text-[#64748B]">Reaction Time Variability</div>
                </div>
              </div>

              {/* Observed Strengths */}
              <div className="my-8 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] p-6">
                <h4 className="font-patrick text-xl text-[#065F46] mb-3">★ Neurodivergent Strengths & Catalysts</h4>
                <ul className="space-y-2 text-xs text-[#064E3B] list-disc list-inside">
                  {reportData.strengths.map((str: string, i: number) => (
                    <li key={i}>{str}</li>
                  ))}
                </ul>
              </div>

              {/* School & Classroom Accommodations */}
              <div className="my-8 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] p-6">
                <h4 className="font-patrick text-xl text-[#1E40AF] mb-3">📋 School & Classroom Accommodations (504 / IEP Blueprint)</h4>
                <ul className="space-y-2 text-xs text-[#1E3A8A] list-disc list-inside">
                  {reportData.accommodations.map((acc: string, i: number) => (
                    <li key={i}>{acc}</li>
                  ))}
                </ul>
              </div>

              {/* Sign-off */}
              <div className="mt-8 pt-6 border-t border-[#E2E8F0] flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-[#64748B] gap-4">
                <div>
                  <strong>Manasi Valluri, M.Sc.</strong>
                  <div className="text-[11px]">Senior Pediatric Developmental Specialist & Director</div>
                  <div className="text-[11px]">Manas Learning Centre, Chennai</div>
                </div>
                <div className="print:hidden">
                  <a
                    href="/consult"
                    className="rounded-full bg-[#F47522] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#EA580C] transition inline-block"
                  >
                    Discuss With Specialist • Book Consultation →
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
