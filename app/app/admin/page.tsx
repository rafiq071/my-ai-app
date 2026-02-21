'use client'

import { useEffect, useState } from 'react'

type Invite = {
  code: string
  active: boolean
  max_uses: number
  used_count: number
  expires_at: string | null
  created_at: string
  last_used_at: string | null
  last_used_by: string | null
}

type Metrics = {
  range: string
  from: string
  total: number
  ok: number
  fail: number
  fail_breakdown: { schemaFail: number; securityFail: number; otherFail: number }
  cost_usd: number
  latency_ms: { avg: number | null; p95: number | null }
}

type Flag = { key: string; enabled: boolean; updated_at?: string }

export default function AdminInvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [maxUses, setMaxUses] = useState(1)
  const [expiresInDays, setExpiresInDays] = useState<number | ''>('')
  const [createdCode, setCreatedCode] = useState<string | null>(null)

  const [m24, setM24] = useState<Metrics | null>(null)
  const [m7, setM7] = useState<Metrics | null>(null)
  const [flags, setFlags] = useState<Flag[]>([])
  const [edgeInviteOnly, setEdgeInviteOnly] = useState<boolean | null>(null)
  const [edgeInviteSaving, setEdgeInviteSaving] = useState(false)
  const [flagsSaving, setFlagsSaving] = useState<string | null>(null)

  
const loadEdgeInvite = async () => {
  try {
    const res = await fetch('/api/admin/edge-flags', { cache: 'no-store' })
    if (!res.ok) return
    const data = await res.json()
    setEdgeInviteOnly(Boolean(data?.invite_only_enabled))
  } catch {
    // ignore
  }
}

const setEdgeInvite = async (value: boolean) => {
  setEdgeInviteSaving(true)
  try {
    const res = await fetch('/api/admin/edge-flags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_only_enabled: value }),
    })
    if (res.ok) {
      const data = await res.json()
      setEdgeInviteOnly(Boolean(data?.invite_only_enabled))
    }
  } finally {
    setEdgeInviteSaving(false)
  }
}

