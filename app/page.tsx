'use client'

import { useEffect, useState } from 'react'
import Split from 'react-split'
import ProjectsList from '@/components/ProjectsList'
import ChatPanel from '@/components/ChatPanel'
import FileExplorer from '@/components/FileExplorer'
import CodeEditor from '@/components/CodeEditor'
import PreviewPanel from '@/components/PreviewPanel'
import DeploymentPanel from '@/components/DeploymentPanel'
import UserProfile from '@/components/UserProfile'
import AutoSaveIndicator from '@/components/AutoSaveIndicator'

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🚀</div>
          <p className="text-white text-xl">Loading Lovable Clone...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#0a0a0f]">
      {/* Header */}
      <header className="h-14 border-b border-[#1f1f2e] flex items-center justify-between px-6 bg-[#0a0a0f]">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🚀</div>
          <div>
            <h1 className="text-xl font-bold text-white glow-text">
              Lovable Clone
            </h1>
            <p className="text-xs text-gray-500">AI Builder + Deploy + Auth</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>All Systems Ready</span>
          </div>
          <AutoSaveIndicator />
          <UserProfile />
        </div>
      </header>

      {/* Main content area */}
      <div className="h-[calc(100vh-3.5rem)] flex flex-col">
        {/* Top section */}
        <div className="flex-1">
          <Split
            className="split flex h-full"
            sizes={[15, 20, 65]}
            minSize={150}
            gutterSize={2}
            gutterAlign="center"
            snapOffset={30}
            dragInterval={1}
            direction="horizontal"
            cursor="col-resize"
          >
            {/* Projects list */}
            <div className="h-full overflow-hidden">
              <ProjectsList />
            </div>

            {/* Chat panel */}
            <div className="h-full overflow-hidden">
              <ChatPanel />
            </div>

            {/* Right section: File Explorer, Editor, Preview */}
            <div className="h-full overflow-hidden">
              <Split
                className="split flex h-full"
                sizes={[20, 40, 40]}
                minSize={150}
                gutterSize={2}
                gutterAlign="center"
                snapOffset={30}
                dragInterval={1}
                direction="horizontal"
                cursor="col-resize"
              >
                {/* File Explorer */}
                <div className="h-full overflow-hidden">
                  <FileExplorer />
                </div>

                {/* Code Editor */}
                <div className="h-full overflow-hidden">
                  <CodeEditor />
                </div>

                {/* Preview */}
                <div className="h-full overflow-hidden">
                  <PreviewPanel />
                </div>
              </Split>
            </div>
          </Split>
        </div>

        {/* Bottom deployment panel */}
        <div className="h-64 border-t border-[#1f1f2e]">
          <DeploymentPanel />
        </div>
      </div>
    </main>
  )
}
