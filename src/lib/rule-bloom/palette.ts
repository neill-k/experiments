export type Rgb = readonly [number, number, number]

export interface RuleBloomPalette {
  background: Rgb
  text: Rgb
  ruleHot: Rgb
  ruleCold: Rgb
  grain: Rgb
  cascade: Rgb
  decay: Rgb
  trail: Rgb
}

export const DEFAULT_RULE_BLOOM_PALETTE: RuleBloomPalette = {
  background: [8, 8, 10],
  text: [235, 235, 235],
  ruleHot: [206, 120, 255],
  ruleCold: [118, 182, 255],
  grain: [218, 184, 120],
  cascade: [255, 149, 84],
  decay: [92, 205, 230],
  trail: [155, 106, 232],
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function clamp01(v: number): number {
  if (v <= 0) return 0
  if (v >= 1) return 1
  return v
}

export function mixRgb(a: Rgb, b: Rgb, t: number): [number, number, number] {
  const k = clamp01(t)
  return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)]
}
