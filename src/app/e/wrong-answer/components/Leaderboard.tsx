'use client'

import { useState } from 'react'
import type { LeaderboardEntry } from '../lib/types'
import { getScoreColor, getScoreTier } from '../lib/score-colors'
import { ScoreDimension } from './ScoreDimension'

const RANK_COLORS: Record<number, string> = {
  1: '#ffd700',
  2: '#c0c0c0',
  3: '#cd7f32',
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max) + '...'
}

export function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  if (entries.length === 0) {
    return (
      <div className="border-2 border-[#ebebeb]/20 p-8 text-center">
        <p className="font-[family-name:var(--font-mono)] text-sm text-[#ebebeb]/40 uppercase tracking-widest">
          No answers yet. Be the first to submit.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {/* Desktop header */}
      <div className="hidden sm:grid grid-cols-[60px_1fr_80px_1fr] gap-4 px-4 py-2 border-b-2 border-[#ebebeb]/20">
        <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#ebebeb]/40">#</span>
        <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#ebebeb]/40">Answer</span>
        <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#ebebeb]/40">Score</span>
        <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#ebebeb]/40">Judge&apos;s Take</span>
      </div>

      {entries.map((entry, i) => {
        const isExpanded = expandedIndex === i
        const rankColor = RANK_COLORS[entry.rank] || '#ebebeb66'
        const isTop3 = entry.rank <= 3
        const isFirst = entry.rank === 1
        const tier = getScoreTier(entry.total_score)
        const isLegendary = tier === 'legendary'

        return (
          <div key={i}>
            {/* Row */}
            <button
              onClick={() => setExpandedIndex(isExpanded ? null : i)}
              className="w-full text-left transition-colors hover:bg-[#ebebeb]/5"
              style={{
                borderLeft: isTop3 ? `3px solid ${rankColor}` : '3px solid transparent',
              }}
            >
              {/* Desktop layout */}
              <div className="hidden sm:grid grid-cols-[60px_1fr_80px_1fr] gap-4 px-4 py-3 items-center border-b border-[#ebebeb]/10">
                <span
                  className="font-[family-name:var(--font-mono)] text-lg font-bold"
                  style={{ color: rankColor as string }}
                >
                  {entry.rank}
                </span>
                <span className="font-[family-name:var(--font-body)] text-sm text-[#ebebeb]/80 overflow-hidden text-ellipsis whitespace-nowrap">
                  {truncate(entry.answer_text, 60)}
                </span>
                <span
                  className="font-[family-name:var(--font-mono)] text-lg font-bold"
                  style={{
                    color: isLegendary ? '#ff3333' : getScoreColor(entry.total_score),
                    animation: isFirst ? 'rainbow-text 2s linear infinite' : undefined,
                  }}
                >
                  {entry.total_score}
                </span>
                <span className="font-[family-name:var(--font-body)] text-sm italic text-[#ebebeb]/50 overflow-hidden text-ellipsis whitespace-nowrap">
                  {truncate(entry.judge_commentary, 60)}
                </span>
              </div>

              {/* Mobile layout */}
              <div className="sm:hidden px-4 py-3 border-b border-[#ebebeb]/10">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="font-[family-name:var(--font-mono)] text-lg font-bold"
                    style={{ color: rankColor as string }}
                  >
                    #{entry.rank}
                  </span>
                  <span
                    className="font-[family-name:var(--font-mono)] text-lg font-bold"
                    style={{
                      color: isLegendary ? '#ff3333' : getScoreColor(entry.total_score),
                    }}
                  >
                    {entry.total_score}
                  </span>
                </div>
                <p className="font-[family-name:var(--font-body)] text-sm text-[#ebebeb]/80">
                  {truncate(entry.answer_text, 80)}
                </p>
              </div>
            </button>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="px-4 py-4 bg-[#ebebeb]/5 border-b border-[#ebebeb]/10 space-y-4">
                <p className="font-[family-name:var(--font-body)] text-sm text-[#ebebeb]/80">
                  {entry.answer_text}
                </p>

                <div className="space-y-3">
                  {(['conviction', 'consistency', 'comedy', 'creativity', 'plausibility'] as const).map((key) => (
                    <ScoreDimension
                      key={key}
                      label={key.toUpperCase()}
                      score={entry.scores[key]}
                      maxScore={20}
                      delay={0}
                    />
                  ))}
                </div>

                <p className="font-[family-name:var(--font-body)] text-sm italic text-[#ebebeb]/50">
                  &ldquo;{entry.judge_commentary}&rdquo;
                </p>
              </div>
            )}
          </div>
        )
      })}

      <style>{`
        @keyframes rainbow-text {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
