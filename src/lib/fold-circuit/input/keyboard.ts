export type FoldCircuitKeyAction =
  | { type: 'toggle-run' }
  | { type: 'run' }
  | { type: 'reset' }
  | { type: 'next-puzzle' }
  | { type: 'clear' }
  | { type: 'cursor'; dx: number; dy: number }
  | { type: 'toggle-cell' }

export function parseFoldCircuitKey(event: KeyboardEvent): FoldCircuitKeyAction | null {
  if (event.metaKey || event.ctrlKey || event.altKey) return null

  if (event.key === ' ') return { type: 'toggle-run' }
  if (event.key.toLowerCase() === 'r') return { type: 'run' }
  if (event.key.toLowerCase() === 'c') return { type: 'clear' }
  if (event.key.toLowerCase() === 'n') return { type: 'next-puzzle' }
  if (event.key.toLowerCase() === 'x') return { type: 'reset' }
  if (event.key === 'Enter') return { type: 'toggle-cell' }

  if (event.key === 'ArrowUp') return { type: 'cursor', dx: 0, dy: -1 }
  if (event.key === 'ArrowDown') return { type: 'cursor', dx: 0, dy: 1 }
  if (event.key === 'ArrowLeft') return { type: 'cursor', dx: -1, dy: 0 }
  if (event.key === 'ArrowRight') return { type: 'cursor', dx: 1, dy: 0 }

  return null
}
