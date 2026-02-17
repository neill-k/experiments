'use client'

import type { PerspectiveMatch } from '../lib/types'
import { PhilosopherCard } from './PhilosopherCard'
import { ShareResult } from './ShareResult'

interface PhilosopherRevealProps {
  matches: (PerspectiveMatch & { source?: string })[]
  visible: boolean
  dayNumber?: number
}

export function PhilosopherReveal({ matches, visible, dayNumber }: PhilosopherRevealProps) {
  if (!visible || matches.length === 0) return null

  const topMatch = matches[0]

  return (
    <div className="px-4 py-8">
      <div className="max-w-3xl">
        {/* Header */}
        <h2
          className="reveal-header mb-8"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            color: 'var(--fg)',
            fontWeight: 400,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
          }}
        >
          You think like{' '}
          <span style={{ color: 'var(--fg)', opacity: 1 }}>
            {topMatch.philosopher_name}
          </span>
        </h2>

        {/* Cards */}
        <div className="flex flex-col gap-4">
          {matches.map((match, i) => (
            <PhilosopherCard
              key={match.perspective_id}
              match={match}
              index={i}
              isTopMatch={i === 0}
            />
          ))}
        </div>

        {/* Share button */}
        {dayNumber != null && (
          <div
            className="mt-6"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.5s ease-out 0.8s, transform 0.5s ease-out 0.8s',
            }}
          >
            <ShareResult matches={matches} dayNumber={dayNumber} />
          </div>
        )}
      </div>
    </div>
  )
}
