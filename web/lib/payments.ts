import {readDB, writeDB} from '@/lib/store'
import {isFree} from '@/lib/slots'
import {orderStatus, type TxnResult} from '@/lib/paytm'
import {sendInvites} from '@/lib/mail'

export type Settled = 'success' | 'failed' | 'pending' | 'unknown'

/** Apply a verified transaction result to the booking that owns this order. Safe to call repeatedly. */
export async function applyResult(orderId: string, r: TxnResult): Promise<Settled> {
  const db = readDB()
  const b = db.bookings.find((x) => x.payOrders?.includes(orderId))
  if (!b) return 'unknown'
  if (r.state !== 'success') return r.state
  if (b.paymentStatus === 'paid') return 'success'
  const t = db.consultTypes.find((x) => x.id === b.typeId)!
  if (Math.round(r.amount * 100) !== Math.round(t.priceINR * 100)) {
    b.payIssue = `Payment of ₹${r.amount} received but the fee is ₹${t.priceINR}. Needs a manual check.`
    writeDB(db)
    return 'pending'
  }
  b.paymentStatus = 'paid'; b.paidAt = new Date().toISOString(); b.txnId = r.txnId; delete b.payBy
  const staff = db.staff.find((x) => x.id === b.staffId)!
  // The hold may have lapsed while they paid. Keep the slot if nobody took it; otherwise flag it for the team.
  const lost = b.status === 'cancelled' || (b.status === 'pending_payment' && !isFree({...db, bookings: db.bookings.filter((x) => x.id !== b.id)}, staff, t, Date.parse(b.startAt)))
  if (lost) {
    b.payIssue = 'Payment received, but this time was taken before payment finished. Please arrange a new time or a refund.'
    writeDB(db)
    return 'success'
  }
  b.status = 'confirmed'
  writeDB(db)
  try { await sendInvites(b, t, staff, 'confirmed') } catch (e) { console.error('[mail] invite failed', e) }
  return 'success'
}

/** Ask Paytm about the booking's latest order and apply it. Used by the callback and as a safety net when the parent never returns. */
export async function reconcile(orderId: string): Promise<Settled> {
  try {
    const r = await orderStatus(orderId)
    return r ? await applyResult(orderId, r) : 'unknown'
  } catch (e) {
    console.error('[paytm] status check failed', e)
    return 'unknown'
  }
}
