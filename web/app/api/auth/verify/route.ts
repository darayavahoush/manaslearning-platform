import {NextResponse} from 'next/server'
import {readDB, writeDB} from '@/lib/store'
import {keyedHash, safeEqual} from '@/lib/auth'
import {signParent} from '@/lib/parent'

const MAX_ATTEMPTS = 5

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const email = String(body?.email ?? '').trim().toLowerCase()
  const code = String(body?.code ?? '').trim()
  if (!email || !/^\d{6}$/.test(code)) return NextResponse.json({error: 'Enter the 6-digit code from your email.'}, {status: 400})

  const db = readDB()
  const now = Date.now()
  const entry = (db.loginCodes ?? []).find((c) => c.email === email && c.exp > now)
  if (!entry) return NextResponse.json({error: 'That code has expired. Please request a new one.'}, {status: 400})
  if (entry.attempts >= MAX_ATTEMPTS) {
    db.loginCodes = db.loginCodes!.filter((c) => c !== entry)
    writeDB(db)
    return NextResponse.json({error: 'Too many wrong tries. Please request a new code.'}, {status: 429})
  }
  if (!safeEqual(entry.hash, keyedHash(`${email}:${code}`))) {
    entry.attempts++
    writeDB(db)
    return NextResponse.json({error: 'That code isn’t right. Please try again.'}, {status: 400})
  }
  db.loginCodes = db.loginCodes!.filter((c) => c !== entry)
  writeDB(db)
  return NextResponse.json({ok: true, email, token: signParent(email)})
}
