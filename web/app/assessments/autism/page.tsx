'use client'
import ClinicianReportButton from '../../../components/assessments/ClinicianReport'
import {useState, useEffect, useRef, useMemo} from 'react'
import Link from 'next/link'
import KeeperFeedback from '../../../components/assessments/KeeperFeedback'
import {QuestStyles, Fireflies, AmbientToggle, GazeGuide} from '../../../components/assessments/QuestFX'

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

function ForestSpriteFaceSvg({emotion, className = 'w-24 h-24'}: {emotion: 'happy' | 'sad' | 'surprised' | 'calm'; className?: string}) {
  if (emotion === 'happy') {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="44" fill="#FEF08A" stroke="#EAB308" strokeWidth="4" />
        <ellipse cx="34" cy="42" rx="4" ry="6" fill="#713F12" />
        <ellipse cx="66" cy="42" rx="4" ry="6" fill="#713F12" />
        <circle cx="36" cy="40" r="2" fill="#FFFFFF" />
        <circle cx="68" cy="40" r="2" fill="#FFFFFF" />
        <path d="M 32 58 Q 50 78 68 58" stroke="#713F12" strokeWidth="5" strokeLinecap="round" fill="#F87171" />
        <circle cx="24" cy="52" r="5" fill="#FCA5A5" opacity="0.6" />
        <circle cx="76" cy="52" r="5" fill="#FCA5A5" opacity="0.6" />
        <path d="M 28 32 Q 34 28 40 32" stroke="#713F12" strokeWidth="3" strokeLinecap="round" />
        <path d="M 60 32 Q 66 28 72 32" stroke="#713F12" strokeWidth="3" strokeLinecap="round" />
      </svg>
    )
  }
  if (emotion === 'sad') {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="44" fill="#BFDBFE" stroke="#3B82F6" strokeWidth="4" />
        <ellipse cx="35" cy="45" rx="4" ry="5" fill="#1E3A8A" />
        <ellipse cx="65" cy="45" rx="4" ry="5" fill="#1E3A8A" />
        <path d="M 30 36 Q 36 40 42 38" stroke="#1E3A8A" strokeWidth="3" strokeLinecap="round" />
        <path d="M 58 38 Q 64 40 70 36" stroke="#1E3A8A" strokeWidth="3" strokeLinecap="round" />
        <path d="M 36 66 Q 50 54 64 66" stroke="#1E3A8A" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M 68 52 C 68 52 72 58 68 62 C 64 62 64 56 68 52 Z" fill="#60A5FA" />
      </svg>
    )
  }
  if (emotion === 'surprised') {
    return (
      <svg className={className} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="44" fill="#E9D5FF" stroke="#A855F7" strokeWidth="4" />
        <circle cx="34" cy="42" r="6" fill="#581C87" />
        <circle cx="66" cy="42" r="6" fill="#581C87" />
        <circle cx="36" cy="40" r="2" fill="#FFFFFF" />
        <circle cx="68" cy="40" r="2" fill="#FFFFFF" />
        <path d="M 28 30 Q 34 24 40 30" stroke="#581C87" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M 60 30 Q 66 24 72 30" stroke="#581C87" strokeWidth="3.5" strokeLinecap="round" />
        <ellipse cx="50" cy="64" rx="8" ry="12" fill="#581C87" />
      </svg>
    )
  }
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="44" fill="#BBF7D0" stroke="#22C55E" strokeWidth="4" />
      <path d="M 28 44 Q 34 50 40 44" stroke="#14532D" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M 60 44 Q 66 50 72 44" stroke="#14532D" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M 38 62 Q 50 68 62 62" stroke="#14532D" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M 50 20 Q 56 12 62 16" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

// Child Superpower Grove Affinities
const GROVE_AFFINITIES = [
  {name: 'Grove Harmonizer', Svg: LeafGlyphSvg, desc: 'Sensory Empathy & Nature Connection'},
  {name: 'Crystal Alchemist', Svg: CrystalGlyphSvg, desc: 'Pattern Seer & Deep Truth Finder'},
  {name: 'Quiet Seeker', Svg: DoveGlyphSvg, desc: 'Thoughtful Observer & Loyal Friend'},
]

