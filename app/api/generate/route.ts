import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { selectBestModel, getSelectionReason, estimateCost, AVAILABLE_MODELS } from '@/lib/model-router'
import { generateWithAI } from '@/lib/ai-client'
import { rateLimit } from '@/lib/rate-limit'
import { extractJson, isValidGeneratedProject, normalizeGeneratedProject } from '@/lib/project-schema'
import { parseAIResponse } from '@/lib/ai/parseAIResponse'
import { requireAuth } from '@/lib/auth'
import { enforceDailyQuota } from '@/lib/quota'
import { assertBetaAccess } from '@/lib/beta-access'
import { scanGeneratedFiles } from '@/lib/security/scan'
import { getClientIp, hashIp } from '@/lib/ip-hash'
import { writeGenerationLog } from '@/lib/generation-logs'
import { getFeatureFlag } from '@/lib/feature-flags'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createProjectWithId } from '@/lib/project-db-server'
import { createOpenAICompletionStream } from '@/lib/ai-client'

const SYSTEM_PROMPT = `You are an expert product designer and copywriter. Generate HIGH-QUALITY, conversion-optimized landing pages at the level of Stripe, Linear, Vercel, and Notion. Every element should feel intentional and professional.

IMPORTANT RULES:
- Generate a plain React 18 + TypeScript single-page app. DO NOT use Next.js. No app/ or pages/. No server-side code.
- Put ALL UI in a single App.tsx file. Do NOT use import from "./components/..." or any other file. Do NOT create separate component files. Inline everything inside one export default function App() { return (...); }. Single file only.

Project structure: only src/App.tsx is generated. Use React 18. Inline styles only (style={{ ... }}). No Tailwind, no CSS files.

Return ONLY valid JSON. No markdown. REQUIRED: "files" array MUST contain at least one file with path "src/App.tsx".
Format: { "name": "string", "description": "string", "files": [ { "path": "src/App.tsx", "content": "..." } ] }

——— LANDING PAGE QUALITY (include all sections in order) ———
1. NAVBAR — Sticky. Logo, nav (Features, Pricing), primary CTA. maxWidth 1200px, padding 1rem 2rem.
2. HERO — Headline 2.75rem–3.5rem fontWeight 800. Subheadline 1.25rem #64748b. Two CTAs (gradient primary + outline secondary). Optional "Trusted by X+". Soft gradient or #fafafa background. padding 4rem 2rem.
3. FEATURES — 6 cards, 3-col grid, gap 2rem. Each: rounded 16px, padding 1.5rem, boxShadow "0 4px 24px rgba(0,0,0,0.06)". Icon in 48px rounded box. Title 1.125rem fontWeight 600. Description 1–2 sentences #64748b.
4. TESTIMONIALS — 3 quotes, name + role + company. Cards with subtle border/shadow.
5. HOW IT WORKS / PROBLEM–SOLUTION — Two columns or 3 steps. Clear headings, short paragraphs.
6. PRICING — 3 tiers, one "Most Popular". Price + 4–6 bullets + CTA per tier. Rounded 16px cards.
7. FAQ — 5–7 Q&A. Question fontWeight 600, answer #64748b. Address pricing, security, integration.
8. FINAL CTA — Dark #0f172a, headline + single CTA. padding 4rem 2rem.
9. FOOTER — #f8fafc, links (Product, Company, Legal), copyright. padding 2rem, 0.875rem #64748b.

——— DESIGN RULES ———
- Typography: Headlines 2rem+, section titles 1.25–2rem fontWeight 600, body 1rem. fontFamily "'Inter', system-ui, sans-serif".
- Colors: Primary #6366f1, #4f46e5. Neutrals #0f172a, #334155, #64748b, #f1f5f9, #e2e8f0. Gradient buttons: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%).
- Spacing: padding 2–4rem sections, gap 1.5–2rem. maxWidth 72rem containers, margin "0 auto".
- Buttons: rounded 10–12px, padding 0.75rem 1.5rem, fontWeight 600.
- Copy: SPECIFIC, benefit-driven. No lorem ipsum. No "We help businesses grow." Use "Ship 2x faster", "Trusted by 10,000+ teams". CTAs: "Get started free", "Start building".
- Polish: Rounded 12–16px. Soft shadows. border "1px solid #e2e8f0" or #f1f5f9. Responsive (maxWidth, flexWrap).

Output MUST be valid JSON only. No markdown fences. Safe paths: no absolute, no '..'.`

