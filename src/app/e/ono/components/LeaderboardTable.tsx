'use client'

import Link from 'next/link'
import { ONO, getScoreTier } from '@/lib/ono/constants'

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
  upvotes: number
  i_hate_this_count: number
  would_pass_review: number
  created_at: string
}

interface LeaderboardTableProps {
  solutions: Solution[]
  showProblem?: boolean
}

export function LeaderboardTable({ solutions }: LeaderboardTableProps) {
  if (solutions.length === 0) {
    return (
      <div
        className="border px-4 py-8 text-center"
        style={{ borderColor: ONO.border, backgroundColor: ONO.surface }}
      >
        <p
          className="font-[family-name:var(--font-mono)] text-sm"
          style={{ color: ONO.textMuted }}
        >
          No accepted solutions yet. Be the first to disappoint us.
        </p>
      </div>
    )
  }

  return (
    <div className="border overflow-x-auto" style={{ borderColor: ONO.border }}>
      <table className="w-full">
        <thead>
          <tr style={{ backgroundColor: ONO.surface }}>
            <th className="text-left px-3 py-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest" style={{ color: ONO.textMuted, borderBottom: `1px solid ${ONO.border}` }}>
              #
            </th>
            <th className="text-left px-3 py-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest" style={{ color: ONO.textMuted, borderBottom: `1px solid ${ONO.border}` }}>
              Engineer
            </th>
            <th className="text-right px-3 py-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest" style={{ color: ONO.textMuted, borderBottom: `1px solid ${ONO.border}` }}>
              Score
            </th>
            <th className="text-right px-3 py-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest hidden sm:table-cell" style={{ color: ONO.textMuted, borderBottom: `1px solid ${ONO.border}` }}>
              Waste
            </th>
            <th className="text-right px-3 py-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest hidden sm:table-cell" style={{ color: ONO.textMuted, borderBottom: `1px solid ${ONO.border}` }}>
              Overeng.
            </th>
            <th className="text-right px-3 py-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest hidden md:table-cell" style={{ color: ONO.textMuted, borderBottom: `1px solid ${ONO.border}` }}>
              LOC
            </th>
            <th className="text-right px-3 py-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest hidden md:table-cell" style={{ color: ONO.textMuted, borderBottom: `1px solid ${ONO.border}` }}>
              Reactions
            </th>
          </tr>
        </thead>
        <tbody>
          {solutions.map((sol, i) => {
            const tier = getScoreTier(sol.total_score)
            return (
              <tr
                key={sol.id}
                className="transition-colors"
                style={{ backgroundColor: i % 2 === 0 ? 'transparent' : ONO.surface }}
              >
                <td
                  className="px-3 py-2.5 font-[family-name:var(--font-mono)] text-xs"
                  style={{ color: ONO.textMuted, borderBottom: `1px solid ${ONO.border}` }}
                >
                  {i + 1}
                </td>
                <td style={{ borderBottom: `1px solid ${ONO.border}` }} className="px-3 py-2.5">
                  <Link
                    href={`/e/ono/solutions/${sol.id}`}
                    className="font-[family-name:var(--font-mono)] text-xs transition-colors hover:underline"
                    style={{ color: ONO.amber }}
                  >
                    {sol.github_username}
                  </Link>
                </td>
                <td
                  className="px-3 py-2.5 text-right font-[family-name:var(--font-mono)] text-xs font-bold"
                  style={{ color: tier.color, borderBottom: `1px solid ${ONO.border}` }}
                >
                  {sol.total_score.toFixed(1)}
                </td>
                <td
                  className="px-3 py-2.5 text-right font-[family-name:var(--font-mono)] text-[11px] hidden sm:table-cell"
                  style={{ color: ONO.redDim, borderBottom: `1px solid ${ONO.border}` }}
                >
                  {sol.computational_waste.toFixed(1)}
                </td>
                <td
                  className="px-3 py-2.5 text-right font-[family-name:var(--font-mono)] text-[11px] hidden sm:table-cell"
                  style={{ color: ONO.amberDim, borderBottom: `1px solid ${ONO.border}` }}
                >
                  {sol.overengineering.toFixed(1)}
                </td>
                <td
                  className="px-3 py-2.5 text-right font-[family-name:var(--font-mono)] text-[11px] hidden md:table-cell"
                  style={{ color: ONO.textSecondary, borderBottom: `1px solid ${ONO.border}` }}
                >
                  {sol.loc}
                </td>
                <td
                  className="px-3 py-2.5 text-right font-[family-name:var(--font-mono)] text-[11px] hidden md:table-cell"
                  style={{ borderBottom: `1px solid ${ONO.border}` }}
                >
                  <span className="inline-flex gap-2">
                    {sol.upvotes > 0 && <span style={{ color: ONO.greenDim }}>▲{sol.upvotes}</span>}
                    {sol.i_hate_this_count > 0 && <span style={{ color: ONO.redDim }}>🤮{sol.i_hate_this_count}</span>}
                    {sol.would_pass_review > 0 && <span style={{ color: ONO.amberDim }}>👔{sol.would_pass_review}</span>}
                    {sol.upvotes === 0 && sol.i_hate_this_count === 0 && sol.would_pass_review === 0 && (
                      <span style={{ color: ONO.textMuted }}>-</span>
                    )}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
