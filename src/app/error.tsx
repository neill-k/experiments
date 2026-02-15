'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Experiment error:', error)
  }, [error])

  return (
    <main className="min-h-dvh px-4 py-12 sm:px-6 sm:py-16 flex items-center justify-center">
      <div className="mx-auto w-full max-w-lg text-center">
        <div className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.3em] text-white/20">
          something broke
        </div>
        <h1 className="mt-4 text-5xl sm:text-6xl tracking-tight text-white/10 font-[family-name:var(--font-display)]">
          Error
        </h1>
        <p className="mt-4 text-sm font-[family-name:var(--font-body)] text-white/40 leading-relaxed">
          This experiment hit an unexpected snag.
          <br />
          Try reloading — it might just need a fresh start.
        </p>
        <div className="mt-8 h-px w-16 bg-white/10 mx-auto" />
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 border border-[var(--border)] bg-white/[0.02] px-5 py-2.5 text-sm font-[family-name:var(--font-body)] text-white/60 hover:text-white hover:border-[var(--border-hover)] transition-all duration-200 cursor-pointer"
          >
            <span className="text-white/30">↻</span>
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 border border-[var(--border)] bg-white/[0.02] px-5 py-2.5 text-sm font-[family-name:var(--font-body)] text-white/60 hover:text-white hover:border-[var(--border-hover)] transition-all duration-200"
          >
            <span className="text-white/30">←</span>
            All experiments
          </a>
        </div>
      </div>
    </main>
  )
}
