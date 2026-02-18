'use client'

import { useState, useCallback } from 'react'
import type { AnswerResult } from '../lib/types'
import { fetchWithAuth } from '../lib/fetch-with-auth'

export function useAnswer() {
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<AnswerResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(async (questionId: string, answerText: string, isDaily: boolean) => {
    setSubmitting(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetchWithAuth('/api/wrong-answer/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: questionId,
          answer_text: answerText,
          is_daily: isDaily,
        }),
      })
      if (!res.ok) {
        const body = await res.text()
        throw new Error(body || `Submission failed (${res.status})`)
      }
      const data: AnswerResult = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }, [])

  return { submit, submitting, result, error }
}
