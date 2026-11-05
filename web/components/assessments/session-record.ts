import {wilson} from './profile-stats'

/**
 * Manas Profile: one structured, versioned record of a play session.
 *
 * The record holds counts, timings and 95% intervals. It holds no norms, no cut-offs, no scores
 * against other children and no labels. It exists so that every session is kept in the same
 * shape, which is what later reliability and validation work needs. Nothing here is stored by
 * this code; the record is built in the response and handed back to the caller.
 */

export const RECORD_SCHEMA_VERSION = '1.4'

export type Quest = 'adhd' | 'autism'
export type AgeBand = '4-5' | '6-8' | '9-12' | '13-16'

export function ageBandOf(age: number | null): AgeBand | null {
  if (age === null) return null
  if (age >= 4 && age <= 5) return '4-5'
  if (age >= 6 && age <= 8) return '6-8'
  if (age >= 9 && age <= 12) return '9-12'
  if (age >= 13 && age <= 16) return '13-16'
  return null
}

export interface Environment {
  userAgent: string | null
  language: string | null
  timezone: string | null
  screen: {width: number; height: number; pixelRatio: number} | null
  touch: boolean | null
}

export interface ProportionMeasure {
  kind: 'proportion'
  key: string
  label: string
  k: number
  n: number
  p: number
  lo: number
  hi: number
  /** which game the measure belongs to, for grouping in the report */
  game?: string
  /** true when the 95% interval is wider than 35 percentage points, i.e. there were too few trials to say much */
  wide: boolean
  note?: string
}

export interface ValueMeasure {
  kind: 'value'
  key: string
  label: string
  value: number
  unit: string
  game?: string
  /** how many trials or taps the value comes from, when known */
  n: number | null
  note?: string
}

export type Measure = ProportionMeasure | ValueMeasure

export interface SessionRecord {
  schema: string
  instrument: {id: string; name: string; version: string}
  quest: Quest
  ageYears: number | null
  ageBand: AgeBand | null
  recordedAt: string
  environment: Environment
  measures: Measure[]
  /** autism quest only: what happened on each sorting card, in the order played (record format 1.2 and later) */
  sortingCards?: SortingCard[]
  /** autism quest only: the gaze game encounter by encounter (record format 1.3 and later) */
  gazeRounds?: GazeRound[]
  /** autism quest only: the feelings match round by round (record format 1.3 and later) */
  feelingsRounds?: FeelingsRound[]
  /** adhd quest only: the steering game arrow by arrow (record format 1.4 and later) */
  steeringTrials?: SteeringTrial[]
  /** adhd quest only: the star-sequence game level by level (record format 1.4 and later) */
  starLevels?: StarLevel[]
  limits: string[]
}

export interface SteeringTrial {
  trial: number
  /** matching: all three arrows point the same way; conflicting: the side arrows point the other way */
  arrows: 'matching' | 'conflicting'
  correct: boolean
  ms: number | null
}

export interface StarLevel {
  level: number
  /** number of stars in the sequence */
  length: number
  completed: boolean
  /** when not completed: the star (counted from 1) where the first wrong tap happened */
  missedAt: number | null
}

export interface GazeRound {
  round: number
  /** the vessel Aria looked at */
  target: string
  /** true when Aria also pointed, false when she only looked */
  pointing: boolean
  chosen: string
  matched: boolean
  ms: number | null
}

export interface FeelingsRound {
  round: number
  /** the feeling the sprite showed */
  shown: string
  /** the feeling the child chose */
  chosen: string
  matched: boolean
  ms: number | null
}

export interface SortingCard {
  card: number
  rule: 'colour' | 'shape'
  color: 'red' | 'blue'
  shape: 'star' | 'circle'
  /** the box the child tapped */
  box: 'Red star box' | 'Blue circle box'
  /** whether that box matched the rule shown for this card */
  right: boolean
  ms: number | null
}

type Tele = Record<string, number | null>

