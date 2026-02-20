export const TILE_CODE = {
  EMPTY: 0,
  BLOCK: 1,
  SOURCE: 2,
  SINK: 3,
} as const

export type TileCode = (typeof TILE_CODE)[keyof typeof TILE_CODE]

export type TileKind = 'empty' | 'block' | 'source' | 'sink' | 'wire'

export interface Position {
  x: number
  y: number
}

export interface FoldCircuitBoard {
  width: number
  height: number
  sourceIndex: number
  sinkIndex: number
  tiles: Uint8Array
}

export interface LawSet {
  version: number
  sourcePower: number
  attenuationPerStep: number
  sinkThreshold: number
  tickBudget: number
  maxActiveCells: number
  bleedLoss: number
}

export interface LawMutation {
  id: string
  label: string
  description: string
  apply: (laws: LawSet) => LawSet
}

export interface PuzzleSeed {
  runSeed: number
  puzzleNumber: number
}

export interface FoldCircuitPuzzle {
  id: string
  seed: PuzzleSeed
  board: FoldCircuitBoard
  laws: LawSet
  optimumPathLength: number
  solverOperations: number
  mutationHistory: string[]
}

export interface SimulationState {
  tick: number
  currentSignal: Int16Array
  nextSignal: Int16Array
  bestSignal: Int16Array
  visited: Uint8Array
}

export interface SimulationStats {
  solved: boolean
  ticks: number
  sinkSignal: number
  activeCells: number
  deadCells: number
  pathCompactness: number
}

export interface SimulationResult {
  state: SimulationState
  stats: SimulationStats
}

export interface SolveResult {
  solved: boolean
  path: number[]
  pathLength: number
  operations: number
}

export interface ScoreBreakdown {
  efficiency: number
  robustness: number
  elegance: number
  penalties: number
  total: number
  rank: 'S' | 'A' | 'B' | 'C'
}

export interface ProgressState {
  runSeed: number
  puzzleNumber: number
  laws: LawSet
  mutationHistory: string[]
  scoreTotal: number
}

export interface FoldCircuitMove {
  tick: number
  index: number
  action: 'toggle' | 'clear'
}

export interface RunSnapshot {
  puzzleId: string
  wires: Uint8Array
  solved: boolean
  score: ScoreBreakdown
}

export type QualityProfile = 'high' | 'medium' | 'low'
