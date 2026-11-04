'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export type ReportRow = { name: string; value: string; detail?: string; note?: string }
export type Quest = 'dyslexia' | 'adhd' | 'autism'
export type ClinicianReportProps = {
  quest: Quest
  nickname: string
  age?: number | null
  generatedOn?: string
  rows: ReportRow[]
  clinicianQuestions?: string[]
  wording?: 'ai' | 'template'
  variant?: 'play' | 'questions'
  ageLabel?: string
}

/** Turns sentences like "Rhyme game: 3 of 5 ..." into table rows. */
export function rowsFromSentences(lines: string[]): ReportRow[] {
  return lines.map((l) => {
    const k = l.indexOf(': ')
    return k > 0 && k < 40 ? { name: l.slice(0, k), value: l.slice(k + 2) } : { name: 'Observation', value: l }
  })
}

const QUEST = {
  dyslexia: {
    title: 'Reading and sound-awareness play screener',
    sampled: 'rhyming, first sounds, letter shapes (such as b and d), remembering sounds in order and, in the question version, spelling and short reading questions.',
    next: [
      'A hearing and vision check, if one has not been done recently.',
      'A literacy assessment by an educational psychologist or specialist teacher, usually covering phonological awareness, word and non-word reading, spelling and reading fluency.',
      "The school's view of reading progress and any support already given.",
    ],
  },
  adhd: {
    title: 'Attention and self-control play screener',
    sampled: 'noticing a target, responding to the wrong target, slowing down when distractions conflict, remembering a sequence and waiting.',
    next: [
      'A hearing and vision check, and a look at sleep, health and stress, which can all affect attention.',
      'Rating scales completed by a parent and a teacher (for example the Vanderbilt or Conners scales), which a clinician reads alongside the history.',
      'A clinical interview about when concerns began, whether they show up in more than one setting, and how much they affect daily life.',
    ],
  },
  autism: {
    title: 'Social communication and sensory comfort play screener',
    sampled: 'following gaze and pointing, matching cartoon faces to feelings, choosing comfortable light, sound and touch levels, and switching sorting rules.',
    next: [
      'A hearing and vision check, and a review of language development.',
      'A developmental history and, where the clinician thinks it helpful, structured parent questionnaires and a clinician-led observation (such as the ADOS-2).',
      'A multi-professional evaluation if concerns continue across settings.',
    ],
  },
} as const

const QSAMPLED = {
  dyslexia: 'choosing real words and correct spellings, finishing sentences, spelling by ear and answering questions about a short story.',
  adhd: 'the child’s own ratings of eight statements about attention and activity. These are not scored.',
  autism: 'the child’s own ratings of eight statements about sensory and social experiences. These are not scored.',
} as const

const LIMITS = [
  'This is not a diagnostic report. It comes from child-friendly play activities, not from a validated clinical instrument.',
  'There are no age norms or cut-off scores. The figures below cannot show whether a result is typical or unusual for the child’s age.',
  'It is one short session. Tiredness, mood, reading ability, how much the child enjoyed the game and the device used can all change the results.',
  'Timings are measured in the browser on the child’s own device and are approximate. In question-based versions they include reading time.',
  'A child can do well or less well for many reasons unrelated to any condition. Results should be read together with history, observation in real settings and standard assessments.',
]

