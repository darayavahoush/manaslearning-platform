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
  const out = [`${who} chose the vessel Aria looked or pointed at in ${g.k} of ${g.n} rounds${t ? `, usually after about ${secs(t.value)} seconds` : ''}.`]
  const rounds = r.gazeRounds
  if (rounds?.length) {
    const split = (pointing: boolean) => {
      const xs = rounds.filter((x) => x.pointing === pointing)
      return `${xs.filter((x) => x.matched).length} of ${xs.length}`
    }
    out.push(`When Aria looked and pointed, ${split(true)} choices matched. When she only looked, ${split(false)} matched.`)
    const hid = rounds.filter((x) => x.hidden)
    if (hid.length) out.push(`When the target urn was partly behind a pillar, ${hid.filter((x) => x.matched).length} of ${hid.length} choices matched.`)
  }
  if (r.showRounds?.length) {
    const shown = r.showRounds.filter((x) => x.chosen !== null)
    const sparkle = shown.filter((x) => x.matched).length
    out.push(shown.length === 0
      ? `In the show-Aria turns, ${who} did not show her a vessel.`
      : `In the show-Aria turns, ${who} showed Aria a vessel in ${shown.length} of ${r.showRounds.length} turns, and the urn with the sparkle in ${sparkle} of them.`)
  }
  return out
}

function feelings(r: Rec, who: string): string[] {
  const f = prop(r, 'feelingsMatches')
  if (!f) return []
  const out = [`${f.k} of ${f.n} cartoon faces were matched to the feeling shown.`]
  const missed = r.feelingsRounds?.filter((x) => !x.matched) ?? []
  if (missed.length) out.push(`${missed.map((x) => `For the ${x.shown} face, the ${x.chosen} face was chosen`).join('; ')}.`)
  if (r.helpRound) out.push(`When the sprite looked sad, ${who} chose ${r.helpRound.chosen} as what would help. There is no right answer to this step.`)
  return out
}

function comfort(r: Rec, who: string): string[] {
  const out: string[] = []
  const pick = (key: string, label: string) => {
    const v = val(r, key)
    return `${label} ${v ? `${v.value} out of 10` : 'not chosen'}`
  }
  if (['lightLevel', 'soundLevel', 'touchLevel'].some((k) => val(r, k))) {
    out.push(`${who} chose: ${pick('lightLevel', 'light')}, ${pick('soundLevel', 'sound')}, ${pick('touchLevel', 'touch')}. These were choices in a game, so they are preferences, not results.`)
  }
  // the room was only run through the turn-it-up-slowly part when designSec is present; a missing stop then means "never said too much"
  if (val(r, 'designSec')) {
    const said = (label: string, name: string) => {
      const v = val(r, `rampStop${label}`)
      return `${name} ${v ? `at ${v.value} of 10` : 'never reached too much'}`
    }
    out.push(`When each sense was turned up slowly, ${who} said it was too much for: ${said('Light', 'light')}; ${said('Sound', 'rain sound')}; ${said('Texture', 'cushion weight')}. One session shows only what felt like too much that day.`)
  }
  return out
}

function sorting(r: Rec, who: string): string[] {
  const pre = prop(r, 'sortPre')
  const post = prop(r, 'sortPost')
  const out: string[] = []
  if (r.ruleCheck) {
    out.push(`Asked just after the change which way the gems were being sorted, ${who} said by ${r.ruleCheck.answered}. ${r.ruleCheck.correct ? 'That is the new rule.' : 'That is the rule from before the change.'}`)
  }
  if (pre) out.push(`${who} put ${pre.k} of ${pre.n} cards in the right box under the colour rule.`)
  if (post) out.push(`After the rule changed to shape, ${post.k} of ${post.n} cards went in the right box.`)
  const key = r.sortingCards?.find((c) => c.card === 4)
  if (key) {
    out.push(
      `Card 4 (the blue star) is the one card where the colour rule and the shape rule point to different boxes. ${who} tapped the ${key.box.toLowerCase()}${key.ms !== null ? `, after about ${secs(key.ms)} seconds` : ''}, which matches the ${key.right ? 'shape' : 'colour'} rule. The other cards after the change go in the same box under either rule, so one session cannot say much about switching rules.`,
    )
  }
  return out
}

function sunbird(r: Rec): string[] {
  const out: string[] = []
  const he = prop(r, 'holdEarly')
  if (he) out.push(`In the hold-still waits, the child tapped before the chime in ${he.k} of ${he.n}.`)
  const hr = val(r, 'holdRtMs')
  if (hr) out.push(`After the chime, the child tapped about ${Math.round(hr.value)} ms later on average.`)
  const om = find(r, 'omissions')
  if (om?.kind === 'proportion') out.push(`${om.k} of ${om.n} sunbirds were missed.`)
  else if (om?.kind === 'value') out.push(`${om.value} ${plural(om.value, 'sunbird was', 'sunbirds were')} missed.`)
  const co = find(r, 'commissions')
  if (co?.kind === 'proportion') out.push(`The shadow moth was tapped ${co.k} of ${co.n} times it appeared.`)
  else if (co?.kind === 'value') out.push(`The shadow moth was tapped ${times(co.value)}.`)
  const h = val(r, 'hrtMs')
  if (h) out.push(`Average tap speed was about ${Math.round(h.value)} ms.`)
  const a = val(r, 'rtFirstHalfMs')
  const b = val(r, 'rtSecondHalfMs')
  if (a && b) out.push(`Average tap speed was about ${Math.round(a.value)} ms in the first half and ${Math.round(b.value)} ms in the second half.`)
  return out
}

