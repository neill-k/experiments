import { tileKindFromCode } from '../tiles'
import { TILE_CODE, type FoldCircuitBoard } from '../types'

export function describeBoardForScreenReader(board: FoldCircuitBoard, wires: Uint8Array): string {
  const cellCount = board.width * board.height
  let blocks = 0
  let wiresActive = 0

  for (let i = 0; i < cellCount; i += 1) {
    if (board.tiles[i] === TILE_CODE.BLOCK) blocks += 1
    if (wires[i] === 1) wiresActive += 1
  }

  const sourceKind = tileKindFromCode(board.tiles[board.sourceIndex])
  const sinkKind = tileKindFromCode(board.tiles[board.sinkIndex])

  return [
    `Board ${board.width} by ${board.height}.`,
    `Source cell ${board.sourceIndex + 1} (${sourceKind}).`,
    `Sink cell ${board.sinkIndex + 1} (${sinkKind}).`,
    `${blocks} blocked cells.`,
    `${wiresActive} active wire cells.`,
    'Use arrow keys to move focus and Enter to toggle wire.',
  ].join(' ')
}
