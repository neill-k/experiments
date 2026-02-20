import { generateFoldCircuitPuzzle } from './generator/build'
import { chooseNextMutation } from './law-mutations'
import { BASE_LAW_SET } from './laws'
import type { FoldCircuitPuzzle, ProgressState, ScoreBreakdown } from './types'

export function createInitialProgress(runSeed: number): ProgressState {
  return {
    runSeed,
    puzzleNumber: 1,
    laws: BASE_LAW_SET,
    mutationHistory: [],
    scoreTotal: 0,
  }
}

export function generatePuzzleFromProgress(progress: ProgressState): FoldCircuitPuzzle {
  return generateFoldCircuitPuzzle({
    runSeed: progress.runSeed,
    puzzleNumber: progress.puzzleNumber,
    laws: progress.laws,
    mutationHistory: progress.mutationHistory,
  })
}

interface AdvanceResult {
  progress: ProgressState
  nextPuzzle: FoldCircuitPuzzle
  mutationLabel: string
}

export function advanceProgressAfterSolve(progress: ProgressState, score: ScoreBreakdown): AdvanceResult {
  const currentPuzzle = generatePuzzleFromProgress(progress)

  const mutation = chooseNextMutation({
    laws: progress.laws,
    board: currentPuzzle.board,
    seed: progress.runSeed + progress.puzzleNumber * 101,
    validateCandidate: (candidateLaws) => {
      const candidatePuzzle = generateFoldCircuitPuzzle({
        runSeed: progress.runSeed,
        puzzleNumber: progress.puzzleNumber + 1,
        laws: candidateLaws,
        mutationHistory: progress.mutationHistory,
      })

      return candidatePuzzle.optimumPathLength > 0 && candidatePuzzle.solverOperations <= 22000
    },
  })

  const nextLaws = mutation?.nextLaws ?? progress.laws
  const nextHistory = mutation
    ? [...progress.mutationHistory, mutation.mutation.label]
    : [...progress.mutationHistory, 'No legal mutation available']

  const nextProgress: ProgressState = {
    runSeed: progress.runSeed,
    puzzleNumber: progress.puzzleNumber + 1,
    laws: nextLaws,
    mutationHistory: nextHistory,
    scoreTotal: progress.scoreTotal + score.total,
  }

  const nextPuzzle = generatePuzzleFromProgress(nextProgress)

  return {
    progress: nextProgress,
    nextPuzzle,
    mutationLabel: mutation?.mutation.label ?? 'No legal mutation available',
  }
}
