// Data layer. Local JSON file for now; swap this file for a Sanity adapter later.
import fs from 'node:fs'
import path from 'node:path'

export type ConsultType = {id: string; title: string; description: string; durationMins: number; bufferMins: number; priceINR: number; minNoticeHours: number; maxDaysAhead: number; active: boolean}
export type Staff = {id: string; name: string; email: string; role: string; active: boolean; consultTypeIds: string[]; weeklyHours: {day: number; start: string; end: string}[]; leave: {from: string; to: string}[]}
export type Booking = {id: string; typeId: string; staffId: string; startAt: string; endAt: string; blockEnd: number; status: string; parentName: string; email: string; phone: string; childName: string; childAge: string; concern: string; createdAt: string; confirmToken?: string; expiresAt?: number}
export type DB = {consultTypes: ConsultType[]; staff: Staff[]; bookings: Booking[]}

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
const FILE = path.join(DATA_DIR, 'db.json')
const hoursStandard = [1, 2, 3, 4, 5].map((day) => ({day, start: '10:00', end: '17:00'})).concat([{day: 6, start: '10:00', end: '14:00'}])
const seed: DB = {
  consultTypes: [
    {id: 'free-counselling', title: 'Free Counselling', description: 'A first conversation about your child and how we can help.', durationMins: 30, bufferMins: 10, priceINR: 0, minNoticeHours: 12, maxDaysAhead: 30, active: true},
    {id: 'expert-consultation', title: 'Expert Consultation', description: 'One-to-one session with a specialist.', durationMins: 45, bufferMins: 15, priceINR: 999, minNoticeHours: 12, maxDaysAhead: 30, active: true},
    {id: 'iep-consultation', title: 'IEP Consultation', description: 'Plan an Individualised Education Programme for your child.', durationMins: 45, bufferMins: 15, priceINR: 0, minNoticeHours: 12, maxDaysAhead: 30, active: true},
  ],
  staff: [
    {id: 'dr-manasi', name: 'Dr. Manasi Valluri', email: 'manasi@manaslearning.com', role: 'Founder & Developmental Specialist', active: true, consultTypeIds: ['free-counselling', 'expert-consultation', 'iep-consultation'], weeklyHours: hoursStandard, leave: []},
    {id: 'ananya-sridhar', name: 'Ananya Sridhar', email: 'ananya@manaslearning.com', role: 'Senior Special Educator & Remedial Specialist', active: true, consultTypeIds: ['free-counselling', 'expert-consultation', 'iep-consultation'], weeklyHours: hoursStandard, leave: []},
    {id: 'dr-radhika', name: 'Dr. Radhika Sharma', email: 'radhika@manaslearning.com', role: 'Occupational Therapist & Sensory Specialist', active: true, consultTypeIds: ['free-counselling', 'expert-consultation'], weeklyHours: hoursStandard, leave: []},
    {id: 'kavitha-s', name: 'Kavitha Sundaram', email: 'kavitha@manaslearning.com', role: 'Speech-Language Pathologist', active: true, consultTypeIds: ['free-counselling', 'expert-consultation'], weeklyHours: hoursStandard, leave: []},
    {id: 'arun-kumar', name: 'Arun Kumar', email: 'arun@manaslearning.com', role: 'Clinical Child Psychologist', active: true, consultTypeIds: ['free-counselling', 'expert-consultation', 'iep-consultation'], weeklyHours: hoursStandard, leave: []},
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
