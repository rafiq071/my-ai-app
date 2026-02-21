import { NextRequest } from 'next/server'

type Bucket = { count: number; resetAt: number }

/**
 * Rate limiting
 * - If UPSTASH_REDIS_REST_URL/TOKEN are set, uses Redis (production-grade)
 * - Otherwise falls back to in-memory (best-effort per instance)
 */
const buckets = new Map<string, Bucket>()

export interface RateLimitConfig {
  windowMs: number
  max: number
}

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

export async function rateLimit(req: NextRequest, cfg: RateLimitConfig) {
  const ip = getClientIp(req)
  const key = `ip:${ip}`
  const now = Date.now()

  // Redis-backed limiter (fixed window)
  const upstash = getUpstash()
  if (upstash) {
    const windowSec = Math.max(1, Math.floor(cfg.windowMs / 1000))
    const bucket = Math.floor(now / cfg.windowMs)
    const redisKey = `rl:${key}:${bucket}`
    const ttl = windowSec * 2

    try {
      const out = await upstashPipeline(upstash, [
        ['INCR', redisKey],
        ['EXPIRE', redisKey, ttl],
      ])
      const count = Number(out?.[0]?.result ?? 0)
      const resetAt = (bucket + 1) * cfg.windowMs
      if (count > cfg.max) {
        return { ok: false as const, remaining: 0, resetAt, ip }
      }
      return { ok: true as const, remaining: Math.max(0, cfg.max - count), resetAt, ip }
    } catch {
      // If Redis fails, fall back to in-memory to avoid hard outage
    }
  }
  const current = buckets.get(key)

  if (!current || current.resetAt <= now) {
    const resetAt = now + cfg.windowMs
    buckets.set(key, { count: 1, resetAt })
    return { ok: true as const, remaining: cfg.max - 1, resetAt, ip }
  }

  if (current.count >= cfg.max) {
    return { ok: false as const, remaining: 0, resetAt: current.resetAt, ip }
  }

  current.count += 1
  buckets.set(key, current)
  return { ok: true as const, remaining: cfg.max - current.count, resetAt: current.resetAt, ip }
}
