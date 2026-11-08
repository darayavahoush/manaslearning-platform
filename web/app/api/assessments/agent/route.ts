import {NextResponse} from 'next/server'
import {INSTRUMENT_VERSION} from '../../../../components/assessments/version'
import {buildSessionRecord, cleanEnvironment, roundMeasures, starLevels, steeringTrials, type SessionRecord} from '../../../../components/assessments/session-record'
import {ADHD_IDEAS, AUTISM_IDEAS, DYSLEXIA_IDEAS} from '../../../../components/assessments/ideas'

/**
 * Play-session clinical summary and cognitive profile for Manas developmental assessments.
 *
 * This route converts objective millisecond reaction times, target discrimination rates,
 * and behavioural measures into parent-friendly, neurodevelopmental evaluations.
 * No game jargon or fantasy terminology is used in parent-facing clinical summaries.
 * Nothing is stored on a server; the request body is not saved.
 */

type Raw = Record<string, unknown>

export interface Observation {
  name: string
  value: string
  detail: string
  note: string
}

export interface DomainIndicator {
  label: string
  value: string
  context?: string
}

export interface DomainEvaluation {
  id: string
  title: string
  chapterName: string
  clinicalRating: string
  statusTone: 'strength' | 'support' | 'steady'
  narrativeAnalysis: string
  indicators: DomainIndicator[]
  realWorldImpact: string
}

export interface ParentInterpretation {
  assessmentFocus: string
  whatItReveals: string
  classroomImplications: string[]
  homeRecommendations: string[]
  discussionPrompts: string[]
}

export interface CognitiveProfile {
  archetype: string
  tempoLabel: string
  staminaLabel: string
  executiveSummary: string
  keyStrengths: string[]
  supportOpportunities: string[]
  domains: DomainEvaluation[]
  parentInterpretation?: ParentInterpretation
}

export interface AssessmentAgentState {
  assessmentType: 'adhd' | 'autism' | 'dyslexia'
  childName: string
  childAge: number | null
  explorerRank?: string
  companion?: string
  guildClass?: string
  telemetry: Record<string, number | null>
  record: SessionRecord
  superpowers: {
    realmTitle: string
    crestBadge: string
    elementalAffinity: string
    badges: Array<{name: string; desc: string; icon: string; rank: string}>
    miloScroll: string
  }
  cognitiveProfile?: CognitiveProfile
  clinicalReport: {
    generatedOn: string
    instrument: {name: string; version: string}
    summary: string
    indices: Observation[]
    questions: string[]
    accommodations: {
      classroom: string[]
      examinations: string[]
      executive: string[]
      sensoryDiet: string[]
    }
    cognitiveProfile?: CognitiveProfile
  }
}

const TELEMETRY_KEYS = [
  // ADHD battery
  'cptTrials', 'cptResponses', 'omissions', 'commissions', 'hrtMs', 'rtvMs',
  'flankerCostMs', 'flankerCongruentN', 'flankerIncongruentN', 'workingMemorySpan',
  'prematureReleases', 'chargeTrials',
  'cptTargets', 'cptNonTargets', 'cptAnticipatory', 'rtFirstHalfMs', 'rtSecondHalfMs',
  'flankerCongruentTotal', 'flankerIncongruentTotal',
  // Autism battery
  'jaTrials', 'jaCorrect', 'jaMedianMs', 'feelingsTrials', 'feelingsCorrect',
  'lightLevel', 'soundLevel', 'touchLevel', 'sortCount', 'sortMedianMs',
  'rampStopLight', 'rampStopSound', 'rampStopTexture', 'adjustLight', 'adjustSound', 'adjustTexture', 'shieldUses', 'designSec',
  'sortPreCorrect', 'sortPreTotal', 'sortPostCorrect', 'sortPostTotal',
  'sortBin1', 'sortBin2', 'sortBin3', 'sortBin4', 'sortBin5', 'sortBin6',
  'sortMs1', 'sortMs2', 'sortMs3', 'sortMs4', 'sortMs5', 'sortMs6',
  'gazePick1', 'gazePick2', 'gazePick3', 'gazePick4', 'gazePick5', 'gazePick6',
  'gazeMs1', 'gazeMs2', 'gazeMs3', 'gazeMs4', 'gazeMs5', 'gazeMs6',
  'feelingsPick1', 'feelingsPick2', 'feelingsPick3', 'feelingsPick4',
  'feelingsMs1', 'feelingsMs2', 'feelingsMs3', 'feelingsMs4',
  'retrySunbird', 'retrySteering', 'retryStars', 'retryGaze', 'retryFeelings', 'retrySorting', 'pauseCount', 'pausedSec',
  'parentTired', 'parentLikeHome', 'parentEnjoyed',
  'helpPick', 'helpMs',
  'steerRocket', 'starTone',
  'showPick1', 'showPick2', 'showMs1', 'showMs2', 'showBids', 'showMatches',
  'ruleCheck', 'ruleCheckMs',
  'holdTries', 'holdEarly', 'holdRtMs',
  'camStatus', 'camSec', 'camTrackedPct', 'camAwayPct', 'camAwayEvents', 'camMovePct',
  'camAwayPctSunbird', 'camAwayPctSteering', 'camAwayPctStars', 'camMoveSunbird', 'camMoveSteering', 'camMoveStars',
  'lookStatus', 'lookCal', 'lookShown', 'lookTrials', 'lookSocialPct', 'lookRightPct',
  'lookPct1', 'lookPct2', 'lookPct3', 'lookPct4', 'lookPct5', 'lookPct6',
  // Dyslexia / Reading battery
  'rhymeTrials', 'rhymeCorrect', 'rhymeMedianMs', 'rhymeReplays',
  'firstSoundTrials', 'firstSoundCorrect', 'firstSoundMedianMs', 'firstSoundReplays',
  'spellTrials', 'spellCorrect', 'spellMedianMs',
  'letterRounds', 'letterHits', 'letterPossible', 'letterFalse', 'letterDistractors', 'letterMissed', 'letterMirrorFalse',
  'soundSpanAttempts', 'soundSpanPassed', 'soundSpanLongest',
  'wordTrials', 'wordRealTotal', 'wordRealCorrect', 'wordMadeTotal', 'wordMadeCorrect', 'wordMedianMs',
  'retryLetters',
] as const

function cleanTelemetry(input: unknown): Record<string, number | null> {
  const out: Record<string, number | null> = {}
  const src = (input && typeof input === 'object' ? input : {}) as Raw
  for (const key of TELEMETRY_KEYS) {
    const v = src[key]
    out[key] = typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 1_000_000 ? v : null
  }
  return out
}

export interface SunbirdRounds {
  size: number
  count: number
  displayMs: number | null
  windowMs: number | null
  rtMs: Array<number | null>
  misses: number[]
  wrongTaps: number[]
}

function cleanRounds(input: unknown, t: Record<string, number | null>): SunbirdRounds | null {
  if (!input || typeof input !== 'object') return null
  const s = input as Raw
  const count = Number(s.count)
  const size = Number(s.size)
  if (!Number.isInteger(count) || count < 1 || count > 8 || !Number.isInteger(size) || size < 1 || size > 20) return null
  const list = (value: unknown, max: number, allowNull: boolean): Array<number | null> | null => {
    if (!Array.isArray(value) || value.length !== count) return null
    const out: Array<number | null> = []
    for (const x of value) {
      if (typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= max) out.push(Math.round(x))
      else if (allowNull && x === null) out.push(null)
      else return null
    }
    return out
  }
  const rtMs = list(s.rtMs, 10000, true)
  const misses = list(s.misses, size, false) as number[] | null
  const wrongTaps = list(s.wrongTaps, size, false) as number[] | null
  if (!rtMs || !misses || !wrongTaps) return null
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
  if (t.cptTrials !== count * size) return null
  if (t.omissions !== null && t.omissions !== sum(misses)) return null
  if (t.commissions !== null && t.commissions !== sum(wrongTaps)) return null
  const ms = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 10000 ? Math.round(value) : null)
  return {size, count, displayMs: ms(s.displayMs), windowMs: ms(s.windowMs), rtMs, misses, wrongTaps}
}

function cleanText(v: unknown, max: number, fallback: string): string {
  if (typeof v !== 'string') return fallback
  const t = v.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max)
  return t || fallback
}

function cleanAge(v: unknown): number | null {
  const n = Number(v)
  return Number.isFinite(n) && n >= 3 && n <= 18 ? Math.round(n) : null
}

const NOT_ENOUGH = 'Not enough data'
const ONE_SESSION =
  'This reflects direct observations from this single session. Fatigue, mood, testing environment, and device responsiveness can contribute to variability.'

const times = (n: number) => `${n} ${n === 1 ? 'time' : 'times'}`

