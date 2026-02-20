import { validateGeneratedBoard } from './validate'
import { createSeededRng, derivePuzzleSeed, normalizeSeed } from '../seed'
import { toIndex } from '../tiles'
import { TILE_CODE, type FoldCircuitBoard, type FoldCircuitPuzzle, type LawSet } from '../types'

interface GenerateOptions {
  runSeed: number
  puzzleNumber: number
  laws: LawSet
  mutationHistory: string[]
  width?: number
  height?: number
}

function carveBackbone(width: number, height: number, seed: number): {
  sourceIndex: number
  sinkIndex: number
  path: number[]
} {
  const rng = createSeededRng(seed)
  const sourceY = 1 + Math.floor(rng() * Math.max(1, height - 2))
  const sinkY = 1 + Math.floor(rng() * Math.max(1, height - 2))

  let x = 0
  let y = sourceY
  const path: number[] = [toIndex(width, x, y)]

  const verticalBias = rng() < 0.5 ? 1 : -1

  while (x < width - 1 || y !== sinkY) {
    const canMoveRight = x < width - 1
    const preferVertical = y !== sinkY && (rng() < 0.45 || !canMoveRight)

    if (preferVertical) {
      const towardSink = sinkY > y ? 1 : -1
      const detour = rng() < 0.22 ? verticalBias : towardSink
      const nextY = Math.max(0, Math.min(height - 1, y + detour))
      if (nextY !== y) y = nextY
      else if (canMoveRight) x += 1
    } else {
      x += 1
    }

    const index = toIndex(width, x, y)
    if (path[path.length - 1] !== index) path.push(index)
  }

  return {
    sourceIndex: toIndex(width, 0, sourceY),
    sinkIndex: toIndex(width, width - 1, sinkY),
    path,
  }
}

function makeBoard(width: number, height: number, backbone: number[], sourceIndex: number, sinkIndex: number): FoldCircuitBoard {
  const cellCount = width * height
  const tiles = new Uint8Array(cellCount)
  for (let i = 0; i < cellCount; i += 1) {
    tiles[i] = TILE_CODE.BLOCK
  }

  for (let i = 0; i < backbone.length; i += 1) {
    tiles[backbone[i]] = TILE_CODE.EMPTY
  }

  tiles[sourceIndex] = TILE_CODE.SOURCE
  tiles[sinkIndex] = TILE_CODE.SINK

  return {
    width,
    height,
    sourceIndex,
    sinkIndex,
    tiles,
  }
}

function addDistractors(board: FoldCircuitBoard, seed: number, opennessTarget: number): void {
  const rng = createSeededRng(seed)
  const cellCount = board.width * board.height

  for (let i = 0; i < cellCount; i += 1) {
    if (i === board.sourceIndex || i === board.sinkIndex) continue
    if (board.tiles[i] !== TILE_CODE.BLOCK) continue
    if (rng() < opennessTarget) {
      board.tiles[i] = TILE_CODE.EMPTY
    }
  }
}

function fallbackBoard(width: number, height: number): FoldCircuitBoard {
  const tiles = new Uint8Array(width * height)
  for (let i = 0; i < tiles.length; i += 1) {
    tiles[i] = TILE_CODE.EMPTY
  }

  const sourceIndex = toIndex(width, 0, Math.floor(height / 2))
  const sinkIndex = toIndex(width, width - 1, Math.floor(height / 2))

  tiles[sourceIndex] = TILE_CODE.SOURCE
  tiles[sinkIndex] = TILE_CODE.SINK

  return {
    width,
    height,
    sourceIndex,
    sinkIndex,
    tiles,
  }
}

export function generateFoldCircuitPuzzle(options: GenerateOptions): FoldCircuitPuzzle {
  const width = options.width ?? 6
  const height = options.height ?? 6

  const puzzleSeed = derivePuzzleSeed(options.runSeed, options.puzzleNumber)
  const baseSeed = normalizeSeed(puzzleSeed.runSeed + options.puzzleNumber * 7919)

  let chosenBoard: FoldCircuitBoard | null = null
  let optimumPathLength = 0
  let solverOperations = 0

  for (let attempt = 0; attempt < 120; attempt += 1) {
    const attemptSeed = normalizeSeed(baseSeed + attempt * 97)
    const backbone = carveBackbone(width, height, attemptSeed)
    const board = makeBoard(width, height, backbone.path, backbone.sourceIndex, backbone.sinkIndex)

    const opennessTarget = 0.12 + ((attemptSeed % 11) / 100)
    addDistractors(board, attemptSeed + 33, opennessTarget)

    const validation = validateGeneratedBoard({
      board,
      laws: options.laws,
      operationCap: 22000,
      minPathLength: 6,
    })

    if (!validation.valid) {
      continue
    }

    chosenBoard = board
    optimumPathLength = validation.optimumPathLength
    solverOperations = validation.operations
    break
  }

  if (!chosenBoard) {
    const board = fallbackBoard(width, height)
    const validation = validateGeneratedBoard({ board, laws: options.laws, minPathLength: 6 })
    chosenBoard = board
    optimumPathLength = validation.optimumPathLength
    solverOperations = validation.operations
  }

  return {
    id: `fold-${puzzleSeed.runSeed}-${puzzleSeed.puzzleNumber}`,
    seed: puzzleSeed,
    board: chosenBoard,
    laws: options.laws,
    optimumPathLength,
    solverOperations,
    mutationHistory: options.mutationHistory,
  }
}
