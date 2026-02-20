import type { FoldCircuitBoard, LawSet, PuzzleSeed } from './types'

const UINT32_MAX = 0xffffffff

export function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) return 0x9e3779b9
  const value = Math.trunc(seed) >>> 0
  return value === 0 ? 0x6d2b79f5 : value
}

export function nextRandom(state: number): { state: number; value: number } {
  let x = normalizeSeed(state)
  x ^= x << 13
  x ^= x >>> 17
  x ^= x << 5
  x >>>= 0
  return {
    state: x,
    value: x / (UINT32_MAX + 1),
  }
}

export function createSeededRng(seed: number): () => number {
  let state = normalizeSeed(seed)
  return () => {
    const next = nextRandom(state)
    state = next.state
    return next.value
  }
}

export function seededInt(seed: number, maxExclusive: number): number {
  const safeMax = Math.max(1, Math.trunc(maxExclusive))
  const next = nextRandom(seed)
  return Math.floor(next.value * safeMax)
}

export function seededPick<T>(items: T[], seed: number): T | null {
  if (items.length === 0) return null
  return items[seededInt(seed, items.length)]
}

export function derivePuzzleSeed(runSeed: number, puzzleNumber: number): PuzzleSeed {
  return {
    runSeed: normalizeSeed(runSeed),
    puzzleNumber: Math.max(1, Math.trunc(puzzleNumber)),
  }
}

function encodeBytes(bytes: Uint8Array): string {
  let text = ''
  for (let i = 0; i < bytes.length; i += 1) {
    text += String.fromCharCode(bytes[i])
  }
  return btoa(text)
}

function decodeBytes(input: string): Uint8Array {
  const decoded = atob(input)
  const out = new Uint8Array(decoded.length)
  for (let i = 0; i < decoded.length; i += 1) {
    out[i] = decoded.charCodeAt(i)
  }
  return out
}

export function serializeBoardState(board: FoldCircuitBoard, laws: LawSet): string {
  return JSON.stringify({
    width: board.width,
    height: board.height,
    sourceIndex: board.sourceIndex,
    sinkIndex: board.sinkIndex,
    tiles: encodeBytes(board.tiles),
    laws,
  })
}

export function parseBoardState(raw: string): { board: FoldCircuitBoard; laws: LawSet } | null {
  try {
    const parsed = JSON.parse(raw) as {
      width: number
      height: number
      sourceIndex: number
      sinkIndex: number
      tiles: string
      laws: LawSet
    }

    const tiles = decodeBytes(parsed.tiles)
    const board: FoldCircuitBoard = {
      width: parsed.width,
      height: parsed.height,
      sourceIndex: parsed.sourceIndex,
      sinkIndex: parsed.sinkIndex,
      tiles,
    }

    return { board, laws: parsed.laws }
  } catch {
    return null
  }
}
