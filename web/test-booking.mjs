// Booking API tests. Run with the dev server up (npm run dev).
//   cd ~/work/manas-booking/web
//   set -a; . ./.env.local; set +a
//   node test-booking.mjs            (BASE=http://localhost:3000 by default)
// Needs Node 18+. Uses only @example.com addresses. Cancels every booking it makes.

const BASE = process.env.BASE || 'http://localhost:3000'
const KEY = process.env.TEAM_PASSWORD
if (!KEY) { console.error('TEAM_PASSWORD not set. Run: set -a; . ./.env.local; set +a'); process.exit(2) }

let pass = 0, fail = 0
const made = []
const ok = (cond, name, extra = '') => {
  if (cond) { pass++; console.log('  PASS', name) } else { fail++; console.log('  FAIL', name, extra) }
}
const get = async (p, h = {}) => { const r = await fetch(BASE + p, {headers: h}); return {s: r.status, j: await r.json().catch(() => null)} }
const post = async (p, body, h = {}) => {
  const r = await fetch(BASE + p, {method: 'POST', headers: {'content-type': 'application/json', ...h}, body: JSON.stringify(body)})
  return {s: r.status, j: await r.json().catch(() => null)}
}
const istDay = (offset) => new Date(Date.now() + 19800000 + offset * 864e5).toISOString().slice(0, 10)
const dow = (d) => new Date(d + 'T00:00:00Z').getUTCDay()
const slots = async (type, date) => (await get(`/api/slots?type=${type}&date=${date}`)).j
const person = (tag) => ({parentName: 'Test Parent ' + tag, email: `test-${tag}@example.com`, phone: '9000000000', childName: 'Test', childAge: '6', concern: 'automated test'})
const book = async (typeId, startAt, tag) => {
  const r = await post('/api/book', {typeId, startAt, ...person(tag)})
  if (r.s === 200 && r.j?.bookingId) made.push(r.j.bookingId)
  return r
}
const cancel = (id, key = KEY) => post('/api/team/cancel', {id}, {'x-team-key': key})

async function findDays(type, n, minSlots) {
  const out = []
  for (let d = 3; d <= 25 && out.length < n; d++) {
    const date = istDay(d)
    const s = await slots(type, date)
    if (Array.isArray(s) && s.length >= minSlots) out.push({date, s})
  }
  return out
}