function adhdObservations(t: Record<string, number | null>): Observation[] {
  const obs: Observation[] = []

  const trials = t.cptTrials
  if (trials !== null && t.omissions !== null && t.commissions !== null) {
    const targets = t.cptTargets ?? 10
    const hits = Math.max(0, targets - t.omissions)
    const hitPct = targets > 0 ? Math.round((hits / targets) * 100) : 0
    obs.push({
      name: 'Visual Vigilance & Target Detection (CPT-3)',
      value: `${hitPct}% Target Detection (${hits}/${targets} targets)`,
      detail: [
        t.commissions > 0 ? `${t.commissions} false alarms on non-target distractors` : 'Zero false alarms on distractors',
        `${trials} total stimulus presentations`,
        t.cptAnticipatory && t.cptAnticipatory > 0 ? `${times(t.cptAnticipatory)} anticipatory early responses (<100ms)` : null,
      ].filter(Boolean).join(' · '),
      note: `Continuous Performance Test (Conners CPT-3 Standard). Evaluates sustained visual alertness and top-down motor inhibition. ${ONE_SESSION}`,
    })
  } else {
    obs.push({name: 'Visual Vigilance & Target Detection (CPT-3)', value: NOT_ENOUGH, detail: 'The task did not finish or telemetry was incomplete.', note: ONE_SESSION})
  }

  if (t.hrtMs !== null && t.rtvMs !== null && (t.cptResponses ?? 0) >= 4) {
    obs.push({
      name: 'Processing Speed & Motor Timing Stability',
      value: `Mean response time: ${Math.round(t.hrtMs)} ms`,
      detail: `Response time variability (RTV): ±${Math.round(t.rtvMs)} ms across ${t.cptResponses} valid responses` +
        (t.rtFirstHalfMs !== null && t.rtSecondHalfMs !== null ? ` · First half: ${Math.round(t.rtFirstHalfMs)} ms vs Second half: ${Math.round(t.rtSecondHalfMs)} ms (vigilance drift check)` : ''),
      note: `Reflects cognitive processing consistency and attentional stamina across repetitive intervals. ${ONE_SESSION}`,
    })
  } else {
    obs.push({name: 'Processing Speed & Motor Timing Stability', value: NOT_ENOUGH, detail: 'Too few responses recorded to calculate timing stability.', note: ONE_SESSION})
  }

  if (t.flankerCostMs !== null && (t.flankerCongruentN ?? 0) >= 3 && (t.flankerIncongruentN ?? 0) >= 3) {
    const cost = Math.round(t.flankerCostMs)
    obs.push({
      name: 'Selective Attention & Distractor Filtering',
      value: cost > 0 ? `+${cost} ms interference cost under conflicting distractors` : 'Negligible interference cost (+0 ms)',
      detail: t.flankerCongruentTotal !== null && t.flankerIncongruentTotal !== null
        ? `${t.flankerCongruentN}/${t.flankerCongruentTotal} congruent trials and ${t.flankerIncongruentN}/${t.flankerIncongruentTotal} incongruent trials answered accurately`
        : `${t.flankerCongruentN} congruent and ${t.flankerIncongruentN} incongruent trials accurate`,
      note: `Eriksen Flanker conflict paradigm: measures cognitive effort required to suppress peripheral distractions. ${ONE_SESSION}`,
    })
  } else {
    obs.push({name: 'Selective Attention & Distractor Filtering', value: NOT_ENOUGH, detail: 'Too few trials recorded.', note: ONE_SESSION})
  }

  if (t.workingMemorySpan !== null && t.workingMemorySpan > 0) {
    obs.push({
      name: 'Visuospatial Working Memory Capacity',
      value: `Sequence memory span: ${Math.round(t.workingMemorySpan)} items`,
      detail: 'Standard Corsi block-tapping assessment of visual-spatial sketchpad holding capacity.',
      note: `Measures ability to retain and reproduce multi-step visual sequences in short-term memory. ${ONE_SESSION}`,
    })
  } else {
    obs.push({name: 'Visuospatial Working Memory Capacity', value: NOT_ENOUGH, detail: 'No completed sequence recorded.', note: ONE_SESSION})
  }

  if (t.chargeTrials !== null && t.prematureReleases !== null) {
    const completed = Math.max(0, t.chargeTrials - t.prematureReleases)
    obs.push({
      name: 'Motor Delay Inhibition & Self-Regulation',
      value: `Completed ${completed} of ${t.chargeTrials} motor delay holds`,
      detail: t.prematureReleases === 0 ? 'Full motor persistence with zero early releases.' : `${times(t.prematureReleases)} early releases before delayed target completion.`,
      note: `Delay of gratification task assessing patience regulation and suppression of anticipatory motor urges. ${ONE_SESSION}`,
    })
  } else {
    obs.push({name: 'Motor Delay Inhibition & Self-Regulation', value: NOT_ENOUGH, detail: 'The hold task was not completed.', note: ONE_SESSION})
  }

  return obs
}

function sortAccuracyText(t: Record<string, number | null>): string {
  const part = (k: number | null, n: number | null, rule: string) =>
    k !== null && n !== null && n > 0 && k <= n ? `${Math.round(k)} of ${Math.round(n)} correct under the ${rule} rule` : null
  const a = part(t.sortPreCorrect, t.sortPreTotal, 'color')
  const b = part(t.sortPostCorrect, t.sortPostTotal, 'shape')
  const cap = (x: string) => x[0].toUpperCase() + x.slice(1)
  if (a && b) return `${cap(a)}, and ${b}.`
  if (a || b) return `${cap((a ?? b) as string)}.`
  return 'Pre and post shift accuracy was not recorded.'
}

function describeRoom(t: Record<string, number | null>): string {
  const part = (label: string, key: string) => {
    const v = t[`rampStop${label}`]
    return `${key} ${v !== null && v !== undefined && v > 0 ? `at level ${Math.round(v)}/10` : 'comfortable at standard range'}`
  }
  const moves = (t.adjustLight ?? 0) + (t.adjustSound ?? 0) + (t.adjustTexture ?? 0)
  return `Sensory calibration: ${part('Light', 'illumination')}, ${part('Sound', 'acoustics')} and ${part('Texture', 'tactile pressure')}. Preferences adjusted ${moves} ${moves === 1 ? 'time' : 'times'}.`
}

function autismObservations(t: Record<string, number | null>): Observation[] {
  const obs: Observation[] = []

  if (t.jaTrials !== null && t.jaCorrect !== null && t.jaTrials > 0) {
    const pct = Math.round((t.jaCorrect / t.jaTrials) * 100)
    obs.push({
      name: 'Joint Attention & Social Gaze Referencing',
      value: `${Math.round(t.jaCorrect)} of ${Math.round(t.jaTrials)} trials aligned with social pointing and gaze cues (${pct}%)`,
      detail: t.jaMedianMs !== null ? `Average orienting latency: about ${Math.round(t.jaMedianMs)} ms` : 'Latency was not recorded.',
      note: `Assesses triadic joint attention: referencing where an interaction partner looks or points to coordinate shared visual attention. ${ONE_SESSION}`,
    })
  } else {
    obs.push({name: 'Joint Attention & Social Gaze Referencing', value: NOT_ENOUGH, detail: 'The task did not finish or report back.', note: ONE_SESSION})
  }

  if (t.feelingsTrials !== null && t.feelingsCorrect !== null && t.feelingsTrials > 0) {
    const pct = Math.round((t.feelingsCorrect / t.feelingsTrials) * 100)
    obs.push({
      name: 'Facial Affect Discrimination & Emotion Decoding',
      value: `${Math.round(t.feelingsCorrect)} of ${Math.round(t.feelingsTrials)} facial expressions correctly identified (${pct}%)`,
      detail: 'Non-verbal discrimination across happy, surprised, calm, and worried facial affect.',
      note: `Evaluates foundational facial affect decoding and non-verbal emotional cue interpretation. ${ONE_SESSION}`,
    })
  } else {
    obs.push({name: 'Facial Affect Discrimination & Emotion Decoding', value: NOT_ENOUGH, detail: 'The task did not finish.', note: ONE_SESSION})
  }

  if (t.lightLevel !== null || t.soundLevel !== null || t.touchLevel !== null) {
    const lvl = (label: string, v: number | null) => `${label} ${v === null ? 'Default' : `${Math.round(v)}/10`}`
    obs.push({
      name: 'Sensory Comfort & Environmental Thresholds',
      value: `${lvl('Illumination', t.lightLevel)} · ${lvl('Acoustics', t.soundLevel)} · ${lvl('Tactile Pressure', t.touchLevel)}`,
      detail: [
        'Self-calibrated sensory preferences for lighting intensity, environmental acoustics, and deep tactile pressure.',
        t.designSec !== null ? describeRoom(t) : null,
      ].filter(Boolean).join(' '),
      note: `Sensory Processing Measure (SPM-2) framework: reflects individual sensory regulation thresholds that support focus and calm. ${ONE_SESSION}`,
    })
  } else if (t.designSec !== null) {
    obs.push({name: 'Sensory Comfort & Environmental Thresholds', value: 'Sensory haven configured with standard defaults', detail: describeRoom(t), note: ONE_SESSION})
  } else {
    obs.push({name: 'Sensory Comfort & Environmental Thresholds', value: NOT_ENOUGH, detail: 'Sensory preferences were not adjusted.', note: ONE_SESSION})
  }

  if (t.sortCount !== null && t.sortCount > 0) {
    obs.push({
      name: 'Cognitive Set-Shifting & Executive Rule Flexibility',
      value: `${Math.round(t.sortCount)} items sorted across shifting rules`,
      detail: [
        t.sortMedianMs !== null ? `Average sorting time: ${Math.round(t.sortMedianMs)} ms per item.` : 'Timing was not recorded.',
        sortAccuracyText(t),
      ].filter(Boolean).join(' '),
      note: `Dimensional change card sort (Wisconsin Card Sorting paradigm): measures ability to suppress a prior established rule and flexibly transition to a new rule. ${ONE_SESSION}`,
    })
  } else {
    obs.push({name: 'Cognitive Set-Shifting & Executive Rule Flexibility', value: NOT_ENOUGH, detail: 'The sorting task did not finish.', note: ONE_SESSION})
  }

  return obs
}

