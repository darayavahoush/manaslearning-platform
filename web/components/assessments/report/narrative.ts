import type {Measure, ProportionMeasure, SessionRecord, ValueMeasure} from '../session-record'
import {EXPECTED_GAMES} from '../roadmap/library'

/**
 * Plain-language lines for the parent part of the report, built by fixed rules from the session record.
 * Every line states what was counted. None says a result is high, low, good, typical or unusual.
 */

export interface GameStory {
  game: string
  lines: string[]
  /** shown once under the game when the numbers rest on very few trials */
  fewTrials: boolean
}

type Rec = Pick<SessionRecord, 'quest' | 'measures' | 'sortingCards' | 'gazeRounds' | 'feelingsRounds' | 'starLevels'> & Partial<Pick<SessionRecord, 'parentCard' | 'helpRound' | 'steeringSkin' | 'starMode' | 'showRounds' | 'ruleCheck' | 'camera' | 'looking'>>

const find = (r: Rec, key: string): Measure | undefined => r.measures.find((x) => x.key === key)
const prop = (r: Rec, key: string): ProportionMeasure | null => {
  const x = find(r, key)
  return x && x.kind === 'proportion' ? x : null
}
const val = (r: Rec, key: string): ValueMeasure | null => {
  const x = find(r, key)
  return x && x.kind === 'value' ? x : null
}
const secs = (ms: number) => (Math.round(ms / 100) / 10).toFixed(1)
const times = (n: number) => (n === 1 ? 'once' : `${n} times`)
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

function gaze(r: Rec, who: string): string[] {
  const g = prop(r, 'gazeMatches')
  if (!g) return []
  const t = val(r, 'gazeMedianMs')
  const out = [`Joint attention: ${who} followed a partner’s social gaze and pointing cues in ${g.k} of ${g.n} rounds${t ? `, responding after about ${secs(t.value)} seconds` : ''}.`]
  const rounds = r.gazeRounds
  if (rounds?.length) {
    const split = (pointing: boolean) => {
      const xs = rounds.filter((x) => x.pointing === pointing)
      return `${xs.filter((x) => x.matched).length} of ${xs.length}`
    }
    out.push(`Social cues: when the partner looked and pointed together, ${split(true)} cues were followed. When guided by eye gaze alone, ${split(false)} cues were followed.`)
    const hid = rounds.filter((x) => x.hidden)
    if (hid.length) out.push(`Visual perspective: when the target object was partially occluded behind a pillar, ${hid.filter((x) => x.matched).length} of ${hid.length} choices matched.`)
  }
  if (r.showRounds?.length) {
    const shown = r.showRounds.filter((x) => x.chosen !== null)
    const sparkle = shown.filter((x) => x.matched).length
    out.push(shown.length === 0
      ? `Initiating social sharing: in spontaneous sharing opportunities, ${who} did not proactively initiate sharing an object with the partner.`
      : `Initiating social sharing: ${who} proactively shared an object with the partner in ${shown.length} of ${r.showRounds.length} opportunities, specifically sharing the target object with the sparkle in ${sparkle} of them.`)
  }
  return out
}

function feelings(r: Rec, who: string): string[] {
  const f = prop(r, 'feelingsMatches')
  if (!f) return []
  const out = [`Facial emotion recognition: accurately identified and matched ${f.k} of ${f.n} facial emotion expressions.`]
  const missed = r.feelingsRounds?.filter((x) => !x.matched) ?? []
  if (missed.length) out.push(`Emotion differentiation: ${missed.map((x) => `for the ${x.shown} expression, chose the ${x.chosen} expression`).join('; ')}.`)
  if (r.helpRound) out.push(`Empathetic prosocial response: when a character expressed sadness, ${who} selected "${r.helpRound.chosen}" as a supportive response.`)
  return out
}

function comfort(r: Rec, who: string): string[] {
  const out: string[] = []
  const pick = (key: string, label: string) => {
    const v = val(r, key)
    return `${label} ${v ? `${v.value} out of 10` : 'not set'}`
  }
  if (['lightLevel', 'soundLevel', 'touchLevel'].some((k) => val(r, k))) {
    out.push(`Sensory preferences: ${who} set baseline comfort levels at ${pick('lightLevel', 'lighting')}, ${pick('soundLevel', 'ambient sound')}, ${pick('touchLevel', 'tactile weight')}.`)
  }
  // the room was only run through the turn-it-up-slowly part when designSec is present; a missing stop then means "never said too much"
  if (val(r, 'designSec')) {
    const said = (label: string, name: string) => {
      const v = val(r, `rampStop${label}`)
      return `${name} ${v ? `at ${v.value} of 10` : 'did not reach discomfort threshold'}`
    }
    out.push(`Sensory threshold calibration: when stimulation was increased gradually, ${who} signaled discomfort for: ${said('Light', 'visual light')}; ${said('Sound', 'auditory volume')}; ${said('Texture', 'tactile weight')}.`)
  }
  return out
}

