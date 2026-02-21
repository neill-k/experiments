'use client'

import type { CSSProperties } from 'react'
import type { PerspectiveMatch } from '../lib/types'
import { HQ_HELPER_TEXT, HQ_HELPER_TEXT_SOFT } from '../lib/ui-colors'
import { SchoolTag } from './SchoolTag'
import { getSchoolDescription } from '../lib/school-colors'

interface PhilosopherCardProps {
  match: PerspectiveMatch & { source?: string | null }
  index: number
  isTopMatch: boolean
}

export function PhilosopherCard({ match, index, isTopMatch }: PhilosopherCardProps) {
  const targetPct = Math.round(match.similarity * 100)
  const barScale = Math.max(0, Math.min(1, match.similarity)).toFixed(3)

  const animatedStyle = {
    '--entry-delay': `${index * 120}ms`,
    '--bar-delay': `${index * 120 + 180}ms`,
    '--bar-scale': barScale,
  } as CSSProperties

  return (
    <div
      className="philosopher-card"
      style={{
        ...animatedStyle,
        backgroundColor: '#161619',
        border: `1px solid ${isTopMatch ? 'var(--border-hover)' : 'var(--border)'}`,
        padding: '1.25rem 1.5rem',
      }}
    >
      {/* Header: name + school */}
      <div className="mb-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <h3
            className="text-xl"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--fg)',
            }}
          >
            {match.philosopher_name}
          </h3>
          <SchoolTag school={match.school} />
        </div>
        {getSchoolDescription(match.school) && (
          <p
            className="mt-1 text-[11px]"
            style={{
              fontFamily: 'var(--font-body)',
              color: HQ_HELPER_TEXT,
            }}
          >
            {getSchoolDescription(match.school)}
          </p>
        )}
      </div>

      {/* Perspective quote */}
      <p
        className="mb-2 leading-relaxed"
        style={{
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          color: 'var(--fg)',
          opacity: 0.88,
          fontSize: '0.95rem',
        }}
      >
        &ldquo;{match.perspective_text}&rdquo;
      </p>

      {/* Source citation */}
      {match.source && (
        <p
          className="mb-4 text-xs"
          style={{
            fontFamily: 'var(--font-mono)',
            color: HQ_HELPER_TEXT_SOFT,
          }}
        >
          — {match.source}
        </p>
      )}

      {/* Similarity bar */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between">
          <span
            className="text-xs"
            style={{
              fontFamily: 'var(--font-mono)',
              color: HQ_HELPER_TEXT,
            }}
          >
            Alignment estimate
          </span>
          <span
            className="text-sm font-medium"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--fg)',
            }}
          >
            {targetPct}%
          </span>
        </div>
        <div className="h-1.5 w-full" style={{ backgroundColor: 'var(--border)' }}>
          <div
            className="alignment-fill h-full"
            style={{
              backgroundColor: 'var(--fg)',
              opacity: 0.7,
            }}
          />
        </div>
      </div>

      <style jsx>{`
        .philosopher-card {
          opacity: 0;
          transform: translateY(10px);
          animation: card-enter 0.5s ease-out var(--entry-delay) forwards;
        }

        .alignment-fill {
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
          .philosopher-card {
            animation: none;
            opacity: 1;
            transform: none;
          }

          .alignment-fill {
            animation: none;
            transform: scaleX(var(--bar-scale));
          }
        }
      `}</style>
    </div>
  )
}
