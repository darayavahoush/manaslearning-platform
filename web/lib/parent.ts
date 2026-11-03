// Parent accounts: passwordless email-code login. A session proves ownership of an email address.
import crypto from 'node:crypto'
import {NextResponse} from 'next/server'
import {signPayload, verifyPayload} from '@/lib/auth'

const TTL_MS = 30 * 24 * 60 * 60 * 1000
export type ParentSession = {typ: 'parent'; sub: string; exp: number}

export const signParent = (email: string) => signPayload({typ: 'parent', sub: email.toLowerCase(), exp: Date.now() + TTL_MS} satisfies ParentSession)

export function readParent(req: Request): ParentSession | null {
  const s = verifyPayload<ParentSession>(req.headers.get('x-parent-key'))
  return s && s.typ === 'parent' && s.sub ? s : null
}

export const unauthorized = () => NextResponse.json({error: 'Please log in.', loginRequired: true}, {status: 401})
export const newCode = () => String(crypto.randomInt(100000, 1000000))
