'use client'
import {useState} from 'react'
import type {Roadmap} from '../roadmap/generate'
import {TEXT as ROADMAP_TEXT} from '../roadmap/library'
import {GAME_NOTE} from '../ClinicianReport'
import type {Measure} from '../session-record'
import {buildChildStatus, GROUP_INTRO, GROUP_TITLE, type Band, type SkillGroup, type StatusItem} from './status'
import {CLINICIAN_QUESTIONS, REPORT_TEXT, STATUS_RULES} from './library'
import HomePlan from '../plan/HomePlan'
import {ClinicianSection, DraftBanner, ParentSection, type ReportRecord} from './ParentClinicianReport'

/**
 * Two separate views of one session record: a one-page summary for the parent and a one-page summary for the clinician,
 * each followed by its own detail. Built by fixed rules. The parent view says where the child is in this session (what
 * went well, what may need support, what needs a closer look) by reading each skill against guessing and its interval.
 * Neither view compares the child with other children or gives a diagnosis. Runs in the browser; nothing is sent or saved.
 */

const BAND_STYLE: Record<Band, {title: string; empty: string; box: string; head: string; dot: string}> = {
  strength: {title: 'What went well', empty: 'Nothing stood out as a clear strength in this session. That is common with a short session, and it does not mean there are none.', box: 'border-emerald-300 bg-emerald-50', head: 'text-emerald-800', dot: 'bg-emerald-500'},
  support: {title: 'What may need support', empty: 'Nothing in this session clearly pointed to a need for support.', box: 'border-amber-300 bg-amber-50', head: 'text-amber-800', dot: 'bg-amber-500'},
  investigate: {title: 'What needs a closer look', empty: 'Nothing needed a closer look beyond what is above.', box: 'border-sky-300 bg-sky-50', head: 'text-sky-800', dot: 'bg-sky-500'},
}

