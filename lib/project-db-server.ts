/**
 * Server-only project DB helpers using Supabase Admin.
 * Used by API routes with NextAuth session (session.user.id).
 */

import { getSupabaseAdmin } from '@/lib/supabase-admin'
import type { FileNode, Project } from '@/lib/store'

interface DBProjectRow {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
  project_files?: { path: string; content: string; type: string }[]
}

function dbFilesToFileNodes(files: { path: string; content: string; type: string }[]): FileNode[] {
  return files.map((f) => ({
    name: f.path.split('/').pop() || f.path,
    path: f.path,
    content: f.content,
    type: (f.type as 'file' | 'directory') || 'file',
  }))
}

export function dbProjectToAppProject(row: DBProjectRow): Project {
  const files = row.project_files || []
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    files: dbFilesToFileNodes(files),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export async function getProjectByIdAndUser(
  projectId: string,
  userId: string
): Promise<Project | null> {
  const admin = getSupabaseAdmin()
  if (!admin) return null

  const { data, error } = await admin
    .from('projects')
    .select('*, project_files(path, content, type)')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return dbProjectToAppProject(data as DBProjectRow)
}

export async function createProjectWithId(
  id: string,
  userId: string,
  name: string,
  description: string,
  files: FileNode[]
): Promise<Project> {
  const admin = getSupabaseAdmin()
  if (!admin) throw new Error('Supabase is not configured')

  const now = new Date().toISOString()
  const { error: projectError } = await admin.from('projects').insert({
    id,
    user_id: userId,
    name,
    description: description || null,
    created_at: now,
    updated_at: now,
  })

  if (projectError) throw projectError

  if (files.length > 0) {
    const fileRows = files.map((f) => ({
      project_id: id,
      path: f.path,
      content: f.content,
      type: f.type,
    }))
    const { error: filesError } = await admin.from('project_files').insert(fileRows)
    if (filesError) throw filesError
  }

  const created = await getProjectByIdAndUser(id, userId)
  if (!created) throw new Error('Failed to fetch created project')
  return created
}

export async function updateProjectAndFiles(
  projectId: string,
  userId: string,
  name: string,
  description: string,
  files: FileNode[]
): Promise<Project> {
  const admin = getSupabaseAdmin()
  if (!admin) throw new Error('Supabase is not configured')

  const existing = await getProjectByIdAndUser(projectId, userId)
  if (!existing) throw new Error('Project not found')

  await admin
    .from('projects')
    .update({
      name,
      description: description || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .eq('user_id', userId)

  // Delete then insert to avoid partial writes (no transaction in v1)
  await admin.from('project_files').delete().eq('project_id', projectId)

  if (files.length > 0) {
    const fileRows = files.map((f) => ({
      project_id: projectId,
      path: f.path,
      content: f.content,
      type: f.type,
    }))
    const { error } = await admin.from('project_files').insert(fileRows)
    if (error) throw error
  }

  const updated = await getProjectByIdAndUser(projectId, userId)
  if (!updated) throw new Error('Failed to fetch updated project')
  return updated
}
