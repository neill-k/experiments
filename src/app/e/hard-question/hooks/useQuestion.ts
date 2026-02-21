'use client'

import { useQuery } from '@tanstack/react-query'
import type { TodayResponse } from '../lib/types'
import { requestHardQuestionJson } from '../lib/api-client'
import { todayResponseSchema } from '../lib/schemas'

function buildTodayUrl(questionId?: string | null): string {
  if (!questionId) return '/api/hard-question/today'
  const params = new URLSearchParams({ question_id: questionId })
  return `/api/hard-question/today?${params.toString()}`
}

export function useQuestion(questionId?: string | null) {
  const query = useQuery({
    queryKey: ['hard-question', 'today', questionId ?? 'today'],
    queryFn: () => requestHardQuestionJson(buildTodayUrl(questionId), todayResponseSchema),
  })

  return {
    data: (query.data ?? null) as TodayResponse | null,
    loading: query.isPending,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  }
}
