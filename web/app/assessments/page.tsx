'use client'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

interface Screener {
  id: string; title: string; price: string; duration: string; desc: string; badge: string
  link: string; cta: string; image: string; alt: string; from: string; to: string; color: string
  chips: string[]; isNew?: boolean
}

const SCREENERS: Screener[] = [
  { id: 'dyslexia', title: 'Dyslexia Reading & Phonological Screener', price: '₹299', duration: '20 mins', badge: 'Reading & Sounds', link: '/assessments/dyslexia', cta: 'Play the quest →', image: '/decor/itw/dyslexia-sticker.webp', alt: 'Dyslexia reading screener', from: '#ECFDF5', to: '#D1FAE5', color: '#05B076', chips: ['Rhyme echoes', 'Letter moths'], isNew: true, desc: 'Play activities about rhymes, first sounds, letter shapes and sound order. Not a diagnosis.' },
  { id: 'dyscalculia', title: 'Dyscalculia Math & Number Sense Assessment', price: '₹299', duration: '20 mins', badge: 'Numbers & Maths', link: '/experience?module=dyscalculia', cta: 'View Details →', image: '/decor/itw/dyscalculia-sticker.webp', alt: 'Dyscalculia math assessment', from: '#F0FDFA', to: '#CCFBF1', color: '#0D9488', chips: ['Quick counting', 'Number line'], desc: 'Play activities about counting at a glance, number lines and simple maths reasoning.' },
  { id: 'dysgraphia', title: 'Dysgraphia & Fine Motor Assessment', price: '₹299', duration: '25 mins', badge: 'Motor & Writing', link: '/experience?module=dysgraphia', cta: 'View Details →', image: '/decor/itw/dysgraphia-sticker.webp', alt: 'Dysgraphia fine motor assessment', from: '#FFF7ED', to: '#FFEDD5', color: '#C2410C', chips: ['Tracing', 'Writing stamina'], desc: 'Play activities about tracing, pencil grip and how writing feels over a few minutes.' },
  { id: 'speech', title: 'Speech & Language Articulation Assessment', price: '₹600', duration: '30 mins', badge: 'Speech & Language', link: '/experience?module=speech', cta: 'View Details →', image: '/decor/itw/speech-sticker.webp', alt: 'Speech and language articulation', from: '#FFF1F2', to: '#FFE4E6', color: '#E11D48', chips: ['Listening', 'Speaking'], desc: 'Play activities about understanding words, making clear sounds and vocabulary.' },
  { id: 'spd', title: 'Sensory Processing Disorder (SPD) Profile', price: '₹299', duration: '20 mins', badge: 'Sensory Comfort', link: '/experience?module=autism', cta: 'View Details →', image: '/decor/itw/itw-autism-sticker.webp', alt: 'Sensory processing profile', from: '#EFF6FF', to: '#DBEAFE', color: '#2563EB', chips: ['Sound comfort', 'Touch comfort'], desc: 'Play activities about how light, sound and touch feel across daily routines.' },
  { id: 'nvld', title: 'Non-Verbal Learning Disability (NVLD) Screener', price: '₹299', duration: '25 mins', badge: 'Spatial & Social', link: '/experience?module=executive', cta: 'View Details →', image: '/decor/itw/auditory-sticker.webp', alt: 'Non-verbal learning screener', from: '#FAF5FF', to: '#EDE9FE', color: '#7C3AED', chips: ['Spatial puzzles', 'Reading faces'], desc: 'Play activities about spatial puzzles, facial expressions and body language.' },
  { id: 'dcd', title: 'Developmental Coordination Disorder (DCD / Dyspraxia)', price: '₹299', duration: '25 mins', badge: 'Motor Planning', link: '/consult', cta: 'View Details →', image: '/decor/itw/itw-landing-how-try.webp', alt: 'Developmental coordination', from: '#FFFBEB', to: '#FEF3C7', color: '#D97706', chips: ['Movement planning', 'Balance'], desc: 'Play activities about balance, planning movements and coordination.' },
  { id: 'executive', title: 'Executive Functioning & Working Memory Screener', price: '₹299', duration: '20 mins', badge: 'Planning & Memory', link: '/experience?module=executive', cta: 'View Details →', image: '/decor/itw/executive-sticker.webp', alt: 'Executive functioning and memory', from: '#F0FDF4', to: '#DCFCE7', color: '#16A34A', chips: ['Planning', 'Working memory'], desc: 'Play activities about planning, getting started and remembering steps.' },
]

