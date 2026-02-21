'use client'

import { useCallback, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AnswerResponse } from '../lib/types'
import { requestHardQuestionJson } from '../lib/api-client'
import { answerResponseSchema } from '../lib/schemas'
import {
  appendSessionFingerprintMatches,
  buildSessionAnswerKey,
} from '../lib/session-fingerprint-store'

interface SubmitAnswerOptions {
  practiceMode?: boolean
}

interface UseAnswerOptions {
  trackSessionFingerprint?: boolean
}

interface SubmitAnswerInput {
  questionId: string
  answerText: string
  practiceMode: boolean
}

export function useAnswer(options?: UseAnswerOptions) {
  const queryClient = useQueryClient()
  const [result, setResult] = useState<AnswerResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async ({ questionId, answerText, practiceMode }: SubmitAnswerInput) => {
      return requestHardQuestionJson('/api/hard-question/answer', answerResponseSchema, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: questionId,
          answer_text: answerText,
          practice_mode: practiceMode,
        }),
      })
    },
    onSuccess: (json, variables) => {
      setResult(json)
      setError(null)

      if (options?.trackSessionFingerprint && json.ranked) {
        const answerKey = json.answer_id ?? buildSessionAnswerKey(variables.questionId, variables.answerText)
        appendSessionFingerprintMatches({
          questionId: variables.questionId,
          answerKey,
          perspectiveMatches: json.similarities,
          corpusMatches: json.corpus_matches,
        })
      }

      queryClient.invalidateQueries({ queryKey: ['hard-question', 'today'] })
      queryClient.invalidateQueries({ queryKey: ['hard-question', 'archive'] })
      queryClient.invalidateQueries({ queryKey: ['hard-question', 'fingerprint'] })
      queryClient.invalidateQueries({ queryKey: ['hard-question', 'practice'] })
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : 'Unknown error')
    },
  })

  const submitAnswer = useCallback(
    async (
      questionId: string,
      answerText: string,
      submitOptions?: SubmitAnswerOptions
    ) => {
      setError(null)

      try {
        return await mutation.mutateAsync({
          questionId,
          answerText,
          practiceMode: submitOptions?.practiceMode ?? false,
        })
      } catch {
        return null
      }
    },
    [mutation]
  )

  const clearResult = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return {
    submitAnswer,
    submitting: mutation.isPending,
    result,
    error,
    setResult,
    clearResult,
  }
}
