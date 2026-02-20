import type { QualityProfile } from '../types'
import { FOLD_CIRCUIT_PERF_BUDGETS } from './budgets'

export function chooseQualityProfile(avgFrameMs: number, reducedMotion: boolean): QualityProfile {
  if (reducedMotion) return 'low'
  if (avgFrameMs > FOLD_CIRCUIT_PERF_BUDGETS.degradedFrameBudgetMs) return 'low'
  if (avgFrameMs > FOLD_CIRCUIT_PERF_BUDGETS.frameBudgetMs) return 'medium'
  return 'high'
}
