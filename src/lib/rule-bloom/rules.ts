import { nextRandom, randomInt } from "./rng";
import type { RuleBloomParams, RuleBloomState } from "./types";

const U16_MAX = 0xffff;

function wrapIndex(i: number, width: number): number {
  if (i < 0) return width - 1;
  if (i >= width) return 0;
  return i;
}

function addSaturating(value: number, delta: number): number {
  const sum = value + delta;
  return sum > U16_MAX ? U16_MAX : sum;
}

function subFloor(value: number, delta: number): number {
  const next = value - delta;
  return next < 0 ? 0 : next;
}

export function applyRule30Coupled(state: RuleBloomState, params: RuleBloomParams): number {
  const { width, rule, nextRule, grains } = state;
  let aliveCount = 0;

  for (let i = 0; i < width; i += 1) {
    const left = rule[wrapIndex(i - 1, width)];
    const center = rule[i];
    const right = rule[wrapIndex(i + 1, width)];

    // Rule 30 mapping via bit expression.
    let next = (left ^ (center | right)) & 1;

    if (grains[i] >= params.grainToRuleThreshold) {
      const roll = nextRandom(state.rngState);
      state.rngState = roll.state;
      if (roll.value < params.grainToRuleChance) {
        next = 1;
      }
    }

    nextRule[i] = next;
    aliveCount += next;
  }

  rule.set(nextRule);
  return aliveCount;
}

export function injectGrainsFromRule(state: RuleBloomState, params: RuleBloomParams): number {
  if (params.grainsPerAliveCell <= 0) return 0;
  const { width, rule, grains } = state;
  let added = 0;
  for (let i = 0; i < width; i += 1) {
    if (rule[i] === 1) {
      const before = grains[i];
      const after = addSaturating(before, params.grainsPerAliveCell);
      grains[i] = after;
      added += after - before;
    }
  }
  return added;
}

export function toppleSandpileBounded(state: RuleBloomState, params: RuleBloomParams): number {
  const { width, grains } = state;
  const threshold = params.toppleThreshold;
  const maxTopples = params.maxTopplesPerStep;

  let cursor = state.scanCursor;
  let topples = 0;

  if (maxTopples <= 0) {
    return 0;
  }

  // Bounded scan: at most width * 2 probes per step to prevent runaway CPU.
  let probes = 0;
  const maxProbes = width * 2;

  while (topples < maxTopples && probes < maxProbes) {
    const i = cursor;
    const g = grains[i];

    if (g >= threshold) {
      grains[i] = subFloor(g, 4);
      const left = wrapIndex(i - 1, width);
      const right = wrapIndex(i + 1, width);
      grains[left] = addSaturating(grains[left], 1);
      grains[right] = addSaturating(grains[right], 1);
      topples += 1;
    }

    cursor += 1;
    if (cursor >= width) cursor = 0;
    probes += 1;
  }

  state.scanCursor = cursor;
  return topples;
}

export function applyStochasticDecay(state: RuleBloomState, params: RuleBloomParams): number {
  const checks = params.decayChecksPerStep;
  if (checks <= 0 || params.decayChance <= 0) return 0;

  let decayed = 0;
  const { grains, width } = state;

  for (let c = 0; c < checks; c += 1) {
    const pick = randomInt(state.rngState, width);
    state.rngState = pick.state;

    const i = pick.value;
    if (grains[i] === 0) continue;

    const roll = nextRandom(state.rngState);
    state.rngState = roll.state;
    if (roll.value < params.decayChance) {
      grains[i] -= 1;
      decayed += 1;
    }
  }

  return decayed;
}
