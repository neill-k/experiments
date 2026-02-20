interface FoldCircuitOnboardingProps {
  onDismiss: () => void
}

export function FoldCircuitOnboarding({ onDismiss }: FoldCircuitOnboardingProps) {
  return (
    <section className="fold-circuit-panel" aria-label="Onboarding">
      <h2 className="fold-circuit-title">Quick start</h2>
      <ol className="fold-circuit-list">
        <li>Tap or click cells to place wires from source to sink.</li>
        <li>Press Run to evaluate the board with deterministic signal propagation.</li>
        <li>Solve with as few active cells as possible.</li>
        <li>After solve, advance to the next puzzle and accept one law mutation.</li>
      </ol>
      <p className="fold-circuit-muted">
        Keyboard, arrows move focus, Enter toggles, R runs, C clears, N advances, X restarts seed.
      </p>
      <button type="button" onClick={onDismiss} className="fold-circuit-button">
        Start routing
      </button>
    </section>
  )
}
