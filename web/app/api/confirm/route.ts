import {NextResponse} from 'next/server'
import {updateDB} from '@/lib/store'
import {sendInvites} from '@/lib/mail'

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const token = String(body?.token ?? '')
  if (token.length < 20) return NextResponse.json({error: 'This link is not valid.'}, {status: 400})

  const r = await updateDB((db) => {
    const b = db.bookings.find((x) => x.confirmToken === token)
    if (!b) return {error: 'This link is no longer valid. It may have expired.', status: 404} as const
    const t = db.consultTypes.find((x) => x.id === b.typeId)!
    const staff = db.staff.find((x) => x.id === b.staffId)!
    let invite = false
    if (b.status === 'pending_email') {
      if ((b.expiresAt ?? 0) < Date.now()) return {error: 'This link has expired and the time was released. Please book again.', status: 410} as const
      const paid = t.priceINR > 0
      b.status = paid ? 'pending_payment' : 'confirmed'
      delete b.expiresAt
      invite = !paid
    }
    return {ok: true, b: {...b}, t, staff, invite} as const
  })
  if ('error' in r) return NextResponse.json({error: r.error}, {status: r.status})
  if (r.invite) {
    try { await sendInvites(r.b, r.t, r.staff, 'confirmed') } catch (e) { console.error('[mail] invite failed', e) }
  }
  return NextResponse.json({ok: true, title: r.t.title, startAt: r.b.startAt, needsPayment: r.b.status === 'pending_payment'})
}