const get = (t: Tele, key: string): number | null => {
  const v = t[key]
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function proportion(key: string, label: string, k: number | null, n: number | null, note?: string): ProportionMeasure | null {
  if (k === null || n === null) return null
  const kk = Math.round(k)
  const nn = Math.round(n)
  if (nn <= 0 || kk < 0 || kk > nn) return null
  const [lo, hi] = wilson(kk, nn)
  return {kind: 'proportion', key, label, k: kk, n: nn, p: kk / nn, lo, hi, wide: hi - lo > 0.35, ...(note ? {note} : {})}
}

function value(key: string, label: string, v: number | null, unit: string, n: number | null, note?: string): ValueMeasure | null {
  if (v === null) return null
  return {kind: 'value', key, label, value: Math.round(v * 10) / 10, unit, n, ...(note ? {note} : {})}
}

/** A count with a known denominator becomes a proportion with an interval; without one it stays a plain count. */
function countOrProportion(key: string, label: string, k: number | null, n: number | null, note?: string): Measure | null {
  return proportion(key, label, k, n, note) ?? value(key, label, k, 'count', null, note)
}

/** Which game a measure belongs to. Keys that start with a prefix below, or match exactly, are grouped together in the report. */
export function gameOf(key: string): string {
  if (/^(omissions|commissions|anticipatory|hrtMs|rtvMs|rtFirstHalfMs|rtSecondHalfMs|cptDisplayMs|rtRound|omissionsRound)/.test(key)) return 'Sunbird game'
  if (/^flanker/.test(key)) return 'Steering game'
  if (/^workingMemory/.test(key)) return 'Star-sequence game'
  if (/^prematureReleases/.test(key)) return 'Patience game'
  if (/^gaze/.test(key)) return 'Gaze game'
  if (/^feelings/.test(key)) return 'Feelings match'
  if (/^(light|sound|touch)Level/.test(key)) return 'Comfort choices'
  if (/^sort/.test(key)) return 'Sorting game'
  if (/^(pause|retry)/.test(key)) return 'During the session'
  return 'Other'
}

const tagGame = (m: Measure): Measure => ({...m, game: gameOf(m.key)})

/** How the session went: practice repeats per game, and time the page was hidden. Omitted when the browser sent nothing. */
function eventMeasures(t: Tele, retryKeys: Array<[string, string]>): Array<Measure | null> {
  return [
    ...retryKeys.map(([key, label]) => value(key, `Times practice was repeated, ${label}`, get(t, key), 'times', null,
      'Not a score. Repeating practice is a normal choice.')),
    value('pauseCount', 'Times the page was left or hidden during play', get(t, 'pauseCount'), 'times', null),
    value('pausedSec', 'Total time the page was hidden', get(t, 'pausedSec'), 'seconds', null,
      'Switching away can be a break, a call or a different app. It is not a finding about the child.'),
  ]
}

function adhdMeasures(t: Tele): Array<Measure | null> {
  return [
    countOrProportion('omissions', 'Sunbirds missed', get(t, 'omissions'), get(t, 'cptTargets')),
    countOrProportion('commissions', 'Taps on the shadow moth', get(t, 'commissions'), get(t, 'cptNonTargets')),
    proportion('anticipatory', 'Taps before a reaction was possible, or with nothing on screen', get(t, 'cptAnticipatory'), get(t, 'cptTrials')),
    value('hrtMs', 'Average tap speed', get(t, 'hrtMs'), 'ms', get(t, 'cptResponses')),
    value('rtvMs', 'Variation in tap speed', get(t, 'rtvMs'), 'ms', get(t, 'cptResponses')),
    value('rtFirstHalfMs', 'Average tap speed, first half', get(t, 'rtFirstHalfMs'), 'ms', null),
    value('rtSecondHalfMs', 'Average tap speed, second half', get(t, 'rtSecondHalfMs'), 'ms', null),
    proportion('flankerCongruent', 'Matching-arrow rounds answered correctly', get(t, 'flankerCongruentN'), get(t, 'flankerCongruentTotal')),
    proportion('flankerIncongruent', 'Conflicting-arrow rounds answered correctly', get(t, 'flankerIncongruentN'), get(t, 'flankerIncongruentTotal')),
    value('flankerCostMs', 'Slowdown when the arrows disagreed (correct answers only)', get(t, 'flankerCostMs'), 'ms', get(t, 'flankerIncongruentN')),
    value('workingMemorySpan', 'Longest star sequence repeated', get(t, 'workingMemorySpan'), 'stars', null),
    proportion('prematureReleases', 'Early releases in the patience game', get(t, 'prematureReleases'), get(t, 'chargeTrials'),
      'Practice game for fun, not a validated task.'),
    ...eventMeasures(t, [['retrySunbird', 'sunbird game'], ['retrySteering', 'steering game'], ['retryStars', 'star-sequence game']]),
  ]
}

function autismMeasures(t: Tele): Array<Measure | null> {
  return [
    proportion('gazeMatches', "Choices matching where Aria looked or pointed", get(t, 'jaCorrect'), get(t, 'jaTrials')),
    value('gazeMedianMs', 'Median time to choose in the gaze game', get(t, 'jaMedianMs'), 'ms', get(t, 'jaTrials')),
    proportion('feelingsMatches', 'Cartoon faces matched', get(t, 'feelingsCorrect'), get(t, 'feelingsTrials')),
    value('lightLevel', 'Comfort level chosen for light', get(t, 'lightLevel'), 'of 10', null, 'A preference, not a test result.'),
    value('soundLevel', 'Comfort level chosen for sound', get(t, 'soundLevel'), 'of 10', null, 'A preference, not a test result.'),
    value('touchLevel', 'Comfort level chosen for touch', get(t, 'touchLevel'), 'of 10', null, 'A preference, not a test result.'),
    value('sortCount', 'Cards sorted', get(t, 'sortCount'), 'cards', null),
    value('sortMedianMs', 'Median time per card in the sorting game', get(t, 'sortMedianMs'), 'ms', get(t, 'sortCount')),
    proportion('sortPre', 'Cards put in the right box under the first (colour) rule', get(t, 'sortPreCorrect'), get(t, 'sortPreTotal'),
      'Only a few cards, so the interval is wide.'),
    proportion('sortPost', 'Cards put in the right box after the rule changed (shape)', get(t, 'sortPostCorrect'), get(t, 'sortPostTotal'),
      'Only a few cards, so the interval is wide. Practice cards are never counted.'),
    ...eventMeasures(t, [['retryGaze', 'gaze game'], ['retryFeelings', 'feelings match'], ['retrySorting', 'sorting game']]),
  ]
}

const INSTRUMENTS: Record<Quest, {id: string; name: string}> = {
  adhd: {id: 'manas-attention-play', name: 'Manas attention play screener'},
  autism: {id: 'manas-social-sensory-play', name: 'Manas social and sensory play screener'},
}

const LIMITS = [
  'One short play session. Tiredness, mood, the device and enjoyment of the game all change the numbers.',
  'No norms: nothing here is compared with other children, and there are no cut-offs or labels.',
  '95% intervals are Wilson intervals. They treat each trial as independent, which is only approximately true.',
  'A wide interval means there were too few trials to say much. It is not a finding about the child.',
  'This record cannot show whether a child has ADHD, autism or any other condition. Only a clinician can assess that.',
]

function cleanString(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const t = v.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max)
  return t || null
}

