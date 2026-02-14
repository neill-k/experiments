'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

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
  const [revoking, setRevoking] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
      setEmail(data.user?.email ?? null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
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
      const { data } = await supabase
        .from('agents')
        .select('id, label, created_at, last_used_at, revoked_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      setAgents((data ?? []) as Agent[])
      setLoading(false)
    }
    loadAgents()
  }, [userId])

  async function revokeAgent(agentId: string) {
    setRevoking(agentId)
    await supabase
      .from('agents')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', agentId)
    const { data } = await supabase
      .from('agents')
      .select('id, label, created_at, last_used_at, revoked_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setAgents((data ?? []) as Agent[])
    setRevoking(null)
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
      <section className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
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
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
            {email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm text-white">{email}</div>
            <div className="text-xs text-white/50">Signed in via GitHub or Google</div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <h2 className="text-sm font-medium text-white/80">Your Agents</h2>
        <p className="mt-1 text-xs text-white/50">
          Agents (bots) that can comment on experiments on your behalf.
        </p>

        {loading ? (
          <div className="mt-4 text-xs text-white/50">Loading...</div>
        ) : agents.length === 0 ? (
          <div className="mt-4 text-xs text-white/50">
            No agents yet. Generate a QR code on any experiment page to create one.
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
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
                    className="rounded-lg border border-white/10 px-3 py-1 text-xs text-white/70 hover:border-white/20 disabled:opacity-40"
                  >
                    {revoking === agent.id ? 'Revoking...' : 'Revoke'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <h2 className="text-sm font-medium text-white/80">Danger Zone</h2>
        <div className="mt-3">
          <button
            onClick={() => supabase.auth.signOut()}
            className="rounded-lg border border-red-500/30 px-4 py-2 text-xs text-red-400 hover:bg-red-500/10"
          >
            Sign out
          </button>
        </div>
      </section>
    </>
  )
}