function dyslexiaObservations(t: Record<string, number | null>): Observation[] {
  const obs: Observation[] = []

  // 1. Rhyme
  if (t.rhymeTrials !== null && t.rhymeCorrect !== null && t.rhymeTrials > 0) {
    const pct = Math.round((t.rhymeCorrect / t.rhymeTrials) * 100)
    obs.push({
      name: 'Phonological Awareness & Rhyme Sensitivity',
      value: `${t.rhymeCorrect} of ${t.rhymeTrials} rhyming pairs identified (${pct}%)`,
      detail: t.rhymeMedianMs !== null ? `Average decision latency: about ${Math.round(t.rhymeMedianMs)} ms` : 'Auditory timing recorded.',
      note: `Standardized rhyme judgment task: assesses phonological sensitivity to word rimes in spoken language without visual text. ${ONE_SESSION}`,
    })
  } else {
    obs.push({name: 'Phonological Awareness & Rhyme Sensitivity', value: NOT_ENOUGH, detail: 'The rhyme task was not completed.', note: ONE_SESSION})
  }

  // 2. Initial sounds
  if (t.firstSoundTrials !== null && t.firstSoundCorrect !== null && t.firstSoundTrials > 0) {
    const pct = Math.round((t.firstSoundCorrect / t.firstSoundTrials) * 100)
    obs.push({
      name: 'Phonemic Segmentation (Initial Sound Isolation)',
      value: `${t.firstSoundCorrect} of ${t.firstSoundTrials} onset sounds isolated (${pct}%)`,
      detail: t.firstSoundMedianMs !== null ? `Average response latency: about ${Math.round(t.firstSoundMedianMs)} ms` : 'Response latency recorded.',
      note: `Evaluates phonological segmentation: isolating and comparing the initial phoneme of spoken words. ${ONE_SESSION}`,
    })
  } else {
    obs.push({name: 'Phonemic Segmentation (Initial Sound Isolation)', value: NOT_ENOUGH, detail: 'The initial sound task was not completed.', note: ONE_SESSION})
  }

  // 3. Letter orientation
  if (t.letterPossible !== null && t.letterHits !== null && t.letterPossible > 0) {
    const pct = Math.round((t.letterHits / t.letterPossible) * 100)
    const mirror = t.letterMirrorFalse ?? 0
    obs.push({
      name: 'Orthographic Letter Orientation (b, d, p, q)',
      value: `${pct}% target identification (${t.letterHits}/${t.letterPossible}) with ${mirror} mirror reversals`,
      detail: `Discriminating confusable letters (b, d, p, q) under rapid visual presentation · ${t.letterFalse ?? 0} total non-target false taps`,
      note: `Assesses visual-orthographic stability and developmental suppression of mirror invariance for letter symbols. ${ONE_SESSION}`,
    })
  } else {
    obs.push({name: 'Orthographic Letter Orientation (b, d, p, q)', value: NOT_ENOUGH, detail: 'Letter orientation task was not completed.', note: ONE_SESSION})
  }

  // 4. Sound sequence
  if (t.soundSpanAttempts !== null && t.soundSpanPassed !== null) {
    obs.push({
      name: 'Auditory Phonological Working Memory (Sound Span)',
      value: `Maximum sequence span: ${t.soundSpanLongest ?? 0} syllables`,
      detail: `${t.soundSpanPassed} of ${t.soundSpanAttempts} multi-syllable sequence attempts repeated in correct order`,
      note: `Evaluates the phonological loop capacity for retaining and sequencing novel multi-syllabic speech sounds. ${ONE_SESSION}`,
    })
  } else {
    obs.push({name: 'Auditory Phonological Working Memory (Sound Span)', value: NOT_ENOUGH, detail: 'Sound sequence task was not completed.', note: ONE_SESSION})
  }

  // 5. Word check
  if (t.wordTrials !== null && t.wordTrials > 0) {
    obs.push({
      name: 'Lexical Decoding & Pseudoword Reading',
      value: `${t.wordRealCorrect ?? 0}/${t.wordRealTotal ?? 0} real words · ${t.wordMadeCorrect ?? 0}/${t.wordMadeTotal ?? 0} pseudowords decoded`,
      detail: t.wordMedianMs !== null ? `Average reading decision speed: about ${Math.round(t.wordMedianMs)} ms` : 'Reading timing recorded.',
      note: `Differentiates sight-word lexical access from synthetic phonological decoding (sounding out unfamiliar nonwords). ${ONE_SESSION}`,
    })
  }

  // 6. Spelling
  if (t.spellTrials !== null && t.spellCorrect !== null && t.spellTrials > 0) {
    obs.push({
      name: 'Orthographic Lexical Memory (Word Spelling Choice)',
      value: `${t.spellCorrect} of ${t.spellTrials} correct spelling patterns recognized`,
      detail: t.spellMedianMs !== null ? `Average spelling decision latency: about ${Math.round(t.spellMedianMs)} ms` : 'Spelling timing recorded.',
      note: `Evaluates visual-orthographic word memory and stored knowledge of conventional English spelling patterns. ${ONE_SESSION}`,
    })
  }

  return obs
}

