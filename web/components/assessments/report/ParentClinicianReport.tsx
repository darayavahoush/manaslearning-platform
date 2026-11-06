'use client'
import RoadmapView from '../roadmap/RoadmapView'
import type {Roadmap} from '../roadmap/generate'
import {GAME_NOTE} from '../ClinicianReport'
import type {Measure, SessionRecord} from '../session-record'
import {buildGameStories} from './narrative'
import {FeelingsTable, GazeTable, ShowTable, StarTable, SteeringTable} from './RoundTables'
import {CLINICIAN_QUESTIONS, REPORT_REVIEWED, REPORT_TEXT} from './library'

/**
 * One report in two parts. Part 1 is for the parent, in plain language. Part 2 is for the clinician, with every
 * figure, the card-by-card sorting results and the testing conditions. Both parts come from the same session record.
 * Runs in the browser; nothing is sent or saved.
 */

export type ReportRecord = Pick<SessionRecord, 'quest' | 'measures' | 'instrument' | 'schema' | 'recordedAt' | 'limits'> &
  Partial<Pick<SessionRecord, 'ageYears' | 'ageBand' | 'environment' | 'sortingCards' | 'gazeRounds' | 'feelingsRounds' | 'steeringTrials' | 'starLevels' | 'showRounds' | 'camera' | 'looking'>>

const pc = (x: number) => `${Math.round(x * 100)}%`
const QUEST_NAME = {adhd: 'Attention and activity play', autism: 'Social and sensory play'} as const

function groupByGame(ms: Measure[]): Array<[string, Measure[]]> {
  const map = new Map<string, Measure[]>()
  for (const m of ms) map.set(m.game || 'Other', [...(map.get(m.game || 'Other') ?? []), m])
  const list = Array.from(map.entries())
  return [...list.filter(([g]) => g !== 'During the session'), ...list.filter(([g]) => g === 'During the session')]
}

