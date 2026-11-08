import {NextResponse} from 'next/server'
import {INSTRUMENT_VERSION} from '../../../../components/assessments/version'
import {buildSessionRecord, cleanEnvironment, roundMeasures, starLevels, steeringTrials, type SessionRecord} from '../../../../components/assessments/session-record'
import {ADHD_IDEAS, AUTISM_IDEAS} from '../../../../components/assessments/ideas'

/**
 * Play-session summary for the Manas quests.
 *
 * This route does NOT diagnose, score against norms, or classify. It turns the counts and
 * reaction times the games recorded into plain-language observations for a parent, and it
 * says "not enough data" whenever a value is missing instead of inventing one.
 * Nothing is stored; the request body is not logged.
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

export interface CognitiveProfile {
  archetype: string
  tempoLabel: string
  staminaLabel: string
  executiveSummary: string
  keyStrengths: string[]
  supportOpportunities: string[]
  domains: DomainEvaluation[]
}

export interface AssessmentAgentState {
  assessmentType: 'adhd' | 'autism'
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
  // ADHD quest
  'cptTrials', 'cptResponses', 'omissions', 'commissions', 'hrtMs', 'rtvMs',
  'flankerCostMs', 'flankerCongruentN', 'flankerIncongruentN', 'workingMemorySpan',
  'prematureReleases', 'chargeTrials',
  // Optional extras the ADHD page can send: denominators, tapping outside the window, first vs second half
  'cptTargets', 'cptNonTargets', 'cptAnticipatory', 'rtFirstHalfMs', 'rtSecondHalfMs',
  'flankerCongruentTotal', 'flankerIncongruentTotal',
  // Autism quest
  'jaTrials', 'jaCorrect', 'jaMedianMs', 'feelingsTrials', 'feelingsCorrect',
  'lightLevel', 'soundLevel', 'touchLevel', 'sortCount', 'sortMedianMs',
  // design the room: level where each sense was said to be too much (0 = never said), slider moves, calm shield taps, seconds to save
  'rampStopLight', 'rampStopSound', 'rampStopTexture', 'adjustLight', 'adjustSound', 'adjustTexture', 'shieldUses', 'designSec',
  'sortPreCorrect', 'sortPreTotal', 'sortPostCorrect', 'sortPostTotal',
  // card by card in the sorting game: box tapped (0 or 1) and time in ms, cards 1 to 6
  'sortBin1', 'sortBin2', 'sortBin3', 'sortBin4', 'sortBin5', 'sortBin6',
  'sortMs1', 'sortMs2', 'sortMs3', 'sortMs4', 'sortMs5', 'sortMs6',
  // encounter by encounter in the gaze game (vessel 0 to 2, time in ms) and round by round in the feelings match (option 0 to 2, time in ms)
  'gazePick1', 'gazePick2', 'gazePick3', 'gazePick4', 'gazePick5', 'gazePick6',
  'gazeMs1', 'gazeMs2', 'gazeMs3', 'gazeMs4', 'gazeMs5', 'gazeMs6',
  'feelingsPick1', 'feelingsPick2', 'feelingsPick3', 'feelingsPick4',
  'feelingsMs1', 'feelingsMs2', 'feelingsMs3', 'feelingsMs4',
  // How the session went (both quests): practice repeats per game, and time the page was hidden
  'retrySunbird', 'retrySteering', 'retryStars', 'retryGaze', 'retryFeelings', 'retrySorting', 'pauseCount', 'pausedSec',
  // the parent card, after the play: option index (0 to 2) for each question
  'parentTired', 'parentLikeHome', 'parentEnjoyed',
  // what helps the sad sprite: 0 a hug, 1 a quiet corner, 2 a story; time in ms
  'helpPick', 'helpMs',
  // 1 when the steering game was the rocket version, 0 for arrows
  'steerRocket',
  // 1 when the star sequence used tones instead of lights, 0 for lights
  'starTone',
  // reversed turn: vessel shown (0 left, 1 centre, 2 right) and time in ms for turns 1 and 2; turns shown and turns with the sparkle
  'showPick1', 'showPick2', 'showMs1', 'showMs2', 'showBids', 'showMatches',
  // quick check straight after the first shape card: 1 shape, 0 colour; time in ms
  'ruleCheck', 'ruleCheckMs',
  // hold-still waits before the sunbird practice: waits, waits with an early tap, average time to tap after the chime
  'holdTries', 'holdEarly', 'holdRtMs',
  // optional camera step (on-device head and eye direction): status 1 used / 0 low quality, seconds observed, % of time the face was seen,
  // % of time turned away, look-away stretches of a second or more, head movement (% of face width per second), and the same per game
  'camStatus', 'camSec', 'camTrackedPct', 'camAwayPct', 'camAwayEvents', 'camMovePct',
  'camAwayPctSunbird', 'camAwayPctSteering', 'camAwayPctStars', 'camMoveSunbird', 'camMoveSteering', 'camMoveStars',
  // optional looking game, autism quest (camera, left-or-right looking): status 1 used / 0 not, calibrated 1 / 0, pictures shown, pictures that counted,
  // % of looking time on the face, % of looking time on the right of the screen, and the face share per picture
  'lookStatus', 'lookCal', 'lookShown', 'lookTrials', 'lookSocialPct', 'lookRightPct',
  'lookPct1', 'lookPct2', 'lookPct3', 'lookPct4', 'lookPct5', 'lookPct6',
  // Reading quest: items and matching answers for the rhyme, first-sound and spelling games, median time (ms) and sound replays
  'rhymeTrials', 'rhymeCorrect', 'rhymeMedianMs', 'rhymeReplays',
  'firstSoundTrials', 'firstSoundCorrect', 'firstSoundMedianMs', 'firstSoundReplays',
  'spellTrials', 'spellCorrect', 'spellMedianMs',
  // letter game: matching letters found of those possible, look-alike taps of look-alike tiles, and how many of the taps were a mirror pair
  'letterRounds', 'letterHits', 'letterPossible', 'letterFalse', 'letterDistractors', 'letterMissed', 'letterMirrorFalse',
  // sound-order game: sequences tried, repeated correctly, and the longest repeated
  'soundSpanAttempts', 'soundSpanPassed', 'soundSpanLongest',
  // word check: real and made-up words, how many were judged correctly, median time (ms)
  'wordTrials', 'wordRealTotal', 'wordRealCorrect', 'wordMadeTotal', 'wordMadeCorrect', 'wordMedianMs',
  // practice repeats in the letter game
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

// Per-round sunbird numbers (ADHD quest, v3 and later). Kept only if they are well formed AND add up to the session totals.
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
  // the rounds must match the totals the page reported, otherwise something is off and we do not report them
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
  'This comes from one short play session. Tiredness, mood, the device and how much your child enjoyed the game can all change it.'

const times = (n: number) => `${n} ${n === 1 ? 'time' : 'times'}`

function adhdObservations(t: Record<string, number | null>): Observation[] {
  const obs: Observation[] = []

  // Sunbird game
  const trials = t.cptTrials
  if (trials !== null && t.omissions !== null && t.commissions !== null) {
    obs.push({
      name: 'Spotting the sunbird',
      value: t.cptTargets !== null && t.cptTargets > 0 ? `Missed the sunbird ${t.omissions} of ${t.cptTargets} times` : `Missed the sunbird ${times(t.omissions)}`,
      detail: [
        t.cptNonTargets !== null && t.cptNonTargets > 0 ? `Tapped on the shadow moth ${t.commissions} of ${t.cptNonTargets} times` : `Tapped on the shadow moth ${times(t.commissions)}`,
        `${trials} sightings in total`,
        t.cptAnticipatory !== null && t.cptAnticipatory > 0 ? `${times(t.cptAnticipatory)} tapped when nothing was on screen, or faster than a reaction is possible` : null,
      ].filter(Boolean).join(' · '),
      note: `The game has ${t.cptTargets ?? 'a small number of'} sunbird sightings, which is still a short sample, so small differences mean little. ${ONE_SESSION}`,
    })
  } else {
    obs.push({name: 'Spotting the sunbird', value: NOT_ENOUGH, detail: 'The game did not finish or did not report back.', note: ONE_SESSION})
  }

  // Tap speed
  if (t.hrtMs !== null && t.rtvMs !== null && (t.cptResponses ?? 0) >= 5) {
    obs.push({
      name: 'Tap speed',
      value: `About ${Math.round(t.hrtMs)} ms on average`,
      detail: `Speed varied by about ${Math.round(t.rtvMs)} ms from tap to tap · ${t.cptResponses} taps recorded` +
        (t.rtFirstHalfMs !== null && t.rtSecondHalfMs !== null ? ` · about ${Math.round(t.rtFirstHalfMs)} ms in the first half of the game and ${Math.round(t.rtSecondHalfMs)} ms in the second half` : ''),
      note: `There is no "right" speed here, and speed is not compared with other children. ${ONE_SESSION}`,
    })
  } else {
    obs.push({name: 'Tap speed', value: NOT_ENOUGH, detail: 'Fewer than 5 taps were recorded, which is too few to say anything.', note: ONE_SESSION})
  }

  // Steering through distractions
  if (t.flankerCostMs !== null && (t.flankerCongruentN ?? 0) >= 3 && (t.flankerIncongruentN ?? 0) >= 3) {
    const cost = Math.round(t.flankerCostMs)
    obs.push({
      name: 'Steering through distractions',
      value: cost > 0 ? `About ${cost} ms slower when the arrows disagreed` : 'No slowdown when the arrows disagreed',
      detail: t.flankerCongruentTotal !== null && t.flankerIncongruentTotal !== null
        ? `${t.flankerCongruentN} of ${t.flankerCongruentTotal} matching rounds and ${t.flankerIncongruentN} of ${t.flankerIncongruentTotal} conflicting rounds were answered correctly (speed uses correct answers only)`
        : `${t.flankerCongruentN} matching rounds and ${t.flankerIncongruentN} conflicting rounds`,
      note: `Most people are a little slower when arrows disagree. With so few rounds the number can jump around. ${ONE_SESSION}`,
    })
  } else {
    obs.push({name: 'Steering through distractions', value: NOT_ENOUGH, detail: 'Too few rounds were recorded.', note: ONE_SESSION})
  }

  // Sequence memory
  if (t.workingMemorySpan !== null && t.workingMemorySpan > 0) {
    obs.push({
      name: 'Remembering the sequence',
      value: `Longest sequence repeated: ${Math.round(t.workingMemorySpan)} stars`,
      detail: 'The number of glowing stars your child could repeat in order.',
      note: `Sequence length depends a lot on age and on the day. ${ONE_SESSION}`,
    })
  } else {
    obs.push({name: 'Remembering the sequence', value: NOT_ENOUGH, detail: 'No completed sequence was recorded.', note: ONE_SESSION})
  }

  // Patience game
  if (t.chargeTrials !== null && t.prematureReleases !== null) {
    obs.push({
      name: 'Patience game',
      value: `Let go of the Sunstone early ${times(t.prematureReleases)} out of ${t.chargeTrials}`,
      detail: 'The Sunstone needs to be held until it chimes.',
      note: 'This game is for fun and for practising waiting. It is not a validated test of anything.',
    })
  } else {
    obs.push({name: 'Patience game', value: NOT_ENOUGH, detail: 'The game did not finish.', note: 'This game is for fun and practice, not a test.'})
  }

  return obs
}

/** Plain wording for how many cards went in the right box before and after the rule changed. Counts only, no judgement. */
function sortAccuracyText(t: Record<string, number | null>): string {
  const part = (k: number | null, n: number | null, rule: string) =>
    k !== null && n !== null && n > 0 && k <= n ? `${Math.round(k)} of ${Math.round(n)} went in the right box under the ${rule} rule` : null
  const a = part(t.sortPreCorrect, t.sortPreTotal, 'colour')
  const b = part(t.sortPostCorrect, t.sortPostTotal, 'shape')
  const cap = (x: string) => x[0].toUpperCase() + x.slice(1)
  if (a && b) return `${cap(a)}, and ${b}.`
  if (a || b) return `${cap((a ?? b) as string)}.`
  return 'Which box each card went in was not recorded.'
}

