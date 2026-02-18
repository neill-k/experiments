'use client'

import { useEffect, useState } from 'react'
import { RuleBloomCanvas } from './RuleBloomCanvas'
import { RuleBloomControls } from './RuleBloomControls'
import { RuleBloomNarrative } from './RuleBloomNarrative'

function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff)
}

export function RuleBloomClient() {
  const [seed, setSeed] = useState<number>(() => randomSeed())
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()

    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return (
    <div className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6">
      <div className="flex flex-col gap-4 lg:h-[calc(100dvh-8rem)] lg:flex-row lg:gap-6">
        <section className="order-1 flex min-h-[62vh] flex-col border border-white/20 bg-[#08080a] lg:min-h-0 lg:flex-[1.35]">
          <header className="flex items-center justify-between gap-4 border-b border-white/15 px-3 py-2 sm:px-4 sm:py-3">
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-lg text-[#ebebeb] sm:text-xl">Rule Bloom</h1>
              <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-[#ebebeb]/55 sm:text-[11px]">
                Rule 30 × sandpile cascades × stochastic decay
              </p>
            </div>
            <div className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.12em] text-[#ebebeb]/65 sm:text-[11px]">
              seed {seed}
            </div>
          </header>

          <div className="min-h-0 flex-1 p-2 sm:p-3">
            <RuleBloomCanvas seed={seed} reducedMotion={reducedMotion} />
          </div>

          <div className="border-t border-white/10 p-3 sm:p-4">
            <RuleBloomControls onReseed={() => setSeed(randomSeed())} />
          </div>
        </section>

        <div className="order-2 lg:w-[min(520px,36vw)] lg:min-w-[360px]">
          <RuleBloomNarrative reducedMotion={reducedMotion} />
        </div>
      </div>
    </div>
  )
}
