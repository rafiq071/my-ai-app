import { supabase } from './supabase'
import type { FileNode } from './store'

export interface DBTemplate {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  thumbnail_url: string | null
  author_id: string | null
  is_public: boolean
  is_official: boolean
  usage_count: number
  created_at: string
  updated_at: string
  files?: DBTemplateFile[]
}

export interface DBTemplateFile {
  id: string
  template_id: string
  path: string
  content: string
  type: string
  created_at: string
}

/**
 * Get all public templates
 */
export async function getTemplates(category?: string): Promise<DBTemplate[]> {
  let query = supabase
    .from('templates')
    .select(`
      *,
      template_files (*)
    `)
    .eq('is_public', true)
    .order('is_official', { ascending: false })
    .order('usage_count', { ascending: false })

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) throw error

  return (data || []).map(template => ({
    ...template,
    files: template.template_files || [],
  }))
}

/**
 * Get a single template by ID
 */
export async function getTemplate(templateId: string): Promise<DBTemplate | null> {
  const { data, error } = await supabase
    .from('templates')
    .select(`
      *,
      template_files (*)
    `)
    .eq('id', templateId)
    .eq('is_public', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return {
    ...data,
    files: data.template_files || [],
  }
}

/**
 * Search templates
 */
export async function searchTemplates(query: string): Promise<DBTemplate[]> {
  const { data, error } = await supabase
    .from('templates')
    .select(`
      *,
      template_files (*)
    `)
    .eq('is_public', true)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
    .order('usage_count', { ascending: false })

  if (error) throw error

  return (data || []).map(template => ({
    ...template,
    files: template.template_files || [],
  }))
}

/**
 * Create template from project
 */
export async function createTemplate(
  name: string,
  description: string,
  category: string,
  tags: string[],
  files: FileNode[],
  userId: string,
  isPublic: boolean = true
): Promise<DBTemplate> {
  // Create template
  const { data: template, error: templateError } = await supabase
    .from('templates')
    .insert({
      name,
      description,
      category,
      tags,
      author_id: userId,
      is_public: isPublic,
      is_official: false,
    })
    .select()
    .single()

  if (templateError) throw templateError

  // Create files
  const fileInserts = files.map(file => ({
    template_id: template.id,
    path: file.path,
    content: file.content,
    type: file.type,
  }))

  const { error: filesError } = await supabase
    .from('template_files')
    .insert(fileInserts)

  if (filesError) {
    // Rollback template creation
    await supabase.from('templates').delete().eq('id', template.id)
    throw filesError
  }

  // Fetch complete template
  const completeTemplate = await getTemplate(template.id)
  if (!completeTemplate) throw new Error('Failed to fetch created template')

  return completeTemplate
}

/**
 * Increment template usage count
 */
export async function incrementTemplateUsage(templateId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_template_usage', {
    template_uuid: templateId,
  })

  if (error) {
    console.error('Failed to increment usage:', error)
    // Don't throw - this is not critical
  }
}

/**
 * Get my templates (created by current user)
 */
export async function getMyTemplates(userId: string): Promise<DBTemplate[]> {
  const { data, error } = await supabase
    .from('templates')
    .select(`
      *,
      template_files (*)
    `)
    .eq('author_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data || []).map(template => ({
    ...template,
    files: template.template_files || [],
  }))
}

/**
 * Update template
 */
export async function updateTemplate(
  templateId: string,
  updates: {
    name?: string
    description?: string
    category?: string
    tags?: string[]
    is_public?: boolean
  }
): Promise<DBTemplate> {
  const { data, error } = await supabase
    .from('templates')
    .update(updates)
    .eq('id', templateId)
    .select()
    .single()

  if (error) throw error

  const completeTemplate = await getTemplate(templateId)
  if (!completeTemplate) throw new Error('Failed to fetch updated template')

  return completeTemplate
}

/**
 * Delete template
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', templateId)

  if (error) throw error
}

/**
 * Get template categories with counts
 */
export async function getTemplateCategories(): Promise<
  Array<{ category: string; count: number }>
> {
  const { data, error } = await supabase
    .from('templates')
    .select('category')
    .eq('is_public', true)

  if (error) throw error

  // Count by category
  const categoryCounts = (data || []).reduce((acc, { category }) => {
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(categoryCounts).map(([category, count]) => ({
    category,
    count,
  }))
}

/**
 * Get popular tags
 */
export async function getPopularTags(limit: number = 20): Promise<
  Array<{ tag: string; count: number }>
> {
  const { data, error } = await supabase
    .from('templates')
    .select('tags')
    .eq('is_public', true)

  if (error) throw error

  // Flatten and count tags
  const allTags = (data || []).flatMap(t => t.tags || [])
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}
