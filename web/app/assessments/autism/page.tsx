'use client'
import {useState, useEffect, useRef} from 'react'
import Link from 'next/link'

interface Profile {
  childName: string
  childAge: number
  gender: string
  communicationStyle: string
  informantRole: string
  primarySensitivities: string
}

function playSound(type: 'hit' | 'chime' | 'tap' | 'complete' | 'sensory') {
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
      osc.type = 'sine'
      osc.frequency.setValueAtTime(523.25, now)
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12)
      gain.gain.setValueAtTime(0.07, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.16)
    } else if (type === 'sensory') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(320, now)
      osc.frequency.linearRampToValueAtTime(440, now + 0.25)
      gain.gain.setValueAtTime(0.05, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.32)
    } else if (type === 'complete' || type === 'chime') {
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + idx * 0.08)
        gain.gain.setValueAtTime(0.06, now + idx * 0.08)
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.08)
        osc.stop(now + idx * 0.08 + 0.4)
      })
    } else {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(380, now)
      gain.gain.setValueAtTime(0.04, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.05)
    }
  } catch {}
}

const SCQ_QUESTIONS = [
  {id: 'scq_1', text: 'Does your child look directly at you when communicating or needing something from you?'},
  {id: 'scq_2', text: 'Does your child use pointing or spontaneous gestures to show you something interesting (just to share delight, not merely asking for an item)?'},
  {id: 'scq_3', text: 'Does your child have intense, highly specialized interests that absorb a significant amount of their conversation and daily time?'},
  {id: 'scq_4', text: 'Does your child become very distressed or uncomfortable with small, unexpected changes in their routine or environment?'},
  {id: 'scq_5', text: 'Does your child repeat particular phrases, songs, dialogue, or motor movements (like rocking or hand flapping) when excited or overwhelmed?'},
  {id: 'scq_6', text: 'Does your child show unusually strong reactions to sensory inputs (e.g. covering ears at blender sounds, rejecting clothing seams/tags)?'},
  {id: 'scq_7', text: 'Does your child find it difficult to engage in back-and-forth imaginative play with other children?'},
  {id: 'scq_8', text: 'Does your child tend to interpret words literally, finding metaphors, jokes, or implied meanings confusing?'},
  {id: 'scq_9', text: 'Does your child seek out specific repetitive sensations, like watching spinning objects or smelling items?'},
  {id: 'scq_10', text: 'Does your child use unique intonation, rhythm, or formal phrasing when speaking?'},
  {id: 'scq_11', text: 'Does your child experience intense fatigue or sensory meltdowns after busy group settings like parties or school assemblies?'},
  {id: 'scq_12', text: 'Does your child form deep attachments to specific objects, collections, or structured sequences?'},
]

