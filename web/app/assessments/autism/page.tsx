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

// Gentle Web Audio Synthesizer: Organic kalimba, chime, marimba, and celestial glass tones
function playSound(type: 'hit' | 'chime' | 'tap' | 'complete' | 'sensory') {
  if (typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    const now = ctx.currentTime

    if (type === 'hit') {
      // Soft resonant bell (E5 -> B5)
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(659.25, now)
      osc.frequency.exponentialRampToValueAtTime(987.77, now + 0.1)
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.2)
    } else if (type === 'sensory') {
      // Calming binaural hum (warm soothing tone)
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(261.63, now) // Middle C
      osc.frequency.linearRampToValueAtTime(329.63, now + 0.3) // E4
      gain.gain.setValueAtTime(0.05, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.38)
    } else if (type === 'complete' || type === 'chime') {
      // Gentle harp chord (C-E-G-C)
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
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
      // Organic water droplet tap
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, now)
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

// Courtyard Guide Avatar (Aria): Expressive eyes and directional gesture
function CourtyardGuideAvatar({gaze, isPointing}: {gaze: 'left' | 'center' | 'right'; isPointing: boolean}) {
  // Eye pupil offset based on gaze direction
  const pupilOffsetX = gaze === 'left' ? -4 : gaze === 'right' ? 4 : 0
  const pupilOffsetY = gaze === 'center' ? 3 : 0

  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 140 140" className="w-32 h-32 md:w-36 md:h-36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="guideGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.8"/>
            <stop offset="100%" stopColor="#E0F2FE" stopOpacity="0"/>
          </radialGradient>
          <linearGradient id="skinTone" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FED7AA"/>
            <stop offset="100%" stopColor="#FDBA74"/>
          </linearGradient>
          <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B"/>
            <stop offset="100%" stopColor="#0F172A"/>
          </linearGradient>
          <linearGradient id="kurtaTeal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0D9488"/>
            <stop offset="100%" stopColor="#0F766E"/>
          </linearGradient>
        </defs>

        {/* Halo Aura */}
        <circle cx="70" cy="70" r="64" fill="url(#guideGlow)"/>

        {/* Shoulders & Kurta */}
        <path d="M 32 130 C 32 105 50 96 70 96 C 90 96 108 105 108 130 Z" fill="url(#kurtaTeal)"/>
        {/* Kurta Collar Embroidery */}
        <path d="M 64 96 L 70 110 L 76 96" stroke="#FEF08A" strokeWidth="2" strokeLinecap="round"/>

        {/* Head & Neck */}
        <path d="M 62 86 L 62 98 L 78 98 L 78 86 Z" fill="url(#skinTone)"/>
        <ellipse cx="70" cy="62" rx="26" ry="30" fill="url(#skinTone)"/>

        {/* Lush Black Hair */}
        <path d="M 44 54 C 44 32 54 22 70 22 C 86 22 96 32 96 54 C 96 60 92 68 92 68 C 92 50 86 42 70 42 C 54 42 48 50 48 68 C 48 68 44 60 44 54 Z" fill="url(#hairGrad)"/>
        {/* Soft Ear Piercings / Small Stud */}
        <circle cx="43" cy="64" r="1.5" fill="#F59E0B"/>
        <circle cx="97" cy="64" r="1.5" fill="#F59E0B"/>

        {/* Eyebrows */}
        <path d="M 52 48 Q 58 45 64 48" stroke="#1E293B" strokeWidth="2" strokeLinecap="round"/>
        <path d="M 76 48 Q 82 45 88 48" stroke="#1E293B" strokeWidth="2" strokeLinecap="round"/>

        {/* Almond Eyes */}
        <ellipse cx="58" cy="56" rx="6" ry="4" fill="#FFFFFF"/>
        <ellipse cx="82" cy="56" rx="6" ry="4" fill="#FFFFFF"/>

        {/* Animated Pupils (Follows Gaze) */}
        <circle cx={58 + pupilOffsetX} cy={56 + pupilOffsetY} r="2.8" fill="#0F172A"/>
        <circle cx={57 + pupilOffsetX} cy={55 + pupilOffsetY} r="1" fill="#FFFFFF"/>
        <circle cx={82 + pupilOffsetX} cy={56 + pupilOffsetY} r="2.8" fill="#0F172A"/>
        <circle cx={81 + pupilOffsetX} cy={55 + pupilOffsetY} r="1" fill="#FFFFFF"/>

        {/* Gentle Nose & Warm Smile */}
        <path d="M 70 58 L 68 66 L 72 66" stroke="#EA580C" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
        <path d="M 64 74 Q 70 78 76 74" stroke="#9A3412" strokeWidth="2" strokeLinecap="round"/>

        {/* Pointing Arm / Hand (When cueType === 'point') */}
        {isPointing && (
          gaze === 'left' ? (
            <path d="M 44 110 Q 24 100 12 90" stroke="url(#skinTone)" strokeWidth="8" strokeLinecap="round"/>
          ) : (
            <path d="M 96 110 Q 116 100 128 90" stroke="url(#skinTone)" strokeWidth="8" strokeLinecap="round"/>
          )
        )}
      </svg>
      <div className="mt-2 text-xs font-semibold text-[#0F172A] bg-white/95 px-3 py-1 rounded-full shadow-sm border border-[#E2E8F0]">
        Guide Aria • {isPointing ? 'Pointing & Looking' : 'Looking with Eye Gaze'}
      </div>
    </div>
  )
}

