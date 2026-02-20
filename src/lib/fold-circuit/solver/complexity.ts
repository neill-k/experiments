import { neighborIndices } from '../tiles'
import { TILE_CODE, type FoldCircuitBoard } from '../types'

export function computePuzzleComplexity(board: FoldCircuitBoard, optimumPath: number[]): number {
  const cellCount = board.width * board.height
  let openCells = 0

  for (let i = 0; i < cellCount; i += 1) {
    if (board.tiles[i] !== TILE_CODE.BLOCK) openCells += 1
  }

  let turns = 0
  for (let i = 1; i < optimumPath.length - 1; i += 1) {
    const prev = optimumPath[i - 1]
    const curr = optimumPath[i]
    const next = optimumPath[i + 1]
    const prevDx = (curr % board.width) - (prev % board.width)
    const prevDy = Math.floor(curr / board.width) - Math.floor(prev / board.width)
    const nextDx = (next % board.width) - (curr % board.width)
    const nextDy = Math.floor(next / board.width) - Math.floor(curr / board.width)
    if (prevDx !== nextDx || prevDy !== nextDy) turns += 1
  }

  let branchCells = 0
  for (let i = 0; i < cellCount; i += 1) {
    if (board.tiles[i] === TILE_CODE.BLOCK) continue
    const degree = neighborIndices(board, i).filter((n) => board.tiles[n] !== TILE_CODE.BLOCK).length
    if (degree > 2) branchCells += 1
  }

  const openness = openCells / cellCount
  return Number((optimumPath.length * 0.6 + turns * 0.9 + branchCells * 0.15 + openness * 3).toFixed(2))
}