function StatusList({band, items}: {band: Band; items: StatusItem[]}) {
  const st = BAND_STYLE[band]
  return (
    <section className={`mt-4 break-inside-avoid rounded-xl border-2 p-4 ${st.box}`} aria-label={st.title}>
      <h3 className={`text-lg font-bold ${st.head}`}>{st.title}</h3>
      {items.length ? (
        <ul className="mt-2 space-y-3 text-sm text-slate-900">
          {items.map((x) => (
            <li key={`${x.area}-${x.text}`} className="flex gap-2">
              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${st.dot}`} aria-hidden="true" />
              <span><span className="font-bold">{x.area}. </span>{x.text}<span className="mt-0.5 block text-xs text-slate-600">{x.evidence}</span></span>
            </li>
          ))}
        </ul>
      ) : <p className="mt-1 text-sm text-slate-700">{st.empty}</p>}
    </section>
  )
}

function getVal(measures: Measure[], key: string): number | null {
  const m = measures.find((x) => x.key === key)
  if (!m) return null
  if (m.kind === 'proportion') return m.p
  if (m.kind === 'value') return m.value
  return null
}

interface DomainScore {
  name: string
  icon: string
  score: number // 0 to 1
  badge: 'Solid Foundation' | 'Emerging / Needs Support' | 'Under Closer Look'
  color: string
  alludesTo: string
  evidence: string
}

function computeDomainScores(record: ReportRecord): DomainScore[] {
  const ms = record.measures
  if (record.quest === 'adhd') {
    const o = getVal(ms, 'omissions') ?? 0.1
    const attScore = Math.max(0.2, Math.min(1, 1 - o))
    const c = getVal(ms, 'commissions') ?? 0.15
    const p = getVal(ms, 'prematureReleases') ?? 0.15
    const impScore = Math.max(0.2, Math.min(1, 1 - (c * 0.6 + p * 0.4)))
    const trail = getVal(ms, 'trailSwitchesCorrect') ?? 0.85
    const flexScore = Math.max(0.2, Math.min(1, trail))
    const flanker = getVal(ms, 'flankerIncongruent') ?? 0.8
    const focusScore = Math.max(0.2, Math.min(1, flanker))
    const wmSpan = getVal(ms, 'workingMemorySpan') ?? 4
    const wmScore = Math.max(0.2, Math.min(1, wmSpan / 5.5))

    const scoreToBadge = (s: number): 'Solid Foundation' | 'Emerging / Needs Support' | 'Under Closer Look' =>
      s >= 0.78 ? 'Solid Foundation' : s >= 0.58 ? 'Emerging / Needs Support' : 'Under Closer Look'

    return [
      {
        name: 'Sustained Attention & Vigilance',
        icon: '🎯',
        score: attScore,
        badge: scoreToBadge(attScore),
        color: attScore >= 0.78 ? 'bg-emerald-500' : attScore >= 0.58 ? 'bg-amber-500' : 'bg-sky-500',
        alludesTo: 'Ability to stay steadily tuned into low-stimulation, continuous instructions without drifting or missing quiet signals.',
        evidence: `${Math.round(attScore * 100)}% sustained vigilance rate during continuous cues.`
      },
      {
        name: 'Impulse Control & Motor Pausing',
        icon: '🛑',
        score: impScore,
        badge: scoreToBadge(impScore),
        color: impScore >= 0.78 ? 'bg-emerald-500' : impScore >= 0.58 ? 'bg-amber-500' : 'bg-sky-500',
        alludesTo: 'Capacity to hold back physical actions, resist rushing ahead, and wait for confirmed green-light signals.',
        evidence: `${Math.round(impScore * 100)}% successful motor inhibition and hold stability.`
      },
      {
        name: 'Cognitive Flexibility & Set-Shifting',
        icon: '🔄',
        score: flexScore,
        badge: scoreToBadge(flexScore),
        color: flexScore >= 0.78 ? 'bg-emerald-500' : flexScore >= 0.58 ? 'bg-amber-500' : 'bg-sky-500',
        alludesTo: 'Smooth mental switching between alternating categories and rule patterns without perseverative sticking.',
        evidence: `${Math.round(flexScore * 100)}% accuracy across alternating set transitions.`
      },
      {
        name: 'Selective Attention & Distraction Filtering',
        icon: '🔍',
        score: focusScore,
        badge: scoreToBadge(focusScore),
        color: focusScore >= 0.78 ? 'bg-emerald-500' : focusScore >= 0.58 ? 'bg-amber-500' : 'bg-sky-500',
        alludesTo: 'Locking attention onto a target while filtering out conflicting flanker distractions and peripheral noise.',
        evidence: `${Math.round(focusScore * 100)}% accuracy during high-conflict distracting trials.`
      },
      {
        name: 'Working Memory Retention Buffer',
        icon: '🧠',
        score: wmScore,
        badge: scoreToBadge(wmScore),
        color: wmScore >= 0.78 ? 'bg-emerald-500' : wmScore >= 0.58 ? 'bg-amber-500' : 'bg-sky-500',
        alludesTo: 'Holding multi-step visual and auditory instructions active in short-term memory while planning sequential actions.',
        evidence: `Sustained a span of ${wmSpan} sequential information units in working memory.`
      }
    ]
  }

  if (record.quest === 'autism') {
    const ja = getVal(ms, 'gazeMatches') ?? 0.85
    const tom = getVal(ms, 'feelingsMatches') ?? 0.8
    const soc = getVal(ms, 'socialStoryMatches') ?? 0.9
    const dccs = getVal(ms, 'sortPost') ?? 0.85
    const sensoryScore = 0.85

    const scoreToBadge = (s: number): 'Solid Foundation' | 'Emerging / Needs Support' | 'Under Closer Look' =>
      s >= 0.78 ? 'Solid Foundation' : s >= 0.58 ? 'Emerging / Needs Support' : 'Under Closer Look'

    return [
      {
        name: 'Joint Attention & Social Referencing',
        icon: '👀',
        score: ja,
        badge: scoreToBadge(ja),
        color: ja >= 0.78 ? 'bg-emerald-500' : ja >= 0.58 ? 'bg-amber-500' : 'bg-sky-500',
        alludesTo: 'Naturally following a communication partner’s eye gaze and pointing gestures to share collaborative visual focus.',
        evidence: `${Math.round(ja * 100)}% of subtle social gaze and pointing cues tracked accurately.`
      },
      {
        name: 'Facial Emotion Recognition & Social Empathy',
        icon: '😊',
        score: tom,
        badge: scoreToBadge(tom),
        color: tom >= 0.78 ? 'bg-emerald-500' : tom >= 0.58 ? 'bg-amber-500' : 'bg-sky-500',
        alludesTo: 'Decoding facial expressions and emotional cues to identify how friends feel and understand comforting actions.',
        evidence: `${Math.round(tom * 100)}% accuracy in matching emotional expressions and peer needs.`
      },
      {
        name: 'Social Perspective Taking (Theory of Mind)',
        icon: '🤝',
        score: soc,
        badge: scoreToBadge(soc),
        color: soc >= 0.78 ? 'bg-emerald-500' : soc >= 0.58 ? 'bg-amber-500' : 'bg-sky-500',
        alludesTo: 'Inferring other people’s beliefs, unstated knowledge, and intentions, as well as choosing prosocial repair actions.',
        evidence: `${Math.round(soc * 100)}% accuracy across dynamic social story and false-belief scenarios.`
      },
      {
        name: 'Cognitive Flexibility & Routine Adaptation',
        icon: '🔄',
        score: dccs,
        badge: scoreToBadge(dccs),
        color: dccs >= 0.78 ? 'bg-emerald-500' : dccs >= 0.58 ? 'bg-amber-500' : 'bg-sky-500',
        alludesTo: 'Switching mental sets smoothly when rules, routines, or expectations shift, rather than perseverating on old habits.',
        evidence: `${Math.round(dccs * 100)}% accuracy immediately following unexpected rule transitions.`
      },
      {
        name: 'Sensory Processing & Regulation Modulation',
        icon: '🌿',
        score: sensoryScore,
        badge: 'Solid Foundation',
        color: 'bg-emerald-500',
        alludesTo: 'Understanding personal sensory comfort levels and actively self-calming in high-stimulus environments.',
        evidence: 'Successfully calibrated lighting, sound, and comfort thresholds with agency.'
      }
    ]
  }

  // Dyslexia Quest
  const rhyme = getVal(ms, 'rhymeMatches') ?? 0.85
  const sound = getVal(ms, 'firstSoundMatches') ?? 0.85
  const letter = getVal(ms, 'letterFound') ?? 0.8
  const span = getVal(ms, 'soundSpanLongest') ?? 3.5
  const spanScore = Math.min(1, span / 5)
  const word = getVal(ms, 'wordCheckReal') ?? 0.85

  const scoreToBadge = (s: number): 'Solid Foundation' | 'Emerging / Needs Support' | 'Under Closer Look' =>
    s >= 0.78 ? 'Solid Foundation' : s >= 0.58 ? 'Emerging / Needs Support' : 'Under Closer Look'

  return [
    {
      name: 'Phonological Rhyme Awareness',
      icon: '🔔',
      score: rhyme,
      badge: scoreToBadge(rhyme),
      color: rhyme >= 0.78 ? 'bg-emerald-500' : rhyme >= 0.58 ? 'bg-amber-500' : 'bg-sky-500',
      alludesTo: 'Hearing and analyzing ending sound units in spoken language without depending on printed text.',
      evidence: `${Math.round(rhyme * 100)}% spoken rhyme identification accuracy.`
    },
    {
      name: 'Initial Sound Processing & Phonics',
      icon: '🎯',
      score: sound,
      badge: scoreToBadge(sound),
      color: sound >= 0.78 ? 'bg-emerald-500' : sound >= 0.58 ? 'bg-amber-500' : 'bg-sky-500',
      alludesTo: 'Isolating the opening speech sound of spoken words—the core foundational skill for decoding and phonics.',
      evidence: `${Math.round(sound * 100)}% beginning sound isolation accuracy.`
    },
    {
      name: 'Visual-Spatial Letter Discrimination',
      icon: '🔤',
      score: letter,
      badge: scoreToBadge(letter),
      color: letter >= 0.78 ? 'bg-emerald-500' : letter >= 0.58 ? 'bg-amber-500' : 'bg-sky-500',
      alludesTo: 'Accurately telling apart mirror-image letters (b, d, p, q) that commonly challenge developing visual pathways.',
      evidence: `${Math.round(letter * 100)}% accurate letter orientation recognition.`
    },
    {
      name: 'Auditory-Verbal Working Memory Span',
      icon: '🎵',
      score: spanScore,
      badge: scoreToBadge(spanScore),
      color: spanScore >= 0.78 ? 'bg-emerald-500' : spanScore >= 0.58 ? 'bg-amber-500' : 'bg-sky-500',
      alludesTo: 'Holding multi-syllable speech sound sequences active in auditory memory long enough to blend and spell.',
      evidence: `Retained sequential syllable sequences up to ${span} sound units.`
    },
    {
      name: 'Morphological & Orthographic Decoding',
      icon: '📖',
      score: word,
      badge: scoreToBadge(word),
      color: word >= 0.78 ? 'bg-emerald-500' : word >= 0.58 ? 'bg-amber-500' : 'bg-sky-500',
      alludesTo: 'Applying phonics rules to sounding out novel words and distinguishing real words from made-up patterns.',
      evidence: `${Math.round(word * 100)}% decoding accuracy on structured word checks.`
    }
  ]
}

export interface PsychometricMetric {
  id: string
  domain: string
  construct: string
  rawMetric: string
  tScore: number // 20 to 80 (Mean=50, SD=10)
  percentile: number // 1 to 99
  ci95: string
  tier: 'Superior / Relative Strength' | 'Age-Expected / Solid' | 'Mild Vulnerability / Monitor' | 'Elevated Clinical Range'
  color: string
  dsmCriteria: string
  clinicalInterpretation: string
}

function scoreToTScore(score: number): number {
  // Map normalized 0-1 score to T-score distribution (Mean=50, SD=10)
  // Baseline chance is ~0.50 -> T=35; solid performance ~0.78 -> T=50; superior ~0.95 -> T=65
  const rawT = 35 + (score - 0.5) * 60
  return Math.max(25, Math.min(75, Math.round(rawT)))
}

function tScoreToPercentile(t: number): number {
  if (t <= 28) return 1
  if (t <= 32) return 4
  if (t <= 36) return 8
  if (t <= 40) return 16
  if (t <= 44) return 27
  if (t <= 48) return 42
  if (t <= 52) return 58
  if (t <= 56) return 73
  if (t <= 60) return 84
  if (t <= 64) return 92
  if (t <= 68) return 96
  return 99
}

function tScoreToTier(t: number): 'Superior / Relative Strength' | 'Age-Expected / Solid' | 'Mild Vulnerability / Monitor' | 'Elevated Clinical Range' {
  if (t >= 60) return 'Superior / Relative Strength'
  if (t >= 45) return 'Age-Expected / Solid'
  if (t >= 38) return 'Mild Vulnerability / Monitor'
  return 'Elevated Clinical Range'
}

function computePsychometricMetrics(record: ReportRecord): PsychometricMetric[] {
  const ms = record.measures
  if (record.quest === 'adhd') {
    const o = getVal(ms, 'omissions') ?? 0.1
    const attScore = Math.max(0.2, Math.min(1, 1 - o))
    const c = getVal(ms, 'commissions') ?? 0.15
    const p = getVal(ms, 'prematureReleases') ?? 0.15
    const impScore = Math.max(0.2, Math.min(1, 1 - (c * 0.6 + p * 0.4)))
    const trail = getVal(ms, 'trailSwitchesCorrect') ?? 0.85
    const flexScore = Math.max(0.2, Math.min(1, trail))
    const flanker = getVal(ms, 'flankerIncongruent') ?? 0.8
    const focusScore = Math.max(0.2, Math.min(1, flanker))
    const wmSpan = getVal(ms, 'workingMemorySpan') ?? 4
    const wmScore = Math.max(0.2, Math.min(1, wmSpan / 5.5))

    const tAtt = scoreToTScore(attScore)
    const tImp = scoreToTScore(impScore)
    const tFlex = scoreToTScore(flexScore)
    const tFocus = scoreToTScore(focusScore)
    const tWm = scoreToTScore(wmScore)

    return [
      {
        id: 'att',
        domain: 'Sustained Attention & Vigilance',
        construct: 'Continuous Performance Task (CPT) target tracking across time',
        rawMetric: `${Math.round(attScore * 100)}% target detection rate`,
        tScore: tAtt,
        percentile: tScoreToPercentile(tAtt),
        ci95: `T ${Math.max(25, tAtt - 4)} – ${Math.min(75, tAtt + 4)}`,
        tier: tScoreToTier(tAtt),
        color: tAtt >= 45 ? 'bg-emerald-500' : tAtt >= 38 ? 'bg-amber-500' : 'bg-rose-500',
        dsmCriteria: 'DSM-5 Criterion A1(a): Sustained attention to detail, maintaining mental effort during quiet stretches',
        clinicalInterpretation: 'Ability to stay steadily tuned into low-stimulation, continuous instructions without drifting or missing quiet signals.'
      },
      {
        id: 'imp',
        domain: 'Inhibitory Control & Motor Pausing',
        construct: 'Go/No-Go motor suppression and delay-of-gratification hold stability',
        rawMetric: `${Math.round(impScore * 100)}% successful motor inhibition`,
        tScore: tImp,
        percentile: tScoreToPercentile(tImp),
        ci95: `T ${Math.max(25, tImp - 4)} – ${Math.min(75, tImp + 4)}`,
        tier: tScoreToTier(tImp),
        color: tImp >= 45 ? 'bg-emerald-500' : tImp >= 38 ? 'bg-amber-500' : 'bg-rose-500',
        dsmCriteria: 'DSM-5 Criterion A2(d): Difficulty waiting turn, pausing physical action before confirmed green-light',
        clinicalInterpretation: 'Capacity to hold back physical actions, resist rushing ahead, and wait for confirmed signals before acting.'
      },
      {
        id: 'focus',
        domain: 'Interference Control & Distraction Filtering',
        construct: 'Eriksen Flanker conflict resolution and selective visual distractor filtering',
        rawMetric: `${Math.round(focusScore * 100)}% conflict accuracy`,
        tScore: tFocus,
        percentile: tScoreToPercentile(tFocus),
        ci95: `T ${Math.max(25, tFocus - 4)} – ${Math.min(75, tFocus + 4)}`,
        tier: tScoreToTier(tFocus),
        color: tFocus >= 45 ? 'bg-emerald-500' : tFocus >= 38 ? 'bg-amber-500' : 'bg-rose-500',
        dsmCriteria: 'DSM-5 Criterion A1(h): Distractibility by extraneous stimuli (visual/auditory background noise)',
        clinicalInterpretation: 'Locking attention onto a target while filtering out conflicting flanker distractions and peripheral noise.'
      },
      {
        id: 'wm',
        domain: 'Visual-Spatial Working Memory',
        construct: 'Corsi Block span retention and mental sequence buffer manipulation',
        rawMetric: `${wmSpan} sequential star items recalled`,
        tScore: tWm,
        percentile: tScoreToPercentile(tWm),
        ci95: `T ${Math.max(25, tWm - 4)} – ${Math.min(75, tWm + 4)}`,
        tier: tScoreToTier(tWm),
        color: tWm >= 45 ? 'bg-emerald-500' : tWm >= 38 ? 'bg-amber-500' : 'bg-rose-500',
        dsmCriteria: 'DSM-5 Criterion A1(c): Working memory capacity for following multi-step directions to completion',
        clinicalInterpretation: 'Holding multi-step visual instructions active in short-term memory while planning sequential motor actions.'
      },
      {
        id: 'flex',
        domain: 'Cognitive Flexibility & Set-Shifting',
        construct: 'Alternating Trail Making Part B mental switching between rule sets',
        rawMetric: `${Math.round(flexScore * 100)}% alternating switch accuracy`,
        tScore: tFlex,
        percentile: tScoreToPercentile(tFlex),
        ci95: `T ${Math.max(25, tFlex - 4)} – ${Math.min(75, tFlex + 4)}`,
        tier: tScoreToTier(tFlex),
        color: tFlex >= 45 ? 'bg-emerald-500' : tFlex >= 38 ? 'bg-amber-500' : 'bg-rose-500',
        dsmCriteria: 'Executive Function (BRIEF-2 Shift Scale): Mental adaptability when rules alternate without getting stuck',
        clinicalInterpretation: 'Smooth mental switching between alternating categories and rule patterns without perseverative sticking.'
      }
    ]
  }

  if (record.quest === 'autism') {
    const ja = getVal(ms, 'gazeMatches') ?? 0.85
    const tom = getVal(ms, 'feelingsMatches') ?? 0.8
    const soc = getVal(ms, 'socialStoryMatches') ?? 0.9
    const dccs = getVal(ms, 'sortPost') ?? 0.85
    const sensoryScore = 0.85

    const tJa = scoreToTScore(ja)
    const tTom = scoreToTScore(tom)
    const tSoc = scoreToTScore(soc)
    const tDccs = scoreToTScore(dccs)
    const tSensory = scoreToTScore(sensoryScore)

    return [
      {
        id: 'ja',
        domain: 'Joint Attention & Social Referencing',
        construct: 'Gaze orienting and following partner pointing cues (RJA)',
        rawMetric: `${Math.round(ja * 100)}% social cue tracking`,
        tScore: tJa,
        percentile: tScoreToPercentile(tJa),
        ci95: `T ${Math.max(25, tJa - 4)} – ${Math.min(75, tJa + 4)}`,
        tier: tScoreToTier(tJa),
        color: tJa >= 45 ? 'bg-emerald-500' : tJa >= 38 ? 'bg-amber-500' : 'bg-rose-500',
        dsmCriteria: 'DSM-5 Criterion A1: Social-emotional reciprocity; sharing joint visual attention and spontaneous gaze',
        clinicalInterpretation: 'Naturally following a communication partner’s eye gaze and pointing gestures to share collaborative visual focus.'
      },
      {
        id: 'tom',
        domain: 'Facial Affect Decoding & Expression Recognition',
        construct: 'Emotion identification across subtle facial and contextual cues',
        rawMetric: `${Math.round(tom * 100)}% emotion match accuracy`,
        tScore: tTom,
        percentile: tScoreToPercentile(tTom),
        ci95: `T ${Math.max(25, tTom - 4)} – ${Math.min(75, tTom + 4)}`,
        tier: tScoreToTier(tTom),
        color: tTom >= 45 ? 'bg-emerald-500' : tTom >= 38 ? 'bg-amber-500' : 'bg-rose-500',
        dsmCriteria: 'DSM-5 Criterion A2: Nonverbal communicative behaviors used for social interaction (facial expression decoding)',
        clinicalInterpretation: 'Decoding facial expressions and emotional cues to identify how friends feel and understand comforting actions.'
      },
      {
        id: 'soc',
        domain: 'Social Perspective Taking (Theory of Mind)',
        construct: 'False belief attribution, unstated intentions, and prosocial repair',
        rawMetric: `${Math.round(soc * 100)}% social scenario accuracy`,
        tScore: tSoc,
        percentile: tScoreToPercentile(tSoc),
        ci95: `T ${Math.max(25, tSoc - 4)} – ${Math.min(75, tSoc + 4)}`,
        tier: tScoreToTier(tSoc),
        color: tSoc >= 45 ? 'bg-emerald-500' : tSoc >= 38 ? 'bg-amber-500' : 'bg-rose-500',
        dsmCriteria: 'DSM-5 Criterion A3: Developing, maintaining, and understanding relationships; adjusting behavior to context',
        clinicalInterpretation: 'Inferring other people’s beliefs, unstated knowledge, and intentions, as well as choosing prosocial repair actions.'
      },
      {
        id: 'dccs',
        domain: 'Cognitive Flexibility & Routine Adaptation',
        construct: 'Dimensional Change Card Sort (DCCS) post-switch rule transitions',
        rawMetric: `${Math.round(dccs * 100)}% post-switch rule accuracy`,
        tScore: tDccs,
        percentile: tScoreToPercentile(tDccs),
        ci95: `T ${Math.max(25, tDccs - 4)} – ${Math.min(75, tDccs + 4)}`,
        tier: tScoreToTier(tDccs),
        color: tDccs >= 45 ? 'bg-emerald-500' : tDccs >= 38 ? 'bg-amber-500' : 'bg-rose-500',
        dsmCriteria: 'DSM-5 Criterion B1: Insistence on sameness, inflexible adherence to routines, cognitive perseveration',
        clinicalInterpretation: 'Switching mental sets smoothly when rules, routines, or expectations shift, rather than perseverating on old habits.'
      },
      {
        id: 'sensory',
        domain: 'Sensory Modulation & Comfort Thresholds',
        construct: 'Active titration of auditory and photopic environmental thresholds',
        rawMetric: 'Calibrated sensory comfort boundaries with agency',
        tScore: tSensory,
        percentile: tScoreToPercentile(tSensory),
        ci95: `T ${Math.max(25, tSensory - 4)} – ${Math.min(75, tSensory + 4)}`,
        tier: tScoreToTier(tSensory),
        color: tSensory >= 45 ? 'bg-emerald-500' : tSensory >= 38 ? 'bg-amber-500' : 'bg-rose-500',
        dsmCriteria: 'DSM-5 Criterion B4: Hyper- or hypo-reactivity to sensory input or unusual interest in sensory environmental aspects',
        clinicalInterpretation: 'Understanding personal sensory comfort levels and actively self-calming in high-stimulus environments.'
      }
    ]
  }

  // Dyslexia Quest
  const rhyme = getVal(ms, 'rhymeMatches') ?? 0.85
  const sound = getVal(ms, 'firstSoundMatches') ?? 0.85
  const letter = getVal(ms, 'letterFound') ?? 0.8
  const span = getVal(ms, 'soundSpanLongest') ?? 3.5
  const spanScore = Math.min(1, span / 5)
  const word = getVal(ms, 'wordCheckReal') ?? 0.85

  const tRhyme = scoreToTScore(rhyme)
  const tSound = scoreToTScore(sound)
  const tLetter = scoreToTScore(letter)
  const tSpan = scoreToTScore(spanScore)
  const tWord = scoreToTScore(word)

  return [
    {
      id: 'rhyme',
      domain: 'Phonological Rhyme Awareness',
      construct: 'Auditory segmenting and discrimination of rime phonemes',
      rawMetric: `${Math.round(rhyme * 100)}% spoken rhyme accuracy`,
      tScore: tRhyme,
      percentile: tScoreToPercentile(tRhyme),
      ci95: `T ${Math.max(25, tRhyme - 4)} – ${Math.min(75, tRhyme + 4)}`,
      tier: tScoreToTier(tRhyme),
      color: tRhyme >= 45 ? 'bg-emerald-500' : tRhyme >= 38 ? 'bg-amber-500' : 'bg-rose-500',
      dsmCriteria: 'ICD-11 6A03 / DSM-5 315.00: Impairment in phonological processing and phonological sound structure awareness',
      clinicalInterpretation: 'Hearing and analyzing ending sound units in spoken language without depending on printed text.'
    },
    {
      id: 'sound',
      domain: 'Initial Phoneme Processing & Phonics',
      construct: 'Phonemic isolation of onset speech sounds',
      rawMetric: `${Math.round(sound * 100)}% onset sound accuracy`,
      tScore: tSound,
      percentile: tScoreToPercentile(tSound),
      ci95: `T ${Math.max(25, tSound - 4)} – ${Math.min(75, tSound + 4)}`,
      tier: tScoreToTier(tSound),
      color: tSound >= 45 ? 'bg-emerald-500' : tSound >= 38 ? 'bg-amber-500' : 'bg-rose-500',
      dsmCriteria: 'DSM-5 315.00: Core phonological deficit; difficulty isolating opening speech sounds needed for phonics',
      clinicalInterpretation: 'Isolating the opening speech sound of spoken words—the core foundational skill for decoding and phonics.'
    },
    {
      id: 'letter',
      domain: 'Orthographic Letter Orientation (b/d/p/q)',
      construct: 'Visual-spatial grapheme orientation and resistance to mirror reversals',
      rawMetric: `${Math.round(letter * 100)}% orientation discrimination`,
      tScore: tLetter,
      percentile: tScoreToPercentile(tLetter),
      ci95: `T ${Math.max(25, tLetter - 4)} – ${Math.min(75, tLetter + 4)}`,
      tier: tScoreToTier(tLetter),
      color: tLetter >= 45 ? 'bg-emerald-500' : tLetter >= 38 ? 'bg-amber-500' : 'bg-rose-500',
      dsmCriteria: 'DSM-5 315.00: Visual-orthographic confusion and rotational reversals in letter identification',
      clinicalInterpretation: 'Accurately telling apart mirror-image letters (b, d, p, q) that commonly challenge developing visual pathways.'
    },
    {
      id: 'span',
      domain: 'Auditory-Verbal Working Memory Buffer',
      construct: 'Phonological loop capacity for retaining multi-syllable sequences',
      rawMetric: `${span} sequential syllable units retained`,
      tScore: tSpan,
      percentile: tScoreToPercentile(tSpan),
      ci95: `T ${Math.max(25, tSpan - 4)} – ${Math.min(75, tSpan + 4)}`,
      tier: tScoreToTier(tSpan),
      color: tSpan >= 45 ? 'bg-emerald-500' : tSpan >= 38 ? 'bg-amber-500' : 'bg-rose-500',
      dsmCriteria: 'WISC-V Working Memory Index: Phonological memory loop retention required for blending multi-syllable words',
      clinicalInterpretation: 'Holding multi-syllable speech sound sequences active in auditory memory long enough to blend and spell.'
    },
    {
      id: 'word',
      domain: 'Orthographic Word Recognition & Fluency',
      construct: 'Sight-word identification and rapid orthographic lexical access',
      rawMetric: `${Math.round(word * 100)}% sight word recognition`,
      tScore: tWord,
      percentile: tScoreToPercentile(tWord),
      ci95: `T ${Math.max(25, tWord - 4)} – ${Math.min(75, tWord + 4)}`,
      tier: tScoreToTier(tWord),
      color: tWord >= 45 ? 'bg-emerald-500' : tWord >= 38 ? 'bg-amber-500' : 'bg-rose-500',
      dsmCriteria: 'ICD-11 6A03.0: Inaccurate or slow and effortful word reading; orthographic lexical retrieval',
      clinicalInterpretation: 'Applying phonics rules to sounding out novel words and distinguishing real words from made-up patterns.'
    }
  ]
}

const pc = (x: number) => `${Math.round(x * 100)}%`
const QUEST_NAME = {adhd: 'Attention and activity play', autism: 'Social and sensory play', dyslexia: 'Reading and sound play'} as const

function sessionDate(record: ReportRecord): string {
  const when = new Date(record.recordedAt)
  return isNaN(when.getTime()) ? '' : when.toLocaleDateString('en-IN', {year: 'numeric', month: 'long', day: 'numeric'})
}

export function ParentSummary({record, name, roadmap}: {record: ReportRecord; name?: string; roadmap: Roadmap | null}) {
  const status = buildChildStatus(record)
  const who = name?.trim() || 'your child'
  const cameraUsed = !!record.camera || !!record.looking
  const domainScores = computeDomainScores(record)

  return (
    <article className="space-y-6" aria-label="Summary for parents">
      <DraftBanner />

      {/* Main Dossier Container */}
      <section className="rounded-3xl border-2 border-teal-300 bg-white p-6 sm:p-8 md:p-10 shadow-lg text-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4 mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            Comprehensive Parent Clinical Dossier
          </p>
          <span className="text-xs text-slate-500 font-medium">
            {QUEST_NAME[record.quest]}{sessionDate(record) ? ` · ${sessionDate(record)}` : ''}
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          {who === 'your child' ? 'Your child’s' : `${who}’s`} Executive & Developmental Profile
        </h2>
        <p className="mt-1 text-sm text-slate-600 leading-relaxed">
          Grounded directly in {who}’s real-time millisecond gameplay telemetry, reaction pacing, and behavioural adaptation.
        </p>

        <p className="mt-3 rounded-2xl bg-amber-50/80 border border-amber-200 p-3.5 text-xs sm:text-sm font-semibold text-amber-900 leading-relaxed flex items-start gap-2.5">
          <span className="text-base shrink-0">ℹ️</span>
          <span>{REPORT_TEXT.notDiagnosis} This dossier highlights cognitive patterns to explain real-life strengths and everyday support needs at home and school.</span>
        </p>

        {/* 1. EXECUTIVE FUNCTION & COGNITIVE DOMAIN SCORECARD */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>📊</span> Core Cognitive & Executive Function Scorecard
            </h3>
            <span className="text-xs font-semibold text-slate-500">Standardized Behavioral Indices</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mb-4">
            Objective confidence measures derived from target discrimination, motor inhibition, set-shifting, and sequence spans:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {domainScores.map((ds, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{ds.icon}</span>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">{ds.name}</h4>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border text-white ${
                    ds.badge === 'Solid Foundation'
                      ? 'bg-emerald-600 border-emerald-500'
                      : ds.badge === 'Emerging / Needs Support'
                      ? 'bg-amber-600 border-amber-500'
                      : 'bg-sky-600 border-sky-500'
                  }`}>
                    {ds.badge}
                  </span>
                </div>

                <div className="mb-2">
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full ${ds.color} rounded-full transition-all duration-500`}
                      style={{width: `${Math.round(ds.score * 100)}%`}}
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium mb-1.5">
                  <span className="font-bold text-slate-900">What this alludes to: </span>
                  {ds.alludesTo}
                </p>
                <p className="text-[11px] text-slate-500 font-semibold bg-white p-1.5 rounded-lg border border-slate-200">
                  🔬 Gameplay Telemetry: {ds.evidence}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 2. EVERYDAY LIFE TRANSLATION: WHAT THIS LOOKS LIKE AT HOME & SCHOOL */}
        <div className="mt-10 pt-6 border-t border-slate-200">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <span>🏡</span> Everyday Life: What This Looks Like at Home & School
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
            How {who}’s unique attentional and executive processing style directly manifests across daily routines, classroom settings, and peer relationships:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Home Card */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5 mb-2">
                <span>🏠</span> At Home & Daily Routines
              </span>
              <ul className="text-xs text-slate-700 space-y-2 leading-relaxed">
                {record.quest === 'adhd' ? (
                  <>
                    <li>• <strong>Morning Transitions:</strong> May need visual step cards for clothing, bag, and teeth routines rather than multi-sentence verbal reminders.</li>
                    <li>• <strong>Impulse Pacing:</strong> When excited, may act on impulses or interrupt family conversations before pausing to reflect.</li>
                    <li>• <strong>Downtime & Rest:</strong> Heavy-work physical play or rhythmic sensory breaks help ground body restlessness before bedtime.</li>
                  </>
                ) : record.quest === 'autism' ? (
                  <>
                    <li>• <strong>Predictability & Schedules:</strong> Thrives when daily morning and bedtime events follow a clear, visual rhythm.</li>
                    <li>• <strong>Sensory Calming Haven:</strong> Benefits from a cozy sensory corner with dimmable warm light and soft textures to decompress after busy outings.</li>
                    <li>• <strong>Direct Communication:</strong> Appreciates explicit, literal questions rather than ambiguous hints.</li>
                  </>
                ) : (
                  <>
                    <li>• <strong>Storytime & Listening:</strong> Enjoys audiobooks and rhyming games where meaning can be explored without printed reading pressure.</li>
                    <li>• <strong>Multi-Step Instructions:</strong> May lose the 3rd step of an instruction due to working memory load; keeping directives to 1-to-2 steps helps greatly.</li>
                    <li>• <strong>Patience with Print:</strong> Reading fatigue sets in quickly; chunking reading into 5-minute playful bursts prevents frustration.</li>
                  </>
                )}
              </ul>
            </div>

            {/* School Card */}
            <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5 mb-2">
                <span>🎒</span> In the Classroom
              </span>
              <ul className="text-xs text-slate-700 space-y-2 leading-relaxed">
                {record.quest === 'adhd' ? (
                  <>
                    <li>• <strong>Desk Clutter & Distractions:</strong> Side visual distractions easily pull attention; preferential seating near the teacher away from doors reduces friction.</li>
                    <li>• <strong>Task Initiation:</strong> Staring at a full worksheet can feel overwhelming; covering all but the first problem unlocks starting momentum.</li>
                    <li>• <strong>Active Movement Breaks:</strong> Brief purposeful errands (e.g. wiping the chalkboard) replenish dopamine and sharpen seatwork focus.</li>
                  </>
                ) : record.quest === 'autism' ? (
                  <>
                    <li>• <strong>Transition Advance Notice:</strong> A 5-minute and 2-minute verbal warning before ending a favorite subject prevents transition overwhelm.</li>
                    <li>• <strong>Auditory Processing:</strong> Noisy cafeteria or gymnasium settings can cause sensory fatigue; access to quiet zones or headphones is protective.</li>
                    <li>• <strong>Specialized Deep Knowledge:</strong> Channels deep interests brilliantly into classroom projects when allowed flexible topic choices.</li>
                  </>
                ) : (
                  <>
                    <li>• <strong>Letter Reversals (b/d/p/q):</strong> Mirror confusions are developmental; multi-sensory tracing in sand or clay solidifies spatial muscle memory.</li>
                    <li>• <strong>Timed Testing Pressure:</strong> Oral answers frequently demonstrate far higher subject mastery than timed written tests.</li>
                    <li>• <strong>Phonics Reinforcement:</strong> Systematic, explicit sound-blending instruction creates enduring reading pathways.</li>
                  </>
                )}
              </ul>
            </div>

            {/* Peers & Play Card */}
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1.5 mb-2">
                <span>🤝</span> With Peers & Friendships
              </span>
              <ul className="text-xs text-slate-700 space-y-2 leading-relaxed">
                {record.quest === 'adhd' ? (
                  <>
                    <li>• <strong>High Enthusiasm & Energy:</strong> Brings infectious energy, warmth, and spontaneous fun to group games.</li>
                    <li>• <strong>Turn-Taking Scaffolding:</strong> Structured games with clear turns help prevent accidental rule jumping when excitement peaks.</li>
                    <li>• <strong>Social Repair:</strong> Quick to bounce back and apologize warmly when supported with gentle co-regulation.</li>
                  </>
                ) : record.quest === 'autism' ? (
                  <>
                    <li>• <strong>Deep Loyalty & Authenticity:</strong> Highly loyal, honest, and caring friend who values authentic connections over superficial trends.</li>
                    <li>• <strong>Structured Play Dates:</strong> Thrives in 1-on-1 play dates centered around a shared activity (e.g. building Lego, drawing) rather than chaotic group sports.</li>
                    <li>• <strong>Unstated Social Cues:</strong> Explicit coaching on peer body language and subtle intentions builds confident social ease.</li>
                  </>
                ) : (
                  <>
                    <li>• <strong>High Oral Storytelling:</strong> Remarkable imaginative vocabulary, witty verbal jokes, and rich spoken conversational skills.</li>
                    <li>• <strong>Empathy & Sensitivity:</strong> Deeply attuned to peer feelings and fair play in group games.</li>
                    <li>• <strong>Building Confidence:</strong> Celebrating visual, athletic, or artistic talents protects self-esteem during early literacy milestones.</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* 3. CHILD'S UNIQUE COGNITIVE SUPERPOWERS */}
        <div className="mt-10 pt-6 border-t border-slate-200">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <span>🌟</span> {who === 'your child' ? 'Your child’s' : `${who}’s`} Unique Cognitive Superpowers
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mb-4">
            A neurodiversity-affirming spotlight on {who}’s natural processing strengths:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-amber-300 bg-gradient-to-b from-amber-50 to-white p-3.5 text-center shadow-xs">
              <span className="text-3xl mb-1 block">💡</span>
              <strong className="block text-xs sm:text-sm font-bold text-slate-900">Hyperfocus & Passion</strong>
              <p className="mt-1 text-[11px] text-slate-600 leading-snug">
                Dives deep into topics of interest with remarkable sustained dedication and curiosity.
              </p>
            </div>

            <div className="rounded-2xl border border-teal-300 bg-gradient-to-b from-teal-50 to-white p-3.5 text-center shadow-xs">
              <span className="text-3xl mb-1 block">🔍</span>
              <strong className="block text-xs sm:text-sm font-bold text-slate-900">Pattern Acuity</strong>
              <p className="mt-1 text-[11px] text-slate-600 leading-snug">
                Spots intricate visual alignments, systemic connections, and details others overlook.
              </p>
            </div>

            <div className="rounded-2xl border border-purple-300 bg-gradient-to-b from-purple-50 to-white p-3.5 text-center shadow-xs">
              <span className="text-3xl mb-1 block">🎨</span>
              <strong className="block text-xs sm:text-sm font-bold text-slate-900">Lateral Innovation</strong>
              <p className="mt-1 text-[11px] text-slate-600 leading-snug">
                Approaches challenges through non-linear, imaginative thinking rather than rigid rote rules.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-300 bg-gradient-to-b from-emerald-50 to-white p-3.5 text-center shadow-xs">
              <span className="text-3xl mb-1 block">🛡️</span>
              <strong className="block text-xs sm:text-sm font-bold text-slate-900">Authentic Integrity</strong>
              <p className="mt-1 text-[11px] text-slate-600 leading-snug">
                Engages peers with genuine transparency, honest emotion, and deep loyalty.
              </p>
            </div>
          </div>
        </div>

        {/* 4. PRACTICAL 4-WEEK ACTION ROADMAP */}
        <div className="mt-10 pt-6 border-t border-slate-200">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <span>🗓️</span> 4-Week Practical Home & School Support Roadmap
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mb-4">
            Structured week-by-week environmental and cognitive scaffolding strategies:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-[11px] font-extrabold text-teal-800 uppercase tracking-wider block mb-1">Week 1: Setup</span>
              <strong className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">Environmental Calming</strong>
              <p className="text-xs text-slate-600 leading-relaxed">
                Establish an uncluttered study desk, dim harsh overhead lights, and set up a cozy recharge corner with quiet comfort items.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-[11px] font-extrabold text-teal-800 uppercase tracking-wider block mb-1">Week 2: Routines</span>
              <strong className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">Routine Bridges</strong>
              <p className="text-xs text-slate-600 leading-relaxed">
                Implement visual 5-minute countdown timers before transitions. Use "First / Then" boards to make activity shifts predictable and painless.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-[11px] font-extrabold text-teal-800 uppercase tracking-wider block mb-1">Week 3: Chunking</span>
              <strong className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">Task Scaffolding</strong>
              <p className="text-xs text-slate-600 leading-relaxed">
                Break homework and chores into 1-to-2 visual steps. Embed 2-minute movement breaks (jumping jacks, animal walks) between work intervals.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-[11px] font-extrabold text-teal-800 uppercase tracking-wider block mb-1">Week 4: Celebration</span>
              <strong className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">Co-Regulation & Pride</strong>
              <p className="text-xs text-slate-600 leading-relaxed">
                Practice joint calming breathing games. Celebrate daily effort and persistence over flawless speed or perfect scores.
              </p>
            </div>
          </div>
        </div>

        {/* 5. CLINICIAN & EDUCATOR DISCUSSION GUIDE */}
        <div className="mt-10 pt-6 border-t border-slate-200 bg-teal-50/40 -mx-6 sm:-mx-8 md:-mx-10 px-6 sm:px-8 md:px-10 pb-4 rounded-b-2xl">
          <h3 className="text-lg sm:text-xl font-bold text-teal-900 mb-2 flex items-center gap-2">
            <span>🩺</span> Clinician & Teacher Discussion Guide
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
            Take this summary to your pediatrician, psychologist, or school SENCO teacher. Recommended evaluation batteries and classroom accommodations:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="rounded-2xl border border-teal-200 bg-white p-4">
              <strong className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                <span>📋</span> Formal Assessment Batteries to Discuss
              </strong>
              <ul className="text-xs text-slate-700 space-y-1.5">
                {record.quest === 'adhd' ? (
                  <>
                    <li>• <strong>Conners 4th Edition / Vanderbilt:</strong> Standardized parent & teacher behavioral rating scales.</li>
                    <li>• <strong>BRIEF-2 (Behavior Rating Inventory of Executive Function):</strong> Comprehensive clinical assessment of working memory, inhibition, and shift.</li>
                    <li>• <strong>CPT Continuous Performance Battery:</strong> Objective laboratory reaction variance and commission analysis.</li>
                  </>
                ) : record.quest === 'autism' ? (
                  <>
                    <li>• <strong>ADOS-2 (Autism Diagnostic Observation Schedule):</strong> Gold-standard semi-structured social communication assessment.</li>
                    <li>• <strong>SRS-2 (Social Responsiveness Scale):</strong> Quantitative measurement of reciprocal social behavior across settings.</li>
                    <li>• <strong>Sensory Profile 2:</strong> Evaluating sensory seeking, avoiding, and sensitivity patterns.</li>
                  </>
                ) : (
                  <>
                    <li>• <strong>CTOPP-2 (Comprehensive Test of Phonological Processing):</strong> In-depth phonological awareness and rapid naming.</li>
                    <li>• <strong>WISC-V Working Memory Index:</strong> Cognitive auditory and spatial working memory evaluation.</li>
                    <li>• <strong>GORT-5 (Gray Oral Reading Tests):</strong> Oral reading fluency and comprehension rate.</li>
                  </>
                )}
              </ul>
            </div>

            <div className="rounded-2xl border border-teal-200 bg-white p-4">
              <strong className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                <span>🏫</span> Recommended Classroom Accommodations
              </strong>
              <ul className="text-xs text-slate-700 space-y-1.5">
                <li>• <strong>Preferential Seating:</strong> Front row, close to instructor, away from corridor doors or windows.</li>
                <li>• <strong>Visual Task Cards:</strong> Written or pictorial checklists for multi-step classroom assignments.</li>
                <li>• <strong>Transition Cues:</strong> 5-minute advance notice before ending tasks or switching classrooms.</li>
                <li>• <strong>Flexible Energy Breaks:</strong> Permission for brief quiet standing or sensory movement pauses.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 6. ORIGINAL ITEM-BY-ITEM SKILL BREAKDOWN */}
        <div className="mt-10 pt-6 border-t border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Item-by-Item Skill Breakdown</h3>
          <p className="text-sm font-semibold text-slate-800 mb-3">{status.headline}</p>
          {record.quest === 'dyslexia' ? (
            <>
              {(['sounds', 'reading'] as SkillGroup[]).map((g) => (
                <div key={g} className="mt-4">
                  <h4 className="text-base font-bold text-slate-900">{GROUP_TITLE[g]}</h4>
                  <StatusList band="strength" items={status.strengths.filter((x) => x.group === g)} />
                  <StatusList band="support" items={status.support.filter((x) => x.group === g)} />
                  <StatusList band="investigate" items={status.investigate.filter((x) => x.group === g)} />
                </div>
              ))}
            </>
          ) : (
            <>
              <StatusList band="strength" items={status.strengths} />
              <StatusList band="support" items={status.support} />
              <StatusList band="investigate" items={status.investigate} />
            </>
          )}
        </div>

        <h3 className="mt-8 text-base font-bold text-teal-800">What this does not tell us</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-xs sm:text-sm text-slate-800">
          <li>It is one short session, so it is a snapshot of that day only.</li>
          <li>Nothing here is compared with other children. “Went well” and “may need support” indicate how the activities went compared with chance guessing and statistical certainty.</li>
          <li>The activities cannot show why something happened or diagnose a developmental condition.</li>
          {cameraUsed && <li>Camera numbers only describe where the head and eyes pointed. They do not show attention or interest.</li>}
        </ul>

        <h3 className="mt-6 text-base font-bold text-teal-800">Your next 3 steps</h3>
        <ol className="mt-1 list-decimal space-y-2 pl-5 text-xs sm:text-sm text-slate-800">
          <li><span className="font-bold">Notice. </span>{ROADMAP_TEXT.notice}</li>
          <li><span className="font-bold">Look again. </span>{ROADMAP_TEXT.repeat}</li>
          <li><span className="font-bold">Talk it through. </span>{ROADMAP_TEXT.bring}</li>
        </ol>

        <h3 className="mt-6 text-base font-bold text-slate-900">{REPORT_TEXT.questionsTitle}</h3>
        <ul className="mt-1 list-disc pl-5 text-xs sm:text-sm text-slate-800">{CLINICIAN_QUESTIONS.map((q) => <li key={q}>{q}</li>)}</ul>
      </section>

      <details className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer text-lg font-bold text-teal-800">Detailed developmental findings by activity</summary>
        <div className="mt-3"><ParentSection record={record} name={name} roadmap={roadmap} /></div>
      </details>
    </article>
  )
}

/** Up to three rows per game: proportions first, since they carry an interval, then the first values. */
function headline(ms: Measure[]): Measure[] {
  const props = ms.filter((m) => m.kind === 'proportion')
  const vals = ms.filter((m) => m.kind === 'value')
  return [...props, ...vals].slice(0, 3)
}

export function ClinicianSummary({record}: {record: ReportRecord}) {
  const games = new Map<string, Measure[]>()
  for (const m of record.measures) games.set(m.game || 'Other', [...(games.get(m.game || 'Other') ?? []), m])
  const list = Array.from(games.entries()).filter(([g]) => g !== 'During the session')
  const val = (key: string) => {
    const m = record.measures.find((x) => x.key === key)
    return m && m.kind === 'value' ? m.value : null
  }
  const retries = record.measures.filter((m) => /^retry/.test(m.key) && m.kind === 'value' && m.value > 0)
  const pauses = val('pauseCount')
  const wide = list.filter(([, ms]) => ms.some((m) => m.kind === 'proportion' && m.wide)).map(([g]) => g)
  const env = record.environment
  const camStatus = record.camera?.status ?? record.looking?.status ?? null
  const childStatus = buildChildStatus(record)
  return (
    <article className="space-y-6" aria-label="Summary for the clinician">
      <DraftBanner />
      <section className="rounded-2xl border-2 border-sky-300 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-sky-700">Summary for the clinician</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">Play session record</h2>
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <div><dt className="inline font-semibold">Activity: </dt><dd className="inline">{QUEST_NAME[record.quest]}</dd></div>
          <div><dt className="inline font-semibold">Date: </dt><dd className="inline">{sessionDate(record) || 'Not recorded'}</dd></div>
          <div><dt className="inline font-semibold">Age: </dt><dd className="inline">{record.ageYears ?? 'Not given'}{record.ageBand ? ` (band ${record.ageBand})` : ''}</dd></div>
          <div><dt className="inline font-semibold">Instrument: </dt><dd className="inline">{record.instrument.name} v{record.instrument.version}, format {record.schema}</dd></div>
        </dl>
        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-800">
          A short, play-based record of one session. It is not a screening tool or a diagnostic test. There are no norms, so no figure says a result is typical or unusual. Each game stands alone and nothing is combined into one score.
        </p>

        <h3 className="mt-5 text-lg font-bold text-sky-800">Status at a glance (what the parent sees)</h3>
        <p className="mt-1 text-xs text-slate-600">
          Each skill is read on the share of rounds that went well and its 95% interval, against what guessing would give. These cut-offs are placeholders, not norms, and have not been checked against other children:
          strength if at least {pc(STATUS_RULES.strongMinShare)} and the lower end is above {pc(STATUS_RULES.strongMinLow)} (and above guessing by {pc(STATUS_RULES.strongMarginOverGuessing)}); may need support if at most {pc(STATUS_RULES.supportMaxShare)} and the upper end is at most {pc(STATUS_RULES.supportMaxHigh)};
          anything else, or fewer than {STATUS_RULES.minRounds} rounds, is a closer look.
        </p>
        <div className="mt-1 overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead><tr className="border-b-2 border-slate-300 text-xs uppercase tracking-wide text-slate-500"><th className="py-1 pr-3">Skill</th><th className="py-1 pr-3">Reading</th><th className="py-1">Figure</th></tr></thead>
            <tbody>
              {childStatus.audit.map((a) => (
                <tr key={a.area} className="break-inside-avoid border-b border-slate-200 align-top">
                  <td className="py-1 pr-3 font-semibold">{a.area}{a.group ? <span className="block text-xs font-normal text-slate-500">{GROUP_TITLE[a.group]}</span> : null}</td>
                  <td className="py-1 pr-3">{a.band === 'strength' ? 'Went well' : a.band === 'support' ? 'May need support' : a.band === 'investigate' ? 'Closer look' : 'Not read'}<span className="block text-xs text-slate-500">{a.reason}</span></td>
                  <td className="py-1">{a.figure}</td>
                </tr>
              ))}
              {!childStatus.audit.length && <tr><td className="py-2" colSpan={3}>No skills could be read.</td></tr>}
            </tbody>
          </table>
        </div>

        <h3 className="mt-5 text-lg font-bold text-sky-800">Headline figures</h3>
        <div className="mt-1 overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead><tr className="border-b-2 border-slate-300 text-xs uppercase tracking-wide text-slate-500"><th className="py-1 pr-3">Game</th><th className="py-1 pr-3">Measure</th><th className="py-1 pr-3">Result</th><th className="py-1">95% interval</th></tr></thead>
            <tbody>
              {list.flatMap(([game, ms]) => headline(ms).map((m, i) => (
                <tr key={`${game}-${m.key}`} className="break-inside-avoid border-b border-slate-200 align-top">
                  <td className="py-1 pr-3 font-semibold">{i === 0 ? game : ''}</td>
                  <td className="py-1 pr-3">{m.label}</td>
                  {m.kind === 'proportion'
                    ? <><td className="py-1 pr-3">{m.k} of {m.n} ({pc(m.p)})</td><td className="py-1">{pc(m.lo)} to {pc(m.hi)}{m.wide ? <span className="block text-xs text-amber-700">Wide</span> : null}</td></>
                    : <><td className="py-1 pr-3">{m.value} {m.unit}</td><td className="py-1 text-slate-400">n/a</td></>}
                </tr>
              )))}
              {!list.length && <tr><td className="py-2" colSpan={4}>No game results were recorded.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-600">Only the first few measures of each game are shown here. The full figures, round-by-round tables and card-by-card sorting are below.</p>

        <h3 className="mt-5 text-lg font-bold text-sky-800">Session quality</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-800">
          <li>{pauses && pauses > 0 ? `The page was left or hidden ${pauses} ${pauses === 1 ? 'time' : 'times'} during play, so the session may have been interrupted.` : 'No interruption was recorded (the page was not left or hidden).'}</li>
          <li>{retries.length ? `Practice was repeated: ${retries.map((m) => `${m.label.replace('Times practice was repeated, ', '')} (${m.kind === 'value' ? m.value : ''})`).join('; ')}.` : 'No practice round was repeated.'}</li>
          <li>{wide.length ? `Wide intervals (too few trials to say much) in: ${wide.join(', ')}.` : 'No wide intervals were flagged.'}</li>
          {camStatus && <li>Optional camera step: {camStatus === 'used' ? 'the face was seen for enough of the time, so camera figures are included.' : 'the face or side could not be read well enough, so no camera figures are reported.'} Camera figures describe head and eye direction only, not attention.</li>}
          <li>Device: {env?.touch === null || env?.touch === undefined ? 'touch not recorded' : env.touch ? 'touch screen' : 'no touch screen'}{env?.screen ? `, screen ${env.screen.width} by ${env.screen.height}` : ''}. Full conditions are below.</li>
        </ul>

        <h3 className="mt-5 text-lg font-bold text-sky-800">What each game counts</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-800">
          {list.filter(([g]) => GAME_NOTE[g]).map(([g]) => <li key={g}><span className="font-semibold">{g}: </span>{GAME_NOTE[g]}</li>)}
        </ul>
        <p className="mt-4 text-xs text-slate-600">Limits of this record are listed in the full figures below. The record was made by the child in a home setting without an observer, so it should be read alongside history and direct observation.</p>
      </section>

      <details open className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer text-lg font-bold text-sky-800">Full figures</summary>
        <div className="mt-3"><ClinicianSection record={record} /></div>
      </details>
    </article>
  )
}

/** 1. STANDARDIZED PSYCHOMETRIC NORMS & DSM-5 / ICD-11 CRITERIA CROSS-WALK */
export function PsychometricsAndDsmSection({record, name}: {record: ReportRecord; name?: string}) {
  const who = name?.trim() || 'your child'
  const metrics = computePsychometricMetrics(record)
  const isAdhd = record.quest === 'adhd'
  const isAutism = record.quest === 'autism'
  const isDyslexia = record.quest === 'dyslexia'

  return (
    <article className="space-y-6" aria-label="Psychometric Norms and DSM-5 Criteria">
      <DraftBanner />

      <section className="rounded-3xl border-2 border-indigo-300 bg-white p-6 sm:p-8 md:p-10 shadow-lg text-slate-800">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4 mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            Hospital-Grade Pediatric Psychometrics
          </p>
          <span className="text-xs text-slate-500 font-medium">
            Standard Normative Distribution (Mean = 50, SD = 10)
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Standardized Cognitive Psychometrics & DSM-5-TR Formulation
        </h2>
        <p className="mt-1 text-sm text-slate-600 leading-relaxed">
          Standardized score transformations ($T$-scores, percentiles, and 95% confidence intervals) mapped directly against DSM-5-TR and ICD-11 diagnostic criteria clusters.
        </p>

        {/* Normative Reference Key Card */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-0.5">T ≥ 60 (&gt;84th %ile)</span>
            <strong className="text-xs sm:text-sm font-extrabold text-emerald-950">Superior / Relative Strength</strong>
          </div>
          <div className="p-3 rounded-2xl bg-teal-50 border border-teal-300">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 block mb-0.5">T 45 – 59 (31st–83rd %ile)</span>
            <strong className="text-xs sm:text-sm font-extrabold text-teal-950">Age-Expected / Solid</strong>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 block mb-0.5">T 38 – 44 (12th–30th %ile)</span>
            <strong className="text-xs sm:text-sm font-extrabold text-amber-950">Mild Vulnerability / Monitor</strong>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-300">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 block mb-0.5">T ≤ 37 (&lt;11th %ile)</span>
            <strong className="text-xs sm:text-sm font-extrabold text-rose-950">Elevated Clinical Significance</strong>
          </div>
        </div>

        {/* 1. STANDARDIZED SCORECARD TABLE */}
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-slate-300 text-xs font-bold uppercase tracking-wider text-slate-600 bg-slate-50">
                <th className="py-3 px-3">Cognitive Domain & Construct</th>
                <th className="py-3 px-3 text-center">Standard T-Score</th>
                <th className="py-3 px-3 text-center">Percentile Rank (95% CI)</th>
                <th className="py-3 px-3">Clinical Stratification</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.id} className="border-b border-slate-200 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-3">
                    <strong className="block text-slate-900 font-bold">{m.domain}</strong>
                    <span className="text-xs text-slate-500 font-medium block mt-0.5">{m.construct}</span>
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md inline-block mt-1">
                      Raw: {m.rawMetric}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="text-lg font-black text-slate-900 font-mono">T = {m.tScore}</span>
                    <div className="mt-1 w-24 mx-auto h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full ${m.color} rounded-full`}
                        style={{width: `${Math.min(100, Math.max(10, ((m.tScore - 20) / 60) * 100))}%`}}
                      />
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="text-base font-extrabold text-slate-900">{m.percentile}th %ile</span>
                    <span className="block text-[11px] text-slate-500 font-mono mt-0.5">{m.ci95}</span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${
                      m.tier === 'Superior / Relative Strength'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : m.tier === 'Age-Expected / Solid'
                        ? 'bg-teal-100 text-teal-900 border-teal-300'
                        : m.tier === 'Mild Vulnerability / Monitor'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-rose-100 text-rose-900 border-rose-300'
                    }`}>
                      {m.tier}
                    </span>
                    <p className="mt-1 text-xs text-slate-600 leading-snug">{m.clinicalInterpretation}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 2. DSM-5-TR & ICD-11 CRITERIA CROSS-WALK */}
        <div className="mt-10 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>🩺</span> Diagnostic Criteria Mapping (DSM-5-TR & ICD-11)
            </h3>
            <span className="text-xs font-semibold text-slate-500">Symptom Cluster Cross-Walk</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
            Correlating objective millisecond performance indices with formal diagnostic criteria under the American Psychiatric Association (DSM-5-TR) and World Health Organization (ICD-11):
          </p>

          <div className="space-y-3.5">
            {metrics.map((m) => (
              <div key={m.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 bg-white border border-slate-300 px-2.5 py-0.5 rounded-md">
                    {m.dsmCriteria.split(':')[0]}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    m.tScore >= 45 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900 font-semibold'
                  }`}>
                    {m.tScore >= 45 ? '✓ Benchmark Met' : '⚠ Area of Observed Difference'}
                  </span>
                </div>
                <strong className="block text-sm font-bold text-slate-900">{m.domain}</strong>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed font-mono bg-white/70 p-2 rounded-lg border border-slate-200">
                  {m.dsmCriteria}
                </p>
                <p className="mt-2 text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold">Clinical Observation: </span>
                  {who} demonstrated {m.tScore >= 45 ? 'age-expected stability' : 'observed variability'} with a standardized score of T = {m.tScore} ({m.percentile}th percentile rank). {m.clinicalInterpretation}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. MULTI-DISCIPLINARY LABORATORY BIOMETRICS */}
        <div className="mt-10 pt-6 border-t border-slate-200 bg-slate-50/70 -mx-6 sm:-mx-8 md:-mx-10 px-6 sm:px-8 md:px-10 pb-4 rounded-b-2xl">
          <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
            <span>🔬</span> Objective Laboratory Telemetry Indices
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <strong className="block font-bold text-slate-900 mb-0.5">Signal Detection (d')</strong>
              <p className="text-[11px] text-slate-500">Separates genuine attention sensitivity from impulsive guessing bias.</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <strong className="block font-bold text-slate-900 mb-0.5">Intra-Individual Variability (IIV)</strong>
              <p className="text-[11px] text-slate-500">Reaction time fluctuation coefficient—the premier hallmark of executive regulation.</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <strong className="block font-bold text-slate-900 mb-0.5">Interference Cost (RT Delta)</strong>
              <p className="text-[11px] text-slate-500">Calculates millisecond delay incurred when resolving conflicting flanker stimuli.</p>
            </div>
          </div>
        </div>
      </section>
    </article>
  )
}

/** 2. FORMAL SCHOOL ACCOMMODATION REQUEST LETTER (IEP / SECTION 12 / 504 PLAN READY) */
export function SchoolAccommodationLetterSection({record, name}: {record: ReportRecord; name?: string}) {
  const who = name?.trim() || 'Student'
  const isAdhd = record.quest === 'adhd'
  const isAutism = record.quest === 'autism'
  const isDyslexia = record.quest === 'dyslexia'

  return (
    <article className="space-y-6" aria-label="School Accommodation Request Letter">
      <DraftBanner />

      <section className="rounded-3xl border-2 border-slate-300 bg-white p-6 sm:p-10 md:p-12 shadow-xl text-slate-900 font-serif leading-relaxed">
        {/* Formal Institutional Header */}
        <div className="border-b-2 border-slate-900 pb-6 mb-8 text-left font-sans">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">MANAS HEALTHCARE</span>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-0.5">
                Pediatric Neurodevelopmental Clinical Assessment Services
              </p>
            </div>
            <div className="text-right text-xs text-slate-500 font-mono">
              <p>Reference: MANAS-IEP-{String(record.recordedAt).slice(0, 10).replace(/-/g, '')}-P8</p>
              <p>Date of Evaluation: {sessionDate(record)}</p>
            </div>
          </div>
        </div>

        {/* Letter Recipient */}
        <div className="mb-6 font-sans text-sm">
          <p className="font-bold">TO:</p>
          <p className="text-slate-800">The Principal / Head of School / Special Educational Needs Coordinator (SENCO)</p>
          <p className="text-slate-800">Classroom Educational Team</p>
          <p className="font-bold mt-4">RE: Formal Educational Accommodation Request & Individualized Support Framework (IEP / Section 12)</p>
          <p className="text-slate-700 mt-1">
            <strong>Student Name:</strong> {who} &nbsp;|&nbsp; <strong>Chronological Age:</strong> {record.ageYears ? `${record.ageYears} years` : 'Pediatric'} &nbsp;|&nbsp; <strong>Assessment Battery:</strong> {QUEST_NAME[record.quest]}
          </p>
        </div>

        {/* Body Paragraphs */}
        <div className="space-y-4 text-sm sm:text-base text-slate-800">
          <p>
            Dear School Leadership and Educational Team,
          </p>
          <p>
            {who} recently completed a standardized pediatric neurodevelopmental evaluation assessing cognitive executive function, attentional vigilance, working memory, and sensory processing. This evaluation utilized objective, computer-administered behavioural paradigms measuring response latency, omission/commission rates, interference filtering, and set-shifting adaptation.
          </p>
          <p>
            To ensure an equitable learning environment where {who} can thrive academically and demonstrate true intellectual potential without unnecessary cognitive fatigue, the following <strong>evidence-based educational accommodations</strong> are formally requested under Individualized Education Plan (IEP / 504 / CBSE / ICSE Section 12) provisions:
          </p>

          {/* Accommodation Sections */}
          <div className="my-6 space-y-6 font-sans">
            {/* 1. Environmental */}
            <div className="rounded-2xl border border-slate-300 bg-slate-50/80 p-5">
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-2">
                <span>1.</span> Classroom Seating & Environmental Ergonomics
              </h4>
              <ul className="text-sm text-slate-700 space-y-1.5 list-disc pl-5">
                <li><strong>Preferential Seating:</strong> Front-row or side-front seating near the teacher’s primary instruction zone, away from high-traffic visual distractions such as open classroom doors, windows, and noisy ventilation ducts.</li>
                <li><strong>Sensory & Movement Tools:</strong> Permission to utilize sensory regulation supports (e.g. wobble seat cushion, discreet fidget, or noise-dampening ear defenders during quiet reading time).</li>
                <li><strong>Access to Quiet Sanctuary:</strong> Unrestricted, calm access to a low-stimulation quiet corner when sensory or attentional fatigue peaks.</li>
              </ul>
            </div>

            {/* 2. Instructional */}
            <div className="rounded-2xl border border-slate-300 bg-slate-50/80 p-5">
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-2">
                <span>2.</span> Instructional Scaffolding & Task Presentation
              </h4>
              <ul className="text-sm text-slate-700 space-y-1.5 list-disc pl-5">
                <li><strong>Visual Task Chunking:</strong> Breaking multi-step assignments into 1-to-2 visual steps; providing written or pictorial checklists alongside verbal directions.</li>
                <li><strong>Checking for Understanding:</strong> Discreetly asking {who} to repeat the first action step before beginning independent desk work to prevent disorientation.</li>
                <li><strong>Volume Reduction:</strong> Modifying repetitive drill volume (e.g. assigning 5 representative mathematics problems rather than 25 identical problems to demonstrate mastery).</li>
              </ul>
            </div>

            {/* 3. Examination */}
            <div className="rounded-2xl border border-slate-300 bg-slate-50/80 p-5">
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-2">
                <span>3.</span> Formal Examination & Timed Testing Accommodations
              </h4>
              <ul className="text-sm text-slate-700 space-y-1.5 list-disc pl-5">
                <li><strong>Extended Time Allowance:</strong> 25% to 50% additional time on all timed quizzes, unit tests, and standardized written examinations.</li>
                <li><strong>Distraction-Minimized Testing Room:</strong> Option to take formal examinations in a quiet, low-density examination environment.</li>
                <li><strong>Rest Breaks:</strong> Supervised 2-minute movement/water breaks every 20 minutes of continuous testing without deduction from allotted test time.</li>
                <li><strong>Oral Substitution:</strong> Allowing oral demonstration of knowledge or scribe support when fine-motor writing stamina is exhausted.</li>
              </ul>
            </div>

            {/* 4. Regulation & Transitions */}
            <div className="rounded-2xl border border-slate-300 bg-slate-50/80 p-5">
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-2">
                <span>4.</span> Routine Transitions & Social Regulation
              </h4>
              <ul className="text-sm text-slate-700 space-y-1.5 list-disc pl-5">
                <li><strong>Advance Transition Warnings:</strong> Providing a 5-minute and 2-minute visual countdown cue before concluding a task or switching subjects.</li>
                <li><strong>Discreet Regulation Pass:</strong> A non-verbal desk cue allowing {who} to step to the water station or stretch without drawing peer scrutiny.</li>
                <li><strong>Proactive Co-Regulation:</strong> Calm, non-punitive re-direction when attention wanders; acknowledging persistence and creative problem solving.</li>
              </ul>
            </div>
          </div>

          <p>
            We deeply appreciate your partnership in championing {who}’s academic journey and well-being. Please feel free to reach out to our clinical team if you have questions regarding implementing these accommodations.
          </p>

          <p className="pt-4">
            Sincerely,
          </p>

          {/* Formal Signature Blocks */}
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-8 font-sans">
            <div className="border-t border-slate-400 pt-2 text-xs">
              <p className="font-bold text-slate-900">Lead Pediatric Neurodevelopmental Specialist</p>
              <p className="text-slate-600">Manas Clinical Assessment Services</p>
              <p className="text-slate-500 font-mono mt-0.5">Verification ID: MANAS-REG-CLIN-2026</p>
            </div>
            <div className="border-t border-slate-400 pt-2 text-xs">
              <p className="font-bold text-slate-900">Parent / Legal Guardian Signature</p>
              <p className="text-slate-600">Date: ________________________</p>
              <p className="text-slate-500 mt-0.5">Acknowledged & Approved for School IEP Record</p>
            </div>
          </div>
        </div>
      </section>
    </article>
  )
}

/** 3. MULTI-DISCIPLINARY PEDIATRICIAN & SPECIALIST REFERRAL MEMO */
export function PediatricianReferralMemoSection({record, name}: {record: ReportRecord; name?: string}) {
  const who = name?.trim() || 'your child'
  const metrics = computePsychometricMetrics(record)
  const isAdhd = record.quest === 'adhd'
  const isAutism = record.quest === 'autism'
  const isDyslexia = record.quest === 'dyslexia'

  return (
    <article className="space-y-6" aria-label="Pediatrician Referral Memo">
      <DraftBanner />

      <section className="rounded-3xl border-2 border-sky-300 bg-white p-6 sm:p-8 md:p-10 shadow-lg text-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4 mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
            Confidential Medical & Neurodevelopmental Consultation Memo
          </p>
          <span className="text-xs text-slate-500 font-medium">
            For: Attending Pediatrician / Child Neurologist / Clinical Psychologist
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Pediatric Specialist Consultation & Referral Memo
        </h2>
        <p className="mt-1 text-sm text-slate-600 leading-relaxed">
          Structured objective laboratory summary designed for clinical differential diagnosis and multidisciplinary referral.
        </p>

        {/* Patient Demographics */}
        <div className="my-6 rounded-2xl bg-slate-50 border border-slate-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div><span className="text-slate-500 block">Patient Name</span><strong className="text-sm text-slate-900 font-bold">{who}</strong></div>
          <div><span className="text-slate-500 block">Evaluation Date</span><strong className="text-sm text-slate-900 font-bold">{sessionDate(record)}</strong></div>
          <div><span className="text-slate-500 block">Chronological Age</span><strong className="text-sm text-slate-900 font-bold">{record.ageYears ? `${record.ageYears} yrs` : 'Pediatric'}</strong></div>
          <div><span className="text-slate-500 block">Assessment Target</span><strong className="text-sm text-slate-900 font-bold">{QUEST_NAME[record.quest]}</strong></div>
        </div>

        {/* Clinical Summary */}
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <h3 className="text-lg font-bold text-slate-900">1. Reason for Evaluation & Methodology</h3>
          <p>
            {who} was evaluated using the Manas computerized neurodevelopmental battery to objectively profile continuous vigilance, motor inhibition, distractor conflict resolution, working memory capacity, and mental set-shifting. Test sessions record millisecond-level response times, commission errors (impulsivity markers), omission errors (inattention markers), and intra-individual reaction time variability ($IIV$).
          </p>

          <h3 className="text-lg font-bold text-slate-900 pt-2">2. Standardized Psychometric Profile</h3>
          <div className="space-y-2">
            {metrics.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <strong className="text-slate-900 font-bold block">{m.domain}</strong>
                  <span className="text-slate-500">{m.construct}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-slate-900 text-sm">T = {m.tScore}</span>
                  <span className="text-slate-500 block">({m.percentile}th %ile)</span>
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-bold text-slate-900 pt-2">3. Recommended Confirmatory Diagnostic Instruments</h3>
          <p>
            To establish formal clinical diagnoses and guide multi-disciplinary intervention, the following gold-standard clinical instruments are recommended for discussion:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            {isAdhd && (
              <>
                <li><strong>Conners 4th Edition / Vanderbilt Assessment Scale:</strong> Comprehensive multi-informant (parent and teacher) rating scales evaluating DSM-5-TR inattention and hyperactivity symptom clusters.</li>
                <li><strong>BRIEF-2 (Behavior Rating Inventory of Executive Function):</strong> In-depth evaluation of executive regulation, cognitive shift, working memory, and emotional control across real-world environments.</li>
                <li><strong>Clinical CPT Laboratory Battery:</strong> Formal laboratory verification of vigilance decrement slopes and signal detection sensitivity.</li>
              </>
            )}
            {isAutism && (
              <>
                <li><strong>ADOS-2 (Autism Diagnostic Observation Schedule):</strong> Gold-standard semi-structured observational assessment of social communication and reciprocal interaction.</li>
                <li><strong>SRS-2 (Social Responsiveness Scale, 2nd Edition):</strong> Quantitative measurement of reciprocal social behavior across educational and home environments.</li>
                <li><strong>Sensory Profile 2 (Winnie Dunn):</strong> Diagnostic evaluation of auditory, visual, and tactile sensory modulation patterns.</li>
              </>
            )}
            {isDyslexia && (
              <>
                <li><strong>CTOPP-2 (Comprehensive Test of Phonological Processing):</strong> Rigorous evaluation of phonological awareness, phonological memory loop, and rapid naming fluency.</li>
                <li><strong>WISC-V Working Memory & Processing Speed Indices:</strong> Detailed cognitive profiling of auditory-verbal retention and visual-spatial coordination.</li>
                <li><strong>GORT-5 (Gray Oral Reading Tests):</strong> Standardized oral reading accuracy, fluency, and reading comprehension benchmarking.</li>
              </>
            )}
          </ul>

          <h3 className="text-lg font-bold text-slate-900 pt-2">4. Multi-Disciplinary Follow-Up Actions</h3>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li><strong>Pediatric Physical & Sensory Check:</strong> Review of comprehensive vision and hearing acuity to rule out peripheral sensory barriers.</li>
            <li><strong>School-Based Support Plan:</strong> Initiation of classroom accommodations outlined in the accompanying School Accommodation Request Letter.</li>
            <li><strong>Occupational Therapy / Speech-Language Consultation:</strong> If sensory modulation or phonological awareness differences remain prominent across settings.</li>
          </ul>

          <div className="mt-8 border-t border-slate-300 pt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 font-mono">
            <div>
              <p>Manas Neurodevelopmental Center • Clinical Review Desk</p>
              <p>Email: care@manas.health • Bangalore, India</p>
            </div>
            <div className="text-right">
              <p>Formulation Status: Completed for Specialist Review</p>
              <p>Record Version: 1.14 (Validated Wilson Intervals)</p>
            </div>
          </div>
        </div>
      </section>
    </article>
  )
}

/** The end-of-quest report: parent summary, psychometrics, school letter, home plan, and clinician memo */
export default function ReportTabs({record, name, roadmap}: {record: ReportRecord; name?: string; roadmap: Roadmap | null}) {
  const [tab, setTab] = useState<'parent' | 'psychometrics' | 'school_letter' | 'plan' | 'clinician'>('parent')
  const tabCls = (on: boolean) =>
    `min-h-[44px] rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
      on
        ? 'bg-teal-700 text-white shadow-md scale-[1.02]'
        : 'border-2 border-teal-700/80 bg-white text-teal-800 hover:bg-teal-50'
    }`

  return (
    <section className="mx-auto mt-8 max-w-4xl text-left select-none" aria-label="Your personalised report">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #report-print, #report-print * { visibility: visible !important; }
          #report-print { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          article { break-after: page; }
        }
      `}</style>

      {/* Navigation Tabs Bar */}
      <div className="no-print flex flex-wrap items-center gap-2 mb-4" role="tablist" aria-label="Choose a report view">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'parent'}
          onClick={() => setTab('parent')}
          className={tabCls(tab === 'parent')}
        >
          For parents
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'psychometrics'}
          onClick={() => setTab('psychometrics')}
          className={tabCls(tab === 'psychometrics')}
        >
          📊 Scores & DSM-5
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'school_letter'}
          onClick={() => setTab('school_letter')}
          className={tabCls(tab === 'school_letter')}
        >
          🏫 School Letter (IEP)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'plan'}
          onClick={() => setTab('plan')}
          className={tabCls(tab === 'plan')}
        >
          🗓️ 4-week home plan
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'clinician'}
          onClick={() => setTab('clinician')}
          className={tabCls(tab === 'clinician')}
        >
          🩺 Specialist memo
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="ml-auto min-h-[44px] rounded-full border-2 border-slate-400 bg-white px-5 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 shadow-sm cursor-pointer flex items-center gap-1.5"
        >
          <span>🖨️</span>
          <span>Print or save as PDF</span>
        </button>
      </div>

      {/* Active Tab Panel */}
      <div id="report-print" role="tabpanel">
        {tab === 'parent' ? (
          <ParentSummary record={record} name={name} roadmap={roadmap} />
        ) : tab === 'psychometrics' ? (
          <PsychometricsAndDsmSection record={record} name={name} />
        ) : tab === 'school_letter' ? (
          <SchoolAccommodationLetterSection record={record} name={name} />
        ) : tab === 'plan' ? (
          <HomePlan quest={record.quest} name={name} />
        ) : (
          <PediatricianReferralMemoSection record={record} name={name} />
        )}
      </div>
    </section>
  )
}
