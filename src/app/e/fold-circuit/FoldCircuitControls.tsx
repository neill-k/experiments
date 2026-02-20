interface FoldCircuitControlsProps {
  canAdvance: boolean
  onRun: () => void
  onClear: () => void
  onNextPuzzle: () => void
  onNewSeed: () => void
}

export function FoldCircuitControls({ canAdvance, onRun, onClear, onNextPuzzle, onNewSeed }: FoldCircuitControlsProps) {
  return (
    <div className="fold-circuit-controls" role="toolbar" aria-label="Fold Circuit controls">
      <button type="button" onClick={onRun} className="fold-circuit-button" aria-keyshortcuts="R">
        Run
      </button>
      <button type="button" onClick={onClear} className="fold-circuit-button" aria-keyshortcuts="C">
        Clear
      </button>
      <button
        type="button"
        onClick={onNextPuzzle}
        className="fold-circuit-button"
        aria-keyshortcuts="N"
        disabled={!canAdvance}
      >
        Next mutation
      </button>
      <button type="button" onClick={onNewSeed} className="fold-circuit-button" aria-keyshortcuts="X">
        New run seed
      </button>
    </div>
  )
}
