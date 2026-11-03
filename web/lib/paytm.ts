// Paytm "Show Payment Page" flow, the same one the main site uses for paid assessments:
// initiateTransaction -> browser posts txnToken to the hosted page -> Paytm calls our callback -> we confirm with the Order Status API.
// Credentials are the same merchant account as the .NET site (PaymentGateway:Paytm:* in Key Vault).
import PaytmChecksum from 'paytmchecksum'

type Cfg = {mid: string; key: string; website: string; requestType: string; initiateUrl: string; showUrl: string; statusUrl: string}

export function paytmConfig(): Cfg | null {
  const mid = process.env.PAYTM_MID, key = process.env.PAYTM_MKEY
  if (!mid || !key) return null
  const host = process.env.PAYTM_ENV === 'stage' ? 'https://securegw-stage.paytm.in' : 'https://securegw.paytm.in'
  return {
    mid, key,
    website: process.env.PAYTM_WEBSITE || (process.env.PAYTM_ENV === 'stage' ? 'WEBSTAGING' : 'DEFAULT'),
    requestType: process.env.PAYTM_REQUEST_TYPE || 'Payment',
    initiateUrl: process.env.PAYTM_INITIATE_URL || `${host}/theia/api/v1/initiateTransaction`,
    showUrl: process.env.PAYTM_SHOW_PAGE_URL || `${host}/theia/api/v1/showPaymentPage`,
    statusUrl: process.env.PAYTM_STATUS_URL || `${host}/v3/order/status`,
  }
}

/** Dev-only fake gateway so the flow can be tried without merchant credentials. Never active in production. */
export const mockGateway = () => !paytmConfig() && process.env.NODE_ENV !== 'production'
export const paymentsEnabled = () => !!paytmConfig() || mockGateway()

export type TxnResult = {state: 'success' | 'failed' | 'pending'; amount: number; txnId?: string}

async function post(url: string, body: unknown) {
  const r = await fetch(url, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body), cache: 'no-store'})
  const text = await r.text()
  try { return JSON.parse(text) } catch { throw new Error(`Paytm returned a non-JSON response (${r.status})`) }
}

export async function initiate(orderId: string, amountINR: number, custId: string, callbackUrl: string): Promise<{txnToken: string; mid: string; actionUrl: string}> {
  const c = paytmConfig()
  if (!c) {
    if (!mockGateway()) throw new Error('Online payment is not configured')
    return {txnToken: 'mock-token', mid: 'MOCK', actionUrl: '/api/pay/mock'}
  }
  const body = {requestType: c.requestType, mid: c.mid, websiteName: c.website, orderId, txnAmount: {value: amountINR.toFixed(2), currency: 'INR'}, userInfo: {custId}, callbackUrl}
  const signature = await PaytmChecksum.generateSignature(JSON.stringify(body), c.key)
  const j = await post(`${c.initiateUrl}?mid=${c.mid}&orderId=${orderId}`, {body, head: {signature}})
  const token = j?.body?.txnToken
  if (!token) throw new Error(`Paytm initiate failed: ${j?.body?.resultInfo?.resultMsg || 'no token'}`)
  return {txnToken: token, mid: c.mid, actionUrl: `${c.showUrl}?mid=${c.mid}&orderId=${orderId}`}
}

/** Ask Paytm what happened to an order. The response signature is checked, so a forged callback can't mark a booking paid. */
export async function orderStatus(orderId: string): Promise<TxnResult | null> {
  const c = paytmConfig()
  if (!c) return null // mock gateway has no status API
  const body = {mid: c.mid, orderId}
  const signature = await PaytmChecksum.generateSignature(JSON.stringify(body), c.key)
  const j = await post(c.statusUrl, {body, head: {signature}})
  if (!j?.body || !j?.head?.signature) throw new Error('Paytm status response was incomplete')
  if (!PaytmChecksum.verifySignature(JSON.stringify(j.body), c.key, j.head.signature)) throw new Error('Paytm status signature did not verify')
  const s = j.body.resultInfo?.resultStatus
  return {state: s === 'TXN_SUCCESS' ? 'success' : s === 'PENDING' ? 'pending' : 'failed', amount: Number(j.body.txnAmount ?? 0), txnId: j.body.txnId}
}
