import type {Metadata} from 'next'

export const metadata: Metadata = {
  title: 'Experience what they feel',
  description: 'Four short interactive simulations of autism, ADHD, dyslexia and speech differences, with Indian data and practical strategies.',
}

// The simulations live in the in-their-world app (its own Vercel project).
// Override with NEXT_PUBLIC_ITW_URL if it moves.
const ITW = process.env.NEXT_PUBLIC_ITW_URL || 'https://intheirworld.vercel.app'

export default function Experience() {
  return (
    <main className="container mx-auto px-3 py-4 md:px-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl text-black md:text-4xl">Experience what they feel</h1>
          <p className="text-lg text-black/70">Four five-minute simulations. Best with sound on.</p>
        </div>
        <div className="flex gap-2">
          <a href={ITW} target="_blank" rel="noopener noreferrer" className="rounded-full border-2 border-black/15 px-4 py-1.5 text-lg text-black hover:bg-black/5">Open full screen ↗</a>
          <a href="/consult" className="rounded-full bg-primary px-4 py-1.5 text-lg text-white hover:bg-brand-orange">Book a consultation</a>
        </div>
      </div>
      <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/10">
        <iframe
          src={ITW}
          title="In Their World: interactive simulations"
          className="block h-[calc(100dvh-11rem)] min-h-[560px] w-full border-0"
          allow="autoplay; fullscreen"
          loading="eager"
        />
      </div>
    </main>
  )
}
