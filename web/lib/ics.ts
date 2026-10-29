import type {Booking, ConsultType, Staff} from './store'

const stamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
const q = (s: string) => `"${s.replace(/"/g, '')}"`
const fold = (l: string) => (l.length <= 74 ? l : l.match(/.{1,73}/g)!.join('\r\n '))

export function makeIcs(b: Booking, t: ConsultType, s: Staff, method: 'REQUEST' | 'CANCEL') {
  const from = process.env.MAIL_FROM_ADDRESS || 'no-reply@manaslearning.com'
  const url = process.env.MEETING_URL || ''
  const cancel = method === 'CANCEL'
  const desc = [`${t.title} with ${s.name}`, url && `Join: ${url}`, b.concern && `Notes: ${b.concern}`].filter(Boolean).join('\n')
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Manas Learning//Booking//EN', 'CALSCALE:GREGORIAN', `METHOD:${method}`,
    'BEGIN:VEVENT',
    `UID:${b.id}@manaslearning.com`, `DTSTAMP:${stamp(Date.now())}`, `SEQUENCE:${cancel ? 1 : 0}`,
    `DTSTART:${stamp(Date.parse(b.startAt))}`, `DTEND:${stamp(Date.parse(b.endAt))}`,
    `SUMMARY:${esc(`${t.title} - Manas Learning`)}`, `DESCRIPTION:${esc(desc)}`,
    `LOCATION:${url ? esc(url) : 'Online'}`, `STATUS:${cancel ? 'CANCELLED' : 'CONFIRMED'}`,
    `ORGANIZER;CN=${q('Manas Learning')}:mailto:${from}`,
    `ATTENDEE;CN=${q(b.parentName)};ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:${b.email}`,
    `ATTENDEE;CN=${q(s.name)};ROLE=REQ-PARTICIPANT:mailto:${s.email}`,
    ...(cancel ? [] : ['BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', 'DESCRIPTION:Reminder', 'END:VALARM']),
    'END:VEVENT', 'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}
