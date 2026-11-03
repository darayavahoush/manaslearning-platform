import {NextResponse} from 'next/server'
import crypto from 'node:crypto'
import {readDB, writeDB, type Booking} from '@/lib/store'
import {getSlots, istDate, isDead} from '@/lib/slots'
import {paymentsEnabled} from '@/lib/paytm'
import {sendConfirmLink, sendInvites} from '@/lib/mail'
import {readParent, unauthorized} from '@/lib/parent'
import {needsLogin} from '@/lib/policy'

const clean = (v: unknown, n = 1000) => String(v ?? '').trim().slice(0, n)
const HOLD_MS = 15 * 60000
const PAY_HOLD_MS = 30 * 60000 // a paid slot is held this long while the parent pays

export async function POST(req: Request) {
  const b = await req.json().catch(() => null)
  if (!b || !['typeId', 'startAt', 'parentName', 'phone'].every((k) => clean(b[k])))
    return NextResponse.json({error: 'Please fill in all required fields.'}, {status: 400})

  const db = readDB()
  const now = Date.now()
  const t = db.consultTypes.find((x) => x.id === b.typeId && x.active)
  const st = Date.parse(b.startAt)
  if (!t || isNaN(st)) return NextResponse.json({error: 'Invalid request.'}, {status: 400})

  // Login is enforced here, not just in the UI: expert and IEP sessions can't be booked without a verified account.
  const parent = readParent(req)
  if (needsLogin(t) && !parent) return unauthorized()

  // A logged-in parent's email is already verified, so we use it as-is (the form value is ignored).
  if (!parent && !/^\S+@\S+\.\S+$/.test(clean(b.email)))
    return NextResponse.json({error: 'Please fill in all required fields.'}, {status: 400})
  const email = parent ? parent.sub : clean(b.email, 200).toLowerCase()

  // Drop expired holds, and any earlier unconfirmed hold by this same email (it is being replaced).
  db.bookings = db.bookings.filter((x) => !(x.status === 'pending_email' && ((x.expiresAt ?? 0) < now || x.email.toLowerCase() === email)))

  if (db.bookings.some((x) => x.email.toLowerCase() === email && !isDead(x, now) && Date.parse(x.endAt) > now))
    return NextResponse.json({error: parent
      ? 'You already have an upcoming consultation. You can see it, or cancel or reschedule it, under My consultations.'
      : 'This email already has an upcoming consultation. Please attend it, or contact us to reschedule, before booking another.'}, {status: 422})

  const slot = getSlots(db, t, istDate(st)).find((s) => Date.parse(s.startAt) === st)
  if (!slot) return NextResponse.json({error: 'Sorry, that time was just taken. Please pick another.'}, {status: 409})

  const staffId = slot.staffIds[0]
  const paid = t.priceINR > 0
  const booking: Booking = {
    id: `booking-${staffId}-${st}-${now.toString(36)}`, typeId: t.id, staffId,
    startAt: new Date(st).toISOString(), endAt: new Date(st + t.durationMins * 60000).toISOString(),
    blockEnd: st + (t.durationMins + t.bufferMins) * 60000,
    status: parent ? (paid ? 'pending_payment' : 'confirmed') : 'pending_email',
    paymentStatus: paid ? 'pending' : 'not_required',
    ...(parent ? (paid ? {payBy: now + PAY_HOLD_MS} : {}) : {confirmToken: crypto.randomBytes(24).toString('hex'), expiresAt: now + HOLD_MS}),
    parentName: clean(b.parentName, 120), email, phone: clean(b.phone, 30),
    childName: clean(b.childName, 120), childAge: clean(b.childAge, 30), concern: clean(b.concern, 2000),
    createdAt: new Date().toISOString(),
  }
  db.bookings.push(booking)
  writeDB(db)

  if (parent) {
    if (!paid) {
      const s = db.staff.find((x) => x.id === staffId)!
      try { await sendInvites(booking, t, s, 'confirmed') } catch (e) { console.error('[mail] invite failed', e) }
    }
    return NextResponse.json({ok: true, bookingId: booking.id, needsPayment: paid, payOnline: paymentsEnabled(), confirmed: true})
  }

  const base = process.env.SITE_URL || new URL(req.url).origin
  try {
    await sendConfirmLink(booking, t, `${base}/confirm?token=${booking.confirmToken}`)
  } catch (e) {
    console.error('[mail] confirm link failed', e)
    const fresh = readDB()
    fresh.bookings = fresh.bookings.filter((x) => x.id !== booking.id)
    writeDB(fresh)
    return NextResponse.json({error: 'We couldn’t send the confirmation email. Please check the address and try again.'}, {status: 502})
  }
  return NextResponse.json({ok: true, bookingId: booking.id, needsPayment: paid, pendingEmail: true})
}
