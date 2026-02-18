const UINT32_MAX = 0xffffffff;

export function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) {
    return 0x9e3779b9;
  }
  const s = Math.trunc(seed) >>> 0;
  return s === 0 ? 0x6d2b79f5 : s;
}

/**
 * xorshift32: tiny deterministic PRNG suitable for visual simulation.
 * Returns next state + float in [0, 1).
 */
export function nextRandom(state: number): { state: number; value: number } {
  let x = normalizeSeed(state);
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  x >>>= 0;
  const value = x / (UINT32_MAX + 1);
  return { state: x, value };
}

export function randomInt(state: number, maxExclusive: number): { state: number; value: number } {
  const safeMax = Math.max(1, Math.trunc(maxExclusive));
  const next = nextRandom(state);
  return {
    state: next.state,
    value: Math.floor(next.value * safeMax),
  };
}
