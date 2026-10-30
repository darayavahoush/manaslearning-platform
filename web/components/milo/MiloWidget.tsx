/* eslint-disable @next/next/no-img-element */
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
        <button
          onClick={() => setOpen(true)}
          aria-label="Chat with Milo, learning and speech guide"
          className="group fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[#fffdf8] border-2 border-[#05b076] shadow-xl ring-4 ring-[#05b076]/25 transition-all duration-300 hover:scale-105 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400 pointer-events-auto"
        >
          <div className="relative flex h-13 w-13 items-center justify-center overflow-hidden rounded-full p-0.5">
            <img
              src="/decor/milo-owl.webp"
              alt="Milo the Owl"
              className="h-full w-full object-cover rounded-full"
            />
          </div>
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center pointer-events-none" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f47522] opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-[#f47522]" />
          </span>
        </button>
      )}
      <section
        aria-label="Milo chat"
        className={`${open ? 'flex' : 'hidden'} fixed z-50 flex-col overflow-hidden bg-white shadow-2xl transition-all duration-200 ${big ? 'inset-0' : 'bottom-5 right-5 h-[min(680px,85dvh)] w-[min(440px,calc(100vw-2.5rem))] rounded-2xl border border-black/10'}`}
      >
        <header className="flex items-center gap-3 bg-gradient-to-r from-[#05b076] via-[#10b981] to-[#f47522] px-4 py-3 text-white shadow-sm">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white/80 bg-white/20 shadow-sm">
            <img src="/decor/milo-owl.webp" alt="Milo" className="h-full w-full object-cover" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-lg leading-none">Milo</p>
              <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Learning Guide</span>
            </div>
            <p className="text-xs text-white/90">Ask me anything · Here to help</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <a href="/consult" className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium hover:bg-white/30 transition">Consultation</a>
            <button onClick={() => setBig(!big)} aria-label={big ? 'Shrink' : 'Full screen'} className="rounded-full p-1.5 hover:bg-white/20 text-xs">
              {big ? '🗗' : '⛶'}
            </button>
            <button onClick={() => { setOpen(false); setBig(false) }} aria-label="Close" className="rounded-full p-1.5 hover:bg-white/20 text-xs font-bold">
              ✕
            </button>
          </div>
        </header>
        <div className="mx-auto min-h-0 w-full max-w-3xl flex-1"><MiloChat /></div>
      </section>
    </>
  )
}
