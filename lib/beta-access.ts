import type { NextRequest } from 'next/server'
import { getInviteOnlyEnabled as getInviteOnlyEnabledFromEdge } from '@/lib/edge-flags'

export const BETA_INVITE_COOKIE = 'beta_invite_ok'

export async function isInviteOnlyEnabled(): Promise<boolean> {
  return await getInviteOnlyEnabledFromEdge()
}

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false
  const admins = getAdminEmails()
  if (admins.length === 0) return false
  return admins.includes(email.toLowerCase())
}

export function hasInviteCookie(req: NextRequest): boolean {
  const v = req.cookies.get(BETA_INVITE_COOKIE)?.value
  return v === '1'
}

export async function assertBetaAccess(
  req: NextRequest,
  email?: string | null
): Promise<{ ok: boolean; reason?: string }> {
  const inviteOnly = await isInviteOnlyEnabled()
  if (!inviteOnly) return { ok: true }
  if (isAdminEmail(email)) return { ok: true }
  if (hasInviteCookie(req)) return { ok: true }
  return { ok: false, reason: 'invite_required' }
}