function cleanNumber(v: unknown, min: number, max: number): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? Math.round(v * 100) / 100 : null
}

/** Sanitises the device details sent by the browser, and adds the User-Agent header the server saw. */
export function cleanEnvironment(input: unknown, headerUserAgent?: string | null): Environment {
  const src = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const scr = (src.screen && typeof src.screen === 'object' ? src.screen : null) as Record<string, unknown> | null
  const width = scr ? cleanNumber(scr.width, 1, 20000) : null
  const height = scr ? cleanNumber(scr.height, 1, 20000) : null
  const pixelRatio = scr ? cleanNumber(scr.pixelRatio, 0.5, 10) : null
  return {
    userAgent: cleanString(headerUserAgent ?? src.userAgent, 300),
    language: cleanString(src.language, 20),
    timezone: cleanString(src.timezone, 60),
    screen: width !== null && height !== null && pixelRatio !== null ? {width, height, pixelRatio} : null,
    touch: typeof src.touch === 'boolean' ? src.touch : null,
  }
}

// The six sorting cards in the order they are played. Must match DCCS_CARDS in app/assessments/autism/page.tsx.
// Cards 1 to 3 are played under the colour rule and cards 4 to 6 under the shape rule.
// Box 0 is the red star box and box 1 is the blue circle box.
const SORT_CARDS: Array<{color: 'red' | 'blue'; shape: 'star' | 'circle'}> = [
  {color: 'red', shape: 'star'}, {color: 'blue', shape: 'circle'}, {color: 'red', shape: 'circle'},
  {color: 'blue', shape: 'star'}, {color: 'red', shape: 'star'}, {color: 'blue', shape: 'circle'},
]
const SORT_SWITCH_AT = 3

/**
 * Card by card sorting results. Kept only when all six boxes are present and add up to the session totals,
 * otherwise something is off and the table is left out.
 */