function steering(r: Rec): string[] {
  const out: string[] = []
  if (r.steeringSkin === 'rocket') out.push('This session used the rocket version of the steering game. The rules are the same as the arrow version.')
  const c = prop(r, 'flankerCongruent')
  const i = prop(r, 'flankerIncongruent')
  if (c && i) out.push(`${c.k} of ${c.n} rounds were answered correctly when the arrows matched, and ${i.k} of ${i.n} when they disagreed.`)
  else if (c) out.push(`${c.k} of ${c.n} rounds were answered correctly when the arrows matched.`)
  else if (i) out.push(`${i.k} of ${i.n} rounds were answered correctly when the arrows disagreed.`)
  const cost = val(r, 'flankerCostMs')
  if (cost) {
    const ms = Math.round(Math.abs(cost.value))
    out.push(`Correct answers took about ${ms} ms ${cost.value >= 0 ? 'longer' : 'less time'} when the arrows disagreed.`)
  }
  return out
}

function stars(r: Rec): string[] {
  const out: string[] = []
  if (r.starMode === 'tones') out.push('This session used tones instead of lights. The sequence and the rules are the same, but the task is listening as well as remembering.')
  const s = val(r, 'workingMemorySpan')
  if (s) out.push(`The longest star sequence repeated correctly was ${s.value} ${plural(s.value, 'star', 'stars')}.`)
  for (const lv of r.starLevels ?? []) {
    if (!lv.completed && lv.missedAt !== null) out.push(`The ${lv.length}-star sequence was not repeated in order. The first wrong tap was star ${lv.missedAt}.`)
  }
  return out
}

function patience(r: Rec): string[] {
  const p = prop(r, 'prematureReleases')
  return p ? [`${p.k} of ${p.n} tries ended with an early release. This is a practice game, not a validated task.`] : []
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
  return twoChoice(r, 'rhymeMatches', 'rhymeMedianMs', 'rhymeReplays', 'choices matched the word that rhymed with the one heard')
}

function firstSound(r: Rec): string[] {
  return twoChoice(r, 'firstSoundMatches', 'firstSoundMedianMs', 'firstSoundReplays', 'choices matched the word that started with the same sound')
}

function letters(r: Rec): string[] {
  const found = prop(r, 'letterFound')
  if (!found) return []
  const out = [`${found.k} of ${found.n} matching letters (among b, d, p and q) were found.`]
  const taps = prop(r, 'letterLookalikeTaps')
  if (taps) {
    const mirror = val(r, 'letterMirrorTaps')
    out.push(`${taps.k} of ${taps.n} look-alike letters were tapped by mistake${taps.k > 0 && mirror ? `, ${mirror.value} of them a mirror pair (b and d, or p and q)` : ''}.`)
  }
  return out
}

function soundOrder(r: Rec): string[] {
  const p = prop(r, 'soundSpanPassed')
  if (!p) return []
  const longest = val(r, 'soundSpanLongest')
  return [`${p.k} of ${p.n} sound sequences were repeated in the right order${longest && longest.value > 0 ? `, the longest with ${longest.value} sounds` : ''}.`]
}

function wordCheck(r: Rec): string[] {
  const real = prop(r, 'wordCheckReal')
  const made = prop(r, 'wordCheckMadeUp')
  if (!real && !made) return []
  const out: string[] = []
  if (real) out.push(`${real.k} of ${real.n} real words were accepted as real.`)
  if (made) out.push(`${made.k} of ${made.n} made-up words were spotted as made up. Spotting them means sounding the word out.`)
  return out
}

function spelling(r: Rec): string[] {
  const s = prop(r, 'spellingCorrect')
  if (!s) return []
  const t = val(r, 'spellingMedianMs')
  return [`${s.k} of ${s.n} spellings chosen were the correct one${t ? `, usually after about ${secs(t.value)} seconds` : ''}.`]
}

function during(r: Rec): string[] {
  const out: string[] = [...parentAnswers(r)]
  const names: Record<string, string> = {
    retrySunbird: 'sunbird game', retrySteering: 'steering game', retryStars: 'star-sequence game',
    retryGaze: 'gaze game', retryFeelings: 'feelings match', retrySorting: 'sorting game', retryLetters: 'letter game',
  }
  const repeats = Object.entries(names)
    .map(([key, label]) => [label, val(r, key)?.value ?? 0] as const)
    .filter(([, n]) => n > 0)
  if (repeats.length) out.push(`Practice was repeated: ${repeats.map(([l, n]) => `${l} ${times(n)}`).join(', ')}. Repeating practice is not a score.`)
  const pc = val(r, 'pauseCount')
  const ps = val(r, 'pausedSec')
  if (pc && pc.value > 0) {
    out.push(`The page was left or hidden ${times(pc.value)}${ps ? `, about ${Math.round(ps.value)} seconds in total` : ''}. That could be a break, a call or another app. It is not a finding about your child.`)
  }
  return out
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
    if (!lines.length) { missing.push(game); continue }
    const fewTrials = record.measures.some((m) => m.game === game && m.kind === 'proportion' && m.wide)
    stories.push({game, lines, fewTrials})
  }
  if (record.quest === 'dyslexia') {
    for (const game of ['Word check (optional)', 'Spelling game (optional)']) {
      const lines = builders[game](record)
      if (lines.length) stories.push({game, lines, fewTrials: record.measures.some((m) => m.game === game && m.kind === 'proportion' && m.wide)})
    }
  }
  const cl = camera(record, who)
  if (cl.length) stories.push({game: 'Camera (optional)', lines: cl, fewTrials: false})
  const ll = looking(record, who)
  if (ll.length) stories.push({game: 'Looking game (optional camera)', lines: ll, fewTrials: false})
  const dl = during(record)
  if (dl.length) stories.push({game: 'During the session', lines: dl, fewTrials: false})
  return {stories, missing}
}
