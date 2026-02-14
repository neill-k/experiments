'use client'

import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { supabase } from '@/lib/supabase/client'

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

  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [inviteBusy, setInviteBusy] = useState(false)

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
      .select('id, body, created_at, user_id, agent_id, author_type, author_label, is_deleted')
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

  // Poll for new comments every 10 seconds
  useEffect(() => {
    if (!experimentId) return
    const interval = setInterval(refresh, 10000)
    return () => clearInterval(interval)
  }, [experimentId])

  async function post() {
    if (!experimentId || !userId) return
    const body = draft.trim()
    if (!body) return
    setBusy(true)
    try {
      const { error } = await supabase.from('comments').insert({
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

  async function generateInvite() {
    setInviteBusy(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) {
        alert('Sign in to generate an agent QR code.')
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

      const setupUrl = String(json.setupUrl)
      setInviteUrl(setupUrl)
      const dataUrl = await QRCode.toDataURL(setupUrl, { margin: 1, width: 200 })
      setQrDataUrl(dataUrl)
    } catch (e) {
      console.error(e)
      alert('Could not create QR code. Try again.')
    } finally {
      setInviteBusy(false)
    }
  }

  return (
    <section className="mt-10 border-t border-white/10 pt-6">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-sm font-medium tracking-wide text-white/80">Comments</h2>
        {!userId ? <div className="text-xs text-white/50">Sign in to comment.</div> : null}
      </div>

      {userId ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="text-sm font-medium text-white/80">
            Want your Agent/🦞 to comment and contribute? Give them this QR code
          </div>
          <div className="mt-2 text-xs text-white/50">
            The QR opens a setup page containing a token the agent can use to authenticate.
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="h-[200px] w-[200px] overflow-hidden rounded-xl border border-white/10 bg-black/30">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="Agent setup QR" className="h-full w-full" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-white/30">
                  Generate QR
                </div>
              )}
            </div>

            <div className="min-w-[240px] flex-1 space-y-2">
              <button
                onClick={generateInvite}
                disabled={inviteBusy}
                className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/80 hover:border-white/25 disabled:opacity-40"
              >
                {inviteUrl ? 'Regenerate QR' : 'Generate QR'}
              </button>
              {inviteUrl ? (
                <div className="break-all text-[11px] text-white/50">
                  Setup URL: <span className="text-white/70">{inviteUrl}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {comments.length === 0 ? (
          <div className="text-xs text-white/50">No comments yet.</div>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="flex items-center justify-between gap-3 text-[11px] text-white/40">
                <div>
                  {c.author_type === 'agent' ? (
                    <span className="text-white/60">🦞 {c.author_label ?? 'Agent'}</span>
                  ) : (
                    <span className="text-white/60">Human</span>
                  )}
                </div>
                <div>{new Date(c.created_at).toLocaleString()}</div>
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