// Handcrafted Artisanal Courtyard Vessels
function ArtisanVesselSvg({type, isSelected}: {type: 'A' | 'B' | 'C'; isSelected?: boolean}) {
  if (type === 'A') {
    // Left: Royal Indigo Lotus Urn
    return (
      <svg viewBox="0 0 100 120" className="w-20 h-24 md:w-24 md:h-28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="urnIndigo" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6"/>
            <stop offset="50%" stopColor="#1D4ED8"/>
            <stop offset="100%" stopColor="#1E3A8A"/>
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="110" rx="26" ry="6" fill="#CBD5E1"/>
        <path d="M 38 108 L 38 98 L 62 98 L 62 108 Z" fill="#64748B"/>
        <path d="M 32 98 C 20 80 18 52 34 38 C 42 30 58 30 66 38 C 82 52 80 80 68 98 Z" fill="url(#urnIndigo)"/>
        <ellipse cx="50" cy="38" rx="14" ry="4" fill="#93C5FD"/>
        <path d="M 44 38 L 44 24 L 56 24 L 56 38 Z" fill="url(#urnIndigo)"/>
        <ellipse cx="50" cy="24" rx="10" ry="3" fill="#FBBF24"/>
        {/* Lotus Petal Etching */}
        <path d="M 50 50 Q 42 66 50 82 Q 58 66 50 50 Z" stroke="#93C5FD" strokeWidth="1.5" fill="none"/>
        <path d="M 42 58 Q 36 70 44 80" stroke="#93C5FD" strokeWidth="1.2" fill="none"/>
        <path d="M 58 58 Q 64 70 56 80" stroke="#93C5FD" strokeWidth="1.2" fill="none"/>
      </svg>
    )
  }

  if (type === 'B') {
    // Center: Terracotta Sunburst Amphora
    return (
      <svg viewBox="0 0 100 120" className="w-20 h-24 md:w-24 md:h-28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="amphoraTerra" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FB923C"/>
            <stop offset="60%" stopColor="#EA580C"/>
            <stop offset="100%" stopColor="#C2410C"/>
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="110" rx="24" ry="6" fill="#CBD5E1"/>
        <path d="M 40 108 L 40 100 L 60 100 L 60 108 Z" fill="#9A3412"/>
        <path d="M 30 100 C 16 82 18 50 36 38 C 42 34 58 34 64 38 C 82 50 84 82 70 100 Z" fill="url(#amphoraTerra)"/>
        {/* Side Handles */}
        <path d="M 28 48 C 14 54 14 74 26 80" stroke="#9A3412" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <path d="M 72 48 C 86 54 86 74 74 80" stroke="#9A3412" strokeWidth="4" fill="none" strokeLinecap="round"/>
        {/* Neck & Lip */}
        <path d="M 42 38 L 42 22 L 58 22 L 58 38 Z" fill="url(#amphoraTerra)"/>
        <ellipse cx="50" cy="22" rx="11" ry="3" fill="#FED7AA"/>
        {/* Sunburst Motif */}
        <circle cx="50" cy="68" r="6" fill="#FEF08A"/>
        <circle cx="50" cy="68" r="10" stroke="#FEF08A" strokeWidth="1" strokeDasharray="3 3"/>
      </svg>
    )
  }

  // Right: Emerald Filigree Vase
  return (
    <svg viewBox="0 0 100 120" className="w-20 h-24 md:w-24 md:h-28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vaseEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399"/>
          <stop offset="50%" stopColor="#059669"/>
          <stop offset="100%" stopColor="#065F46"/>
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="110" rx="22" ry="5" fill="#CBD5E1"/>
      <path d="M 40 108 L 40 98 L 60 98 L 60 108 Z" fill="#064E3B"/>
      <path d="M 34 98 C 22 84 24 64 36 50 C 42 42 58 42 64 50 C 76 64 78 84 66 98 Z" fill="url(#vaseEmerald)"/>
      {/* Tall Slender Neck */}
      <path d="M 44 50 L 44 26 L 56 26 L 56 50 Z" fill="url(#vaseEmerald)"/>
      <ellipse cx="50" cy="26" rx="9" ry="3" fill="#A7F3D0"/>
      <ellipse cx="50" cy="22" rx="12" ry="3" fill="#FBBF24"/>
      {/* Gold Ring Band */}
      <rect x="42" y="38" width="16" height="3" fill="#FBBF24" rx="1.5"/>
    </svg>
  )
}