function generateAdhdCognitiveProfile(t: Record<string, number | null>, childName: string, childAge: number | null): CognitiveProfile {
  const domains: DomainEvaluation[] = []
  const strengths: string[] = []
  const supportNeeds: string[] = []

  // 1. Sustained Attention & Vigilance (CPT-3)
  const targets = t.cptTargets ?? 10
  const omissions = t.omissions ?? 0
  const hits = Math.max(0, targets - omissions)
  const hitRate = targets > 0 ? Math.round((hits / targets) * 100) : 0
  const distractors = t.cptNonTargets ?? 5
  const commissions = t.commissions ?? 0
  const falseAlarmRate = distractors > 0 ? Math.round((commissions / distractors) * 100) : 0
  const meanRt = t.hrtMs !== null ? Math.round(t.hrtMs) : null
  const rtv = t.rtvMs !== null ? Math.round(t.rtvMs) : null

  let cptTone: 'strength' | 'support' | 'steady' = 'steady'
  let cptRating = 'Balanced Target Vigilance'
  let cptNarrative = ''
  let cptImpact = ''

  if (commissions === 0 && omissions <= 1) {
    cptTone = 'strength'
    cptRating = 'Exceptional Target Vigilance & Inhibitory Restraint'
    cptNarrative = `${childName} demonstrated sustained attentional vigilance throughout the continuous performance task, accurately detecting ${hitRate}% of visual targets (${hits}/${targets}) while demonstrating 100% impulse control by completely withholding responses to all non-target distractors. This indicates robust top-down attentional focus and intact proactive motor braking under rapid visual demands.`
    cptImpact = `In classroom and home environments, ${childName} is well-equipped to sustain focus on primary visual tasks and resist impulsive false starts when visual distractors appear.`
    strengths.push('High-level vigilance and sustained visual target tracking')
    strengths.push('Robust motor response inhibition against visual distractors')
  } else if (commissions >= 2) {
    cptTone = 'support'
    cptRating = 'High Perceptual Speed with Action Impulsivity'
    cptNarrative = `${childName} maintained strong target detection (${hitRate}% hit rate), but triggered ${commissions} premature responses on non-target distractors (${falseAlarmRate}% false alarm rate). This indicates a 'fast-action' cognitive phenotype: visual awareness is keen and rapid, but motor braking struggles to suppress anticipatory physical responses before full stimulus discrimination occurs.`
    cptImpact = `During independent seatwork, ${childName} likely grasps directions quickly but may rush into answers or raise hands before processing all details. Scaffolding self-monitoring pauses ('Stop, Look, Check') will yield immediate improvements.`
    strengths.push('Rapid visual detection and high task engagement')
    supportNeeds.push('Motor impulse braking during rapid response windows')
  } else if (omissions >= 2) {
    cptTone = 'support'
    cptRating = 'Intermittent Attentional Lapses (Vulnerable Focus)'
    cptNarrative = `${childName} missed ${omissions} visual targets (${hitRate}% hit rate)${meanRt ? ` with an average reaction time of ${meanRt}ms` : ''}. This points to periodic attentional micro-lapses where focus drifts away from the primary scanning window during low-stimulation inter-stimulus intervals.`
    cptImpact = `During extended teacher explanations or reading passages, ${childName} may experience brief moments of visual drift. Breaking instruction into modular steps with visual callouts will significantly preserve engagement.`
    supportNeeds.push('Sustained visual vigilance during prolonged observation')
  } else {
    cptRating = 'Typical Attentional Vigilance & Pacing'
    cptNarrative = `${childName} detected ${hitRate}% of targets with an average speed of ${meanRt ?? 450}ms and ${commissions} false alarm on distractors. This represents typical developmental attentional vigilance and baseline inhibitory control.`
    cptImpact = `Able to maintain functional focus on routine classroom tasks with standard visual scaffolding.`
    strengths.push('Consistent baseline attention across standard intervals')
  }

  domains.push({
    id: 'cpt',
    title: 'Visual Vigilance & Sustained Focus',
    chapterName: 'Continuous Performance Test (Conners CPT-3 Standard)',
    clinicalRating: cptRating,
    statusTone: cptTone,
    narrativeAnalysis: cptNarrative,
    indicators: [
      {label: 'Target Hit Rate', value: `${hitRate}%`, context: `${hits} of ${targets} visual targets detected`},
      {label: 'Inattention Omissions', value: `${omissions}`, context: omissions === 0 ? 'Zero misses' : `${omissions} targets overlooked`},
      {label: 'Impulse False Alarms', value: `${commissions}`, context: `${falseAlarmRate}% non-target false alarm rate`},
      {label: 'Processing Stability (RTV)', value: rtv ? `${rtv} ms` : 'N/A', context: rtv && rtv < 90 ? 'High cognitive consistency' : 'Typical variability'},
    ],
    realWorldImpact: cptImpact,
  })

  // 2. Selective Focus & Interference Control (Flanker Task)
  const flankerCost = t.flankerCostMs !== null ? Math.round(t.flankerCostMs) : null
  const congN = t.flankerCongruentN ?? 6
  const congTotal = t.flankerCongruentTotal ?? 6
  const incongN = t.flankerIncongruentN ?? 6
  const incongTotal = t.flankerIncongruentTotal ?? 6

  let flankerTone: 'strength' | 'support' | 'steady' = 'steady'
  let flankerRating = 'Typical Conflict Resolution'
  let flankerNarrative = ''
  let flankerImpact = ''

  if (flankerCost !== null && flankerCost <= 35) {
    flankerTone = 'strength'
    flankerRating = 'Superior Distractor Immunity (Low Cost: ' + flankerCost + 'ms)'
    flankerNarrative = `${childName} exhibited exceptional conflict resolution, responding with an interference cost of only ${flankerCost}ms when surrounding peripheral flankers disagreed with the central target. This demonstrates an innate ability to filter out peripheral clutter and allocate selective attentional resources exclusively to target-relevant features.`
    flankerImpact = `High resilience to visual distractions in noisy environments; able to concentrate on worksheets even when peers are moving nearby.`
    strengths.push('Exceptional selective focus under conflicting visual stimuli')
  } else if (flankerCost !== null && flankerCost > 75) {
    flankerTone = 'support'
    flankerRating = 'Visual Clutter Sensitivity (+ ' + flankerCost + 'ms Interference Cost)'
    flankerNarrative = `${childName} demonstrated a notable latency delay (+${flankerCost}ms) when peripheral flankers conflicted with the central target direction. While overall accuracy was maintained (${incongN}/${incongTotal}), resolving the directional conflict required substantial additional executive effort and cognitive time.`
    flankerImpact = `Visually busy pages, cluttered whiteboards, or crowded classroom seating can slow processing speed. Providing uncluttered worksheets and privacy carrels will significantly reduce cognitive fatigue.`
    supportNeeds.push('Distractor filtering in high-density visual environments')
  } else {
    flankerRating = 'Age-Appropriate Conflict Resolution'
    flankerNarrative = `${childName} processed directional conflict with normal developmental adaptation (+${flankerCost ?? 45}ms cost). Performance under conflicting stimuli remained accurate (${incongN}/${incongTotal} correct).`
    flankerImpact = `Standard selective attentional capacity; copes well with everyday environmental stimuli.`
  }

  domains.push({
    id: 'flanker',
    title: 'Selective Attention & Distractor Filtering',
    chapterName: 'Selective Attention & Flanker Interference Task (Eriksen Standard)',
    clinicalRating: flankerRating,
    statusTone: flankerTone,
    narrativeAnalysis: flankerNarrative,
    indicators: [
      {label: 'Conflict Interference Cost', value: flankerCost !== null ? `+${flankerCost} ms` : 'N/A', context: flankerCost && flankerCost <= 35 ? 'Negligible distractor cost' : 'Processing slowdown under conflict'},
      {label: 'Congruent Accuracy', value: `${Math.round((congN / Math.max(1, congTotal)) * 100)}%`, context: `${congN} of ${congTotal} aligned trials`},
      {label: 'Incongruent Accuracy', value: `${Math.round((incongN / Math.max(1, incongTotal)) * 100)}%`, context: `${incongN} of ${incongTotal} conflicting trials`},
    ],
    realWorldImpact: flankerImpact,
  })

  // 3. Visuospatial Working Memory
  const span = t.workingMemorySpan !== null ? Math.round(t.workingMemorySpan) : 0
  const expectedSpan = childAge && childAge <= 6 ? 3 : childAge && childAge <= 9 ? 4 : 5

  let memoryTone: 'strength' | 'support' | 'steady' = 'steady'
  let memoryRating = 'Typical Working Memory Span'
  let memoryNarrative = ''
  let memoryImpact = ''

  if (span >= expectedSpan + 1) {
    memoryTone = 'strength'
    memoryRating = `Surpassing Working Memory Span (${span} items)`
    memoryNarrative = `${childName} accurately reproduced sequential visual patterns up to ${span} sequential items, surpassing the expected milestone for their age (${expectedSpan} items). This indicates strong visual-spatial sketchpad capacity and efficient mental rehearsal strategies.`
    memoryImpact = `Can comfortably track complex 3-to-4 step instructions, mental math problems, and sequential multi-step classroom procedures.`
    strengths.push(`Advanced visuospatial working memory span (${span} items)`)
  } else if (span < expectedSpan && span > 0) {
    memoryTone = 'support'
    memoryRating = `Developing Sequential Working Memory (${span} items)`
    memoryNarrative = `${childName} successfully recalled up to ${span} sequential visual items. Holding sequences beyond ${span} items caused order confusion, indicating that working memory chunking is actively developing and vulnerable to cognitive overload.`
    memoryImpact = `Long verbal instructions (e.g. 'Put your books away, get your yellow binder, and open to page 12') may break down. Supplementing verbal directions with a 1-step visual checklist will provide crucial executive scaffolding.`
    supportNeeds.push('Working memory support for multi-step sequential tasks')
  } else {
    memoryRating = `Age-Typical Working Memory (${span} items)`
    memoryNarrative = `${childName} recalled ${span} sequential items in precise order, meeting expected developmental benchmarks (${expectedSpan} items). Demonstrates reliable short-term spatial holding.`
    memoryImpact = `Capable of retaining typical classroom directions with standard verbal prompts.`
  }

  domains.push({
    id: 'memory',
    title: 'Visuospatial Working Memory & Sequence Span',
    chapterName: 'Visuospatial Working Memory Span (Corsi Block-Tapping Standard)',
    clinicalRating: memoryRating,
    statusTone: memoryTone,
    narrativeAnalysis: memoryNarrative,
    indicators: [
      {label: 'Maximum Sequence Span', value: `${span} items`, context: `Age milestone: ${expectedSpan} items`},
      {label: 'Sequential Chunking', value: span >= expectedSpan ? 'Intact' : 'Developing', context: 'Spatial pattern encoding'},
    ],
    realWorldImpact: memoryImpact,
  })

  // 4. Delay Tolerance & Motor Regulation
  const premature = t.prematureReleases ?? 0
  const totalCharges = t.chargeTrials ?? 3
  const completedCharges = Math.max(0, totalCharges - premature)

  let chargeTone: 'strength' | 'support' | 'steady' = 'steady'
  let chargeRating = 'Steady Delay Tolerance'
  let chargeNarrative = ''
  let chargeImpact = ''

  if (premature === 0) {
    chargeTone = 'strength'
    chargeRating = 'Excellent Motor Inhibition & Delay of Gratification'
    chargeNarrative = `${childName} maintained unbroken, steady motor touch hold across all ${totalCharges} delay trials with zero premature releases. This shows mature motor persistence and calm emotional tolerance when anticipating delayed reinforcement.`
    chargeImpact = `Well-developed capacity for patience during turn-taking, standing in line, or waiting for teacher attention without fidgeting or distress.`
    strengths.push('Exceptional patience and delay-of-gratification tolerance')
  } else if (premature >= 2) {
    chargeTone = 'support'
    chargeRating = 'High Motor Urgency (Anticipatory Impulsivity)'
    chargeNarrative = `${childName} released the motor hold prematurely ${premature} times before the target completion cue sounded. This reflects significant motor urgency and discomfort with static waiting intervals when no active stimulus is changing on screen.`
    chargeImpact = `Likely experiences physical restlessness during unstructured waiting periods. Incorporating silent fidgets, visual progress bars, and kinetic tasks will prevent restless energy from turning into frustration.`
    supportNeeds.push('Regulation of somatic restlessness during passive waiting')
  } else {
    chargeTone = 'steady'
    chargeRating = 'Emerging Impulse Regulation (1 Early Release)'
    chargeNarrative = `${childName} demonstrated functional delay capacity across the trials, with 1 early release before quickly self-correcting on subsequent attempts.`
    chargeImpact = `Generally handles routine waiting periods with occasional gentle reminders to pause and breathe.`
  }

  domains.push({
    id: 'charge',
    title: 'Motor Response Inhibition & Delay Regulation',
    chapterName: 'Motor Response Inhibition & Delay of Gratification Task',
    clinicalRating: chargeRating,
    statusTone: chargeTone,
    narrativeAnalysis: chargeNarrative,
    indicators: [
      {label: 'Delay Hold Completion', value: `${completedCharges} of ${totalCharges}`, context: premature === 0 ? 'Full motor persistence' : `${premature} early releases`},
      {label: 'Anticipatory Braking', value: premature === 0 ? 'Optimal' : premature === 1 ? 'Functional' : 'Restless', context: 'Somatic patience control'},
    ],
    realWorldImpact: chargeImpact,
  })

  // Phenotype Synthesis
  let archetype = 'Balanced Attentional Navigator'
  let tempoLabel = 'Balanced 420–500ms Cognitive Pacing'
  let staminaLabel = 'Robust Multi-Task Stamina'
  let execSummary = ''

  if (commissions >= 2 && premature >= 2) {
    archetype = 'Hyper-Responsive / Motor Impulsive Attentional Style'
    tempoLabel = 'Rapid <380ms Motor Impulse Latency'
    staminaLabel = 'Sprint Pacing with Motor Urgency'
    execSummary = `${childName} exhibits high perceptual alertness paired with active motor urgency. Information is taken in very rapidly, but motor braking struggles to suppress early physical responses. Benefit will come from external self-monitoring pauses ('Stop, Look, Check').`
  } else if (omissions >= 2 && (rtv ?? 0) > 90) {
    archetype = 'Attentive Explorer with Vigilance Drift'
    tempoLabel = 'Variable 480–620ms Processing Rhythm'
    staminaLabel = 'Intermittent Focus Vulnerability'
    execSummary = `${childName} demonstrates solid core cognitive reasoning, but exhibits periodic attentional drift during extended repetitive tasks. Structuring seatwork into short, structured 10-minute sprints with visual checkpoints will optimize academic output.`
  } else if (flankerCost !== null && flankerCost <= 35 && span >= expectedSpan) {
    archetype = 'High-Precision Focused Synthesizer'
    tempoLabel = 'Calm & Deliberate 440ms Response Speed'
    staminaLabel = 'Sustained Vigilance & Working Memory Endurance'
    execSummary = `${childName} displays exceptional distractor immunity and advanced working memory capacity. Able to sustain deep focus in high-stimulus environments and retain multi-step complex instructions.`
  } else {
    archetype = 'Developing Executive Attentional Profile'
    tempoLabel = 'Typical Developmental Tempo'
    staminaLabel = 'Consistent Task Engagement'
    execSummary = `${childName} performed reliably across all attentional and executive domains, showing expected developmental progression in vigilance, distraction filtering, memory span, and impulse regulation.`
  }

  const parentInterpretation: ParentInterpretation = {
    assessmentFocus: 'ADHD, Attention & Executive Functioning',
    whatItReveals: `${childName} completed a standardized continuous performance battery examining sustained vigilance, selective distraction filtering, visuospatial working memory, and motor impulse delay regulation. ${
      commissions >= 2
        ? `${childName} displays an active, fast-response cognitive style where visual awareness is rapid, but motor impulse braking requires conscious effort to pause before acting.`
        : omissions >= 2
        ? `${childName} shows periodic attentional drifting during prolonged observation, performing best when tasks are structured into short, high-interest milestones.`
        : `${childName} demonstrated balanced visual attention and steady motor pacing across the battery.`
    }`,
    classroomImplications: [
      flankerCost && flankerCost > 60
        ? 'High visual clutter (busy whiteboards, crowded worksheets) increases cognitive processing time. Keeping worksheets clean and uncluttered directly boosts accuracy.'
        : 'Strong ability to filter out peripheral distractions in the classroom.',
      span < expectedSpan
        ? 'Working memory holds approximately ' + span + ' items at a time. Break multi-step classroom instructions into 1-to-2 step visual checklists on the desk.'
        : 'Reliable working memory span for retaining multi-step instructions.',
      premature >= 2
        ? 'Sustained passive waiting triggers physical motor restlessness. Allow subtle movement opportunities (silent chair fidget bands, standing desks, errand breaks) to sustain calm focus.'
        : 'Good somatic persistence and patience during waiting periods.',
    ],
    homeRecommendations: [
      'Use visual timers (like a Time Timer) to make time concrete and help with starting homework and transitions.',
      'Implement the "Stop, Look, Check" routine before handing in schoolwork to catch impulsive rushed errors.',
      'Provide regular brief movement breaks ("brain breaks") every 15-20 minutes during study sessions.',
      'Establish a consistent, predictable homework launchpad with visual checklists for books and materials.',
    ],
    discussionPrompts: [
      'How does my child’s sustained focus and impulse control compare during high-interest vs routine academic tasks?',
      'Can my child have preferential seating away from distracting doors and windows?',
      'Would accommodations such as extended time (1.5x) or quiet room testing help reflect their true knowledge on examinations?',
      'Are motor restlessness or rushed answers observed during independent classroom seatwork?',
    ],
  }

  return {
    archetype,
    tempoLabel,
    staminaLabel,
    executiveSummary: execSummary,
    keyStrengths: strengths.length ? strengths : ['Positive task engagement throughout the assessment'],
    supportOpportunities: supportNeeds.length ? supportNeeds : ['Continue routine executive function scaffolding'],
    domains,
    parentInterpretation,
  }
}

