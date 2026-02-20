import { wireCount } from '../tiles'
import type { FoldCircuitBoard, LawSet, SimulationResult } from '../types'
import { createSimulationState, stepSimulation } from './step'

export function runSimulation(board: FoldCircuitBoard, wires: Uint8Array, laws: LawSet): SimulationResult {
  const cellCount = board.width * board.height
  const state = createSimulationState(cellCount, board.sourceIndex, laws.sourcePower)

  let progressed = true
  while (state.tick < laws.tickBudget && progressed) {
    const step = stepSimulation({ board, laws, wires, state })
    progressed = step.progressed
  }

  const activeCells = wireCount(wires)

  let deadCells = 0
  let poweredCells = 0
  for (let i = 0; i < wires.length; i += 1) {
    if (state.bestSignal[i] >= 0) poweredCells += 1
    if (wires[i] === 1 && state.bestSignal[i] < 0) deadCells += 1
  }

  const sinkSignal = state.bestSignal[board.sinkIndex]
  const solved = sinkSignal >= laws.sinkThreshold && activeCells <= laws.maxActiveCells
  const pathCompactness = activeCells <= 0 ? 1 : poweredCells / Math.max(1, activeCells + 2)

  return {
    state,
    stats: {
      solved,
      ticks: state.tick,
      sinkSignal,
      activeCells,
      deadCells,
      pathCompactness,
    },
  }
}
