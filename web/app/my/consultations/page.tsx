'use client'
import {useCallback, useEffect, useState} from 'react'
import ParentLogin from '../../ParentLogin'
import {clearParentToken, parentFetch} from '../../parentAuth'

type Row = {
  id: string; title: string; durationMins: number; priceINR: number; startAt: string; endAt: string
  status: 'confirmed' | 'pending_payment' | 'cancelled' | 'completed' | 'expired'; payBy?: number; paid?: boolean; payIssue?: string; with: {name: string; role: string} | null
  childName: string; concern: string; rescheduleCount: number; cancelledBy?: 'parent' | 'team'
  canCancel: boolean; canReschedule: boolean; note?: string
}
type Day = {date: string; slots: {startAt: string; label: string}[]}

const fmt = (iso: string) => new Date(Date.parse(iso) + 19800000).toLocaleString('en-IN', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC'})
const longDay = (d: string) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-IN', {weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC'})
const t12 = (hm: string) => { const [h, m] = hm.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}` }
const BADGE: Record<Row['status'], [string, string]> = {
  confirmed: ['Confirmed', 'bg-accent-green/60 text-text-brown'],
  pending_payment: ['Awaiting payment', 'bg-amber-100 text-amber-950'],
  cancelled: ['Cancelled', 'bg-card-red/10 text-card-red'],
  completed: ['Completed', 'bg-cream-dark text-text-brown'],
  expired: ['Time released', 'bg-cream-dark text-text-brown'],
}

export default function MyConsultations() {
  const [email, setEmail] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [rows, setRows] = useState<Row[]>([])
  const [msg, setMsg] = useState('')
  const [busyId, setBusyId] = useState('')
  const [moving, setMoving] = useState<string | null>(null)
  const [days, setDays] = useState<Day[]>([])
  const [pick, setPick] = useState('')
  const [payOnline, setPayOnline] = useState(false)
  const [paid] = useState(() => (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('payment') : null))

  const apply = useCallback(async (r: Response) => {
    if (r.status === 401) { clearParentToken(); setEmail(null); setReady(true); return }
    const j = await r.json()
    setEmail(j.email); setRows(j.bookings); setPayOnline(!!j.payOnline); setReady(true)
  }, [])
  const load = useCallback(() => parentFetch('/api/my/bookings').then(apply), [apply])
  useEffect(() => { parentFetch('/api/my/bookings').then(apply) }, [apply]) // no token -> 401 -> shows the login form

  async function cancel(id: string) {
    if (!window.confirm('Cancel this consultation? This can’t be undone.')) return
    setBusyId(id); setMsg('')
    const r = await parentFetch('/api/my/cancel', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id})})
    const j = await r.json().catch(() => ({}))
    setBusyId('')
    if (!r.ok) setMsg(j.error || 'Something went wrong.')
    load()
  }

  async function openMove(id: string) {
    setMsg(''); setPick(''); setDays([]); setMoving(id)
    const r = await parentFetch(`/api/my/slots?id=${encodeURIComponent(id)}`)
    const j = await r.json().catch(() => ({}))
    if (r.ok) setDays(j.days); else { setMsg(j.error || 'Something went wrong.'); setMoving(null) }
  }

  async function confirmMove() {
    if (!moving || !pick) return
    setBusyId(moving); setMsg('')
    const r = await parentFetch('/api/my/reschedule', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id: moving, startAt: pick})})
    const j = await r.json().catch(() => ({}))
    setBusyId('')
    if (r.ok) { setMoving(null); load() } else { setMsg(j.error || 'Something went wrong.'); if (r.status === 409) openMove(moving) }
  }

  if (!ready) return <main className="mx-auto max-w-2xl px-5 py-16 text-center text-text-brown">Loading…</main>

  if (!email) return (
    <main className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="mb-6 text-center font-patrick text-4xl text-primary">My consultations</h1>
      <div className="rounded-3xl bg-white p-6 shadow-[0_4px_24px_rgba(118,49,10,0.08)]"><ParentLogin onLoggedIn={() => load()} /></div>
    </main>
  )

  const upcoming = rows.filter((r) => r.status === 'confirmed' || r.status === 'pending_payment')
  const past = rows.filter((r) => !upcoming.includes(r) && r.status !== 'expired').concat(rows.filter((r) => r.status === 'expired'))

  const card = (r: Row) => (
    <article key={r.id} className="rounded-3xl bg-white p-5 shadow-[0_4px_24px_rgba(118,49,10,0.08)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-patrick text-2xl text-text-brown">{r.title}</h3>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${BADGE[r.status][1]}`}>{BADGE[r.status][0]}{r.status === 'cancelled' && r.cancelledBy === 'team' ? ' by our team' : ''}</span>
      </div>
      <p className="mt-2 text-base text-text-brown">{fmt(r.startAt)} IST · {r.durationMins} min</p>
      {r.with && <p className="text-base text-brown-light">With {r.with.name}{r.with.role ? `, ${r.with.role}` : ''}</p>}
      {r.childName && <p className="text-base text-brown-light">For {r.childName}</p>}
      {r.status === 'pending_payment' && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {payOnline ? <>
            <span>Fee ₹{r.priceINR}. Your time is held until {r.payBy ? new Date(r.payBy + 19800000).toISOString().slice(11, 16) : ''} IST.</span>
            <a href={`/pay?booking=${encodeURIComponent(r.id)}`} className="rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-white hover:bg-brand-orange">Pay ₹{r.priceINR} now</a>
          </> : <span>Fee ₹{r.priceINR}. Our team will contact you to arrange payment before the session.</span>}
        </div>
      )}
      {r.status === 'expired' && <p className="mt-2 rounded-xl bg-cream px-3 py-2 text-sm text-text-brown">Payment wasn’t completed in time, so this time was released. You can book again any time.</p>}
      {r.paid && r.status !== 'cancelled' && <p className="mt-2 text-sm font-semibold text-emerald-800">✓ Paid ₹{r.priceINR}</p>}
      {r.payIssue && <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950">{r.payIssue}</p>}
      {r.rescheduleCount > 0 && <p className="mt-1 text-sm text-brown-light">Rescheduled once.</p>}
      {(r.canCancel || r.canReschedule) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {r.canReschedule && <button disabled={!!busyId} onClick={() => openMove(r.id)} className="rounded-full bg-cream-dark px-5 py-2 text-base font-semibold text-text-brown hover:bg-primary hover:text-white disabled:opacity-60">Reschedule</button>}
          {r.canCancel && <button disabled={busyId === r.id} onClick={() => cancel(r.id)} className="rounded-full border border-card-red/40 px-5 py-2 text-base font-semibold text-card-red hover:bg-card-red/10 disabled:opacity-60">{busyId === r.id ? 'Cancelling…' : 'Cancel'}</button>}
        </div>
      )}
      {r.note && <p className="mt-3 text-sm text-brown-light">{r.note}</p>}

      {moving === r.id && (
        <div className="mt-4 rounded-2xl bg-cream p-4">
          <div className="font-semibold text-text-brown">Pick a new time</div>
          <p className="mb-3 text-sm text-brown-light">You can reschedule once, within 14 days of your current time. All times are IST.</p>
          {days.length === 0 ? <p className="text-base text-muted-gray">No open times in that window. You can cancel and book again later.</p> : (
            <div className="grid max-h-72 gap-3 overflow-y-auto">
              {days.map((d) => (
                <div key={d.date}>
                  <div className="mb-1 text-sm font-semibold text-text-brown">{longDay(d.date)}</div>
                  <div className="flex flex-wrap gap-2">
                    {d.slots.map((s) => <button key={s.startAt} onClick={() => setPick(s.startAt)} className={`rounded-xl border px-3 py-1.5 text-base ${pick === s.startAt ? 'border-primary bg-primary text-white' : 'border-cream-dark bg-white text-text-brown hover:border-primary'}`}>{t12(s.label)}</button>)}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <button disabled={!pick || !!busyId} onClick={confirmMove} className="rounded-full bg-primary px-5 py-2 text-base font-semibold text-white hover:bg-brand-orange disabled:opacity-50">{busyId === r.id ? 'Saving…' : 'Confirm new time'}</button>
            <button onClick={() => setMoving(null)} className="rounded-full bg-cream-dark px-5 py-2 text-base font-semibold text-text-brown">Never mind</button>
          </div>
        </div>
      )}
    </article>
  )

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-patrick text-4xl text-primary">My consultations</h1>
          <p className="text-sm text-brown-light">Logged in as {email}</p>
        </div>
        <div className="flex gap-2">
          <a href="/consult" className="rounded-full bg-primary px-5 py-2 text-base font-semibold text-white hover:bg-brand-orange">Book a consultation</a>
          <button onClick={() => { clearParentToken(); setEmail(null); setRows([]) }} className="rounded-full bg-cream-dark px-5 py-2 text-base font-semibold text-text-brown">Log out</button>
        </div>
      </div>
      {paid === 'success' && <p className="mb-4 rounded-xl bg-accent-green/60 px-4 py-2 text-base text-text-brown">Payment received. Your consultation is confirmed and a calendar invite is on its way.</p>}
      {paid === 'failed' && <p className="mb-4 rounded-xl bg-card-red/10 px-4 py-2 text-base text-card-red">The payment didn’t go through. You haven’t been charged. You can try again below while your time is held.</p>}
      {paid === 'pending' && <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2 text-base text-amber-950">We’re still waiting for your bank to confirm the payment. Please refresh this page in a minute. If the payment went through, it will update.</p>}
      {msg && <p className="mb-4 rounded-xl bg-card-red/10 px-4 py-2 text-base text-card-red">{msg}</p>}
      {rows.length === 0 && <p className="rounded-3xl bg-white p-8 text-center text-text-brown shadow-sm">No consultations yet. When you book one with this email, it will show up here.</p>}
      {upcoming.length > 0 && <section className="grid gap-4"><h2 className="text-base font-semibold uppercase tracking-wide text-brown-light">Upcoming</h2>{upcoming.map(card)}</section>}
      {past.length > 0 && <section className="mt-8 grid gap-4"><h2 className="text-base font-semibold uppercase tracking-wide text-brown-light">Past and cancelled</h2>{past.map(card)}</section>}
    </main>
  )
}
