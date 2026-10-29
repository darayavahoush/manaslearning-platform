// Data layer. Local JSON file for now; swap this file for a Sanity adapter later.
import fs from 'node:fs'
import path from 'node:path'

export type ConsultType = {id: string; title: string; description: string; durationMins: number; bufferMins: number; priceINR: number; minNoticeHours: number; maxDaysAhead: number; active: boolean}
export type Staff = {id: string; name: string; email: string; role: string; active: boolean; consultTypeIds: string[]; weeklyHours: {day: number; start: string; end: string}[]; leave: {from: string; to: string}[]}
export type Booking = {id: string; typeId: string; staffId: string; startAt: string; endAt: string; blockEnd: number; status: string; parentName: string; email: string; phone: string; childName: string; childAge: string; concern: string; createdAt: string; confirmToken?: string; expiresAt?: number}
export type DB = {consultTypes: ConsultType[]; staff: Staff[]; bookings: Booking[]}

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
const FILE = path.join(DATA_DIR, 'db.json')
const hours = [1, 2, 3, 4, 5, 6].map((day) => ({day, start: '10:00', end: '17:00'}))
const seed: DB = {
  consultTypes: [
    {id: 'free-counselling', title: 'Free Counselling', description: 'A first conversation about your child and how we can help.', durationMins: 30, bufferMins: 10, priceINR: 0, minNoticeHours: 12, maxDaysAhead: 30, active: true},
    {id: 'expert-consultation', title: 'Expert Consultation', description: 'One-to-one session with a specialist.', durationMins: 45, bufferMins: 15, priceINR: 999, minNoticeHours: 12, maxDaysAhead: 30, active: true},
    {id: 'iep-consultation', title: 'IEP Consultation', description: 'Plan an Individualised Education Programme for your child.', durationMins: 45, bufferMins: 15, priceINR: 0, minNoticeHours: 12, maxDaysAhead: 30, active: true},
  ],
  staff: [
    {id: 'demo-a', name: 'Demo Consultant A', email: 'a@example.com', role: 'Child Psychologist', active: true, consultTypeIds: ['free-counselling', 'expert-consultation', 'iep-consultation'], weeklyHours: hours, leave: []},
    {id: 'demo-b', name: 'Demo Consultant B', email: 'b@example.com', role: 'Special Educator', active: true, consultTypeIds: ['free-counselling', 'iep-consultation'], weeklyHours: hours, leave: []},
  ],
  bookings: [],
}

export function readDB(): DB {
  if (!fs.existsSync(FILE)) {
    fs.mkdirSync(path.dirname(FILE), {recursive: true})
    fs.writeFileSync(FILE, JSON.stringify(seed, null, 2))
  }
  return JSON.parse(fs.readFileSync(FILE, 'utf8'))
}
export function writeDB(db: DB) {
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2))
}
