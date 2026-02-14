'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabase/client'

export function AuthButtons() {
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getSupabase().auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
    const { data: sub } = getSupabase().auth.onAuthStateChange((_evt, session) => {
      setEmail(session?.user?.email ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function signIn(provider: 'github' | 'google') {
    setLoading(true)
    try {
      await getSupabase().auth.signInWithOAuth({ provider })
    } finally {
      setLoading(false)
    }
  }

  if (email) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/account"
          className="border-none border border-[#2a2a2a] px-3 py-1 text-xs text-white/80 hover:border-white/25"
        >
          Account
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        className="border-none border border-[#2a2a2a] px-3 py-1 text-xs text-white/80 hover:border-white/25"
        onClick={() => signIn('github')}
        disabled={loading}
      >
        Sign in with GitHub
      </button>
      <button
        className="border-none border border-[#2a2a2a] px-3 py-1 text-xs text-white/80 hover:border-white/25"
        onClick={() => signIn('google')}
        disabled={loading}
      >
        Sign in with Google
      </button>
    </div>
  )
}