function generateAutismCognitiveProfile(t: Record<string, number | null>, childName: string): CognitiveProfile {
  const domains: DomainEvaluation[] = []
  const strengths: string[] = []
  const supportNeeds: string[] = []

  // 1. Joint Attention & Social Referencing
  const jaTrials = t.jaTrials ?? 6
  const jaCorrect = t.jaCorrect ?? 0
  const jaPct = jaTrials > 0 ? Math.round((jaCorrect / jaTrials) * 100) : 0
  const jaMs = t.jaMedianMs !== null ? Math.round(t.jaMedianMs) : null

  let jaTone: 'strength' | 'support' | 'steady' = 'steady'
  let jaRating = 'Developing Joint Attention Referencing'
  let jaNarrative = ''
  let jaImpact = ''

  if (jaPct >= 80) {
    jaTone = 'strength'
    jaRating = `Strong Social Gaze Orientation (${jaPct}% Alignment)`
    jaNarrative = `${childName} consistently followed non-verbal eye-gaze and pointing vectors (${jaCorrect}/${jaTrials} trials matched), with an orienting latency of ${jaMs ?? 800}ms. This demonstrates intact triadic joint attention and intuitive social-referential cue interpretation in interactive visual contexts.`
    jaImpact = `Quickly notices non-verbal social cues from teachers and peers; readily shares attention toward shared classroom objects or demonstration points.`
    strengths.push('Intuitive joint attention and gaze-following orientation')
  } else {
    jaTone = 'support'
    jaRating = `Autonomous Visual Exploration (${jaPct}% Social Alignment)`
    jaNarrative = `${childName} directed attention independently of the social gaze or pointing vectors in ${jaTrials - jaCorrect} of ${jaTrials} trials. This reflects an autonomous visual exploration style where attention is guided by intrinsic visual interest in objects rather than extrinsic social cues.`
    jaImpact = `May not immediately look where a teacher or parent points across the room. Pairing pointing with explicit direct verbal prompts ('Look here at the board, please') ensures shared focus.`
    supportNeeds.push('Verbal reinforcement for non-verbal pointing and gaze directions')
  }

  domains.push({
    id: 'gaze',
    title: 'Joint Attention & Social Gaze Referencing',
    chapterName: 'Joint Attention & Social Referencing Paradigm',
    clinicalRating: jaRating,
    statusTone: jaTone,
    narrativeAnalysis: jaNarrative,
    indicators: [
      {label: 'Gaze Following Match', value: `${jaPct}%`, context: `${jaCorrect} of ${jaTrials} trials aligned`},
      {label: 'Orienting Latency', value: jaMs ? `${jaMs} ms` : 'N/A', context: 'Time to reference and choose'},
    ],
    realWorldImpact: jaImpact,
  })

  // 2. Affective Emotion Recognition
  const fTrials = t.feelingsTrials ?? 4
  const fCorrect = t.feelingsCorrect ?? 0
  const fPct = fTrials > 0 ? Math.round((fCorrect / fTrials) * 100) : 0

  let fTone: 'strength' | 'support' | 'steady' = 'steady'
  let fRating = 'Developing Emotion Discrimination'
  let fNarrative = ''
  let fImpact = ''

  if (fPct >= 75) {
    fTone = 'strength'
    fRating = `Keen Facial Affect Discrimination (${fPct}% Accuracy)`
    fNarrative = `${childName} accurately identified and matched ${fCorrect} of ${fTrials} facial emotion expressions. This indicates strong foundational decoding of facial affect and recognition of discrete non-verbal emotional states.`
    fImpact = `Readily interprets peer emotional expressions in social group play; can identify when someone is happy, surprised, calm, or upset.`
    strengths.push('Sharp non-verbal emotion discrimination and facial affect decoding')
  } else {
    fTone = 'support'
    fRating = `Subtle Affect Interpretation Edge (${fPct}% Accuracy)`
    fNarrative = `${childName} correctly matched ${fCorrect} of ${fTrials} facial expressions, finding nuanced emotional variations (e.g. calm vs worried) ambiguous without contextual story clues.`
    fImpact = `May benefit from explicit verbal labeling of peer emotions and feelings charts during social situations.`
    supportNeeds.push('Explicit emotional vocabulary and contextual feeling cues')
  }

  domains.push({
    id: 'feelings',
    title: 'Affective Discrimination & Emotion Decoding',
    chapterName: 'Facial Affect Discrimination & Emotion Recognition Task',
    clinicalRating: fRating,
    statusTone: fTone,
    narrativeAnalysis: fNarrative,
    indicators: [
      {label: 'Emotion Match Accuracy', value: `${fPct}%`, context: `${fCorrect} of ${fTrials} expressions identified`},
    ],
    realWorldImpact: fImpact,
  })

  // 3. Sensory Modulation
  const light = t.lightLevel !== null ? Math.round(t.lightLevel) : null
  const sound = t.soundLevel !== null ? Math.round(t.soundLevel) : null
  const touch = t.touchLevel !== null ? Math.round(t.touchLevel) : null

  let sensoryNarrative = `${childName} calibrated their comfortable sensory thresholds: Illumination ${light !== null ? `${light}/10` : 'Default'}, Acoustics ${sound !== null ? `${sound}/10` : 'Default'}, Tactile Pressure ${touch !== null ? `${touch}/10` : 'Default'}.`
  if (light !== null && light <= 3) sensoryNarrative += ' Marked preference for subdued, soft lighting to avoid visual overstimulation.'
  if (sound !== null && sound <= 3) sensoryNarrative += ' Sensitivity to auditory volume; thrives with gentle, low-decibel soundscapes.'
  if (touch !== null && touch >= 7) sensoryNarrative += ' Deep tactile seeking; finds weighted, plush textures calming.'

  domains.push({
    id: 'sensory',
    title: 'Sensory Comfort & Environmental Modulation',
    chapterName: 'Sensory Modulation & Comfort Boundaries (SPM-2 Framework)',
    clinicalRating: 'Calibrated Sensory Comfort Blueprint',
    statusTone: 'steady',
    narrativeAnalysis: sensoryNarrative,
    indicators: [
      {label: 'Illumination Preference', value: light !== null ? `${light} / 10` : 'N/A', context: light && light <= 4 ? 'Low-glare preference' : 'Comfortable with standard light'},
      {label: 'Acoustic Sound Comfort', value: sound !== null ? `${sound} / 10` : 'N/A', context: sound && sound <= 4 ? 'Auditory softness seeking' : 'Comfortable with sound'},
      {label: 'Tactile Grounding', value: touch !== null ? `${touch} / 10` : 'N/A', context: touch && touch >= 6 ? 'Deep pressure seeking' : 'Standard touch preference'},
    ],
    realWorldImpact: 'Sensory modifications (dimmed lighting, noise-softening headphones, weighted lap cushions) directly regulate emotional stability and focus.',
  })

  // 4. Cognitive Set-Shifting
  const preCorrect = t.sortPreCorrect ?? 3
  const preTotal = t.sortPreTotal ?? 3
  const postCorrect = t.sortPostCorrect ?? 2
  const postTotal = t.sortPostTotal ?? 3

  let sortTone: 'strength' | 'support' | 'steady' = 'steady'
  let sortRating = 'Developing Rule Flexibility'
  let sortNarrative = ''
  let sortImpact = ''

  if (postCorrect >= 2) {
    sortTone = 'strength'
    sortRating = `Flexible Set-Shifting (${postCorrect}/${postTotal} Post-Shift Accuracy)`
    sortNarrative = `${childName} adapted smoothly when the sorting criteria transitioned from color to shape, sorting ${postCorrect} of ${postTotal} items correctly under the new rule. This shows strong cognitive flexibility and minimal perseverative interference.`
    sortImpact = `Adapts smoothly to routine schedule changes, transition between subjects, and rule variations in games.`
    strengths.push('Cognitive flexibility and adaptive set-shifting')
  } else {
    sortTone = 'support'
    sortRating = `Perseverative Tendency During Rule Shifts`
    sortNarrative = `${childName} mastered the initial color sorting (${preCorrect}/${preTotal}), but continued applying the color rule after the transition to shape. This reflects a perseverative set bias where established rules resist sudden cognitive modification.`
    sortImpact = `Transitions between tasks or sudden changes in daily schedule may cause frustration. Providing 5-minute advance transition countdowns and clear visual 'change alerts' will offer tremendous support.`
    supportNeeds.push('Transition scaffolding when established routines change')
  }

  domains.push({
    id: 'sorting',
    title: 'Cognitive Flexibility & Rule Set-Shifting',
    chapterName: 'Cognitive Set-Shifting & Rule Flexibility (Wisconsin Standard)',
    clinicalRating: sortRating,
    statusTone: sortTone,
    narrativeAnalysis: sortNarrative,
    indicators: [
      {label: 'Pre-Shift Rule Accuracy', value: `${preCorrect} / ${preTotal}`, context: 'Initial color rule sorting'},
      {label: 'Post-Shift Set Adaptation', value: `${postCorrect} / ${postTotal}`, context: 'Shape rule set adaptation'},
    ],
    realWorldImpact: sortImpact,
  })

  const archetype = jaPct >= 80 && postCorrect >= 2
    ? 'Socially Receptive & Cognitively Adaptive Harmonizer'
    : postCorrect >= 2
    ? 'Systemizing Pattern Seeker with High Cognitive Flexibility'
    : 'Perceptive Visual Observer with Routine Grounding'

  const parentInterpretation: ParentInterpretation = {
    assessmentFocus: 'Autism, Social Communication & Sensory Processing',
    whatItReveals: `${childName} completed an interactive developmental assessment examining non-verbal joint attention gaze referencing, facial affect decoding, sensory processing thresholds, and cognitive set-shifting flexibility. ${
      jaPct >= 80
        ? `${childName} demonstrates intuitive social gaze referencing, readily following non-verbal directional cues.`
        : `${childName} shows an autonomous visual exploration style, directing attention by personal interest in objects rather than social pointing cues.`
    }`,
    classroomImplications: [
      jaPct < 80
        ? 'Pair pointing gestures with direct verbal prompts ("Look here at the board, please") to ensure shared visual attention during teaching.'
        : 'Easily catches non-verbal teacher demonstration gestures across the room.',
      postCorrect < 2
        ? 'Sudden changes in schedule or unexpected disruptions to routines can trigger anxiety. Providing visual "Now / Next" schedules and 5-minute countdown warnings prevents transition stress.'
        : 'Demonstrates flexible cognitive adaptation when classroom rules or schedules switch.',
      (light && light <= 3) || (sound && sound <= 4)
        ? 'Sensory sensitivity to bright lighting or noisy group activities. Access to a quiet break corner or noise-softening headphones significantly prevents sensory fatigue.'
        : 'Comfortable with standard classroom illumination and auditory levels.',
    ],
    homeRecommendations: [
      'Create a predictable daily visual schedule at home for morning routines, homework, and bedtime.',
      'Designate a cozy sensory sanctuary at home with dimmable lighting, soft cushions, and low ambient noise where your child can decompress.',
      'Give advance verbal and visual warnings before transitioning away from high-interest activities ("In 5 minutes, we are closing the tablet and sitting down for dinner").',
      'Use explicit feeling charts with real facial photos to build nuanced emotional vocabulary for self-advocacy.',
    ],
    discussionPrompts: [
      'Does my child respond more reliably to direct verbal cues than non-verbal pointing or eye-gaze gestures in class?',
      'Are there specific sensory triggers (fluorescent lights, cafeteria noise, fire drills) that lead to sensory overload?',
      'How does my child manage transitions between subjects, and would a visual desk schedule help?',
      'Would a quiet calm-down space or sensory break protocol benefit my child during the school day?',
    ],
  }

  return {
    archetype,
    tempoLabel: 'Calm & Deliberate Pacing',
    staminaLabel: 'Predictable Sensory Flow Maintained',
    executiveSummary: `${childName} demonstrated a distinctive cognitive profile characterized by deep visual focus and personalized sensory comfort preferences. They engaged meaningfully across social gaze referencing, emotion matching, sensory calibration, and rule-based set-shifting.`,
    keyStrengths: strengths.length ? strengths : ['Focused visual engagement in structured tasks'],
    supportOpportunities: supportNeeds.length ? supportNeeds : ['Structured sensory breaks and transition warnings'],
    domains,
    parentInterpretation,
  }
}

