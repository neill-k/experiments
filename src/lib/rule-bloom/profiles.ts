import { DEFAULT_RULE_BLOOM_PARAMS } from './params'
import type { RuleBloomParams } from './types'

export type RuleBloomRegime = 'calm' | 'balanced' | 'volatile'

interface RuleBloomRegimePreset {
  label: string
  description: string
  initialAliveChance: number
  maxTopplesPerStep: number
  decayChecksPerStep: number
  decayChance: number
  grainsPerAliveCell: number
  grainToRuleChance: number
}

export const RULE_BLOOM_REGIMES: Record<RuleBloomRegime, RuleBloomRegimePreset> = {
  calm: {
    label: 'Calm',
    description: 'Slow drift with occasional cascades.',
    initialAliveChance: 0.06,
    maxTopplesPerStep: 1200,
    decayChecksPerStep: 200,
    decayChance: 0.011,
    grainsPerAliveCell: 1,
    grainToRuleChance: 0.09,
  },
  balanced: {
    label: 'Balanced',
    description: 'Steady turbulence and medium cascade density.',
    initialAliveChance: 0.08,
    maxTopplesPerStep: 3000,
    decayChecksPerStep: 420,
    decayChance: 0.02,
    grainsPerAliveCell: 1,
    grainToRuleChance: 0.15,
  },
  volatile: {
    label: 'Volatile',
    description: 'Dense coupling, fast saturation, frequent bursts.',
    initialAliveChance: 0.11,
    maxTopplesPerStep: 5400,
    decayChecksPerStep: 660,
    decayChance: 0.028,
    grainsPerAliveCell: 2,
    grainToRuleChance: 0.24,
  },
}

function scaleInt(value: number, reducedMotion: boolean, minValue: number): number {
  if (!reducedMotion) return value
  return Math.max(minValue, Math.floor(value * 0.62))
}

export function buildRuleBloomParams(options: {
  seed: number
  width?: number
  reducedMotion?: boolean
  regime: RuleBloomRegime
}): RuleBloomParams {
  const preset = RULE_BLOOM_REGIMES[options.regime]
  const reducedMotion = options.reducedMotion ?? false

  return {
    ...DEFAULT_RULE_BLOOM_PARAMS,
    width: options.width ?? 300,
    seed: options.seed,
    initialAliveChance: preset.initialAliveChance,
    maxTopplesPerStep: scaleInt(preset.maxTopplesPerStep, reducedMotion, 128),
    decayChecksPerStep: scaleInt(preset.decayChecksPerStep, reducedMotion, 42),
    decayChance: reducedMotion ? preset.decayChance * 0.72 : preset.decayChance,
    grainsPerAliveCell: preset.grainsPerAliveCell,
    grainToRuleChance: reducedMotion ? preset.grainToRuleChance * 0.85 : preset.grainToRuleChance,
  }
}
