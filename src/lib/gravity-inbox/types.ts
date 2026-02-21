export type GravityPresetName = 'calm' | 'chaotic' | 'hyperdrive'

export interface GravityPreset {
  name: GravityPresetName
  label: string
  description: string
  gravity: number
  swirl: number
  damping: number
  bounce: number
  mergeSpeed: number
  gatePull: number
  spawnKick: number
  maxSpeed: number
}

export interface GravityGate {
  x: number
  y: number
  width: number
  height: number
}

export interface GravityOrb {
  id: string
  label: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  mass: number
  hue: number
  dragging: boolean
  hotUntil: number
  lastDraggedAt: number
  lastMergedAt: number
}

export interface GravityInboxState {
  width: number
  height: number
  centerX: number
  centerY: number
  presetName: GravityPresetName
  preset: GravityPreset
  reducedMotion: boolean
  gate: GravityGate
  orbs: GravityOrb[]
  launchedCount: number
  completedCount: number
  mergedCount: number
  focusScore: number
  averageSpeed: number
  burnFlash: number
  lastBurnedLabel: string | null
}

export interface GravityStepResult {
  burned: number
  merged: number
}

export interface GravitySnapshot {
  activeCount: number
  completedCount: number
  mergedCount: number
  focusScore: number
}
