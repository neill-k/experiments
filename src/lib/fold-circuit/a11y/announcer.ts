import type { ScoreBreakdown } from '../types'

export function announceSolve(score: ScoreBreakdown, mutationLabel: string): string {
  return `Puzzle solved. Rank ${score.rank}. Total ${score.total}. Next law mutation: ${mutationLabel}.`
}

export function announceRunFailure(reason: string): string {
  return `Run complete. ${reason}.`
}

export function announceCellToggle(index: number, active: boolean): string {
  return `Cell ${index + 1} ${active ? 'activated' : 'cleared'}.`
}
