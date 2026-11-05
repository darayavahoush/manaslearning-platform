'use client'
import {useState} from 'react'

/**
 * Three quick questions the parent answers after the play. Each one is optional, and the whole card can be skipped.
 * The answers go into the session record like the other numbers. Nothing is stored on a server.
 */
export interface ParentAnswers {
  tired: number | null
  likeHome: number | null
  enjoyed: number | null
}

const QUESTIONS: Array<{key: keyof ParentAnswers; text: string; options: string[]}> = [
  {key: 'tired', text: 'Did they seem tired during the play?', options: ['Not at all', 'A little', 'Quite a lot']},
  {key: 'likeHome', text: 'Is this like how they are at home or in class?', options: ['Very like', 'Somewhat like', 'Not really like']},
  {key: 'enjoyed', text: 'How did they seem to feel about the play?', options: ['Enjoyed it', 'It was okay', "Didn't enjoy it"]},
]

export default function ParentCard({childName, onDone}: {childName: string; onDone: (a: ParentAnswers) => void}) {
  const [answers, setAnswers] = useState<ParentAnswers>({tired: null, likeHome: null, enjoyed: null})
  const name = childName.trim() || 'your child'

  return (
    <section aria-labelledby="parent-card-title" className="rounded-3xl border-2 border-teal-300/40 bg-white/95 backdrop-blur-md p-6 md:p-10 shadow-2xl">
      <p className="text-xs font-bold uppercase tracking-wider text-teal-700">For the grown-up</p>
      <h2 id="parent-card-title" className="font-patrick text-3xl text-[#0F172A] mt-1 mb-2">A few questions about {name}&apos;s play</h2>
      <p className="text-xs md:text-sm text-[#475569] mb-6">Answer what you saw. Skip any question you would rather not answer, or skip the whole card.</p>

      <div className="space-y-6">
        {QUESTIONS.map((q) => (
          <fieldset key={q.key}>
            <legend className="text-sm font-bold text-slate-800 mb-2">{q.text}</legend>
            <div className="flex flex-wrap gap-2">
              {q.options.map((opt, i) => {
                const selected = answers[q.key] === i
                return (
                  <button
                    key={opt}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setAnswers((a) => ({...a, [q.key]: selected ? null : i}))}
                    className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition-all ${selected ? 'border-teal-600 bg-teal-600 text-white' : 'border-teal-300 bg-white text-teal-900 hover:bg-teal-50'}`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={() => onDone({tired: null, likeHome: null, enjoyed: null})} className="text-sm font-bold text-slate-600 underline">
          Skip the card
        </button>
        <button
          type="button"
          onClick={() => onDone(answers)}
          className="rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-10 py-4 text-lg font-bold text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          Done, show the summary ▶
        </button>
      </div>
    </section>
  )
}
