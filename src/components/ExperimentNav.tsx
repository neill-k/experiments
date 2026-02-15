'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const experiments = [
  { slug: 'the-blob', title: 'The Blob' },
  { slug: 'prompt-library', title: 'Prompt Library' },
  { slug: 'agent-spec-builder', title: 'Agent Spec Builder' },
]

export function ExperimentNav() {
  const pathname = usePathname()
  const currentSlug = pathname.split('/e/')[1]?.split('/')[0]
  const currentIndex = experiments.findIndex((e) => e.slug === currentSlug)

  if (currentIndex === -1) return null

  const prev = currentIndex > 0 ? experiments[currentIndex - 1] : null
  const next =
    currentIndex < experiments.length - 1 ? experiments[currentIndex + 1] : null

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
          </span>
          <span className="font-[family-name:var(--font-display)] text-sm">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div />
      )}

      <Link
        href="/"
        className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-white/20 hover:text-white/50 transition-colors"
      >
        All experiments
      </Link>

      {next ? (
        <Link
          href={`/e/${next.slug}`}
          className="group flex flex-col items-end gap-0.5 text-white/40 hover:text-white/80 transition-colors"
        >
          <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-white/25 group-hover:text-white/40 transition-colors">
            Next →
          </span>
          <span className="font-[family-name:var(--font-display)] text-sm">
            {next.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  )
}
