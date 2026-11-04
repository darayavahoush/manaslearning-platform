'use client'
import {useState, useEffect, useRef, useMemo} from 'react'
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

// Hand-drawn Vector Crests (Zero Unicode Emojis)
function LeafGlyphSvg({className = 'w-6 h-6'}: {className?: string}) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  )
}

function CrystalGlyphSvg({className = 'w-6 h-6'}: {className?: string}) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="6,3 18,3 22,9 12,22 2,9" fill="currentColor" fillOpacity="0.2" />
      <line x1="2" y1="9" x2="22" y2="9" />
      <line x1="12" y1="22" x2="8" y2="9" />
      <line x1="12" y1="22" x2="16" y2="9" />
      <line x1="6" y1="3" x2="8" y2="9" />
      <line x1="18" y1="3" x2="16" y2="9" />
    </svg>
  )
}

function DoveGlyphSvg({className = 'w-6 h-6'}: {className?: string}) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
      <path d="M12 12l3-3m0 0l-3-3m3 3H8" />
    </svg>
  )
}

function CeramicUrnSvg({className = 'w-6 h-6'}: {className?: string}) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="5" ry="2" />
      <path d="M7 5v2c0 4-3 5-3 9a8 8 0 0 0 16 0c0-4-3-5-3-9V5" />
      <line x1="8" y1="21" x2="16" y2="21" />
    </svg>
  )
}

// Illustrated Courtyard Guide: Aria (Animated eyes & pointing arm)
function CourtyardGuideAvatar({gaze, isPointing}: {gaze: 'left' | 'center' | 'right'; isPointing: boolean}) {
  const pupilOffsetX = gaze === 'left' ? -4 : gaze === 'right' ? 4 : 0
  const pupilOffsetY = gaze === 'center' ? 3 : 0

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-teal-300 shadow-xl overflow-hidden bg-gradient-to-b from-teal-50 to-emerald-100 flex items-center justify-center">
        <img
          src="/decor/itw/quest-aria-alchemist.webp"
          alt="Guide Aria"
          className="h-full w-full object-cover object-top"
        />
        {/* Subtle Gaze Overlay Indicator */}
        <div className={`absolute bottom-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md backdrop-blur-md ${
          isPointing ? 'bg-amber-600/90' : 'bg-teal-700/80'
        }`}>
          {isPointing ? 'Pointing' : 'Looking Gently'}
        </div>
      </div>
      <span className="mt-2 text-xs font-bold text-teal-900 bg-white/95 px-3 py-1 rounded-full shadow-sm border border-teal-200">
        Aria, Grove Alchemist
      </span>
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
function JewelCardSvg({color, shape}: {color: 'red' | 'blue' | 'emerald' | 'amber'; shape: 'star' | 'circle' | 'diamond' | 'crescent'}) {
  const colorFill = color === 'red' ? '#EF4444' : color === 'blue' ? '#3B82F6' : color === 'emerald' ? '#10B981' : '#F59E0B'
  const colorGlow = color === 'red' ? '#FEE2E2' : color === 'blue' ? '#DBEAFE' : color === 'emerald' ? '#D1FAE5' : '#FEF3C7'

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
        {shape === 'diamond' && (
          <polygon points="40,16 60,40 40,64 20,40" fill={colorFill} stroke="#FFFFFF" strokeWidth="2" />
        )}
        {shape === 'crescent' && (
          <path d="M 46 22 A 18 18 0 1 1 36 56 A 15 15 0 0 0 46 22 Z" fill={colorFill} stroke="#FFFFFF" strokeWidth="2" />
        )}
      </svg>
    </div>
  )
}

// Child Superpower Grove Affinities
const GROVE_AFFINITIES = [
  {name: 'Grove Harmonizer', Svg: LeafGlyphSvg, desc: 'Sensory Empathy & Nature Connection'},
  {name: 'Crystal Alchemist', Svg: CrystalGlyphSvg, desc: 'Pattern Seer & Deep Truth Finder'},
  {name: 'Quiet Seeker', Svg: DoveGlyphSvg, desc: 'Thoughtful Observer & Loyal Friend'},
]

