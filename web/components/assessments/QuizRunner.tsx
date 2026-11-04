'use client'
import { useEffect, useMemo, useRef, useState } from 'react'

export type Choice = { id: string; text: string; emoji?: string }
export type QuizItem = {
  id: string
  section: string
  prompt: string
  passage?: string
  choices: Choice[]
  /** Absent for self-report ("About me") items, which are never marked right or wrong. */
  correctId?: string
  /** Text read aloud instead of the default (passage + prompt + choices). */
  speak?: string
  /** Speak automatically when the question appears (used for spell-by-ear items). */
  autoPlay?: boolean
  /** Keep the choice order as written (rating scales). */
  fixedOrder?: boolean
}
export type ItemResult = {
  id: string
  section: string
  chosenId: string | null
  correct: boolean | null
  /** ms from the question appearing to the first tap. Includes reading time. */
  ms: number | null
  /** Times the child pressed "Read to me" on this question. */
  audio: number
  skipped: boolean
}

function speakable(item: QuizItem): string {
  if (item.speak) return item.speak
  const letters = ['A', 'B', 'C', 'D']
  const opts = item.choices.map((c, i) => `${letters[i]}. ${c.text}`).join('. ')
  return [item.passage, item.prompt.replace(/_{2,}/g, 'blank'), opts].filter(Boolean).join(' ')
}

function say(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  const synth = window.speechSynthesis
  synth.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-IN'
  u.rate = 0.85
  const voices = synth.getVoices()
  const v = voices.find((x) => x.lang.toLowerCase().startsWith('en-in')) || voices.find((x) => x.lang.toLowerCase().startsWith('en'))
  if (v) u.voice = v
  synth.speak(u)
}