export default function ClinicianReportButton(p: ClinicianReportProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => setMounted(true), [])
  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open])

  const q = QUEST[p.quest]
  const withData = p.rows.filter((r) => !/not enough data/i.test(r.value)).length
  const date = p.generatedOn || new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={{ minHeight: 44, padding: '8px 18px', borderRadius: 999, border: '1.5px solid #8A7F6E', background: '#F4ECDC', color: '#2F2A24', fontWeight: 700, cursor: 'pointer' }}>
        Clinician summary (print or save as PDF)
      </button>
      {open && mounted && createPortal(
        <div className="cr-portal" role="dialog" aria-modal="true" aria-label="Clinician summary">
          <style>{CSS}</style>
          <div className="cr-tools">
            <button type="button" className="cr-btn" onClick={() => window.print()}>Print or save as PDF</button>
            <button type="button" className="cr-btn ghost" ref={closeRef} onClick={() => setOpen(false)}>Close</button>
          </div>
          <article className="cr-paper">
            <header className="cr-sec">
              <p className="cr-kicker">{p.variant === 'questions' ? 'Question-based screening summary' : 'Play-based screening summary'} · Not a diagnostic report</p>
              <h1>{p.variant === 'questions' ? q.title.replace('play screener', 'question screener') : q.title}</h1>
              <table className="cr-meta"><tbody>
                <tr><th>Play name</th><td>{p.nickname || 'Not given'}</td><th>Date</th><td>{date}</td></tr>
                <tr><th>Age</th><td>{p.ageLabel ? p.ageLabel : p.age ? `${p.age} years (as entered)` : 'Not given'}</td><th>Measures with data</th><td>{withData} of {p.rows.length}</td></tr>
                <tr><th>Child’s full name</th><td className="cr-line" /><th>Date of birth</th><td className="cr-line" /></tr>
              </tbody></table>
              <p className="cr-small">Full name and date of birth are left blank on purpose so they stay on paper and are never entered into the website.</p>
            </header>

            <section className="cr-sec cr-box">
              <h2>Please read first</h2>
              <ul>{LIMITS.map((l, i) => <li key={i}>{l}</li>)}</ul>
              <p className="cr-small">The activities sampled: {p.variant === 'questions' ? QSAMPLED[p.quest] : q.sampled}</p>
            </section>

            <section className="cr-sec">
              <h2>What was recorded</h2>
              <table className="cr-table">
                <thead><tr><th>Activity</th><th>Recorded in this session</th></tr></thead>
                <tbody>
                  {p.rows.map((r, i) => {
                    const none = /not enough data/i.test(r.value)
                    return (
                      <tr key={i}>
                        <td className="cr-name">{r.name}</td>
                        <td>
                          <span className={none ? 'cr-none' : ''}>{r.value}</span>
                          {r.detail && <div className="cr-small">{r.detail}</div>}
                          {r.note && <div className="cr-note">{r.note}</div>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </section>

            <section className="cr-sec">
              <h2>Conditions during play (parent to tick)</h2>
              <table className="cr-meta cr-cond"><tbody>
                <tr><th>Child seemed</th><td>☐ rested &nbsp; ☐ tired &nbsp; ☐ unwell &nbsp; ☐ hungry</td></tr>
                <tr><th>Mood while playing</th><td>☐ eager &nbsp; ☐ calm &nbsp; ☐ bored &nbsp; ☐ frustrated &nbsp; ☐ anxious</td></tr>
                <tr><th>Device</th><td>☐ phone &nbsp; ☐ tablet &nbsp; ☐ laptop or desktop &nbsp; ☐ touch screen &nbsp; ☐ mouse</td></tr>
                <tr><th>Setting</th><td>☐ quiet &nbsp; ☐ noisy &nbsp; ☐ interrupted &nbsp; ☐ adult helped with answers</td></tr>
                <tr><th>Known hearing or vision concern</th><td>☐ no &nbsp; ☐ yes: <span className="cr-inline" /></td></tr>
                <tr><th>Regular medication</th><td>☐ no &nbsp; ☐ yes: <span className="cr-inline" /></td></tr>
              </tbody></table>
            </section>

            <section className="cr-sec">
              <h2>Parent’s concerns (write in)</h2>
              <div className="cr-lines"><span /><span /><span /><span /></div>
              <p className="cr-small">Where do you see it (home, school, with friends)? Since when? What helps?</p>
            </section>

            {!!p.clinicianQuestions?.length && (
              <section className="cr-sec">
                <h2>Questions to bring to the clinician</h2>
                <ul>{p.clinicianQuestions.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </section>
            )}

            <section className="cr-sec">
              <h2>Usual next steps a clinician may consider</h2>
              <ul>{q.next.map((x, i) => <li key={i}>{x}</li>)}</ul>
              <p className="cr-small">These are examples of common routes, not recommendations for this child. The clinician decides what is appropriate.</p>
            </section>

            <footer className="cr-sec cr-small">
              Nothing from this session was saved on a server. The figures were produced in the browser{p.wording ? `, and the wording was written ${p.wording === 'ai' ? 'with the help of an AI model and checked automatically against the recorded numbers' : 'from a fixed template'}` : ''}. This summary is not a medical device and is not a diagnosis.
            </footer>
          </article>
        </div>,
        document.body,
      )}
    </>
  )
}

const CSS = `
.cr-portal{position:fixed;inset:0;z-index:9999;overflow-y:auto;background:#EFEAE0;color:#1F1B16;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;line-height:1.5}
.cr-tools{position:sticky;top:0;display:flex;gap:10px;justify-content:center;padding:10px;background:#EFEAE0;border-bottom:1px solid #D9CDB4}
.cr-btn{min-height:44px;padding:8px 20px;border-radius:999px;border:1.5px solid #3F6F5C;background:#3F6F5C;color:#fff;font-weight:700;cursor:pointer}
.cr-btn.ghost{background:transparent;color:#1F1B16;border-color:#8A7F6E}
.cr-btn:focus-visible{outline:3px solid #1F1B16;outline-offset:3px}
.cr-paper{max-width:820px;margin:18px auto;padding:34px 38px;background:#fff;box-shadow:0 2px 18px rgba(60,50,30,.15);font-size:14px}
.cr-paper h1{font-size:24px;margin:2px 0 12px;line-height:1.25}
.cr-paper h2{font-size:15px;margin:0 0 8px;text-transform:uppercase;letter-spacing:.05em;color:#3F6F5C}
.cr-kicker{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6F4A1F;margin:0}
.cr-sec{margin:0 0 22px}
.cr-box{border:1.5px solid #8A7F6E;border-radius:10px;padding:14px 18px;background:#FBF8F1}
.cr-paper ul{margin:0;padding-left:20px}.cr-paper li{margin:0 0 5px}
.cr-small{font-size:12px;color:#51493E;margin:6px 0 0}
.cr-note{font-size:12px;color:#51493E;margin-top:3px;font-style:italic}
.cr-none{color:#6F665A;font-style:italic}
.cr-table,.cr-meta{width:100%;border-collapse:collapse}
.cr-table th,.cr-table td,.cr-meta th,.cr-meta td{border:1px solid #CFC5AE;padding:7px 10px;text-align:left;vertical-align:top}
.cr-table th,.cr-meta th{background:#F4ECDC;font-size:12px;width:1%;white-space:nowrap}
.cr-table thead th{width:auto}
.cr-name{width:30%;font-weight:600}
.cr-line{height:26px}
.cr-inline{display:inline-block;width:170px;border-bottom:1px solid #1F1B16}
.cr-lines span{display:block;height:28px;border-bottom:1px solid #8A7F6E}
@media (max-width:640px){.cr-paper{padding:20px 16px;margin:0}}
@media print{
  body > *:not(.cr-portal){display:none!important}
  .cr-portal{position:static!important;overflow:visible!important;background:#fff!important}
  .cr-tools{display:none!important}
  .cr-paper{box-shadow:none!important;margin:0!important;padding:0!important;max-width:none!important}
  .cr-sec,.cr-table tr,.cr-meta tr{break-inside:avoid}
  *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  @page{margin:14mm}
}
`
