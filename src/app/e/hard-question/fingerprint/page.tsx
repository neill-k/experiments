'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AuthButtons } from '@/components/AuthButtons'
import { ExperimentNav } from '@/components/ExperimentNav'
import { useAuth } from '@/hooks/useAuth'
import { FingerprintChart } from '../components/FingerprintChart'
import { SchoolTag } from '../components/SchoolTag'
import { useFingerprint } from '../hooks/useFingerprint'
import {
  buildSessionFingerprint,
  clearSessionFingerprintEntries,
  getSessionFingerprintEntries,
} from '../lib/session-fingerprint-store'
import { getSchoolDescription, getSchoolLabel } from '../lib/school-colors'
import { HQ_HELPER_TEXT, HQ_HELPER_TEXT_SOFT } from '../lib/ui-colors'
import type { PhilosophicalFingerprint } from '../lib/types'

function useSessionFingerprint() {
  const [fingerprint, setFingerprint] = useState<PhilosophicalFingerprint[]>([])
  const [answerCount, setAnswerCount] = useState(0)

  const refresh = useCallback(() => {
    const nextFingerprint = buildSessionFingerprint()
    const entries = getSessionFingerprintEntries()
    const uniqueAnswerKeys = new Set(entries.map((entry) => entry.answer_key))

    setFingerprint(nextFingerprint)
    setAnswerCount(uniqueAnswerKeys.size)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const clear = useCallback(() => {
    clearSessionFingerprintEntries()
    refresh()
  }, [refresh])

  return {
    fingerprint,
    answerCount,
    refresh,
    clear,
  }
}

export default function FingerprintPage() {
  const { loading: authLoading } = useAuth()
  const { data, loading, error } = useFingerprint()
  const session = useSessionFingerprint()

  // Determine which fingerprint to show.
  const fingerprint = useMemo(() => {
    if (data?.fingerprint && data.fingerprint.length > 0) {
      return data.fingerprint
    }

    return session.fingerprint
  }, [data, session.fingerprint])

  const totalAnswers = data?.total_answers ?? session.answerCount
  const isSessionOnly = !data?.fingerprint?.length && session.fingerprint.length > 0

  const handleClearSessionFingerprint = useCallback(() => {
    if (
      typeof window !== 'undefined' &&
      !window.confirm('Clear session-only fingerprint data from this browser?')
    ) {
      return
    }

    session.clear()
  }, [session])

  // Loading
  if (loading || authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p
          className="text-sm"
          style={{ fontFamily: 'var(--font-mono)', color: HQ_HELPER_TEXT_SOFT }}
        >
          Loading...
        </p>
      </div>
    )
  }

  // Error
  if (error && !session.fingerprint.length) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <p
          className="text-sm"
          style={{ fontFamily: 'var(--font-mono)', color: '#D08E8E' }}
        >
          {error}
        </p>
      </div>
    )
  }

  // Sort by avg_score for top schools.
  const sorted = [...fingerprint]
    .filter((f) => f.sample_count > 0)
    .sort((a, b) => b.avg_score - a.avg_score)

  const top3 = sorted.slice(0, 3)

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
        ← Back to questions
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
        Your Alignment Pattern
      </h1>

      <p
        className="mb-3 text-sm"
        style={{
          fontFamily: 'var(--font-body)',
          color: HQ_HELPER_TEXT,
        }}
      >
        A running, probabilistic profile of which schools your answers align with most often.
      </p>

      <p
        className="mb-12 text-sm"
        style={{
          fontFamily: 'var(--font-mono)',
          color: HQ_HELPER_TEXT_SOFT,
        }}
      >
        {totalAnswers > 0
          ? `Based on ${totalAnswers} ranked answer${totalAnswers !== 1 ? 's' : ''}`
          : 'Answer ranked daily questions to build your profile'}
      </p>

      {fingerprint.length === 0 ? (
        <div className="py-12 text-center">
          <p
            className="text-sm"
            style={{ fontFamily: 'var(--font-body)', color: HQ_HELPER_TEXT }}
          >
            Answer some questions to build your philosophical alignment profile.
          </p>
          <Link
            href="/e/hard-question"
            className="mt-4 inline-block text-sm"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--fg)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            Go answer today&apos;s question →
          </Link>
        </div>
      ) : (
        <>
          {/* Radar chart */}
          <div className="mb-12">
            <FingerprintChart fingerprint={fingerprint} />
          </div>

          {/* Session-only notice */}
          {isSessionOnly && (
            <div
              className="mb-8 border p-4"
              style={{
                backgroundColor: '#111114',
                borderColor: 'var(--border)',
              }}
            >
              <p
                className="mb-2 text-sm"
                style={{ fontFamily: 'var(--font-body)', color: HQ_HELPER_TEXT }}
              >
                This view uses session-only data from this browser. Sign in to preserve ranked
                answers over time.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <AuthButtons />
                <button
                  type="button"
                  onClick={handleClearSessionFingerprint}
                  className="px-3 py-1.5 text-xs transition-colors"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: HQ_HELPER_TEXT_SOFT,
                    border: '1px solid var(--border)',
                  }}
                >
                  Clear session fingerprint
                </button>
              </div>
            </div>
          )}

          {/* Top 3 schools */}
          <div className="mb-12">
            <h2
              className="mb-6 text-lg"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--fg)',
              }}
            >
              Top schools right now
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {top3.map((school, i) => (
                <div
                  key={school.school}
                  className="border p-5"
                  style={{
                    backgroundColor: '#161619',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className="text-2xl font-light"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: HQ_HELPER_TEXT_SOFT,
                      }}
                    >
                      #{i + 1}
                    </span>
                  </div>
                  <h3
                    className="mb-1 text-xl"
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: 'var(--fg)',
                    }}
                  >
                    {getSchoolLabel(school.school)}
                  </h3>
                  <SchoolTag school={school.school} />
                  {getSchoolDescription(school.school) && (
                    <p
                      className="mt-2 text-xs leading-relaxed"
                      style={{
                        fontFamily: 'var(--font-body)',
                        color: HQ_HELPER_TEXT,
                      }}
                    >
                      {getSchoolDescription(school.school)}
                    </p>
                  )}
                  <div className="mt-3">
                    <span
                      className="text-2xl"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--fg)',
                      }}
                    >
                      {Math.round(school.avg_score * 100)}%
                    </span>
                    <span
                      className="ml-2 text-xs"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: HQ_HELPER_TEXT_SOFT,
                      }}
                    >
                      avg · {school.sample_count} match{school.sample_count !== 1 ? 'es' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All schools list */}
          {sorted.length > 3 && (
            <div>
              <h2
                className="mb-4 text-lg"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--fg)',
                }}
              >
                All schools
              </h2>
              <div className="flex flex-col gap-2">
                {sorted.slice(3).map((school) => (
                  <div
                    key={school.school}
                    className="py-2"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className="text-sm"
                          style={{
                            fontFamily: 'var(--font-body)',
                            color: 'var(--fg)',
                          }}
                        >
                          {getSchoolLabel(school.school)}
                        </span>
                        <SchoolTag school={school.school} />
                      </div>
                      <span
                        className="text-sm"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          color: HQ_HELPER_TEXT_SOFT,
                        }}
                      >
                        {Math.round(school.avg_score * 100)}%
                      </span>
                    </div>
                    {getSchoolDescription(school.school) && (
                      <p
                        className="mt-1 text-[11px] leading-relaxed"
                        style={{
                          fontFamily: 'var(--font-body)',
                          color: HQ_HELPER_TEXT,
                        }}
                      >
                        {getSchoolDescription(school.school)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Prev/Next experiment navigation */}
      <div className="mt-12">
        <ExperimentNav />
      </div>
    </div>
  )
}