function sorting(r: Rec, who: string): string[] {
  const pre = prop(r, 'sortPre')
  const post = prop(r, 'sortPost')
  const out: string[] = []
  if (r.ruleCheck) {
    out.push(`Explicit rule recall: asked immediately after the shift which way items were being sorted, ${who} identified ${r.ruleCheck.answered} (${r.ruleCheck.correct ? 'the new rule' : 'the previous rule'}).`)
  }
  if (pre) out.push(`Rule acquisition: ${who} categorized ${pre.k} of ${pre.n} items correctly under the initial rule.`)
  if (post) out.push(`Cognitive flexibility: after the sorting rule changed, ${post.k} of ${post.n} items were sorted correctly under the new rule (smooth mental set shifting).`)
  const key = r.sortingCards?.find((c) => c.card === 4)
  if (key) {
    out.push(
      `Critical conflict trial: on trial 4 where the old and new rules conflicted, ${who} selected the ${key.box.toLowerCase()}${key.ms !== null ? ` after ${secs(key.ms)} seconds` : ''}, which aligns with the ${key.right ? 'new shifted rule (successful cognitive adaptation)' : 'initial rule (cognitive perseveration)'}.`,
    )
  }
  return out
}

function sunbird(r: Rec): string[] {
  const out: string[] = []
  const he = prop(r, 'holdEarly')
  if (he) out.push(`Motor pacing & patience: in timed waiting periods, waited for the cue, responding prematurely before the signal in ${he.k} of ${he.n} intervals.`)
  const hr = val(r, 'holdRtMs')
  if (hr) out.push(`Response reaction time: after the signal, responded in about ${Math.round(hr.value)} ms on average.`)
  const om = find(r, 'omissions')
  if (om?.kind === 'proportion') out.push(`Sustained attention: caught ${om.n - om.k} of ${om.n} target visual cues (${om.k} missed during quiet monitoring).`)
  else if (om?.kind === 'value') out.push(`Sustained attention: missed ${om.value} ${plural(om.value, 'target cue', 'target cues')} during quiet monitoring.`)
  const co = find(r, 'commissions')
  if (co?.kind === 'proportion') out.push(`Impulse control: successfully paused and held back on ${co.n - co.k} of ${co.n} stop signals (acted on impulse in ${co.k}).`)
  else if (co?.kind === 'value') out.push(`Impulse control: responded on impulse to ${co.value} stop ${plural(co.value, 'signal', 'signals')}.`)
  const h = val(r, 'hrtMs')
  if (h) out.push(`Average response speed: about ${Math.round(h.value)} ms.`)
  const a = val(r, 'rtFirstHalfMs')
  const b = val(r, 'rtSecondHalfMs')
  if (a && b) out.push(`Mental stamina: average response speed was ${Math.round(a.value)} ms in the first half and ${Math.round(b.value)} ms in the second half (${b.value > a.value * 1.2 ? 'noticeable cognitive fatigue' : 'steady pace'}).`)
  return out
}

function steering(r: Rec): string[] {
  const out: string[] = []
  const c = prop(r, 'flankerCongruent')
  const i = prop(r, 'flankerIncongruent')
  if (c && i) out.push(`Distraction filtering: resolved ${c.k} of ${c.n} trials accurately when surrounding cues aligned, and ${i.k} of ${i.n} when surrounding visual cues conflicted.`)
  else if (c) out.push(`Baseline visual discrimination: answered ${c.k} of ${c.n} trials accurately in straightforward visual conditions.`)
  else if (i) out.push(`Selective attention: answered ${i.k} of ${i.n} trials accurately with conflicting surrounding distractions.`)
  const cost = val(r, 'flankerCostMs')
  if (cost) {
    const ms = Math.round(Math.abs(cost.value))
    out.push(`Distraction interference cost: processing conflicting surroundings required about ${ms} ms ${cost.value >= 0 ? 'additional processing time' : 'less time'}.`)
  }
  return out
}

