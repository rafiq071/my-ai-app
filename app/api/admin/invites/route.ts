import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAuth } from '@/lib/auth'
import { isAdminEmail } from '@/lib/beta-access'

function randomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const parts = [4, 4, 4]
  const out: string[] = []
  for (const n of parts) {
    const p: string[] = []
    for (let i = 0; i < n; i++) {
      p.push(alphabet[Math.floor(Math.random() * alphabet.length)])
    }
    out.push(p.join(''))
  }
  return out.join('-')
}

async function requireAdmin(req: NextRequest) {
  const user = await requireAuth().catch(() => null)
  if (!user?.email || !isAdminEmail(user.email)) {
    return null
  }
  return user
}

export async function GET(req: NextRequest) {
  const user = await requireAdmin(req)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = getSupabaseAdmin()
  if (!admin) return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 })

  const { data, error } = await admin
    .from('invite_codes')
    .select('code, active, max_uses, used_count, expires_at, created_at, last_used_at, last_used_by')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: 'Failed to load invites' }, { status: 500 })
  return NextResponse.json({ invites: data || [] })
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin(req)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = getSupabaseAdmin()
  if (!admin) return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 })

  const body = await req.json().catch(() => ({} as any))
  const maxUses = Math.max(1, Math.min(100, Number(body.maxUses ?? 1)))
  const expiresInDays = body.expiresInDays != null ? Number(body.expiresInDays) : null
  const code = (body.code ? String(body.code).trim().toUpperCase() : randomCode()).replace(/[^A-Z0-9\-]/g, '')

  const expiresAt =
    expiresInDays && !Number.isNaN(expiresInDays)
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null

  const { error } = await admin.from('invite_codes').insert({
    code,
    active: true,
    max_uses: maxUses,
    used_count: 0,
    expires_at: expiresAt,
    created_by: user.email,
  })

  if (error) {
    return NextResponse.json({ error: 'Failed to create invite', details: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, code })
}
