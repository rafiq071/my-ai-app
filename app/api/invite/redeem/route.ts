import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { BETA_INVITE_COOKIE } from '@/lib/beta-access'
import { requireAuth } from '@/lib/auth'

function normalizeCode(code: string): string {
  return String(code || '').trim().toUpperCase().replace(/[^A-Z0-9\-]/g, '')
}

export async function POST(req: NextRequest) {
  try {
    // Require auth: invite codes are tied to an account session
    const user = await requireAuth().catch(() => null)
    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json().catch(() => null as any)
    const code = normalizeCode(body?.code)
    if (!code) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Invite system not configured (missing SUPABASE_SERVICE_ROLE_KEY)' },
        { status: 500 }
      )
    }

    // Atomic-ish redeem: we increment used_count if possible
    const { data, error } = await admin
      .from('invite_codes')
      .select('code, active, max_uses, used_count, expires_at')
      .eq('code', code)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 })
    }

    if (!data.active) {
      return NextResponse.json({ error: 'Invite code is inactive' }, { status: 400 })
    }

    if (data.expires_at) {
      const exp = new Date(data.expires_at).getTime()
      if (!Number.isNaN(exp) && Date.now() > exp) {
        return NextResponse.json({ error: 'Invite code has expired' }, { status: 400 })
      }
    }

    const maxUses = Number(data.max_uses ?? 1)
    const used = Number(data.used_count ?? 0)
    if (used >= maxUses) {
      return NextResponse.json({ error: 'Invite code already used' }, { status: 400 })
    }

    const { error: updErr } = await admin
      .from('invite_codes')
      .update({ used_count: used + 1, last_used_at: new Date().toISOString(), last_used_by: user.email })
      .eq('code', code)

    if (updErr) {
      return NextResponse.json({ error: 'Failed to redeem code' }, { status: 500 })
    }

    const res = NextResponse.json({ success: true })
    // HttpOnly cookie, 30 days
    res.cookies.set(BETA_INVITE_COOKIE, '1', {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
    return res
  } catch (e) {
    console.error('invite redeem error', e)
    return NextResponse.json({ error: 'Failed to redeem invite code' }, { status: 500 })
  }
}
