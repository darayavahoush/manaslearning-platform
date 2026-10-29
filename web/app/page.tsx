const LIVE = 'https://www.manaslearning.com'

const SERVICES = [
  {icon: '🗣️', title: 'Speech and language', text: 'Support for children who are late to talk, hard to understand, or finding it difficult to put words together.', bg: 'bg-card-yellow/25'},
  {icon: '📚', title: 'Learning support', text: 'Help with reading, writing, maths and attention, including dyslexia and dyscalculia.', bg: 'bg-card-blue/25'},
  {icon: '🧩', title: 'Sensory and behaviour', text: 'Understanding stimming, sensory needs and everyday regulation at home and at school.', bg: 'bg-card-green/20'},
  {icon: '👨‍👩‍👧', title: 'Parent guidance', text: 'Practical, step-by-step ideas so families know what to try between sessions.', bg: 'bg-primary/15'},
]
const CONSULTS = [
  {title: 'Free consultation', tag: 'Free', text: 'A short first conversation to share your concerns and find out what support fits.'},
  {title: 'Expert consultation', tag: 'Specialist', text: 'A deeper session with a specialist to look at your child’s needs in detail.'},
  {title: 'IEP consultation', tag: 'School support', text: 'Help planning an Individualised Education Plan together with your child’s school.'},
]
const FEELS = [
  {icon: '🔊', name: 'Autism', line: 'Find one thing while sounds and sights compete for you.', bg: 'bg-card-blue/25'},
  {icon: '⚡', name: 'ADHD', line: 'Stay on one task while the world keeps interrupting.', bg: 'bg-card-yellow/30'},
  {icon: '🔤', name: 'Dyslexia', line: 'Read a passage where the letters will not sit still.', bg: 'bg-primary/15'},
  {icon: '💬', name: 'Speech', line: 'Push through a word that will not come out in time.', bg: 'bg-card-green/20'},
]
const STEPS = [
  ['1', 'Feel it and ask', 'Try a simulation or chat with Milo to see what a child may be experiencing.'],
  ['2', 'Book a consultation', 'Choose a free or expert consultation at a time that suits you.'],
  ['3', 'Get a plan', 'Leave with clear next steps for home and school.'],
]
const TOPICS = ['Stimming', 'Sensory integration', 'Dyslexia', 'Dyscalculia', 'ADHD', 'Speech and language']

const btn = 'inline-flex items-center justify-center rounded-full px-6 py-3 text-xl transition'
const lift = 'transition duration-200 hover:-translate-y-1 hover:shadow-lg'

