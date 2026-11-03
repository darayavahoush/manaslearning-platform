import {NextResponse} from 'next/server'
import {requireTeam} from '@/lib/auth'
import {updateDB, Booking} from '@/lib/store'
import crypto from 'node:crypto'

export async function POST(req: Request) {
  if (!(await requireTeam(req))) return NextResponse.json({error: 'Unauthorized'}, {status: 401})
  const body = await req.json().catch(() => null)
  if (!body || !body.staffId || !body.typeId || !body.startAt || !body.parentName) {
    return NextResponse.json({error: 'Missing required booking fields'}, {status: 400})
  }

  const startMs = Date.parse(body.startAt)
  if (isNaN(startMs)) return NextResponse.json({error: 'Invalid start time'}, {status: 400})
  const suffix = crypto.randomBytes(4).toString('hex')

  const r = await updateDB((db) => {
  const staff = db.staff.find((s) => s.id === body.staffId)
  const type = db.consultTypes.find((t) => t.id === body.typeId)
  if (!staff || !type) return null
  const endMs = startMs + type.durationMins * 60000
  const blockEnd = endMs + type.bufferMins * 60000
  const newBooking: Booking = {
    id: `booking-${staff.id}-${startMs}-${suffix}`,
    typeId: type.id,
    staffId: staff.id,
    startAt: new Date(startMs).toISOString(),
    endAt: new Date(endMs).toISOString(),
    blockEnd,
    status: 'confirmed',
    parentName: body.parentName.trim(),
    email: body.email?.trim() || `${staff.id}@manaslearning.com`,
    phone: body.phone?.trim() || 'N/A',
    childName: body.childName?.trim() || 'Client',
    childAge: body.childAge?.trim() || 'N/A',
    concern: body.concern?.trim() || 'Consultation',
    createdAt: new Date().toISOString(),
  }

  db.bookings.push(newBooking)
  return newBooking
  })
  if (!r) return NextResponse.json({error: 'Staff or consult type not found'}, {status: 404})
  return NextResponse.json({ok: true, booking: r})
}
