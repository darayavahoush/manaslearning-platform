import {NextResponse} from 'next/server'
import {readDB} from '@/lib/store'
import {checkAdminPassword, signSession, verifyPassword} from '@/lib/auth'
import {publicStaff} from '@/lib/auth'

// Simple in-memory throttle: 8 failed attempts per client per 10 minutes.
const fails = new Map<string, {n: number; reset: number}>()
const WINDOW = 10 * 60_000
const MAX = 8

function clientKey(req: Request) {
  return (req.headers.get('x-forwarded-for') || 'local').split(',')[0].trim()
}

export async function POST(req: Request) {
  const key = clientKey(req)
  const f = fails.get(key)
  if (f && f.reset > Date.now() && f.n >= MAX)
    return NextResponse.json({error: 'Too many attempts. Please wait a few minutes and try again.'}, {status: 429})

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({error: 'Missing request body'}, {status: 400})
  const {staffId, email, password, asAdmin} = body as Record<string, string | boolean | undefined>

  const fail = (msg: string) => {
    const cur = fails.get(key)
    fails.set(key, !cur || cur.reset < Date.now() ? {n: 1, reset: Date.now() + WINDOW} : {n: cur.n + 1, reset: cur.reset})
    return NextResponse.json({error: msg}, {status: 401})
  }

  if (asAdmin) {
    if (!checkAdminPassword(password)) return fail('Incorrect email or password.')
    fails.delete(key)
    return NextResponse.json({
      ok: true,
      user: {id: 'admin', name: 'Clinic Administrator', role: 'Clinical Operations Director', email: 'admin@manaslearning.com', isAdmin: true},
      token: signSession('admin', 'admin'),
    })
  }

  const db = readDB()
  const target = db.staff.find((s) =>
    (typeof staffId === 'string' && s.id === staffId) ||
    (typeof email === 'string' && s.email.toLowerCase() === email.toLowerCase().trim()))
  // Same message whether the account or the password is wrong.
  if (!target || !target.active || !verifyPassword(String(password ?? ''), target.passwordHash)) return fail('Incorrect email or password.')

  fails.delete(key)
  return NextResponse.json({
    ok: true,
    user: {...publicStaff(target), isAdmin: false},
    token: signSession(target.id, 'staff'),
  })
}