// Chapter 2: The Forest Sprite's Emotion Mirror Trials (100% Visual Social Resonance Game)
const EMOTION_MIRROR_TRIALS = [
  {
    target: 'happy' as const,
    title: 'The Sunny Meadow Sprite',
    hint: 'Look at the sparkling smile and joyful eyes!',
    options: ['sad', 'happy', 'surprised'] as const
  },
  {
    target: 'sad' as const,
    title: 'The Raincloud Sprite',
    hint: 'Look at the soft drooping eyes and blue teardrop.',
    options: ['happy', 'sad', 'calm'] as const
  },
  {
    target: 'surprised' as const,
    title: 'The Starfall Wonder Sprite',
    hint: 'Look at the round starry eyes and amazed open mouth!',
    options: ['calm', 'surprised', 'sad'] as const
  },
  {
    target: 'calm' as const,
    title: 'The Whispering Breeze Sprite',
    hint: 'Look at the peaceful closed eyes and gentle breath.',
    options: ['surprised', 'happy', 'calm'] as const
  }
]

function __McInner() {
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
  const [jaReady, setJaReady] = useState(false)
  const JA_TRIALS = useMemo(() => {
    const names = ['Left Veranda Urn', 'Center Lotus Amphora', 'Right Emerald Vessel']
    const gz = ['left', 'center', 'right'] as const
    const list = [0, 1, 2].flatMap((p) => [false, true].map((pt) => ({targetPot: p, avatarGaze: gz[p] as 'left' | 'center' | 'right', isPointing: pt, title: names[p]})))
    // Fixed order so every child sees the same six trials: each pot once with and once without
    // pointing, no pot twice in a row, pointing alternates.
    return [0, 5, 2, 1, 4, 3].map((i) => list[i])
  }, [])

  // Chapter 2: Emotion Mirror State (Visual Social Recognition Game)
  const [tomTrialIndex, setTomTrialIndex] = useState(0)
  const [tomScore, setTomScore] = useState(0)

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
  const [keeperObs, setKeeperObs] = useState<any>(null)
  const [parentOk, setParentOk] = useState(false)
  const [notice, setNotice] = useState('')

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
    if (stage !== 'ja_game' || !jaReady) return
    setJaReady(false)
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

  // Chapter 2: Emotion Mirror Handling (Pure visual matching, zero reading questions)
  function handleEmotionSelect(selectedEmotion: string) {
    const isCorrect = selectedEmotion === EMOTION_MIRROR_TRIALS[tomTrialIndex].target
    if (isCorrect) {
      playAudio('chime')
      setTomScore((s) => s + 25)
    } else {
      playAudio('tap')
    }

    if (tomTrialIndex + 1 < EMOTION_MIRROR_TRIALS.length) {
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

    const medianOf = (xs: number[]) => {
      if (!xs.length) return null
      const s = [...xs].sort((a, b) => a - b)
      const m = Math.floor(s.length / 2)
      return Math.round(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2)
    }

    const payload = {
      assessmentType: 'autism',
      childName: guardianName || 'Grove Seeker',
      childAge: guardianAge,
      guildClass: guildAffinity,
      telemetry: {
        jaTrials: JA_TRIALS.length,
        jaCorrect: jaCorrectCount,
        jaMedianMs: medianOf(jaResponseTimes),
        feelingsTrials: EMOTION_MIRROR_TRIALS.length,
        feelingsCorrect: Math.round(tomScore / 25),
        lightLevel: sensoryLight,
        soundLevel: sensorySound,
        touchLevel: sensoryTouch,
        sortCount: dccsTimes.length,
        sortMedianMs: medianOf(dccsTimes)
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
    <main data-no-listen="true" className="relative min-h-screen bg-[#041D15] py-8 px-4 font-poppins text-[#1F2937] overflow-x-hidden selection:bg-teal-400 selection:text-teal-950">
      {/* Immersive Fantasy Whispering Groves Twilight Backdrop */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <QuestStyles />
        <Fireflies color="#6EE7B7" />
        {/* Full-bleed groves illustration with soft ambient atmospheric glow */}
        <img
          src="/decor/itw/quest-lumina-groves-banner.webp"
          alt="Whispering Groves Panorama"
          className="w-full h-full object-cover object-center opacity-30 filter blur-[2px] scale-105"
        />
        {/* Bioluminescent twilight ambient overlays & emerald firefly halos */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#041D15]/80 via-[#063324]/75 to-[#021811]/90" />
        <div className="absolute -top-40 left-1/3 w-[50rem] h-[30rem] rounded-full bg-gradient-to-b from-teal-400/20 via-emerald-500/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -left-32 w-96 h-96 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />
        {/* Gentle firefly particles pattern */}
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#34D399_1px,transparent_1px)] [background-size:28px_28px]" />
      </div>

      {notice && <div role="alert" className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-xl">{notice} <button type="button" className="ml-3 underline" onClick={() => setNotice('')}>Dismiss</button></div>}
      <AmbientToggle mood="groves" />
      <div key={stage} className="mx-auto max-w-4xl relative z-10 qd-stage">
        {/* Navigation & Realm Indicator */}
        <div className="mb-6 flex items-center justify-between text-xs">
          <Link href="/assessments" prefetch={false} className="font-bold text-teal-300 hover:text-teal-200 hover:underline flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-teal-300/30 shadow-sm">
            ← Assessment Directory
          </Link>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-black/40 backdrop-blur-md px-3.5 py-1.5 font-bold text-teal-200 border border-teal-400/40 shadow-sm">
              Play-Based Social & Sensory Quest • Not a Diagnosis
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
                  disabled={!guardianName.trim() || !parentOk}
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
          <div className="rounded-3xl border-2 border-teal-300/40 bg-white/95 backdrop-blur-md overflow-hidden shadow-2xl">
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
                  Step onto Veranda ({JA_TRIALS.length} Encounters) →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. CHAPTER 1 GAMEPLAY: JOINT ATTENTION */}
        {stage === 'ja_game' && JA_TRIALS[jaTrialIndex] && (
          <div className="rounded-3xl border-2 border-teal-300/40 bg-white/95 backdrop-blur-md p-6 md:p-10 shadow-2xl text-center select-none">
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
              <GazeGuide
                key={jaTrialIndex}
                gaze={JA_TRIALS[jaTrialIndex].avatarGaze}
                isPointing={JA_TRIALS[jaTrialIndex].isPointing}
                onCue={() => { jaStartRef.current = performance.now(); setJaReady(true) }}
              />
            </div>

            {/* 3 Artisan Vessels */}
            <div className={`grid grid-cols-3 gap-3 md:gap-6 max-w-md mx-auto my-8 transition-opacity ${jaReady ? '' : 'opacity-50'}`}>
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

        {/* 4. CHAPTER 2 STORY: THE EMOTION MIRROR */}
        {stage === 'tom_story' && (
          <div className="rounded-3xl border-2 border-teal-300/40 bg-white/95 backdrop-blur-md overflow-hidden shadow-2xl">
            <div className="relative h-60 md:h-72 w-full overflow-hidden bg-[#1E3A8A]">
              <img
                src="/decor/itw/quest-lumina-groves-banner.webp"
                alt="Emotion Mirror"
                className="h-full w-full object-cover object-center opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex items-end p-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-white/10 px-3 py-1 rounded-full">
                    Chapter 2: The Crystal Emotion Mirror
                  </span>
                  <h2 className="font-patrick text-3xl md:text-4xl text-white font-bold mt-1">
                    The Forest Sprite’s Feelings Game
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 text-center">
              <p className="text-sm md:text-base text-[#1E293B] font-medium leading-relaxed mb-6 max-w-lg mx-auto">
                Look into the magical forest mirror! The Forest Sprite will show different feelings. Tap the emotion crystal that matches the Sprite’s face!
              </p>

              <div className="flex items-center justify-center gap-6 mb-8">
                <div className="flex flex-col items-center">
                  <ForestSpriteFaceSvg emotion="happy" className="w-16 h-16 drop-shadow-md" />
                  <span className="text-xs font-bold text-amber-700 mt-1">Happy</span>
                </div>
                <div className="flex flex-col items-center">
                  <ForestSpriteFaceSvg emotion="sad" className="w-16 h-16 drop-shadow-md" />
                  <span className="text-xs font-bold text-blue-700 mt-1">Sad</span>
                </div>
                <div className="flex flex-col items-center">
                  <ForestSpriteFaceSvg emotion="surprised" className="w-16 h-16 drop-shadow-md" />
                  <span className="text-xs font-bold text-purple-700 mt-1">Surprised</span>
                </div>
                <div className="flex flex-col items-center">
                  <ForestSpriteFaceSvg emotion="calm" className="w-16 h-16 drop-shadow-md" />
                  <span className="text-xs font-bold text-emerald-700 mt-1">Calm</span>
                </div>
              </div>

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
                  Peer into the Emotion Mirror (4 Mini Rounds) →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. CHAPTER 2 GAMEPLAY: EMOTION MIRROR */}
        {stage === 'tom_game' && EMOTION_MIRROR_TRIALS[tomTrialIndex] && (
          <div className="rounded-3xl border-2 border-teal-300/40 bg-white/95 backdrop-blur-md p-6 md:p-10 shadow-2xl text-center select-none">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] bg-[#F1F5F9] px-3.5 py-1 rounded-full">
                Round {tomTrialIndex + 1} of {EMOTION_MIRROR_TRIALS.length}
              </span>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                Match the Sprite's Feeling
              </span>
            </div>

            {/* The Enchanted Mirror Frame with Sprite Face */}
            <div className="relative mx-auto my-6 flex h-48 w-48 sm:h-56 sm:w-56 items-center justify-center rounded-full border-8 border-teal-300/80 bg-gradient-to-b from-[#064E3B] via-[#022C22] to-[#01140E] shadow-[0_0_40px_rgba(20,184,166,0.35)] overflow-hidden">
              <div className="animate-bounce">
                <ForestSpriteFaceSvg
                  emotion={EMOTION_MIRROR_TRIALS[tomTrialIndex].target}
                  className="w-28 h-28 sm:w-32 sm:h-32 drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]"
                />
              </div>
            </div>

            <p className="font-patrick text-xl sm:text-2xl text-teal-900 font-bold mb-6">
              Which emotion crystal feels like the Forest Sprite?
            </p>

            {/* 3 Emotion Crystal Choice Buttons */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-lg mx-auto">
              {EMOTION_MIRROR_TRIALS[tomTrialIndex].options.map((emotionOpt) => (
                <button
                  key={emotionOpt}
                  type="button"
                  onClick={() => handleEmotionSelect(emotionOpt)}
                  className="p-4 sm:p-5 rounded-3xl border-2 border-[#E2E8F0] bg-white hover:border-teal-500 hover:bg-teal-50/70 hover:scale-105 active:scale-95 transition-all flex flex-col items-center shadow-md hover:shadow-xl"
                >
                  <ForestSpriteFaceSvg emotion={emotionOpt} className="w-14 h-14 sm:w-16 sm:h-16" />
                  <span className="mt-2 text-xs sm:text-sm font-bold capitalize text-slate-800">
                    {emotionOpt}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 6. CHAPTER 3: SENSORY SANCTUARY CALIBRATION */}
        {stage === 'sensory_story' && (
          <div className="rounded-3xl border-2 border-teal-300/40 bg-white/95 backdrop-blur-md overflow-hidden shadow-2xl">
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
          <div className="rounded-3xl border-2 border-teal-300/40 bg-white/95 backdrop-blur-md p-6 md:p-10 shadow-2xl text-center select-none">
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
          <div className="rounded-3xl border-2 border-teal-300/40 bg-white/95 backdrop-blur-md p-12 shadow-2xl text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full border-4 border-teal-500 border-t-transparent animate-spin flex items-center justify-center">
              <CrystalGlyphSvg className="w-8 h-8 text-teal-600" />
            </div>
            <h2 className="font-patrick text-3xl text-[#0F172A] mb-2">
              Aria and the Grove Council are writing your summary...
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto">
              Turning the play into a plain-language summary.
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
                <KeeperFeedback quest="autism" nickname={guardianName || 'Explorer'} observations={keeperObs} />
              </div>
            )}

            {agentResult && showClinicalDossier && (() => { const a: any = agentResult; return (
              <div className="mb-4 flex justify-center"><ClinicianReportButton quest="autism" nickname={a.childName} age={a.childAge} generatedOn={a.clinicalReport?.generatedOn} rows={a.clinicalReport?.indices ?? []} clinicianQuestions={a.clinicalReport?.questions ?? []} /></div>
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
                      <div className="font-mono font-bold text-sm mt-1" style={{color: '#0D9488'}}>{idx.value}</div>
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
                        <span className="font-bold" style={{color: '#0D9488'}}>?</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Individualized Sensory Diet & Accommodations Blueprint */}
                <div className="mb-8 space-y-6">
                  <h3 className="font-patrick text-2xl text-[#0F172A]">Ideas to discuss with your school or clinician</h3>

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
