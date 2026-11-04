'use client'
import Link from 'next/link'

const STANDARD_ASSESSMENTS = [
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
    <main className="min-h-screen bg-[#FFFDF8] py-12 px-4 sm:px-6 lg:px-8 font-poppins text-[#1F2937]">
      <div className="mx-auto max-w-6xl">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#05B076]/10 px-4 py-1.5 text-xs font-bold text-[#065F46] uppercase tracking-wider mb-4">
            ★ Research-Grade Pediatric Evaluations
          </div>
          <h1 className="font-patrick text-4xl sm:text-5xl md:text-6xl text-[#0F172A] leading-tight mb-6">
            Understand Your Child’s Mind With <span className="text-[#05B076]">Playful Precision</span>
          </h1>
          <p className="text-base sm:text-lg text-[#475569] leading-relaxed">
            Standard paper questionnaires miss reaction time nuances, momentary lapses, and sensory thresholds. Our research-grounded assessments combine <strong>gamified cognitive tasks</strong> with <strong>validated clinical rating scales</strong> to deliver actionable IEP accommodations and developmental clarity.
          </p>
        </div>

        {/* 2 NEW FLAGSHIP GAMIFIED ASSESSMENTS (FEATURED CARDS) */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#05B076]">Flagship Interactive Batteries</div>
              <h2 className="font-patrick text-3xl sm:text-4xl text-[#0F172A]">Gamified Clinical Assessments <span className="text-[#05B076] text-xl font-poppins font-semibold">(Free Open Access Beta)</span></h2>
            </div>
            <span className="hidden sm:inline-block rounded-full bg-[#05B076]/10 px-3.5 py-1 text-xs font-bold text-[#065F46]">
              100% Free • Open Access Clinical Batteries
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 1. MANAS FOCUSTRACK ADHD BATTERY */}
            <div className="relative rounded-3xl border-2 border-[#05B076]/30 bg-white p-8 md:p-10 shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 rounded-bl-2xl bg-gradient-to-r from-[#05B076] to-[#049A68] px-4 py-1.5 text-xs font-bold text-white shadow-sm">
                FREE OPEN ACCESS • CPT-3 NORMED
              </div>

              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#DCFCE7] text-3xl shadow-sm">
                    🐒
                  </div>
                  <div>
                    <h3 className="font-patrick text-2xl sm:text-3xl text-[#0F172A]">
                      Manas FocusTrack™ ADHD Battery
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#05B076]">
                      <span>Conners CPT-3</span>
                      <span>•</span>
                      <span>Vanderbilt DSM-5</span>
                      <span>•</span>
                      <span>Ages 5–16 & Adults</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-[#475569] leading-relaxed mb-6">
                  Combines the <strong>Jungle Safari Continuous Performance Test (CPT-3)</strong>, the <strong>Starlight Flanker Task</strong>, and <strong>Constellation Working Memory Matrix</strong> with dimensional Vanderbilt ratings. Measures millisecond reaction times, attentional consistency (RTV), omission misses, and motor impulsivity.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6 text-xs">
                  <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3">
                    <span className="font-bold text-[#05B076] block">Hit RT & RTV</span>
                    <span className="text-[#64748B]">Attention lapse & fatigue slope</span>
                  </div>
                  <div className="rounded-xl bg-[#F8FAFC] border border-[#F47522] block">
                    <span className="font-bold text-[#F47522] block">Omission vs. Commission</span>
                    <span className="text-[#64748B]">Inattention vs. Impulsivity T-Scores</span>
                  </div>
                  <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3">
                    <span className="font-bold text-[#3B82F6] block">Flanker Distractor Cost</span>
                    <span className="text-[#64748B]">Interference control capacity</span>
                  </div>
                  <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3">
                    <span className="font-bold text-[#8B5CF6] block">IEP Accommodations</span>
                    <span className="text-[#64748B]">Classroom & home sensory plan</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-2xl font-bold text-[#05B076]">FREE</span>
                  <span className="text-xs font-semibold text-[#065F46] ml-2">Open Access (Full Battery & Diagnostic Report)</span>
                </div>
                <Link
                  href="/assessments/adhd"
                  prefetch={false}
                  className="rounded-full bg-gradient-to-r from-[#05B076] to-[#049A68] px-6 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg hover:scale-105 transition-all"
                >
                  Start Free FocusTrack ADHD Battery →
                </Link>
              </div>
            </div>

            {/* 2. MANAS PRISM AUTISM PROFILE */}
            <div className="relative rounded-3xl border-2 border-[#3B82F6]/30 bg-white p-8 md:p-10 shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 rounded-bl-2xl bg-gradient-to-r from-[#3B82F6] to-[#2563EB] px-4 py-1.5 text-xs font-bold text-white shadow-sm">
                FREE OPEN ACCESS • ADOS-2 MAPPED
              </div>

              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#DBEAFE] text-3xl shadow-sm">
                    ✨
                  </div>
                  <div>
                    <h3 className="font-patrick text-2xl sm:text-3xl text-[#0F172A]">
                      Manas PRISM™ Autism Profile
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#3B82F6]">
                      <span>ADOS-2 Observational</span>
                      <span>•</span>
                      <span>SPM-2 Sensory</span>
                      <span>•</span>
                      <span>SCQ Standard</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-[#475569] leading-relaxed mb-6">
                  Evaluates 4 core neurodevelopmental dimensions through interactive play: <strong>Joint Attention & Social Referencing</strong>, <strong>Contextual Theory of Mind & Nuance</strong>, <strong>Audiovisual Sensory Thresholds</strong>, and <strong>Set-Shifting Cognitive Flexibility (DCCS)</strong>.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6 text-xs">
                  <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3">
                    <span className="font-bold text-[#3B82F6] block">Social Referencing</span>
                    <span className="text-[#64748B]">Gaze & pointing latency tracking</span>
                  </div>
                  <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3">
                    <span className="font-bold text-[#05B076] block">Sensory Modulation</span>
                    <span className="text-[#64748B]">Flicker, acoustic & tactile map</span>
                  </div>
                  <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3">
                    <span className="font-bold text-[#F47522] block">Set-Shifting Cost</span>
                    <span className="text-[#64748B]">Cognitive flexibility vs. routine</span>
                  </div>
                  <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3">
                    <span className="font-bold text-[#8B5CF6] block">Sensory Diet Blueprint</span>
                    <span className="text-[#64748B]">De-escalation & classroom plan</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-2xl font-bold text-[#3B82F6]">FREE</span>
                  <span className="text-xs font-semibold text-[#1D4ED8] ml-2">Open Access (Full Profile & Diagnostic Blueprint)</span>
                </div>
                <Link
                  href="/assessments/autism"
                  prefetch={false}
                  className="rounded-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] px-6 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg hover:scale-105 transition-all"
                >
                  Start Free PRISM Autism Profile →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* COMPARISON: WHY GAMIFIED ASSESSMENTS? */}
        <div className="mb-20 rounded-3xl bg-[#FEF3C7]/40 border border-[#FDE68A] p-8 md:p-12">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-patrick text-3xl sm:text-4xl text-[#78350F] mb-3">
              Why Gamified Testing Outperforms Static Paper Questionnaires
            </h2>
            <p className="text-sm text-[#92400E] leading-relaxed">
              Neurodivergent children often mask or become anxious when confronted with dry questions. Gamified tasks reveal organic cognitive strategies in a low-stakes, joyful environment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white p-6 border border-[#E2E8F0] shadow-sm">
              <h3 className="font-bold text-base text-[#DC2626] flex items-center gap-2 mb-3">
                <span>✕</span> Traditional Static Checklist Limitations
              </h3>
              <ul className="space-y-2 text-xs text-[#64748B] list-disc list-inside leading-relaxed">
                <li>Subjective recall bias from tired parents or overwhelmed teachers.</li>
                <li>Zero objective reaction-time latency or cognitive fatigue measurement.</li>
                <li>Cannot differentiate true attentional inattention from motor impulsivity.</li>
                <li>Abstract questions provoke anxiety and masking in young children.</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-white p-6 border border-[#05B076]/40 shadow-sm">
              <h3 className="font-bold text-base text-[#05B076] flex items-center gap-2 mb-3">
                <span>✓</span> Manas Gamified Clinical Battery Advantages
              </h3>
              <ul className="space-y-2 text-xs text-[#1E293B] list-disc list-inside leading-relaxed">
                <li>Millisecond-precision response recording via standardized CPT-3 paradigms.</li>
                <li>Separates motor inhibition (commissions) from executive drift (omissions).</li>
                <li>Direct measurement of joint attention referencing and sensory thresholds.</li>
                <li>Play-based, non-pathologizing environment that highlights innate strengths.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* DIRECTORY OF ALL STANDARD CLINICAL SCREENERS */}
        <div className="mb-16">
          <div className="mb-8">
            <div className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Comprehensive Assessment Directory</div>
            <h2 className="font-patrick text-3xl sm:text-4xl text-[#0F172A]">Targeted Developmental Screeners</h2>
            <p className="text-sm text-[#64748B] mt-1">Explore specialized screenings for speech, motor planning, math, and reading.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STANDARD_ASSESSMENTS.map((item) => (
              <div key={item.id} className="rounded-2xl bg-white border border-[#E2E8F0] p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
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
