'use client'

import { useState, useRef, useEffect } from 'react'
import { useStore } from '@/lib/store'
import TemplateBrowser from './TemplateBrowser'

export default function ChatPanel() {
  const [input, setInput] = useState('')
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
    if (!input.trim() || isGenerating) return

    const userMessage = input.trim()
    setInput('')
    addMessage({ role: 'user', content: userMessage })
    setIsGenerating(true)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage }),
      })

      const contentType = response.headers.get('content-type') ?? ''
      const rawText = await response.text()

      console.log('[GEN /api/generate]', {
        status: response.status,
        contentType,
        bodyPreview: rawText.slice(0, 300),
      })

      let data: any = null
      try {
        data = JSON.parse(rawText)
      } catch {}

      if (!response.ok) {
        const msg = data?.message || data?.error || rawText.slice(0, 120) || 'Failed'
        addMessage({
          role: 'assistant',
          content: `❌ Generate failed (${response.status}): ${msg}`,
        })
        return
      }

      if (data?.success && data?.project) {
        setCurrentProject(data.project)

        const modelInfo = data.modelInfo
          ? `\n\n🤖 Model: ${data.modelInfo.model}\n📝 ${data.modelInfo.reason}\n💰 Cost: ${data.modelInfo.actualCost}`
          : ''

        addMessage({
          role: 'assistant',
          content: `✨ Created project: **${data.project.name}**\n\nGenerated ${data.project.files.length} files. Check the editor to see your application!${modelInfo}`,
        })
      }
    } catch (error) {
      addMessage({
        role: 'assistant',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Failed to generate project'}`,
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] border-r border-[#1f1f2e]">
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
                onClick={() => setInput('Build a modern todo app with dark mode')}
                className="w-full text-left px-4 py-2 bg-[#1f1f2e] hover:bg-[#2a2a3e] rounded-lg text-sm text-gray-300 transition-colors"
              >
                💡 Todo app with dark mode
              </button>
              <button
                onClick={() => setInput('Create a weather dashboard with charts')}
                className="w-full text-left px-4 py-2 bg-[#1f1f2e] hover:bg-[#2a2a3e] rounded-lg text-sm text-gray-300 transition-colors"
              >
                🌤️ Weather dashboard
              </button>
              <button
                onClick={() => setInput('Make a landing page for a SaaS product')}
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
              <div className="flex justify-start">
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
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#1f1f2e]">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your app..."
            disabled={isGenerating}
            className="flex-1 bg-[#1f1f2e] border border-[#2a2a3e] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6366f1] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="px-6 py-2 bg-[#6366f1] hover:bg-[#5558e3] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
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