export default function QuizRunner({ items, onFinish, accent = '#9DC3AE' }: { items: QuizItem[]; onFinish: (r: ItemResult[]) => void; accent?: string }) {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [big, setBig] = useState(false)
  const [speechOk, setSpeechOk] = useState(false)
  const results = useRef<ItemResult[]>([])
  const shownAt = useRef(0)
  const firstMs = useRef<number | null>(null)
  const audio = useRef(0)
  const finished = useRef(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const item = items[i]
  const sections = useMemo(() => Array.from(new Set(items.map((x) => x.section))), [items])
  const sectionNo = sections.indexOf(item.section) + 1

  useEffect(() => { setSpeechOk('speechSynthesis' in window) }, [])

  // reset per question
  useEffect(() => {
    setPicked(null)
    firstMs.current = null
    audio.current = 0
    shownAt.current = performance.now()
    heading.current?.focus({ preventScroll: true })
  }, [i])

  // spell-by-ear items speak on their own
  useEffect(() => {
    if (speechOk && item.autoPlay) say(speakable(item))
    return () => { if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel() }
  }, [i, speechOk]) // eslint-disable-line react-hooks/exhaustive-deps

  // number keys pick an answer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (!Number.isInteger(n) || n < 1 || n > item.choices.length) return
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return
      choose(item.choices[n - 1].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }) // eslint-disable-line react-hooks/exhaustive-deps

  function choose(id: string) {
    if (firstMs.current === null) firstMs.current = Math.round(performance.now() - shownAt.current)
    setPicked(id)
  }

  function advance(skipped: boolean) {
    if (finished.current) return
    const chosen = skipped ? null : picked
    results.current.push({
      id: item.id,
      section: item.section,
      chosenId: chosen,
      correct: item.correctId !== undefined && chosen !== null ? chosen === item.correctId : null,
      ms: skipped ? null : firstMs.current,
      audio: audio.current,
      skipped,
    })
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    if (i + 1 >= items.length) {
      finished.current = true
      onFinish(results.current.slice())
    } else setI(i + 1)
  }

  const last = i + 1 >= items.length
  const pct = Math.round((i / items.length) * 100)

  return (
    <section aria-label="Question" className="qr-wrap mx-auto w-full max-w-2xl" style={{ fontSize: big ? '1.25em' : '1em' }}>
      <style>{CSS}</style>
      <div className="mb-3 flex items-center justify-between gap-3 text-sm text-[#5A5247]">
        <span className="font-semibold">Chapter {sectionNo} of {sections.length} · {item.section}</span>
        <button type="button" onClick={() => setBig((b) => !b)} aria-pressed={big} className="qr-pill" style={{ minHeight: 44 }}>
          {big ? 'Smaller text' : 'Bigger text'}
        </button>
      </div>
      <div role="progressbar" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={i} aria-label={`Question ${i + 1} of ${items.length}`} className="mb-5 h-3 w-full overflow-hidden rounded-full bg-[#EFE7D6]">
        <div className="qr-bar h-full rounded-full" style={{ width: `${Math.max(pct, 4)}%`, background: accent }} />
      </div>

      <div key={item.id} className="qr-card rounded-3xl border border-[#E6DCC6] bg-[#FFFCF6] p-5 sm:p-7 shadow-sm">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#8F5A2C]">Question {i + 1} of {items.length}</p>
        {item.passage && (
          <blockquote className="qr-read mb-4 rounded-2xl border border-[#E9DCBE] bg-[#FBF3DF] p-4 text-[#3A342B]">{item.passage}</blockquote>
        )}
        <h2 ref={heading} tabIndex={-1} className="qr-read mb-5 font-patrick text-2xl sm:text-3xl text-[#2F2A24] outline-none">{item.prompt}</h2>

        <div role="radiogroup" aria-label="Answers" className="grid gap-3">
          {item.choices.map((c, k) => {
            const on = picked === c.id
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => choose(c.id)}
                className="qr-choice qr-read flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-[#2F2A24]"
                style={{ minHeight: 56, borderColor: on ? '#5E8F7E' : '#E6DCC6', background: on ? `${accent}55` : '#FFFFFF' }}
              >
                <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F4ECDC] text-sm font-bold text-[#5A5247]">{k + 1}</span>
                {c.emoji && <span aria-hidden="true" className="text-2xl">{c.emoji}</span>}
                <span>{c.text}</span>
              </button>
            )
          })}
        </div>

        <p className="mt-4 min-h-[1.5rem] text-sm text-[#5A5247]" aria-live="polite">
          {picked ? '💧 Thanks! Tap Next when you are ready.' : ' '}
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {speechOk && (
              <button type="button" className="qr-pill" style={{ minHeight: 48 }} onClick={() => { audio.current += 1; say(speakable(item)) }}>
                🔊 Read to me
              </button>
            )}
            <button type="button" className="qr-pill" style={{ minHeight: 48 }} onClick={() => advance(true)}>Skip this one</button>
          </div>
          <button
            type="button"
            disabled={!picked}
            onClick={() => advance(false)}
            className="rounded-full border border-[#8DBFA9] px-7 py-3 text-base font-bold text-[#33302B] disabled:opacity-40"
            style={{ minHeight: 52, background: accent }}
          >
            {last ? 'Finish ✨' : 'Next →'}
          </button>
        </div>
      </div>
    </section>
  )
}

const CSS = `
.qr-read{line-height:1.8;letter-spacing:.03em;word-spacing:.08em}
.qr-pill{border:1.5px solid #D9CDB4;background:#FFFCF5;color:#3A342B;border-radius:999px;padding:6px 16px;font-weight:600;cursor:pointer}
.qr-pill:hover{background:#F4ECDC}
.qr-choice{cursor:pointer;transition:transform .15s ease,border-color .15s ease,background .15s ease}
.qr-choice:hover{transform:translateY(-1px)}
.qr-bar{transition:width .4s ease}
.qr-card{animation:qr-in .35s ease both}
@keyframes qr-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.qr-wrap button:focus-visible{outline:3px solid #2F2A24;outline-offset:3px}
@media (prefers-reduced-motion:reduce){.qr-card{animation:none}.qr-choice,.qr-bar{transition:none}.qr-choice:hover{transform:none}}
`
