'use client'
import {useCallback, useEffect, useState} from 'react'

type W = {day: number; start: string; end: string}
type L = {from: string; to: string}
type Staff = {id: string; name: string; role: string; active: boolean; weeklyHours: W[]; leave: L[]}
type B = {id: string; staffId: string; startAt: string; status: string}

const DAYS: [number, string][] = [[1, 'Mon'], [2, 'Tue'], [3, 'Wed'], [4, 'Thu'], [5, 'Fri'], [6, 'Sat'], [0, 'Sun']]
const istDate = (ms: number) => new Date(ms + 19800000).toISOString().slice(0, 10)
const input = 'rounded-lg border border-cream-dark bg-white px-2 py-1 text-sm outline-none focus:border-primary'

function Card({s, bookings, k}: {s: Staff; bookings: B[]; k: string}) {
  const [d, setD] = useState<Staff>(s)
  const [nl, setNl] = useState<L>({from: '', to: ''})
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const now = Date.now()
  const live = bookings.filter((b) => b.staffId === s.id && b.status !== 'cancelled' && Date.parse(b.startAt) >= now)
  const busy = live.filter((b) => Date.parse(b.startAt) < now + 7 * 864e5).length
  const win = (idx: number, patch: Partial<W>) => setD({...d, weeklyHours: d.weeklyHours.map((w, j) => (j === idx ? {...w, ...patch} : w))})

  function addLeave() {
    if (!nl.from || !nl.to) { setMsg('Pick both dates.'); return }
    if (nl.from > nl.to) { setMsg('"From" must be on or before "To".'); return }
    setD({...d, leave: [...d.leave, nl].sort((a, b) => a.from.localeCompare(b.from))})
    setNl({from: '', to: ''}); setMsg('')
  }

  async function save() {
    const clash = live.filter((b) => { const x = istDate(Date.parse(b.startAt)); return d.leave.some((l) => x >= l.from && x <= l.to) })
    if (clash.length && !confirm(`${clash.length} existing booking(s) fall inside this time off. They will NOT be cancelled automatically (cancel them from the Team calendar). Save anyway?`)) return
    setSaving(true); setMsg('')
    const r = await fetch('/api/team/availability', {method: 'POST', headers: {'x-team-key': k, 'Content-Type': 'application/json'}, body: JSON.stringify({staffId: d.id, active: d.active, weeklyHours: d.weeklyHours, leave: d.leave})})
    const j = await r.json().catch(() => ({}))
    setSaving(false)
    setMsg(r.ok ? 'Saved. Parents see the change straight away.' : j.error || 'Could not save.')
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text-brown">{d.name}</h2>
          <p className="text-sm text-brown-light">{d.role} · {busy} booking{busy === 1 ? '' : 's'} in the next 7 days</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-text-brown">
          <input type="checkbox" checked={d.active} onChange={(e) => setD({...d, active: e.target.checked})} />
          Accepting bookings
        </label>
      </div>

      <h3 className="mt-5 text-sm font-semibold text-text-brown">Weekly hours (IST)</h3>
      <div className="mt-2 grid gap-2">
        {DAYS.map(([day, name]) => {
          const rows = d.weeklyHours.map((w, idx) => ({w, idx})).filter((x) => x.w.day === day)
          return (
            <div key={day} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="w-10 text-text-brown">{name}</span>
              {rows.length === 0 && <span className="text-muted-gray">Off</span>}
              {rows.map(({w, idx}) => (
                <span key={idx} className="flex items-center gap-1">
                  <input type="time" value={w.start} onChange={(e) => win(idx, {start: e.target.value})} className={input} />
                  –
                  <input type="time" value={w.end} onChange={(e) => win(idx, {end: e.target.value})} className={input} />
                  <button onClick={() => setD({...d, weeklyHours: d.weeklyHours.filter((_, j) => j !== idx)})} className="px-1 text-muted-gray" aria-label="Remove">✕</button>
                </span>
              ))}
              <button onClick={() => setD({...d, weeklyHours: [...d.weeklyHours, {day, start: '10:00', end: '17:00'}]})} className="text-xs text-primary">+ add hours</button>
            </div>
          )
        })}
      </div>

      <h3 className="mt-5 text-sm font-semibold text-text-brown">Time off</h3>
      <div className="mt-2 grid gap-2 text-sm">
        {d.leave.length === 0 && <span className="text-muted-gray">None</span>}
        {d.leave.map((l, i) => (
          <div key={i} className="flex items-center gap-2 text-text-brown">
            {l.from === l.to ? l.from : `${l.from} → ${l.to}`}
            <button onClick={() => setD({...d, leave: d.leave.filter((_, j) => j !== i)})} className="text-muted-gray" aria-label="Remove">✕</button>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={nl.from} onChange={(e) => setNl({...nl, from: e.target.value, to: nl.to || e.target.value})} className={input} />
          to
          <input type="date" value={nl.to} onChange={(e) => setNl({...nl, to: e.target.value})} className={input} />
          <button onClick={addLeave} className="rounded-full bg-cream-dark px-4 py-1.5 text-text-brown">Add time off</button>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button onClick={save} disabled={saving} className="rounded-full bg-primary px-6 py-2.5 font-semibold text-white hover:bg-brand-orange disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
        {msg && <span className="text-sm text-text-brown">{msg}</span>}
      </div>
    </section>
  )
}

export default function Availability() {
  const [key, setKey] = useState('')
  const [data, setData] = useState<{staff: Staff[]; bookings: B[]} | null>(null)
  const [err, setErr] = useState('')

  const load = useCallback(async (k: string) => {
    const r = await fetch('/api/team/bookings', {headers: {'x-team-key': k}})
    if (!r.ok) { setData(null); setErr('Wrong password.'); return }
    setData(await r.json()); setErr(''); sessionStorage.setItem('team-key', k)
  }, [])

  useEffect(() => { const k = sessionStorage.getItem('team-key'); if (k) { setKey(k); load(k) } }, [load])

  if (!data) return (
    <main className="mx-auto max-w-sm px-5 py-20">
      <h1 className="font-patrick text-4xl text-primary">Availability</h1>
      <form onSubmit={(e) => { e.preventDefault(); load(key) }} className="mt-6 grid gap-3">
        <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Team password" className="rounded-xl border border-cream-dark bg-white px-4 py-3 text-sm outline-none focus:border-primary" />
        {err && <p className="text-sm text-card-red">{err}</p>}
        <button className="rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-brand-orange">Open</button>
      </form>
    </main>
  )

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-patrick text-4xl text-primary">Availability</h1>
        <a href="/team" className="rounded-full bg-cream-dark px-4 py-2 text-sm text-text-brown">← Team calendar</a>
      </div>
      <p className="mt-2 text-sm text-brown-light">Set working hours and time off. Parents only see open times, so changes apply to /consult immediately.</p>
      <div className="mt-5 grid gap-5">
        {data.staff.map((s) => <Card key={s.id} s={s} bookings={data.bookings} k={key} />)}
      </div>
    </main>
  )
}
