interface RuleBloomNarrativeProps {
  reducedMotion?: boolean
}

export function RuleBloomNarrative({ reducedMotion = false }: RuleBloomNarrativeProps) {
  return (
    <aside className="border border-white/15 bg-[#08080a] p-4 sm:p-5 lg:p-6">
      <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg tracking-wide text-[#ebebeb]">
        Rule Bloom
      </h2>

      <div className="space-y-4 font-[family-name:var(--font-mono)] text-xs leading-6 text-[#ebebeb]/85 sm:text-[13px]">
        <section className="border border-white/10 p-3 sm:p-4">
          <h3 className="mb-2 text-[11px] uppercase tracking-[0.16em] text-[#ebebeb]">Rule 30</h3>
          <p>
            The left side starts with a tiny seed and grows by a strict local rule. Rule 30 looks simple in code,
            but it blooms into asymmetric turbulence: a crisp edge on one side, noisy fire on the other. It is a
            reminder that deterministic systems can still feel wild.
          </p>
        </section>

        <section className="border border-white/10 p-3 sm:p-4">
          <h3 className="mb-2 text-[11px] uppercase tracking-[0.16em] text-[#ebebeb]">Sandpile Cascades</h3>
          <p>
            On the right, grains accumulate until a threshold snaps and redistributes mass. Most topples are tiny,
            but occasionally one disturbance fans out into a visible cascade. This is classic criticality: a system
            balancing itself at the edge where small pushes can trigger large responses.
          </p>
        </section>

        <section className="border border-white/10 p-3 sm:p-4">
          <h3 className="mb-2 text-[11px] uppercase tracking-[0.16em] text-[#ebebeb]">Decay Clocks</h3>
          <p>
            Every mark carries a fade timer. Decay clocks keep memory short and motion legible: old traces dim,
            fresh interactions stay bright. The result is a living ledger of cause and effect, always erasing just
            enough to make room for the next burst.
          </p>
        </section>

        {reducedMotion && (
          <section className="border border-white/10 p-3 sm:p-4 text-[#ebebeb]/70">
            Reduced-motion mode is active: update rates and cascade intensity are lowered to keep motion gentler.
          </section>
        )}
      </div>
    </aside>
  )
}
