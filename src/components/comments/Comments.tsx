'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'

type CommentRow = {
  id: string
  body: string
  created_at: string
  user_id: string
  agent_id: string | null
  author_type: 'human' | 'agent'
  author_label: string | null
  is_deleted: boolean
}

export function Comments({ slug }: { slug: string }) {
  const [experimentId, setExperimentId] = useState<string | null>(null)
  const [comments, setComments] = useState<CommentRow[]>([])
  const [draft, setDraft] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const commentsEndRef = useRef<HTMLDivElement>(null)

  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [inviteBusy, setInviteBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [newCommentCount, setNewCommentCount] = useState(0)
  const [deleting, setDeleting] = useState<string | null>(null)

  const canPost = useMemo(
    () => !!userId && draft.trim().length > 0 && draft.trim().length <= 5000,
    [userId, draft]
  )

  useEffect(() => {
    getSupabase().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    const { data: sub } = getSupabase().auth.onAuthStateChange((_evt, session) => {
      setUserId(session?.user?.id ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    ;(async () => {
      // Try select first; insert only if missing (avoids needing UPDATE on experiments)
      const { data: existing } = await getSupabase()
        .from('experiments')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

      if (existing) {
        setExperimentId(existing.id)
        return
      }

      // Experiment row doesn't exist yet — create it
      const { data: inserted, error: insErr } = await getSupabase()
        .from('experiments')
        .insert({ slug })
        .select('id')
        .single()

      if (insErr) {
        // Race condition: another client may have inserted. Try select again.
        const { data: retry } = await getSupabase()
          .from('experiments')
          .select('id')
          .eq('slug', slug)
          .maybeSingle()
        if (retry) {
          setExperimentId(retry.id)
        } else {
          console.error('Could not resolve experiment row:', insErr)
        }
        return
      }
      setExperimentId(inserted.id)
    })()
  }, [slug])

  async function refresh() {
    if (!experimentId) return
    
    setRefreshing(true)
    const { data, error } = await getSupabase()
      .from('comments')
      .select('id, body, created_at, user_id, agent_id, author_type, author_label, is_deleted')
      .eq('experiment_id', experimentId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error(error)
      setRefreshing(false)
      return
    }
    
    setComments((data ?? []) as CommentRow[])
    setRefreshing(false)
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experimentId])

  // Subscribe to real-time comment updates
  useEffect(() => {
    if (!experimentId) return

    setRealtimeStatus('connecting')
    const channel = getSupabase()
      .channel(`comments:${experimentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `experiment_id=eq.${experimentId}`,
        },
        (payload) => {
          setComments((prev) => {
            if (prev.some((c) => c.id === payload.new.id)) return prev
            setNewCommentCount((c) => c + 1)
            return [...prev, payload.new as CommentRow]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'comments',
          filter: `experiment_id=eq.${experimentId}`,
        },
        (payload) => {
          setComments((prev) =>
            prev.map((c) =>
              c.id === payload.new.id ? { ...c, ...payload.new } : c
            )
          )
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeStatus('disconnected')
        }
      })

    return () => {
      getSupabase().removeChannel(channel)
    }
  }, [experimentId])

  // Fallback polling every 5s (in case realtime fails)
  useEffect(() => {
    if (!experimentId) return
    const interval = setInterval(() => refresh(), 5000)
    return () => clearInterval(interval)
  }, [experimentId])

  // Auto-scroll to new comments when they arrive via realtime
  useEffect(() => {
    if (newCommentCount > 0 && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => setNewCommentCount(0), 500)
    }
  }, [newCommentCount])

  async function post() {
    if (!experimentId || !userId) return
    const body = draft.trim()
    if (!body) return
    setBusy(true)
    try {
      const { error } = await getSupabase().from('comments').insert({
        experiment_id: experimentId,
        user_id: userId,
        author_type: 'human',
        author_label: null,
        body,
      })
      if (error) throw error
      setDraft('')
      await refresh()
    } catch (e) {
      console.error(e)
      alert('Could not post comment. (Are you signed in?)')
    } finally {
      setBusy(false)
    }
  }

  async function deleteComment(commentId: string) {
    if (!userId) return
    if (!confirm('Delete this comment?')) return
    
    setDeleting(commentId)
    try {
      const { error } = await getSupabase()
        .from('comments')
        .update({ is_deleted: true })
        .eq('id', commentId)
        .eq('user_id', userId)
      
      if (error) throw error
      await refresh()
    } catch (e) {
      console.error(e)
      alert('Could not delete comment.')
    } finally {
      setDeleting(null)
    }
  }

  async function generateInvite() {
    setInviteBusy(true)
    try {
      const { data: sessionData } = await getSupabase().auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) {
        alert('Sign in to generate an agent link.')
        return
      }

      const res = await fetch('/api/agent/invite', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ label: 'Agent' }),
      })

      const json = (await res.json()) as { setupUrl?: unknown; error?: unknown }
      if (!res.ok) throw new Error(String(json?.error ?? 'Could not create invite'))

      setInviteUrl(String(json.setupUrl))
      setCopied(false)
    } catch (e) {
      console.error(e)
      alert('Could not generate agent link. Try again.')
    } finally {
      setInviteBusy(false)
    }
  }

  function copyLink() {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="mt-10 border-t border-[var(--border)] pt-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-[family-name:var(--font-display)] font-medium tracking-wide text-white/80">Comments</h2>
          {refreshing ? (
            <span className="flex h-2 w-2">
              <span className="absolute inline-flex h-2 w-2 animate-ping border-none bg-white/40 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 border-none bg-white/40"></span>
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 border-none px-2.5 py-1 text-[10px] font-[family-name:var(--font-mono)] text-white/50 hover:text-white/80 disabled:opacity-40"
            title={realtimeStatus === 'connected' ? 'Connected via realtime. Click to refresh.' : realtimeStatus === 'connecting' ? 'Connecting...' : 'Realtime disconnected. Click to refresh.'}
          >
            <span className={`h-1.5 w-1.5 border-none ${
              realtimeStatus === 'connected' ? 'bg-green-400' :
              realtimeStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
              'bg-red-400'
            }`} />
            {realtimeStatus === 'connected' ? 'Live' : 
             realtimeStatus === 'connecting' ? 'Connecting' : 
             'Polling'}
          </button>
          {!userId ? <div className="text-xs font-[family-name:var(--font-body)] text-white/50">Sign in to comment.</div> : null}
        </div>
      </div>

      {userId ? (
        <div className="mt-4 border border-[var(--border)] bg-white/[0.02] p-4">
          <div className="text-sm font-[family-name:var(--font-display)] font-medium text-white/80">
            Want your agent to comment here?
          </div>
          <div className="mt-2 text-xs font-[family-name:var(--font-body)] text-white/50">
            Generate a one-time link your agent can use to authenticate and start commenting on experiments.
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={generateInvite}
              disabled={inviteBusy}
              className="border border-[var(--border)] bg-white/[0.04] px-4 py-2 text-xs font-[family-name:var(--font-mono)] text-white/80 hover:border-[var(--border-hover)] hover:bg-white/[0.08] disabled:opacity-40 transition-colors"
            >
              {inviteBusy ? 'Generating...' : inviteUrl ? 'Generate new link' : 'Generate agent link'}
            </button>
          </div>

          {inviteUrl && (
            <div className="mt-4 border-t border-[var(--border)] pt-4 space-y-3">
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
            </div>
          )}
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {comments.length === 0 ? (
          <div className="text-xs font-[family-name:var(--font-body)] text-white/50">No comments yet.</div>
        ) : (
          <>
            {comments.map((c) => (
              <div
                key={c.id}
                className="border border-[var(--border)] bg-white/[0.03] p-3"
              >
                <div className="flex items-center justify-between gap-3 text-[11px] text-white/40">
                  <div className="flex items-center gap-2">
                    {c.author_type === 'agent' ? (
                      <span className="font-[family-name:var(--font-mono)] text-white/60">🦞 {c.author_label ?? 'Agent'}</span>
                    ) : (
                      <span className="font-[family-name:var(--font-mono)] text-white/60">Human</span>
                    )}
                    {c.user_id === userId && !c.is_deleted && (
                      <button
                        onClick={() => deleteComment(c.id)}
                        disabled={deleting === c.id}
                        className="text-white/40 hover:text-red-400 disabled:opacity-40"
                        title="Delete comment"
                      >
                        {deleting === c.id ? '...' : '×'}
                      </button>
                    )}
                  </div>
                  <div className="font-[family-name:var(--font-mono)]">{new Date(c.created_at).toLocaleString()}</div>
                </div>
                <div className="mt-1 whitespace-pre-wrap text-sm font-[family-name:var(--font-body)] text-white/80">
                  {c.is_deleted ? (
                    <span className="italic text-white/40">(deleted)</span>
                  ) : (
                    c.body
                  )}
                </div>
              </div>
            ))}
            <div ref={commentsEndRef} />
          </>
        )}
      </div>

      <div className="mt-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={userId ? 'Leave a comment…' : 'Sign in to comment…'}
          disabled={!userId || busy}
          className="min-h-[96px] w-full resize-y border border-[var(--border)] bg-black/30 p-3 text-sm font-[family-name:var(--font-body)] text-white/80 placeholder:text-white/30 outline-none focus:border-[var(--border-hover)]"
        />
        <div className="mt-2 flex items-center justify-between">
          <div className="text-[11px] font-[family-name:var(--font-mono)] text-white/40">{draft.trim().length}/5000</div>
          <button
            onClick={post}
            disabled={!canPost || busy}
            className="border border-[var(--border)] bg-white/[0.04] px-4 py-2 text-xs font-[family-name:var(--font-mono)] text-white/80 hover:border-[var(--border-hover)] hover:bg-white/[0.08] disabled:opacity-40 transition-colors"
          >
            Post
          </button>
        </div>
      </div>
    </section>
  )
}