function generateDyslexiaCognitiveProfile(
  t: Record<string, number | null>,
  childName: string,
  childAge: number | null
): CognitiveProfile {
  const domains: DomainEvaluation[] = []
  const strengths: string[] = []
  const supportNeeds: string[] = []

  // 1. Phonological Awareness & Rhyme Sensitivity
  const rhTrials = t.rhymeTrials ?? 12
  const rhCorrect = t.rhymeCorrect ?? 0
  const rhPct = rhTrials > 0 ? Math.round((rhCorrect / rhTrials) * 100) : 0
  const rhMs = t.rhymeMedianMs !== null ? Math.round(t.rhymeMedianMs) : null

  let rhTone: 'strength' | 'support' | 'steady' = 'steady'
  let rhRating = 'Age-Appropriate Rhyme Awareness'
  let rhNarrative = ''
  let rhImpact = ''

  if (rhPct >= 85) {
    rhTone = 'strength'
    rhRating = `Strong Phonological Rhyme Sensitivity (${rhPct}% Accuracy)`
    rhNarrative = `${childName} demonstrated excellent phonological awareness, identifying ${rhCorrect} of ${rhTrials} rhyming word pairs (${rhPct}% accuracy)${rhMs ? ` with an average response time of ${rhMs}ms` : ''}. This reflects robust auditory phonological representations and strong sensitivity to word rimes without requiring printed text.`
    rhImpact = `Quickly grasps rhyming games, nursery rhymes, and poem structures; well-prepared for phonics-based reading instruction.`
    strengths.push('Exceptional auditory rhyme sensitivity and phonological awareness')
  } else if (rhPct < 65 && rhTrials >= 6) {
    rhTone = 'support'
    rhRating = `Emerging Phonological Sensitivity (${rhPct}% Accuracy)`
    rhNarrative = `${childName} correctly matched ${rhCorrect} of ${rhTrials} rhyming pairs (${rhPct}% accuracy). Differentiating words that end with subtle similar phonemes (e.g., pen/hen vs pan) proved challenging, indicating that auditory phonological boundaries are still developing.`
    rhImpact = `May struggle to isolate ending sounds in words during phonics exercises. Multi-sensory auditory games and rhyming songs with physical clapping will build phonemic sensitivity.`
    supportNeeds.push('Auditory rhyme discrimination and ending sound identification')
  } else {
    rhRating = `Developing Phonological Rhyme Sensitivity (${rhPct}% Accuracy)`
    rhNarrative = `${childName} identified ${rhCorrect} of ${rhTrials} rhyming pairs accurately (${rhPct}%). Demonstrates typical early phonological awareness.`
    rhImpact = `Functional grasp of word rhymes; continues to benefit from routine read-aloud practice.`
  }

  domains.push({
    id: 'rhyme',
    title: 'Phonological Awareness & Rhyme Sensitivity',
    chapterName: 'Auditory Rhyme Judgment Task',
    clinicalRating: rhRating,
    statusTone: rhTone,
    narrativeAnalysis: rhNarrative,
    indicators: [
      {label: 'Rhyme Accuracy', value: `${rhPct}%`, context: `${rhCorrect} of ${rhTrials} pairs matched`},
      {label: 'Processing Speed', value: rhMs ? `${rhMs} ms` : 'N/A', context: 'Average response latency'},
    ],
    realWorldImpact: rhImpact,
  })

  // 2. Phonemic Discrimination (Initial Sounds)
  const fsTrials = t.firstSoundTrials ?? 12
  const fsCorrect = t.firstSoundCorrect ?? 0
  const fsPct = fsTrials > 0 ? Math.round((fsCorrect / fsTrials) * 100) : 0
  const fsMs = t.firstSoundMedianMs !== null ? Math.round(t.firstSoundMedianMs) : null

  let fsTone: 'strength' | 'support' | 'steady' = 'steady'
  let fsRating = 'Typical Initial Phoneme Isolation'
  let fsNarrative = ''
  let fsImpact = ''

  if (fsPct >= 85) {
    fsTone = 'strength'
    fsRating = `Sharp Phonemic Segmentation (${fsPct}% Accuracy)`
    fsNarrative = `${childName} successfully isolated the starting sound across ${fsCorrect} of ${fsTrials} spoken words (${fsPct}% accuracy). This demonstrates sharp phoneme segmentation skills, which are fundamental to mapping letters to sounds (grapheme-phoneme correspondence).`
    fsImpact = `Readily identifies which words start with the same sound; easily links spoken consonants to their written letters.`
    strengths.push('Sharp phonemic segmentation and onset sound isolation')
  } else if (fsPct < 65 && fsTrials >= 6) {
    fsTone = 'support'
    fsRating = `Vulnerable Phoneme Segmentation (${fsPct}% Accuracy)`
    fsNarrative = `${childName} matched ${fsCorrect} of ${fsTrials} starting sounds (${fsPct}%). Separating the initial consonant from the rest of the word required notable effort, suggesting phonemic segmentation requires structured scaffolding.`
    fsImpact = `May find it hard to sound out the first letter of unfamiliar words when reading or spelling. Practicing sound isolation with visual Elkonin sound boxes will strengthen this skill.`
    supportNeeds.push('Initial phoneme isolation and word sound segmentation')
  } else {
    fsRating = `Developing Phoneme Segmentation (${fsPct}% Accuracy)`
    fsNarrative = `${childName} correctly matched ${fsCorrect} of ${fsTrials} starting sounds (${fsPct}%). Performance aligns with typical developmental progression.`
    fsImpact = `Able to isolate initial sounds with occasional teacher modeling.`
  }

  domains.push({
    id: 'firstSound',
    title: 'Phonemic Segmentation & Onset Isolation',
    chapterName: 'Initial Phoneme Discrimination Task',
    clinicalRating: fsRating,
    statusTone: fsTone,
    narrativeAnalysis: fsNarrative,
    indicators: [
      {label: 'Initial Sound Accuracy', value: `${fsPct}%`, context: `${fsCorrect} of ${fsTrials} onset sounds correct`},
      {label: 'Decision Speed', value: fsMs ? `${fsMs} ms` : 'N/A', context: 'Average response latency'},
    ],
    realWorldImpact: fsImpact,
  })

  // 3. Orthographic Letter Orientation & Mirror Invariance
  const lHits = t.letterHits ?? 0
  const lPossible = t.letterPossible ?? 16
  const lFalse = t.letterFalse ?? 0
  const lMirror = t.letterMirrorFalse ?? 0
  const lAccuracy = lPossible > 0 ? Math.round((lHits / lPossible) * 100) : 0

  let lTone: 'strength' | 'support' | 'steady' = 'steady'
  let lRating = 'Stable Letter Orientation Processing'
  let lNarrative = ''
  let lImpact = ''

  if (lMirror >= 3) {
    lTone = 'support'
    lRating = `Pronounced Mirror Letter Confusion (${lMirror} b/d/p/q Reversals)`
    lNarrative = `${childName} demonstrated difficulty distinguishing mirrored letterforms, selecting mirrored variants (b vs d, or p vs q) on ${lMirror} occasions. The human brain naturally treats mirror images as identical objects (mirror invariance); unlearning this for reading requires dedicated orthographic suppression.`
    lImpact = `Frequently reverses b and d or p and q during handwriting and reading. Tactile letter tracing (sandpaper letters) and directional visual cues ('b has a belly, d has a diaper') will accelerate stabilization.`
    supportNeeds.push('Orthographic discrimination for mirrored letters (b, d, p, q)')
  } else if (lAccuracy >= 85 && lFalse <= 1) {
    lTone = 'strength'
    lRating = `Robust Orthographic Directionality (${lAccuracy}% Target Hits)`
    lNarrative = `${childName} accurately identified ${lHits} of ${lPossible} target letterforms with minimal false alarms (${lFalse} errors, ${lMirror} mirror reversals). This demonstrates mature visual-orthographic discrimination and effective suppression of mirror invariance.`
    lImpact = `Confidently distinguishes confusable letters; reads and copies text with stable letter orientation.`
    strengths.push('Robust visual-orthographic letter orientation and mirror suppression')
  } else {
    lRating = `Developing Orthographic Discrimination (${lAccuracy}% Accuracy)`
    lNarrative = `${childName} found ${lHits} of ${lPossible} target letters with ${lMirror} mirror errors, consistent with typical developmental milestones for emerging readers.`
    lImpact = `Occasional letter reversals that are expected at this age and resolve with reading practice.`
  }

  domains.push({
    id: 'letters',
    title: 'Orthographic Letter Orientation & Discrimination',
    chapterName: 'Letter Orientation Discrimination Task (b, d, p, q)',
    clinicalRating: lRating,
    statusTone: lTone,
    narrativeAnalysis: lNarrative,
    indicators: [
      {label: 'Target Detection', value: `${lAccuracy}%`, context: `${lHits} of ${lPossible} target letters found`},
      {label: 'Mirror Reversals', value: `${lMirror}`, context: `${lMirror} b/d/p/q mirror pair confusions`},
      {label: 'Total False Taps', value: `${lFalse}`, context: 'Non-target letters selected'},
    ],
    realWorldImpact: lImpact,
  })

  // 4. Auditory Phonological Working Memory (Syllable Span)
  const spanLongest = t.soundSpanLongest !== null ? Math.round(t.soundSpanLongest) : 0
  const expectedSpan = childAge && childAge <= 6 ? 2 : childAge && childAge <= 9 ? 3 : 4

  let spanTone: 'strength' | 'support' | 'steady' = 'steady'
  let spanRating = 'Typical Phonological Working Memory'
  let spanNarrative = ''
  let spanImpact = ''

  if (spanLongest >= expectedSpan + 1) {
    spanTone = 'strength'
    spanRating = `Advanced Phonological Sequence Span (${spanLongest} Syllables)`
    spanNarrative = `${childName} reliably remembered and repeated sequences of up to ${spanLongest} novel nonsense syllables in exact order, exceeding the expected developmental milestone (${expectedSpan} syllables). This demonstrates an expansive auditory-phonological loop capacity.`
    spanImpact = `Easily retains multi-syllabic unfamiliar vocabulary words, foreign language phrases, and complex multi-part verbal directions.`
    strengths.push(`Expansive auditory phonological working memory span (${spanLongest} syllables)`)
  } else if (spanLongest < expectedSpan && spanLongest > 0) {
    spanTone = 'support'
    spanRating = `Vulnerable Phonological Working Memory (${spanLongest} Syllables)`
    spanNarrative = `${childName} recalled sequences of up to ${spanLongest} syllables. Retaining ${spanLongest + 1} or more unfamiliar sound chunks caused sequence breakdown, indicating the phonological loop is easily overloaded by auditory sequences.`
    spanImpact = `May lose the beginning of long multi-syllable words when sounding them out, or forget the end of multi-step verbal teacher directions. Supplementing speech with visual cues and breaking words into bite-sized chunks will provide vital support.`
    supportNeeds.push('Phonological working memory scaffolding for auditory sequences')
  } else {
    spanRating = `Age-Appropriate Phonological Memory (${spanLongest} Syllables)`
    spanNarrative = `${childName} repeated ${spanLongest} sequential sound syllables in accurate order, meeting expected benchmarks (${expectedSpan} syllables).`
    spanImpact = `Typical ability to retain and repeat spoken words and directions.`
  }

  domains.push({
    id: 'span',
    title: 'Auditory Phonological Working Memory (Sound Span)',
    chapterName: 'Nonsense Syllable Sequence Repetition Task',
    clinicalRating: spanRating,
    statusTone: spanTone,
    narrativeAnalysis: spanNarrative,
    indicators: [
      {label: 'Longest Sound Span', value: `${spanLongest} syllables`, context: `Age milestone: ${expectedSpan} syllables`},
      {label: 'Phonological Loop', value: spanLongest >= expectedSpan ? 'Intact' : 'Developing', context: 'Auditory rehearsal stability'},
    ],
    realWorldImpact: spanImpact,
  })

  // 5. Lexical Decoding & Pseudoword Phonics (Word Check)
  const wRealCorrect = t.wordRealCorrect ?? 0
  const wRealTotal = t.wordRealTotal ?? 6
  const wMadeCorrect = t.wordMadeCorrect ?? 0
  const wMadeTotal = t.wordMadeTotal ?? 6
  const wRealPct = wRealTotal > 0 ? Math.round((wRealCorrect / wRealTotal) * 100) : 0
  const wMadePct = wMadeTotal > 0 ? Math.round((wMadeCorrect / wMadeTotal) * 100) : 0
  const wMs = t.wordMedianMs !== null ? Math.round(t.wordMedianMs) : null

  if (wRealTotal > 0 || wMadeTotal > 0) {
    let wTone: 'strength' | 'support' | 'steady' = 'steady'
    let wRating = 'Balanced Lexical & Phonic Decoding'
    let wNarrative = ''
    let wImpact = ''

    if (wMadePct < 60 && wRealPct >= 70) {
      wTone = 'support'
      wRating = 'Phonological Decoding Gap (Pseudoword Vulnerability)'
      wNarrative = `${childName} recognized ${wRealPct}% of real sight words, but struggled to distinguish novel pseudowords (${wMadePct}% accuracy). In reading science, nonword/pseudoword decoding specifically isolates phonological recoding from whole-word visual memorization. This profile suggests reliance on visual sight-word memory rather than fluent phonological decoding.`
      wImpact = `May read familiar vocabulary words smoothly but stumble, guess, or substitute words when encountering unfamiliar or novel technical terms. Systematic synthetic phonics instruction will directly bridge this gap.`
      supportNeeds.push('Synthetic phonics decoding for unfamiliar words and pseudowords')
    } else if (wMadePct >= 80 && wRealPct >= 80) {
      wTone = 'strength'
      wRating = `Proficient Dual-Route Decoding (${wRealPct}% Real / ${wMadePct}% Pseudoword)`
      wNarrative = `${childName} demonstrated balanced proficiency across both real vocabulary (${wRealPct}%) and novel pseudoword decoding (${wMadePct}%)${wMs ? ` with an average response time of ${wMs}ms` : ''}. This indicates intact dual-route reading processing (both visual-orthographic sight access and phonological decoding).`
      wImpact = `Comfortably decodes new words in grade-level texts; demonstrates solid phonics foundations for independent reading.`
      strengths.push('Proficient dual-route reading (sight vocabulary and phonological decoding)')
    } else {
      wRating = `Developing Word Decoding (${wRealPct}% Real / ${wMadePct}% Pseudoword)`
      wNarrative = `${childName} identified ${wRealCorrect}/${wRealTotal} real words and ${wMadeCorrect}/${wMadeTotal} made-up words. Decoding skills are progressing normally for their age.`
      wImpact = `Functional reading decoding; benefits from guided shared reading.`
    }

    domains.push({
      id: 'words',
      title: 'Lexical Access & Pseudoword Phonological Decoding',
      chapterName: 'Real vs Pseudoword Discrimination Task',
      clinicalRating: wRating,
      statusTone: wTone,
      narrativeAnalysis: wNarrative,
      indicators: [
        {label: 'Real Word Recognition', value: `${wRealPct}%`, context: `${wRealCorrect} of ${wRealTotal} real words`},
        {label: 'Pseudoword Decoding', value: `${wMadePct}%`, context: `${wMadeCorrect} of ${wMadeTotal} nonwords identified`},
        {label: 'Decoding Latency', value: wMs ? `${wMs} ms` : 'N/A', context: 'Average reading decision time'},
      ],
      realWorldImpact: wImpact,
    })
  }

  const archetype = rhPct >= 80 && fsPct >= 80 && spanLongest >= expectedSpan
    ? 'Auditory-Phonetic Analyzer & Fluid Sound Processor'
    : lAccuracy >= 85 && wRealPct >= 80
    ? 'Visual-Orthographic Specialist with Whole-Word Memory'
    : 'Emerging Multi-Sensory Phonics Explorer'

  const parentInterpretation: ParentInterpretation = {
    assessmentFocus: 'Reading, Dyslexia & Phonological Development',
    whatItReveals: `${childName} participated in a standardized cognitive screener examining phonological awareness, letter orientation discrimination, phonological working memory, and lexical decoding. ${
      rhPct >= 80 && fsPct >= 80
        ? `${childName} shows strong auditory foundations for reading, readily segmenting sounds and recognizing rhymes.`
        : `${childName} demonstrates emerging phonological processing, showing that auditory sound segmentation benefits from intentional multi-sensory support.`
    }`,
    classroomImplications: [
      lMirror >= 2
        ? 'Letter reversals (such as b and d) are still stabilizing. Avoid penalizing mirror reversals on timed spelling or reading tasks.'
        : 'Letter orientation is stable, supporting fluent text copying and writing.',
      spanLongest < expectedSpan
        ? 'Multi-step verbal directions (e.g. 3 instructions given in a row) may overload the auditory memory loop. Supplement verbal speech with visual step cards.'
        : 'Comfortably tracks multi-step classroom instructions and retains spoken vocabulary.',
      wMadePct < 60
        ? 'When reading new or unfamiliar words, encourage sounding out phoneme by phoneme rather than guessing from the first letter or picture clues.'
        : 'Shows solid phonological blending when encountering unfamiliar words in grade-level texts.',
    ],
    homeRecommendations: [
      'Read aloud together daily for 10-15 minutes, alternating paragraphs so your child hears fluent pacing without reading fatigue.',
      'Utilize audiobooks paired with physical books (ear-reading) so your child can enjoy rich stories and build vocabulary above their independent decoding level.',
      'Practice playful auditory sound games in the car or kitchen (e.g. "I spy something that rhymes with cat", or "What sounds do you hear in \'sun\'?").',
      'For letter reversals, provide tactile memory aids such as tracing letters in kinetic sand or making "b" and "d" with thumbs and index fingers (the "bed" trick).',
    ],
    discussionPrompts: [
      'How does my child’s phonological awareness and sound blending compare to classroom benchmarks?',
      'Would my child benefit from structured, multi-sensory synthetic phonics instruction (such as Orton-Gillingham)?',
      'Can my child be allowed extra time on reading assessments and have test instructions read aloud when needed?',
      'Are letter reversals or decoding hesitations noticed during independent silent reading?',
    ],
  }

  return {
    archetype,
    tempoLabel: 'Deliberate Auditory-Visual Pacing',
    staminaLabel: 'Consistent Task Engagement Maintained',
    executiveSummary: `${childName} completed the multi-domain reading and sound assessment, evaluating phonological awareness, initial phoneme segmentation, letter orientation (b/d/p/q), sound sequence memory, and word decoding. ${
      strengths.length ? `Core strengths include ${strengths[0].toLowerCase()}.` : ''
    } ${
      supportNeeds.length ? `Areas for growth and support include ${supportNeeds[0].toLowerCase()}.` : ''
    }`,
    keyStrengths: strengths.length ? strengths : ['Enthusiastic engagement in auditory sound activities'],
    supportOpportunities: supportNeeds.length ? supportNeeds : ['Continued multi-sensory reading and shared read-alouds'],
    domains,
    parentInterpretation,
  }
}

