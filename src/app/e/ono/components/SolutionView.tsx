'use client'

import { ONO } from '@/lib/ono/constants'

interface SolutionViewProps {
  sourceCode: string
  loc: number
  numFunctions: number
  numClasses: number
  numImports: number
  totalLines: number
}

export function SolutionView({
  sourceCode,
  loc,
  numFunctions,
  numClasses,
  numImports,
  totalLines,
}: SolutionViewProps) {
  return (
    <div className="border" style={{ borderColor: ONO.border }}>
      {/* Header */}
      <div
        className="px-4 py-2 border-b flex items-center justify-between"
        style={{ borderColor: ONO.border, backgroundColor: ONO.surface }}
      >
        <span
          className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest"
          style={{ color: ONO.textMuted }}
        >
          solution.py
        </span>
        <div className="flex items-center gap-3">
          <Stat label="LOC" value={loc} />
          <Stat label="fn" value={numFunctions} />
          <Stat label="cls" value={numClasses} />
          <Stat label="imp" value={numImports} />
          <Stat label="lines" value={totalLines} />
        </div>
      </div>

      {/* Code */}
      <div className="overflow-x-auto">
        <pre
          className="px-4 py-3 font-[family-name:var(--font-mono)] text-xs leading-relaxed"
          style={{ color: ONO.textPrimary }}
        >
          {sourceCode.split('\n').map((line, i) => (
            <div key={i} className="flex">
              <span
                className="select-none w-10 shrink-0 text-right pr-4"
                style={{ color: ONO.textMuted }}
              >
                {i + 1}
              </span>
              <span className="whitespace-pre">{line}</span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="font-[family-name:var(--font-mono)] text-[10px]" style={{ color: ONO.textMuted }}>
      {label}: <span style={{ color: ONO.textSecondary }}>{value}</span>
    </span>
  )
}