function stars(r: Rec): string[] {
  const out: string[] = []
  if (r.starMode === 'tones') out.push('Auditory-visual integration: this session incorporated auditory tones alongside visual spatial cues.')
  const s = val(r, 'workingMemorySpan')
  if (s) out.push(`Visual-spatial working memory span: retained and reproduced sequences up to ${s.value} steps in length.`)
  for (const lv of r.starLevels ?? []) {
    if (!lv.completed && lv.missedAt !== null) out.push(`Sequence retention limit: on the ${lv.length}-step sequence, recall broke down at step ${lv.missedAt}.`)
  }
  return out
}

function patience(r: Rec): string[] {
  const p = prop(r, 'prematureReleases')
  return p ? [`Motor persistence & delayed gratification: maintained sustained physical touch to 100% completion in ${p.n - p.k} of ${p.n} attempts (released prematurely in ${p.k}).`] : []
}

function parentAnswers(r: Rec): string[] {
  const c = r.parentCard
  if (!c) return []
  const out: string[] = []
  if (c.tired) out.push(c.tired === 'Not at all' ? 'You said they did not seem tired.' : c.tired === 'A little' ? 'You said they seemed a little tired.' : 'You said they seemed quite tired.')
  if (c.likeHome) out.push(c.likeHome === 'Very like' ? 'You said the play was very like how they are at home or in class.' : c.likeHome === 'Somewhat like' ? 'You said the play was somewhat like how they are at home or in class.' : 'You said the play was not much like how they are at home or in class.')
  if (c.enjoyed) out.push(c.enjoyed === 'Enjoyed it' ? 'You said they enjoyed the play.' : c.enjoyed === 'It was okay' ? 'You said they found the play okay.' : 'You said they did not enjoy the play.')
  return out
}

/** The optional camera step. Describes where the head and eyes pointed; never says why, and never says a result is high or low. */
function camera(r: Rec, who: string): string[] {
  const c = r.camera
  if (!c) return []
  if (c.status === 'low_quality') {
    return [`The camera was on for about ${c.seconds} seconds, but ${who.toLowerCase() === 'your child' ? 'your child' : who}'s face could be seen for only ${c.trackedPct}% of that time (lighting, the angle or the distance can cause this), so no camera numbers are shown.`]
  }
  const away = val(r, 'camAwayPct')
  const events = val(r, 'camAwayEvents')
  const move = val(r, 'camMovePct')
  const out = [`The camera was on for about ${c.seconds} seconds, and the face could be seen for ${c.trackedPct}% of that time.`]
  if (away) out.push(`The head or eyes were turned away from the screen for about ${Math.round(away.value)}% of the time${events ? `, in ${events.value === 0 ? 'no stretches' : events.value === 1 ? 'one stretch' : `${events.value} stretches`} of a second or more` : ''}.`)
  const per = [['sunbird game', 'camAwayPctSunbird'], ['steering game', 'camAwayPctSteering'], ['star-sequence game', 'camAwayPctStars']]
    .map(([label, key]) => [label, val(r, key)] as const)
    .filter((x): x is readonly [string, ValueMeasure] => x[1] !== null)
  if (per.length) out.push(`By game, the share of time turned away was ${per.map(([l, m]) => `${Math.round(m.value)}% in the ${l}`).join(', ')}.`)
  if (move) out.push('Head movement was also measured. It includes small camera noise, so it is shown in the full figures for a clinician rather than as a number to compare.')
  out.push('This shows where the head and eyes pointed, not why. Children look away to think, to rest, or because something else caught their eye.')
  return out
}

