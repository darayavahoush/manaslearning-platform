// Data layer. One JSON document, stored in Azure Blob Storage when AZURE_STORAGE_CONNECTION_STRING is set
// (required on Vercel, whose disk is read-only) and in a local file otherwise (development).
// Writes are checked against the blob's ETag, so two simultaneous requests can never overwrite each other:
// the loser re-reads and retries. Change data with updateDB(); readDB() is for read-only paths.
import fs from 'node:fs'
import path from 'node:path'
import {BlobServiceClient, type BlockBlobClient} from '@azure/storage-blob'
import {hashPassword} from '@/lib/password'

export type ConsultType = {id: string; title: string; description: string; durationMins: number; bufferMins: number; priceINR: number; minNoticeHours: number; maxDaysAhead: number; active: boolean; /** defaults to true for everything except free-counselling */ requiresLogin?: boolean}
export type Staff = {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  consultTypeIds: string[]
  weeklyHours: { day: number; start: string; end: string }[]
  leave: { from: string; to: string }[]
  passwordHash?: string
  /** @deprecated legacy plaintext; migrated to passwordHash on first read, then deleted */
  password?: string
  phone?: string
}
export type Booking = {id: string; typeId: string; staffId: string; startAt: string; endAt: string; blockEnd: number; status: string; parentName: string; email: string; phone: string; childName: string; childAge: string; concern: string; createdAt: string; confirmToken?: string; expiresAt?: number; paymentStatus?: 'not_required' | 'pending' | 'paid'; rescheduleCount?: number; sequence?: number; cancelledBy?: 'parent' | 'team'; cancelledAt?: string; rescheduledAt?: string; payBy?: number; payOrders?: string[]; paidAt?: string; txnId?: string; payIssue?: string; reminder?: {startAt: string; email?: boolean; sms?: boolean}}
export type LoginCode = {email: string; hash: string; exp: number; sentAt: number; attempts: number}
export type DB = {consultTypes: ConsultType[]; staff: Staff[]; bookings: Booking[]; loginCodes?: LoginCode[]; configVersion?: number}

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
const FILE = path.join(DATA_DIR, 'db.json')
// Consultation hours: 10:30 AM to 7:00 PM IST, Monday to Friday.
const hoursStandard = [1, 2, 3, 4, 5].map((day) => ({day, start: '10:30', end: '19:00'}))
const CONFIG_VERSION = 2
const seed: DB = {
  consultTypes: [
    {id: 'free-counselling', title: 'Free Counselling', description: 'A first conversation about your child and how we can help.', durationMins: 15, bufferMins: 0, priceINR: 0, minNoticeHours: 1, maxDaysAhead: 30, active: true},
    {id: 'expert-consultation', title: 'Expert Consultation', description: 'One-to-one session with a specialist.', durationMins: 45, bufferMins: 15, priceINR: 999, minNoticeHours: 1, maxDaysAhead: 30, active: true},
    {id: 'iep-consultation', title: 'IEP Consultation', description: 'Plan an Individualised Education Programme for your child.', durationMins: 45, bufferMins: 15, priceINR: 0, minNoticeHours: 1, maxDaysAhead: 30, active: true},
  ],
  staff: [
    {id: 'dr-manasi', name: 'Dr. Manasi Valluri', email: 'manasi@manaslearning.com', role: 'Founder & Developmental Specialist', active: true, consultTypeIds: ['free-counselling', 'expert-consultation', 'iep-consultation'], weeklyHours: hoursStandard, leave: []},
    {id: 'ananya-sridhar', name: 'Ananya Sridhar', email: 'ananya@manaslearning.com', role: 'Senior Special Educator & Remedial Specialist', active: true, consultTypeIds: ['free-counselling', 'expert-consultation', 'iep-consultation'], weeklyHours: hoursStandard, leave: []},
    {id: 'dr-radhika', name: 'Dr. Radhika Sharma', email: 'radhika@manaslearning.com', role: 'Occupational Therapist & Sensory Specialist', active: true, consultTypeIds: ['free-counselling', 'expert-consultation'], weeklyHours: hoursStandard, leave: []},
    {id: 'kavitha-s', name: 'Kavitha Sundaram', email: 'kavitha@manaslearning.com', role: 'Speech-Language Pathologist', active: true, consultTypeIds: ['free-counselling', 'expert-consultation'], weeklyHours: hoursStandard, leave: []},
    {id: 'arun-kumar', name: 'Arun Kumar', email: 'arun@manaslearning.com', role: 'Clinical Child Psychologist', active: true, consultTypeIds: ['free-counselling', 'expert-consultation', 'iep-consultation'], weeklyHours: hoursStandard, leave: []},
  ],
  bookings: [],
  configVersion: CONFIG_VERSION,
}


