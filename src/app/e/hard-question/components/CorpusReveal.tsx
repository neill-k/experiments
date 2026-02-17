'use client'

import { useEffect, useState } from 'react'
import type { CorpusMatch } from '../lib/types'
import { SchoolTag } from './SchoolTag'

interface CorpusRevealProps {
  matches: CorpusMatch[]
  visible: boolean
}

function CorpusCard({ match, index }: { match: CorpusMatch; index: number }) {
  const [visible, setVisible] = useState(false)
  const [animatedPct, setAnimatedPct] = useState(0)
  const [barWidth, setBarWidth] = useState(0)

  const targetPct = Math.round(match.similarity * 100)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 150 + 300)
    return () => clearTimeout(timer)
  }, [index])

  useEffect(() => {
    if (!visible) return
    const duration = 800
    const startTime = performance.now()

    function animate(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimatedPct(Math.round(eased * targetPct))
      setBarWidth(eased * targetPct)
      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [visible, targetPct])

  // Truncate passage for display (show first ~200 chars)
  const truncated =
    match.passage_text.length > 300
      ? match.passage_text.slice(0, 280).replace(/\s+\S*$/, '') + '...'
      : match.passage_text

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
        backgroundColor: '#111114',
        border: '1px solid var(--border)',
        padding: '1rem 1.25rem',
      }}
    >
      {/* Header */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span
          className="text-base"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--fg)',
          }}
        >
          {match.philosopher}
        </span>
        <SchoolTag school={match.school} />
      </div>

      {/* Passage */}
      <p
        className="mb-1.5 leading-relaxed"
        style={{
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          color: 'var(--fg)',
          opacity: 0.8,
          fontSize: '0.875rem',
        }}
      >
        &ldquo;{truncated}&rdquo;
      </p>

      {/* Source */}
      <p
        className="mb-3 text-xs"
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--muted)',
        }}
      >
        {match.work}
        {match.section ? `, ${match.section}` : ''}
      </p>

      {/* Similarity bar */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span
            className="text-xs"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
          >
            Resonance
          </span>
          <span
            className="text-xs font-medium"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg)' }}
          >
            {animatedPct}%
          </span>
        </div>
        <div className="h-1 w-full" style={{ backgroundColor: 'var(--border)' }}>
          <div
            className="h-full transition-none"
            style={{
              width: `${barWidth}%`,
              backgroundColor: 'var(--fg)',
              opacity: 0.5,
            }}
          />
        </div>
      </div>
    </div>
  )
}

export function CorpusReveal({ matches, visible }: CorpusRevealProps) {
  if (!visible || matches.length === 0) return null

  // Sort by similarity descending
  const sorted = [...matches].sort((a, b) => b.similarity - a.similarity)

  return (
    <div className="px-4 py-6">
      <div className="max-w-3xl">
        {/* Section header */}
        <div
          className="mb-6"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.6s ease-out 0.2s, transform 0.6s ease-out 0.2s',
          }}
        >
          <h3
            className="mb-1 text-xs uppercase tracking-widest"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--muted)',
              letterSpacing: '0.15em',
            }}
          >
            From the library
          </h3>
          <p
            className="text-sm"
            style={{
              fontFamily: 'var(--font-body)',
              color: 'var(--muted)',
            }}
          >
            Your answer matched these passages across 5,000+ excerpts from 20 philosophers.
          </p>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-3">
          {sorted.map((match, i) => (
            <CorpusCard key={match.corpus_id} match={match} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
