import type { FileNode, Project } from '@/lib/store'

const KEY = 'lovable_clone_projects_v1'

type StoredProject = {
  id: string
  name: string
  description: string
  files: FileNode[]
  createdAt: string
  updatedAt: string
}

function loadAll(): StoredProject[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveAll(projects: StoredProject[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(projects))
}

export function listLocalProjects(): StoredProject[] {
  return loadAll().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
}

export function getLocalProject(id: string): StoredProject | null {
  return loadAll().find(p => p.id === id) || null
}

export function upsertLocalProject(project: Project) {
  const all = loadAll()
  const now = new Date().toISOString()
  const stored: StoredProject = {
    id: project.id,
    name: project.name,
    description: project.description,
    files: project.files,
    createdAt: project.createdAt ? new Date(project.createdAt).toISOString() : now,
    updatedAt: now,
  }
  const idx = all.findIndex(p => p.id === project.id)
  if (idx >= 0) all[idx] = stored
  else all.push(stored)
  saveAll(all)
  return stored
}

export function deleteLocalProject(id: string) {
  const all = loadAll().filter(p => p.id !== id)
  saveAll(all)
}
