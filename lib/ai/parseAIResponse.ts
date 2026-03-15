/**
 * Strict JSON parser for AI generation responses.
 * Tries parse, then regex extraction, then returns result or error.
 * Caller is responsible for retrying the request with "Return ONLY valid JSON" if needed.
 */

import { extractJson } from '@/lib/project-schema'

export type ParseResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string; raw?: string }

/** Repair common JSON mistakes from LLM output (e.g. trailing commas). */
function repairJson(s: string): string {
  return s.replace(/,(\s*[}\]])/g, '$1').replace(/\r\n/g, '\n').trim()
}

/** Extract JSON from text using multiple strategies (object or array). */
function extractJsonCandidates(text: string): string[] {
  const trimmed = (text || '').trim()
  const candidates: string[] = []

  // 1. Use project-schema extractJson (markdown code blocks)
  const fromMarkdown = extractJson(trimmed)
  if (fromMarkdown) candidates.push(fromMarkdown)

  // 2. Raw trimmed (in case no markdown)
  if (trimmed !== fromMarkdown) candidates.push(trimmed)

  // 3. First { ... } or [ ... ] block
  const objectMatch = trimmed.match(/\{[\s\S]*\}/)
  if (objectMatch) candidates.push(objectMatch[0])
  const arrayMatch = trimmed.match(/\[[\s\S]*\]/)
  if (arrayMatch) candidates.push(arrayMatch[0])

  return [...new Set(candidates)]
}

/**
 * Parse raw AI response text into JSON.
 * Tries direct parse, then regex-extracted candidates.
 * Logs raw response for debugging.
 */
export function parseAIResponse(responseText: string): ParseResult {
  const raw = typeof responseText === 'string' ? responseText : String(responseText ?? '')
  console.log('AI raw response:', raw.slice(0, 2000) + (raw.length > 2000 ? '...' : ''))

  // Try direct parse first, then repaired raw
  try {
    const data = JSON.parse(raw)
    return { ok: true, data }
  } catch {
    try {
      const data = JSON.parse(repairJson(raw))
      return { ok: true, data }
    } catch {
      // continue
    }
  }

  const candidates = extractJsonCandidates(raw)
  for (const candidate of candidates) {
    try {
      const data = JSON.parse(candidate)
      return { ok: true, data }
    } catch {
      try {
        const repaired = repairJson(candidate)
        if (repaired !== candidate) {
          const data = JSON.parse(repaired)
          return { ok: true, data }
        }
      } catch {
        // try next candidate
      }
    }
  }

  return {
    ok: false,
    error: 'Invalid JSON from model',
    raw: raw.slice(0, 1000),
  }
}

/**
 * Parse and validate that result is a generated project shape.
 * Returns parsed project or error; does not throw.
 */
export function parseAIResponseAsProject(responseText: string): ParseResult {
  const result = parseAIResponse(responseText)
  if (!result.ok) return result
  if (!result.data || typeof result.data !== 'object') {
    return { ok: false, error: 'Invalid project structure', raw: JSON.stringify(result.data).slice(0, 500) }
  }
  return result
}
