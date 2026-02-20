import { runSimulation } from './engine/sim'
import { clampLawSet } from './laws'
import type { FoldCircuitPuzzle, LawSet, ScoreBreakdown, SimulationResult } from './types'

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value))
}

function robustnessScore(puzzle: FoldCircuitPuzzle, wires: Uint8Array, baseLaws: LawSet): number {
  const variants: LawSet[] = [
    clampLawSet({ ...baseLaws, attenuationPerStep: baseLaws.attenuationPerStep + 1 }),
    clampLawSet({ ...baseLaws, sinkThreshold: baseLaws.sinkThreshold + 1 }),
    clampLawSet({ ...baseLaws, tickBudget: baseLaws.tickBudget - 2 }),
  ]

  let passed = 0
  for (let i = 0; i < variants.length; i += 1) {
    const sim = runSimulation(puzzle.board, wires, variants[i])
    if (sim.stats.solved) passed += 1
  }

  return Math.round((passed / variants.length) * 100)
}

function rankFromTotal(total: number): 'S' | 'A' | 'B' | 'C' {
  if (total >= 90) return 'S'
  if (total >= 75) return 'A'
  if (total >= 60) return 'B'
  return 'C'
}

interface ScoreOptions {
  puzzle: FoldCircuitPuzzle
  wires: Uint8Array
  simulation: SimulationResult
  moveCount: number
}

export function scoreFoldCircuitRun({ puzzle, wires, simulation, moveCount }: ScoreOptions): ScoreBreakdown {
  const optimumWireCount = Math.max(1, puzzle.optimumPathLength - 2)
  const usedWireCount = Math.max(1, simulation.stats.activeCells)

  const efficiencyRaw = (optimumWireCount / usedWireCount) * 100
  const efficiency = clampScore(efficiencyRaw)

  const robustness = robustnessScore(puzzle, wires, puzzle.laws)

  const deadTilePenalty = simulation.stats.deadCells * 2.5
  const movePenalty = Math.max(0, moveCount - optimumWireCount) * 0.8
  const stallingPenalty = simulation.stats.ticks >= puzzle.laws.tickBudget ? 12 : 0

  const eleganceRaw = 100 - deadTilePenalty - movePenalty - stallingPenalty
  const elegance = clampScore(eleganceRaw)

  const penalties = Math.round(deadTilePenalty + movePenalty + stallingPenalty)

  const weightedTotal = simulation.stats.solved
    ? efficiency * 0.42 + robustness * 0.33 + elegance * 0.25
    : Math.min(35, efficiency * 0.2)

  const total = Math.round(clampScore(weightedTotal))

  return {
    efficiency: Math.round(efficiency),
    robustness,
    elegance: Math.round(elegance),
    penalties,
    total,
    rank: rankFromTotal(total),
  }
}
