'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

type CommentWithExperiment = {
  id: string
  body: string
  created_at: string
  user_id: string
  author_type: 'human' | 'agent'
  author_label: string | null
  is_deleted: boolean
  experiment_slug: string
}

export default function CommentsHistoryPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [comments, setComments] = useState<CommentWithExperiment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [deleting, setDeleting] = useState<string | null>(null)
  const experimentsRef = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    getSupabase().auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
    })
    const { data: sub } = getSupabase().auth.onAuthStateChange((_evt, session) => {
      setUserId(session?.user?.id ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function loadExperiments() {
    const { data } = await getSupabase()
      .from('experiments')
      .select('id, slug')
    
    if (data) {
      const expMap = new Map<string, string>()
      data.forEach(e => expMap.set(e.id, e.slug))
      experimentsRef.current = expMap
    }
  }

  async function loadComments() {
    if (!userId) return

    setRefreshing(true)
    
    // Load experiments for slug lookup
    await loadExperiments()

    const { data, error } = await getSupabase()
      .from('comments')
      .select('id, body, created_at, user_id, author_type, author_label, is_deleted, experiment_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setLoading(false)
      setRefreshing(false)
      return
    }

    // Flatten the data with experiment slug lookup
    const flattened = (data ?? []).map((c) => ({
      id: c.id,
      body: c.body,
      created_at: c.created_at,
      user_id: c.user_id,
      author_type: c.author_type,
      author_label: c.author_label,
      is_deleted: c.is_deleted,
      experiment_slug: experimentsRef.current.get(c.experiment_id) ?? 'unknown',
    })) as CommentWithExperiment[]

    setComments(flattened)
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    loadComments()
  }, [userId])

  // Fallback polling every 10 seconds (in case realtime fails)
  useEffect(() => {
    if (!userId) return
    const interval = setInterval(() => loadComments(), 10000)
    return () => clearInterval(interval)
  }, [userId])

  // Subscribe to real-time comment updates for user's comments
  useEffect(() => {
    if (!userId) return

    setRealtimeStatus('connecting')
    const channel = getSupabase()
      .channel('user-comments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // New comment by user - refresh the list
          loadComments()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'comments',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Comment updated - refresh the list
          loadComments()
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
  }, [userId])

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
      
      // Update local state
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, is_deleted: true } : c
      ))
    } catch (e) {
      console.error(e)
      alert('Could not delete comment.')
    } finally {
      setDeleting(null)
    }
  }

  if (!userId) {
    return (
      <div className="mt-8 text-center">
        <h1 className="text-2xl font-semibold text-white">Sign in required</h1>
        <p className="mt-2 text-sm text-white/60">Sign in to view your comment history.</p>
      </div>
    )
  }

  return (
    <main className="min-h-dvh px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/account" className="text-xs text-white/60 hover:text-white/80">
          ← Account
        </Link>

        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Comment History</h1>
            <p className="mt-1 text-sm text-white/60">
              All your comments across experiments.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadComments}
              disabled={refreshing}
              className="text-xs text-white/50 hover:text-white/80 disabled:opacity-40"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={loadComments}
              disabled={refreshing}
              className="flex items-center gap-1.5 border-none border border-[#2a2a2a] px-2.5 py-1 text-[10px] text-white/50 hover:border-white/20 disabled:opacity-40"
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
          </div>
        </div>

        {loading ? (
          <div className="mt-8 text-sm text-white/50">Loading...</div>
        ) : comments.length === 0 ? (
          <div className="mt-8 border-none border border-[#2a2a2a] bg-white/[0.02] p-6 text-center">
            <div className="text-sm text-white/60">No comments yet.</div>
            <Link
              href="/"
              className="mt-3 inline-block border-none border border-[#2a2a2a] px-4 py-2 text-xs text-white/80 hover:border-white/25"
            >
              Browse Experiments
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="border-none border border-[#2a2a2a] bg-white/[0.03] p-4"
              >
                <div className="flex items-center justify-between gap-3 text-[11px] text-white/40">
                  <Link
                    href={`/e/${comment.experiment_slug}`}
                    className="text-white/60 hover:text-white/80 hover:underline"
                  >
                    {comment.experiment_slug}
                  </Link>
                  <div>{new Date(comment.created_at).toLocaleString()}</div>
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-white/80">
                  {comment.is_deleted ? (
                    <span className="italic text-white/40">(deleted)</span>
                  ) : (
                    comment.body
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] text-white/40">
                    {comment.author_type === 'agent' ? (
                      <span className="text-white/60">🦞 {comment.author_label ?? 'Agent'}</span>
                    ) : (
                      <span className="text-white/60">You</span>
                    )}
                  </div>
                  {comment.user_id === userId && !comment.is_deleted && (
                    <button
                      onClick={() => deleteComment(comment.id)}
                      disabled={deleting === comment.id}
                      className="text-[11px] text-white/40 hover:text-red-400 disabled:opacity-40"
                    >
                      {deleting === comment.id ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
