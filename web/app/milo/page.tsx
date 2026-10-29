import MiloChat from '../../components/milo/MiloChat'

export const metadata = {title: 'Milo - Manas Learning'}

export default function MiloPage() {
  return (
    <main className="mx-auto my-2 flex h-[calc(100dvh-6rem)] max-w-3xl flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-lg">
      <header className="flex items-center gap-2 bg-gradient-to-r from-card-green to-primary px-4 py-3 text-white">
        <span className="text-2xl">🦉</span>
        <div className="leading-tight"><p className="text-xl">Milo</p><p className="text-sm opacity-90">Manas Learning’s helper</p></div>
        <a href="/consult" className="ml-auto rounded-full bg-white/20 px-3 py-1 text-sm hover:bg-white/30">Book a consultation</a>
      </header>
      <div className="min-h-0 flex-1"><MiloChat /></div>
    </main>
  )
}
