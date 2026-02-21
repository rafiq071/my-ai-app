'use client'

import { useState, useRef } from 'react'
import { useStore } from '@/lib/store'
import { importProject, importFromDirectory } from '@/lib/import'

interface ImportDialogProps {
  onClose: () => void
}

export default function ImportDialog({ onClose }: ImportDialogProps) {
  const { setCurrentProject, addMessage } = useStore()
  const [isImporting, setIsImporting] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImport = async (file: File) => {
    if (!file.name.endsWith('.zip')) {
      alert('Please upload a ZIP file')
      return
    }

    setIsImporting(true)

    try {
      const result = await importProject(file)

      // Create project from imported files
      const project = {
        id: Date.now().toString(),
        name: result.name,
        description: result.description || 'Imported project',
        files: result.files,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      setCurrentProject(project)

      // Show message
      let message = `✅ Imported project: ${result.name}\n\n${result.files.length} files loaded`
      
      if (result.errors.length > 0) {
        message += `\n\n⚠️ Warnings:\n${result.errors.join('\n')}`
      }

      addMessage({
        role: 'assistant',
        content: message,
      })

      onClose()
    } catch (error) {
      console.error('Import failed:', error)
      alert('Failed to import project: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsImporting(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImport(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleImport(file)
    }
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDirectoryImport = async () => {
    try {
      const result = await importFromDirectory()
      
      if (!result) {
        // User cancelled
        return
      }

      // Create project from imported files
      const project = {
        id: Date.now().toString(),
        name: result.name,
        description: result.description || 'Imported from directory',
        files: result.files,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      setCurrentProject(project)

      // Show message
      let message = `✅ Imported project: ${result.name}\n\n${result.files.length} files loaded from directory`
      
      if (result.errors.length > 0) {
        message += `\n\n⚠️ Warnings:\n${result.errors.join('\n')}`
      }

      addMessage({
        role: 'assistant',
        content: message,
      })

      onClose()
    } catch (error) {
      if (error instanceof Error && error.message.includes('not supported')) {
        alert('Directory import is only supported in Chrome and Edge browsers. Please use ZIP upload instead.')
      } else {
        console.error('Directory import failed:', error)
        alert('Failed to import directory: ' + (error instanceof Error ? error.message : 'Unknown error'))
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0f] border border-[#1f1f2e] rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📥</span>
            Import Project
          </h2>
          <button
            onClick={onClose}
            disabled={isImporting}
            className="p-1 hover:bg-[#1f1f2e] rounded transition-colors disabled:opacity-50"
          >
            <span className="text-gray-400 text-2xl">×</span>
          </button>
        </div>

        {/* Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`mb-6 p-8 border-2 border-dashed rounded-lg transition-all ${
            dragActive
              ? 'border-[#6366f1] bg-[#6366f1] bg-opacity-10'
              : 'border-[#2a2a3e] hover:border-[#6366f1] hover:bg-[#1f1f2e]'
          } ${isImporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onClick={() => !isImporting && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={handleFileSelect}
            disabled={isImporting}
            className="hidden"
          />

          <div className="text-center">
            {isImporting ? (
              <>
                <div className="text-4xl mb-3 animate-pulse">📦</div>
                <div className="text-white font-medium mb-2">Importing...</div>
                <div className="text-sm text-gray-400">
                  Please wait while we extract your project
                </div>
              </>
            ) : (
              <>
                <div className="text-4xl mb-3">📦</div>
                <div className="text-white font-medium mb-2">
                  Drop ZIP file here
                </div>
                <div className="text-sm text-gray-400 mb-3">
                  or click to browse
                </div>
                <div className="text-xs text-gray-500">
                  Supports Next.js projects exported as ZIP
                </div>
              </>
            )}
          </div>
        </div>

        {/* Directory Import (Chrome/Edge only) */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2a2a3e]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-[#0a0a0f] text-gray-500">OR</span>
            </div>
          </div>

          <button
            onClick={handleDirectoryImport}
            disabled={isImporting}
            className="w-full mt-4 px-4 py-3 bg-[#1f1f2e] hover:bg-[#2a2a3e] disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>📁</span>
            <span>Import from Folder</span>
            <span className="text-xs text-gray-500">(Chrome/Edge)</span>
          </button>
        </div>

        {/* Info */}
        <div className="p-3 bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-20 rounded-lg">
          <div className="text-xs text-blue-400 space-y-1">
            <div className="font-semibold mb-2">💡 Supported formats:</div>
            <div>• ZIP files with Next.js projects</div>
            <div>• Folders (Chrome/Edge only)</div>
            <div>• Projects exported from this app</div>
          </div>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          disabled={isImporting}
          className="w-full mt-4 px-4 py-2 bg-[#1f1f2e] hover:bg-[#2a2a3e] disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