const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/invites', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load')
      setInvites(data.invites || [])

      // Metrics (non-blocking)
      fetch('/api/admin/metrics?range=24h', { cache: 'no-store' })
        .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
        .then(({ ok, j }) => {
          if (ok) setM24(j)
        })
        .catch(() => null)

      fetch('/api/admin/metrics?range=7d', { cache: 'no-store' })
        .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
        .then(({ ok, j }) => {
          if (ok) setM7(j)
        })
        .catch(() => null)

      fetch('/api/admin/flags', { cache: 'no-store' })
        .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
        .then(({ ok, j }) => {
          if (ok) setFlags(j.flags || [])
        })
        .catch(() => null)

      // Edge Config flag (non-blocking)
      loadEdgeInvite().catch(() => null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const create = async () => {
    setError(null)
    setCreatedCode(null)
    try {
      const res = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxUses,
          expiresInDays: expiresInDays === '' ? null : expiresInDays,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to create')
      setCreatedCode(data.code)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create')
    }
  }

  const toggleFlag = async (key: string, enabled: boolean) => {
    setFlagsSaving(key)
    setError(null)
    try {
      const res = await fetch('/api/admin/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, enabled }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to update flag')
      setFlags((prev) => prev.map((f) => (f.key === key ? { ...f, enabled } : f)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update flag')
    } finally {
      setFlagsSaving(null)
    }
  }

  const csvHref = (() => {
    const to = new Date()
    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const qs = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() })
    return `/api/admin/metrics_export?${qs.toString()}`
  })()

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="mx-auto max-w-5xl p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin · Invite Codes</h1>
          <a href="/app" className="text-sm text-gray-400 hover:text-gray-200">
            ← Back to app
          </a>
        </div>

        <div className="mt-6 rounded-xl border border-[#1f1f2e] bg-[#0f0f16] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Operational metrics</h2>
            <a
              href={csvHref}
              className="text-sm text-gray-400 hover:text-gray-200"
              title="Export last 7 days as CSV"
            >
              Export CSV
            </a>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-[#1f1f2e] bg-[#12121a] p-4">
              <div className="text-xs text-gray-400">Last 24h</div>
              {m24 ? (
                <div className="mt-2 space-y-1 text-sm">
                  <div>
                    Generations: <span className="font-semibold">{m24.total}</span> · OK{' '}
                    <span className="font-semibold">{m24.ok}</span> · Fail{' '}
                    <span className="font-semibold">{m24.fail}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Fail: schema {m24.fail_breakdown.schemaFail} · security {m24.fail_breakdown.securityFail} · other{' '}
                    {m24.fail_breakdown.otherFail}
                  </div>
                  <div>
                    Cost: <span className="font-semibold">${m24.cost_usd.toFixed(4)}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Latency avg {m24.latency_ms.avg ?? '—'} ms · p95 {m24.latency_ms.p95 ?? '—'} ms
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-sm text-gray-400">No data / Supabase not configured</div>
              )}
            </div>
            <div className="rounded-lg border border-[#1f1f2e] bg-[#12121a] p-4">
              <div className="text-xs text-gray-400">Last 7d</div>
              {m7 ? (
                <div className="mt-2 space-y-1 text-sm">
                  <div>
                    Generations: <span className="font-semibold">{m7.total}</span> · OK{' '}
                    <span className="font-semibold">{m7.ok}</span> · Fail{' '}
                    <span className="font-semibold">{m7.fail}</span>
                  </div>
                  <div>
                    Cost: <span className="font-semibold">${m7.cost_usd.toFixed(4)}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Latency avg {m7.latency_ms.avg ?? '—'} ms · p95 {m7.latency_ms.p95 ?? '—'} ms
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-sm text-gray-400">No data / Supabase not configured</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-[#1f1f2e] bg-[#0f0f16] p-5">
          <h2 className="text-lg font-semibold">Feature flags</h2>
          <div className="mt-4 space-y-3 text-sm">

{/* Invite-only is sourced from Vercel Edge Config so middleware can enforce on the edge */}
<div className="flex items-center justify-between rounded-lg border border-[#1f1f2e] bg-[#12121a] px-4 py-3">
  <div>
    <div className="font-mono text-xs text-gray-300">invite_only_enabled (Edge Config)</div>
    <div className="text-xs text-gray-500">Controls invite gate at the edge (middleware)</div>
  </div>
  <button
    disabled={edgeInviteSaving || edgeInviteOnly === null}
    onClick={() => edgeInviteOnly !== null && setEdgeInvite(!edgeInviteOnly)}
    className="rounded-md border border-[#2a2a3d] bg-[#0b0b10] px-3 py-1.5 text-xs text-gray-200 hover:bg-[#11111a] disabled:opacity-50"
  >
    {edgeInviteOnly === null ? '…' : edgeInviteOnly ? 'ON' : 'OFF'}
  </button>
</div>
            {flags.length === 0 ? (
              <div className="text-gray-400">No flags / Supabase not configured</div>
            ) : (
              flags.filter((f) => f.key !== 'invite_only_enabled').map((f) => (
                <div key={f.key} className="flex items-center justify-between rounded-lg border border-[#1f1f2e] bg-[#12121a] px-4 py-3">
                  <div>
                    <div className="font-mono text-xs text-gray-300">{f.key}</div>
                    <div className="text-xs text-gray-500">{f.updated_at ? new Date(f.updated_at).toLocaleString() : ''}</div>
                  </div>
                  <button
                    disabled={flagsSaving === f.key}
                    onClick={() => toggleFlag(f.key, !f.enabled)}
                    className={`rounded-lg px-3 py-1 text-xs font-medium ${
                      f.enabled ? 'bg-green-900/30 text-green-200 border border-green-800' : 'bg-red-900/20 text-red-200 border border-red-800'
                    }`}
                  >
                    {flagsSaving === f.key ? 'Saving…' : f.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="mt-3 text-xs text-gray-500">
            generate_enabled = kill-switch for /api/generate · deploy_enabled = kill-switch for /api/deploy (default off)
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-[#1f1f2e] bg-[#0f0f16] p-5">
          <h2 className="text-lg font-semibold">Create new code</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="text-sm text-gray-300">
              Max uses
              <input
                type="number"
                min={1}
                max={100}
                value={maxUses}
                onChange={(e) => setMaxUses(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-[#1f1f2e] bg-[#12121a] px-3 py-2 text-white"
              />
            </label>
            <label className="text-sm text-gray-300">
              Expires in days (optional)
              <input
                type="number"
                min={1}
                max={365}
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value === '' ? '' : Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-[#1f1f2e] bg-[#12121a] px-3 py-2 text-white"
              />
            </label>
            <div className="flex items-end">
              <button
                onClick={create}
                className="w-full rounded-lg bg-[#2a2a3e] px-4 py-2 text-sm font-medium hover:bg-[#3a3a55]"
              >
                Create
              </button>
            </div>
          </div>
          {createdCode && (
            <div className="mt-3 rounded-lg border border-green-800 bg-green-900/20 p-3 text-sm text-green-200">
              Created: <span className="font-mono">{createdCode}</span>
            </div>
          )}
          {error && <div className="mt-3 text-sm text-red-400">{error}</div>}
        </div>

        <div className="mt-6 rounded-xl border border-[#1f1f2e] bg-[#0f0f16] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Latest codes</h2>
            <button onClick={load} className="text-sm text-gray-400 hover:text-gray-200">
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="mt-4 text-gray-400">Loading…</div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-gray-400">
                  <tr>
                    <th className="py-2">Code</th>
                    <th className="py-2">Uses</th>
                    <th className="py-2">Expires</th>
                    <th className="py-2">Last used</th>
                  </tr>
                </thead>
                <tbody className="text-gray-200">
                  {invites.map((i) => (
                    <tr key={i.code} className="border-t border-[#1f1f2e]">
                      <td className="py-2 font-mono">{i.code}</td>
                      <td className="py-2">
                        {i.used_count}/{i.max_uses}
                      </td>
                      <td className="py-2">{i.expires_at ? new Date(i.expires_at).toLocaleDateString() : '—'}</td>
                      <td className="py-2">{i.last_used_at ? new Date(i.last_used_at).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}