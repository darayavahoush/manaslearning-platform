/* eslint-disable @next/next/no-img-element */
'use client'
import {useEffect, useRef, useState} from 'react'
import {useRouter} from 'next/navigation'
import ReactMarkdown from 'react-markdown'

const API = process.env.NEXT_PUBLIC_MILO_API || '/api/milo'
const HUMAN_URL = '/consult'

const STARTERS = [
  'Explore In Their World experiences',
  'What is stimming?',
  'What is sensory integration?',
  'Book a consultation',
  'What assessments are available?',
]

type NavTarget = {
  label: string
  url: string
  badge?: string
}

const NAV_SHORTCUTS: NavTarget[] = [
  {label: 'In Their World Experiences', url: '/experience', badge: 'Interactive'},
  {label: 'ADHD: Study Desk', url: '/experience?module=adhd'},
  {label: 'Autism: Sensory Worlds', url: '/experience?module=autism'},
  {label: 'Dyslexia: Words on Paper', url: '/experience?module=dyslexia'},
  {label: 'Speech & Language', url: '/experience?module=speech'},
  {label: 'Dyscalculia: Do the Math', url: '/experience?module=dyscalculia'},
  {label: 'Dysgraphia: Write It Down', url: '/experience?module=dysgraphia'},
  {label: 'Auditory Processing', url: '/experience?module=auditory'},
  {label: 'Executive Functioning', url: '/experience?module=executive'},
  {label: 'Book Consultation', url: '/consult', badge: 'Free'},
  {label: 'Assessments', url: '/assessments'},
]

function findNavTargets(text: string): NavTarget[] {
  const lower = text.toLowerCase()
  const found: NavTarget[] = []

  if (lower.includes('adhd') || lower.includes('attention') || lower.includes('focus') || lower.includes('tabs')) {
    found.push({label: 'Try ADHD Experience', url: '/experience?module=adhd'})
  }
  if (lower.includes('autism') || lower.includes('sensory') || lower.includes('stimming') || lower.includes('overload')) {
    found.push({label: 'Try Autism Sensory World', url: '/experience?module=autism'})
  }
  if (lower.includes('dyslexia') || lower.includes('reading') || lower.includes('decoding')) {
    found.push({label: 'Try Dyslexia Experience', url: '/experience?module=dyslexia'})
  }
  if (lower.includes('speech') || lower.includes('stutter') || lower.includes('language') || lower.includes('words')) {
    found.push({label: 'Try Speech & Language Experience', url: '/experience?module=speech'})
  }
  if (lower.includes('dyscalculia') || lower.includes('math') || lower.includes('numbers') || lower.includes('calculation')) {
    found.push({label: 'Try Dyscalculia Experience', url: '/experience?module=dyscalculia'})
  }
  if (lower.includes('dysgraphia') || lower.includes('writing') || lower.includes('handwriting') || lower.includes('pencil')) {
    found.push({label: 'Try Dysgraphia Experience', url: '/experience?module=dysgraphia'})
  }
  if (lower.includes('auditory') || lower.includes('hearing') || lower.includes('listening') || lower.includes('noise')) {
    found.push({label: 'Try Auditory Processing Experience', url: '/experience?module=auditory'})
  }
  if (lower.includes('executive') || lower.includes('planning') || lower.includes('priorit') || lower.includes('organis')) {
    found.push({label: 'Try Executive Functioning Experience', url: '/experience?module=executive'})
  }
  if (lower.includes('experience') || lower.includes('in their world') || lower.includes('explore') || lower.includes('simulation')) {
    if (!found.some(f => f.url === '/experience')) {
      found.unshift({label: 'Explore All Experiences', url: '/experience', badge: 'All 8'})
    }
  }
  if (lower.includes('consult') || lower.includes('therapist') || lower.includes('doctor') || lower.includes('counsel') || lower.includes('appointment')) {
    found.push({label: 'Book a Free Consultation', url: '/consult', badge: 'Direct'})
  }
  if (lower.includes('assess') || lower.includes('screening') || lower.includes('test') || lower.includes('diagnos')) {
    found.push({label: 'View Available Assessments', url: '/assessments'})
  }

  return found.slice(0, 3)
}

function playMiloHoot() {
  if (typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
    const now = ctx.currentTime

    // Filter for warm, rounded wood-owl timbre
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(800, now)
    filter.connect(ctx.destination)

    // Tone 1: Gentle "Hoo" (~450Hz -> ~380Hz)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(450, now)
    osc1.frequency.exponentialRampToValueAtTime(380, now + 0.22)
    gain1.gain.setValueAtTime(0, now)
    gain1.gain.linearRampToValueAtTime(0.08, now + 0.04)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.24)
    osc1.connect(gain1)
    gain1.connect(filter)
    osc1.start(now)
    osc1.stop(now + 0.25)

    // Tone 2: Longer "Hooo-oooo" (~430Hz -> ~340Hz)
    const t2 = now + 0.28
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(430, t2)
    osc2.frequency.linearRampToValueAtTime(440, t2 + 0.06)
    osc2.frequency.exponentialRampToValueAtTime(340, t2 + 0.45)
    gain2.gain.setValueAtTime(0, t2)
    gain2.gain.linearRampToValueAtTime(0.09, t2 + 0.05)
    gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.48)
    osc2.connect(gain2)
    gain2.connect(filter)
    osc2.start(t2)
    osc2.stop(t2 + 0.5)
  } catch {
    /* audio context not permitted or unavailable */
  }
}

