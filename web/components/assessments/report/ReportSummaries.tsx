'use client'
import {useState} from 'react'
import type {Roadmap} from '../roadmap/generate'
import {TEXT as ROADMAP_TEXT} from '../roadmap/library'
import {GAME_NOTE} from '../ClinicianReport'
import type {Measure} from '../session-record'
import {buildGameStories} from './narrative'
import {CLINICIAN_QUESTIONS, REPORT_TEXT} from './library'
import {ClinicianSection, DraftBanner, ParentSection, type ReportRecord} from './ParentClinicianReport'

/**
 * Two separate views of one session record: a one-page summary for the parent and a one-page summary for the clinician,
 * each followed by its own detail. Built by fixed rules. No view says a result is high, low, typical or unusual, and
 * neither gives a diagnosis. Runs in the browser; nothing is sent or saved.
 */

const pc = (x: number) => `${Math.round(x * 100)}%`
const QUEST_NAME = {adhd: 'Attention and activity play', autism: 'Social and sensory play'} as const

function sessionDate(record: ReportRecord): string {
  const when = new Date(record.recordedAt)
  return isNaN(when.getTime()) ? '' : when.toLocaleDateString('en-IN', {year: 'numeric', month: 'long', day: 'numeric'})
}

export function ParentSummary({record, name, roadmap}: {record: ReportRecord; name?: string; roadmap: Roadmap | null}) {
  const {stories: all, missing} = buildGameStories(record, name)
  const stories = all.filter((s) => s.game !== 'During the session')
  const few = stories.some((s) => s.fewTrials)
  const who = name?.trim() || 'your child'
  const notes = roadmap?.dataNotes ?? []
  const cameraUsed = !!record.camera || !!record.looking
  return (
    <article className="space-y-6" aria-label="Summary for parents">
      <DraftBanner />
      <section className="rounded-2xl border-2 border-teal-300 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-teal-700">Summary for parents</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">{who === 'your child' ? 'Your child’s' : `${who}’s`} play session</h2>
        <p className="mt-1 text-sm text-slate-600">{QUEST_NAME[record.quest]}{sessionDate(record) ? ` · ${sessionDate(record)}` : ''}</p>
        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-800">{REPORT_TEXT.notDiagnosis}</p>

        <h3 className="mt-5 text-lg font-bold text-teal-800">What we saw</h3>
        {stories.length ? (
          <ul className="mt-1 space-y-2 text-sm text-slate-800">
            {stories.map((s) => (
              <li key={s.game} className="break-inside-avoid"><span className="font-bold">{s.game}: </span>{s.lines[0]}</li>
            ))}
          </ul>
        ) : <p className="mt-1 text-sm text-slate-700">No game results were recorded in this session.</p>}
        {few && <p className="mt-2 text-xs text-slate-600">Some games had only a few rounds, so one session cannot say much either way.</p>}
        {missing.length > 0 && <p className="mt-2 text-sm text-slate-700">No results were recorded for: {missing.join(', ')}.</p>}
        {notes.filter((n) => !n.startsWith('No results were recorded')).map((n) => <p key={n} className="mt-2 text-sm text-amber-800">{n}</p>)}

        <h3 className="mt-5 text-lg font-bold text-teal-800">What this does not tell us</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-800">
          <li>It is one short session, so it is a snapshot of that day only.</li>
          <li>Nothing here is compared with other children, and no result is called high, low or typical.</li>
          <li>The games cannot show why something happened or whether a child has a difference or a condition.</li>
          {cameraUsed && <li>Camera numbers only describe where the head and eyes pointed. They do not show attention or interest.</li>}
        </ul>

        <h3 className="mt-5 text-lg font-bold text-teal-800">Your next 3 steps</h3>
        <ol className="mt-1 list-decimal space-y-2 pl-5 text-sm text-slate-800">
          <li><span className="font-bold">Notice. </span>{ROADMAP_TEXT.notice}</li>
          <li><span className="font-bold">Look again. </span>{ROADMAP_TEXT.repeat}</li>
          <li><span className="font-bold">Talk it through. </span>{ROADMAP_TEXT.bring}</li>
        </ol>

        <h3 className="mt-5 text-base font-bold text-slate-900">{REPORT_TEXT.questionsTitle}</h3>
        <ul className="mt-1 list-disc pl-5 text-sm text-slate-800">{CLINICIAN_QUESTIONS.map((q) => <li key={q}>{q}</li>)}</ul>
      </section>

      <details open className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer text-lg font-bold text-teal-800">Each game in plain words</summary>
        <div className="mt-3"><ParentSection record={record} name={name} roadmap={roadmap} /></div>
      </details>
    </article>
  )
}

