import {NextResponse} from 'next/server'
import {readDB, writeDB} from '@/lib/store'
import {readParent, unauthorized} from '@/lib/parent'
import {bookingActions} from '@/lib/policy'
import {sendInvites} from '@/lib/mail'

export async function POST(req: Request) {
  const p = readParent(req)
  if (!p) return unauthorized()
  const {id} = await req.json().catch(() => ({}))
  const db = readDB()
  const b = db.bookings.find((x) => x.id === id && x.email.toLowerCase() === p.sub)
  if (!b) return NextResponse.json({error: 'Booking not found.'}, {status: 404})
  if (b.status === 'cancelled') return NextResponse.json({ok: true})
  const t = db.consultTypes.find((x) => x.id === b.typeId)!
  const a = bookingActions(b, t)
  if (!a.canCancel) return NextResponse.json({error: a.note || 'This booking can’t be cancelled online. Please contact our team.'}, {status: 422})

  b.status = 'cancelled'; b.cancelledBy = 'parent'; b.cancelledAt = new Date().toISOString()
  writeDB(db)
  const s = db.staff.find((x) => x.id === b.staffId)!
  try { await sendInvites(b, t, s, 'cancelled') } catch (e) { console.error('[mail] cancel failed', e) }
  return NextResponse.json({ok: true})
}
