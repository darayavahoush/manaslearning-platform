const LIVE = 'https://www.manaslearning.com'
const WHATSAPP = 'https://chat.whatsapp.com/IeobE2Zx5HMBft0xQEK7Vh?mode=gi_t'

const FEELS = [
  {name: 'Autism', line: 'Find one thing while sounds and sights compete for your attention.', tone: 'border-card-blue/60 bg-card-blue/15'},
  {name: 'ADHD', line: 'Stay on one task while the world keeps interrupting.', tone: 'border-card-yellow/70 bg-card-yellow/20'},
  {name: 'Dyslexia', line: 'Read a passage where the letters will not sit still.', tone: 'border-primary/50 bg-primary/10'},
  {name: 'Speech', line: 'Push through a word that will not come out in time.', tone: 'border-card-green/60 bg-card-green/15'},
]
const SERVICES = [
  {title: 'Speech and language', text: 'Support for children who are late to talk, hard to understand, or finding it difficult to put words together.'},
  {title: 'Learning support', text: 'Help with reading, writing, maths and attention, including dyslexia and dyscalculia.'},
  {title: 'Sensory and behaviour', text: 'Understanding stimming, sensory needs and everyday regulation at home and at school.'},
  {title: 'Parent guidance', text: 'Practical, step-by-step ideas so families know what to try between sessions.'},
]
const CONSULTS = [
  {title: 'Free consultation', tag: 'Free', text: 'A short first conversation to share your concerns and find out what support fits.'},
  {title: 'Expert consultation', tag: 'Specialist', text: 'A deeper session with a specialist to look at your child’s needs in detail.'},
  {title: 'IEP consultation', tag: 'School support', text: 'Help planning an Individualised Education Plan together with your child’s school.'},
]

const h2 = 'font-poppins text-3xl font-bold text-black md:text-4xl'
const sub = 'text-2xl text-text-brown'
const card = 'rounded-2xl border bg-white p-6 transition duration-200 hover:-translate-y-1 hover:shadow-md'
const btnOrange = 'inline-flex items-center justify-center rounded-xl border border-primary bg-primary/10 px-8 py-5 text-2xl text-primary transition hover:bg-primary hover:text-white'
const btnGreen = 'inline-flex items-center justify-center rounded-xl border border-card-green bg-card-green/10 px-8 py-5 text-2xl text-card-green transition hover:bg-card-green hover:text-white'

export default function Home() {
  return (
    <main>
      <section className="bg-cream">
        <div className="container mx-auto flex flex-col items-center px-4 py-20 text-center md:py-28">
          <h1 className="font-poppins max-w-4xl text-4xl font-bold leading-tight text-black md:text-6xl">Your child&apos;s progress starts with one step</h1>
          <p className="mt-6 max-w-3xl text-2xl text-text-brown md:text-3xl">Take the first step toward clarity, confidence, and better learning. We&apos;ll guide you from here.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a href="/consult" className={btnOrange}>Book Expert Consultation</a>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className={btnGreen}>Join Community</a>
          </div>
        </div>
      </section>

      <section id="experience" className="container mx-auto scroll-mt-28 px-4 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-3 text-center">
          <h2 className={h2}>Experience what they feel</h2>
          <p className={sub}>A checklist gives you the facts. These four short simulations put you inside a child&apos;s morning for a few minutes, then show the Indian data and what helps.</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEELS.map((f) => (
            <a key={f.name} href="/experience" className={`${card} ${f.tone} group`}>
              <h3 className="font-poppins text-xl font-bold text-black">{f.name}</h3>
              <p className="mt-2 text-xl text-text-brown">{f.line}</p>
              <p className="mt-4 text-xl text-primary group-hover:underline">Try it →</p>
            </a>
          ))}
        </div>
        <div className="mt-8 text-center">
          <a href="/experience" className={btnOrange}>Start the experience</a>
          <p className="mt-3 text-lg text-black/60">Built to build empathy, not to diagnose.</p>
        </div>
      </section>

      <section id="about" className="scroll-mt-28 bg-cream py-16">
        <div className="container mx-auto max-w-3xl space-y-4 px-4 text-center">
          <h2 className={h2}>About Manas Learning</h2>
          <p className={sub}>We work with children and families to understand how each child learns, communicates and experiences the world, and to turn that understanding into support that fits.</p>
        </div>
      </section>

      <section id="services" className="container mx-auto scroll-mt-28 px-4 py-16 lg:px-8">
        <h2 className={`${h2} text-center`}>Our services</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <div key={s.title} className="rounded-2xl border border-card-yellow/50 bg-card-yellow/10 p-6">
              <h3 className="font-poppins text-xl font-bold text-black">{s.title}</h3>
              <p className="mt-2 text-xl text-text-brown">{s.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {CONSULTS.map((c) => (
            <a key={c.title} href="/consult" className={`${card} border-black/10 group`}>
              <span className="rounded-full bg-card-green/15 px-3 py-1 text-base text-card-green">{c.tag}</span>
              <h3 className="font-poppins mt-3 text-xl font-bold text-black">{c.title}</h3>
              <p className="mt-2 text-xl text-text-brown">{c.text}</p>
              <p className="mt-4 text-xl text-primary group-hover:underline">Book now →</p>
            </a>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16 lg:px-8">
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-card-green/50 bg-card-green/10 p-8 text-center md:flex-row md:text-left">
          <img src="/logo.png" alt="" className="h-16 w-16 object-contain" />
          <div className="flex-1">
            <h2 className="font-poppins text-2xl font-bold text-black md:text-3xl">Questions on your mind? Ask Milo.</h2>
            <p className="mt-2 text-xl text-text-brown">Milo answers everyday questions about stimming, sensory needs, speech and learning using our guides. General guidance, not medical advice, and it points you to a human when it should.</p>
          </div>
          <a href="/milo" className={btnGreen}>Chat with Milo</a>
        </div>
      </section>

      <section id="contact" className="scroll-mt-28 bg-cream py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className={`${h2} text-center`}>Contact us</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <div className={`${card} border-black/10`}>
              <h3 className="font-poppins text-xl font-bold text-black">Visit</h3>
              <p className="mt-2 text-xl text-text-brown">10G, Sapphire, Olympia Opaline, OMR, Navalur, Chennai, Tamilnadu, India - 600130.</p>
              <a href="https://www.google.com/maps/search/?api=1&query=Olympia+Opaline+Navalur+Chennai" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xl text-primary underline">Get directions</a>
            </div>
            <div className={`${card} border-black/10`}>
              <h3 className="font-poppins text-xl font-bold text-black">Call or write</h3>
              <p className="mt-2 text-xl text-text-brown"><a className="hover:text-primary" href="tel:+919884031293">(+91) 988-403-1293</a><br /><a className="hover:text-primary" href="mailto:support@manaslearning.com">support@manaslearning.com</a></p>
            </div>
            <div className={`${card} border-black/10`}>
              <h3 className="font-poppins text-xl font-bold text-black">Book a time</h3>
              <p className="mt-2 text-xl text-text-brown">Pick a slot for a free or expert consultation.</p>
              <a href="/consult" className="mt-3 inline-block text-xl text-primary underline">Book a consultation</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
