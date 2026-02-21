'use client'

import { useEffect, useState, useRef } from 'react'
import { useStore } from '@/lib/store'
import { bundleProject } from '@/lib/bundler'
import { scanGeneratedFiles } from '@/lib/security/scan'

export default function PreviewPanel() {
  const { currentProject } = useStore()
  const [isBuilding, setIsBuilding] = useState(false)
  const [buildError, setBuildError] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!currentProject) {
      return
    }

    buildAndRender()
  }, [currentProject])

  const buildAndRender = async () => {
    if (!currentProject) return

    setIsBuilding(true)
    setBuildError(null)

    try {
      // Security scan (public beta)
      const scan = scanGeneratedFiles(currentProject.files as any)
      if (!scan.ok) {
        setBuildError(
          `Preview blocked by security policy. First issue: ${scan.issues[0]?.filePath} (${scan.issues[0]?.ruleId})`
        )
        setIsBuilding(false)
        return
      }

      // Bundle the project
      const result = await bundleProject(currentProject.files)

      if (result.error) {
        setBuildError(result.error)
        setIsBuilding(false)
        return
      }

      // Create HTML document with bundled code
      const html = createPreviewHTML(result.code, currentProject.name)

      // Inject into iframe
      if (iframeRef.current) {
        const iframeDoc = iframeRef.current.contentDocument
        if (iframeDoc) {
          iframeDoc.open()
          iframeDoc.write(html)
          iframeDoc.close()
        }
      }

      setIsBuilding(false)
    } catch (error) {
      console.error('Build error:', error)
      setBuildError(error instanceof Error ? error.message : 'Unknown error')
      setIsBuilding(false)
    }
  }

  const createPreviewHTML = (bundledCode: string, projectName: string): string => {
    // Restrictive CSP for preview sandbox.
    // Note: Babel requires 'unsafe-eval' here. This is acceptable for public-beta preview only.
    const csp = [
      "default-src 'none'",
      "base-uri 'none'",
      "form-action 'none'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "connect-src 'none'",
      "img-src data: https:",
      "style-src 'unsafe-inline' https://cdn.tailwindcss.com",
      "script-src 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com",
      "font-src https:",
    ].join('; ')

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <title>${projectName}</title>
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- React 18 from CDN -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  
  <!-- Babel Standalone for JSX transformation -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    #root {
      width: 100%;
      min-height: 100vh;
    }
    
    /* Error display */
    .preview-error {
      padding: 2rem;
      background: #fee;
      border: 2px solid #f00;
      border-radius: 8px;
      margin: 2rem;
    }
    
    .preview-error h2 {
      color: #c00;
      margin-bottom: 1rem;
    }
    
    .preview-error pre {
      background: #fff;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  
  <!-- Error boundary -->
  <script>
    window.addEventListener('error', function(e) {
      console.error('Runtime error:', e.error);
      const root = document.getElementById('root');
      if (root && !root.innerHTML) {
        root.innerHTML = \`
          <div class="preview-error">
            <h2>⚠️ Runtime Error</h2>
            <pre>\${e.error ? e.error.stack : e.message}</pre>
          </div>
        \`;
      }
    });
    
    window.addEventListener('unhandledrejection', function(e) {
      console.error('Unhandled promise rejection:', e.reason);
    });
  </script>
  
  <!-- Bundled application code -->
  <script>
    try {
      ${bundledCode}
    } catch (error) {
      console.error('Bundle execution error:', error);
      document.getElementById('root').innerHTML = \`
        <div class="preview-error">
          <h2>⚠️ Build Error</h2>
          <pre>\${error.stack || error.message}</pre>
        </div>
      \`;
    }
  </script>
</body>
</html>`
  }

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <div className="text-6xl mb-4">👁️</div>
          <p className="text-lg text-gray-300">No preview available</p>
          <p className="text-sm text-gray-500 mt-2">Generate a project to see live preview</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1f1f2e] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">👁️</span>
          <span className="text-sm font-medium text-white">Live Preview</span>
          {isBuilding && (
            <span className="text-xs text-yellow-400 flex items-center gap-1">
              <span className="animate-pulse">⚡</span>
              Building...
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {buildError ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-xs text-red-400">Build failed</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">Live</span>
            </div>
          )}
          <button
            onClick={buildAndRender}
            disabled={isBuilding}
            className="px-3 py-1 text-xs bg-[#1f1f2e] hover:bg-[#2a2a3e] text-white rounded transition-colors disabled:opacity-50"
          >
            🔄 Rebuild
          </button>
        </div>
      </div>

      {/* Error Display */}
      {buildError && (
        <div className="px-4 py-3 bg-red-900 bg-opacity-20 border-b border-red-900">
          <div className="text-sm text-red-400">
            <strong>Build Error:</strong> {buildError}
          </div>
        </div>
      )}

      {/* Preview iframe */}
      <div className="flex-1 bg-white relative">
        {isBuilding && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div className="bg-[#1f1f2e] px-6 py-4 rounded-lg shadow-xl">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span className="text-white">Building your app...</span>
              </div>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-forms"
          title="Preview"
        />
      </div>
    </div>
  )
}
