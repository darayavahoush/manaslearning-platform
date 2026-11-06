'use client'
import {useEffect, useMemo, useState} from 'react'
import type {ReportRecord} from './ParentClinicianReport'
import ReportTabs from './ReportSummaries'
import {generateRoadmap} from '../roadmap/generate'
import {REPORT_PILOT_VISIBLE, REPORT_REVIEWED} from './library'

/**
 * The personalised report shown at the end of a quest, built from this child's own session record.
 *
 * Parents see the full report only after a clinician has signed off the wording (REPORT_REVIEWED in library.ts).
 * Until then they see a short note. The team can preview the full draft on the same page with ?preview=team
 * (the draft banner still shows there). Nothing is stored on a server.
 */
export default function EndReport({record, name}: {record: ReportRecord; name: string}) {
  const [teamPreview, setTeamPreview] = useState(false)
  useEffect(() => {
    setTeamPreview(new URLSearchParams(window.location.search).get('preview') === 'team')
  }, [])
  const roadmap = useMemo(() => generateRoadmap({record, focus: []}), [record])

  if (!REPORT_REVIEWED && !REPORT_PILOT_VISIBLE && !teamPreview) {
    return (
      <section className="mx-auto mt-8 max-w-2xl rounded-3xl border-2 border-teal-300/40 bg-white/95 p-6 text-center shadow-xl">
        <p className="font-patrick text-2xl font-bold text-[#0F172A]">Your personalised report</p>
        <p className="mt-2 text-sm text-[#475569]">
          Your child&apos;s report is being checked by a clinician, and it will be ready here soon. The summary above is a quick look at this one session, not a diagnosis.
        </p>
      </section>
    )
  }
  return <ReportTabs record={record} name={name} roadmap={roadmap} />
}
