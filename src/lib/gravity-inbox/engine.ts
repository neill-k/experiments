import { resolveGravityPreset } from './presets'
import type {
  GravityInboxState,
  GravityOrb,
  GravityPresetName,
  GravitySnapshot,
  GravityStepResult,
} from './types'

let orbIdCounter = 0

function nextOrbId(): string {
  orbIdCounter += 1
  return `g-orb-${orbIdCounter}`
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function distance(ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax
  const dy = by - ay
  return Math.sqrt(dx * dx + dy * dy)
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function computeGate(width: number, height: number): GravityInboxState['gate'] {
  const gateWidth = clamp(width * 0.1, 56, 88)
  const gateHeight = clamp(height * 0.46, 140, 270)
  return {
    x: width - gateWidth - 14,
    y: (height - gateHeight) * 0.5,
    width: gateWidth,
    height: gateHeight,
  }
}

function mergeLabels(a: string, b: string): string {
  if (a === b) return a

  const compactA = a.trim().replace(/\s+/g, ' ')
  const compactB = b.trim().replace(/\s+/g, ' ')
  const joined = `${compactA} + ${compactB}`
  if (joined.length <= 34) return joined

  const shortA = compactA.length > 16 ? `${compactA.slice(0, 15)}…` : compactA
  const shortB = compactB.length > 16 ? `${compactB.slice(0, 15)}…` : compactB
  return `${shortA} + ${shortB}`
}

function recomputeFocus(state: GravityInboxState): void {
  const active = state.orbs.length
  const completionRatio = state.completedCount / Math.max(1, state.launchedCount)
  const clutter = clamp((active - 3) / 12, 0, 1)
  const kineticNoise = clamp(state.averageSpeed / 260, 0, 1)

  const score =
    completionRatio * 58 +
    (1 - clutter) * 20 +
    (1 - kineticNoise) * 22 +
    Math.min(10, state.completedCount * 1.6)

  state.focusScore = Math.round(clamp(score, 0, 100))
}

function updateAverageSpeed(state: GravityInboxState): void {
  if (state.orbs.length === 0) {
    state.averageSpeed = 0
    return
  }

  let total = 0
  for (const orb of state.orbs) {
    total += Math.hypot(orb.vx, orb.vy)
  }
  state.averageSpeed = total / state.orbs.length
}

function burnOrb(state: GravityInboxState, orbId: string): boolean {
  const index = state.orbs.findIndex((orb) => orb.id === orbId)
  if (index === -1) return false

  const [orb] = state.orbs.splice(index, 1)
  state.completedCount += 1
  state.lastBurnedLabel = orb.label
  state.burnFlash = 1
  updateAverageSpeed(state)
  recomputeFocus(state)
  return true
}

export function createGravityInboxState(
  width: number,
  height: number,
  presetName: GravityPresetName,
  reducedMotion: boolean,
): GravityInboxState {
  const safeWidth = Math.max(280, Math.floor(width))
  const safeHeight = Math.max(260, Math.floor(height))

  const state: GravityInboxState = {
    width: safeWidth,
    height: safeHeight,
    centerX: safeWidth * 0.44,
    centerY: safeHeight * 0.5,
    presetName,
    preset: resolveGravityPreset(presetName, reducedMotion),
    reducedMotion,
    gate: computeGate(safeWidth, safeHeight),
    orbs: [],
    launchedCount: 0,
    completedCount: 0,
    mergedCount: 0,
    focusScore: 0,
    averageSpeed: 0,
    burnFlash: 0,
    lastBurnedLabel: null,
  }

  recomputeFocus(state)
  return state
}

export function resizeGravityInbox(state: GravityInboxState, width: number, height: number): void {
  state.width = Math.max(280, Math.floor(width))
  state.height = Math.max(260, Math.floor(height))
  state.centerX = state.width * 0.44
  state.centerY = state.height * 0.5
  state.gate = computeGate(state.width, state.height)

  for (const orb of state.orbs) {
    orb.x = clamp(orb.x, orb.radius, state.width - orb.radius)
    orb.y = clamp(orb.y, orb.radius, state.height - orb.radius)
  }
}

export function setGravityInboxPreset(
  state: GravityInboxState,
  presetName: GravityPresetName,
  reducedMotion: boolean,
): void {
  state.presetName = presetName
  state.reducedMotion = reducedMotion
  state.preset = resolveGravityPreset(presetName, reducedMotion)
}

export function getGravitySnapshot(state: GravityInboxState): GravitySnapshot {
  return {
    activeCount: state.orbs.length,
    completedCount: state.completedCount,
    mergedCount: state.mergedCount,
    focusScore: state.focusScore,
  }
}

export function spawnGravityOrb(state: GravityInboxState, label: string, now: number): GravityOrb | null {
  const normalized = label.trim().replace(/\s+/g, ' ')
  if (!normalized) return null

  const radius = clamp(22 + normalized.length * 0.72, 24, 54)
  const angle = Math.random() * Math.PI * 2
  const orbitRadius = randomBetween(28, Math.max(60, Math.min(state.width, state.height) * 0.24))

  const x = clamp(state.centerX + Math.cos(angle) * orbitRadius, radius, state.width - radius)
  const y = clamp(state.centerY + Math.sin(angle) * orbitRadius, radius, state.height - radius)
  const speed = state.preset.spawnKick * randomBetween(0.72, 1.2)
  const tangent = angle + Math.PI / 2

  const orb: GravityOrb = {
    id: nextOrbId(),
    label: normalized,
    x,
    y,
    vx: Math.cos(tangent) * speed,
    vy: Math.sin(tangent) * speed,
    radius,
    mass: Math.max(1, radius * 0.08),
    hue: randomBetween(198, 332),
    dragging: false,
    hotUntil: now + 1800,
    lastDraggedAt: now,
    lastMergedAt: 0,
  }

  state.orbs.push(orb)
  state.launchedCount += 1
  updateAverageSpeed(state)
  recomputeFocus(state)
  return orb
}

export function pickGravityOrb(state: GravityInboxState, x: number, y: number): GravityOrb | null {
  for (let i = state.orbs.length - 1; i >= 0; i -= 1) {
    const orb = state.orbs[i]
    if (distance(x, y, orb.x, orb.y) <= orb.radius + 10) {
      return orb
    }
  }
  return null
}

export function bringOrbToFront(state: GravityInboxState, orbId: string): void {
  const index = state.orbs.findIndex((orb) => orb.id === orbId)
  if (index < 0 || index === state.orbs.length - 1) return
  const [orb] = state.orbs.splice(index, 1)
  state.orbs.push(orb)
}

export function dragGravityOrb(
  state: GravityInboxState,
  orbId: string,
  x: number,
  y: number,
  velocityX: number,
  velocityY: number,
  now: number,
): boolean {
  const orb = state.orbs.find((candidate) => candidate.id === orbId)
  if (!orb) return false

  orb.dragging = true
  orb.x = clamp(x, orb.radius, state.width - orb.radius)
  orb.y = clamp(y, orb.radius, state.height - orb.radius)
  orb.vx = velocityX
  orb.vy = velocityY
  orb.lastDraggedAt = now
  orb.hotUntil = now + 2200

  updateAverageSpeed(state)
  recomputeFocus(state)

  return maybeBurnAtGate(state, orb.id, now)
}

export function releaseGravityOrb(
  state: GravityInboxState,
  orbId: string,
  velocityX: number,
  velocityY: number,
  now: number,
): boolean {
  const orb = state.orbs.find((candidate) => candidate.id === orbId)
  if (!orb) return false

  orb.dragging = false
  orb.vx = clamp(velocityX, -state.preset.maxSpeed, state.preset.maxSpeed)
  orb.vy = clamp(velocityY, -state.preset.maxSpeed, state.preset.maxSpeed)
  orb.hotUntil = now + 1800

  updateAverageSpeed(state)
  recomputeFocus(state)

  return maybeBurnAtGate(state, orb.id, now)
}

export function isInsideBurnGate(state: GravityInboxState, x: number, y: number): boolean {
  return (
    x >= state.gate.x &&
    x <= state.gate.x + state.gate.width &&
    y >= state.gate.y &&
    y <= state.gate.y + state.gate.height
  )
}

function maybeBurnAtGate(state: GravityInboxState, orbId: string, now: number): boolean {
  const orb = state.orbs.find((candidate) => candidate.id === orbId)
  if (!orb) return false
  if (now > orb.hotUntil) return false
  return isInsideBurnGate(state, orb.x, orb.y) ? burnOrb(state, orb.id) : false
}

function resolveCollisions(state: GravityInboxState, now: number): GravityStepResult {
  let merged = 0

  for (let i = 0; i < state.orbs.length; i += 1) {
    let mergedThisPair = false
    const a = state.orbs[i]
    if (!a || a.dragging) continue

    for (let j = i + 1; j < state.orbs.length; j += 1) {
      const b = state.orbs[j]
      if (!b || b.dragging) continue

      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.hypot(dx, dy)
      const minDist = a.radius + b.radius

      if (dist >= minDist || dist === 0) continue

      const nx = dx / dist
      const ny = dy / dist

      const relVx = b.vx - a.vx
      const relVy = b.vy - a.vy
      const relSpeed = Math.hypot(relVx, relVy)

      const overlap = minDist - dist
      a.x -= nx * overlap * 0.5
      a.y -= ny * overlap * 0.5
      b.x += nx * overlap * 0.5
      b.y += ny * overlap * 0.5

      const canMerge =
        relSpeed <= state.preset.mergeSpeed &&
        now - a.lastMergedAt > 480 &&
        now - b.lastMergedAt > 480 &&
        a.radius < 66 &&
        b.radius < 66

      if (canMerge) {
        const mergedOrb: GravityOrb = {
          id: nextOrbId(),
          label: mergeLabels(a.label, b.label),
          x: (a.x + b.x) * 0.5,
          y: (a.y + b.y) * 0.5,
          vx: (a.vx + b.vx) * 0.5,
          vy: (a.vy + b.vy) * 0.5,
          radius: clamp(Math.sqrt(a.radius * a.radius + b.radius * b.radius) * 0.78, 28, 74),
          mass: Math.max(1.2, (a.mass + b.mass) * 0.92),
          hue: (a.hue + b.hue) * 0.5,
          dragging: false,
          hotUntil: Math.max(a.hotUntil, b.hotUntil),
          lastDraggedAt: Math.max(a.lastDraggedAt, b.lastDraggedAt),
          lastMergedAt: now,
        }

        state.orbs.splice(j, 1)
        state.orbs.splice(i, 1)
        state.orbs.push(mergedOrb)
        state.mergedCount += 1
        merged += 1
        mergedThisPair = true
        i -= 1
        break
      }

      const velocityAlongNormal = relVx * nx + relVy * ny
      if (velocityAlongNormal > 0) continue

      const restitution = state.preset.bounce
      const impulse = (-(1 + restitution) * velocityAlongNormal) / (1 / a.mass + 1 / b.mass)
      const impulseX = impulse * nx
      const impulseY = impulse * ny

      a.vx -= impulseX / a.mass
      a.vy -= impulseY / a.mass
      b.vx += impulseX / b.mass
      b.vy += impulseY / b.mass
    }

    if (mergedThisPair) continue
  }

  return { burned: 0, merged }
}

export function stepGravityInbox(state: GravityInboxState, dtSeconds: number, now: number): GravityStepResult {
  const dt = clamp(dtSeconds, 0.001, state.reducedMotion ? 1 / 24 : 1 / 42)
  state.burnFlash = Math.max(0, state.burnFlash - dt * 1.9)

  const centerX = state.centerX
  const centerY = state.centerY
  const pullScale = state.preset.gravity * 180
  const swirlScale = state.preset.swirl * 145
  const gateCenterX = state.gate.x + state.gate.width * 0.5
  const gateCenterY = state.gate.y + state.gate.height * 0.5
  const gatePull = state.preset.gatePull * 210

  for (const orb of state.orbs) {
    if (orb.dragging) continue

    const toCenterX = centerX - orb.x
    const toCenterY = centerY - orb.y
    const centerDist = Math.max(60, Math.hypot(toCenterX, toCenterY))
    const centerInv = 1 / centerDist

    orb.vx += toCenterX * centerInv * pullScale * dt
    orb.vy += toCenterY * centerInv * pullScale * dt

    orb.vx += -toCenterY * centerInv * swirlScale * dt
    orb.vy += toCenterX * centerInv * swirlScale * dt

    if (orb.x > state.gate.x - 160) {
      const toGateX = gateCenterX - orb.x
      const toGateY = gateCenterY - orb.y
      const gateDist = Math.max(28, Math.hypot(toGateX, toGateY))
      const gateInv = 1 / gateDist
      orb.vx += toGateX * gateInv * gatePull * dt
      orb.vy += toGateY * gateInv * gatePull * dt
    }

    if (state.presetName === 'hyperdrive' && !state.reducedMotion) {
      orb.vx += randomBetween(-14, 14) * dt
      orb.vy += randomBetween(-14, 14) * dt
    }

    const dampingFrame = Math.pow(state.preset.damping, dt * 60)
    orb.vx *= dampingFrame
    orb.vy *= dampingFrame

    const speed = Math.hypot(orb.vx, orb.vy)
    if (speed > state.preset.maxSpeed) {
      const scale = state.preset.maxSpeed / speed
      orb.vx *= scale
      orb.vy *= scale
    }

    orb.x += orb.vx * dt
    orb.y += orb.vy * dt

    if (orb.x < orb.radius) {
      orb.x = orb.radius
      orb.vx = Math.abs(orb.vx) * state.preset.bounce
    } else if (orb.x > state.width - orb.radius) {
      orb.x = state.width - orb.radius
      orb.vx = -Math.abs(orb.vx) * state.preset.bounce
    }

    if (orb.y < orb.radius) {
      orb.y = orb.radius
      orb.vy = Math.abs(orb.vy) * state.preset.bounce
    } else if (orb.y > state.height - orb.radius) {
      orb.y = state.height - orb.radius
      orb.vy = -Math.abs(orb.vy) * state.preset.bounce
    }
  }

  const collisions = resolveCollisions(state, now)

  let burned = 0
  for (let i = state.orbs.length - 1; i >= 0; i -= 1) {
    const orb = state.orbs[i]
    if (orb.dragging) continue
    if (now > orb.hotUntil) continue
    if (!isInsideBurnGate(state, orb.x, orb.y)) continue

    const didBurn = burnOrb(state, orb.id)
    if (didBurn) burned += 1
  }

  updateAverageSpeed(state)
  recomputeFocus(state)

  return {
    burned,
    merged: collisions.merged,
  }
}
