/* eslint-disable */
'use client'
import WelcomeWizard from '../../../components/assessments/WelcomeWizard'
import {GroveHarmonizerAvatarSvg, CrystalAlchemistAvatarSvg, QuietSeekerAvatarSvg} from '../../../components/assessments/CharacterAvatars'
import ReadAloud from '../../../components/assessments/ReadAloud'
import ClinicianReportButton from '../../../components/assessments/ClinicianReport'
import SessionRecordDownload from '../../../components/assessments/SessionRecordDownload'
import {captureEnvironment} from '../../../components/assessments/session-record'
import {usePlayEvents} from '../../../components/assessments/play-events'
import {startRoomSound, type RoomSound} from '../../../components/assessments/RoomSound'
import ParentCard, {type ParentAnswers} from '../../../components/assessments/ParentCard'
import {useState, useEffect, useRef, useMemo} from 'react'
import Link from 'next/link'
import KeeperFeedback from '../../../components/assessments/KeeperFeedback'
import EndReport from '../../../components/assessments/report/EndReport'
import CognitiveDossierView from '../../../components/assessments/report/CognitiveDossierView'
import {useAttentionCamera} from '../../../components/assessments/camera/useAttentionCamera'
import CameraConsent, {CameraBadge} from '../../../components/assessments/camera/CameraConsent'
import LookingGame from '../../../components/assessments/camera/LookingGame'
import {QuestStyles, Fireflies, AmbientToggle, GazeGuide} from '../../../components/assessments/QuestFX'

