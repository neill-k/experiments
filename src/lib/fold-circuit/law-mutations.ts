import { clampLawSet } from './laws'
import { createSeededRng, seededPick } from './seed'
import type { FoldCircuitBoard, LawMutation, LawSet } from './types'

export const LAW_MUTATION_CATALOG: LawMutation[] = [
  {
    id: 'attenuation-up',
    label: 'Line Attenuation Up',
    description: 'Each hop loses one extra unit of signal strength.',
    apply: (laws) => ({ ...laws, version: laws.version + 1, attenuationPerStep: laws.attenuationPerStep + 1 }),
  },
  {
    id: 'sink-threshold-up',
    label: 'Sink Threshold Up',
    description: 'The sink now requires stronger arriving signal.',
    apply: (laws) => ({ ...laws, version: laws.version + 1, sinkThreshold: laws.sinkThreshold + 1 }),
  },
  {
    id: 'tick-budget-down',
    label: 'Latency Pressure',
    description: 'Fewer ticks are available before the run times out.',
    apply: (laws) => ({ ...laws, version: laws.version + 1, tickBudget: laws.tickBudget - 2 }),
  },
  {
    id: 'active-cap-down',
    label: 'Heat Cap Tightened',
    description: 'Maximum active cells is reduced, forcing compact routes.',
    apply: (laws) => ({ ...laws, version: laws.version + 1, maxActiveCells: laws.maxActiveCells - 2 }),
  },
  {
    id: 'bleed-enabled',
    label: 'Branch Bleed',
    description: 'Cells with many neighbors lose extra signal.',
    apply: (laws) => ({ ...laws, version: laws.version + 1, bleedLoss: laws.bleedLoss + 1 }),
  },
]

function safeLawSet(laws: LawSet, board: FoldCircuitBoard): LawSet | null {
  const clamped = clampLawSet(laws)
  const boardCellCount = board.width * board.height

  if (clamped.sourcePower <= clamped.sinkThreshold + 1) return null
  if (clamped.maxActiveCells >= boardCellCount) return { ...clamped, maxActiveCells: boardCellCount - 2 }
  if (clamped.maxActiveCells < 6) return null
  if (clamped.tickBudget < 6) return null

  return clamped
}

export function applyLawMutation(
  laws: LawSet,
  mutation: LawMutation,
  board: FoldCircuitBoard,
): LawSet | null {
  const candidate = mutation.apply(laws)
  return safeLawSet(candidate, board)
}

export function chooseNextMutation(options: {
  laws: LawSet
  board: FoldCircuitBoard
  seed: number
  validateCandidate: (laws: LawSet) => boolean
}): { mutation: LawMutation; nextLaws: LawSet } | null {
  const rng = createSeededRng(options.seed + options.laws.version * 101)
  const shuffled = [...LAW_MUTATION_CATALOG]

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = shuffled[i]
    shuffled[i] = shuffled[j]
    shuffled[j] = tmp
  }

  for (let i = 0; i < shuffled.length; i += 1) {
    const mutation = shuffled[i]
    const candidate = applyLawMutation(options.laws, mutation, options.board)
    if (!candidate) continue
    if (!options.validateCandidate(candidate)) continue
    return { mutation, nextLaws: candidate }
  }

  const fallback = seededPick(shuffled, options.seed + 7)
  if (!fallback) return null

  const fallbackCandidate = applyLawMutation(options.laws, fallback, options.board)
  if (!fallbackCandidate) return null
  if (!options.validateCandidate(fallbackCandidate)) return null

  return { mutation: fallback, nextLaws: fallbackCandidate }
}