export function sortingCards(t: Tele): SortingCard[] | null {
  const out: SortingCard[] = []
  for (let i = 0; i < SORT_CARDS.length; i++) {
    const bin = get(t, `sortBin${i + 1}`)
    if (bin !== 0 && bin !== 1) return null
    const c = SORT_CARDS[i]
    const rule = i < SORT_SWITCH_AT ? 'colour' : 'shape'
    const rightBox = rule === 'colour' ? (c.color === 'red' ? 0 : 1) : (c.shape === 'star' ? 0 : 1)
    const ms = get(t, `sortMs${i + 1}`)
    out.push({card: i + 1, rule, color: c.color, shape: c.shape, box: bin === 0 ? 'Red star box' : 'Blue circle box', right: bin === rightBox, ms: ms !== null && ms >= 0 && ms <= 600000 ? Math.round(ms) : null})
  }
  const pre = out.slice(0, SORT_SWITCH_AT).filter((x) => x.right).length
  const post = out.slice(SORT_SWITCH_AT).filter((x) => x.right).length
  const preT = get(t, 'sortPreCorrect'), postT = get(t, 'sortPostCorrect')
  if ((preT !== null && preT !== pre) || (postT !== null && postT !== post)) return null
  return out
}

const POTS = ['Left urn', 'Centre amphora', 'Right vessel']
// The six gaze encounters in the order played. Must match JA_TRIALS in app/assessments/autism/page.tsx.
const GAZE_ORDER: Array<{pot: number; pointing: boolean}> = [
  {pot: 0, pointing: false}, {pot: 2, pointing: true}, {pot: 1, pointing: false},
  {pot: 0, pointing: true}, {pot: 2, pointing: false}, {pot: 1, pointing: true},
]
// The four feelings rounds in the order played, with the options as shown. Must match EMOTION_MIRROR_TRIALS in the same file.
const FEELINGS_ROUNDS: Array<{target: string; options: string[]}> = [
  {target: 'happy', options: ['sad', 'happy', 'surprised']},
  {target: 'sad', options: ['happy', 'sad', 'calm']},
  {target: 'surprised', options: ['calm', 'surprised', 'sad']},
  {target: 'calm', options: ['surprised', 'happy', 'calm']},
]
const cleanMs = (ms: number | null) => (ms !== null && ms >= 0 && ms <= 600000 ? Math.round(ms) : null)

/** Gaze game encounter by encounter. Kept only when all six choices are present and add up to the session total. */
export function gazeRounds(t: Tele): GazeRound[] | null {
  const out: GazeRound[] = []
  for (let i = 0; i < GAZE_ORDER.length; i++) {
    const pick = get(t, `gazePick${i + 1}`)
    if (pick === null || ![0, 1, 2].includes(pick)) return null
    const g = GAZE_ORDER[i]
    out.push({round: i + 1, target: POTS[g.pot], pointing: g.pointing, chosen: POTS[pick], matched: pick === g.pot, ms: cleanMs(get(t, `gazeMs${i + 1}`))})
  }
  const total = get(t, 'jaCorrect')
  if (total !== null && total !== out.filter((x) => x.matched).length) return null
  return out
}

/** Feelings match round by round. Kept only when all four choices are present and add up to the session total. */
export function feelingsRounds(t: Tele): FeelingsRound[] | null {
  const out: FeelingsRound[] = []
  for (let i = 0; i < FEELINGS_ROUNDS.length; i++) {
    const pick = get(t, `feelingsPick${i + 1}`)
    const r = FEELINGS_ROUNDS[i]
    if (pick === null || ![0, 1, 2].includes(pick)) return null
    out.push({round: i + 1, shown: r.target, chosen: r.options[pick], matched: r.options[pick] === r.target, ms: cleanMs(get(t, `feelingsMs${i + 1}`))})
  }
  const total = get(t, 'feelingsCorrect')
  if (total !== null && total !== out.filter((x) => x.matched).length) return null
  return out
}

/**
 * Steering game, arrow by arrow (ADHD quest). One entry per answered round, in the order played.
 * Kept only when every entry is well formed AND the counts add up to the session totals.
 */
export function steeringTrials(input: unknown, t: Tele): SteeringTrial[] | null {
  if (!Array.isArray(input) || input.length < 1 || input.length > 24) return null
  const out: SteeringTrial[] = []
  for (let i = 0; i < input.length; i++) {
    const x = input[i] as Record<string, unknown> | null
    if (!x || typeof x !== 'object') return null
    if (typeof x.congruent !== 'boolean' || typeof x.ok !== 'boolean') return null
    const ms = typeof x.ms === 'number' && Number.isFinite(x.ms) ? cleanMs(x.ms) : null
    out.push({trial: i + 1, arrows: x.congruent ? 'matching' : 'conflicting', correct: x.ok, ms})
  }
  const matching = out.filter((x) => x.arrows === 'matching')
  const conflicting = out.filter((x) => x.arrows === 'conflicting')
  const checks: Array<[number | null, number]> = [
    [get(t, 'flankerCongruentTotal'), matching.length],
    [get(t, 'flankerIncongruentTotal'), conflicting.length],
    [get(t, 'flankerCongruentN'), matching.filter((x) => x.correct).length],
    [get(t, 'flankerIncongruentN'), conflicting.filter((x) => x.correct).length],
  ]
  if (checks.some(([total, counted]) => total !== null && total !== counted)) return null
  return out
}

