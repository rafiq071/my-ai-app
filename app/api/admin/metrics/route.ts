import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAuth } from '@/lib/auth'
import { isAdminEmail } from '@/lib/beta-access'

async function requireAdmin() {
  const user = await requireAuth().catch(() => null)
  if (!user?.email || !isAdminEmail(user.email)) return null
  return user
}

function rangeToFrom(range: string): Date {
  const now = Date.now()
  switch (range) {
    case '24h':
      return new Date(now - 24 * 60 * 60 * 1000)
    case '30d':
      return new Date(now - 30 * 24 * 60 * 60 * 1000)
    case '7d':
    default:
      return new Date(now - 7 * 24 * 60 * 60 * 1000)
  }
}

export async function GET(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = getSupabaseAdmin()
  if (!admin) return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 })

  const { searchParams } = new URL(req.url)
  const range = (searchParams.get('range') || '7d').toLowerCase()
  const from = rangeToFrom(range)

  const { data, error } = await admin
    .from('generation_logs')
    .select('created_at, schema_ok, error_code, actual_cost_usd, latency_ms')
    .gte('created_at', from.toISOString())
    .order('created_at', { ascending: false })
    .limit(10_000)

  if (error) return NextResponse.json({ error: 'Failed to load metrics' }, { status: 500 })

  const rows = data || []
  let total = rows.length
  let ok = 0
  let schemaFail = 0
  let securityFail = 0
  let otherFail = 0
  let cost = 0
  const latencies: number[] = []

  for (const r of rows as any[]) {
    if (r.schema_ok) ok++
    else {
      const code = String(r.error_code || '')
      if (code === 'schema_validation_failed' || code === 'json_parse_failed') schemaFail++
      else if (code === 'security_scan_failed') securityFail++
      else otherFail++
    }
    const c = r.actual_cost_usd
    if (typeof c === 'number') cost += c
    else if (typeof c === 'string') {
      const n = Number(c)
      if (!Number.isNaN(n)) cost += n
    }
    const l = r.latency_ms
    if (typeof l === 'number' && l > 0) latencies.push(l)
  }

  latencies.sort((a, b) => a - b)
  const p95 = latencies.length ? latencies[Math.floor(0.95 * (latencies.length - 1))] : null
  const avg = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null

  return NextResponse.json({
    range,
    from: from.toISOString(),
    total,
    ok,
    fail: total - ok,
    fail_breakdown: { schemaFail, securityFail, otherFail },
    cost_usd: Number(cost.toFixed(4)),
    latency_ms: { avg, p95 },
  })
}
