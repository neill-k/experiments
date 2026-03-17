'use client'

import { useEffect, useState } from 'react'
import { ONO } from '@/lib/ono/constants'
import { LeaderboardTable } from '../components/LeaderboardTable'

interface Solution {
  id: string
  github_username: string
  github_repo_url: string
  total_score: number
  computational_waste: number
  overengineering: number
  style_points: number
  loc: number
  execution_time_ms: number
  peak_memory_bytes: number
  upvotes: number
  i_hate_this_count: number
  would_pass_review: number
  created_at: string
}

type SortKey = 'total_score' | 'computational_waste' | 'overengineering' | 'style_points' | 'i_hate_this_count' | 'would_pass_review'

export default function LeaderboardPage() {
  const [solutions, setSolutions] = useState<Solution[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortKey>('total_score')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/ono/leaderboard?sort=${sortBy}&limit=50`)
      .then((res) => res.json())
      .then((data) => {
        setSolutions(data.solutions ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [sortBy])

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'total_score', label: 'Total Score' },
    { key: 'computational_waste', label: 'Waste' },
    { key: 'overengineering', label: 'Overeng.' },
    { key: 'style_points', label: 'Style' },
    { key: 'i_hate_this_count', label: '"I Hate This"' },
    { key: 'would_pass_review', label: '"Would Pass Review"' },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1
        className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl"
        style={{ color: ONO.textPrimary }}
      >
        Hall of Shame
      </h1>
      <p
        className="mt-2 font-[family-name:var(--font-mono)] text-xs"
        style={{ color: ONO.textMuted }}
      >
        The most gloriously terrible solutions across all problems. Sorted by regret.
      </p>

      {/* Sort options */}
      <div className="mt-6 flex flex-wrap gap-2">
        {sortOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key)}
            className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest px-2.5 py-1 border transition-colors"
            style={{
              borderColor: sortBy === opt.key ? ONO.amber : ONO.border,
              color: sortBy === opt.key ? ONO.amber : ONO.textMuted,
              backgroundColor: sortBy === opt.key ? ONO.amberGlow : 'transparent',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mt-4">
        {loading ? (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="h-10 animate-pulse"
                style={{ backgroundColor: ONO.surface }}
              />
            ))}
          </div>
        ) : (
          <LeaderboardTable solutions={solutions} />
        )}
      </div>
    </div>
  )
}
