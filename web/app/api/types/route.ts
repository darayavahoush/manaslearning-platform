import {NextResponse} from 'next/server'
import {readDB} from '@/lib/store'

export async function GET() {
  const {consultTypes} = readDB()
  return NextResponse.json(consultTypes.filter((t) => t.active).map(({id, title, description, durationMins, priceINR}) => ({id, title, description, durationMins, priceINR})))
}
