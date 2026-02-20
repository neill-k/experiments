import { runSimulation } from './sim'
import { isEditableCell } from '../tiles'
import type { FoldCircuitMove, FoldCircuitPuzzle, SimulationResult } from '../types'

export interface ReplayResult {
  wires: Uint8Array
  simulation: SimulationResult
  checksum: number
}

export function replayMoves(puzzle: FoldCircuitPuzzle, moves: FoldCircuitMove[]): ReplayResult {
  const cellCount = puzzle.board.width * puzzle.board.height
  const wires = new Uint8Array(cellCount)

  const ordered = [...moves].sort((a, b) => a.tick - b.tick)
  for (let i = 0; i < ordered.length; i += 1) {
    const move = ordered[i]
    if (move.index < 0 || move.index >= cellCount) continue
    if (!isEditableCell(puzzle.board, move.index)) continue

    if (move.action === 'clear') {
      wires[move.index] = 0
    } else {
      wires[move.index] = wires[move.index] === 1 ? 0 : 1
    }
  }

  const simulation = runSimulation(puzzle.board, wires, puzzle.laws)

  let checksum = 0
  for (let i = 0; i < wires.length; i += 1) {
    checksum = (checksum * 31 + wires[i] * (i + 1)) >>> 0
  }
  checksum = (checksum * 31 + simulation.stats.sinkSignal) >>> 0

  return {
    wires,
    simulation,
    checksum,
  }
}
