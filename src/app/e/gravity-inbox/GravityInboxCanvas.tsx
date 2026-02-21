'use client'

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import {
  bringOrbToFront,
  createGravityInboxState,
  dragGravityOrb,
  getGravitySnapshot,
  pickGravityOrb,
  releaseGravityOrb,
  resizeGravityInbox,
  setGravityInboxPreset,
  spawnGravityOrb,
  stepGravityInbox,
} from '@/lib/gravity-inbox'
import type { GravityInboxState, GravityPresetName } from '@/lib/gravity-inbox'

export interface GravityInboxHudState {
  activeCount: number
  completedCount: number
  mergedCount: number
  focusScore: number
}

export interface GravitySpawnRequest {
  id: number
  label: string
}

interface GravityInboxCanvasProps {
  preset: GravityPresetName
  reducedMotion: boolean
  spawnRequest: GravitySpawnRequest | null
  onHudUpdate: (hud: GravityInboxHudState) => void
  onBurn: (label: string) => void
}

interface DragContext {
  pointerId: number
  orbId: string
  offsetX: number
  offsetY: number
  lastX: number
  lastY: number
  lastAt: number
  velocityX: number
  velocityY: number
}

interface Star {
  x: number
  y: number
  r: number
  phase: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function toLocalPoint(canvas: HTMLCanvasElement, event: ReactPointerEvent<HTMLCanvasElement>) {
  const rect = canvas.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

function generateStars(width: number, height: number): Star[] {
  const area = width * height
  const count = clamp(Math.floor(area / 17000), 14, 80)
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: 0.6 + Math.random() * 1.7,
    phase: Math.random() * Math.PI * 2,
  }))
}

