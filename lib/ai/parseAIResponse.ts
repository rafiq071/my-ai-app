/**
 * Strict JSON parser for AI generation responses.
 * Tries parse, then regex extraction, then returns result or error.
 * Caller is responsible for retrying the request with "Return ONLY valid JSON" if needed.
 */

import { extractJson } from '@/lib/project-schema'

export type ParseResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string; raw?: string }

/** Repair common JSON mistakes from LLM output (trailing commas, BOM). */
function repairJson(s: string): string {
  return s
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/,(\s*[}\]])/g, '$1')
    .trim()
}

/** Try to fix truncated JSON by appending missing closing brackets. */
function tryCloseJson(s: string): string {
  const trimmed = s.trim()
  if (!trimmed.startsWith('{')) return s
  let depth = 0
  let arrayDepth = 0
  let i = 0
  const len = trimmed.length
  let inString = false
  let escape = false
  let quote = ''
  while (i < len) {
    const c = trimmed[i]
    if (escape) {
      escape = false
      i++
      continue
    }
    if (inString) {
      if (c === '\\') escape = true
      else if (c === quote) inString = false
      i++
      continue
    }
    if (c === '"' || c === "'") {
      inString = true
      quote = c
      i++
      continue
    }
    if (c === '{') depth++
    else if (c === '}') depth--
    else if (c === '[') arrayDepth++
    else if (c === ']') arrayDepth--
    i++
  }
  let suffix = ''
  while (arrayDepth > 0) {
    suffix += ']'
    arrayDepth--
  }
  while (depth > 0) {
    suffix += '}'
    depth--
  }
  return trimmed + suffix
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

  const toParse = [
    raw,
    repairJson(raw),
    tryCloseJson(raw),
    tryCloseJson(repairJson(raw)),
  ]
  for (const s of toParse) {
    try {
      const data = JSON.parse(s)
      return { ok: true, data }
    } catch {
      // continue
    }
  }

  const candidates = extractJsonCandidates(raw)
  for (const candidate of candidates) {
    for (const s of [candidate, repairJson(candidate), tryCloseJson(candidate), tryCloseJson(repairJson(candidate))]) {
      try {
        const data = JSON.parse(s)
        return { ok: true, data }
      } catch {
        // try next
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
