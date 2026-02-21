'use client'

import type { CSSProperties } from 'react'
import type { CorpusMatch } from '../lib/types'
import { HQ_HELPER_TEXT, HQ_HELPER_TEXT_SOFT } from '../lib/ui-colors'
import { SchoolTag } from './SchoolTag'

interface CorpusRevealProps {
  matches: CorpusMatch[]
  visible: boolean
}

function CorpusCard({ match, index }: { match: CorpusMatch; index: number }) {
  const targetPct = Math.round(match.similarity * 100)
  const barScale = Math.max(0, Math.min(1, match.similarity)).toFixed(3)

  const animationStyle = {
    '--entry-delay': `${index * 120 + 180}ms`,
    '--bar-delay': `${index * 120 + 360}ms`,
    '--bar-scale': barScale,
  } as CSSProperties

  // Truncate passage for display.
  const truncated =
    match.passage_text.length > 300
      ? `${match.passage_text.slice(0, 280).replace(/\s+\S*$/, '')}...`
      : match.passage_text

  return (
    <div
      className="corpus-card"
      style={{
        ...animationStyle,
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
          opacity: 0.84,
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
          color: HQ_HELPER_TEXT_SOFT,
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
            style={{ fontFamily: 'var(--font-mono)', color: HQ_HELPER_TEXT }}
          >
            Resonance estimate
          </span>
          <span
            className="text-xs font-medium"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg)' }}
          >
            {targetPct}%
          </span>
        </div>
        <div className="h-1 w-full" style={{ backgroundColor: 'var(--border)' }}>
          <div
            className="corpus-fill h-full"
            style={{
              backgroundColor: 'var(--fg)',
              opacity: 0.55,
            }}
          />
        </div>
      </div>

      <style jsx>{`
        .corpus-card {
          opacity: 0;
          transform: translateY(10px);
          animation: card-enter 0.5s ease-out var(--entry-delay) forwards;
        }

        .corpus-fill {
          transform-origin: left center;
          transform: scaleX(0);
          animation: fill-bar 0.8s cubic-bezier(0.16, 1, 0.3, 1) var(--bar-delay) forwards;
        }

        @keyframes card-enter {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fill-bar {
          to {
            transform: scaleX(var(--bar-scale));
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .corpus-card {
            animation: none;
            opacity: 1;
            transform: none;
          }

          .corpus-fill {
            animation: none;
            transform: scaleX(var(--bar-scale));
          }
        }
      `}</style>
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
        <div className="mb-6">
          <h3
            className="mb-1 text-xs uppercase tracking-widest"
            style={{
              fontFamily: 'var(--font-mono)',
              color: HQ_HELPER_TEXT_SOFT,
              letterSpacing: '0.15em',
            }}
          >
            From the library
          </h3>
          <p
            className="text-sm"
            style={{
              fontFamily: 'var(--font-body)',
              color: HQ_HELPER_TEXT,
            }}
          >
            Additional probabilistic resonance across 5,000+ passages from 20 philosophers.
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
