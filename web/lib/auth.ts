// Team authentication: scrypt-hashed passwords + HMAC-signed, expiring session tokens.
// No password is ever stored, compared, or sent back in plain text.
import crypto from 'node:crypto'
import {readDB, type Staff} from '@/lib/store'

const SESSION_TTL_MS = 8 * 60 * 60 * 1000 // 8 hours

export type Session = {sub: string; role: 'admin' | 'staff'; exp: number}

export {hashPassword, verifyPassword} from '@/lib/password'

function safeEqual(a: string, b: string): boolean {
  const ab = crypto.createHash('sha256').update(a).digest()
  const bb = crypto.createHash('sha256').update(b).digest()
  return crypto.timingSafeEqual(ab, bb)
}

// ---------- secrets ----------
let devSecret: string | undefined
let devAdmin: string | undefined

function sessionSecret(): string {
  const s = process.env.SESSION_SECRET
  if (s && s.length >= 16) return s
  if (process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET (16+ chars) is required in production')
  devSecret ??= crypto.randomBytes(32).toString('hex') // dev only: sessions reset on restart
  return devSecret
}

function adminPassword(): string | undefined {
  const p = process.env.TEAM_ADMIN_PASSWORD
  if (p) return p
  if (process.env.NODE_ENV === 'production') return undefined // admin login disabled until configured
  if (!devAdmin) {
    devAdmin = crypto.randomBytes(9).toString('base64url')
    console.warn(`[team-auth] TEAM_ADMIN_PASSWORD not set. Dev-only admin password for this run: ${devAdmin}`)
  }
  return devAdmin
}

export function checkAdminPassword(password: unknown): boolean {
  const p = adminPassword()
  return !!p && typeof password === 'string' && safeEqual(password, p)
}

// ---------- tokens ----------
const b64 = (s: string) => Buffer.from(s).toString('base64url')

export function signSession(sub: string, role: Session['role']): string {
  const body = b64(JSON.stringify({sub, role, exp: Date.now() + SESSION_TTL_MS} satisfies Session))
  const sig = crypto.createHmac('sha256', sessionSecret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

/** Sign any payload (must contain a numeric `exp`). Used for parent sessions. */
export function signPayload(payload: Record<string, unknown>): string {
  const body = b64(JSON.stringify(payload))
  const sig = crypto.createHmac('sha256', sessionSecret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifyPayload<T extends {exp: number}>(token: string | null | undefined): T | null {
  if (!token) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = crypto.createHmac('sha256', sessionSecret()).update(body).digest('base64url')
  if (!safeEqual(sig, expected)) return null
  try {
    const s = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T
    if (!s || typeof s.exp !== 'number' || s.exp < Date.now()) return null
    return s
  } catch {
    return null
  }
}

/** Keyed hash for short-lived secrets such as login codes. */
export function keyedHash(s: string): string {
  return crypto.createHmac('sha256', sessionSecret()).update(s).digest('hex')
}
export {safeEqual}

export function readSession(req: Request): Session | null {
  const s = verifyPayload<Session>(req.headers.get('x-team-key'))
  // A parent token is signed with the same secret, so insist on a team role.
  if (!s || (s.role !== 'admin' && s.role !== 'staff')) return null
  return s
}

/** Any signed-in team member (admin or active staff). */
export async function requireTeam(req: Request): Promise<Session | null> {
  const s = readSession(req)
  if (!s) return null
  if (s.role === 'admin') return s
  return (await readDB()).staff.some((x) => x.id === s.sub && x.active) ? s : null
}

export function requireAdmin(req: Request): Session | null {
  const s = readSession(req)
  return s && s.role === 'admin' ? s : null
}

/** Admin, or the staff member themselves. */
export function canActAs(s: Session | null, staffId: string): boolean {
  return !!s && (s.role === 'admin' || s.sub === staffId)
}

/** Staff record with all credential fields removed. */
export function publicStaff(s: Staff) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {password, passwordHash, ...rest} = s
  return {...rest, hasPassword: !!passwordHash}
}
