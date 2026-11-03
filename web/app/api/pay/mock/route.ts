import {NextResponse} from 'next/server'
import {mockGateway} from '@/lib/paytm'
import {readDB} from '@/lib/store'

// Stand-in for Paytm's hosted page when no merchant credentials are set (local development only).
export async function POST(req: Request) {
  if (!mockGateway()) return new NextResponse('Not found', {status: 404})
  const form = await req.formData()
  const orderId = String(form.get('orderId') ?? '')
  const db = await readDB()
  const b = db.bookings.find((x) => x.payOrders?.includes(orderId))
  const t = b && db.consultTypes.find((x) => x.id === b.typeId)
  const amount = t?.priceINR ?? 0
  const f = (status: string) => `<form method="post" action="/api/pay/callback" style="display:inline"><input type="hidden" name="ORDERID" value="${orderId.replace(/[^A-Z0-9]/gi, '')}"><input type="hidden" name="TXNAMOUNT" value="${amount}"><input type="hidden" name="STATUS" value="${status}"><button style="padding:12px 24px;margin:6px;border-radius:999px;border:0;font-size:16px;cursor:pointer;background:${status === 'TXN_SUCCESS' ? '#2e7d32' : '#b71c1c'};color:#fff">${status === 'TXN_SUCCESS' ? `Pay ₹${amount} (test)` : 'Fail payment'}</button></form>`
  return new NextResponse(`<!doctype html><meta name=viewport content="width=device-width"><body style="font-family:sans-serif;text-align:center;padding:48px"><h2>Test payment page</h2><p>This stands in for Paytm in local development.<br>Order ${orderId}</p>${f('TXN_SUCCESS')}${f('TXN_FAILURE')}</body>`, {headers: {'Content-Type': 'text/html'}})
}
