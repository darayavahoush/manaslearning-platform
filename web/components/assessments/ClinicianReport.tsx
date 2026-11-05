'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { INSTRUMENT_VERSION } from './version'
import type { FeelingsRound, GazeRound, HelpRound, Measure, ParentCardRecord, SortingCard, StarLevel, SteeringTrial } from './session-record'

export type ReportRow = { name: string; value: string; detail?: string; note?: string }
export type Quest = 'dyslexia' | 'adhd' | 'autism'
export type ReportExtra = {
  method?: { name: string; samples: string; items: string; scoring: string }[]
  compare?: string[]
  appendix?: { title: string; head: string[]; rows: string[][] }[]
}
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
  extra?: ReportExtra
  /** the session record's measures; when given, a "Results by game" section is added */
  measures?: Measure[]
  /** autism quest: the sorting game card by card */
  sortingCards?: SortingCard[]
  /** autism quest: the gaze game and feelings match trial by trial */
  gazeRounds?: GazeRound[]
  feelingsRounds?: FeelingsRound[]
  /** adhd quest: the steering game arrow by arrow and the star-sequence game level by level */
  steeringTrials?: SteeringTrial[]
  starLevels?: StarLevel[]
  /** both quests: the parent's answers after the play */
  parentCard?: ParentCardRecord
  /** autism quest: what the child chose to help the sad sprite */
  helpRound?: HelpRound
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
    title: 'Reading and sound-awareness play activity',
    sampled: 'rhyming, first sounds, letter shapes (such as b and d), remembering sounds in order and, as optional chapters, telling real words from made-up words (age 7 and over) and choosing the correct spelling. The question version covers spelling and short reading questions.',
    next: [
      'A hearing and vision check, if one has not been done recently.',
      'A literacy assessment by an educational psychologist or specialist teacher, usually covering phonological awareness, word and non-word reading, spelling and reading fluency.',
      "The school's view of reading progress and any support already given.",
    ],
  },
  adhd: {
    title: 'Attention and self-control play activity',
    sampled: 'noticing a target, responding to the wrong target, slowing down when distractions conflict, remembering a sequence and waiting.',
    next: [
      'A hearing and vision check, and a look at sleep, health and stress, which can all affect attention.',
      'Rating scales completed by a parent and a teacher (for example the Vanderbilt or Conners scales), which a clinician reads alongside the history.',
      'A clinical interview about when concerns began, whether they show up in more than one setting, and how much they affect daily life.',
    ],
  },
  autism: {
    title: 'Social communication and sensory comfort play activity',
    sampled: 'following gaze and pointing, matching cartoon faces to feelings, choosing comfortable light, sound and touch levels, and switching sorting rules.',
    next: [
      'A hearing and vision check, and a review of language development.',
      'A developmental history and, where the clinician thinks it helpful, structured parent questionnaires and a clinician-led observation (such as the ADOS-2).',
      'A multi-professional evaluation if concerns continue across settings.',
    ],
  },
} as const

/** One plain line per game, tied to what its measures count. No interpretation. */
export const GAME_NOTE: Record<string, string> = {
  'Sunbird game': 'Counts of sunbirds missed, taps on the shadow moth and tap speed, overall and by round.',
  'Steering game': 'Rounds where the arrows matched and rounds where they disagreed, scored separately.',
  'Star-sequence game': 'The longest star sequence repeated correctly.',
  'Patience game': 'Early releases in a practice game. It is not a validated task.',
  'Gaze game': 'Choices that matched where Aria looked or pointed, and how long choosing took.',
  'Feelings match': 'Cartoon faces matched to the feeling shown.',
  'Comfort choices': 'Levels chosen in the room, and the level at which each sense was said to be too much. These are preferences and reactions from one session, not a test.',
  'Sorting game': 'Gems sorted by colour, then by shape after the rule changed.',
  'During the session': 'How the session went. These are not scores.',
}

function groupByGame(ms: Measure[] | undefined): Array<[string, Measure[]]> {
  const map = new Map<string, Measure[]>()
  for (const m of ms ?? []) {
    const g = m.game || 'Other'
    map.set(g, [...(map.get(g) ?? []), m])
  }
  const list = Array.from(map.entries())
  return [...list.filter(([g]) => g !== 'During the session'), ...list.filter(([g]) => g === 'During the session')]
}

