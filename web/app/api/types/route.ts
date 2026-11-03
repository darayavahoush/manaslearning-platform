import {NextResponse} from 'next/server'
import {readDB} from '@/lib/store'
import {needsLogin} from '@/lib/policy'

export async function GET() {
  const {consultTypes} = readDB()
  return NextResponse.json(consultTypes.filter((t) => t.active).map((t) => ({id: t.id, title: t.title, description: t.description, durationMins: t.durationMins, priceINR: t.priceINR, requiresLogin: needsLogin(t)})))
}
