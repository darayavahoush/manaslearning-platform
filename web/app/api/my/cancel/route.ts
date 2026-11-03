import {NextResponse} from 'next/server'
import {updateDB} from '@/lib/store'
import {readParent, unauthorized} from '@/lib/parent'
import {bookingActions} from '@/lib/policy'
import {sendInvites} from '@/lib/mail'

export async function POST(req: Request) {
  const p = readParent(req)
  if (!p) return unauthorized()
  const {id} = await req.json().catch(() => ({}))
  const r = await updateDB((db) => {
    const b = db.bookings.find((x) => x.id === id && x.email.toLowerCase() === p.sub)
    if (!b) return {error: 'Booking not found.', status: 404} as const
    if (b.status === 'cancelled') return {done: true} as const
    const t = db.consultTypes.find((x) => x.id === b.typeId)!
    const a = bookingActions(b, t)
    if (!a.canCancel) return {error: a.note || 'This booking can’t be cancelled online. Please contact our team.', status: 422} as const
    b.status = 'cancelled'; b.cancelledBy = 'parent'; b.cancelledAt = new Date().toISOString()
    return {b: {...b}, t, s: db.staff.find((x) => x.id === b.staffId)!} as const
  })
  if ('error' in r) return NextResponse.json({error: r.error}, {status: r.status})
  if ('done' in r) return NextResponse.json({ok: true})
  try { await sendInvites(r.b, r.t, r.s, 'cancelled') } catch (e) { console.error('[mail] cancel failed', e) }
  return NextResponse.json({ok: true})
}
