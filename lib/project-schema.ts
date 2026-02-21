export type GeneratedFile = {
  path: string
  content: string
  type?: 'file' | 'directory'
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
  const files: GeneratedFile[] = (obj.files || []).map((f: any) => ({
    path: String(f.path || '').trim(),
    content: String(f.content || ''),
    type: (f.type === 'directory' ? 'directory' : 'file'),
  }))
  return { name, description, files }
}