function trimLabel(ctx: CanvasRenderingContext2D, label: string, maxWidth: number): string {
  if (ctx.measureText(label).width <= maxWidth) return label
  const chars = Array.from(label)
  while (chars.length > 3) {
    chars.pop()
    const next = `${chars.join('')}…`
    if (ctx.measureText(next).width <= maxWidth) return next
  }
  return '…'
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  state: GravityInboxState,
  stars: Star[],
  now: number,
): void {
  const width = state.width
  const height = state.height

  ctx.clearRect(0, 0, width, height)

  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#04050a')
  gradient.addColorStop(0.45, '#070a14')
  gradient.addColorStop(1, '#0a0711')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  for (const star of stars) {
    const twinkle = state.reducedMotion ? 0.45 : 0.35 + Math.sin(now * 0.0012 + star.phase) * 0.28
    ctx.globalAlpha = clamp(twinkle, 0.15, 0.82)
    ctx.fillStyle = '#b8cbff'
    ctx.fillRect(star.x, star.y, star.r, star.r)
  }
  ctx.globalAlpha = 1

  const baseRadius = Math.min(width, height) * 0.24
  const ringCount = state.reducedMotion ? 2 : 3
  ctx.lineWidth = 1
  for (let i = 0; i < ringCount; i += 1) {
    const pulse = state.reducedMotion ? 0 : Math.sin(now * 0.001 + i * 1.6) * 6
    const radius = baseRadius + i * 54 + pulse
    ctx.strokeStyle = `rgba(130, 170, 255, ${0.09 - i * 0.018})`
    ctx.beginPath()
    ctx.arc(state.centerX, state.centerY, radius, 0, Math.PI * 2)
    ctx.stroke()
  }

  const gate = state.gate
  const gateGlow = 0.22 + state.burnFlash * 0.5
  ctx.fillStyle = `rgba(255, 97, 43, ${0.09 + state.burnFlash * 0.15})`
  ctx.fillRect(gate.x, gate.y, gate.width, gate.height)

  ctx.strokeStyle = `rgba(255, 129, 87, ${0.5 + state.burnFlash * 0.28})`
  ctx.lineWidth = 2
  ctx.strokeRect(gate.x, gate.y, gate.width, gate.height)

  const stripeCount = Math.max(4, Math.floor(gate.height / 22))
  for (let i = 0; i < stripeCount; i += 1) {
    const y = gate.y + (i / stripeCount) * gate.height
    ctx.strokeStyle = `rgba(255, 180, 145, ${0.08 + gateGlow * 0.2})`
    ctx.beginPath()
    ctx.moveTo(gate.x, y)
    ctx.lineTo(gate.x + gate.width, y + 14)
    ctx.stroke()
  }

  ctx.fillStyle = 'rgba(255, 214, 197, 0.85)'
  ctx.font = '600 10px var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('BURN GATE', gate.x + gate.width / 2, gate.y + 8)

  for (const orb of state.orbs) {
    const orbGradient = ctx.createRadialGradient(
      orb.x - orb.radius * 0.34,
      orb.y - orb.radius * 0.34,
      orb.radius * 0.22,
      orb.x,
      orb.y,
      orb.radius * 1.05,
    )
    const hot = orb.hotUntil > now ? 1 : 0
    const hue = Math.round(orb.hue)

    orbGradient.addColorStop(0, `hsla(${hue} 95% 72% / ${0.95 - hot * 0.04})`)
    orbGradient.addColorStop(0.5, `hsla(${hue + 10} 88% 56% / 0.94)`)
    orbGradient.addColorStop(1, `hsla(${hue + 34} 78% 36% / 0.95)`)

    if (!state.reducedMotion) {
      ctx.shadowBlur = orb.dragging ? 24 : 16
      ctx.shadowColor = `hsla(${hue + 8} 100% 72% / 0.45)`
    }

    ctx.fillStyle = orbGradient
    ctx.beginPath()
    ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2)
    ctx.fill()

    ctx.shadowBlur = 0
    ctx.strokeStyle = orb.dragging ? 'rgba(255, 244, 212, 0.95)' : 'rgba(255, 255, 255, 0.42)'
    ctx.lineWidth = orb.dragging ? 2.6 : 1.3
    ctx.beginPath()
    ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2)
    ctx.stroke()

    const textSize = clamp(orb.radius * 0.35, 11, 16)
    ctx.font = `600 ${textSize}px var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace`
    ctx.fillStyle = 'rgba(255, 253, 249, 0.96)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const label = trimLabel(ctx, orb.label, orb.radius * 1.6)
    ctx.fillText(label, orb.x, orb.y)
  }

  if (state.orbs.length === 0) {
    ctx.fillStyle = 'rgba(214, 224, 255, 0.72)'
    ctx.font = '600 14px var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Launch a priority to begin orbit.', state.centerX, state.centerY - 10)

    ctx.fillStyle = 'rgba(214, 224, 255, 0.42)'
    ctx.font = '500 11px var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace'
    ctx.fillText('Drag an orb into the burn gate when done.', state.centerX, state.centerY + 14)
  }
}