try {
  console.log('\n[1] Basics')
  const types = await get('/api/types')
  ok(types.s === 200 && JSON.stringify(types.j).includes('free-counselling'), 'types lists free-counselling')

  console.log('\n[2] Slot rules')
  let sunday = null
  for (let d = 3; d <= 25; d++) if (dow(istDay(d)) === 0) { sunday = istDay(d); break }
  ok(sunday && (await slots('free-counselling', sunday)).length === 0, 'Sunday has no slots', sunday)
  ok((await slots('free-counselling', 'garbage')).length === 0, 'bad date gives []')
  ok((await slots('no-such-type', istDay(4))).length === 0, 'unknown type gives []')
  ok((await slots('free-counselling', istDay(60))).length === 0, 'beyond 30 days gives []')
  ok((await slots('free-counselling', istDay(-2))).length === 0, 'past date gives []')

  const [d1, d2] = await findDays('free-counselling', 2, 3)
  if (!d1 || !d2) throw new Error('Could not find two days with 3+ free slots in the next 25 days. Is data/db.json very full?')
  const day1 = d1.s, S = day1[0].startAt, S2 = day1[day1.length - 1].startAt
  ok(/^\d{2}:\d{2}$/.test(day1[0].label), 'slot has HH:MM label', day1[0].label)

  console.log('\n[3] Validation')
  ok((await post('/api/book', {typeId: 'free-counselling', startAt: S})).s === 400, 'missing fields gives 400')
  ok((await post('/api/book', {typeId: 'free-counselling', startAt: S, ...person('x'), email: 'not-an-email'})).s === 400, 'bad email gives 400')
  ok((await post('/api/book', {typeId: 'nope', startAt: S, ...person('x')})).s === 400, 'unknown type gives 400')
  ok((await post('/api/book', {typeId: 'free-counselling', startAt: 'garbage', ...person('x')})).s === 400, 'bad startAt gives 400')
  ok((await book('free-counselling', new Date(Date.now() - 864e5).toISOString(), 'past')).s === 409, 'past time gives 409')
  ok((await book('free-counselling', new Date(Date.now() + 36e5).toISOString(), 'soon')).s === 409, 'inside 12h notice gives 409')
  ok((await book('free-counselling', new Date(Date.parse(S) + 7 * 60000).toISOString(), 'offgrid')).s === 409, 'off-grid time gives 409')

  console.log('\n[4] Double booking (2 consultants)')
  const b1 = await book('free-counselling', S, 'one')
  ok(b1.s === 200 && b1.j.ok === true && b1.j.needsPayment === false, 'booking 1 succeeds, free', JSON.stringify(b1))
  ok((b1.j?.bookingId || '').startsWith('booking-demo-a-'), 'booking 1 goes to consultant A', b1.j?.bookingId)
  ok((await slots('free-counselling', d1.date)).some((x) => x.startAt === S), 'slot still offered (B is free)')
  const b2 = await book('free-counselling', S, 'two')
  ok(b2.s === 200 && (b2.j?.bookingId || '').startsWith('booking-demo-b-'), 'booking 2 goes to consultant B', JSON.stringify(b2))
  ok(!(await slots('free-counselling', d1.date)).some((x) => x.startAt === S), 'slot gone once both are booked')
  ok((await book('free-counselling', S, 'three')).s === 409, 'booking 3 on same slot gives 409')

  console.log('\n[5] Team API + cancel')
  ok((await get('/api/team/bookings')).s === 401, 'team bookings needs key')
  ok((await get('/api/team/bookings', {'x-team-key': 'wrong'})).s === 401, 'team bookings rejects wrong key')
  const tb = await get('/api/team/bookings', {'x-team-key': KEY})
  ok(tb.s === 200 && tb.j.bookings.some((x) => x.id === b1.j.bookingId), 'team sees booking 1')
  ok((await cancel(b1.j.bookingId, 'wrong')).s === 401, 'cancel rejects wrong key')
  ok((await cancel('booking-nope')).s === 404, 'cancel unknown id gives 404')
  ok((await cancel(b1.j.bookingId)).s === 200, 'cancel booking 1')
  ok((await cancel(b1.j.bookingId)).s === 200, 'cancel twice is harmless')
  ok((await slots('free-counselling', d1.date)).some((x) => x.startAt === S), 'cancelled slot is offered again')
  const b4 = await book('free-counselling', S, 'rebook')
  ok(b4.s === 200 && b4.j.bookingId.startsWith('booking-demo-a-'), 'can rebook freed slot (A again)', JSON.stringify(b4))

  console.log('\n[6] Race: 6 simultaneous requests for one slot (2 consultants)')
  const race = await Promise.all([1, 2, 3, 4, 5, 6].map((i) => book('free-counselling', S2, 'race' + i)))
  const wins = race.filter((r) => r.s === 200).length, losses = race.filter((r) => r.s === 409).length
  ok(wins === 2 && losses === 4, 'exactly 2 succeed, 4 get 409', `wins=${wins} losses=${losses}`)
  const ids = race.filter((r) => r.s === 200).map((r) => r.j.bookingId)
  ok(new Set(ids).size === ids.length, 'winners got different consultants', ids.join(', '))

  console.log('\n[7] Paid type + staff eligibility')
  const exp = (await findDays('expert-consultation', 1, 1))[0]
  if (!exp) throw new Error('No expert-consultation slots found')
  const E = exp.s[0].startAt
  const e1 = await book('expert-consultation', E, 'paid')
  ok(e1.s === 200 && e1.j.needsPayment === true, 'paid type needs payment', JSON.stringify(e1))
  ok(e1.j?.bookingId?.startsWith('booking-demo-a-'), 'expert goes to A (B not eligible)', e1.j?.bookingId)
  ok((await book('expert-consultation', E, 'paid2')).s === 409, 'expert slot taken after one booking (only A)')
  const tb2 = await get('/api/team/bookings', {'x-team-key': KEY})
  ok(tb2.j.bookings.find((x) => x.id === e1.j.bookingId)?.status === 'pending_payment', 'paid booking is pending_payment')
  ok(tb2.j.bookings.find((x) => x.id === b4.j.bookingId)?.status === 'confirmed', 'free booking is confirmed')

  console.log('\n[8] Buffer overlap')
  const next = day1.find((x) => Date.parse(x.startAt) > Date.parse(S) && Date.parse(x.startAt) < Date.parse(S) + 40 * 60000)
  ok(!next, 'no slot offered inside the 40 min block (sanity)')
} catch (e) {
  fail++; console.log('\nERROR:', e.message)
} finally {
  console.log('\nCleaning up', made.length, 'test bookings...')
  for (const id of made) await cancel(id).catch(() => {})
  console.log(`\n${pass} passed, ${fail} failed`)
  process.exit(fail ? 1 : 0)
}
