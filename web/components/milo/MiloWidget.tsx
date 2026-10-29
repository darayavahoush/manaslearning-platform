'use client'
import {useState} from 'react'
import {usePathname} from 'next/navigation'
import MiloChat from './MiloChat'

export default function MiloWidget() {
  const [open, setOpen] = useState(false)
  const [big, setBig] = useState(false)
  const path = usePathname()
  if (path === '/milo') return null
  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Chat with Milo" className="fixed bottom-5 right-5 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-card-green text-3xl text-white shadow-xl transition hover:scale-105">🦉</button>
      )}
      <section aria-label="Milo chat" className={`${open ? 'flex' : 'hidden'} fixed z-50 flex-col overflow-hidden bg-white shadow-2xl ${big ? 'inset-0' : 'bottom-5 right-5 h-[min(680px,85dvh)] w-[min(440px,calc(100vw-2.5rem))] rounded-2xl border border-black/10'}`}>
        <header className="flex items-center gap-2 bg-gradient-to-r from-card-green to-primary px-4 py-3 text-white">
          <span className="text-2xl">🦉</span>
          <div className="leading-tight"><p className="text-xl">Milo</p><p className="text-sm opacity-90">Ask me anything</p></div>
          <div className="ml-auto flex items-center gap-1">
            <a href="/consult" className="rounded-full bg-white/20 px-3 py-1 text-sm hover:bg-white/30">Book a consultation</a>
            <button onClick={() => setBig(!big)} aria-label={big ? 'Shrink' : 'Full screen'} className="rounded-full px-2.5 py-1 hover:bg-white/20">{big ? '🗗' : '⛶'}</button>
            <button onClick={() => { setOpen(false); setBig(false) }} aria-label="Close" className="rounded-full px-2.5 py-1 hover:bg-white/20">✕</button>
          </div>
        </header>
        <div className="mx-auto min-h-0 w-full max-w-3xl flex-1"><MiloChat /></div>
      </section>
    </>
  )
}