/**
 * Star-sequence game, level by level (ADHD quest). One entry per real level, in order.
 * Kept only when every entry is well formed AND the longest completed sequence matches the session span.
 */
export function starLevels(input: unknown, t: Tele): StarLevel[] | null {
  if (!Array.isArray(input) || input.length < 1 || input.length > 3) return null
  const out: StarLevel[] = []
  for (let i = 0; i < input.length; i++) {
    const x = input[i] as Record<string, unknown> | null
    if (!x || typeof x !== 'object') return null
    const len = typeof x.length === 'number' ? x.length : NaN
    const completed = x.completed
    const missed = typeof x.missedAt === 'number' ? x.missedAt : null
    if (!Number.isInteger(len) || len < 1 || len > 10 || typeof completed !== 'boolean') return null
    if (completed ? missed !== null : missed === null || !Number.isInteger(missed) || missed < 1 || missed > len) return null
    out.push({level: i + 1, length: len, completed, missedAt: completed ? null : missed})
  }
  const done = out.filter((x) => x.completed).map((x) => x.length)
  const longest = done.length ? Math.max(...done) : null
  if (get(t, 'workingMemorySpan') !== longest) return null
  return out
}

export function buildSessionRecord(args: {
  quest: Quest
  ageYears: number | null
  telemetry: Tele
  environment: Environment
  instrumentVersion: string
}): SessionRecord {
  const raw = (args.quest === 'adhd' ? adhdMeasures(args.telemetry) : autismMeasures(args.telemetry))
  const inst = INSTRUMENTS[args.quest]
  return {
    schema: RECORD_SCHEMA_VERSION,
    instrument: {id: inst.id, name: inst.name, version: args.instrumentVersion},
    quest: args.quest,
    ageYears: args.ageYears,
    ageBand: ageBandOf(args.ageYears),
    recordedAt: new Date().toISOString(),
    environment: args.environment,
    measures: raw.filter((m): m is Measure => m !== null).map(tagGame),
    ...(args.quest === 'autism' && sortingCards(args.telemetry) ? {sortingCards: sortingCards(args.telemetry)!} : {}),
    ...(args.quest === 'autism' && gazeRounds(args.telemetry) ? {gazeRounds: gazeRounds(args.telemetry)!} : {}),
    ...(args.quest === 'autism' && feelingsRounds(args.telemetry) ? {feelingsRounds: feelingsRounds(args.telemetry)!} : {}),
    limits: LIMITS,
  }
}

/**
 * Extra rows for the sunbird game, one pair per round: how fast the child tapped and how many sunbirds were missed.
 * These show whether tapping changed over the session. Each round has only a few sunbirds, so the intervals are wide.
 */
export function roundMeasures(
  rounds: {count: number; size: number; displayMs: number | null; rtMs: Array<number | null>; misses: number[]},
  t: Tele,
): Measure[] {
  const targets = get(t, 'cptTargets')
  const perRound = targets !== null && targets % rounds.count === 0 ? targets / rounds.count : null
  const out: Array<Measure | null> = [
    value('cptDisplayMs', 'How long each sunbird or moth stayed on screen', rounds.displayMs, 'ms', null,
      'Set by age (longer for ages 4 to 5), so counts from different ages are not directly comparable.'),
  ]
  for (let i = 0; i < rounds.count; i++) {
    out.push(value(`rtRound${i + 1}Ms`, `Average tap speed, round ${i + 1}`, rounds.rtMs[i] ?? null, 'ms', null,
      i === 0 ? 'Shown only when at least 3 taps were recorded in the round.' : undefined))
    out.push(proportion(`omissionsRound${i + 1}`, `Sunbirds missed, round ${i + 1}`, rounds.misses[i] ?? null, perRound))
  }
  return out.filter((m): m is Measure => m !== null).map(tagGame)
}

/** Browser only: collects the device details to send as `environment` with the session. */
export function captureEnvironment(): Environment {
  if (typeof window === 'undefined') {
    return {userAgent: null, language: null, timezone: null, screen: null, touch: null}
  }
  let timezone: string | null = null
  try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || null } catch { timezone = null }
  return {
    userAgent: null, // the server reads the User-Agent header itself
    language: navigator.language || null,
    timezone,
    screen: {width: window.screen.width, height: window.screen.height, pixelRatio: window.devicePixelRatio || 1},
    touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  }
}
