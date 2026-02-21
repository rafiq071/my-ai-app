'use client'

import { useState } from 'react'
import { useStore, FileNode } from '@/lib/store'

export default function FileExplorer() {
  const { currentProject, selectedFile, setSelectedFile } = useStore()
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']))

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const getFileIcon = (file: FileNode) => {
    if (file.type === 'directory') {
      return expandedFolders.has(file.path) ? '📂' : '📁'
    }
    
    const ext = file.name.split('.').pop()
    const iconMap: Record<string, string> = {
      tsx: '⚛️',
      ts: '🔷',
      jsx: '⚛️',
      js: '📜',
      json: '📋',
      css: '🎨',
      html: '🌐',
      md: '📝',
    }
    return iconMap[ext || ''] || '📄'
  }

  const renderFileTree = (files: FileNode[], level = 0) => {
    return files.map((file) => {
      const isExpanded = expandedFolders.has(file.path)
      const isSelected = selectedFile === file.path
      const hasChildren = file.children && file.children.length > 0

      return (
        <div key={file.path}>
          <div
            className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-[#1f1f2e] transition-colors ${
              isSelected ? 'bg-[#2a2a3e] text-white' : 'text-gray-300'
            }`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => {
              if (file.type === 'directory') {
                toggleFolder(file.path)
              } else {
                setSelectedFile(file.path)
              }
            }}
          >
            <span className="text-sm">{getFileIcon(file)}</span>
            <span className="text-sm flex-1 truncate">{file.name}</span>
            {file.type === 'directory' && hasChildren && (
              <span className="text-xs text-gray-500">
                {isExpanded ? '▼' : '▶'}
              </span>
            )}
          </div>
          {file.type === 'directory' && isExpanded && file.children && (
            <div>{renderFileTree(file.children, level + 1)}</div>
          )}
        </div>
      )
    })
  }

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0f] border-r border-[#1f1f2e]">
        <div className="text-center px-4">
          <div className="text-4xl mb-2">📁</div>
          <p className="text-sm text-gray-500">No files yet</p>
        </div>
      </div>
    )
  }

  // Group files by directory for better organization
  const organizedFiles = currentProject.files.reduce((acc, file) => {
    const parts = file.path.split('/')
    let current = acc

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1
      const path = parts.slice(0, index + 1).join('/')
      
      let existing = current.find((n: FileNode) => n.path === path)
      
      if (!existing) {
        const newNode: FileNode = {
          name: part,
          path,
          content: isLast ? file.content : '',
          type: isLast ? 'file' : 'directory',
          children: isLast ? undefined : [],
        }
        current.push(newNode)
        existing = newNode
      }
      
      if (!isLast && existing.children) {
        current = existing.children
      }
    })

    return acc
  }, [] as FileNode[])

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f] border-r border-[#1f1f2e]">
      {/* Header */}
      <div className="p-4 border-b border-[#1f1f2e]">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <span>📁</span>
          {currentProject.name}
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          {currentProject.files.length} files
        </p>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {organizedFiles.length > 0 ? (
          renderFileTree(organizedFiles)
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            No files in project
          </div>
        )}
      </div>
    </div>
  )
}
