'use client'
import {useCallback, useEffect, useState} from 'react'

type Staff = {id: string; name: string; role: string}
type Type = {id: string; title: string; durationMins: number; priceINR: number}
type B = {id: string; typeId: string; staffId: string; startAt: string; endAt: string; status: string; parentName: string; email: string; phone: string; childName: string; childAge: string; concern: string}

const DAY0 = 9, DAY1 = 19, H = 56
const COLORS = ['#f16524', '#05b076', '#7bb2ff', '#e6c64f', '#00acd1', '#96654a']
const parts = (iso: string) => { const d = new Date(Date.parse(iso) + 19800000); return {date: d.toISOString().slice(0, 10), mins: d.getUTCHours() * 60 + d.getUTCMinutes()} }
const addDays = (d: string, n: number) => new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10)
const label = (d: string) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-IN', {weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC'})
const hm = (iso: string) => new Date(Date.parse(iso) + 19800000).toISOString().slice(11, 16)

export default function Team() {
  const [key, setKey] = useState('')
  const [authed, setAuthed] = useState(false)
  const [err, setErr] = useState('')
  const [data, setData] = useState<{staff: Staff[]; types: Type[]; bookings: B[]} | null>(null)
  const [week, setWeek] = useState('')
  const [today, setToday] = useState('')
  const [who, setWho] = useState('all')
  const [sel, setSel] = useState<B | null>(null)

  const load = useCallback(async (k: string) => {
    const r = await fetch('/api/team/bookings', {headers: {'x-team-key': k}})
    if (!r.ok) { setAuthed(false); setErr('Wrong password.'); return }
    setData(await r.json()); setAuthed(true); setErr(''); sessionStorage.setItem('team-key', k)
  }, [])

  useEffect(() => {
    const t = parts(new Date().toISOString()).date
    const dow = new Date(t + 'T00:00:00Z').getUTCDay()
    setToday(t); setWeek(addDays(t, -((dow + 6) % 7)))
    const k = sessionStorage.getItem('team-key')
    if (k) { setKey(k); load(k) }
  }, [load])

  async function cancel(b: B) {
    if (!confirm(`Cancel ${b.parentName}'s booking? They will be emailed a cancellation.`)) return
    await fetch('/api/team/cancel', {method: 'POST', headers: {'x-team-key': key, 'Content-Type': 'application/json'}, body: JSON.stringify({id: b.id})})
    setSel(null); load(key)
  }

  if (!authed || !data) return (
    <main className="mx-auto max-w-sm px-5 py-20">
      <h1 className="font-patrick text-4xl text-primary">Team calendar</h1>
      <form onSubmit={(e) => { e.preventDefault(); load(key) }} className="mt-6 grid gap-3">
        <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Team password" className="rounded-xl border border-cream-dark bg-white px-4 py-3 text-sm outline-none focus:border-primary" />
        {err && <p className="text-sm text-card-red">{err}</p>}
        <button className="rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-brand-orange">Open</button>
      </form>
    </main>
  )

  const days = week ? Array.from({length: 7}, (_, i) => addDays(week, i)) : []
  const hours = Array.from({length: DAY1 - DAY0}, (_, i) => DAY0 + i)
  const color = (id: string) => COLORS[Math.max(0, data.staff.findIndex((s) => s.id === id)) % COLORS.length]
  const shown = data.bookings.filter((b) => who === 'all' || b.staffId === who)
  const lanes = who === 'all' ? data.staff.length : 1
  const lane = (id: string) => (who === 'all' ? data.staff.findIndex((s) => s.id === id) : 0)

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-patrick text-4xl text-primary">Team calendar</h1>
        <div className="flex items-center gap-2 text-sm">
          <a href="/team/availability" className="rounded-full bg-primary px-4 py-2 text-white">Availability</a>
          <button onClick={() => setWeek(addDays(week, -7))} className="rounded-full bg-cream-dark px-4 py-2 text-text-brown">←</button>
          <span className="min-w-40 text-center text-text-brown">{week && `${label(week)} – ${label(addDays(week, 6))}`}</span>
          <button onClick={() => setWeek(addDays(week, 7))} className="rounded-full bg-cream-dark px-4 py-2 text-text-brown">→</button>
          <select value={who} onChange={(e) => setWho(e.target.value)} className="rounded-full border border-cream-dark bg-white px-4 py-2">
            <option value="all">Everyone</option>
            {data.staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-text-brown">
        {data.staff.map((s) => <span key={s.id} className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded-sm" style={{background: color(s.id)}} />{s.name}</span>)}
        <span>Dashed = awaiting payment · Faded = cancelled · Times in IST</span>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-cream-dark text-center text-xs">
            <div />
            {days.map((d) => <div key={d} className={`py-2 ${d === today ? 'font-bold text-primary' : 'text-text-brown'}`}>{label(d)}</div>)}
          </div>
          <div className="grid grid-cols-[56px_repeat(7,1fr)]" style={{height: (DAY1 - DAY0) * H}}>
            <div className="relative">
              {hours.map((h) => <div key={h} className="absolute right-2 text-[10px] text-muted-gray" style={{top: (h - DAY0) * H + 2}}>{String(h).padStart(2, '0')}:00</div>)}
            </div>
            {days.map((d) => (
              <div key={d} className="relative border-l border-cream-dark">
                {hours.map((h) => <div key={h} className="absolute inset-x-0 border-t border-cream-dark/70" style={{top: (h - DAY0) * H}} />)}
                {shown.filter((b) => parts(b.startAt).date === d).map((b) => {
                  const p = parts(b.startAt), dur = (Date.parse(b.endAt) - Date.parse(b.startAt)) / 60000
                  const t = data.types.find((x) => x.id === b.typeId)
                  return (
                    <button key={b.id} onClick={() => setSel(b)} title={`${b.parentName} · ${t?.title}`}
                      className={`absolute overflow-hidden rounded-md px-1 py-0.5 text-left text-[11px] leading-tight text-white ${b.status === 'cancelled' ? 'opacity-30 line-through' : ''} ${b.status === 'pending_payment' ? 'border-2 border-dashed border-white/80' : ''}`}
                      style={{top: ((p.mins - DAY0 * 60) / 60) * H, height: Math.max(20, (dur / 60) * H - 2), left: `${(lane(b.staffId) / lanes) * 100}%`, width: `${100 / lanes - 1}%`, background: color(b.staffId)}}>
                      <b>{hm(b.startAt)}</b> {b.parentName}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {sel && (
        <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold text-text-brown">{data.types.find((x) => x.id === sel.typeId)?.title} · {sel.status.replace('_', ' ')}</div>
              <div className="text-sm text-brown-light">{label(parts(sel.startAt).date)}, {hm(sel.startAt)}–{hm(sel.endAt)} IST · with {data.staff.find((s) => s.id === sel.staffId)?.name}</div>
            </div>
            <button onClick={() => setSel(null)} className="text-muted-gray">✕</button>
          </div>
          <div className="mt-3 grid gap-1 text-sm text-text-brown sm:grid-cols-2">
            <div>Parent: {sel.parentName}</div><div>Phone: {sel.phone}</div>
            <div>Email: {sel.email}</div><div>Child: {sel.childName || '–'} {sel.childAge && `(${sel.childAge})`}</div>
            <div className="sm:col-span-2">Concern: {sel.concern || '–'}</div>
          </div>
          {sel.status !== 'cancelled' && <button onClick={() => cancel(sel)} className="mt-4 rounded-full border border-card-red px-5 py-2 text-sm text-card-red hover:bg-card-red hover:text-white">Cancel booking</button>}
        </div>
      )}
    </main>
  )
}
