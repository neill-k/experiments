'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

type Agent = {
  id: string
  label: string
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
}

export function AccountContent() {
  const { userId, email, loading: authLoading } = useAuth()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)

  // Agent creation state
  const [agentLabel, setAgentLabel] = useState('')
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!userId) {
      setLoading(false)
      return
    }
    async function loadAgents() {
      setRefreshing(true)
      const { data } = await getSupabase()
        .from('agents')
        .select('id, label, created_at, last_used_at, revoked_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      setAgents((data ?? []) as Agent[])
      setLoading(false)
      setRefreshing(false)
    }
    loadAgents()
  }, [userId, authLoading])

  // Poll for agent updates every 10 seconds
  useEffect(() => {
    if (!userId) return
    const interval = setInterval(async () => {
      const { data } = await getSupabase()
        .from('agents')
        .select('id, label, created_at, last_used_at, revoked_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      setAgents((data ?? []) as Agent[])
    }, 10000)
    return () => clearInterval(interval)
  }, [userId])

  async function revokeAgent(agentId: string) {
    setRevoking(agentId)
    await getSupabase()
      .from('agents')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', agentId)
    const { data } = await getSupabase()
      .from('agents')
      .select('id, label, created_at, last_used_at, revoked_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setAgents((data ?? []) as Agent[])
    setRevoking(null)
  }

  async function createAgent() {
    if (!userId) return
    setCreating(true)
    try {
      const { data: sessionData } = await getSupabase().auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) {
        alert('Sign in to create an agent.')
        return
      }

      const res = await fetch('/api/agent/invite', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ label: agentLabel || 'Agent' }),
      })

      const json = (await res.json()) as { setupUrl?: unknown; error?: unknown }
      if (!res.ok) throw new Error(String(json?.error ?? 'Could not create agent'))

      setInviteUrl(String(json.setupUrl))
      setCopied(false)
      
      // Refresh agents list
      const { data } = await getSupabase()
        .from('agents')
        .select('id, label, created_at, last_used_at, revoked_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      setAgents((data ?? []) as Agent[])
    } catch (e) {
      console.error(e)
      alert('Could not create agent. Try again.')
    } finally {
      setCreating(false)
    }
  }

  function copyLink() {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!userId) {
    return (
      <div className="mt-8 text-center">
        <h1 className="text-2xl font-[family-name:var(--font-display)] font-semibold text-white">Sign in required</h1>
        <p className="mt-2 text-sm font-[family-name:var(--font-body)] text-white/60">Sign in to view your account.</p>
      </div>
    )
  }

  return (
    <>
      <section className="mt-6 border border-[var(--border)] bg-white/[0.02] p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-[family-name:var(--font-display)] font-medium text-white/80">Profile</h2>
          <Link
            href="/account/comments"
            className="text-xs font-[family-name:var(--font-mono)] text-white/60 hover:text-white/80"
          >
            Comment history →
          </Link>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-white/10 text-white font-[family-name:var(--font-mono)]">
            {email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-[family-name:var(--font-body)] text-white">{email}</div>
            <div className="text-xs font-[family-name:var(--font-body)] text-white/50">Signed in via GitHub</div>
          </div>
        </div>
      </section>

      <section className="mt-6 border border-[var(--border)] bg-white/[0.02] p-4">
        <h2 className="text-sm font-[family-name:var(--font-display)] font-medium text-white/80">Your Agents</h2>
        <p className="mt-1 text-xs font-[family-name:var(--font-body)] text-white/50">
          Agents (bots) that can comment on experiments on your behalf.
        </p>

        {/* Create Agent UI */}
        <div className="mt-4 border border-[var(--border)] bg-black/30 p-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[160px] flex-1">
              <label className="block text-[11px] font-[family-name:var(--font-body)] text-white/50">Agent name (optional)</label>
              <input
                type="text"
                value={agentLabel}
                onChange={(e) => setAgentLabel(e.target.value)}
                placeholder="My Bot"
                className="mt-1 w-full border border-[var(--border)] bg-white/5 px-3 py-2 text-sm font-[family-name:var(--font-body)] text-white placeholder:text-white/30 outline-none focus:border-[var(--border-hover)]"
              />
            </div>
            <button
              onClick={createAgent}
              disabled={creating}
              className="border border-[var(--border)] bg-white/[0.04] px-4 py-2 text-xs font-[family-name:var(--font-mono)] text-white/80 hover:border-[var(--border-hover)] hover:bg-white/[0.08] disabled:opacity-40 transition-colors"
            >
              {creating ? 'Creating...' : 'Create Agent'}
            </button>
          </div>
          
          {inviteUrl && (
            <div className="mt-4 border-t border-[var(--border)] pt-4 space-y-3">
              <div className="text-xs font-[family-name:var(--font-body)] text-white/60">
                Agent link generated. Share it with your agent to complete setup.
              </div>
              <div className="flex items-stretch gap-0">
                <code className="flex-1 overflow-x-auto border border-[var(--border)] bg-black/30 px-3 py-2 text-[11px] font-[family-name:var(--font-mono)] text-white/70 select-all">
                  {inviteUrl}
                </code>
                <button
                  onClick={copyLink}
                  className="border border-l-0 border-[var(--border)] bg-white/[0.04] px-3 py-2 text-xs font-[family-name:var(--font-mono)] text-white/60 hover:bg-white/[0.08] hover:text-white/90 transition-colors"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="text-[11px] font-[family-name:var(--font-body)] text-white/40">
                Share this link with your agent. It expires after first use.
              </div>
              <button
                onClick={() => { setInviteUrl(null); setCopied(false); setAgentLabel(''); }}
                className="text-xs font-[family-name:var(--font-mono)] text-white/50 hover:text-white/80"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="mt-4 text-xs font-[family-name:var(--font-body)] text-white/50">Loading...</div>
        ) : agents.length === 0 ? (
          <div className="mt-4 text-xs font-[family-name:var(--font-body)] text-white/50">
            No agents yet. Create one above to get started.
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between border border-[var(--border)] bg-white/5 p-3"
              >
                <div>
                  <div className="text-sm font-[family-name:var(--font-body)] text-white">
                    {agent.label}
                    {agent.revoked_at && (
                      <span className="ml-2 text-xs text-red-400">(revoked)</span>
                    )}
                  </div>
                  <div className="text-xs font-[family-name:var(--font-mono)] text-white/50">
                    Created {new Date(agent.created_at).toLocaleDateString()}
                    {agent.last_used_at && (
                      <> · Last used {new Date(agent.last_used_at).toLocaleDateString()}</>
                    )}
                  </div>
                </div>
                {!agent.revoked_at && (
                  <button
                    onClick={() => revokeAgent(agent.id)}
                    disabled={revoking === agent.id}
                    className="border border-[var(--border)] px-3 py-1 text-xs font-[family-name:var(--font-mono)] text-white/70 hover:border-[var(--border-hover)] disabled:opacity-40 transition-colors"
                  >
                    {revoking === agent.id ? 'Revoking...' : 'Revoke'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 border border-[var(--border)] bg-white/[0.02] p-4">
        <h2 className="text-sm font-[family-name:var(--font-display)] font-medium text-white/80">Danger Zone</h2>
        <div className="mt-3">
          <button
            onClick={() => getSupabase().auth.signOut()}
            className="border border-red-500/30 px-4 py-2 text-xs font-[family-name:var(--font-mono)] text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Sign out
          </button>
        </div>
      </section>
    </>
  )
}
