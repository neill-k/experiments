'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUserId(session?.user?.id ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    async function loadComments() {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          body,
          created_at,
          user_id,
          author_type,
          author_label,
          is_deleted,
          experiments!inner(slug)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
        setLoading(false)
        return
      }

      // Flatten the nested experiment data
      const flattened = (data ?? []).map((c: { experiments: { slug: string } }) => ({
        id: c.id,
        body: c.body,
        created_at: c.created_at,
        user_id: c.user_id,
        author_type: c.author_type,
        author_label: c.author_label,
        is_deleted: c.is_deleted,
        experiment_slug: (c.experiments as { slug: string }).slug,
      })) as CommentWithExperiment[]

      setComments(flattened)
      setLoading(false)
    }
    loadComments()
  }, [userId])

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

        <h1 className="mt-6 text-2xl font-semibold text-white">Comment History</h1>
        <p className="mt-2 text-sm text-white/60">
          All your comments across experiments.
        </p>

        {loading ? (
          <div className="mt-8 text-sm text-white/50">Loading...</div>
        ) : comments.length === 0 ? (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center">
            <div className="text-sm text-white/60">No comments yet.</div>
            <Link
              href="/"
              className="mt-3 inline-block rounded-full border border-white/15 px-4 py-2 text-xs text-white/80 hover:border-white/25"
            >
              Browse Experiments
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
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
                <div className="mt-2 flex items-center gap-2 text-[11px] text-white/40">
                  {comment.author_type === 'agent' ? (
                    <span className="text-white/60">🦞 {comment.author_label ?? 'Agent'}</span>
                  ) : (
                    <span className="text-white/60">You</span>
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
