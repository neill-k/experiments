import { neighborIndices } from '../tiles'
import { TILE_CODE, type FoldCircuitBoard, type LawSet, type SimulationState } from '../types'

interface StepOptions {
  board: FoldCircuitBoard
  laws: LawSet
  wires: Uint8Array
  state: SimulationState
}

function traversable(board: FoldCircuitBoard, wires: Uint8Array, index: number): boolean {
  if (board.tiles[index] === TILE_CODE.BLOCK) return false
  if (index === board.sourceIndex || index === board.sinkIndex) return true
  return wires[index] === 1
}

function computeBranchPenalty(
  board: FoldCircuitBoard,
  wires: Uint8Array,
  index: number,
  bleedLoss: number,
): number {
  if (bleedLoss <= 0) return 0
  const neighbors = neighborIndices(board, index)
  let conductiveNeighbors = 0

  for (let i = 0; i < neighbors.length; i += 1) {
    if (traversable(board, wires, neighbors[i])) conductiveNeighbors += 1
  }

  return conductiveNeighbors > 2 ? bleedLoss : 0
}

export function createSimulationState(cellCount: number, sourceIndex: number, sourcePower: number): SimulationState {
  const currentSignal = new Int16Array(cellCount)
  const nextSignal = new Int16Array(cellCount)
  const bestSignal = new Int16Array(cellCount)
  const visited = new Uint8Array(cellCount)

  for (let i = 0; i < cellCount; i += 1) {
    currentSignal[i] = -1
    nextSignal[i] = -1
    bestSignal[i] = -1
  }

  currentSignal[sourceIndex] = sourcePower
  bestSignal[sourceIndex] = sourcePower

  return {
    tick: 0,
    currentSignal,
    nextSignal,
    bestSignal,
    visited,
  }
}

export function stepSimulation({ board, laws, wires, state }: StepOptions): { progressed: boolean } {
  const cellCount = board.width * board.height

  for (let i = 0; i < cellCount; i += 1) {
    state.nextSignal[i] = -1
  }

  for (let index = 0; index < cellCount; index += 1) {
    const signal = state.currentSignal[index]
    if (signal < 0) continue
    state.visited[index] = 1

    const bleed = computeBranchPenalty(board, wires, index, laws.bleedLoss)
    const loss = 1 + laws.attenuationPerStep + bleed
    const nextValue = signal - loss
    if (nextValue < 0) continue

    const neighbors = neighborIndices(board, index)
    for (let n = 0; n < neighbors.length; n += 1) {
      const nextIndex = neighbors[n]
      if (!traversable(board, wires, nextIndex)) continue
      if (nextValue > state.nextSignal[nextIndex]) {
        state.nextSignal[nextIndex] = nextValue
      }
    }
  }

  let progressed = false
  for (let i = 0; i < cellCount; i += 1) {
    if (state.nextSignal[i] > state.currentSignal[i]) {
      state.currentSignal[i] = state.nextSignal[i]
      if (state.currentSignal[i] > state.bestSignal[i]) {
        state.bestSignal[i] = state.currentSignal[i]
      }
      progressed = true
    }
  }

  state.tick += 1
  return { progressed }
}