function buildSuperpowers(type: 'adhd' | 'autism' | 'dyslexia', childName: string, guildClass: string) {
  if (type === 'adhd') {
    return {
      realmTitle: 'High Guardian of the Sunbird Sky Realm',
      crestBadge: 'Order of the Golden Sunstone',
      elementalAffinity: guildClass || 'Canopy Sky Ranger',
      badges: [
        {name: 'Sunbird Watch', desc: 'Kept watch for the golden sunbird across the Sky Citadel.', icon: 'lightning', rank: 'Chapter 1'},
        {name: 'Cosmic Wayfinder', desc: 'Steered through the meteor shower by following the golden centre star.', icon: 'compass', rank: 'Chapter 2'},
        {name: 'Constellation Harmonizer', desc: 'Woke the starlight astrolabe by replaying its sequence of stars.', icon: 'starlight', rank: 'Chapter 3'},
        {name: 'Sunstone Patience', desc: 'Practised holding the Sunstone until the star chime rang.', icon: 'rocket', rank: 'Chapter 4'},
      ],
      miloScroll: `Hoot hoot, brave ${childName}! You finished the whole Sky Citadel quest. Every chapter was a new challenge, and you took each one on. Wear your Golden Sunstone crest with pride!`,
    }
  }
  if (type === 'dyslexia') {
    return {
      realmTitle: 'Master Story-Keeper of The Whispering Library',
      crestBadge: 'Crest of the Golden Starlight Quill',
      elementalAffinity: guildClass || 'Echo Scribe',
      badges: [
        {name: 'Rhyme Harmony Seeker', desc: 'Listened closely to the echoes and matched musical rhyming words.', icon: 'star', rank: 'Chapter 1'},
        {name: 'Sound Stone Master', desc: 'Isolated initial word sounds with precision and speed.', icon: 'crystal', rank: 'Chapter 2'},
        {name: 'Rune Lantern Detective', desc: 'Discovered target letters and conquered tricky mirror shapes.', icon: 'compass', rank: 'Chapter 3'},
        {name: 'Syllable Echo Sage', desc: 'Repeated long sequences of singing syllables from memory.', icon: 'lightning', rank: 'Chapter 4'},
      ],
      miloScroll: `Hoot hoot, brilliant Scholar ${childName}! You explored every nook of The Whispering Library with Pip the Owl. Wear your Golden Quill crest with pride!`,
    }
  }
  return {
    realmTitle: 'Grand High Alchemist of the Whispering Groves',
    crestBadge: 'Crest of the Sacred Lotus Crystal',
    elementalAffinity: guildClass || 'Grove Harmonizer',
    badges: [
      {name: 'Eagle Eye Pattern Seer', desc: 'Followed social cues to uncover hidden treasures.', icon: 'magnifier', rank: 'Chapter 1'},
      {name: 'Heart Harmony Empath', desc: 'Recognized and matched feelings in the crystal mirror.', icon: 'heart', rank: 'Chapter 2'},
      {name: 'Sanctuary Architect', desc: 'Set up a cosy sanctuary with gentle illumination, rain and soft cushions.', icon: 'leaf', rank: 'Chapter 3'},
      {name: 'Crystal Sorter', desc: 'Sorted glowing crystal gems as the magic rules shifted.', icon: 'crystal', rank: 'Chapter 4'},
    ],
    miloScroll: `Namaste, gentle Guardian ${childName}! You finished every chapter of the Whispering Groves. Thank you for playing, and for showing us what feels cosy to you. Wear your Lotus Crystal crest with pride!`,
  }
}

