'use client'

import { ONO } from '@/lib/ono/constants'

interface TestResult {
  passed: boolean
  elapsedMs: number
  peakMemoryBytes: number
  actual: string
  expected: string
}

interface TestResultsProps {
  results: TestResult[]
}

export function TestResults({ results }: TestResultsProps) {
  const passCount = results.filter((r) => r.passed).length

  return (
    <div className="border" style={{ borderColor: ONO.border }}>
      <div
        className="px-4 py-2 border-b flex items-center justify-between"
        style={{ borderColor: ONO.border, backgroundColor: ONO.surface }}
      >
        <span
          className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest"
          style={{ color: ONO.textMuted }}
        >
          Test Results
        </span>
        <span
          className="font-[family-name:var(--font-mono)] text-xs"
          style={{
            color: passCount === results.length ? ONO.green : ONO.red,
          }}
        >
          {passCount}/{results.length} passed
        </span>
      </div>

      <div className="divide-y" style={{ borderColor: ONO.border }}>
        {results.map((result, i) => (
          <div
            key={i}
            className="px-4 py-2 flex items-center gap-3"
            style={{ borderColor: ONO.border }}
          >
            <span
              className="font-[family-name:var(--font-mono)] text-xs shrink-0"
              style={{ color: result.passed ? ONO.green : ONO.red }}
            >
              {result.passed ? 'PASS' : 'FAIL'}
            </span>
            <span
              className="font-[family-name:var(--font-mono)] text-[11px] shrink-0"
              style={{ color: ONO.textMuted }}
            >
              #{i + 1}
            </span>
            <span
              className="font-[family-name:var(--font-mono)] text-[11px] truncate"
              style={{ color: ONO.textSecondary }}
            >
              {result.elapsedMs.toFixed(2)}ms
            </span>
            {!result.passed && (
              <span
                className="font-[family-name:var(--font-mono)] text-[10px] truncate"
                style={{ color: ONO.redDim }}
              >
                got {result.actual}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
