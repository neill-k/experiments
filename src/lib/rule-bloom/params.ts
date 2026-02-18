import type { RuleBloomParams } from "./types";

export const DEFAULT_RULE_BLOOM_PARAMS: RuleBloomParams = {
  width: 256,
  seed: 42,
  initialAliveChance: 0.08,
  initialGrainMax: 2,
  toppleThreshold: 4,
  maxTopplesPerStep: 4096,
  decayChecksPerStep: 512,
  decayChance: 0.02,
  grainsPerAliveCell: 1,
  grainToRuleThreshold: 6,
  grainToRuleChance: 0.15,
};

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  const i = Math.trunc(value);
  if (i < min) return min;
  if (i > max) return max;
  return i;
}

function clampFloat(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function normalizeRuleBloomParams(input?: Partial<RuleBloomParams>): RuleBloomParams {
  const p = { ...DEFAULT_RULE_BLOOM_PARAMS, ...(input ?? {}) };
  const width = clampInt(p.width, 8, 16384);

  return {
    width,
    seed: clampInt(p.seed, 0, 0xffffffff),
    initialAliveChance: clampFloat(p.initialAliveChance, 0, 1),
    initialGrainMax: clampInt(p.initialGrainMax, 0, 65535),
    toppleThreshold: clampInt(p.toppleThreshold, 2, 64),
    maxTopplesPerStep: clampInt(p.maxTopplesPerStep, 0, width * 64),
    decayChecksPerStep: clampInt(p.decayChecksPerStep, 0, width * 16),
    decayChance: clampFloat(p.decayChance, 0, 1),
    grainsPerAliveCell: clampInt(p.grainsPerAliveCell, 0, 255),
    grainToRuleThreshold: clampInt(p.grainToRuleThreshold, 0, 65535),
    grainToRuleChance: clampFloat(p.grainToRuleChance, 0, 1),
  };
}
