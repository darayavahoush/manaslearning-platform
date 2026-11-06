import type {Quest} from '../session-record'
import {ACTIVITIES, CALM_PHRASE, GOALS, HARDEST_PHRASE, HOW_TO_GIVE, LOVE_PHRASE, PLAN_TEXT, WEEK_THEMES, goalsFor, type Activity, type GoalId} from './library'

export type Answers = Partial<Record<string, string[]>>

export interface PlanItem {id: string; text: string; minutes: number}
export interface PlanWeek {id: string; title: string; blurb: string; goalLabel: string | null; items: PlanItem[]}
export interface HomePlan {
  weeks: PlanWeek[]
  howToGive: string | null
  dailyMinutes: number
  /** what the plan was shaped by, in the parent's own terms */
  shapedBy: string[]
  notes: string[]
}

const one = (a: Answers, id: string): string | null => a[id]?.[0] ?? null
const many = (a: Answers, id: string): string[] => a[id] ?? []

/** Same inputs give the same plan; nothing is random. */
export function generatePlan(answers: Answers, quest: Quest): HomePlan {
  const loves = many(answers, 'loves')
  const lovePhrase = (n: number) => (loves.length ? LOVE_PHRASE[loves[n % loves.length]] : 'something your child loves')
  const calms = many(answers, 'calm').map((c) => CALM_PHRASE[c]).filter(Boolean)
  const calmPhrase = calms.length ? calms.join(', ') : 'a hug, quiet space or a favourite toy'
  const fill = (text: string, n: number) => text.replace(/\{love\}/g, lovePhrase(n)).replace(/\{calm\}/g, calmPhrase)

  const minutes = Number(one(answers, 'minutes') ?? 10)
  const helpers = one(answers, 'helpers') ?? 'me'
  const movement = one(answers, 'movement')
  const hardest = one(answers, 'hardest')
  const changeReact = one(answers, 'change')
  const sensesPicked = many(answers, 'senses').filter((s) => s !== 'none')

  const offered = new Set<string>(goalsFor(quest))
  const readfeel = one(answers, 'readfeel')
  let goals = many(answers, 'goals').filter((g): g is GoalId => offered.has(g))
  // a hard time of day and sensory worries add to the goals only when the parent did not pick any
  if (!goals.length) {
    if (hardest === 'morning') goals.push('mornings')
    if (hardest === 'bedtime') goals.push('sleep')
    if (hardest === 'homework' || hardest === 'afterschool') goals.push('start')
    if (hardest === 'outings' || sensesPicked.length) goals.push('senses')
    if (!goals.length) goals = quest === 'dyslexia' ? ['sounds', 'reading'] : ['start', 'feelings']
  }
  goals = Array.from(new Set(goals))

  const fits = (a: Activity) => a.minutes <= minutes && (!a.needs || (a.needs === 'two' && helpers !== 'me') || (a.needs === 'family' && helpers === 'family'))
  const pool = (goal: GoalId): Activity[] => {
    const list = ACTIVITIES.filter((a) => a.goal === goal && fits(a))
    // movement-seeking children see movement-based activities first; children who sit happily see them last
    const rank = (a: Activity) => (movement === 'lots' ? (a.moves ? 0 : 1) : movement === 'happy' ? (a.moves ? 1 : 0) : 0)
    return [...list].sort((a, b) => rank(a) - rank(b))
  }
  const take = (goal: GoalId, from: number, n: number): Activity[] => {
    const list = pool(goal)
    return list.length ? Array.from({length: Math.min(n, list.length)}, (_, i) => list[(from + i) % list.length]) : []
  }

  const weeks: PlanWeek[] = []
  const goalLabel = (g: GoalId) => GOALS.find((x) => x.id === g)?.label ?? null

  // week 1: notice and set up
  const w1: PlanItem[] = [{id: 'notice', text: PLAN_TEXT.notice, minutes: 2}]
  if (hardest) w1.push({id: 'hardest', text: `Pay extra attention to ${HARDEST_PHRASE[hardest]}. Write down what happens just before things get hard and what helps.`, minutes: 5})
  if (loves.length) w1.push({id: 'anchor', text: fill(PLAN_TEXT.anchor, 0), minutes: 5})
  if (readfeel === 'avoids' || readfeel === 'upset') w1.push({id: 'readwarm', text: 'Keep reading and writing times short, 5 to 10 minutes, and warm. Stop before your child is tired, and name something you enjoyed about it. Notice the effort, not only the result.', minutes: 5})
  if (changeReact === 'warning' || changeReact === 'hard') w1.push({id: 'warn', text: 'Start giving a visual countdown at 5 minutes and at 2 minutes before every switch. Keep the same words.', minutes: 5})
  if (sensesPicked.length) {
    // pick the setup that matches what bothers the child: a quiet corner or a heads-up for sound, light and crowds,
    // comfortable clothes for textures, and a movement game for a child who seeks pressure or movement
    const wanted = sensesPicked.includes('touch') ? 'senses-3' : sensesPicked.includes('seeks') && !sensesPicked.some((s) => ['sound', 'light', 'crowds'].includes(s)) ? 'senses-4' : sensesPicked.includes('crowds') ? 'senses-2' : 'senses-1'
    const a = ACTIVITIES.find((x) => x.id === wanted)
    if (a) w1.push({id: a.id, text: fill(a.text, 1), minutes: a.minutes})
  }
  weeks.push({...WEEK_THEMES[0], goalLabel: null, items: w1.slice(0, 5)})

  // weeks 2 and 3: first goal, then second (or the same goal with new activities)
  const g1 = goals[0]
  // a second goal for week 3: the parent's second pick, otherwise something their answers point to, otherwise big feelings
  const extra: GoalId[] = []
  if (hardest === 'morning') extra.push('mornings')
  if (hardest === 'bedtime') extra.push('sleep')
  if (hardest === 'homework' || hardest === 'afterschool') extra.push('start')
  if (changeReact === 'warning' || changeReact === 'hard') extra.push('change')
  if (sensesPicked.length) extra.push('senses')
  if (quest === 'dyslexia') extra.push('reading', 'sounds', 'letters')
  extra.push('feelings', 'start')
  const g2 = goals[1] ?? extra.find((g) => g !== g1) ?? g1
  const w2 = take(g1, 0, 3)
  const w3 = g2 === g1 ? take(g1, 3, 3) : take(g2, 0, 3)
  weeks.push({...WEEK_THEMES[1], goalLabel: goalLabel(g1) ?? null, items: w2.map((a, i) => ({id: a.id, text: fill(a.text, i), minutes: a.minutes}))})
  weeks.push({...WEEK_THEMES[2], goalLabel: goalLabel(g2) ?? null, items: w3.map((a, i) => ({id: a.id, text: fill(a.text, i + 1), minutes: a.minutes}))})

  // week 4: look back and talk
  weeks.push({...WEEK_THEMES[3], goalLabel: null, items: [
    {id: 'review', text: PLAN_TEXT.review, minutes: 10},
    {id: 'replay', text: PLAN_TEXT.replay, minutes: 15},
    {id: 'bring', text: PLAN_TEXT.bring, minutes: 5},
  ]})

  const shapedBy: string[] = []
  if (goals.length) shapedBy.push(`Your goals: ${goals.map((g) => goalLabel(g)?.toLowerCase()).join(', ')}`)
  if (hardest) shapedBy.push(`Hardest time: ${HARDEST_PHRASE[hardest]}`)
  if (loves.length) shapedBy.push(`Loves: ${loves.map((l) => LOVE_PHRASE[l]).join(', ')}`)
  shapedBy.push(`Time: about ${minutes} minutes a day`)

  const notes = [PLAN_TEXT.notDiagnosis]
  if (goals.includes('sleep')) notes.push(PLAN_TEXT.sleepNote)
  notes.push(PLAN_TEXT.worried)

  const how = one(answers, 'learn')
  return {weeks, howToGive: how ? HOW_TO_GIVE[how] ?? null : null, dailyMinutes: minutes, shapedBy, notes}
}
