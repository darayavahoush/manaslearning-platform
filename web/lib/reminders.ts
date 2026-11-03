import {readDB, updateDB} from '@/lib/store'
import {sendReminderEmail} from '@/lib/mail'
import {normalizePhone, sendSms} from '@/lib/sms'

const LEAD_MS = 60 * 60000

const istTime = (iso: string) => new Date(Date.parse(iso) + 19800000).toISOString().slice(11, 16)

/** Email + SMS to the parent about 1 hour before each confirmed session. Safe to run every few minutes. */
export async function runReminders(now = Date.now()) {
  const out = {checked: 0, emails: 0, sms: 0, failed: 0}
  const ids = (await readDB()).bookings
    .filter((b) => b.status === 'confirmed' && Date.parse(b.startAt) > now && Date.parse(b.startAt) - now <= LEAD_MS)
    .map((b) => b.id)

  for (const id of ids) {
    // Claim the reminder before sending, in one locked step, so overlapping runs can't double-send.
    const claim = await updateDB((db) => {
      const b = db.bookings.find((x) => x.id === id)
      if (!b || b.status !== 'confirmed') return null
      const done = b.reminder?.startAt === b.startAt ? b.reminder : undefined // a reschedule re-arms it
      const needEmail = !done?.email, needSms = !done?.sms
      if (!needEmail && !needSms) return {skip: true} as const
      b.reminder = {startAt: b.startAt, email: true, sms: true}
      return {
        b: {...b}, needEmail, needSms,
        t: db.consultTypes.find((x) => x.id === b.typeId)!,
        s: db.staff.find((x) => x.id === b.staffId)!,
      }
    })
    if (!claim) continue
    out.checked++
    if ('skip' in claim) continue
    const {b, t, s, needEmail, needSms} = claim
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
      await updateDB((db) => {
        const f = db.bookings.find((x) => x.id === id)
        if (f && f.reminder?.startAt === b.startAt) f.reminder = {startAt: b.startAt, email: !failed.email, sms: !failed.sms} // retried on the next run
      })
    }
  }
  return out
}
