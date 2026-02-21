/**
 * Search & Filter Utilities
 * For filtering and sorting projects
 */

export interface ProjectItem {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
  filesCount: number
  tags?: string[]
  technology?: string
}

export type SortOption = 
  | 'updated-desc'
  | 'updated-asc'
  | 'created-desc'
  | 'created-asc'
  | 'name-asc'
  | 'name-desc'
  | 'files-desc'
  | 'files-asc'

export type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year'

export interface FilterOptions {
  search?: string
  dateFilter?: DateFilter
  technology?: string
  sortBy?: SortOption
}

/**
 * Search projects by name or description
 */
export function searchProjects(
  projects: ProjectItem[],
  searchQuery: string
): ProjectItem[] {
  if (!searchQuery.trim()) {
    return projects
  }

  const query = searchQuery.toLowerCase()

  return projects.filter(project => {
    const nameMatch = project.name.toLowerCase().includes(query)
    const descMatch = project.description?.toLowerCase().includes(query)
    const tagsMatch = project.tags?.some(tag => 
      tag.toLowerCase().includes(query)
    )

    return nameMatch || descMatch || tagsMatch
  })
}

/**
 * Filter projects by date
 */
export function filterByDate(
  projects: ProjectItem[],
  dateFilter: DateFilter
): ProjectItem[] {
  if (dateFilter === 'all') {
    return projects
  }

  const now = new Date()
  const cutoffDate = new Date()

  switch (dateFilter) {
    case 'today':
      cutoffDate.setHours(0, 0, 0, 0)
      break
    case 'week':
      cutoffDate.setDate(now.getDate() - 7)
      break
    case 'month':
      cutoffDate.setMonth(now.getMonth() - 1)
      break
    case 'year':
      cutoffDate.setFullYear(now.getFullYear() - 1)
      break
  }

  return projects.filter(project => {
    const updatedDate = new Date(project.updated_at)
    return updatedDate >= cutoffDate
  })
}

/**
 * Filter by technology (detected from files)
 */
export function filterByTechnology(
  projects: ProjectItem[],
  technology: string
): ProjectItem[] {
  if (!technology || technology === 'all') {
    return projects
  }

  return projects.filter(project => 
    project.technology === technology
  )
}

/**
 * Sort projects
 */
export function sortProjects(
  projects: ProjectItem[],
  sortBy: SortOption
): ProjectItem[] {
  const sorted = [...projects]

  switch (sortBy) {
    case 'updated-desc':
      return sorted.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
    
    case 'updated-asc':
      return sorted.sort((a, b) => 
        new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      )
    
    case 'created-desc':
      return sorted.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    
    case 'created-asc':
      return sorted.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    
    case 'name-asc':
      return sorted.sort((a, b) => 
        a.name.localeCompare(b.name)
      )
    
    case 'name-desc':
      return sorted.sort((a, b) => 
        b.name.localeCompare(a.name)
      )
    
    case 'files-desc':
      return sorted.sort((a, b) => 
        b.filesCount - a.filesCount
      )
    
    case 'files-asc':
      return sorted.sort((a, b) => 
        a.filesCount - b.filesCount
      )
    
    default:
      return sorted
  }
}

/**
 * Apply all filters and sorting
 */
export function applyFilters(
  projects: ProjectItem[],
  options: FilterOptions
): ProjectItem[] {
  let filtered = projects

  // Search
  if (options.search) {
    filtered = searchProjects(filtered, options.search)
  }

  // Date filter
  if (options.dateFilter && options.dateFilter !== 'all') {
    filtered = filterByDate(filtered, options.dateFilter)
  }

  // Technology filter
  if (options.technology && options.technology !== 'all') {
    filtered = filterByTechnology(filtered, options.technology)
  }

  // Sort
  if (options.sortBy) {
    filtered = sortProjects(filtered, options.sortBy)
  }

  return filtered
}

/**
 * Detect technology from project name or description
 */
export function detectTechnology(project: ProjectItem): string {
  const text = `${project.name} ${project.description || ''}`.toLowerCase()

  if (text.includes('react') || text.includes('next')) return 'React'
  if (text.includes('vue')) return 'Vue'
  if (text.includes('angular')) return 'Angular'
  if (text.includes('svelte')) return 'Svelte'
  if (text.includes('node')) return 'Node.js'
  if (text.includes('python')) return 'Python'
  if (text.includes('django')) return 'Django'
  if (text.includes('flask')) return 'Flask'

  return 'Other'
}

/**
 * Get unique technologies from projects
 */
export function getUniqueTechnologies(projects: ProjectItem[]): string[] {
  const technologies = projects.map(p => 
    p.technology || detectTechnology(p)
  )
  
  return Array.from(new Set(technologies)).sort()
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  
  return date.toLocaleDateString()
}

/**
 * Get filter summary text
 */
export function getFilterSummary(options: FilterOptions, totalCount: number): string {
  const parts: string[] = []

  if (options.search) {
    parts.push(`"${options.search}"`)
  }

  if (options.dateFilter && options.dateFilter !== 'all') {
    parts.push(options.dateFilter)
  }

  if (options.technology && options.technology !== 'all') {
    parts.push(options.technology)
  }

  if (parts.length === 0) {
    return `${totalCount} projects`
  }

  return `${totalCount} projects (${parts.join(', ')})`
}
