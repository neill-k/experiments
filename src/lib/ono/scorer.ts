/**
 * O(no) scoring engine.
 * Computes how magnificently terrible a solution is, relative to the optimal.
 */

export interface RawMetrics {
  executionTimeMs: number
  peakMemoryBytes: number
  loc: number
  numFunctions: number
  numClasses: number
  numImports: number
  avgNameLength: number
  longNamesCount: number
  commentLines: number
  totalLines: number
}

export interface ScoreBreakdown {
  total: number
  computationalWaste: number
  overengineering: number
  stylePoints: number
  details: {
    timeRatio: number
    memoryRatio: number
    locRatio: number
    functionBonus: number
    classBonus: number
    importBonus: number
    namingScore: number
    commentScore: number
  }
}

export interface OptimalBaseline {
  timeMs: number
  memoryBytes: number
  loc: number
}

/**
 * Compute the composite O(no) score.
 * Higher = more gloriously terrible.
 */
export function computeScore(
  metrics: RawMetrics,
  baseline: OptimalBaseline,
): ScoreBreakdown {
  // ── Computational Waste ──
  // Logarithmic scale: going from O(n) to O(n!) is exponentially more rewarding
  const timeRatio = Math.max(1, metrics.executionTimeMs / Math.max(0.001, baseline.timeMs))
  const memoryRatio = Math.max(1, metrics.peakMemoryBytes / Math.max(1, baseline.memoryBytes))

  const timeScore = Math.log2(timeRatio) * 15
  const memoryScore = Math.log2(memoryRatio) * 8
  const computationalWaste = Math.round((timeScore + memoryScore) * 10) / 10

  // ── Overengineering ──
  const locRatio = Math.max(1, metrics.loc / Math.max(1, baseline.loc))
  const locScore = Math.log2(locRatio) * 20
  const functionBonus = Math.max(0, metrics.numFunctions - 1) * 5
  const classBonus = metrics.numClasses * 12
  const importBonus = Math.max(0, metrics.numImports - 1) * 3
  const overengineering = Math.round((locScore + functionBonus + classBonus + importBonus) * 10) / 10

  // ── Style Points ──
  // Enterprise naming: single letters = 0, long enterprise names = max
  const namingScore = metrics.avgNameLength > 20
    ? 30
    : metrics.avgNameLength > 12
      ? 20
      : metrics.avgNameLength > 8
        ? 10
        : 0
  const longNameBonus = metrics.longNamesCount * 3

  // Comments: obvious comments or high density = more points
  const commentRatio = metrics.totalLines > 0 ? metrics.commentLines / metrics.totalLines : 0
  const commentScore = commentRatio > 0.4
    ? 25
    : commentRatio > 0.2
      ? 15
      : commentRatio > 0.1
        ? 8
        : 0

  const stylePoints = Math.round((namingScore + longNameBonus + commentScore) * 10) / 10

  const total = Math.round((computationalWaste + overengineering + stylePoints) * 10) / 10

  return {
    total,
    computationalWaste,
    overengineering,
    stylePoints,
    details: {
      timeRatio: Math.round(timeRatio * 100) / 100,
      memoryRatio: Math.round(memoryRatio * 100) / 100,
      locRatio: Math.round(locRatio * 100) / 100,
      functionBonus,
      classBonus,
      importBonus,
      namingScore: namingScore + longNameBonus,
      commentScore,
    },
  }
}
