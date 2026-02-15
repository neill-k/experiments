'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'

type AuthState = {
  userId: string | null
  email: string | null
  loading: boolean
}

export function useAuth(): AuthState {
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSupabase()
      .auth.getUser()
      .then(({ data }) => {
        setUserId(data.user?.id ?? null)
        setEmail(data.user?.email ?? null)
        setLoading(false)
      })

    const { data: sub } = getSupabase().auth.onAuthStateChange(
      (_evt, session) => {
        setUserId(session?.user?.id ?? null)
        setEmail(session?.user?.email ?? null)
        setLoading(false)
      }
    )

    return () => sub.subscription.unsubscribe()
  }, [])

  return { userId, email, loading }
}
