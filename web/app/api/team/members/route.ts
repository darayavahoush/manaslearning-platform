import { NextResponse } from 'next/server'
import { requireAdmin, publicStaff, hashPassword } from '@/lib/auth'
import { readDB, writeDB, type Staff } from '@/lib/store'

const verifyAuth = (req: Request) => !!requireAdmin(req)

// Public: the booking UI needs names/roles only. No email, phone, or credentials.
export async function GET() {
  const db = readDB()
  return NextResponse.json({
    ok: true,
    staff: db.staff.map((s) => ({id: s.id, name: s.name, role: s.role, active: s.active, consultTypeIds: s.consultTypeIds})),
    consultTypes: db.consultTypes,
  })
}

export async function POST(req: Request) {
  if (!verifyAuth(req)) {
    return NextResponse.json({ error: 'Admin authorization required' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body || !body.name || !body.email || !body.role) {
    return NextResponse.json({ error: 'Name, email, and role are required' }, { status: 400 })
  }

  const db = readDB()
  const slug = body.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  let id = slug
  let counter = 1
  while (db.staff.some((s) => s.id === id)) {
    id = `${slug}-${counter++}`
  }

  const hoursStandard = [1, 2, 3, 4, 5]
    .map((day) => ({ day, start: '10:00', end: '17:00' }))
    .concat([{ day: 6, start: '10:00', end: '14:00' }])

  const pw = String(body.password ?? '').trim()
  if (pw.length < 10) {
    return NextResponse.json({ error: 'Password must be at least 10 characters' }, { status: 400 })
  }

  const newMember: Staff = {
    id,
    name: body.name.trim(),
    email: body.email.trim(),
    role: body.role.trim(),
    active: body.active !== undefined ? Boolean(body.active) : true,
    consultTypeIds: Array.isArray(body.consultTypeIds) && body.consultTypeIds.length > 0
      ? body.consultTypeIds
      : ['free-counselling', 'expert-consultation'],
    weeklyHours: Array.isArray(body.weeklyHours) && body.weeklyHours.length > 0
      ? body.weeklyHours
      : hoursStandard,
    leave: Array.isArray(body.leave) ? body.leave : [],
    passwordHash: hashPassword(pw),
    phone: body.phone?.trim() || '',
  }

  db.staff.push(newMember)
  writeDB(db)

  return NextResponse.json({ ok: true, staff: publicStaff(newMember) })
}

export async function DELETE(req: Request) {
  if (!verifyAuth(req)) {
    return NextResponse.json({ error: 'Admin authorization required' }, { status: 401 })
  }

  const u = new URL(req.url)
  const body = await req.json().catch(() => null)
  const staffId = u.searchParams.get('id') || body?.id || body?.staffId
  if (!staffId) {
    return NextResponse.json({ error: 'Missing staff id' }, { status: 400 })
  }

  const db = readDB()
  const idx = db.staff.findIndex((s) => s.id === staffId)
  if (idx === -1) {
    return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
  }

  const removed = db.staff.splice(idx, 1)[0]
  writeDB(db)

  return NextResponse.json({ ok: true, removed: { id: removed.id, name: removed.name } })
}

export async function PATCH(req: Request) {
  if (!verifyAuth(req)) {
    return NextResponse.json({ error: 'Admin authorization required' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body || !body.id) {
    return NextResponse.json({ error: 'Missing staff id' }, { status: 400 })
  }

  const db = readDB()
  const s = db.staff.find((x) => x.id === body.id)
  if (!s) {
    return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
  }

  if (body.name !== undefined) s.name = String(body.name).trim()
  if (body.email !== undefined) s.email = String(body.email).trim()
  if (body.role !== undefined) s.role = String(body.role).trim()
  if (body.phone !== undefined) s.phone = String(body.phone).trim()
  if (body.password !== undefined) {
    const pw = String(body.password).trim()
    if (pw.length < 10) return NextResponse.json({ error: 'Password must be at least 10 characters' }, { status: 400 })
    s.passwordHash = hashPassword(pw)
  }
  if (typeof body.active === 'boolean') s.active = body.active
  if (Array.isArray(body.consultTypeIds)) s.consultTypeIds = body.consultTypeIds
  if (Array.isArray(body.weeklyHours)) s.weeklyHours = body.weeklyHours
  if (Array.isArray(body.leave)) s.leave = body.leave

  writeDB(db)
  return NextResponse.json({ ok: true, staff: publicStaff(s) })
}
