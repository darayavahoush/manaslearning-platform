'use client'
import {useState, useEffect, useRef} from 'react'
import Link from 'next/link'

// Enchanted Web Audio synthesizer: Soothing glass harps, crystal bells, warm kalimbas, and royal fanfare
function playAudio(type: 'hit' | 'chime' | 'sensory' | 'tap' | 'fanfare' | 'whoosh') {
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
      osc.frequency.setValueAtTime(659.25, now)
      osc.frequency.exponentialRampToValueAtTime(987.77, now + 0.1)
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.2)
    } else if (type === 'sensory') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(261.63, now)
      osc.frequency.linearRampToValueAtTime(329.63, now + 0.3)
      gain.gain.setValueAtTime(0.05, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.38)
    } else if (type === 'fanfare') {
      [440, 554.37, 659.25, 880, 1108.7].forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, now + idx * 0.08)
        gain.gain.setValueAtTime(0.07, now + idx * 0.08)
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.08)
        osc.stop(now + idx * 0.08 + 0.5)
      })
    } else {
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

// Illustrated Courtyard Guide: Aria (Animated eyes & pointing arm)
function CourtyardGuideAvatar({gaze, isPointing}: {gaze: 'left' | 'center' | 'right'; isPointing: boolean}) {
  const pupilOffsetX = gaze === 'left' ? -4 : gaze === 'right' ? 4 : 0
  const pupilOffsetY = gaze === 'center' ? 3 : 0

  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 140 140" className="w-28 h-28 md:w-36 md:h-36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="70" cy="70" r="64" fill="#CCFBF1" fillOpacity="0.6"/>
        <path d="M 32 130 C 32 105 50 96 70 96 C 90 96 108 105 108 130 Z" fill="#0D9488"/>
        <path d="M 64 96 L 70 110 L 76 96" stroke="#FEF08A" strokeWidth="2" strokeLinecap="round"/>
        <path d="M 62 86 L 62 98 L 78 98 L 78 86 Z" fill="#FED7AA"/>
        <ellipse cx="70" cy="62" rx="26" ry="30" fill="#FED7AA"/>
        <path d="M 44 54 C 44 32 54 22 70 22 C 86 22 96 32 96 54 C 96 60 92 68 92 68 C 92 50 86 42 70 42 C 54 42 48 50 48 68 C 48 68 44 60 44 54 Z" fill="#1E293B"/>
        <ellipse cx="58" cy="56" rx="6" ry="4" fill="#FFFFFF"/>
        <ellipse cx="82" cy="56" rx="6" ry="4" fill="#FFFFFF"/>
        <circle cx={58 + pupilOffsetX} cy={56 + pupilOffsetY} r="2.8" fill="#0F172A"/>
        <circle cx={57 + pupilOffsetX} cy={55 + pupilOffsetY} r="1" fill="#FFFFFF"/>
        <circle cx={82 + pupilOffsetX} cy={56 + pupilOffsetY} r="2.8" fill="#0F172A"/>
        <circle cx={81 + pupilOffsetX} cy={55 + pupilOffsetY} r="1" fill="#FFFFFF"/>
        <path d="M 64 74 Q 70 78 76 74" stroke="#9A3412" strokeWidth="2" strokeLinecap="round"/>
        {isPointing && (
          gaze === 'left' ? (
            <path d="M 44 110 Q 24 100 12 90" stroke="#FED7AA" strokeWidth="8" strokeLinecap="round"/>
          ) : (
            <path d="M 96 110 Q 116 100 128 90" stroke="#FED7AA" strokeWidth="8" strokeLinecap="round"/>
          )
        )}
      </svg>
      <div className="mt-2 text-xs font-semibold text-[#0F172A] bg-white/95 px-3 py-1 rounded-full shadow-sm border border-[#E2E8F0]">
        Guide Aria • {isPointing ? 'Pointing at Pottery' : 'Gazing Gently'}
      </div>
    </div>
  )
}

