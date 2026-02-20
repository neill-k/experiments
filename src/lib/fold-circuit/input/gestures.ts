import type { FoldCircuitBoard } from '../types'

export interface PointerToCellInput {
  board: FoldCircuitBoard
  canvasWidth: number
  canvasHeight: number
  clientX: number
  clientY: number
  rectLeft: number
  rectTop: number
}

export function pointerToCell(input: PointerToCellInput): number | null {
  const localX = input.clientX - input.rectLeft
  const localY = input.clientY - input.rectTop

  const cellSize = Math.floor(Math.min(input.canvasWidth / input.board.width, input.canvasHeight / input.board.height))
  if (cellSize <= 0) return null

  const gridWidth = cellSize * input.board.width
  const gridHeight = cellSize * input.board.height
  const offsetX = Math.floor((input.canvasWidth - gridWidth) * 0.5)
  const offsetY = Math.floor((input.canvasHeight - gridHeight) * 0.5)

  const gridX = Math.floor((localX - offsetX) / cellSize)
  const gridY = Math.floor((localY - offsetY) / cellSize)

  if (gridX < 0 || gridX >= input.board.width) return null
  if (gridY < 0 || gridY >= input.board.height) return null

  return gridY * input.board.width + gridX
}
