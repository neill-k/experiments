'use client'

import { useEffect, useState } from 'react'
import type { FingerprintResponse } from '../lib/types'

export function useFingerprint() {
  const [data, setData] = useState<FingerprintResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFingerprint() {
      try {
        const res = await fetch('/api/hard-question/fingerprint')
        if (res.status === 401) {
          setData({ fingerprint: [], total_answers: 0 })
          return
        }
        if (!res.ok) throw new Error('Failed to fetch fingerprint')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchFingerprint()
  }, [])

  return { data, loading, error }
}
