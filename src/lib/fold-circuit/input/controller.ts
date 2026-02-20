import { isEditableCell } from '../tiles'
import type { FoldCircuitBoard, FoldCircuitMove } from '../types'

export function createEmptyWires(board: FoldCircuitBoard): Uint8Array {
  return new Uint8Array(board.width * board.height)
}

export function toggleWireAt(board: FoldCircuitBoard, wires: Uint8Array, index: number): Uint8Array {
  if (!isEditableCell(board, index)) return wires
  const next = wires.slice()
  next[index] = next[index] === 1 ? 0 : 1
  return next
}

export function clearWires(board: FoldCircuitBoard): Uint8Array {
  return createEmptyWires(board)
}

export function moveCursor(board: FoldCircuitBoard, current: number, dx: number, dy: number): number {
  const x = current % board.width
  const y = Math.floor(current / board.width)

  const nx = Math.max(0, Math.min(board.width - 1, x + dx))
  const ny = Math.max(0, Math.min(board.height - 1, y + dy))
  return ny * board.width + nx
}

export function appendMove(log: FoldCircuitMove[], tick: number, index: number, action: 'toggle' | 'clear'): FoldCircuitMove[] {
  return [...log, { tick, index, action }]
}