/** Plain wording for the turn-it-up-slowly part of the room game. Counts and levels only. */
function describeRoom(t: Record<string, number | null>): string {
  const part = (label: string, key: string) => {
    const v = t[`rampStop${label}`]
    return `${key} ${v !== null && v !== undefined && v > 0 ? `at level ${Math.round(v)} of 10` : 'never reached too much'}`
  }
  const moves = (t.adjustLight ?? 0) + (t.adjustSound ?? 0) + (t.adjustTexture ?? 0)
  return `Turned up slowly, the child said it was too much for ${part('Light', 'light')}, ${part('Sound', 'sound')} and ${part('Texture', 'cushion')}. Moved the settings ${moves} ${moves === 1 ? 'time' : 'times'}${(t.shieldUses ?? 0) > 0 ? `, and used the calm shield ${t.shieldUses} ${t.shieldUses === 1 ? 'time' : 'times'}` : ''}.`
}

function autismObservations(t: Record<string, number | null>): Observation[] {
  const obs: Observation[] = []

  if (t.jaTrials !== null && t.jaCorrect !== null && t.jaTrials > 0) {
    obs.push({
      name: "Following Aria's gaze and pointing",
      value: `${Math.round(t.jaCorrect)} of ${Math.round(t.jaTrials)} chosen to match where Aria looked or pointed`,
      detail: t.jaMedianMs !== null ? `Typical time to choose: about ${Math.round(t.jaMedianMs)} ms` : 'Timing was not recorded.',
      note: `Children follow gaze for many reasons, and a game cannot tell why a child chose what they chose. ${ONE_SESSION}`,
    })
  } else {
    obs.push({name: "Following Aria's gaze and pointing", value: NOT_ENOUGH, detail: 'The game did not finish or did not report back.', note: ONE_SESSION})
  }

  if (t.feelingsTrials !== null && t.feelingsCorrect !== null && t.feelingsTrials > 0) {
    obs.push({
      name: 'Matching feelings',
      value: `${Math.round(t.feelingsCorrect)} of ${Math.round(t.feelingsTrials)} faces matched`,
      detail: 'Cartoon faces showing a small set of feelings.',
      note: `Matching cartoon faces is only a small part of understanding feelings, and many children do well or less well for reasons unrelated to autism. ${ONE_SESSION}`,
    })
  } else {
    obs.push({name: 'Matching feelings', value: NOT_ENOUGH, detail: 'The game did not finish.', note: ONE_SESSION})
  }

  if (t.lightLevel !== null || t.soundLevel !== null || t.touchLevel !== null) {
    const lvl = (label: string, v: number | null) => `${label} ${v === null ? 'not chosen' : `${Math.round(v)}/10`}`
    obs.push({
      name: 'Comfort preferences',
      value: `${lvl('Light', t.lightLevel)} · ${lvl('Sound', t.soundLevel)} · ${lvl('Touch', t.touchLevel)}`,
      detail: [
        'The levels your child picked for the light, the rain and the cushion.',
        t.designSec !== null ? describeRoom(t) : null,
      ].filter(Boolean).join(' '),
      note: 'These show what felt cosy in the game. They are preferences, not a test result.',
    })
  } else if (t.designSec !== null) {
    obs.push({name: 'Comfort preferences', value: 'Room designed, no settings chosen', detail: describeRoom(t), note: 'These are preferences, not a test result.'})
  } else {
    obs.push({name: 'Comfort preferences', value: NOT_ENOUGH, detail: 'The sliders were not moved.', note: 'These are preferences, not a test result.'})
  }

  if (t.sortCount !== null && t.sortCount > 0) {
    obs.push({
      name: 'Sorting game',
      value: `${Math.round(t.sortCount)} cards sorted`,
      detail: [
        t.sortMedianMs !== null ? `About ${Math.round(t.sortMedianMs)} ms per card.` : 'Timing was not recorded.',
        sortAccuracyText(t),
      ].filter(Boolean).join(' '),
      note: `The sorting rule changes part-way, which is hard for many people. ${ONE_SESSION}`,
    })
  } else {
    obs.push({name: 'Sorting game', value: NOT_ENOUGH, detail: 'The game did not finish.', note: ONE_SESSION})
  }

  return obs
}

