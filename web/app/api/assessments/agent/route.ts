import {NextResponse} from 'next/server'

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
  superpowers: {
    realmTitle: string
    crestBadge: string
    elementalAffinity: string
    badges: Array<{name: string; desc: string; icon: string; rank: string}>
    miloScroll: string
  }
  clinicalReport: {
    generatedOn: string
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
  // Autism quest
  'jaTrials', 'jaCorrect', 'jaMedianMs', 'feelingsTrials', 'feelingsCorrect',
  'lightLevel', 'soundLevel', 'touchLevel', 'sortCount', 'sortMedianMs',
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
      value: `Missed the sunbird ${times(t.omissions)}`,
      detail: `Tapped on the shadow moth ${times(t.commissions)} · ${trials} sightings in total`,
      note: `A few sightings is a short sample, so small differences mean very little. ${ONE_SESSION}`,
    })
  } else {
    obs.push({name: 'Spotting the sunbird', value: NOT_ENOUGH, detail: 'The game did not finish or did not report back.', note: ONE_SESSION})
  }

  // Tap speed
  if (t.hrtMs !== null && t.rtvMs !== null && (t.cptResponses ?? 0) >= 5) {
    obs.push({
      name: 'Tap speed',
      value: `About ${Math.round(t.hrtMs)} ms on average`,
      detail: `Speed varied by about ${Math.round(t.rtvMs)} ms from tap to tap · ${t.cptResponses} taps recorded`,
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
      detail: `${t.flankerCongruentN} matching rounds and ${t.flankerIncongruentN} conflicting rounds`,
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

  if (t.lightLevel !== null && t.soundLevel !== null && t.touchLevel !== null) {
    obs.push({
      name: 'Comfort preferences',
      value: `Light ${Math.round(t.lightLevel)}/10 · Sound ${Math.round(t.soundLevel)}/10 · Touch ${Math.round(t.touchLevel)}/10`,
      detail: 'The levels your child picked for the lantern, the rain and the cushion.',
      note: 'These show what felt cosy in the game. They are preferences, not a test result.',
    })
  } else {
    obs.push({name: 'Comfort preferences', value: NOT_ENOUGH, detail: 'The sliders were not recorded.', note: 'These are preferences, not a test result.'})
  }

  if (t.sortCount !== null && t.sortCount > 0) {
    obs.push({
      name: 'Sorting game',
      value: `${Math.round(t.sortCount)} cards sorted`,
      detail: t.sortMedianMs !== null ? `About ${Math.round(t.sortMedianMs)} ms per card` : 'Timing was not recorded.',
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

const ADHD_IDEAS = {
  classroom: [
    'If your child is easily pulled away, try a seat away from doors, windows and busy corners.',
    'A short visual checklist on the desk can make multi-step tasks easier to follow.',
    'A quiet private signal, like a sticky note, can redirect gently without embarrassment.',
  ],
  examinations: [
    'Ask the school whether extra time or a quieter room is possible for tests, if your child finds them hard.',
    'Ask teachers to rephrase long, multi-part questions when needed.',
  ],
  executive: [
    'Break longer tasks into short chunks with a visual timer.',
    'Colour-coded folders or a simple tracker can help with remembering materials.',
  ],
  sensoryDiet: [
    'Short movement breaks between tasks, such as stretching, wall push-ups or a quick errand.',
    'Some children like a quiet fidget, such as a textured strip or a resistance band on the chair.',
  ],
}

const AUTISM_IDEAS = {
  classroom: [
    'Now / Next / Later visual schedules before transitions can make the day more predictable.',
    'Clear, direct instructions often help. Try to avoid idioms and sarcasm.',
    'Warn before changes, for example with a visual countdown 5 and 2 minutes before switching activities.',
  ],
  examinations: [
    'Ask whether extra time or a quiet space is possible for tests.',
    'Low-glare, low-echo rooms can help if lights or noise are bothersome.',
  ],
  executive: [
    'Linking new topics to something your child loves can make them easier to start.',
    'Numbered checklists can turn multi-step work into clear steps.',
  ],
  sensoryDiet: [
    'A calm corner with soft light, cushions and headphones can give a place to take a break.',
    'Seamless clothing, sunglasses or ear defenders may help in busy places, if your child finds them bothersome.',
  ],
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
      superpowers: buildSuperpowers(assessmentType, childName, guildClass),
      clinicalReport: {
        generatedOn: new Date().toLocaleDateString('en-IN', {year: 'numeric', month: 'long', day: 'numeric'}),
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
