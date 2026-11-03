import {NextResponse} from 'next/server'
import crypto from 'node:crypto'
import {updateDB} from '@/lib/store'
import {readParent, unauthorized} from '@/lib/parent'
import {initiate} from '@/lib/paytm'

const PAY_WINDOW_MS = 20 * 60000

export async function POST(req: Request) {
  const p = readParent(req)
  if (!p) return unauthorized()
  const {bookingId} = await req.json().catch(() => ({}))
  const now = Date.now()
  // Every attempt gets a fresh order id (Paytm won't reuse one), and the slot stays held while they pay.
  const orderId = `ML${now.toString(36)}${crypto.randomBytes(3).toString('hex')}`.toUpperCase()
  const r = await updateDB((db) => {
    const b = db.bookings.find((x) => x.id === bookingId && x.email.toLowerCase() === p.sub)
    if (!b) return {error: 'Booking not found.', status: 404} as const
    if (b.paymentStatus === 'paid') return {error: 'This booking is already paid.', status: 409} as const
    if (b.status !== 'pending_payment' || (b.payBy !== undefined && b.payBy < now))
      return {error: 'This time is no longer held. Please book again.', status: 410} as const
    const t = db.consultTypes.find((x) => x.id === b.typeId)!
    b.payOrders = [...(b.payOrders ?? []), orderId]
    b.payBy = Math.max(b.payBy ?? 0, now + PAY_WINDOW_MS)
    return {t} as const
  })
  if ('error' in r) return NextResponse.json({error: r.error}, {status: r.status})
  const {t} = r

  const base = process.env.SITE_URL || new URL(req.url).origin
  try {
    const x = await initiate(orderId, t.priceINR, p.sub, `${base}/api/pay/callback`)
    return NextResponse.json({actionUrl: x.actionUrl, fields: {mid: x.mid, orderId, txnToken: x.txnToken}, amount: t.priceINR, title: t.title})
  } catch (e) {
    console.error('[paytm] initiate failed', e)
    return NextResponse.json({error: 'We couldn’t start the payment. Please try again in a moment.'}, {status: 502})
  }
}
