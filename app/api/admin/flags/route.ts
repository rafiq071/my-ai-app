import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAuth } from '@/lib/auth'
import { isAdminEmail } from '@/lib/beta-access'
import { clearFeatureFlagCache, FeatureFlagKey } from '@/lib/feature-flags'

async function requireAdmin() {
  const user = await requireAuth().catch(() => null)
  if (!user?.email || !isAdminEmail(user.email)) return null
  return user
}

const ALLOWED_KEYS: FeatureFlagKey[] = ['generate_enabled', 'deploy_enabled', 'invite_only_enabled']

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = getSupabaseAdmin()
  if (!admin) return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 })

  const { data, error } = await admin
    .from('feature_flags')
    .select('key, enabled, config, updated_at')
    .in('key', ALLOWED_KEYS)
    .order('key', { ascending: true })

  if (error) return NextResponse.json({ error: 'Failed to load flags' }, { status: 500 })
  return NextResponse.json({ flags: data || [] })
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = getSupabaseAdmin()
  if (!admin) return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 })

  const body = await req.json().catch(() => ({} as any))
  const key = String(body.key || '').trim() as FeatureFlagKey
  const enabled = Boolean(body.enabled)

  if (!ALLOWED_KEYS.includes(key)) {
    return NextResponse.json({ error: 'Invalid flag key' }, { status: 400 })
  }

  const { error } = await admin
    .from('feature_flags')
    .upsert(
      {
        key,
        enabled,
        updated_at: new Date().toISOString(),
        updated_by: user.email,
      },
      { onConflict: 'key' }
    )

  if (error) return NextResponse.json({ error: 'Failed to update flag', details: error.message }, { status: 500 })

  clearFeatureFlagCache(key)
  return NextResponse.json({ success: true })
}