// Jewel-Tone Artifacts for Cognitive Set-Shifting (DCCS Task)
function JewelCardSvg({color, shape}: {color: 'red' | 'blue' | 'green'; shape: 'star' | 'circle' | 'moon'}) {
  const colorFill = color === 'red' ? '#EF4444' : color === 'blue' ? '#3B82F6' : '#10B981'
  const colorGlow = color === 'red' ? '#FEE2E2' : color === 'blue' ? '#DBEAFE' : '#D1FAE5'

  return (
    <div className="relative flex items-center justify-center p-3 rounded-2xl bg-white border-2 border-[#CBD5E1] shadow-md hover:shadow-lg transition-all">
      <svg viewBox="0 0 80 80" className="w-16 h-16 md:w-20 md:h-20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="36" fill={colorGlow}/>
        {shape === 'circle' && (
          <circle cx="40" cy="40" r="22" fill={colorFill} stroke="#FFFFFF" strokeWidth="2.5"/>
        )}
        {shape === 'star' && (
          <path
            d="M 40 16 L 46 32 L 63 32 L 49 42 L 54 58 L 40 48 L 26 58 L 31 42 L 17 32 L 34 32 Z"
            fill={colorFill}
            stroke="#FFFFFF"
            strokeWidth="2"
          />
        )}
        {shape === 'moon' && (
          <path
            d="M 48 18 C 30 18 22 34 22 42 C 22 56 34 62 48 62 C 54 62 58 60 62 58 C 48 54 42 42 46 26 C 47 22 48 20 48 18 Z"
            fill={colorFill}
            stroke="#FFFFFF"
            strokeWidth="2"
          />
        )}
      </svg>
    </div>
  )
}

