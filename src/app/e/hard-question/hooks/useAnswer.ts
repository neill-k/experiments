'use client'

import { useState } from 'react'
import type { AnswerResponse, PerspectiveMatch } from '../lib/types'

export function useAnswer() {
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<AnswerResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submitAnswer(questionId: string, answerText: string) {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/hard-question/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: questionId, answer_text: answerText }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Error ${res.status}`)
      }
      const json: AnswerResponse = await res.json()
      setResult(json)
      return json
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return null
    } finally {
      setSubmitting(false)
    }
  }

  return { submitAnswer, submitting, result, error, setResult }
}
