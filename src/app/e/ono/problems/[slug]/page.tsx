'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ONO, DIFFICULTY_LABELS, CATEGORY_LABELS, getScoreTier, type Difficulty, type Category } from '@/lib/ono/constants'
import { SubmissionForm, type SubmissionResult } from '../../components/SubmissionForm'
import { ScoreBreakdown } from '../../components/ScoreBreakdown'
import { TestResults } from '../../components/TestResults'
import { LeaderboardTable } from '../../components/LeaderboardTable'

interface Problem {
  id: string
  slug: string
  title: string
  description: string
  constraints: string
  category: Category
  difficulty: Difficulty
  function_name: string
  function_sig: string
  test_cases: { index: number; input: unknown[]; expected: unknown }[]
  optimal_loc: number
  optimal_time_ms: number
  optimal_memory_bytes: number
}

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

export default function ProblemPage() {
  const params = useParams()
  const slug = params.slug as string

  const [problem, setProblem] = useState<Problem | null>(null)
  const [solutions, setSolutions] = useState<Solution[]>([])
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<SubmissionResult | null>(null)

  useEffect(() => {
    fetch(`/api/ono/problems/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        setProblem(data.problem ?? null)
        setSolutions(data.solutions ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  function handleResult(r: SubmissionResult) {
    setResult(r)
    // Refresh solutions if accepted
    if (r.accepted) {
      fetch(`/api/ono/problems/${slug}`)
        .then((res) => res.json())
        .then((data) => setSolutions(data.solutions ?? []))
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="space-y-4">
          <div className="h-8 w-1/3 animate-pulse" style={{ backgroundColor: ONO.surface }} />
          <div className="h-4 w-2/3 animate-pulse" style={{ backgroundColor: ONO.surface }} />
          <div className="h-32 animate-pulse" style={{ backgroundColor: ONO.surface }} />
        </div>
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="font-[family-name:var(--font-mono)] text-sm" style={{ color: ONO.textMuted }}>
          Problem not found.
        </p>
        <Link
          href="/e/ono"
          className="mt-4 inline-block font-[family-name:var(--font-mono)] text-xs transition-colors"
          style={{ color: ONO.amber }}
        >
          &larr; Back to problems
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <Link
        href="/e/ono"
        className="font-[family-name:var(--font-mono)] text-[11px] transition-colors"
        style={{ color: ONO.textMuted }}
      >
        &larr; All problems
      </Link>

      {/* Problem header */}
      <div className="mt-4">
        <div className="flex items-center gap-3 mb-2">
          <span
            className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest border px-1.5 py-0.5"
            style={{
              color: problem.difficulty === 'legendary' ? ONO.red : ONO.amber,
              borderColor: problem.difficulty === 'legendary' ? ONO.red : ONO.amber,
            }}
          >
            {DIFFICULTY_LABELS[problem.difficulty]}
          </span>
          <span
            className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider"
            style={{ color: ONO.textMuted }}
          >
            {CATEGORY_LABELS[problem.category]}
          </span>
        </div>

        <h1
          className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl"
          style={{ color: ONO.textPrimary }}
        >
          {problem.title}
        </h1>
      </div>

      {/* Problem description */}
      <div
        className="mt-6 border"
        style={{ borderColor: ONO.border, backgroundColor: ONO.surface }}
      >
        <div className="px-4 py-2 border-b" style={{ borderColor: ONO.border }}>
          <span
            className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest"
            style={{ color: ONO.textMuted }}
          >
            Problem Statement
          </span>
        </div>
        <div className="px-4 py-4">
          <div
            className="font-[family-name:var(--font-body)] text-sm leading-relaxed whitespace-pre-line"
            style={{ color: ONO.textSecondary }}
          >
            {problem.description}
          </div>
          {problem.constraints && (
            <p
              className="mt-4 font-[family-name:var(--font-mono)] text-xs"
              style={{ color: ONO.amber }}
            >
              {problem.constraints}
            </p>
          )}
        </div>
      </div>

      {/* Function signature + test cases */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {/* Signature */}
        <div
          className="border"
          style={{ borderColor: ONO.border, backgroundColor: ONO.surface }}
        >
          <div className="px-4 py-2 border-b" style={{ borderColor: ONO.border }}>
            <span
              className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest"
              style={{ color: ONO.textMuted }}
            >
              Function Signature
            </span>
          </div>
          <div className="px-4 py-3">
            <code
              className="font-[family-name:var(--font-mono)] text-xs"
              style={{ color: ONO.terminal }}
            >
              {problem.function_sig}
            </code>
            <div className="mt-3 flex items-center gap-4">
              <span className="font-[family-name:var(--font-mono)] text-[10px]" style={{ color: ONO.textMuted }}>
                Optimal: <span style={{ color: ONO.textSecondary }}>{problem.optimal_loc} LOC</span>
              </span>
              <span className="font-[family-name:var(--font-mono)] text-[10px]" style={{ color: ONO.textMuted }}>
                Time: <span style={{ color: ONO.textSecondary }}>{problem.optimal_time_ms}ms</span>
              </span>
            </div>
          </div>
        </div>

        {/* Test cases */}
        <div
          className="border"
          style={{ borderColor: ONO.border, backgroundColor: ONO.surface }}
        >
          <div className="px-4 py-2 border-b" style={{ borderColor: ONO.border }}>
            <span
              className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest"
              style={{ color: ONO.textMuted }}
            >
              Test Cases ({problem.test_cases.length})
            </span>
          </div>
          <div className="px-4 py-3 space-y-2 max-h-48 overflow-y-auto">
            {problem.test_cases.map((tc) => (
              <div key={tc.index} className="flex gap-2">
                <span
                  className="font-[family-name:var(--font-mono)] text-[10px] shrink-0"
                  style={{ color: ONO.textMuted }}
                >
                  #{tc.index + 1}
                </span>
                <span
                  className="font-[family-name:var(--font-mono)] text-[10px] truncate"
                  style={{ color: ONO.textSecondary }}
                >
                  {JSON.stringify(tc.input)} &rarr;{' '}
                  <span style={{ color: tc.expected === '???' ? ONO.textMuted : ONO.green }}>
                    {JSON.stringify(tc.expected)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Submission form */}
      <div className="mt-8">
        <SubmissionForm problemSlug={slug} onResult={handleResult} />
      </div>

      {/* Result display */}
      {result && (
        <div className="mt-6 space-y-4">
          {result.accepted ? (
            <>
              <div
                className="border px-4 py-3 flex items-center gap-3"
                style={{ borderColor: ONO.green, backgroundColor: 'rgba(74, 222, 128, 0.05)' }}
              >
                <span
                  className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest"
                  style={{ color: ONO.green }}
                >
                  Accepted
                </span>
                <span
                  className="font-[family-name:var(--font-mono)] text-xs"
                  style={{ color: ONO.textMuted }}
                >
                  All test cases passed. Our condolences.
                </span>
                {result.solutionId && (
                  <Link
                    href={`/e/ono/solutions/${result.solutionId}`}
                    className="ml-auto font-[family-name:var(--font-mono)] text-[11px] transition-colors"
                    style={{ color: ONO.amber }}
                  >
                    View solution &rarr;
                  </Link>
                )}
              </div>

              {result.score && (
                <ScoreBreakdown
                  total={result.score.total}
                  computationalWaste={result.score.computationalWaste}
                  overengineering={result.score.overengineering}
                  stylePoints={result.score.stylePoints}
                  details={result.score.details}
                />
              )}
            </>
          ) : (
            <div
              className="border px-4 py-3"
              style={{ borderColor: ONO.red, backgroundColor: 'rgba(230, 57, 70, 0.05)' }}
            >
              <span
                className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest"
                style={{ color: ONO.red }}
              >
                Rejected
              </span>
              <p
                className="mt-1 font-[family-name:var(--font-mono)] text-xs"
                style={{ color: ONO.textSecondary }}
              >
                {result.error || 'Your solution must be correct. We cannot stress this enough.'}
              </p>
            </div>
          )}

          {result.testResults && result.testResults.length > 0 && (
            <TestResults results={result.testResults} />
          )}
        </div>
      )}

      {/* Existing solutions leaderboard */}
      <div className="mt-10">
        <h2
          className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest mb-4"
          style={{ color: ONO.textMuted }}
        >
          Top Performers (Condolences)
        </h2>
        <LeaderboardTable solutions={solutions} />
      </div>
    </div>
  )
}
