'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { exportProject, downloadZip } from '@/lib/export'

interface ExportDialogProps {
  onClose: () => void
}

export default function ExportDialog({ onClose }: ExportDialogProps) {
  const { currentProject } = useStore()
  const [isExporting, setIsExporting] = useState(false)
  const [includeReadme, setIncludeReadme] = useState(true)
  const [includeGitignore, setIncludeGitignore] = useState(true)

  if (!currentProject) {
    return null
  }

  const handleExport = async () => {
    setIsExporting(true)

    try {
      const blob = await exportProject(
        currentProject.name,
        currentProject.files,
        {
          includeReadme,
          includeGitignore,
        }
      )

      downloadZip(blob, currentProject.name)
      
      // Show success briefly then close
      setTimeout(() => {
        onClose()
      }, 500)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export project: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0f] border border-[#1f1f2e] rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📦</span>
            Export Project
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#1f1f2e] rounded transition-colors"
          >
            <span className="text-gray-400 text-2xl">×</span>
          </button>
        </div>

        {/* Project Info */}
        <div className="mb-6 p-4 bg-[#1f1f2e] rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Project:</div>
          <div className="text-white font-semibold">{currentProject.name}</div>
          <div className="text-xs text-gray-500 mt-2">
            {currentProject.files.length} files
          </div>
        </div>

        {/* Options */}
        <div className="mb-6 space-y-3">
          <h3 className="text-sm font-semibold text-white mb-3">
            Include:
          </h3>

          <label className="flex items-center justify-between p-3 bg-[#1f1f2e] rounded-lg cursor-pointer hover:bg-[#2a2a3e] transition-colors">
            <div>
              <div className="text-sm text-white">README.md</div>
              <div className="text-xs text-gray-500">Setup instructions</div>
            </div>
            <input
              type="checkbox"
              checked={includeReadme}
              onChange={(e) => setIncludeReadme(e.target.checked)}
              className="w-4 h-4"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-[#1f1f2e] rounded-lg cursor-pointer hover:bg-[#2a2a3e] transition-colors">
            <div>
              <div className="text-sm text-white">.gitignore</div>
              <div className="text-xs text-gray-500">Git ignore rules</div>
            </div>
            <input
              type="checkbox"
              checked={includeGitignore}
              onChange={(e) => setIncludeGitignore(e.target.checked)}
              className="w-4 h-4"
            />
          </label>

          <div className="p-3 bg-[#1f1f2e] rounded-lg">
            <div className="text-xs text-gray-400">
              ✅ package.json, tsconfig.json, tailwind.config.js
              <br />
              ✅ All project files
              <br />
              ❌ node_modules (excluded)
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-[#1f1f2e] hover:bg-[#2a2a3e] text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 px-4 py-2 bg-[#6366f1] hover:bg-[#5558e3] disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
          >
            {isExporting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Exporting...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>⬇</span>
                Download ZIP
              </span>
            )}
          </button>
        </div>

        {/* Info */}
        <div className="mt-4 p-3 bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-20 rounded-lg">
          <div className="text-xs text-blue-400">
            💡 The ZIP file will contain all your code ready to run with npm install && npm run dev
          </div>
        </div>
      </div>
    </div>
  )
}