const MAX_PROMPT_CHARS = Number(process.env.MAX_PROMPT_CHARS || 4000)
const MAX_OUTPUT_TOKENS = Number(process.env.MAX_OUTPUT_TOKENS || 2400)
const TEMPERATURE = Number(process.env.GENERATION_TEMPERATURE || 0.35)

// Best-effort cost cap (provider-side also capped by MAX_OUTPUT_TOKENS)
const HARD_COST_CAP_USD = Number(process.env.HARD_COST_CAP_USD || 0.50)

// Rate limit (best-effort, per-instance). For production, back with Redis.
const RL_WINDOW_MS = Number(process.env.RL_WINDOW_MS || 60_000)
const RL_MAX = Number(process.env.RL_MAX || 5)

// Public beta quotas (daily)
const DAILY_QUOTA_PER_USER = Number(process.env.DAILY_QUOTA_PER_USER || 20)
const DAILY_QUOTA_PER_IP = Number(process.env.DAILY_QUOTA_PER_IP || 60)

const DEFAULT_APP_TSX = `export default function App() {
  return (
    <div style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Welcome</h1>
      <p>Your app is loading. Edit this file to get started.</p>
    </div>
  );
}
`

function hasAppTsx(project: { files: Array<{ path: string }> }): boolean {
  return Array.isArray(project.files) && project.files.some(
    (f) => f && (f.path === 'src/App.tsx' || f.path === 'App.tsx')
  )
}

function ensureAppTsx(project: { name: string; description?: string; files: Array<{ path: string; content: string; type?: string }> }) {
  if (hasAppTsx(project)) return project
  return {
    ...project,
    files: [
      { path: 'src/App.tsx', content: DEFAULT_APP_TSX, type: 'file' as const },
      ...project.files,
    ],
  }
}

function clampPrompt(prompt: string): string {
  const p = String(prompt || '')
  return p.length > MAX_PROMPT_CHARS ? p.slice(0, MAX_PROMPT_CHARS) : p
}

