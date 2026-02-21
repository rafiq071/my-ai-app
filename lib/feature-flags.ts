import { getSupabaseAdmin } from '@/lib/supabase-admin'

export type FeatureFlagKey = 'generate_enabled' | 'deploy_enabled' | 'invite_only_enabled'

type FlagRow = {
  key: string
  enabled: boolean
  config: any
  updated_at: string
}

// Small in-memory cache to avoid hammering Supabase on hot endpoints.
// Safe because flags are for coarse control (kill-switch / beta gating), not precision logic.
const CACHE_TTL_MS = 30_000
const cache = new Map<string, { value: boolean; expiresAt: number }>()

function defaultFlagValue(key: FeatureFlagKey): boolean {
  switch (key) {
    case 'deploy_enabled':
      return false
    case 'invite_only_enabled':
      return true
    case 'generate_enabled':
    default:
      return true
  }
}

export async function getFeatureFlag(key: FeatureFlagKey): Promise<boolean> {
  const now = Date.now()
  const cached = cache.get(key)
  if (cached && cached.expiresAt > now) return cached.value

  const admin = getSupabaseAdmin()
  if (!admin) {
    const v = defaultFlagValue(key)
    cache.set(key, { value: v, expiresAt: now + CACHE_TTL_MS })
    return v
  }

  const { data, error } = await admin
    .from('feature_flags')
    .select('key, enabled, config, updated_at')
    .eq('key', key)
    .maybeSingle()

  const v = !error && data ? Boolean((data as FlagRow).enabled) : defaultFlagValue(key)
  cache.set(key, { value: v, expiresAt: now + CACHE_TTL_MS })
  return v
}

export function clearFeatureFlagCache(key?: FeatureFlagKey) {
  if (!key) {
    cache.clear()
    return
  }
  cache.delete(key)
}
