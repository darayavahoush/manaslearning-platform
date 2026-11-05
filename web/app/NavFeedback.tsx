'use client'
import {useEffect, useState} from 'react'

// Instant feedback while a page opens. The header links are plain anchors that load a whole new page, which
// takes a moment. With no sign that anything happened people click again, and every extra click restarts the
// load. This shows a progress bar and ignores repeat clicks until the new page arrives.
export default function NavFeedback() {
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let on = false
    let start = ''
    let poll: ReturnType<typeof setInterval> | undefined
    let guard: ReturnType<typeof setTimeout> | undefined
    const seen = new Set<string>()
    const here = () => location.pathname + location.search

    const stop = () => {
      on = false
      setPending(false)
      document.documentElement.style.cursor = ''
      if (poll) clearInterval(poll)
      if (guard) clearTimeout(guard)
    }
    const anchor = (e: Event) => {
      const t = e.target as Element | null
      const a = t && 'closest' in t ? (t.closest('a') as HTMLAnchorElement | null) : null
      return a && a.href ? a : null
    }

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = anchor(e)
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return
      let u: URL
      try { u = new URL(a.href) } catch { return }
      if (u.origin !== location.origin) return
      if (u.pathname + u.search === here()) return
      if (on) { e.preventDefault(); return }
      on = true
      start = here()
      setPending(true)
      document.documentElement.style.cursor = 'progress'
      poll = setInterval(() => { if (here() !== start) stop() }, 120)
      guard = setTimeout(stop, 15000)
    }

    function onHover(e: Event) {
      const a = anchor(e)
      if (!a || !a.closest('header')) return
      let u: URL
      try { u = new URL(a.href) } catch { return }
      if (u.origin !== location.origin || seen.has(u.pathname)) return
      seen.add(u.pathname)
      const l = document.createElement('link')
      l.rel = 'prefetch'
      l.href = u.pathname
      l.as = 'document'
      document.head.appendChild(l)
    }

    document.addEventListener('click', onClick, true)
    document.addEventListener('pointerover', onHover, true)
    document.addEventListener('touchstart', onHover, {capture: true, passive: true})
    window.addEventListener('pageshow', stop)
    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('pointerover', onHover, true)
      document.removeEventListener('touchstart', onHover, true)
      window.removeEventListener('pageshow', stop)
      if (poll) clearInterval(poll)
      if (guard) clearTimeout(guard)
    }
  }, [])

  if (!pending) return null
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-0 z-[100]">
      <div className="h-1 w-full overflow-hidden bg-amber-100">
        <div className="h-full bg-amber-500" style={{animation: 'ml-nav-fill 8s cubic-bezier(.1,.7,.2,1) forwards'}} />
      </div>
      <p className="mx-auto mt-3 w-fit rounded-full bg-[#1F2937] px-4 py-1.5 text-sm font-semibold text-white shadow-lg">Opening…</p>
      <style>{'@keyframes ml-nav-fill{from{width:0}to{width:92%}}'}</style>
    </div>
  )
}