export default function AutismAssessmentPage() {
  const [stage, setStage] = useState<'intro' | 'profile' | 'ja_intro' | 'ja_run' | 'tom_intro' | 'tom_run' | 'sensory_intro' | 'sensory_run' | 'dccs_intro' | 'dccs_run' | 'scq' | 'analyzing' | 'report'>('intro')

  const [profile, setProfile] = useState<Profile>({
    childName: '',
    childAge: 7,
    gender: 'Prefer not to say',
    communicationStyle: 'Fluent verbal speech',
    informantRole: 'Parent / Caregiver',
    primarySensitivities: 'Loud sudden sounds, crowded halls, bright lighting'
  })

  // Task 1: Joint Attention State (4 trials)
  const [jaTrialIndex, setJaTrialIndex] = useState(0)
  const [jaResponseTimes, setJaResponseTimes] = useState<number[]>([])
  const [jaCorrectCount, setJaCorrectCount] = useState(0)
  const jaStartRef = useRef<number>(0)
  const JA_TRIALS = [
    {cueType: 'gaze' as const, targetPot: 1, avatarEyeDir: '👉 Looking Right at Pot C'},
    {cueType: 'point' as const, targetPot: 0, avatarEyeDir: '👈 Pointing Left at Pot A'},
    {cueType: 'gaze' as const, targetPot: 2, avatarEyeDir: '👇 Looking Down at Pot B'},
    {cueType: 'point' as const, targetPot: 1, avatarEyeDir: '👉 Pointing Right at Pot C'},
  ]

  // Task 2: Theory of Mind / Social Nuance State (4 trials)
  const [tomTrialIndex, setTomTrialIndex] = useState(0)
  const [tomScore, setTomScore] = useState(0)
  const TOM_VIGNETTES = [
    {
      scenario: 'Priya drops her handmade clay bird and it chips. Her eyes tear up, but she smiles softly and says: "Oh, it\'s totally fine!"',
      question: 'What is Priya truly feeling on the inside?',
      options: [
        {text: 'She is truly happy and completely fine.', correct: false},
        {text: 'She feels sad and disappointed, but is trying to be brave.', correct: true},
        {text: 'She is angry at the bird.', correct: false}
      ]
    },
    {
      scenario: 'During dinner, Dad looks at the empty water jug and asks Rohan: "Can you reach the water bottle?"',
      question: 'What does Dad mean by this question?',
      options: [
        {text: 'He is asking a scientific test about Rohan’s arm length.', correct: false},
        {text: 'He is politely asking Rohan to please pass the water bottle.', correct: true},
        {text: 'He wants Rohan to stand on the chair.', correct: false}
      ]
    },
    {
      scenario: 'Teacher says: "Quiet down, boys and girls. You could hear a pin drop in here!"',
      question: 'Why does the teacher mention a pin dropping?',
      options: [
        {text: 'Someone literally dropped a metal pin on the floor.', correct: false},
        {text: 'She is describing an expectation of complete silence.', correct: true},
        {text: 'She wants the students to find pins.', correct: false}
      ]
    },
    {
      scenario: 'At a loud school celebration with drums, Aarav covers his ears and looks toward the quiet veranda.',
      question: 'Why is Aarav looking toward the veranda?',
      options: [
        {text: 'The loud vibrations are overwhelming, and he needs a calm sensory sanctuary.', correct: true},
        {text: 'He hates music.', correct: false},
        {text: 'He is looking for a drumstick.', correct: false}
      ]
    }
  ]

  // Task 3: Sensory Threshold Calibration
  const [sensoryVisual, setSensoryVisual] = useState(6)
  const [sensoryAuditory, setSensoryAuditory] = useState(8)
  const [sensoryTactile, setSensoryTactile] = useState(7)
  const [sensorySanctuaryPref, setSensorySanctuaryPref] = useState('Dim quiet corner with soft cushions')

  // Task 4: DCCS Set-Shifting (6 trials)
  const [dccsTrialIndex, setDccsTrialIndex] = useState(0)
  const [dccsRule, setDccsRule] = useState<'color' | 'shape'>('color')
  const [dccsPerseverations, setDccsPerseverations] = useState(0)
  const [dccsResponseTimes, setDccsResponseTimes] = useState<number[]>([])
  const dccsStartRef = useRef<number>(0)
  const DCCS_CARDS = [
    {color: 'red', shape: 'star', targetColorMatch: 0, targetShapeMatch: 1},
    {color: 'blue', shape: 'circle', targetColorMatch: 1, targetShapeMatch: 0},
    {color: 'red', shape: 'circle', targetColorMatch: 0, targetShapeMatch: 0},
    {color: 'blue', shape: 'star', targetColorMatch: 1, targetShapeMatch: 1},
    {color: 'red', shape: 'star', targetColorMatch: 0, targetShapeMatch: 1},
    {color: 'blue', shape: 'circle', targetColorMatch: 1, targetShapeMatch: 0},
  ]

  // SCQ Questionnaire State (12 items: 0 = No, 1 = Yes)
  const [scqAnswers, setScqAnswers] = useState<Record<string, number>>({})

  // Report State
  const [reportData, setReportData] = useState<any>(null)

  // --- Joint Attention Trials ---
  useEffect(() => {
    if (stage === 'ja_run' && jaTrialIndex < JA_TRIALS.length) {
      jaStartRef.current = performance.now()
    } else if (stage === 'ja_run' && jaTrialIndex >= JA_TRIALS.length) {
      playSound('complete')
      setStage('tom_intro')
    }
  }, [stage, jaTrialIndex])

  function handlePotSelect(potIdx: number) {
    if (stage !== 'ja_run') return
    const elapsed = Math.round(performance.now() - jaStartRef.current)
    setJaResponseTimes((prev) => [...prev, elapsed])

    if (potIdx === JA_TRIALS[jaTrialIndex].targetPot) {
      playSound('hit')
      setJaCorrectCount((c) => c + 1)
    } else {
      playSound('tap')
    }
    setJaTrialIndex((i) => i + 1)
  }

  // --- Theory of Mind Handling ---
  function handleTomAnswer(isCorrect: boolean) {
    if (isCorrect) {
      playSound('hit')
      setTomScore((s) => s + 25)
    } else {
      playSound('tap')
    }

    if (tomTrialIndex + 1 < TOM_VIGNETTES.length) {
      setTomTrialIndex((i) => i + 1)
    } else {
      playSound('complete')
      setStage('sensory_intro')
    }
  }

  // --- DCCS Handling ---
  useEffect(() => {
    if (stage === 'dccs_run') {
      if (dccsTrialIndex === 0) setDccsRule('color')
      if (dccsTrialIndex === 3) {
        setDccsRule('shape')
        playSound('sensory')
      }
      if (dccsTrialIndex >= DCCS_CARDS.length) {
        playSound('complete')
        setStage('scq')
        return
      }
      dccsStartRef.current = performance.now()
    }
  }, [stage, dccsTrialIndex])

  function handleDccsSort(targetBin: number) {
    const elapsed = Math.round(performance.now() - dccsStartRef.current)
    setDccsResponseTimes((prev) => [...prev, elapsed])

    const card = DCCS_CARDS[dccsTrialIndex]
    const correctBin = dccsRule === 'color' ? card.targetColorMatch : card.targetShapeMatch

    if (targetBin === correctBin) {
      playSound('hit')
    } else {
      playSound('tap')
      // If user sorted by color when rule switched to shape
      if (dccsRule === 'shape' && targetBin === card.targetColorMatch) {
        setDccsPerseverations((p) => p + 1)
      }
    }
    setDccsTrialIndex((i) => i + 1)
  }

  // --- Final Analysis ---
  async function submitAssessment() {
    setStage('analyzing')

    const avgJaLatency = jaResponseTimes.length > 0
      ? Math.round(jaResponseTimes.reduce((a, b) => a + b, 0) / jaResponseTimes.length)
      : 800
    const jaAccuracy = Math.round((jaCorrectCount / JA_TRIALS.length) * 100)

    let totalScq = 0
    Object.values(scqAnswers).forEach((v) => { totalScq += v })

    const avgDccsLatency = dccsResponseTimes.length > 0
      ? Math.round(dccsResponseTimes.reduce((a, b) => a + b, 0) / dccsResponseTimes.length)
      : 650

    const payload = {
      assessmentType: 'autism',
      profile,
      autismMetrics: {
        jointAttentionLatencyMs: avgJaLatency,
        jointAttentionAccuracy: jaAccuracy,
        theoryOfMindScore: tomScore,
        sensoryVisualScore: sensoryVisual,
        sensoryAuditoryScore: sensoryAuditory,
        sensoryTactileScore: sensoryTactile,
        setShiftingCostMs: Math.max(30, avgDccsLatency - 450),
        perseverativeErrors: dccsPerseverations,
        scqScore: totalScq,
      }
    }

    try {
      const res = await fetch('/api/assessments/analyze', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Analysis failed')
      const data = await res.json()
      setReportData(data)
      setStage('report')
      playSound('complete')
    } catch (err) {
      console.error(err)
      alert('Unable to generate assessment report. Please try again.')
      setStage('scq')
    }
  }

  return (
    <main className="min-h-screen bg-[#FFFDF8] py-10 px-4 font-poppins text-[#1F2937]">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center justify-between text-sm text-[#78716C]">
          <div className="flex items-center gap-2">
            <Link href="/assessments" className="hover:text-[#05B076] transition-colors">← All Assessments</Link>
            <span>/</span>
            <span className="font-semibold text-[#111827]">Manas PRISM™ Autism Profile</span>
          </div>
          <span className="rounded-full bg-[#3B82F6]/10 px-3 py-1 font-semibold text-[#1D4ED8] text-xs">
            Gold Standard ADOS-2 & SPM-2 Mapped
          </span>
        </div>

        {/* 1. INTRO / PRICING & CLINICAL FRAMEWORK */}
        {stage === 'intro' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-xl">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#3B82F6]/15 px-3.5 py-1 text-xs font-bold text-[#1D4ED8] uppercase tracking-wider mb-4">
                  ★ Research-Grade Neurodevelopmental Battery • Autism Profile
                </div>
                <h1 className="font-patrick text-4xl md:text-5xl text-[#0F172A] leading-tight mb-4">
                  Manas PRISM™ <span className="text-[#3B82F6]">Autism Social & Sensory Profile</span>
                </h1>
                <p className="text-base text-[#475569] leading-relaxed mb-6">
                  <strong>Manas PRISM™</strong> evaluates the multidimensional landscape of autism, social communication, and sensory processing. Grounded in ADOS-2 observational dimensions, SPM-2 sensory modulation, and SCQ developmental markers, it assesses joint attention referencing, contextual Theory of Mind, sensory thresholds, and cognitive set-shifting through respectful, gamified scenarios.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                  <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-center">
                    <div className="font-bold text-lg text-[#3B82F6]">Joint Attention</div>
                    <div className="text-xs text-[#64748B]">Social Referencing Probes</div>
                  </div>
                  <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-center">
                    <div className="font-bold text-lg text-[#05B076]">Sensory Map</div>
                    <div className="text-xs text-[#64748B]">Audiovisual Thresholds</div>
                  </div>
                  <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-center col-span-2 sm:col-span-1">
                    <div className="font-bold text-lg text-[#F47522]">Clinical Report</div>
                    <div className="text-xs text-[#64748B]">Sensory Diet & IEP Plan</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => { playSound('tap'); setStage('profile') }}
                    className="rounded-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-[#3B82F6]/25 hover:shadow-xl hover:scale-[1.02] transition-all"
                  >
                    Start Complete Assessment • ₹799
                  </button>
                  <span className="text-xs text-[#64748B]">
                    Full 4-domain gamified battery + downloadable clinical profile and sensory accommodations.
                  </span>
                </div>
              </div>

              <div className="w-full md:w-80 shrink-0 text-center">
                <div className="relative mx-auto w-64 h-64 rounded-3xl bg-gradient-to-tr from-[#DBEAFE] to-[#E0E7FF] p-4 flex items-center justify-center shadow-inner">
                  <img
                    src="/decor/itw/itw-autism-sticker.webp"
                    alt="PRISM Autism Profile"
                    className="max-h-full max-w-full object-contain filter drop-shadow-md"
                  />
                </div>
                <p className="mt-3 text-xs text-[#78716C] italic">
                  Aligned with ADOS-2, CARS-2 & SPM-2 Dimensions
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. PROFILE INTAKE */}
        {stage === 'profile' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-xl">
            <h2 className="font-patrick text-3xl text-[#111827] mb-2">Participant & Communication Baseline</h2>
            <p className="text-sm text-[#64748B] mb-6">
              Capturing communication modalities and sensory triggers allows personalized profile calibration.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">Child or Participant Name *</label>
                <input
                  type="text"
                  value={profile.childName}
                  onChange={(e) => setProfile({...profile, childName: e.target.value})}
                  placeholder="e.g. Diya S."
                  className="w-full rounded-xl border border-[#CBD5E1] p-3 text-sm focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">Chronological Age *</label>
                <select
                  value={profile.childAge}
                  onChange={(e) => setProfile({...profile, childAge: Number(e.target.value)})}
                  className="w-full rounded-xl border border-[#CBD5E1] p-3 text-sm focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 bg-white"
                >
                  {[3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18].map((age) => (
                    <option key={age} value={age}>{age} years old</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">Primary Communication Modality</label>
                <select
                  value={profile.communicationStyle}
                  onChange={(e) => setProfile({...profile, communicationStyle: e.target.value})}
                  className="w-full rounded-xl border border-[#CBD5E1] p-3 text-sm focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 bg-white"
                >
                  <option>Fluent Verbal Communication</option>
                  <option>Emerging Phrases / Single Words</option>
                  <option>Gestalt Language Processor (Echolalia)</option>
                  <option>AAC Tablet / Picture Exchange</option>
                  <option>Non-Verbal / Gestural Communication</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">Informant Relationship</label>
                <select
                  value={profile.informantRole}
                  onChange={(e) => setProfile({...profile, informantRole: e.target.value})}
                  className="w-full rounded-xl border border-[#CBD5E1] p-3 text-sm focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 bg-white"
                >
                  <option>Parent / Primary Caregiver</option>
                  <option>Special Educator / Therapist</option>
                  <option>Self-Evaluation</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">Main Sensory Triggers & Preferences</label>
                <input
                  type="text"
                  value={profile.primarySensitivities}
                  onChange={(e) => setProfile({...profile, primarySensitivities: e.target.value})}
                  placeholder="e.g. Overwhelmed by sudden noises, avoids eye contact when stressed, seeks deep pressure"
                  className="w-full rounded-xl border border-[#CBD5E1] p-3 text-sm focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
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
                onClick={() => { playSound('chime'); setStage('ja_intro') }}
                className="rounded-full bg-[#3B82F6] px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-[#2563EB] disabled:opacity-50 transition-all"
              >
                Begin Task 1: Joint Attention Safari →
              </button>
            </div>
          </div>
        )}

        {/* 3. JOINT ATTENTION INTRO */}
        {stage === 'ja_intro' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-xl text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#DBEAFE] text-3xl">
              👀
            </div>
            <h2 className="font-patrick text-3xl text-[#111827] mb-3">Task 1: Joint Attention & Social Referencing</h2>
            <p className="mx-auto max-w-lg text-sm text-[#475569] leading-relaxed mb-6">
              Joint attention—the natural human reflex to follow another person’s eye gaze and pointing gesture—is a cornerstone of early social reciprocity.
            </p>

            <div className="mx-auto max-w-md rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-6 text-left space-y-3 mb-8">
              <p className="text-xs text-[#334155] leading-normal">
                Watch the friendly guide in the courtyard. When they <strong>look or point toward a jar</strong>, tap the jar they are showing you!
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                playSound('tap')
                setJaTrialIndex(0)
                setJaResponseTimes([])
                setJaCorrectCount(0)
                setStage('ja_run')
              }}
              className="rounded-full bg-[#3B82F6] px-10 py-3.5 font-bold text-white shadow-lg hover:bg-[#2563EB] hover:scale-105 transition-all text-base"
            >
              Start Joint Attention Probes (4 Trials) →
            </button>
          </div>
        )}

        {/* 4. JOINT ATTENTION RUN */}
        {stage === 'ja_run' && jaTrialIndex < JA_TRIALS.length && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-2xl text-center select-none">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Probe {jaTrialIndex + 1} of {JA_TRIALS.length}
              </span>
              <span className="text-xs font-semibold text-[#3B82F6]">Follow the guide's gaze & gesture</span>
            </div>

            <div className="my-8 p-6 rounded-3xl bg-gradient-to-b from-[#FEF3C7] to-[#FDF8EE] border border-[#FDE68A]">
              {/* Character Avatar */}
              <div className="mx-auto mb-6 flex flex-col items-center">
                <div className="h-24 w-24 rounded-full bg-white border-4 border-[#05B076] shadow-md flex items-center justify-center text-5xl">
                  {JA_TRIALS[jaTrialIndex].cueType === 'point' ? '🙋‍♀️' : '👀'}
                </div>
                <div className="mt-2 text-xs font-bold text-[#1E293B] bg-white/90 px-3 py-1 rounded-full shadow-sm">
                  {JA_TRIALS[jaTrialIndex].avatarEyeDir}
                </div>
              </div>

              {/* 3 Terracotta Jars */}
              <div className="flex justify-center gap-6">
                {[
                  {label: 'Jar A (Left)', emoji: '🏺'},
                  {label: 'Jar B (Center)', emoji: '🍯'},
                  {label: 'Jar C (Right)', emoji: '🏺'},
                ].map((pot, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePotSelect(idx)}
                    className="flex flex-col items-center rounded-2xl bg-white border-2 border-[#CBD5E1] p-5 shadow-sm hover:border-[#3B82F6] hover:bg-[#EFF6FF] active:scale-95 transition-all"
                  >
                    <span className="text-5xl">{pot.emoji}</span>
                    <span className="mt-2 text-xs font-semibold text-[#475569]">{pot.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. THEORY OF MIND INTRO */}
        {stage === 'tom_intro' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-xl text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EDE9FE] text-3xl">
              🧩
            </div>
            <h2 className="font-patrick text-3xl text-[#111827] mb-3">Task 2: Contextual Nuance & Pragmatic Language</h2>
            <p className="mx-auto max-w-lg text-sm text-[#475569] leading-relaxed mb-6">
              Assesses the ability to decode social context, implied emotional meaning, and pragmatic intent versus strictly literal word interpretation.
            </p>

            <button
              type="button"
              onClick={() => {
                playSound('tap')
                setTomTrialIndex(0)
                setTomScore(0)
                setStage('tom_run')
              }}
              className="rounded-full bg-[#3B82F6] px-10 py-3.5 font-bold text-white shadow-lg hover:bg-[#2563EB] hover:scale-105 transition-all text-base"
            >
              Start Nuance Decoding (4 Scenarios) →
            </button>
          </div>
        )}

        {/* 6. THEORY OF MIND RUN */}
        {stage === 'tom_run' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Scenario {tomTrialIndex + 1} of {TOM_VIGNETTES.length}
              </span>
              <span className="text-xs text-[#3B82F6] font-semibold">Social Context vs. Literal Words</span>
            </div>

            <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-6 mb-6">
              <p className="text-base text-[#1E293B] leading-relaxed italic mb-4">
                "{TOM_VIGNETTES[tomTrialIndex].scenario}"
              </p>
              <p className="text-sm font-bold text-[#0F172A]">
                {TOM_VIGNETTES[tomTrialIndex].question}
              </p>
            </div>

            <div className="space-y-3">
              {TOM_VIGNETTES[tomTrialIndex].options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleTomAnswer(opt.correct)}
                  className="w-full text-left rounded-xl border border-[#CBD5E1] bg-white p-4 text-sm font-medium text-[#334155] shadow-sm hover:border-[#3B82F6] hover:bg-[#EFF6FF] transition-all"
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 7. SENSORY THRESHOLD CALIBRATOR */}
        {stage === 'sensory_intro' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#05B076]/10 px-3 py-1 text-xs font-bold text-[#065F46] uppercase tracking-wider mb-2">
              Sensory Processing Measure (SPM-2 Mapped)
            </div>
            <h2 className="font-patrick text-3xl text-[#111827] mb-2">Task 3: Sensory Reactivity Landscape</h2>
            <p className="text-sm text-[#64748B] mb-8">
              Autistic brains experience environmental sensory input with profound qualitative intensity. Please calibrate the participant’s sensitivity thresholds below:
            </p>

            <div className="space-y-8 mb-10">
              <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-5">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-[#1E293B]">💡 Visual Sensitivity (Flicker & Glare)</label>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E]">{sensoryVisual}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={sensoryVisual}
                  onChange={(e) => setSensoryVisual(Number(e.target.value))}
                  className="w-full accent-[#05B076]"
                />
                <div className="flex justify-between text-[11px] text-[#64748B] mt-1">
                  <span>Comfortable with bright fluorescent light</span>
                  <span>Distressed by glare, flickers, crowded visuals</span>
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-5">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-[#1E293B]">🔊 Auditory Sensitivity (Multi-Source Noise)</label>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#FEE2E2] text-[#B91C1C]">{sensoryAuditory}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={sensoryAuditory}
                  onChange={(e) => setSensoryAuditory(Number(e.target.value))}
                  className="w-full accent-[#EF4444]"
                />
                <div className="flex justify-between text-[11px] text-[#64748B] mt-1">
                  <span>Easily ignores background murmurs</span>
                  <span>Physical discomfort at loud, sudden, echoing sounds</span>
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-5">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-[#1E293B]">👕 Tactile Sensitivity (Fabrics & Seams)</label>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#EDE9FE] text-[#6D28D9]">{sensoryTactile}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={sensoryTactile}
                  onChange={(e) => setSensoryTactile(Number(e.target.value))}
                  className="w-full accent-[#8B5CF6]"
                />
                <div className="flex justify-between text-[11px] text-[#64748B] mt-1">
                  <span>Wears any clothing without noticing</span>
                  <span>Severe reaction to tags, socks, or unexpected touches</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-2">Most Restorative Sensory Sanctuary</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Dim quiet corner with soft cushions',
                    'Deep pressure (weighted blanket / firm hug)',
                    'Rhythmic movement (rocking, swinging, pacing)',
                    'Auditory isolation (noise-cancelling headphones)',
                  ].map((sanctuary) => (
                    <button
                      key={sanctuary}
                      type="button"
                      onClick={() => setSensorySanctuaryPref(sanctuary)}
                      className={`p-3 rounded-xl text-xs font-semibold text-left border transition-all ${
                        sensorySanctuaryPref === sanctuary
                          ? 'border-[#05B076] bg-[#ECFDF5] text-[#065F46] shadow-sm'
                          : 'border-[#CBD5E1] bg-white text-[#475569] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      ✓ {sanctuary}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#F1F5F9]">
              <button
                type="button"
                onClick={() => { playSound('chime'); setStage('dccs_intro') }}
                className="rounded-full bg-[#05B076] px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#049A68] transition-all"
              >
                Proceed to Task 4: Set-Shifting Flexibility →
              </button>
            </div>
          </div>
        )}

        {/* 8. DCCS INTRO */}
        {stage === 'dccs_intro' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-xl text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#DCFCE7] text-3xl">
              🔄
            </div>
            <h2 className="font-patrick text-3xl text-[#111827] mb-3">Task 4: Dimensional Change Card Sort (Set-Shifting)</h2>
            <p className="mx-auto max-w-lg text-sm text-[#475569] leading-relaxed mb-6">
              Assesses cognitive flexibility, rule switching, and the need for predictability vs. fluid adaptation.
            </p>

            <div className="mx-auto max-w-md rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-6 text-left space-y-3 mb-8">
              <p className="text-xs text-[#334155] leading-normal">
                You will sort cards into matching boxes. The rule will start by matching <strong>COLOR</strong>, but pay close attention—the rule will switch to matching <strong>SHAPE</strong>!
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                playSound('tap')
                setDccsTrialIndex(0)
                setDccsPerseverations(0)
                setStage('dccs_run')
              }}
              className="rounded-full bg-[#05B076] px-10 py-3.5 font-bold text-white shadow-lg hover:bg-[#049A68] hover:scale-105 transition-all text-base"
            >
              Start Set-Shifting Trials (6 Trials) →
            </button>
          </div>
        )}

        {/* 9. DCCS RUN */}
        {stage === 'dccs_run' && dccsTrialIndex < DCCS_CARDS.length && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-2xl text-center select-none">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Trial {dccsTrialIndex + 1} of {DCCS_CARDS.length}
              </span>
              <span className="text-sm font-bold px-3 py-1 rounded-full bg-[#DCFCE7] text-[#15803D] uppercase">
                Active Rule: Match by {dccsRule.toUpperCase()}
              </span>
            </div>

            {/* Stimulus Card */}
            <div className="my-8 mx-auto w-48 h-48 rounded-3xl bg-[#F8FAFC] border-4 border-[#CBD5E1] shadow-lg flex flex-col items-center justify-center">
              <span className={`text-6xl ${DCCS_CARDS[dccsTrialIndex].color === 'red' ? 'text-[#DC2626]' : 'text-[#2563EB]'}`}>
                {DCCS_CARDS[dccsTrialIndex].shape === 'star' ? '★' : '●'}
              </span>
              <span className="mt-2 text-xs font-bold uppercase tracking-wider text-[#64748B]">
                {DCCS_CARDS[dccsTrialIndex].color} {DCCS_CARDS[dccsTrialIndex].shape}
              </span>
            </div>

            {/* Target Bins */}
            <div className="flex justify-center gap-6 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => handleDccsSort(0)}
                className="flex-1 rounded-2xl border-2 border-[#CBD5E1] bg-white p-5 shadow-md hover:border-[#05B076] active:scale-95 transition-all text-center"
              >
                <div className="text-4xl text-[#DC2626]">●</div>
                <div className="text-xs font-bold text-[#475569] mt-1">Red Circle Bin</div>
              </button>
              <button
                type="button"
                onClick={() => handleDccsSort(1)}
                className="flex-1 rounded-2xl border-2 border-[#CBD5E1] bg-white p-5 shadow-md hover:border-[#05B076] active:scale-95 transition-all text-center"
              >
                <div className="text-4xl text-[#2563EB]">★</div>
                <div className="text-xs font-bold text-[#475569] mt-1">Blue Star Bin</div>
              </button>
            </div>
          </div>
        )}

        {/* 10. SCQ DIMENSIONAL QUESTIONNAIRE (12 ITEMS) */}
        {stage === 'scq' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#3B82F6]/10 px-3 py-1 text-xs font-bold text-[#1D4ED8] uppercase tracking-wider mb-2">
              Social Communication Questionnaire (SCQ Standard)
            </div>
            <h2 className="font-patrick text-3xl text-[#111827] mb-2">Developmental Social & Behavioral History</h2>
            <p className="text-sm text-[#64748B] mb-8">
              Please answer whether these behaviors describe the participant across everyday settings:
            </p>

            <div className="space-y-4">
              {SCQ_QUESTIONS.map((q, idx) => (
                <div key={q.id} className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[#1E293B]">
                    {idx + 1}. {q.text}
                  </p>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        playSound('tap')
                        setScqAnswers((prev) => ({...prev, [q.id]: 0}))
                      }}
                      className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all ${
                        scqAnswers[q.id] === 0
                          ? 'bg-[#64748B] text-white border-[#64748B]'
                          : 'bg-white text-[#475569] border-[#CBD5E1] hover:bg-[#F1F5F9]'
                      }`}
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playSound('tap')
                        setScqAnswers((prev) => ({...prev, [q.id]: 1}))
                      }}
                      className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all ${
                        scqAnswers[q.id] === 1
                          ? 'bg-[#3B82F6] text-white border-[#3B82F6] shadow-sm'
                          : 'bg-white text-[#475569] border-[#CBD5E1] hover:bg-[#F1F5F9]'
                      }`}
                    >
                      Yes
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex justify-between items-center pt-6 border-t border-[#F1F5F9]">
              <div className="text-xs text-[#64748B]">
                {Object.keys(scqAnswers).length} of {SCQ_QUESTIONS.length} items completed
              </div>
              <button
                type="button"
                onClick={submitAssessment}
                className="rounded-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all"
              >
                Synthesize PRISM Clinical Report →
              </button>
            </div>
          </div>
        )}

        {/* 11. ANALYZING LOADER */}
        {stage === 'analyzing' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-16 shadow-xl text-center">
            <div className="mx-auto mb-6 h-14 w-14 animate-spin rounded-full border-4 border-[#3B82F6]/20 border-t-[#3B82F6]" />
            <h2 className="font-patrick text-3xl text-[#111827] mb-2">Synthesizing PRISM Profile…</h2>
            <p className="text-sm text-[#64748B] max-w-md mx-auto">
              Mapping joint attention latency, pragmatic Theory of Mind nuance, sensory thresholds, and cognitive set-shifting flexibility against ADOS-2 and SPM-2 clinical standards…
            </p>
          </div>
        )}

        {/* 12. CLINICAL REPORT */}
        {stage === 'report' && reportData && (
          <div className="space-y-8">
            <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-2xl print:border-none print:shadow-none">
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-[#E2E8F0] gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#3B82F6]">Official Clinical Assessment</div>
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

              {/* Profile Banner */}
              <div className="my-6 grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-4 text-xs">
                <div><span className="text-[#64748B] block">Participant:</span><strong>{reportData.profile.childName}</strong></div>
                <div><span className="text-[#64748B] block">Age / Communication:</span><strong>{reportData.profile.childAge} yrs • {reportData.profile.communicationStyle}</strong></div>
                <div><span className="text-[#64748B] block">Evaluated By:</span><strong>{reportData.profile.informantRole}</strong></div>
                <div><span className="text-[#64748B] block">Norming Framework:</span><strong>ADOS-2 & SPM-2</strong></div>
              </div>

              {/* Classification Banner */}
              <div className="rounded-2xl bg-gradient-to-r from-[#DBEAFE] to-[#DCFCE7] border border-[#BFDBFE] p-5 mb-8">
                <div className="text-xs font-bold uppercase tracking-wider text-[#1E40AF]">Diagnostic Classification & Support Tier</div>
                <div className="text-xl md:text-2xl font-bold text-[#0F172A] mt-1">{reportData.stats.classification}</div>
                <div className="text-xs font-semibold text-[#1D4ED8] mt-1">{reportData.stats.supportLevel}</div>
                <p className="text-xs text-[#475569] mt-2 leading-relaxed">{reportData.clinicalSummary}</p>
              </div>

              {/* PRISM Multi-Axial Indices */}
              <h3 className="font-patrick text-2xl text-[#0F172A] mb-4">PRISM Multi-Axial Profile</h3>
              <div className="space-y-4 mb-8">
                {reportData.indices.map((idx: any) => (
                  <div key={idx.name} className="rounded-xl border border-[#E2E8F0] p-4 bg-white">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-semibold text-[#1E293B]">{idx.name}</span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8]">
                        Score: {idx.score}/100 ({idx.status})
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                      <div
                        className="h-full bg-[#3B82F6] transition-all"
                        style={{width: `${idx.score}%`}}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Strengths */}
              <div className="my-8 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] p-6">
                <h4 className="font-patrick text-xl text-[#065F46] mb-3">★ Neurodivergent Strengths & Passions</h4>
                <ul className="space-y-2 text-xs text-[#064E3B] list-disc list-inside">
                  {reportData.strengths.map((str: string, i: number) => (
                    <li key={i}>{str}</li>
                  ))}
                </ul>
              </div>

              {/* Sensory Diet Blueprint */}
              <div className="my-8 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] p-6">
                <h4 className="font-patrick text-xl text-[#92400E] mb-3">🌿 Individualized Sensory Diet Blueprint</h4>
                <p className="text-xs text-[#78350F] leading-relaxed mb-3">
                  Optimal regulation sanctuary: <strong>{sensorySanctuaryPref}</strong>. Visual sensitivity calibrated at {sensoryVisual}/10; Auditory sensitivity calibrated at {sensoryAuditory}/10.
                </p>
                <ul className="space-y-2 text-xs text-[#92400E] list-disc list-inside">
                  <li>Incorporate 5 minutes of deep proprioceptive input (wall push-ups, weighted lap pad) prior to seated cognitive tasks.</li>
                  <li>Provide noise-cancelling headphones during acoustic transitions (hallways, school cafeteria, bus rides).</li>
                  <li>Avoid sudden multi-sensory demands; allow processing pauses when communicating in bright or loud spaces.</li>
                </ul>
              </div>

              {/* School Accommodations */}
              <div className="my-8 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] p-6">
                <h4 className="font-patrick text-xl text-[#1E40AF] mb-3">📋 School & Environmental Accommodations</h4>
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
