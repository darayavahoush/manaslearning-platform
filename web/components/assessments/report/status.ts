import {wilson} from '../profile-stats'
import type {Measure, ProportionMeasure} from '../session-record'
import type {ReportRecord} from './ParentClinicianReport'
import {EXPECTED_GAMES} from '../roadmap/library'
import {STATUS_RULES} from './library'

/**
 * "Where is this child, in this session": what went well, what may need support, and what needs a closer look.
 *
 * Built by fixed rules from the session record. There are no norms for these games, so nothing here compares the child
 * with other children. Each skill is read against two things only:
 *   - what guessing alone would give (for example half, for a choice between two), and
 *   - the 95% interval, which says how sure the number is with so few rounds.
 * A result is only called a strength or a need when the interval backs it up. Everything else, including thin data,
 * a tired child or an interrupted session, goes under "needs a closer look".
 *
 * The thresholds live in STATUS_RULES (library.ts) and are placeholders for a clinician to set. They are not norms.
 */

export type Band = 'strength' | 'support' | 'investigate'

/** The reading quest is shown in two halves: hearing sounds in words, and working with letters and written words. */
export type SkillGroup = 'sounds' | 'reading'
export const GROUP_TITLE: Record<SkillGroup, string> = {
  sounds: 'Sounds in words',
  reading: 'Letters, reading and spelling',
}
export const GROUP_INTRO: Record<SkillGroup, string> = {
  sounds: 'Hearing and playing with the sounds inside spoken words, with no letters to read.',
  reading: 'Telling letters apart and working with written words.',
}

export interface StatusItem {
  band: Band
  quest: string
  /** reading quest only: which half of the picture this belongs to. Items about the session itself have none. */
  group?: SkillGroup
  area: string
  /** one plain sentence for the parent */
  text: string
  /** the figures behind it, for the parent and for the clinician */
  evidence: string
}

export interface ChildStatus {
  strengths: StatusItem[]
  support: StatusItem[]
  investigate: StatusItem[]
  /** one or two plain sentences that say where the child is, in this session */
  headline: string
  /** every skill that was read, for the clinician's audit table */
  audit: Array<{area: string; group?: SkillGroup; band: Band | 'not read'; figure: string; reason: string}>
}

interface Skill {
  key: string
  quest: ReportRecord['quest']
  area: string
  group?: SkillGroup
  /** high: more matches is better. low: this counts mistakes, so fewer is better. */
  good: 'high' | 'low'
  /** the share a child would get by guessing alone, when that is knowable */
  chance?: number
  strong: string
  needs: string
  /** what was counted, with the real numbers. k and n are already turned so k is the number done well. */
  evidence: (k: number, n: number, m: ProportionMeasure) => string
}

