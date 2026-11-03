// SMS sender. Pick a provider with SMS_PROVIDER=msg91 | twilio. With none set, messages are written to data/outbox (dev).
import fs from 'node:fs'
import path from 'node:path'

/** Indian mobile numbers are the norm here: 10 digits get +91; anything already in +country form is kept. */
export function normalizePhone(raw: string): string | null {
  const s = raw.trim()
  const digits = s.replace(/\D/g, '')
  if (s.startsWith('+')) return digits.length >= 10 && digits.length <= 15 ? `+${digits}` : null
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`
  if (digits.length === 11 && digits.startsWith('0') && /^[6-9]/.test(digits[1])) return `+91${digits.slice(1)}`
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits[2])) return `+${digits}`
  return null
}

export type SmsVars = {name: string; title: string; time: string; link: string}

/** `text` is used by providers that send free text (Twilio); `vars` fill the DLT template for MSG91. */
export async function sendSms(phone: string, text: string, vars: SmsVars): Promise<void> {
  const provider = process.env.SMS_PROVIDER
  if (provider === 'twilio') {
    const sid = process.env.TWILIO_ACCOUNT_SID, tok = process.env.TWILIO_AUTH_TOKEN
    const from = process.env.TWILIO_FROM, svc = process.env.TWILIO_MESSAGING_SERVICE_SID
    if (!sid || !tok || !(from || svc)) throw new Error('Twilio is not fully configured')
    const body = new URLSearchParams({To: phone, Body: text})
    if (svc) body.set('MessagingServiceSid', svc); else body.set('From', from!)
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {method: 'POST', headers: {Authorization: 'Basic ' + Buffer.from(`${sid}:${tok}`).toString('base64')}, body})
    if (!r.ok) throw new Error(`Twilio ${r.status}: ${(await r.text()).slice(0, 200)}`)
  } else if (provider === 'msg91') {
    const key = process.env.MSG91_AUTH_KEY, tpl = process.env.MSG91_TEMPLATE_ID
    if (!key || !tpl) throw new Error('MSG91 is not fully configured')
    // Indian SMS must use a DLT-approved template. Template variables: ##name##, ##title##, ##time##, ##link##
    const r = await fetch('https://control.msg91.com/api/v5/flow', {method: 'POST', headers: {authkey: key, 'Content-Type': 'application/json'}, body: JSON.stringify({template_id: tpl, short_url: '0', recipients: [{mobiles: phone.replace('+', ''), ...vars}]})})
    const j = await r.json().catch(() => ({}))
    if (!r.ok || j.type === 'error') throw new Error(`MSG91 ${r.status}: ${JSON.stringify(j).slice(0, 200)}`)
  } else if (process.env.NODE_ENV === 'production') {
    throw new Error('SMS_PROVIDER is not configured')
  } else {
    const dir = path.join(process.env.DATA_DIR || path.join(process.cwd(), 'data'), 'outbox')
    fs.mkdirSync(dir, {recursive: true})
    fs.writeFileSync(path.join(dir, `${Date.now()}-sms.txt`), `To: ${phone}\n${text}\n`)
    console.log(`[sms] No provider set. Would send to ${phone}: ${text}`)
  }
}
