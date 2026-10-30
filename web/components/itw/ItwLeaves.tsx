'use client'

import {useEffect, useState} from 'react'
import {createPortal} from 'react-dom'

// Same leaves as the homepage. They are rendered INSIDE .itw-root (via a portal) so they
// sit above the Experience background but behind the content (.itw-view, z-index 2).
// Outside .itw-root they could never go behind the text, because .itw-root is isolated.
const LEAVES = [
  {left: 4,  size: 34, dur: 14, delay: 0,  sway: 40,  spin: 280},
  {left: 14, size: 26, dur: 18, delay: 5,  sway: -50, spin: -220},
  {left: 25, size: 40, dur: 16, delay: 9,  sway: 60,  spin: 320},
  {left: 38, size: 24, dur: 20, delay: 2,  sway: -35, spin: -260},
  {left: 50, size: 32, dur: 15, delay: 12, sway: 45,  spin: 240},
  {left: 62, size: 28, dur: 19, delay: 7,  sway: -55, spin: -300},
  {left: 73, size: 38, dur: 17, delay: 3,  sway: 50,  spin: 360},
  {left: 84, size: 26, dur: 21, delay: 10, sway: -40, spin: -240},
  {left: 93, size: 34, dur: 16, delay: 6,  sway: 35,  spin: 300},
]

export default function ItwLeaves() {
  const [host, setHost] = useState<Element | null>(null)

  useEffect(() => {
    let unmounted = false
    const find = () => document.querySelector('.itw-root')
    const el = find()
    if (el) {
      queueMicrotask(() => {
        if (!unmounted) setHost(el)
      })
      return () => { unmounted = true }
    }
    // The Experience component loads lazily, so wait until its root exists.
    const mo = new MutationObserver(() => {
      const e = find()
      if (e) {
        if (!unmounted) setHost(e)
        mo.disconnect()
      }
    })
    mo.observe(document.body, {childList: true, subtree: true})
    return () => {
      unmounted = true
      mo.disconnect()
    }
  }, [])

  if (!host) return null

  return createPortal(
    <div aria-hidden="true" className="itw-leafwrap">
      {LEAVES.map((l, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i} src="/decor/leaf.webp" alt=""
          className="leaf-fall itw-leafimg"
          style={{
            left: `${l.left}%`, width: l.size * 2.6, maxWidth: '22vw',
            animationDuration: `${l.dur}s`, animationDelay: `-${l.delay}s`,
            ['--sway' as string]: `${l.sway}px`, ['--spin' as string]: `${l.spin}deg`,
          }}
        />
      ))}
    </div>,
    host,
  )
}
