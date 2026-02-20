import { neighborIndices } from '../tiles'
import { TILE_CODE, type FoldCircuitBoard, type LawSet, type SolveResult } from '../types'

interface SolveOptions {
  board: FoldCircuitBoard
  laws: LawSet
  wires?: Uint8Array
  operationCap?: number
}

function traversable(board: FoldCircuitBoard, index: number, wires?: Uint8Array): boolean {
  if (board.tiles[index] === TILE_CODE.BLOCK) return false
  if (index === board.sourceIndex || index === board.sinkIndex) return true
  if (!wires) return true
  return wires[index] === 1
}

function branchPenalty(board: FoldCircuitBoard, index: number, wires: Uint8Array | undefined, bleedLoss: number): number {
  if (bleedLoss <= 0) return 0
  const neighbors = neighborIndices(board, index)
  let count = 0

  for (let i = 0; i < neighbors.length; i += 1) {
    if (traversable(board, neighbors[i], wires)) count += 1
  }

  return count > 2 ? bleedLoss : 0
}

export function solveFoldCircuit({ board, laws, wires, operationCap = 24000 }: SolveOptions): SolveResult {
  const cellCount = board.width * board.height
  const bestSignal = new Int16Array(cellCount)
  const distance = new Int16Array(cellCount)
  const parent = new Int32Array(cellCount)

  for (let i = 0; i < cellCount; i += 1) {
    bestSignal[i] = -1
    distance[i] = 32767
    parent[i] = -1
  }

  const queueIndex: number[] = []
  const queueSignal: number[] = []
  const queueDistance: number[] = []

  bestSignal[board.sourceIndex] = laws.sourcePower
  distance[board.sourceIndex] = 0
  queueIndex.push(board.sourceIndex)
  queueSignal.push(laws.sourcePower)
  queueDistance.push(0)

  let operations = 0
  let head = 0

  while (head < queueIndex.length && operations < operationCap) {
    const index = queueIndex[head]
    const signal = queueSignal[head]
    const dist = queueDistance[head]
    head += 1

    if (signal < bestSignal[index]) {
      operations += 1
      continue
    }

    const neighbors = neighborIndices(board, index)
    const bleed = branchPenalty(board, index, wires, laws.bleedLoss)

    for (let i = 0; i < neighbors.length; i += 1) {
      const nextIndex = neighbors[i]
      if (!traversable(board, nextIndex, wires)) continue

      const loss = 1 + laws.attenuationPerStep + bleed
      const nextSignal = signal - loss
      if (nextSignal < 0) continue

      const nextDist = dist + 1
      const betterSignal = nextSignal > bestSignal[nextIndex]
      const betterDistance = nextSignal === bestSignal[nextIndex] && nextDist < distance[nextIndex]

      if (!betterSignal && !betterDistance) continue

      bestSignal[nextIndex] = nextSignal
      distance[nextIndex] = nextDist
      parent[nextIndex] = index
      queueIndex.push(nextIndex)
      queueSignal.push(nextSignal)
      queueDistance.push(nextDist)
    }

    operations += 1
  }

  const sinkSignal = bestSignal[board.sinkIndex]
  const solved = sinkSignal >= laws.sinkThreshold && parent[board.sinkIndex] !== -1

  if (!solved) {
    return {
      solved: false,
      path: [],
      pathLength: 0,
      operations,
    }
  }

  const path: number[] = []
  let cursor = board.sinkIndex
  path.push(cursor)

  while (cursor !== board.sourceIndex && cursor !== -1) {
    cursor = parent[cursor]
    if (cursor !== -1) path.push(cursor)
  }

  path.reverse()

  return {
    solved: true,
    path,
    pathLength: path.length,
    operations,
  }
}
