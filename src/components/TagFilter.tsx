'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export function TagFilter({
  allTags,
  tagCounts,
  totalCount,
}: {
  allTags: string[]
  tagCounts: Record<string, number>
  totalCount: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTag = searchParams.get('tag')

  const setTag = useCallback(
    (tag: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (tag) {
        params.set('tag', tag)
      } else {
        params.delete('tag')
      }

      const query = params.toString()
      router.push(query ? `/?${query}` : '/', { scroll: false })
    },
    [router, searchParams],
  )

  return (
    <div className="mt-8 flex flex-wrap items-center gap-2">
      <button
        onClick={() => setTag(null)}
        aria-pressed={activeTag === null}
        className={`group flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-[family-name:var(--font-mono)] uppercase tracking-wider border transition-colors ${
          activeTag === null
            ? 'border-white/30 text-white/80 bg-white/[0.08]'
            : 'border-[var(--border)] text-white/30 hover:text-white/50 hover:border-[var(--border-hover)]'
        }`}
      >
        all
        <span
          className={`text-[9px] tabular-nums transition-colors ${
            activeTag === null ? 'text-white/40' : 'text-white/15 group-hover:text-white/25'
          }`}
        >
          {totalCount}
        </span>
      </button>
      {allTags.map((tag) => (
        <button
          key={tag}
          onClick={() => setTag(activeTag === tag ? null : tag)}
          aria-pressed={activeTag === tag}
          className={`group flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-[family-name:var(--font-mono)] uppercase tracking-wider border transition-colors ${
            activeTag === tag
              ? 'border-white/30 text-white/80 bg-white/[0.08]'
              : 'border-[var(--border)] text-white/30 hover:text-white/50 hover:border-[var(--border-hover)]'
          }`}
        >
          {tag}
          <span
            className={`text-[9px] tabular-nums transition-colors ${
              activeTag === tag ? 'text-white/40' : 'text-white/15 group-hover:text-white/25'
            }`}
          >
            {tagCounts[tag] ?? 0}
          </span>
        </button>
      ))}
    </div>
  )
}
