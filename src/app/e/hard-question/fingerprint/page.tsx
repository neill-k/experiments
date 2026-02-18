'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { AuthButtons } from '@/components/AuthButtons'
import { useFingerprint } from '../hooks/useFingerprint'
import { FingerprintChart } from '../components/FingerprintChart'
import { SchoolTag } from '../components/SchoolTag'
import { getSchoolLabel, getSchoolDescription } from '../lib/school-colors'
import type { PhilosophicalFingerprint, PhilosophySchool } from '../lib/types'

/** Build a fingerprint from sessionStorage matches (anonymous users) */
function useSessionFingerprint(): PhilosophicalFingerprint[] {
  const [fingerprint, setFingerprint] = useState<PhilosophicalFingerprint[]>([])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('hq_session_matches')
      if (!raw) return
      const matches: { school: string; similarity: number }[] = JSON.parse(raw)
      if (!matches.length) return

      // Aggregate by school
      const bySchool = new Map<string, number[]>()
      for (const m of matches) {
        const arr = bySchool.get(m.school) || []
        arr.push(m.similarity)
        bySchool.set(m.school, arr)
      }

      const result: PhilosophicalFingerprint[] = []
      for (const [school, scores] of bySchool) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length
        result.push({
          id: school,
          user_id: 'session',
          school: school as PhilosophySchool,
          avg_score: avg,
          sample_count: scores.length,
          min_score: Math.min(...scores),
          max_score: Math.max(...scores),
          recent_avg: avg,
        })
      }
      setFingerprint(result)
    } catch {
      // sessionStorage unavailable
    }
  }, [])

  return fingerprint
}

export default function FingerprintPage() {
  const { userId, loading: authLoading } = useAuth()
  const { data, loading, error } = useFingerprint()
  const sessionFingerprint = useSessionFingerprint()

  // Determine which fingerprint to show
  const fingerprint = useMemo(() => {
    // Prefer server data if available and non-empty
    if (data?.fingerprint && data.fingerprint.length > 0) {
      return data.fingerprint
    }
    // Fall back to session-based fingerprint
    return sessionFingerprint
  }, [data, sessionFingerprint])

  const totalAnswers = data?.total_answers ?? (sessionFingerprint.length > 0 ? 1 : 0)
  const isSessionOnly = !data?.fingerprint?.length && sessionFingerprint.length > 0

  // Loading
  if (loading || authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p
          className="text-sm"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
        >
          Loading...
        </p>
      </div>
    )
  }

  // Error
  if (error && !sessionFingerprint.length) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <p
          className="text-sm"
          style={{ fontFamily: 'var(--font-mono)', color: '#C47878' }}
        >
          {error}
        </p>
      </div>
    )
  }

  // Sort by avg_score for top schools
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
          color: 'var(--muted)',
        }}
      >
        ← Back to today&apos;s question
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
        Your Philosophical DNA
      </h1>

      <p
        className="mb-12 text-sm"
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--muted)',
        }}
      >
        {totalAnswers > 0
          ? `Based on ${totalAnswers} answer${totalAnswers !== 1 ? 's' : ''}`
          : 'Answer questions to build your profile'}
      </p>

      {fingerprint.length === 0 ? (
        <div className="py-12 text-center">
          <p
            className="text-sm"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--muted)' }}
          >
            Answer some questions to build your philosophical fingerprint.
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
              className="mb-8 p-4"
              style={{
                backgroundColor: '#111114',
                border: '1px solid var(--border)',
              }}
            >
              <p
                className="mb-2 text-sm"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--muted)' }}
              >
                This is based on your current session only. Sign in to save your answers
                and build a fingerprint over time.
              </p>
              <AuthButtons />
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
              Your Top Schools
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {top3.map((school, i) => (
                <div
                  key={school.school}
                  className="p-5"
                  style={{
                    backgroundColor: '#161619',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className="text-2xl font-light"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--muted)',
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
                        color: 'var(--muted)',
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
                        color: 'var(--muted)',
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
                All Schools
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
                          color: 'var(--muted)',
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
                          color: 'var(--muted)',
                          opacity: 0.7,
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
    </div>
  )
}
