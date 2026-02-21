import { NextRequest } from 'next/server'

type UpstashConfig = { url: string; token: string }

function getUpstash(): UpstashConfig | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return { url, token }
}

async function upstashPipeline(cfg: UpstashConfig, commands: any[]) {
  const res = await fetch(`${cfg.url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
    cache: 'no-store',
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`Upstash error ${res.status}: ${txt}`)
  }
  return (await res.json()) as Array<{ result: any; error?: string }>
}

function getClientIp(req: NextRequest): string {
  const xf = req.headers.get('x-forwarded-for')
  if (xf) return xf.split(',')[0].trim()
  const xr = req.headers.get('x-real-ip')
  if (xr) return xr.trim()
  return 'unknown'
}

function todayKey(): string {
  const d = new Date()
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export type QuotaResult = {
  ok: boolean
  remaining: number
  limit: number
  used: number
  scope: 'user' | 'ip'
}

/**
 * Enforce daily quota using Upstash Redis.
 * If Upstash is not configured, returns ok=true (no quota enforced).
 */
export async function enforceDailyQuota(opts: {
  req: NextRequest
  userId?: string
  limitPerUser: number
  limitPerIp: number
}): Promise<{ user: QuotaResult; ip: QuotaResult }> {
  const upstash = getUpstash()
  const day = todayKey()
  const ip = getClientIp(opts.req)

  const empty: QuotaResult = { ok: true, remaining: 999999, limit: 999999, used: 0, scope: 'ip' }
  if (!upstash) {
    return {
      user: { ...empty, scope: 'user' },
      ip: { ...empty, scope: 'ip' },
    }
  }

  const ttl = 60 * 60 * 48 // 48h
  const userKey = opts.userId ? `quota:user:${opts.userId}:${day}` : null
  const ipKey = `quota:ip:${ip}:${day}`

  const commands: any[] = []
  if (userKey) {
    commands.push(['INCR', userKey])
    commands.push(['EXPIRE', userKey, ttl])
  }
  commands.push(['INCR', ipKey])
  commands.push(['EXPIRE', ipKey, ttl])

  const out = await upstashPipeline(upstash, commands)

  let idx = 0
  let userUsed = 0
  if (userKey) {
    userUsed = Number(out[idx]?.result ?? 0)
    idx += 2
  }
  const ipUsed = Number(out[idx]?.result ?? 0)

  const userLimit = opts.limitPerUser
  const ipLimit = opts.limitPerIp

  const userRes: QuotaResult = userKey
    ? {
        ok: userUsed <= userLimit,
        remaining: Math.max(0, userLimit - userUsed),
        limit: userLimit,
        used: userUsed,
        scope: 'user',
      }
    : {
        ok: true,
        remaining: 999999,
        limit: 999999,
        used: 0,
        scope: 'user',
      }

  const ipRes: QuotaResult = {
    ok: ipUsed <= ipLimit,
    remaining: Math.max(0, ipLimit - ipUsed),
    limit: ipLimit,
    used: ipUsed,
    scope: 'ip',
  }

  return { user: userRes, ip: ipRes }
}
