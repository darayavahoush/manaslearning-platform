'use client'
import {useEffect, useRef, useState} from 'react'
import ReactMarkdown from 'react-markdown'

const API = process.env.NEXT_PUBLIC_MILO_API || '/api/milo'
const HUMAN_URL = '/consult' 
const STARTERS = ['What is stimming?', 'What is sensory integration?', 'When should I see a therapist?']

type Src = {source: string; section: string; snippet: string; doc_url: string}
type Msg = {role: 'user' | 'milo'; text: string; sources?: Src[]; logId?: string | null; tier?: string | null; vote?: 'up' | 'down'; declined?: boolean}

export default function MiloChat() {
  const [msgs, setMsgs] = useState<Msg[]>([{role: 'milo', text: 'Hoo-hoo! I’m Milo 🦉 Ask me anything about stimming, sensory needs and everyday speech and learning questions. I’m here, no rush.'}])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [sid, setSid] = useState<string | null>(null)
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => { try { setSid(sessionStorage.getItem('milo-sid')) } catch {} }, [])
  useEffect(() => { end.current?.scrollIntoView({behavior: 'smooth', block: 'end'}) }, [msgs, busy])

  async function send(q: string) {
    q = q.trim()
    if (!q || busy) return
    setText(''); setBusy(true)
    setMsgs((m) => [...m, {role: 'user', text: q}])
    try {
      const r = await fetch(`${API}/chat`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({session_id: sid, message: q})})
      if (r.status === 429) throw new Error('slow')
      if (!r.ok) throw new Error('fail')
      const j = await r.json()
      try { sessionStorage.setItem('milo-sid', j.session_id) } catch {}
      setSid(j.session_id)
      setMsgs((m) => [...m, {role: 'milo', text: j.reply, sources: j.sources, logId: j.log_id, tier: j.tier, declined: j.tier === 'none'}])
    } catch (e) {
      setMsgs((m) => [...m, {role: 'milo', text: (e as Error).message === 'slow' ? 'Let me catch my breath for a moment. Please try again in a minute.' : 'Oh no, I couldn’t reach my books just now. Please try again in a moment.'}])
    }
    setBusy(false)
  }

  function vote(i: number, v: 'up' | 'down') {
    const m = msgs[i]
    if (!m.logId || m.vote) return
    setMsgs((all) => all.map((x, k) => (k === i ? {...x, vote: v} : x)))
    fetch(`${API}/feedback`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({log_id: m.logId, tier: m.tier, vote: v})}).catch(() => {})
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background font-patrick">
      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4" aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'milo' && <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card-green/20 text-lg" aria-hidden>🦉</span>}
            <div className="max-w-[82%]">
              <div className={`rounded-2xl px-4 py-2.5 text-base leading-snug shadow-sm ${m.role === 'user' ? 'whitespace-pre-wrap rounded-br-md bg-primary text-white' : 'rounded-bl-md bg-white text-foreground [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_strong]:font-bold [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-bold [&_a]:text-primary [&_a]:underline'}`}>{m.role === 'user' ? m.text : <ReactMarkdown>{m.text}</ReactMarkdown>}</div>
              {m.sources && m.sources.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {m.sources.slice(0, 2).map((s, k) => (
                    <a key={k} href={`${API}${s.doc_url.replace(/^\/api/, '')}`} target="_blank" rel="noopener noreferrer" className="max-w-full truncate rounded-full bg-card-green/15 px-2.5 py-0.5 text-xs text-foreground/70 hover:bg-card-green/30">📖 {s.source.replace(/\.[a-z]+$/i, '')}</a>
                  ))}
                </div>
              )}
              {m.declined && (
                <a href={HUMAN_URL} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block rounded-full bg-primary px-3.5 py-1.5 text-sm text-white hover:bg-brand-orange">Talk to a human, book free counselling</a>
              )}
              {m.role === 'milo' && m.logId && (
                <div className="mt-1 flex gap-1 text-sm">
                  <button onClick={() => vote(i, 'up')} aria-label="Helpful" className={`rounded-full px-2 py-0.5 hover:bg-card-green/20 ${m.vote === 'up' ? 'bg-card-green/30' : 'opacity-60'}`}>👍</button>
                  <button onClick={() => vote(i, 'down')} aria-label="Not helpful" className={`rounded-full px-2 py-0.5 hover:bg-card-green/20 ${m.vote === 'down' ? 'bg-card-green/30' : 'opacity-60'}`}>👎</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {msgs.length === 1 && !busy && (
          <div className="flex flex-wrap gap-2 pl-10">
            {STARTERS.map((s) => <button key={s} onClick={() => send(s)} className="rounded-full border border-card-green/40 bg-white px-3 py-1.5 text-sm text-foreground hover:bg-card-green/15">{s}</button>)}
          </div>
        )}
        {busy && (
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card-green/20 text-lg" aria-hidden>🦉</span>
            <div className="flex gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm" aria-label="Milo is typing">
              {[0, 150, 300].map((d) => <i key={d} className="h-2 w-2 animate-bounce rounded-full bg-card-green" style={{animationDelay: `${d}ms`}} />)}
            </div>
          </div>
        )}
        <div ref={end} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(text) }} className="border-t border-black/5 bg-white p-3">
        <div className="flex items-center gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Ask Milo a question…" className="min-w-0 flex-1 rounded-full border border-black/10 bg-background px-4 py-2.5 text-base outline-none focus:border-card-green focus:ring-2 focus:ring-card-green/30" />
          <button disabled={busy || !text.trim()} aria-label="Send" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card-green text-white transition hover:opacity-90 disabled:opacity-40">➤</button>
        </div>
        <p className="mt-2 text-center text-[11px] text-foreground/50">Milo shares general guidance, not medical advice.</p>
      </form>
    </div>
  )
}
