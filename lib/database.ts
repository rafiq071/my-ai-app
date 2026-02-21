import { supabase, isSupabaseConfigured } from './supabase'
import type { FileNode } from './store'

function requireSupabase() {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY or use local storage mode.')
  }
  return supabase
}

export interface DBProject {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
  files?: DBProjectFile[]
  deployment?: DBDeployment
}

export interface DBProjectFile {
  id: string
  project_id: string
  path: string
  content: string
  type: string
  created_at: string
  updated_at: string
}

export interface DBDeployment {
  id: string
  project_id: string
  deployment_id: string
  url: string
  preview_url: string | null
  production_url: string | null
  status: string
  error_message: string | null
  created_at: string
  ready_at: string | null
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await requireSupabase().auth.getUser()
  if (error) throw error
  return user
}

/**
 * Get all projects for current user
 */
export async function getProjects(): Promise<DBProject[]> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await requireSupabase()
    .from('projects')
    .select(`
      *,
      project_files (*),
      deployments (*)
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) throw error

  return (data || []).map(project => ({
    ...project,
    deployment: project.deployments?.[0] || undefined,
    files: project.project_files || [],
  }))
}

/**
 * Get a single project by ID
 */
export async function getProject(projectId: string): Promise<DBProject | null> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_files (*),
      deployments (*)
    `)
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  return {
    ...data,
    deployment: data.deployments?.[0] || undefined,
    files: data.project_files || [],
  }
}

/**
 * Create a new project
 */
export async function createProject(
  name: string,
  description: string,
  files: FileNode[]
): Promise<DBProject> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  // Create project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name,
      description,
    })
    .select()
    .single()

  if (projectError) throw projectError

  // Create files
  const fileInserts = files.map(file => ({
    project_id: project.id,
    path: file.path,
    content: file.content,
    type: file.type,
  }))

  const { error: filesError } = await supabase
    .from('project_files')
    .insert(fileInserts)

  if (filesError) {
    // Rollback project creation
    await requireSupabase().from('projects').delete().eq('id', project.id)
    throw filesError
  }

  // Fetch complete project with files
  const completeProject = await getProject(project.id)
  if (!completeProject) throw new Error('Failed to fetch created project')

  return completeProject
}

/**
 * Update project metadata
 */
export async function updateProject(
  projectId: string,
  updates: { name?: string; description?: string }
): Promise<DBProject> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error

  const completeProject = await getProject(projectId)
  if (!completeProject) throw new Error('Failed to fetch updated project')

  return completeProject
}

/**
 * Update project files (replace all)
 */
export async function updateProjectFiles(
  projectId: string,
  files: FileNode[]
): Promise<void> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  // Verify project ownership
  const project = await getProject(projectId)
  if (!project) throw new Error('Project not found')

  // Delete existing files
  const { error: deleteError } = await supabase
    .from('project_files')
    .delete()
    .eq('project_id', projectId)

  if (deleteError) throw deleteError

  // Insert new files
  const fileInserts = files.map(file => ({
    project_id: projectId,
    path: file.path,
    content: file.content,
    type: file.type,
  }))

  const { error: insertError } = await supabase
    .from('project_files')
    .insert(fileInserts)

  if (insertError) throw insertError

  // Update project updated_at
  await supabase
    .from('projects')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', projectId)
}

/**
 * Update a single file
 */
export async function updateProjectFile(
  projectId: string,
  filePath: string,
  content: string
): Promise<void> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  // Verify project ownership
  const project = await getProject(projectId)
  if (!project) throw new Error('Project not found')

  const { error } = await supabase
    .from('project_files')
    .update({ content })
    .eq('project_id', projectId)
    .eq('path', filePath)

  if (error) throw error

  // Update project updated_at
  await supabase
    .from('projects')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', projectId)
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string): Promise<void> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', user.id)

  if (error) throw error
}

/**
 * Save deployment info
 */
export async function saveDeployment(
  projectId: string,
  deploymentData: {
    deployment_id: string
    url: string
    preview_url?: string
    production_url?: string
    status: string
  }
): Promise<DBDeployment> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  // Verify project ownership
  const project = await getProject(projectId)
  if (!project) throw new Error('Project not found')

  const { data, error } = await supabase
    .from('deployments')
    .insert({
      project_id: projectId,
      ...deploymentData,
    })
    .select()
    .single()

  if (error) throw error

  return data
}

/**
 * Update deployment status
 */
export async function updateDeploymentStatus(
  deploymentId: string,
  status: string,
  errorMessage?: string
): Promise<void> {
  const { error } = await supabase
    .from('deployments')
    .update({
      status,
      error_message: errorMessage || null,
      ready_at: status === 'READY' ? new Date().toISOString() : undefined,
    })
    .eq('deployment_id', deploymentId)

  if (error) throw error
}

/**
 * Search projects
 */
export async function searchProjects(query: string): Promise<DBProject[]> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_files (*),
      deployments (*)
    `)
    .eq('user_id', user.id)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order('updated_at', { ascending: false })

  if (error) throw error

  return (data || []).map(project => ({
    ...project,
    deployment: project.deployments?.[0] || undefined,
    files: project.project_files || [],
  }))
}
