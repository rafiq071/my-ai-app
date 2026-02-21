import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { isAdminEmail } from '@/lib/beta-access'
import { getInviteOnlyEnabled } from '@/lib/edge-flags'

async function requireAdmin() {
  const user = await requireAuth().catch(() => null)
  if (!user?.email || !isAdminEmail(user.email)) {
    return null
  }
  return user
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const invite_only_enabled = await getInviteOnlyEnabled()
  return NextResponse.json({ invite_only_enabled })
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const invite_only_enabled = Boolean(body?.invite_only_enabled)

  const edgeConfigId = process.env.EDGE_CONFIG_ID
  const vercelToken = process.env.VERCEL_API_TOKEN

  if (!edgeConfigId || !vercelToken) {
    // You can still change the value directly in Vercel Edge Config UI.
    return NextResponse.json(
      { error: 'edge_config_write_not_configured', hint: 'Set EDGE_CONFIG_ID and VERCEL_API_TOKEN in Vercel env vars.' },
      { status: 501 }
    )
  }

  const res = await fetch(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${vercelToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [{ key: 'invite_only_enabled', value: invite_only_enabled }],
    }),
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    return NextResponse.json({ error: 'edge_config_update_failed', status: res.status, details: txt.slice(0, 500) }, { status: 502 })
  }

  return NextResponse.json({ ok: true, invite_only_enabled })
}