// Enchanted Web Audio & Original Orchestral Chimes
function playAudio(type: 'hit' | 'chime' | 'sensory' | 'tap' | 'fanfare' | 'whoosh' | 'miss') {
  if (typeof window === 'undefined') return
  try {
    const audioMap: Record<string, string> = {
      hit: '/quests/autism/audio/correct.mp3',
      chime: '/quests/autism/audio/correct.mp3',
      sensory: '/quests/autism/audio/tap.mp3',
      tap: '/quests/autism/audio/tap.mp3',
      whoosh: '/quests/autism/audio/tap.mp3',
      miss: '/quests/autism/audio/try_again.mp3',
      fanfare: '/quests/autism/audio/complete.mp3',
    }
    const src = audioMap[type]
    if (src) {
      const snd = new Audio(src)
      snd.volume = 0.2
      snd.play().catch(() => {})
      return
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

// Handcrafted Ceramic Vessels with Original Illustrated Gouache Urns
function ArtisanVesselSvg({type}: {type: 'A' | 'B' | 'C'}) {
  const src = type === 'A'
    ? '/quests/autism/vessel_veranda.webp'
    : type === 'B'
    ? '/quests/autism/vessel_lotus.webp'
    : '/quests/autism/vessel_emerald.webp'
  const label = type === 'A' ? 'Veranda Terracotta Urn' : type === 'B' ? 'Lotus Bloom Urn' : 'Emerald Glaze Urn'
  return (
    <div className="w-full h-full flex items-center justify-center p-1">
      <img
        src={src}
        alt={label}
        className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-md select-none transition-transform duration-300"
        width={160}
        height={180}
      />
    </div>
  )
}

// Multifaceted 3D Alchemical Gemstones (Zero Pixelation, Crisp Vector Facets & Ambient Aura)
function AlchemicalGemstone({
  color,
  shape,
  size = 'md',
  className = '',
}: {
  color: 'red' | 'blue' | 'emerald' | 'amber'
  shape: 'star' | 'circle' | 'diamond' | 'crescent'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20 sm:w-24 sm:h-24',
    lg: 'w-28 h-28 sm:w-32 sm:h-32',
    xl: 'w-36 h-36 sm:w-40 sm:h-40',
  }[size]

  const isRed = color === 'red'
  const isBlue = color === 'blue'
  const isEmerald = color === 'emerald'
  const isAmber = color === 'amber'

  const idPrefix = `gem-${color}-${shape}-${size}`

  return (
    <div className={`relative flex items-center justify-center select-none ${sizeClasses} ${className}`}>
      {/* Outer Luminous Magical Aura */}
      <div
        className={`absolute inset-[-15%] rounded-full blur-lg pointer-events-none transition-opacity duration-300 ${
          isRed
            ? 'bg-rose-500/40'
            : isBlue
            ? 'bg-sky-500/40'
            : isEmerald
            ? 'bg-emerald-500/40'
            : 'bg-amber-500/40'
        }`}
      />

      <svg
        viewBox="0 0 100 100"
        className="w-full h-full relative z-10 drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Radial Ambient Aura */}
          <radialGradient id={`${idPrefix}-glow`} cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              stopColor={isRed ? '#F43F5E' : isBlue ? '#38BDF8' : isEmerald ? '#34D399' : '#FBBF24'}
              stopOpacity="0.6"
            />
            <stop
              offset="80%"
              stopColor={isRed ? '#881337' : isBlue ? '#0369A1' : isEmerald ? '#065F46' : '#92400E'}
              stopOpacity="0.15"
            />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* Spherical Cabochon Base Gradient */}
          <radialGradient id={`${idPrefix}-orb`} cx="36%" cy="32%" r="66%">
            <stop
              offset="0%"
              stopColor={isRed ? '#FDA4AF' : isBlue ? '#BAE6FD' : isEmerald ? '#A7F3D0' : '#FDE68A'}
            />
            <stop
              offset="25%"
              stopColor={isRed ? '#F43F5E' : isBlue ? '#0EA5E9' : isEmerald ? '#10B981' : '#F59E0B'}
            />
            <stop
              offset="65%"
              stopColor={isRed ? '#BE123C' : isBlue ? '#0284C7' : isEmerald ? '#059669' : '#D97706'}
            />
            <stop
              offset="90%"
              stopColor={isRed ? '#881337' : isBlue ? '#075985' : isEmerald ? '#047857' : '#B45309'}
            />
            <stop
              offset="100%"
              stopColor={isRed ? '#4C0519' : isBlue ? '#082F49' : isEmerald ? '#064E3B' : '#78350F'}
            />
          </radialGradient>

          {/* Golden / Silver Filigree Rim Gradient */}
          <linearGradient id={`${idPrefix}-rim`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isRed || isAmber ? '#FDE68A' : '#F0F9FF'} />
            <stop offset="50%" stopColor={isRed || isAmber ? '#F59E0B' : '#7DD3FC'} />
            <stop offset="100%" stopColor={isRed || isAmber ? '#92400E' : '#0284C7'} />
          </linearGradient>

          {/* Light Facet Gradient */}
          <linearGradient id={`${idPrefix}-facet-light`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop
              offset="0%"
              stopColor={isRed ? '#FECDD3' : isBlue ? '#E0F2FE' : isEmerald ? '#D1FAE5' : '#FEF3C7'}
            />
            <stop
              offset="100%"
              stopColor={isRed ? '#FB7185' : isBlue ? '#38BDF8' : isEmerald ? '#34D399' : '#FBBF24'}
            />
          </linearGradient>

          {/* Mid Facet Gradient */}
          <linearGradient id={`${idPrefix}-facet-mid`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop
              offset="0%"
              stopColor={isRed ? '#F43F5E' : isBlue ? '#0284C7' : isEmerald ? '#10B981' : '#F59E0B'}
            />
            <stop
              offset="100%"
              stopColor={isRed ? '#BE123C' : isBlue ? '#0369A1' : isEmerald ? '#059669' : '#D97706'}
            />
          </linearGradient>

          {/* Deep Shadow Facet Gradient */}
          <linearGradient id={`${idPrefix}-facet-dark`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop
              offset="0%"
              stopColor={isRed ? '#9F1239' : isBlue ? '#075985' : isEmerald ? '#047857' : '#B45309'}
            />
            <stop
              offset="100%"
              stopColor={isRed ? '#4C0519' : isBlue ? '#082F49' : isEmerald ? '#064E3B' : '#78350F'}
            />
          </linearGradient>
        </defs>

        {/* Ambient Aura Disc */}
        <circle cx="50" cy="50" r="48" fill={`url(#${idPrefix}-glow)`} />

        {/* 1. CIRCLE GEM (Spherical Cabochon Crystal with Astral Core) */}
        {shape === 'circle' && (
          <g>
            {/* Ornate Inlaid Bezel Ring */}
            <circle cx="50" cy="50" r="44" stroke={`url(#${idPrefix}-rim)`} strokeWidth="3" fill="#0A1612" />
            <circle cx="50" cy="50" r="40" stroke={isRed || isAmber ? '#FDE68A' : '#BAE6FD'} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

            {/* 3D Cabochon Core */}
            <circle cx="50" cy="50" r="37" fill={`url(#${idPrefix}-orb)`} />

            {/* Inner Astral Refraction Swirl */}
            <path
              d="M 28 58 C 34 70, 66 70, 72 58 C 66 64, 34 64, 28 58 Z"
              fill={isRed ? '#FFE4E6' : isBlue ? '#E0F2FE' : '#ECFDF5'}
              opacity="0.35"
            />
            <path
              d="M 32 40 C 40 28, 60 28, 68 40 C 60 34, 40 34, 32 40 Z"
              fill="#FFFFFF"
              opacity="0.25"
            />

            {/* Specular Glare Highlights */}
            <ellipse cx="38" cy="30" rx="13" ry="7" transform="rotate(-30 38 30)" fill="#FFFFFF" opacity="0.75" />
            <circle cx="31" cy="24" r="3" fill="#FFFFFF" opacity="0.95" />
          </g>
        )}

        {/* 2. STAR GEM (Multifaceted 8-Pointed Star Crystal) */}
        {shape === 'star' && (
          <g>
            {/* Outer Filigree Bezel Rim */}
            <polygon
              points="50,4 58.5,30 82.5,15.5 69,38.5 96,50 69,61.5 82.5,84.5 58.5,70 50,96 41.5,70 17.5,84.5 31,61.5 4,50 31,38.5 17.5,15.5 41.5,30"
              fill="#0A1612"
              stroke={`url(#${idPrefix}-rim)`}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* 16 Facet Triangles meeting at Center (50, 50) */}
            {/* North Point */}
            <polygon points="50,50 50,4 58.5,30" fill={`url(#${idPrefix}-facet-light)`} />
            <polygon points="50,50 50,4 41.5,30" fill={`url(#${idPrefix}-facet-mid)`} />
            {/* North-East Point */}
            <polygon points="50,50 58.5,30 82.5,15.5" fill={`url(#${idPrefix}-facet-dark)`} />
            <polygon points="50,50 82.5,15.5 69,38.5" fill={`url(#${idPrefix}-facet-light)`} />
            {/* East Point */}
            <polygon points="50,50 69,38.5 96,50" fill={`url(#${idPrefix}-facet-mid)`} />
            <polygon points="50,50 96,50 69,61.5" fill={`url(#${idPrefix}-facet-dark)`} />
            {/* South-East Point */}
            <polygon points="50,50 69,61.5 82.5,84.5" fill={`url(#${idPrefix}-facet-mid)`} />
            <polygon points="50,50 82.5,84.5 58.5,70" fill={`url(#${idPrefix}-facet-dark)`} />
            {/* South Point */}
            <polygon points="50,50 58.5,70 50,96" fill={`url(#${idPrefix}-facet-dark)`} />
            <polygon points="50,50 50,96 41.5,70" fill={`url(#${idPrefix}-facet-mid)`} />
            {/* South-West Point */}
            <polygon points="50,50 41.5,70 17.5,84.5" fill={`url(#${idPrefix}-facet-dark)`} />
            <polygon points="50,50 17.5,84.5 31,61.5" fill={`url(#${idPrefix}-facet-mid)`} />
            {/* West Point */}
            <polygon points="50,50 31,61.5 4,50" fill={`url(#${idPrefix}-facet-mid)`} />
            <polygon points="50,50 4,50 31,38.5" fill={`url(#${idPrefix}-facet-light)`} />
            {/* North-West Point */}
            <polygon points="50,50 31,38.5 17.5,15.5" fill={`url(#${idPrefix}-facet-light)`} />
            <polygon points="50,50 17.5,15.5 41.5,30" fill={`url(#${idPrefix}-facet-mid)`} />

            {/* Central Diamond Crown Glint */}
            <polygon
              points="50,40 57,50 50,60 43,50"
              fill="#FFFFFF"
              opacity="0.85"
            />
            <circle cx="50" cy="50" r="3.5" fill="#FFFFFF" />
            <circle cx="50" cy="50" r="6" stroke="#FFFFFF" strokeWidth="1" opacity="0.7" />
          </g>
        )}

        {/* 3. DIAMOND GEM (Fallback) */}
        {shape === 'diamond' && (
          <g>
            <polygon points="50,8 90,50 50,92 10,50" fill="#0A1612" stroke={`url(#${idPrefix}-rim)`} strokeWidth="2.5" />
            <polygon points="50,50 50,8 90,50" fill={`url(#${idPrefix}-facet-light)`} />
            <polygon points="50,50 90,50 50,92" fill={`url(#${idPrefix}-facet-dark)`} />
            <polygon points="50,50 50,92 10,50" fill={`url(#${idPrefix}-facet-dark)`} />
            <polygon points="50,50 10,50 50,8" fill={`url(#${idPrefix}-facet-mid)`} />
            <circle cx="50" cy="50" r="4" fill="#FFFFFF" />
          </g>
        )}

        {/* 4. CRESCENT GEM (Fallback) */}
        {shape === 'crescent' && (
          <g>
            <path
              d="M 58 14 A 36 36 0 1 1 38 82 A 30 30 0 0 0 58 14 Z"
              fill={`url(#${idPrefix}-orb)`}
              stroke={`url(#${idPrefix}-rim)`}
              strokeWidth="2.5"
            />
            <circle cx="42" cy="36" r="3" fill="#FFFFFF" opacity="0.85" />
          </g>
        )}
      </svg>
    </div>
  )
}

function JewelCardSvg({color, shape}: {color: 'red' | 'blue' | 'emerald' | 'amber'; shape: 'star' | 'circle' | 'diamond' | 'crescent'}) {
  return <AlchemicalGemstone color={color} shape={shape} size="md" />
}

/** The sprite's body: a glowing spirit with a leaf crown. Its colour is set by the emotion; the face drawn on top is unchanged. */
function SpiritBody({fill, stroke}: {fill: string; stroke: string}) {
  return (
    <g>
      <circle cx="50" cy="56" r="46" fill={fill} opacity="0.25" />
      <path d="M50 14 C72 14 88 32 88 56 C88 80 72 96 50 96 C28 96 12 80 12 56 C12 32 28 14 50 14 Z" fill={fill} stroke={stroke} strokeWidth="4" />
      <path d="M34 22 C22 6 10 10 8 22 C18 28 28 28 34 22 Z" fill="#86EFAC" stroke={stroke} strokeWidth="2" />
      <path d="M66 22 C78 6 90 10 92 22 C82 28 72 28 66 22 Z" fill="#86EFAC" stroke={stroke} strokeWidth="2" />
    </g>
  )
}

function ForestSpriteFaceSvg({emotion, className = 'w-24 h-24'}: {emotion: 'happy' | 'sad' | 'surprised' | 'calm' | 'angry' | 'scared'; className?: string}) {
  const src = `/quests/autism/choice_${emotion}.webp`
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <img
        src={src}
        alt={`${emotion} spirit`}
        className="max-h-full max-w-full object-contain pointer-events-none select-none transition-transform duration-300 drop-shadow-sm"
        width={96}
        height={96}
      />
    </div>
  )
}

/** The fox cub: Clear, expressive gouache feeling face sprites readable at 80px */
function FoxCubFaceSvg({emotion, className = 'w-24 h-24'}: {emotion: 'happy' | 'sad' | 'surprised' | 'calm' | 'angry' | 'scared'; className?: string}) {
  const map: Record<string, string> = {
    happy: '/quests/autism/fox_happy.webp',
    sad: '/quests/autism/fox_sad.webp',
    surprised: '/quests/autism/fox_surprised.webp',
    calm: '/quests/autism/fox_calm.webp',
    angry: '/quests/autism/fox_angry.webp',
    scared: '/quests/autism/fox_scared.webp',
  }
  const src = map[emotion] || '/quests/autism/fox_calm.webp'
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <img
        src={src}
        alt={`${emotion} fox cub`}
        className="max-h-full max-w-full object-contain drop-shadow-md pointer-events-none select-none transition-transform duration-300"
        width={96}
        height={96}
      />
    </div>
  )
}

function LanternProgressTrail({stage}: {stage: string}) {
  const steps = [
    {id: 'ja', icon: '🏺', label: 'Urns', stages: ['ja_story', 'ja_game', 'ja_show']},
    {id: 'tom', icon: '🦊', label: 'Feelings', stages: ['tom_story', 'tom_game']},
    {id: 'room', icon: '🏡', label: 'Treehouse', stages: ['sensory_story', 'sensory_game']},
    {id: 'dccs', icon: '🔮', label: 'Gems', stages: ['dccs_story', 'dccs_game']},
  ]
  const activeIdx = steps.findIndex(s => s.stages.includes(stage))
  if (activeIdx === -1 && stage !== 'celebration') return null
  const currentStep = activeIdx === -1 ? 4 : activeIdx

  return (
    <div className="mb-6 rounded-2xl bg-white/90 backdrop-blur-md p-3.5 border border-teal-200/80 shadow-md max-w-xl mx-auto select-none">
      <div className="flex items-center justify-between relative px-4">
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1.5 bg-teal-100 rounded-full z-0 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-500 rounded-full"
            style={{width: `${Math.min(100, (currentStep / 3) * 100)}%`}}
          />
        </div>
        {steps.map((st, i) => {
          const isDone = i < currentStep
          const isCurrent = i === currentStep
          return (
            <div key={st.id} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  isDone
                    ? 'bg-teal-600 text-white shadow-md'
                    : isCurrent
                    ? 'bg-teal-500 ring-4 ring-teal-200 text-white shadow-md'
                    : 'bg-white border-2 border-teal-200 text-teal-700'
                }`}
              >
                {isDone ? (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-xs font-bold">{i + 1}</span>
                )}
              </div>
              <span className={`text-[11px] font-bold mt-1.5 flex items-center gap-1 ${isCurrent ? 'text-teal-900 font-extrabold' : 'text-slate-600'}`}>
                <span>{st.icon}</span>
                <span>{st.label}</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Child Superpower Grove Affinities
const GROVE_AFFINITIES = [
  {
    name: 'Grove Harmonizer',
    badge: 'Forest Friend',
    image: '/quests/characters/grove_harmonizer.webp?v=watercolor5',
    Svg: LeafGlyphSvg,
    AvatarSvg: GroveHarmonizerAvatarSvg,
    desc: 'Gentle & caring · Listens to the trees, plants, and friendly fireflies'
  },
  {
    name: 'Crystal Alchemist',
    badge: 'Pattern Explorer',
    image: '/quests/characters/crystal_alchemist.webp?v=watercolor5',
    Svg: CrystalGlyphSvg,
    AvatarSvg: CrystalAlchemistAvatarSvg,
    desc: 'Curious & observant · Notices hidden clues and solves colorful puzzles'
  },
  {
    name: 'Quiet Seeker',
    badge: 'Peaceful Observer',
    image: '/quests/characters/quiet_seeker.webp?v=watercolor5',
    Svg: DoveGlyphSvg,
    AvatarSvg: QuietSeekerAvatarSvg,
    desc: 'Calm & thoughtful · Notices gentle details and understands friends quietly'
  },
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

// PRACTICE-V2: unrecorded practice rounds, picture first, warm feedback. Nothing here is stored or scored.
// Design the room: each sense is turned up slowly, one step every ROOM_STEP_MS, until the child says it is too much.
const ROOM_DIM_NAMES = ['light', 'rain sound', 'cushion weight'] as const
const ROOM_STEP_MS = 1200
const ROOM_TOP = 10
// the room's ambience between steps and before the child has chosen: a soft light and a quiet rain
const ROOM_AMBIENT = {light: 5, sound: 2} as const
// telemetry: a stop of 0 means the child never said it was too much; undefined means that sense was never reached
const stopOf = (v: number | null | undefined) => (v === undefined ? null : (v ?? 0))

function sayIt(t: string) {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const u = new SpeechSynthesisUtterance(t)
    u.rate = 0.9
    u.lang = 'en-IN'
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  } catch {}
}

function StarSvg({className = 'w-10 h-10'}: {className?: string}) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

type Prac = {g: 'ja' | 'tom' | 'dccs'; i: number; tries: number; msg: '' | 'yay' | 'retry'; done: boolean}
const JA_PRACTICE = [
  {targetPot: 1, avatarGaze: 'center' as const, isPointing: true},
  {targetPot: 2, avatarGaze: 'right' as const, isPointing: true},
]
const TOM_PRACTICE = [
  {target: 'happy' as const, options: ['happy', 'sad'] as const},
  {target: 'sad' as const, options: ['calm', 'sad', 'happy'] as const},
]
const DCCS_PRACTICE = [
  {color: 'red' as const, shape: 'circle' as const, tray: 0},
  {color: 'blue' as const, shape: 'star' as const, tray: 1},
]

function PracticeFrame({step, total, say, msg, children}: {step: number; total: number; say: string; msg: '' | 'yay' | 'retry'; children: React.ReactNode}) {
  return (
    <div className="relative mx-auto max-w-2xl text-center select-none">
      <div className="rounded-3xl border border-white/20 bg-gradient-to-b from-[#021811]/55 via-[#041D15]/40 to-[#021811]/65 backdrop-blur-md p-5 sm:p-8 shadow-2xl text-white">
        <div className="mb-3 flex items-center justify-center gap-2" aria-label={`Practice ${Math.min(step + 1, total)} of ${total}`}>
          {Array.from({length: total}).map((_, k) => (
            <span key={k} className={`h-3.5 w-3.5 rounded-full border-2 border-amber-400 ${k < step ? 'bg-amber-400' : 'bg-transparent'}`} />
          ))}
          <span className="ml-2 rounded-full bg-amber-400/20 border border-amber-300/40 px-3 py-0.5 text-xs font-bold text-amber-200">Practice</span>
        </div>
        <h2 className="font-poppins text-lg sm:text-2xl font-bold text-white drop-shadow-md mb-2 leading-snug">{say}</h2>
        {children}
        <div className="mt-3 min-h-[3rem]" role="status" aria-live="polite">
          {msg === 'yay' && (
            <div className="flex items-center justify-center gap-3 animate-bounce">
              <ForestSpriteFaceSvg emotion="happy" className="h-12 w-12" />
              <StarSvg />
              <span className="font-poppins text-2xl font-bold text-amber-300 drop-shadow">Yay!</span>
            </div>
          )}
          {msg === 'retry' && (
            <div className="flex items-center justify-center gap-3">
              <ForestSpriteFaceSvg emotion="calm" className="h-12 w-12" />
              <span className="font-poppins text-lg font-bold text-emerald-200">Nice try! Look again.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function HandArrow() {
  return (
    <svg viewBox="0 0 24 24" className="absolute -top-9 h-10 w-10 animate-bounce text-amber-500" aria-hidden="true">
      <path d="M12 21l-8-9h5V3h6v9h5z" fill="currentColor" />
    </svg>
  )
}

function __McInner() {
  const [stage, setStage] = useState<'welcome' | 'avatar' | 'look_setup' | 'look_game' | 'ja_story' | 'ja_game' | 'tom_story' | 'tom_game' | 'sensory_story' | 'sensory_game' | 'ja_show' | 'dccs_story' | 'dccs_game' | 'parent_card' | 'agent_eval' | 'celebration'>('welcome')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search).get('stage')
      if (q) setStage(q as any)
    }
  }, [])

  // Child Fantasy Persona
  const [guardianName, setGuardianName] = useState('')
  const [guardianAge, setGuardianAge] = useState(7)
  const [guildAffinity, setGuildAffinity] = useState('Grove Harmonizer')

  // Joint attention trials: Aria looks or points to one of three vessels, and the child chooses
  const [jaTrialIndex, setJaTrialIndex] = useState(0)
  const [showRound, setShowRound] = useState(0)
  const [showTurned, setShowTurned] = useState(false)
  const [showPick, setShowPick] = useState<Array<number | null>>([])
  const [showMs, setShowMs] = useState<Array<number | null>>([])
  const [showSkipReady, setShowSkipReady] = useState(false)
  const showStartRef = useRef<number>(0)
  const [jaResponseTimes, setJaResponseTimes] = useState<number[]>([])
  const [jaCorrectCount, setJaCorrectCount] = useState(0)
  // vessel chosen on each encounter: 0 left, 1 centre, 2 right
  const [jaPicks, setJaPicks] = useState<number[]>([])
  const jaStartRef = useRef<number>(0)
  const [jaReady, setJaReady] = useState(false)
  const JA_TRIALS = useMemo(() => {
    const names = ['Left Veranda Urn', 'Center Lotus Amphora', 'Right Emerald Vessel']
    const gz = ['left', 'center', 'right'] as const
    const list = [0, 1, 2].flatMap((p) => [false, true].map((pt) => ({targetPot: p, avatarGaze: gz[p] as 'left' | 'center' | 'right', isPointing: pt, title: names[p]})))
    // Fixed order so every child sees the same six trials: each pot once with and once without
    // pointing, no pot twice in a row, pointing alternates.
    // the last two encounters are the harder ones: the target urn is partly behind a pillar
    return [0, 5, 2, 1, 4, 3].map((i, pos) => ({...list[i], hidden: pos >= 4}))
  }, [])

  // Reversed turn: the child shows Aria the urn with the sparkle, while Aria is looking away from it
  const SHOW_TARGETS = [2, 0] as const
  const POT_GAZE = ['left', 'center', 'right'] as const

  // Chapter 2: Emotion Mirror State (Visual Social Recognition Game)
  const [tomTrialIndex, setTomTrialIndex] = useState(0)
  const [tomScore, setTomScore] = useState(0)
  // face chosen on each round (index into that round's options) and time to choose in ms
  const [tomPicks, setTomPicks] = useState<number[]>([])
  const [tomTimes, setTomTimes] = useState<number[]>([])
  // "what helps" step, shown after the sad sprite round (any answer): 0 a hug, 1 a quiet corner, 2 a story
  const [helpPending, setHelpPending] = useState(false)
  const [helpPick, setHelpPick] = useState<number | null>(null)
  const [helpMs, setHelpMs] = useState<number | null>(null)
  const helpStartRef = useRef<number>(0)
  const tomStartRef = useRef<number>(0)

  // Sensory Calibration State (SPM-2)
  const [sensoryLight, setSensoryLight] = useState<number | null>(null)
  const [sensorySound, setSensorySound] = useState<number | null>(null)
  const [sensoryTouch, setSensoryTouch] = useState<number | null>(null)
  const [sanctuaryChoice, setSanctuaryChoice] = useState('Dim twilight corner with weighted cloud cushion & soft rain')
  const [roomPhase, setRoomPhase] = useState<'intro' | 'ramp' | 'design'>('intro')
  const [roomDim, setRoomDim] = useState(0)
  const [roomLevel, setRoomLevel] = useState(1)
  const [roomStops, setRoomStops] = useState<Array<number | null | undefined>>([undefined, undefined, undefined])
  const [roomAdjusts, setRoomAdjusts] = useState({light: 0, sound: 0, texture: 0})
  const [roomShields, setRoomShields] = useState(0)
  const roomDesignStartRef = useRef<number>(0)
  const roomDesignSecRef = useRef<number | null>(null)
  const roomSoundRef = useRef<RoomSound | null>(null)

  // Dimensional Change Card Sort (DCCS) Dynamic State
  const [dccsIndex, setDccsIndex] = useState(0)
  const [dccsRule, setDccsRule] = useState<'color' | 'shape'>('color')
  const [dccsTimes, setDccsTimes] = useState<number[]>([])
  // one entry per sorted card: whether the tray chosen matched the rule shown for that card
  const [dccsCorrect, setDccsCorrect] = useState<boolean[]>([])
  // one entry per sorted card: which box was tapped (0 = red star box, 1 = blue circle box)
  const [dccsBins, setDccsBins] = useState<number[]>([])
  const dccsStartRef = useRef<number>(0)
  const events = usePlayEvents()
  // optional looking game (camera): off unless the grown-up agrees on the look_setup screen; numbers only, no video leaves the device
  const cam = useAttentionCamera()
  const [lookTele, setLookTele] = useState<Record<string, number>>({})
  const DCCS_SWITCH_AT = 3 // index of the first card played under the shape rule
  const DCCS_WARN_SECONDS = 3 // the warning sign shows for this long before the rule changes
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
  const [prac, setPrac] = useState<Prac | null>(null)
  const [dccsSwitchSeen, setDccsSwitchSeen] = useState(false)
  // warning sign before the rule changes (seconds left, null when not showing); then a quick check of which rule is in use
  const [dccsWarnLeft, setDccsWarnLeft] = useState<number | null>(null)
  const [dccsRuleCheck, setDccsRuleCheck] = useState(false)
  const [dccsRuleAnswer, setDccsRuleAnswer] = useState<{answered: 'colour' | 'shape'; ms: number} | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const ruleCheckStartRef = useRef<number>(0)
  const pracTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (pracTimer.current) clearTimeout(pracTimer.current) }, [])
  useEffect(() => {
  }, [stage, dccsIndex, dccsSwitchSeen])

  // the warning: a sign tells the child a change is coming, but not what it is; the card header shows the new rule
  useEffect(() => {
    if (stage === 'dccs_game' && dccsWarnLeft === DCCS_WARN_SECONDS) sayIt('Watch the sign. Something is about to change.')
  }, [stage, dccsWarnLeft])

  useEffect(() => {
    if (stage !== 'dccs_game' || dccsWarnLeft === null) return
    const t = setTimeout(() => {
      if (dccsWarnLeft <= 1) {
        setDccsWarnLeft(null)
        dccsStartRef.current = performance.now()
      } else {
        setDccsWarnLeft(dccsWarnLeft - 1)
      }
    }, 1000)
    return () => clearTimeout(t)
  }, [stage, dccsWarnLeft])

  // Joint Attention Loop
  useEffect(() => {
    if (stage === 'ja_game' && jaTrialIndex < JA_TRIALS.length) {
      jaStartRef.current = performance.now()
    } else if (stage === 'ja_game' && jaTrialIndex >= JA_TRIALS.length) {
      playAudio('fanfare')
      setShowRound(0)
      setShowTurned(false)
      setShowPick([])
      setShowMs([])
      setStage('ja_show')
    }
  }, [stage, jaTrialIndex, JA_TRIALS])

  // reversed turn: how long before a skip button appears, and the pause after the child's choice
  useEffect(() => {
    if (stage !== 'ja_show' || showTurned) return
    setShowSkipReady(false)
    showStartRef.current = performance.now()
    const t = setTimeout(() => setShowSkipReady(true), 12000)
    return () => clearTimeout(t)
  }, [stage, showRound, showTurned])

  function nextShow() {
    setShowTurned(false)
    if (showRound + 1 < SHOW_TARGETS.length) {
      setShowRound((r) => r + 1)
    } else {
      playAudio('fanfare')
      setStage('tom_story')
    }
  }

  // null means the child skipped the turn
  function handleShowPick(i: number | null) {
    if (showTurned) return
    if (i === null) {
      setShowPick((p) => { const n = [...p]; n[showRound] = null; return n })
      setShowMs((m) => { const n = [...m]; n[showRound] = null; return n })
      nextShow()
      return
    }
    const ms = Math.round(performance.now() - showStartRef.current)
    setShowPick((p) => { const n = [...p]; n[showRound] = i; return n })
    setShowMs((m) => { const n = [...m]; n[showRound] = ms; return n })
    setShowTurned(true)
    playAudio('chime')
    setTimeout(() => nextShow(), 1800)
  }

  function handlePotSelect(idx: number) {
    if (stage !== 'ja_game' || !jaReady) return
    setJaReady(false)
    const elapsed = Math.round(performance.now() - jaStartRef.current)
    setJaResponseTimes((prev) => [...prev, elapsed])
    setJaPicks((prev) => [...prev, idx])

    if (idx === JA_TRIALS[jaTrialIndex].targetPot) {
      playAudio('hit')
      setJaCorrectCount((c) => c + 1)
    } else {
      playAudio('tap')
    }
    setJaTrialIndex((i) => i + 1)
  }

  // Chapter 2: Emotion Mirror Handling (Pure visual matching, zero reading questions)
  useEffect(() => {
    if (stage === 'tom_game') tomStartRef.current = performance.now()
  }, [stage, tomTrialIndex])

  function handleEmotionSelect(selectedEmotion: string) {
    setTomTimes((prev) => [...prev, Math.round(performance.now() - tomStartRef.current)])
    setTomPicks((prev) => [...prev, (EMOTION_MIRROR_TRIALS[tomTrialIndex].options as readonly string[]).indexOf(selectedEmotion)])
    const isCorrect = selectedEmotion === EMOTION_MIRROR_TRIALS[tomTrialIndex].target
    if (isCorrect) {
      playAudio('chime')
      setTomScore((s) => s + 25)
    } else {
      playAudio('tap')
    }

    if (EMOTION_MIRROR_TRIALS[tomTrialIndex].target === 'sad') {
      helpStartRef.current = performance.now()
      setHelpPending(true)
      return
    }
    advanceTom()
  }

  function advanceTom() {
    if (tomTrialIndex + 1 < EMOTION_MIRROR_TRIALS.length) {
      setTomTrialIndex((i) => i + 1)
    } else {
      playAudio('fanfare')
      setStage('sensory_story')
    }
  }

  function handleHelpSelect(i: number) {
    setHelpPick(i)
    setHelpMs(Math.round(performance.now() - helpStartRef.current))
    setHelpPending(false)
    playAudio('chime')
    advanceTom()
  }

  // DCCS Handling
  useEffect(() => {
    if (stage === 'dccs_game') {
      if (dccsIndex === 0) setDccsRule('color')
      if (dccsIndex === DCCS_SWITCH_AT) {
        setDccsRule('shape')
        playAudio('sensory')
      }
      if (dccsIndex >= DCCS_CARDS.length) {
        playAudio('fanfare')
        setStage('parent_card')
        return
      }
      dccsStartRef.current = performance.now()
    }
  }, [stage, dccsIndex])

  function handleDccsSort(targetBin: number) {
    const elapsed = Math.round(performance.now() - dccsStartRef.current)
    setDccsTimes((prev) => [...prev, elapsed])
    // Tray 0 holds the red star and tray 1 the blue circle, so the right tray is set by the card itself.
    const card = DCCS_CARDS[dccsIndex]
    const ruleNow = dccsIndex < DCCS_SWITCH_AT ? 'color' : 'shape'
    const rightBin = ruleNow === 'color' ? (card.color === 'red' ? 0 : 1) : (card.shape === 'star' ? 0 : 1)
    setDccsCorrect((prev) => [...prev, targetBin === rightBin])
    setDccsBins((prev) => [...prev, targetBin])
    playAudio('hit')
    if (dccsIndex === DCCS_SWITCH_AT) {
      // the first shape card is done: now the child names the rule in force
      ruleCheckStartRef.current = performance.now()
      setDccsRuleCheck(true)
      return
    }
    if (dccsIndex + 1 === DCCS_SWITCH_AT) setDccsWarnLeft(DCCS_WARN_SECONDS)
    setDccsIndex((i) => i + 1)
  }

  function handleRuleCheck(answered: 'colour' | 'shape') {
    setDccsRuleAnswer({answered, ms: Math.round(performance.now() - ruleCheckStartRef.current)})
    setDccsRuleCheck(false)
    playAudio('chime')
    dccsStartRef.current = performance.now()
    setDccsIndex((i) => i + 1)
  }

  // Multi-Node Cognitive Agent Evaluation
  async function submitAutismAgent(parent?: ParentAnswers) {
    setStage('agent_eval')

    const medianOf = (xs: number[]) => {
      if (!xs.length) return null
      const s = [...xs].sort((a, b) => a - b)
      const m = Math.floor(s.length / 2)
      return Math.round(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2)
    }

    // Cards 1-3 follow the colour rule, cards 4-6 the shape rule (see DCCS_SWITCH_AT).
    const preAnswers = dccsCorrect.slice(0, DCCS_SWITCH_AT)
    const postAnswers = dccsCorrect.slice(DCCS_SWITCH_AT)
    const countTrue = (xs: boolean[]) => xs.filter(Boolean).length
    const ev = events.snapshot()

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
        // design the room: the level where each sense was said to be too much, slider moves, calm shield taps, seconds to save
        rampStopLight: stopOf(roomStops[0]),
        rampStopSound: stopOf(roomStops[1]),
        rampStopTexture: stopOf(roomStops[2]),
        adjustLight: roomAdjusts.light,
        adjustSound: roomAdjusts.sound,
        adjustTexture: roomAdjusts.texture,
        shieldUses: roomShields,
        designSec: roomDesignSecRef.current,
        sortCount: dccsTimes.length,
        sortMedianMs: medianOf(dccsTimes),
        sortPreTotal: preAnswers.length,
        sortPreCorrect: countTrue(preAnswers),
        sortPostTotal: postAnswers.length,
        sortPostCorrect: countTrue(postAnswers),
        // encounter by encounter in the gaze game: vessel chosen (0 left, 1 centre, 2 right) and time in ms
        ...Object.fromEntries(Array.from({length: JA_TRIALS.length}, (_, i) => [`gazePick${i + 1}`, jaPicks[i] ?? null])),
        ...Object.fromEntries(Array.from({length: JA_TRIALS.length}, (_, i) => [`gazeMs${i + 1}`, jaResponseTimes[i] ?? null])),
        // what helps the sad sprite: 0 a hug, 1 a quiet corner, 2 a story, and the time in ms
        helpPick: helpPick,
        // reversed turn: vessel shown (0 left, 1 centre, 2 right) and time in ms, turns 1 and 2; how many were shown and how many had the sparkle
        showPick1: showPick[0] ?? null,
        showPick2: showPick[1] ?? null,
        showMs1: showMs[0] ?? null,
        showMs2: showMs[1] ?? null,
        showBids: showPick.filter((x) => x !== null && x !== undefined).length,
        showMatches: SHOW_TARGETS.filter((tg, i) => showPick[i] === tg).length,
        helpMs: helpMs,
        // round by round in the feelings match: face chosen (position in that round's options) and time in ms
        ...Object.fromEntries(Array.from({length: EMOTION_MIRROR_TRIALS.length}, (_, i) => [`feelingsPick${i + 1}`, tomPicks[i] ?? null])),
        ...Object.fromEntries(Array.from({length: EMOTION_MIRROR_TRIALS.length}, (_, i) => [`feelingsMs${i + 1}`, tomTimes[i] ?? null])),
        // card by card: box tapped (0 red star, 1 blue circle) and time in ms, cards 1 to 6
        ...Object.fromEntries(Array.from({length: DCCS_CARDS.length}, (_, i) => [`sortBin${i + 1}`, dccsBins[i] ?? null])),
        ...Object.fromEntries(Array.from({length: DCCS_CARDS.length}, (_, i) => [`sortMs${i + 1}`, dccsTimes[i] ?? null])),
        // the parent card (each answer is 0 to 2, or null when skipped)
        parentTired: parent?.tired ?? null,
        parentLikeHome: parent?.likeHome ?? null,
        parentEnjoyed: parent?.enjoyed ?? null,
        // quick check straight after the rule changed: 1 when the child said shape, 0 for colour, null if not asked
        ruleCheck: dccsRuleAnswer ? (dccsRuleAnswer.answered === 'shape' ? 1 : 0) : null,
        ruleCheckMs: dccsRuleAnswer?.ms ?? null,
        retryGaze: ev.retries.ja ?? 0,
        retryFeelings: ev.retries.tom ?? 0,
        retrySorting: ev.retries.dccs ?? 0,
        pauseCount: ev.pauseCount,
        pausedSec: ev.pausedSec,
        // optional looking game (camera): empty unless it was played
        ...lookTele
      }
    }

    try {
      const res = await fetch('/api/assessments/agent', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({...payload, environment: captureEnvironment()})
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
      setLookTele({})
      setStage('welcome')
    }
  }

  // ---- design the room ----
  // during the ramp only the sense being turned up is active; in the design phase the sliders decide
  // the room is never dark or silent: outside its own step each sense rests at the ambient level
  const liveLight = roomPhase === 'ramp' ? (roomDim === 0 ? roomLevel : ROOM_AMBIENT.light) : (sensoryLight ?? ROOM_AMBIENT.light)
  const liveSound = roomPhase === 'ramp' ? (roomDim === 1 ? roomLevel : ROOM_AMBIENT.sound) : (sensorySound ?? ROOM_AMBIENT.sound)
  const roomFilter = `brightness(${0.55 + (liveLight / 10) * 0.8})`

  useEffect(() => {
    if (stage !== 'sensory_story' || roomPhase !== 'ramp') return
    const t = setTimeout(() => {
      if (roomLevel >= ROOM_TOP) finishRampDim(null)
      else setRoomLevel((l) => l + 1)
    }, ROOM_STEP_MS)
    return () => clearTimeout(t)
    // finishRampDim is rebuilt from the same state on every render, so this timer always sees current values
  }, [stage, roomPhase, roomLevel, roomDim])

  // runs when the room starts too, so the rain begins as soon as the child steps inside
  useEffect(() => {
    roomSoundRef.current?.setLevel(liveSound)
  }, [liveSound, roomPhase])

  useEffect(() => {
    if (stage === 'sensory_story') return
    roomSoundRef.current?.stop()
    roomSoundRef.current = null
  }, [stage])

  useEffect(() => () => { roomSoundRef.current?.stop(); roomSoundRef.current = null }, [])

  // ---- practice rounds (never recorded) ----
  function startJa() { playAudio('whoosh'); setPrac(null); setJaTrialIndex(0); setJaResponseTimes([]); setJaCorrectCount(0); setJaPicks([]); setStage('ja_game') }
  function startRoom() {
    playAudio('whoosh')
    roomSoundRef.current?.stop()
    roomSoundRef.current = startRoomSound()
    setRoomDim(0)
    setRoomLevel(1)
    setRoomStops([undefined, undefined, undefined])
    setRoomPhase('ramp')
  }

  function finishRampDim(stop: number | null) {
    setRoomStops((prev) => prev.map((v, i) => (i === roomDim ? stop : v)))
    if (roomDim < ROOM_DIM_NAMES.length - 1) {
      setRoomDim((d) => d + 1)
      setRoomLevel(1)
    } else {
      roomDesignStartRef.current = performance.now()
      setRoomPhase('design')
    }
  }

  function bumpAdjust(dim: 'light' | 'sound' | 'texture') {
    setRoomAdjusts((a) => ({...a, [dim]: a[dim] + 1}))
  }

  function shieldRoom() {
    playAudio('whoosh')
    setSensoryLight(1)
    setSensorySound(1)
    setSensoryTouch(1)
    setRoomShields((n) => n + 1)
  }

  function startTom() { playAudio('whoosh'); setPrac(null); setTomTrialIndex(0); setTomScore(0); setTomPicks([]); setTomTimes([]); setHelpPending(false); setHelpPick(null); setHelpMs(null); setStage('tom_game') }
  function startDccs() { playAudio('fanfare'); setPrac(null); setDccsIndex(0); setDccsTimes([]); setDccsCorrect([]); setDccsBins([]); setDccsSwitchSeen(false); setStage('dccs_game') }
  function beginPractice(g: Prac['g'], line: string) {
    playAudio('whoosh')
    setPrac({g, i: 0, tries: 0, msg: '', done: false})
    sayIt(line)
  }
  function pracAnswer(ok: boolean, total: number) {
    if (!prac || prac.msg === 'yay' || prac.done) return
    if (pracTimer.current) clearTimeout(pracTimer.current)
    if (ok) {
      playAudio('chime')
      sayIt('Yay! You did it!')
      setPrac({...prac, msg: 'yay'})
      pracTimer.current = setTimeout(() => {
        setPrac((p) => (p ? (p.i + 1 < total ? {...p, i: p.i + 1, tries: 0, msg: ''} : {...p, done: true, msg: ''}) : p))
      }, 1500)
    } else {
      playAudio('tap')
      sayIt('Nice try! Look again.')
      setPrac({...prac, tries: prac.tries + 1, msg: 'retry'})
    }
  }
  function renderPracDone(g: Prac['g'], onStart: () => void) {
    return (
      <PracticeFrame step={2} total={2} say="You are ready!" msg="">
        <div className="flex flex-col items-center gap-4">
          <ForestSpriteFaceSvg emotion="happy" className="h-24 w-24 animate-bounce" />
          <div className="flex gap-1"><StarSvg /><StarSvg /><StarSvg /></div>
          <button type="button" onClick={onStart} className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-12 py-5 text-2xl font-bold text-white shadow-xl hover:scale-105 active:scale-95 transition-all">Play! ▶</button>
          <button type="button" onClick={() => { playAudio('tap'); events.noteRetry(g); setPrac({g, i: 0, tries: 0, msg: '', done: false}) }} className="rounded-full border-2 border-teal-600 bg-white px-6 py-2 text-base font-bold text-teal-800">Practice again</button>
        </div>
      </PracticeFrame>
    )
  }
  function renderJaPractice() {
    if (!prac) return null
    if (prac.done) return renderPracDone('ja', startJa)
    const t = JA_PRACTICE[prac.i]
    const showHand = prac.tries >= 2 || (prac.i === 0 && guardianAge <= 7)
    const types = ['A', 'B', 'C'] as const
    return (
      <PracticeFrame step={prac.i} total={JA_PRACTICE.length} say={prac.i === 0 ? 'Aria points! Tap that pot!' : 'Where is Aria looking? Tap that pot!'} msg={prac.msg}>
        <div className="my-1">
          <GazeGuide key={`pj${prac.i}`} gaze={t.avatarGaze} isPointing={t.isPointing} onCue={() => {}} />
        </div>
        <div className="mx-auto mt-2 grid max-w-lg grid-cols-3 gap-3 md:gap-4">
          {types.map((ty, idx) => (
            <button
              key={ty}
              type="button"
              aria-label={`Urn ${idx + 1}`}
              onClick={() => pracAnswer(idx === t.targetPot, JA_PRACTICE.length)}
              className={`group relative flex h-44 sm:h-52 flex-col items-center justify-end rounded-2xl p-2 transition-all duration-300 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 ${showHand && idx === t.targetPot ? 'ring-4 ring-amber-400' : ''}`}
            >
              <div className="absolute inset-x-0 bottom-0 h-28 rounded-2xl bg-gradient-to-b from-[#C49A6C]/30 via-[#9E7347]/40 to-[#6E4B29]/60 border-2 border-[#EAD7B8]/40 backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.5)] group-hover:border-amber-300/80 group-hover:bg-[#C49A6C]/45 transition-all">
                <div className="absolute inset-x-0 top-0 h-2.5 rounded-t-xl bg-[#EAD7B8]/30 border-b border-[#7A4C25]/40" />
              </div>
              <div className="absolute bottom-9 w-20 h-3.5 rounded-full bg-black/40 blur-[2px] pointer-events-none" />
              {showHand && idx === t.targetPot && <HandArrow />}
              <div className="relative z-10 w-full h-[76%] flex items-center justify-center p-1">
                <ArtisanVesselSvg type={ty} />
              </div>
              <span className="relative z-10 mb-2 rounded-full bg-[#2A180B]/90 px-3 py-0.5 text-xs font-bold text-amber-100 border border-amber-300/40 backdrop-blur-sm shadow-sm group-hover:text-white group-hover:border-amber-300 transition-all">
                {ty === 'A' ? 'Left Urn' : ty === 'B' ? 'Center Urn' : 'Right Urn'}
              </span>
            </button>
          ))}
        </div>
      </PracticeFrame>
    )
  }
  function renderTomPractice() {
    if (!prac) return null
    if (prac.done) return renderPracDone('tom', startTom)
    const t = TOM_PRACTICE[prac.i]
    const showHint = prac.tries >= 2
    return (
      <PracticeFrame step={prac.i} total={TOM_PRACTICE.length} say="Tap the spirit with the same feeling!" msg={prac.msg}>
        <div className="my-2">
          <div className="relative mx-auto flex h-36 w-36 sm:h-44 sm:w-44 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-amber-300/90 bg-gradient-to-b from-[#FFFDF8] via-[#F8EFE3] to-[#F0E2CE] shadow-[0_0_40px_rgba(251,191,36,0.35)]" />
            <div className="absolute inset-1.5 rounded-full border border-amber-400/40 pointer-events-none" />
            <span className="absolute -top-3 left-4 text-base pointer-events-none drop-shadow">🌿</span>
            <span className="absolute -top-2 right-6 text-sm pointer-events-none drop-shadow">🌸</span>
            <span className="absolute -bottom-2 left-6 text-sm pointer-events-none drop-shadow">🌸</span>
            <span className="absolute -bottom-3 right-4 text-base pointer-events-none drop-shadow">🌿</span>
            <FoxCubFaceSvg emotion={t.target} className="relative z-10 w-[78%] h-[78%] drop-shadow-md select-none pointer-events-none" />
          </div>
        </div>
        <div className={`mx-auto grid max-w-md gap-3 sm:gap-4 my-2 ${t.options.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {t.options.map((o) => (
            <button
              key={o}
              type="button"
              aria-label={o}
              onClick={() => pracAnswer(o === t.target, TOM_PRACTICE.length)}
              className={`group relative flex h-36 sm:h-42 flex-col items-center justify-end rounded-[30px] p-2 transition-all duration-300 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 ${showHint && o === t.target ? 'ring-4 ring-amber-400' : ''}`}
            >
              <div className="absolute inset-0 rounded-[30px] bg-gradient-to-b from-[#1C2C22]/90 via-[#16251C]/95 to-[#0E1A13]/95 border-2 border-emerald-400/40 shadow-2xl backdrop-blur-md group-hover:border-amber-300/80 group-hover:bg-[#203628]/95 group-hover:shadow-[0_0_30px_rgba(251,191,36,0.35)] transition-all">
                <div className="absolute inset-x-3 top-0 h-2 rounded-t-[20px] bg-emerald-400/25 blur-[1px]" />
                <span className="absolute top-1.5 left-2.5 text-[11px] opacity-75 pointer-events-none">🌿</span>
                <span className="absolute top-1.5 right-2.5 text-[10px] opacity-75 pointer-events-none">✨</span>
              </div>
              <div className="relative z-10 w-full h-[76%] flex items-center justify-center p-1">
                <ForestSpriteFaceSvg emotion={o} className="h-full w-full max-h-24 max-w-24 drop-shadow-md" />
              </div>
              <span className="relative z-10 mb-2 rounded-full bg-[#132318]/90 px-3 py-0.5 text-xs font-bold capitalize text-amber-100 border border-emerald-400/30 backdrop-blur-sm group-hover:border-amber-300/60 group-hover:text-white transition-all">
                {o}
              </span>
            </button>
          ))}
        </div>
      </PracticeFrame>
    )
  }
  function AlchemicalSortingArena({
    title,
    subtitle,
    rule,
    targetGem,
    onSort,
    stepLabel,
    modeLabel,
    hintTray,
    feedbackMsg,
  }: {
    title: string
    subtitle: string
    rule: 'color' | 'shape'
    targetGem: {color: 'red' | 'blue'; shape: 'star' | 'circle'}
    onSort: (bin: number) => void
    stepLabel: string
    modeLabel: string
    hintTray?: number | null
    feedbackMsg?: '' | 'yay' | 'retry'
  }) {
    return (
      <div className="relative rounded-3xl border-2 border-emerald-400/50 bg-[#071712]/95 backdrop-blur-md overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.7)] text-teal-50 max-w-4xl lg:max-w-5xl mx-auto w-full select-none">
        {/* Grand Alchemical Chamber Viewport Banner */}
        <div className="relative h-36 sm:h-44 md:h-48 w-full overflow-hidden select-none bg-[#041D15]">
          <img
            src="/quests/autism/bg_sorting.webp"
            alt="The Alchemist's Gem Chamber"
            className="h-full w-full object-cover object-center opacity-80"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#071712] via-[#071712]/50 to-transparent" />

          {/* Floating Realm Status Pills */}
          <div className="absolute top-3 inset-x-4 flex items-center justify-between pointer-events-none z-10">
            <span className="rounded-full bg-black/60 backdrop-blur-md border border-emerald-400/40 px-3 py-1 text-xs font-bold text-emerald-200 shadow-md flex items-center gap-1.5">
              <span>🔮</span>
              <span>Gem Vault</span>
            </span>
            <span className="rounded-full bg-black/60 backdrop-blur-md border border-amber-300/40 px-3 py-1 text-xs font-bold text-amber-200 shadow-md">
              {stepLabel}
            </span>
          </div>

          {/* Guide Aria Alchemist Box */}
          <div className="absolute bottom-2.5 inset-x-4 flex items-center justify-between pointer-events-none z-10">
            <div className="flex items-center gap-2.5 bg-black/80 backdrop-blur-md border border-emerald-400/40 rounded-2xl p-2 sm:p-2.5 shadow-xl max-w-lg">
              <img
                src="/decor/itw/quest-aria-alchemist.webp"
                alt="Aria"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover border border-amber-300/50 shadow-sm shrink-0"
                width={44}
                height={44}
              />
              <div className="text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                  Aria
                </span>
                <p className="text-xs sm:text-sm font-bold text-teal-100 leading-tight">
                  {rule === 'color'
                    ? '“Match colors! 🔴 to 🔴 and 🔵 to 🔵!”'
                    : '“Match shapes! ⭐ to ⭐ and ⭕ to ⭕!”'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transmutation Sorting Arena */}
        <div className="p-4 sm:p-6">
          {/* Active Rule Keystone Banner - Visual-First */}
          <div className="mx-auto max-w-xl text-center mb-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/70 bg-gradient-to-r from-amber-500/30 via-emerald-500/25 to-teal-500/30 px-5 py-2 backdrop-blur-md shadow-[0_0_25px_rgba(251,191,36,0.25)]">
              <span className="text-2xl">{rule === 'color' ? '🎨' : '🔷'}</span>
              <span className="font-poppins text-lg sm:text-2xl font-extrabold text-amber-200 tracking-wide">
                {rule === 'color' ? 'Match COLOR' : 'Match SHAPE'}
              </span>
            </div>

            {/* Visual Comparison Chips */}
            <div className="flex items-center justify-center gap-2 sm:gap-4 mt-2">
              {rule === 'color' ? (
                <>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/60 text-xs font-bold text-rose-200">
                    <span>🔴</span> <span>Red</span> <span>➔</span> <span>Red Vault</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/60 text-xs font-bold text-sky-200">
                    <span>🔵</span> <span>Blue</span> <span>➔</span> <span>Blue Vault</span>
                  </span>
                </>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/60 text-xs font-bold text-amber-200">
                    <span>⭐</span> <span>Star</span> <span>➔</span> <span>Star Vault</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/60 text-xs font-bold text-sky-200">
                    <span>⭕</span> <span>Circle</span> <span>➔</span> <span>Circle Vault</span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Central Floating Gem Altar */}
          <div className="relative mx-auto my-3 flex flex-col items-center justify-center">
            <div className="relative flex h-32 w-32 sm:h-38 sm:w-38 items-center justify-center">
              {/* Rotating Concentric Runic Rings */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-300/40 animate-[spin_20s_linear_infinite]" />
              <div className="absolute inset-2 rounded-full border border-teal-400/30 animate-[spin_15s_linear_infinite_reverse]" />
              <div className="absolute inset-4 rounded-full bg-gradient-to-b from-[#132B22]/90 via-[#0B1E17]/95 to-[#06140F] shadow-[0_0_40px_rgba(16,185,129,0.35)] border border-emerald-400/50" />
              {/* Floating Glowing Gemstone */}
              <div className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 animate-bounce transition-transform duration-300">
                <AlchemicalGemstone color={targetGem.color} shape={targetGem.shape} size="lg" />
              </div>
            </div>
            <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-amber-200 bg-black/60 px-3.5 py-1 rounded-full border border-amber-300/40 shadow-sm">
              <span>Where does this gem go?</span>
              <span className="text-sm animate-bounce">⬇</span>
            </span>
          </div>

          {/* The Two Sorting Vault Pedestals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-xl mx-auto mt-4">
            {/* Vault 0: Left Vault */}
            <button
              type="button"
              onClick={() => onSort(0)}
              aria-label={rule === 'color' ? 'Red Vault' : 'Star Vault'}
              className={`group relative flex flex-col items-center justify-between rounded-3xl border-2 border-rose-500/70 bg-gradient-to-b from-[#25090F]/95 via-[#1A060A]/95 to-[#0F0306]/95 p-4 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:border-rose-400 hover:shadow-[0_0_40px_rgba(244,63,94,0.5)] hover:scale-[1.03] active:scale-95 transition-all duration-300 cursor-pointer focus:outline-none ${
                hintTray === 0 ? 'ring-4 ring-amber-400 animate-pulse' : ''
              }`}
            >
              {/* Big Visual Badge */}
              <div className="w-full flex items-center justify-center mb-2 pointer-events-none">
                <span className={`text-sm sm:text-base font-extrabold px-4 py-1 rounded-full border shadow-md flex items-center gap-1.5 ${
                  rule === 'color'
                    ? 'bg-rose-500 text-white border-rose-300 shadow-rose-900/50'
                    : 'bg-amber-500 text-amber-950 border-amber-300 shadow-amber-900/50'
                }`}>
                  <span>{rule === 'color' ? '🔴 RED' : '⭐ STAR'}</span>
                </span>
              </div>

              {/* Inlaid Gem Preview */}
              <div className="my-1 p-1">
                <AlchemicalGemstone color="red" shape="star" size="md" />
              </div>

              <div className="mt-2 w-full rounded-2xl bg-gradient-to-r from-rose-900/70 via-rose-800/90 to-rose-900/70 border border-rose-400/40 py-2 px-3 text-center group-hover:border-rose-300 transition-all pointer-events-none">
                <span className="text-xs sm:text-sm font-extrabold text-rose-100 group-hover:text-white flex items-center justify-center gap-1.5">
                  <span>TAP HERE</span>
                  <span className="text-base group-hover:translate-y-0.5 transition-transform">⬇</span>
                </span>
              </div>
            </button>

            {/* Vault 1: Right Vault */}
            <button
              type="button"
              onClick={() => onSort(1)}
              aria-label={rule === 'color' ? 'Blue Vault' : 'Circle Vault'}
              className={`group relative flex flex-col items-center justify-between rounded-3xl border-2 border-sky-500/70 bg-gradient-to-b from-[#091827]/95 via-[#05111C]/95 to-[#020A12]/95 p-4 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:border-sky-400 hover:shadow-[0_0_40px_rgba(56,189,248,0.5)] hover:scale-[1.03] active:scale-95 transition-all duration-300 cursor-pointer focus:outline-none ${
                hintTray === 1 ? 'ring-4 ring-amber-400 animate-pulse' : ''
              }`}
            >
              {/* Big Visual Badge */}
              <div className="w-full flex items-center justify-center mb-2 pointer-events-none">
                <span className={`text-sm sm:text-base font-extrabold px-4 py-1 rounded-full border shadow-md flex items-center gap-1.5 ${
                  rule === 'color'
                    ? 'bg-sky-500 text-white border-sky-300 shadow-sky-900/50'
                    : 'bg-blue-600 text-white border-blue-300 shadow-blue-900/50'
                }`}>
                  <span>{rule === 'color' ? '🔵 BLUE' : '⭕ CIRCLE'}</span>
                </span>
              </div>

              {/* Inlaid Gem Preview */}
              <div className="my-1 p-1">
                <AlchemicalGemstone color="blue" shape="circle" size="md" />
              </div>

              <div className="mt-2 w-full rounded-2xl bg-gradient-to-r from-sky-900/70 via-sky-800/90 to-sky-900/70 border border-sky-400/40 py-2 px-3 text-center group-hover:border-sky-300 transition-all pointer-events-none">
                <span className="text-xs sm:text-sm font-extrabold text-sky-100 group-hover:text-white flex items-center justify-center gap-1.5">
                  <span>TAP HERE</span>
                  <span className="text-base group-hover:translate-y-0.5 transition-transform">⬇</span>
                </span>
              </div>
            </button>
          </div>

          {/* Feedback Status Indicator */}
          {feedbackMsg && (
            <div className="mt-4 flex items-center justify-center min-h-[2.5rem]">
              {feedbackMsg === 'yay' && (
                <div className="flex items-center justify-center gap-2 text-amber-300 font-extrabold text-lg animate-bounce">
                  <ForestSpriteFaceSvg emotion="happy" className="w-8 h-8 drop-shadow" />
                  <StarSvg />
                  <span>Yay! Right vault! 🌟</span>
                </div>
              )}
              {feedbackMsg === 'retry' && (
                <div className="flex items-center justify-center gap-2 text-teal-200 font-bold text-base">
                  <ForestSpriteFaceSvg emotion="calm" className="w-8 h-8" />
                  <span>Nice try! Look at the rule 👀</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderDccsPractice() {
    if (!prac) return null
    if (prac.done) {
      return (
        <div className="relative rounded-3xl border-2 border-emerald-400/60 bg-[#071712]/95 backdrop-blur-md p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-center select-none max-w-xl mx-auto overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(16,185,129,0.25)_0%,transparent_70%)] animate-pulse" />
          <div className="relative z-10 flex flex-col items-center">
            <span className="rounded-full bg-emerald-500/20 border border-emerald-400/50 px-4 py-1 text-xs font-bold uppercase tracking-wider text-emerald-200 mb-3">
              ✨ Ready to Play!
            </span>
            <div className="flex gap-2 my-2">
              <StarSvg />
              <StarSvg />
              <StarSvg />
            </div>
            <h2 className="font-patrick text-3xl sm:text-4xl font-bold text-amber-200 mb-1 drop-shadow-md">
              You are Ready! 🌟
            </h2>
            <p className="text-sm text-teal-100/90 mb-6 max-w-sm">
              Let&apos;s sort all the crystals in the Grand Vault!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
              <button
                type="button"
                onClick={startDccs}
                className="w-full sm:w-auto rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-teal-600 px-10 py-4 text-xl font-extrabold text-white shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Play! ▶
              </button>
              <button
                type="button"
                onClick={() => {
                  playAudio('tap')
                  events.noteRetry('dccs')
                  setPrac({g: 'dccs', i: 0, tries: 0, msg: '', done: false})
                }}
                className="w-full sm:w-auto rounded-full border border-teal-400/40 bg-[#122A21] px-6 py-3 text-xs font-bold text-teal-200 hover:text-white transition-all cursor-pointer"
              >
                Practice Again ↺
              </button>
            </div>
          </div>
        </div>
      )
    }
    const t = DCCS_PRACTICE[prac.i]
    const showHint = prac.tries >= 2

    return (
      <AlchemicalSortingArena
        title="Match COLOR 🎨"
        subtitle="🔴 Red goes to Red • 🔵 Blue goes to Blue"
        rule="color"
        targetGem={t}
        onSort={(n) => pracAnswer(n === t.tray, DCCS_PRACTICE.length)}
        stepLabel={`Practice ${prac.i + 1} of ${DCCS_PRACTICE.length}`}
        modeLabel="Training"
        hintTray={showHint ? t.tray : null}
        feedbackMsg={prac.msg}
      />
    )
  }

  const autismBg = stage === 'welcome'
    ? '/quests/autism/welcome.webp'
    : (stage === 'ja_story' || stage === 'ja_game' || stage === 'ja_show')
    ? '/quests/autism/bg_gaze.webp'
    : (stage === 'tom_story' || stage === 'tom_game')
    ? '/quests/autism/bg_feelings.webp'
    : (stage === 'sensory_story' || stage === 'sensory_game')
    ? '/quests/autism/bg_sanctuary.webp'
    : (stage === 'dccs_story' || stage === 'dccs_game')
    ? '/quests/autism/bg_sorting.webp'
    : stage === 'celebration'
    ? '/quests/autism/celebration.webp'
    : '/quests/autism/welcome.webp'

  const isTaskScreen = stage.endsWith('_game')
  const isWideStage = ['look_game', 'ja_game', 'ja_show', 'feelings_game', 'sensory_story', 'dccs_story', 'dccs_game', 'end'].includes(stage)

  return (
    <main data-no-listen="true" className="relative min-h-screen py-8 px-4 font-poppins text-[#1F2937] overflow-x-hidden selection:bg-teal-400 selection:text-teal-950">
      {/* Immersive Illustrated The Lantern Garden Backdrop */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#041D15]">
        <QuestStyles />
        <Fireflies color="#6EE7B7" />
        <img
          src={autismBg}
          alt="The Lantern Garden"
          className="w-full h-full object-cover object-center opacity-85"
          width={1280}
          height={720}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#041D15]/50 via-transparent to-[#041D15]/80" />
      </div>

      {notice && <div role="alert" className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-xl">{notice} <button type="button" className="ml-3 underline" onClick={() => setNotice('')}>Dismiss</button></div>}
      <AmbientToggle mood="autism" />

      {/* Gentle Garden Break Modal */}
      {isPaused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="rounded-3xl border-2 border-teal-300 bg-white p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-50 border-2 border-teal-200 flex items-center justify-center text-3xl">
              🌿
            </div>
            <h3 className="font-patrick text-2xl font-bold text-teal-900 mb-2">Resting in the Garden</h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Take a slow breath. Aria and the fox cub are resting with you. Whenever you are ready, press continue.
            </p>
            <button
              type="button"
              onClick={() => setIsPaused(false)}
              className="rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-8 py-3 text-base font-bold text-white shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              Continue playing ▶
            </button>
          </div>
        </div>
      )}

      <div key={stage} className={`mx-auto ${isWideStage ? 'max-w-5xl lg:max-w-6xl w-full px-2 sm:px-4' : 'max-w-4xl'} relative z-10 qd-stage`}>
        {/* Navigation & Realm Indicator */}
        <div className="mb-6 flex items-center justify-between text-xs">
          <Link href="/gamified-assessments" prefetch={false} className="font-bold text-teal-300 hover:text-teal-200 hover:underline flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-teal-300/30 shadow-sm">
            ← Gamified Quests
          </Link>
          <div className="flex items-center gap-2">
            {isTaskScreen && (
              <button
                type="button"
                onClick={() => setIsPaused(true)}
                className="rounded-full bg-teal-900/80 hover:bg-teal-800 text-teal-100 border border-teal-400/50 px-3.5 py-1.5 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                aria-label="Take a calm break"
              >
                <span>🌿</span> Take a break
              </button>
            )}
            <span className="rounded-full bg-black/40 backdrop-blur-md px-3.5 py-1.5 font-bold text-teal-200 border border-teal-400/40 shadow-sm">
              Play-Based Social & Sensory Quest • Not a Diagnosis
            </span>
          </div>
        </div>

        <LanternProgressTrail stage={stage} />
        <ReadAloud age={guardianAge} stage={stage} />
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
              <WelcomeWizard
                theme="teal"
                classLabel="Grove Affinity"
                classes={GROVE_AFFINITIES}
                selected={guildAffinity}
                onSelect={(n) => { playAudio('tap'); setGuildAffinity(n) }}
                nameLabel="Guardian Codename"
                namePlaceholder="e.g. Guardian Diya or Rohan of the Grove"
                name={guardianName}
                onName={setGuardianName}
                ages={[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]}
                age={guardianAge}
                onAge={setGuardianAge}
                ageNote={(a) => (a <= 8 ? 'For this age each story screen has a Hear this button that reads the instructions aloud.' : '')}
                consent={parentOk}
                onConsent={setParentOk}
                startLabel="Enter the Whispering Groves: Chapter 1 →"
                onStart={() => { playAudio('chime'); setStage('look_setup') }}
                onTick={() => playAudio('tap')}
              />
            </div>
          </div>
        )}

        {/* 2. CHAPTER 1 STORY: ARIA'S POTTERY VERANDA */}
        {stage === 'look_setup' && (
          <CameraConsent
            cam={cam}
            variant="looking"
            childName={guardianName}
            onContinue={(cameraOn) => { playAudio('chime'); setStage(cameraOn ? 'look_game' : 'ja_story') }}
          />
        )}
        {stage === 'look_game' && (
          <LookingGame
            cam={cam}
            name={guardianName.trim() || 'your child'}
            onFinish={(tele) => { setLookTele(tele); cam.stop(); playAudio('chime'); setStage('ja_story') }}
          />
        )}

        {stage === 'ja_story' && prac?.g === 'ja' && renderJaPractice()}
        {stage === 'ja_story' && !prac && (
          <div className="rounded-3xl border-2 border-teal-300/40 bg-white/95 backdrop-blur-md overflow-hidden shadow-2xl">
            <div className="relative h-52 sm:h-60 md:h-64 w-full overflow-hidden bg-gradient-to-b from-[#CCFBF1] to-[#DBEAFE]">
              <img
                src="/decor/itw/quest-lumina-groves-banner.webp"
                alt="Veranda of Lumina"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex items-end p-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-black/40 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
                    <span>🏺</span> Chapter 1 • Secret Urns
                  </span>
                  <h2 className="font-patrick text-3xl md:text-4xl text-white font-bold mt-1.5">
                    Aria&apos;s Secret Urns
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 text-center">
              {/* Byte-sized illustrated steps */}
              <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto mb-6">
                <div className="flex flex-col items-center p-3 rounded-2xl bg-teal-50 border border-teal-200 shadow-xs">
                  <span className="text-3xl mb-1">👀</span>
                  <span className="text-xs font-bold text-teal-900">1. Watch Aria</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs">
                  <span className="text-3xl mb-1">👉</span>
                  <span className="text-xs font-bold text-amber-900">2. See her look</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-xs">
                  <span className="text-3xl mb-1">🏺</span>
                  <span className="text-xs font-bold text-emerald-900">3. Tap that urn!</span>
                </div>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => beginPractice('ja', 'Aria will point at a pot. Tap the pot she points to!')}
                  className="rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-10 py-4 text-xl font-bold text-white shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  Let&apos;s practice! ▶
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. CHAPTER 1 GAMEPLAY: JOINT ATTENTION */}
        {stage === 'ja_game' && JA_TRIALS[jaTrialIndex] && (
          <div className="rounded-3xl border border-[#D4A373]/40 bg-gradient-to-b from-[#14120E]/50 via-[#1D1914]/40 to-[#120F0C]/60 backdrop-blur-md p-5 sm:p-7 shadow-[0_16px_40px_rgba(0,0,0,0.6)] text-center select-none max-w-4xl lg:max-w-5xl mx-auto w-full text-white">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-200 bg-[#3A2412]/80 border border-amber-400/30 px-3.5 py-1 rounded-full backdrop-blur-sm">
                🏺 Urn {jaTrialIndex + 1} of {JA_TRIALS.length}
              </span>
              <span className="text-xs font-bold text-amber-100 bg-[#422D19]/80 px-3 py-1 rounded-full border border-amber-400/30 backdrop-blur-sm flex items-center gap-1">
                <span>🏛️</span> Terrace
              </span>
            </div>

            <p className="font-patrick text-2xl sm:text-3xl text-amber-50 font-bold mb-1 drop-shadow-md">
              Where is Aria looking? 👀
            </p>
            <p className="text-xs sm:text-sm text-amber-200/90 mb-2 font-medium">
              Tap the urn she is looking or pointing at! 👇
            </p>

            {/* Guide Avatar (Aria standing at the Veranda Balustrade) */}
            <div className="my-1">
              <GazeGuide
                key={jaTrialIndex}
                gaze={JA_TRIALS[jaTrialIndex].avatarGaze}
                isPointing={JA_TRIALS[jaTrialIndex].isPointing}
                onCue={() => { jaStartRef.current = performance.now(); setJaReady(true) }}
              />
            </div>

            {/* 3 Artisan Vessels on Courtyard Pedestals */}
            <div className={`grid grid-cols-3 gap-3 md:gap-4 max-w-lg mx-auto mt-2 transition-opacity duration-300 ${jaReady ? '' : 'opacity-60'}`}>
              {[
                { pot: 0, type: 'A' as const, label: 'Left Urn' },
                { pot: 1, type: 'B' as const, label: 'Center Urn' },
                { pot: 2, type: 'C' as const, label: 'Right Urn' }
              ].map(({ pot, type, label }) => (
                <button
                  key={pot}
                  type="button"
                  aria-label={label}
                  onClick={() => handlePotSelect(pot)}
                  className="group relative flex h-44 sm:h-52 flex-col items-center justify-end rounded-2xl p-2 transition-all duration-300 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
                >
                  <div className="absolute inset-x-0 bottom-0 h-28 rounded-2xl bg-gradient-to-b from-[#C49A6C]/30 via-[#9E7347]/40 to-[#6E4B29]/60 border-2 border-[#EAD7B8]/40 backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.5)] group-hover:border-amber-300/80 group-hover:bg-[#C49A6C]/45 transition-all">
                    <div className="absolute inset-x-0 top-0 h-2.5 rounded-t-xl bg-[#EAD7B8]/30 border-b border-[#7A4C25]/40" />
                  </div>

                  <div className="absolute bottom-9 w-20 h-3.5 rounded-full bg-black/40 blur-[2px] pointer-events-none" />

                  {JA_TRIALS[jaTrialIndex].hidden && JA_TRIALS[jaTrialIndex].targetPot === pot && (
                    <div aria-hidden="true" className="pointer-events-none absolute inset-x-2 top-0 h-[82%] z-20 flex flex-col items-center justify-center">
                      <div className="w-16 h-full rounded-2xl bg-gradient-to-b from-[#C49A6C] via-[#B28757] to-[#8C6237] border-2 border-[#EAD7B8] shadow-2xl flex flex-col items-center justify-between py-2 px-1 opacity-95">
                        <span className="text-xs">🏛️</span>
                        <span className="text-[10px] font-bold text-amber-100 tracking-wider uppercase text-center leading-tight">Palace Pillar</span>
                        <span className="text-xs">🌿</span>
                      </div>
                    </div>
                  )}

                  <div className="relative z-10 w-full h-[76%] flex items-center justify-center p-1">
                    <ArtisanVesselSvg type={type} />
                  </div>

                  <span className="relative z-10 mb-2 rounded-full bg-[#2A180B]/90 px-3 py-0.5 text-xs font-bold text-amber-100 border border-amber-300/40 backdrop-blur-sm shadow-sm group-hover:text-white group-hover:border-amber-300 transition-all">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. CHAPTER 2 STORY: THE EMOTION MIRROR */}
        {stage === 'ja_show' && (
          <div className="rounded-3xl border border-[#D4A373]/40 bg-gradient-to-b from-[#14120E]/50 via-[#1D1914]/40 to-[#120F0C]/60 backdrop-blur-md p-5 sm:p-7 shadow-[0_16px_40px_rgba(0,0,0,0.6)] text-center select-none max-w-4xl lg:max-w-5xl mx-auto w-full text-white">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-200 bg-[#3A2412]/80 border border-amber-400/30 px-3.5 py-1 rounded-full backdrop-blur-sm">
                ✨ Turn {showRound + 1} of {SHOW_TARGETS.length}
              </span>
              <span className="text-xs font-bold text-amber-100 bg-[#422D19]/80 px-3 py-1 rounded-full border border-amber-400/30 backdrop-blur-sm flex items-center gap-1">
                <span>✨</span> Show Aria
              </span>
            </div>

            <p className="font-patrick text-2xl sm:text-3xl text-amber-50 font-bold mb-1 drop-shadow-md">
              Show Aria the sparkle! ✨
            </p>
            <p className="text-xs sm:text-sm text-amber-200/90 mb-2 font-medium">
              Tap the urn with the spark to point it out! 👉
            </p>

            <div className="my-1">
              <GazeGuide
                key={`show-${showRound}-${showTurned ? 'turned' : 'away'}`}
                gaze={showTurned && showPick[showRound] !== null && showPick[showRound] !== undefined ? POT_GAZE[showPick[showRound] as number] : POT_GAZE[SHOW_TARGETS[showRound] === 2 ? 0 : 2]}
                isPointing={false}
                onCue={() => {}}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-lg mx-auto mt-2">
              {[
                { pot: 0, type: 'A' as const, label: 'Left Urn' },
                { pot: 1, type: 'B' as const, label: 'Center Urn' },
                { pot: 2, type: 'C' as const, label: 'Right Urn' }
              ].map(({ pot, type, label }) => (
                <button
                  key={pot}
                  type="button"
                  disabled={showTurned}
                  aria-label={label}
                  onClick={() => handleShowPick(pot)}
                  className="group relative flex h-44 sm:h-52 flex-col items-center justify-end rounded-2xl p-2 transition-all duration-300 hover:scale-105 active:scale-95 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
                >
                  <div className="absolute inset-x-0 bottom-0 h-28 rounded-2xl bg-gradient-to-b from-[#C49A6C]/30 via-[#9E7347]/40 to-[#6E4B29]/60 border-2 border-[#EAD7B8]/40 backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.5)] group-hover:border-amber-300/80 group-hover:bg-[#C49A6C]/45 transition-all">
                    <div className="absolute inset-x-0 top-0 h-2.5 rounded-t-xl bg-[#EAD7B8]/30 border-b border-[#7A4C25]/40" />
                  </div>

                  <div className="absolute bottom-9 w-20 h-3.5 rounded-full bg-black/40 blur-[2px] pointer-events-none" />

                  <div className="relative z-10 w-full h-[76%] flex items-center justify-center p-1">
                    <ArtisanVesselSvg type={type} />
                  </div>

                  {SHOW_TARGETS[showRound] === pot && (
                    <span aria-hidden="true" className="absolute top-4 right-4 text-3xl z-20 animate-bounce drop-shadow-[0_0_10px_rgba(251,191,36,0.9)]">✨</span>
                  )}

                  <span className="relative z-10 mb-2 rounded-full bg-[#2A180B]/90 px-3 py-0.5 text-xs font-bold text-amber-100 border border-amber-300/40 backdrop-blur-sm shadow-sm group-hover:text-white group-hover:border-amber-300 transition-all">
                    {label}
                  </span>
                </button>
              ))}
            </div>

            {showSkipReady && !showTurned && (
              <button type="button" onClick={() => handleShowPick(null)} className="mt-3 text-sm font-bold text-amber-300 underline hover:text-amber-200">
                Skip this turn
              </button>
            )}
          </div>
        )}

        {stage === 'tom_story' && prac?.g === 'tom' && renderTomPractice()}
        {stage === 'tom_story' && !prac && (
          <div className="rounded-3xl border-2 border-teal-300/40 bg-white/95 backdrop-blur-md overflow-hidden shadow-2xl">
            <div className="relative h-52 sm:h-60 md:h-64 w-full overflow-hidden bg-[#1E3A8A]">
              <img
                src="/decor/itw/quest-lumina-groves-banner.webp"
                alt="Emotion Mirror"
                className="h-full w-full object-cover object-center opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex items-end p-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-black/40 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
                    <span>🦊</span> Chapter 2 • Feeling Faces
                  </span>
                  <h2 className="font-patrick text-3xl md:text-4xl text-white font-bold mt-1.5">
                    Fox Cub&apos;s Feelings 🦊
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 text-center">
              <p className="font-patrick text-2xl md:text-3xl font-bold text-teal-900 leading-snug mb-5 max-w-lg mx-auto">
                Fox makes a face. Tap the friend with the same feeling! 👇
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto mb-6">
                <div className="flex flex-col items-center p-3 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs">
                  <ForestSpriteFaceSvg emotion="happy" className="w-16 h-16 drop-shadow-md" />
                  <span className="text-xs font-bold text-amber-800 mt-1 flex items-center gap-1">
                    <span>😊</span> Happy
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-2xl bg-blue-50 border border-blue-200 shadow-xs">
                  <ForestSpriteFaceSvg emotion="sad" className="w-16 h-16 drop-shadow-md" />
                  <span className="text-xs font-bold text-blue-800 mt-1 flex items-center gap-1">
                    <span>😢</span> Sad
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-2xl bg-purple-50 border border-purple-200 shadow-xs">
                  <ForestSpriteFaceSvg emotion="surprised" className="w-16 h-16 drop-shadow-md" />
                  <span className="text-xs font-bold text-purple-800 mt-1 flex items-center gap-1">
                    <span>😮</span> Surprised
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-xs">
                  <ForestSpriteFaceSvg emotion="calm" className="w-16 h-16 drop-shadow-md" />
                  <span className="text-xs font-bold text-emerald-800 mt-1 flex items-center gap-1">
                    <span>😌</span> Calm
                  </span>
                </div>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => beginPractice('tom', 'The fox cub makes a face. Tap the sprite with the same feeling!')}
                  className="rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-10 py-4 text-xl font-bold text-white shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  Let&apos;s practice! ▶
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. CHAPTER 2 GAMEPLAY: EMOTION MIRROR */}
        {stage === 'tom_game' && helpPending && (
          <div className="rounded-3xl border border-emerald-400/30 bg-gradient-to-b from-[#0A1F16]/50 via-[#081811]/40 to-[#04100B]/60 backdrop-blur-md p-5 sm:p-7 shadow-[0_16px_40px_rgba(0,0,0,0.6)] text-center select-none max-w-4xl lg:max-w-5xl mx-auto w-full text-white">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-200/90 bg-[#162D1F]/80 border border-amber-300/30 px-3.5 py-1 rounded-full backdrop-blur-sm">
              💛 Helping Fox
            </span>
            <div className="my-3">
              <div className="relative mx-auto flex h-36 w-36 sm:h-44 sm:w-44 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-amber-300/90 bg-gradient-to-b from-[#FFFDF8] via-[#F8EFE3] to-[#F0E2CE] shadow-[0_0_35px_rgba(251,191,36,0.3)]" />
                <span className="absolute -top-2 left-4 text-sm pointer-events-none drop-shadow">🌿</span>
                <span className="absolute -bottom-2 right-4 text-sm pointer-events-none drop-shadow">🌸</span>
                <FoxCubFaceSvg emotion="sad" className="relative z-10 w-[78%] h-[78%] drop-shadow-md select-none pointer-events-none" />
              </div>
            </div>
            <p className="font-patrick text-2xl sm:text-3xl text-amber-50 font-bold mb-1 drop-shadow-md">
              Fox is feeling sad 😢
            </p>
            <p className="text-xs sm:text-sm text-emerald-200/90 mb-3 font-medium">
              What will cheer him up? Tap one! 👇
            </p>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-md mx-auto mt-2">
              {[
                { label: 'Warm hug', icon: '💛' },
                { label: 'Quiet corner', icon: '🌿' },
                { label: 'Storybook', icon: '📖' }
              ].map(({ label, icon }, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleHelpSelect(i)}
                  className="group relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-emerald-400/30 bg-gradient-to-b from-[#182C20]/90 to-[#0F1E15]/95 py-4 px-2 text-sm sm:text-base font-bold text-amber-100 shadow-xl backdrop-blur-md hover:border-amber-300/80 hover:bg-[#203628] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <span className="text-3xl">{icon}</span>
                  <span className="text-xs sm:text-sm font-bold text-center leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {stage === 'tom_game' && !helpPending && EMOTION_MIRROR_TRIALS[tomTrialIndex] && (
          <div className="rounded-3xl border border-emerald-400/30 bg-gradient-to-b from-[#0A1F16]/50 via-[#081811]/40 to-[#04100B]/60 backdrop-blur-md p-5 sm:p-7 shadow-[0_16px_40px_rgba(0,0,0,0.6)] text-center select-none max-w-4xl lg:max-w-5xl mx-auto w-full text-white">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-200/90 bg-[#162D1F]/80 border border-amber-300/30 px-3.5 py-1 rounded-full backdrop-blur-sm">
                🦊 Face {tomTrialIndex + 1} of {EMOTION_MIRROR_TRIALS.length}
              </span>
              <span className="text-xs font-bold text-emerald-200 bg-[#0E2419]/80 px-3 py-1 rounded-full border border-emerald-400/40 backdrop-blur-sm flex items-center gap-1">
                <span>🌸</span> Gazebo
              </span>
            </div>

            <p className="font-patrick text-2xl sm:text-3xl text-amber-50 font-bold mb-1 drop-shadow-md">
              How does Fox feel? 🤔
            </p>
            <p className="text-xs sm:text-sm text-emerald-200/90 mb-2 font-medium">
              Tap the matching friend! 👇
            </p>

            {/* The Enchanted Blossom Mirror Frame */}
            <div className="my-2">
              <div className="relative mx-auto flex h-38 w-38 sm:h-46 sm:w-46 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl animate-pulse" />
                <div className="absolute inset-0 rounded-full border-4 border-amber-300/90 bg-gradient-to-b from-[#FFFDF8] via-[#F8EFE3] to-[#F0E2CE] shadow-[0_0_40px_rgba(251,191,36,0.35)]" />
                <div className="absolute inset-1.5 rounded-full border border-amber-400/40 pointer-events-none" />
                <span className="absolute -top-3 left-4 text-base pointer-events-none drop-shadow">🌿</span>
                <span className="absolute -top-2 right-6 text-sm pointer-events-none drop-shadow">🌸</span>
                <span className="absolute -bottom-2 left-6 text-sm pointer-events-none drop-shadow">🌸</span>
                <span className="absolute -bottom-3 right-4 text-base pointer-events-none drop-shadow">🌿</span>
                <FoxCubFaceSvg
                  emotion={EMOTION_MIRROR_TRIALS[tomTrialIndex].target}
                  className="relative z-10 w-[78%] h-[78%] drop-shadow-md select-none pointer-events-none"
                />
              </div>
            </div>

            {/* 3 Forest Spirits on Mossy Stepping Stones */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-md mx-auto my-3">
              {EMOTION_MIRROR_TRIALS[tomTrialIndex].options.map((emotionOpt) => (
                <button
                  key={emotionOpt}
                  type="button"
                  aria-label={emotionOpt}
                  onClick={() => handleEmotionSelect(emotionOpt)}
                  className="group relative flex h-36 sm:h-42 flex-col items-center justify-end rounded-[30px] p-2 transition-all duration-300 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
                >
                  <div className="absolute inset-0 rounded-[30px] bg-gradient-to-b from-[#1C2C22]/90 via-[#16251C]/95 to-[#0E1A13]/95 border-2 border-emerald-400/40 shadow-2xl backdrop-blur-md group-hover:border-amber-300/80 group-hover:bg-[#203628]/95 group-hover:shadow-[0_0_30px_rgba(251,191,36,0.35)] transition-all">
                    <div className="absolute inset-x-3 top-0 h-2 rounded-t-[20px] bg-emerald-400/25 blur-[1px]" />
                    <span className="absolute top-1.5 left-2.5 text-[11px] opacity-75 pointer-events-none">🌿</span>
                    <span className="absolute top-1.5 right-2.5 text-[10px] opacity-75 pointer-events-none">✨</span>
                  </div>

                  <div className="relative z-10 w-full h-[76%] flex items-center justify-center p-1">
                    <ForestSpriteFaceSvg emotion={emotionOpt} className="h-full w-full max-h-24 max-w-24 drop-shadow-md" />
                  </div>

                  <span className="relative z-10 mb-2 rounded-full bg-[#132318]/90 px-3 py-0.5 text-xs font-bold capitalize text-amber-100 border border-emerald-400/30 backdrop-blur-sm group-hover:border-amber-300/60 group-hover:text-white transition-all">
                    {emotionOpt}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 6. CHAPTER 3: SENSORY SANCTUARY CALIBRATION & HAVEN DESIGN */}
        {stage === 'sensory_story' && (
          <div className="relative rounded-3xl border-2 border-teal-400/50 bg-[#0A1612]/95 backdrop-blur-md overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.7)] text-teal-50 max-w-4xl lg:max-w-5xl mx-auto w-full">
            {/* Grand Treehouse Sanctuary Interactive Viewport */}
            <div className="relative h-72 sm:h-84 md:h-[400px] w-full overflow-hidden select-none bg-[#051A13]">
              {/* High-res Treehouse Sanctuary Canvas with Live Brightness & Contrast */}
              <img
                src="/decor/itw/quest-sanctuary-haven.webp"
                alt="Sensory Sanctuary Haven"
                className="h-full w-full object-cover object-center transition-[filter] duration-700 ease-out"
                style={{filter: `brightness(${0.45 + (liveLight / 10) * 0.95}) contrast(${0.9 + (liveLight / 10) * 0.25})`}}
              />

              {/* Dynamic Sunbeam Ray Overlay (illuminates with liveLight) */}
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_25%,rgba(254,240,138,0.45)_0%,rgba(251,191,36,0.18)_50%,transparent_80%)] transition-opacity duration-700"
                style={{opacity: Math.max(0, (liveLight - 2) / 8)}}
              />

              {/* Dynamic Rain Overlay (active when roomDim === 1 or liveSound > 2) */}
              {(roomDim === 1 || liveSound > 2) && (
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.15)_48%,transparent_52%)] animate-pulse opacity-70" />
              )}

              {/* Ambient Twilight Vignette at Base */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A1612] via-[#0A1612]/35 to-transparent" />

              {/* Floating Chapter Badge & Status Pill */}
              <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none z-10">
                <span className="rounded-full bg-black/60 backdrop-blur-md border border-teal-300/40 px-3.5 py-1 text-xs font-bold text-teal-200 shadow-md flex items-center gap-1.5">
                  <span>🏡</span>
                  <span>Treehouse Haven</span>
                </span>
                <span className="rounded-full bg-black/60 backdrop-blur-md border border-amber-300/40 px-3.5 py-1 text-xs font-bold text-amber-200 shadow-md flex items-center gap-1.5">
                  <span>{roomDim === 0 ? '☀️' : roomDim === 1 ? '🌧️' : '🪶'}</span>
                  <span>{roomPhase === 'ramp' ? (roomDim === 0 ? 'Light' : roomDim === 1 ? 'Rain Sound' : 'Pillow Softness') : 'My Haven'}</span>
                </span>
              </div>

              {/* Sanctuary Headline on Banner */}
              <div className="absolute bottom-4 inset-x-6 text-left pointer-events-none z-10">
                <h2 className="font-patrick text-3xl sm:text-4xl text-white font-bold drop-shadow-md">
                  The Cozy Treehouse 🏡
                </h2>
                <p className="text-xs sm:text-sm text-teal-100/90 max-w-xl drop-shadow">
                  Make the room feel just right for you!
                </p>
              </div>
            </div>

            {/* Interactive Sensory Control Deck */}
            <div className="p-6 sm:p-8 bg-gradient-to-b from-[#0A1612] via-[#0E201A] to-[#081410] border-t border-teal-400/30">
              {/* PHASE 1: INTRO */}
              {roomPhase === 'intro' && (
                <div className="max-w-xl mx-auto text-center py-2">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-teal-400/50 bg-[#142C23] p-1 shadow-lg">
                    <img src="/quests/autism/aria_gaze_center.webp" alt="Aria" className="h-full w-full object-cover rounded-xl" />
                  </div>
                  <h3 className="font-patrick text-2xl sm:text-3xl text-amber-200 font-bold mb-1">
                    Make Your Cozy Treehouse! 🏡
                  </h3>
                  <p className="text-xs sm:text-sm text-teal-100/90 mb-4 font-medium">
                    We will test 3 cozy things one by one:
                  </p>

                  {/* 3 Byte-Sized Illustrated Cards */}
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3 max-w-sm mx-auto mb-5">
                    <div className="flex flex-col items-center p-3 rounded-2xl bg-black/40 border border-teal-400/30 shadow-sm">
                      <span className="text-3xl mb-1">☀️</span>
                      <span className="text-xs font-bold text-amber-200">1. Light</span>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-2xl bg-black/40 border border-teal-400/30 shadow-sm">
                      <span className="text-3xl mb-1">🌧️</span>
                      <span className="text-xs font-bold text-teal-200">2. Rain</span>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-2xl bg-black/40 border border-teal-400/30 shadow-sm">
                      <span className="text-3xl mb-1">🪶</span>
                      <span className="text-xs font-bold text-emerald-200">3. Pillows</span>
                    </div>
                  </div>

                  <p className="text-sm font-bold text-amber-300 mb-6">
                    Tap ✋ when it feels like enough!
                  </p>

                  <div className="flex justify-center items-center">
                    <button
                      type="button"
                      onClick={startRoom}
                      className="rounded-full bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 px-10 py-4 text-xl font-extrabold text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                      Start! ▶
                    </button>
                  </div>
                </div>
              )}

              {/* PHASE 2: SENSORY THRESHOLD RAMP */}
              {roomPhase === 'ramp' && (
                <div className="max-w-xl mx-auto text-center">
                  {/* Guide Aria Guidance Box - Byte-Sized */}
                  <div className="mb-4 flex items-center justify-center gap-3 bg-[#0B1A14]/90 border border-teal-400/30 rounded-2xl p-3 px-4 shadow-md backdrop-blur-sm text-left">
                    <img
                      src="/quests/autism/aria_gaze_center.webp"
                      alt="Aria Guidance"
                      className="h-11 w-11 rounded-xl object-cover border border-teal-300/40 shrink-0"
                    />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 block">
                        Aria Guide
                      </span>
                      <p className="font-patrick text-lg sm:text-xl text-amber-100 font-bold leading-tight" aria-live="polite">
                        {roomDim === 0
                          ? '☀️ Light is rising... Tap ✋ when it’s too bright!'
                          : roomDim === 1
                          ? '🌧️ Rain is louder... Tap ✋ when it’s too loud!'
                          : '🪶 Pillows heavier... Tap ✋ when it’s too heavy!'}
                      </p>
                    </div>
                  </div>

                  {/* 10-Step Luminous Crystal Sensory Gauge */}
                  <div className="my-5 flex items-center justify-center gap-1.5 sm:gap-2.5">
                    {Array.from({length: ROOM_TOP}, (_, i) => {
                      const isLit = i < roomLevel
                      const isCurrent = i === roomLevel - 1
                      return (
                        <div
                          key={i}
                          className={`relative h-11 w-7 sm:h-13 sm:w-9 rounded-xl flex items-center justify-center transition-all duration-300 border ${
                            isCurrent
                              ? 'border-amber-300 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 scale-110 shadow-[0_0_22px_rgba(251,191,36,0.95)] ring-2 ring-amber-200'
                              : isLit
                              ? 'border-teal-300/80 bg-gradient-to-b from-teal-400 to-emerald-500 shadow-md'
                              : 'border-teal-900/40 bg-black/40 opacity-40'
                          }`}
                        >
                          <span className={`text-xs font-bold ${isCurrent ? 'text-amber-950 font-extrabold' : isLit ? 'text-teal-950' : 'text-slate-400'}`}>
                            {i + 1}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Real-Time Sensory Intensity Readout - Visual & Byte-Sized */}
                  <div className="inline-flex items-center gap-2 rounded-full bg-black/60 border border-teal-400/30 px-4 py-1.5 text-xs sm:text-sm font-bold text-amber-200 mb-6 backdrop-blur-sm shadow-sm">
                    <span>
                      {roomDim === 0
                        ? roomLevel <= 3
                          ? `Level ${roomLevel} • 🕯️ Soft Glow`
                          : roomLevel <= 6
                          ? `Level ${roomLevel} • ☀️ Cozy Light`
                          : `Level ${roomLevel} • ⚡ Bright Sunbeam`
                        : roomDim === 1
                        ? roomLevel <= 3
                          ? `Level ${roomLevel} • 💧 Soft Drizzle`
                          : roomLevel <= 6
                          ? `Level ${roomLevel} • 🌧️ Window Rain`
                          : `Level ${roomLevel} • ⛈️ Loud Storm`
                        : roomLevel <= 3
                        ? `Level ${roomLevel} • 🪶 Light Pillows`
                        : roomLevel <= 6
                        ? `Level ${roomLevel} • 🛏️ Snug Cushions`
                        : `Level ${roomLevel} • 🛡️ Heavy Blanket`}
                    </span>
                  </div>

                  {/* Tactile Comfort Button */}
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        playAudio('tap')
                        finishRampDim(roomLevel)
                      }}
                      className="group relative mx-auto flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-10 sm:px-14 py-4 sm:py-5 text-xl sm:text-2xl font-extrabold text-white shadow-[0_12px_32px_rgba(245,158,11,0.55)] border-2 border-amber-300/80 hover:scale-105 active:scale-95 transition-all cursor-pointer ring-4 ring-amber-400/20"
                    >
                      <span className="text-2xl sm:text-3xl transition-transform group-hover:scale-110">✋</span>
                      <span>That&apos;s Too Much!</span>
                    </button>
                    <p className="mt-3 text-xs text-teal-200/80 font-medium">
                      Tap ✋ when it feels like enough for you
                    </p>
                  </div>
                </div>
              )}

              {/* PHASE 3: SENSORY HAVEN STUDIO DESIGN */}
              {roomPhase === 'design' && (
                <>
                  <div className="text-center mb-6">
                    <span className="inline-block rounded-full bg-teal-400/20 border border-teal-300/40 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-teal-200 mb-1">
                      🌿 Haven Studio
                    </span>
                    <h3 className="font-patrick text-3xl sm:text-4xl text-amber-200 font-bold">
                      Set Your Cozy Haven 🏡
                    </h3>
                    <p className="text-xs sm:text-sm text-teal-100/90 max-w-sm mx-auto mt-1">
                      Pick what feels best to you:
                    </p>
                  </div>

                  {/* 3 Interactive Tactile Sliders */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* 1. Light Card */}
                    <div className="rounded-2xl border border-teal-400/30 bg-[#0D241C]/80 p-4 shadow-md backdrop-blur-sm text-left">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase text-amber-200 flex items-center gap-1.5">
                          <span>☀️</span> Light
                        </span>
                        <span className="text-xs font-bold text-teal-200">
                          {sensoryLight ?? 5} / 10
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={sensoryLight ?? 5}
                        onChange={(e) => { setSensoryLight(Number(e.target.value)); bumpAdjust('light') }}
                        className="w-full accent-amber-400 cursor-pointer"
                      />
                      <span className="block mt-2 text-[11px] font-semibold text-teal-100/80">
                        {(sensoryLight ?? 5) <= 3
                          ? '🕯️ Soft Glow'
                          : (sensoryLight ?? 5) <= 7
                          ? '☀️ Cozy Sunlight'
                          : '⚡ Bright Sunbeam'}
                      </span>
                    </div>

                    {/* 2. Sound Card */}
                    <div className="rounded-2xl border border-teal-400/30 bg-[#0D241C]/80 p-4 shadow-md backdrop-blur-sm text-left">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase text-amber-200 flex items-center gap-1.5">
                          <span>🌧️</span> Rain Sound
                        </span>
                        <span className="text-xs font-bold text-teal-200">
                          {sensorySound ?? 5} / 10
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={sensorySound ?? 5}
                        onChange={(e) => { setSensorySound(Number(e.target.value)); bumpAdjust('sound') }}
                        className="w-full accent-teal-400 cursor-pointer"
                      />
                      <span className="block mt-2 text-[11px] font-semibold text-teal-100/80">
                        {(sensorySound ?? 5) <= 3
                          ? '💧 Whisper Drizzle'
                          : (sensorySound ?? 5) <= 7
                          ? '🌧️ Cozy Rain'
                          : '⛈️ Loud Storm'}
                      </span>
                    </div>

                    {/* 3. Texture Card */}
                    <div className="rounded-2xl border border-teal-400/30 bg-[#0D241C]/80 p-4 shadow-md backdrop-blur-sm text-left">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase text-amber-200 flex items-center gap-1.5">
                          <span>🪶</span> Cushion Weight
                        </span>
                        <span className="text-xs font-bold text-teal-200">
                          {sensoryTouch ?? 5} / 10
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={sensoryTouch ?? 5}
                        onChange={(e) => { setSensoryTouch(Number(e.target.value)); bumpAdjust('texture') }}
                        className="w-full accent-emerald-400 cursor-pointer"
                      />
                      <span className="block mt-2 text-[11px] font-semibold text-teal-100/80">
                        {(sensoryTouch ?? 5) <= 4
                          ? '🪶 Light Feather'
                          : (sensoryTouch ?? 5) <= 7
                          ? '🛏️ Snug Cushion'
                          : '🛡️ Cozy Heavy Blanket'}
                      </span>
                    </div>
                  </div>

                  {/* Preset Sanctuary Moods - Byte-Sized */}
                  <div className="mb-6 flex flex-wrap justify-center items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        playAudio('whoosh')
                        setSensoryLight(2)
                        setSensorySound(2)
                        setSensoryTouch(8)
                        bumpAdjust('light')
                      }}
                      className="rounded-full border border-teal-400/40 bg-[#122A21] px-4 py-2 text-xs font-bold text-teal-200 hover:border-amber-300 hover:text-white transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <span>🌙</span> Dim & Snug
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playAudio('whoosh')
                        setSensoryLight(6)
                        setSensorySound(5)
                        setSensoryTouch(4)
                        bumpAdjust('light')
                      }}
                      className="rounded-full border border-teal-400/40 bg-[#122A21] px-4 py-2 text-xs font-bold text-teal-200 hover:border-amber-300 hover:text-white transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <span>🌿</span> Sunlit & Open
                    </button>
                    <button
                      type="button"
                      onClick={shieldRoom}
                      className="rounded-full border-2 border-emerald-400 bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-2 text-xs font-bold text-white shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <span>🛡️</span> Softest Everything
                    </button>
                  </div>

                  {/* Complete & Advance to Final Chapter */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        roomDesignSecRef.current = Math.round((performance.now() - roomDesignStartRef.current) / 1000)
                        playAudio('fanfare')
                        setDccsIndex(0)
                        setDccsSwitchSeen(false)
                        setPrac({g: 'dccs', i: 0, tries: 0, msg: '', done: false})
                        setStage('dccs_story')
                        sayIt('Put the gem in the box with the same color!')
                      }}
                      className="rounded-full bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 px-12 py-5 text-2xl font-extrabold text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                      All Done! Next Game ▶
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* 7. CHAPTER 4 GAMEPLAY: ALCHEMICAL DCCS */}
        {stage === 'dccs_story' && renderDccsPractice()}

        {stage === 'dccs_game' && dccsWarnLeft !== null && (
          <div className="relative rounded-3xl border-2 border-amber-400/80 bg-[#0A1612]/95 backdrop-blur-md p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-center select-none max-w-xl mx-auto overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(251,191,36,0.25)_0%,transparent_70%)] animate-pulse" />
            <div className="relative z-10 flex flex-col items-center">
              <span className="rounded-full bg-amber-500/20 border border-amber-400/50 px-4 py-1 text-xs font-bold uppercase tracking-wider text-amber-200 mb-2 shadow-sm">
                🔔 Watch out!
              </span>
              <h2 className="font-patrick text-3xl sm:text-4xl font-bold text-amber-300 mb-2 drop-shadow-md">
                Rule is changing!
              </h2>
              {/* Visual Shift Diagram */}
              <div className="flex items-center justify-center gap-3 my-3">
                <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-rose-500/25 border border-rose-400/60 text-xs sm:text-sm font-bold text-rose-200">
                  <span>🎨</span> Colors
                </span>
                <span className="text-amber-300 text-lg font-bold animate-pulse">➔ ⚡ ➔</span>
                <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-sky-500/25 border border-sky-400/60 text-xs sm:text-sm font-bold text-sky-200">
                  <span>🔷</span> Shapes
                </span>
              </div>
              <div key={dccsWarnLeft} className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-amber-300 bg-gradient-to-b from-amber-400/30 to-amber-600/40 shadow-[0_0_40px_rgba(251,191,36,0.6)] animate-pulse my-2">
                <div className="absolute inset-2 rounded-full border border-dashed border-amber-200/50 animate-[spin_6s_linear_infinite]" />
                <span className="text-5xl font-extrabold text-amber-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  {dccsWarnLeft}
                </span>
              </div>
            </div>
          </div>
        )}

        {stage === 'dccs_game' && dccsRuleCheck && (
          <div className="relative rounded-3xl border-2 border-emerald-400/80 bg-[#0A1612]/95 backdrop-blur-md p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-center select-none max-w-xl mx-auto overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(16,185,129,0.2)_0%,transparent_70%)]" />
            <div className="relative z-10 flex flex-col items-center">
              <span className="rounded-full bg-emerald-500/20 border border-emerald-400/50 px-4 py-1 text-xs font-bold uppercase tracking-wider text-emerald-200 mb-2 shadow-sm">
                🤔 Quick Question
              </span>
              <h2 className="font-patrick text-3xl sm:text-4xl font-bold text-amber-200 mb-1 drop-shadow-md">
                What are we matching now?
              </h2>
              <p className="text-xs sm:text-sm text-teal-200/80 mb-6">
                Tap what we match by right now:
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
                <button
                  type="button"
                  onClick={() => handleRuleCheck('colour')}
                  className="w-full sm:w-1/2 flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-rose-400/80 bg-gradient-to-b from-[#2B0E14] to-[#120508] p-4 text-base font-bold text-rose-200 shadow-lg hover:border-rose-300 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <span className="text-3xl">🎨</span>
                  <span className="text-lg font-bold">COLORS</span>
                  <span className="text-[11px] font-semibold text-rose-300">🔴 Red & 🔵 Blue</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRuleCheck('shape')}
                  className="w-full sm:w-1/2 flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-sky-400/80 bg-gradient-to-b from-[#0B1E2E] to-[#040D14] p-4 text-base font-bold text-sky-200 shadow-lg hover:border-sky-300 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <span className="text-3xl">🔷</span>
                  <span className="text-lg font-bold">SHAPES</span>
                  <span className="text-[11px] font-semibold text-sky-300">⭐ Stars & ⭕ Circles</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {stage === 'dccs_game' && DCCS_CARDS[dccsIndex] && dccsWarnLeft === null && !dccsRuleCheck && (
          <AlchemicalSortingArena
            title={dccsRule === 'color' ? 'Match COLOR 🎨' : 'Match SHAPE 🔷'}
            subtitle={
              dccsRule === 'color'
                ? '🔴 Red goes to Red • 🔵 Blue goes to Blue'
                : '⭐ Stars go to Stars • ⭕ Circles go to Circles'
            }
            rule={dccsRule}
            targetGem={DCCS_CARDS[dccsIndex]}
            onSort={(bin) => handleDccsSort(bin)}
            stepLabel={`Gem ${dccsIndex + 1} of ${DCCS_CARDS.length}`}
            modeLabel={dccsRule === 'color' ? 'Colors' : 'Shapes'}
          />
        )}

        {/* 8. LOADING AGENT */}
        {stage === 'parent_card' && (
          <ParentCard childName={guardianName} onDone={(a) => submitAutismAgent(a)} />
        )}

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
              <div className="mb-4 flex flex-wrap items-center justify-center gap-3"><ClinicianReportButton quest="autism" nickname={a.childName} age={a.childAge} generatedOn={a.clinicalReport?.generatedOn} rows={a.clinicalReport?.indices ?? []} clinicianQuestions={a.clinicalReport?.questions ?? []} measures={a.record?.measures} sortingCards={a.record?.sortingCards} gazeRounds={a.record?.gazeRounds} feelingsRounds={a.record?.feelingsRounds} parentCard={a.record?.parentCard} showRounds={a.record?.showRounds} />{a.record && <SessionRecordDownload record={a.record} />}</div>
            ) })()}
            {/* PERSONALISED REPORT FOR THE PARENT: built from this session, shown only once a clinician has checked the wording */}
            {agentResult && (agentResult as {record?: unknown}).record && (
              <div className="mb-8"><EndReport record={(agentResult as {record: any}).record} name={(agentResult as {childName: string}).childName} /></div>
            )}
            {/* GROWN-UP SUMMARY & CLINICAL DOSSIER */}
            {showClinicalDossier && agentResult?.clinicalReport && (
              <div className="space-y-6">
                <CognitiveDossierView
                  quest="autism"
                  childName={(agentResult as {childName: string}).childName || guardianName || 'Explorer'}
                  clinicalReport={agentResult.clinicalReport}
                />
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <Link
                    href="/consult"
                    className="rounded-full bg-[#0D9488] px-8 py-3 text-xs font-bold text-white shadow-md hover:bg-[#0F766E] transition-all"
                  >
                    Talk to a Manas specialist →
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowClinicalDossier(false)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
                  >
                    Collapse grown-up summary
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <CameraBadge status={cam.status} videoRef={cam.videoRef} onStop={cam.stop} large={stage === 'look_setup'} />
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
