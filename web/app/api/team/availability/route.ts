import {NextResponse} from 'next/server'
import {requireTeam, canActAs} from '@/lib/auth'
import {readDB, writeDB} from '@/lib/store'

const HM = /^([01]\d|2[0-3]):[0-5]\d$/
const YMD = /^\d{4}-\d{2}-\d{2}$/
const bad = (m: string) => NextResponse.json({error: m}, {status: 400})

export async function POST(req: Request) {
  const b = await req.json().catch(() => null)
  const db = readDB()
  const s = db.staff.find((x) => x.id === b?.staffId)
  if (!s) return NextResponse.json({error: 'Not found'}, {status: 404})

  if (!canActAs(requireTeam(req), s.id)) return NextResponse.json({error: 'Unauthorized'}, {status: 401})

  if (b.leave !== undefined) {
    if (!Array.isArray(b.leave) || !b.leave.every((l: unknown) => typeof l === 'object' && l !== null && 'from' in l && 'to' in l && typeof (l as Record<string, unknown>).from === 'string' && typeof (l as Record<string, unknown>).to === 'string' && YMD.test((l as {from: string}).from) && YMD.test((l as {to: string}).to) && (l as {from: string}).from <= (l as {to: string}).to)) return bad('Bad leave dates')
    s.leave = (b.leave as Array<{from: string; to: string}>).map((l) => ({from: l.from, to: l.to}))
  }
  if (b.weeklyHours !== undefined) {
    if (!Array.isArray(b.weeklyHours) || !b.weeklyHours.every((h: unknown) => typeof h === 'object' && h !== null && 'day' in h && 'start' in h && 'end' in h && Number.isInteger((h as Record<string, unknown>).day) && ((h as {day: number}).day >= 0 && (h as {day: number}).day <= 6) && typeof (h as Record<string, unknown>).start === 'string' && typeof (h as Record<string, unknown>).end === 'string' && HM.test((h as {start: string}).start) && HM.test((h as {end: string}).end) && (h as {start: string}).start < (h as {end: string}).end)) return bad('Bad hours')
    s.weeklyHours = (b.weeklyHours as Array<{day: number; start: string; end: string}>).map((h) => ({day: h.day, start: h.start, end: h.end}))
  }
  if (typeof b.active === 'boolean') s.active = b.active
  writeDB(db)
  return NextResponse.json({ok: true, staff: s})
}
