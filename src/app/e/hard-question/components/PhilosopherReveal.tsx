'use client'

import type { PerspectiveMatch } from '../lib/types'
import { HQ_HELPER_TEXT, HQ_HELPER_TEXT_SOFT } from '../lib/ui-colors'
import { PhilosopherCard } from './PhilosopherCard'
import { ShareResult } from './ShareResult'

interface PhilosopherRevealProps {
  matches: (PerspectiveMatch & { source?: string | null })[]
  visible: boolean
  dayNumber?: number
  practiceMode?: boolean
}

export function PhilosopherReveal({
  matches,
  visible,
  dayNumber,
  practiceMode = false,
}: PhilosopherRevealProps) {
  if (!visible || matches.length === 0) return null

  const topMatch = matches[0]

  return (
    <div className="px-4 py-8">
      <div className="max-w-3xl">
        {/* Header */}
        <h2
          className="reveal-header"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.5rem, 4vw, 2.35rem)',
            color: 'var(--fg)',
            fontWeight: 400,
          }}
        >
          Closest alignment: <span>{topMatch.philosopher_name}</span>
        </h2>

        <p
          className="mt-2 mb-7 text-sm leading-relaxed"
          style={{
            fontFamily: 'var(--font-body)',
            color: HQ_HELPER_TEXT,
          }}
        >
          This is a probabilistic semantic match, not an identity label.
          {practiceMode ? ' Practice runs are unranked and excluded from long-term fingerprinting.' : ''}
        </p>

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
          <div className="mt-6" style={{ color: HQ_HELPER_TEXT_SOFT }}>
            <ShareResult matches={matches} dayNumber={dayNumber} />
          </div>
        )}
      </div>
    </div>
  )
}
