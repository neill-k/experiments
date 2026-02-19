import type { Metadata } from 'next'
import { Comments } from '@/components/comments/Comments'
import { ExperimentNav } from '@/components/ExperimentNav'
import { RuleBloomClient } from './RuleBloomClient'

export const metadata: Metadata = {
  title: 'Rule Bloom',
  description:
    'A passive dark simulation coupling Rule 30 turbulence, sandpile cascades, and stochastic decay clocks.',
}

export default function RuleBloomPage() {
  return (
    <main className="min-h-dvh bg-[#08080a] text-[#ebebeb]">
      <RuleBloomClient />

      <div className="mx-auto w-full max-w-[1600px] px-3 pb-8 sm:px-4 lg:px-6">
        <div className="border-t border-white/10 pt-6">
          <Comments slug="rule-bloom" />
        </div>
      </div>

      <ExperimentNav />
    </main>
  )
}
