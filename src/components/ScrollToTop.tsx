'use client'

import { useEffect, useState } from 'react'

/**
 * Floating "scroll to top" button that appears after scrolling
 * past a threshold. Sits in the bottom-right corner.
 */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let ticking = false

    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        setVisible(window.scrollY > 400)
        ticking = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
      className="fixed bottom-6 right-6 z-40 flex h-9 w-9 items-center justify-center border border-[var(--border)] bg-[#0c0c0e]/90 backdrop-blur-sm text-white/50 hover:text-white hover:border-[var(--border-hover)] transition-all duration-200 shadow-lg shadow-black/30"
      style={{
        animation: 'fade-in-up 0.25s ease-out both',
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M7 11V3M7 3L3.5 6.5M7 3L10.5 6.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
