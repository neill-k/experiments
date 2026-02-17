'use client'

import { useEffect, useState, useRef } from 'react'
import type { PerspectiveMatch } from '../lib/types'
import { SchoolTag } from './SchoolTag'

interface PhilosopherCardProps {
  match: PerspectiveMatch & { source?: string }
  index: number
  isTopMatch: boolean
}

export function PhilosopherCard({ match, index, isTopMatch }: PhilosopherCardProps) {
  const [animatedPct, setAnimatedPct] = useState(0)
  const [barWidth, setBarWidth] = useState(0)
  const [visible, setVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const targetPct = Math.round(match.similarity * 100)

  // Trigger visibility after stagger delay
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 150)
    return () => clearTimeout(timer)
  }, [index])

  // Animate percentage counter and bar
  useEffect(() => {
    if (!visible) return
    const duration = 800
    const startTime = performance.now()

    function animate(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimatedPct(Math.round(eased * targetPct))
      setBarWidth(eased * targetPct)
      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [visible, targetPct])

  return (
    <div
      ref={cardRef}
      className="philosopher-card"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
        backgroundColor: '#161619',
        border: `1px solid ${isTopMatch ? 'var(--border-hover)' : 'var(--border)'}`,
        padding: '1.25rem 1.5rem',
      }}
    >
      {/* Header: name + school */}
      <div className="mb-3 flex items-center gap-3">
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

      {/* Perspective quote */}
      <p
        className="mb-2 leading-relaxed"
        style={{
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          color: 'var(--fg)',
          opacity: 0.85,
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
            color: 'var(--muted)',
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
              color: 'var(--muted)',
            }}
          >
            Alignment
          </span>
          <span
            className="text-sm font-medium"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--fg)',
            }}
          >
            {animatedPct}%
          </span>
        </div>
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: 'var(--border)' }}
        >
          <div
            className="h-full transition-none"
            style={{
              width: `${barWidth}%`,
              backgroundColor: 'var(--fg)',
              opacity: 0.7,
            }}
          />
        </div>
      </div>
    </div>
  )
}
