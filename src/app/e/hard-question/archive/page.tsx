'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { ExperimentNav } from '@/components/ExperimentNav'
import { fetchWithAuth } from '../lib/fetch-with-auth'

interface ArchiveQuestion {
  id: string
  question_text: string
  category: string
  difficulty: string
  published_date: string
  has_answered: boolean
}

interface ArchiveResponse {
  questions: ArchiveQuestion[]
  page: number
  per_page: number
  total: number
  total_pages: number
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00Z')
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export default function ArchivePage() {
  const { loading: authLoading } = useAuth()
  const [data, setData] = useState<ArchiveResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const fetchArchive = useCallback(async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchWithAuth(
        `/api/hard-question/archive?page=${p}&per_page=20`
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to load archive')
      }
      const json: ArchiveResponse = await res.json()
      setData(json)
      setPage(p)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading) {
      fetchArchive(1)
    }
  }, [authLoading, fetchArchive])

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {/* Back link */}
      <Link
        href="/e/hard-question"
        className="mb-8 inline-block text-xs transition-colors"
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--muted)',
        }}
      >
        &larr; Back to today&apos;s question
      </Link>

      {/* Header */}
      <h1
        className="mb-2 text-4xl md:text-5xl"
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--fg)',
          fontWeight: 400,
        }}
      >
        Archive
      </h1>

      <p
        className="mb-10 text-sm"
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--muted)',
        }}
      >
        {data ? `${data.total} past question${data.total !== 1 ? 's' : ''}` : 'Loading...'}
      </p>

      {/* Error */}
      {error && (
        <div className="mb-6">
          <p
            className="text-sm"
            style={{ fontFamily: 'var(--font-mono)', color: '#C47878' }}
          >
            {error}
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse p-4"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border)',
              }}
            >
              <div
                className="mb-2 h-5 w-3/4"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              />
              <div
                className="h-3 w-1/4"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Question list */}
      {!loading && data && data.questions.length > 0 && (
        <>
          <div className="space-y-2">
            {data.questions.map((q) => (
              <div
                key={q.id}
                className="group p-4 transition-colors"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Answered indicator */}
                  <div className="mt-1 shrink-0">
                    {q.has_answered ? (
                      <span
                        title="You answered this one"
                        className="inline-block h-2 w-2"
                        style={{
                          backgroundColor: 'rgba(120, 200, 140, 0.7)',
                          borderRadius: '1px',
                        }}
                      />
                    ) : (
                      <span
                        className="inline-block h-2 w-2"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          borderRadius: '1px',
                        }}
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className="text-sm leading-snug"
                      style={{
                        fontFamily: 'var(--font-display)',
                        color: 'var(--fg)',
                        fontSize: '1rem',
                      }}
                    >
                      {q.question_text}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <span
                        className="text-[11px]"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--muted)',
                        }}
                      >
                        {formatDate(q.published_date)}
                      </span>
                      <span
                        className="text-[10px] uppercase tracking-widest"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          color: 'rgba(255, 255, 255, 0.2)',
                        }}
                      >
                        {q.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data.total_pages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => fetchArchive(page - 1)}
                disabled={page <= 1}
                className="text-xs transition-colors disabled:opacity-20"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--muted)',
                  cursor: page <= 1 ? 'default' : 'pointer',
                }}
              >
                &larr; Newer
              </button>
              <span
                className="text-[11px]"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'rgba(255, 255, 255, 0.2)',
                }}
              >
                {page} / {data.total_pages}
              </span>
              <button
                onClick={() => fetchArchive(page + 1)}
                disabled={page >= data.total_pages}
                className="text-xs transition-colors disabled:opacity-20"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--muted)',
                  cursor: page >= data.total_pages ? 'default' : 'pointer',
                }}
              >
                Older &rarr;
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!loading && data && data.questions.length === 0 && (
        <div className="py-12 text-center">
          <p
            className="text-sm"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--muted)' }}
          >
            No past questions yet. Come back tomorrow.
          </p>
        </div>
      )}

      {/* Prev/Next experiment navigation */}
      <div className="mt-12">
        <ExperimentNav />
      </div>
    </div>
  )
}
