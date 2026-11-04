'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import QuizRunner, { type ItemResult, type QuizItem } from '../../../../components/assessments/QuizRunner'
import { CONFIG, SCALE, bankFor, prepare, type Level, type QuestId } from '../../../../components/assessments/questionBanks'

const median = (xs: number[]) => {
  if (!xs.length) return null
  const s = xs.slice().sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2)
}
const secs = (ms: number | null) => (ms === null ? null : Math.round(ms / 100) / 10)

function summarise(items: QuizItem[], results: ItemResult[]): string[] {
  const out: string[] = []
  const bySection = new Map<string, ItemResult[]>()
  results.forEach((r) => bySection.set(r.section, [...(bySection.get(r.section) || []), r]))
  const autoIds = new Set(items.filter((i) => i.autoPlay).map((i) => i.id))
  bySection.forEach((rs, section) => {
    const answered = rs.filter((r) => !r.skipped)
    const skipped = rs.length - answered.length
    if (!answered.length) { out.push(`${section}: not enough data from this session.`); return }
    const ok = answered.filter((r) => r.correct).length
    const t = secs(median(answered.map((r) => r.ms).filter((x): x is number => x !== null)))
    out.push(`${section}: ${ok} of ${answered.length} answers matched the expected answer${skipped ? `, ${skipped} skipped` : ''}${t ? `, usually after about ${t} seconds` : ''}.`)
  })
  const reading = results.filter((r) => !autoIds.has(r.id))
  const heard = reading.filter((r) => r.audio > 0).length
  if (heard) out.push(`"Read to me" was used on ${heard} of ${reading.length} questions. Comparing answers with and without listening can help a clinician see whether reading or understanding is the harder part.`)
  const fast = results.filter((r) => r.ms !== null && r.ms < 700).length
  if (fast) out.push(`${fast} answers came in under a second, which can mean tapping quickly without reading. Treat this session with extra care.`)
  out.push('Times include time spent reading the question, so they are not a measure of thinking speed.')
  return out
}