const pc = (x: number) => `${Math.round(x * 100)}%`

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
  const printRef = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<HTMLButtonElement>(null)
  useEffect(() => setMounted(true), [])
  useEffect(() => {
    if (!open) return
    printRef.current?.focus()
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); return }
      if (e.key !== 'Tab') return
      const a = printRef.current, b = closeRef.current
      if (!a || !b) return
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus() }
      else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus() }
    }
    window.addEventListener('keydown', k)
    return () => { window.removeEventListener('keydown', k); openerRef.current?.focus() }
  }, [open])

  const q = QUEST[p.quest]
  const ex: ReportExtra = p.extra || {}
  const measured = p.rows.filter((r) => !/^(chapters finished|spoken audio)$/i.test(r.name))
  const withData = measured.filter((r) => !/not enough data|not completed/i.test(r.value)).length
  const games = groupByGame(p.measures)
  const date = p.generatedOn || new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <>
      <button type="button" ref={openerRef} onClick={() => setOpen(true)} style={{ minHeight: 44, padding: '8px 18px', borderRadius: 999, border: '1.5px solid #8A7F6E', background: '#F4ECDC', color: '#2F2A24', fontWeight: 700, cursor: 'pointer' }}>
        Clinician summary (print or save as PDF)
      </button>
      {open && mounted && createPortal(
        <div className="cr-portal" role="dialog" aria-modal="true" aria-label="Clinician summary">
          <style>{CSS}</style>
          <div className="cr-tools">
            <button type="button" className="cr-btn" ref={printRef} onClick={() => window.print()}>Print or save as PDF</button>
            <button type="button" className="cr-btn ghost" ref={closeRef} onClick={() => setOpen(false)}>Close</button>
          </div>
          <article className="cr-paper">
            <table className="cr-wrap"><tfoot><tr><td className="cr-pfoot">Not a diagnostic report · {p.variant === 'questions' ? 'Question-based' : 'Play-based'} summary · {p.nickname || 'No name given'} · {date} · v{INSTRUMENT_VERSION}</td></tr></tfoot><tbody><tr><td>
            <header className="cr-sec">
              <p className="cr-kicker">{p.variant === 'questions' ? 'Question-based summary' : 'Play-based summary'} · Not a diagnostic report</p>
              <h1>{p.variant === 'questions' ? q.title.replace('play activity', 'question-based activity') : q.title}</h1>
              <table className="cr-meta"><tbody>
                <tr><th>Play name</th><td>{p.nickname || 'Not given'}</td><th>Date</th><td>{date}</td></tr>
                <tr><th>Age</th><td>{p.ageLabel ? p.ageLabel : p.age ? `${p.age} years (as entered)` : 'Not given'}</td><th>Measures with data</th><td>{withData} of {measured.length}</td></tr>
                <tr><th>Child’s full name</th><td className="cr-line" /><th>Date of birth</th><td className="cr-line" /></tr>
              </tbody></table>
              <p className="cr-small">Full name and date of birth are left blank on purpose so they stay on paper and are never entered into the website.</p>
            </header>

            <section className="cr-sec cr-box">
              <h2>Please read first</h2>
              <ul>{LIMITS.map((l, i) => <li key={i}>{i === 0 && p.variant === 'questions' ? l.replace('child-friendly play activities', 'a short set of child-friendly questions') : l}</li>)}</ul>
              <p className="cr-small">The activities sampled: {p.variant === 'questions' ? QSAMPLED[p.quest] : q.sampled}</p>
            </section>

            <section className="cr-sec cr-flow">
              <h2>What was recorded</h2>
              <table className="cr-table">
                <thead><tr><th>Activity</th><th>Recorded in this session</th></tr></thead>
                <tbody>
                  {p.rows.map((r, i) => {
                    const none = /not enough data|not completed/i.test(r.value)
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

            {!!p.parentCard && (
              <section className="cr-sec cr-flow">
                <h2>Parent&apos;s answers after the play</h2>
                <table className="cr-mini">
                  <tbody>
                    <tr><td>Seemed tired</td><td>{p.parentCard.tired ?? 'Skipped'}</td></tr>
                    <tr><td>Like how the child is at home or in class</td><td>{p.parentCard.likeHome ?? 'Skipped'}</td></tr>
                    <tr><td>How the child seemed to feel about the play</td><td>{p.parentCard.enjoyed ?? 'Skipped'}</td></tr>
                  </tbody>
                </table>
              </section>
            )}

            {!!games.length && (
              <section className="cr-sec cr-flow">
                <h2>Results by game</h2>
                {games.map(([game, ms]) => (
                  <div key={game} className="cr-game">
                    <h3>{game}</h3>
                    {GAME_NOTE[game] && <p className="cr-small">{GAME_NOTE[game]}</p>}
                    <table className="cr-mini">
                      <thead><tr><th>Measure</th><th>Result</th><th>95% interval</th></tr></thead>
                      <tbody>
                        {ms.map((m) => (
                          <tr key={m.key}>
                            <td>{m.label}{m.note && <div className="cr-note">{m.note}</div>}</td>
                            {m.kind === 'proportion'
                              ? <><td>{m.k} of {m.n} ({pc(m.p)})</td><td>{pc(m.lo)} to {pc(m.hi)}{m.wide ? ' · wide: too few trials to say much' : ''}</td></>
                              : <><td>{m.value} {m.unit}{m.n ? ` (from ${m.n})` : ''}</td><td>–</td></>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {game === 'Gaze game' && !!p.gazeRounds?.length && (
                      <table className="cr-mini">
                        <thead><tr><th>Encounter</th><th>Aria</th><th>Looked at</th><th>Child chose</th><th>Matched</th><th>Time</th></tr></thead>
                        <tbody>
                          {p.gazeRounds.map((r) => (
                            <tr key={r.round}><td>{r.round}</td><td>{r.pointing ? 'Looked and pointed' : 'Looked only'}</td><td>{r.target}</td><td>{r.chosen}</td><td>{r.matched ? 'Yes' : 'No'}</td><td>{r.ms !== null ? `${(Math.round(r.ms / 100) / 10).toFixed(1)} s` : '–'}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {game === 'Feelings match' && !!p.feelingsRounds?.length && (
                      <table className="cr-mini">
                        <thead><tr><th>Round</th><th>Feeling shown</th><th>Child chose</th><th>Matched</th><th>Time</th></tr></thead>
                        <tbody>
                          {p.feelingsRounds.map((r) => (
                            <tr key={r.round}><td>{r.round}</td><td>{r.shown}</td><td>{r.chosen}</td><td>{r.matched ? 'Yes' : 'No'}</td><td>{r.ms !== null ? `${(Math.round(r.ms / 100) / 10).toFixed(1)} s` : '–'}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {game === 'Feelings match' && !!p.helpRound && (
                      <p className="cr-small">What would help the sad sprite: {p.helpRound.chosen}{p.helpRound.ms !== null ? `, after about ${(Math.round(p.helpRound.ms / 100) / 10).toFixed(1)} s` : ''}. There is no right answer to this step.</p>
                    )}
                    {game === 'Steering game' && !!p.steeringTrials?.length && (
                      <table className="cr-mini">
                        <thead><tr><th>Round</th><th>Arrows</th><th>Answered correctly</th><th>Time</th></tr></thead>
                        <tbody>
                          {p.steeringTrials.map((r) => (
                            <tr key={r.trial}><td>{r.trial}</td><td>{r.arrows === 'matching' ? 'Matching' : 'Conflicting'}</td><td>{r.correct ? 'Yes' : 'No'}</td><td>{r.ms !== null ? `${(Math.round(r.ms / 100) / 10).toFixed(1)} s` : '–'}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {game === 'Star-sequence game' && !!p.starLevels?.length && (
                      <table className="cr-mini">
                        <thead><tr><th>Level</th><th>Stars in sequence</th><th>Result</th></tr></thead>
                        <tbody>
                          {p.starLevels.map((l) => (
                            <tr key={l.level}><td>{l.level}</td><td>{l.length}</td><td>{l.completed ? 'Repeated in order' : `First wrong tap at star ${l.missedAt}`}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {game === 'Sorting game' && !!p.sortingCards?.length && (
                      <table className="cr-mini">
                        <thead><tr><th>Card</th><th>Rule shown</th><th>Box tapped</th><th>Matched the rule</th><th>Time</th></tr></thead>
                        <tbody>
                          {p.sortingCards.map((c) => (
                            <tr key={c.card}>
                              <td>{c.card}: {c.color} {c.shape}</td><td>{c.rule}</td><td>{c.box}</td><td>{c.right ? 'Yes' : 'No'}</td><td>{c.ms !== null ? `${(Math.round(c.ms / 100) / 10).toFixed(1)} s` : '–'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))}
                <p className="cr-small">Each game is shown on its own, and no scores are combined. A 95% interval shows how far a result could move by chance from one short session. A wide interval means there were too few trials to say much. Read every figure with the child’s age, tiredness and device in mind.</p>
              </section>
            )}

            {!!ex.compare?.length && (
              <section className="cr-sec">
                <h2>Descriptive comparisons</h2>
                <ul>{(ex.compare ?? []).map((x, i) => <li key={i}>{x}</li>)}</ul>
                <p className="cr-small">These restate the figures above side by side. They are not interpretations, and with this few items small differences are expected by chance.</p>
              </section>
            )}

            {!!ex.method?.length && (
              <section className="cr-sec">
                <h2>How each activity works</h2>
                <table className="cr-mini">
                  <thead><tr><th>Activity</th><th>What it samples</th><th>Items</th><th>Scoring</th></tr></thead>
                  <tbody>{(ex.method ?? []).map((m, i) => <tr key={i}><td><strong>{m.name}</strong></td><td>{m.samples}</td><td>{m.items}</td><td>{m.scoring}</td></tr>)}</tbody>
                </table>
                <p className="cr-small">Items are presented in a fixed order and the correct answer is placed on each side equally often, so every session is comparable.</p>
              </section>
            )}

            <section className="cr-sec">
              <h2>Conditions during play (parent to tick)</h2>
              <table className="cr-meta cr-cond"><tbody>
                <tr><th>Child seemed</th><td>☐ rested &nbsp; ☐ tired &nbsp; ☐ unwell &nbsp; ☐ hungry</td></tr>
                <tr><th>Mood while playing</th><td>☐ eager &nbsp; ☐ calm &nbsp; ☐ bored &nbsp; ☐ frustrated &nbsp; ☐ anxious</td></tr>
                <tr><th>Device</th><td>☐ phone &nbsp; ☐ tablet &nbsp; ☐ laptop or desktop &nbsp; ☐ touch &nbsp; ☐ mouse</td></tr>
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

            {!!ex.appendix?.length && (
              <section className="cr-sec cr-appx">
                <h2>Appendix: item-by-item record</h2>
                <p className="cr-small">Every scored item in the order shown. Practice items are not listed. Times run from when the choices or word were available to the touch.</p>
                {(ex.appendix ?? []).map((t, i) => (
                  <div key={i}>
                    <h3>{t.title}</h3>
                    <table className="cr-mini">
                      <thead><tr>{t.head.map((h, j) => <th key={j}>{h}</th>)}</tr></thead>
                      <tbody>{t.rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}>{c}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                ))}
              </section>
            )}

            <footer className="cr-sec cr-small">
              Report version {INSTRUMENT_VERSION}. Nothing from this session was saved on a server. The figures were produced in the browser{p.wording ? `, and the wording was written ${p.wording === 'ai' ? 'with the help of an AI model and checked automatically against the recorded numbers' : 'from a fixed template'}` : ''}. This summary is not a medical device and is not a diagnosis.
            </footer>
          </td></tr></tbody></table>
          </article>
        </div>,
        document.body,
      )}
    </>
  )
}

const CSS = `
.cr-portal{position:fixed;inset:0;z-index:9999;overflow-y:auto;overscroll-behavior:contain;background:#EFEAE0;color:#1F1B16;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;line-height:1.5}
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
.cr-wrap{width:100%;border-collapse:collapse}
.cr-wrap>tbody>tr>td,.cr-wrap>tfoot>tr>td{padding:0;border:0;vertical-align:top}
.cr-wrap>tfoot{display:none}
.cr-pfoot{font-size:10px;color:#51493E;border-top:1px solid #CFC5AE!important;padding-top:6px!important}
.cr-paper h2{break-after:avoid}
.cr-inline{display:inline-block;width:170px;border-bottom:1px solid #1F1B16}
.cr-lines span{display:block;height:28px;border-bottom:1px solid #8A7F6E}
.cr-appx h3,.cr-game h3{font-size:13px;margin:14px 0 4px}
.cr-game{break-inside:avoid}
.cr-mini{width:100%;border-collapse:collapse;font-size:12px}
.cr-mini th,.cr-mini td{border:1px solid #CFC5AE;padding:4px 8px;text-align:left;vertical-align:top}
.cr-mini th{background:#F4ECDC}
@media (max-width:640px){.cr-paper{padding:20px 16px;margin:0}}
@media print{
  body > *:not(.cr-portal){display:none!important}
  .cr-portal{position:static!important;overflow:visible!important;background:#fff!important}
  .cr-tools{display:none!important}
  .cr-paper{box-shadow:none!important;margin:0!important;padding:0!important;max-width:none!important}
  .cr-sec,.cr-table tr,.cr-meta tr{break-inside:avoid}
  .cr-sec.cr-flow{break-inside:auto}
  .cr-sec.cr-appx{break-inside:auto;break-before:page}
  .cr-mini tr{break-inside:avoid}
  .cr-mini thead{display:table-header-group}
  .cr-table thead{display:table-header-group}
  .cr-wrap>tfoot{display:table-footer-group}
  .cr-wrap>tbody>tr>td{padding-bottom:14px!important}
  *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  @page{margin:14mm}
}
`
