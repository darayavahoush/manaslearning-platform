'use client'
import React, {useEffect, useRef, useState} from 'react'

// One question per screen. The parent fills this in (the consent line says so), so it is plain and calm:
// a progress bar, one clear question, big tap targets, and Back / Next at the bottom.

type Cls = {name: string; desc: string; Svg: React.ComponentType<any>}

type Props = {
  theme: 'amber' | 'teal'
  classLabel: string
  classes: Cls[]
  selected: string
  onSelect: (name: string) => void
  nameLabel: string
  namePlaceholder: string
  name: string
  onName: (v: string) => void
  ages: number[]
  age: number
  onAge: (n: number) => void
  ageNote: (age: number) => string
  consent: boolean
  onConsent: (v: boolean) => void
  startLabel: string
  onStart: () => void
  onTick?: () => void
}

const THEMES = {
  amber: {
    label: 'text-[#78350F]',
    cardOn: 'border-amber-500 bg-amber-50/80 shadow-md ring-2 ring-amber-300',
    cardOff: 'border-[#E7E5E4] bg-white hover:border-amber-300',
    iconOn: 'bg-amber-500 text-white',
    badge: 'text-amber-700 bg-amber-200/80',
    field: 'focus:border-amber-500 focus:ring-amber-200',
    primary: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700',
    dotOn: 'bg-amber-500',
    chipOn: 'border-amber-500 bg-amber-500 text-white',
    chipOff: 'border-[#E7E5E4] bg-white text-[#0F172A] hover:border-amber-300',
  },
  teal: {
    label: 'text-teal-900',
    cardOn: 'border-teal-500 bg-teal-50/80 shadow-md ring-2 ring-teal-300',
    cardOff: 'border-[#E7E5E4] bg-white hover:border-teal-300',
    iconOn: 'bg-teal-600 text-white',
    badge: 'text-teal-800 bg-teal-200/80',
    field: 'focus:border-teal-500 focus:ring-teal-200',
    primary: 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700',
    dotOn: 'bg-teal-600',
    chipOn: 'border-teal-600 bg-teal-600 text-white',
    chipOff: 'border-[#E7E5E4] bg-white text-[#0F172A] hover:border-teal-300',
  },
} as const

const TOTAL = 4

export default function WelcomeWizard(p: Props) {
  const T = THEMES[p.theme]
  const [step, setStep] = useState(1)
  const head = useRef<HTMLHeadingElement>(null)
  const first = useRef(true)

  // move focus to the new question so keyboard and screen-reader users land on it
  useEffect(() => {
    if (first.current) { first.current = false; return }
    head.current?.focus()
  }, [step])

  const nameOk = p.name.trim().length > 0
  const canNext = step === 1 ? !!p.selected : step === 2 ? nameOk : true
  const tick = () => p.onTick?.()
  const next = () => { if (canNext && step < TOTAL) { tick(); setStep(step + 1) } }
  const back = () => { if (step > 1) { tick(); setStep(step - 1) } }
  const titles = [`Choose your ${p.classLabel}`, `Enter your ${p.nameLabel}`, 'Choose the age', 'One last thing']

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className={`text-sm font-bold uppercase tracking-wider ${T.label}`} aria-live="polite">Step {step} of {TOTAL}</p>
        <div className="flex gap-2" aria-hidden="true">
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className={`h-2.5 w-8 rounded-full ${n <= step ? T.dotOn : 'bg-[#E7E5E4]'}`} />
          ))}
        </div>
      </div>

      <h2 ref={head} tabIndex={-1} className="font-patrick mb-5 text-2xl text-[#0F172A] outline-none md:text-3xl">{titles[step - 1]}</h2>

      {step === 1 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {p.classes.map((cls) => {
            const on = p.selected === cls.name
            const Icon = cls.Svg
            return (
              <button
                key={cls.name}
                type="button"
                aria-pressed={on}
                onClick={() => { tick(); p.onSelect(cls.name) }}
                className={`flex min-h-[132px] flex-col justify-between rounded-2xl border-2 p-4 text-left transition-all ${on ? T.cardOn : T.cardOff}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className={`rounded-xl p-2 ${on ? T.iconOn : 'bg-slate-100 text-slate-700'}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  {on && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${T.badge}`}>Chosen</span>}
                </div>
                <div>
                  <strong className="block text-base font-bold text-[#0F172A]">{cls.name}</strong>
                  <span className="text-sm text-[#64748B]">{cls.desc}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {step === 2 && (
        <div>
          <label htmlFor="wz-name" className="mb-2 block text-sm font-semibold text-[#475569]">
            A nickname is enough. Please do not use the child&apos;s full name.
          </label>
          <input
            id="wz-name"
            type="text"
            value={p.name}
            maxLength={40}
            onChange={(e) => p.onName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && nameOk) { e.preventDefault(); next() } }}
            placeholder={p.namePlaceholder}
            className={`w-full rounded-2xl border-2 border-[#E7E5E4] px-4 py-4 text-base font-semibold text-[#0F172A] focus:outline-none focus:ring-2 ${T.field}`}
          />
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6" role="group" aria-label="Age">
            {p.ages.map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={p.age === a}
                onClick={() => { tick(); p.onAge(a) }}
                className={`min-h-[56px] rounded-2xl border-2 text-xl font-bold transition-all ${p.age === a ? T.chipOn : T.chipOff}`}
              >
                {a}
              </button>
            ))}
          </div>
          {p.ageNote(p.age) && <p className="mt-4 text-sm leading-relaxed text-[#475569]">{p.ageNote(p.age)}</p>}
        </div>
      )}

      {step === 4 && (
        <div>
          <dl className="mb-5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 rounded-2xl bg-slate-50 p-4 text-base">
            <dt className="font-semibold text-[#64748B]">{p.classLabel}</dt><dd className="font-bold text-[#0F172A]">{p.selected}</dd>
            <dt className="font-semibold text-[#64748B]">{p.nameLabel}</dt><dd className="font-bold text-[#0F172A]">{p.name.trim()}</dd>
            <dt className="font-semibold text-[#64748B]">Age</dt><dd className="font-bold text-[#0F172A]">{p.age}</dd>
          </dl>
          <label className="mb-6 flex items-start gap-3 text-left text-sm leading-relaxed text-slate-700">
            <input type="checkbox" checked={p.consent} onChange={(e) => p.onConsent(e.target.checked)} className="mt-0.5 h-6 w-6 shrink-0" />
            <span>I am this child&apos;s parent or guardian. This is a play activity, not a diagnosis. We do not save anything from this session. At the end, the codename and play counts are sent to write the summary, and an AI model may help word it.</span>
          </label>
          <div className="text-center">
            <button
              type="button"
              disabled={!p.consent || !nameOk}
              onClick={p.onStart}
              className={`min-h-[56px] rounded-full px-10 py-4 text-base font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${T.primary}`}
            >
              {p.startLabel}
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        {step > 1 ? (
          <button type="button" onClick={back} className="min-h-[52px] rounded-full border-2 border-[#CBD5E1] bg-white px-7 text-base font-bold text-[#334155] hover:border-slate-400">
            ← Back
          </button>
        ) : <span />}
        {step < TOTAL && (
          <button type="button" disabled={!canNext} onClick={next} className={`min-h-[52px] rounded-full px-9 text-base font-bold text-white shadow-lg transition-all disabled:opacity-50 ${T.primary}`}>
            Next →
          </button>
        )}
      </div>
    </div>
  )
}
