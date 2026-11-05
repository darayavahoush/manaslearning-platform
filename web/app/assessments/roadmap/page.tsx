'use client'

import {useMemo, useState} from 'react'
import RoadmapView from '../../../components/assessments/roadmap/RoadmapView'
import {generateRoadmap} from '../../../components/assessments/roadmap/generate'
import {IDEA_TOPICS, type IdeaTopic} from '../../../components/assessments/ideas'
import type {Measure, Quest} from '../../../components/assessments/session-record'

/**
 * Roadmap preview. Paste or open a session record, choose the areas to focus on, and see the
 * 30/60/90-day roadmap. Runs in the browser only; nothing is sent or saved. This page exists so
 * the wording can be reviewed by a clinician before the roadmap is shown on the parent result pages.
 */

const TOPIC_LABEL: Record<IdeaTopic, string> = {
  classroom: 'In the classroom',
  examinations: 'Tests and exams',
  executive: 'Planning and organising',
  sensoryDiet: 'Movement and sensory comfort',
}

function toRecord(text: string): {quest: Quest; measures: Measure[]} {
  const raw = JSON.parse(text)
  const cand = raw?.record ?? raw?.data?.record ?? raw
  if (!cand || (cand.quest !== 'adhd' && cand.quest !== 'autism') || !Array.isArray(cand.measures)) {
    throw new Error('This needs a Manas Profile session record from the attention (ADHD) or social and sensory (autism) quest.')
  }
  return {quest: cand.quest, measures: cand.measures}
}

export default function RoadmapPreview() {
  const [text, setText] = useState('')
  const [record, setRecord] = useState<{quest: Quest; measures: Measure[]} | null>(null)
  const [error, setError] = useState('')
  const [focus, setFocus] = useState<IdeaTopic[]>([])

  const load = (source: string) => {
    try { setRecord(toRecord(source)); setError('') }
    catch (e) { setRecord(null); setError(e instanceof Error ? e.message : 'Could not read that text.') }
  }
  const roadmap = useMemo(() => (record ? generateRoadmap({record, focus}) : null), [record, focus])

  return (
    <main className="min-h-screen bg-[#F4F9FD] px-4 py-8 text-slate-800">
      <style>{`@media print { .no-print { display: none !important } main { background: #fff !important } }`}</style>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold md:text-3xl">30, 60 and 90 day roadmap (preview)</h1>
        <p className="mt-1 text-sm text-slate-600">
          Built by fixed rules from a session record and the areas you choose. No scores against other children, no cut-offs and no labels.
          This page runs in your browser only; nothing you paste here is sent or saved.
        </p>

        <div className="no-print mt-6 rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
          <label className="block text-sm font-semibold" htmlFor="rm-file">Open a session record file (.json)</label>
          <input id="rm-file" type="file" accept=".json,application/json" className="mt-2 block text-sm"
            onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; const c = await f.text(); setText(c); load(c) }} />
          <label className="mt-4 block text-sm font-semibold" htmlFor="rm-text">Or paste the record</label>
          <textarea id="rm-text" value={text} onChange={(e) => setText(e.target.value)} rows={4}
            className="mt-2 w-full rounded-lg border border-slate-300 p-2 font-mono text-xs" placeholder='{"schema":"1.1", ...}' />
          <button type="button" onClick={() => load(text)} className="mt-2 min-h-[44px] rounded-full bg-teal-700 px-5 text-sm font-bold text-white">Show roadmap</button>
          {error && <p role="alert" className="mt-2 text-sm font-semibold text-rose-700">{error}</p>}

          <fieldset className="mt-4">
            <legend className="text-sm font-semibold">Areas to focus on (optional)</legend>
            <div className="mt-2 flex flex-wrap gap-4">
              {IDEA_TOPICS.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={focus.includes(t)}
                    onChange={(e) => setFocus((f) => (e.target.checked ? [...f, t] : f.filter((x) => x !== t)))} />
                  {TOPIC_LABEL[t]}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {roadmap && (
          <div className="mt-6">
            <button type="button" onClick={() => window.print()} className="no-print mb-3 min-h-[44px] rounded-full border-2 border-teal-700 px-5 text-sm font-bold text-teal-800">Print or save as PDF</button>
            <RoadmapView roadmap={roadmap} />
          </div>
        )}
      </div>
    </main>
  )
}
