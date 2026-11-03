import {NextResponse} from 'next/server'
import {readDB, writeDB} from '@/lib/store'
import {readParent, unauthorized} from '@/lib/parent'
import {bookingActions, RESCHEDULE_WINDOW_DAYS} from '@/lib/policy'
import {getSlots, istDate} from '@/lib/slots'
import {sendInvites} from '@/lib/mail'

export async function POST(req: Request) {
  const p = readParent(req)
  if (!p) return unauthorized()
  const body = await req.json().catch(() => ({}))
  const st = Date.parse(String(body?.startAt ?? ''))
  if (isNaN(st)) return NextResponse.json({error: 'Invalid request.'}, {status: 400})

  // Read -> check -> write with no await in between, so two requests can't both take the same slot.
  const db = readDB()
  const b = db.bookings.find((x) => x.id === body.id && x.email.toLowerCase() === p.sub)
  if (!b) return NextResponse.json({error: 'Booking not found.'}, {status: 404})
  const t = db.consultTypes.find((x) => x.id === b.typeId)!
  const a = bookingActions(b, t)
  if (!a.canReschedule) return NextResponse.json({error: a.note || 'This booking can’t be rescheduled online. Please contact our team.'}, {status: 422})
  if (st > Date.parse(b.startAt) + RESCHEDULE_WINDOW_DAYS * 864e5)
    return NextResponse.json({error: `Please pick a time within ${RESCHEDULE_WINDOW_DAYS} days of your original session.`}, {status: 422})

  const view = {...db, bookings: db.bookings.filter((x) => x.id !== b.id)}
  const slot = getSlots(view, t, istDate(st)).find((s) => Date.parse(s.startAt) === st)
  if (!slot) return NextResponse.json({error: 'Sorry, that time was just taken. Please pick another.'}, {status: 409})

  const oldStaffId = b.staffId
  const oldSnap = {...b}
  b.staffId = slot.staffIds.includes(oldStaffId) ? oldStaffId : slot.staffIds[0]
  b.startAt = new Date(st).toISOString()
  b.endAt = new Date(st + t.durationMins * 60000).toISOString()
  b.blockEnd = st + (t.durationMins + t.bufferMins) * 60000
  b.rescheduleCount = (b.rescheduleCount ?? 0) + 1
  b.sequence = (b.sequence ?? 0) + 1
  b.rescheduledAt = new Date().toISOString()
  writeDB(db)

  // Paid sessions only get calendar invites once payment is confirmed, same as a fresh booking.
  if (b.status === 'confirmed') {
    const s = db.staff.find((x) => x.id === b.staffId)!
    try {
      if (oldStaffId !== b.staffId) {
        const old = db.staff.find((x) => x.id === oldStaffId)!
        await sendInvites(oldSnap, t, old, 'cancelled', {staffOnly: true})
      }
      await sendInvites(b, t, s, 'rescheduled')
    } catch (e) { console.error('[mail] reschedule failed', e) }
  }
  return NextResponse.json({ok: true, startAt: b.startAt})
}
