import {NextResponse} from 'next/server'
import {requireTeam} from '@/lib/auth'
import {updateDB} from '@/lib/store'
import {sendInvites} from '@/lib/mail'

export async function POST(req: Request) {
  if (!(await requireTeam(req))) return NextResponse.json({error: 'Unauthorized'}, {status: 401})
  const {id} = await req.json().catch(() => ({}))
  const r = await updateDB((db) => {
    const b = db.bookings.find((x) => x.id === id)
    if (!b) return {error: 'Not found', status: 404} as const
    if (b.status === 'cancelled') return {done: true} as const
    b.status = 'cancelled'; b.cancelledBy = 'team'; b.cancelledAt = new Date().toISOString()
    return {b: {...b}, t: db.consultTypes.find((x) => x.id === b.typeId)!, s: db.staff.find((x) => x.id === b.staffId)!} as const
  })
  if ('error' in r) return NextResponse.json({error: r.error}, {status: r.status})
  if ('done' in r) return NextResponse.json({ok: true})
  try { await sendInvites(r.b, r.t, r.s, 'cancelled') } catch (e) { console.error('[mail] failed', e) }
  return NextResponse.json({ok: true})
}