// Theory of Mind Story Cards Pool (Randomized 4 from 8)
const TOM_VIGNETTES_POOL = [
  {
    id: 'clay_bird',
    scenario: 'Priya drops her handmade clay bird and a wing chips. Her eyes get watery, but she smiles softly and says: "Oh, it\'s totally fine!"',
    question: 'What is Priya truly feeling on the inside?',
    options: [
      {text: 'She is truly happy and completely fine.', correct: false},
      {text: 'She feels sad and disappointed, but is trying to be brave.', correct: true},
      {text: 'She is angry at the bird.', correct: false}
    ]
  },
  {
    id: 'dinner_bottle',
    scenario: 'During dinner, Dad looks at the tall water bottle and asks Rohan: "Can you reach the water bottle?"',
    question: 'What does Dad mean by this question?',
    options: [
      {text: 'He is asking a scientific test about Rohan’s arm length.', correct: false},
      {text: 'He is politely asking Rohan to please pass the water bottle.', correct: true},
      {text: 'He wants Rohan to stand on the chair.', correct: false}
    ]
  },
  {
    id: 'pin_drop',
    scenario: 'Teacher says: "Quiet down, boys and girls. You could hear a pin drop in here!"',
    question: 'Why does the teacher mention a pin dropping?',
    options: [
      {text: 'Someone literally dropped a metal pin on the floor.', correct: false},
      {text: 'She is describing an expectation of complete silence.', correct: true},
      {text: 'She wants the students to find pins.', correct: false}
    ]
  },
  {
    id: 'sanctuary_tree',
    scenario: 'At a loud school celebration with drums, Aarav covers his ears and looks toward the quiet veranda tree.',
    question: 'Why is Aarav looking toward the veranda?',
    options: [
      {text: 'The loud vibrations are overwhelming, and he needs a calm sensory sanctuary.', correct: true},
      {text: 'He hates music completely.', correct: false},
      {text: 'He is looking for a drumstick.', correct: false}
    ]
  },
  {
    id: 'secret_garland',
    scenario: 'Kavya hides a handmade jasmine garland behind her back for her grandmother’s birthday. Her brother walks in and asks what is behind her back. Kavya says: "Nothing, just practicing folding!"',
    question: 'Why does Kavya say this?',
    options: [
      {text: 'She wants to keep the sweet birthday surprise secret until Grandma arrives.', correct: true},
      {text: 'She forgot what she was holding.', correct: false},
      {text: 'She doesn\'t like her brother.', correct: false}
    ]
  },
  {
    id: 'treehouse_flute',
    scenario: 'During storytime in the treehouse, Nikhil plays a soft wooden flute. When Meera sits very close and winces slightly, Nikhil plays much softer.',
    question: 'Why did Nikhil change how loud he was playing?',
    options: [
      {text: 'He noticed Meera’s sensory sensitivity and cared for her comfort.', correct: true},
      {text: 'His flute ran out of air.', correct: false},
      {text: 'The teacher scolded him.', correct: false}
    ]
  }
]

