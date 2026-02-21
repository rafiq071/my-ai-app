import { createClient } from '@vercel/edge-config'

type EdgeFlagValue = boolean | string | number | null | undefined

function getClient() {
  const conn = process.env.EDGE_CONFIG
  if (!conn) return null
  try {
    return createClient(conn)
  } catch {
    return null
  }
}

export async function getEdgeFlag<T extends EdgeFlagValue>(key: string): Promise<T | undefined> {
  const client = getClient()
  if (!client) return undefined
  try {
    const v = await client.get<EdgeFlagValue>(key)
    return v as any
  } catch {
    return undefined
  }
}

export async function getInviteOnlyEnabled(): Promise<boolean> {
  const v = await getEdgeFlag<EdgeFlagValue>('invite_only_enabled')
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') {
    const s = v.toLowerCase().trim()
    if (s === 'true') return true
    if (s === 'false') return false
  }
  // Fallback to env for local/dev
  return (process.env.BETA_INVITE_ONLY || 'true').toLowerCase() === 'true'
}