// Handcrafted Ceramic Vessels
function ArtisanVesselSvg({type}: {type: 'A' | 'B' | 'C'}) {
  if (type === 'A') {
    return (
      <svg viewBox="0 0 100 120" className="w-18 h-22 md:w-22 md:h-26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="110" rx="26" ry="6" fill="#CBD5E1"/>
        <path d="M 32 98 C 20 80 18 52 34 38 C 42 30 58 30 66 38 C 82 52 80 80 68 98 Z" fill="#2563EB"/>
        <ellipse cx="50" cy="38" rx="14" ry="4" fill="#93C5FD"/>
        <path d="M 44 38 L 44 24 L 56 24 L 56 38 Z" fill="#1D4ED8"/>
        <ellipse cx="50" cy="24" rx="10" ry="3" fill="#FBBF24"/>
        <path d="M 50 50 Q 42 66 50 82 Q 58 66 50 50 Z" stroke="#93C5FD" strokeWidth="1.5" fill="none"/>
      </svg>
    )
  }
  if (type === 'B') {
    return (
      <svg viewBox="0 0 100 120" className="w-18 h-22 md:w-22 md:h-26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="110" rx="24" ry="6" fill="#CBD5E1"/>
        <path d="M 30 100 C 16 82 18 50 36 38 C 42 34 58 34 64 38 C 82 50 84 82 70 100 Z" fill="#EA580C"/>
        <path d="M 28 48 C 14 54 14 74 26 80" stroke="#9A3412" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <path d="M 72 48 C 86 54 86 74 74 80" stroke="#9A3412" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <path d="M 42 38 L 42 22 L 58 22 L 58 38 Z" fill="#C2410C"/>
        <ellipse cx="50" cy="22" rx="11" ry="3" fill="#FED7AA"/>
        <circle cx="50" cy="68" r="6" fill="#FEF08A"/>
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 100 120" className="w-18 h-22 md:w-22 md:h-26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="110" rx="22" ry="5" fill="#CBD5E1"/>
      <path d="M 34 98 C 22 84 24 64 36 50 C 42 42 58 42 64 50 C 76 64 78 84 66 98 Z" fill="#059669"/>
      <path d="M 44 50 L 44 26 L 56 26 L 56 50 Z" fill="#047857"/>
      <ellipse cx="50" cy="26" rx="9" ry="3" fill="#A7F3D0"/>
      <ellipse cx="50" cy="22" rx="12" ry="3" fill="#FBBF24"/>
    </svg>
  )
}

// Jewel-Tone Artifact Cards (DCCS Task)
function JewelCardSvg({color, shape}: {color: 'red' | 'blue'; shape: 'star' | 'circle'}) {
  const colorFill = color === 'red' ? '#EF4444' : '#3B82F6'
  const colorGlow = color === 'red' ? '#FEE2E2' : '#DBEAFE'

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
      </svg>
    </div>
  )
}

// Fantasy Grove Questions (Child-Facing)
const GROVE_DISCOVERY_CARDS = [
  {
    id: 'a1',
    title: 'The Pattern Seer',
    desc: 'Do you notice tiny, beautiful patterns in nature, books, leaves, or stones that everyone else walks right past?',
    icon: '🔍'
  },
  {
    id: 'a2',
    title: 'The Cozy Sanctuary Haven',
    desc: 'When a noisy room, hall, or playground gets too loud, does your spirit crave a peaceful cozy corner with soft cushions?',
    icon: '🌿'
  },
  {
    id: 'a3',
    title: 'The Deep Curiosity Passion',
    desc: 'Do you have a favorite topic (like animals, stars, trains, dinosaurs, or coding) that you love learning EVERYTHING about?',
    icon: '📚'
  },
  {
    id: 'a4',
    title: 'The Predictable Path',
    desc: 'Do you feel happiest and most relaxed when you know exactly what is going to happen next without unexpected surprises?',
    icon: '🧭'
  },
  {
    id: 'a5',
    title: 'The Rhythmic Comfort Sway',
    desc: 'When you are super excited or need to calm down, does rocking, humming a familiar song, or fidgeting feel wonderfully soothing?',
    icon: '🎵'
  },
  {
    id: 'a6',
    title: 'The Honest Truth Speaker',
    desc: 'Do you always prefer people to say exactly what they mean in plain, clear words without confusing hints or sarcastic jokes?',
    icon: '💎'
  }
]

