import { normalizeSeed, randomInt, nextRandom } from "./rng";
import type { RuleBloomParams, RuleBloomState } from "./types";

export function createRuleBloomState(params: RuleBloomParams, seedOverride?: number): RuleBloomState {
  const width = params.width;
  const rule = new Uint8Array(width);
  const nextRule = new Uint8Array(width);
  const grains = new Uint16Array(width);

  let rngState = normalizeSeed(seedOverride ?? params.seed);

  for (let i = 0; i < width; i += 1) {
    const aliveRoll = nextRandom(rngState);
    rngState = aliveRoll.state;
    rule[i] = aliveRoll.value < params.initialAliveChance ? 1 : 0;

    if (params.initialGrainMax > 0) {
      const grainRoll = randomInt(rngState, params.initialGrainMax + 1);
      rngState = grainRoll.state;
      grains[i] = grainRoll.value;
    }
  }

  if (rule.every((v) => v === 0)) {
    rule[Math.floor(width / 2)] = 1;
  }

  return {
    width,
    tick: 0,
    rngState,
    rule,
    nextRule,
    grains,
    scanCursor: 0,
  };
}
