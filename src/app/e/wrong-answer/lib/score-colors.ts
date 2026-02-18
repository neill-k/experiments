import type { ScoreTier } from './types'

export function getScoreTier(score: number): ScoreTier {
  if (score <= 20) return 'pathetic'
  if (score <= 40) return 'weak'
  if (score <= 60) return 'decent'
  if (score <= 80) return 'impressive'
  return 'legendary'
}

export function getScoreColor(score: number): string {
  const tier = getScoreTier(score)
  switch (tier) {
    case 'pathetic':
      return '#ff3333'
    case 'weak':
      return '#ff8833'
    case 'decent':
      return '#ffcc33'
    case 'impressive':
      return '#33ff88'
    case 'legendary':
      return '#ebebeb'
  }
}

export function getScoreLabel(score: number): string {
  const tier = getScoreTier(score)
  switch (tier) {
    case 'pathetic':
      return 'PATHETIC'
    case 'weak':
      return 'WEAK'
    case 'decent':
      return 'DECENT'
    case 'impressive':
      return 'IMPRESSIVE'
    case 'legendary':
      return 'LEGENDARY'
  }
}

export function getScoreGradient(score: number): string {
  if (score > 80) {
    return 'linear-gradient(90deg, #ff3333, #ff8833, #ffcc33, #33ff88, #3388ff, #8833ff, #ff3333)'
  }
  return getScoreColor(score)
}
