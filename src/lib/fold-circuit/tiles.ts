import { TILE_CODE, type FoldCircuitBoard, type Position, type TileKind } from './types'

export function toIndex(width: number, x: number, y: number): number {
  return y * width + x
}

export function toPosition(width: number, index: number): Position {
  return {
    x: index % width,
    y: Math.floor(index / width),
  }
}

export function tileKindFromCode(code: number): TileKind {
  if (code === TILE_CODE.BLOCK) return 'block'
  if (code === TILE_CODE.SOURCE) return 'source'
  if (code === TILE_CODE.SINK) return 'sink'
  return 'empty'
}

export function isInside(board: FoldCircuitBoard, x: number, y: number): boolean {
  return x >= 0 && x < board.width && y >= 0 && y < board.height
}

export function isBlocked(board: FoldCircuitBoard, index: number): boolean {
  return board.tiles[index] === TILE_CODE.BLOCK
}

export function isEndpoint(board: FoldCircuitBoard, index: number): boolean {
  return index === board.sourceIndex || index === board.sinkIndex
}

export function isEditableCell(board: FoldCircuitBoard, index: number): boolean {
  if (isEndpoint(board, index)) return false
  return !isBlocked(board, index)
}

export function neighborIndices(board: FoldCircuitBoard, index: number): number[] {
  const x = index % board.width
  const y = Math.floor(index / board.width)
  const out: number[] = []

  if (x > 0) out.push(index - 1)
  if (x < board.width - 1) out.push(index + 1)
  if (y > 0) out.push(index - board.width)
  if (y < board.height - 1) out.push(index + board.width)

  return out
}

export function wireCount(wires: Uint8Array): number {
  let count = 0
  for (let i = 0; i < wires.length; i += 1) {
    if (wires[i] === 1) count += 1
  }
  return count
}
