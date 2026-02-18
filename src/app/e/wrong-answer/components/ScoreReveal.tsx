'use client'

import { useState, useEffect } from 'react'
import type { AnswerResult } from '../lib/types'
import { getScoreColor, getScoreLabel, getScoreTier } from '../lib/score-colors'
import { ScoreDimension } from './ScoreDimension'

const DIMENSIONS: { key: keyof AnswerResult['scores']; label: string }[] = [
  { key: 'conviction', label: 'CONVICTION' },
  { key: 'consistency', label: 'CONSISTENCY' },
  { key: 'comedy', label: 'COMEDY' },
  { key: 'creativity', label: 'CREATIVITY' },
  { key: 'plausibility', label: 'PLAUSIBILITY' },
]

const JUDGING_DELAY = 2000
const STAGGER_DELAY = 300
const TOTAL_REVEAL_DELAY = JUDGING_DELAY + DIMENSIONS.length * STAGGER_DELAY + 200

export function ScoreReveal({ result }: { result: AnswerResult }) {
  const [phase, setPhase] = useState<'judging' | 'dimensions' | 'total'>('judging')
  const [showLabel, setShowLabel] = useState(false)
  const tier = getScoreTier(result.total_score)
  const isLegendary = tier === 'legendary'

  useEffect(() => {
    const dimTimer = setTimeout(() => setPhase('dimensions'), JUDGING_DELAY)
    const totalTimer = setTimeout(() => setPhase('total'), TOTAL_REVEAL_DELAY)
    const labelTimer = setTimeout(() => setShowLabel(true), TOTAL_REVEAL_DELAY + 400)
    return () => {
      clearTimeout(dimTimer)
      clearTimeout(totalTimer)
      clearTimeout(labelTimer)
    }
  }, [])

  return (
    <div className="relative">
      <style>{`
        @keyframes slam-in {
          0% { transform: scale(3); opacity: 0; }
          70% { transform: scale(0.95); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes screen-shake {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-4px, 2px); }
          20% { transform: translate(4px, -2px); }
          30% { transform: translate(-2px, 4px); }
          40% { transform: translate(2px, -4px); }
          50% { transform: translate(-4px, 0px); }
          60% { transform: translate(4px, 2px); }
          70% { transform: translate(-2px, -2px); }
          80% { transform: translate(2px, 4px); }
          90% { transform: translate(-4px, -4px); }
        }
        @keyframes rainbow-text {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Judging phase */}
      {phase === 'judging' && (
        <div className="flex items-center justify-center py-16">
          <span
            className="font-[family-name:var(--font-mono)] text-2xl uppercase tracking-widest text-[#ebebeb]"
            style={{ animation: 'pulse-glow 1s ease-in-out infinite' }}
          >
            JUDGING...
          </span>
        </div>
      )}

      {/* Dimensions + Total */}
      {phase !== 'judging' && (
        <div
          style={{
            animation: phase === 'total' ? 'screen-shake 0.2s ease-in-out' : undefined,
          }}
        >
          {/* Score dimensions */}
          <div className="space-y-4 mb-8">
            {DIMENSIONS.map((dim, i) => (
              <ScoreDimension
                key={dim.key}
                label={dim.label}
                score={result.scores[dim.key]}
                maxScore={20}
                delay={i * STAGGER_DELAY}
              />
            ))}
          </div>

          {/* Total score */}
          {phase === 'total' && (
            <div className="text-center border-t-2 border-[#ebebeb]/20 pt-8">
              <span className="block font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#ebebeb]/40 mb-2">
                TOTAL SCORE
              </span>
              <span
                className="block font-[family-name:var(--font-mono)] text-6xl sm:text-7xl font-bold"
                style={{
                  animation: `slam-in 0.4s cubic-bezier(0.16, 1, 0.3, 1)${isLegendary ? ', rainbow-text 2s linear infinite' : ''}`,
                  color: isLegendary ? '#ff3333' : getScoreColor(result.total_score),
                }}
              >
                {result.total_score}
              </span>

              {/* Grade label */}
              <span
                className="block font-[family-name:var(--font-mono)] text-lg uppercase tracking-[0.3em] mt-4 transition-opacity duration-500"
                style={{
                  color: getScoreColor(result.total_score),
                  opacity: showLabel ? 1 : 0,
                }}
              >
                {getScoreLabel(result.total_score)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
