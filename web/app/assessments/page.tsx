'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

interface Screener {
  id: string; title: string; price: string; duration: string; desc: string; badge: string
  link: string; cta: string; image: string | null; alt: string; from: string; to: string; color: string
  chips: string[]; isNew?: boolean; cat: string
  extra?: { href: string; label: string }; fit?: 'cover' | 'contain'
}

const CATS = ['All', 'Reading, writing & maths', 'Speech & language', 'Sensory & movement', 'Thinking & planning']

const SCREENERS: Screener[] = [
  { id: 'dyslexia', cat: 'Reading, writing & maths', title: 'Dyslexia Reading & Phonological Screener', price: '₹299', duration: '20 mins', badge: 'Reading & Sounds', link: '/assessments/dyslexia', cta: 'Play the quest →', image: '/decor/itw/dyslexia-sticker.webp', alt: 'Dyslexia reading screener', from: '#E4EFE6', to: '#CFE2D6', color: '#9DC3AE', chips: ['Rhyme echoes', 'Letter moths'], isNew: true, extra: { href: '/assessments/questions/dyslexia', label: 'Reading questions' }, desc: 'Play activities about rhymes, first sounds, letter shapes and sound order. Not a diagnosis.' },
  { id: 'dyscalculia', cat: 'Reading, writing & maths', title: 'Dyscalculia Math & Number Sense Screener', price: '₹299', duration: '20 mins', badge: 'Numbers & Maths', link: '/experience?module=dyscalculia', cta: 'View Details →', image: '/decor/itw/dyscalculia-sticker.webp', alt: 'Dyscalculia math screener', from: '#E0EFEC', to: '#C9E1DC', color: '#9CCBC3', chips: ['Quick counting', 'Number line'], desc: 'Play activities about counting at a glance, number lines and simple maths reasoning.' },
  { id: 'dysgraphia', cat: 'Reading, writing & maths', title: 'Dysgraphia & Fine Motor Screener', price: '₹299', duration: '25 mins', badge: 'Motor & Writing', link: '/experience?module=dysgraphia', cta: 'View Details →', image: '/decor/itw/dysgraphia-sticker.webp', alt: 'Dysgraphia fine motor screener', from: '#F7E9DC', to: '#EFD3BC', color: '#E3AE8A', chips: ['Tracing', 'Writing stamina'], desc: 'Play activities about tracing, pencil grip and how writing feels over a few minutes.' },
  { id: 'speech', cat: 'Speech & language', title: 'Speech & Language Articulation Screener', price: '₹600', duration: '30 mins', badge: 'Speech & Language', link: '/experience?module=speech', cta: 'View Details →', image: '/decor/itw/speech-sticker.webp', alt: 'Speech and language articulation', fit: 'contain', from: '#F7E4E3', to: '#EFCDD0', color: '#E2A5AC', chips: ['Listening', 'Speaking'], desc: 'Play activities about understanding words, making clear sounds and vocabulary.' },
  { id: 'spd', cat: 'Sensory & movement', title: 'Sensory Processing (SPD) Screener', price: '₹299', duration: '20 mins', badge: 'Sensory Comfort', link: '/experience?module=autism', cta: 'View Details →', image: '/decor/itw/itw-autism-sticker.webp', alt: 'Sensory processing profile', from: '#E5ECF5', to: '#CFDCEC', color: '#A5BEDD', chips: ['Sound comfort', 'Touch comfort'], desc: 'Play activities about how light, sound and touch feel across daily routines.' },
  { id: 'nvld', cat: 'Thinking & planning', title: 'Non-Verbal Learning Disability (NVLD) Screener', price: '₹299', duration: '25 mins', badge: 'Spatial & Social', link: '/experience?module=executive', cta: 'View Details →', image: '/decor/itw/auditory-sticker.webp', alt: 'Non-verbal learning screener', from: '#ECE8F4', to: '#DAD2EA', color: '#BDB0DC', chips: ['Spatial puzzles', 'Reading faces'], desc: 'Play activities about spatial puzzles, facial expressions and body language.' },
  { id: 'dcd', cat: 'Sensory & movement', title: 'Developmental Coordination (DCD / Dyspraxia) Screener', price: '₹299', duration: '25 mins', badge: 'Motor Planning', link: '/consult', cta: 'View Details →', image: null, alt: 'Developmental coordination', from: '#F7EED8', to: '#EFDDB4', color: '#E6C07F', chips: ['Movement planning', 'Balance'], desc: 'Play activities about balance, planning movements and coordination.' },
  { id: 'executive', cat: 'Thinking & planning', title: 'Executive Functioning & Working Memory Screener', price: '₹299', duration: '20 mins', badge: 'Planning & Memory', link: '/experience?module=executive', cta: 'View Details →', image: '/decor/itw/executive-sticker.webp', alt: 'Executive functioning and memory', from: '#E8F0E2', to: '#D4E4CB', color: '#A9C9A0', chips: ['Planning', 'Working memory'], desc: 'Play activities about planning, getting started and remembering steps.' },
]

