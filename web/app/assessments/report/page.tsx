'use client'

import {useMemo, useState} from 'react'
import ParentClinicianReport, {type ReportRecord} from '../../../components/assessments/report/ParentClinicianReport'
import {generateRoadmap} from '../../../components/assessments/roadmap/generate'
import {IDEA_TOPICS, type IdeaTopic} from '../../../components/assessments/ideas'

/**
 * Parent and clinician report preview. Open or paste a session record, optionally type a play name and choose the areas
 * to focus on, then print or save as PDF. Runs in the browser only; nothing is sent or saved. The wording is a draft
 * until a clinician has reviewed it (see components/assessments/report/library.ts).
 */

const TOPIC_LABEL: Record<IdeaTopic, string> = {
  classroom: 'In the classroom',
  examinations: 'Tests and exams',
  executive: 'Planning and organising',
  sensoryDiet: 'Movement and sensory comfort',
}

function toRecord(text: string): ReportRecord {
  const raw = JSON.parse(text)
  const cand = raw?.record ?? raw?.data?.record ?? raw
  if (!cand || (cand.quest !== 'adhd' && cand.quest !== 'autism') || !Array.isArray(cand.measures) || !cand.instrument) {
    throw new Error('This needs a Manas Profile session record from the attention (ADHD) or social and sensory (autism) quest.')
  }
  return {...cand, limits: Array.isArray(cand.limits) ? cand.limits : [], recordedAt: String(cand.recordedAt ?? ''), schema: String(cand.schema ?? '')}
}

export default function ReportPreview() {
  const [text, setText] = useState('')
  const [record, setRecord] = useState<ReportRecord | null>(null)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
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
        <div className="no-print">
          <h1 className="text-2xl font-bold md:text-3xl">Parent and clinician report (preview)</h1>
          <p className="mt-1 text-sm text-slate-600">
            One report in two parts, built by fixed rules from a session record. No scores against other children, no cut-offs and no labels.
            This page runs in your browser only; nothing you paste or type here is sent or saved.
          </p>

          <div className="mt-6 rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
            <label className="block text-sm font-semibold" htmlFor="pr-file">Open a session record file (.json)</label>
            <input id="pr-file" type="file" accept=".json,application/json" className="mt-2 block text-sm"
              onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; const c = await f.text(); setText(c); load(c) }} />
            <label className="mt-4 block text-sm font-semibold" htmlFor="pr-text">Or paste the record</label>
            <textarea id="pr-text" value={text} onChange={(e) => setText(e.target.value)} rows={4}
              className="mt-2 w-full rounded-lg border border-slate-300 p-2 font-mono text-xs" placeholder='{"schema":"1.3", ...}' />
            <button type="button" onClick={() => load(text)} className="mt-2 min-h-[44px] rounded-full bg-teal-700 px-5 text-sm font-bold text-white">Show report</button>
            {error && <p role="alert" className="mt-2 text-sm font-semibold text-rose-700">{error}</p>}

            <label className="mt-4 block text-sm font-semibold" htmlFor="pr-name">Play name for the report (optional, typed here only)</label>
            <input id="pr-name" value={name} maxLength={20} onChange={(e) => setName(e.target.value.replace(/[^\p{L}\p{N} ]/gu, ''))}
              className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 p-2 text-sm" />

            <fieldset className="mt-4">
              <legend className="text-sm font-semibold">Areas to focus on in the roadmap (optional)</legend>
              <div className="mt-2 flex flex-wrap gap-4">
                {IDEA_TOPICS.map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={focus.includes(t)} onChange={(e) => setFocus((f) => (e.target.checked ? [...f, t] : f.filter((x) => x !== t)))} />
                    {TOPIC_LABEL[t]}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </div>

        {record && (
          <div className="mt-6">
            <button type="button" onClick={() => window.print()} className="no-print mb-3 min-h-[44px] rounded-full border-2 border-teal-700 px-5 text-sm font-bold text-teal-800">Print or save as PDF</button>
            <ParentClinicianReport record={record} name={name} roadmap={roadmap} />
          </div>
        )}
      </div>
    </main>
  )
}