// -------------------------------------------------------------
// SOCIAL COMMUNICATION QUESTIONNAIRE (SCQ - 12 ITEMS)
// -------------------------------------------------------------
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
    {cueType: 'gaze' as const, targetPot: 1, avatarGaze: 'center' as const, isPointing: false, title: 'Trial 1: Eye Gaze to Center Amphora'},
    {cueType: 'point' as const, targetPot: 0, avatarGaze: 'left' as const, isPointing: true, title: 'Trial 2: Point & Gaze to Left Lotus Urn'},
    {cueType: 'gaze' as const, targetPot: 2, avatarGaze: 'right' as const, isPointing: false, title: 'Trial 3: Subtle Eye Shift to Right Emerald Vase'},
    {cueType: 'point' as const, targetPot: 2, avatarGaze: 'right' as const, isPointing: true, title: 'Trial 4: Direct Point to Right Emerald Vase'},
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
  const [sensorySanctuaryPref, setSensorySanctuaryPref] = useState('Dim quiet corner with soft cushions & weighted blanket')

  // Task 4: DCCS Set-Shifting (6 trials)
  const [dccsTrialIndex, setDccsTrialIndex] = useState(0)
  const [dccsRule, setDccsRule] = useState<'color' | 'shape'>('color')
  const [dccsPerseverations, setDccsPerseverations] = useState(0)
  const [dccsResponseTimes, setDccsResponseTimes] = useState<number[]>([])
  const dccsStartRef = useRef<number>(0)
  const DCCS_CARDS: Array<{color: 'red' | 'blue'; shape: 'star' | 'circle'; targetColorMatch: number; targetShapeMatch: number}> = [
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
    <main data-no-listen="true" className="min-h-screen bg-[#FDFBF7] py-10 px-4 font-poppins text-[#1F2937]">
      <div className="mx-auto max-w-4xl">
        {/* Navigation & Clinical Standard Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between text-sm text-[#78716C] gap-2">
          <div className="flex items-center gap-2">
            <Link href="/assessments" prefetch={false} className="hover:text-[#0D9488] transition-colors font-semibold">← All Assessments</Link>
            <span>/</span>
            <span className="font-semibold text-[#111827]">Manas PRISM™ Autism Profile</span>
          </div>
          <span className="rounded-full bg-[#0D9488]/10 border border-[#0D9488]/30 px-3.5 py-1 font-semibold text-[#0F766E] text-xs">
            Gold Standard ADOS-2, SPM-2 & SCQ Mapped
          </span>
        </div>

        {/* 1. INTRO / OVERVIEW & CLINICAL METHODOLOGY */}
        {stage === 'intro' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-xl">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#0D9488]/15 px-3.5 py-1 text-xs font-bold text-[#0F766E] uppercase tracking-wider mb-4 border border-[#0D9488]/30">
                  Pediatric Neurodevelopmental Battery • Free Open Access Beta
                </div>
                <h1 className="font-patrick text-4xl md:text-5xl text-[#0F172A] leading-tight mb-4">
                  Manas PRISM™ <span className="text-[#0D9488]">Autism Social & Sensory Profile</span>
                </h1>
                <p className="text-base text-[#475569] leading-relaxed mb-6">
                  <strong>Manas PRISM™</strong> evaluates the multidimensional landscape of autism, social communication, and sensory processing. Grounded in ADOS-2 observational dimensions, SPM-2 sensory modulation, and SCQ developmental markers, it assesses joint attention referencing, contextual Theory of Mind, sensory thresholds, and cognitive set-shifting through respectful, gamified scenarios.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                  <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-center">
                    <div className="font-bold text-lg text-[#0D9488]">Joint Attention</div>
                    <div className="text-xs text-[#64748B]">Social Referencing Probes</div>
                  </div>
                  <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-center">
                    <div className="font-bold text-lg text-[#F59E0B]">Sensory Map</div>
                    <div className="text-xs text-[#64748B]">Audiovisual Thresholds</div>
                  </div>
                  <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-center col-span-2 sm:col-span-1">
                    <div className="font-bold text-lg text-[#3B82F6]">Clinical Report</div>
                    <div className="text-xs text-[#64748B]">Sensory Diet & IEP Plan</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => { playSound('tap'); setStage('profile') }}
                    className="rounded-full bg-gradient-to-r from-[#0D9488] to-[#0F766E] px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-[#0D9488]/25 hover:shadow-xl hover:scale-[1.02] transition-all"
                  >
                    Start Assessment →
                  </button>
                  <span className="text-xs text-[#64748B]">
                    100% Free during Open Access • Full 4-domain gamified battery + downloadable clinical profile and sensory accommodations.
                  </span>
                </div>
              </div>

              <div className="w-full md:w-80 shrink-0 text-center">
                <div className="relative mx-auto w-64 h-64 rounded-3xl bg-gradient-to-tr from-[#CCFBF1] to-[#E0F2FE] p-4 flex items-center justify-center shadow-inner border border-[#99F6E4]">
                  <img
                    src="/decor/itw/itw-autism-sticker.webp"
                    alt="PRISM Autism Profile"
                    loading="lazy"
                    className="max-h-full max-w-full object-contain filter drop-shadow-md"
                  />
                </div>
                <p className="mt-3 text-xs text-[#78716C] italic font-medium">
                  Aligned with ADOS-2, CARS-2 & SPM-2 Dimensions
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. PARTICIPANT DEMOGRAPHICS */}
        {stage === 'profile' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-xl">
            <h2 className="font-patrick text-3xl text-[#111827] mb-2">Participant Social & Sensory Baseline</h2>
            <p className="text-sm text-[#64748B] mb-6">
              Captures communication preferences and environmental triggers before initiating interactive modules.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">Child / Participant Name *</label>
                <input
                  type="text"
                  value={profile.childName}
                  onChange={(e) => setProfile({...profile, childName: e.target.value})}
                  placeholder="e.g. Diya Sengupta"
                  className="w-full rounded-xl border border-[#CBD5E1] p-3 text-sm focus:border-[#0D9488] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">Chronological Age *</label>
                <input
                  type="number"
                  min="3"
                  max="18"
                  value={profile.childAge}
                  onChange={(e) => setProfile({...profile, childAge: Number(e.target.value)})}
                  className="w-full rounded-xl border border-[#CBD5E1] p-3 text-sm focus:border-[#0D9488] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">Expressive Communication Style</label>
                <select
                  value={profile.communicationStyle}
                  onChange={(e) => setProfile({...profile, communicationStyle: e.target.value})}
                  className="w-full rounded-xl border border-[#CBD5E1] p-3 text-sm focus:border-[#0D9488] focus:outline-none bg-white"
                >
                  <option>Fluent verbal speech</option>
                  <option>Phrase speech (2–4 word utterances)</option>
                  <option>Single words with gestures</option>
                  <option>AAC device / Picture Communication Symbols (PECS)</option>
                  <option>Non-speaking / Gestural communication</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">Informant Role</label>
                <select
                  value={profile.informantRole}
                  onChange={(e) => setProfile({...profile, informantRole: e.target.value})}
                  className="w-full rounded-xl border border-[#CBD5E1] p-3 text-sm focus:border-[#0D9488] focus:outline-none bg-white"
                >
                  <option>Parent / Primary Caregiver</option>
                  <option>Speech-Language Pathologist (SLP)</option>
                  <option>Occupational Therapist (OT)</option>
                  <option>Special Educator / Teacher</option>
                  <option>Self-Advocate / Adult</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">Primary Sensory Sensitivities & Calming Strategies</label>
                <textarea
                  rows={2}
                  value={profile.primarySensitivities}
                  onChange={(e) => setProfile({...profile, primarySensitivities: e.target.value})}
                  placeholder="e.g. Sensitive to fluorescent flicker and blender sounds; calmed by deep pressure or quiet swing."
                  className="w-full rounded-xl border border-[#CBD5E1] p-3 text-sm focus:border-[#0D9488] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#F1F5F9]">
              <button
                type="button"
                onClick={() => setStage('intro')}
                className="text-sm font-semibold text-[#64748B] hover:text-[#111827]"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={!profile.childName.trim()}
                onClick={() => { playSound('chime'); setStage('ja_intro') }}
                className="rounded-full bg-[#0D9488] px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-[#0F766E] disabled:opacity-50 transition-all"
              >
                Begin Task 1: Courtyard Social Referencing →
              </button>
            </div>
          </div>
        )}

        {/* 3. JOINT ATTENTION INTRO */}
        {stage === 'ja_intro' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-xl text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#CCFBF1] to-[#E0F2FE] p-2 border border-[#99F6E4] shadow-md">
              <CourtyardGuideAvatar gaze="center" isPointing={false}/>
            </div>
            <h2 className="font-patrick text-3xl text-[#111827] mb-3">Task 1: Courtyard Social Referencing (Joint Attention)</h2>
            <p className="mx-auto max-w-lg text-sm text-[#475569] leading-relaxed mb-6">
              Joint attention—the natural human reflex to follow another person’s eye gaze and pointing gesture—is a cornerstone of early social reciprocity (ADOS-2 Module 1–3).
            </p>

            <div className="mx-auto max-w-md rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-6 text-left space-y-3 mb-8">
              <p className="text-xs text-[#334155] leading-normal font-semibold">
                Meet <strong className="text-[#0D9488]">Aria</strong> in the courtyard veranda. When Aria looks or points toward an artisanal vessel, tap the vessel she is showing you!
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
              className="rounded-full bg-[#0D9488] px-10 py-3.5 font-bold text-white shadow-lg hover:bg-[#0F766E] hover:scale-105 transition-all text-base"
            >
              Start Courtyard Probes (4 Trials) →
            </button>
          </div>
        )}

        {/* 4. JOINT ATTENTION RUN */}
        {stage === 'ja_run' && jaTrialIndex < JA_TRIALS.length && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-2xl text-center select-none">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] bg-[#F1F5F9] px-3 py-1 rounded-full">
                Observation {jaTrialIndex + 1} of {JA_TRIALS.length}
              </span>
              <span className="text-xs font-semibold text-[#0D9488]">
                {JA_TRIALS[jaTrialIndex].title}
              </span>
            </div>

            {/* Courtyard Veranda Scene */}
            <div className="my-8 p-6 md:p-10 rounded-3xl bg-gradient-to-b from-[#FEF3C7]/40 via-[#FDFBF7] to-[#F1F5F9] border border-[#FDE68A]/60 shadow-inner">
              {/* Illustrated Guide Character */}
              <div className="mx-auto mb-8">
                <CourtyardGuideAvatar
                  gaze={JA_TRIALS[jaTrialIndex].avatarGaze}
                  isPointing={JA_TRIALS[jaTrialIndex].isPointing}
                />
              </div>

              {/* 3 Artisanal Vessels on Pedestals */}
              <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                {[
                  {type: 'A' as const, label: 'Lotus Urn', desc: 'Pedestal A'},
                  {type: 'B' as const, label: 'Amphora', desc: 'Pedestal B'},
                  {type: 'C' as const, label: 'Willow Vase', desc: 'Pedestal C'},
                ].map((pot, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePotSelect(idx)}
                    className="flex flex-col items-center justify-between rounded-2xl bg-white border-2 border-[#CBD5E1] p-4 shadow-sm hover:border-[#0D9488] hover:bg-[#F0FDFA] active:scale-95 transition-all group"
                  >
                    <ArtisanVesselSvg type={pot.type}/>
                    <div className="mt-3 text-center">
                      <span className="block text-xs font-bold text-[#1E293B] group-hover:text-[#0D9488]">
                        {pot.label}
                      </span>
                      <span className="text-[10px] text-[#64748B]">{pot.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. THEORY OF MIND INTRO */}
        {stage === 'tom_intro' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-xl text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#EDE9FE] border border-[#DDD6FE] shadow-md">
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-[#7C3AED]" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
              </svg>
            </div>
            <h2 className="font-patrick text-3xl text-[#111827] mb-3">Task 2: Social Pragmatics & Contextual Nuance</h2>
            <p className="mx-auto max-w-lg text-sm text-[#475569] leading-relaxed mb-6">
              Assesses Theory of Mind (ToM)—distinguishing between what is said literally and what is meant socially, such as indirect requests, emotional masking, and idioms.
            </p>

            <button
              type="button"
              onClick={() => {
                playSound('tap')
                setTomTrialIndex(0)
                setTomScore(0)
                setStage('tom_run')
              }}
              className="rounded-full bg-[#0D9488] px-10 py-3.5 font-bold text-white shadow-lg hover:bg-[#0F766E] hover:scale-105 transition-all text-base"
            >
              Start Story Vignettes (4 Scenarios) →
            </button>
          </div>
        )}

        {/* 6. THEORY OF MIND RUN */}
        {stage === 'tom_run' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] bg-[#F1F5F9] px-3 py-1 rounded-full">
                Vignette {tomTrialIndex + 1} of {TOM_VIGNETTES.length}
              </span>
              <span className="text-xs font-semibold text-[#0D9488]">Pragmatic Language Reasoning</span>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] mb-8">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[#0D9488] uppercase tracking-wider">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                Story Context
              </div>
              <p className="text-base text-[#1E293B] leading-relaxed italic mb-4 font-serif">
                "{TOM_VIGNETTES[tomTrialIndex].scenario}"
              </p>
              <h3 className="text-sm font-bold text-[#0F172A]">
                {TOM_VIGNETTES[tomTrialIndex].question}
              </h3>
            </div>

            <div className="space-y-3">
              {TOM_VIGNETTES[tomTrialIndex].options.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleTomAnswer(opt.correct)}
                  className="w-full text-left p-4 rounded-xl border border-[#CBD5E1] bg-white hover:border-[#0D9488] hover:bg-[#F0FDFA] transition-all flex items-center justify-between text-xs font-semibold text-[#334155]"
                >
                  <span>{opt.text}</span>
                  <span className="text-[#0D9488] font-bold text-sm">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 7. SENSORY CALIBRATION INTRO */}
        {stage === 'sensory_intro' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-xl text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] shadow-md">
              <svg viewBox="0 0 24 24" className="w-10 h-10 text-[#D97706]" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            </div>
            <h2 className="font-patrick text-3xl text-[#111827] mb-3">Task 3: Sensory Modulation & Reactivity Map (SPM-2)</h2>
            <p className="mx-auto max-w-lg text-sm text-[#475569] leading-relaxed mb-6">
              Captures sensory thresholds across Visual, Auditory, and Tactile channels, identifying specific overload triggers and restorative sanctuary needs.
            </p>

            <button
              type="button"
              onClick={() => {
                playSound('sensory')
                setStage('sensory_run')
              }}
              className="rounded-full bg-[#0D9488] px-10 py-3.5 font-bold text-white shadow-lg hover:bg-[#0F766E] hover:scale-105 transition-all text-base"
            >
              Open Sensory Calibration Lab →
            </button>
          </div>
        )}

        {/* 8. SENSORY CALIBRATION RUN */}
        {stage === 'sensory_run' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">SPM-2 Sensory Profile</span>
                <h2 className="font-patrick text-3xl text-[#111827]">Tactile & Environmental Calibration</h2>
              </div>
              <span className="text-xs font-semibold bg-[#F1F5F9] text-[#475569] px-3 py-1.5 rounded-full">
                Interactive Sliders
              </span>
            </div>

            <div className="space-y-8">
              {/* Visual Sensitivity Slider */}
              <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"/>
                    Visual & Luminance Reactivity
                  </span>
                  <span className="text-xs font-mono font-bold text-[#0D9488] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                    {sensoryVisual} / 10
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mb-3">
                  1 = Enjoys bright dynamic light • 10 = Severe discomfort / headaches from fluorescent tubes and glare
                </p>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={sensoryVisual}
                  onChange={(e) => {
                    setSensoryVisual(Number(e.target.value))
                    playSound('tap')
                  }}
                  className="w-full accent-[#0D9488] cursor-pointer"
                />
              </div>

              {/* Auditory Sensitivity Slider */}
              <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"/>
                    Auditory & Acoustic Resonance Reactivity
                  </span>
                  <span className="text-xs font-mono font-bold text-[#0D9488] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                    {sensoryAuditory} / 10
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mb-3">
                  1 = Comfortable in busy multi-talker rooms • 10 = Covers ears at sudden sounds (blender, hand dryer, school bell)
                </p>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={sensoryAuditory}
                  onChange={(e) => {
                    setSensoryAuditory(Number(e.target.value))
                    playSound('sensory')
                  }}
                  className="w-full accent-[#0D9488] cursor-pointer"
                />
              </div>

              {/* Tactile Sensitivity Slider */}
              <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400"/>
                    Tactile & Clothing Seam Sensitivity
                  </span>
                  <span className="text-xs font-mono font-bold text-[#0D9488] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                    {sensoryTactile} / 10
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mb-3">
                  1 = Tolerates any fabric or tag • 10 = Rejects socks with seams, tight waistbands, or sticky textures
                </p>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={sensoryTactile}
                  onChange={(e) => {
                    setSensoryTactile(Number(e.target.value))
                    playSound('tap')
                  }}
                  className="w-full accent-[#0D9488] cursor-pointer"
                />
              </div>

              {/* Sensory Sanctuary Comfort Environment */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-2">
                  Restorative Sensory Sanctuary Preference
                </label>
                <select
                  value={sensorySanctuaryPref}
                  onChange={(e) => setSensorySanctuaryPref(e.target.value)}
                  className="w-full rounded-xl border border-[#CBD5E1] p-3 text-xs focus:border-[#0D9488] focus:outline-none bg-white font-semibold"
                >
                  <option>Dim quiet corner with soft cushions & weighted blanket</option>
                  <option>Outdoor garden space with gentle breeze and tree shade</option>
                  <option>Noise-cancelling headphones playing rhythmic brown noise</option>
                  <option>Low-sensory hammock or rhythmic rocking chair</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex justify-end pt-6 border-t border-[#F1F5F9]">
              <button
                type="button"
                onClick={() => {
                  playSound('complete')
                  setStage('dccs_intro')
                }}
                className="rounded-full bg-[#0D9488] px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-[#0F766E] transition-all"
              >
                Next: Task 4 (Cognitive Set-Shifting) →
              </button>
            </div>
          </div>
        )}

        {/* 9. DCCS SET-SHIFTING INTRO */}
        {stage === 'dccs_intro' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-xl text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#CCFBF1] border border-[#99F6E4] shadow-md">
              <JewelCardSvg color="blue" shape="star"/>
            </div>
            <h2 className="font-patrick text-3xl text-[#111827] mb-3">Task 4: Dimensional Card Sort (Cognitive Set-Shifting)</h2>
            <p className="mx-auto max-w-lg text-sm text-[#475569] leading-relaxed mb-6">
              The Dimensional Change Card Sort (DCCS) evaluates mental flexibility, rule shifting, and perseverative cognitive inertia.
            </p>

            <div className="mx-auto max-w-md rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-6 text-left space-y-3 mb-8">
              <p className="text-xs text-[#334155] leading-normal font-semibold">
                You will sort cards into two bins. Watch out! The sorting rule will <strong>suddenly shift from COLOR to SHAPE</strong>!
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                playSound('tap')
                setDccsTrialIndex(0)
                setDccsPerseverations(0)
                setDccsResponseTimes([])
                setStage('dccs_run')
              }}
              className="rounded-full bg-[#0D9488] px-10 py-3.5 font-bold text-white shadow-lg hover:bg-[#0F766E] hover:scale-105 transition-all text-base"
            >
              Start Sorting Puzzle (6 Trials) →
            </button>
          </div>
        )}

        {/* 10. DCCS SET-SHIFTING RUN */}
        {stage === 'dccs_run' && dccsTrialIndex < DCCS_CARDS.length && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-2xl text-center select-none">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] bg-[#F1F5F9] px-3 py-1 rounded-full">
                Card {dccsTrialIndex + 1} of {DCCS_CARDS.length}
              </span>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 text-xs font-bold text-amber-800">
                ACTIVE RULE: {dccsRule === 'color' ? 'SORT BY COLOR' : 'SORT BY SHAPE'}
              </div>
            </div>

            {/* Stimulus Card */}
            <div className="my-8 flex flex-col items-center">
              <span className="text-xs text-[#64748B] font-semibold mb-3">Sort this artifact:</span>
              <div className="scale-125">
                <JewelCardSvg
                  color={DCCS_CARDS[dccsTrialIndex].color}
                  shape={DCCS_CARDS[dccsTrialIndex].shape}
                />
              </div>
            </div>

            {/* Sorting Bins */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-4">
              <button
                type="button"
                onClick={() => handleDccsSort(0)}
                className="flex flex-col items-center rounded-2xl bg-white border-2 border-rose-300 p-5 shadow-md hover:bg-rose-50 active:scale-95 transition-all"
              >
                <JewelCardSvg color="red" shape="circle"/>
                <span className="mt-3 text-xs font-bold text-rose-800">Bin 1 (Red Circle)</span>
              </button>
              <button
                type="button"
                onClick={() => handleDccsSort(1)}
                className="flex flex-col items-center rounded-2xl bg-white border-2 border-blue-300 p-5 shadow-md hover:bg-blue-50 active:scale-95 transition-all"
              >
                <JewelCardSvg color="blue" shape="star"/>
                <span className="mt-3 text-xs font-bold text-blue-800">Bin 2 (Blue Star)</span>
              </button>
            </div>
          </div>
        )}

        {/* 11. SCQ QUESTIONNAIRE */}
        {stage === 'scq' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-8 md:p-12 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">Clinical Developmental Screener</span>
                <h2 className="font-patrick text-3xl text-[#111827]">Social Communication Questionnaire (SCQ)</h2>
              </div>
              <span className="text-xs font-semibold bg-[#F1F5F9] text-[#475569] px-3 py-1.5 rounded-full">
                Answered: {Object.keys(scqAnswers).length} / 12
              </span>
            </div>
            <p className="text-xs text-[#64748B] mb-8 leading-relaxed">
              Based on validated SCQ lifetime developmental markers across reciprocal social interaction, communication, and repetitive routines.
            </p>

            <div className="space-y-4">
              {SCQ_QUESTIONS.map((q, idx) => {
                const currentVal = scqAnswers[q.id]
                return (
                  <div key={q.id} className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0D9488]/10 text-[#0D9488] font-bold text-xs">
                        {idx + 1}
                      </span>
                      <p className="text-xs font-semibold text-[#1E293B] leading-relaxed">{q.text}</p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          playSound('tap')
                          setScqAnswers({...scqAnswers, [q.id]: 0})
                        }}
                        className={`rounded-xl py-2 px-4 text-xs font-semibold transition-all ${
                          currentVal === 0
                            ? 'bg-[#0D9488] text-white shadow-md'
                            : 'bg-white text-[#64748B] border border-[#CBD5E1] hover:bg-[#F1F5F9]'
                        }`}
                      >
                        No
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playSound('tap')
                          setScqAnswers({...scqAnswers, [q.id]: 1})
                        }}
                        className={`rounded-xl py-2 px-4 text-xs font-semibold transition-all ${
                          currentVal === 1
                            ? 'bg-amber-600 text-white shadow-md'
                            : 'bg-white text-[#64748B] border border-[#CBD5E1] hover:bg-[#F1F5F9]'
                        }`}
                      >
                        Yes
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-8 flex justify-end pt-6 border-t border-[#F1F5F9]">
              <button
                type="button"
                onClick={submitAssessment}
                className="rounded-full bg-gradient-to-r from-[#0D9488] to-[#0F766E] px-10 py-3.5 text-base font-bold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                Generate Diagnostic Assessment Report →
              </button>
            </div>
          </div>
        )}

        {/* 12. ANALYZING SPINNER */}
        {stage === 'analyzing' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-12 shadow-2xl text-center">
            <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-[#0D9488]"/>
            <h2 className="font-patrick text-3xl text-[#111827] mb-2">Analyzing Social-Communication & Sensory Vectors...</h2>
            <p className="text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
              Synthesizing Joint Attention referencing latency, contextual Theory of Mind, SPM-2 sensory thresholds, and DCCS set-shifting resilience...
            </p>
          </div>
        )}

        {/* 13. FULL CLINICAL DIAGNOSTIC REPORT */}
        {stage === 'report' && reportData && (
          <div className="rounded-3xl border border-[#E2E8F0] bg-white p-8 md:p-12 shadow-2xl">
            {/* Clinic Document Header */}
            <div className="border-b border-[#E2E8F0] pb-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">Clinical Assessment Document</span>
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
                <span className="text-[#64748B] block">Age & Communication</span>
                <strong className="text-[#0F172A] text-sm">{reportData.profile.childAge} Years • {reportData.profile.communicationStyle}</strong>
              </div>
              <div>
                <span className="text-[#64748B] block">Informant</span>
                <strong className="text-[#0F172A] text-sm">{reportData.profile.informantRole}</strong>
              </div>
              <div>
                <span className="text-[#64748B] block">Clinical Framework</span>
                <strong className="text-[#0D9488] text-sm">ADOS-2 & SPM-2 Mapped</strong>
              </div>
            </div>

            {/* Primary Clinical Classification */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#F0FDFA] to-[#CCFBF1] border-2 border-[#99F6E4] mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E] block mb-1">
                Diagnostic Impression & Support Level
              </span>
              <div className="text-2xl font-bold text-[#0F766E] mb-2 font-poppins">
                {reportData.stats.classification}
              </div>
              <div className="text-xs font-bold text-[#0D9488] bg-white/80 px-3 py-1 rounded-full inline-block mb-3 border border-[#99F6E4]">
                {reportData.stats.supportLevel}
              </div>
              <p className="text-xs text-[#334155] leading-relaxed">
                {reportData.clinicalSummary}
              </p>
            </div>

            {/* 4-Domain Clinical Spider / Breakdown Table */}
            <div className="mb-8">
              <h3 className="font-patrick text-2xl text-[#0F172A] mb-4">4-Domain Neurodevelopmental Matrix</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportData.indices.map((idx: any, i: number) => (
                  <div key={i} className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-[#0F172A]">{idx.name}</span>
                      <span className="font-mono text-sm font-bold text-[#0D9488]">{idx.score} / 100</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden mb-2">
                      <div
                        className="h-full bg-gradient-to-r from-[#0D9488] to-[#14B8A6] rounded-full"
                        style={{width: `${Math.min(100, Math.max(10, idx.score))}%`}}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-[#64748B] block">
                      Status: <strong className="text-[#334155]">{idx.status}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Neurodivergent Strengths Inventory */}
            <div className="mb-8 p-6 rounded-2xl bg-amber-50/70 border border-amber-200">
              <h3 className="font-patrick text-2xl text-amber-900 mb-3 flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Unique Neurodivergent Strengths Inventory
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-amber-950">
                {reportData.strengths.map((st: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 bg-white/80 p-3 rounded-xl border border-amber-200/60">
                    <span className="text-amber-600 font-bold">★</span>
                    <span>{st}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sensory Diet & Environmental Accommodations */}
            <div className="mb-8">
              <h3 className="font-patrick text-2xl text-[#0F172A] mb-4">Sensory Diet & IEP Environmental Blueprint</h3>
              <div className="space-y-3">
                {reportData.accommodations.map((acc: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0D9488] text-white text-[11px] font-bold mt-0.5">
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
                className="rounded-full bg-[#0D9488] px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-[#0F766E] transition-all"
              >
                Schedule Specialist Review with Manas Developmental Team →
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
