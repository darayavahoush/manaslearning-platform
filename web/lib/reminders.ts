import {readDB, writeDB} from '@/lib/store'
import {sendReminderEmail} from '@/lib/mail'
import {normalizePhone, sendSms} from '@/lib/sms'

const LEAD_MS = 60 * 60000

const istTime = (iso: string) => new Date(Date.parse(iso) + 19800000).toISOString().slice(11, 16)

/** Email + SMS to the parent about 1 hour before each confirmed session. Safe to run every few minutes. */
export async function runReminders(now = Date.now()) {
  const out = {checked: 0, emails: 0, sms: 0, failed: 0}
  const ids = readDB().bookings
    .filter((b) => b.status === 'confirmed' && Date.parse(b.startAt) > now && Date.parse(b.startAt) - now <= LEAD_MS)
    .map((b) => b.id)

  for (const id of ids) {
    // Claim the reminder before sending (no await between read and write), so overlapping runs can't double-send.
    const db = readDB()
    const b = db.bookings.find((x) => x.id === id)!
    const done = b.reminder?.startAt === b.startAt ? b.reminder : undefined // a reschedule re-arms it
    const needEmail = !done?.email, needSms = !done?.sms
    out.checked++
    if (!needEmail && !needSms) continue
    b.reminder = {startAt: b.startAt, email: true, sms: true}
    writeDB(db)

    const t = db.consultTypes.find((x) => x.id === b.typeId)!
    const s = db.staff.find((x) => x.id === b.staffId)!
    const failed = {email: false, sms: false}

    if (needEmail) {
      try { await sendReminderEmail(b, t, s); out.emails++ } catch (e) { console.error('[reminder] email failed', b.id, e); failed.email = true }
    }
    if (needSms) {
      const phone = normalizePhone(b.phone)
      if (phone) {
        const link = process.env.MEETING_URL || 'manaslearning.com/my/consultations'
        const text = `Reminder: your ${t.title} with ${s.name} is today at ${istTime(b.startAt)} IST. Join: ${link} - Manas Learning`
        try { await sendSms(phone, text, {name: b.parentName, title: t.title, time: `${istTime(b.startAt)} IST`, link}); out.sms++ } catch (e) { console.error('[reminder] sms failed', b.id, e); failed.sms = true }
      }
    }
    if (failed.email || failed.sms) {
      out.failed++
      const fresh = readDB()
      const f = fresh.bookings.find((x) => x.id === id)
      if (f && f.reminder?.startAt === b.startAt) { f.reminder = {startAt: b.startAt, email: !failed.email, sms: !failed.sms}; writeDB(fresh) } // retried on the next run
    }
  }
  return out
}
