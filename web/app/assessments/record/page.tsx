'use client'

import {useState} from 'react'
import {FeelingsTable, GazeTable} from '../../../components/assessments/report/RoundTables'
import type {FeelingsRound, GazeRound} from '../../../components/assessments/session-record'

/**
 * Clinician record viewer. Runs entirely in the browser: the session record is pasted or opened
 * from a file here, shown in a table, and printed. Nothing is sent to a server or stored.
 */

type Proportion = {kind: 'proportion'; key: string; label: string; k: number; n: number; p: number; lo: number; hi: number; wide: boolean; note?: string}
type ValueM = {kind: 'value'; key: string; label: string; value: number; unit: string; n: number | null; note?: string}
type Rec = {
  schema: string
  instrument: {id: string; name: string; version: string}
  quest: string
  ageYears: number | null
  ageBand: string | null
  recordedAt: string
  environment: {userAgent: string | null; language: string | null; timezone: string | null; screen: {width: number; height: number; pixelRatio: number} | null; touch: boolean | null}
  measures: Array<Proportion | ValueM>
  gazeRounds?: GazeRound[]
  feelingsRounds?: FeelingsRound[]
  sortingCards?: Array<{card: number; rule: string; color: string; shape: string; box: string; right: boolean; ms: number | null}>
  limits: string[]
}

function toRecord(text: string): Rec {
  const raw = JSON.parse(text)
  const cand = raw?.record ?? raw?.data?.record ?? raw
  if (!cand || typeof cand !== 'object' || !Array.isArray(cand.measures) || !cand.instrument) {
    throw new Error('This does not look like a Manas Profile session record.')
  }
  return cand as Rec
}

const pct = (x: number) => `${Math.round(x * 100)}%`

