import {NextResponse} from 'next/server'
import {requireTeam} from '@/lib/auth'
import {readDB, writeDB} from '@/lib/store'
import {sendInvites} from '@/lib/mail'

export async function POST(req: Request) {
  if (!requireTeam(req)) return NextResponse.json({error: 'Unauthorized'}, {status: 401})
  const db = readDB()
  const {id} = await req.json().catch(() => ({}))
  const b = db.bookings.find((x) => x.id === id)
  if (!b) return NextResponse.json({error: 'Not found'}, {status: 404})
  if (b.status === 'cancelled') return NextResponse.json({ok: true})
  b.status = 'cancelled'
  writeDB(db)
  const t = db.consultTypes.find((x) => x.id === b.typeId)!
  const s = db.staff.find((x) => x.id === b.staffId)!
  try { await sendInvites(b, t, s, 'cancelled') } catch (e) { console.error('[mail] failed', e) }
  return NextResponse.json({ok: true})
}
