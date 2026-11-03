import {NextResponse} from 'next/server'
import {readDB} from '@/lib/store'
import {readParent, unauthorized} from '@/lib/parent'
import {bookingActions, RESCHEDULE_WINDOW_DAYS} from '@/lib/policy'
import {getSlots, istDate} from '@/lib/slots'

/** Open times a parent may move this booking to: from now until RESCHEDULE_WINDOW_DAYS after the current slot. */
export async function GET(req: Request) {
  const p = readParent(req)
  if (!p) return unauthorized()
  const id = new URL(req.url).searchParams.get('id')
  const db = readDB()
  const b = db.bookings.find((x) => x.id === id && x.email.toLowerCase() === p.sub)
  if (!b) return NextResponse.json({error: 'Booking not found.'}, {status: 404})
  const t = db.consultTypes.find((x) => x.id === b.typeId)!
  if (!bookingActions(b, t).canReschedule) return NextResponse.json({error: 'This booking can’t be rescheduled online.'}, {status: 422})

  const view = {...db, bookings: db.bookings.filter((x) => x.id !== b.id)} // its own slot is free for the move
  const now = Date.now()
  const last = Date.parse(b.startAt) + RESCHEDULE_WINDOW_DAYS * 864e5
  const days: {date: string; slots: {startAt: string; label: string}[]}[] = []
  for (let ms = now; ms <= last + 864e5; ms += 864e5) {
    const date = istDate(ms)
    if (days.some((d) => d.date === date)) continue
    const slots = getSlots(view, t, date, now).filter((s) => Date.parse(s.startAt) <= last && Date.parse(s.startAt) !== Date.parse(b.startAt)).map(({startAt, label}) => ({startAt, label}))
    if (slots.length) days.push({date, slots})
  }
  return NextResponse.json({days})
}
