'use client'

import { useState, useEffect, useMemo } from 'react'
import { useStore } from '@/lib/store'
import ExportDialog from './ExportDialog'
import ImportDialog from './ImportDialog'
import { isSupabaseConfigured } from '@/lib/supabase'
import { listLocalProjects, getLocalProject, upsertLocalProject, deleteLocalProject } from '@/lib/local-projects'
import {
  applyFilters,
  detectTechnology,
  formatDate,
  getFilterSummary,
  type SortOption,
  type DateFilter,
  type ProjectItem,
} from '@/lib/search-filter'

interface SavedProject {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
  filesCount: number
}

export default function ProjectsList() {
  const { currentProject, setCurrentProject, isGenerating } = useStore()
  const [projects, setProjects] = useState<SavedProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('updated-desc')
  const [showFilters, setShowFilters] = useState(false)

  const useRemote = isSupabaseConfigured()

  // Load projects on mount
  useEffect(() => {
    loadProjects()
  }, [])

  // Apply filters and sorting
  const filteredProjects = useMemo(() => {
    const projectItems: ProjectItem[] = projects.map(p => ({
      ...p,
      technology: detectTechnology(p as ProjectItem),
    }))

    return applyFilters(projectItems, {
      search: searchQuery,
      dateFilter,
      sortBy,
    })
  }, [projects, searchQuery, dateFilter, sortBy])

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setDateFilter('all')
    setSortBy('updated-desc')
  }

  const loadProjects = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (!useRemote) {
        const local = listLocalProjects()
        setProjects(
          local.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            created_at: p.createdAt,
            updated_at: p.updatedAt,
            filesCount: p.files?.length || 0,
          }))
        )
        return
      }

      const response = await fetch('/api/projects')
      const data = await response.json()

      if (response.status === 401) {
        setProjects([])
        return
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load projects')
      }

      if (data.success && data.projects) {
        setProjects(
          data.projects.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            created_at: p.created_at,
            updated_at: p.updated_at,
            filesCount: p.files?.length || 0,
          }))
        )
      }
    } catch (err) {
      console.error('Error loading projects:', err)
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadProject = async (projectId: string) => {
    try {
      if (!useRemote) {
        const p = getLocalProject(projectId)
        if (!p) throw new Error('Project not found')
        setCurrentProject({
          id: p.id,
          name: p.name,
          description: p.description || '',
          files: p.files,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        })
        return
      }

      const response = await fetch(`/api/projects?id=${projectId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load project')
      }

      if (data.success && data.project) {
        const project = data.project
        setCurrentProject({
          id: project.id,
          name: project.name,
          description: project.description || '',
          files: project.files || [],
          createdAt: new Date(project.created_at || project.createdAt),
          updatedAt: new Date(project.updated_at || project.updatedAt),
          deployment: project.deployment,
        })
      }
    } catch (err) {
      console.error('Error loading project:', err)
      setError(err instanceof Error ? err.message : 'Failed to load project')
    }
  }

  const handleSaveProject = async () => {
    if (!currentProject || !projectName.trim()) return

    setIsSaving(true)

    try {
      if (!useRemote) {
        const stored = upsertLocalProject({
          ...currentProject,
          name: projectName.trim(),
          description: projectDescription.trim(),
          updatedAt: new Date(),
        })
        setCurrentProject({
          ...currentProject,
          id: stored.id,
          name: stored.name,
          description: stored.description,
          createdAt: new Date(stored.createdAt),
          updatedAt: new Date(stored.updatedAt),
        })

        await loadProjects()
        setShowSaveDialog(false)
        setProjectName('')
        setProjectDescription('')
        return
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName.trim(),
          description: projectDescription.trim(),
          files: currentProject.files,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save project')
      }

      // Update current project with DB ID
      if (data.success && data.project) {
        setCurrentProject({
          ...currentProject,
          id: data.project.id,
          name: projectName,
          description: projectDescription,
        })
      }

      await loadProjects()

      setShowSaveDialog(false)
      setProjectName('')
      setProjectDescription('')
    } catch (err) {
      console.error('Error saving project:', err)
      alert('Failed to save project: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Delete "${projectName}"? This cannot be undone.`)) return

    try {
      if (!useRemote) {
        deleteLocalProject(projectId)
        await loadProjects()
        if (currentProject?.id === projectId) setCurrentProject(null)
        return
      }

      const response = await fetch(`/api/projects?id=${projectId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete project')
      }

      await loadProjects()

      if (currentProject?.id === projectId) {
        setCurrentProject(null)
      }
    } catch (err) {
      console.error('Error deleting project:', err)
      alert('Failed to delete project: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleNewProject = () => {
    setCurrentProject(null)
  }

  const openSaveDialog = () => {
    if (currentProject) {
      setProjectName(currentProject.name)
      setProjectDescription(currentProject.description || '')
    }
    setShowSaveDialog(true)
  }

  return (
    <>
      <div className="h-full flex flex-col bg-[#0a0a0f] border-r border-[#1f1f2e]">
        {/* Header */}
        <div className="p-4 border-b border-[#1f1f2e]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>💾</span>
              Projects
            </h2>
            <button
              onClick={loadProjects}
              disabled={isLoading}
              className="p-1 hover:bg-[#1f1f2e] rounded transition-colors"
              title="Refresh"
            >
              <span className={`text-gray-400 text-sm ${isLoading ? 'animate-spin' : ''}`}>
                🔄
              </span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            {/* Row 1: New + Save */}
            <div className="flex gap-2">
              <button
                onClick={handleNewProject}
                className="flex-1 px-3 py-1.5 text-xs bg-[#1f1f2e] hover:bg-[#2a2a3e] text-white rounded transition-colors"
              >
                ➕ New
              </button>
              <button
                onClick={openSaveDialog}
                disabled={!currentProject || isGenerating}
                className="flex-1 px-3 py-1.5 text-xs bg-[#6366f1] hover:bg-[#5558e3] disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
              >
                💾 Save
              </button>
            </div>

            {/* Row 2: Export + Import */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowExportDialog(true)}
                disabled={!currentProject}
                className="flex-1 px-3 py-1.5 text-xs bg-[#1f1f2e] hover:bg-[#2a2a3e] disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded transition-colors"
              >
                ⬇ Export
              </button>
              <button
                onClick={() => setShowImportDialog(true)}
                className="flex-1 px-3 py-1.5 text-xs bg-[#1f1f2e] hover:bg-[#2a2a3e] text-white rounded transition-colors"
              >
                ⬆ Import
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="mt-3 space-y-2">
            {/* Search bar */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full bg-[#1f1f2e] border border-[#2a2a3e] rounded px-3 py-2 pl-8 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
              />
              <span className="absolute left-2.5 top-2.5 text-gray-500 text-sm">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-gray-500 hover:text-white text-sm"
                >
                  ×
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full px-3 py-1.5 text-xs bg-[#1f1f2e] hover:bg-[#2a2a3e] text-gray-300 rounded transition-colors flex items-center justify-between"
            >
              <span>🔽 Filters & Sort</span>
              <span className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {/* Filter options */}
            {showFilters && (
              <div className="space-y-2 p-2 bg-[#1f1f2e] rounded">
                {/* Date filter */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Date</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                    className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-white"
                  >
                    <option value="all">All time</option>
                    <option value="today">Today</option>
                    <option value="week">Last week</option>
                    <option value="month">Last month</option>
                    <option value="year">Last year</option>
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Sort by</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-white"
                  >
                    <option value="updated-desc">Recently updated</option>
                    <option value="updated-asc">Oldest updated</option>
                    <option value="created-desc">Recently created</option>
                    <option value="created-asc">Oldest created</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="files-desc">Most files</option>
                    <option value="files-asc">Least files</option>
                  </select>
                </div>

                {/* Clear filters */}
                {(searchQuery || dateFilter !== 'all' || sortBy !== 'updated-desc') && (
                  <button
                    onClick={clearFilters}
                    className="w-full px-2 py-1 text-xs bg-[#0a0a0f] hover:bg-[#2a2a3e] text-gray-400 rounded transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {/* Filter summary */}
            <div className="text-xs text-gray-500">
              {getFilterSummary({ search: searchQuery, dateFilter, sortBy }, filteredProjects.length)}
            </div>
          </div>
        </div>

        {/* Projects list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="text-2xl mb-2">⏳</div>
              <p className="text-sm text-gray-500">Loading projects...</p>
            </div>
          ) : error ? (
            <div className="p-4">
              <div className="bg-red-900 bg-opacity-20 border border-red-900 rounded p-3">
                <p className="text-sm text-red-400">{error}</p>
                <button
                  onClick={loadProjects}
                  className="mt-2 text-xs text-red-300 hover:underline"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="p-4 text-center">
              <div className="text-4xl mb-2">
                {projects.length === 0 ? '📁' : '🔍'}
              </div>
              <p className="text-sm text-gray-500">
                {projects.length === 0 ? 'No saved projects' : 'No projects found'}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {projects.length === 0 
                  ? 'Generate a project and save it'
                  : 'Try different filters or search terms'
                }
              </p>
              {(searchQuery || dateFilter !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="mt-3 text-xs text-[#6366f1] hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[#1f1f2e]">
              {filteredProjects.map((project) => {
                const isActive = currentProject?.id === project.id
                return (
                  <div
                    key={project.id}
                    className={`p-3 hover:bg-[#1f1f2e] transition-colors ${
                      isActive ? 'bg-[#1f1f2e] border-l-2 border-[#6366f1]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => handleLoadProject(project.id)}
                        className="flex-1 text-left"
                      >
                        <h3 className="text-sm font-medium text-white mb-1">
                          {project.name}
                        </h3>
                        {project.description && (
                          <p className="text-xs text-gray-500 line-clamp-2 mb-1">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <span>{project.filesCount} files</span>
                          <span>{formatDate(project.updated_at)}</span>
                        </div>
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id, project.name)}
                        className="p-1 hover:bg-red-900 hover:bg-opacity-30 rounded transition-colors"
                        title="Delete project"
                      >
                        <span className="text-gray-600 hover:text-red-400 text-sm">🗑️</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#0a0a0f] border border-[#1f1f2e] rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold text-white mb-4">Save Project</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Project Name *</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="My Awesome Project"
                  className="w-full bg-[#1f1f2e] border border-[#2a2a3e] rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="What does this project do?"
                  rows={3}
                  className="w-full bg-[#1f1f2e] border border-[#2a2a3e] rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#6366f1] resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-[#1f1f2e] hover:bg-[#2a2a3e] disabled:bg-gray-700 text-white rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProject}
                  disabled={!projectName.trim() || isSaving}
                  className="flex-1 px-4 py-2 bg-[#6366f1] hover:bg-[#5558e3] disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Dialog */}
      {showExportDialog && (
        <ExportDialog onClose={() => setShowExportDialog(false)} />
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <ImportDialog onClose={() => setShowImportDialog(false)} />
      )}
    </>
  )
}
