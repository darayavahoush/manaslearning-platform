import {NextResponse} from 'next/server'
import {mockGateway} from '@/lib/paytm'
import {applyResult, reconcile, type Settled} from '@/lib/payments'

// Paytm sends the parent's browser back here with a form POST. We never trust those fields:
// the result comes from Paytm's signed Order Status API. (The dev mock gateway is the only exception.)
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null)
  const orderId = String(form?.get('ORDERID') ?? form?.get('orderId') ?? '')
  let result: Settled = 'unknown'
  if (orderId) {
    if (mockGateway()) {
      const ok = form?.get('STATUS') === 'TXN_SUCCESS'
      result = await applyResult(orderId, {state: ok ? 'success' : 'failed', amount: Number(form?.get('TXNAMOUNT') ?? 0), txnId: `MOCK-${Date.now()}`})
    } else result = await reconcile(orderId)
  }
  const base = process.env.SITE_URL || new URL(req.url).origin
  return NextResponse.redirect(`${base}/my/consultations?payment=${result === 'success' ? 'success' : result === 'failed' ? 'failed' : 'pending'}`, 303)
}
