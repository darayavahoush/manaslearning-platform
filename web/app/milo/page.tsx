/* eslint-disable @next/next/no-img-element */
import MiloChat from '../../components/milo/MiloChat'

export const metadata = {title: 'Milo - Manas Learning'}

export default function MiloPage() {
  return (
    <main className="mx-auto my-2 flex h-[calc(100dvh-6rem)] max-w-3xl flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-lg">
      <header className="flex items-center gap-3 bg-gradient-to-r from-card-green to-primary px-4 py-3 text-white">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-white/80 bg-white/20 shadow-sm">
          <img src="/decor/milo-owl.webp" alt="Milo" className="h-full w-full object-cover" />
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-lg leading-none">Milo</p>
            <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Learning Guide</span>
          </div>
          <p className="text-xs text-white/90">Ask me anything · Here to help</p>
        </div>
        <a href="/consult" className="ml-auto rounded-full bg-white/20 px-3 py-1 text-sm font-medium hover:bg-white/30 transition">Book a consultation</a>
      </header>
      <div className="min-h-0 flex-1"><MiloChat /></div>
    </main>
  )
}
