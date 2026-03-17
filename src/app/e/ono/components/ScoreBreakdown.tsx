'use client'

import { ONO, getScoreTier } from '@/lib/ono/constants'

interface ScoreBreakdownProps {
  total: number
  computationalWaste: number
  overengineering: number
  stylePoints: number
  details?: {
    timeRatio: number
    memoryRatio: number
    locRatio: number
    functionBonus: number
    classBonus: number
    importBonus: number
    namingScore: number
    commentScore: number
  }
  compact?: boolean
}

export function ScoreBreakdown({
  total,
  computationalWaste,
  overengineering,
  stylePoints,
  details,
  compact = false,
}: ScoreBreakdownProps) {
  const tier = getScoreTier(total)

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <span
          className="font-[family-name:var(--font-mono)] text-lg font-bold"
          style={{ color: tier.color }}
        >
          {total.toFixed(1)}
        </span>
        <span
          className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest border px-1.5 py-0.5"
          style={{ color: tier.color, borderColor: tier.color }}
        >
          {tier.label}
        </span>
      </div>
    )
  }

  return (
    <div className="border" style={{ borderColor: ONO.border, backgroundColor: ONO.surface }}>
      {/* Header */}
      <div
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{ borderColor: ONO.border }}
      >
        <span
          className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest"
          style={{ color: ONO.textMuted }}
        >
          Performance Review
        </span>
        <div className="flex items-center gap-2">
          <span
            className="font-[family-name:var(--font-mono)] text-2xl font-bold"
            style={{ color: tier.color }}
          >
            {total.toFixed(1)}
          </span>
          <span
            className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest border px-1.5 py-0.5"
            style={{ color: tier.color, borderColor: tier.color }}
          >
            {tier.label}
          </span>
        </div>
      </div>

      {/* Score bars */}
      <div className="px-4 py-3 space-y-3">
        <ScoreBar label="Computational Waste" value={computationalWaste} max={total || 100} color={ONO.red} />
        <ScoreBar label="Overengineering" value={overengineering} max={total || 100} color={ONO.amber} />
        <ScoreBar label="Style Points" value={stylePoints} max={total || 100} color={ONO.green} />
      </div>

      {/* Detail breakdown */}
      {details && (
        <div
          className="px-4 py-3 border-t grid grid-cols-2 gap-x-6 gap-y-1.5"
          style={{ borderColor: ONO.border }}
        >
          <DetailRow label="Time ratio" value={`${details.timeRatio}x slower`} />
          <DetailRow label="Memory ratio" value={`${details.memoryRatio}x more`} />
          <DetailRow label="Code ratio" value={`${details.locRatio}x longer`} />
          <DetailRow label="Function bonus" value={`+${details.functionBonus}`} />
          <DetailRow label="Class bonus" value={`+${details.classBonus}`} />
          <DetailRow label="Import bonus" value={`+${details.importBonus}`} />
          <DetailRow label="Naming score" value={`+${details.namingScore}`} />
          <DetailRow label="Comment score" value={`+${details.commentScore}`} />
        </div>
      )}
    </div>
  )
}

function ScoreBar({
  label,
  value,
  max,
  color,
}: {
  label: string
  value: number
  max: number
  color: string
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span
          className="font-[family-name:var(--font-mono)] text-[11px]"
          style={{ color: ONO.textSecondary }}
        >
          {label}
        </span>
        <span
          className="font-[family-name:var(--font-mono)] text-[11px] font-bold"
          style={{ color }}
        >
          {value.toFixed(1)}
        </span>
      </div>
      <div className="h-1.5 w-full" style={{ backgroundColor: ONO.border }}>
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span
        className="font-[family-name:var(--font-mono)] text-[10px]"
        style={{ color: ONO.textMuted }}
      >
        {label}
      </span>
      <span
        className="font-[family-name:var(--font-mono)] text-[10px]"
        style={{ color: ONO.textSecondary }}
      >
        {value}
      </span>
    </div>
  )
}
