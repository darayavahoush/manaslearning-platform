/**
 * Wording for the combined parent and clinician report. Every line here is a DRAFT until a clinician has reviewed it.
 *
 * Rules for anything added to this file or to narrative.ts:
 * - Describe what happened in the games. No diagnosis, no label, no comparison with other children, no cut-off.
 * - Never say a result is high, low, good, poor, typical or unusual. The record has no norms.
 * - Plain language a parent can read, with the figures a clinician needs sitting in the second part.
 *
 * Flip REPORT_REVIEWED to true only after a clinician has signed off on this file and on narrative.ts.
 * Until then the report is available on the preview page only, and it always shows a draft banner.
 */
export const REPORT_REVIEWED = false

export const REPORT_TEXT = {
  notDiagnosis:
    'This is not a diagnosis. One short play session cannot show whether a child has a learning or developmental difference. If you have concerns, please talk to a paediatrician, teacher or qualified clinician.',
  parentIntro:
    'This part is written for you. It describes what happened in each game, using your child’s own numbers. Nothing here is compared with other children.',
  clinicianIntro:
    'This part is for a clinician. It holds every figure from the session with 95% intervals, the card-by-card sorting results where recorded, the testing conditions and the limits of the record. There are no norms or cut-offs, so no figure here says a result is typical or unusual.',
  questionsTitle: 'Questions you could bring to a clinician',
}

export const CLINICIAN_QUESTIONS = [
  'Which of these observations, if any, would you want to look at more closely in a full evaluation?',
  'Is there anything about how my child plays that you would want to see again over several sessions?',
  'What would you suggest I watch for at home and at school?',
]
