// Abuse protection for the paid translation/speech endpoints: same-site only, per-IP rate limit, daily character budget.
// State is per server instance, so the limits are approximate on serverless; they stop casual abuse, not a determined attacker.
const hits = new Map<string, {n: number; reset: number}>()
const budget = {day: '', translate: 0, speech: 0}

export function sameSite(req: Request): boolean {
  const host = req.headers.get('host')
  const from = req.headers.get('origin') || req.headers.get('referer')
  if (!host || !from) return false
  try { return new URL(from).host === host } catch { return false }
}

export function rateLimited(req: Request, bucket: string, perMinute: number): boolean {
  const ip = (req.headers.get('x-forwarded-for') || 'local').split(',')[0].trim()
  const key = bucket + ':' + ip
  const now = Date.now()
  const h = hits.get(key)
  if (!h || h.reset < now) {
    if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k)
    hits.set(key, {n: 1, reset: now + 60_000})
    return false
  }
  h.n++
  return h.n > perMinute
}

// Returns false when today's character budget for this kind of call is used up.
export function spend(kind: 'translate' | 'speech', chars: number): boolean {
  const day = new Date().toISOString().slice(0, 10)
  if (budget.day !== day) { budget.day = day; budget.translate = 0; budget.speech = 0 }
  const limit = Number(kind === 'translate' ? process.env.I18N_DAILY_TRANSLATE_CHARS || 3_000_000 : process.env.I18N_DAILY_SPEECH_CHARS || 1_000_000)
  if (budget[kind] + chars > limit) return false
  budget[kind] += chars
  return true
}
