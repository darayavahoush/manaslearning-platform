import {NextResponse} from 'next/server'
import {readParent, unauthorized} from '@/lib/parent'

export async function GET(req: Request) {
  const p = readParent(req)
  return p ? NextResponse.json({email: p.sub}) : unauthorized()
}
