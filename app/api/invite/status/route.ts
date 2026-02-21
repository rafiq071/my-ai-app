import { NextRequest, NextResponse } from 'next/server'
import { assertBetaAccess } from '@/lib/beta-access'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await requireAuth().catch(() => null)
  const email = (user as any)?.email || null
  const gate = await assertBetaAccess(req, email)
  return NextResponse.json({ ok: gate.ok, reason: gate.reason || null })
}
