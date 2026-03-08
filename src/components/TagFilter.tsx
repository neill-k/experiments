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
  const normalizedActiveTag = activeTag?.toLowerCase() ?? null

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
        aria-label={`Show all experiments (${totalCount})`}
        aria-pressed={normalizedActiveTag === null}
        className={`group flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-[family-name:var(--font-mono)] uppercase tracking-wider border transition-colors ${
          normalizedActiveTag === null
            ? 'border-[var(--fg)]/20 text-[var(--fg)]/70 bg-[var(--fg)]/[0.06]'
            : 'border-[var(--border)] text-[var(--fg)]/30 hover:text-[var(--fg)]/50 hover:border-[var(--border-hover)]'
        }`}
      >
        all
        <span
          className={`text-[9px] tabular-nums transition-colors ${
            normalizedActiveTag === null ? 'text-[var(--fg)]/35' : 'text-[var(--fg)]/15 group-hover:text-[var(--fg)]/25'
          }`}
        >
          {totalCount}
        </span>
      </button>
      {allTags.map((tag) => (
        <button
          key={tag}
          onClick={() => setTag(normalizedActiveTag === tag ? null : tag)}
          aria-label={
            normalizedActiveTag === tag
              ? `Clear ${tag} filter and show all experiments`
              : `Filter by ${tag} (${tagCounts[tag] ?? 0} experiments)`
          }
          aria-pressed={normalizedActiveTag === tag}
          className={`group flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-[family-name:var(--font-mono)] uppercase tracking-wider border transition-colors ${
            normalizedActiveTag === tag
              ? 'border-[var(--fg)]/20 text-[var(--fg)]/70 bg-[var(--fg)]/[0.06]'
              : 'border-[var(--border)] text-[var(--fg)]/30 hover:text-[var(--fg)]/50 hover:border-[var(--border-hover)]'
          }`}
        >
          {tag}
          <span
            className={`text-[9px] tabular-nums transition-colors ${
              normalizedActiveTag === tag ? 'text-[var(--fg)]/35' : 'text-[var(--fg)]/15 group-hover:text-[var(--fg)]/25'
            }`}
          >
            {tagCounts[tag] ?? 0}
          </span>
        </button>
      ))}
    </div>
  )
}
