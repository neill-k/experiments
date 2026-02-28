'use client'

import { useState } from 'react'
import { ONO } from '@/lib/ono/constants'
import { useAuth } from '@/hooks/useAuth'
import { getSupabase } from '@/lib/supabase/client'

interface SubmissionFormProps {
  problemSlug: string
  onResult: (result: SubmissionResult) => void
}

export interface SubmissionResult {
  accepted: boolean
  solutionId?: string
  error?: string
  score?: {
    total: number
    computationalWaste: number
    overengineering: number
    stylePoints: number
    details: {
      timeRatio: number
      memoryRatio: number
      locRatio: number
      functionBonus: number
      classBonus: number
      importBonus: number
      namingScore: number
      commentScore: number
    }
  }
  testResults?: {
    passed: boolean
    elapsedMs: number
    peakMemoryBytes: number
    actual: string
    expected: string
  }[]
  metrics?: {
    totalExecutionMs: number
    peakMemoryBytes: number
    loc: number
    numFunctions: number
    numClasses: number
    numImports: number
    avgNameLength: number
    longNamesCount: number
    commentLines: number
    totalLines: number
  }
}

export function SubmissionForm({ problemSlug, onResult }: SubmissionFormProps) {
  const { userId } = useAuth()
  const [repoUrl, setRepoUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!repoUrl.trim() || submitting) return

    setError(null)
    setSubmitting(true)

    try {
      const supabase = getSupabase()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setError('Please sign in with GitHub to submit solutions.')
        setSubmitting(false)
        return
      }

      const res = await fetch('/api/ono/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ problemSlug, repoUrl: repoUrl.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Submission failed')
        setSubmitting(false)
        return
      }

      onResult(data as SubmissionResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!userId) {
    return (
      <div
        className="border px-4 py-6 text-center"
        style={{ borderColor: ONO.border, backgroundColor: ONO.surface }}
      >
        <p
          className="font-[family-name:var(--font-mono)] text-sm"
          style={{ color: ONO.textSecondary }}
        >
          Sign in with GitHub to submit solutions.
        </p>
        <p
          className="font-[family-name:var(--font-mono)] text-[11px] mt-2"
          style={{ color: ONO.textMuted }}
        >
          Your solution must live in a public GitHub repo.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        className="border"
        style={{ borderColor: ONO.border, backgroundColor: ONO.surface }}
      >
        <div
          className="px-4 py-2 border-b"
          style={{ borderColor: ONO.border }}
        >
          <span
            className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest"
            style={{ color: ONO.textMuted }}
          >
            Submit Solution
          </span>
        </div>

        <div className="px-4 py-4">
          <label
            className="block font-[family-name:var(--font-mono)] text-xs mb-2"
            style={{ color: ONO.textSecondary }}
          >
            Public GitHub Repository URL
          </label>
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/you/your-terrible-solution"
            className="w-full px-3 py-2 font-[family-name:var(--font-mono)] text-sm border bg-transparent transition-colors focus:outline-none"
            style={{
              color: ONO.textPrimary,
              borderColor: ONO.border,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = ONO.amber
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = ONO.border
            }}
            disabled={submitting}
            required
          />
          <p
            className="mt-2 font-[family-name:var(--font-mono)] text-[10px]"
            style={{ color: ONO.textMuted }}
          >
            Repo must contain a <code style={{ color: ONO.amber }}>solution.py</code> file in the root.
          </p>
        </div>

        {error && (
          <div
            className="px-4 pb-3"
          >
            <p
              className="font-[family-name:var(--font-mono)] text-xs"
              style={{ color: ONO.red }}
            >
              {error}
            </p>
          </div>
        )}

        <div
          className="px-4 py-3 border-t flex justify-end"
          style={{ borderColor: ONO.border }}
        >
          <button
            type="submit"
            disabled={submitting || !repoUrl.trim()}
            className="px-4 py-2 font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest border transition-colors disabled:opacity-30"
            style={{
              color: ONO.bg,
              backgroundColor: ONO.amber,
              borderColor: ONO.amber,
            }}
          >
            {submitting ? 'Judging...' : 'Submit for Judgment'}
          </button>
        </div>
      </div>
    </form>
  )
}