const QUESTS = [
  { id: 'adhd', kicker: 'Attention & Focus Quest', title: 'Manas FocusTrack™ ADHD Screener', img: '/decor/itw/quest-sky-citadel-banner.webp', alt: 'Sky Citadel quest', glow: '#E3B873', accent: '#7E5320', btn: 'linear-gradient(90deg,#F2DDB0,#E8C98A)', href: '/assessments/adhd', quiz: '/assessments/questions/adhd', cta: 'Start Sky Citadel ADHD Quest →',
    chips: ['Spotting game', 'Steering game', 'Sequence memory', 'Patience game'],
    blurb: 'A fantasy quest for kids (Chronicles of the Sunbird: Sky Citadel Quest) with a plain-language summary for parents. Tap when the sunbird swoops, steer past distractions, remember star sequences and practise patience.' },
  { id: 'autism', kicker: 'Social & Sensory Comfort Quest', title: 'Manas PRISM™ Autism Screener', img: '/decor/itw/quest-lumina-groves-banner.webp', alt: 'Whispering Groves quest', glow: '#8DBFB3', accent: '#34665D', btn: 'linear-gradient(90deg,#C4E0D6,#A8D0C3)', href: '/assessments/autism', quiz: '/assessments/questions/autism', cta: 'Start Lumina Groves Autism Quest →',
    chips: ['Gaze-following game', 'Feelings match', 'Comfort preferences', 'Sorting game'],
    blurb: 'A fantasy quest for kids (Whispering Groves of Lumina: Crystal Lantern Quest) with a plain-language summary for parents. Follow a friend\u2019s gaze, match feelings, set cosy light and sound levels and sort potions by changing rules.' },
]

