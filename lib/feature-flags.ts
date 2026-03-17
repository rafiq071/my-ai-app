import { getSupabaseAdmin } from '@/lib/supabase-admin'

export type FeatureFlagKey = 'generate_enabled' | 'deploy_enabled' | 'invite_only_enabled'

type FlagRow = {
  key: string
  enabled: boolean
  config: any
  updated_at: string
}

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
  const admin = getSupabaseAdmin()
  if (!admin) {
    return defaultFlagValue(key)
  }

  const { data, error } = await admin
    .from('feature_flags')
    .select('key, enabled, config, updated_at')
    .eq('key', key)
    .maybeSingle()

  return !error && data ? Boolean((data as FlagRow).enabled) : defaultFlagValue(key)
}

/** No-op after cache removal; kept for API compatibility when toggling flags in admin. */
export function clearFeatureFlagCache(_key?: FeatureFlagKey) {}
