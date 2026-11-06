/**
 * Wording for the combined parent and clinician report. Every line here is a DRAFT until a clinician has reviewed it.
 *
 * Rules for anything added to this file, to narrative.ts or to status.ts:
 * - No diagnosis, no label, and no comparison with other children. There are no norms for these games.
 * - status.ts may say a skill "went well" or "may need support", but only by reading it against what guessing would give
 *   and against the 95% interval of this child's own session. It never says a result is typical, unusual or abnormal.
 * - Plain language a parent can read, with the figures a clinician needs sitting in the second part.
 *
 * Flip REPORT_REVIEWED to true only after a clinician has signed off on this file, on narrative.ts and on status.ts.
 * Until then the report always shows a draft banner.
 */
export const REPORT_REVIEWED = false

/**
 * Pilot switch: parents see the full report on the end screen even though no clinician has signed off yet.
 * The "Draft for clinician review" banner stays on every report while REPORT_REVIEWED is false.
 * Set this back to false to hide the report from parents again.
 */
export const REPORT_PILOT_VISIBLE = true

/**
 * The cut-offs status.ts uses to call a skill a strength, a need, or "needs a closer look". They are placeholders chosen
 * by the developer so the report can be tried with families. They are NOT norms and have not been checked against any
 * group of children. A clinician should set or replace them before REPORT_REVIEWED is turned on.
 *
 * A skill is read on the share of rounds that went well (k out of n) and its 95% Wilson interval [lo, hi]:
 * - strength: share is at least strongMinShare, and lo is above both strongMinLow and the guessing share plus strongMarginOverGuessing
 * - needs support: share is at most supportMaxShare, and hi is at most supportMaxHigh (so a strong result is ruled out)
 * - anything else, or fewer than minRounds rounds: needs a closer look
 */
export const STATUS_RULES = {
  minRounds: 4,
  strongMinShare: 0.85,
  strongMinLow: 0.6,
  strongMarginOverGuessing: 0.1,
  supportMaxShare: 0.65,
  supportMaxHigh: 0.9,
  /** attention quest: the second half of the sunbird game is this much slower than the first half, or within paceSteadyWithin */
  paceSlowerBy: 0.2,
  paceSteadyWithin: 0.1,
} as const

export const REPORT_TEXT = {
  notDiagnosis:
    'This is not a diagnosis. One short play session cannot show whether a child has a learning or developmental difference. If you have concerns, please talk to a paediatrician, teacher or qualified clinician.',
  parentIntro:
    'This part is written for you. It describes what happened in each game, using your child’s own numbers. Nothing here is compared with other children.',
  statusHow:
    'Each skill is read against what guessing would give and against how sure the numbers are after so few rounds. Nothing is compared with other children, because these games have no norms. A skill is only called a strength or a need when the numbers back it up.',
  clinicianIntro:
    'This part is for a clinician. It holds every figure from the session with 95% intervals, the card-by-card sorting results where recorded, the testing conditions and the limits of the record. There are no norms or cut-offs, so no figure here says a result is typical or unusual.',
  questionsTitle: 'Questions you could bring to a clinician',
}

export const CLINICIAN_QUESTIONS = [
  'Which of these observations, if any, would you want to look at more closely in a full evaluation?',
  'Is there anything about how my child plays that you would want to see again over several sessions?',
  'What would you suggest I watch for at home and at school?',
]
