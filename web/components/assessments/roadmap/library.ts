/**
 * Roadmap wording. Every line here is a DRAFT until a clinician has reviewed it.
 *
 * Rules for anything added to this file:
 * - No diagnosis, no label, no comparison with other children, no cut-off.
 * - Suggestions are things a parent can try or notice, never a finding about the child.
 * - Keep each line to one idea, in plain language for a parent.
 *
 * Flip ROADMAP_REVIEWED to true only after a clinician has signed off on this file and on the
 * ideas in ../ideas.ts. Until then the roadmap is not shown on the parent-facing result pages.
 */
export const ROADMAP_REVIEWED = false

export type WindowId = 'days1to30' | 'days31to60' | 'days61to90'

export const WINDOWS: Array<{id: WindowId; label: string; theme: string}> = [
  {id: 'days1to30', label: 'Days 1 to 30', theme: 'Notice and try'},
  {id: 'days31to60', label: 'Days 31 to 60', theme: 'Look again'},
  {id: 'days61to90', label: 'Days 61 to 90', theme: 'Talk it through'},
]

export const EXPECTED_GAMES = {
  adhd: ['Sunbird game', 'Steering game', 'Star-sequence game', 'Patience game', 'Sky Trail game'],
  autism: ['Gaze game', 'Feelings match', 'Comfort choices', 'Sorting game', 'Social stories game'],
  dyslexia: ['Rhyme game', 'First-sound game', 'Letter game', 'Sound-order game'],
} as const

export const TEXT = {
  notice:
    'Over the next few weeks, jot down when and where the things you are concerned about show up (home, school, with friends) and what seems to help. A few short notes are enough.',
  noticeWhy: 'Clinicians ask about more than one setting. A short game cannot show that.',
  oneAtATime: 'Try one idea at a time for a couple of weeks, then note whether it seemed to help.',
  oneAtATimeWhy: 'Changing several things at once makes it hard to tell what made a difference.',
  repeat:
    'Play again on a different day, when your child is rested, on the same device, in a quiet place without interruptions.',
  compare:
    'Put the two sessions side by side. Small differences between two short sessions are expected by chance, so look for what stays the same rather than for any one number.',
  compareWhy: 'One short session is a snapshot. Two give a little more to talk about.',
  bring:
    'Bring the session record, your notes and the questions list to your child’s paediatrician, psychologist or school.',
  bringWhy: 'A clinician can put the game results together with history and what they see in real settings.',
  school:
    'If you tried classroom or exam ideas, share what seemed to help with your child’s teacher and ask whether they see the same at school.',
  notDiagnosis: 'This roadmap is not a diagnosis and does not say what is wrong or right with your child.',
} as const