/** The optional looking game (autism quest). Describes which side was looked at; never says why, and never says a result is high or low. */
function looking(r: Rec, who: string): string[] {
  const l = r.looking
  if (!l) return []
  if (l.status === 'not_calibrated') {
    return [`The looking game was started, but the camera could not tell when ${who} looked left and when right (lighting, the angle or the distance can cause this), so the pictures were skipped and no numbers are shown.`]
  }
  if (l.status === 'low_quality') {
    return [`In the looking game the camera could tell which side ${who} looked at for only ${l.valid} of the ${l.shown} pictures, which is too few to show numbers.`]
  }
  const social = val(r, 'lookSocialPct')
  const right = val(r, 'lookRightPct')
  const out = [`In the looking game two pictures sat side by side: a friendly cartoon face and some moving shapes, with the face on each side equally often. The camera could tell which side ${who} looked at for ${l.valid} of the ${l.shown} pictures.`]
  if (social) out.push(`Of the time ${who} looked at one side or the other, about ${Math.round(social.value)}% was on the face and ${100 - Math.round(social.value)}% on the shapes.`)
  if (right && (right.value >= 80 || right.value <= 20)) {
    out.push(`Most of the looking was towards the ${right.value >= 80 ? 'right' : 'left'} side of the screen whichever picture was there, so these numbers say little about the pictures themselves.`)
  }
  out.push('Children differ a lot in what they like to watch, and the face and the shapes differ in movement and brightness too. This describes what was watched in this one short game, and nothing more.')
  return out
}

/** A two-choice listening or spelling game: how many matched, how long choosing took, and how often the sounds were replayed. */
function twoChoice(r: Rec, matchKey: string, medianKey: string, replayKey: string, what: string): string[] {
  const m = prop(r, matchKey)
  if (!m) return []
  const t = val(r, medianKey)
  const rp = val(r, replayKey)
  const out = [`${m.k} of ${m.n} ${what}${t ? `, usually chosen after about ${secs(t.value)} seconds` : ''}.`]
  if (rp && rp.value > 0) out.push(`The sounds were replayed ${times(rp.value)}. Replaying is a normal thing to do.`)
  return out
}

function rhyme(r: Rec): string[] {
  return twoChoice(r, 'rhymeMatches', 'rhymeMedianMs', 'rhymeReplays', 'choices accurately identified words that rhymed (phonological rhyme awareness)')
}

function firstSound(r: Rec): string[] {
  return twoChoice(r, 'firstSoundMatches', 'firstSoundMedianMs', 'firstSoundReplays', 'choices accurately isolated and matched the opening speech sound (phoneme isolation)')
}

function letters(r: Rec): string[] {
  const found = prop(r, 'letterFound')
  if (!found) return []
  const out = [`Orthographic discrimination: identified ${found.k} of ${found.n} target letters among visually similar look-alikes (b, d, p and q).`]
  const taps = prop(r, 'letterLookalikeTaps')
  if (taps) {
    const mirror = val(r, 'letterMirrorTaps')
    out.push(`Spatial orientation & reversals: avoided confusing mirror-image letters on ${taps.n - taps.k} of ${taps.n} opportunities${taps.k > 0 && mirror ? ` (${mirror.value} errors involved direct mirror pairs like b/d or p/q)` : ''}.`)
  }
  return out
}

function soundOrder(r: Rec): string[] {
  const p = prop(r, 'soundSpanPassed')
  if (!p) return []
  const longest = val(r, 'soundSpanLongest')
  return [`Verbal working memory: repeated ${p.k} of ${p.n} spoken sound sequences in exact order${longest && longest.value > 0 ? `, reaching a sequence span of ${longest.value} syllables` : ''}.`]
}

function wordCheck(r: Rec): string[] {
  const real = prop(r, 'wordCheckReal')
  const made = prop(r, 'wordCheckMadeUp')
  if (!real && !made) return []
  const out: string[] = []
  if (real) out.push(`Sight word recognition: recognized ${real.k} of ${real.n} familiar printed words.`)
  if (made) out.push(`Phonetic decoding & word attack: successfully sounded out and identified ${made.k} of ${made.n} unfamiliar pseudowords (sounding out phonetically rather than guessing by shape).`)
  return out
}

function spelling(r: Rec): string[] {
  const s = prop(r, 'spellingCorrect')
  if (!s) return []
  const t = val(r, 'spellingMedianMs')
  return [`Orthographic memory: selected the correct conventional spelling in ${s.k} of ${s.n} words${t ? `, responding after about ${secs(t.value)} seconds` : ''} (distinguishing conventional letter patterns from phonetic approximations).`]
}

