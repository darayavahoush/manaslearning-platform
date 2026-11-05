'use client'

import type {SessionRecord} from './session-record'

const pill = {
  minHeight: 44,
  padding: '8px 18px',
  borderRadius: 999,
  border: '1.5px solid #8A7F6E',
  background: '#F4ECDC',
  color: '#2F2A24',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  textDecoration: 'none',
} as const

/**
 * Lets a clinician or parent save this session's record as a .json file and open it in the
 * record viewer. The file holds no child name, only the measures, age band and device details.
 */
export default function SessionRecordDownload({record}: {record: SessionRecord}) {
  const download = () => {
    const stamp = String(record.recordedAt || '').slice(0, 10).replace(/-/g, '')
    const blob = new Blob([JSON.stringify(record, null, 2)], {type: 'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `manas-profile-${record.quest}-${stamp || 'session'}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <span className="inline-flex flex-wrap items-center justify-center gap-3">
      <button type="button" onClick={download} style={pill}>
        Download session record (.json)
      </button>
      <a href="/assessments/record" target="_blank" rel="noopener" style={pill}>
        Open record viewer
      </a>
    </span>
  )
}
