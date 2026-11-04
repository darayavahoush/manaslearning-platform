'use client'
import Link from 'next/link'

interface ScreenerItem {
  id: string
  title: string
  price: string
  duration: string
  desc: string
  badge: string
  link: string
}

const STANDARD_ASSESSMENTS: ScreenerItem[] = [
  {
    id: 'dyslexia',
    title: 'Dyslexia Reading & Phonological Screener',
    price: '₹299',
    duration: '20 mins',
    desc: 'Evaluates phonemic awareness, rapid letter-sound decoding, and reading fluency markers.',
    badge: 'Clinical Screener',
    link: '/experience?module=dyslexia'
  },
  {
    id: 'dyscalculia',
    title: 'Dyscalculia Math & Number Sense Assessment',
    price: '₹299',
    duration: '20 mins',
    desc: 'Assesses subitizing, mental number line calibration, and mathematical reasoning.',
    badge: 'Cognitive Screener',
    link: '/experience?module=dyscalculia'
  },
  {
    id: 'dysgraphia',
    title: 'Dysgraphia & Fine Motor Assessment',
    price: '₹299',
    duration: '25 mins',
    desc: 'Measures fine-motor transcription drag, pencil grip posture, and writing fatigue.',
    badge: 'Motor Assessment',
    link: '/experience?module=dysgraphia'
  },
  {
    id: 'speech',
    title: 'Speech & Language Articulation Assessment',
    price: '₹600',
    duration: '30 mins',
    desc: 'Evaluates receptive vs. expressive speech, phonetic clarity, and vocabulary milestones.',
    badge: 'Speech Pathology',
    link: '/experience?module=speech'
  },
  {
    id: 'spd',
    title: 'Sensory Processing Disorder (SPD) Profile',
    price: '₹299',
    duration: '20 mins',
    desc: 'Screens for tactile, vestibular, and auditory over/under-responsiveness across daily routines.',
    badge: 'Sensory Profile',
    link: '/experience?module=autism'
  },
  {
    id: 'nvld',
    title: 'Non-Verbal Learning Disability (NVLD) Screener',
    price: '₹299',
    duration: '25 mins',
    desc: 'Identifies visual-spatial vs. verbal discrepancy and non-verbal social cue interpretation.',
    badge: 'Neuropsychological',
    link: '/experience?module=executive'
  },
  {
    id: 'dcd',
    title: 'Developmental Coordination Disorder (DCD / Dyspraxia)',
    price: '₹299',
    duration: '25 mins',
    desc: 'Assesses gross and fine motor planning, physical coordination, and spatial orientation.',
    badge: 'Motor Planning',
    link: '/consult'
  },
  {
    id: 'executive',
    title: 'Executive Functioning & Working Memory Screener',
    price: '₹299',
    duration: '20 mins',
    desc: 'Screens for organization, cognitive task-initiation, and working memory barriers.',
    badge: 'Executive Function',
    link: '/experience?module=executive'
  }
]

