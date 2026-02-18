'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Question } from '../lib/types'

export function useQuestion(mode: 'random' | 'daily') {
  const [question, setQuestion] = useState<Question | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/wrong-answer/question?mode=${mode}`)
      if (!res.ok) {
        const body = await res.text()
        throw new Error(body || `Failed to fetch question (${res.status})`)
      }
      const data: Question = await res.json()
      setQuestion(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch question')
    } finally {
      setLoading(false)
    }
  }, [mode])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { question, loading, error, refetch }
}
