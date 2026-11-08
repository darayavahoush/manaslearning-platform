'use client'
import React from 'react'
import type {CognitiveProfile, DomainEvaluation, Observation} from '../../../app/api/assessments/agent/route'

interface ClinicalReportData {
  generatedOn: string
  instrument: {name: string; version: string}
  summary: string
  indices: Observation[]
  questions: string[]
  accommodations: {
    classroom: string[]
    examinations: string[]
    executive: string[]
    sensoryDiet: string[]
  }
  cognitiveProfile?: CognitiveProfile
}

interface CognitiveDossierViewProps {
  quest: 'adhd' | 'autism'
  childName: string
  clinicalReport: ClinicalReportData
}

export default function CognitiveDossierView({quest, childName, clinicalReport}: CognitiveDossierViewProps) {
  const prof = clinicalReport.cognitiveProfile
  const accentColor = quest === 'adhd' ? '#05B076' : '#0D9488'
  const brandGradient = quest === 'adhd'
    ? 'from-amber-500/10 via-amber-500/5 to-transparent'
    : 'from-teal-500/10 via-teal-500/5 to-transparent'

  return (
    <div className="rounded-3xl border-2 border-[#CBD5E1] bg-white p-6 sm:p-10 md:p-12 shadow-2xl text-slate-800">
      {/* Top Clinical Dossier Header */}
      <div className="border-b border-[#E2E8F0] pb-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Clinical Pediatric Dossier • {clinicalReport.generatedOn}
          </span>
          <span className="text-xs font-semibold text-slate-500">
            {clinicalReport.instrument.name} • v{clinicalReport.instrument.version}
          </span>
        </div>

        <h2 className="font-patrick text-3xl sm:text-4xl text-[#0F172A] font-bold mt-3">
          Comprehensive Cognitive & Neurodevelopmental Analysis
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed max-w-3xl">
          A multi-dimensional synthesis of sustained attention, selective conflict resolution, working memory capacity, and somatic delay regulation captured through natural gameplay telemetry.
        </p>
      </div>

      {/* Clinical Disclaimer Note */}
      <div role="note" className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] mb-8 text-xs sm:text-sm text-[#78350F] leading-relaxed flex items-start gap-3">
        <span className="text-lg shrink-0 mt-0.5">ℹ️</span>
        <div>
          <strong>Observational Pediatric Profile, Not a Diagnostic Label.</strong> This analysis reflects objective millisecond reaction speeds, target discrimination rates, and motor hold consistency from this session. Results are interpreted to guide supportive classroom and home accommodations, and to empower productive discussions with pediatricians, neurologists, or psychologists.
        </div>
      </div>

      {/* 1. OVERALL COGNITIVE PROFILE & ATTENTIONAL ARCHETYPE */}
      {prof && (
        <section className={`mb-10 rounded-2xl border-2 border-slate-200 bg-gradient-to-br ${brandGradient} p-6 sm:p-8 shadow-sm`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full bg-slate-900 text-white shadow-sm flex items-center gap-1.5">
              <span>🧠</span> Executive Attentional Phenotype
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700 bg-white/90 border border-slate-300 px-3 py-1 rounded-full shadow-xs">
                ⏱️ {prof.tempoLabel}
              </span>
              <span className="text-xs font-bold text-slate-700 bg-white/90 border border-slate-300 px-3 py-1 rounded-full shadow-xs">
                📈 {prof.staminaLabel}
              </span>
            </div>
          </div>

          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
            {prof.archetype}
          </h3>

          <p className="text-sm sm:text-base text-slate-700 leading-relaxed bg-white/80 p-5 rounded-xl border border-slate-200/80 shadow-xs">
            {prof.executiveSummary}
          </p>

          {/* Core Strengths & Support Opportunities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {/* Strengths */}
            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 shadow-xs">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 mb-2.5">
                <span>🌟</span> Core Cognitive Strengths
              </span>
              <ul className="space-y-1.5 text-xs sm:text-sm text-emerald-950">
                {prof.keyStrengths.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Growth & Support */}
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 shadow-xs">
              <span className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5 mb-2.5">
                <span>🌱</span> Scaffolding & Support Opportunities
              </span>
              <ul className="space-y-1.5 text-xs sm:text-sm text-amber-950">
                {prof.supportOpportunities.map((o, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* 2. DOMAIN-BY-DOMAIN DEEP-DIVE EVALUATIONS */}
      <section className="mb-10">
        <div className="mb-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Chapter Neurocognitive Evaluations
          </span>
          <h3 className="font-patrick text-2xl sm:text-3xl text-slate-900 font-bold mt-0.5">
            Detailed Cognitive Performance Breakdown
          </h3>
        </div>

        {prof?.domains && prof.domains.length > 0 ? (
          <div className="space-y-6">
            {prof.domains.map((domain: DomainEvaluation) => {
              const toneStyles = domain.statusTone === 'strength'
                ? {badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500'}
                : domain.statusTone === 'support'
                ? {badge: 'bg-amber-100 text-amber-800 border-amber-300', dot: 'bg-amber-500'}
                : {badge: 'bg-sky-100 text-sky-800 border-sky-300', dot: 'bg-sky-500'}

              return (
                <div key={domain.id} className="rounded-2xl border-2 border-slate-200 bg-white p-5 sm:p-7 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {domain.chapterName}
                      </span>
                      <h4 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                        {domain.title}
                      </h4>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-xs ${toneStyles.badge} flex items-center gap-1.5`}>
                      <span className={`w-2 h-2 rounded-full ${toneStyles.dot}`} />
                      {domain.clinicalRating}
                    </span>
                  </div>

                  {/* Clinical Narrative Analysis */}
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
                    {domain.narrativeAnalysis}
                  </p>

                  {/* Metric Indicators Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                    {domain.indicators.map((ind, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          {ind.label}
                        </span>
                        <div className="font-mono text-base font-bold text-slate-900 mt-0.5">
                          {ind.value}
                        </div>
                        {ind.context && (
                          <span className="text-[10px] text-slate-500 block mt-0.5 leading-tight">
                            {ind.context}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Real World Classroom & Daily Impact */}
                  {domain.realWorldImpact && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 bg-slate-50/70 p-3 rounded-xl">
                      <span className="text-base shrink-0">🏫</span>
                      <div>
                        <strong className="text-slate-800">Classroom & Daily Life Implication: </strong>
                        {domain.realWorldImpact}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          /* Fallback when cognitiveProfile is absent */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clinicalReport.indices.map((idx, i) => (
              <div key={i} className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <strong className="text-sm text-[#0F172A] block">{idx.name}</strong>
                <div className="font-mono font-bold text-sm mt-1" style={{color: accentColor}}>{idx.value}</div>
                <span className="text-[11px] text-[#64748B] block mt-1">{idx.detail}</span>
                <span className="text-[11px] text-[#475569] block mt-2 leading-relaxed">{idx.note}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. FOUR-PILLAR ACCOMMODATIONS BLUEPRINT */}
      <section className="mb-10 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Actionable School & Home Blueprint
          </span>
          <h3 className="font-patrick text-2xl sm:text-3xl text-slate-900 font-bold mt-0.5">
            Evidence-Based Scaffolding & Accommodations
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Practical strategies tailored to {childName}&apos;s observed cognitive tempo, attentional stamina, and impulse modulation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <strong className="text-xs font-bold text-[#05B076] uppercase tracking-wider block mb-3 flex items-center gap-1.5">
              <span>🪑</span> 1. Classroom Seating & Visual Environment
            </strong>
            <ul className="space-y-2 text-xs sm:text-sm text-[#334155]">
              {clinicalReport.accommodations.classroom.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#05B076] font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <strong className="text-xs font-bold text-[#2563EB] uppercase tracking-wider block mb-3 flex items-center gap-1.5">
              <span>⏱️</span> 2. Examination & Task Scaffolding
            </strong>
            <ul className="space-y-2 text-xs sm:text-sm text-[#334155]">
              {clinicalReport.accommodations.examinations.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#2563EB] font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <strong className="text-xs font-bold text-[#D97706] uppercase tracking-wider block mb-3 flex items-center gap-1.5">
              <span>📋</span> 3. Working Memory & Executive Routines
            </strong>
            <ul className="space-y-2 text-xs sm:text-sm text-[#334155]">
              {clinicalReport.accommodations.executive.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#D97706] font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <strong className="text-xs font-bold text-[#7C3AED] uppercase tracking-wider block mb-3 flex items-center gap-1.5">
              <span>🌿</span> 4. Movement, Sensory & Proprioceptive Regulation
            </strong>
            <ul className="space-y-2 text-xs sm:text-sm text-[#334155]">
              {clinicalReport.accommodations.sensoryDiet.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#7C3AED] font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 4. QUESTIONS FOR CLINICIANS & SPECIALISTS */}
      <section className="mb-6 p-6 rounded-2xl bg-slate-50 border border-slate-200">
        <h3 className="font-patrick text-2xl text-[#0F172A] mb-2 flex items-center gap-2">
          <span>💬</span> Questions You Could Bring to a Clinician or Teacher
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 mb-4">
          Bring these observational questions to appointments with pediatricians, psychologists, or school IEP/504 conferences:
        </p>
        <ul className="space-y-2 text-xs sm:text-sm text-[#334155]">
          {clinicalReport.questions.map((q, i) => (
            <li key={i} className="flex items-start gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              <span className="font-bold text-teal-600 shrink-0">?</span>
              <span>{q}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
