'use client'

import { useEffect, useState } from 'react'
import type { PerspectiveMatch } from '../lib/types'
import { fetchWithAuth } from '../lib/fetch-with-auth'

interface PreviousResult {
  similarities: PerspectiveMatch[]
}

/**
 * Fetches the user's previous philosopher-match results for a question
 * they have already answered. Uses the /api/hard-question/perspectives
 * endpoint which returns similarity scores for authenticated users.
 */
export function usePreviousResult(questionId: string | null) {
  const [data, setData] = useState<PreviousResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!questionId) return

    async function fetchPrevious() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetchWithAuth(
          `/api/hard-question/perspectives?question_id=${questionId}`
        )
        if (res.status === 401 || res.status === 403) {
          // Not authenticated or hasn't answered - no previous result
          return
        }
        if (!res.ok) throw new Error('Failed to fetch previous results')
        const json = await res.json()

        const similarities: PerspectiveMatch[] = (json.perspectives || []).map(
          (p: any) => ({
            perspective_id: p.perspective_id,
            philosopher_name: p.philosopher_name,
            school: p.school,
            perspective_text: p.perspective_text ?? '',
            summary: p.summary ?? null,
            source: p.source ?? null,
            similarity: p.similarity ?? 0,
          })
        )

        if (similarities.length > 0) {
          setData({ similarities })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchPrevious()
  }, [questionId])

  return { data, loading, error }
}
