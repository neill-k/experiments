'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export function AuthButtons() {
  const { email } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuItemsRef = useRef<(HTMLElement | null)[]>([])

  const closeMenu = useCallback(() => {
    setShowMenu(false)
    triggerRef.current?.focus()
  }, [])

  // Keyboard navigation for the dropdown menu
  useEffect(() => {
    if (!showMenu) return

    function handleKeyDown(e: KeyboardEvent) {
      const items = menuItemsRef.current.filter(Boolean) as HTMLElement[]
      const currentIndex = items.findIndex((item) => item === document.activeElement)

      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          closeMenu()
          break
        case 'ArrowDown':
          e.preventDefault()
          if (currentIndex < items.length - 1) {
            items[currentIndex + 1]?.focus()
          } else {
            items[0]?.focus()
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          if (currentIndex > 0) {
            items[currentIndex - 1]?.focus()
          } else {
            items[items.length - 1]?.focus()
          }
          break
        case 'Tab':
          closeMenu()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    // Focus the first menu item when opened
    requestAnimationFrame(() => {
      const items = menuItemsRef.current.filter(Boolean) as HTMLElement[]
      items[0]?.focus()
    })

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showMenu, closeMenu])

  async function signIn() {
    setLoading(true)
    try {
      await getSupabase().auth.signInWithOAuth({ provider: 'github' })
    } finally {
      setLoading(false)
    }
  }

  if (email) {
    return (
      <div className="relative">
        <button
          ref={triggerRef}
          onClick={() => setShowMenu(!showMenu)}
          aria-expanded={showMenu}
          aria-haspopup="true"
          className="flex items-center gap-2 border border-[var(--border)] px-3 py-1.5 text-xs font-[family-name:var(--font-mono)] text-white/70 hover:border-[var(--border-hover)] hover:text-white/90 transition-colors"
        >
          <span className="flex h-5 w-5 items-center justify-center bg-white/10 text-[10px] text-white/80" aria-hidden="true">
            {email.charAt(0).toUpperCase()}
          </span>
          <span className="hidden sm:inline max-w-[120px] truncate">{email}</span>
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={closeMenu} />
            <div
              ref={menuRef}
              role="menu"
              aria-label="Account menu"
              className="absolute right-0 top-full mt-1 z-50 min-w-[160px] border border-[var(--border)] bg-[#0c0c0e] p-1"
            >
              <Link
                href="/account"
                role="menuitem"
                ref={(el) => { menuItemsRef.current[0] = el }}
                onClick={closeMenu}
                className="block px-3 py-2 text-xs font-[family-name:var(--font-body)] text-white/70 hover:bg-white/5 hover:text-white transition-colors"
              >
                Account
              </Link>
              <button
                role="menuitem"
                ref={(el) => { menuItemsRef.current[1] = el }}
                onClick={() => {
                  getSupabase().auth.signOut()
                  closeMenu()
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
    <button
      className="border border-[var(--border)] bg-white/[0.04] px-4 py-1.5 text-xs font-[family-name:var(--font-mono)] text-white/80 hover:border-[var(--border-hover)] hover:bg-white/[0.08] hover:text-white transition-colors disabled:opacity-40"
      onClick={signIn}
      disabled={loading}
    >
      Sign in with GitHub
    </button>
  )
}
