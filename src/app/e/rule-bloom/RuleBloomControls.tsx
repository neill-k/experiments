'use client'

type RuleBloomControlsProps = {
  onReseed: () => void
}

export function RuleBloomControls({ onReseed }: RuleBloomControlsProps) {
  return (
    <div className="flex items-center justify-between gap-3 border border-white/20 bg-[#08080a] p-3">
      <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.12em] text-[#ebebeb]/60">
        Passive mode · reseed to perturb
      </p>
      <button
        type="button"
        onClick={onReseed}
        className="min-h-[44px] border border-white/30 px-4 py-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[#ebebeb] transition-colors hover:bg-white/10"
      >
        Reseed
      </button>
    </div>
  )
}