const SKILLS: Skill[] = [
  // attention quest
  {key: 'omissions', quest: 'adhd', area: 'Noticing the sunbirds', good: 'low',
    strong: 'Noticed nearly all of the sunbirds that appeared.', needs: 'Missed a good share of the sunbirds.',
    evidence: (k, n) => `Noticed ${k} of ${n} sunbirds`},
  {key: 'commissions', quest: 'adhd', area: 'Holding back from the shadow moth', good: 'low',
    strong: 'Mostly held back from tapping the shadow moth.', needs: 'Often tapped when the shadow moth appeared.',
    evidence: (k, n) => `Held back on ${k} of ${n} moths`},
  {key: 'anticipatory', quest: 'adhd', area: 'Waiting for the right moment to tap', good: 'low',
    strong: 'Rarely tapped too early or with nothing on screen.', needs: 'Often tapped before there was anything to tap.',
    evidence: (k, n) => `Waited correctly on ${k} of ${n} moments`},
  {key: 'flankerCongruent', quest: 'adhd', area: 'Steering when nothing distracts', good: 'high', chance: 0.5,
    strong: 'Steered correctly almost every time when the arrows agreed.', needs: 'Made quite a few mistakes even when the arrows agreed.',
    evidence: (k, n) => `${k} of ${n} correct`},
  {key: 'flankerIncongruent', quest: 'adhd', area: 'Steering when the arrows disagree', good: 'high', chance: 0.5,
    strong: 'Kept steering correctly even when the arrows disagreed.', needs: 'Found it hard to steer correctly when the arrows disagreed.',
    evidence: (k, n) => `${k} of ${n} correct`},
  // social and sensory quest
  {key: 'gazeMatches', quest: 'autism', area: 'Following where someone looks or points', good: 'high', chance: 1 / 3,
    strong: 'Usually chose the vessel Aria looked or pointed at.', needs: 'Often chose a different vessel from the one Aria looked or pointed at.',
    evidence: (k, n) => `${k} of ${n} choices matched`},
  {key: 'feelingsMatches', quest: 'autism', area: 'Matching feelings to faces', good: 'high', chance: 1 / 3,
    strong: 'Matched most of the cartoon faces to the feeling shown.', needs: 'Matched only some of the cartoon faces to the feeling shown.',
    evidence: (k, n) => `${k} of ${n} faces matched`},
  {key: 'sortPre', quest: 'autism', area: 'Sorting by the first rule', good: 'high', chance: 0.5,
    strong: 'Sorted the gems correctly by the first rule.', needs: 'Found sorting by the first rule hard.',
    evidence: (k, n) => `${k} of ${n} gems in the right box`},
  {key: 'sortPost', quest: 'autism', area: 'Switching to a new rule', good: 'high', chance: 0.5,
    strong: 'Switched to the new sorting rule and kept getting it right.', needs: 'Found it hard to switch to the new sorting rule.',
    evidence: (k, n) => `${k} of ${n} gems in the right box after the change`},
  // reading quest
  {key: 'rhymeMatches', quest: 'dyslexia', group: 'sounds', area: 'Hearing which words rhyme', good: 'high', chance: 0.5,
    strong: 'Heard which words rhyme with ease.', needs: 'Found it hard to tell which words rhyme.',
    evidence: (k, n) => `${k} of ${n} rhymes matched`},
  {key: 'firstSoundMatches', quest: 'dyslexia', group: 'sounds', area: 'Hearing the first sound of a word', good: 'high', chance: 0.5,
    strong: 'Heard the first sound of words reliably.', needs: 'Found it hard to hear which words start with the same sound.',
    evidence: (k, n) => `${k} of ${n} first sounds matched`},
  {key: 'letterFound', quest: 'dyslexia', group: 'reading', area: 'Finding the right letter among look-alikes', good: 'high',
    strong: 'Found the matching letter among b, d, p and q.', needs: 'Missed many of the matching letters among b, d, p and q.',
    evidence: (k, n) => `${k} of ${n} matching letters found`},
  {key: 'letterLookalikeTaps', quest: 'dyslexia', group: 'reading', area: 'Not tapping the look-alike letters', good: 'low',
    strong: 'Rarely tapped a look-alike letter by mistake.', needs: 'Tapped look-alike letters by mistake quite often.',
    evidence: (k, n) => `Left ${k} of ${n} look-alike letters alone`},
  {key: 'soundSpanPassed', quest: 'dyslexia', group: 'sounds', area: 'Holding sounds in order', good: 'high',
    strong: 'Repeated the made-up sounds back in the right order.', needs: 'Found it hard to repeat the made-up sounds in the right order.',
    evidence: (k, n) => `${k} of ${n} sound sequences repeated`},
  {key: 'wordCheckReal', quest: 'dyslexia', group: 'reading', area: 'Recognising real words', good: 'high', chance: 0.5,
    strong: 'Recognised real words quickly and correctly.', needs: 'Called some real words made up.',
    evidence: (k, n) => `${k} of ${n} real words accepted`},
  {key: 'wordCheckMadeUp', quest: 'dyslexia', group: 'reading', area: 'Sounding out made-up words', good: 'high', chance: 0.5,
    strong: 'Spotted the made-up words, which means sounding them out.', needs: 'Often took made-up words for real ones.',
    evidence: (k, n) => `${k} of ${n} made-up words spotted`},
  {key: 'spellingCorrect', quest: 'dyslexia', group: 'reading', area: 'Choosing the right spelling', good: 'high', chance: 0.5,
    strong: 'Chose the correct spelling most of the time.', needs: 'Often chose a spelling that sounds right but is not.',
    evidence: (k, n) => `${k} of ${n} spellings correct`},
]

const pc = (x: number) => `${Math.round(x * 100)}%`
const interval = (lo: number, hi: number) => `95% interval ${pc(lo)} to ${pc(hi)}`

