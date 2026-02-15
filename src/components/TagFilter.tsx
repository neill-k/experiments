'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export function TagFilter({ allTags }: { allTags: string[] }) {
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
      router.push(`/?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  return (
    <div className="mt-8 flex flex-wrap items-center gap-2">
      <button
        onClick={() => setTag(null)}
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
          onClick={() => setTag(activeTag === tag ? null : tag)}
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
  )
}
