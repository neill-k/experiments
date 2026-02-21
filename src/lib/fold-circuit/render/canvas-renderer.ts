import { TILE_CODE, type FoldCircuitBoard } from '../types'
import { FOLD_CIRCUIT_PALETTE, type FoldCircuitPalette } from './palette'

export interface FoldCircuitRenderState {
  board: FoldCircuitBoard
  wires: Uint8Array
  bestSignal: Int16Array | null
  hoverIndex: number | null
  selectedIndex: number | null
  solved: boolean
}

export class FoldCircuitCanvasRenderer {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private readonly palette: FoldCircuitPalette

  constructor(canvas: HTMLCanvasElement, palette: FoldCircuitPalette = FOLD_CIRCUIT_PALETTE) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('FoldCircuitCanvasRenderer could not get 2D context')
    }
    this.ctx = ctx
    this.ctx.imageSmoothingEnabled = false
    this.palette = palette
  }

  resize(width: number, height: number): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.max(1, Math.floor(width * dpr))
    this.canvas.height = Math.max(1, Math.floor(height * dpr))
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  render(state: FoldCircuitRenderState): void {
    const { board, wires, bestSignal } = state

    const width = this.canvas.clientWidth
    const height = this.canvas.clientHeight
    if (width <= 0 || height <= 0) return

    const cellSize = Math.floor(Math.min(width / board.width, height / board.height))
    const gridWidth = cellSize * board.width
    const gridHeight = cellSize * board.height
    const offsetX = Math.floor((width - gridWidth) * 0.5)
    const offsetY = Math.floor((height - gridHeight) * 0.5)

    this.ctx.fillStyle = this.palette.background
    this.ctx.fillRect(0, 0, width, height)

    for (let i = 0; i < board.tiles.length; i += 1) {
      const x = i % board.width
      const y = Math.floor(i / board.width)
      const left = offsetX + x * cellSize
      const top = offsetY + y * cellSize
      const tile = board.tiles[i]

      let fill = this.palette.background
      if (tile === TILE_CODE.BLOCK) {
        fill = this.palette.block
      } else if (tile === TILE_CODE.SOURCE) {
        fill = this.palette.source
      } else if (tile === TILE_CODE.SINK) {
        fill = this.palette.sink
      } else if (wires[i] === 1) {
        const powered = bestSignal ? bestSignal[i] >= 0 : false
        fill = powered ? this.palette.wirePowered : this.palette.wireDead
      }

      this.ctx.fillStyle = fill
      this.ctx.fillRect(left + 1, top + 1, cellSize - 2, cellSize - 2)

      if (state.selectedIndex === i || state.hoverIndex === i) {
        this.ctx.strokeStyle = this.palette.focus
        this.ctx.lineWidth = 2
        this.ctx.strokeRect(left + 2, top + 2, cellSize - 4, cellSize - 4)
      }
    }

    this.ctx.strokeStyle = this.palette.grid
    this.ctx.lineWidth = 1

    for (let x = 0; x <= board.width; x += 1) {
      const drawX = offsetX + x * cellSize + 0.5
      this.ctx.beginPath()
      this.ctx.moveTo(drawX, offsetY)
      this.ctx.lineTo(drawX, offsetY + gridHeight)
      this.ctx.stroke()
    }

    for (let y = 0; y <= board.height; y += 1) {
      const drawY = offsetY + y * cellSize + 0.5
      this.ctx.beginPath()
      this.ctx.moveTo(offsetX, drawY)
      this.ctx.lineTo(offsetX + gridWidth, drawY)
      this.ctx.stroke()
    }

    this.ctx.fillStyle = state.solved ? this.palette.solved : this.palette.text
    this.ctx.font = '11px var(--font-mono)'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(state.solved ? 'SOLVED' : 'BUILD', 8, 14)
  }
}
