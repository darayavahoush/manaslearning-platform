import {NextResponse} from 'next/server'
import {runReminders} from '@/lib/reminders'
import {safeEqual} from '@/lib/auth'

// Call this every 5 minutes. Vercel Cron and GitHub Actions both send `Authorization: Bearer <CRON_SECRET>`.
async function handle(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret && process.env.NODE_ENV === 'production') return NextResponse.json({error: 'CRON_SECRET is not set'}, {status: 503})
  if (secret && !safeEqual(req.headers.get('authorization') ?? '', `Bearer ${secret}`)) return NextResponse.json({error: 'Unauthorized'}, {status: 401})
  return NextResponse.json({ok: true, ...(await runReminders())})
}
export const GET = handle
export const POST = handle
