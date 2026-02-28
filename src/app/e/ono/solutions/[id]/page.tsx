'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ONO, getScoreTier } from '@/lib/ono/constants'
import { ScoreBreakdown } from '../../components/ScoreBreakdown'
import { SolutionView } from '../../components/SolutionView'
import { VoteButtons } from '../../components/VoteButtons'

interface SolutionData {
  id: string
  problem_id: string
  github_username: string
  github_repo_url: string
  source_code: string
  total_score: number
  computational_waste: number
  overengineering: number
  style_points: number
  execution_time_ms: number
  peak_memory_bytes: number
  loc: number
  num_functions: number
  num_classes: number
  num_imports: number
  avg_name_length: number
  long_names_count: number
  comment_lines: number
  total_lines: number
  upvotes: number
  i_hate_this_count: number
  would_pass_review: number
  created_at: string
}

interface ProblemData {
  slug: string
  title: string
  function_name: string
  optimal_loc: number
  optimal_time_ms: number
  optimal_memory_bytes: number
}

export default function SolutionPage() {
  const params = useParams()
  const id = params.id as string

  const [solution, setSolution] = useState<SolutionData | null>(null)
  const [problem, setProblem] = useState<ProblemData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/ono/solutions/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setSolution(data.solution ?? null)
        setProblem(data.problem ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="space-y-4">
          <div className="h-8 w-1/3 animate-pulse" style={{ backgroundColor: ONO.surface }} />
          <div className="h-32 animate-pulse" style={{ backgroundColor: ONO.surface }} />
          <div className="h-64 animate-pulse" style={{ backgroundColor: ONO.surface }} />
        </div>
      </div>
    )
  }

  if (!solution || !problem) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="font-[family-name:var(--font-mono)] text-sm" style={{ color: ONO.textMuted }}>
          Solution not found.
        </p>
      </div>
    )
  }

  const tier = getScoreTier(solution.total_score)

  // Recompute detail ratios for display
  const details = {
    timeRatio: Math.round(Math.max(1, solution.execution_time_ms / Math.max(0.001, problem.optimal_time_ms)) * 100) / 100,
    memoryRatio: Math.round(Math.max(1, solution.peak_memory_bytes / Math.max(1, problem.optimal_memory_bytes)) * 100) / 100,
    locRatio: Math.round(Math.max(1, solution.loc / Math.max(1, problem.optimal_loc)) * 100) / 100,
    functionBonus: Math.max(0, solution.num_functions - 1) * 5,
    classBonus: solution.num_classes * 12,
    importBonus: Math.max(0, solution.num_imports - 1) * 3,
    namingScore: (solution.avg_name_length > 20 ? 30 : solution.avg_name_length > 12 ? 20 : solution.avg_name_length > 8 ? 10 : 0) + solution.long_names_count * 3,
    commentScore: solution.total_lines > 0 ? (solution.comment_lines / solution.total_lines > 0.4 ? 25 : solution.comment_lines / solution.total_lines > 0.2 ? 15 : solution.comment_lines / solution.total_lines > 0.1 ? 8 : 0) : 0,
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href={`/e/ono/problems/${problem.slug}`}
          className="font-[family-name:var(--font-mono)] text-[11px] transition-colors"
          style={{ color: ONO.textMuted }}
        >
          &larr; {problem.title}
        </Link>
      </div>

      {/* Solution header */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1
            className="font-[family-name:var(--font-display)] text-2xl"
            style={{ color: ONO.textPrimary }}
          >
            Solution by{' '}
            <a
              href={solution.github_repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:underline"
              style={{ color: ONO.amber }}
            >
              {solution.github_username}
            </a>
          </h1>
          <p
            className="mt-1 font-[family-name:var(--font-mono)] text-[11px]"
            style={{ color: ONO.textMuted }}
          >
            {new Date(solution.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Score badge */}
        <div className="flex items-center gap-2">
          <span
            className="font-[family-name:var(--font-mono)] text-3xl font-bold"
            style={{ color: tier.color }}
          >
            {solution.total_score.toFixed(1)}
          </span>
          <span
            className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest border px-2 py-0.5"
            style={{ color: tier.color, borderColor: tier.color }}
          >
            {tier.label}
          </span>
        </div>
      </div>

      {/* Vote buttons */}
      <div className="mt-4">
        <VoteButtons
          solutionId={solution.id}
          upvotes={solution.upvotes}
          iHateThisCount={solution.i_hate_this_count}
          wouldPassReview={solution.would_pass_review}
        />
      </div>

      {/* Score breakdown */}
      <div className="mt-6">
        <ScoreBreakdown
          total={solution.total_score}
          computationalWaste={solution.computational_waste}
          overengineering={solution.overengineering}
          stylePoints={solution.style_points}
          details={details}
        />
      </div>

      {/* Execution metrics */}
      <div
        className="mt-4 border"
        style={{ borderColor: ONO.border, backgroundColor: ONO.surface }}
      >
        <div className="px-4 py-2 border-b" style={{ borderColor: ONO.border }}>
          <span
            className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest"
            style={{ color: ONO.textMuted }}
          >
            Execution Metrics
          </span>
        </div>
        <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricBlock label="Wall Time" value={`${solution.execution_time_ms.toFixed(2)}ms`} color={ONO.red} />
          <MetricBlock label="Peak Memory" value={formatBytes(solution.peak_memory_bytes)} color={ONO.amber} />
          <MetricBlock label="LOC" value={`${solution.loc}`} color={ONO.green} />
          <MetricBlock label="Total Lines" value={`${solution.total_lines}`} color={ONO.textSecondary} />
        </div>
      </div>

      {/* Source code */}
      <div className="mt-4">
        <SolutionView
          sourceCode={solution.source_code}
          loc={solution.loc}
          numFunctions={solution.num_functions}
          numClasses={solution.num_classes}
          numImports={solution.num_imports}
          totalLines={solution.total_lines}
        />
      </div>

      {/* Share */}
      <div className="mt-6 flex items-center gap-3">
        <a
          href={solution.github_repo_url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-[family-name:var(--font-mono)] text-[11px] px-3 py-1.5 border transition-colors"
          style={{ color: ONO.textSecondary, borderColor: ONO.border }}
        >
          View on GitHub
        </a>
        <button
          onClick={() => {
            const text = `I scored ${solution.total_score.toFixed(1)} (${tier.label}) on "${problem.title}" at O(no) — competitive programming for the rest of us.\n\n${window.location.href}`
            navigator.clipboard.writeText(text)
          }}
          className="font-[family-name:var(--font-mono)] text-[11px] px-3 py-1.5 border transition-colors"
          style={{ color: ONO.amber, borderColor: ONO.amber }}
        >
          Copy share text
        </button>
      </div>
    </div>
  )
}

function MetricBlock({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div>
      <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest" style={{ color: ONO.textMuted }}>
        {label}
      </p>
      <p className="font-[family-name:var(--font-mono)] text-sm font-bold mt-0.5" style={{ color }}>
        {value}
      </p>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
