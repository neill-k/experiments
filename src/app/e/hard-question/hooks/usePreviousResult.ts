'use client'

import { useQuery } from '@tanstack/react-query'
import type { CorpusMatch, PerspectiveMatch, SubscriptionTier } from '../lib/types'
import {
  isHardQuestionApiError,
  requestHardQuestionJson,
} from '../lib/api-client'
import { perspectivesResponseSchema } from '../lib/schemas'

interface PreviousResult {
  similarities: PerspectiveMatch[]
  corpus_matches: CorpusMatch[]
  tier: SubscriptionTier
}

/**
 * Fetches the user's previous reveal payload for a question they have already answered.
 * Includes both perspective matches and corpus matches so returning users get the same
 * reveal quality as fresh submissions.
 */
export function usePreviousResult(questionId: string | null) {
  const query = useQuery({
    queryKey: ['hard-question', 'previous-result', questionId],
    enabled: !!questionId,
    queryFn: async (): Promise<PreviousResult | null> => {
      const params = new URLSearchParams({ question_id: questionId! })

      try {
        const json = await requestHardQuestionJson(
          `/api/hard-question/perspectives?${params.toString()}`,
          perspectivesResponseSchema
        )

        if (json.perspectives.length === 0) {
          return null
        }

        return {
          similarities: json.perspectives,
          corpus_matches: json.corpus_matches,
          tier: json.tier,
        }
      } catch (error) {
        if (
          isHardQuestionApiError(error) &&
          (error.status === 401 || error.status === 403)
        ) {
          return null
        }

        throw error
      }
    },
  })

  return {
    data: query.data ?? null,
    loading: query.isPending,
    error: query.error instanceof Error ? query.error.message : null,
  }
}
