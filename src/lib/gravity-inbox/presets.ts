import type { GravityPreset, GravityPresetName } from './types'

const BASE_PRESETS: Record<GravityPresetName, GravityPreset> = {
  calm: {
    name: 'calm',
    label: 'Calm',
    description: 'Slow orbit, easier to line up intentional burns.',
    gravity: 0.9,
    swirl: 0.7,
    damping: 0.992,
    bounce: 0.86,
    mergeSpeed: 115,
    gatePull: 0.65,
    spawnKick: 90,
    maxSpeed: 230,
  },
  chaotic: {
    name: 'chaotic',
    label: 'Chaotic',
    description: 'Lively field with energetic collisions and quick merges.',
    gravity: 1.24,
    swirl: 1.22,
    damping: 0.988,
    bounce: 0.9,
    mergeSpeed: 155,
    gatePull: 1,
    spawnKick: 135,
    maxSpeed: 315,
  },
  hyperdrive: {
    name: 'hyperdrive',
    label: 'Hyperdrive',
    description: 'Maximum turbulence. Flick hard, burn fast, hold on.',
    gravity: 1.62,
    swirl: 1.86,
    damping: 0.984,
    bounce: 0.93,
    mergeSpeed: 198,
    gatePull: 1.35,
    spawnKick: 188,
    maxSpeed: 420,
  },
}

export const GRAVITY_INBOX_PRESETS = BASE_PRESETS

export function resolveGravityPreset(name: GravityPresetName, reducedMotion: boolean): GravityPreset {
  const base = BASE_PRESETS[name]
  if (!reducedMotion) return base

  return {
    ...base,
    gravity: base.gravity * 0.72,
    swirl: base.swirl * 0.66,
    bounce: 0.82,
    mergeSpeed: base.mergeSpeed * 0.8,
    gatePull: base.gatePull * 0.78,
    spawnKick: base.spawnKick * 0.62,
    maxSpeed: base.maxSpeed * 0.62,
    damping: Math.min(0.996, base.damping + 0.004),
  }
}