/** How one skill reads. k is the number done well, n the number of rounds, c the share guessing would give. */
export function bandOf(k: number, n: number, c = 0): {band: Band; lo: number; hi: number; why: string} {
  const [lo, hi] = wilson(k, n)
  const p = k / n
  const R = STATUS_RULES
  if (p >= R.strongMinShare && lo > Math.max(c + R.strongMarginOverGuessing, R.strongMinLow)) {
    return {band: 'strength', lo, hi, why: 'Nearly all rounds went well, and the interval stays clear of guessing.'}
  }
  if (p <= R.supportMaxShare && hi <= R.supportMaxHigh) {
    return {band: 'support', lo, hi, why: 'Fewer than two in three rounds went well, and the interval rules out a strong result.'}
  }
  return {band: 'investigate', lo, hi, why: hi - lo > 0.35 ? 'Too few rounds to say much.' : 'In between, so the session cannot say which way it leans.'}
}

const BAND_ORDER: Record<Band, number> = {strength: 0, support: 1, investigate: 2}

function proportionOf(ms: Measure[], key: string): ProportionMeasure | null {
  const m = ms.find((x) => x.key === key)
  return m && m.kind === 'proportion' ? m : null
}

function valueOf(ms: Measure[], key: string): number | null {
  const m = ms.find((x) => x.key === key)
  return m && m.kind === 'value' ? m.value : null
}

