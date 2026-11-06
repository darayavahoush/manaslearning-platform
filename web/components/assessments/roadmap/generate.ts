import type {Measure, Quest} from '../session-record'
import {ADHD_IDEAS, AUTISM_IDEAS, DYSLEXIA_IDEAS, IDEA_TOPICS, type IdeaTopic} from '../ideas'
import {EXPECTED_GAMES, TEXT, WINDOWS, type WindowId} from './library'

/**
 * 30/60/90-day roadmap, built by fixed rules from a session record and from what the parent says
 * they are focusing on. No rule reads a performance figure against a threshold: the record has no
 * norms, so nothing here says a result is high, low or unusual. The rules use only
 *   - which games produced data and whether the session was interrupted,
 *   - the comfort levels the child chose themselves (preferences, not results), and
 *   - the topics the parent picked.
 */

export interface RoadmapItem {
  id: string
  text: string
  /** why this item is here, in plain words */
  why: string
  /** 'ideas' lines come from the shared parent ideas list; 'draft' lines are written for this roadmap */
  source: 'ideas' | 'draft'
}

export interface Roadmap {
  quest: Quest
  /** always 'draft' until the wording has been reviewed by a clinician; see library.ts */
  windows: Array<{id: WindowId; label: string; theme: string; items: RoadmapItem[]}>
  /** things about this session that affect how far to rely on it */
  dataNotes: string[]
  disclaimer: string
}

export interface RoadmapInput {
  record: {quest: Quest; measures: Measure[]}
  focus: IdeaTopic[]
}

const PER_TOPIC = 2

function dataNotes(record: RoadmapInput['record']): string[] {
  const notes: string[] = []
  const present = new Set(record.measures.map((m) => m.game))
  const missing = EXPECTED_GAMES[record.quest].filter((g) => !present.has(g))
  if (missing.length) notes.push(`No results were recorded for: ${missing.join(', ')}.`)
  const pauses = record.measures.find((m) => m.key === 'pauseCount')
  if (pauses && pauses.kind === 'value' && pauses.value > 0) {
    notes.push('The page was left or hidden at least once during play, so the session may have been interrupted.')
  }
  return notes
}

function comfortItem(record: RoadmapInput['record']): RoadmapItem | null {
  if (record.quest !== 'autism') return null
  const pick = (key: string, label: string) => {
    const m = record.measures.find((x) => x.key === key)
    return m && m.kind === 'value' ? `${label} ${m.value} out of 10` : null
  }
  const parts = [pick('lightLevel', 'light'), pick('soundLevel', 'sound'), pick('touchLevel', 'touch')].filter((x): x is string => !!x)
  if (!parts.length) return null
  return {
    id: 'comfort-choices',
    source: 'draft',
    text: `In the game your child chose ${parts.join(', ')}. At home, offer a similar choice for real (for example a lamp they can dim) and notice what they pick.`,
    why: 'These were the child’s own choices in a game. They are preferences, not test results.',
  }
}

export function generateRoadmap(input: RoadmapInput): Roadmap {
  const {record} = input
  const ideas = record.quest === 'adhd' ? ADHD_IDEAS : record.quest === 'dyslexia' ? DYSLEXIA_IDEAS : AUTISM_IDEAS
  const focus = IDEA_TOPICS.filter((t) => input.focus.includes(t))
  const notes = dataNotes(record)

  const first: RoadmapItem[] = [
    {id: 'notice', text: TEXT.notice, why: TEXT.noticeWhy, source: 'draft'},
  ]
  const comfort = comfortItem(record)
  if (comfort) first.push(comfort)
  if (focus.length) {
    first.push({id: 'one-at-a-time', text: TEXT.oneAtATime, why: TEXT.oneAtATimeWhy, source: 'draft'})
    for (const t of focus) {
      ideas[t].slice(0, PER_TOPIC).forEach((text, i) =>
        first.push({id: `idea-${t}-${i + 1}`, text, why: 'You chose this area to focus on.', source: 'ideas'}))
    }
  }

  const second: RoadmapItem[] = [
    {
      id: 'repeat',
      text: TEXT.repeat,
      why: notes.length ? notes.join(' ') : 'A second session on another day shows what stays the same.',
      source: 'draft',
    },
    {id: 'compare', text: TEXT.compare, why: TEXT.compareWhy, source: 'draft'},
  ]

  const third: RoadmapItem[] = [{id: 'bring', text: TEXT.bring, why: TEXT.bringWhy, source: 'draft'}]
  if (focus.includes('classroom') || focus.includes('examinations')) {
    third.push({id: 'school', text: TEXT.school, why: 'You chose a school-related area to focus on.', source: 'draft'})
  }

  const byWindow: Record<WindowId, RoadmapItem[]> = {days1to30: first, days31to60: second, days61to90: third}
  return {
    quest: record.quest,
    windows: WINDOWS.map((w) => ({...w, items: byWindow[w.id]})),
    dataNotes: notes,
    disclaimer: TEXT.notDiagnosis,
  }
}
