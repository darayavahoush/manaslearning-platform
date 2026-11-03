// Booking policy. Applies to expert + IEP sessions (anything that needs login).
// Free counselling stays open to guests and can be cancelled at any time.
import type {Booking, ConsultType} from './store'

export const CANCEL_CUTOFF_HOURS = 24
export const MAX_RESCHEDULES = 1
export const RESCHEDULE_WINDOW_DAYS = 14

export const needsLogin = (t: ConsultType) => t.requiresLogin ?? t.id !== 'free-counselling'

export type Actions = {canCancel: boolean; canReschedule: boolean; note?: string}

export function bookingActions(b: Booking, t: ConsultType, now = Date.now()): Actions {
  const live = b.status === 'confirmed' || (b.status === 'pending_payment' && !(b.payBy !== undefined && b.payBy < now))
  const start = Date.parse(b.startAt)
  if (!live || start <= now) return {canCancel: false, canReschedule: false}
  if (!needsLogin(t)) return {canCancel: true, canReschedule: false}
  const hoursLeft = (start - now) / 36e5
  if (hoursLeft < CANCEL_CUTOFF_HOURS)
    return {canCancel: false, canReschedule: false, note: `Changes close ${CANCEL_CUTOFF_HOURS} hours before the session. Please contact our team if you can’t make it.`}
  const used = (b.rescheduleCount ?? 0) >= MAX_RESCHEDULES
  return {canCancel: true, canReschedule: !used, note: used ? 'You have already rescheduled this session once. You can cancel and book a new one.' : undefined}
}