export default function QuestionsPage() {
  const params = useParams()
  const quest = String(params?.quest ?? '') as QuestId
  const cfg = CONFIG[quest]
  const [stage, setStage] = useState<'intro' | 'quiz' | 'done'>('intro')
  const [nick, setNick] = useState('')
  const [consent, setConsent] = useState(false)
  const [level, setLevel] = useState<Level>('young')
  const [items, setItems] = useState<QuizItem[]>([])
  const [results, setResults] = useState<ItemResult[]>([])
  const [tab, setTab] = useState<'child' | 'parent'>('child')

  if (!cfg) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center text-[#2F2A24]">
        <p>We could not find that activity.</p>
        <Link href="/assessments" className="mt-4 inline-block font-bold text-[#36705C] underline">Back to all activities</Link>
      </main>
    )
  }

  const name = nick.replace(/[^\p{L}\p{N} ]/gu, '').slice(0, 20) || 'Explorer'
  const start = () => { setItems(prepare(bankFor(quest, level))); setResults([]); setStage('quiz') }
  const self = quest !== 'dyslexia'

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#F8F1E2] via-[#FBF6EA] to-[#F3EBDA] px-4 py-8 font-poppins text-[#2F2A24]">
      <style>{`@media print{.no-print{display:none!important}main{background:#fff!important}}`}</style>
      <div className="no-print mx-auto mb-4 max-w-2xl"><Link href="/assessments" className="text-sm font-semibold text-[#36705C] underline">← All activities</Link></div>

      {stage === 'intro' && (
        <section className="mx-auto max-w-2xl rounded-3xl border border-[#E6DCC6] bg-[#FFFCF6] p-6 sm:p-8 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#8F5A2C]">{cfg.kicker}</p>
          <h1 className="font-patrick mt-1 text-3xl sm:text-4xl">{cfg.emoji} {cfg.title}</h1>
          <p className="mt-3 text-base leading-relaxed text-[#46403A]">{cfg.intro}</p>

          <label className="mt-6 block text-sm font-semibold">Nickname (not your real name)
            <input value={nick} onChange={(e) => setNick(e.target.value)} maxLength={20} className="mt-1 block w-full rounded-xl border border-[#D9CDB4] bg-white px-3 py-3 text-base" placeholder="Explorer" />
          </label>

          {cfg.levels && (
            <fieldset className="mt-5">
              <legend className="text-sm font-semibold">Age group</legend>
              <div className="mt-2 flex gap-3">
                {([['young', '6 to 8 years'], ['older', '9 to 12 years']] as const).map(([v, label]) => (
                  <button key={v} type="button" onClick={() => setLevel(v)} aria-pressed={level === v} className="rounded-full border-2 px-5 py-2 text-sm font-bold" style={{ minHeight: 48, borderColor: level === v ? '#5E8F7E' : '#E6DCC6', background: level === v ? `${cfg.accent}66` : '#fff' }}>{label}</button>
                ))}
              </div>
            </fieldset>
          )}

          <label className="mt-6 flex items-start gap-3 text-sm leading-relaxed">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-5 w-5" />
            <span>I am this child&apos;s parent or guardian. This is a play activity, not a diagnosis. Nothing from this page is sent anywhere or saved: the answers stay on this screen.</span>
          </label>

          <button type="button" disabled={!consent} onClick={start} className="mt-6 rounded-full border border-[#8DBFA9] px-8 py-3 text-base font-bold text-[#33302B] disabled:opacity-40" style={{ minHeight: 52, background: cfg.accent }}>Start</button>
        </section>
      )}

      {stage === 'quiz' && items.length > 0 && (
        <QuizRunner items={items} accent={cfg.accent} onFinish={(r) => { setResults(r); setStage('done'); window.scrollTo({ top: 0 }) }} />
      )}

      {stage === 'done' && (
        <section className="mx-auto max-w-2xl">
          <div className="no-print mb-4 flex justify-center gap-2">
            {(['child', 'parent'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)} aria-pressed={tab === t} className="rounded-full border-2 px-5 py-2 text-sm font-bold" style={{ minHeight: 44, borderColor: '#D9B877', background: tab === t ? '#EFD7A0' : 'transparent' }}>
                {t === 'child' ? 'Your story' : 'For parents'}
              </button>
            ))}
          </div>

          {tab === 'child' ? (
            <div className="rounded-3xl border border-[#E6DCC6] bg-[#FFFCF6] p-8 text-center text-xl leading-relaxed shadow-sm">
              <p className="text-5xl">{cfg.emoji}</p>
              <p className="mt-3">{name}, you read, listened and kept going all the way to the end. Thank you for sharing your thoughts with us. Come back any time!</p>
            </div>
          ) : (
            <div className="rounded-3xl border border-[#E6DCC6] bg-[#FFFCF6] p-6 sm:p-8 text-base leading-relaxed shadow-sm">
              <p className="font-bold">This is not a diagnosis. One short session cannot show whether a child has a learning or developmental difference. If you have concerns, please talk to a paediatrician, teacher or qualified clinician.</p>
              <h2 className="font-patrick mt-5 text-2xl">{self ? 'What your child said about themselves' : 'What we noticed while your child played'}</h2>
              {self ? (
                <>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5">
                    {items.map((it) => {
                      const r = results.find((x) => x.id === it.id)
                      const label = r && !r.skipped ? SCALE.find((s) => s.id === r.chosenId)?.text : 'Skipped'
                      return <li key={it.id}>{it.prompt} <strong>{label ?? 'Skipped'}</strong></li>
                    })}
                  </ul>
                  <p className="mt-3 text-sm text-[#5A5247]">These are the child&apos;s own answers. They are not scored, and young children&apos;s self-reports are limited, so they are best used as conversation starters with a clinician alongside what you and the teacher see.</p>
                </>
              ) : (
                <ul className="mt-2 list-disc space-y-1.5 pl-5">{summarise(items, results).map((l, i) => <li key={i}>{l}</li>)}</ul>
              )}
              <h2 className="font-patrick mt-5 text-2xl">Questions you could bring to a clinician</h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                <li>Which of these answers, if any, would you want to look at more closely in a full evaluation?</li>
                <li>Is there anything about how my child answered that you would want to see again over several sessions?</li>
                <li>What would you suggest I watch for at home and at school?</li>
              </ul>
              <button type="button" onClick={() => window.print()} className="no-print mt-6 rounded-full border border-[#D9CDB4] bg-white px-6 py-2 text-sm font-bold" style={{ minHeight: 44 }}>Print or save as PDF</button>
            </div>
          )}
        </section>
      )}
    </main>
  )
}
