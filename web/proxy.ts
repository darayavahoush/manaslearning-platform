import {NextRequest, NextResponse} from 'next/server'
import {MILO_SNIPPET} from './lib/milo-snippet'
import {SITE_PATCH} from './lib/site-patch'

// One project, one domain: the live manaslearning.com is reverse-proxied for every path this app does not own,
// with Milo injected and every booking link pointed at our /consult page.
const LIVE = process.env.LIVE_ORIGIN || 'https://www.manaslearning.com'

// Paths served by this Next app itself. Everything else comes from the live site.
const OWN = [
  '/consult', '/milo', '/experience', '/confirm', '/team',
  '/api/types', '/api/availability', '/api/slots', '/api/book', '/api/confirm', '/api/team', '/api/milo',
  '/web-static', '/logo.png', '/decor', '/_next/static/immutable', '/sounds',
  '/_next/webpack-hmr', '/__nextjs',
]
const owns = (p: string) => {
  if (OWN.some((o) => p === o || p.startsWith(o + '/'))) return true
  // Static media video files stored in public/videos
  if (p.startsWith('/videos/') && /\.(mp4|webm|ogg|mov)$/i.test(p)) return true
  return false
}

const BOOKING = /https:(?:\\?\/){2}(?:calendly\.com\/manasivalluri\/expert-consultation|calendar\.app\.google\/Exsr5Uj7nEH67iKC6)[^"'\\<\s)]*/g
const SKIP_REQ = ['host', 'connection', 'content-length', 'accept-encoding', 'origin', 'referer']
const SKIP_RES = ['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'content-security-policy', 'strict-transport-security', 'set-cookie']

export async function proxy(req: NextRequest) {
  const {pathname, search, host, protocol} = req.nextUrl
  if (pathname === '/experience-what-they-feel') return NextResponse.redirect(new URL('/experience', req.url), 307)
  if (owns(pathname)) return NextResponse.next()

  try {
    const headers = new Headers()
    req.headers.forEach((v, k) => { if (!SKIP_REQ.includes(k) && !k.startsWith('x-vercel') && !k.startsWith('x-forwarded') && !k.startsWith('x-middleware')) headers.set(k, v) })
    headers.set('accept-encoding', 'identity')
    const xff = req.headers.get('x-forwarded-for')
    if (xff) headers.set('x-forwarded-for', xff)

    const hasBody = !['GET', 'HEAD'].includes(req.method)
    const r = await fetch(LIVE + pathname + search, {
      method: req.method, headers, redirect: 'manual',
      body: hasBody ? await req.arrayBuffer() : undefined,
    })

    const out = new Headers()
    r.headers.forEach((v, k) => {
      if (SKIP_RES.includes(k)) return
      if (k === 'location') v = v.replace(LIVE, `${protocol}//${host}`).replace(BOOKING, '/consult')
      out.set(k, v)
    })
    const cookies = (r.headers as Headers & {getSetCookie?: () => string[]}).getSetCookie?.() ?? []
    for (const c of cookies) out.append('set-cookie', c.replace(/;\s*domain=[^;]+/i, ''))

    const type = r.headers.get('content-type') || ''
    if (type.includes('text/html') || type.includes('text/x-component')) {
      let b = await r.text()
      if (type.includes('text/html')) { const inj = SITE_PATCH + (MILO_SNIPPET || ''); b = b.includes('</body>') ? b.replace('</body>', () => inj + '</body>') : b + inj }
      b = b.replace(BOOKING, '/consult')
      if (type.includes('text/html')) b = b.replace('</body>', () => '<script src="/decor/apps-patch.js?v=9" defer></script></body>')
      b = b.replace(/(["'(])\/experience-what-they-feel(?![\w-])/g, '$1/experience')
      return new Response(b, {status: r.status, headers: out})
    }
    return new Response(r.body, {status: r.status, headers: out})
  } catch {
    // live site unreachable: fall back to this app's own page for "/", otherwise a clear error
    return pathname === '/' ? NextResponse.next() : new Response('Could not reach manaslearning.com', {status: 502})
  }
}

export const config = {matcher: '/:path*'}
