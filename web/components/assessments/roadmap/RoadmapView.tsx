'use client'
import {ROADMAP_REVIEWED} from './library'
import type {Roadmap} from './generate'

/** Shows a 30/60/90-day roadmap. While the wording is unreviewed, a clear draft banner is always shown. */
export default function RoadmapView({roadmap}: {roadmap: Roadmap}) {
  return (
    <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm" aria-label="30, 60 and 90 day roadmap">
      {!ROADMAP_REVIEWED && (
        <p role="note" className="mb-4 rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
          Draft for clinician review. The wording below has not yet been checked by a clinician.
        </p>
      )}
      <h2 className="text-xl font-bold text-slate-900">Your 30, 60 and 90 day roadmap</h2>
      <p className="mt-1 text-sm text-slate-600">{roadmap.disclaimer}</p>

      {roadmap.dataNotes.length > 0 && (
        <div className="mt-4 rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-700">
          <p className="font-semibold">About this session</p>
          <ul className="mt-1 list-disc pl-5">{roadmap.dataNotes.map((n, i) => <li key={i}>{n}</li>)}</ul>
        </div>
      )}

      <div className="mt-5 space-y-5">
        {roadmap.windows.map((w) => (
          <div key={w.id} className="break-inside-avoid">
            <h3 className="text-base font-bold text-teal-800">{w.label}: {w.theme}</h3>
            <ol className="mt-2 space-y-3">
              {w.items.map((it) => (
                <li key={it.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-sm text-slate-900">{it.text}</p>
                  <p className="mt-1 text-xs text-slate-600">{it.why}</p>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  )
}