export default function ParentClinicianReport({record, name, roadmap}: {record: ReportRecord; name?: string; roadmap: Roadmap | null}) {
  const {stories, missing} = buildGameStories(record, name)
  const games = groupByGame(record.measures)
  const when = new Date(record.recordedAt)
  const date = isNaN(when.getTime()) ? '' : when.toLocaleDateString('en-IN', {year: 'numeric', month: 'long', day: 'numeric'})
  const env = record.environment

  return (
    <article className="space-y-8" aria-label="Parent and clinician report">
      {!REPORT_REVIEWED && (
        <p role="note" className="rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
          Draft for clinician review. The wording in this report has not yet been checked by a clinician.
        </p>
      )}

      <header className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Play session report</h1>
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <div><dt className="inline font-semibold">Activity: </dt><dd className="inline">{QUEST_NAME[record.quest]}</dd></div>
          <div><dt className="inline font-semibold">Play name: </dt><dd className="inline">{name?.trim() || 'Not given'}</dd></div>
          <div><dt className="inline font-semibold">Age: </dt><dd className="inline">{record.ageYears ?? 'Not given'}{record.ageBand ? ` (age band ${record.ageBand})` : ''}</dd></div>
          <div><dt className="inline font-semibold">Date: </dt><dd className="inline">{date || 'Not recorded'}</dd></div>
        </dl>
        <p className="mt-3 text-sm font-semibold text-slate-800">{REPORT_TEXT.notDiagnosis}</p>
      </header>

      <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm" aria-label="For parents">
        <h2 className="text-xl font-bold text-teal-800">Part 1. For parents</h2>
        <p className="mt-1 text-sm text-slate-600">{REPORT_TEXT.parentIntro}</p>

        <div className="mt-4 space-y-4">
          {stories.map((s) => (
            <div key={s.game} className="break-inside-avoid rounded-lg border border-slate-200 p-3">
              <h3 className="text-base font-bold text-slate-900">{s.game}</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-800">{s.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
              {s.fewTrials && <p className="mt-2 text-xs text-slate-600">There were only a few rounds in this game, so one session cannot say much either way.</p>}
            </div>
          ))}
          {!stories.length && <p className="text-sm text-slate-700">No game results were recorded in this session.</p>}
          {missing.length > 0 && <p className="text-sm text-slate-700">No results were recorded for: {missing.join(', ')}.</p>}
        </div>

        {roadmap && <div className="mt-6"><RoadmapView roadmap={roadmap} /></div>}

        <h3 className="mt-6 text-base font-bold text-slate-900">{REPORT_TEXT.questionsTitle}</h3>
        <ul className="mt-1 list-disc pl-5 text-sm text-slate-800">{CLINICIAN_QUESTIONS.map((q) => <li key={q}>{q}</li>)}</ul>
      </section>

      <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm" style={{pageBreakBefore: 'always'}} aria-label="For the clinician">
        <h2 className="text-xl font-bold text-sky-800">Part 2. For the clinician</h2>
        <p className="mt-1 text-sm text-slate-600">{REPORT_TEXT.clinicianIntro}</p>
        <p className="mt-1 text-xs text-slate-500">{record.instrument.name} · version {record.instrument.version} · record format {record.schema}</p>

        <div className="mt-4 space-y-5">
          {games.map(([game, ms]) => (
            <div key={game} className="break-inside-avoid">
              <h3 className="text-base font-bold text-slate-900">{game}</h3>
              {GAME_NOTE[game] && <p className="text-xs text-slate-600">{GAME_NOTE[game]}</p>}
              <div className="mt-1 overflow-x-auto">
                <table className="w-full min-w-[30rem] border-collapse text-left text-sm">
                  <thead><tr className="border-b-2 border-slate-300 text-xs uppercase tracking-wide text-slate-500"><th className="py-1 pr-3">Measure</th><th className="py-1 pr-3">Result</th><th className="py-1">95% interval</th></tr></thead>
                  <tbody>
                    {ms.map((m) => (
                      <tr key={m.key} className="border-b border-slate-200 align-top">
                        <td className="py-1 pr-3">{m.label}{m.note ? <span className="block text-xs text-slate-500">{m.note}</span> : null}</td>
                        {m.kind === 'proportion'
                          ? <><td className="py-1 pr-3">{m.k} of {m.n} ({pc(m.p)})</td><td className="py-1">{pc(m.lo)} to {pc(m.hi)}{m.wide ? <span className="block text-xs text-amber-700">Wide: too few trials to say much</span> : null}</td></>
                          : <><td className="py-1 pr-3">{m.value} {m.unit}{m.n ? ` (from ${m.n})` : ''}</td><td className="py-1 text-slate-400">Not applicable</td></>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {game === 'Gaze game' && !!record.gazeRounds?.length && <GazeTable rounds={record.gazeRounds} />}
              {game === 'Gaze game' && !!record.showRounds?.length && <ShowTable rounds={record.showRounds} />}
              {game === 'Feelings match' && !!record.feelingsRounds?.length && <FeelingsTable rounds={record.feelingsRounds} />}
              {game === 'Steering game' && !!record.steeringTrials?.length && <SteeringTable rounds={record.steeringTrials} />}
              {game === 'Star-sequence game' && !!record.starLevels?.length && <StarTable levels={record.starLevels} />}
              {game === 'Sorting game' && !!record.sortingCards?.length && (
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[30rem] border-collapse text-left text-sm">
                    <thead><tr className="border-b-2 border-slate-300 text-xs uppercase tracking-wide text-slate-500"><th className="py-1 pr-3">Card</th><th className="py-1 pr-3">Rule shown</th><th className="py-1 pr-3">Box tapped</th><th className="py-1 pr-3">Matched the rule</th><th className="py-1">Time</th></tr></thead>
                    <tbody>
                      {record.sortingCards.map((c) => (
                        <tr key={c.card} className="border-b border-slate-200">
                          <td className="py-1 pr-3">{c.card}: {c.color} {c.shape}</td><td className="py-1 pr-3">{c.rule}</td><td className="py-1 pr-3">{c.box}</td><td className="py-1 pr-3">{c.right ? 'Yes' : 'No'}</td><td className="py-1">{c.ms !== null ? `${(Math.round(c.ms / 100) / 10).toFixed(1)} s` : 'Not recorded'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-600">Each game is shown on its own and no scores are combined. A 95% interval shows how far a result could move by chance from one short session. A wide interval means there were too few trials to say much.</p>

        <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-slate-500">Testing conditions</h3>
        <ul className="mt-1 text-sm text-slate-700">
          <li>Browser and device: {env?.userAgent ?? 'Not recorded'}</li>
          <li>Screen: {env?.screen ? `${env.screen.width} by ${env.screen.height}, pixel ratio ${env.screen.pixelRatio}` : 'Not recorded'}</li>
          <li>Touch screen: {env?.touch === null || env?.touch === undefined ? 'Not recorded' : env.touch ? 'Yes' : 'No'}</li>
          <li>Language and time zone: {env?.language ?? 'Not recorded'}, {env?.timezone ?? 'not recorded'}</li>
        </ul>

        <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-slate-500">Limits of this record</h3>
        <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">{record.limits.map((l) => <li key={l}>{l}</li>)}</ul>
      </section>
    </article>
  )
}
