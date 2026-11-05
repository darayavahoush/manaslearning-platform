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
    if (assessmentType !== 'adhd' && assessmentType !== 'autism') {
      return NextResponse.json({error: 'Unknown activity'}, {status: 400})
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
      clinicalReport: {
        generatedOn: new Date().toLocaleDateString('en-IN', {year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata'}),
        instrument: {name: assessmentType === 'adhd' ? 'Manas attention play activity' : 'Manas social and sensory play activity', version: INSTRUMENT_VERSION},
        summary:
          withData === 0
            ? `${childName} did not finish enough of the games to show anything useful. You are welcome to try again.`
            : `${childName} played ${withData} of ${indices.length} short games. Below are the counts and speeds from this one session. They are not scored against other children, and they cannot show whether a child has ADHD or autism.`,
        indices,
        questions: assessmentType === 'adhd' ? ADHD_QUESTIONS : AUTISM_QUESTIONS,
        accommodations: assessmentType === 'adhd' ? ADHD_IDEAS : AUTISM_IDEAS,
      },
    }

    return NextResponse.json({success: true, data: state})
  } catch {
    return NextResponse.json({error: 'Could not build the summary'}, {status: 500})
  }
}
