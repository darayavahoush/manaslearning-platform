import {NextResponse} from 'next/server'
import {readDB} from '@/lib/store'
import {requireTeam, publicStaff} from '@/lib/auth'

export async function GET(req: Request) {
  const session = requireTeam(req)
  if (!session) return NextResponse.json({error: 'Unauthorized'}, {status: 401})
  const db = readDB()
  // Specialists see only their own clients; the admin sees everything.
  const bookings = session.role === 'admin' ? db.bookings : db.bookings.filter((b) => b.staffId === session.sub)
  return NextResponse.json({staff: db.staff.map(publicStaff), types: db.consultTypes, bookings})
}
