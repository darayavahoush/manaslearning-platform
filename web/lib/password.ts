import crypto from 'node:crypto'

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16)
  const key = crypto.scryptSync(password, salt, 64)
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`
}

export function verifyPassword(password: string, stored: string | undefined): boolean {
  if (!stored || typeof password !== 'string') return false
  const [alg, saltHex, keyHex] = stored.split('$')
  if (alg !== 'scrypt' || !saltHex || !keyHex) return false
  const expected = Buffer.from(keyHex, 'hex')
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length)
  return crypto.timingSafeEqual(actual, expected)
}