function makeRepairPrompt(badJson: string, originalPrompt: string): string {
  return `Repair the following output into STRICT VALID JSON that matches this schema:
{ "name": string, "description"?: string, "files": [{ "path": string, "content": string, "type"?: "file"|"directory" }] }

Rules:
- Output ONLY JSON (no markdown)
- Ensure "files" is a non-empty array
- You MUST include at least one file with path "src/App.tsx"
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
      throw new Error('Generation is temporarily disabled (beta)')
    }

    // ===== Gate 0b: Invite / beta access (skip for anon demo mode) =====
    if (!isAnon) {
      const access = await assertBetaAccess(request, user?.email ?? null)
      if (!access.ok) {
        throw new Error('Invite required')
      }
    }

    // ===== Gate 1: Rate limiting =====
    const rl = await rateLimit(request, { windowMs: RL_WINDOW_MS, max: RL_MAX })
    if (!rl.ok) {
      throw new Error('Rate limit exceeded')
    }

    // ===== Gate 1b: Daily quota (user + ip) =====
    const quota = await enforceDailyQuota({
      req: request,
      userId: user?.id ?? undefined,
      limitPerUser: DAILY_QUOTA_PER_USER,
      limitPerIp: DAILY_QUOTA_PER_IP,
    })
    if (!quota.user.ok) {
      throw new Error('Daily quota exceeded (user)')
    }
    if (!quota.ip.ok) {
      throw new Error('Daily quota exceeded (ip)')
    }

    // ===== Parse input =====
    const body = await request.json().catch(() => null as any)
    const rawPrompt = body?.prompt
    if (!rawPrompt || typeof rawPrompt !== 'string') {
      throw new Error('Prompt is required')
    }

    const prompt = clampPrompt(rawPrompt).trim()
    if (!prompt) {
      throw new Error('Prompt is required')
    }
    if (rawPrompt.length > MAX_PROMPT_CHARS) {
      throw new Error(`Prompt too long (max ${MAX_PROMPT_CHARS} chars)`)
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
        throw new Error('Request exceeds cost cap')
      }
    }

    const wantStream = body?.stream === true

    // ===== Streaming path (OpenAI only): raw JSON text chunks, no server-side parse =====
    if (wantStream && selectedModel.provider === 'openai') {
      const stream = createOpenAICompletionStream({
        model: selectedModel,
        prompt,
        systemPrompt: SYSTEM_PROMPT,
        temperature: TEMPERATURE,
        maxTokens: Math.min(MAX_OUTPUT_TOKENS, selectedModel.maxTokens),
      })
      return new Response(
        new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of stream) {
                controller.enqueue(new TextEncoder().encode(chunk))
              }
            } catch (err) {
              console.error('Stream error:', err)
              controller.error(err)
            } finally {
              controller.close()
            }
          },
        }),
        {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
          },
        }
      )
    }

    // ===== Non-streaming: Generation with validation + retry/fallback =====
    const attempts: Array<{ modelId: string; ok: boolean; error?: string }> = []

    const tryOnce = async (model: typeof selectedModel, userPrompt: string) => {
      const result = await generateWithAI({
        model,
        prompt: userPrompt,
        systemPrompt: SYSTEM_PROMPT,
        temperature: TEMPERATURE,
        maxTokens: Math.min(MAX_OUTPUT_TOKENS, model.maxTokens),
      })

      const parseResult = parseAIResponse(result.content)
      if (!parseResult.ok) {
        return {
          ok: false as const,
          error: 'json_parse_failed',
          raw: parseResult.raw ?? result.content,
          ai: result,
        }
      }

      const parsed = parseResult.data
      if (!isValidGeneratedProject(parsed)) {
        return {
          ok: false as const,
          error: 'schema_validation_failed',
          raw: result.content.slice(0, 1000),
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

    // Ensure src/App.tsx: retry once if missing, then use fallback
    if (finalResult.ok && !hasAppTsx(finalResult.project)) {
      const appTsxRetryPrompt = 'You must include src/App.tsx in the response. Return valid JSON only. No markdown.\n\nOriginal prompt: ' + prompt
      const rApp = await tryOnce(selectedModel, appTsxRetryPrompt)
      if (rApp.ok && hasAppTsx(rApp.project)) {
        finalResult = rApp
      } else {
        finalResult = { ...finalResult, project: ensureAppTsx(finalResult.project) }
      }
    }

    if (!finalResult.ok) {
      const latencyMs = Date.now() - startedAt

      if (!isAnon) {
        await writeGenerationLog({
        user_id: user?.id ?? null,
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
        { error: true, message: 'AI generation failed. Retrying...' },
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
        user_id: user?.id ?? null,
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
      throw new Error('Generated project blocked by security policy (public beta)')
    }

    // ===== Log success (best-effort, skip for anon) =====
    if (!isAnon) {
      await writeGenerationLog({
      user_id: user?.id ?? null,
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

    const projectWithId = {
      id: randomUUID(),
      name: project.name,
      description: project.description || prompt,
      files: project.files,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (!isAnon && user?.id && getSupabaseAdmin()) {
      try {
        await createProjectWithId(
          projectWithId.id,
          user.id,
          projectWithId.name,
          projectWithId.description,
          project.files
        )
      } catch (dbError) {
        console.error('Failed to save project to DB:', dbError)
      }
    }

    console.log("Generate success:", projectWithId?.id);
    return NextResponse.json({
      success: true,
      project: projectWithId,
      mode: isAnon ? 'anon' : 'auth',
    })
  } catch (error) {
    console.error("Generate failed:", error);
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: true, message }, { status: 500 })
  }
}
