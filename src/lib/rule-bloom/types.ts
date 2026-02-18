export interface RuleBloomParams {
  width: number;
  seed: number;
  /** Initial probability (0..1) a cell is alive in the Rule 30 lane. */
  initialAliveChance: number;
  /** Initial integer grains per cell upper bound (inclusive random range 0..max). */
  initialGrainMax: number;
  /** Critical grains needed to topple (classic sandpile often uses 4). */
  toppleThreshold: number;
  /** Max topples processed per simulation step. */
  maxTopplesPerStep: number;
  /** How many random cells to test for decay per step. */
  decayChecksPerStep: number;
  /** Probability (0..1) a tested cell loses one grain. */
  decayChance: number;
  /** Grains injected into each alive Rule 30 cell each step. */
  grainsPerAliveCell: number;
  /** Grain level at/above which a cell can force Rule lane alive. */
  grainToRuleThreshold: number;
  /** Probability (0..1) that high grain forces Rule lane alive. */
  grainToRuleChance: number;
}

export interface RuleBloomState {
  readonly width: number;
  tick: number;
  rngState: number;
  /** Rule 30 lane for current tick (0/1). */
  rule: Uint8Array;
  /** Scratch buffer for next Rule 30 lane. */
  nextRule: Uint8Array;
  /** Sandpile grains per cell. */
  grains: Uint16Array;
  /** Rolling cursor used for bounded sandpile scans. */
  scanCursor: number;
}

export interface RuleBloomStepStats {
  tick: number;
  aliveCount: number;
  topples: number;
  decayApplied: number;
  grainsAddedFromRule: number;
}

export interface RuleBloomStepResult {
  state: RuleBloomState;
  stats: RuleBloomStepStats;
}

export interface RuleBloomSnapshot {
  tick: number;
  width: number;
  rule: Uint8Array;
  grains: Uint16Array;
}

export interface RuleBloomEngine {
  readonly params: RuleBloomParams;
  readonly state: RuleBloomState;
  step(): RuleBloomStepResult;
  stepMany(steps: number): RuleBloomStepResult;
  reset(seed?: number): RuleBloomState;
  snapshot(): RuleBloomSnapshot;
}
