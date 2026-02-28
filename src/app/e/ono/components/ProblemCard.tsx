'use client'

import Link from 'next/link'
import {
  ONO,
  DIFFICULTY_LABELS,
  CATEGORY_LABELS,
  type Difficulty,
  type Category,
} from '@/lib/ono/constants'

interface ProblemCardProps {
  slug: string
  title: string
  description: string
  difficulty: Difficulty
  category: Category
  optimalLoc: number
  index: number
}

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  trivial: ONO.textMuted,
  easy: ONO.greenDim,
  medium: ONO.amberDim,
  hard: ONO.amber,
  legendary: ONO.red,
}

export function ProblemCard({
  slug,
  title,
  description,
  difficulty,
  category,
  optimalLoc,
  index,
}: ProblemCardProps) {
  return (
    <Link
      href={`/e/ono/problems/${slug}`}
      className="group block border transition-colors animate-fade-in-up"
      style={{
        borderColor: ONO.border,
        backgroundColor: ONO.surface,
        animationDelay: `${index * 50}ms`,
      }}
    >
      <div
        className="px-4 py-4 transition-colors"
        style={{ backgroundColor: 'transparent' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = ONO.surfaceHover
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        {/* Top row: difficulty badge + category */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest border px-1.5 py-0.5"
            style={{
              color: DIFFICULTY_COLORS[difficulty],
              borderColor: DIFFICULTY_COLORS[difficulty],
            }}
          >
            {DIFFICULTY_LABELS[difficulty]}
          </span>
          <span
            className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider"
            style={{ color: ONO.textMuted }}
          >
            {CATEGORY_LABELS[category]}
          </span>
        </div>

        {/* Title */}
        <h3
          className="font-[family-name:var(--font-display)] text-lg group-hover:opacity-90 transition-opacity"
          style={{ color: ONO.textPrimary }}
        >
          {title}
        </h3>

        {/* Description snippet */}
        <p
          className="mt-1 text-sm leading-relaxed line-clamp-2 font-[family-name:var(--font-body)]"
          style={{ color: ONO.textSecondary }}
        >
          {description.replace(/`/g, '')}
        </p>

        {/* Footer: optimal LOC */}
        <div className="mt-3 flex items-center gap-3">
          <span
            className="font-[family-name:var(--font-mono)] text-[11px]"
            style={{ color: ONO.textMuted }}
          >
            Optimal: {optimalLoc} LOC
          </span>
          <span
            className="font-[family-name:var(--font-mono)] text-[11px]"
            style={{ color: ONO.amberDim }}
          >
            Can you do worse? &rarr;
          </span>
        </div>
      </div>
    </Link>
  )
}
