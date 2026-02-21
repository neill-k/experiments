'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { experiments } from '@/lib/experiments'

/**
 * Dropdown experiment picker for the top nav.
 * Shows all experiments with icons, lets users jump between them
 * without returning to the homepage.
 */
export function NavDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuItemsRef = useRef<(HTMLAnchorElement | null)[]>([])
  const pathname = usePathname()

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [open])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      const items = menuItemsRef.current.filter(Boolean) as HTMLAnchorElement[]
      const currentIndex = items.findIndex((item) => item === document.activeElement)

      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          setOpen(false)
          triggerRef.current?.focus()
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
          setOpen(false)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    // Focus first item when opened
    requestAnimationFrame(() => {
      const items = menuItemsRef.current.filter(Boolean) as HTMLAnchorElement[]
      items[0]?.focus()
    })

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  // Close when navigating
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Determine which experiment is active (if any)
  const activeSlug = experiments.find(
    (e) => pathname === `/e/${e.slug}` || pathname.startsWith(`/e/${e.slug}/`)
  )?.slug

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-1 text-white/50 hover:text-white/80 transition-colors"
        title="Jump to experiment"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 w-72 border border-[var(--border)] bg-[#0c0c0e]/95 backdrop-blur-lg shadow-xl shadow-black/40 z-50"
          role="menu"
        >
          <div className="px-3 py-2 border-b border-[var(--border)]">
            <span className="text-[10px] font-[family-name:var(--font-mono)] text-white/30 uppercase tracking-widest">
              Experiments
            </span>
          </div>
          <div className="py-1">
            {experiments.map((exp, i) => {
              const isActive = exp.slug === activeSlug
              return (
                <Link
                  key={exp.slug}
                  ref={(el) => { menuItemsRef.current[i] = el }}
                  href={`/e/${exp.slug}`}
                  role="menuitem"
                  className={`flex items-center gap-3 px-3 py-2.5 transition-colors focus:bg-white/[0.06] focus:text-white outline-none ${
                    isActive
                      ? 'bg-white/[0.06] text-white'
                      : 'text-white/60 hover:bg-white/[0.04] hover:text-white/90'
                  }`}
                >
                  {exp.icon && (
                    <span className="text-base leading-none shrink-0" aria-hidden="true">
                      {exp.icon}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-[family-name:var(--font-display)] truncate">
                      {exp.title}
                    </div>
                    <div className="text-[11px] font-[family-name:var(--font-mono)] text-white/30 mt-0.5">
                      {exp.date}
                    </div>
                  </div>
                  {isActive && (
                    <span className="shrink-0 h-1.5 w-1.5 bg-white/50" aria-label="Current" />
                  )}
                </Link>
              )
            })}
          </div>
          <div className="border-t border-[var(--border)] px-3 py-2">
            <Link
              ref={(el) => { menuItemsRef.current[experiments.length] = el }}
              href="/"
              role="menuitem"
              className="block w-full text-[11px] font-[family-name:var(--font-mono)] text-white/40 hover:text-white/70 focus:text-white transition-colors outline-none"
            >
              View all →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
