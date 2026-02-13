'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type CommentRow = {
  id: string
  body: string
  created_at: string
  user_id: string
  is_deleted: boolean
}

export function Comments({ slug }: { slug: string }) {
  const [experimentId, setExperimentId] = useState<string | null>(null)
  const [comments, setComments] = useState<CommentRow[]>([])
  const [draft, setDraft] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const canPost = useMemo(
    () => !!userId && draft.trim().length > 0 && draft.trim().length <= 5000,
    [userId, draft]
  )

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUserId(session?.user?.id ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    ;(async () => {
      const { data: exp, error: expErr } = await supabase
        .from('experiments')
        .upsert({ slug }, { onConflict: 'slug' })
        .select('id')
        .single()

      if (expErr) {
        console.error(expErr)
        return
      }
      setExperimentId(exp.id)
    })()
  }, [slug])

  async function refresh() {
    if (!experimentId) return
    const { data, error } = await supabase
      .from('comments')
      .select('id, body, created_at, user_id, is_deleted')
      .eq('experiment_id', experimentId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error(error)
      return
    }
    setComments((data ?? []) as CommentRow[])
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experimentId])

  async function post() {
    if (!experimentId || !userId) return
    const body = draft.trim()
    if (!body) return
    setBusy(true)
    try {
      const { error } = await supabase
        .from('comments')
        .insert({ experiment_id: experimentId, user_id: userId, body })
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

  return (
    <section className="mt-10 border-t border-white/10 pt-6">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-sm font-medium tracking-wide text-white/80">Comments</h2>
        {!userId ? <div className="text-xs text-white/50">Sign in to comment.</div> : null}
      </div>

      <div className="mt-4 space-y-3">
        {comments.length === 0 ? (
          <div className="text-xs text-white/50">No comments yet.</div>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="text-[11px] text-white/40">
                {new Date(c.created_at).toLocaleString()}
              </div>
              <div className="mt-1 whitespace-pre-wrap text-sm text-white/80">
                {c.is_deleted ? (
                  <span className="italic text-white/40">(deleted)</span>
                ) : (
                  c.body
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={userId ? 'Leave a comment…' : 'Sign in to comment…'}
          disabled={!userId || busy}
          className="min-h-[96px] w-full resize-y rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white/80 placeholder:text-white/30 outline-none focus:border-white/20"
        />
        <div className="mt-2 flex items-center justify-between">
          <div className="text-[11px] text-white/40">{draft.trim().length}/5000</div>
          <button
            onClick={post}
            disabled={!canPost || busy}
            className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/80 hover:border-white/25 disabled:opacity-40"
          >
            Post
          </button>
        </div>
      </div>
    </section>
  )
}
