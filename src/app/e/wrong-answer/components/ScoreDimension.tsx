'use client'

import { useState, useEffect } from 'react'

function getDimensionColor(score: number, maxScore: number): string {
  const normalized = (score / maxScore) * 100
  if (normalized <= 20) return '#ff3333'
  if (normalized <= 40) return '#ff8833'
  if (normalized <= 60) return '#ffcc33'
  if (normalized <= 80) return '#33ff88'
  return '#ebebeb'
}

interface ScoreDimensionProps {
  label: string
  score: number
  maxScore: number
  delay?: number
}

export function ScoreDimension({ label, score, maxScore, delay = 0 }: ScoreDimensionProps) {
  const [visible, setVisible] = useState(false)
  const [filled, setFilled] = useState(false)
  const color = getDimensionColor(score, maxScore)
  const percentage = (score / maxScore) * 100

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), delay)
    const fillTimer = setTimeout(() => setFilled(true), delay + 100)
    return () => {
      clearTimeout(showTimer)
      clearTimeout(fillTimer)
    }
  }, [delay])

  return (
    <div
      className="transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(3)',
      }}
    >
      {/* Label and score */}
      <div className="flex items-baseline justify-between mb-1">
        <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[#ebebeb]/60">
          {label}
        </span>
        <span
          className="font-[family-name:var(--font-mono)] text-lg font-bold"
          style={{ color }}
        >
          {score}/{maxScore}
        </span>
      </div>

      {/* Bar */}
      <div className="h-2 bg-[#ebebeb]/10 w-full">
        <div
          className="h-full transition-all duration-600 ease-out"
          style={{
            width: filled ? `${percentage}%` : '0%',
            backgroundColor: color,
            transitionDuration: '600ms',
          }}
        />
      </div>
    </div>
  )
}
