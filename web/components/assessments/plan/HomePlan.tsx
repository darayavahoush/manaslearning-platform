'use client'
import {useState} from 'react'
import type {Quest} from '../session-record'
import {generatePlan, type Answers} from './generate'
import {PLAN_REVIEWED, questionsFor} from './library'

/**
 * The 4-week home plan. The parent answers a few questions about their child, then gets a plan built by fixed rules from
 * those answers. Answers stay in this page's memory only: nothing is sent, saved or read against a result.
 */
export default function HomePlan({quest, name}: {quest: Quest; name?: string}) {
  const [answers, setAnswers] = useState<Answers>({})
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const [ticks, setTicks] = useState<Record<string, boolean>>({})
  const who = name?.trim() || 'your child'
  const QUESTIONS = questionsFor(quest)

  if (!done) {
    const q = QUESTIONS[step]
    const picked = answers[q.id] ?? []
    const toggle = (id: string) => {
      setAnswers((a) => {
        const cur = a[q.id] ?? []
        if (q.kind === 'single') return {...a, [q.id]: cur[0] === id ? [] : [id]}
        if (id === 'none') return {...a, [q.id]: cur.includes(id) ? [] : [id]}
        const without = cur.filter((x) => x !== 'none')
        if (without.includes(id)) return {...a, [q.id]: without.filter((x) => x !== id)}
        if (q.max && without.length >= q.max) return {...a, [q.id]: [...without.slice(1), id]}
        return {...a, [q.id]: [...without, id]}
      })
    }
    const last = step === QUESTIONS.length - 1
    return (
      <article className="rounded-2xl border-2 border-teal-300 bg-white p-5 shadow-sm" aria-label="Questions for the home plan">
        <p className="text-xs font-bold uppercase tracking-wide text-teal-700">Home plan for the next 4 weeks</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">Tell us a little about {who === 'your child' ? 'your child' : who}</h2>
        <p className="mt-1 text-sm text-slate-600">A few quick questions so the plan fits your child and your home. Every question is optional. Your answers stay on this device and are not sent or saved.</p>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={1} aria-valuemax={QUESTIONS.length} aria-valuenow={step + 1} aria-label="Progress">
          <div className="h-full bg-teal-600 transition-all" style={{width: `${((step + 1) / QUESTIONS.length) * 100}%`}} />
        </div>
        <p className="mt-1 text-xs text-slate-500">Question {step + 1} of {QUESTIONS.length}</p>

        <fieldset className="mt-4">
          <legend className="text-lg font-bold text-slate-900">{q.title}</legend>
          {q.hint && <p className="mt-1 text-sm text-slate-600">{q.hint}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {q.options.map((o) => {
              const on = picked.includes(o.id)
              return (
                <button key={o.id} type="button" aria-pressed={on} onClick={() => toggle(o.id)}
                  className={`min-h-[44px] rounded-full border-2 px-4 py-2 text-left text-sm font-semibold transition-colors ${on ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-300 bg-white text-slate-800 hover:border-teal-500'}`}>
                  {on ? '✓ ' : ''}{o.label}
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="min-h-[44px] rounded-full border-2 border-slate-400 px-5 text-sm font-bold text-slate-700">Back</button>}
          <button type="button" onClick={() => (last ? setDone(true) : setStep(step + 1))} className="min-h-[44px] rounded-full bg-teal-700 px-6 text-sm font-bold text-white shadow">
            {last ? 'Make my plan' : picked.length ? 'Next' : 'Skip'}
          </button>
          {!last && <button type="button" onClick={() => setDone(true)} className="ml-auto text-sm font-semibold text-sky-700 underline">Make the plan now</button>}
        </div>
      </article>
    )
  }

  const plan = generatePlan(answers, quest)
  return (
    <article className="space-y-5" aria-label="Your 4-week home plan">
      {!PLAN_REVIEWED && (
        <p role="note" className="rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
          Draft for clinician review. The wording in this plan has not yet been checked by a clinician.
        </p>
      )}
      <section className="rounded-2xl border-2 border-teal-300 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-teal-700">Home plan</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">{who === 'your child' ? 'Your child’s' : `${who}’s`} 4-week plan</h2>
        <p className="mt-1 text-sm text-slate-700">Pick one activity a day, about {plan.dailyMinutes} minutes. Skip any that do not suit, and stop if your child is not enjoying it.</p>
        <ul className="mt-3 flex flex-wrap gap-2">{plan.shapedBy.map((s) => <li key={s} className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-900">{s}</li>)}</ul>
        {plan.howToGive && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-800"><span className="font-bold">How to give instructions: </span>{plan.howToGive}</p>}
        <button type="button" onClick={() => { setDone(false); setStep(0) }} className="no-print mt-3 text-sm font-semibold text-sky-700 underline">Change my answers</button>
      </section>

      {plan.weeks.map((w) => (
        <section key={w.id} className="break-inside-avoid rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-teal-800">{w.title}</h3>
          {w.goalLabel && <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Goal: {w.goalLabel}</p>}
          <p className="mt-1 text-sm text-slate-600">{w.blurb}</p>
          <ul className="mt-3 space-y-2">
            {w.items.map((it) => {
              const key = `${w.id}-${it.id}`
              return (
                <li key={key} className="rounded-lg border border-slate-200 p-3">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input type="checkbox" checked={!!ticks[key]} onChange={(e) => setTicks((t) => ({...t, [key]: e.target.checked}))} className="mt-1 h-5 w-5 shrink-0" />
                    <span className="text-sm text-slate-900">{it.text}<span className="ml-2 text-xs text-slate-500">about {it.minutes} min</span></span>
                  </label>
                </li>
              )
            })}
          </ul>
          <p className="mt-3 text-xs font-semibold text-slate-600">What I noticed this week:</p>
          <div className="mt-1 h-16 rounded-lg border border-dashed border-slate-300" aria-hidden="true" />
        </section>
      ))}

      <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">{plan.notes.map((n) => <li key={n}>{n}</li>)}</ul>
      </section>
    </article>
  )
}
