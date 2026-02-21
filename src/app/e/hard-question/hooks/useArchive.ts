'use client'

import { useQuery } from '@tanstack/react-query'
import { requestHardQuestionJson } from '../lib/api-client'
import { archiveResponseSchema } from '../lib/schemas'
import type { ArchiveResponse } from '../lib/types'

export function useArchive(page: number, perPage = 20) {
  const query = useQuery({
    queryKey: ['hard-question', 'archive', page, perPage],
    queryFn: () =>
      requestHardQuestionJson(
        `/api/hard-question/archive?page=${page}&per_page=${perPage}`,
        archiveResponseSchema
      ),
  })

  return {
    data: (query.data ?? null) as ArchiveResponse | null,
    loading: query.isPending,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  }
}
