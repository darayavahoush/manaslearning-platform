import {NextResponse} from 'next/server'
import {readDB} from '@/lib/store'
import {getSlots} from '@/lib/slots'

export async function GET(req: Request) {
  const u = new URL(req.url)
  const month = u.searchParams.get('month') || ''
  const db = readDB()
  const t = db.consultTypes.find((x) => x.id === u.searchParams.get('type') && x.active)
  if (!t || !/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({})
  const [y, m] = month.split('-').map(Number)
  const n = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const out: Record<string, number> = {}
  for (let d = 1; d <= n; d++) {
    const date = `${month}-${String(d).padStart(2, '0')}`
    const c = getSlots(db, t, date).length
    if (c) out[date] = c
  }
  return NextResponse.json(out)
}
