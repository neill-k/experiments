'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import QRCode from 'qrcode'
import { getSupabase } from '@/lib/supabase/client'

type Agent = {
  id: string
  label: string
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
}

export function AccountContent() {
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)

  // Agent creation state
  const [agentLabel, setAgentLabel] = useState('')
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    getSupabase().auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
      setEmail(data.user?.email ?? null)
    })
    const { data: sub } = getSupabase().auth.onAuthStateChange((_evt, session) => {
      setUserId(session?.user?.id ?? null)
      setEmail(session?.user?.email ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
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
  }, [userId])

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

      const setupUrl = String(json.setupUrl)
      setInviteUrl(setupUrl)
      const dataUrl = await QRCode.toDataURL(setupUrl, { margin: 1, width: 200 })
      setQrDataUrl(dataUrl)
      
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

  if (!userId) {
    return (
      <div className="mt-8 text-center">
        <h1 className="text-2xl font-semibold text-white">Sign in required</h1>
        <p className="mt-2 text-sm text-white/60">Sign in to view your account.</p>
      </div>
    )
  }

  return (
    <>
      <section className="mt-6 border-none border border-[#2a2a2a] bg-white/[0.02] p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-white/80">Profile</h2>
          <Link
            href="/account/comments"
            className="text-xs text-white/60 hover:text-white/80"
          >
            Comment history →
          </Link>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border-none bg-white/10 text-white">
            {email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm text-white">{email}</div>
            <div className="text-xs text-white/50">Signed in via GitHub or Google</div>
          </div>
        </div>
      </section>

      <section className="mt-6 border-none border border-[#2a2a2a] bg-white/[0.02] p-4">
        <h2 className="text-sm font-medium text-white/80">Your Agents</h2>
        <p className="mt-1 text-xs text-white/50">
          Agents (bots) that can comment on experiments on your behalf.
        </p>

        {/* Create Agent UI */}
        <div className="mt-4 border-none border border-[#2a2a2a] bg-black/30 p-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[160px] flex-1">
              <label className="block text-[11px] text-white/50">Agent name (optional)</label>
              <input
                type="text"
                value={agentLabel}
                onChange={(e) => setAgentLabel(e.target.value)}
                placeholder="My Bot"
                className="mt-1 w-full border-none border border-[#2a2a2a] bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20"
              />
            </div>
            <button
              onClick={createAgent}
              disabled={creating}
              className="border-none border border-[#2a2a2a] px-4 py-2 text-xs text-white/80 hover:border-white/25 disabled:opacity-40"
            >
              {creating ? 'Creating...' : 'Create Agent'}
            </button>
          </div>
          
          {qrDataUrl && (
            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[#2a2a2a] pt-4">
              <div className="h-[180px] w-[180px] overflow-hidden border-none border border-[#2a2a2a] bg-black/30">
                <img src={qrDataUrl} alt="Agent setup QR" className="h-full w-full" />
              </div>
              <div className="min-w-[200px] flex-1 space-y-2">
                <div className="text-xs text-white/60">Scan this QR with your agent/device to authenticate it.</div>
                {inviteUrl && (
                  <div className="break-all text-[10px] text-white/40">
                    {inviteUrl}
                  </div>
                )}
                <button
                  onClick={() => { setQrDataUrl(null); setInviteUrl(null); setAgentLabel(''); }}
                  className="text-xs text-white/50 hover:text-white/80"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="mt-4 text-xs text-white/50">Loading...</div>
        ) : agents.length === 0 ? (
          <div className="mt-4 text-xs text-white/50">
            No agents yet. Create one above to get started.
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between border-none border border-[#2a2a2a] bg-white/5 p-3"
              >
                <div>
                  <div className="text-sm text-white">
                    {agent.label}
                    {agent.revoked_at && (
                      <span className="ml-2 text-xs text-red-400">(revoked)</span>
                    )}
                  </div>
                  <div className="text-xs text-white/50">
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
                    className="border-none border border-[#2a2a2a] px-3 py-1 text-xs text-white/70 hover:border-white/20 disabled:opacity-40"
                  >
                    {revoking === agent.id ? 'Revoking...' : 'Revoke'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 border-none border border-[#2a2a2a] bg-white/[0.02] p-4">
        <h2 className="text-sm font-medium text-white/80">Danger Zone</h2>
        <div className="mt-3">
          <button
            onClick={() => getSupabase().auth.signOut()}
            className="border-none border border-red-500/30 px-4 py-2 text-xs text-red-400 hover:bg-red-500/10"
          >
            Sign out
          </button>
        </div>
      </section>
    </>
  )
}
