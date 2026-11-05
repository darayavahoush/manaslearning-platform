import {wilson} from './profile-stats'

/**
 * Manas Profile: one structured, versioned record of a play session.
 *
 * The record holds counts, timings and 95% intervals. It holds no norms, no cut-offs, no scores
 * against other children and no labels. It exists so that every session is kept in the same
 * shape, which is what later reliability and validation work needs. Nothing here is stored by
 * this code; the record is built in the response and handed back to the caller.
 */

export const RECORD_SCHEMA_VERSION = '1.0'

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
  limits: string[]
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

export function buildSessionRecord(args: {
  quest: Quest
  ageYears: number | null
  telemetry: Tele
  environment: Environment
  instrumentVersion: string
}): SessionRecord {
  const raw = args.quest === 'adhd' ? adhdMeasures(args.telemetry) : autismMeasures(args.telemetry)
  const inst = INSTRUMENTS[args.quest]
  return {
    schema: RECORD_SCHEMA_VERSION,
    instrument: {id: inst.id, name: inst.name, version: args.instrumentVersion},
    quest: args.quest,
    ageYears: args.ageYears,
    ageBand: ageBandOf(args.ageYears),
    recordedAt: new Date().toISOString(),
    environment: args.environment,
    measures: raw.filter((m): m is Measure => m !== null),
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
  return out.filter((m): m is Measure => m !== null)
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
