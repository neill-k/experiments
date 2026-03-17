'use client'

import { useState } from 'react'
import { ONO, VOTE_LABELS, type VoteType } from '@/lib/ono/constants'
import { useAuth } from '@/hooks/useAuth'
import { getSupabase } from '@/lib/supabase/client'

interface VoteButtonsProps {
  solutionId: string
  upvotes: number
  iHateThisCount: number
  wouldPassReview: number
}

export function VoteButtons({
  solutionId,
  upvotes: initialUpvotes,
  iHateThisCount: initialHate,
  wouldPassReview: initialReview,
}: VoteButtonsProps) {
  const { userId } = useAuth()
  const [counts, setCounts] = useState({
    upvote: initialUpvotes,
    i_hate_this: initialHate,
    would_pass_review: initialReview,
  })
  const [voting, setVoting] = useState(false)

  async function handleVote(voteType: VoteType) {
    if (!userId || voting) return
    setVoting(true)

    try {
      const supabase = getSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const res = await fetch('/api/ono/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ solutionId, voteType }),
      })

      const data = await res.json()
      if (res.ok) {
        setCounts((prev) => ({
          ...prev,
          [voteType]: prev[voteType] + (data.voted ? 1 : -1),
        }))
      }
    } finally {
      setVoting(false)
    }
  }

  const buttons: { type: VoteType; count: number; color: string }[] = [
    { type: 'upvote', count: counts.upvote, color: ONO.green },
    { type: 'i_hate_this', count: counts.i_hate_this, color: ONO.red },
    { type: 'would_pass_review', count: counts.would_pass_review, color: ONO.amber },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {buttons.map(({ type, count, color }) => (
        <button
          key={type}
          onClick={() => handleVote(type)}
          disabled={!userId || voting}
          className="flex items-center gap-1.5 border px-2.5 py-1.5 font-[family-name:var(--font-mono)] text-[11px] transition-colors disabled:opacity-40"
          style={{
            borderColor: ONO.border,
            color: count > 0 ? color : ONO.textMuted,
          }}
        >
          <span>{VOTE_LABELS[type].icon}</span>
          <span>{VOTE_LABELS[type].label}</span>
          {count > 0 && (
            <span
              className="ml-1 font-bold"
              style={{ color }}
            >
              {count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