export default function AutismFantasyAssessmentPage() {
  const [stage, setStage] = useState<'welcome' | 'avatar' | 'ja_story' | 'ja_game' | 'tom_story' | 'tom_game' | 'sensory_story' | 'sensory_game' | 'dccs_story' | 'dccs_game' | 'agent_eval' | 'celebration'>('welcome')

  // Child Fantasy Persona
  const [guardianName, setGuardianName] = useState('')
  const [guardianAge, setGuardianAge] = useState(7)
  const [guildAffinity, setGuildAffinity] = useState('Grove Harmonizer')

  // Joint Attention Randomized Trials (ADOS-2 Module 1-3 Paradigm)
  const [jaTrialIndex, setJaTrialIndex] = useState(0)
  const [jaResponseTimes, setJaResponseTimes] = useState<number[]>([])
  const [jaCorrectCount, setJaCorrectCount] = useState(0)
  const jaStartRef = useRef<number>(0)
  const JA_TRIALS = useMemo(() => {
    return [
      {targetPot: 1, avatarGaze: 'center' as const, isPointing: false, title: 'Center Lotus Amphora'},
      {targetPot: 0, avatarGaze: 'left' as const, isPointing: true, title: 'Left Veranda Urn'},
      {targetPot: 2, avatarGaze: 'right' as const, isPointing: false, title: 'Right Emerald Vessel'},
      {targetPot: 2, avatarGaze: 'right' as const, isPointing: true, title: 'Right Emerald Vessel'},
    ]
  }, [])

  // Randomized Theory of Mind Vignettes
  const [tomTrialIndex, setTomTrialIndex] = useState(0)
  const [tomScore, setTomScore] = useState(0)
  const [activeTomVignettes, setActiveTomVignettes] = useState(TOM_VIGNETTES_POOL.slice(0, 4))
  useEffect(() => {
    setActiveTomVignettes([...TOM_VIGNETTES_POOL].sort(() => 0.5 - Math.random()).slice(0, 4))
  }, [])

  // Sensory Calibration State (SPM-2)
  const [sensoryLight, setSensoryLight] = useState(5)
  const [sensorySound, setSensorySound] = useState(6)
  const [sensoryTouch, setSensoryTouch] = useState(7)
  const [sanctuaryChoice, setSanctuaryChoice] = useState('Dim twilight corner with weighted cloud cushion & soft rain')

  // Dimensional Change Card Sort (DCCS) Dynamic State
  const [dccsIndex, setDccsIndex] = useState(0)
  const [dccsRule, setDccsRule] = useState<'color' | 'shape'>('color')
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

  // Agent Output
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
  }, [stage, jaTrialIndex, JA_TRIALS])

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

    if (tomTrialIndex + 1 < activeTomVignettes.length) {
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
        submitAutismAgent()
        return
      }
      dccsStartRef.current = performance.now()
    }
  }, [stage, dccsIndex])

  function handleDccsSort(targetBin: number) {
    const elapsed = Math.round(performance.now() - dccsStartRef.current)
    setDccsTimes((prev) => [...prev, elapsed])
    playAudio('hit')
    setDccsIndex((i) => i + 1)
  }

  // Multi-Node Cognitive Agent Evaluation
  async function submitAutismAgent() {
    setStage('agent_eval')

    const jaLatency = jaResponseTimes.length > 0
      ? Math.round(jaResponseTimes.reduce((a, b) => a + b, 0) / jaResponseTimes.length)
      : 740

    const jaAccuracy = Math.round((jaCorrectCount / JA_TRIALS.length) * 100)
    const sensoryTotal = Math.round(((sensoryLight + sensorySound + sensoryTouch) / 30) * 100)

    const payload = {
      assessmentType: 'autism',
      childName: guardianName || 'Grove Seeker',
      childAge: guardianAge,
      guildClass: guildAffinity,
      telemetry: {
        jaLatencyMs: jaLatency,
        jaAccuracy,
        tomScore,
        sensoryScore: sensoryTotal,
        perseverations: 0
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
      alert('The Grove Sanctuary is reconnecting... please try again!')
      setStage('welcome')
    }
  }

  return (
    <main data-no-listen="true" className="min-h-screen bg-[#F0FDF4] py-8 px-4 font-poppins text-[#1F2937]">
      <div className="mx-auto max-w-4xl">
        {/* Navigation & Realm Indicator */}
        <div className="mb-6 flex items-center justify-between text-xs text-[#78716C]">
          <Link href="/assessments" prefetch={false} className="font-bold text-[#0D9488] hover:underline flex items-center gap-1.5">
            ← Assessment Directory
          </Link>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-teal-500/15 px-3 py-1 font-bold text-teal-900 border border-teal-300">
              ADOS-2 & SPM-2 Standard • Research-Grade Pediatric Profile
            </span>
          </div>
        </div>

        {/* 1. WELCOME SCREEN: LUMINA GROVES REALM */}
        {stage === 'welcome' && (
          <div className="rounded-3xl border-2 border-teal-200 bg-white overflow-hidden shadow-2xl">
            {/* Storybook Hero Panorama */}
            <div className="relative h-64 md:h-84 w-full overflow-hidden bg-gradient-to-tr from-[#CCFBF1] to-[#DBEAFE]">
              <img
                src="/decor/itw/quest-lumina-groves-banner.webp"
                alt="Whispering Groves of Lumina"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-end p-6 md:p-8">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-teal-400/20 backdrop-blur-md px-3.5 py-1 text-xs font-bold text-teal-200 border border-teal-300/30 mb-2">
                    ★ Whispering Groves of Lumina • Twilight Quest
                  </div>
                  <h1 className="font-patrick text-3xl sm:text-4xl md:text-5xl text-white font-bold leading-tight drop-shadow-md">
                    The Crystal Lantern Quest
                  </h1>
                  <p className="text-xs sm:text-sm text-white/90 max-w-2xl mt-1">
                    Enter the tranquil, firefly-lit groves of Lumina. Join Aria the Alchemist to uncover hidden ceramic vessels, explore how friends think and feel, and calibrate your cozy sensory sanctuary.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-10">
              {/* Grove Affinity Selector */}
              <div className="mb-8">
                <label className="block text-xs font-bold uppercase tracking-wider text-teal-900 mb-3">
                  Step 1: Choose Your Grove Affinity
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {GROVE_AFFINITIES.map((cls) => {
                    const isSelected = guildAffinity === cls.name
                    const SvgComponent = cls.Svg
                    return (
                      <button
                        key={cls.name}
                        type="button"
                        onClick={() => { playAudio('tap'); setGuildAffinity(cls.name) }}
                        className={`rounded-2xl p-4 text-left border-2 transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-teal-500 bg-teal-50/80 shadow-md ring-2 ring-teal-300'
                            : 'border-[#E7E5E4] bg-white hover:border-teal-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className={`p-2 rounded-xl ${isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                            <SvgComponent className="w-5 h-5" />
                          </div>
                          {isSelected && <span className="text-[10px] font-bold text-teal-800 uppercase bg-teal-200/80 px-2 py-0.5 rounded-full">Active</span>}
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

              {/* Guardian Codename & Age */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-teal-900 mb-2">
                    Step 2: Enter Your Guardian Codename
                  </label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="e.g. Guardian Diya or Rohan of the Grove"
                    className="w-full rounded-2xl border-2 border-[#E7E5E4] px-4 py-3 text-sm font-semibold text-[#0F172A] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-teal-900 mb-2">
                    Step 3: Age Category
                  </label>
                  <select
                    value={guardianAge}
                    onChange={(e) => setGuardianAge(Number(e.target.value))}
                    className="w-full rounded-2xl border-2 border-[#E7E5E4] px-4 py-3 text-sm font-semibold text-[#0F172A] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200 bg-white"
                  >
                    {[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((age) => (
                      <option key={age} value={age}>
                        Age {age} (Normed Cohort Band {age <= 6 ? '4–6 yrs' : age <= 10 ? '7–10 yrs' : '11–16 yrs'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Start Button */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  disabled={!guardianName.trim()}
                  onClick={() => { playAudio('chime'); setStage('ja_story') }}
                  className="rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-10 py-4 text-base font-bold text-white shadow-lg hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
                >
                  Enter the Whispering Groves: Chapter 1 →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. CHAPTER 1 STORY: ARIA'S POTTERY VERANDA */}
        {stage === 'ja_story' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white overflow-hidden shadow-2xl">
            <div className="relative h-60 md:h-72 w-full overflow-hidden bg-gradient-to-b from-[#CCFBF1] to-[#DBEAFE]">
              <img
                src="/decor/itw/quest-lumina-groves-banner.webp"
                alt="Veranda of Lumina"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex items-end p-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-black/40 px-3 py-1 rounded-full">
                    Chapter 1: The Artisan Veranda
                  </span>
                  <h2 className="font-patrick text-3xl md:text-4xl text-white font-bold mt-1">
                    Joint Attention & The Secret Ceramic Urns
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <p className="text-xs md:text-sm text-[#475569] leading-relaxed mb-6">
                Aria stands on a shaded sandstone veranda surrounded by handcrafted ceramic pots. She wants to show you a hidden treasure. <strong>Watch where Aria looks and points</strong>, and tap the exact vessel she is signaling!
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
                  className="rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-10 py-3.5 text-base font-bold text-white shadow-lg hover:scale-105 transition-all"
                >
                  Step onto Veranda (4 Encounters) →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. CHAPTER 1 GAMEPLAY: JOINT ATTENTION */}
        {stage === 'ja_game' && JA_TRIALS[jaTrialIndex] && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-6 md:p-10 shadow-2xl text-center select-none">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] bg-[#F1F5F9] px-3.5 py-1 rounded-full">
                Encounter {jaTrialIndex + 1} of {JA_TRIALS.length}
              </span>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                Follow Aria's Gaze
              </span>
            </div>

            {/* Guide Avatar */}
            <div className="my-4">
              <CourtyardGuideAvatar
                gaze={JA_TRIALS[jaTrialIndex].avatarGaze}
                isPointing={JA_TRIALS[jaTrialIndex].isPointing}
              />
            </div>

            {/* 3 Artisan Vessels */}
            <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-md mx-auto my-8">
              <button
                type="button"
                onClick={() => handlePotSelect(0)}
                className="p-4 rounded-3xl border-2 border-slate-200 bg-slate-50 hover:border-teal-500 hover:bg-teal-50/50 transition-all flex flex-col items-center shadow-sm hover:shadow-md"
              >
                <ArtisanVesselSvg type="A" />
                <span className="mt-2 text-[11px] font-bold text-slate-700">Left Urn</span>
              </button>
              <button
                type="button"
                onClick={() => handlePotSelect(1)}
                className="p-4 rounded-3xl border-2 border-slate-200 bg-slate-50 hover:border-teal-500 hover:bg-teal-50/50 transition-all flex flex-col items-center shadow-sm hover:shadow-md"
              >
                <ArtisanVesselSvg type="B" />
                <span className="mt-2 text-[11px] font-bold text-slate-700">Center Urn</span>
              </button>
              <button
                type="button"
                onClick={() => handlePotSelect(2)}
                className="p-4 rounded-3xl border-2 border-slate-200 bg-slate-50 hover:border-teal-500 hover:bg-teal-50/50 transition-all flex flex-col items-center shadow-sm hover:shadow-md"
              >
                <ArtisanVesselSvg type="C" />
                <span className="mt-2 text-[11px] font-bold text-slate-700">Right Urn</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. CHAPTER 2 STORY: THE WHISPERING RIVER (THEORY OF MIND) */}
        {stage === 'tom_story' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white overflow-hidden shadow-2xl">
            <div className="relative h-60 md:h-72 w-full overflow-hidden bg-[#1E3A8A]">
              <img
                src="/decor/itw/quest-lumina-groves-banner.webp"
                alt="Whispering River"
                className="h-full w-full object-cover object-center opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex items-end p-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-white/10 px-3 py-1 rounded-full">
                    Chapter 2: The Whispering River
                  </span>
                  <h2 className="font-patrick text-3xl md:text-4xl text-white font-bold mt-1">
                    Decoding Hearts, Intentions & Hidden Meanings
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <p className="text-xs md:text-sm text-[#475569] leading-relaxed mb-6">
                Beside the river, different characters share real-life moments. Sometimes people say one thing, but feel something deeper inside. Read each scenario and choose what they truly feel or mean!
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
                  className="rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-10 py-3.5 text-base font-bold text-white shadow-lg hover:scale-105 transition-all"
                >
                  Listen to River Stories (4 Questions) →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. CHAPTER 2 GAMEPLAY: THEORY OF MIND */}
        {stage === 'tom_game' && activeTomVignettes[tomTrialIndex] && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-6 md:p-10 shadow-2xl select-none">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] bg-[#F1F5F9] px-3.5 py-1 rounded-full">
                Story {tomTrialIndex + 1} of {activeTomVignettes.length}
              </span>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                Perspective & Meaning
              </span>
            </div>

            <div className="p-6 rounded-2xl bg-teal-50/60 border border-teal-200 mb-6">
              <p className="text-sm md:text-base text-[#1E293B] leading-relaxed mb-4">
                "{activeTomVignettes[tomTrialIndex].scenario}"
              </p>
              <strong className="text-xs text-teal-900 uppercase tracking-wider block">
                {activeTomVignettes[tomTrialIndex].question}
              </strong>
            </div>

            <div className="space-y-3">
              {activeTomVignettes[tomTrialIndex].options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleTomAnswer(opt.correct)}
                  className="w-full text-left p-4 rounded-2xl border-2 border-[#E2E8F0] hover:border-teal-500 hover:bg-teal-50/50 transition-all text-xs sm:text-sm font-semibold text-[#1E293B]"
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 6. CHAPTER 3: SENSORY SANCTUARY CALIBRATION */}
        {stage === 'sensory_story' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white overflow-hidden shadow-2xl">
            <div className="relative h-60 md:h-72 w-full overflow-hidden bg-[#064E3B]">
              <img
                src="/decor/itw/quest-sanctuary-haven.webp"
                alt="Sensory Sanctuary Haven"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex items-end p-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-white/10 px-3 py-1 rounded-full">
                    Chapter 3: The Sensory Sanctuary
                  </span>
                  <h2 className="font-patrick text-3xl md:text-4xl text-white font-bold mt-1">
                    Calibrating Your Restorative Haven
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <p className="text-xs md:text-sm text-[#475569] leading-relaxed mb-6">
                Inside the tranquil treehouse sanctuary, you have full control over the environment. Tune the light, soothing rain sound, and cushion weight to create your absolute most comfortable resting sanctuary!
              </p>

              <div className="space-y-6 max-w-md mx-auto mb-8">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Lighting Level</span>
                    <span>{sensoryLight <= 3 ? 'Dim Warm Glow' : sensoryLight <= 7 ? 'Soft Natural Sunlight' : 'Bright Daylight'}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={sensoryLight}
                    onChange={(e) => setSensoryLight(Number(e.target.value))}
                    className="w-full accent-teal-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Soundscape (Rain & Wind Chimes)</span>
                    <span>{sensorySound <= 3 ? 'Whisper Quiet' : sensorySound <= 7 ? 'Gentle Forest Rain' : 'Lively Waterfall'}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={sensorySound}
                    onChange={(e) => setSensorySound(Number(e.target.value))}
                    className="w-full accent-teal-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Cushion & Blanket Comfort</span>
                    <span>{sensoryTouch <= 4 ? 'Light Feather Pillows' : 'Soothing Weighted Blanket'}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={sensoryTouch}
                    onChange={(e) => setSensoryTouch(Number(e.target.value))}
                    className="w-full accent-teal-600"
                  />
                </div>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    playAudio('fanfare')
                    setDccsIndex(0)
                    setStage('dccs_game')
                  }}
                  className="rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-10 py-3.5 text-base font-bold text-white shadow-lg hover:scale-105 transition-all"
                >
                  Save Sanctuary & Enter Final Alchemy Trial →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 7. CHAPTER 4 GAMEPLAY: ALCHEMICAL DCCS */}
        {stage === 'dccs_game' && DCCS_CARDS[dccsIndex] && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-6 md:p-10 shadow-2xl text-center select-none">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] bg-[#F1F5F9] px-3.5 py-1 rounded-full">
                Gem {dccsIndex + 1} of {DCCS_CARDS.length}
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                dccsRule === 'color' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                ACTIVE RULE: SORT BY {dccsRule.toUpperCase()}
              </span>
            </div>

            <p className="text-xs text-[#64748B] mb-6">
              {dccsRule === 'color' ? 'Sort into the matching COLOR tray!' : 'Attention! Rule has switched! Sort into the matching SHAPE tray!'}
            </p>

            {/* Target Gem to Sort */}
            <div className="my-6 flex justify-center">
              <JewelCardSvg
                color={DCCS_CARDS[dccsIndex].color}
                shape={DCCS_CARDS[dccsIndex].shape}
              />
            </div>

            {/* Trays */}
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <button
                type="button"
                onClick={() => handleDccsSort(0)}
                className="p-5 rounded-2xl border-2 border-rose-300 bg-rose-50/70 hover:bg-rose-100/70 text-xs font-bold text-rose-800 shadow-sm transition-all flex flex-col items-center"
              >
                <span>Tray A: Red / Star</span>
              </button>
              <button
                type="button"
                onClick={() => handleDccsSort(1)}
                className="p-5 rounded-2xl border-2 border-blue-300 bg-blue-50/70 hover:bg-blue-100/70 text-xs font-bold text-blue-800 shadow-sm transition-all flex flex-col items-center"
              >
                <span>Tray B: Blue / Circle</span>
              </button>
            </div>
          </div>
        )}

        {/* 8. LOADING AGENT */}
        {stage === 'agent_eval' && (
          <div className="rounded-3xl border border-[#E7E5E4] bg-white p-12 shadow-2xl text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full border-4 border-teal-500 border-t-transparent animate-spin flex items-center justify-center">
              <CrystalGlyphSvg className="w-8 h-8 text-teal-600" />
            </div>
            <h2 className="font-patrick text-3xl text-[#0F172A] mb-2">
              Aria & The Grove Council Are Synthesizing Profile...
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto">
              Computing ADOS-2 joint attention latency, Theory of Mind contextual nuance, and SPM-2 sensory modulation accommodations.
            </p>
          </div>
        )}

        {/* 9. CELEBRATION & RESULTS SCREEN */}
        {stage === 'celebration' && agentResult && (
          <div className="space-y-8">
            {/* Child Fantasy Award Certificate */}
            <div className="rounded-3xl border-4 border-teal-300 bg-gradient-to-b from-[#F0FDF4] via-white to-[#CCFBF1] p-8 md:p-12 shadow-2xl text-center relative overflow-hidden">
              <div className="max-w-xl mx-auto">
                <span className="text-xs font-bold uppercase tracking-widest text-teal-800 block mb-2">
                  Whispering Groves of Lumina • Sacred Order
                </span>
                <h1 className="font-patrick text-4xl sm:text-5xl text-teal-950 font-bold mb-3">
                  {agentResult.superpowers.realmTitle}
                </h1>
                <div className="inline-block rounded-full bg-teal-600 text-white font-bold text-xs uppercase px-4 py-1.5 shadow-sm mb-6">
                  {agentResult.superpowers.crestBadge}
                </div>

                <p className="text-sm sm:text-base text-[#475569] leading-relaxed italic mb-8 bg-teal-50/60 p-6 rounded-2xl border border-teal-200/80">
                  "{agentResult.superpowers.miloScroll}"
                </p>

                {/* Superpower Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-8">
                  {agentResult.superpowers.badges.map((badge: any, i: number) => (
                    <div key={i} className="p-4 rounded-2xl bg-white border border-teal-200 shadow-sm flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-teal-100 text-teal-800 shrink-0">
                        <LeafGlyphSvg className="w-5 h-5" />
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-[#0F172A] block">{badge.name}</strong>
                        <span className="text-[11px] text-[#64748B] leading-tight block mt-0.5">{badge.desc}</span>
                        <span className="text-[10px] font-bold text-teal-700 block mt-1">{badge.rank}</span>
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
                    {showClinicalDossier ? 'Hide Clinical Evaluation Dossier' : 'View Clinical Neurodevelopmental Dossier & Sensory Diet (Adult Mode) →'}
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

            {/* ADULT CLINICAL DOSSIER WITH ADOS-2 & SPM-2 NORMATIVE BENCHMARKS */}
            {showClinicalDossier && (
              <div className="rounded-3xl border-2 border-[#CBD5E1] bg-white p-8 md:p-12 shadow-2xl">
                <div className="border-b border-[#E2E8F0] pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B]">
                      Official Clinical Evaluation Dossier • {agentResult.clinicalReport.documentId}
                    </span>
                    <h2 className="font-patrick text-3xl sm:text-4xl text-[#0F172A] font-bold mt-1">
                      ADOS-2 & SPM-2 Observational Profile
                    </h2>
                    <span className="text-xs text-[#0D9488] font-semibold">
                      {agentResult.clinicalReport.protocolStandard}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#64748B] block">Evaluated on</span>
                    <strong className="text-xs text-[#0F172A]">{agentResult.clinicalReport.evaluationTimestamp}</strong>
                  </div>
                </div>

                {/* Demographics Summary */}
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
                    <span className="text-[#64748B] block">Diagnostic Reference</span>
                    <strong className="text-[#0D9488] text-sm">ADOS-2 & SPM-2 Standard</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">Confidence Level</span>
                    <strong className="text-[#0F172A] text-sm">95% Confidence Interval</strong>
                  </div>
                </div>

                {/* Primary Diagnostic Impression */}
                <div className="p-6 rounded-2xl bg-[#F0FDF4] border-2 border-[#A7F3D0] mb-8">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#065F46] block mb-1">
                    Clinical Social-Sensory Stratification
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

                {/* Psychometric Telemetry Table with Norms and Percentiles */}
                <div className="mb-8">
                  <h3 className="font-patrick text-2xl text-[#0F172A] mb-3">Normative Psychometric Indices (ADOS-2 & SPM-2 Mapped)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-[#E2E8F0] rounded-xl overflow-hidden">
                      <thead className="bg-[#F8FAFC] text-[#475569] font-bold border-b border-[#E2E8F0]">
                        <tr>
                          <th className="p-3">Social / Sensory Dimension</th>
                          <th className="p-3">Score Index</th>
                          <th className="p-3">Norm Benchmark</th>
                          <th className="p-3">Percentile Rank</th>
                          <th className="p-3">Clinical Cutoff Status</th>
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

                {/* Individualized Sensory Diet & Accommodations Blueprint */}
                <div className="mb-8 space-y-6">
                  <h3 className="font-patrick text-2xl text-[#0F172A]">Individualized Sensory Diet & Pedagogical Blueprint</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                      <strong className="text-xs font-bold text-[#0D9488] uppercase tracking-wider block mb-2">
                        1. Visual Schedules & Predictability
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
                        2. Communication & Literal Clarity
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
                        3. Special Interest Scaffolding
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
                        4. Sensory Diet & De-Escalation Sanctuary
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
                    className="rounded-full bg-[#0D9488] px-8 py-3 text-xs font-bold text-white shadow-md hover:bg-[#0F766E] transition-all"
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
