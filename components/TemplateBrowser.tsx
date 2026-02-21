'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'

interface Template {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  is_official: boolean
  usage_count: number
  filesCount: number
}

const CATEGORIES = [
  { id: 'all', name: 'All Templates', icon: '📦' },
  { id: 'landing', name: 'Landing Pages', icon: '🌐' },
  { id: 'app', name: 'Applications', icon: '📱' },
  { id: 'dashboard', name: 'Dashboards', icon: '📊' },
  { id: 'component', name: 'Components', icon: '🧩' },
]

export default function TemplateBrowser({ onClose }: { onClose: () => void }) {
  const { setCurrentProject } = useStore()
  const [templates, setTemplates] = useState<Template[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    filterTemplates()
  }, [selectedCategory, searchQuery, templates])

  const loadTemplates = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/templates')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load templates')
      }

      if (data.success && data.templates) {
        setTemplates(
          data.templates.map((t: any) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            category: t.category,
            tags: t.tags || [],
            is_official: t.is_official,
            usage_count: t.usage_count,
            filesCount: t.files?.length || 0,
          }))
        )
      }
    } catch (err) {
      console.error('Error loading templates:', err)
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setIsLoading(false)
    }
  }

  const filterTemplates = () => {
    let filtered = templates

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        t =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    setFilteredTemplates(filtered)
  }

  const useTemplate = async (templateId: string) => {
    setIsCreating(true)

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'use',
          templateId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to use template')
      }

      if (data.success && data.template) {
        // Convert template to project format
        const project = {
          id: Date.now().toString(),
          name: data.template.name,
          description: data.template.description,
          files: data.template.files.map((f: any) => ({
            name: f.path.split('/').pop() || f.path,
            path: f.path,
            content: f.content,
            type: f.type as 'file' | 'directory',
          })),
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        setCurrentProject(project)
        onClose()
      }
    } catch (err) {
      console.error('Error using template:', err)
      alert('Failed to use template: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0f] border border-[#1f1f2e] rounded-lg max-w-6xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#1f1f2e] flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>📋</span>
              Template Library
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Start with a ready-made template
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#1f1f2e] rounded transition-colors"
          >
            <span className="text-gray-400 text-2xl">×</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-6 border-b border-[#1f1f2e]">
          <div className="flex gap-4">
            {/* Search */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="flex-1 bg-[#1f1f2e] border border-[#2a2a3e] rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 mt-4 overflow-x-auto">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-[#6366f1] text-white'
                    : 'bg-[#1f1f2e] text-gray-400 hover:bg-[#2a2a3e]'
                }`}
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-gray-500">Loading templates...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">❌</div>
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={loadTemplates}
                className="px-4 py-2 bg-[#6366f1] hover:bg-[#5558e3] text-white rounded transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-gray-500">
                {searchQuery || selectedCategory !== 'all'
                  ? 'No templates found'
                  : 'No templates available'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className="bg-[#1f1f2e] border border-[#2a2a3e] rounded-lg p-5 hover:border-[#6366f1] transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white group-hover:text-[#6366f1] transition-colors">
                      {template.name}
                    </h3>
                    {template.is_official && (
                      <span className="px-2 py-0.5 bg-blue-500 bg-opacity-20 text-blue-400 text-xs rounded">
                        Official
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                    {template.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {template.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-[#2a2a3e] text-gray-400 text-xs rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {template.filesCount} files · {template.usage_count} uses
                    </div>
                    <button
                      onClick={() => useTemplate(template.id)}
                      disabled={isCreating}
                      className="px-4 py-2 bg-[#6366f1] hover:bg-[#5558e3] disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                    >
                      {isCreating ? 'Loading...' : 'Use Template'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