const ADHD_QUESTIONS = [
  'Does what you saw in the session match what you notice at home or in the classroom?',
  'How did your child seem while engaging: eager, tired, restless, or focused? Share this with the clinician.',
  'Which tasks or situations seem most demanding for your child, and where do they thrive effortlessly?',
  'Would a comprehensive psychoeducational evaluation by a pediatrician or clinical psychologist provide valuable clarity?',
]

const AUTISM_QUESTIONS = [
  'Does how your child responded to social cues in the activities mirror everyday social communication at home or school?',
  'Which sensory stimuli (lighting, background sounds, clothing textures) seem overwhelming, and which offer calming comfort?',
  'What kinds of activities does your child find most engaging and restorative?',
  'Would a neurodevelopmental evaluation by a qualified specialist be helpful for personalized scaffolding?',
]

const DYSLEXIA_QUESTIONS = [
  'Does your child hesitate, guess, or experience fatigue when reading unfamiliar words out loud?',
  'Are mirror letter mix-ups (like confusing b, d, p, or q) commonly noticed during handwriting or reading?',
  'How does your child retain multi-step spoken instructions at home or in class?',
  'Would a formal phonological and educational evaluation help ensure your child receives appropriate reading accommodations?',
]

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Raw
    const assessmentType = body?.assessmentType
    if (assessmentType !== 'adhd' && assessmentType !== 'autism' && assessmentType !== 'dyslexia') {
      return NextResponse.json({error: 'Unknown activity'}, {status: 400})
    }

    const defaultName = assessmentType === 'adhd' ? 'Canopy Ranger' : assessmentType === 'dyslexia' ? 'Echo Scribe' : 'Grove Seeker'
    const childName = cleanText(body.childName, 40, defaultName)
    const guildClass = cleanText(body.guildClass, 40, '')
    const telemetry = cleanTelemetry(body.telemetry)
    const record = buildSessionRecord({
      quest: assessmentType,
      ageYears: cleanAge(body.childAge),
      telemetry,
      environment: cleanEnvironment(body.environment, req.headers.get('user-agent')),
      instrumentVersion: INSTRUMENT_VERSION,
    })

    if (assessmentType === 'adhd') {
      const rounds = cleanRounds(body.cptBlocks, telemetry)
      if (rounds) {
        ;(record as SessionRecord & {sunbirdRounds?: SunbirdRounds}).sunbirdRounds = rounds
        record.measures.push(...roundMeasures(rounds, telemetry))
      }
      const steer = steeringTrials(body.steerTrials, telemetry)
      if (steer) record.steeringTrials = steer
      const stars = starLevels(body.starLevels, telemetry)
      if (stars) record.starLevels = stars
    }

    const indices =
      assessmentType === 'adhd'
        ? adhdObservations(telemetry)
        : assessmentType === 'dyslexia'
        ? dyslexiaObservations(telemetry)
        : autismObservations(telemetry)

    const withData = indices.filter((o) => o.value !== NOT_ENOUGH).length

    const cognitiveProfile =
      assessmentType === 'adhd'
        ? generateAdhdCognitiveProfile(telemetry, childName, cleanAge(body.childAge))
        : assessmentType === 'dyslexia'
        ? generateDyslexiaCognitiveProfile(telemetry, childName, cleanAge(body.childAge))
        : generateAutismCognitiveProfile(telemetry, childName)

    const instrumentNames: Record<string, string> = {
      adhd: 'Manas Attention & Executive Function Activity',
      autism: 'Manas Social Communication & Sensory Activity',
      dyslexia: 'Manas Reading & Phonology Activity',
    }

    const questionsMap: Record<string, string[]> = {
      adhd: ADHD_QUESTIONS,
      autism: AUTISM_QUESTIONS,
      dyslexia: DYSLEXIA_QUESTIONS,
    }

    const ideasMap: Record<string, typeof ADHD_IDEAS> = {
      adhd: ADHD_IDEAS,
      autism: AUTISM_IDEAS,
      dyslexia: DYSLEXIA_IDEAS,
    }

    const state: AssessmentAgentState = {
      assessmentType,
      childName,
      childAge: cleanAge(body.childAge),
      explorerRank: cleanText(body.explorerRank, 40, ''),
      companion: cleanText(body.companion, 40, ''),
      guildClass,
      telemetry,
      record,
      superpowers: buildSuperpowers(assessmentType, childName, guildClass),
      cognitiveProfile,
      clinicalReport: {
        generatedOn: new Date().toLocaleDateString('en-IN', {year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata'}),
        instrument: {name: instrumentNames[assessmentType] || 'Manas Pediatric Play Assessment', version: INSTRUMENT_VERSION},
        summary:
          withData === 0
            ? `${childName} did not complete enough of the activities to yield representative indicators. You are warmly welcome to try again.`
            : `${childName} demonstrated a ${cognitiveProfile.archetype} profile (${cognitiveProfile.tempoLabel}). ${cognitiveProfile.executiveSummary}`,
        indices,
        questions: questionsMap[assessmentType] || ADHD_QUESTIONS,
        accommodations: ideasMap[assessmentType] || ADHD_IDEAS,
        cognitiveProfile,
      },
    }

    return NextResponse.json({success: true, data: state})
  } catch {
    return NextResponse.json({error: 'Could not build the clinical summary'}, {status: 500})
  }
}