function during(r: Rec): string[] {
  const out: string[] = [...parentAnswers(r)]
  const names: Record<string, string> = {
    retrySunbird: 'sustained attention activity', retrySteering: 'distraction filtering activity', retryStars: 'working memory activity',
    retryGaze: 'joint attention activity', retryFeelings: 'emotion perception activity', retrySorting: 'rule switching activity', retryLetters: 'letter discrimination activity',
  }
  const repeats = Object.entries(names)
    .map(([key, label]) => [label, val(r, key)?.value ?? 0] as const)
    .filter(([, n]) => n > 0)
  if (repeats.length) out.push(`Practice was repeated: ${repeats.map(([l, n]) => `${l} ${times(n)}`).join(', ')}. Repeating practice indicates initial task clarification, not a cognitive score.`)
  const pc = val(r, 'pauseCount')
  const ps = val(r, 'pausedSec')
  if (pc && pc.value > 0) {
    out.push(`The session was paused or switched away from ${times(pc.value)}${ps ? `, for about ${Math.round(ps.value)} seconds in total` : ''}. This can be due to a short break, notification or environment shift.`)
  }
  return out
}

export const STORY_SECTION_TITLE: Record<string, string> = {
  'Sunbird game': 'Sustained Attention & Impulse Control (Continuous Performance)',
  'Steering game': 'Selective Attention & Distraction Filtering (Flanker Task)',
  'Star-sequence game': 'Visual Working Memory & Sequence Recall (Spatial Span)',
  'Patience game': 'Motor Persistence & Delayed Gratification (Hold Task)',
  'Gaze game': 'Joint Attention & Social Referencing',
  'Feelings match': 'Facial Emotion Recognition & Social Empathy',
  'Comfort choices': 'Sensory Calibration & Comfort Thresholds',
  'Sorting game': 'Cognitive Flexibility & Rule Switching (DCCS Task)',
  'Rhyme game': 'Phonological Rhyme Awareness',
  'First-sound game': 'Beginning Sound Isolation & Phonemic Awareness',
  'Letter game': 'Orthographic Discrimination & Letter Reversals (b/d/p/q)',
  'Sound-order game': 'Verbal Working Memory & Sound Sequencing',
  'Word check (optional)': 'Phonological Decoding & Word Attack',
  'Spelling game (optional)': 'Orthographic Spelling Recall & Conventions',
  'Camera (optional)': 'Visual Attention & Head Pose (Camera Observation)',
  'Looking game (optional camera)': 'Social vs Non-Social Visual Preference',
  'During the session': 'Session Context & Observations',
}

/** One entry per game for the parent part. Games with no recorded results are listed in `missing`. */
export function buildGameStories(record: Rec, name?: string): {stories: GameStory[]; missing: string[]} {
  const who = name?.trim() || 'Your child'
  const builders: Record<string, (r: Rec) => string[]> = {
    'Sunbird game': sunbird,
    'Steering game': steering,
    'Star-sequence game': stars,
    'Patience game': patience,
    'Gaze game': (r) => gaze(r, who),
    'Feelings match': (r) => feelings(r, who),
    'Comfort choices': (r) => comfort(r, who),
    'Sorting game': (r) => sorting(r, who),
    'Rhyme game': rhyme,
    'First-sound game': firstSound,
    'Letter game': letters,
    'Sound-order game': soundOrder,
    'Word check (optional)': wordCheck,
    'Spelling game (optional)': spelling,
  }
  const games = [...EXPECTED_GAMES[record.quest]] as string[]
  const stories: GameStory[] = []
  const missing: string[] = []
  for (const game of games) {
    const lines = builders[game]?.(record) ?? []
    if (!lines.length) { missing.push(STORY_SECTION_TITLE[game] || game); continue }
    const fewTrials = record.measures.some((m) => m.game === game && m.kind === 'proportion' && m.wide)
    stories.push({game: STORY_SECTION_TITLE[game] || game, lines, fewTrials})
  }
  if (record.quest === 'dyslexia') {
    for (const game of ['Word check (optional)', 'Spelling game (optional)']) {
      const lines = builders[game](record)
      if (lines.length) stories.push({game: STORY_SECTION_TITLE[game] || game, lines, fewTrials: record.measures.some((m) => m.game === game && m.kind === 'proportion' && m.wide)})
    }
  }
  const cl = camera(record, who)
  if (cl.length) stories.push({game: STORY_SECTION_TITLE['Camera (optional)'] || 'Camera (optional)', lines: cl, fewTrials: false})
  const ll = looking(record, who)
  if (ll.length) stories.push({game: STORY_SECTION_TITLE['Looking game (optional camera)'] || 'Looking game (optional camera)', lines: ll, fewTrials: false})
  const dl = during(record)
  if (dl.length) stories.push({game: STORY_SECTION_TITLE['During the session'] || 'During the session', lines: dl, fewTrials: false})
  return {stories, missing}
}
