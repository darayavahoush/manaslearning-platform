import {NextResponse} from 'next/server'
import {readDB} from '@/lib/store'
import {readParent, unauthorized} from '@/lib/parent'
import {bookingActions} from '@/lib/policy'

export async function GET(req: Request) {
  const p = readParent(req)
  if (!p) return unauthorized()
  const db = readDB()
  const now = Date.now()
  const rows = db.bookings
    .filter((b) => b.email.toLowerCase() === p.sub && b.status !== 'pending_email')
    .sort((a, b) => Date.parse(b.startAt) - Date.parse(a.startAt))
    .map((b) => {
      const t = db.consultTypes.find((x) => x.id === b.typeId)
      const s = db.staff.find((x) => x.id === b.staffId)
      const over = b.status !== 'cancelled' && Date.parse(b.endAt) < now
      return {
        id: b.id, typeId: b.typeId, title: t?.title ?? b.typeId, durationMins: t?.durationMins ?? 0, priceINR: t?.priceINR ?? 0,
        startAt: b.startAt, endAt: b.endAt, status: over ? 'completed' : b.status, with: s ? {name: s.name, role: s.role} : null,
        childName: b.childName, concern: b.concern, rescheduleCount: b.rescheduleCount ?? 0, cancelledBy: b.cancelledBy,
        ...(t ? bookingActions(b, t, now) : {canCancel: false, canReschedule: false}),
      }
    })
  return NextResponse.json({email: p.sub, bookings: rows})
}
