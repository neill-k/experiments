import { describeLawSet } from '@/lib/fold-circuit/laws'
import type { FoldCircuitPuzzle, QualityProfile, ScoreBreakdown, SimulationResult } from '@/lib/fold-circuit/types'

interface FoldCircuitHUDProps {
  puzzle: FoldCircuitPuzzle
  simulation: SimulationResult
  score: ScoreBreakdown | null
  quality: QualityProfile
  mutationNotice: string
}

export function FoldCircuitHUD({ puzzle, simulation, score, quality, mutationNotice }: FoldCircuitHUDProps) {
  const lawLines = describeLawSet(puzzle.laws)

  return (
    <section className="fold-circuit-panel">
      <div className="fold-circuit-kv-row">
        <span>Puzzle</span>
        <span>{puzzle.seed.puzzleNumber}</span>
      </div>
      <div className="fold-circuit-kv-row">
        <span>Seed</span>
        <span>{puzzle.seed.runSeed}</span>
      </div>
      <div className="fold-circuit-kv-row">
        <span>Quality</span>
        <span>{quality}</span>
      </div>
      <div className="fold-circuit-kv-row">
        <span>Ticks</span>
        <span>
          {simulation.stats.ticks} / {puzzle.laws.tickBudget}
        </span>
      </div>
      <div className="fold-circuit-kv-row">
        <span>Sink Signal</span>
        <span>
          {simulation.stats.sinkSignal} / {puzzle.laws.sinkThreshold}
        </span>
      </div>
      <div className="fold-circuit-kv-row">
        <span>Wires</span>
        <span>
          {simulation.stats.activeCells} / {puzzle.laws.maxActiveCells}
        </span>
      </div>

      <div className="fold-circuit-law-list" aria-label="Current law set">
        {lawLines.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>

      {score ? (
        <div className="fold-circuit-score">
          <div className="fold-circuit-kv-row">
            <span>Rank</span>
            <span>{score.rank}</span>
          </div>
          <div className="fold-circuit-kv-row">
            <span>Total</span>
            <span>{score.total}</span>
          </div>
          <div className="fold-circuit-kv-row">
            <span>Efficiency</span>
            <span>{score.efficiency}</span>
          </div>
          <div className="fold-circuit-kv-row">
            <span>Robustness</span>
            <span>{score.robustness}</span>
          </div>
          <div className="fold-circuit-kv-row">
            <span>Elegance</span>
            <span>{score.elegance}</span>
          </div>
        </div>
      ) : null}

      <div className="fold-circuit-muted">{mutationNotice}</div>
    </section>
  )
}
