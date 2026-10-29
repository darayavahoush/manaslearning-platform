import type {DB, ConsultType, Staff} from './store'

const msAt = (d: string, hm: string) => Date.parse(`${d}T${hm}:00+05:30`) // India time, no DST
export const istDate = (ms: number) => new Date(ms + 19800000).toISOString().slice(0, 10)
const dow = (d: string) => new Date(d + 'T00:00:00Z').getUTCDay()

function staffSlots(s: Staff, t: ConsultType, date: string) {
  if (s.leave.some((l) => date >= l.from && date <= l.to)) return []
  const out: number[] = []
  const step = (t.durationMins + t.bufferMins) * 60000
  for (const h of s.weeklyHours.filter((h) => h.day === dow(date))) {
    const end = msAt(date, h.end)
    for (let st = msAt(date, h.start); st + t.durationMins * 60000 <= end; st += step) out.push(st)
  }
  return out
}

export function isFree(db: DB, s: Staff, t: ConsultType, st: number) {
  const blockEnd = st + (t.durationMins + t.bufferMins) * 60000
  return !db.bookings.some((b) => b.staffId === s.id && b.status !== 'cancelled' && !(b.status === 'pending_email' && (b.expiresAt ?? 0) < Date.now()) && st < b.blockEnd && blockEnd > Date.parse(b.startAt))
}

export function getSlots(db: DB, t: ConsultType, date: string, now = Date.now()) {
  if (msAt(date, '00:00') > now + t.maxDaysAhead * 864e5) return []
  const map = new Map<number, string[]>()
  for (const s of db.staff.filter((s) => s.active && s.consultTypeIds.includes(t.id)))
    for (const st of staffSlots(s, t, date))
      if (st >= now + t.minNoticeHours * 36e5 && isFree(db, s, t, st)) map.set(st, [...(map.get(st) || []), s.id])
  return [...map].sort((a, b) => a[0] - b[0]).map(([st, ids]) => ({startAt: new Date(st).toISOString(), label: new Date(st + 19800000).toISOString().slice(11, 16), staffIds: ids}))
}
