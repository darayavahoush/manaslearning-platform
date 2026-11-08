/* eslint-disable @next/next/no-img-element */
'use client'
import React, {useEffect, useRef, useState} from 'react'

// One question per screen. The parent fills this in (the consent line says so), so it is plain and calm:
// a progress bar, one clear question, big tap targets, and Back / Next at the bottom.

export type Cls = {
  name: string
  desc: string
  badge?: string
  image?: string
  Svg?: React.ComponentType<{className?: string}>
  AvatarSvg?: React.ComponentType<{className?: string}>
}

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
    cardOn: 'border-amber-500 bg-amber-50/90 shadow-lg ring-4 ring-amber-300/80 scale-[1.01]',
    cardOff: 'border-[#E7E5E4] bg-white hover:border-amber-300 hover:shadow-md',
    iconOn: 'bg-amber-500 text-white',
    badge: 'text-amber-800 bg-amber-200/90',
    field: 'focus:border-amber-500 focus:ring-amber-200',
    primary: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700',
    dotOn: 'bg-amber-500',
    chipOn: 'border-amber-500 bg-amber-500 text-white',
    chipOff: 'border-[#E7E5E4] bg-white text-[#0F172A] hover:border-amber-300',
  },
  teal: {
    label: 'text-teal-900',
    cardOn: 'border-teal-500 bg-teal-50/90 shadow-lg ring-4 ring-teal-300/80 scale-[1.01]',
    cardOff: 'border-[#E7E5E4] bg-white hover:border-teal-300 hover:shadow-md',
    iconOn: 'bg-teal-600 text-white',
    badge: 'text-teal-800 bg-teal-200/90',
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {p.classes.map((cls) => {
            const on = p.selected === cls.name
            const AvatarComponent = cls.AvatarSvg
            const Icon = cls.Svg
            return (
              <button
                key={cls.name}
                type="button"
                aria-pressed={on}
                onClick={() => { tick(); p.onSelect(cls.name) }}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 p-3 sm:p-4 text-left transition-all duration-200 ${
                  on ? T.cardOn : T.cardOff
                }`}
              >
                {/* Top Avatar Illustration Window */}
                <div className="relative mb-3 h-44 sm:h-48 w-full overflow-hidden rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200/80 shadow-inner flex items-center justify-center">
                  {cls.image ? (
                    <img
                      src={cls.image}
                      alt={cls.name}
                      className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      loading="eager"
                    />
                  ) : AvatarComponent ? (
                    <AvatarComponent className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : Icon ? (
                    <div className={`rounded-2xl p-4 ${on ? T.iconOn : 'bg-white text-slate-700 shadow-sm'}`}>
                      <Icon className="h-12 w-12" />
                    </div>
                  ) : null}

                  {/* Gentle gradient overlay at bottom of portrait for depth */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 to-transparent" />

                  {/* Persona Badge */}
                  {cls.badge && (
                    <span className="absolute top-2.5 left-2.5 rounded-full bg-slate-900/85 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-amber-200 shadow-md border border-amber-300/30">
                      {cls.badge}
                    </span>
                  )}

                  {/* Selected Pill */}
                  {on ? (
                    <span className={`absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase shadow-sm ${T.badge}`}>
                      <span>★</span> Chosen
                    </span>
                  ) : (
                    <span className="absolute top-2.5 right-2.5 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      Tap to Pick
                    </span>
                  )}
                </div>

                {/* Character Titles & Child-Friendly Superpower */}
                <div className="flex flex-col flex-1 justify-between">
                  <div>
                    <strong className="block text-lg font-bold text-[#0F172A] transition-colors">
                      {cls.name}
                    </strong>
                    <p className="mt-1 text-xs sm:text-sm text-[#475569] leading-snug">
                      {cls.desc}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                    <span className={`inline-block h-2 w-2 rounded-full ${on ? (p.theme === 'amber' ? 'bg-amber-500' : 'bg-teal-600') : 'bg-slate-300'}`} />
                    <span>{on ? 'Ready for Adventure!' : 'Tap to Select'}</span>
                  </div>
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

      {step === 4 && (() => {
        const chosenCls = p.classes.find((c) => c.name === p.selected)
        const ChosenAvatar = chosenCls?.AvatarSvg
        return (
          <div>
            <div className="mb-5 flex flex-col sm:flex-row items-center gap-4 rounded-3xl bg-slate-50 border-2 border-slate-200/80 p-4">
              {chosenCls?.image ? (
                <div className="h-24 w-32 sm:h-28 sm:w-36 shrink-0 overflow-hidden rounded-2xl bg-slate-200 shadow-inner">
                  <img src={chosenCls.image} alt={chosenCls.name} className="h-full w-full object-cover object-center" />
                </div>
              ) : ChosenAvatar ? (
                <div className="h-24 w-32 sm:h-28 sm:w-36 shrink-0 overflow-hidden rounded-2xl bg-slate-200 shadow-inner">
                  <ChosenAvatar className="h-full w-full object-cover" />
                </div>
              ) : null}
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-base flex-1 w-full">
                <dt className="font-semibold text-[#64748B]">{p.classLabel}</dt>
                <dd className="font-bold text-[#0F172A]">{p.selected}</dd>
                <dt className="font-semibold text-[#64748B]">{p.nameLabel}</dt>
                <dd className="font-bold text-[#0F172A]">{p.name.trim()}</dd>
                <dt className="font-semibold text-[#64748B]">Age</dt>
                <dd className="font-bold text-[#0F172A]">{p.age}</dd>
              </dl>
            </div>
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
        )
      })()}

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
