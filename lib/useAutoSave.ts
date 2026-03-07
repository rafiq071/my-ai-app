'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from '@/lib/store'
import { upsertLocalProject } from '@/lib/local-projects'

export function formatTimeAgo(date: Date | null | undefined): string {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  const now = Date.now()
  const diffMs = now - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)

  if (diffSec < 5) return 'just now'
  if (diffSec < 60) return `${diffSec}s ago`
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  return d.toLocaleDateString()
}

const STORAGE_KEY = 'lovable-clone-autosave'

export interface UseAutoSaveOptions {
  enabled: boolean
  debounceMs: number
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export interface UseAutoSaveReturn {
  isSaving: boolean
  hasUnsavedChanges: boolean
  lastSaved: Date | null
  error: Error | null
  forceSave?: () => Promise<void>
}

export function useAutoSave(options: UseAutoSaveOptions): UseAutoSaveReturn {
  const { enabled, debounceMs, onSuccess, onError } = options
  const currentProject = useStore((s) => s.currentProject)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const lastSavedRef = useRef<Date | null>(null)
  const lastSyncedUpdatedAt = useRef<number>(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasUnsavedChanges =
    !!currentProject &&
    new Date(currentProject.updatedAt).getTime() !== lastSyncedUpdatedAt.current

  const performSave = useCallback(async () => {
    if (!currentProject) return
    setIsSaving(true)
    setError(null)
    const payload = {
      name: currentProject.name,
      description: currentProject.description,
      files: currentProject.files,
    }
    try {
      const res = await fetch(`/api/project/${currentProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              id: currentProject.id,
              ...payload,
              updatedAt: new Date(currentProject.updatedAt).toISOString(),
            })
          )
          upsertLocalProject(currentProject)
        }
        const now = new Date()
        lastSavedRef.current = now
        lastSyncedUpdatedAt.current = new Date(currentProject.updatedAt).getTime()
        setLastSaved(now)
        onSuccess?.()
      } else if (res.status === 401) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              id: currentProject.id,
              ...payload,
              updatedAt: new Date(currentProject.updatedAt).toISOString(),
            })
          )
          upsertLocalProject(currentProject)
        }
        const now = new Date()
        lastSavedRef.current = now
        lastSyncedUpdatedAt.current = new Date(currentProject.updatedAt).getTime()
        setLastSaved(now)
        onSuccess?.()
      } else {
        throw new Error(`Save failed: ${res.status}`)
      }
    } catch (e) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            id: currentProject.id,
            ...payload,
            updatedAt: new Date(currentProject.updatedAt).toISOString(),
          })
        )
        upsertLocalProject(currentProject)
      }
      const now = new Date()
      lastSavedRef.current = now
      lastSyncedUpdatedAt.current = new Date(currentProject.updatedAt).getTime()
      setLastSaved(now)
      onSuccess?.()
      const err = e instanceof Error ? e : new Error(String(e))
      setError(err)
      onError?.(err)
    } finally {
      setIsSaving(false)
    }
  }, [currentProject, onSuccess, onError])

  const forceSave = useCallback(async () => {
    await performSave()
  }, [performSave])

  useEffect(() => {
    if (!enabled || !currentProject || !hasUnsavedChanges) return

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null
      performSave()
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [enabled, currentProject, hasUnsavedChanges, debounceMs, performSave])

  // Initialize lastSaved from storage for current project
  useEffect(() => {
    if (!currentProject || typeof localStorage === 'undefined') return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.id === currentProject.id && parsed?.updatedAt) {
          const t = new Date(parsed.updatedAt)
          if (!isNaN(t.getTime())) {
            lastSavedRef.current = t
            lastSyncedUpdatedAt.current = t.getTime()
            setLastSaved(t)
          }
        }
      }
    } catch {
      // ignore
    }
  }, [currentProject?.id])

  return {
    isSaving,
    hasUnsavedChanges,
    lastSaved,
    error,
    forceSave,
  }
}
