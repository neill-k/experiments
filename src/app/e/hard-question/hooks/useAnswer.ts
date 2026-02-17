'use client'

import { useState } from 'react'
import type { AnswerResponse } from '../lib/types'
import { fetchWithAuth } from '../lib/fetch-with-auth'

export function useAnswer() {
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<AnswerResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submitAnswer(questionId: string, answerText: string) {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetchWithAuth('/api/hard-question/answer', {
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

      // Stash match data in sessionStorage for anonymous fingerprint
      try {
        const existing = sessionStorage.getItem('hq_session_matches')
        const matches: { school: string; similarity: number }[] = existing
          ? JSON.parse(existing)
          : []
        for (const s of json.similarities) {
          matches.push({ school: s.school, similarity: s.similarity })
        }
        if (json.corpus_matches) {
          for (const c of json.corpus_matches) {
            matches.push({ school: c.school, similarity: c.similarity })
          }
        }
        sessionStorage.setItem('hq_session_matches', JSON.stringify(matches))
      } catch {
        // sessionStorage unavailable
      }

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