/** Up to three rows per game: proportions first, since they carry an interval, then the first values. */
function headline(ms: Measure[]): Measure[] {
  const props = ms.filter((m) => m.kind === 'proportion')
  const vals = ms.filter((m) => m.kind === 'value')
  return [...props, ...vals].slice(0, 3)
}

export function ClinicianSummary({record}: {record: ReportRecord}) {
  const games = new Map<string, Measure[]>()
  for (const m of record.measures) games.set(m.game || 'Other', [...(games.get(m.game || 'Other') ?? []), m])
  const list = Array.from(games.entries()).filter(([g]) => g !== 'During the session')
  const val = (key: string) => {
    const m = record.measures.find((x) => x.key === key)
    return m && m.kind === 'value' ? m.value : null
  }
  const retries = record.measures.filter((m) => /^retry/.test(m.key) && m.kind === 'value' && m.value > 0)
  const pauses = val('pauseCount')
  const wide = list.filter(([, ms]) => ms.some((m) => m.kind === 'proportion' && m.wide)).map(([g]) => g)
  const env = record.environment
  const camStatus = record.camera?.status ?? record.looking?.status ?? null
  return (
    <article className="space-y-6" aria-label="Summary for the clinician">
      <DraftBanner />
      <section className="rounded-2xl border-2 border-sky-300 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-sky-700">Summary for the clinician</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">Play session record</h2>
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <div><dt className="inline font-semibold">Activity: </dt><dd className="inline">{QUEST_NAME[record.quest]}</dd></div>
          <div><dt className="inline font-semibold">Date: </dt><dd className="inline">{sessionDate(record) || 'Not recorded'}</dd></div>
          <div><dt className="inline font-semibold">Age: </dt><dd className="inline">{record.ageYears ?? 'Not given'}{record.ageBand ? ` (band ${record.ageBand})` : ''}</dd></div>
          <div><dt className="inline font-semibold">Instrument: </dt><dd className="inline">{record.instrument.name} v{record.instrument.version}, format {record.schema}</dd></div>
        </dl>
        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-800">
          A short, play-based record of one session. It is not a screening tool or a diagnostic test. There are no norms or cut-offs, so no figure says a result is typical or unusual. Each game stands alone and nothing is combined into one score.
        </p>

        <h3 className="mt-5 text-lg font-bold text-sky-800">Headline figures</h3>
        <div className="mt-1 overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead><tr className="border-b-2 border-slate-300 text-xs uppercase tracking-wide text-slate-500"><th className="py-1 pr-3">Game</th><th className="py-1 pr-3">Measure</th><th className="py-1 pr-3">Result</th><th className="py-1">95% interval</th></tr></thead>
            <tbody>
              {list.flatMap(([game, ms]) => headline(ms).map((m, i) => (
                <tr key={`${game}-${m.key}`} className="break-inside-avoid border-b border-slate-200 align-top">
                  <td className="py-1 pr-3 font-semibold">{i === 0 ? game : ''}</td>
                  <td className="py-1 pr-3">{m.label}</td>
                  {m.kind === 'proportion'
                    ? <><td className="py-1 pr-3">{m.k} of {m.n} ({pc(m.p)})</td><td className="py-1">{pc(m.lo)} to {pc(m.hi)}{m.wide ? <span className="block text-xs text-amber-700">Wide</span> : null}</td></>
                    : <><td className="py-1 pr-3">{m.value} {m.unit}</td><td className="py-1 text-slate-400">n/a</td></>}
                </tr>
              )))}
              {!list.length && <tr><td className="py-2" colSpan={4}>No game results were recorded.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-600">Only the first few measures of each game are shown here. The full figures, round-by-round tables and card-by-card sorting are below.</p>

        <h3 className="mt-5 text-lg font-bold text-sky-800">Session quality</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-800">
          <li>{pauses && pauses > 0 ? `The page was left or hidden ${pauses} ${pauses === 1 ? 'time' : 'times'} during play, so the session may have been interrupted.` : 'No interruption was recorded (the page was not left or hidden).'}</li>
          <li>{retries.length ? `Practice was repeated: ${retries.map((m) => `${m.label.replace('Times practice was repeated, ', '')} (${m.kind === 'value' ? m.value : ''})`).join('; ')}.` : 'No practice round was repeated.'}</li>
          <li>{wide.length ? `Wide intervals (too few trials to say much) in: ${wide.join(', ')}.` : 'No wide intervals were flagged.'}</li>
          {camStatus && <li>Optional camera step: {camStatus === 'used' ? 'the face was seen for enough of the time, so camera figures are included.' : 'the face or side could not be read well enough, so no camera figures are reported.'} Camera figures describe head and eye direction only, not attention.</li>}
          <li>Device: {env?.touch === null || env?.touch === undefined ? 'touch not recorded' : env.touch ? 'touch screen' : 'no touch screen'}{env?.screen ? `, screen ${env.screen.width} by ${env.screen.height}` : ''}. Full conditions are below.</li>
        </ul>

        <h3 className="mt-5 text-lg font-bold text-sky-800">What each game counts</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-800">
          {list.filter(([g]) => GAME_NOTE[g]).map(([g]) => <li key={g}><span className="font-semibold">{g}: </span>{GAME_NOTE[g]}</li>)}
        </ul>
        <p className="mt-4 text-xs text-slate-600">Limits of this record are listed in the full figures below. The record was made by the child in a home setting without an observer, so it should be read alongside history and direct observation.</p>
      </section>

      <details open className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer text-lg font-bold text-sky-800">Full figures</summary>
        <div className="mt-3"><ClinicianSection record={record} /></div>
      </details>
    </article>
  )
}

/** The end-of-quest report: parent summary and clinician summary as two separate views, with a print button for the one on screen. */
export default function ReportTabs({record, name, roadmap}: {record: ReportRecord; name?: string; roadmap: Roadmap | null}) {
  const [tab, setTab] = useState<'parent' | 'clinician'>('parent')
  const tabCls = (on: boolean) => `min-h-[44px] rounded-full px-5 text-sm font-bold transition-colors ${on ? 'bg-teal-700 text-white shadow' : 'border-2 border-teal-700 bg-white text-teal-800'}`
  return (
    <section className="mx-auto mt-8 max-w-3xl text-left" aria-label="Your personalised report">
      <style>{`@media print { body * { visibility: hidden !important } #report-print, #report-print * { visibility: visible !important } #report-print { position: absolute; left: 0; top: 0; width: 100% } .no-print { display: none !important } }`}</style>
      <div className="no-print flex flex-wrap items-center gap-2" role="tablist" aria-label="Choose a report">
        <button type="button" role="tab" aria-selected={tab === 'parent'} onClick={() => setTab('parent')} className={tabCls(tab === 'parent')}>For parents</button>
        <button type="button" role="tab" aria-selected={tab === 'clinician'} onClick={() => setTab('clinician')} className={tabCls(tab === 'clinician')}>For the clinician</button>
        <button type="button" onClick={() => window.print()} className="ml-auto min-h-[44px] rounded-full border-2 border-slate-400 bg-white px-5 text-sm font-bold text-slate-700">Print or save as PDF</button>
      </div>
      <div id="report-print" className="mt-4" role="tabpanel">
        {tab === 'parent' ? <ParentSummary record={record} name={name} roadmap={roadmap} /> : <ClinicianSummary record={record} />}
      </div>
    </section>
  )
}