function Tilt({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const move = (e: React.PointerEvent) => {
    const el = ref.current
    if (!el || e.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-4px)`
  }
  return <div ref={ref} style={style} className={`hb-tilt ${className}`} onPointerMove={move} onPointerLeave={() => { if (ref.current) ref.current.style.transform = '' }}>{children}</div>
}

function PlateArt({ color, alt }: { color: string; alt: string }) {
  return (
    <svg role="img" aria-label={alt} viewBox="0 0 400 400" className="absolute inset-0 h-full w-full">
      <defs>
        <filter id="hb-wc" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="14" />
          <feGaussianBlur stdDeviation=".8" />
        </filter>
      </defs>
      <g filter="url(#hb-wc)" opacity=".92">
        <path d="M-10 305 C90 245 150 335 250 275 S380 235 420 255 L420 420 L-10 420Z" fill="#CFE0D0" />
        <path d="M-10 340 C110 300 190 370 290 325 S390 300 420 315 L420 420 L-10 420Z" fill="#B9D2BE" opacity=".8" />
        <ellipse cx="95" cy="292" rx="52" ry="24" fill={color} />
        <ellipse cx="205" cy="246" rx="46" ry="21" fill="#E2B3B0" />
        <ellipse cx="300" cy="196" rx="40" ry="18" fill="#A5BEDD" />
        <ellipse cx="338" cy="138" rx="30" ry="14" fill="#E6C07F" />
        <path d="M95 262 C120 215 170 230 205 224 M205 226 C240 190 280 205 300 178 M300 178 C312 160 326 156 338 124" stroke="#8A7F6E" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" fill="none" opacity=".55" />
        <path d="M338 84 l8 18 19 2 -14 13 4 19 -17 -10 -17 10 4 -19 -14 -13 19 -2z" fill="#E6C07F" />
      </g>
    </svg>
  )
}

const Trail = () => (
  <div className="hb-trail" aria-hidden="true">
    {[0, 1, 2, 3, 4, 5, 6].map((i) => <span key={i} style={{ animationDelay: `${i * 0.35}s` }} />)}
  </div>
)

export default function AssessmentsHubPage() {
  const root = useRef<HTMLElement>(null)
  const [cat, setCat] = useState('All')
  const shown = SCREENERS.filter((s) => cat === 'All' || s.cat === cat)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.classList.add('hb-js')
    const items = Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (calm) { items.forEach((n) => n.classList.add('hb-in')); return }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('hb-in'); io.unobserve(e.target) } }), { threshold: 0.12 })
    items.forEach((n) => io.observe(n))
    let raf = 0
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => el.style.setProperty('--sy', String(Math.min(window.scrollY, 900)))) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { io.disconnect(); window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [])

  return (
    <main ref={root} data-no-listen="true" className="relative min-h-screen hb-paper isolate bg-gradient-to-b from-[#F8F1E2] via-[#FBF6EA] to-[#F3EBDA] font-poppins text-[#2F2A24] overflow-hidden">
      <style>{CSS}</style>

      {/* HERO: two quest worlds meeting in the middle */}
      <section className="relative isolate overflow-hidden text-[#2F2A24]" style={{ minHeight: 560 }}>
        <div className="absolute inset-0 -z-10 bg-[#F4ECDC]" />
        <img src="/decor/itw/quest-sky-citadel-banner.webp" alt="" className="hb-par hb-maskL absolute inset-y-0 left-0 -z-10 h-[115%] w-[62%] object-cover" style={{ ['--k' as string]: 0.16, filter: 'saturate(.5) brightness(1.12) contrast(.92)', opacity: 0.8 }} />
        <img src="/decor/itw/quest-lumina-groves-banner.webp" alt="" className="hb-par hb-maskR absolute inset-y-0 right-0 -z-10 h-[115%] w-[62%] object-cover" style={{ ['--k' as string]: 0.1, filter: 'saturate(.5) brightness(1.12) contrast(.92)', opacity: 0.8 }} />
        <div className="absolute inset-0 -z-10" style={{ background: 'radial-gradient(ellipse at 50% 46%, rgba(251,246,236,.93) 0%, rgba(251,246,236,.7) 50%, rgba(251,246,236,.2) 100%)' }} />
        <div className="hb-flies absolute inset-0 -z-10" aria-hidden="true">
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={i} className="hb-fly" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 90}%`, animationDelay: `${(i % 7) * 0.7}s`, animationDuration: `${5 + (i % 5)}s` }} />
          ))}
        </div>

        <div className="relative mx-auto max-w-4xl px-4 pt-16 pb-36 text-center">
          <div className="inline-flex items-center rounded-full border border-[#D9CDB4] bg-[#FFFCF5]/85 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#3F6F5C]">Play-Based Screening Activities • Not a Diagnosis</div>
          <h1 className="font-patrick mt-5 text-4xl sm:text-5xl md:text-7xl leading-tight" style={{ textShadow: '0 2px 20px rgba(251,246,236,.95)' }}>
            Step Into a Quest.<br /><span className="text-[#4F7F6E]">Understand Your Child Through Play.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-[#3A342B]" style={{ textShadow: '0 1px 12px rgba(251,246,236,.95)' }}>
            Fantasy quests that show how your child responds to attention, social, sensory and reading tasks, with a plain-language summary you can take to a clinician.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[#5A5247]" style={{ textShadow: '0 1px 10px rgba(251,246,236,.95)' }}>
            These are screening-style play activities. They are not a diagnostic tool and do not replace an evaluation by a qualified professional.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#quests" className="min-h-[44px] inline-flex items-center rounded-full border border-[#D9B877] bg-[#EFD7A0] px-7 py-3 text-sm font-bold text-[#3B2D12] shadow-sm hover:scale-105 transition-transform">Choose a quest</a>
            <Link href="/assessments/dyslexia" prefetch={false} className="min-h-[44px] inline-flex items-center rounded-full border-2 border-[#8A7F6E]/50 bg-[#FFFCF5]/60 px-6 py-3 text-sm font-bold text-[#3A342B] backdrop-blur hover:bg-[#FFFCF5]/90 transition-colors">New: The Whispering Library (reading quest)</Link>
          </div>
        </div>
        <img src="/decor/milo-owl.webp" alt="" aria-hidden="true" className="hb-owl absolute bottom-14 right-[6%] hidden h-24 w-24 sm:block" />
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 50 C240 100 480 0 720 40 C960 80 1200 10 1440 50 L1440 90 L0 90Z" fill="#F8F1E2" /></svg>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* FLAGSHIP QUESTS */}
        <section id="quests" className="pt-10 pb-6 scroll-mt-20">
          <div data-reveal className="hb-rv mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#8F5A2C]">Flagship Interactive Quests</div>
              <h2 className="font-patrick text-3xl sm:text-5xl text-[#2F2A24]">Pick Your Adventure</h2>
            </div>
            <span className="self-start rounded-full bg-[#D9A66B]/15 border border-[#D9A66B]/40 px-3.5 py-1 text-xs font-bold text-[#8A5526]">Reaction-Time and Accuracy Tracking</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {QUESTS.map((q, i) => (
              <div key={q.id} data-reveal className="hb-rv" style={{ transitionDelay: `${i * 120}ms` }}>
                <Tilt className="group relative overflow-hidden rounded-3xl bg-[#FFFCF6] shadow-xl h-full flex flex-col" style={{ boxShadow: `0 18px 44px -24px ${q.glow}aa`, border: `1.5px solid ${q.glow}77` }}>
                  <div className="relative h-64 overflow-hidden">
                    <img src={q.img} alt={q.alt} loading="lazy" style={{ filter: 'saturate(.66) brightness(1.05)' }} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2B2620]/75 via-[#2B2620]/15 to-transparent" />
                    <span className="absolute top-3 right-3 rounded-full bg-[#2B2620]/45 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white border border-white/30 backdrop-blur">Play-based • Not a diagnosis</span>
                    <div className="absolute bottom-0 p-6">
                      <span className="rounded-full bg-[#2B2620]/45 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">{q.kicker}</span>
                      <h3 className="font-patrick mt-1 text-3xl font-bold text-white">{q.title}</h3>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-7">
                    <div>
                      <div className="mb-4 flex flex-wrap gap-2">
                        {q.chips.map((c) => <span key={c} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: `${q.glow}1f`, color: q.accent }}>{c}</span>)}
                      </div>
                      <p className="text-sm leading-relaxed text-[#5A5247]">{q.blurb}</p>
                    </div>
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#EFE7D6] pt-5">
                      <div><span className="text-2xl font-bold text-[#2F2A24]">₹799</span><span className="ml-2 text-xs text-[#6F665A]">/ $15 USD (Play activity & parent summary)</span></div>
                      <div className="flex flex-wrap items-center gap-3"><Link href={q.href} prefetch={false} className="min-h-[44px] inline-flex items-center rounded-full px-6 py-3 text-sm font-bold text-[#33302B] shadow-sm transition-transform hover:scale-105" style={{ background: q.btn, border: `1px solid ${q.glow}88` }}>{q.cta}</Link><Link href={q.quiz} prefetch={false} className="inline-flex min-h-[44px] items-center text-sm font-semibold text-[#4A4238] underline decoration-[#8A7F6E]/50 underline-offset-4 hover:text-[#2F2A24]">Question version</Link></div>
                    </div>
                  </div>
                </Tilt>
              </div>
            ))}
          </div>
        </section>

        <Trail />

        {/* WHY PLAY */}
        <section data-reveal className="hb-rv my-14 rounded-3xl border border-[#E6D8B8] bg-gradient-to-b from-[#F4E8CE]/70 to-[#FBF5E8]/80 p-8 md:p-12 shadow-sm">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="font-patrick mb-3 text-3xl sm:text-4xl text-[#6B4E2E]">Why Play-Based Activities?</h2>
            <p className="text-sm leading-relaxed text-[#7C6246]">Many children find dry questionnaires stressful. Games can feel lower-pressure and show how a child approaches a task. They complement, and never replace, a professional evaluation.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[#E2E8F0] bg-[#FFFCF6] p-6 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-[#A5564D]"><span className="font-mono text-sm">!</span> What these activities cannot do</h3>
              <ul className="list-inside list-disc space-y-2.5 text-xs leading-relaxed text-[#6F665A]">
                <li>They do not diagnose any condition.</li>
                <li>There are no age norms or cut-off scores yet, so a child is not compared with other children.</li>
                <li>One session can be affected by mood, tiredness, the device and the room.</li>
                <li>They do not replace validated parent and teacher questionnaires or a clinical assessment.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-[#8DBFA9]/60 bg-[#FFFCF6] p-6 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-[#3F7F68]"><span className="font-mono text-sm">✓</span> What a clinician gets</h3>
              <ul className="list-inside list-disc space-y-2.5 text-xs leading-relaxed text-[#3A342B]">
                <li>Reaction times, accuracy, missed and early responses recorded during play.</li>
                <li>Observations shown as recorded, not turned into scores or labels.</li>
                <li>A printable summary with questions to take to a clinician.</li>
                <li>A lower-pressure, play-based format that also notes what the child does well.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* DIRECTORY */}
        <section id="screeners" className="mb-20 scroll-mt-20">
          <div data-reveal className="hb-rv mb-6 text-center sm:text-left">
            <div className="text-xs font-bold uppercase tracking-wider text-[#36705C]">Screening Activity Directory</div>
            <h2 className="font-patrick mt-1 text-3xl sm:text-5xl text-[#2F2A24]">Targeted Developmental Screeners</h2>
            <p className="mt-1 max-w-2xl text-sm text-[#6F665A]">Explore play activities for speech, motor planning, maths, sensory comfort and reading.</p>
          </div>

          <div role="group" aria-label="Filter activities" className="mb-2 flex flex-wrap justify-center gap-2 sm:justify-start">
            {CATS.map((c) => (
              <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)} className="hb-fbtn" style={{ minHeight: 44 }}>{c}</button>
            ))}
          </div>
          <p className="mb-6 text-center text-xs text-[#6F665A] sm:text-left" aria-live="polite">Showing {shown.length} of {SCREENERS.length} activities</p>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {shown.map((s) => (
              <Tilt key={s.id} className="hb-pop group flex h-full flex-col overflow-hidden rounded-3xl border border-[#E6DCC6] bg-[#FFFCF6] shadow-sm hover:shadow-[0_18px_40px_-24px_rgba(110,90,60,.4)]">
                {/* illustration plate: square frame matches the 1024px art, so nothing is cropped or boxed */}
                <div className="hb-plate relative aspect-square w-full overflow-hidden" style={{ background: `radial-gradient(ellipse at 22% 20%, ${s.from} 0%, transparent 68%), radial-gradient(ellipse at 80% 85%, ${s.to} 0%, transparent 62%), #FFFCF5` }}>
                  {s.image ? (
                    <img src={s.image} alt={s.alt} loading="lazy" className={`hb-art absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-[1.03] ${s.fit === 'contain' ? 'object-contain hb-feather' : 'object-cover'}`} />
                  ) : (
                    <PlateArt color={s.color} alt={s.alt} />
                  )}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-5" style={{ background: 'linear-gradient(to top,#FFFCF6,rgba(255,252,246,0))' }} />
                  {s.isNew && <span className="absolute left-3 top-3 rounded-full bg-[#F0D9A0] px-2.5 py-0.5 text-[10px] font-bold uppercase text-[#5B4413]">New quest</span>}
                </div>
                <div className="flex flex-1 flex-col p-5 pt-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#4A4238]" style={{ background: `${s.color}66` }}>{s.badge}</span>
                    <span className="text-sm font-bold text-[#3F6F5C]">{s.price}</span>
                  </div>
                  <h3 className="font-patrick mb-2 text-xl leading-snug text-[#2F2A24]">{s.title}</h3>
                  <p className="mb-4 text-xs leading-relaxed text-[#6F665A]">{s.desc}</p>
                  <div className="mb-4 flex flex-wrap gap-1.5">{s.chips.map((c) => <span key={c} className="rounded-md bg-[#EFE7D6] px-2 py-0.5 text-[10px] font-semibold text-[#5A5247]">{c}</span>)}</div>
                  {s.extra && <Link href={s.extra.href} prefetch={false} className="mb-4 inline-flex min-h-[32px] items-center self-start text-xs font-semibold text-[#3F6F5C] underline decoration-[#3F6F5C]/40 underline-offset-4 hover:text-[#2F2A24]">{s.extra.label} →</Link>}
                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#EFE7D6] pt-3">
                    <span className="text-[11px] font-medium text-[#6F665A]">⏳ {s.duration}</span>
                    <Link href={s.link} prefetch={false} className="inline-flex min-h-[40px] items-center rounded-full px-4 py-2 text-xs font-bold text-[#33302B] transition-transform hover:scale-105" style={{ background: s.color }}>{s.cta}</Link>
                  </div>
                </div>
              </Tilt>
            ))}
          </div>
        </section>

        <section data-reveal className="hb-rv mb-16 flex flex-col items-center justify-between gap-6 rounded-3xl border border-[#C9DAC8] bg-gradient-to-r from-[#CFE0D0] via-[#DAE7D5] to-[#E7EDD4] p-8 text-center text-[#2F3B33] shadow-sm md:flex-row md:p-12 md:text-left">
          <div className="max-w-xl">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-[#42604B]">Expert Pediatric Support</div>
            <h3 className="font-patrick mb-2 text-3xl sm:text-4xl">Talk Through What You Noticed With Our Specialists</h3>
            <p className="text-sm leading-relaxed text-[#46544A]">Every completed quest gives you a plain-language summary. Book a 1-on-1 consultation with Manasi Valluri and our clinical team to talk through what you noticed and what to try next.</p>
          </div>
          <Link href="/consult" prefetch={false} className="min-h-[44px] inline-flex shrink-0 items-center rounded-full border border-[#B9CFBB] bg-[#FFFCF5] px-8 py-3.5 text-sm font-bold text-[#3F6F5C] shadow-sm transition-transform hover:scale-105">Book Free Discovery Consultation →</Link>
        </section>
      </div>
    </main>
  )
}

