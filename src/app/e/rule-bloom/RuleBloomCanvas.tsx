'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createRuleBloomEngine, type RuleBloomStepResult } from '@/lib/rule-bloom/engine'
import { buildRuleBloomParams, type RuleBloomRegime } from '@/lib/rule-bloom/profiles'
import { RuleBloomRenderer } from '@/lib/rule-bloom/render'

interface RuleBloomCanvasProps {
  seed: number
  reducedMotion?: boolean
  regime: RuleBloomRegime
  paused: boolean
  stepSignal: number
  onHudUpdate?: (hud: RuleBloomHudState) => void
}

export interface RuleBloomHudState {
  fps: number
  tick: number
  alive: number
  topples: number
  decay: number
  injected: number
}

const MIN_RENDER_SCALE = 0.6
const MAX_RENDER_SCALE = 1

const EMPTY_HUD: RuleBloomHudState = {
  fps: 0,
  tick: 0,
  alive: 0,
  topples: 0,
  decay: 0,
  injected: 0,
}

export function RuleBloomCanvas({
  seed,
  reducedMotion = false,
  regime,
  paused,
  stepSignal,
  onHudUpdate,
}: RuleBloomCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rendererRef = useRef<RuleBloomRenderer | null>(null)
  const params = useMemo(
    () =>
      buildRuleBloomParams({
        width: 300,
        seed,
        reducedMotion,
        regime,
      }),
    [seed, reducedMotion, regime],
  )

  const engineRef = useRef(createRuleBloomEngine(params))

  const rafRef = useRef<number | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const renderScaleRef = useRef(1)
  const pausedRef = useRef(paused)
  const pausedPropRef = useRef(paused)
  const runningRef = useRef(false)
  const hudRef = useRef<RuleBloomHudState>(EMPTY_HUD)

  const [hud, setHud] = useState<RuleBloomHudState>(EMPTY_HUD)

  const publishHud = useCallback((nextHud: RuleBloomHudState) => {
    hudRef.current = nextHud
    setHud(nextHud)
  }, [])

  useEffect(() => {
    pausedRef.current = paused
    pausedPropRef.current = paused
  }, [paused])

  useEffect(() => {
    if (!onHudUpdate) return
    onHudUpdate(hud)
  }, [hud, onHudUpdate])

  useEffect(() => {
    engineRef.current = createRuleBloomEngine(params)
    publishHud(EMPTY_HUD)
    const snapshot = engineRef.current.snapshot()
    rendererRef.current?.render(snapshot)
  }, [params, publishHud])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new RuleBloomRenderer(canvas, { maxDpr: 2 })
    rendererRef.current = renderer

    const resize = () => {
      const element = canvasRef.current
      const activeRenderer = rendererRef.current
      if (!element || !activeRenderer) return
      const rect = element.getBoundingClientRect()
      activeRenderer.resize({
        cssWidth: Math.max(1, rect.width),
        cssHeight: Math.max(1, rect.height),
        dpr: window.devicePixelRatio || 1,
        scale: renderScaleRef.current,
      })
    }

    resize()
    renderer.render(engineRef.current.snapshot())

    const ro = new ResizeObserver(() => resize())
    ro.observe(canvas)
    resizeObserverRef.current = ro

    const onVisibility = () => {
      pausedRef.current = document.hidden || pausedPropRef.current
    }
    document.addEventListener('visibilitychange', onVisibility)

    runningRef.current = true

    const targetDt = reducedMotion ? 1000 / 24 : 1000 / 48
    const maxSteps = reducedMotion ? 1 : 4

    let lastTs = performance.now()
    let accumulator = 0
    let fpsCounterFrames = 0
    let fpsCounterStart = lastTs
    let lastResult: RuleBloomStepResult | null = null

    const frame = (ts: number) => {
      if (!runningRef.current) return

      const frameStart = performance.now()
      let dt = ts - lastTs
      if (dt > 120) dt = 120
      lastTs = ts

      if (!pausedRef.current) {
        accumulator += dt
        let steps = 0
        while (accumulator >= targetDt && steps < maxSteps) {
          lastResult = engineRef.current.step()
          accumulator -= targetDt
          steps += 1
        }

        if (lastResult) {
          const snapshot = engineRef.current.snapshot()
          renderer.render(snapshot, lastResult.stats)

          fpsCounterFrames += 1
          if (ts - fpsCounterStart >= 500) {
            const fps = Math.round((fpsCounterFrames * 1000) / (ts - fpsCounterStart))
            publishHud({
              fps,
              tick: lastResult.stats.tick,
              alive: lastResult.stats.aliveCount,
              topples: lastResult.stats.topples,
              decay: lastResult.stats.decayApplied,
              injected: lastResult.stats.grainsAddedFromRule,
            })
            fpsCounterFrames = 0
            fpsCounterStart = ts
          }
        }
      }

      const frameMs = performance.now() - frameStart
      const currentScale = renderScaleRef.current

      if (frameMs > 24 && currentScale > MIN_RENDER_SCALE) {
        renderScaleRef.current = Math.max(MIN_RENDER_SCALE, currentScale - 0.06)
        resize()
      } else if (frameMs < 14 && currentScale < MAX_RENDER_SCALE && !reducedMotion) {
        renderScaleRef.current = Math.min(MAX_RENDER_SCALE, currentScale + 0.04)
        resize()
      }

      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)

    return () => {
      runningRef.current = false
      document.removeEventListener('visibilitychange', onVisibility)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
        resizeObserverRef.current = null
      }
      rendererRef.current = null
    }
  }, [publishHud, reducedMotion])

  useEffect(() => {
    if (stepSignal === 0) return

    const result = engineRef.current.step()
    const snapshot = engineRef.current.snapshot()
    rendererRef.current?.render(snapshot, result.stats)

    publishHud({
      fps: hudRef.current.fps,
      tick: result.stats.tick,
      alive: result.stats.aliveCount,
      topples: result.stats.topples,
      decay: result.stats.decayApplied,
      injected: result.stats.grainsAddedFromRule,
    })
  }, [stepSignal, publishHud])

  return (
    <div className="relative h-full w-full border border-white/10 bg-black/20">
      <canvas ref={canvasRef} className="block h-full w-full" aria-label="Rule Bloom simulation canvas" />

      <div className="pointer-events-none absolute left-2 top-2 border border-white/15 bg-[#08080a]/84 px-2 py-1 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.12em] text-white/72 sm:left-3 sm:top-3 sm:text-[11px]">
        <div>
          {paused ? 'paused' : 'live'} · {regime} · fps {hud.fps} · tick {hud.tick}
        </div>
        <div>
          alive {hud.alive} · topple {hud.topples} · decay {hud.decay} · inject {hud.injected}
        </div>
      </div>
    </div>
  )
}
