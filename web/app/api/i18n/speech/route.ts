import {NextRequest, NextResponse} from 'next/server'
import {createHash} from 'node:crypto'
import {byCode} from '@/lib/i18n/languages'
import {rateLimited, sameSite, spend} from '@/lib/i18n/guard'

// POST {lang, text, rate?} -> audio/mpeg. `text` must already be in the target language.
const cache = new Map<string, Uint8Array>()
let cacheBytes = 0
const CACHE_BYTES = 60 * 1024 * 1024
const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

export async function POST(req: NextRequest) {
  if (!sameSite(req)) return NextResponse.json({error: 'forbidden'}, {status: 403})
  if (rateLimited(req, 'tts', 40)) return NextResponse.json({error: 'rate_limited'}, {status: 429})
  let body: {lang?: string; text?: string; rate?: number}
  try { body = await req.json() } catch { return NextResponse.json({error: 'bad_request'}, {status: 400}) }
  const l = byCode(String(body.lang || ''))
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!l || !text || text.length > 2500) return NextResponse.json({error: 'bad_request'}, {status: 400})
  if (!l.tts) return NextResponse.json({error: 'no_voice'}, {status: 404})
  const key = process.env.AZURE_SPEECH_KEY
  const region = process.env.AZURE_SPEECH_REGION
  if (!key || !region) return NextResponse.json({error: 'not_configured'}, {status: 503})

  const rate = Math.min(1.3, Math.max(0.7, Number(body.rate) || 1))
  const id = createHash('sha1').update(l.code + '|' + rate + '|' + text).digest('hex')
  let audio = cache.get(id)
  if (!audio) {
    if (!spend('speech', text.length)) return NextResponse.json({error: 'budget'}, {status: 429})
    const ssml = `<speak version="1.0" xml:lang="${l.tts.locale}" xmlns="http://www.w3.org/2001/10/synthesis"><voice name="${l.tts.voice}"><prosody rate="${Math.round((rate - 1) * 100)}%">${xml(text)}</prosody></voice></speak>`
    const r = await fetch(process.env.AZURE_SPEECH_ENDPOINT || `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3', 'User-Agent': 'manaslearning-web'},
      body: ssml,
    })
    if (!r.ok) return NextResponse.json({error: 'upstream_' + r.status}, {status: 502})
    audio = new Uint8Array(await r.arrayBuffer())
    if (cacheBytes + audio.length > CACHE_BYTES) { cache.clear(); cacheBytes = 0 }
    cache.set(id, audio)
    cacheBytes += audio.length
  }
  return new Response(audio as BodyInit, {headers: {'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, max-age=86400'}})
}