export default function RecordViewer() {
  const [text, setText] = useState('')
  const [rec, setRec] = useState<Rec | null>(null)
  const [error, setError] = useState('')

  const load = (source: string) => {
    try {
      setRec(toRecord(source))
      setError('')
    } catch (e) {
      setRec(null)
      setError(e instanceof Error ? e.message : 'Could not read that text.')
    }
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    const content = await file.text()
    setText(content)
    load(content)
  }

  return (
    <main className="min-h-screen bg-[#F4F9FD] px-4 py-8 text-slate-800">
      <style>{`@media print { .no-print { display: none !important } main { background: #fff !important } }`}</style>
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold md:text-3xl">Manas Profile: session record</h1>
        <p className="mt-1 text-sm text-slate-600">
          Counts, speeds and 95% intervals from one play session. No scores against other children, no cut-offs and no labels.
          This page runs in your browser only; nothing you paste here is sent or saved.
        </p>

        <div className="no-print mt-6 rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
          <label className="block text-sm font-semibold" htmlFor="rec-file">Open a session record file (.json)</label>
          <input id="rec-file" type="file" accept=".json,application/json" className="mt-2 block text-sm"
            onChange={(e) => onFile(e.target.files?.[0])} />
          <label className="mt-4 block text-sm font-semibold" htmlFor="rec-text">Or paste the record</label>
          <textarea id="rec-text" value={text} onChange={(e) => setText(e.target.value)} rows={5}
            className="mt-2 w-full rounded-lg border border-slate-300 p-2 font-mono text-xs" placeholder='{"schema":"1.0", ...}' />
          <button type="button" onClick={() => load(text)}
            className="mt-3 min-h-[44px] rounded-full bg-sky-600 px-6 text-sm font-bold text-white hover:bg-sky-700">Show record</button>
          {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{error}</p>}
        </div>

        {rec && (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{rec.instrument.name}</h2>
                <p className="text-sm text-slate-600">
                  Instrument version {rec.instrument.version} · record format {rec.schema} · recorded {new Date(rec.recordedAt).toLocaleString('en-IN')}
                </p>
                <p className="text-sm text-slate-600">
                  Age {rec.ageYears ?? 'not given'}{rec.ageBand ? ` (age band ${rec.ageBand})` : ''}
                </p>
              </div>
              <button type="button" onClick={() => window.print()}
                className="no-print min-h-[44px] rounded-full border-2 border-sky-600 px-5 text-sm font-bold text-sky-700 hover:bg-sky-50">Print</button>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-300 text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-3">Measure</th><th className="py-2 pr-3">Result</th><th className="py-2 pr-3">95% interval</th><th className="py-2">Trials</th>
                  </tr>
                </thead>
                <tbody>
                  {rec.measures.map((m) => (
                    <tr key={m.key} className="border-b border-slate-200 align-top">
                      <td className="py-2 pr-3 font-medium">{m.label}{m.note ? <span className="block text-xs font-normal text-slate-500">{m.note}</span> : null}</td>
                      {m.kind === 'proportion' ? (
                        <>
                          <td className="py-2 pr-3">{m.k} of {m.n} ({pct(m.p)})</td>
                          <td className="py-2 pr-3">{pct(m.lo)} to {pct(m.hi)}{m.wide ? <span className="block text-xs text-amber-700">Wide: too few trials to say much</span> : null}</td>
                          <td className="py-2">{m.n}</td>
                        </>
                      ) : (
                        <>
                          <td className="py-2 pr-3">{m.value} {m.unit}</td>
                          <td className="py-2 pr-3 text-slate-400">Not applicable</td>
                          <td className="py-2">{m.n ?? 'Not recorded'}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!!rec.gazeRounds?.length && (<><h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-500">Gaze game, encounter by encounter</h3><GazeTable rounds={rec.gazeRounds} /></>)}
            {!!rec.feelingsRounds?.length && (<><h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-500">Feelings match, round by round</h3><FeelingsTable rounds={rec.feelingsRounds} /></>)}
            {!!rec.sortingCards?.length && (
              <>
                <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-500">Sorting game, card by card</h3>
                <div className="mt-1 overflow-x-auto">
                  <table className="w-full min-w-[30rem] border-collapse text-left text-sm">
                    <thead><tr className="border-b-2 border-slate-300 text-xs uppercase tracking-wide text-slate-500"><th className="py-2 pr-3">Card</th><th className="py-2 pr-3">Rule shown</th><th className="py-2 pr-3">Box tapped</th><th className="py-2 pr-3">Matched the rule</th><th className="py-2">Time</th></tr></thead>
                    <tbody>
                      {rec.sortingCards.map((c) => (
                        <tr key={c.card} className="border-b border-slate-200">
                          <td className="py-2 pr-3">{c.card}: {c.color} {c.shape}</td><td className="py-2 pr-3">{c.rule}</td><td className="py-2 pr-3">{c.box}</td><td className="py-2 pr-3">{c.right ? 'Yes' : 'No'}</td><td className="py-2">{c.ms !== null ? `${(Math.round(c.ms / 100) / 10).toFixed(1)} s` : 'Not recorded'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-500">Testing conditions</h3>
            <ul className="mt-1 text-sm text-slate-700">
              <li>Browser and device: {rec.environment.userAgent ?? 'Not recorded'}</li>
              <li>Screen: {rec.environment.screen ? `${rec.environment.screen.width} by ${rec.environment.screen.height}, pixel ratio ${rec.environment.screen.pixelRatio}` : 'Not recorded'}</li>
              <li>Touch screen: {rec.environment.touch === null ? 'Not recorded' : rec.environment.touch ? 'Yes' : 'No'}</li>
              <li>Language and time zone: {rec.environment.language ?? 'Not recorded'}, {rec.environment.timezone ?? 'not recorded'}</li>
            </ul>

            <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-500">Limits of this record</h3>
            <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
              {rec.limits.map((l) => <li key={l}>{l}</li>)}
            </ul>
          </section>
        )}
      </div>
    </main>
  )
}
