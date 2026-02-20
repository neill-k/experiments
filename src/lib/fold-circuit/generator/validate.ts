import { solveFoldCircuit } from '../solver/solve'
import { TILE_CODE, type FoldCircuitBoard, type LawSet } from '../types'

export interface BoardValidationResult {
  valid: boolean
  reason: string
  optimumPathLength: number
  operations: number
  path: number[]
}

interface ValidateOptions {
  board: FoldCircuitBoard
  laws: LawSet
  operationCap?: number
  minPathLength?: number
}

export function validateGeneratedBoard({
  board,
  laws,
  operationCap = 22000,
  minPathLength = 8,
}: ValidateOptions): BoardValidationResult {
  if (board.sourceIndex === board.sinkIndex) {
    return { valid: false, reason: 'source-equals-sink', optimumPathLength: 0, operations: 0, path: [] }
  }

  if (board.tiles[board.sourceIndex] !== TILE_CODE.SOURCE || board.tiles[board.sinkIndex] !== TILE_CODE.SINK) {
    return { valid: false, reason: 'invalid-endpoints', optimumPathLength: 0, operations: 0, path: [] }
  }

  const solver = solveFoldCircuit({ board, laws, operationCap })
  if (!solver.solved) {
    return {
      valid: false,
      reason: 'unsolved-by-solver',
      optimumPathLength: solver.pathLength,
      operations: solver.operations,
      path: solver.path,
    }
  }

  if (solver.pathLength < minPathLength) {
    return {
      valid: false,
      reason: 'trivial-path',
      optimumPathLength: solver.pathLength,
      operations: solver.operations,
      path: solver.path,
    }
  }

  if (solver.pathLength - 2 > laws.maxActiveCells) {
    return {
      valid: false,
      reason: 'path-exceeds-active-cap',
      optimumPathLength: solver.pathLength,
      operations: solver.operations,
      path: solver.path,
    }
  }

  let openCells = 0
  const cellCount = board.width * board.height
  for (let i = 0; i < cellCount; i += 1) {
    if (board.tiles[i] !== TILE_CODE.BLOCK) openCells += 1
  }

  const openRatio = openCells / cellCount
  if (openRatio > 0.86) {
    return {
      valid: false,
      reason: 'too-open-degenerate',
      optimumPathLength: solver.pathLength,
      operations: solver.operations,
      path: solver.path,
    }
  }

  return {
    valid: true,
    reason: 'ok',
    optimumPathLength: solver.pathLength,
    operations: solver.operations,
    path: solver.path,
  }
}
