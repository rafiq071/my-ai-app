'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { isValidGeneratedProject, normalizeGeneratedProject } from '@/lib/project-schema'
import { parseAIResponse } from '@/lib/ai/parseAIResponse'
import { upsertLocalProject } from '@/lib/local-projects'
import TemplateBrowser from './TemplateBrowser'

export default function ChatPanel() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [streamingOutput, setStreamingOutput] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, addMessage, isGenerating, setIsGenerating, setCurrentProject } = useStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isGenerating) return

    const userPrompt = prompt.trim()
    setPrompt('')
    setError(null)
    addMessage({ role: 'user', content: userPrompt })
    setIsGenerating(true)

    setStreamingOutput('')
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt, stream: true }),
      })

      const contentType = response.headers.get('content-type') || ''

      if (!response.ok) {
        const text = await response.text()
        try {
          const data = JSON.parse(text)
          setError(data?.message || data?.error || `Generate failed (${response.status})`)
        } catch {
          setError(`Generate failed (${response.status})`)
        }
        return
      }

      if (contentType.includes('text/plain') && response.body) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullText = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          fullText += chunk
          setStreamingOutput(fullText)
        }
        const parseResult = parseAIResponse(fullText)
        if (!parseResult.ok) {
          setError('AI generation failed. Retrying...')
          return
        }
        const parsed = parseResult.data
        if (!isValidGeneratedProject(parsed)) {
          setError('AI generation failed. Retrying...')
          return
        }
        const normalized = normalizeGeneratedProject(parsed)
        const projectId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()
        const project = {
          id: projectId,
          name: normalized.name,
          description: normalized.description ?? '',
          files: normalized.files,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        await fetch(`/api/project/${projectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: project.name,
            description: project.description,
            files: project.files,
          }),
        }).catch(() => {})

        upsertLocalProject(project)
        setError(null)
        setCurrentProject(project)
        router.push(`/editor/${projectId}`)
        return
      }

      const text = await response.text()
      let data: { success?: boolean; project?: { id: string }; message?: string }
      const parseResult = parseAIResponse(text)
      if (!parseResult.ok) {
        setError('AI generation failed. Retrying...')
        return
      }
      data = parseResult.data as typeof data
      if (data?.success && data?.project) {
        setError(null)
        setCurrentProject(data.project)
        router.push(`/editor/${data.project.id}`)
      } else {
        setError(typeof (data as any)?.message === 'string' ? (data as any).message : 'Generate failed')
      }
    } catch (error) {
      console.error("Generate failed:", error);
      setError("Generate failed (exception)");
      addMessage({
        role: 'assistant',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Failed to generate project'}`,
      })
    } finally {
      setIsGenerating(false)
      setStreamingOutput('')
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#0a0a0f] border-r border-[#1f1f2e]">
      {/* Header */}
      <div className="p-4 border-b border-[#1f1f2e] flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="text-2xl">💬</span>
            Chat with AI
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Describe your app and I'll build it
          </p>
        </div>
        <button
          onClick={() => setShowTemplates(true)}
          className="px-3 py-1.5 text-xs bg-[#1f1f2e] hover:bg-[#2a2a3e] border border-[#2a2a3e] text-white rounded transition-colors flex items-center gap-2"
        >
          <span>📋</span>
          Templates
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Let's build something amazing
            </h3>
            <p className="text-gray-400 max-w-sm">
              Describe your application in natural language, and I'll generate a complete, working project for you.
            </p>
            <div className="mt-6 space-y-2 text-left w-full max-w-sm">
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                Try examples:
              </div>
              <button
                onClick={() => setPrompt('Build a modern todo app with dark mode')}
                className="w-full text-left px-4 py-2 bg-[#1f1f2e] hover:bg-[#2a2a3e] rounded-lg text-sm text-gray-300 transition-colors"
              >
                💡 Todo app with dark mode
              </button>
              <button
                onClick={() => setPrompt('Create a weather dashboard with charts')}
                className="w-full text-left px-4 py-2 bg-[#1f1f2e] hover:bg-[#2a2a3e] rounded-lg text-sm text-gray-300 transition-colors"
              >
                🌤️ Weather dashboard
              </button>
              <button
                onClick={() => setPrompt('Make a landing page for a SaaS product')}
                className="w-full text-left px-4 py-2 bg-[#1f1f2e] hover:bg-[#2a2a3e] rounded-lg text-sm text-gray-300 transition-colors"
              >
                🎨 SaaS landing page
              </button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-[#6366f1] text-white'
                      : 'bg-[#1f1f2e] text-gray-200'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </div>
                  <div className="text-xs mt-1 opacity-60">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="flex justify-start flex-col gap-2">
                <div className="bg-[#1f1f2e] text-gray-200 rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-[#6366f1] rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-[#6366f1] rounded-full animate-pulse delay-100"></div>
                      <div className="w-2 h-2 bg-[#6366f1] rounded-full animate-pulse delay-200"></div>
                    </div>
                    <span className="text-sm">Generating your project...</span>
                  </div>
                </div>
                {streamingOutput && (
                  <pre className="text-xs text-gray-500 bg-[#1f1f2e] rounded-lg p-3 max-h-32 overflow-auto whitespace-pre-wrap break-all">
                    {streamingOutput.slice(-2000)}
                  </pre>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#1f1f2e] flex-shrink-0">
        {error && (
          <div className="mb-2 text-sm text-red-300">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your app..."
            disabled={isGenerating}
            className="flex-1 min-w-0 bg-[#1f1f2e] border border-[#2a2a3e] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6366f1] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className="px-6 py-2 bg-[#6366f1] hover:bg-[#5558e3] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex-shrink-0"
          >
            {isGenerating ? '⏳' : '🚀'}
          </button>
        </form>
      </div>

      {/* Template Browser Modal */}
      {showTemplates && <TemplateBrowser onClose={() => setShowTemplates(false)} />}
    </div>
  )
}
