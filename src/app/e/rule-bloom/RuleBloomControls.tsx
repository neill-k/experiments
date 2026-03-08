'use client'

import { RULE_BLOOM_REGIMES, type RuleBloomRegime } from '@/lib/rule-bloom/profiles'

type RuleBloomControlsProps = {
  regime: RuleBloomRegime
  paused: boolean
  onRegimeChange: (next: RuleBloomRegime) => void
  onTogglePause: () => void
  onStep: () => void
  onReseed: () => void
}

const REGIME_ORDER: RuleBloomRegime[] = ['calm', 'balanced', 'volatile']

export function RuleBloomControls({
  regime,
  paused,
  onRegimeChange,
  onTogglePause,
  onStep,
  onReseed,
}: RuleBloomControlsProps) {
  return (
    <div className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onTogglePause}
          title={paused ? 'Resume simulation (keyboard: P or Space)' : 'Pause simulation (keyboard: P or Space)'}
          aria-keyshortcuts="P Space"
          className="min-h-[44px] rounded-lg border border-[var(--border)] px-4 py-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[var(--fg)] transition-colors hover:bg-[var(--fg)]/8"
        >
          {paused ? 'Resume' : 'Pause'}
        </button>

        <button
          type="button"
          onClick={onStep}
          title="Step one tick (keyboard: .)"
          aria-keyshortcuts="."
          className="min-h-[44px] rounded-lg border border-[var(--border)] px-4 py-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[var(--fg)] transition-colors hover:bg-[var(--fg)]/8"
        >
          Step
        </button>

        <button
          type="button"
          onClick={onReseed}
          title="Reseed simulation (keyboard: R)"
          aria-keyshortcuts="R"
          className="min-h-[44px] rounded-lg border border-[var(--border)] px-4 py-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[var(--fg)] transition-colors hover:bg-[var(--fg)]/8"
        >
          Reseed
        </button>
      </div>

      <div className="space-y-2 rounded-lg border border-[var(--border)] p-2 sm:p-3">
        <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.12em] text-[var(--fg)]/65">
          Regime presets
        </p>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {REGIME_ORDER.map((option) => {
            const preset = RULE_BLOOM_REGIMES[option]
            const active = regime === option

            return (
              <button
                key={option}
                type="button"
                onClick={() => onRegimeChange(option)}
                aria-pressed={active}
                className={`min-h-[44px] rounded-lg border px-3 py-2 text-left transition-colors ${
                  active
                    ? 'border-[var(--fg)]/85 bg-[var(--fg)]/8 text-[var(--fg)]'
                    : 'border-[var(--border)] text-[var(--fg)]/80 hover:bg-[var(--fg)]/5'
                }`}
              >
                <div className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em]">{preset.label}</div>
                <div className="mt-1 font-[family-name:var(--font-mono)] text-[10px] leading-4 text-[var(--fg)]/60">
                  {preset.description}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.12em] text-[var(--fg)]/55">
        Keyboard, R reseed, P or Space pause, . single step
      </p>
    </div>
  )
}
