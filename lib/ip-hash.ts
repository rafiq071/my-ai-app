import crypto from 'crypto'
import { NextRequest } from 'next/server'

export function getClientIp(req: NextRequest): string {
  const xf = req.headers.get('x-forwarded-for')
  if (xf) return xf.split(',')[0].trim()
  const xr = req.headers.get('x-real-ip')
  if (xr) return xr.trim()
  return 'unknown'
}

export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || 'ip-salt'
  return crypto.createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)
}
