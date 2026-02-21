import { NextRequest, NextResponse } from 'next/server'
import { selectBestModel, getSelectionReason, estimateCost, AVAILABLE_MODELS } from '@/lib/model-router'
import { generateWithAI } from '@/lib/ai-client'
import { rateLimit } from '@/lib/rate-limit'
import { isValidGeneratedProject, normalizeGeneratedProject } from '@/lib/project-schema'
import { requireAuth } from '@/lib/auth'
import { enforceDailyQuota } from '@/lib/quota'
import { assertBetaAccess } from '@/lib/beta-access'
import { scanGeneratedFiles } from '@/lib/security/scan'
import { getClientIp, hashIp } from '@/lib/ip-hash'
import { writeGenerationLog } from '@/lib/generation-logs'
import { getFeatureFlag } from '@/lib/feature-flags'

const SYSTEM_PROMPT = `You are an expert full-stack developer who generates complete, production-ready web applications.

When given a project description, you MUST respond with a valid JSON object containing the complete project structure.

Your response MUST be ONLY valid JSON in this exact format:
{
  "name": "project-name",
  "description": "Brief project description",
  "files": [
    {
      "path": "app/page.tsx",
      "content": "// Complete file content here",
      "type": "file"
    }
  ]
}

CRITICAL RULES:
1. Output MUST be valid JSON (no markdown fences)
2. Generate COMPLETE, working code - not placeholders
3. Use Next.js App Router structure and TypeScript
4. Use Tailwind CSS classes for styling
5. Include error handling and loading states
6. Keep file paths safe: no absolute paths, no '..'

RESPOND ONLY WITH THE JSON - NO MARKDOWN, NO EXPLANATIONS.`

const MAX_PROMPT_CHARS = Number(process.env.MAX_PROMPT_CHARS || 4000)
const MAX_OUTPUT_TOKENS = Number(process.env.MAX_OUTPUT_TOKENS || 1200)
const TEMPERATURE = Number(process.env.GENERATION_TEMPERATURE || 0.35)

// Best-effort cost cap (provider-side also capped by MAX_OUTPUT_TOKENS)
const HARD_COST_CAP_USD = Number(process.env.HARD_COST_CAP_USD || 0.10)

// Rate limit (best-effort, per-instance). For production, back with Redis.
const RL_WINDOW_MS = Number(process.env.RL_WINDOW_MS || 60_000)
const RL_MAX = Number(process.env.RL_MAX || 5)

// Public beta quotas (daily)
const DAILY_QUOTA_PER_USER = Number(process.env.DAILY_QUOTA_PER_USER || 20)
const DAILY_QUOTA_PER_IP = Number(process.env.DAILY_QUOTA_PER_IP || 60)

function clampPrompt(prompt: string): string {
  const p = String(prompt || '')
  return p.length > MAX_PROMPT_CHARS ? p.slice(0, MAX_PROMPT_CHARS) : p
}

function extractJson(text: string): string {
  const trimmed = text.trim()

  // Try to extract from markdown code blocks if present (defensive)
  const jsonMatch =
    trimmed.match(/```json\n([\s\S]*?)\n```/) ||
    trimmed.match(/```\n([\s\S]*?)\n```/)

  return (jsonMatch ? jsonMatch[1] : trimmed).trim()
}

