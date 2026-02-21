import { getSupabaseAdmin } from '@/lib/supabase-admin'

export type GenerationLog = {
  user_id?: string | null
  ip_hash?: string | null
  model_id?: string | null
  model_name?: string | null
  input_chars?: number | null
  input_tokens?: number | null
  output_tokens?: number | null
  est_cost_usd?: number | null
  actual_cost_usd?: number | null
  latency_ms?: number | null
  schema_ok?: boolean | null
  retries?: number | null
  fallback_used?: boolean | null
  error_code?: string | null
}

export async function writeGenerationLog(log: GenerationLog): Promise<void> {
  const admin = getSupabaseAdmin()
  if (!admin) return

  try {
    await admin.from('generation_logs').insert({
      ...log,
      created_at: new Date().toISOString(),
    })
  } catch (e) {
    // Never fail the request because logging failed
    console.warn('generation_logs insert failed:', e)
  }
}
