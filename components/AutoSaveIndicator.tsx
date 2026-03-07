'use client'

import { useState, useEffect } from 'react'
import { useAutoSave, formatTimeAgo } from '@/lib/useAutoSave'

export default function AutoSaveIndicator() {
  const [enabled, setEnabled] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  const autoSave = useAutoSave({
    enabled,
    debounceMs: 1000, // 1 second — safe for overlapping PUTs
    onSuccess: () => {
      console.log('✅ Auto-saved successfully')
    },
    onError: (error) => {
      console.error('❌ Auto-save failed:', error)
    },
  })

  // Update time ago every second
  const [timeAgo, setTimeAgo] = useState('')
  useEffect(() => {
    const updateTime = () => {
      setTimeAgo(formatTimeAgo(autoSave.lastSaved))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [autoSave.lastSaved])

  return (
    <div className="flex items-center gap-3 text-xs">
      {/* Status */}
      <div className="flex items-center gap-2">
        {autoSave.isSaving && (
          <div className="flex items-center gap-2 text-blue-400">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>Saving...</span>
          </div>
        )}

        {!autoSave.isSaving && autoSave.hasUnsavedChanges && (
          <div className="flex items-center gap-2 text-yellow-400">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <span>Unsaved changes</span>
          </div>
        )}

        {!autoSave.isSaving && !autoSave.hasUnsavedChanges && autoSave.lastSaved && (
          <div className="flex items-center gap-2 text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Saved {timeAgo}</span>
          </div>
        )}

        {!autoSave.isSaving && !autoSave.hasUnsavedChanges && !autoSave.lastSaved && (
          <div className="flex items-center gap-2 text-gray-500">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <span>No changes</span>
          </div>
        )}

        {autoSave.error && (
          <div className="flex items-center gap-2 text-red-400">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            <span>Save failed</span>
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="relative">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-1 hover:bg-[#1f1f2e] rounded transition-colors"
          title="Auto-save settings"
        >
          <span className="text-gray-400">⚙️</span>
        </button>

        {showSettings && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowSettings(false)}
            />
            <div className="absolute right-0 top-8 w-64 bg-[#1f1f2e] border border-[#2a2a3e] rounded-lg shadow-xl z-20 p-3">
              <h3 className="text-sm font-semibold text-white mb-3">
                Auto-Save Settings
              </h3>

              <label className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-300">Enable auto-save</span>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="w-4 h-4"
                />
              </label>

              <div className="text-xs text-gray-500 mb-3">
                {enabled
                  ? 'Changes are saved automatically after 2 seconds'
                  : 'Auto-save is disabled. Use manual save button.'}
              </div>

              {autoSave.lastSaved && (
                <div className="text-xs text-gray-500 border-t border-[#2a2a3e] pt-3">
                  Last saved: {autoSave.lastSaved.toLocaleString()}
                </div>
              )}

              {autoSave.error && (
                <div className="text-xs text-red-400 border-t border-[#2a2a3e] pt-3">
                  Error: {autoSave.error.message}
                </div>
              )}

              <button
                onClick={async () => {
                  await autoSave.forceSave?.()
                  setShowSettings(false)
                }}
                disabled={autoSave.isSaving || !autoSave.hasUnsavedChanges}
                className="w-full mt-3 px-3 py-2 bg-[#6366f1] hover:bg-[#5558e3] disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
              >
                {autoSave.isSaving ? 'Saving...' : 'Save Now'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