const CSS = `
.hb-maskL{-webkit-mask-image:linear-gradient(to right,#000 50%,transparent);mask-image:linear-gradient(to right,#000 50%,transparent)}
.hb-maskR{-webkit-mask-image:linear-gradient(to left,#000 50%,transparent);mask-image:linear-gradient(to left,#000 50%,transparent)}
.hb-par{transform:translate3d(0,calc(var(--sy,0)*var(--k,.1)*1px),0)}
.hb-fly{position:absolute;width:7px;height:7px;border-radius:50%;background:#E9C9A0;box-shadow:0 0 14px 6px #E9C9A066;filter:blur(1px);animation:hb-drift 6s ease-in-out infinite;opacity:.7}
.hb-fly:nth-child(3n){background:#E2B3B0;box-shadow:0 0 14px 6px #E2B3B055}
.hb-fly:nth-child(3n+1){background:#B9D2BE;box-shadow:0 0 14px 6px #B9D2BE55}
@keyframes hb-drift{0%,100%{transform:translate(0,0);opacity:.2}50%{transform:translate(14px,-22px);opacity:.95}}
.hb-owl{animation:hb-bob 3.2s ease-in-out infinite;filter:saturate(.8)}
@keyframes hb-bob{50%{transform:translateY(-8px)}}
.hb-js .hb-rv:not(.hb-in){opacity:0;transform:translateY(26px)}
.hb-rv{transition:opacity .7s ease,transform .7s ease}
.hb-tilt{transition:transform .25s ease,box-shadow .25s ease;will-change:transform}
.hb-trail{display:flex;justify-content:center;gap:18px;padding:18px 0}
.hb-trail span{width:13px;height:13px;border-radius:50%;background:#E6C98F;filter:blur(.6px);animation:hb-glow 2.6s ease-in-out infinite}
.hb-trail span:nth-child(3n){background:#E2B3B0}
.hb-trail span:nth-child(3n+1){background:#B9D2BE}
@keyframes hb-glow{0%,100%{opacity:.3;box-shadow:none}50%{opacity:.85;box-shadow:0 0 16px 6px #E6C98F66}}
.hb-orb{position:absolute;width:170px;height:170px;border-radius:50%;opacity:.4;filter:blur(28px);mix-blend-mode:multiply}
.hb-art{filter:saturate(.88) contrast(.97)}
.hb-feather{-webkit-mask-image:linear-gradient(to right,transparent,#000 10%,#000 90%,transparent),linear-gradient(to bottom,transparent,#000 10%,#000 90%,transparent);-webkit-mask-composite:source-in;mask-image:linear-gradient(to right,transparent,#000 10%,#000 90%,transparent),linear-gradient(to bottom,transparent,#000 10%,#000 90%,transparent);mask-composite:intersect}
.hb-plate{box-shadow:inset 0 0 0 1px rgba(110,90,60,.08)}
.hb-fbtn{border:1.5px solid #D9CDB4;background:#FFFCF5;color:#3A342B;border-radius:999px;padding:6px 16px;font-size:13px;font-weight:600;cursor:pointer;transition:background .15s}
.hb-fbtn:hover{background:#F4ECDC}
.hb-fbtn[aria-pressed=true]{background:#EFD7A0;border-color:#D9B877}
.hb-pop{animation:hb-popin .4s ease backwards}
@keyframes hb-popin{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.hb-paper::before{content:'';position:absolute;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse 42% 28% at 12% 22%,rgba(226,179,176,.22),transparent 70%),radial-gradient(ellipse 40% 30% at 88% 38%,rgba(165,190,221,.2),transparent 70%),radial-gradient(ellipse 45% 26% at 20% 70%,rgba(185,210,190,.22),transparent 70%),radial-gradient(ellipse 40% 28% at 85% 88%,rgba(230,201,143,.22),transparent 70%)}
.hb-paper::after{content:'';position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:.5;mix-blend-mode:multiply;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .45 0 0 0 0 .38 0 0 0 0 .3 0 0 0 .14 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
a:focus-visible,button:focus-visible{outline:3px solid #2F2A24;outline-offset:3px}
@media (prefers-reduced-motion:reduce){.hb-pop{animation:none!important}.hb-par,.hb-fly,.hb-owl,.hb-sticker,.hb-trail span{animation:none!important;transform:none!important}.hb-rv,.hb-tilt{transition:none!important}.hb-js .hb-rv:not(.hb-in){opacity:1;transform:none}}
`