export default function AssessmentsHubPage() {
  return (
    <main data-no-listen="true" className="relative min-h-screen bg-gradient-to-b from-[#FFFDF7] via-[#FDF8EC] to-[#F7F2E7] py-12 px-4 sm:px-6 lg:px-8 font-poppins text-[#1F2937] overflow-hidden">
      {/* Ambient Fantasy Background Elements */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-40">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-tr from-amber-300/30 to-emerald-300/20 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] rounded-full bg-gradient-to-bl from-teal-300/30 to-sky-300/20 blur-3xl" />
        <div className="absolute bottom-10 left-1/4 w-[36rem] h-[36rem] rounded-full bg-gradient-to-tr from-amber-200/20 to-rose-200/20 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#05B076]/15 px-4 py-1.5 text-xs font-bold text-[#065F46] uppercase tracking-wider mb-4 border border-[#05B076]/30 shadow-sm backdrop-blur-sm">
            Play-Based Screening Activities • Not a Diagnosis
          </div>
          <h1 className="font-patrick text-4xl sm:text-5xl md:text-6xl text-[#0F172A] leading-tight mb-5 drop-shadow-sm">
            Understand Your Child’s Mind With <span className="text-[#05B076]">Playful Precision</span>
          </h1>
          <p className="text-base sm:text-lg text-[#475569] leading-relaxed">
            Playful quests that show how your child responds to attention, social and sensory tasks, with a plain-language summary you can take to a clinician.
          </p>
          <p className="mt-4 text-xs text-[#64748B] leading-relaxed">
            These are screening-style play activities. They are not a diagnostic tool and do not replace an evaluation by a qualified professional.
          </p>
        </div>

        {/* 2 FLAGSHIP GAMIFIED FANTASY ASSESSMENTS */}
        <div className="mb-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#F47522]">Flagship Interactive Batteries</div>
              <h2 className="font-patrick text-3xl sm:text-4xl text-[#0F172A]">
                New Gamified Paid Assessments
              </h2>
            </div>
            <span className="self-start sm:self-auto rounded-full bg-[#F47522]/10 border border-[#F47522]/30 px-3.5 py-1 text-xs font-bold text-[#C2410C]">
              Reaction-Time and Accuracy Tracking
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 1. MANAS FOCUSTRACK ADHD BATTERY */}
            <div className="relative rounded-3xl border-2 border-amber-300 bg-white/95 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between overflow-hidden group">
              <div className="relative h-56 w-full overflow-hidden bg-gradient-to-tr from-[#FEF3C7] to-[#DCFCE7]">
                <img
                  src="/decor/itw/quest-sky-citadel-banner.webp"
                  alt="Sky Citadel Quest"
                  loading="lazy"
                  className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 z-10">
                  <span className="rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300 border border-amber-400/40">
                    PLAY-BASED • NOT A DIAGNOSIS
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex items-end p-6">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-black/40 px-3 py-1 rounded-full">
                      Attention & Focus Quest
                    </span>
                    <h3 className="font-patrick text-3xl text-white font-bold mt-1">
                      Manas FocusTrack™ ADHD Battery
                    </h3>
                  </div>
                </div>
              </div>

              <div className="p-7 sm:p-9 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#05B076] mb-4">
                    <span>Spotting game</span>
                    <span>•</span>
                    <span>Steering game</span>
                    <span>•</span>
                    <span>Ages 5–16</span>
                  </div>

                  <p className="text-sm text-[#475569] leading-relaxed mb-6">
                    A fantasy quest for kids (<em>Chronicles of the Sunbird: Sky Citadel Quest</em>) with a plain-language summary for parents. It has a sunbird-spotting game, a steering game with distractions, a sequence-memory game and a patience game. It shows counts and reaction speeds from one play session. It does not compare your child with other children and cannot show whether a child has ADHD.
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-6 text-xs">
                    <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3">
                      <span className="font-bold text-[#05B076] block mb-0.5">Tap speed</span>
                      <span className="text-[#64748B]">How speed changes while playing</span>
                    </div>
                    <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3">
                      <span className="font-bold text-[#C2410C] block mb-0.5">Missed vs. early taps</span>
                      <span className="text-[#64748B]">Counts, not scores</span>
                    </div>
                    <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3">
                      <span className="font-bold text-[#2563EB] block mb-0.5">Flanker Conflict Cost</span>
                      <span className="text-[#64748B]">Steering through distractions</span>
                    </div>
                    <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3">
                      <span className="font-bold text-[#7C3AED] block mb-0.5">Ideas to Try</span>
                      <span className="text-[#64748B]">Classroom & home ideas</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-2xl font-bold text-[#0F172A]">₹799</span>
                    <span className="text-xs text-[#64748B] ml-2">/ $15 USD (Play activity & parent summary)</span>
                  </div>
                  <Link
                    href="/assessments/adhd"
                    prefetch={false}
                    className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg hover:scale-105 transition-all"
                  >
                    Start Sky Citadel ADHD Quest →
                  </Link>
                </div>
              </div>
            </div>

            {/* 2. MANAS PRISM AUTISM PROFILE */}
            <div className="relative rounded-3xl border-2 border-teal-300 bg-white/95 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between overflow-hidden group">
              <div className="relative h-56 w-full overflow-hidden bg-gradient-to-tr from-[#CCFBF1] to-[#DBEAFE]">
                <img
                  src="/decor/itw/quest-lumina-groves-banner.webp"
                  alt="Whispering Groves Quest"
                  loading="lazy"
                  className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 z-10">
                  <span className="rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-300 border border-teal-400/40">
                    PLAY-BASED • NOT A DIAGNOSIS
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex items-end p-6">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300 bg-black/40 px-3 py-1 rounded-full">
                      Social & Sensory Comfort Quest
                    </span>
                    <h3 className="font-patrick text-3xl text-white font-bold mt-1">
                      Manas PRISM™ Autism Profile
                    </h3>
                  </div>
                </div>
              </div>

              <div className="p-7 sm:p-9 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#0D9488] mb-4">
                    <span>Gaze-following game</span>
                    <span>•</span>
                    <span>Feelings match</span>
                    <span>•</span>
                    <span>Comfort preferences</span>
                  </div>

                  <p className="text-sm text-[#475569] leading-relaxed mb-6">
                    A fantasy quest for kids (<em>Whispering Groves of Lumina: Crystal Lantern Quest</em>) with a plain-language summary for parents. It has a gaze-following game, a feelings-matching game, a cosy sensory sanctuary and a sorting game. It shows what your child chose and how quickly. It does not compare your child with other children and cannot show whether a child is autistic.
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-6 text-xs">
                    <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3">
                      <span className="font-bold text-[#2563EB] block mb-0.5">Following Gaze</span>
                      <span className="text-[#64748B]">Gaze & pointing game</span>
                    </div>
                    <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3">
                      <span className="font-bold text-[#05B076] block mb-0.5">Sensory Modulation</span>
                      <span className="text-[#64748B]">Light, sound & touch comfort</span>
                    </div>
                    <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3">
                      <span className="font-bold text-[#C2410C] block mb-0.5">Sorting Game</span>
                      <span className="text-[#64748B]">Switching sorting rules</span>
                    </div>
                    <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3">
                      <span className="font-bold text-[#7C3AED] block mb-0.5">Ideas to Try</span>
                      <span className="text-[#64748B]">Calm-down & classroom ideas</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-2xl font-bold text-[#0F172A]">₹799</span>
                    <span className="text-xs text-[#64748B] ml-2">/ $15 USD (Play activity & parent summary)</span>
                  </div>
                  <Link
                    href="/assessments/autism"
                    prefetch={false}
                    className="rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg hover:scale-105 transition-all"
                  >
                    Start Lumina Groves Autism Quest →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COMPARISON: WHY GAMIFIED TESTING? */}
        <div className="mb-20 rounded-3xl bg-gradient-to-b from-[#FEF3C7]/60 to-[#FFFBEB]/80 border-2 border-[#FDE68A] p-8 md:p-12 shadow-md">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-patrick text-3xl sm:text-4xl text-[#78350F] mb-3">
              Why Play-Based Activities?
            </h2>
            <p className="text-sm text-[#92400E] leading-relaxed">
              Many children find dry questionnaires stressful. Games can feel lower-pressure and show how a child approaches a task. They complement, and never replace, a professional evaluation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white p-6 border border-[#E2E8F0] shadow-sm">
              <h3 className="font-bold text-base text-[#DC2626] flex items-center gap-2 mb-3">
                <span className="font-mono text-sm font-bold">✕</span> Traditional Static Checklist Limitations
              </h3>
              <ul className="space-y-2.5 text-xs text-[#64748B] list-disc list-inside leading-relaxed">
                <li>Subjective recall bias from tired parents or overwhelmed teachers.</li>
                <li>No record of reaction time or of how a task changes over a few minutes.</li>
                <li>Rely on adult memory of everyday behaviour.</li>
                <li>Abstract questions can be hard for young children.</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-white p-6 border border-[#05B076]/40 shadow-sm">
              <h3 className="font-bold text-base text-[#05B076] flex items-center gap-2 mb-3">
                <span className="font-mono text-sm font-bold">✓</span> Manas Play Activity Advantages
              </h3>
              <ul className="space-y-2.5 text-xs text-[#1E293B] list-disc list-inside leading-relaxed">
                <li>Reaction times and accuracy are recorded during play.</li>
                <li>Shows missed taps and early taps separately.</li>
                <li>Shows how a child follows gaze and which sensory levels feel comfortable.</li>
                <li>Play-based, non-pathologizing environment that highlights innate strengths.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* DIRECTORY OF TARGETED DEVELOPMENTAL SCREENERS */}
        <div className="mb-20">
          <div className="mb-10 text-center sm:text-left">
            <div className="text-xs font-bold uppercase tracking-wider text-[#05B076]">Comprehensive Assessment Directory</div>
            <h2 className="font-patrick text-3xl sm:text-4xl text-[#0F172A] mt-1">Targeted Developmental Screeners</h2>
            <p className="text-sm text-[#64748B] mt-1 max-w-2xl">
              Explore specialized screenings for speech, motor planning, math, sensory integration, and reading fluency.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STANDARD_ASSESSMENTS.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-sm hover:shadow-md hover:border-[#05B076]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569]">
                      {item.badge}
                    </span>
                    <span className="text-xs font-bold text-[#05B076]">{item.price}</span>
                  </div>
                  <h3 className="font-patrick text-xl text-[#0F172A] mb-2 leading-snug">{item.title}</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed mb-4">{item.desc}</p>
                </div>

                <div className="pt-3 border-t border-[#F8FAFC] flex items-center justify-between">
                  <span className="text-[11px] text-[#94A3B8]">⏳ {item.duration}</span>
                  <Link
                    href={item.link}
                    prefetch={false}
                    className="text-xs font-bold text-[#05B076] hover:text-[#049A68] hover:underline"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CLINICAL CONSULTATION BANNER */}
        <div className="rounded-3xl bg-gradient-to-r from-[#05B076] to-[#049A68] p-8 md:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="max-w-xl">
            <div className="text-xs font-bold uppercase tracking-wider text-white/80 mb-1">Expert Pediatric Support</div>
            <h3 className="font-patrick text-3xl sm:text-4xl text-white mb-2">
              Review Your Assessment With Our Senior Specialists
            </h3>
            <p className="text-sm text-white/90 leading-relaxed">
              Every completed assessment generates an individualized clinical summary. Book a 1-on-1 consultation with Manasi Valluri and our clinical team to translate findings into effective school accommodations and personalized therapies.
            </p>
          </div>
          <Link
            href="/consult"
            prefetch={false}
            className="rounded-full bg-white px-8 py-3.5 text-sm font-bold text-[#049A68] shadow-lg hover:bg-[#F8FAFC] hover:scale-105 transition-all shrink-0"
          >
            Book Free Discovery Consultation →
          </Link>
        </div>
      </div>
    </main>
  )
}
