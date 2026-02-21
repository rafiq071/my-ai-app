export type ScanIssue = {
  filePath: string
  ruleId: string
  message: string
  excerpt?: string
}

/**
 * Extremely lightweight static scan to reduce obvious abuse vectors in generated code.
 * This is NOT a complete security solution; it is a pragmatic public-beta guardrail.
 */
const RULES: Array<{ id: string; pattern: RegExp; message: string }> = [
  {
    id: 'xss-cookie',
    pattern: /\bdocument\.cookie\b/i,
    message: 'Access to document.cookie is not allowed in public beta.',
  },
  {
    id: 'danger-eval',
    pattern: /\b(eval\s*\(|new\s+Function\s*\()/i,
    message: 'Dynamic code execution (eval/new Function) is restricted in public beta.',
  },
  {
    id: 'top-navigation',
    pattern: /\bwindow\.top\b|\btop\.location\b|\bparent\.location\b/i,
    message: 'Top-level navigation access is restricted in public beta.',
  },
]

export function scanGeneratedFiles(
  files: Array<{ path: string; content: string; type?: string }>
): { ok: boolean; issues: ScanIssue[] } {
  const issues: ScanIssue[] = []

  for (const f of files || []) {
    const content = String((f as any).content || '')
    const filePath = String((f as any).path || '')

    // Only scan regular files
    if (!filePath || typeof content !== 'string') continue
    if ((f as any).type && (f as any).type !== 'file') continue

    for (const rule of RULES) {
      const m = content.match(rule.pattern)
      if (m) {
        const idx = m.index ?? 0
        const excerpt = content.slice(Math.max(0, idx - 40), Math.min(content.length, idx + 80))
        issues.push({ filePath, ruleId: rule.id, message: rule.message, excerpt })
      }
    }
  }

  return { ok: issues.length === 0, issues }
}
