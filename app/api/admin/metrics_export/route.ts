import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAuth } from '@/lib/auth'
import { isAdminEmail } from '@/lib/beta-access'

async function requireAdmin() {
  const user = await requireAuth().catch(() => null)
  if (!user?.email || !isAdminEmail(user.email)) return null
  return user
}

function parseDateOrNull(v: string | null): Date | null {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

export async function GET(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = getSupabaseAdmin()
  if (!admin) return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 })

  const { searchParams } = new URL(req.url)
  const from = parseDateOrNull(searchParams.get('from')) || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const to = parseDateOrNull(searchParams.get('to')) || new Date()
  const format = (searchParams.get('format') || 'csv').toLowerCase()

  const { data, error } = await admin
    .from('generation_logs')
    .select(
      'created_at,user_id,ip_hash,model_id,model_name,input_chars,input_tokens,output_tokens,actual_cost_usd,latency_ms,schema_ok,retries,fallback_used,error_code'
    )
    .gte('created_at', from.toISOString())
    .lte('created_at', to.toISOString())
    .order('created_at', { ascending: false })
    .limit(50_000)

  if (error) return NextResponse.json({ error: 'Failed to export metrics' }, { status: 500 })

  if (format === 'json') {
    return NextResponse.json({ from: from.toISOString(), to: to.toISOString(), rows: data || [] })
  }

  const header = [
    'created_at',
    'user_id',
    'ip_hash',
    'model_id',
    'model_name',
    'input_chars',
    'input_tokens',
    'output_tokens',
    'actual_cost_usd',
    'latency_ms',
    'schema_ok',
    'retries',
    'fallback_used',
    'error_code',
  ]

  const escape = (v: any) => {
    const s = v == null ? '' : String(v)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"'
    return s
  }

  const lines: string[] = []
  lines.push(header.join(','))
  for (const r of (data || []) as any[]) {
    const row = header.map((k) => escape((r as any)[k]))
    lines.push(row.join(','))
  }

  const csv = lines.join('\n')
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="generation_logs_${from.toISOString().slice(0, 10)}_${to
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  })
}
