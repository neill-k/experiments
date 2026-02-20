import type { LawSet } from './types'

export const BASE_LAW_SET: LawSet = {
  version: 1,
  sourcePower: 16,
  attenuationPerStep: 1,
  sinkThreshold: 3,
  tickBudget: 24,
  maxActiveCells: 28,
  bleedLoss: 0,
}

export function clampLawSet(input: LawSet): LawSet {
  return {
    version: Math.max(1, Math.trunc(input.version)),
    sourcePower: Math.max(8, Math.min(32, Math.trunc(input.sourcePower))),
    attenuationPerStep: Math.max(0, Math.min(4, Math.trunc(input.attenuationPerStep))),
    sinkThreshold: Math.max(1, Math.min(10, Math.trunc(input.sinkThreshold))),
    tickBudget: Math.max(8, Math.min(60, Math.trunc(input.tickBudget))),
    maxActiveCells: Math.max(8, Math.min(60, Math.trunc(input.maxActiveCells))),
    bleedLoss: Math.max(0, Math.min(3, Math.trunc(input.bleedLoss))),
  }
}

export function isValidLawSet(laws: LawSet): boolean {
  const clamped = clampLawSet(laws)
  if (clamped.sourcePower <= clamped.sinkThreshold) return false
  if (clamped.maxActiveCells < 8) return false
  return (
    clamped.version === laws.version &&
    clamped.sourcePower === laws.sourcePower &&
    clamped.attenuationPerStep === laws.attenuationPerStep &&
    clamped.sinkThreshold === laws.sinkThreshold &&
    clamped.tickBudget === laws.tickBudget &&
    clamped.maxActiveCells === laws.maxActiveCells &&
    clamped.bleedLoss === laws.bleedLoss
  )
}

export function describeLawSet(laws: LawSet): string[] {
  return [
    `Attenuation ${laws.attenuationPerStep} per hop`,
    `Sink threshold ${laws.sinkThreshold}`,
    `Tick budget ${laws.tickBudget}`,
    `Active cell cap ${laws.maxActiveCells}`,
    laws.bleedLoss > 0 ? `Branch bleed ${laws.bleedLoss}` : 'Branch bleed disabled',
  ]
}

export function serializeLawSet(laws: LawSet): string {
  return JSON.stringify(laws)
}

export function parseLawSet(raw: string): LawSet | null {
  try {
    const parsed = JSON.parse(raw) as Partial<LawSet>
    if (typeof parsed !== 'object' || parsed === null) return null

    const candidate: LawSet = clampLawSet({
      version: parsed.version ?? BASE_LAW_SET.version,
      sourcePower: parsed.sourcePower ?? BASE_LAW_SET.sourcePower,
      attenuationPerStep: parsed.attenuationPerStep ?? BASE_LAW_SET.attenuationPerStep,
      sinkThreshold: parsed.sinkThreshold ?? BASE_LAW_SET.sinkThreshold,
      tickBudget: parsed.tickBudget ?? BASE_LAW_SET.tickBudget,
      maxActiveCells: parsed.maxActiveCells ?? BASE_LAW_SET.maxActiveCells,
      bleedLoss: parsed.bleedLoss ?? BASE_LAW_SET.bleedLoss,
    })

    return candidate
  } catch {
    return null
  }
}
