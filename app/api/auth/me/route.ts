import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromHeaders } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = getSessionFromHeaders(req)
  if (!session) return NextResponse.json(null, { status: 401 })
  return NextResponse.json(session)
}
