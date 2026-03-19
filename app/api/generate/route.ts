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

function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message
  if (err && typeof err === 'object') {
    const o = err as Record<string, unknown>
    if (typeof o.message === 'string' && o.message) return o.message
    const inner = o.error
    if (inner && typeof inner === 'object' && typeof (inner as Record<string, unknown>).message === 'string') {
      const msg = (inner as Record<string, unknown>).message as string
      if (msg) return msg
    }
  }
  const s = String(err)
  if (s && s !== '[object Object]') return s
  return 'Generation failed. Please try again.'
}

const SYSTEM_PROMPT = `You are an expert product designer and front-end developer. Generate HIGH-QUALITY, conversion-optimized single-page websites at the level of Lovable, Stripe, Linear, Vercel, and Notion. Every pixel should feel intentional; the result should feel like a shipped product, not a template.

IMPORTANT RULES:
- Generate a plain React 18 + TypeScript single-page app. DO NOT use Next.js. No app/ or pages/. No server-side code.
- Put ALL UI in a single App.tsx file. Do NOT use import from "./components/..." or any other file. Do NOT create separate component files. Inline everything inside one export default function App() { return (...); }. Single file only.
- Use React hooks: include at least 2–3 useState for interactivity (e.g. FAQ accordion open/closed, mobile menu open/closed, hover state for primary CTA, or a simple modal). This makes the site feel alive and Lovable-quality.
- Project structure: only src/App.tsx is generated. Use React 18. Inline styles only (style={{ ... }}). No Tailwind, no CSS files.

Return ONLY valid JSON. No markdown. REQUIRED: "files" array MUST contain at least one file with path "src/App.tsx".
Format: { "name": "string", "description": "string", "files": [ { "path": "src/App.tsx", "content": "..." } ] }

——— WORKING LINKS (CRITICAL) ———
Every section MUST have an id so nav links work: id="features", id="pricing", id="about", id="faq", id="contact". In the NAVBAR, every link MUST be an <a> tag with href="#sectionId": <a href="#features">Features</a>, <a href="#pricing">Pricing</a>, <a href="#about">About</a>, <a href="#faq">FAQ</a>, <a href="#contact">Contact</a>. The header CTA MUST be <a href="#contact">Get Started</a> (or #pricing). Hero CTAs: primary <a href="#contact">, secondary <a href="#features">. Never use <button> for nav or scroll CTAs — use <a href="#..."> so clicking scrolls.

——— LANDING PAGE QUALITY (build ALL sections in order; no stubs) ———
1. NAVBAR — Sticky top. Logo, nav links (Features, Pricing, About, FAQ, Contact) as <a href="#features"> etc., primary CTA <a href="#contact">Get Started</a>. maxWidth 1200px, padding 1rem 2rem. Optional: mobile menu (useState). Clean background, subtle borderBottom or boxShadow.
2. HERO — Headline, subheadline, two CTAs as <a href="#contact"> and <a href="#features">. Soft gradient or #fafafa background. padding 4rem 2rem.
3. FEATURES — Section with id="features". 6 cards, 3-column grid. REAL titles and descriptions. Rounded 16px cards.
4. TESTIMONIALS — 3 quotes. Real names, companies, quotes. Avatars: pravatar or initials.
5. HOW IT WORKS — Two columns or 3 steps. Clear headings, short paragraphs.
6. PRICING — Section id="pricing". 3 tiers, real feature bullets, one "Most Popular". CTAs can be <a href="#contact">.
7. ABOUT US — Section id="about". Headline "About Us" or "Who We Are". Include at least one real photo: <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80" alt="Team" /> (or similar Unsplash/Picsum URL) in a two-column layout. 2–3 paragraphs company mission/story, optional team/values. Real copy. No placeholders.
8. FAQ — Section id="faq". Headline "Frequently Asked Questions". 5–7 Q&A. Use useState for accordion (which item is open). Specific questions (e.g. "How do I get started?", "What payment methods do you accept?") and helpful 2–3 sentence answers. Rounded cards, padding. No "Question 1" placeholders.
9. FINAL CTA — Dark background (#0f172a), headline, single CTA <a href="#contact">. padding 4rem 2rem.
10. CONTACT — Section id="contact". Headline "Contact Us" or "Get in Touch". EITHER (a) contact form (name, email, message, submit with e.preventDefault()) OR (b) contact info (email mailto:, phone, address in cards). Clean cards, good spacing.
11. FOOTER — #f8fafc, 2–4 columns (Product, Company, Legal, Contact), copyright. padding 2rem, font 0.875rem #64748b.

——— DESIGN SYSTEM (apply consistently) ———
- NO PLAIN BLACK ON WHITE: Use a premium look. Page background: soft tint (e.g. #f8fafc or #f1f5f9), not pure white. Headlines: #0f172a or #1e293b (slate), not #000. Body: #475569 or #64748b. Primary buttons: use gradient (e.g. linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)) or solid indigo (#4f46e5), not flat black. Hero: either light (soft gradient bg, dark text) or dark (bg #0f172a or gradient, white text). Cards: white with shadow and border so they have depth.
- Typography: fontFamily "'Inter', system-ui, sans-serif". Headlines 2rem+, section titles 1.25–2rem fontWeight 600, body 1rem lineHeight 1.6.
- Colors: Primary #6366f1, #4f46e5. Neutrals #0f172a, #334155, #64748b, #f8fafc, #e2e8f0. Gradient buttons: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%). Cards: background #fff, boxShadow "0 4px 24px rgba(0,0,0,0.08)", border "1px solid #e2e8f0".
- Spacing: 8px base scale. Section padding 2–4rem, gap 1.5–2rem. maxWidth 72rem, margin "0 auto".
- Buttons: rounded 10–12px, padding 0.75rem 1.5rem, fontWeight 600. Primary gradient or indigo; secondary outline. Hover: opacity or background change.
- IMAGES: If you use <img> in hero or sections, src MUST be a full working URL that returns a real image. Use https://picsum.photos/600/400 or https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop — never relative paths or fake URLs (they show a broken image). PREFERRED: Skip img and use a gradient div with labels/numbers/colored bars as a dashboard mock so nothing can break.
- Copy: SPECIFIC, benefit-driven. FORBIDDEN: "Feature 1/2/3", "Client 1/2/3", "Testimonial from client X". Use real feature names, testimonials, pricing bullets. Hero/right side: real content or working image URL or gradient mock.
- Responsive: maxWidth, flexWrap, no horizontal scroll.

Output MUST be valid JSON only. No markdown fences. Safe paths: no absolute, no '..'.`

const MAX_PROMPT_CHARS = Number(process.env.MAX_PROMPT_CHARS || 4000)
const MAX_OUTPUT_TOKENS = Number(process.env.MAX_OUTPUT_TOKENS || 3600)
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
        responseFormat: 'json_object',
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
        responseFormat: 'json_object',
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
    const message = getErrorMessage(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
