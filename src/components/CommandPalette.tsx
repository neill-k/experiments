'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { experiments } from '@/lib/experiments'

/**
 * Command palette (Cmd+K / Ctrl+K) for quick experiment navigation.
 * Filters experiments by title, description, and tags.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const filtered = query.trim()
    ? experiments.filter((e) => {
        const q = query.toLowerCase()
        return (
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q))
        )
      })
    : experiments

  // Reset selection when query or open state changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      // Small delay to ensure the element is mounted
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    }
  }, [open])

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  const navigate = useCallback(
    (slug: string) => {
      setOpen(false)
      router.push(`/e/${slug}`)
    },
    [router],
  )

  const goHome = useCallback(() => {
    setOpen(false)
    router.push('/')
  }, [router])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex === filtered.length) {
        // "All experiments" option at the bottom
        goHome()
      } else if (filtered[selectedIndex]) {
        navigate(filtered[selectedIndex].slug)
      }
    }
  }

  return (
    <>
      {/* Trigger hint in the nav bar */}
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:inline-flex items-center gap-1 border border-white/10 px-2 py-0.5 text-[10px] font-[family-name:var(--font-mono)] text-white/20 cursor-pointer hover:text-white/40 hover:border-white/20 transition-colors"
        title="Search experiments"
        aria-label="Search experiments (Cmd+K)"
      >
        <span className="text-[9px]">⌘</span>K
      </button>

      {/* Modal overlay */}
      {open && (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === backdropRef.current) setOpen(false)
      }}
    >
      <div
        className="w-full max-w-lg border border-[var(--border)] bg-[#0c0c0e]/95 backdrop-blur-lg shadow-2xl shadow-black/60"
        role="dialog"
        aria-label="Search experiments"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="shrink-0 text-white/30"
          >
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
            <line
              x1="11"
              y1="11"
              x2="14.5"
              y2="14.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search experiments..."
            className="flex-1 bg-transparent text-sm font-[family-name:var(--font-body)] text-white/90 placeholder:text-white/25 outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="shrink-0 border border-white/10 px-1.5 py-0.5 text-[10px] font-[family-name:var(--font-mono)] text-white/20">
            esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[40vh] overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-sm font-[family-name:var(--font-body)] text-white/30">
              No experiments match &ldquo;{query}&rdquo;
            </div>
          )}
          {filtered.map((exp, i) => (
            <button
              key={exp.slug}
              onClick={() => navigate(exp.slug)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                i === selectedIndex
                  ? 'bg-white/[0.06] text-white'
                  : 'text-white/60 hover:bg-white/[0.03] hover:text-white/80'
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
                <div className="mt-0.5 text-[11px] font-[family-name:var(--font-body)] text-white/30 truncate">
                  {exp.description}
                </div>
              </div>
              <div className="shrink-0 flex gap-1.5">
                {exp.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] font-[family-name:var(--font-mono)] uppercase tracking-wider text-white/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))}

          {/* "All experiments" option */}
          <button
            onClick={goHome}
            className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors border-t border-[var(--border)] ${
              selectedIndex === filtered.length
                ? 'bg-white/[0.06] text-white'
                : 'text-white/40 hover:bg-white/[0.03] hover:text-white/60'
            }`}
          >
            <span className="text-base leading-none shrink-0" aria-hidden="true">
              ↩
            </span>
            <span className="text-sm font-[family-name:var(--font-mono)]">
              All experiments
            </span>
          </button>
        </div>

        {/* Footer hints */}
        <div className="border-t border-[var(--border)] px-4 py-2 flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[10px] font-[family-name:var(--font-mono)] text-white/20">
            <kbd className="border border-white/10 px-1 py-px">↑↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-[family-name:var(--font-mono)] text-white/20">
            <kbd className="border border-white/10 px-1 py-px">↵</kbd> open
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-[family-name:var(--font-mono)] text-white/20">
            <kbd className="border border-white/10 px-1 py-px">esc</kbd> close
          </span>
        </div>
      </div>
    </div>
      )}
    </>
  )
}
