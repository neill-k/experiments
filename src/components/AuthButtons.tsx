'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function AuthButtons() {
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setEmail(session?.user?.email ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function signIn(provider: 'github' | 'google') {
    setLoading(true)
    try {
      await supabase.auth.signInWithOAuth({ provider })
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    setLoading(true)
    try {
      await supabase.auth.signOut()
    } finally {
      setLoading(false)
    }
  }

  if (email) {
    return (
      <div className="flex items-center gap-3 text-xs text-white/70">
        <span className="max-w-[40ch] truncate">Signed in: {email}</span>
        <button
          className="rounded-full border border-white/15 px-3 py-1 hover:border-white/25"
          onClick={signOut}
          disabled={loading}
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/80 hover:border-white/25"
        onClick={() => signIn('github')}
        disabled={loading}
      >
        Sign in with GitHub
      </button>
      <button
        className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/80 hover:border-white/25"
        onClick={() => signIn('google')}
        disabled={loading}
      >
        Sign in with Google
      </button>
    </div>
  )
}
