export type GeneratedFile = {
  path: string
  content: string
  type?: 'file' | 'directory'
}

/** Extract JSON from model output (handles markdown-wrapped JSON). Use after stream completes. */
export function extractJson(text: string): string {
  const trimmed = (text || '').trim()
  const jsonMatch =
    trimmed.match(/```json\n([\s\S]*?)\n```/) ||
    trimmed.match(/```\n([\s\S]*?)\n```/)
  return (jsonMatch ? jsonMatch[1] : trimmed).trim()
}

/**
 * Strip imports from ./components/ and replace their JSX usage with placeholders
 * so preview works when AI returns multi-component App.tsx but only App.tsx is mounted.
 */
export function sanitizeAppTsx(content: string): string {
  let out = content
  // Remove import lines from ./components/ or '../components/'
  out = out.replace(/^\s*import\s+[\s\S]*?\s+from\s+['"]\.\.?\/components\/[^'"]+['"]\s*;?\s*$/gm, '')
  // Replace common component tags with a placeholder div (self-closing and with children)
  const componentNames = [
    'Pricing', 'FAQ', 'ContactForm', 'FinalCTA', 'Footer', 'Hero', 'Navbar',
    'Features', 'Testimonials', 'ProblemSolution', 'CtaSection', 'ContactSection',
  ]
  for (const name of componentNames) {
    const open = new RegExp(`<${name}\\s*/?>`, 'g')
    const openClose = new RegExp(`<${name}[^>]*>[\\s\\S]*?<\\/${name}>`, 'g')
    out = out.replace(openClose, `<div key="${name}" style={{ minHeight: 24, margin: '8px 0' }} />`)
    out = out.replace(open, `<div key="${name}" style={{ minHeight: 24, margin: '8px 0' }} />`)
  }
  return out
}

export type GeneratedProject = {
  name: string
  description?: string
  files: GeneratedFile[]
}

export function isValidGeneratedProject(obj: any): obj is GeneratedProject {
  if (!obj || typeof obj !== 'object') return false
  if (typeof obj.name !== 'string' || obj.name.trim().length === 0) return false
  if (!Array.isArray(obj.files) || obj.files.length === 0) return false

  const hasAppTsx = obj.files.some(
    (f: any) => f && typeof f.path === 'string' && (f.path === 'src/App.tsx' || f.path === 'App.tsx')
  )
  if (!hasAppTsx) return false

  // Basic file validation
  for (const f of obj.files) {
    if (!f || typeof f !== 'object') return false
    if (typeof f.path !== 'string' || f.path.trim().length === 0) return false
    if (typeof f.content !== 'string') return false
    // type is optional; default 'file'
    if (f.type !== undefined && f.type !== 'file' && f.type !== 'directory') return false
    // Prevent path traversal
    if (f.path.includes('..') || f.path.startsWith('/') || f.path.startsWith('\\')) return false
    // Guard absurd file sizes
    if (f.content.length > 200_000) return false
  }

  return true
}

export function normalizeGeneratedProject(obj: any): GeneratedProject {
  const name = String(obj.name || '').trim() || 'generated-project'
  const description = typeof obj.description === 'string' ? obj.description : undefined
  const files: GeneratedFile[] = (obj.files || []).map((f: any) => {
    let content = String(f.content || '')
    const path = String(f.path || '').trim()
    if (path === 'src/App.tsx' || path === 'App.tsx') {
      content = sanitizeAppTsx(content)
    }
    return {
      path: path === 'App.tsx' ? 'src/App.tsx' : path,
      content,
      type: (f.type === 'directory' ? 'directory' : 'file'),
    }
  })
  return { name, description, files }
}