export default function Home() {
  return (
    <main>
      <section className="bg-gradient-to-b from-card-yellow/30 to-background">
        <div className="container mx-auto grid items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20 lg:px-8">
          <div className="space-y-6">
            <p className="inline-block rounded-full bg-white px-4 py-1 text-lg text-primary shadow-sm">Learning support for children</p>
            <h1 className="text-5xl leading-tight text-black md:text-6xl">Your child’s progress starts with <span className="text-primary">one step</span></h1>
            <p className="text-xl text-black/70 md:text-2xl">Speech, learning and sensory support for children, and guidance for the parents who love them. Start with a free conversation.</p>
            <div className="flex flex-wrap gap-3">
              <a href="/consult" className={`${btn} bg-primary text-white shadow-md hover:bg-brand-orange`}>Book a consultation</a>
              <a href="/experience" className={`${btn} border-2 border-card-green bg-white text-black hover:bg-card-green/15`}>Experience what they feel</a>
            </div>
          </div>
          <a href="/milo" className={`block rounded-3xl bg-white p-4 shadow-xl ring-1 ring-black/5 ${lift}`}>
            <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-card-green to-primary px-4 py-3 text-white">
              <span className="text-3xl">🦉</span>
              <div className="leading-tight"><p className="text-xl">Milo</p><p className="text-sm opacity-90">Ask me anything</p></div>
            </div>
            <div className="space-y-3 p-4 text-lg">
              <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2 text-white">What is sensory integration?</div>
              <div className="w-fit max-w-[92%] rounded-2xl rounded-bl-md bg-background px-4 py-2 text-black">It’s how the brain organises input from many senses at once, so a child can respond smoothly in busy places.</div>
            </div>
            <p className="pb-1 text-center text-lg text-primary">Chat with Milo →</p>
          </a>
        </div>
      </section>

      <section id="experience" className="container mx-auto scroll-mt-28 px-4 py-14 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-3 text-center">
          <p className="text-lg text-card-green">New: interactive</p>
          <h2 className="text-4xl text-black md:text-5xl">Experience what they feel</h2>
          <p className="text-xl text-black/70 md:text-2xl">A checklist tells you the facts. These four short simulations put you inside a child’s morning for a few minutes, then show the Indian data and what helps.</p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEELS.map((f) => (
            <a key={f.name} href="/experience" className={`group rounded-3xl p-6 ${f.bg} ${lift}`}>
              <span className="text-5xl">{f.icon}</span>
              <h3 className="mt-3 text-2xl text-black">{f.name}</h3>
              <p className="mt-2 text-lg text-black/70">{f.line}</p>
              <p className="mt-4 text-lg text-primary group-hover:underline">Try it →</p>
            </a>
          ))}
        </div>
        <div className="mt-8 text-center">
          <a href="/experience" className={`${btn} bg-primary text-white shadow-md hover:bg-brand-orange`}>Start the experience</a>
          <p className="mt-3 text-base text-black/60">Built to build empathy, not to diagnose.</p>
        </div>
      </section>

      <section id="about" className="scroll-mt-28 bg-card-yellow/15 py-14">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <h2 className="text-4xl text-black md:text-5xl">About Manas Learning</h2>
            <p className="text-xl text-black/70 md:text-2xl">We work with children and families to understand how each child learns, communicates and experiences the world, and to turn that understanding into support that fits.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map(([n, t, d]) => (
              <div key={n} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xl text-white">{n}</span>
                <h3 className="mt-4 text-2xl text-black">{t}</h3>
                <p className="mt-2 text-lg text-black/70">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="container mx-auto scroll-mt-28 px-4 py-14 lg:px-8">
        <h2 className="text-center text-4xl text-black md:text-5xl">Our services</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <div key={s.title} className={`rounded-3xl p-6 ${s.bg}`}>
              <span className="text-4xl">{s.icon}</span>
              <h3 className="mt-3 text-2xl text-black">{s.title}</h3>
              <p className="mt-2 text-lg text-black/70">{s.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {CONSULTS.map((c) => (
            <a key={c.title} href="/consult" className={`group rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 ${lift}`}>
              <span className="rounded-full bg-card-green/20 px-3 py-1 text-sm text-black">{c.tag}</span>
              <h3 className="mt-3 text-2xl text-black">{c.title}</h3>
              <p className="mt-2 text-lg text-black/70">{c.text}</p>
              <p className="mt-4 text-lg text-primary group-hover:underline">Book now →</p>
            </a>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-14 lg:px-8">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-gradient-to-r from-card-green to-primary p-8 text-center text-white md:flex-row md:text-left">
          <span className="text-7xl">🦉</span>
          <div className="flex-1 space-y-2">
            <h2 className="text-3xl md:text-4xl">Questions on your mind? Ask Milo.</h2>
            <p className="text-xl opacity-95">Milo answers everyday questions about stimming, sensory needs, speech and learning using our guides. It shares general guidance, not medical advice, and points you to a human when it should.</p>
          </div>
          <a href="/milo" className={`${btn} bg-white text-black hover:bg-background`}>Chat with Milo</a>
        </div>
      </section>

      <section id="know-more" className="container mx-auto scroll-mt-28 px-4 pb-14 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-5 text-center">
          <h2 className="text-4xl text-black md:text-5xl">Know more</h2>
          <p className="text-xl text-black/70">Plain-language guides to what parents ask about most.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {TOPICS.map((t) => (
              <a key={t} href={LIVE + '/conditions'} className="rounded-full bg-card-blue/25 px-5 py-2 text-lg text-black transition hover:bg-card-blue/45">{t}</a>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-28 bg-card-yellow/15 py-14">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-center text-4xl text-black md:text-5xl">Contact us</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <h3 className="text-2xl text-black">📍 Visit</h3>
              <p className="mt-2 text-lg text-black/70">10G, Sapphire, Olympia Opaline, OMR, Navalur, Chennai, Tamilnadu, India - 600130.</p>
              <a href="https://www.google.com/maps/search/?api=1&query=Olympia+Opaline+Navalur+Chennai" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-lg text-primary underline">Get directions</a>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <h3 className="text-2xl text-black">📞 Call or write</h3>
              <p className="mt-2 text-lg text-black/70"><a className="hover:text-primary" href="tel:+919884031293">(+91) 988-403-1293</a><br /><a className="hover:text-primary" href="mailto:support@manaslearning.com">support@manaslearning.com</a></p>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <h3 className="text-2xl text-black">🗓️ Book a time</h3>
              <p className="mt-2 text-lg text-black/70">Pick a slot for a free or expert consultation.</p>
              <a href="/consult" className="mt-3 inline-block text-lg text-primary underline">Book a consultation</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