function makeRepairPrompt(badJson: string, originalPrompt: string): string {
  return `Repair the following output into STRICT VALID JSON that matches this schema:
{ "name": string, "description"?: string, "files": [{ "path": string, "content": string, "type"?: "file"|"directory" }] }

Rules:
- Output ONLY JSON (no markdown)
- Ensure "files" is a non-empty array
- Remove any invalid fields
- Ensure file paths do NOT contain '..' and are not absolute
- Keep the original intent: ${originalPrompt}

BROKEN OUTPUT:
${badJson}`
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now()

  try {
    // ===== Gate 0: Auth (optional - DEMO ANON MODE) =====
    const user = await requireAuth().catch(() => null)
    const isAnon = !user

    // ===== Gate 0a: Kill-switch (feature flag) =====
    // Server-side safety valve to stop cost burn instantly.
    const generateEnabled = await getFeatureFlag('generate_enabled')
    if (!generateEnabled) {
      return NextResponse.json({ error: 'Generation is temporarily disabled (beta)' }, { status: 503 })
    }

    // ===== Gate 0b: Invite / beta access (skip for anon demo mode) =====
    if (!isAnon) {
      const access = await assertBetaAccess(request, (user as any).email || null)
      if (!access.ok) {
        return NextResponse.json({ error: 'Invite required' }, { status: 403 })
      }
    }

    // ===== Gate 1: Rate limiting =====
    const rl = await rateLimit(request, { windowMs: RL_WINDOW_MS, max: RL_MAX })
    if (!rl.ok) {
      const retryAfter = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfterSeconds: retryAfter },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

    // ===== Gate 1b: Daily quota (user + ip) =====
    const quota = await enforceDailyQuota({
      req: request,
      userId: (user as any).id || undefined,
      limitPerUser: DAILY_QUOTA_PER_USER,
      limitPerIp: DAILY_QUOTA_PER_IP,
    })
    if (!quota.user.ok) {
      return NextResponse.json(
        { error: 'Daily quota exceeded', scope: 'user', limit: quota.user.limit, used: quota.user.used },
        { status: 429 }
      )
    }
    if (!quota.ip.ok) {
      return NextResponse.json(
        { error: 'Daily quota exceeded', scope: 'ip', limit: quota.ip.limit, used: quota.ip.used },
        { status: 429 }
      )
    }

    // ===== Parse input =====
    const body = await request.json().catch(() => null as any)
    const rawPrompt = body?.prompt
    if (!rawPrompt || typeof rawPrompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const prompt = clampPrompt(rawPrompt).trim()
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }
    if (rawPrompt.length > MAX_PROMPT_CHARS) {
      return NextResponse.json(
        { error: `Prompt too long (max ${MAX_PROMPT_CHARS} chars)` },
        { status: 413 }
      )
    }

    // ===== Model selection =====
    const selectedModel = selectBestModel({
      prompt,
      hasExistingProject: false,
      fileCount: 0,
    })

    const reason = getSelectionReason(selectedModel, {
      prompt,
      hasExistingProject: false,
      fileCount: 0,
    })

    const estimatedCost = estimateCost(selectedModel)

    // ===== Hard cost cap (best-effort) =====
    if (typeof estimatedCost === 'string') {
      const m = estimatedCost.match(/\$([0-9.]+)/)
      const est = m ? Number(m[1]) : NaN
      if (!Number.isNaN(est) && est > HARD_COST_CAP_USD) {
        return NextResponse.json(
          { error: 'Request exceeds cost cap', estimatedCost },
          { status: 402 }
        )
      }
    }

    // ===== Generation with validation + retry/fallback =====
    const attempts: Array<{ modelId: string; ok: boolean; error?: string }> = []

    const tryOnce = async (model: typeof selectedModel, userPrompt: string) => {
      const result = await generateWithAI({
        model,
        prompt: userPrompt,
        systemPrompt: SYSTEM_PROMPT,
        temperature: TEMPERATURE,
        maxTokens: Math.min(MAX_OUTPUT_TOKENS, model.maxTokens),
      })

      const jsonText = extractJson(result.content)

      let parsed: any
      try {
        parsed = JSON.parse(jsonText)
      } catch (e) {
        return {
          ok: false as const,
          error: 'json_parse_failed',
          raw: jsonText,
          ai: result,
        }
      }

      if (!isValidGeneratedProject(parsed)) {
        return {
          ok: false as const,
          error: 'schema_validation_failed',
          raw: jsonText,
          parsed,
          ai: result,
        }
      }

      return { ok: true as const, project: normalizeGeneratedProject(parsed), ai: result }
    }

    // Attempt 1: selected model
    let r1 = await tryOnce(selectedModel, prompt)
    attempts.push({ modelId: selectedModel.id, ok: r1.ok, error: r1.ok ? undefined : r1.error })

    // Attempt 2: repair prompt with same model
    let finalResult: any = r1
    if (!r1.ok) {
      const repairPrompt = makeRepairPrompt((r1 as any).raw || '', prompt)
      const r2 = await tryOnce(selectedModel, repairPrompt)
      attempts.push({ modelId: selectedModel.id, ok: r2.ok, error: r2.ok ? undefined : r2.error })
      finalResult = r2.ok ? r2 : r1
    }

    // Attempt 3: fallback model
    if (!finalResult.ok) {
      const fallback =
        selectedModel.id === 'gpt-4-turbo'
          ? AVAILABLE_MODELS['gemini-pro']
          : AVAILABLE_MODELS['gpt-4-turbo']

      const r3 = await tryOnce(fallback, prompt)
      attempts.push({ modelId: fallback.id, ok: r3.ok, error: r3.ok ? undefined : r3.error })
      finalResult = r3
    }

    if (!finalResult.ok) {
      const latencyMs = Date.now() - startedAt

      if (!isAnon) {
        await writeGenerationLog({
        user_id: (user as any).id || null,
        ip_hash: hashIp(getClientIp(request)),
        model_id: selectedModel.id,
        model_name: selectedModel.name,
        input_chars: prompt.length,
        latency_ms: latencyMs,
        schema_ok: false,
        retries: Math.max(0, attempts.length - 1),
        fallback_used: attempts.some((a) => a.modelId !== selectedModel.id),
        error_code: (finalResult as any).error || 'unknown',
        })
      }

      return NextResponse.json(
        {
          error: 'Failed to generate a valid project',
          code: (finalResult as any).error || 'unknown',
          attempts,
          latencyMs,
          details: (finalResult as any).raw?.slice(0, 10_000) || null,
        },
        { status: 502 }
      )
    }

    const latencyMs = Date.now() - startedAt
    const aiResult = finalResult.ai
    const project = finalResult.project

    // ===== Gate 2: Static security scan on generated files =====
    const scan = scanGeneratedFiles(project.files)
    if (!scan.ok) {
      if (!isAnon) {
        await writeGenerationLog({
        user_id: (user as any).id || null,
        ip_hash: hashIp(getClientIp(request)),
        model_id: selectedModel.id,
        model_name: selectedModel.name,
        input_chars: prompt.length,
        input_tokens: aiResult?.tokensUsed?.input ?? null,
        output_tokens: aiResult?.tokensUsed?.output ?? null,
        actual_cost_usd: aiResult?.cost ?? null,
        latency_ms: latencyMs,
        schema_ok: true,
        retries: Math.max(0, attempts.length - 1),
        fallback_used: attempts.some((a) => a.modelId !== selectedModel.id),
        error_code: 'security_scan_failed',
        })
      }

      return NextResponse.json(
        {
          error: 'Generated project blocked by security policy (public beta)',
          code: 'security_scan_failed',
          issues: scan.issues.slice(0, 50),
        },
        { status: 422 }
      )
    }

    // ===== Log success (best-effort, skip for anon) =====
    if (!isAnon) {
      await writeGenerationLog({
      user_id: (user as any).id || null,
      ip_hash: hashIp(getClientIp(request)),
      model_id: selectedModel.id,
      model_name: selectedModel.name,
      input_chars: prompt.length,
      input_tokens: aiResult?.tokensUsed?.input ?? null,
      output_tokens: aiResult?.tokensUsed?.output ?? null,
      actual_cost_usd: aiResult?.cost ?? null,
      latency_ms: latencyMs,
      schema_ok: true,
      retries: Math.max(0, attempts.length - 1),
      fallback_used: attempts.some((a) => a.modelId !== selectedModel.id),
      error_code: null,
    })
    }

    return NextResponse.json({
      success: true,
      ...(isAnon && { mode: 'anon' }),
      project: {
        id: Date.now().toString(),
        name: project.name,
        description: project.description || prompt,
        files: project.files,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      modelInfo: {
        model: selectedModel.name,
        modelId: selectedModel.id,
        reason,
        estimatedCost,
        actualCost: aiResult?.cost !== undefined ? `$${aiResult.cost.toFixed(4)}` : undefined,
        tokensUsed: aiResult?.tokensUsed,
        latencyMs,
        attempts,
      },
    })
  } catch (error) {
    console.error('Error generating project:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to generate project', message: msg },
      { status: 500 }
    )
  }
}
