'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { FoldCircuitCanvasRenderer } from '@/lib/fold-circuit/render/canvas-renderer'
import { tileKindFromCode } from '@/lib/fold-circuit/tiles'
import type { FoldCircuitPuzzle } from '@/lib/fold-circuit/types'

interface FoldCircuitBoardProps {
  puzzle: FoldCircuitPuzzle
  wires: Uint8Array
  bestSignal: Int16Array | null
  selectedIndex: number
  solved: boolean
  onSelect: (index: number) => void
  onToggle: (index: number) => void
}

function ariaCellLabel(puzzle: FoldCircuitPuzzle, wires: Uint8Array, index: number): string {
  const kind = tileKindFromCode(puzzle.board.tiles[index])
  if (kind === 'source') return `Cell ${index + 1}, source`
  if (kind === 'sink') return `Cell ${index + 1}, sink`
  if (kind === 'block') return `Cell ${index + 1}, blocked`
  return `Cell ${index + 1}, ${wires[index] === 1 ? 'wire active' : 'wire empty'}`
}

export function FoldCircuitBoard({
  puzzle,
  wires,
  bestSignal,
  selectedIndex,
  solved,
  onSelect,
  onToggle,
}: FoldCircuitBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rendererRef = useRef<FoldCircuitCanvasRenderer | null>(null)
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const renderStateRef = useRef({
    board: puzzle.board,
    wires,
    bestSignal,
    hoverIndex,
    selectedIndex,
    solved,
  })

  useEffect(() => {
    renderStateRef.current = {
      board: puzzle.board,
      wires,
      bestSignal,
      hoverIndex,
      selectedIndex,
      solved,
    }

    const renderer = rendererRef.current
    if (!renderer) return

    renderer.render(renderStateRef.current)
  }, [bestSignal, hoverIndex, puzzle.board, selectedIndex, solved, wires])

  useEffect(() => {
    const canvas = canvasRef.current
    const host = hostRef.current
    if (!canvas || !host) return

    const renderer = new FoldCircuitCanvasRenderer(canvas)
    rendererRef.current = renderer

    let lastWidth = 0
    let lastHeight = 0
    let raf = 0

    const resize = () => {
      const rect = host.getBoundingClientRect()
      const width = Math.max(1, Math.round(rect.width))
      const height = Math.max(1, Math.round(rect.height))

      if (width === lastWidth && height === lastHeight) return

      lastWidth = width
      lastHeight = height
      renderer.resize(width, height)
      renderer.render(renderStateRef.current)
    }

    const scheduleResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(resize)
    }

    resize()
    const observer = new ResizeObserver(() => scheduleResize())
    observer.observe(host)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      rendererRef.current = null
    }
  }, [])

  const cells = useMemo(() => {
    return Array.from({ length: puzzle.board.width * puzzle.board.height }, (_, index) => index)
  }, [puzzle.board.height, puzzle.board.width])

  return (
    <div className="fold-circuit-board-shell">
      <div ref={hostRef} className="fold-circuit-board-canvas">
        <canvas ref={canvasRef} aria-hidden="true" className="fold-circuit-canvas" />

        <div
          className="fold-circuit-grid-overlay"
          style={{ gridTemplateColumns: `repeat(${puzzle.board.width}, minmax(0, 1fr))` }}
        >
          {cells.map((index) => {
            const code = puzzle.board.tiles[index]
            const blocked = code === 1 || code === 2 || code === 3

            return (
              <button
                key={index}
                type="button"
                className="fold-circuit-cell-hit"
                aria-label={ariaCellLabel(puzzle, wires, index)}
                disabled={blocked}
                onMouseEnter={() => setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex(null)}
                onFocus={() => onSelect(index)}
                onClick={() => onToggle(index)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
