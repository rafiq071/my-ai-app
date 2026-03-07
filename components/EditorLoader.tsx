'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Split from 'react-split'
import { useStore } from '@/lib/store'
import { getLocalProject } from '@/lib/local-projects'
import type { Project } from '@/lib/store'
import FileExplorer from '@/components/FileExplorer'
import CodeEditor from '@/components/CodeEditor'
import PreviewPanel from '@/components/PreviewPanel'
import AutoSaveIndicator from '@/components/AutoSaveIndicator'

export default function EditorLoader({ id }: { id: string }) {
  const router = useRouter()
  const { setCurrentProject, currentProject } = useStore()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProject = async () => {
      try {
        const res = await fetch(`/api/project/${id}`)
        if (res.ok) {
          const data = await res.json()
          const normalized: Project = {
            id: data.id,
            name: data.name,
            description: data.description ?? '',
            files: data.files ?? [],
            createdAt: new Date(data.createdAt ?? data.created_at),
            updatedAt: new Date(data.updatedAt ?? data.updated_at),
          }
          setProject(normalized)
          setCurrentProject(normalized)
          setLoading(false)
          return
        }
      } catch (_e) {
        // Fall through to localStorage
      }
      const stored = getLocalProject(id)
      if (stored) {
        const normalized: Project = {
          id: stored.id,
          name: stored.name,
          description: stored.description,
          files: stored.files,
          createdAt: new Date(stored.createdAt),
          updatedAt: new Date(stored.updatedAt),
        }
        setProject(normalized)
        setCurrentProject(normalized)
      }
      setLoading(false)
    }
    loadProject()
  }, [id, setCurrentProject])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white">
        <p>Loading...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center text-white p-4">
        <h1 className="text-xl font-semibold mb-2">Project not found</h1>
        <p className="text-gray-400 mb-4">ID: {id}</p>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-[#6366f1] hover:bg-[#5558e3] rounded-lg"
        >
          Back to home
        </button>
      </div>
    )
  }

  return (
    <main className="h-screen w-screen bg-[#0a0a0f] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-[#1f1f2e] flex items-center justify-between px-6 bg-[#0a0a0f] flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Home
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{currentProject?.name ?? project.name}</h1>
            <p className="text-xs text-gray-500">{project.files.length} files</p>
          </div>
        </div>
        <AutoSaveIndicator />
      </header>

      {/* Editor: file tree | code | preview */}
      <div className="flex-1 min-h-0">
        <Split
          className="flex h-full"
          sizes={[25, 45, 30]}
          minSize={150}
          gutterSize={6}
          direction="horizontal"
          cursor="col-resize"
        >
          <div className="h-full overflow-auto">
            <FileExplorer />
          </div>
          <div className="h-full overflow-auto">
            <CodeEditor />
          </div>
          <div className="h-full overflow-auto">
            <PreviewPanel />
          </div>
        </Split>
      </div>
    </main>
  )
}
