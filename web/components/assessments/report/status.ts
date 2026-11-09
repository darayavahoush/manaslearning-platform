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
  {key: 'omissions', quest: 'adhd', area: 'Sustained attention & alertness', good: 'low',
    strong: 'Maintained steady focus and caught target cues consistently over time.',
    needs: 'Attention drifted during quiet stretches, missing target cues.',
    evidence: (k, n) => `${k} of ${n} focus cues spotted`},
  {key: 'commissions', quest: 'adhd', area: 'Impulse control & pausing', good: 'low',
    strong: 'Showed strong motor control, pausing and holding back when a cue signaled to stop.',
    needs: 'Acted quickly on impulse, finding it difficult to hold back before reacting.',
    evidence: (k, n) => `Paused successfully on ${k} of ${n} stop signals`},
  {key: 'anticipatory', quest: 'adhd', area: 'Patience & pacing', good: 'low',
    strong: 'Demonstrated calm pacing, waiting patiently for cues rather than rushing ahead.',
    needs: 'Showed motor restlessness, frequently acting ahead before cues appeared.',
    evidence: (k, n) => `Waited patiently on ${k} of ${n} timed intervals`},
  {key: 'flankerCongruent', quest: 'adhd', area: 'Visual processing in clear settings', good: 'high', chance: 0.5,
    strong: 'Quickly and accurately processed directional cues in straightforward conditions.',
    needs: 'Made errors even when visual directions were straightforward.',
    evidence: (k, n) => `${k} of ${n} direct cues correct`},
  {key: 'flankerIncongruent', quest: 'adhd', area: 'Filtering visual distractions', good: 'high', chance: 0.5,
    strong: 'Filtered out conflicting surrounding distractions to stay focused on the main cue.',
    needs: 'Found it hard to filter out conflicting visual distractions in the surroundings.',
    evidence: (k, n) => `${k} of ${n} complex cues resolved accurately`},
  {key: 'trailSwitchesCorrect', quest: 'adhd', area: 'Mental set-shifting & alternating flexibility', good: 'high', chance: 0.5,
    strong: 'Smoothly switched mental focus between alternating patterns without cognitive fatigue or getting stuck.',
    needs: 'Found alternating mental sets challenging, showing perseverative errors when switching rules.',
    evidence: (k, n) => `${k} of ${n} alternating trail transitions correct`},
  // social and sensory quest
  {key: 'gazeMatches', quest: 'autism', area: 'Joint attention & social referencing', good: 'high', chance: 1 / 3,
    strong: 'Naturally followed a partner’s social gaze and pointing cues to share visual focus.',
    needs: 'Relied mostly on independent visual scanning rather than following a partner’s social cues.',
    evidence: (k, n) => `${k} of ${n} social gaze cues followed`},
  {key: 'feelingsMatches', quest: 'autism', area: 'Facial emotion recognition', good: 'high', chance: 1 / 3,
    strong: 'Accurately recognized and matched core emotional expressions from facial cues.',
    needs: 'Found it challenging to differentiate subtle emotional expressions from facial cues.',
    evidence: (k, n) => `${k} of ${n} facial emotions identified`},
  {key: 'sortPre', quest: 'autism', area: 'Rule learning & categorical organization', good: 'high', chance: 0.5,
    strong: 'Quickly understood and followed a structured categorical rule.',
    needs: 'Found following the initial categorical rule challenging.',
    evidence: (k, n) => `${k} of ${n} items categorized accurately`},
  {key: 'sortPost', quest: 'autism', area: 'Cognitive flexibility & routine adaptation', good: 'high', chance: 0.5,
    strong: 'Smoothly shifted mental strategies when the rule changed, avoiding getting stuck.',
    needs: 'Showed difficulty shifting gears, tending to stick to the old rule after it changed.',
    evidence: (k, n) => `${k} of ${n} items correctly sorted after rule change`},
  {key: 'socialStoryMatches', quest: 'autism', area: 'Social perspective taking & Theory of Mind', good: 'high', chance: 0.33,
    strong: 'Demonstrated empathetic perspective taking, accurately deducing peer intentions, unstated beliefs, and repair actions.',
    needs: 'Found it challenging to infer other children’s unstated thoughts, false beliefs, or social motives.',
    evidence: (k, n) => `${k} of ${n} social scenarios resolved accurately`},
  // reading quest
  {key: 'rhymeMatches', quest: 'dyslexia', group: 'sounds', area: 'Phonological rhyme awareness', good: 'high', chance: 0.5,
    strong: 'Easily recognized rhyming sound patterns in spoken words without printed text.',
    needs: 'Found it hard to distinguish rhyming sound patterns in spoken words.',
    evidence: (k, n) => `${k} of ${n} spoken rhymes identified`},
  {key: 'firstSoundMatches', quest: 'dyslexia', group: 'sounds', area: 'Beginning sound isolation', good: 'high', chance: 0.5,
    strong: 'Reliably isolated the opening speech sound of spoken words (essential for phonics).',
    needs: 'Found it challenging to isolate the opening speech sound of spoken words.',
    evidence: (k, n) => `${k} of ${n} initial speech sounds isolated`},
  {key: 'letterFound', quest: 'dyslexia', group: 'reading', area: 'Letter orientation & discrimination (b/d/p/q)', good: 'high',
    strong: 'Accurately distinguished letter orientations among look-alikes like b, d, p and q.',
    needs: 'Frequently missed matching letters among mirror-image look-alikes like b, d, p and q.',
    evidence: (k, n) => `${k} of ${n} target letters identified`},
  {key: 'letterLookalikeTaps', quest: 'dyslexia', group: 'reading', area: 'Resisting letter reversals', good: 'low',
    strong: 'Rarely confused mirror-image letters like b, d, p and q.',
    needs: 'Frequently mistook mirror-image letters for the target letter.',
    evidence: (k, n) => `Avoided ${k} of ${n} mirror-image letter reversals`},
  {key: 'soundSpanPassed', quest: 'dyslexia', group: 'sounds', area: 'Verbal working memory for sounds', good: 'high',
    strong: 'Held spoken sound sequences in memory and repeated them in exact order.',
    needs: 'Found it hard to hold and recall spoken sound sequences in order.',
    evidence: (k, n) => `${k} of ${n} spoken sound sequences recalled`},
  {key: 'wordCheckReal', quest: 'dyslexia', group: 'reading', area: 'Sight word recognition', good: 'high', chance: 0.5,
    strong: 'Recognized familiar written words fluently and accurately.',
    needs: 'Hesitated or misidentified common written words.',
    evidence: (k, n) => `${k} of ${n} written words recognized`},
  {key: 'wordCheckMadeUp', quest: 'dyslexia', group: 'reading', area: 'Phonetic sounding-out & decoding', good: 'high', chance: 0.5,
    strong: 'Successfully sounded out unfamiliar words rather than guessing from overall shape.',
    needs: 'Tended to guess words by shape instead of decoding their phonetic sounds.',
    evidence: (k, n) => `${k} of ${n} unfamiliar words decoded`},
  {key: 'spellingCorrect', quest: 'dyslexia', group: 'reading', area: 'Orthographic spelling recall', good: 'high', chance: 0.5,
    strong: 'Recalled correct conventional spelling patterns rather than phonetic approximations.',
    needs: 'Often chose spellings that sound phonetically plausible but violate conventional spelling.',
    evidence: (k, n) => `${k} of ${n} spelling conventions correct`},
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
        investigate.push({band: 'investigate', quest: 'adhd', area: 'Mental stamina & consistency',
          text: 'Response speed slowed significantly in the second half, indicating cognitive fatigue during extended tasks.',
          evidence: `Average response speed ${Math.round(first)} ms early on vs ${Math.round(second)} ms later in the session.`})
      } else if (Math.abs(change) <= STATUS_RULES.paceSteadyWithin) {
        strengths.push({band: 'strength', quest: 'adhd', area: 'Mental stamina & consistency',
          text: 'Maintained steady mental alertness and response speed throughout the task.',
          evidence: `Average response speed ${Math.round(first)} ms early on vs ${Math.round(second)} ms later in the session.`})
      }
      audit.push({area: 'Mental stamina & consistency', band: change >= STATUS_RULES.paceSlowerBy ? 'investigate' : Math.abs(change) <= STATUS_RULES.paceSteadyWithin ? 'strength' : 'investigate', figure: `${Math.round(first)} ms then ${Math.round(second)} ms`, reason: 'Second half compared with the first half of the same task.'})
    }
  }
  // attention quest: how many star sequences were repeated, from the level-by-level record
  if (record.quest === 'adhd' && record.starLevels?.length && record.starLevels.length >= STATUS_RULES.minRounds) {
    const total = record.starLevels.length
    const done = record.starLevels.filter((x) => x.completed).length
    const r = bandOf(done, total)
    const figure = `${done} of ${total} multi-step sequences recalled (${interval(r.lo, r.hi)})`
    audit.push({area: 'Visual working memory & sequence recall', band: r.band, figure, reason: r.why})
    const item: StatusItem = {
      band: r.band, quest: 'adhd', area: 'Visual working memory & sequence recall',
      text: r.band === 'strength' ? 'Held multi-step visual sequences in active memory and recalled them with high fidelity.' : r.band === 'support' ? 'Found it challenging to retain multi-step visual sequences as the sequence lengthened.' : `The session cannot say yet. ${r.why}`,
      evidence: `${figure}.`,
    }
    ;(r.band === 'strength' ? strengths : r.band === 'support' ? support : investigate).push(item)
  }

  // things about the session that limit what it can say. These always go under "closer look".
  const pauses = valueOf(ms, 'pauseCount')
  if (pauses && pauses > 0) {
    investigate.push({band: 'investigate', quest: record.quest, area: 'Session continuity & distractions',
      text: 'The screen was paused or navigated away from during play, so some measures may not reflect typical performance.',
      evidence: `The session was paused or left ${pauses} ${pauses === 1 ? 'time' : 'times'}.`})
  }
  const repeats = ms.filter((m) => /^retry/.test(m.key) && m.kind === 'value' && m.value >= 2)
  if (repeats.length) {
    investigate.push({band: 'investigate', quest: record.quest, area: 'Instruction comprehension',
      text: 'Practice rounds were repeated multiple times, suggesting the child was still clarifying the instructions before starting.',
      evidence: repeats.map((m) => m.kind === 'value' ? `${m.label.replace('Times practice was repeated, ', '')}: ${m.value} times` : '').join('; ') + '.'})
  }
  const pcard = record.parentCard
  if (pcard?.tired === 'Quite a lot') {
    investigate.push({band: 'investigate', quest: record.quest, area: 'Fatigue & energy levels',
      text: 'You noted your child seemed quite tired. Fatigue directly affects attention and reaction speed, so a well-rested recheck is recommended.', evidence: 'Parent observation.'})
  }
  if (pcard?.likeHome === 'Not really like') {
    investigate.push({band: 'investigate', quest: record.quest, area: 'Typicality of behavior',
      text: 'You noted this session was not typical of how your child usually is at home or school, which is important context for a clinician.', evidence: 'Parent observation.'})
  }
  if (pcard?.enjoyed === "Didn't enjoy it") {
    investigate.push({band: 'investigate', quest: record.quest, area: 'Engagement & interest',
      text: 'You noted your child did not enjoy the session. Low engagement often makes it difficult to demonstrate true capability.', evidence: 'Parent observation.'})
  }
  const present = new Set(ms.map((m) => m.game))
  const missing = (EXPECTED_GAMES[record.quest] as readonly string[]).filter((g) => !present.has(g))
  if (missing.length) {
    investigate.push({band: 'investigate', quest: record.quest, area: 'Unattempted activities',
      text: `No data was recorded for ${missing.join(', ')}, so those developmental areas remain unobserved.`, evidence: 'Not completed or insufficient data.'})
  }

  // reading quest: word check and spelling are optional, so a missing one is a gap in the picture, not a result
  if (record.quest === 'dyslexia') {
    const skipped = [['Word check (optional)', 'Word check'], ['Spelling game (optional)', 'Spelling game']].filter(([g]) => !present.has(g)).map(([, n]) => n)
    if (skipped.length) {
      investigate.push({band: 'investigate', quest: 'dyslexia', group: 'reading', area: 'Optional reading modules not completed',
        text: `${skipped.join(' and ')} ${skipped.length > 1 ? 'were' : 'was'} not completed. These are optional modules, so reading and spelling were only partly observed. Completing ${skipped.length > 1 ? 'them' : 'it'} on another day would give a more complete picture.`,
        evidence: 'Optional modules not completed.'})
    }
  }

  const byBand = (a: StatusItem, b: StatusItem) => BAND_ORDER[a.band] - BAND_ORDER[b.band]
  strengths.sort(byBand); support.sort(byBand); investigate.sort(byBand)

  const pick = (xs: StatusItem[]) => xs.slice(0, 2).map((x) => x.area.charAt(0).toLowerCase() + x.area.slice(1)).join(' and ')
  const parts: string[] = []
  if (strengths.length) parts.push(`${pick(strengths)} went well`)
  if (support.length) parts.push(`${pick(support)} may need support`)
  const investigateGames = investigate.filter((x) => ![
    'Session continuity & distractions', 'Instruction comprehension', 'Fatigue & energy levels',
    'Typicality of behavior', 'Engagement & interest', 'Unattempted activities', 'Optional reading modules not completed',
    'An interrupted session', 'Understanding the instructions', 'A tired child', 'Not like usual',
    'Not enjoying the play', 'Games with no results', 'Optional games not played'
  ].includes(x.area))
  if (investigateGames.length) parts.push(`${investigateGames.length === 1 ? 'one area needs' : `${investigateGames.length} areas need`} a closer look`)
  const headline = parts.length
    ? `In this session, ${parts.join('; ')}.`
    : 'This session did not have enough results to say where your child is strong or where they may need support.'

  return {strengths, support, investigate, headline, audit}
}
