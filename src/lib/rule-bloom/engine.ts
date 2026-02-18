import { createRuleBloomState } from "./init";
import { normalizeRuleBloomParams } from "./params";
import {
  applyRule30Coupled,
  applyStochasticDecay,
  injectGrainsFromRule,
  toppleSandpileBounded,
} from "./rules";
import type {
  RuleBloomEngine,
  RuleBloomParams,
  RuleBloomSnapshot,
  RuleBloomState,
  RuleBloomStepResult,
} from "./types";

export function stepRuleBloom(state: RuleBloomState, params: RuleBloomParams): RuleBloomStepResult {
  const aliveCount = applyRule30Coupled(state, params);
  const grainsAddedFromRule = injectGrainsFromRule(state, params);
  const topples = toppleSandpileBounded(state, params);
  const decayApplied = applyStochasticDecay(state, params);

  state.tick += 1;

  return {
    state,
    stats: {
      tick: state.tick,
      aliveCount,
      topples,
      decayApplied,
      grainsAddedFromRule,
    },
  };
}

export function snapshotRuleBloom(state: RuleBloomState): RuleBloomSnapshot {
  return {
    tick: state.tick,
    width: state.width,
    rule: state.rule.slice(),
    grains: state.grains.slice(),
  };
}

export function createRuleBloomEngine(inputParams?: Partial<RuleBloomParams>): RuleBloomEngine {
  const params = normalizeRuleBloomParams(inputParams);
  let state = createRuleBloomState(params);

  return {
    params,
    get state() {
      return state;
    },
    step() {
      return stepRuleBloom(state, params);
    },
    stepMany(steps: number) {
      const count = Math.max(0, Math.trunc(steps));
      let result = stepRuleBloom(state, params);
      for (let i = 1; i < count; i += 1) {
        result = stepRuleBloom(state, params);
      }
      if (count === 0) {
        return {
          state,
          stats: {
            tick: state.tick,
            aliveCount: 0,
            topples: 0,
            decayApplied: 0,
            grainsAddedFromRule: 0,
          },
        };
      }
      return result;
    },
    reset(seed?: number) {
      state = createRuleBloomState(params, seed);
      return state;
    },
    snapshot() {
      return snapshotRuleBloom(state);
    },
  };
}

export type {
  RuleBloomEngine,
  RuleBloomParams,
  RuleBloomSnapshot,
  RuleBloomState,
  RuleBloomStepResult,
} from "./types";
export { DEFAULT_RULE_BLOOM_PARAMS, normalizeRuleBloomParams } from "./params";