/** Brings an older data file up to date. Returns true if anything changed. */
function normalize(db: DB): boolean {
  let changed = false
  // Hash any legacy plaintext staff password, then drop it.
  for (const s of db.staff) {
    if (s.password) {
      if (!s.passwordHash) s.passwordHash = hashPassword(s.password)
      delete s.password
      changed = true
    }
  }
  // One-time config migration: new session length, booking notice and consultation hours.
  // Applied once; later edits from the team page are kept.
  if ((db.configVersion ?? 0) < CONFIG_VERSION) {
    for (const t of db.consultTypes) {
      t.minNoticeHours = 1
      if (t.id === 'free-counselling') { t.durationMins = 15; t.bufferMins = 0 }
    }
    for (const st of db.staff) st.weeklyHours = hoursStandard.map((h) => ({...h}))
    db.configVersion = CONFIG_VERSION
    changed = true
  }
  return changed
}

// ---------- backends ----------
type Loaded = {db: DB; etag?: string; raw: string | null}

const CONN = process.env.AZURE_STORAGE_CONNECTION_STRING
const CONTAINER = process.env.AZURE_STORAGE_CONTAINER || 'manas-data'
let blobP: Promise<BlockBlobClient> | undefined
function blob(): Promise<BlockBlobClient> {
  blobP ??= (async () => {
    const c = BlobServiceClient.fromConnectionString(CONN!).getContainerClient(CONTAINER)
    await c.createIfNotExists()
    return c.getBlockBlobClient('db.json')
  })().catch((e) => { blobP = undefined; throw e })
  return blobP
}
const status = (e: unknown) => (e as {statusCode?: number})?.statusCode

async function azLoad(): Promise<Loaded | null> {
  const b = await blob()
  try {
    const r = await b.download() // content and ETag come from the same response
    const chunks: Buffer[] = []
    for await (const c of r.readableStreamBody as AsyncIterable<Buffer | string>) chunks.push(Buffer.from(c))
    const raw = Buffer.concat(chunks).toString('utf8')
    return {db: JSON.parse(raw), etag: r.etag, raw}
  } catch (e) {
    if (status(e) === 404) return null
    throw e
  }
}
/** Returns false if somebody else changed the blob since we read it. */
async function azSave(db: DB, etag?: string): Promise<boolean> {
  const b = await blob()
  const body = JSON.stringify(db)
  try {
    await b.upload(body, Buffer.byteLength(body), {
      blobHTTPHeaders: {blobContentType: 'application/json'},
      conditions: etag ? {ifMatch: etag} : {ifNoneMatch: '*'},
    })
    return true
  } catch (e) {
    if (status(e) === 412 || status(e) === 409) return false
    throw e
  }
}

function fileLoad(): Loaded {
  if (!fs.existsSync(FILE)) return {db: structuredClone(seed), raw: null}
  const raw = fs.readFileSync(FILE, 'utf8')
  return {db: JSON.parse(raw), raw}
}
function fileSave(db: DB) {
  fs.mkdirSync(path.dirname(FILE), {recursive: true})
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2))
}

function requireBackend() {
  if (!CONN && process.env.VERCEL) throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set. Vercel\'s disk is read-only, so the app needs Azure Blob Storage.')
}

async function load(): Promise<Loaded> {
  requireBackend()
  if (!CONN) return fileLoad()
  const l = await azLoad()
  return l ?? {db: structuredClone(seed), raw: null}
}

/** Current data. Never blocks on a write; if the file is old or missing, the up-to-date copy is saved first. */
export async function readDB(): Promise<DB> {
  const l = await load()
  const changed = normalize(l.db)
  if (changed || l.raw === null) {
    try {
      if (!CONN) fileSave(l.db)
      else await azSave(l.db, l.etag) // if we lose a race here, the next read redoes it
    } catch (e) { console.error('[store] could not save upgraded data', e) }
  }
  return l.db
}

/**
 * Change the data safely. `fn` edits the db it is given (it must be synchronous and have no side
 * effects other than editing it, because it re-runs if another request got there first) and may
 * return a value. Nothing is written if fn changed nothing. Do slow work (email, payments) after.
 */
export async function updateDB<T>(fn: (db: DB) => T): Promise<T> {
  requireBackend()
  if (!CONN) {
    // No await between read and write, so no other request can slip in.
    const l = fileLoad()
    const before = JSON.stringify(l.db)
    normalize(l.db)
    const out = fn(l.db)
    if (l.raw === null || JSON.stringify(l.db) !== before) fileSave(l.db)
    return out
  }
  for (let attempt = 0; attempt < 10; attempt++) {
    const l = (await azLoad()) ?? {db: structuredClone(seed), etag: undefined, raw: null}
    const before = JSON.stringify(l.db)
    normalize(l.db)
    const out = fn(l.db)
    if (l.raw === null || JSON.stringify(l.db) !== before) {
      if (!(await azSave(l.db, l.etag))) {
        await new Promise((r) => setTimeout(r, 20 + Math.random() * 80 * (attempt + 1)))
        continue
      }
    }
    return out
  }
  throw new Error('Too many simultaneous changes. Please try again.')
}