function generateAdhdCognitiveProfile(t: Record<string, number | null>, childName: string, childAge: number | null): CognitiveProfile {
  const domains: DomainEvaluation[] = []
  const strengths: string[] = []
  const supportNeeds: string[] = []

  // 1. Sustained Attention & Vigilance (Sunbird CPT)
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
    cptNarrative = `${childName} demonstrated high attentional vigilance throughout the continuous performance task, capturing ${hitRate}% of fleeting sunbird sightings (${hits}/${targets}) while demonstrating 100% impulse control by completely withholding taps on all shadow moths. This pattern indicates strong top-down attentional focus and intact proactive motor braking under rapid visual demands.`
    cptImpact = `In classroom and home environments, ${childName} is well-equipped to sustain focus on primary visual tasks and resist impulsive false starts when distractors appear.`
    strengths.push('High-level vigilance and sustained target tracking')
    strengths.push('Robust motor response inhibition against visual distractors')
  } else if (commissions >= 2) {
    cptTone = 'support'
    cptRating = 'High Perceptual Speed with Action Impulsivity'
    cptNarrative = `${childName} maintained strong target detection (${hitRate}% hit rate), but triggered ${commissions} premature taps on shadow moths (${falseAlarmRate}% false alarm rate). This indicates a 'fast-action' cognitive phenotype: visual awareness is keen and quick, but motor braking struggles to suppress anticipatory physical responses before full stimulus discrimination occurs.`
    cptImpact = `During independent work, ${childName} likely grasps directions quickly but may rush into answers or raise hands before processing all details. Scaffolding self-monitoring pauses ('Stop, Look, Check') will yield immediate improvements.`
    strengths.push('Rapid visual detection and high task engagement')
    supportNeeds.push('Motor impulse braking during rapid response windows')
  } else if (omissions >= 2) {
    cptTone = 'support'
    cptRating = 'Intermittent Attentional Lapses (Vulnerable Focus)'
    cptNarrative = `${childName} missed ${omissions} target sunbirds (${hitRate}% hit rate)${meanRt ? ` with an average reaction time of ${meanRt}ms` : ''}. This points to periodic attentional micro-lapses where focus drifts away from the primary scanning window during low-stimulation inter-stimulus intervals.`
    cptImpact = `During extended teacher explanations or reading passages, ${childName} may experience brief moments of visual drift. Breaking instruction into modular steps with visual callouts will significantly preserve engagement.`
    supportNeeds.push('Sustained visual vigilance during prolonged observation')
  } else {
    cptRating = 'Typical Attentional Vigilance & Pacing'
    cptNarrative = `${childName} captured ${hitRate}% of targets with an average speed of ${meanRt ?? 450}ms and ${commissions} false alarm on distractor moths. This represents typical developmental attentional vigilance and baseline inhibitory control.`
    cptImpact = `Able to maintain functional focus on routine classroom tasks with standard visual scaffolding.`
    strengths.push('Consistent baseline attention across standard intervals')
  }

  domains.push({
    id: 'cpt',
    title: 'Sustained Attention & Vigilance Stability',
    chapterName: 'Chapter 1: Sunbird Meadow (CPT-3)',
    clinicalRating: cptRating,
    statusTone: cptTone,
    narrativeAnalysis: cptNarrative,
    indicators: [
      {label: 'Target Hit Rate', value: `${hitRate}%`, context: `${hits} of ${targets} sunbirds caught`},
      {label: 'Inattention Omissions', value: `${omissions}`, context: omissions === 0 ? 'Zero misses' : `${omissions} targets passed`},
      {label: 'Motor False Alarms', value: `${commissions}`, context: `${falseAlarmRate}% commission error rate`},
      {label: 'Pacing Stability (RTV)', value: rtv ? `${rtv} ms` : 'N/A', context: rtv && rtv < 90 ? 'High cognitive consistency' : 'Typical variability'},
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
    flankerNarrative = `${childName} exhibited exceptional conflict resolution, steering with an interference cost of only ${flankerCost}ms when surrounding arrows disagreed with the central target. This demonstrates an innate ability to filter out peripheral clutter and allocate selective attentional resources exclusively to target-relevant features.`
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
    flankerNarrative = `${childName} navigated the directional steering course with normal developmental conflict adaptation (+${flankerCost ?? 45}ms cost). Performance under conflicting stimuli remained accurate (${incongN}/${incongTotal} correct).`
    flankerImpact = `Standard selective attentional capacity; copes well with everyday environmental stimuli.`
  }

  domains.push({
    id: 'flanker',
    title: 'Selective Attention & Interference Control',
    chapterName: 'Chapter 2: Canopy Trail (Flanker Task)',
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

  // 3. Visuospatial Working Memory (Astrolabe Stars)
  const span = t.workingMemorySpan !== null ? Math.round(t.workingMemorySpan) : 0
  const expectedSpan = childAge && childAge <= 6 ? 3 : childAge && childAge <= 9 ? 4 : 5

  let memoryTone: 'strength' | 'support' | 'steady' = 'steady'
  let memoryRating = 'Typical Working Memory Span'
  let memoryNarrative = ''
  let memoryImpact = ''

  if (span >= expectedSpan + 1) {
    memoryTone = 'strength'
    memoryRating = `Surpassing Working Memory Span (${span} items)`
    memoryNarrative = `${childName} accurately reproduced sequential star patterns up to ${span} nodes, surpassing the expected milestone for their age (${expectedSpan} items). This indicates strong visual-spatial sketchpad capacity and efficient mental rehearsal strategies.`
    memoryImpact = `Can comfortably track complex 3-to-4 step instructions, mental math problems, and sequential multi-step science procedures.`
    strengths.push(`Advanced visuospatial working memory span (${span} items)`)
  } else if (span < expectedSpan && span > 0) {
    memoryTone = 'support'
    memoryRating = `Developing Sequential Working Memory (${span} items)`
    memoryNarrative = `${childName} successfully recalled up to ${span} sequential star nodes. Holding sequences beyond ${span} items caused order confusion, indicating that working memory chunking is actively developing and vulnerable to cognitive overload.`
    memoryImpact = `Long verbal instructions (e.g. 'Put your books away, get your yellow binder, and open to page 12') may break down. Supplementing verbal directions with a 1-step visual checklist will provide crucial executive scaffolding.`
    supportNeeds.push('Working memory support for multi-step sequential tasks')
  } else {
    memoryRating = `Age-Typical Working Memory (${span} items)`
    memoryNarrative = `${childName} recalled ${span} sequential stars in precise order, meeting expected developmental benchmarks (${expectedSpan} items). Demonstrates reliable short-term spatial holding.`
    memoryImpact = `Capable of retaining typical classroom directions with standard verbal prompts.`
  }

  domains.push({
    id: 'memory',
    title: 'Visuospatial Working Memory & Sequencing',
    chapterName: 'Chapter 3: Starlit Terrace (Corsi Blocks)',
    clinicalRating: memoryRating,
    statusTone: memoryTone,
    narrativeAnalysis: memoryNarrative,
    indicators: [
      {label: 'Maximum Sequence Span', value: `${span} stars`, context: `Age expectation: ${expectedSpan} items`},
      {label: 'Sequential Chunking', value: span >= expectedSpan ? 'Intact' : 'Developing', context: 'Spatial pattern encoding'},
    ],
    realWorldImpact: memoryImpact,
  })

  // 4. Delay Tolerance & Motor Regulation (Sunstone Charge)
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
    chargeNarrative = `${childName} maintained unbroken, steady isometric hold across all ${totalCharges} Sunstone charging trials with zero premature releases. This shows mature motor persistence and calm emotional tolerance when anticipating delayed reinforcement.`
    chargeImpact = `Well-developed capacity for patience during turn-taking, standing in line, or waiting for attention without fidgeting or distress.`
    strengths.push('Exceptional patience and delay-of-gratification tolerance')
  } else if (premature >= 2) {
    chargeTone = 'support'
    chargeRating = 'High Motor Urgency (Anticipatory Impulsivity)'
    chargeNarrative = `${childName} released the Sunstone prematurely ${premature} times before the target chime sounded. This reflects significant motor urgency and discomfort with static waiting intervals when no active stimulus is changing on screen.`
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
    title: 'Delay of Gratification & Somatic Regulation',
    chapterName: 'Chapter 4: Sunstone Courtyard (Motor Hold)',
    clinicalRating: chargeRating,
    statusTone: chargeTone,
    narrativeAnalysis: chargeNarrative,
    indicators: [
      {label: 'Steady Holds Completed', value: `${completedCharges} / ${totalCharges}`, context: `${Math.round((completedCharges / totalCharges) * 100)}% completion rate`},
      {label: 'Premature Releases', value: `${premature}`, context: premature === 0 ? 'Flawless delay endurance' : `${premature} early releases`},
    ],
    realWorldImpact: chargeImpact,
  })

  // Synthesize Overarching Archetype
  let archetype = 'Balanced & Steady Multi-Domain Explorer'
  let tempoLabel = 'Moderate & Calibrated (450–650 ms)'
  let staminaLabel = 'Maintained Focus Across Full Session'
  let executiveSummary = ''

  if (meanRt && meanRt < 450 && commissions >= 1) {
    archetype = 'Dynamic Fast-Action Explorer with Emerging Motor Regulation'
    tempoLabel = `Rapid (<450 ms: avg ${meanRt} ms)`
    executiveSummary = `${childName} presents with a highly responsive, action-oriented cognitive style. They excel at rapid perceptual detection and energetic problem solving, but exhibit a distinct speed-accuracy tradeoff where motor actions precede full cognitive evaluation. Their visual working memory is intact, and their primary developmental edge lies in strengthening proactive motor inhibition and patience during anticipatory pauses.`
  } else if (commissions === 0 && omissions <= 1 && (flankerCost === null || flankerCost <= 40)) {
    archetype = 'High-Focus Precision Scout'
    tempoLabel = meanRt ? `Quick & Accurate (${meanRt} ms)` : 'Consistent & Focused'
    executiveSummary = `${childName} demonstrated exceptional executive regulation across all four cognitive domains. They combined sharp visual vigilance with unwavering response inhibition, filtered visual clutter with minimal interference cost, and sustained steady motor delay until auditory cues completed. This reflects robust attentional networks and advanced self-regulatory maturity.`
  } else if (omissions >= 2 || (rtv && rtv > 130)) {
    archetype = 'Fluctuating Focus Observer with Visual Sensitivity'
    tempoLabel = 'Variable Attentional Pacing'
    executiveSummary = `${childName} demonstrated keen moments of engagement interspersed with periodic attentional drift. While selective focus and pattern recognition show promising capability, sustained vigilance across prolonged intervals is vulnerable to mental fatigue. Scaffolding task pacing with frequent movement breaks will yield substantial gains.`
  } else if (flankerCost && flankerCost > 75) {
    archetype = 'Deep Spatial Processor with Clutter Vulnerability'
    tempoLabel = 'Deliberate & Methodical'
    executiveSummary = `${childName} demonstrated strong spatial memory and steady patience, but experienced marked cognitive slowdown when navigating dense visual conflict. They thrive in calm, organized workspaces where external visual noise is minimized.`
  } else {
    executiveSummary = `${childName} demonstrated a well-rounded neurocognitive profile with balanced perceptual speed, functional distractor resistance, developmental working memory span, and emerging somatic delay tolerance.`
  }

  // Stamina analysis
  if (t.rtFirstHalfMs && t.rtSecondHalfMs) {
    const diff = t.rtSecondHalfMs - t.rtFirstHalfMs
    if (diff > 60) staminaLabel = `Vigilance Fatigue Trend (+${Math.round(diff)} ms in 2nd Half)`
    else if (diff < -30) staminaLabel = `Practice Acceleration (-${Math.round(Math.abs(diff))} ms in 2nd Half)`
    else staminaLabel = `Stable Rhythm (within ${Math.round(Math.abs(diff))} ms across blocks)`
  }

  if (strengths.length === 0) strengths.push('Enthusiastic engagement across multi-modal gameplay challenges')
  if (supportNeeds.length === 0) supportNeeds.push('Standard developmental pacing and positive reinforcement')

  return {
    archetype,
    tempoLabel,
    staminaLabel,
    executiveSummary,
    keyStrengths: strengths,
    supportOpportunities: supportNeeds,
    domains,
  }
}

function generateAutismCognitiveProfile(t: Record<string, number | null>, childName: string): CognitiveProfile {
  const domains: DomainEvaluation[] = []
  const strengths: string[] = []
  const supportNeeds: string[] = []

  // 1. Joint Attention & Social Referencing (Aria's Gaze)
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
    jaNarrative = `${childName} consistently followed Aria's eye-gaze and pointing vectors (${jaCorrect}/${jaTrials} trials matched), with a median response time of ${jaMs ?? 800}ms. This demonstrates intact triadic joint attention and intuitive social-referential cue interpretation in interactive visual contexts.`
    jaImpact = `Quickly notices non-verbal social cues from teachers and peers; readily shares attention toward shared classroom objects or demonstration points.`
    strengths.push('Intuitive joint attention and gaze-following orientation')
  } else {
    jaTone = 'support'
    jaRating = `Independent Visual Attention (${jaPct}% Social Alignment)`
    jaNarrative = `${childName} chose independently of Aria's gaze or pointing in ${jaTrials - jaCorrect} of ${jaTrials} trials. This reflects an autonomous visual exploration style where attention is guided by intrinsic visual interest in objects rather than extrinsic social cues.`
    jaImpact = `May not immediately look where a teacher or parent points across the room. Pairing pointing with explicit direct verbal prompts ('Look here at the board') ensures shared focus.`
    supportNeeds.push('Verbal reinforcement for non-verbal pointing and gaze directions')
  }

  domains.push({
    id: 'gaze',
    title: 'Joint Attention & Social Referencing',
    chapterName: 'Chapter 1: The Terracotta Portico (Aria Gaze)',
    clinicalRating: jaRating,
    statusTone: jaTone,
    narrativeAnalysis: jaNarrative,
    indicators: [
      {label: 'Gaze Following Match', value: `${jaPct}%`, context: `${jaCorrect} of ${jaTrials} trials aligned`},
      {label: 'Orienting Latency', value: jaMs ? `${jaMs} ms` : 'N/A', context: 'Time to reference and choose'},
    ],
    realWorldImpact: jaImpact,
  })

  // 2. Affective Emotion Recognition (Fox Emotion Mirror)
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
    fNarrative = `${childName} accurately identified and matched ${fCorrect} of ${fTrials} facial emotion expressions on the fox cub. This indicates strong foundational decoding of facial affect and recognition of discrete non-verbal emotional states.`
    fImpact = `Readily interprets peer emotional expressions in social group play; can identify when someone is happy, surprised, or upset.`
    strengths.push('Sharp non-verbal emotion discrimination and facial affect decoding')
  } else {
    fTone = 'support'
    fRating = `Subtle Affect Interpretation Edge (${fPct}% Accuracy)`
    fNarrative = `${childName} correctly matched ${fCorrect} of ${fTrials} facial expressions, finding nuanced emotional variations (e.g. calm vs worried) ambiguous without contextual story clues.`
    fImpact = `May benefit from explicit verbal labeling of peer emotions and feelings charts during social conflicts.`
    supportNeeds.push('Explicit emotional vocabulary and contextual feeling cues')
  }

  domains.push({
    id: 'feelings',
    title: 'Affective Discrimination & Emotion Decoding',
    chapterName: 'Chapter 2: The Crystal Pond (Fox Feelings)',
    clinicalRating: fRating,
    statusTone: fTone,
    narrativeAnalysis: fNarrative,
    indicators: [
      {label: 'Emotion Match Accuracy', value: `${fPct}%`, context: `${fCorrect} of ${fTrials} expressions identified`},
    ],
    realWorldImpact: fImpact,
  })

  // 3. Sensory Modulation & Haven Profile
  const light = t.lightLevel !== null ? Math.round(t.lightLevel) : null
  const sound = t.soundLevel !== null ? Math.round(t.soundLevel) : null
  const touch = t.touchLevel !== null ? Math.round(t.touchLevel) : null

  let sensoryNarrative = `${childName} calibrated their ideal haven settings: Light ${light !== null ? `${light}/10` : 'Default'}, Sound ${sound !== null ? `${sound}/10` : 'Default'}, Cushion Texture ${touch !== null ? `${touch}/10` : 'Default'}.`
  if (light !== null && light <= 3) sensoryNarrative += ' Marked preference for subdued, soft lighting to avoid visual overstimulation.'
  if (sound !== null && sound <= 3) sensoryNarrative += ' Sensitivity to auditory volume; thrives with gentle, low-decibel soundscapes.'
  if (touch !== null && touch >= 7) sensoryNarrative += ' Deep tactile seeking; finds weighted, plush textures calming.'

  domains.push({
    id: 'sensory',
    title: 'Sensory Modulation & Environmental Sensitivity',
    chapterName: 'Chapter 3: The Sensory Haven (SPM-2)',
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

  // 4. Cognitive Set-Shifting (Crystal Gem Sorting)
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
    sortNarrative = `${childName} adapted seamlessly when the sorting criteria transitioned from color to shape, sorting ${postCorrect} of ${postTotal} gems correctly under the new rule. This shows strong cognitive flexibility and minimal perseverative interference.`
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
    chapterName: 'Chapter 4: The Alchemist Table (WCST)',
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

  return {
    archetype,
    tempoLabel: 'Calm & Deliberate Pacing',
    staminaLabel: 'Predictable Sensory Flow Maintained',
    executiveSummary: `${childName} demonstrated a unique cognitive profile characterized by deep visual focus and distinctive sensory comfort preferences. They engaged meaningfully across social gaze referencing, emotion matching, sensory calibration, and rule-based gem sorting.`,
    keyStrengths: strengths.length ? strengths : ['Focused visual engagement in structured tasks'],
    supportOpportunities: supportNeeds.length ? supportNeeds : ['Structured sensory breaks and transition warnings'],
    domains,
  }
}

function buildSuperpowers(type: 'adhd' | 'autism', childName: string, guildClass: string) {
  if (type === 'adhd') {
    return {
      realmTitle: 'High Guardian of the Sunbird Sky Realm',
      crestBadge: 'Order of the Golden Sunstone',
      elementalAffinity: guildClass || 'Astral Sky Ranger',
      badges: [
        {name: 'Sunbird Watch', desc: 'Kept watch for the golden sunbird across the Sky Citadel.', icon: 'lightning', rank: 'Chapter 1'},
        {name: 'Cosmic Wayfinder', desc: 'Steered through the meteor shower by following the golden centre star.', icon: 'compass', rank: 'Chapter 2'},
        {name: 'Constellation Harmonizer', desc: 'Woke the starlight astrolabe by replaying its sequence of stars.', icon: 'starlight', rank: 'Chapter 3'},
        {name: 'Sunstone Patience', desc: 'Practised holding the Sunstone until the star chime rang.', icon: 'rocket', rank: 'Chapter 4'},
      ],
      miloScroll: `Hoot hoot, brave ${childName}! You finished the whole Sky Citadel quest. Every chapter was a new challenge, and you took each one on. Wear your Golden Sunstone crest with pride!`,
    }
  }
  return {
    realmTitle: 'Grand High Alchemist of the Whispering Groves',
    crestBadge: 'Crest of the Sacred Lotus Crystal',
    elementalAffinity: guildClass || 'Grove Harmonizer',
    badges: [
      {name: 'Eagle Eye Pattern Seer', desc: "Followed Aria's gaze and pointing to find the hidden ceramic urns.", icon: 'magnifier', rank: 'Chapter 1'},
      {name: 'Heart Harmony Empath', desc: "Matched the Forest Sprite's feelings in the crystal mirror.", icon: 'heart', rank: 'Chapter 2'},
      {name: 'Sanctuary Architect', desc: 'Set up a cosy sanctuary with lantern light, rain and a soft cushion.', icon: 'leaf', rank: 'Chapter 3'},
      {name: 'Crystal Sorter', desc: 'Sorted glowing crystal stars and moons as the magic rules changed.', icon: 'crystal', rank: 'Chapter 4'},
    ],
    miloScroll: `Namaste, gentle Guardian ${childName}! You finished every chapter of the Whispering Groves. Thank you for playing, and for showing us what feels cosy to you. Wear your Lotus Crystal crest with pride!`,
  }
}

const ADHD_QUESTIONS = [
  'Does what you saw in the game match what you notice at home or at school?',
  'How did your child seem while playing: eager, tired, bored, frustrated? Tell the clinician.',
  'Which situations are hardest for your child, and which are easier?',
  'Would a full evaluation by a paediatrician or psychologist make sense for the concerns you have?',
]

const AUTISM_QUESTIONS = [
  'Does how your child followed gaze and pointing in the game match what you see in everyday play?',
  'Which sounds, lights or textures bother your child, and which feel calming?',
  'What did your child enjoy, and what did they find hard, in the game?',
  'Would a full developmental evaluation by a qualified clinician be helpful for the concerns you have?',
]

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Raw
    const assessmentType = body?.assessmentType
    if (assessmentType !== 'adhd' && assessmentType !== 'autism' && assessmentType !== 'dyslexia') {
      return NextResponse.json({error: 'Unknown activity'}, {status: 400})
    }

    if (assessmentType === 'dyslexia') {
      // The reading quest only needs the session record: counts, times and intervals, built here so the page is never trusted.
      const dyslexiaTelemetry = cleanTelemetry(body.telemetry)
      const dyslexiaRecord = buildSessionRecord({
        quest: 'dyslexia',
        ageYears: cleanAge(body.childAge),
        telemetry: dyslexiaTelemetry,
        environment: cleanEnvironment(body.environment, req.headers.get('user-agent')),
        instrumentVersion: INSTRUMENT_VERSION,
      })
      return NextResponse.json({
        success: true,
        data: {
          assessmentType: 'dyslexia',
          childName: cleanText(body.childName, 40, 'Explorer'),
          childAge: cleanAge(body.childAge),
          record: dyslexiaRecord,
        },
      })
    }

    const childName = cleanText(body.childName, 40, assessmentType === 'adhd' ? 'Canopy Ranger' : 'Grove Seeker')
    const guildClass = cleanText(body.guildClass, 40, '')
    const telemetry = cleanTelemetry(body.telemetry)
    const record = buildSessionRecord({
      quest: assessmentType,
      ageYears: cleanAge(body.childAge),
      telemetry,
      environment: cleanEnvironment(body.environment, req.headers.get('user-agent')),
      instrumentVersion: INSTRUMENT_VERSION,
    })
    const rounds = assessmentType === 'adhd' ? cleanRounds(body.cptBlocks, telemetry) : null
    if (rounds) {
      ;(record as SessionRecord & {sunbirdRounds?: SunbirdRounds}).sunbirdRounds = rounds
      record.measures.push(...roundMeasures(rounds, telemetry))
    }
    if (assessmentType === 'adhd') {
      // each part is kept only if it is well formed and adds up to the session totals; otherwise it is left out
      const steer = steeringTrials(body.steerTrials, telemetry)
      if (steer) record.steeringTrials = steer
      const stars = starLevels(body.starLevels, telemetry)
      if (stars) record.starLevels = stars
    }
    const indices = assessmentType === 'adhd' ? adhdObservations(telemetry) : autismObservations(telemetry)
    const withData = indices.filter((o) => o.value !== NOT_ENOUGH).length
    const cognitiveProfile = assessmentType === 'adhd'
      ? generateAdhdCognitiveProfile(telemetry, childName, cleanAge(body.childAge))
      : generateAutismCognitiveProfile(telemetry, childName)

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
        instrument: {name: assessmentType === 'adhd' ? 'Manas attention play activity' : 'Manas social and sensory play activity', version: INSTRUMENT_VERSION},
        summary:
          withData === 0
            ? `${childName} did not finish enough of the games to show anything useful. You are welcome to try again.`
            : `${childName} demonstrated a ${cognitiveProfile.archetype} profile (${cognitiveProfile.tempoLabel}). ${cognitiveProfile.executiveSummary}`,
        indices,
        questions: assessmentType === 'adhd' ? ADHD_QUESTIONS : AUTISM_QUESTIONS,
        accommodations: assessmentType === 'adhd' ? ADHD_IDEAS : AUTISM_IDEAS,
        cognitiveProfile,
      },
    }

    return NextResponse.json({success: true, data: state})
  } catch {
    return NextResponse.json({error: 'Could not build the summary'}, {status: 500})
  }
}