export function buildChildStatus(record: ReportRecord & {parentCard?: {tired: string | null; likeHome: string | null; enjoyed: string | null}}): ChildStatus {
  const strengths: StatusItem[] = []
  const support: StatusItem[] = []
  const investigate: StatusItem[] = []
  const audit: ChildStatus['audit'] = []
  const ms = record.measures

  for (const s of SKILLS.filter((x) => x.quest === record.quest)) {
    const m = proportionOf(ms, s.key)
    if (!m) { audit.push({area: s.area, group: s.group, band: 'not read', figure: 'No result recorded', reason: 'Not played or not enough data.'}); continue }
    if (m.n < STATUS_RULES.minRounds) {
      audit.push({area: s.area, group: s.group, band: 'not read', figure: `${m.k} of ${m.n}`, reason: `Only ${m.n} rounds, too few to read.`})
      continue
    }
    // for a mistakes measure turn the counts around, so k is always the number done well
    const k = s.good === 'low' ? m.n - m.k : m.k
    const r = bandOf(k, m.n, s.chance)
    const lo = s.good === 'low' ? 1 - m.hi : m.lo
    const hi = s.good === 'low' ? 1 - m.lo : m.hi
    const figure = `${s.evidence(k, m.n, m)} (${interval(lo, hi)})`
    audit.push({area: s.area, group: s.group, band: r.band, figure, reason: r.why})
    const nearGuess = s.chance !== undefined && lo <= s.chance && r.band !== 'strength'
    const item: StatusItem = {
      band: r.band, quest: record.quest, group: s.group, area: s.area,
      text: r.band === 'strength' ? s.strong : r.band === 'support' ? s.needs : `The session cannot say yet. ${r.why}`,
      evidence: `${figure}${nearGuess ? `. Guessing alone would give about ${pc(s.chance as number)}` : ''}.`,
    }
    ;(r.band === 'strength' ? strengths : r.band === 'support' ? support : investigate).push(item)
  }

  // attention quest: did the pace hold up? Compared with the child's own first half, not with anyone else.
  if (record.quest === 'adhd') {
    const first = valueOf(ms, 'rtFirstHalfMs')
    const second = valueOf(ms, 'rtSecondHalfMs')
    if (first && second) {
      const change = (second - first) / first
      if (change >= STATUS_RULES.paceSlowerBy) {
        investigate.push({band: 'investigate', quest: 'adhd', area: 'Keeping the same pace',
          text: 'Tapping got slower in the second half of the sunbird game. That is worth watching on another day.',
          evidence: `Average tap speed ${Math.round(first)} ms in the first half and ${Math.round(second)} ms in the second half.`})
      } else if (Math.abs(change) <= STATUS_RULES.paceSteadyWithin) {
        strengths.push({band: 'strength', quest: 'adhd', area: 'Keeping the same pace',
          text: 'Kept a steady pace through the sunbird game.',
          evidence: `Average tap speed ${Math.round(first)} ms in the first half and ${Math.round(second)} ms in the second half.`})
      }
      audit.push({area: 'Keeping the same pace', band: change >= STATUS_RULES.paceSlowerBy ? 'investigate' : Math.abs(change) <= STATUS_RULES.paceSteadyWithin ? 'strength' : 'investigate', figure: `${Math.round(first)} ms then ${Math.round(second)} ms`, reason: 'Second half compared with the first half of the same game.'})
    }
  }
  // attention quest: how many star sequences were repeated, from the level-by-level record
  if (record.quest === 'adhd' && record.starLevels?.length && record.starLevels.length >= STATUS_RULES.minRounds) {
    const total = record.starLevels.length
    const done = record.starLevels.filter((x) => x.completed).length
    const r = bandOf(done, total)
    const figure = `${done} of ${total} star sequences repeated (${interval(r.lo, r.hi)})`
    audit.push({area: 'Remembering a sequence of stars', band: r.band, figure, reason: r.why})
    const item: StatusItem = {
      band: r.band, quest: 'adhd', area: 'Remembering a sequence of stars',
      text: r.band === 'strength' ? 'Remembered the star sequences and repeated them back.' : r.band === 'support' ? 'Found it hard to repeat the star sequences back.' : `The session cannot say yet. ${r.why}`,
      evidence: `${figure}.`,
    }
    ;(r.band === 'strength' ? strengths : r.band === 'support' ? support : investigate).push(item)
  }

  // things about the session that limit what it can say. These always go under "closer look".
  const pauses = valueOf(ms, 'pauseCount')
  if (pauses && pauses > 0) {
    investigate.push({band: 'investigate', quest: record.quest, area: 'An interrupted session',
      text: 'The page was left or hidden during play, so some results may not show how your child usually plays.',
      evidence: `The page was left or hidden ${pauses} ${pauses === 1 ? 'time' : 'times'}.`})
  }
  const repeats = ms.filter((m) => /^retry/.test(m.key) && m.kind === 'value' && m.value >= 2)
  if (repeats.length) {
    investigate.push({band: 'investigate', quest: record.quest, area: 'Understanding the instructions',
      text: 'Practice was repeated more than once in a game. It is worth checking that the instructions were clear before reading that game closely.',
      evidence: repeats.map((m) => m.kind === 'value' ? `${m.label.replace('Times practice was repeated, ', '')}: ${m.value} times` : '').join('; ') + '.'})
  }
  const pcard = record.parentCard
  if (pcard?.tired === 'Quite a lot') {
    investigate.push({band: 'investigate', quest: record.quest, area: 'A tired child',
      text: 'You said your child seemed quite tired. Tiredness lowers results, so it is worth playing again when they are rested.', evidence: 'Parent answer.'})
  }
  if (pcard?.likeHome === 'Not really like') {
    investigate.push({band: 'investigate', quest: record.quest, area: 'Not like usual',
      text: 'You said this was not much like how your child usually is. That is useful to tell a clinician.', evidence: 'Parent answer.'})
  }
  if (pcard?.enjoyed === "Didn't enjoy it") {
    investigate.push({band: 'investigate', quest: record.quest, area: 'Not enjoying the play',
      text: 'You said your child did not enjoy it. A child who is not enjoying a game often does not show what they can do.', evidence: 'Parent answer.'})
  }
  const present = new Set(ms.map((m) => m.game))
  const missing = (EXPECTED_GAMES[record.quest] as readonly string[]).filter((g) => !present.has(g))
  if (missing.length) {
    investigate.push({band: 'investigate', quest: record.quest, area: 'Games with no results',
      text: `No results were recorded for ${missing.join(', ')}, so nothing can be said about those yet.`, evidence: 'Not played or not enough data.'})
  }

  const byBand = (a: StatusItem, b: StatusItem) => BAND_ORDER[a.band] - BAND_ORDER[b.band]
  strengths.sort(byBand); support.sort(byBand); investigate.sort(byBand)

  const pick = (xs: StatusItem[]) => xs.slice(0, 2).map((x) => x.area.charAt(0).toLowerCase() + x.area.slice(1)).join(' and ')
  const parts: string[] = []
  if (strengths.length) parts.push(`${pick(strengths)} went well`)
  if (support.length) parts.push(`${pick(support)} may need support`)
  const investigateGames = investigate.filter((x) => !['An interrupted session', 'Understanding the instructions', 'A tired child', 'Not like usual', 'Not enjoying the play', 'Games with no results'].includes(x.area))
  if (investigateGames.length) parts.push(`${investigateGames.length === 1 ? 'one area needs' : `${investigateGames.length} areas need`} a closer look`)
  const headline = parts.length
    ? `In this session, ${parts.join('; ')}.`
    : 'This session did not have enough results to say where your child is strong or where they may need support.'

  return {strengths, support, investigate, headline, audit}
}
