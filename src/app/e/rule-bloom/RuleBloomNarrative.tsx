import { RULE_BLOOM_REGIMES, type RuleBloomRegime } from '@/lib/rule-bloom/profiles'
import type { RuleBloomHudState } from './RuleBloomCanvas'

interface RuleBloomNarrativeProps {
  reducedMotion?: boolean
  paused: boolean
  regime: RuleBloomRegime
  hud: RuleBloomHudState
}

function describeLoad(hud: RuleBloomHudState): string {
  const pressure = hud.topples + hud.decay + hud.injected
  if (pressure > 180) return 'High activity, cascades are dominating this window.'
  if (pressure > 90) return 'Moderate activity, coupled systems are exchanging energy steadily.'
  if (pressure > 30) return 'Low activity, drift is visible but contained.'
  return 'Quiet phase, the board is accumulating tension before the next burst.'
}

export function RuleBloomNarrative({ reducedMotion = false, paused, regime, hud }: RuleBloomNarrativeProps) {
  const preset = RULE_BLOOM_REGIMES[regime]

  return (
    <aside className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 sm:p-5 lg:p-6">
      <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg tracking-wide text-[var(--fg)]">Rule Bloom</h2>

      <div className="space-y-4 font-[family-name:var(--font-mono)] text-xs leading-6 text-[var(--fg)]/85 sm:text-[13px]">
        <section className="rounded-lg border border-[var(--border)] p-3 sm:p-4">
          <h3 className="mb-2 text-[11px] uppercase tracking-[0.16em] text-[var(--fg)]">Live Readout</h3>
          <p>
            State, {paused ? 'paused' : 'running'}. Regime, {preset.label}. Tick, {hud.tick}. {describeLoad(hud)}
          </p>
        </section>

        <section className="rounded-lg border border-[var(--border)] p-3 sm:p-4">
          <h3 className="mb-2 text-[11px] uppercase tracking-[0.16em] text-[var(--fg)]">Rule 30 Coupling</h3>
          <p>
            Rule 30 drives asymmetric turbulence from strict local updates. In Rule Bloom, each alive bit injects grain
            mass into the sandpile lane, so deterministic binary texture becomes material pressure.
          </p>
        </section>

        <section className="rounded-lg border border-[var(--border)] p-3 sm:p-4">
          <h3 className="mb-2 text-[11px] uppercase tracking-[0.16em] text-[var(--fg)]">Sandpile Cascades</h3>
          <p>
            Grain levels accumulate until thresholds snap into redistributions. Most events are tiny, but occasional
            chain reactions push energy across the board and feed back into the rule lane through high-grain forcing.
          </p>
        </section>

        <section className="rounded-lg border border-[var(--border)] p-3 sm:p-4">
          <h3 className="mb-2 text-[11px] uppercase tracking-[0.16em] text-[var(--fg)]">Decay Clocks</h3>
          <p>
            Stochastic decay trims old buildup so traces do not saturate forever. This keeps temporal contrast legible,
            fresh perturbations stay bright while old structures fade and re-open space.
          </p>
        </section>

        {reducedMotion && (
          <section className="rounded-lg border border-[var(--border)] p-3 sm:p-4 text-[var(--fg)]/70">
            Reduced-motion mode is active. Update cadence and perturbation rates are lowered for a gentler motion
            envelope.
          </section>
        )}
      </div>
    </aside>
  )
}
