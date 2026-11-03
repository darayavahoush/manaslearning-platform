import {NextRequest, NextResponse} from 'next/server'
import {byCode, type Lang} from '@/lib/i18n/languages'
import {rateLimited, sameSite, spend} from '@/lib/i18n/guard'

// POST {lang, texts: string[]} -> {translations: string[]} (same order). English source only.
const cache = new Map<string, string>()
const CACHE_MAX = 100_000
const BRANDS = /\b(Manas Learning|Milo|Vaaksudhi|Vaakify|Vaakbot|In Their World)\b/g

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const unesc = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')

async function azure(l: Lang, texts: string[]): Promise<string[]> {
  const key = process.env.AZURE_TRANSLATOR_KEY
  if (!key) throw new Error('not_configured')
  const endpoint = process.env.AZURE_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com'
  const headers: Record<string, string> = {'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/json'}
  if (process.env.AZURE_TRANSLATOR_REGION) headers['Ocp-Apim-Subscription-Region'] = process.env.AZURE_TRANSLATOR_REGION
  const body = texts.map((t) => ({Text: esc(t).replace(BRANDS, '<span class="notranslate">$1</span>')}))
  const r = await fetch(`${endpoint}/translate?api-version=3.0&from=en&to=${l.mtCode}&textType=html`, {method: 'POST', headers, body: JSON.stringify(body)})
  if (!r.ok) throw new Error('upstream_' + r.status)
  const j = (await r.json()) as {translations: {text: string}[]}[]
  return j.map((x, i) => (x.translations?.[0]?.text ? unesc(x.translations[0].text) : texts[i]))
}

// Sarvam accepts 2,000 characters per request, so long text is split at sentence ends.
function chunk(t: string): string[] {
  if (t.length <= 1800) return [t]
  const out: string[] = []
  let cur = ''
  for (const s of t.split(/(?<=[.!?])\s+/)) {
    if ((cur + ' ' + s).length > 1800 && cur) { out.push(cur); cur = s } else cur = cur ? cur + ' ' + s : s
  }
  if (cur) out.push(cur)
  return out.flatMap((c) => (c.length > 1900 ? c.match(/[\s\S]{1,1800}/g) || [c] : [c]))
}

async function sarvamOne(l: Lang, text: string): Promise<string> {
  const key = process.env.SARVAM_API_KEY
  if (!key) throw new Error('not_configured')
  const parts: string[] = []
  for (const c of chunk(text)) {
    const r = await fetch(process.env.SARVAM_ENDPOINT || 'https://api.sarvam.ai/translate', {
      method: 'POST',
      headers: {'api-subscription-key': key, 'Content-Type': 'application/json'},
      body: JSON.stringify({input: c, source_language_code: 'en-IN', target_language_code: l.mtCode, model: 'sarvam-translate:v1', mode: 'formal'}),
    })
    if (!r.ok) throw new Error('upstream_' + r.status)
    parts.push(((await r.json()) as {translated_text?: string}).translated_text || c)
  }
  return parts.join(' ')
}

async function sarvam(l: Lang, texts: string[]): Promise<string[]> {
  const out: string[] = new Array(texts.length)
  let next = 0
  await Promise.all(Array.from({length: 4}, async () => {
    while (next < texts.length) { const i = next++; out[i] = await sarvamOne(l, texts[i]) }
  }))
  return out
}

export async function POST(req: NextRequest) {
  if (!sameSite(req)) return NextResponse.json({error: 'forbidden'}, {status: 403})
  if (rateLimited(req, 'tr', 120)) return NextResponse.json({error: 'rate_limited'}, {status: 429})
  let body: {lang?: string; texts?: unknown}
  try { body = await req.json() } catch { return NextResponse.json({error: 'bad_request'}, {status: 400}) }
  const l = byCode(String(body.lang || ''))
  const texts = body.texts
  if (!l || l.code === 'en' || !Array.isArray(texts) || texts.length < 1 || texts.length > 100 || texts.some((t) => typeof t !== 'string' || t.length > 3000)) {
    return NextResponse.json({error: 'bad_request'}, {status: 400})
  }
  const list = texts as string[]
  if (list.reduce((n, t) => n + t.length, 0) > 20_000) return NextResponse.json({error: 'too_large'}, {status: 413})

  const ck = (t: string) => l.code + '\u0001' + t
  const missing = [...new Set(list.filter((t) => !cache.has(ck(t))))]
  if (missing.length) {
    if (!spend('translate', missing.reduce((n, t) => n + t.length, 0))) return NextResponse.json({error: 'budget'}, {status: 429})
    try {
      const res = l.mt === 'sarvam' ? await sarvam(l, missing) : await azure(l, missing)
      if (cache.size > CACHE_MAX) for (const k of [...cache.keys()].slice(0, 10_000)) cache.delete(k)
      missing.forEach((t, i) => cache.set(ck(t), res[i] || t))
    } catch (e) {
      const m = e instanceof Error ? e.message : 'upstream'
      return NextResponse.json({error: m}, {status: m === 'not_configured' ? 503 : 502})
    }
  }
  return NextResponse.json({translations: list.map((t) => cache.get(ck(t)) ?? t)})
}
