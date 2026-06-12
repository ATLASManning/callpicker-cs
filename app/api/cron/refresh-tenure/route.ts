import { NextRequest, NextResponse } from 'next/server'
import { invalidateLtvCache, getLtvRows, getLtvCacheAge } from '@/lib/zoho-ltv'

export const dynamic = 'force-dynamic'
export const maxDuration = 55

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const t0 = Date.now()
  invalidateLtvCache()

  try {
    const rows = await getLtvRows()
    const ms   = Date.now() - t0

    return NextResponse.json({
      ok:     true,
      rows:   rows.length,
      ms,
      ts:     new Date().toISOString(),
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
