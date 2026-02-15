'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'

const experiments = [
  {
    slug: 'the-blob',
    date: '2026-02-15',
    title: 'The Blob',
    description: 'A bioluminescent ecosystem of cursor-following entities that split, merge, hunt, flee, and glitch',
    tags: ['creative', 'canvas', 'interactive'],
  },
  {
    slug: 'prompt-library',
    date: '2026-02-14',
    title: 'Prompt Library',
    description: 'Organize, version, and test prompts for LLM applications',
    tags: ['tools', 'llm'],
  },
  {
    slug: 'agent-spec-builder',
    date: '2026-02-13',
    title: 'Agent Spec Builder',
    description: 'Turn agent ideas into implementable Markdown specs',
    tags: ['agents', 'specs'],
  },
]

const allTags = Array.from(new Set(experiments.flatMap((e) => e.tags))).sort()

const isToday = (dateStr: string) => {
  const today = new Date().toISOString().split('T')[0]
  return dateStr === today
}

const isRecent = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= 2
}

export default function Home() {
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Small delay so the stagger animation is visible on load
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  const filtered = useMemo(
    () =>
      activeTag
        ? experiments.filter((e) => e.tags.includes(activeTag))
        : experiments,
    [activeTag],
  )

  return (
    <main className="min-h-dvh px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto w-full max-w-3xl">
        <header>
          <h1 className="text-4xl sm:text-5xl tracking-tight text-white">
            Experiments
          </h1>
          <p className="mt-3 text-sm font-[family-name:var(--font-body)] text-white/50">
            {experiments.length} prototypes shipped — click to explore.
          </p>
          <div className="mt-4 h-px w-16 bg-white/20" />
        </header>

        {/* Tag filter bar */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTag(null)}
            className={`px-2.5 py-1 text-[11px] font-[family-name:var(--font-mono)] uppercase tracking-wider border transition-colors ${
              activeTag === null
                ? 'border-white/30 text-white/80 bg-white/[0.08]'
                : 'border-[var(--border)] text-white/30 hover:text-white/50 hover:border-[var(--border-hover)]'
            }`}
          >
            all
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`px-2.5 py-1 text-[11px] font-[family-name:var(--font-mono)] uppercase tracking-wider border transition-colors ${
                activeTag === tag
                  ? 'border-white/30 text-white/80 bg-white/[0.08]'
                  : 'border-[var(--border)] text-white/30 hover:text-white/50 hover:border-[var(--border-hover)]'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {filtered.map((exp, i) => (
            <Link
              key={exp.slug}
              href={`/e/${exp.slug}`}
              className="experiment-card block border border-[var(--border)] bg-white/[0.02] p-4 sm:p-5 text-white/80 hover:text-white"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(12px)',
                transition: `opacity 0.4s ease ${i * 80}ms, transform 0.4s ease ${i * 80}ms`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-base font-[family-name:var(--font-display)] text-white/90">
                      {exp.title}
                    </span>
                    {isToday(exp.date) && (
                      <span className="bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-[family-name:var(--font-mono)] font-medium text-emerald-400 uppercase tracking-wider">
                        new
                      </span>
                    )}
                    {!isToday(exp.date) && isRecent(exp.date) && (
                      <span className="bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-[family-name:var(--font-mono)] font-medium text-blue-400 uppercase tracking-wider">
                        recent
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 text-sm font-[family-name:var(--font-body)] text-white/45">
                    {exp.description}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-[family-name:var(--font-mono)] text-[11px] text-white/30">
                    {exp.date}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                {exp.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest transition-colors ${
                      activeTag === tag ? 'text-white/60' : 'text-white/25'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm font-[family-name:var(--font-body)] text-white/30">
              No experiments match that tag yet.
            </p>
          )}
        </div>

        <footer className="mt-16 border-t border-[var(--border)] pt-6">
          <p className="font-[family-name:var(--font-mono)] text-[11px] text-white/25">
            Built overnight by Quill ✒️ — Neill Killgore&apos;s AI assistant
          </p>
        </footer>
      </div>
    </main>
  )
}