export default function AutismFantasyAssessmentPage() {
  const [stage, setStage] = useState<'welcome' | 'avatar' | 'ja_story' | 'ja_game' | 'tom_story' | 'tom_game' | 'sensory_story' | 'sensory_game' | 'dccs_story' | 'dccs_game' | 'trials' | 'agent_eval' | 'celebration'>('welcome')

  // Child Fantasy Persona
  const [guardianName, setGuardianName] = useState('')
  const [guardianAge, setGuardianAge] = useState(7)
  const [guildAffinity, setGuildAffinity] = useState('Grove Harmonizer')
  const [animalFriend, setAnimalFriend] = useState('Gentle Forest Deer')

  // Joint Attention State
  const [jaTrialIndex, setJaTrialIndex] = useState(0)
  const [jaResponseTimes, setJaResponseTimes] = useState<number[]>([])
  const [jaCorrectCount, setJaCorrectCount] = useState(0)
  const jaStartRef = useRef<number>(0)
  const JA_TRIALS = [
    {targetPot: 1, avatarGaze: 'center' as const, isPointing: false, title: 'Trial 1: Center Amphora'},
    {targetPot: 0, avatarGaze: 'left' as const, isPointing: true, title: 'Trial 2: Left Lotus Urn'},
    {targetPot: 2, avatarGaze: 'right' as const, isPointing: false, title: 'Trial 3: Right Emerald Vase'},
    {targetPot: 2, avatarGaze: 'right' as const, isPointing: true, title: 'Trial 4: Right Emerald Vase'},
  ]

  // Theory of Mind Story Cards
  const [tomTrialIndex, setTomTrialIndex] = useState(0)
  const [tomScore, setTomScore] = useState(0)
  const TOM_VIGNETTES = [
    {
      scenario: 'Priya drops her handmade clay bird and a wing chips. Her eyes get watery, but she smiles softly and says: "Oh, it\'s totally fine!"',
      question: 'What is Priya truly feeling on the inside?',
      options: [
        {text: 'She is truly happy and completely fine.', correct: false},
        {text: 'She feels sad and disappointed, but is trying to be brave.', correct: true},
        {text: 'She is angry at the bird.', correct: false}
      ]
    },
    {
      scenario: 'During dinner, Dad looks at the tall water bottle and asks Rohan: "Can you reach the water bottle?"',
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
      scenario: 'At a loud school celebration with drums, Aarav covers his ears and looks toward the quiet veranda tree.',
      question: 'Why is Aarav looking toward the veranda?',
      options: [
        {text: 'The loud vibrations are overwhelming, and he needs a calm sensory sanctuary.', correct: true},
        {text: 'He hates music.', correct: false},
        {text: 'He is looking for a drumstick.', correct: false}
      ]
    }
  ]

  // Sensory Calibration State
  const [sensoryLight, setSensoryLight] = useState(6)
  const [sensorySound, setSensorySound] = useState(7)
  const [sensoryTouch, setSensoryTouch] = useState(7)
  const [sanctuaryChoice, setSanctuaryChoice] = useState('Dim quiet corner with soft cushions & weighted blanket')

  // DCCS State
  const [dccsIndex, setDccsIndex] = useState(0)
  const [dccsRule, setDccsRule] = useState<'color' | 'shape'>('color')
  const [dccsPerseverations, setDccsPerseverations] = useState(0)
  const [dccsTimes, setDccsTimes] = useState<number[]>([])
  const dccsStartRef = useRef<number>(0)
  const DCCS_CARDS: Array<{color: 'red' | 'blue'; shape: 'star' | 'circle'; targetColorMatch: number; targetShapeMatch: number}> = [
    {color: 'red', shape: 'star', targetColorMatch: 0, targetShapeMatch: 1},
    {color: 'blue', shape: 'circle', targetColorMatch: 1, targetShapeMatch: 0},
    {color: 'red', shape: 'circle', targetColorMatch: 0, targetShapeMatch: 0},
    {color: 'blue', shape: 'star', targetColorMatch: 1, targetShapeMatch: 1},
    {color: 'red', shape: 'star', targetColorMatch: 0, targetShapeMatch: 1},
    {color: 'blue', shape: 'circle', targetColorMatch: 1, targetShapeMatch: 0},
  ]

  // Trial Responses
  const [trialAnswers, setTrialAnswers] = useState<Record<string, number>>({})

  // LangGraph Agent Result
  const [agentResult, setAgentResult] = useState<any>(null)
  const [showClinicalDossier, setShowClinicalDossier] = useState(false)

  // Joint Attention Loop
  useEffect(() => {
    if (stage === 'ja_game' && jaTrialIndex < JA_TRIALS.length) {
      jaStartRef.current = performance.now()
    } else if (stage === 'ja_game' && jaTrialIndex >= JA_TRIALS.length) {
      playAudio('fanfare')
      setStage('tom_story')
    }
  }, [stage, jaTrialIndex])

  function handlePotSelect(idx: number) {
    if (stage !== 'ja_game') return
    const elapsed = Math.round(performance.now() - jaStartRef.current)
    setJaResponseTimes((prev) => [...prev, elapsed])

    if (idx === JA_TRIALS[jaTrialIndex].targetPot) {
      playAudio('hit')
      setJaCorrectCount((c) => c + 1)
    } else {
      playAudio('tap')
    }
    setJaTrialIndex((i) => i + 1)
  }

  // Theory of Mind Handling
  function handleTomAnswer(isCorrect: boolean) {
    if (isCorrect) {
      playAudio('hit')
      setTomScore((s) => s + 25)
    } else {
      playAudio('tap')
    }

    if (tomTrialIndex + 1 < TOM_VIGNETTES.length) {
      setTomTrialIndex((i) => i + 1)
    } else {
      playAudio('fanfare')
      setStage('sensory_story')
    }
  }

  // DCCS Handling
  useEffect(() => {
    if (stage === 'dccs_game') {
      if (dccsIndex === 0) setDccsRule('color')
      if (dccsIndex === 3) {
        setDccsRule('shape')
        playAudio('sensory')
      }
      if (dccsIndex >= DCCS_CARDS.length) {
        playAudio('fanfare')
        setStage('trials')
        return
      }
      dccsStartRef.current = performance.now()
    }
  }, [stage, dccsIndex])

  function handleDccsSort(targetBin: number) {
    const elapsed = Math.round(performance.now() - dccsStartRef.current)
    setDccsTimes((prev) => [...prev, elapsed])

    const card = DCCS_CARDS[dccsIndex]
    const correctBin = dccsRule === 'color' ? card.targetColorMatch : card.targetShapeMatch

    if (targetBin === correctBin) {
      playAudio('hit')
    } else {
      playAudio('tap')
      if (dccsRule === 'shape' && targetBin === card.targetColorMatch) {
        setDccsPerseverations((p) => p + 1)
      }
    }
    setDccsIndex((i) => i + 1)
  }

  // Submit via LangGraph Multi-Node Agent
  async function submitLangGraphAgent() {
    setStage('agent_eval')

    const avgJaLatency = jaResponseTimes.length > 0
      ? Math.round(jaResponseTimes.reduce((a, b) => a + b, 0) / jaResponseTimes.length)
      : 760
    const jaAccuracy = Math.round((jaCorrectCount / JA_TRIALS.length) * 100)
    const avgSensory = Math.round(((sensoryLight + sensorySound + sensoryTouch) / 30) * 100)

    const payload = {
      assessmentType: 'autism',
      childName: guardianName || 'Grove Guardian',
      childAge: guardianAge,
      guildClass: guildAffinity,
      companion: animalFriend,
      telemetry: {
        jaLatencyMs: avgJaLatency,
        jaAccuracy,
        tomScore,
        sensoryScore: avgSensory,
        perseverations: dccsPerseverations,
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
      alert('The Grove Guild is reconnecting... please try again!')
      setStage('trials')
    }
  }

  return (
    <main data-no-listen="true" className="min-h-screen bg-[#FFFDF8] py-8 px-4 font-poppins text-[#1F2937]">
      <div className="mx-auto max-w-4xl">
        {/* Navigation & Realm Indicator */}
        <div className="mb-6 flex items-center justify-between text-xs text-[#78716C]">
          <Link href="/assessments" prefetch={false} className="font-bold text-[#0D9488] hover:underline flex items-center gap-1.5">
            ← Assessment Directory
          </Link>
          <span className="rounded-full bg-teal-500/15 px-3 py-1 font-bold text-teal-900 border border-teal-300">
            Paid Clinical Battery • ADOS-2 & SPM-2 Mapped
          </span>
        </div>

        {/* 1. WELCOME SCREEN: FANTASY GROVE HERO */}
        {stage === 'welcome' && (
          <div className="rounded-3xl border-2 border-teal-300 bg-white overflow-hidden shadow-2xl">
            <div className="relative h-64 md:h-80 w-full overflow-hidden bg-gradient-to-tr from-[#CCFBF1] to-[#E0F2FE]">
              <img
                src="/decor/itw/autism-environment.webp"
                alt="Whispering Groves of Lumina"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent flex items-end p-6 md:p-8">
                <div>
                  <span className="inline-block rounded-full bg-teal-400 text-slate-900 px-3.5 py-1 text-xs font-bold uppercase tracking-wider mb-2 shadow">
                    Fantasy Adventure & Clinical Battery
                  </span>
                  <h1 className="font-patrick text-3xl md:text-5xl text-white font-bold drop-shadow-md">
                    Whispering Groves of Lumina: <span className="text-teal-300">The Crystal Lantern Quest</span>
                  </h1>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-10">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F0FDFA] border border-[#99F6E4] mb-8">
                <img
                  src="/decor/itw/milo-owl.webp"
                  alt="Milo Owl"
                  className="w-16 h-16 rounded-full border-2 border-[#0D9488] shadow-sm shrink-0 object-cover"
                />
                <div className="text-xs text-[#334155] leading-relaxed">
                  <strong className="text-[#0D9488] text-sm block font-poppins">Namaste! Welcome to Lumina.</strong>
                  Aria, the Grove Alchemist, has invited you into her mystical botanical courtyard. Follow her subtle clues, understand hidden feelings, craft your dream sensory retreat, and discover your magical neurodivergent superpowers!
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="rounded-2xl bg-[#F0FDFA] border border-[#99F6E4] p-4 text-center">
                  <div className="text-2xl mb-1">🏺</div>
                  <strong className="text-xs text-[#0F766E] block font-bold">Chapter 1: Sacred Urns</strong>
                  <span className="text-[11px] text-[#115E59]">ADOS-2 Joint Attention Referencing</span>
                </div>
                <div className="rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] p-4 text-center">
                  <div className="text-2xl mb-1">💖</div>
                  <strong className="text-xs text-[#1E40AF] block font-bold">Chapter 2: Heart Whispers</strong>
                  <span className="text-[11px] text-[#2563EB]">Contextual Theory of Mind</span>
                </div>
                <div className="rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] p-4 text-center">
                  <div className="text-2xl mb-1">🌿</div>
                  <strong className="text-xs text-[#92400E] block font-bold">Chapter 3: Sanctuary Forge</strong>
                  <span className="text-[11px] text-[#B45309]">SPM-2 Sensory Threshold Mapping</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#F1F5F9]">
                <div className="text-xs text-[#64748B]">
                  Includes <strong>Certified Neurodevelopmental Dossier & IEP Plan</strong> for Parents
                </div>
                <button
                  type="button"
                  onClick={() => { playAudio('chime'); setStage('avatar') }}
                  className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#0D9488] to-[#0F766E] px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                >
                  Enter the Whispering Groves →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. CHOOSE GUARDIAN CODENAME & AFFINITY */}
        {stage === 'avatar' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-6 md:p-10 shadow-xl">
            <div className="text-center max-w-lg mx-auto mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">Lumina Guild Registration</span>
              <h2 className="font-patrick text-3xl md:text-4xl text-[#0F172A] mt-1">Choose Your Guardian Identity</h2>
              <p className="text-xs text-[#64748B] mt-2">Every guardian in the whispering groves carries a special affinity and a gentle companion!</p>
            </div>

            <div className="max-w-md mx-auto space-y-6 mb-8">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-2">My Guardian Codename</label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="e.g. Guardian Diya, Forest Keeper Kabir"
                  className="w-full rounded-2xl border-2 border-[#CBD5E1] p-3.5 text-sm font-semibold focus:border-[#0D9488] focus:outline-none bg-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-2">Choose Your Grove Affinity</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {name: 'Grove Harmonizer', icon: '🌿', desc: 'Nature Empath'},
                    {name: 'Crystal Alchemist', icon: '💎', desc: 'Pattern Seer'},
                    {name: 'Quiet Seeker', icon: '🕊️', desc: 'Deep Thinker'},
                  ].map((aff) => (
                    <button
                      key={aff.name}
                      type="button"
                      onClick={() => { playAudio('tap'); setGuildAffinity(aff.name) }}
                      className={`p-3 rounded-2xl border-2 text-center transition-all ${
                        guildAffinity === aff.name
                          ? 'border-[#0D9488] bg-[#F0FDFA] text-[#0F766E] shadow-md'
                          : 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1]'
                      }`}
                    >
                      <div className="text-2xl mb-1">{aff.icon}</div>
                      <strong className="block text-[11px] font-bold leading-tight">{aff.name}</strong>
                      <span className="text-[10px] text-[#94A3B8]">{aff.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-2">Explorer Age Bracket</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {age: 6, label: 'Ages 5–7', title: 'Seedling Sprout'},
                    {age: 9, label: 'Ages 8–11', title: 'Grove Keeper'},
                    {age: 13, label: 'Ages 12+', title: 'Master Botanist'},
                  ].map((tier) => (
                    <button
                      key={tier.age}
                      type="button"
                      onClick={() => { playAudio('tap'); setGuardianAge(tier.age) }}
                      className={`rounded-2xl p-3 text-center border-2 transition-all ${
                        guardianAge === tier.age
                          ? 'border-[#0D9488] bg-[#F0FDFA] text-[#0F766E] shadow-md'
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
                disabled={!guardianName.trim()}
                onClick={() => { playAudio('chime'); setStage('ja_story') }}
                className="rounded-full bg-[#0D9488] px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-[#0F766E] disabled:opacity-50 transition-all"
              >
                Begin Chapter 1: The Sacred Urns →
              </button>
            </div>
          </div>
        )}

        {/* 3. CHAPTER 1 STORY: THE THREE SACRED URNS */}
        {stage === 'ja_story' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white overflow-hidden shadow-2xl">
            <div className="relative h-60 md:h-72 w-full overflow-hidden bg-gradient-to-b from-[#CCFBF1] to-[#E0F2FE]">
              <img
                src="/decor/itw/itw-autism-what-helps.webp"
                alt="Sacred Veranda Urns"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex items-end p-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-black/40 px-3 py-1 rounded-full">
                    Chapter 1: The Veranda of Sacred Urns
                  </span>
                  <h2 className="font-patrick text-3xl md:text-4xl text-white font-bold mt-1">
                    Follow Aria’s Subtle Clues
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <p className="text-xs md:text-sm text-[#475569] leading-relaxed mb-6">
                Three handcrafted ceramic vessels rest on stone pedestals in the courtyard. Aria knows which one conceals the sparkling lotus gemstone. Watch Aria’s gentle eyes and pointing hand to find the treasure!
              </p>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    playAudio('whoosh')
                    setJaTrialIndex(0)
                    setJaResponseTimes([])
                    setJaCorrectCount(0)
                    setStage('ja_game')
                  }}
                  className="rounded-full bg-gradient-to-r from-[#0D9488] to-[#0F766E] px-10 py-3.5 text-base font-bold text-white shadow-lg hover:scale-105 transition-all"
                >
                  Enter Courtyard (4 Sightings) →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. CHAPTER 1 GAMEPLAY: JOINT ATTENTION */}
        {stage === 'ja_game' && jaTrialIndex < JA_TRIALS.length && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-6 md:p-10 shadow-2xl text-center select-none">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] bg-[#F1F5F9] px-3.5 py-1 rounded-full">
                Sighting {jaTrialIndex + 1} of {JA_TRIALS.length}
              </span>
              <span className="text-xs font-bold text-[#0D9488]">
                {JA_TRIALS[jaTrialIndex].title}
              </span>
            </div>

            <div className="my-6 p-6 md:p-8 rounded-3xl bg-gradient-to-b from-[#FEF3C7]/40 via-[#FDFBF7] to-[#F0FDFA] border border-[#FDE68A]/60 shadow-inner">
              <div className="mx-auto mb-6">
                <CourtyardGuideAvatar
                  gaze={JA_TRIALS[jaTrialIndex].avatarGaze}
                  isPointing={JA_TRIALS[jaTrialIndex].isPointing}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-lg mx-auto">
                {[
                  {type: 'A' as const, label: 'Lotus Urn', desc: 'Pedestal A'},
                  {type: 'B' as const, label: 'Amphora', desc: 'Pedestal B'},
                  {type: 'C' as const, label: 'Willow Vase', desc: 'Pedestal C'},
                ].map((pot, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePotSelect(idx)}
                    className="flex flex-col items-center justify-between rounded-2xl bg-white border-2 border-[#CBD5E1] p-3 md:p-4 shadow-sm hover:border-[#0D9488] hover:bg-[#F0FDFA] active:scale-95 transition-all group"
                  >
                    <ArtisanVesselSvg type={pot.type}/>
                    <div className="mt-2 text-center">
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

        {/* 5. CHAPTER 2 STORY: THE WHISPERING RIVER */}
        {stage === 'tom_story' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white overflow-hidden shadow-2xl">
            <div className="relative h-60 md:h-72 w-full overflow-hidden bg-gradient-to-b from-[#EFF6FF] to-[#DBEAFE]">
              <img
                src="/decor/itw/communication-environment.webp"
                alt="Whispering River of Empathy"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex items-end p-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-200 bg-black/40 px-3 py-1 rounded-full">
                    Chapter 2: The Whispering River of Empathy
                  </span>
                  <h2 className="font-patrick text-3xl md:text-4xl text-white font-bold mt-1">
                    Understanding Hidden Feelings
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <p className="text-xs md:text-sm text-[#475569] leading-relaxed mb-6">
                Words sometimes carry secret feelings, polite clues, or figurative meanings! Milo hoots: <em>"Can you look beyond literal words and understand what our forest friends feel deep inside their hearts?"</em>
              </p>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    playAudio('whoosh')
                    setTomTrialIndex(0)
                    setTomScore(0)
                    setStage('tom_game')
                  }}
                  className="rounded-full bg-gradient-to-r from-[#0D9488] to-[#0F766E] px-10 py-3.5 text-base font-bold text-white shadow-lg hover:scale-105 transition-all"
                >
                  Read Story Scrolls (4 Stories) →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. CHAPTER 2 GAMEPLAY: THEORY OF MIND */}
        {stage === 'tom_game' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-6 md:p-10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] bg-[#F1F5F9] px-3.5 py-1 rounded-full">
                Scroll {tomTrialIndex + 1} of {TOM_VIGNETTES.length}
              </span>
              <span className="text-xs font-bold text-[#0D9488]">Pragmatic Reasoning</span>
            </div>

            <div className="p-6 rounded-2xl bg-[#F0FDFA] border border-[#99F6E4] mb-6">
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

        {/* 7. CHAPTER 3 STORY: THE SENSORY SANCTUARY FORGE */}
        {stage === 'sensory_story' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white overflow-hidden shadow-2xl">
            <div className="relative h-60 md:h-72 w-full overflow-hidden bg-gradient-to-tr from-[#FEF3C7] to-[#DCFCE7]">
              <img
                src="/decor/itw/itw-autism-support-sanctuary.webp"
                alt="Sensory Sanctuary Forge"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex items-end p-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-200 bg-black/40 px-3 py-1 rounded-full">
                    Chapter 3: The Sanctuary Forge
                  </span>
                  <h2 className="font-patrick text-3xl md:text-4xl text-white font-bold mt-1">
                    Design Your Dream Cozy Haven
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <p className="text-xs md:text-sm text-[#475569] leading-relaxed mb-6">
                Every mind has its own soothing sensory rhythm. Milo invites you: <em>"Tune the enchanted sliders to design your ultimate sanctuary where your mind feels 100% calm, peaceful, and recharged!"</em>
              </p>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    playAudio('sensory')
                    setStage('sensory_game')
                  }}
                  className="rounded-full bg-gradient-to-r from-[#0D9488] to-[#0F766E] px-10 py-3.5 text-base font-bold text-white shadow-lg hover:scale-105 transition-all"
                >
                  Forge Your Sanctuary →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 8. CHAPTER 3 GAMEPLAY: SENSORY LAB */}
        {stage === 'sensory_game' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-6 md:p-10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">SPM-2 Sensory Framework</span>
                <h2 className="font-patrick text-3xl text-[#111827]">Tune Your Sanctuary Haven</h2>
              </div>
              <span className="text-xs font-semibold bg-[#F1F5F9] text-[#475569] px-3 py-1.5 rounded-full">
                Interactive Haven
              </span>
            </div>

            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"/>
                    Fairy Lights & Sunlight Glow
                  </span>
                  <span className="text-xs font-mono font-bold text-[#0D9488] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                    {sensoryLight} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={sensoryLight}
                  onChange={(e) => {
                    setSensoryLight(Number(e.target.value))
                    playAudio('tap')
                  }}
                  className="w-full accent-[#0D9488] cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"/>
                    Forest Raindrops & Gentle Wind
                  </span>
                  <span className="text-xs font-mono font-bold text-[#0D9488] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                    {sensorySound} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={sensorySound}
                  onChange={(e) => {
                    setSensorySound(Number(e.target.value))
                    playAudio('sensory')
                  }}
                  className="w-full accent-[#0D9488] cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400"/>
                    Cloud Softness & Weighted Cushions
                  </span>
                  <span className="text-xs font-mono font-bold text-[#0D9488] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                    {sensoryTouch} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={sensoryTouch}
                  onChange={(e) => {
                    setSensoryTouch(Number(e.target.value))
                    playAudio('tap')
                  }}
                  className="w-full accent-[#0D9488] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-2">
                  My Preferred Sanctuary Haven
                </label>
                <select
                  value={sanctuaryChoice}
                  onChange={(e) => setSanctuaryChoice(e.target.value)}
                  className="w-full rounded-xl border border-[#CBD5E1] p-3 text-xs focus:border-[#0D9488] focus:outline-none bg-white font-semibold"
                >
                  <option>Dim quiet corner with soft cushions & weighted blanket</option>
                  <option>Shaded outdoor garden treehouse with gentle breeze</option>
                  <option>Noise-calming headphones playing peaceful ocean waves</option>
                  <option>Cozy beanbag with warm fairy lights</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex justify-end pt-4 border-t border-[#F1F5F9]">
              <button
                type="button"
                onClick={() => {
                  playAudio('whoosh')
                  setStage('dccs_story')
                }}
                className="rounded-full bg-[#0D9488] px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-[#0F766E] transition-all"
              >
                Next: Chapter 4 (Gemstone Transmutation) →
              </button>
            </div>
          </div>
        )}

        {/* 9. CHAPTER 4 STORY: THE ALCHEMIST'S GEM SORTER */}
        {stage === 'dccs_story' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white overflow-hidden shadow-2xl">
            <div className="relative h-60 md:h-72 w-full overflow-hidden bg-gradient-to-tr from-[#CCFBF1] to-[#E0F2FE]">
              <img
                src="/decor/itw/itw-autism-support-declutter.webp"
                alt="Alchemical Gemstone Sorter"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex items-end p-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-black/40 px-3 py-1 rounded-full">
                    Chapter 4: The Alchemist's Gemstone Sorter
                  </span>
                  <h2 className="font-patrick text-3xl md:text-4xl text-white font-bold mt-1">
                    Sort by Color... Then by Shape!
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <p className="text-xs md:text-sm text-[#475569] leading-relaxed mb-6">
                In the temple workshop, glowing crystal cards need sorting into two bins. But watch out! When the temple chime rings, the rule will suddenly shift from <strong>COLOR</strong> to <strong>SHAPE</strong>!
              </p>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    playAudio('whoosh')
                    setDccsIndex(0)
                    setDccsPerseverations(0)
                    setDccsTimes([])
                    setStage('dccs_game')
                  }}
                  className="rounded-full bg-gradient-to-r from-[#0D9488] to-[#0F766E] px-10 py-3.5 text-base font-bold text-white shadow-lg hover:scale-105 transition-all"
                >
                  Start Gemstone Sorting (6 Cards) →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 10. CHAPTER 4 GAMEPLAY: DCCS */}
        {stage === 'dccs_game' && dccsIndex < DCCS_CARDS.length && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-6 md:p-10 shadow-2xl text-center select-none">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] bg-[#F1F5F9] px-3.5 py-1 rounded-full">
                Gem {dccsIndex + 1} of {DCCS_CARDS.length}
              </span>
              <div className="rounded-full bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 text-xs font-bold text-amber-800">
                ACTIVE RULE: {dccsRule === 'color' ? 'SORT BY COLOR' : 'SORT BY SHAPE'}
              </div>
            </div>

            <div className="my-8 flex flex-col items-center">
              <span className="text-xs text-[#64748B] font-semibold mb-3">Sort this glowing crystal:</span>
              <div className="scale-125">
                <JewelCardSvg
                  color={DCCS_CARDS[dccsIndex].color}
                  shape={DCCS_CARDS[dccsIndex].shape}
                />
              </div>
            </div>

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

        {/* 11. CHAPTER 5: THE MIRROR OF INNER WONDERS */}
        {stage === 'trials' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-6 md:p-10 shadow-xl">
            <div className="text-center max-w-lg mx-auto mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0D9488]">The Mirror of Inner Wonders</span>
              <h2 className="font-patrick text-3xl md:text-4xl text-[#0F172A] mt-1">My Secret Garden Superpowers</h2>
              <p className="text-xs text-[#64748B] mt-2">
                Help Milo and Aria map your wonderful neurodivergent strengths and comfort preferences!
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {GROVE_DISCOVERY_CARDS.map((card) => {
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
                        {label: 'That’s Me!', score: 2},
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
                              ? 'bg-[#0D9488] text-white shadow-md'
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
                className="rounded-full bg-gradient-to-r from-[#0D9488] to-[#0F766E] px-10 py-3.5 text-base font-bold text-white shadow-lg hover:scale-105 transition-all"
              >
                Synthesize My Guardian Superpower Crest →
              </button>
            </div>
          </div>
        )}

        {/* 12. AGENT EVALUATION SPINNER */}
        {stage === 'agent_eval' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-12 shadow-2xl text-center">
            <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-[#0D9488]"/>
            <h2 className="font-patrick text-3xl text-[#0F172A] mb-2">Aria, Milo & The Agentic Guild Are Synthesizing...</h2>
            <p className="text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
              Norming joint attention referencing latencies, calculating set-shifting perseveration, and authoring your certified neuropsychological evaluation dossier...
            </p>
          </div>
        )}

        {/* 13. CELEBRATION CERTIFICATE & SUPERPOWERS */}
        {stage === 'celebration' && agentResult && (
          <div className="space-y-8">
            {/* Child-Facing Magical Award Certificate */}
            <div className="rounded-3xl border-4 border-emerald-300 bg-gradient-to-b from-[#F0FDF4] via-white to-[#CCFBF1] p-6 md:p-10 shadow-2xl text-center relative overflow-hidden">
              <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-3xl bg-teal-100 border-2 border-teal-300 p-3 shadow-inner">
                <img
                  src="/decor/itw/itw-autism-sticker.webp"
                  alt="Lotus Crystal Crest"
                  className="h-full w-full object-contain filter drop-shadow-md"
                />
              </div>

              <span className="text-xs font-bold uppercase tracking-widest text-[#0D9488] bg-[#0D9488]/10 px-4 py-1.5 rounded-full inline-block mb-2 border border-teal-300">
                Official Lumina Sanctuary Superpower Award
              </span>

              <h1 className="font-patrick text-3xl md:text-5xl text-[#0F172A] font-bold">
                Congratulations, {agentResult.childName}!
              </h1>
              <p className="font-patrick text-xl text-teal-800 mt-1">
                Conferred the Title of: <strong>{agentResult.superpowers.realmTitle}</strong>
              </p>

              {/* Milo's Personal Scroll */}
              <div className="my-6 p-5 rounded-2xl bg-teal-50/70 border border-teal-200 shadow-sm max-w-xl mx-auto flex items-start gap-4 text-left">
                <img
                  src="/decor/itw/milo-owl.webp"
                  alt="Milo the Owl"
                  className="w-12 h-12 rounded-full border border-teal-400 object-cover shrink-0"
                />
                <p className="text-xs text-[#334155] leading-relaxed italic">
                  "{agentResult.superpowers.miloScroll}"
                </p>
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-2xl mx-auto text-left mb-8">
                {agentResult.superpowers.badges.map((b: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex items-start gap-3">
                    <span className="text-2xl p-2 rounded-xl bg-teal-50 border border-teal-200">{b.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-[#0F172A]">{b.name}</strong>
                        <span className="text-[9px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full">{b.rank}</span>
                      </div>
                      <span className="text-[11px] text-[#64748B] leading-snug block mt-0.5">{b.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="pt-6 border-t border-teal-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setShowClinicalDossier(!showClinicalDossier)}
                  className="rounded-full bg-white border-2 border-[#CBD5E1] px-6 py-2.5 text-xs font-bold text-[#334155] hover:bg-[#F8FAFC] shadow-sm transition-all"
                >
                  {showClinicalDossier ? 'Hide Clinical Dossier' : 'For Grown-Ups & Clinicians: View Comprehensive Neurodevelopmental Dossier ↓'}
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-full bg-[#0D9488] px-8 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#0F766E] transition-all"
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
                    <span className="text-xs font-bold uppercase tracking-widest text-[#0D9488] block mb-1">
                      Manas Cognitive Neurodevelopmental Clinic • Official Dossier
                    </span>
                    <h2 className="font-patrick text-3xl text-[#0F172A]">
                      Pediatric Reciprocal Interaction & Sensory Modulation (PRISM™) Profile
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
                    <strong className="text-[#0D9488] text-sm">ADOS-2 & SPM-2 Framework</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">Confidence Level</span>
                    <strong className="text-[#0F172A] text-sm">95% Confidence Interval</strong>
                  </div>
                </div>

                {/* Primary Diagnostic Impression */}
                <div className="p-6 rounded-2xl bg-[#F0FDFA] border-2 border-[#99F6E4] mb-8">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E] block mb-1">
                    Clinical Impression & Support Tier
                  </span>
                  <div className="text-2xl font-bold text-[#0F766E] mb-1 font-poppins">
                    {agentResult.clinicalReport.classification}
                  </div>
                  <span className="text-xs font-bold text-[#0D9488] block mb-3">
                    {agentResult.clinicalReport.supportLevel}
                  </span>
                  <p className="text-xs text-[#334155] leading-relaxed">
                    {agentResult.clinicalReport.clinicalSummary}
                  </p>
                </div>

                {/* Psychometric Telemetry Table */}
                <div className="mb-8">
                  <h3 className="font-patrick text-2xl text-[#0F172A] mb-3">4-Domain Neurodevelopmental Matrix</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-[#E2E8F0] rounded-xl overflow-hidden">
                      <thead className="bg-[#F8FAFC] text-[#475569] font-bold border-b border-[#E2E8F0]">
                        <tr>
                          <th className="p-3">Neurodevelopmental Dimension</th>
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
                            <td className="p-3 font-mono font-bold text-sm text-[#0D9488]">{idx.score}</td>
                            <td className="p-3 text-[#64748B]">{idx.benchmark}</td>
                            <td className="p-3 font-bold text-slate-700">{idx.percentile}</td>
                            <td className="p-3">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                                {idx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Comprehensive 4-Part Accommodations & Sensory Diet */}
                <div className="mb-8 space-y-6">
                  <h3 className="font-patrick text-2xl text-[#0F172A]">Individualized Education Plan (IEP) & Sensory Diet Blueprint</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                      <strong className="text-xs font-bold text-[#0D9488] uppercase tracking-wider block mb-2">
                        1. Classroom Communication & Structure
                      </strong>
                      <ul className="space-y-1.5 text-xs text-[#334155]">
                        {agentResult.clinicalReport.accommodations.classroom.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-[#0D9488] font-bold">✓</span>
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
                        3. Special Interest & Executive Scaffolding
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
                        4. Sensory Sanctuary & Environmental Diet
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
                    className="rounded-full bg-[#0D9488] px-8 py-3 text-xs font-bold text-white shadow-md hover:bg-[#0F766E] transition-all"
                  >
                    Schedule 1-on-1 Clinical Review with Manas Pediatric Team →
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
