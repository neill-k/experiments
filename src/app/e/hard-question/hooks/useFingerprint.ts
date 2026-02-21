'use client'

import { useQuery } from '@tanstack/react-query'
import type { FingerprintResponse } from '../lib/types'
import {
  isHardQuestionApiError,
  requestHardQuestionJson,
} from '../lib/api-client'
import { fingerprintResponseSchema } from '../lib/schemas'

export function useFingerprint() {
  const query = useQuery({
    queryKey: ['hard-question', 'fingerprint'],
    queryFn: async (): Promise<FingerprintResponse> => {
      try {
        return await requestHardQuestionJson(
          '/api/hard-question/fingerprint',
          fingerprintResponseSchema
        )
      } catch (error) {
        if (isHardQuestionApiError(error) && error.status === 401) {
          return { fingerprint: [], total_answers: 0 }
        }

        throw error
      }
    },
  })

  return {
    data: query.data ?? null,
    loading: query.isPending,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  }
}
