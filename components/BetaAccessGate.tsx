'use client'

import { useEffect, useState } from 'react'

export default function BetaAccessGate() {
  const [checking, setChecking] = useState(true)
  const [needsInvite, setNeedsInvite] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  const check = async () => {
    setChecking(true)
    setError(null)
    try {
      const res = await fetch('/api/invite/status', { cache: 'no-store' })
      const data = await res.json()
      setNeedsInvite(!data.ok)
      setOk(!!data.ok)
    } catch {
      // If status fails, fail closed
      setNeedsInvite(true)
      setOk(false)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    check()
  }, [])

  const redeem = async () => {
    setError(null)
    const c = code.trim()
    if (!c) {
      setError('Enter an invite code')
      return
    }
    try {
      const res = await fetch('/api/invite/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: c }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Invalid invite code')
        return
      }
      await check()
    } catch {
      setError('Failed to redeem code')
    }
  }

  if (checking) return null
  if (ok || !needsInvite) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-[#1f1f2e] bg-[#0a0a0f] p-6 shadow-2xl">
        <h2 className="text-xl font-semibold text-white">Invite required</h2>
        <p className="mt-2 text-sm text-gray-400">
          This public beta is invite-only. Enter your invite code to continue.
        </p>

        <div className="mt-4">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="XXXX-XXXX-XXXX"
            className="w-full rounded-lg border border-[#1f1f2e] bg-[#12121a] px-3 py-2 text-white placeholder:text-gray-600"
          />
          {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={redeem}
            className="rounded-lg bg-[#2a2a3e] px-4 py-2 text-sm font-medium text-white hover:bg-[#3a3a55]"
          >
            Redeem
          </button>
        </div>
      </div>
    </div>
  )
}
