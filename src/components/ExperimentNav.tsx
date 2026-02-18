'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { experiments, sourceUrl } from '@/lib/experiments'

export function ExperimentNav() {
  const pathname = usePathname()
  const router = useRouter()
  const currentSlug = pathname.split('/e/')[1]?.split('/')[0]
  const currentIndex = experiments.findIndex((e) => e.slug === currentSlug)

  const current = currentIndex >= 0 ? experiments[currentIndex] : null
  const prev = currentIndex > 0 ? experiments[currentIndex - 1] : null
  const next =
    currentIndex < experiments.length - 1 ? experiments[currentIndex + 1] : null

  // Keyboard shortcuts: ← previous, → next experiment
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore when typing in an input/textarea/contenteditable
      const tag = (e.target as HTMLElement)?.tagName
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return
      }
      // Ignore if any modifier key is held (allow browser/OS shortcuts)
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return

      if (e.key === 'ArrowLeft' && prev) {
        e.preventDefault()
        router.push(`/e/${prev.slug}`)
      } else if (e.key === 'ArrowRight' && next) {
        e.preventDefault()
        router.push(`/e/${next.slug}`)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [prev, next, router])

  if (currentIndex === -1) return null

  return (
    <nav
      className="mt-12 border-t border-[var(--border)] pt-6 pb-8 flex items-center justify-between gap-4 px-4 sm:px-6"
      aria-label="Experiment navigation"
    >
      {prev ? (
        <Link
          href={`/e/${prev.slug}`}
          className="group flex flex-col items-start gap-0.5 text-white/40 hover:text-white/80 transition-colors"
        >
          <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-white/25 group-hover:text-white/40 transition-colors">
            ← Previous
            <kbd className="ml-1.5 hidden sm:inline-block border border-white/10 px-1 py-px text-[9px] text-white/20 group-hover:text-white/30 group-hover:border-white/20 transition-colors">
              ←
            </kbd>
          </span>
          <span className="font-[family-name:var(--font-display)] text-sm">
            {prev.icon && <span className="mr-1.5" aria-hidden="true">{prev.icon}</span>}
            {prev.title}
          </span>
        </Link>
      ) : (
        <div />
      )}

      <div className="flex flex-col items-center gap-1.5">
        <Link
          href="/"
          className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-white/20 hover:text-white/50 transition-colors"
        >
          All experiments
        </Link>
        <a
          href={sourceUrl(currentSlug)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-[family-name:var(--font-mono)] text-[10px] text-white/15 hover:text-white/40 transition-colors"
        >
          view source ↗
        </a>
        {current?.tech && current.tech.length > 0 && (
          <div className="mt-1 flex flex-wrap justify-center gap-1">
            {current.tech.map((t) => (
              <span
                key={t}
                className="border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[9px] text-white/15"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {next ? (
        <Link
          href={`/e/${next.slug}`}
          className="group flex flex-col items-end gap-0.5 text-white/40 hover:text-white/80 transition-colors"
        >
          <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-white/25 group-hover:text-white/40 transition-colors">
            <kbd className="mr-1.5 hidden sm:inline-block border border-white/10 px-1 py-px text-[9px] text-white/20 group-hover:text-white/30 group-hover:border-white/20 transition-colors">
              →
            </kbd>
            Next →
          </span>
          <span className="font-[family-name:var(--font-display)] text-sm">
            {next.title}
            {next.icon && <span className="ml-1.5" aria-hidden="true">{next.icon}</span>}
          </span>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  )
}
