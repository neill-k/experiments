'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FoldCircuitBoard } from './FoldCircuitBoard'
import { FoldCircuitControls } from './FoldCircuitControls'
import { FoldCircuitHUD } from './FoldCircuitHUD'
import { FoldCircuitOnboarding } from './FoldCircuitOnboarding'
import { announceCellToggle, announceRunFailure, announceSolve } from '@/lib/fold-circuit/a11y/announcer'
import { describeBoardForScreenReader } from '@/lib/fold-circuit/a11y/board-description'
import { replayMoves } from '@/lib/fold-circuit/engine/replay'
import { runSimulation } from '@/lib/fold-circuit/engine/sim'
import { appendMove, clearWires, createEmptyWires, moveCursor, toggleWireAt } from '@/lib/fold-circuit/input/controller'
import { parseFoldCircuitKey } from '@/lib/fold-circuit/input/keyboard'
import { generatePuzzleFromProgress, createInitialProgress, advanceProgressAfterSolve } from '@/lib/fold-circuit/progression'
import { scoreFoldCircuitRun } from '@/lib/fold-circuit/scoring'
import { FoldCircuitPerfTracker } from '@/lib/fold-circuit/perf/metrics'
import { chooseQualityProfile } from '@/lib/fold-circuit/perf/quality'
import type { FoldCircuitMove, FoldCircuitPuzzle, ProgressState, ScoreBreakdown, SimulationResult } from '@/lib/fold-circuit/types'

function randomRunSeed(): number {
  return Math.floor(Math.random() * 0xffffffff)
}

interface RunState {
  progress: ProgressState
  puzzle: FoldCircuitPuzzle
  wires: Uint8Array
  simulation: SimulationResult
  moveLog: FoldCircuitMove[]
  score: ScoreBreakdown | null
  mutationNotice: string
}

function initRunState(seed: number): RunState {
  const progress = createInitialProgress(seed)
  const puzzle = generatePuzzleFromProgress(progress)
  const wires = createEmptyWires(puzzle.board)
  const simulation = runSimulation(puzzle.board, wires, puzzle.laws)

  return {
    progress,
    puzzle,
    wires,
    simulation,
    moveLog: [],
    score: null,
    mutationNotice: 'Solve to trigger the next law mutation.',
  }
}

