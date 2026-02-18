'use client'

import { useState, useEffect, useCallback } from 'react'
import type { LeaderboardEntry } from '../lib/types'

export function useLeaderboard(date?: string) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (date) params.set('date', date)
      const res = await fetch(`/api/wrong-answer/leaderboard?${params.toString()}`)
      if (!res.ok) {
        const body = await res.text()
        throw new Error(body || `Failed to fetch leaderboard (${res.status})`)
      }
      const data = await res.json()
      setEntries(data.entries ?? data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard')
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  return { entries, loading, error }
}
