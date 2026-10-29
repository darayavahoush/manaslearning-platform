import {NextResponse} from 'next/server'
import {readDB, writeDB} from '@/lib/store'
import {sendInvites} from '@/lib/mail'

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const token = String(body?.token ?? '')
  if (token.length < 20) return NextResponse.json({error: 'This link is not valid.'}, {status: 400})

  const db = readDB()
  const b = db.bookings.find((x) => x.confirmToken === token)
  if (!b) return NextResponse.json({error: 'This link is no longer valid. It may have expired.'}, {status: 404})
  const t = db.consultTypes.find((x) => x.id === b.typeId)!
  const staff = db.staff.find((x) => x.id === b.staffId)!

  if (b.status === 'pending_email') {
    if ((b.expiresAt ?? 0) < Date.now()) return NextResponse.json({error: 'This link has expired and the time was released. Please book again.'}, {status: 410})
    const paid = t.priceINR > 0
    b.status = paid ? 'pending_payment' : 'confirmed'
    delete b.expiresAt
    writeDB(db)
    if (!paid) {
      try { await sendInvites(b, t, staff, 'confirmed') } catch (e) { console.error('[mail] invite failed', e) }
    }
  }
  return NextResponse.json({ok: true, title: t.title, startAt: b.startAt, needsPayment: b.status === 'pending_payment'})
}