const QUESTS = [
  { id: 'adhd', kicker: 'Attention & Focus Quest', title: 'Manas FocusTrack™ ADHD Battery', img: '/decor/itw/quest-sky-citadel-banner.webp', alt: 'Sky Citadel quest', glow: '#F59E0B', accent: '#B45309', btn: 'linear-gradient(90deg,#F59E0B,#D97706)', href: '/assessments/adhd', cta: 'Start Sky Citadel ADHD Quest →',
    chips: ['Spotting game', 'Steering game', 'Sequence memory', 'Patience game'],
    blurb: 'A fantasy quest for kids (Chronicles of the Sunbird: Sky Citadel Quest) with a plain-language summary for parents. Tap when the sunbird swoops, steer past distractions, remember star sequences and practise patience.' },
  { id: 'autism', kicker: 'Social & Sensory Comfort Quest', title: 'Manas PRISM™ Autism Profile', img: '/decor/itw/quest-lumina-groves-banner.webp', alt: 'Whispering Groves quest', glow: '#14B8A6', accent: '#0F766E', btn: 'linear-gradient(90deg,#0D9488,#059669)', href: '/assessments/autism', cta: 'Start Lumina Groves Autism Quest →',
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

const Trail = () => (
  <div className="hb-trail" aria-hidden="true">
    {[0, 1, 2, 3, 4, 5, 6].map((i) => <span key={i} style={{ animationDelay: `${i * 0.35}s` }} />)}
  </div>
)

export default function AssessmentsHubPage() {
  const root = useRef<HTMLElement>(null)

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
    <main ref={root} data-no-listen="true" className="relative min-h-screen bg-gradient-to-b from-[#FDF8EC] via-[#FFFDF7] to-[#F7F2E7] font-poppins text-[#1F2937] overflow-hidden">
      <style>{CSS}</style>

      {/* HERO: two quest worlds meeting in the middle */}
      <section className="relative isolate overflow-hidden text-white" style={{ minHeight: 560 }}>
        <div className="absolute inset-0 -z-10 bg-[#0b1020]" />
        <img src="/decor/itw/quest-sky-citadel-banner.webp" alt="" className="hb-par hb-maskL absolute inset-y-0 left-0 -z-10 h-[115%] w-[62%] object-cover" style={{ ['--k' as string]: 0.16 }} />
        <img src="/decor/itw/quest-lumina-groves-banner.webp" alt="" className="hb-par hb-maskR absolute inset-y-0 right-0 -z-10 h-[115%] w-[62%] object-cover" style={{ ['--k' as string]: 0.1 }} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0b1020]/70 via-[#0b1020]/40 to-transparent" />
        <div className="hb-flies absolute inset-0 -z-10" aria-hidden="true">
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={i} className="hb-fly" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 90}%`, animationDelay: `${(i % 7) * 0.7}s`, animationDuration: `${5 + (i % 5)}s` }} />
          ))}
        </div>

        <div className="relative mx-auto max-w-4xl px-4 pt-16 pb-36 text-center">
          <div className="inline-flex items-center rounded-full bg-white/90 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#065F46] shadow">Play-Based Screening Activities • Not a Diagnosis</div>
          <h1 className="font-patrick mt-5 text-4xl sm:text-5xl md:text-7xl leading-tight" style={{ textShadow: '0 3px 24px rgba(0,0,0,.55)' }}>
            Step Into a Quest.<br /><span className="text-[#6EE7B7]">Understand Your Child Through Play.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-white/95" style={{ textShadow: '0 2px 12px rgba(0,0,0,.6)' }}>
            Fantasy quests that show how your child responds to attention, social, sensory and reading tasks, with a plain-language summary you can take to a clinician.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/85" style={{ textShadow: '0 2px 10px rgba(0,0,0,.6)' }}>
            These are screening-style play activities. They are not a diagnostic tool and do not replace an evaluation by a qualified professional.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#quests" className="min-h-[44px] inline-flex items-center rounded-full bg-[#FBBF24] px-7 py-3 text-sm font-bold text-[#3b2a05] shadow-lg hover:scale-105 transition-transform">Choose a quest</a>
            <Link href="/assessments/dyslexia" prefetch={false} className="min-h-[44px] inline-flex items-center rounded-full border-2 border-white/80 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur hover:bg-white/20 transition-colors">New: The Whispering Library (reading quest)</Link>
          </div>
        </div>
        <img src="/decor/milo-owl.webp" alt="" aria-hidden="true" className="hb-owl absolute bottom-14 right-[6%] hidden h-24 w-24 sm:block" />
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 50 C240 100 480 0 720 40 C960 80 1200 10 1440 50 L1440 90 L0 90Z" fill="#FDF8EC" /></svg>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* FLAGSHIP QUESTS */}
        <section id="quests" className="pt-10 pb-6 scroll-mt-20">
          <div data-reveal className="hb-rv mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#F47522]">Flagship Interactive Quests</div>
              <h2 className="font-patrick text-3xl sm:text-5xl text-[#0F172A]">Pick Your Adventure</h2>
            </div>
            <span className="self-start rounded-full bg-[#F47522]/10 border border-[#F47522]/30 px-3.5 py-1 text-xs font-bold text-[#C2410C]">Reaction-Time and Accuracy Tracking</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {QUESTS.map((q, i) => (
              <div key={q.id} data-reveal className="hb-rv" style={{ transitionDelay: `${i * 120}ms` }}>
                <Tilt className="group relative overflow-hidden rounded-3xl bg-white shadow-xl h-full flex flex-col" style={{ boxShadow: `0 20px 50px -18px ${q.glow}99`, border: `2px solid ${q.glow}` }}>
                  <div className="relative h-64 overflow-hidden">
                    <img src={q.img} alt={q.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <span className="absolute top-3 right-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white border border-white/30 backdrop-blur">Play-based • Not a diagnosis</span>
                    <div className="absolute bottom-0 p-6">
                      <span className="rounded-full bg-black/50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">{q.kicker}</span>
                      <h3 className="font-patrick mt-1 text-3xl font-bold text-white">{q.title}</h3>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-7">
                    <div>
                      <div className="mb-4 flex flex-wrap gap-2">
                        {q.chips.map((c) => <span key={c} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: `${q.glow}1f`, color: q.accent }}>{c}</span>)}
                      </div>
                      <p className="text-sm leading-relaxed text-[#475569]">{q.blurb}</p>
                    </div>
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#F1F5F9] pt-5">
                      <div><span className="text-2xl font-bold text-[#0F172A]">₹799</span><span className="ml-2 text-xs text-[#64748B]">/ $15 USD (Play activity & parent summary)</span></div>
                      <Link href={q.href} prefetch={false} className="min-h-[44px] inline-flex items-center rounded-full px-6 py-3 text-sm font-bold text-white shadow-md transition-transform hover:scale-105" style={{ background: q.btn }}>{q.cta}</Link>
                    </div>
                  </div>
                </Tilt>
              </div>
            ))}
          </div>
        </section>

        <Trail />

        {/* WHY PLAY */}
        <section data-reveal className="hb-rv my-14 rounded-3xl border-2 border-[#FDE68A] bg-gradient-to-b from-[#FEF3C7]/60 to-[#FFFBEB]/80 p-8 md:p-12 shadow-md">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="font-patrick mb-3 text-3xl sm:text-4xl text-[#78350F]">Why Play-Based Activities?</h2>
            <p className="text-sm leading-relaxed text-[#92400E]">Many children find dry questionnaires stressful. Games can feel lower-pressure and show how a child approaches a task. They complement, and never replace, a professional evaluation.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-[#DC2626]"><span className="font-mono text-sm">✕</span> Traditional Static Checklist Limitations</h3>
              <ul className="list-inside list-disc space-y-2.5 text-xs leading-relaxed text-[#64748B]">
                <li>Subjective recall bias from tired parents or overwhelmed teachers.</li>
                <li>No record of reaction time or of how a task changes over a few minutes.</li>
                <li>Rely on adult memory of everyday behaviour.</li>
                <li>Abstract questions can be hard for young children.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-[#05B076]/40 bg-white p-6 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-[#05B076]"><span className="font-mono text-sm">✓</span> Manas Play Activity Advantages</h3>
              <ul className="list-inside list-disc space-y-2.5 text-xs leading-relaxed text-[#1E293B]">
                <li>Reaction times and accuracy are recorded during play.</li>
                <li>Shows missed taps and early taps separately.</li>
                <li>Shows how a child follows gaze and which sensory levels feel comfortable.</li>
                <li>Play-based, non-pathologizing environment that highlights innate strengths.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* DIRECTORY */}
        <section className="mb-20">
          <div data-reveal className="hb-rv mb-10 text-center sm:text-left">
            <div className="text-xs font-bold uppercase tracking-wider text-[#05B076]">Comprehensive Assessment Directory</div>
            <h2 className="font-patrick mt-1 text-3xl sm:text-5xl text-[#0F172A]">Targeted Developmental Screeners</h2>
            <p className="mt-1 max-w-2xl text-sm text-[#64748B]">Explore play activities for speech, motor planning, maths, sensory comfort and reading.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SCREENERS.map((s, i) => (
              <div key={s.id} data-reveal className="hb-rv" style={{ transitionDelay: `${(i % 4) * 90}ms` }}>
                <Tilt className="group flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-sm hover:shadow-xl">
                  <div>
                    <div className="relative flex h-44 items-center justify-center overflow-hidden p-4" style={{ background: `linear-gradient(135deg,${s.from},${s.to})`, borderBottom: `1px solid ${s.color}33` }}>
                      <span className="hb-orb" style={{ background: s.color }} aria-hidden="true" />
                      <span className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ background: `${s.color}1a`, color: s.color }}>{s.badge}</span>
                      <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-[#065F46] shadow-sm">{s.price}</span>
                      {s.isNew && <span className="absolute left-3 bottom-3 rounded-full bg-[#FBBF24] px-2.5 py-0.5 text-[10px] font-bold uppercase text-[#3b2a05]">New quest</span>}
                      <img src={s.image} alt={s.alt} loading="lazy" className="hb-sticker relative h-28 w-28 object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <div className="p-5">
                      <h3 className="font-patrick mb-2 text-xl leading-snug text-[#0F172A]">{s.title}</h3>
                      <p className="mb-4 text-xs leading-relaxed text-[#64748B]">{s.desc}</p>
                      <div className="flex flex-wrap gap-1.5">{s.chips.map((c) => <span key={c} className="rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-semibold text-[#475569]">{c}</span>)}</div>
                    </div>
                  </div>
                  <div className="p-5 pt-0">
                    <div className="flex items-center justify-between border-t border-[#F1F5F9] pt-3">
                      <span className="text-[11px] font-medium text-[#64748B]">⏳ {s.duration}</span>
                      <Link href={s.link} prefetch={false} className="min-h-[36px] inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-transform hover:scale-105" style={{ background: s.color }}>{s.cta}</Link>
                    </div>
                  </div>
                </Tilt>
              </div>
            ))}
          </div>
        </section>

        <section data-reveal className="hb-rv mb-16 flex flex-col items-center justify-between gap-6 rounded-3xl bg-gradient-to-r from-[#05B076] to-[#049A68] p-8 text-center text-white shadow-xl md:flex-row md:p-12 md:text-left">
          <div className="max-w-xl">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-white/80">Expert Pediatric Support</div>
            <h3 className="font-patrick mb-2 text-3xl sm:text-4xl">Talk Through What You Noticed With Our Specialists</h3>
            <p className="text-sm leading-relaxed text-white/90">Every completed quest gives you a plain-language summary. Book a 1-on-1 consultation with Manasi Valluri and our clinical team to talk through what you noticed and what to try next.</p>
          </div>
          <Link href="/consult" prefetch={false} className="min-h-[44px] inline-flex shrink-0 items-center rounded-full bg-white px-8 py-3.5 text-sm font-bold text-[#049A68] shadow-lg transition-transform hover:scale-105">Book Free Discovery Consultation →</Link>
        </section>
      </div>
    </main>
  )
}

const CSS = `
.hb-maskL{-webkit-mask-image:linear-gradient(to right,#000 50%,transparent);mask-image:linear-gradient(to right,#000 50%,transparent)}
.hb-maskR{-webkit-mask-image:linear-gradient(to left,#000 50%,transparent);mask-image:linear-gradient(to left,#000 50%,transparent)}
.hb-par{transform:translate3d(0,calc(var(--sy,0)*var(--k,.1)*1px),0)}
.hb-fly{position:absolute;width:6px;height:6px;border-radius:50%;background:#FDE68A;box-shadow:0 0 12px 4px #FBBF2488;animation:hb-drift 6s ease-in-out infinite;opacity:.8}
@keyframes hb-drift{0%,100%{transform:translate(0,0);opacity:.2}50%{transform:translate(14px,-22px);opacity:.95}}
.hb-owl{animation:hb-bob 3.2s ease-in-out infinite}
@keyframes hb-bob{50%{transform:translateY(-8px)}}
.hb-js .hb-rv:not(.hb-in){opacity:0;transform:translateY(26px)}
.hb-rv{transition:opacity .7s ease,transform .7s ease}
.hb-tilt{transition:transform .25s ease,box-shadow .25s ease;will-change:transform}
.hb-trail{display:flex;justify-content:center;gap:18px;padding:18px 0}
.hb-trail span{width:12px;height:12px;border-radius:50%;background:#FBBF24;animation:hb-glow 2.6s ease-in-out infinite}
@keyframes hb-glow{0%,100%{opacity:.25;box-shadow:none}50%{opacity:1;box-shadow:0 0 16px 5px #FBBF24aa}}
.hb-orb{position:absolute;width:130px;height:130px;border-radius:50%;opacity:.18;filter:blur(18px)}
.hb-sticker{animation:hb-bob 4.5s ease-in-out infinite}
a:focus-visible,button:focus-visible{outline:3px solid #0F172A;outline-offset:3px}
@media (prefers-reduced-motion:reduce){.hb-par,.hb-fly,.hb-owl,.hb-sticker,.hb-trail span{animation:none!important;transform:none!important}.hb-rv,.hb-tilt{transition:none!important}.hb-js .hb-rv:not(.hb-in){opacity:1;transform:none}}
`