export function FoldCircuitClient() {
  const [state, setState] = useState<RunState>(() => initRunState(randomRunSeed()))
  const [selectedIndex, setSelectedIndex] = useState<number>(state.puzzle.board.sourceIndex)
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [liveMessage, setLiveMessage] = useState('Fold Circuit loaded.')
  const [reducedMotion, setReducedMotion] = useState(false)
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high')
  const [fpsEstimate, setFpsEstimate] = useState(0)

  const tickCounterRef = useRef(0)
  const perfTrackerRef = useRef(new FoldCircuitPerfTracker())

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()

    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    let running = true
    let raf = 0
    let last = performance.now()

    const frame = (now: number) => {
      if (!running) return
      const frameMs = now - last
      last = now

      perfTrackerRef.current.push(frameMs, now)
      const avg = perfTrackerRef.current.averageFrameMs()
      setQuality(chooseQualityProfile(avg, reducedMotion))
      setFpsEstimate(perfTrackerRef.current.fpsEstimate())

      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)

    return () => {
      running = false
      cancelAnimationFrame(raf)
    }
  }, [reducedMotion])

  const boardDescription = useMemo(() => {
    return describeBoardForScreenReader(state.puzzle.board, state.wires)
  }, [state.puzzle.board, state.wires])

  const onToggleCell = useCallback(
    (index: number) => {
      setState((prev) => {
        const nextWires = toggleWireAt(prev.puzzle.board, prev.wires, index)
        if (nextWires === prev.wires) return prev

        tickCounterRef.current += 1
        const moveLog = appendMove(prev.moveLog, tickCounterRef.current, index, 'toggle')

        setLiveMessage(announceCellToggle(index, nextWires[index] === 1))

        return {
          ...prev,
          wires: nextWires,
          moveLog,
          score: null,
          mutationNotice: 'Route edited. Run to evaluate.',
        }
      })
    },
    [setState],
  )

  const runCurrentBoard = useCallback(() => {
    setState((prev) => {
      const simulation = runSimulation(prev.puzzle.board, prev.wires, prev.puzzle.laws)

      if (!simulation.stats.solved) {
        setLiveMessage(
          announceRunFailure(
            simulation.stats.sinkSignal < prev.puzzle.laws.sinkThreshold
              ? 'Sink threshold not reached'
              : 'Active cell cap exceeded',
          ),
        )

        return {
          ...prev,
          simulation,
          score: null,
          mutationNotice: 'Not solved. Tighten route and run again.',
        }
      }

      const score = scoreFoldCircuitRun({
        puzzle: prev.puzzle,
        wires: prev.wires,
        simulation,
        moveCount: prev.moveLog.length,
      })

      const replay = replayMoves(prev.puzzle, prev.moveLog)
      const deterministicOk = replay.simulation.stats.sinkSignal === simulation.stats.sinkSignal
      const deterministicText = deterministicOk ? 'Replay deterministic check passed.' : 'Replay mismatch detected.'

      setLiveMessage(announceSolve(score, 'Ready for next mutation.'))

      return {
        ...prev,
        simulation,
        score,
        mutationNotice: `${deterministicText} Press Next mutation to continue.`,
      }
    })
  }, [setState])

  const clearBoard = useCallback(() => {
    setState((prev) => {
      const wires = clearWires(prev.puzzle.board)
      const simulation = runSimulation(prev.puzzle.board, wires, prev.puzzle.laws)
      tickCounterRef.current += 1
      const moveLog = appendMove(prev.moveLog, tickCounterRef.current, -1, 'clear')

      setLiveMessage('Board cleared.')

      return {
        ...prev,
        wires,
        simulation,
        moveLog,
        score: null,
        mutationNotice: 'Board cleared. Build a fresh route.',
      }
    })
  }, [setState])

  const nextPuzzle = useCallback(() => {
    setState((prev) => {
      if (!prev.score || !prev.simulation.stats.solved) return prev

      const advanced = advanceProgressAfterSolve(prev.progress, prev.score)
      const wires = createEmptyWires(advanced.nextPuzzle.board)
      const simulation = runSimulation(advanced.nextPuzzle.board, wires, advanced.nextPuzzle.laws)

      setSelectedIndex(advanced.nextPuzzle.board.sourceIndex)
      setLiveMessage(`Advanced to puzzle ${advanced.progress.puzzleNumber}. Mutation applied: ${advanced.mutationLabel}.`)

      return {
        progress: advanced.progress,
        puzzle: advanced.nextPuzzle,
        wires,
        simulation,
        moveLog: [],
        score: null,
        mutationNotice: `Law mutation applied: ${advanced.mutationLabel}`,
      }
    })
  }, [setState])

  const newRunSeed = useCallback(() => {
    const nextSeed = randomRunSeed()
    const initialized = initRunState(nextSeed)
    tickCounterRef.current = 0
    setSelectedIndex(initialized.puzzle.board.sourceIndex)
    setLiveMessage(`New run seed ${nextSeed}.`)
    setState(initialized)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typingContext =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable === true
      if (typingContext) return

      const action = parseFoldCircuitKey(event)
      if (!action) return
      event.preventDefault()

      if (action.type === 'run' || action.type === 'toggle-run') {
        runCurrentBoard()
        return
      }

      if (action.type === 'clear') {
        clearBoard()
        return
      }

      if (action.type === 'next-puzzle') {
        nextPuzzle()
        return
      }

      if (action.type === 'reset') {
        newRunSeed()
        return
      }

      if (action.type === 'cursor') {
        setSelectedIndex((prev) => moveCursor(state.puzzle.board, prev, action.dx, action.dy))
        return
      }

      if (action.type === 'toggle-cell') {
        onToggleCell(selectedIndex)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [clearBoard, newRunSeed, nextPuzzle, onToggleCell, runCurrentBoard, selectedIndex, state.puzzle.board])

  return (
    <div className="fold-circuit-root">
      <header className="fold-circuit-topbar">
        <div>
          <h1 className="fold-circuit-title">Fold Circuit</h1>
          <p className="fold-circuit-subtitle">Route power with minimum active cells. Each solve mutates one law.</p>
        </div>
        <div className="fold-circuit-kpis" aria-label="Runtime telemetry">
          <span>fps {fpsEstimate}</span>
          <span>quality {quality}</span>
          <span>puzzle {state.progress.puzzleNumber}</span>
        </div>
      </header>

      <div className="fold-circuit-layout">
        <section className="fold-circuit-main" aria-label="Puzzle board">
          <FoldCircuitBoard
            puzzle={state.puzzle}
            wires={state.wires}
            bestSignal={state.simulation.state.bestSignal}
            selectedIndex={selectedIndex}
            solved={state.simulation.stats.solved}
            onSelect={setSelectedIndex}
            onToggle={onToggleCell}
          />

          <div className="fold-circuit-controls-wrap">
            <FoldCircuitControls
              canAdvance={Boolean(state.score && state.simulation.stats.solved)}
              onRun={runCurrentBoard}
              onClear={clearBoard}
              onNextPuzzle={nextPuzzle}
              onNewSeed={newRunSeed}
            />
          </div>
        </section>

        <aside className="fold-circuit-side">
          {showOnboarding ? <FoldCircuitOnboarding onDismiss={() => setShowOnboarding(false)} /> : null}
          <FoldCircuitHUD
            puzzle={state.puzzle}
            simulation={state.simulation}
            score={state.score}
            quality={quality}
            mutationNotice={state.mutationNotice}
          />
        </aside>
      </div>

      <p className="fold-circuit-muted" aria-live="polite">
        {liveMessage}
      </p>

      <p className="sr-only" aria-live="polite">
        {boardDescription}
      </p>
    </div>
  )
}
