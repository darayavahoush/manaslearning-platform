import {NextResponse} from 'next/server'
import {readDB} from '@/lib/store'

export async function GET(req: Request) {
  const key = process.env.TEAM_PASSWORD
  if (!key || req.headers.get('x-team-key') !== key) return NextResponse.json({error: 'Unauthorized'}, {status: 401})
  const db = readDB()
  return NextResponse.json({staff: db.staff, types: db.consultTypes, bookings: db.bookings})
}
