import {NextResponse} from 'next/server'
import {updateDB} from '@/lib/store'
import {keyedHash} from '@/lib/auth'
import {newCode} from '@/lib/parent'
import {sendLoginCode} from '@/lib/mail'

const CODE_TTL_MS = 10 * 60000
const RESEND_MS = 60000

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const email = String(body?.email ?? '').trim().toLowerCase().slice(0, 200)
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({error: 'Please enter a valid email address.'}, {status: 400})

  const now = Date.now()
  const code = newCode()
  const send = await updateDB((db) => {
    const codes = (db.loginCodes ?? []).filter((c) => c.exp > now)
    const prev = codes.find((c) => c.email === email)
    // Same answer whether or not we send, so this can't be used to spam an inbox or probe addresses.
    if (prev && now - prev.sentAt < RESEND_MS) return false
    db.loginCodes = [...codes.filter((c) => c.email !== email), {email, hash: keyedHash(`${email}:${code}`), exp: now + CODE_TTL_MS, sentAt: now, attempts: 0}]
    return true
  })
  if (!send) return NextResponse.json({ok: true})
  try {
    await sendLoginCode(email, code)
  } catch (e) {
    console.error('[mail] login code failed', e)
    return NextResponse.json({error: 'We couldn’t send the code. Please check the address and try again.'}, {status: 502})
  }
  return NextResponse.json({ok: true})
}
