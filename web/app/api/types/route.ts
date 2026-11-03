import {NextResponse, connection} from 'next/server'
import {readDB} from '@/lib/store'
import {needsLogin} from '@/lib/policy'
import {paymentsEnabled} from '@/lib/paytm'

export async function GET() {
  await connection() // read live data per request; never prerender at build time
  const {consultTypes} = await readDB()
  return NextResponse.json(consultTypes.filter((t) => t.active).map((t) => ({id: t.id, title: t.title, description: t.description, durationMins: t.durationMins, priceINR: t.priceINR, requiresLogin: needsLogin(t), payOnline: paymentsEnabled()})))
}
