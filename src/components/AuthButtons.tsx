'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabase/client'

export function AuthButtons() {
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

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
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 border border-[var(--border)] px-3 py-1.5 text-xs font-[family-name:var(--font-mono)] text-white/70 hover:border-[var(--border-hover)] hover:text-white/90 transition-colors"
        >
          <span className="flex h-5 w-5 items-center justify-center bg-white/10 text-[10px] text-white/80">
            {email.charAt(0).toUpperCase()}
          </span>
          <span className="hidden sm:inline max-w-[120px] truncate">{email}</span>
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] border border-[var(--border)] bg-[#0c0c0e] p-1">
              <Link
                href="/account"
                onClick={() => setShowMenu(false)}
                className="block px-3 py-2 text-xs font-[family-name:var(--font-body)] text-white/70 hover:bg-white/5 hover:text-white transition-colors"
              >
                Account
              </Link>
              <button
                onClick={() => {
                  getSupabase().auth.signOut()
                  setShowMenu(false)
                }}
                className="w-full text-left px-3 py-2 text-xs font-[family-name:var(--font-body)] text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors"
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        className="border border-[var(--border)] px-3 py-1.5 text-xs font-[family-name:var(--font-mono)] text-white/60 hover:border-[var(--border-hover)] hover:text-white/90 transition-colors disabled:opacity-40"
        onClick={() => signIn('github')}
        disabled={loading}
      >
        GitHub
      </button>
      <button
        className="border border-[var(--border)] px-3 py-1.5 text-xs font-[family-name:var(--font-mono)] text-white/60 hover:border-[var(--border-hover)] hover:text-white/90 transition-colors disabled:opacity-40"
        onClick={() => signIn('google')}
        disabled={loading}
      >
        Google
      </button>
    </div>
  )
}