export function GravityInboxCanvas({
  preset,
  reducedMotion,
  spawnRequest,
  onHudUpdate,
  onBurn,
}: GravityInboxCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stateRef = useRef<GravityInboxState | null>(null)
  const dragRef = useRef<DragContext | null>(null)
  const starsRef = useRef<Star[]>([])
  const rafRef = useRef(0)
  const lastSpawnIdRef = useRef<number>(0)
  const hudCallbackRef = useRef(onHudUpdate)
  const burnCallbackRef = useRef(onBurn)

  useEffect(() => {
    hudCallbackRef.current = onHudUpdate
  }, [onHudUpdate])

  useEffect(() => {
    burnCallbackRef.current = onBurn
  }, [onBurn])

  useEffect(() => {
    const state = stateRef.current
    if (!state) return
    setGravityInboxPreset(state, preset, reducedMotion)
  }, [preset, reducedMotion])

  useEffect(() => {
    if (!spawnRequest || spawnRequest.id === lastSpawnIdRef.current) return

    const state = stateRef.current
    if (!state) return

    const now = performance.now()
    spawnGravityOrb(state, spawnRequest.label, now)
    lastSpawnIdRef.current = spawnRequest.id
    hudCallbackRef.current(getGravitySnapshot(state))
  }, [spawnRequest])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const initRect = canvas.getBoundingClientRect()
    const state = createGravityInboxState(initRect.width, initRect.height, preset, reducedMotion)
    stateRef.current = state

    const publishHud = () => {
      const current = stateRef.current
      if (!current) return
      hudCallbackRef.current(getGravitySnapshot(current))
    }

    const resize = () => {
      const current = stateRef.current
      if (!current) return

      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      resizeGravityInbox(current, rect.width, rect.height)
      starsRef.current = generateStars(rect.width, rect.height)
      publishHud()
    }

    resize()
    window.addEventListener('resize', resize)

    let lastAt = performance.now()
    let lastHudAt = 0

    const frame = (now: number) => {
      const current = stateRef.current
      if (!current) return

      const dt = (now - lastAt) / 1000
      lastAt = now

      const result = stepGravityInbox(current, dt, now)
      drawScene(ctx, current, starsRef.current, now)

      if (result.burned > 0 && current.lastBurnedLabel) {
        burnCallbackRef.current(current.lastBurnedLabel)
      }

      if (now - lastHudAt > 120 || result.burned > 0 || result.merged > 0) {
        publishHud()
        lastHudAt = now
      }

      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  const clearDrag = (canvas: HTMLCanvasElement) => {
    const drag = dragRef.current
    if (!drag) return
    dragRef.current = null
    try {
      canvas.releasePointerCapture(drag.pointerId)
    } catch {
      // ignored; pointer may already be released
    }
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const state = stateRef.current
    if (!canvas || !state) return

    const point = toLocalPoint(canvas, event)
    const orb = pickGravityOrb(state, point.x, point.y)
    if (!orb) return

    event.preventDefault()
    bringOrbToFront(state, orb.id)

    dragRef.current = {
      pointerId: event.pointerId,
      orbId: orb.id,
      offsetX: orb.x - point.x,
      offsetY: orb.y - point.y,
      lastX: orb.x,
      lastY: orb.y,
      lastAt: performance.now(),
      velocityX: 0,
      velocityY: 0,
    }

    dragGravityOrb(state, orb.id, orb.x, orb.y, 0, 0, performance.now())
    hudCallbackRef.current(getGravitySnapshot(state))

    try {
      canvas.setPointerCapture(event.pointerId)
    } catch {
      // ignored on browsers that cannot capture this pointer
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const state = stateRef.current
    const drag = dragRef.current
    if (!canvas || !state || !drag) return
    if (drag.pointerId !== event.pointerId) return

    event.preventDefault()
    const point = toLocalPoint(canvas, event)
    const x = point.x + drag.offsetX
    const y = point.y + drag.offsetY
    const now = performance.now()
    const dt = Math.max(0.008, (now - drag.lastAt) / 1000)
    const velocityX = clamp((x - drag.lastX) / dt, -state.preset.maxSpeed * 1.15, state.preset.maxSpeed * 1.15)
    const velocityY = clamp((y - drag.lastY) / dt, -state.preset.maxSpeed * 1.15, state.preset.maxSpeed * 1.15)

    drag.lastX = x
    drag.lastY = y
    drag.lastAt = now
    drag.velocityX = velocityX
    drag.velocityY = velocityY

    const burned = dragGravityOrb(state, drag.orbId, x, y, velocityX, velocityY, now)
    if (burned) {
      if (state.lastBurnedLabel) burnCallbackRef.current(state.lastBurnedLabel)
      clearDrag(canvas)
    }

    hudCallbackRef.current(getGravitySnapshot(state))
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const state = stateRef.current
    const drag = dragRef.current
    if (!canvas || !state || !drag) return
    if (drag.pointerId !== event.pointerId) return

    event.preventDefault()
    const now = performance.now()
    const burned = releaseGravityOrb(state, drag.orbId, drag.velocityX, drag.velocityY, now)

    if (burned && state.lastBurnedLabel) {
      burnCallbackRef.current(state.lastBurnedLabel)
    }

    clearDrag(canvas)
    hudCallbackRef.current(getGravitySnapshot(state))
  }

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="h-[58dvh] min-h-[360px] w-full touch-none border border-white/20 bg-[#020309]"
      aria-label="Gravity Inbox orbital canvas"
    />
  )
}