type Src = {source: string; section: string; snippet: string; doc_url: string}
type Msg = {
  role: 'user' | 'milo'
  text: string
  sources?: Src[]
  logId?: string | null
  tier?: string | null
  vote?: 'up' | 'down'
  declined?: boolean
  navTargets?: NavTarget[]
}

export default function MiloChat() {
  const router = useRouter()
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: 'milo',
      text: 'Hoo-hoo! I’m Milo, your learning and navigation guide. Ask me questions about sensory needs, ADHD, dyslexia, speech, or let me guide you to any part of our site. I’m right here!',
      navTargets: [
        {label: 'Explore All Experiences', url: '/experience'},
        {label: 'Book Consultation', url: '/consult'},
      ],
    },
  ])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [sid, setSid] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      return sessionStorage.getItem('milo-sid')
    } catch {
      return null
    }
  })
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    end.current?.scrollIntoView({behavior: 'smooth', block: 'end'})
  }, [msgs, busy])

  async function send(q: string) {
    q = q.trim()
    if (!q || busy) return
    setText('')
    setBusy(true)
    setMsgs((m) => [...m, {role: 'user', text: q}])

    try {
      const r = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({session_id: sid, message: q}),
      })
      if (r.status === 429) throw new Error('slow')
      if (!r.ok) throw new Error('fail')
      const j = await r.json()
      try { sessionStorage.setItem('milo-sid', j.session_id) } catch {}
      setSid(j.session_id)

      const targets = findNavTargets(`${q} ${j.reply}`)
      setMsgs((m) => [
        ...m,
        {
          role: 'milo',
          text: j.reply,
          sources: j.sources,
          logId: j.log_id,
          tier: j.tier,
          declined: j.tier === 'none',
          navTargets: targets.length > 0 ? targets : undefined,
        },
      ])
      if (soundEnabled) playMiloHoot()
    } catch (e) {
      const isSlow = (e as Error).message === 'slow'
      const fallbackReply = isSlow
        ? 'Let me catch my breath for a moment. Please try again in a minute.'
        : 'Hoo-hoo! I couldn’t reach the server right now, but I can still guide you around the site. Where would you like to go?'
      const targets = findNavTargets(q)
      setMsgs((m) => [
        ...m,
        {
          role: 'milo',
          text: fallbackReply,
          navTargets: targets.length > 0 ? targets : [
            {label: 'In Their World Experiences', url: '/experience'},
            {label: 'Consultation Booking', url: '/consult'},
          ],
        },
      ])
      if (soundEnabled) playMiloHoot()
    }
    setBusy(false)
  }

  function handleNavigate(url: string) {
    router.push(url)
  }

  function vote(i: number, v: 'up' | 'down') {
    const m = msgs[i]
    if (!m.logId || m.vote) return
    setMsgs((all) => all.map((x, k) => (k === i ? {...x, vote: v} : x)))
    fetch(`${API}/feedback`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({log_id: m.logId, tier: m.tier, vote: v}),
    }).catch(() => {})
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background font-sans">
      {/* Sound toggle subheader */}
      <div className="flex items-center justify-between border-b border-black/5 bg-emerald-50/50 px-4 py-1.5 text-xs text-foreground/70">
        <span className="flex items-center gap-1.5">
          <img src="/decor/milo-owl.webp" alt="Milo" className="h-4 w-4 rounded-full inline-block object-cover shadow-xs" />
          <b>Milo Guide</b> · Always unhurried
        </span>
        <button
          type="button"
          onClick={() => setSoundEnabled((s) => !s)}
          className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-emerald-800 transition hover:bg-emerald-100/60"
          aria-label={soundEnabled ? 'Mute owl hoot sound' : 'Enable owl hoot sound'}
        >
          {soundEnabled ? (
            <>
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
              <span>Hoot sound ON</span>
            </>
          ) : (
            <>
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
              <span>Hoot sound OFF</span>
            </>
          )}
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-3.5 py-4" aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'milo' && (
              <div className="mt-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-full border border-card-green/30 bg-emerald-50 shadow-sm transition-transform duration-500 motion-safe:animate-pulse" aria-hidden="true">
                <img src="/decor/milo-owl.webp" alt="Milo" className="h-full w-full object-cover" />
              </div>
            )}
            <div className="max-w-[84%]">
              <div
                className={`rounded-2xl px-4 py-2.5 text-[14.5px] leading-relaxed shadow-sm transition-all ${
                  m.role === 'user'
                    ? 'whitespace-pre-wrap rounded-br-md bg-gradient-to-tr from-[#f47522] to-[#fb923c] text-white font-medium'
                    : 'rounded-bl-md border border-black/5 bg-white text-foreground [&_a]:text-primary [&_a]:underline [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-bold [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_p]:my-2 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5'
                }`}
              >
                {m.role === 'user' ? m.text : <ReactMarkdown>{m.text}</ReactMarkdown>}
              </div>

              {/* Navigation Action Buttons if relevant */}
              {m.navTargets && m.navTargets.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.navTargets.map((nav, nIdx) => (
                    <button
                      key={nIdx}
                      type="button"
                      onClick={() => handleNavigate(nav.url)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-xs transition hover:bg-emerald-100 hover:text-emerald-950"
                    >
                      <span>{nav.label}</span>
                      {nav.badge && (
                        <span className="rounded bg-emerald-200/80 px-1.5 py-0.2 text-[10px] text-emerald-900">
                          {nav.badge}
                        </span>
                      )}
                      <span>→</span>
                    </button>
                  ))}
                </div>
              )}

              {m.sources && m.sources.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {m.sources.slice(0, 2).map((s, k) => (
                    <a
                      key={k}
                      href={`${API}${s.doc_url.replace(/^\/api/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 max-w-full truncate rounded-full border border-card-green/20 bg-card-green/10 px-2.5 py-0.5 text-xs text-foreground/80 hover:bg-card-green/25"
                    >
                      <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                      <span className="truncate">{s.source.replace(/\.[a-z]+$/i, '')}</span>
                    </a>
                  ))}
                </div>
              )}
              {m.declined && (
                <a
                  href={HUMAN_URL}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-brand-orange px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90"
                >
                  <span>Talk to an expert, book free counselling</span> →
                </a>
              )}
              {m.role === 'milo' && m.logId && (
                <div className="mt-1 flex items-center gap-1 text-xs">
                  <span className="text-gray-400 text-[11px] mr-1">Helpful?</span>
                  <button
                    onClick={() => vote(i, 'up')}
                    aria-label="Helpful"
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition hover:bg-card-green/20 ${m.vote === 'up' ? 'bg-card-green/30 font-bold' : 'opacity-60'}`}
                  >
                    <svg className="h-3 w-3 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                    </svg>
                    <span>Yes</span>
                  </button>
                  <button
                    onClick={() => vote(i, 'down')}
                    aria-label="Not helpful"
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition hover:bg-card-green/20 ${m.vote === 'down' ? 'bg-card-green/30 font-bold' : 'opacity-60'}`}
                  >
                    <svg className="h-3 w-3 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
                    </svg>
                    <span>No</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {msgs.length === 1 && !busy && (
          <div className="my-2 rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/70 to-white p-3.5 shadow-sm">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-emerald-800/80">
              Explore or ask Milo anything:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-card-green/30 bg-white px-3 py-1.5 text-xs text-foreground shadow-xs transition hover:border-card-green hover:bg-emerald-50/70 hover:text-card-green"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="mt-3 border-t border-emerald-100 pt-2.5">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800/80">
                Direct Site Navigation:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {NAV_SHORTCUTS.slice(0, 5).map((nav) => (
                  <button
                    key={nav.url}
                    type="button"
                    onClick={() => handleNavigate(nav.url)}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-[11px] font-medium text-emerald-900 transition hover:bg-emerald-100"
                  >
                    <span>{nav.label}</span>
                    <span>→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {busy && (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-card-green/30 bg-emerald-50 shadow-sm" aria-hidden="true">
              <img src="/decor/milo-owl.webp" alt="" className="h-full w-full object-cover" />
            </div>
            <div className="flex gap-1.5 rounded-2xl rounded-bl-md border border-black/5 bg-white px-4 py-3 shadow-sm" aria-label="Milo is typing">
              {[0, 150, 300].map((d) => (
                <i key={d} className="h-2 w-2 animate-bounce rounded-full bg-card-green" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={end} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(text) }} className="border-t border-black/5 bg-white p-3">
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            placeholder="Ask Milo or ask to navigate somewhere…"
            className="min-w-0 flex-1 rounded-full border border-black/10 bg-background px-4 py-2.5 text-sm outline-none focus:border-card-green focus:ring-2 focus:ring-card-green/30"
          />
          <button
            type="submit"
            disabled={busy || !text.trim()}
            aria-label="Send"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card-green text-white transition hover:opacity-90 disabled:opacity-40"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-foreground/50">Milo shares learning guidance and site navigation, not medical advice.</p>
      </form>
    </div>
  )
}
