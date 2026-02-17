'use client'

import { useEffect, useState } from 'react'
import type { TodayResponse } from '../lib/types'

export function useQuestion() {
  const [data, setData] = useState<TodayResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchQuestion() {
      try {
        const res = await fetch('/api/hard-question/today')
        if (!res.ok) throw new Error('Failed to fetch question')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchQuestion()
  }, [])

  return { data, loading, error, setData }
}
