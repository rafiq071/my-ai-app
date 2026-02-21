'use client'

import { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import { useStore } from '@/lib/store'

export default function CodeEditor() {
  const { currentProject, selectedFile, updateFileContent } = useStore()
  const [currentFile, setCurrentFile] = useState<{ path: string; content: string } | null>(null)

  useEffect(() => {
    if (!currentProject || !selectedFile) {
      setCurrentFile(null)
      return
    }

    // Find the selected file in the project
    const findFile = (files: any[]): any => {
      for (const file of files) {
        if (file.path === selectedFile) return file
        if (file.children) {
          const found = findFile(file.children)
          if (found) return found
        }
      }
      return null
    }

    const file = findFile(currentProject.files)
    if (file) {
      setCurrentFile({ path: file.path, content: file.content })
    }
  }, [selectedFile, currentProject])

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && currentFile) {
      updateFileContent(currentFile.path, value)
    }
  }

  const getLanguage = (path: string) => {
    const ext = path.split('.').pop()
    const langMap: Record<string, string> = {
      tsx: 'typescript',
      ts: 'typescript',
      jsx: 'javascript',
      js: 'javascript',
      json: 'json',
      css: 'css',
      html: 'html',
      md: 'markdown',
    }
    return langMap[ext || ''] || 'typescript'
  }

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0f] text-gray-400">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-lg">No project loaded</p>
          <p className="text-sm mt-2">Start by creating a project in the chat</p>
        </div>
      </div>
    )
  }

  if (!currentFile) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0f] text-gray-400">
        <div className="text-center">
          <div className="text-6xl mb-4">👈</div>
          <p className="text-lg">Select a file to edit</p>
          <p className="text-sm mt-2">Choose from the file explorer</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      {/* File header */}
      <div className="px-4 py-3 border-b border-[#1f1f2e] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">📄</span>
          <span className="text-sm font-medium text-white">{currentFile.path}</span>
        </div>
        <div className="text-xs text-gray-500">
          {currentFile.content.split('\n').length} lines
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage={getLanguage(currentFile.path)}
          language={getLanguage(currentFile.path)}
          value={currentFile.content}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            fontFamily: 'JetBrains Mono, monospace',
            lineNumbers: 'on',
            rulers: [80, 120],
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            tabSize: 2,
            bracketPairColorization: {
              enabled: true,
            },
          }}
        />
      </div>
    </div>
  )
}
