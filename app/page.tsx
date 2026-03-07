'use client'

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
  return (
    <main className="h-screen w-screen bg-[#0a0a0f] flex flex-col">
      
      {/* HEADER */}
      <header className="h-14 border-b border-[#1f1f2e] flex items-center justify-between px-6 bg-[#0a0a0f] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🚀</div>
          <div>
            <h1 className="text-xl font-bold text-white">
              Lovable Clone
            </h1>
            <p className="text-xs text-gray-500">
              AI Builder + Deploy + Auth
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <AutoSaveIndicator />
          <UserProfile />
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 min-h-0">
        <Split
          className="flex h-full"
          sizes={[20, 30, 50]}
          minSize={200}
          gutterSize={6}
          direction="horizontal"
          cursor="col-resize"
        >
          {/* LEFT */}
          <div className="h-full overflow-auto">
            <ProjectsList />
          </div>

          {/* CENTER - CHAT */}
          <div className="h-full overflow-auto">
            <ChatPanel />
          </div>

          {/* RIGHT */}
          <div className="h-full overflow-hidden flex flex-col">
            
            <Split
              className="flex flex-1"
              direction="horizontal"
              sizes={[25, 40, 35]}
              minSize={150}
              gutterSize={6}
              cursor="col-resize"
            >
              <div className="overflow-auto">
                <FileExplorer />
              </div>

              <div className="overflow-auto">
                <CodeEditor />
              </div>

              <div className="overflow-auto">
                <PreviewPanel />
              </div>
            </Split>

            <div className="h-64 border-t border-[#1f1f2e] overflow-auto">
              <DeploymentPanel />
            </div>
          </div>
        </Split>
      </div>
    </main>
  )
}