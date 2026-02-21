'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ExperimentNav } from '@/components/ExperimentNav'
import { useAuth } from '@/hooks/useAuth'
import { useArchive } from '../hooks/useArchive'
import { getSessionPracticeStatus } from '../lib/session-fingerprint-store'
import { HQ_HELPER_TEXT, HQ_HELPER_TEXT_SOFT, HQ_HELPER_TEXT_SUBTLE } from '../lib/ui-colors'

function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00Z`)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export default function ArchivePage() {
  const { userId, loading: authLoading } = useAuth()
  const [page, setPage] = useState(1)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [showAnsweredOnly, setShowAnsweredOnly] = useState(false)
  const [sessionPractice, setSessionPractice] = useState(() => getSessionPracticeStatus())

  const { data, loading, error } = useArchive(page, 20)

  useEffect(() => {
    setSessionPractice(getSessionPracticeStatus())
  }, [page])

  // Extract unique categories from loaded questions.
  const categories = useMemo(() => {
    if (!data?.questions) return []
    const cats = new Set(data.questions.map((q) => q.category).filter(Boolean))
    return Array.from(cats).sort()
  }, [data])

  // Filter questions by selected category and answered status (client-side within current page).
  const filteredQuestions = useMemo(() => {
    if (!data?.questions) return []

    return data.questions.filter((q) => {
      if (activeCategory && q.category !== activeCategory) return false
      if (showAnsweredOnly && !q.has_answered) return false
      return true
    })
  }, [data, activeCategory, showAnsweredOnly])

  const practiceAvailable = userId
    ? (data?.practice?.available ?? true)
    : sessionPractice.available

  const practiceUsedQuestionId = userId
    ? (data?.practice?.used_question_id ?? null)
    : sessionPractice.used_question_id

  function handlePageChange(nextPage: number) {
    setActiveCategory(null)
    setShowAnsweredOnly(false)
    setPage(nextPage)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {/* Back link */}
      <Link
        href="/e/hard-question"
        className="mb-8 inline-block text-xs transition-colors"
        style={{
          fontFamily: 'var(--font-mono)',
          color: HQ_HELPER_TEXT_SOFT,
        }}
      >
        &larr; Back to questions
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
        className="mb-2 text-sm"
        style={{
          fontFamily: 'var(--font-mono)',
          color: HQ_HELPER_TEXT,
        }}
      >
        {data ? `${data.total} past question${data.total !== 1 ? 's' : ''}` : 'Loading...'}
      </p>

      <p
        className="mb-6 text-xs leading-relaxed"
        style={{
          fontFamily: 'var(--font-body)',
          color: practiceAvailable ? HQ_HELPER_TEXT_SOFT : HQ_HELPER_TEXT,
        }}
      >
        {practiceAvailable
          ? 'Practice Mode unlocks one extra unranked archive question per day.'
          : practiceUsedQuestionId
            ? 'Practice Mode already used today. Ranked history is still reviewable.'
            : 'Practice Mode already used in this session. Come back tomorrow for another run.'}
      </p>

      {/* Filters */}
      {!loading && !authLoading && (categories.length > 1 || userId) && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
              <button
                onClick={() => setActiveCategory(null)}
                className="px-2.5 py-1 text-[10px] uppercase tracking-widest transition-colors"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: !activeCategory ? 'var(--fg)' : HQ_HELPER_TEXT_SUBTLE,
                  border: `1px solid ${!activeCategory ? 'rgba(255, 255, 255, 0.28)' : 'var(--border)'}`,
                  backgroundColor: !activeCategory ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                }}
              >
                All
              </button>
              {categories.map((cat) => {
                const isActive = activeCategory === cat
                const count = data?.questions.filter((q) => q.category === cat).length ?? 0
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(isActive ? null : cat)}
                    className="px-2.5 py-1 text-[10px] uppercase tracking-widest transition-colors"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: isActive ? 'var(--fg)' : HQ_HELPER_TEXT_SUBTLE,
                      border: `1px solid ${isActive ? 'rgba(255, 255, 255, 0.28)' : 'var(--border)'}`,
                      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                    }}
                  >
                    {cat}
                    <span
                      className="ml-1.5"
                      style={{
                        fontSize: '9px',
                        color: HQ_HELPER_TEXT_SUBTLE,
                      }}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {userId && (
            <button
              onClick={() => setShowAnsweredOnly((v) => !v)}
              className="px-2.5 py-1 text-[10px] uppercase tracking-widest transition-colors"
              style={{
                fontFamily: 'var(--font-mono)',
                color: showAnsweredOnly ? 'rgba(155, 224, 170, 0.95)' : HQ_HELPER_TEXT_SUBTLE,
                border: `1px solid ${showAnsweredOnly ? 'rgba(155, 224, 170, 0.5)' : 'var(--border)'}`,
                backgroundColor: showAnsweredOnly ? 'rgba(120, 200, 140, 0.1)' : 'transparent',
              }}
              aria-pressed={showAnsweredOnly}
              title="Show only questions you've answered"
            >
              Answered only
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6">
          <p
            className="text-sm"
            style={{ fontFamily: 'var(--font-mono)', color: '#D08E8E' }}
          >
            {error}
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {(loading || authLoading) && (
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
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
              />
              <div
                className="h-3 w-1/4"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Question list */}
      {!loading && !authLoading && data && filteredQuestions.length > 0 && (
        <>
          <div className="space-y-2">
            {filteredQuestions.map((q) => {
              const practiceLocked = !q.has_answered && !practiceAvailable
              const ctaHref = q.has_answered
                ? `/e/hard-question?question=${q.id}`
                : `/e/hard-question?question=${q.id}&mode=practice`

              return (
                <div
                  key={q.id}
                  className="group border p-4"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderColor: 'var(--border)',
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
                            backgroundColor: 'rgba(120, 200, 140, 0.78)',
                          }}
                        />
                      ) : (
                        <span
                          className="inline-block h-2 w-2"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.16)',
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
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <span
                          className="text-[11px]"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            color: HQ_HELPER_TEXT_SOFT,
                          }}
                        >
                          {formatDate(q.published_date)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveCategory(
                              activeCategory === q.category ? null : q.category
                            )
                          }}
                          className="text-[10px] uppercase tracking-widest transition-colors hover:text-white/80"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            color:
                              activeCategory === q.category
                                ? HQ_HELPER_TEXT
                                : HQ_HELPER_TEXT_SUBTLE,
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                          }}
                          title={`Filter by ${q.category}`}
                        >
                          {q.category}
                        </button>
                        {q.difficulty && (
                          <span
                            className="border px-1.5 py-0.5 text-[9px] uppercase tracking-widest"
                            style={{
                              fontFamily: 'var(--font-mono)',
                              color: HQ_HELPER_TEXT_SUBTLE,
                              borderColor: 'rgba(255, 255, 255, 0.2)',
                              backgroundColor: 'rgba(255, 255, 255, 0.04)',
                            }}
                            title="Question difficulty"
                          >
                            {q.difficulty}
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {q.has_answered ? (
                          <Link
                            href={ctaHref}
                            className="border px-3 py-1.5 text-[11px] uppercase tracking-widest transition-colors"
                            style={{
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--fg)',
                              borderColor: 'var(--border)',
                              backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            }}
                          >
                            Review your reveal
                          </Link>
                        ) : practiceLocked ? (
                          <span
                            className="border px-3 py-1.5 text-[11px] uppercase tracking-widest"
                            style={{
                              fontFamily: 'var(--font-mono)',
                              color: HQ_HELPER_TEXT_SUBTLE,
                              borderColor: 'var(--border)',
                              backgroundColor: 'rgba(255, 255, 255, 0.02)',
                            }}
                          >
                            Practice used today
                          </span>
                        ) : (
                          <Link
                            href={ctaHref}
                            className="border px-3 py-1.5 text-[11px] uppercase tracking-widest transition-colors"
                            style={{
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--fg)',
                              borderColor: 'var(--border-hover)',
                              backgroundColor: 'rgba(255, 255, 255, 0.04)',
                            }}
                          >
                            Play in Practice Mode
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Filtered count hint */}
          {(activeCategory || showAnsweredOnly) && (
            <p
              className="mt-3 text-[11px]"
              style={{
                fontFamily: 'var(--font-mono)',
                color: HQ_HELPER_TEXT_SUBTLE,
              }}
            >
              Showing {filteredQuestions.length} of {data.questions.length} on this page
            </p>
          )}

          {/* Pagination */}
          {data.total_pages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="text-xs transition-colors disabled:opacity-35"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: HQ_HELPER_TEXT_SOFT,
                  cursor: page <= 1 ? 'default' : 'pointer',
                }}
              >
                &larr; Newer
              </button>
              <span
                className="text-[11px]"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: HQ_HELPER_TEXT_SUBTLE,
                }}
              >
                {page} / {data.total_pages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= data.total_pages}
                className="text-xs transition-colors disabled:opacity-35"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: HQ_HELPER_TEXT_SOFT,
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
      {!loading && !authLoading && data && filteredQuestions.length === 0 && (
        <div className="py-12 text-center">
          <p
            className="text-sm"
            style={{ fontFamily: 'var(--font-body)', color: HQ_HELPER_TEXT }}
          >
            {activeCategory
              ? `No questions in "${activeCategory}" on this page.`
              : showAnsweredOnly
                ? 'No answered questions on this page yet.'
                : 'No past questions yet. Come back tomorrow.'}
          </p>
          {(activeCategory || showAnsweredOnly) && (
            <button
              onClick={() => {
                setActiveCategory(null)
                setShowAnsweredOnly(false)
              }}
              className="mt-3 text-xs transition-colors"
              style={{
                fontFamily: 'var(--font-mono)',
                color: HQ_HELPER_TEXT_SOFT,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Prev/Next experiment navigation */}
      <div className="mt-12">
        <ExperimentNav />
      </div>
    </div>
  )
}
