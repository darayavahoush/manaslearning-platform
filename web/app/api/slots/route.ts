import {NextResponse} from 'next/server'
import {readDB} from '@/lib/store'
import {getSlots} from '@/lib/slots'

export async function GET(req: Request) {
  const u = new URL(req.url)
  const date = u.searchParams.get('date') || ''
  const db = readDB()
  const t = db.consultTypes.find((x) => x.id === u.searchParams.get('type') && x.active)
  if (!t || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json([])
  return NextResponse.json(getSlots(db, t, date).map(({startAt, label}) => ({startAt, label})))
}
